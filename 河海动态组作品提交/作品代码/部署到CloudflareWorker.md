# 把「真 AI 生图 + 真新闻抓取」搬到线上（Cloudflare Worker）

> 目标：GitHub Pages 上的版本，也能真的用豆包生成蓝图、真的抓人民日报。
> 做法：把本地 `server/proxy.mjs` 的两个接口搬到一个 Cloudflare Worker 上。
> 成本：**免费**（Workers 免费额度每天 10 万次请求，够用到天荒地老）。
> 时间：**约 10 分钟**。

---

## 一、它解决什么问题

GitHub Pages 只能放静态文件，跑不了 Node。所以线上版本：

- 豆包 AI 生图 → 前端拿不到 Key → 降级成程序化蓝图
- 人民日报抓取 → 被 CORS 拦 → 降级成内置文案

Worker 补的正是这两块。它已经写好了：`worker/index.js` + `worker/wrangler.toml`。

---

## 二、部署（命令行，5 步）

在**项目根目录**打开 PowerShell：

```powershell
cd worker

# 1) 安装 wrangler（只需一次）
npm i -g wrangler

# 2) 登录（会打开浏览器，授权你的 Cloudflare 账号；没有账号就现注册，免费）
wrangler login

# 3) 把豆包 Key 写成 Worker 的 Secret —— 注意：这样它不会出现在任何代码文件里
wrangler secret put DOUBAO_API_KEY
#   ↑ 回车后粘贴你的 ark- 开头的 Key，回车结束

# 4) 部署
wrangler deploy
#   输出类似：Published hhu111-api  →  https://hhu111-api.你的子域.workers.dev

# 5) 验证（把 URL 换成你上一步得到的）
curl https://hhu111-api.你的子域.workers.dev/api/health
#   应返回 {"ok":true,"runtime":"cloudflare-worker","doubaoKey":"ark-044a…b126",...}
```

> `wrangler` 需要 Node.js（你机器上已经有）。第一次 `wrangler login` 会弹浏览器，授权即可。

---

## 三、接上你的网页（2 步）

### 1. 填地址

打开 `js/config.js`，把 Worker 的地址填进 `apiBase`：

```js
apiBase: "https://hhu111-api.你的子域.workers.dev",
```

留空 = 用同源 `/api/*`（也就是本地 `启动.bat` 那种）；填了 = 用这个远程地址。

### 2. 重新打包 + 推送

```powershell
.\打包网页版.ps1          # 重新生成 网页版/
# 把 网页版/ 里变化过的文件覆盖到 GitHub 仓库，然后
git add -A; git commit -m "接入 Worker 接口"; git push
```

1 分钟后打开线上地址，点 Blueprints 页的「生成蓝图」—— 现在走的是真 AI。

> ⚠️ `打包网页版.ps1` 会清空 `doubao.apiKey`（这是对的，线上用 Worker 的 Secret），
> 但**不会动** `apiBase`，所以重新打包不会把地址弄丢。

---

## 四、（可选，更省事）连网站一起托管在 Worker 上

如果你不想维护 GitHub Pages + Worker 两个地方，可以让 Worker 顺带把整个网站也托管了 ——
这样**同域**，连 CORS 都不用管，`apiBase` 还能留空。

```toml
# worker/wrangler.toml 末尾，取消注释
[assets]
directory = "../网页版"
binding = "ASSETS"
```

```powershell
cd worker
wrangler deploy
# 然后直接访问：https://hhu111-api.你的子域.workers.dev/index.html
```

> 记得先在本项目根目录跑一次 `.\打包网页版.ps1`，否则 `../网页版` 不存在会报错。

---

## 五、免费额度够不够

| 项 | 免费额度 | 你大概会用多少 |
|---|---|---|
| 请求数 | 100,000 次/天 | 一天几百次 |
| CPU 时间 | 10 ms/请求 | 我们只是转发 `fetch`，几乎不耗 CPU |
| 出站请求 | 不限 | 生图一次 1 个、抓新闻一次 1~2 个 |

**够用。** 唯一要注意的是：豆包本身是按张计费的（走你自己的火山额度）。

---

## 六、常见问题

| 现象 | 原因 | 解决 |
|---|---|---|
| `api/health` 返回 `doubaoKey: "(未配置)"` | 没设 Secret | `wrangler secret put DOUBAO_API_KEY` |
| 生图返回 `SetLimitExceeded` | 火山账号「安全体验模式」额度用尽 | 火山控制台 → 方舟 → 开通管理 → 关闭/调高限制 |
| 生图返回 `ModelNotOpen` | 该模型没在方舟开通 | 方舟控制台「开通管理」里开通 `Seedream 5.0` |
| 生图返回 `NETWORK` | Worker 出站被拦或上游超时 | 生图较慢（10~30 秒），重试一次；或换 `Seedream 5.0 Pro` |
| 网页还是降级状态 | `apiBase` 没填 / 打包后没推送 | 检查 `js/config.js` 里的 `apiBase`，重新打包推送 |
| 浏览器控制台 CORS 报错 | Worker 没返回 CORS 头 | 本文件里的 Worker 已带 CORS；确认你部署的是这个 `worker/index.js` |
| `wrangler deploy` 报 `directory not found` | 启用了 `[assets]` 但没打包 | 先在根目录跑 `.\打包网页版.ps1` |

---

## 七、安全底线（重要）

1. **Key 只放在 Worker Secret 里**（`wrangler secret put`），永远不要写回 `js/config.js` 再提交。
2. 如果哪天不小心提交了 Key：**立刻去火山控制台删掉/轮换那个 Key**，Git 历史里删不干净。
3. Worker 的 `/api/relay` 有**域名白名单**（人民日报 / 纽约时报 / Science），不会被别人拿去当免费代理。
4. 想再加一层保险，可以在 Cloudflare 控制台给 Worker 加 **Rate limiting** 规则（免费版支持简单限流）。

---

## 八、本地怎么测这套代码（不用真的部署）

在项目根目录执行：

```powershell
node tools\test-worker.mjs
```

它会把 `worker/index.js` 直接当 Node 模块跑一遍（Node 18+ 自带 `Request`/`Response`/`fetch`），
检查：`/api/health`、`/api/relay`（真抓人民日报）、`/api/image`（真调豆包）、白名单拦截、CORS 头。
这样**部署前就能确认逻辑没问题**。

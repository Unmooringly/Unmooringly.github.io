# 部署到 GitHub Pages（以及"托管之后还能不能改"）

> **一句话：能改，而且随时改。** GitHub Pages 只是"读你这个仓库里的文件"，你 push 一次它就重新发布一次，网址不变、历史版本可回溯。

---

## 一、托管之后怎么改（三种都行，推荐第 1 种）

### 1. 本地改 → push（最常用）

```bash
git add -A
git commit -m "改了什么"
git push
```

push 完等 **30 秒 ~ 1 分钟**，刷新网页就是新版。不需要删仓库、不需要重建 Pages、URL 永远不变。

### 2. 直接在 GitHub 网页上改

仓库里点开文件 → 右上角铅笔 ✏️ → 改 → `Commit changes`。
小改动（改一句文案、换个链接）用这个最快，会自动触发重新发布。

### 3. GitHub Desktop / VS Code

VS Code 装了 Git 后：改完 → 源代码管理面板 → 输入提交信息 → `Commit` → `Sync/Push`。效果同第 1 种。

### 几个"改了不生效"的常见原因

| 现象 | 原因 | 解决 |
|---|---|---|
| 刷新还是旧版 | 浏览器/CDN 缓存 | `Ctrl+F5` 强刷；或等 1 分钟；Pages 有约 10 分钟的边缘缓存 |
| 404 | 改完还没构建完 | 仓库 → **Actions** 标签看构建状态 |
| 图片裂了 | 文件名大小写/中文不对 | 本项目已全部 `encodeURI`；注意**大小写必须与仓库里一致**（Linux 服务器区分大小写） |
| 页面白屏 | 控制台看报错 | 一般是某个 `.js` 没上传全，检查 `js/` 目录文件数应为 14 个 |

---

## 二、Hosting 前必做：打包一份"网页版"

**不能整个项目原样上传**，原因有两个：

1. **体积**：`终稿图库`（80 MB）+ 三个原始 mp4（85 MB）根本不参与网页运行（代码只读 `素材/`），传上去白白拖慢 clone 和构建，GitHub 单仓库还建议 < 1 GB。
2. **密钥泄露**：`js/config.js` 里有豆包 API Key。GitHub Pages 是**公开静态托管**，任何人都能查看源码 —— 必须在打包时清空。

**做法**：项目根目录右键运行 `打包网页版.ps1`（或 `pwsh -File .\打包网页版.ps1`），它会：

- 复制 `index.html` / `css/` / `js/` / `素材/` 到 `网页版/`
- **自动把 `js/config.js` 里的 `apiKey` 清空**
- 输出体积报告（约 **17 MB**）

然后把这个 `网页版/` **里面的内容**（不是文件夹本身）传到仓库根目录。

---

## 三、GitHub Pages 部署步骤（5 步）

1. GitHub 新建仓库，**Public**（Pages 免费版不支持私有仓库）
2. 上传 `网页版/` 里的全部内容（网页版上传，或 `git push`）
3. 仓库 **Settings → Pages**
4. **Source** 选 `Deploy from a branch`；**Branch** 选 `main` + `/ (root)`；`Save`
5. 等 30~60 秒，访问 `https://<你的用户名>.github.io/<仓库名>/`

> 如果想让网址直接是 `https://<用户名>.github.io/`，把仓库名起成 `<用户名>.github.io` 即可。

---

## 四、托管后哪些功能会变、哪些不变

| 功能 | 本地 `启动.bat` | GitHub Pages |
|---|---|---|
| 12 个页面 / 全部动画 / 交互 | ✅ | ✅ 完全一样 |
| 三段校区视频背景 | ✅ | ✅ |
| 实时天气（open-meteo） | ✅ | ✅ |
| 纽约时报 / Science 抓取 | ✅ | 部分可用（这两个站允许跨域，能直连就直连） |
| **人民日报**抓取 | ✅（经 `/api/relay`） | ⚠️ 会被 CORS 拦 → 自动降级为内置文案 |
| **豆包 AI 生图** | ✅（经 `/api/image`，Key 在服务端） | ⚠️ 前端拿不到 Key → 自动降级为程序化生成蓝图 |

**为什么？** GitHub Pages 只能放**静态文件**，跑不了 Node 服务器，所以 `server/proxy.mjs` 那两个接口在 Pages 上不存在。

**这一点我已经做好了兜底**：`js/config.js` 末尾有运行时探测 ——
`file://`、`*.github.io`、`*.pages.dev`、`*.netlify.app`、`*.vercel.app` 等域名会**直接关掉代理**，
其它情况则探一次 `/api/health`，1.5 秒没回应也关掉。
所以你托管上去**不会出现一串 404，也不会卡 5 秒超时**，只会安静地走降级方案。

---

## 五、线上也要"真 AI 生图 + 真新闻"——Cloudflare Worker 版**已经写好了**

不用你自己动手，`worker/` 里已经是一个可直接部署的 Cloudflare Worker：

```
worker/
├── index.js         /api/health + /api/image + /api/relay（与本地 proxy.mjs 完全一致）
├── wrangler.toml    name / main / [vars]，含可选 [assets] 同域托管
└── package.json     只是让 Node 能直接跑它做本地验证
```

**部署只要 4 条命令**（免费额度够用到天荒地老）：

```powershell
cd worker
npm i -g wrangler
wrangler login
wrangler secret put DOUBAO_API_KEY     # 粘贴 ark- 开头的 Key（不会进代码库）
wrangler deploy                        # 得到 https://xxx.workers.dev
```

然后把地址填进 `js/config.js`：

```js
apiBase: "https://xxx.workers.dev",
```

重新打包推送到 GitHub，线上就同时有真 AI 生图和真新闻了。
（`打包网页版.ps1` 只会清空 `apiKey`，**不会动 `apiBase`**，所以这个地址能长期留着。）

详细步骤、"连网站一起托管"、免费额度、排错表：
👉 **[`部署到CloudflareWorker.md`](部署到CloudflareWorker.md)**

> 我已经用本机模拟"静态站点(8123) + 远程 Worker(8787)"这套真实拓扑跑通了：
> 跨域拿到**当天真实的人民日报头条**，生图请求也确实打到了 Worker → 火山方舟。
> 目前唯一没出图的原因是火山账号「安全体验模式」额度用尽（见下）。

---

## 六、必须记住的安全底线

1. **API Key 永远不要提交到公开仓库**（打包脚本已自动清空；自己手动上传时也务必检查 `js/config.js`）。
2. 如果不小心提交了：**立刻去火山引擎控制台把这个 Key 删掉/轮换**，因为 Git 历史里永久留痕，删掉文件也没用。
3. 用 `.gitignore` 挡住不该进仓库的大目录：

```gitignore
网页版/
server/
启动.bat
*.ps1
终稿图库/
终稿文本库/
*.mp4
```

---

## 七、你的更新日常（结论）

```
改本地文件 → 重跑 打包网页版.ps1 → 把变化的文件覆盖到仓库 → commit & push → 1 分钟后线上生效
```

只改文案/样式时其实可以更省事：在 GitHub 网页上直接编辑 `js/data.js`（所有文本都在里面）或 `css/style.css`，提交即可。

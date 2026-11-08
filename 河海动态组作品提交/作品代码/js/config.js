/* ============================================================
 * 后端与第三方接口配置
 *
 * ★ 重要：这个文件会被浏览器直接加载，**不要放任何真正的密钥**！
 *   · 本地演示：Key 放在这里即可，`启动.bat` 的服务器会读它、也只在这里用
 *   · 上传到 GitHub Pages：静态托管**不能**跑 Node，请把下面的
 *     `doubao.apiKey` 清空（`打包网页版.ps1` 会自动帮你清空）
 *   · 线上想真生图：部署 worker/ 里的 Cloudflare Worker，
 *     把地址填到下面的 `apiBase`，Key 放 Worker 的 Secret 里
 * ============================================================ */
window.CONFIG = {
  /* ---------- 接口地址 ----------
   * ""            → 用同源 /api/*（本地 `启动.bat`，或 Worker 同域托管了整站）
   * "https://…"   → 用远程接口（Cloudflare Worker 等，GitHub Pages 用这个）
   * 这个值**打包时不会被清空**，可以放心留着。 */
  apiBase: "",

  /* ---------- 下面两个由程序自动推导，通常不用手改 ----------
   * 运行时会根据 apiBase 拼成：
   *   relayUrl      = apiBase + "/api/relay"    抓取中继（绕开 CORS）
   *   imageProxyUrl = apiBase + "/api/image"    生图代理（Key 只在服务端）
   * 探测不到接口时会自动清空 → 页面走纯静态降级。 */
  relayUrl: "/api/relay",
  imageProxyUrl: "/api/image",

  /* ---------- 实时新闻抓取后端（可选，自定义 JSON 接口）---------- */
  newsBackendUrl: "",

  /* ---------- 豆包 AI（生图）----------
   * 火山引擎方舟 / 豆包（图像生成）。账号需先在方舟控制台「开通管理」开通对应模型：
   *   https://console.volcengine.com/ark
   * 模型任选：doubao-seedream-5-0-flash-260915（快速）/ doubao-seedream-5-0-pro-260628（专业）
   * ⚠ 部署到公网前务必清空 apiKey，改由后端 / Worker Secret 持有。 */
  doubao: {
    apiKey: "ark-044afaee-96bb-4e43-bdc3-55d7f5bf3b16-6b126",
    endpoint: "https://ark.cn-beijing.volces.com/api/v3/images/generations",
    model: "doubao-seedream-5-0-flash-260915",
  },

  /* ---------- 即梦 AI（生图）---------- */
  jimeng: {
    apiKey: "",
    endpoint: "",
  },

  /* ---------- 后端统计 / 登录 ----------
   * 留空则用浏览器 localStorage 本地统计（演示可用）。 */
  statsApiBase: "",
};

/* ============================================================
 * 运行时探测：当前站点到底有没有可用的 /api/* 接口？
 *  · file:// 打开                    → 没有，直接关掉
 *  · 没填 apiBase 且托管在静态站点   → 按域名直接关掉（GitHub Pages 跑不了 Node）
 *  · 其它（本地服务器 / 远程 Worker）→ 先假定可用，再探一次 /api/health；
 *                                      2.5 秒内没答复就关掉
 * 结论：同一份代码，本地有服务器就用真接口、线上有 Worker 也用真接口，
 *       两者都没有就安静地降级 —— 不会 404 刷屏，也不会卡超时。
 * ============================================================ */
(function () {
  const C = window.CONFIG;
  if (!C) return;

  const base = String(C.apiBase || "").replace(/\/+$/, "");
  const host = location.hostname || "";
  const STATIC_HOST = /\.github\.io$|\.pages\.dev$|\.netlify\.app$|\.vercel\.app$|\.gitee\.io$|\.gitlab\.io$/i;

  const off = () => { C.relayUrl = ""; C.imageProxyUrl = ""; window.__API_OK = false; };
  const apply = () => { C.relayUrl = base + "/api/relay"; C.imageProxyUrl = base + "/api/image"; };

  if (location.protocol === "file:") { off(); return; }
  if (!base && STATIC_HOST.test(host)) { off(); return; }

  // 先乐观启用：这样页面早期的请求（比如立刻进入 Real-now）不会白等
  apply();

  try {
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = setTimeout(() => { try { ctrl && ctrl.abort(); } catch (e) {} }, 2500);
    fetch(base + "/api/health", { signal: ctrl ? ctrl.signal : undefined, cache: "no-store" })
      .then((r) => { clearTimeout(timer); if (!r.ok) throw new Error("no api"); return r.json(); })
      .then((j) => {
        if (!j || !j.ok) throw new Error("no api");
        window.__API_OK = true;
        console.log("[CONFIG] 接口已就绪 · " + (base || "同源 /api") + " · 运行时 " + (j.runtime || "node"));
      })
      .catch(() => {
        clearTimeout(timer);
        off();
        console.log("[CONFIG] 未检测到接口代理 · 已切换为纯静态降级模式");
      });
  } catch (e) { off(); }
})();

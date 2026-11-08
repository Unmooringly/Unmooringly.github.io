/* ============================================================
 * 河海大学 111 校史 · AI 时代的蜕变与憧憬
 * Cloudflare Worker —— 把本地 server/proxy.mjs 的两个接口搬到边缘节点
 *
 * 为什么要它：GitHub Pages 只能放静态文件、跑不了 Node，
 *            所以线上版本的「豆包 AI 生图」和「人民日报抓取」会降级。
 *            这个 Worker 补上这两个能力，且 Key 只存在 Worker 的环境变量里。
 *
 * 提供三个端点（与本地 proxy.mjs 完全一致，前端无需分辨）：
 *   GET  /api/health                  → 自检
 *   POST /api/image                   → 豆包（火山方舟）生图代理
 *   GET  /api/relay?url=…             → 抓取中继（人民日报 / 纽约时报 / Science，白名单限域）
 *
 * 可选：如果 wrangler.toml 里绑定了 [assets]，这个 Worker 也会顺带托管整个网页，
 *      这样「网站 + 接口」同域部署，连 CORS 都不需要了。
 *
 * 部署见同目录 ../部署到CloudflareWorker.md
 * ============================================================ */

const DEFAULT_ENDPOINT = "https://ark.cn-beijing.volces.com/api/v3/images/generations";
const DEFAULT_MODEL = "doubao-seedream-5-0-flash-260915";

/* 抓取白名单：只允许这三家的域名，避免 Worker 被当成任意代理 */
const ALLOW_HOSTS = [
  "people.com.cn", "www.people.com.cn", "world.people.com.cn", "edu.people.com.cn",
  "nytimes.com", "rss.nytimes.com", "www.nytimes.com",
  "science.org", "www.science.org",
];
const MAX_RELAY_BYTES = 3 * 1024 * 1024;   // 中继最大回传 3MB
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36 HHU111Demo/1.0";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Max-Age": "86400",
  };
}
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: Object.assign({ "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }, corsHeaders()),
  });
}
function hostAllowed(u) {
  try {
    const h = new URL(u).hostname.toLowerCase();
    return ALLOW_HOSTS.some((a) => h === a || h.endsWith("." + a) || h.endsWith(a));
  } catch (e) { return false; }
}

/* ---------------- 生图代理 ---------------- */
async function handleImage(request, env) {
  let body = {};
  try { body = await request.json(); } catch (e) {}

  const key = (env && (env.DOUBAO_API_KEY || env.DOUBAO_KEY)) || "";
  const endpoint = (env && env.DOUBAO_ENDPOINT) || DEFAULT_ENDPOINT;
  const model = body.model || (env && env.DOUBAO_MODEL) || DEFAULT_MODEL;

  if (!key) {
    return json({ ok: false, code: "NO_KEY", message: "Worker 未配置 DOUBAO_API_KEY（wrangler secret put DOUBAO_API_KEY）" });
  }

  const payload = {
    model,
    prompt: body.prompt || "江河之上的未来蓝图，数字孪生流域，极光与云海",
    size: body.size || "1280x720",
    response_format: "url",
    watermark: false,
  };

  try {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
      body: JSON.stringify(payload),
    });
    const txt = await r.text();
    let j = null;
    try { j = JSON.parse(txt); } catch (e) {}

    if (r.status === 200 && j && j.data && j.data[0]) {
      const d = j.data[0];
      let url = d.url || d.b64_json || "";
      // 有的返回裸 base64，补成 data URL 才能直接当背景图
      if (url && !/^(https?:|data:)/.test(url)) url = "data:image/png;base64," + url;
      if (url) return json({ ok: true, url, model });
      return json({ ok: false, code: "EMPTY", message: "上游返回了空图片" });
    }

    const code = (j && j.error && j.error.code) || ("HTTP_" + r.status);
    const msg = (j && j.error && j.error.message) || txt.slice(0, 240);
    return json({ ok: false, code, message: msg, status: r.status });
  } catch (e) {
    return json({ ok: false, code: "NETWORK", message: String((e && e.message) || e) });
  }
}

/* ---------------- 抓取中继 ---------------- */
async function handleRelay(url) {
  const target = url.searchParams.get("url") || "";
  if (!target) return json({ ok: false, message: "missing url" }, 400);
  if (!hostAllowed(target)) {
    return json({ ok: false, message: "host not in whitelist（只允许人民日报/纽约时报/Science）" }, 403);
  }
  try {
    const r = await fetch(target, {
      headers: { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8" },
      redirect: "follow",
    });
    let text = await r.text();
    if (text.length > MAX_RELAY_BYTES) text = text.slice(0, MAX_RELAY_BYTES);
    const ct = r.headers.get("content-type") || "text/plain";
    return new Response(text, {
      status: 200,
      headers: Object.assign({
        "Content-Type": ct.includes("charset") ? ct : ct + "; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Upstream-Status": String(r.status),
      }, corsHeaders()),
    });
  } catch (e) {
    return json({ ok: false, message: String((e && e.message) || e) });
  }
}

/* ---------------- 入口 ---------------- */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const p = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (p === "/api/health") {
      const key = (env && (env.DOUBAO_API_KEY || env.DOUBAO_KEY)) || "";
      return json({
        ok: true,
        runtime: "cloudflare-worker",
        doubaoKey: key ? (key.slice(0, 8) + "…" + key.slice(-4)) : "(未配置)",
        doubaoModel: (env && env.DOUBAO_MODEL) || DEFAULT_MODEL,
        relayHosts: ALLOW_HOSTS.length,
        assets: !!(env && env.ASSETS),
      });
    }

    if (p === "/api/image" && request.method === "POST") return handleImage(request, env);
    if (p === "/api/image") return json({ ok: false, message: "use POST" }, 405);

    if (p === "/api/relay") return handleRelay(url);

    /* 绑定了静态资源就顺带托管整个网站（同域部署，连 CORS 都不用） */
    if (env && env.ASSETS && typeof env.ASSETS.fetch === "function") {
      return env.ASSETS.fetch(request);
    }

    return new Response(
      "这是「河海 111 校史」的 API 端点。\n\n" +
      "  GET  /api/health\n" +
      "  POST /api/image      {\"prompt\":\"…\"}\n" +
      "  GET  /api/relay?url=<人民日报 / 纽约时报 / Science 的地址>\n\n" +
      "静态网页请用 GitHub Pages；或在本 Worker 的 wrangler.toml 里启用 [assets] 绑定，即可同域托管。\n",
      { status: 404, headers: Object.assign({ "Content-Type": "text/plain; charset=utf-8" }, corsHeaders()) }
    );
  },
};

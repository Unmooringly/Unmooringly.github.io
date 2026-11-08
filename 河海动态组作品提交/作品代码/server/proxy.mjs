/* ============================================================
 * 河海 111 校史 · 本地演示服务器（零第三方依赖，Node 18+）
 *
 *   node server/proxy.mjs            # 默认 http://127.0.0.1:8080
 *   node server/proxy.mjs 9000       # 指定端口
 *
 * 它做三件事：
 *   1) 静态托管整个项目（含中文路径、mp4 的 Range 请求）
 *   2) /api/image   —— 代理火山方舟「豆包」生图，**Key 只留在服务端**
 *                      （浏览器直连 Ark 会被 CORS 拦，这里彻底解决）
 *   3) /api/relay   —— 通用抓取中继，**绕开 CORS**，让人民日报 / 纽约时报 /
 *                      Science 的 RSS 与网页能被前端真正抓到（白名单限域）
 *
 * 设计原则：这个服务器只是为了「本地演示 + 参赛评审」跑得漂亮；
 * 页面在**没有服务器**时依然可用（所有接口都有优雅降级）。
 * ============================================================ */
import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), "..");
const PORT = Number(process.argv[2] || process.env.PORT || 8080);

/* ---------------- 读取 js/config.js 里的密钥（单一配置源） ---------------- */
function readConfig() {
  const p = path.join(ROOT, "js", "config.js");
  let src = "";
  try { src = fs.readFileSync(p, "utf8"); } catch (e) { return {}; }
  const pick = (re) => { const m = src.match(re); return m ? m[1] : ""; };
  const doubaoKey = pick(/doubao\s*:\s*\{[\s\S]*?apiKey\s*:\s*"([^"]*)"/);
  const doubaoEndpoint = pick(/doubao\s*:\s*\{[\s\S]*?endpoint\s*:\s*"([^"]*)"/) ||
    "https://ark.cn-beijing.volces.com/api/v3/images/generations";
  const doubaoModel = pick(/doubao\s*:\s*\{[\s\S]*?model\s*:\s*"([^"]*)"/) ||
    "doubao-seedream-5-0-flash-260915";
  const jimengKey = pick(/jimeng\s*:\s*\{[\s\S]*?apiKey\s*:\s*"([^"]*)"/);
  const jimengEndpoint = pick(/jimeng\s*:\s*\{[\s\S]*?endpoint\s*:\s*"([^"]*)"/);
  return { doubaoKey, doubaoEndpoint, doubaoModel, jimengKey, jimengEndpoint };
}

/* ---------------- MIME ---------------- */
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml",
  ".ico": "image/x-icon", ".mp4": "video/mp4", ".webm": "video/webm",
  ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf",
};

/* ---------------- 通用抓取（服务端无 CORS 限制） ---------------- */
const ALLOW_HOSTS = [
  "people.com.cn", "www.people.com.cn", "world.people.com.cn", "edu.people.com.cn",
  "nytimes.com", "rss.nytimes.com", "www.nytimes.com",
  "science.org", "www.science.org",
];
function hostAllowed(u) {
  try {
    const h = new URL(u).hostname.toLowerCase();
    return ALLOW_HOSTS.some((a) => h === a || h.endsWith("." + a) || h.endsWith(a));
  } catch (e) { return false; }
}

function httpsGet(url, timeoutMs = 12000, redirects = 0) {
  return new Promise((resolve, reject) => {
    let u;
    try { u = new URL(url); } catch (e) { return reject(new Error("bad url")); }
    const mod = u.protocol === "http:" ? http : https;
    const req = mod.request({
      hostname: u.hostname, port: u.port || (u.protocol === "http:" ? 80 : 443),
      path: u.pathname + u.search, method: "GET", timeout: timeoutMs,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/124.0 Safari/537.36 HHU111Demo/1.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      },
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects < 4) {
        res.resume();
        const next = new URL(res.headers.location, url).toString();
        if (!hostAllowed(next)) return reject(new Error("redirect out of whitelist"));
        return resolve(httpsGet(next, timeoutMs, redirects + 1));
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve({
        status: res.statusCode, type: res.headers["content-type"] || "text/plain; charset=utf-8",
        body: Buffer.concat(chunks).toString("utf8"),
      }));
    });
    req.on("timeout", () => { req.destroy(new Error("timeout")); });
    req.on("error", reject);
    req.end();
  });
}

function httpsPostJson(url, bodyObj, headers, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const payload = Buffer.from(JSON.stringify(bodyObj), "utf8");
    const req = https.request({
      hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search,
      method: "POST", timeout: timeoutMs,
      headers: Object.assign({
        "Content-Type": "application/json",
        "Content-Length": payload.length,
      }, headers),
    }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        let json = null;
        const txt = Buffer.concat(chunks).toString("utf8");
        try { json = JSON.parse(txt); } catch (e) {}
        resolve({ status: res.statusCode, json, text: txt });
      });
    });
    req.on("timeout", () => { req.destroy(new Error("timeout")); });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

/* ---------------- 响应工具 ---------------- */
function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}
function sendJson(res, code, obj) {
  cors(res);
  const body = Buffer.from(JSON.stringify(obj), "utf8");
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Content-Length": body.length, "Cache-Control": "no-store" });
  res.end(body);
}

/* ---------------- 静态文件（含 Range，支持 mp4 拖动） ---------------- */
function serveStatic(req, res, pathname) {
  let p = decodeURIComponent(pathname);
  if (p === "/" || p === "") p = "/index.html";
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end("403"); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("404 " + p);
    }
    const type = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
    const range = req.headers.range;
    if (range && /^bytes=/.test(range)) {
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      let start = m[1] ? parseInt(m[1], 10) : 0;
      let end = m[2] ? parseInt(m[2], 10) : st.size - 1;
      if (isNaN(start) || start < 0) start = 0;
      if (isNaN(end) || end >= st.size) end = st.size - 1;
      if (start > end) { res.writeHead(416); return res.end(); }
      res.writeHead(206, {
        "Content-Type": type, "Accept-Ranges": "bytes",
        "Content-Range": `bytes ${start}-${end}/${st.size}`,
        "Content-Length": end - start + 1, "Cache-Control": "no-store",
      });
      return fs.createReadStream(file, { start, end }).pipe(res);
    }
    res.writeHead(200, {
      "Content-Type": type, "Content-Length": st.size,
      "Accept-Ranges": "bytes", "Cache-Control": "no-store",
    });
    fs.createReadStream(file).pipe(res);
  });
}

/* ---------------- 路由 ---------------- */
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const pathname = u.pathname;

  if (req.method === "OPTIONS") { cors(res); res.writeHead(204); return res.end(); }

  /* === 生图代理：Key 只在服务端 === */
  if (pathname === "/api/image" && req.method === "POST") {
    let raw = "";
    req.on("data", (c) => { raw += c; if (raw.length > 1e6) req.destroy(); });
    req.on("end", async () => {
      let body = {};
      try { body = JSON.parse(raw || "{}"); } catch (e) {}
      const cfg = readConfig();
      const isJimeng = body.ai === "jimeng";
      const key = isJimeng ? cfg.jimengKey : cfg.doubaoKey;
      const endpoint = isJimeng ? (cfg.jimengEndpoint || "") : (cfg.doubaoEndpoint || "");
      if (!key || !endpoint) {
        return sendJson(res, 400, { ok: false, code: "NO_KEY", message: "服务端未读到 API Key（请检查 js/config.js）" });
      }
      const payload = {
        model: body.model || cfg.doubaoModel,
        prompt: body.prompt || "江河之上的未来蓝图",
        size: body.size || "1280x720",
        response_format: "url",
        watermark: false,
      };
      try {
        const r = await httpsPostJson(endpoint, payload, { Authorization: "Bearer " + key });
        if (r.status === 200 && r.json && r.json.data && r.json.data[0]) {
          const d = r.json.data[0];
          let url = d.url || d.b64_json || "";
          if (url && !/^(https?:|data:)/.test(url)) url = "data:image/png;base64," + url;
          console.log("[image] ok", (url || "").slice(0, 72));
          return sendJson(res, 200, { ok: true, url, model: payload.model });
        }
        const code = (r.json && r.json.error && r.json.error.code) || ("HTTP_" + r.status);
        const msg = (r.json && r.json.error && r.json.error.message) || (r.text || "").slice(0, 240);
        console.warn("[image] fail", code, msg.slice(0, 120));
        return sendJson(res, 200, { ok: false, code, message: msg, status: r.status });
      } catch (e) {
        console.warn("[image] error", e.message);
        return sendJson(res, 200, { ok: false, code: "NETWORK", message: e.message });
      }
    });
    return;
  }

  /* === 通用抓取中继：绕开 CORS（白名单限域） === */
  if (pathname === "/api/relay") {
    const target = u.searchParams.get("url") || "";
    if (!target) return sendJson(res, 400, { ok: false, message: "missing url" });
    if (!hostAllowed(target)) return sendJson(res, 403, { ok: false, message: "host not in whitelist" });
    try {
      const r = await httpsGet(target);
      cors(res);
      const body = Buffer.from(r.body, "utf8");
      res.writeHead(200, {
        "Content-Type": r.type.includes("charset") ? r.type : r.type + "; charset=utf-8",
        "Content-Length": body.length, "Cache-Control": "no-store",
        "X-Upstream-Status": String(r.status),
      });
      console.log("[relay] ok", r.status, target.slice(0, 90));
      return res.end(body);
    } catch (e) {
      console.warn("[relay] fail", e.message, target.slice(0, 90));
      return sendJson(res, 200, { ok: false, message: e.message });
    }
  }

  /* === 健康检查 === */
  if (pathname === "/api/health") {
    const cfg = readConfig();
    return sendJson(res, 200, {
      ok: true, root: ROOT,
      doubaoKey: cfg.doubaoKey ? (cfg.doubaoKey.slice(0, 8) + "…" + cfg.doubaoKey.slice(-4)) : "(未配置)",
      doubaoModel: cfg.doubaoModel,
      relayHosts: ALLOW_HOSTS.length,
    });
  }

  return serveStatic(req, res, pathname);
});

server.listen(PORT, "127.0.0.1", async () => {
  const cfg = readConfig();
  console.log("──────────────────────────────────────────────");
  console.log("  河海 111 校史 · 本地演示服务器已启动");
  console.log("  打开：  http://127.0.0.1:" + PORT + "/index.html");
  console.log("  根目录：" + ROOT);
  console.log("  豆包 Key：" + (cfg.doubaoKey ? "已读取（仅服务端使用）" : "未配置"));
  console.log("  生图模型：" + cfg.doubaoModel);
  console.log("  抓取中继：/api/relay?url=…（人民日报 / 纽约时报 / Science）");
  console.log("──────────────────────────────────────────────");
});

/* ============================================================
 * 本地预览 Cloudflare Worker（不部署也能先看效果）
 *
 *   node tools/serve-worker.mjs            # 默认 http://127.0.0.1:8787
 *   node tools/serve-worker.mjs 8790
 *
 * 用 Node 的 http 把 worker/index.js 的 fetch 处理器包一层，
 * 这样可以在本机完整模拟"GitHub Pages 静态站点 + 远程 Worker 接口"的拓扑。
 * ============================================================ */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.argv[2] || 8787);

function readKey() {
  try {
    const src = fs.readFileSync(path.join(ROOT, "js", "config.js"), "utf8");
    const m = src.match(/doubao\s*:\s*\{[\s\S]*?apiKey\s*:\s*"([^"]*)"/);
    return m ? m[1] : "";
  } catch (e) { return ""; }
}

const env = { DOUBAO_API_KEY: readKey(), DOUBAO_MODEL: "doubao-seedream-5-0-flash-260915" };
const worker = (await import("file://" + path.join(ROOT, "worker", "index.js").replace(/\\/g, "/"))).default;

const server = http.createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;

  const init = { method: req.method, headers: {} };
  for (const [k, v] of Object.entries(req.headers)) {
    if (["host", "connection", "content-length"].includes(k)) continue;
    init.headers[k] = v;
  }
  if (body && req.method !== "GET" && req.method !== "HEAD") init.body = body;

  try {
    const r = await worker.fetch(new Request("http://127.0.0.1:" + PORT + req.url, init), env, {});
    const hdrs = {};
    r.headers.forEach((v, k) => { hdrs[k] = v; });
    res.writeHead(r.status, hdrs);
    res.end(Buffer.from(await r.arrayBuffer()));
  } catch (e) {
    res.writeHead(500, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: false, message: String(e && e.message || e) }));
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("──────────────────────────────────────────────");
  console.log("  Worker 本地预览已启动");
  console.log("  健康检查：http://127.0.0.1:" + PORT + "/api/health");
  console.log("  把它填进 js/config.js 的 apiBase 即可模拟线上：");
  console.log('    apiBase: "http://127.0.0.1:' + PORT + '"');
  console.log("  豆包 Key：" + (readKey() ? "已读取" : "未配置"));
  console.log("──────────────────────────────────────────────");
});

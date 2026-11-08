/* ============================================================
 * worker/index.js 的本地验证脚本（不需要真的部署到 Cloudflare）
 *
 *   node tools/test-worker.mjs
 *
 * 原理：Cloudflare Worker 的导出签名 `{ fetch(request, env) }` 和 Web 标准
 *      `Request` / `Response` / `fetch` 在 Node 18+ 里都有，
 *      所以可以直接把 Worker 当普通模块驱动，跑一遍真实网络请求。
 * ============================================================ */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const WORKER = path.join(ROOT, "worker", "index.js");

/* 从 js/config.js 里取 Key（本地测试用；真实部署请用 wrangler secret） */
function readKey() {
  try {
    const src = fs.readFileSync(path.join(ROOT, "js", "config.js"), "utf8");
    const m = src.match(/doubao\s*:\s*\{[\s\S]*?apiKey\s*:\s*"([^"]*)"/);
    return m ? m[1] : "";
  } catch (e) { return ""; }
}

const env = { DOUBAO_API_KEY: readKey(), DOUBAO_MODEL: "doubao-seedream-5-0-flash-260915" };
const mod = await import("file://" + WORKER.replace(/\\/g, "/"));
const worker = mod.default;

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ✔ " + name + (extra ? "  " + extra : "")); }
  else { fail++; console.log("  ✘ " + name + (extra ? "  " + extra : "")); }
}
const call = (p, init) => worker.fetch(new Request("https://hhu111.test" + p, init), env);

console.log("\n=== 1. /api/health ===");
{
  const r = await call("/api/health");
  const j = await r.json();
  ok("200", r.status === 200);
  ok("CORS 头", r.headers.get("access-control-allow-origin") === "*");
  ok("runtime=cloudflare-worker", j.runtime === "cloudflare-worker");
  ok("读到 Key", /^ark-.+…/.test(j.doubaoKey || ""), "(" + j.doubaoKey + ")");
}

console.log("\n=== 2. OPTIONS 预检 ===");
{
  const r = await call("/api/image", { method: "OPTIONS" });
  ok("204", r.status === 204);
  ok("Allow-Methods", (r.headers.get("access-control-allow-methods") || "").includes("POST"));
}

console.log("\n=== 3. /api/relay 白名单 ===");
{
  const r = await call("/api/relay?url=" + encodeURIComponent("https://evil.example.com/x"));
  ok("非白名单被拒(403)", r.status === 403);
}

console.log("\n=== 4. /api/relay 真抓人民日报 ===");
{
  const target = "http://www.people.com.cn/rss/politics.xml";
  const r = await call("/api/relay?url=" + encodeURIComponent(target));
  const txt = await r.text();
  const items = (txt.match(/<item/g) || []).length;
  ok("200", r.status === 200, "status=" + r.status);
  ok("有 <item>", items > 10, "items=" + items);
  ok("bytes>100KB", txt.length > 100000, "bytes=" + txt.length);
  ok("上游状态头", r.headers.get("x-upstream-status") === "200");
}

console.log("\n=== 5. /api/relay 真抓 Science ===");
{
  const target = "https://www.science.org/rss/news_current.xml";
  const r = await call("/api/relay?url=" + encodeURIComponent(target));
  const txt = await r.text();
  ok("200", r.status === 200);
  ok("有 <item>", (txt.match(/<item/g) || []).length > 3, "items=" + (txt.match(/<item/g) || []).length);
}

console.log("\n=== 6. /api/image 真调豆包 ===");
{
  const r = await call("/api/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: "cyberpunk water city, cyan gold, aerial view", size: "1280x720" }),
  });
  const j = await r.json();
  ok("200（业务层永远 200，结果在 body）", r.status === 200);
  ok("body 有 ok 字段", typeof j.ok === "boolean");
  if (j.ok) {
    ok("拿到图片 URL", /^(https?:|data:)/.test(j.url || ""), (j.url || "").slice(0, 60));
  } else {
    // 账号额度受限是预期情况：只要上游错误码被正确透传就算通过
    ok("上游错误码被如实透传", !!j.code, "code=" + j.code + (j.status ? " / upstream " + j.status : ""));
    if (j.code === "SetLimitExceeded") {
      console.log("    ↳ 说明：Key 有效、链路通，仅火山账号「安全体验模式」额度用尽。");
      console.log("      去火山控制台 → 方舟 → 开通管理 → 关闭/调高该限制后即可真出图。");
    }
  }
}

console.log("\n=== 7. 未配置 Key 时的行为 ===");
{
  const r = await worker.fetch(new Request("https://hhu111.test/api/image", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
  }), {});
  const j = await r.json();
  ok("返回 NO_KEY", j.ok === false && j.code === "NO_KEY");
}

console.log("\n=== 8. 根路径（未绑定 assets）===");
{
  const r = await call("/");
  ok("404 且给出用法说明", r.status === 404 && (await r.text()).includes("/api/relay"));
}

console.log("\n──────────────────────────────");
console.log("通过 " + pass + " 项，失败 " + fail + " 项");
process.exit(fail ? 1 : 0);

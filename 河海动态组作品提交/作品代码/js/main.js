/* ============================================================
 * 主控制器：路由 / 全局状态 / 转场 / 预加载 / 导航
 * ============================================================ */
window.App = (function () {
  const U = window.Utils;

  const state = {
    campus: "江宁",
    historyUpgraded: false,   // 是否已从"AI为伴的云时代"返回历史线（触发修进形态）
    visitFuture: false,       // 是否到访过云时代
    initPlayed: false,
    weather: null,
    season: null,
    phase: null,
    lang: "zh",
  };

  const pages = {};
  const stack = [];
  let currentId = null;
  let locked = false;
  let pending = null;

  const $ = (id) => document.getElementById(id);

  /* ---------------- 转场 ---------------- */
  function flash(color, ms) {
    const f = $("stage-flash");
    if (!f) return;
    f.classList.toggle("dark", color === "dark");
    f.classList.add("on");
    setTimeout(() => f.classList.remove("on"), ms || 260);
  }

  function setPageVisible(el, on) {
    if (!el) return;
    if (on) { el.classList.add("active"); el.style.opacity = "0"; void el.offsetWidth; el.style.opacity = "1"; }
    else { el.style.opacity = "0"; }
  }

  function navigate(id, params, opts) {
    opts = opts || {};
    if (!pages[id]) { console.warn("[App] 未注册页面:", id); return; }
    if (locked) { pending = { id, params, opts }; return; }
    if (id === currentId && !opts.force) {
      if (pages[id].enter) { try { pages[id].enter(params || {}); } catch (e) { console.error(e); } }
      return;
    }
    locked = true;

    const leavingId = currentId;
    const leaving = pages[leavingId];
    const curEl = leavingId ? $("page-" + leavingId) : null;
    const nextEl = $("page-" + id);

    // 初始化页不显示全局导航
    const nav = $("global-nav");
    if (nav) nav.classList.toggle("show", id !== "init");

    if (opts.transition === "flash") flash(opts.color || "white", opts.flashMs);
    if (opts.transition === "dark") flash("dark", opts.flashMs);

    const swapIn = () => {
      if (leaving && leaving.leave) { try { leaving.leave(); } catch (e) { console.warn(e); } }
      if (curEl) { curEl.classList.remove("active"); curEl.style.opacity = ""; curEl.style.display = ""; }
      currentId = id;
      if (id === "future" || id === "cloud") state.visitFuture = true;
      if (nextEl) { nextEl.style.display = ""; setPageVisible(nextEl, true); }
      window.scrollTo(0, 0);
      if (pages[id].enter) { try { pages[id].enter(params || {}); } catch (e) { console.error("[App] enter 失败", id, e); } }
      if (!opts.noHistory) { stack.push({ id, params }); if (stack.length > 40) stack.shift(); }
      setTimeout(() => { locked = false; if (pending) { const p = pending; pending = null; navigate(p.id, p.params, p.opts); } }, 60);
    };

    const fadeOutMs = opts.instant ? 0 : 420;
    if (fadeOutMs && nextEl) { nextEl.classList.add("active"); nextEl.style.opacity = "0"; }
    setTimeout(swapIn, fadeOutMs);
  }

  function register(id, def) { pages[id] = def; return def; }

  /* ---------------- 全局状态 ---------------- */
  function setCampus(c) { state.campus = c; }
  const getCampus = () => state.campus;
  function setUpgraded(v) { state.historyUpgraded = !!v; }
  const isUpgraded = () => state.historyUpgraded;

  function getWeather() { return state.weather; }
  function refreshWeather(force) {
    return U.fetchWeather(force).then(w => {
      state.weather = w;
      const t = U.nowNanjing();
      state.season = U.seasonOf(t.month);
      state.phase = U.dayPhase(t.hour, t.minute);
      return w;
    });
  }

  /* ---------------- 全局导航 ---------------- */
  function initNav() {
    const aboutBtn = $("about-link");
    if (aboutBtn) aboutBtn.addEventListener("click", () => navigate("about"));
    const backBtn = $("back-link");
    if (backBtn) backBtn.addEventListener("click", () => back());
    U.injectCSS("css-nav-patch", `#global-nav{z-index:9600}`);
  }

  function back() {
    if (currentId === "about") { navigate(lastNonAbout() || "init"); return; }
    if (stack.length >= 2) {
      stack.pop();
      const prev = stack[stack.length - 1];
      navigate(prev.id, prev.params, { noHistory: true });
      return;
    }
    const up = { init: null, first: "init", library: "first", future: "library", history: "library",
      hall: "history", water: "history", pivot: "history", blueprints: "future",
      realnow: "future", cloud: "future", about: "first" };
    const t = up[currentId];
    if (t) navigate(t);
  }
  function lastNonAbout() {
    for (let i = stack.length - 1; i >= 0; i--) if (stack[i].id !== "about") return stack[i].id;
    return "init";
  }

  /* ---------------- 加载 / 提示 ---------------- */
  function showLoading(text, pct) {
    const elBox = $("loading");
    if (!elBox) return;
    elBox.classList.remove("hide");
    const t = elBox.querySelector(".loading-text");
    if (t && text) t.textContent = text;
    const bar = elBox.querySelector(".loading-bar > i");
    if (bar && pct != null) bar.style.width = Math.round(pct * 100) + "%";
  }
  function hideLoading() {
    const elBox = $("loading");
    if (elBox) elBox.classList.add("hide");
  }
  let toastTimer = null;
  function toast(msg, ms) {
    let t = $("app-toast");
    if (!t) { t = U.el("div"); t.id = "app-toast"; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), ms || 2600);
  }

  /* ---------------- 启动 ---------------- */
  function boot() {
    initNav();
    const emblem = $("loading-emblem-img");
    if (emblem) emblem.style.backgroundImage = `url("${encodeURI("素材/校徽/校徽.jpg")}")`;

    const t = U.nowNanjing();
    state.season = U.seasonOf(t.month);
    state.phase = U.dayPhase(t.hour, t.minute);

    const critical = [
      "素材/校徽/校徽.jpg", "素材/校徽/校名.jpg",
      ...window.DATA.ALUMNI.map(a => a.image),
      ...window.DATA.BUILDINGS.map(b => b.image),
    ];
    const heavy = [
      "素材/校门/西康路校门.jpg", "素材/校门/江宁校门.jpg", "素材/校门/金坛校门.jpg",
      "素材/背景/走廊.jpg", "素材/背景/名贤堂.jpg",
    ];
    const seasonImg = U.seasonImage(state.season, state.phase);

    showLoading("正在汇聚江河之光…", 0.02);
    refreshWeather().catch(() => {});
    U.preload(critical, (p) => showLoading("正在唤醒二十位名贤与十项伟业…", 0.05 + p * 0.55))
      .then(() => U.preload(heavy, (p) => showLoading("正在点亮陈列馆的长廊…", 0.6 + p * 0.3)))
      .then(() => U.preload([seasonImg], () => {}))
      .catch(() => {})
      .then(() => {
        showLoading("此卷所录，皆为此前赴后继的答案。", 1);
        setTimeout(() => { hideLoading(); navigate("init"); }, 620);
      });
  }

  window.addEventListener("DOMContentLoaded", () => setTimeout(boot, 60));
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && currentId && currentId !== "init") back();
  });

  return {
    navigate, register, back, toast,
    setCampus, getCampus, setUpgraded, isUpgraded,
    getWeather, refreshWeather,
    showLoading, hideLoading, flash,
    state, pages,
  };
})();

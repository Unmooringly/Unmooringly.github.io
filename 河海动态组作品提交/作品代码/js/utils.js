/* ============================================================
 * 工具层 Utils — 存储 / 时间 / 天气 / 数学 / Canvas / 动画 / 资源
 * 所有页面共享。页面离开时用 U.life() 返回的生命周期对象自动清理。
 * ============================================================ */
window.Utils = (function () {
  const TAU = Math.PI * 2;

  /* ================= 存储（模拟后端统计） ================= */
  const KEY = "hhu111_v2_";
  function load(k, def) {
    try {
      const v = localStorage.getItem(KEY + k);
      if (v === null || v === undefined || v === "") return def;
      return JSON.parse(v);
    } catch (e) { return def; }
  }
  function save(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) {} }

  const store = {
    get: (k, d) => load(k, d),
    set: (k, v) => { save(k, v); return v; },
    // 首次访问给出合理的历史基数，让"后端统计"看起来像真实运营数据
    seed(k, base) { if (load(k, null) === null) save(k, base); return load(k, base); },
    inc(k, by = 1) { const n = (load(k, 0) || 0) + by; save(k, n); return n; },

    timeBack() { return load("timeBack", 0); },
    addTimeBack() { return store.inc("timeBack"); },

    sparks() { return load("sparks", {}); },
    addSpark(name) { const s = load("sparks", {}); s[name] = (s[name] || 0) + 1; save("sparks", s); return s[name]; },
    sparkOf(name) { return (load("sparks", {}) || {})[name] || 0; },

    rockets() { return load("rockets", 0); },
    addRocket() { return store.inc("rockets"); },

    gyro() { return load("gyro", 0); },
    addGyro() { return store.inc("gyro"); },

    tributes() { return load("tributes", []); },
    addTribute(t) { const a = load("tributes", []); a.push(t); if (a.length > 300) a.splice(0, a.length - 300); save("tributes", a); return a; },

    user() { return load("user", null); },
    setUser(u) { save("user", u); return u; },
    logout() { save("user", null); },

    // 单次登入内不重复抽取
    useIdx(key, n) {
      const a = load("used_" + key, []);
      if (a.length >= n) { save("used_" + key, []); return null; }
      let i, guard = 0;
      do { i = Math.floor(Math.random() * n); guard++; } while (a.indexOf(i) >= 0 && guard < 200);
      a.push(i); save("used_" + key, a); return i;
    },
    resetUse(key) { save("used_" + key, []); },
  };

  /* ================= 时间 / 节气 ================= */
  function zoned(tz) {
    try {
      const fmt = new Intl.DateTimeFormat("en-GB", {
        timeZone: tz, hour12: false, year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit", weekday: "short",
      });
      const g = {}; fmt.formatToParts(new Date()).forEach(x => { g[x.type] = x.value; });
      const hour = (+g.hour) % 24;
      return {
        year: +g.year, month: +g.month, day: +g.day, hour,
        minute: +g.minute, second: +g.second, weekday: g.weekday,
        text: `${String(hour).padStart(2, "0")}:${g.minute}:${g.second}`,
        hm: `${String(hour).padStart(2, "0")}:${g.minute}`,
        dateText: `${g.year}.${g.month}.${g.day}`,
      };
    } catch (e) {
      const d = new Date();
      return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), hour: d.getHours(),
        minute: d.getMinutes(), second: d.getSeconds(), weekday: "",
        text: "00:00:00", hm: "00:00", dateText: "" };
    }
  }
  const nowIn = (tz) => zoned(tz);
  const nowNanjing = () => zoned("Asia/Shanghai");

  // 时段：day 白天 / dusk 黎明黄昏 / night 晚间
  function dayPhase(hour, minute) {
    const h = hour + (minute || 0) / 60;
    if (h >= 5.2 && h < 6.9) return "dusk";
    if (h >= 6.9 && h < 17.3) return "day";
    if (h >= 17.3 && h < 19.4) return "dusk";
    return "night";
  }
  const phaseLabel = p => (p === "day" ? "白昼" : p === "dusk" ? "晨昏" : "夜色");

  function seasonOf(month) {
    if (month >= 3 && month <= 5) return "春";
    if (month >= 6 && month <= 8) return "夏";
    if (month >= 9 && month <= 11) return "秋";
    return "冬";
  }
  // 季节 + 时段 → 四季三时 图片（素材实际文件名：春黎明黄辉 / 夏黎明黄昏 …）
  function seasonImage(season, phase) {
    if (phase === "dusk") {
      const file = { 春: "春黎明黄辉", 夏: "夏黎明黄昏", 秋: "秋黎明黄昏", 冬: "冬黎明黄昏" }[season];
      return "素材/四季三时/" + file + ".jpg";
    }
    return `素材/四季三时/${season}${phase === "day" ? "早" : "晚"}.jpg`;
  }
  // 光线明暗系数 0..1
  function lightLevel(hour, minute) {
    const h = hour + (minute || 0) / 60;
    if (h >= 9 && h <= 15) return 1;
    if (h > 15 && h < 19.4) return 1 - ((h - 15) / 4.4) * 0.72;
    if (h >= 19.4 || h < 5.2) return 0.26;
    if (h >= 5.2 && h < 9) return 0.3 + ((h - 5.2) / 3.8) * 0.7;
    return 0.92;
  }

  /* ================= 天气 ================= */
  const NJ = { lat: 31.95, lon: 118.85, name: "南京·江宁" };
  function mockWeather() {
    const s = seasonOf(nowNanjing().month);
    const presets = {
      春: [{ code: 3, cloud: 78, rain: .3 }, { code: 2, cloud: 52 }, { code: 61, cloud: 92, rain: 1.4 }, { code: 0, cloud: 8 }],
      夏: [{ code: 95, cloud: 96, rain: 3.4 }, { code: 2, cloud: 45 }, { code: 80, cloud: 82, rain: 1 }, { code: 1, cloud: 22 }],
      秋: [{ code: 0, cloud: 6 }, { code: 2, cloud: 48 }, { code: 45, cloud: 88 }, { code: 61, cloud: 86, rain: .9 }],
      冬: [{ code: 3, cloud: 84 }, { code: 45, cloud: 94 }, { code: 71, cloud: 92, snow: .7 }, { code: 1, cloud: 26 }],
    }[s];
    const p = presets[Math.floor(Math.random() * presets.length)];
    return { ok: false, temp: null, code: p.code, rain: p.rain || 0, snow: p.snow || 0,
      cloud: p.cloud || 0, wind: 2.4, season: s, label: weatherType(p.code) };
  }
  let weatherCache = null, weatherAt = 0;
  function fetchWeather(force) {
    if (!force && weatherCache && Date.now() - weatherAt < 6 * 60 * 1000) return Promise.resolve(weatherCache);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${NJ.lat}&longitude=${NJ.lon}` +
      `&current=temperature_2m,weather_code,is_day,rain,snowfall,cloud_cover,wind_speed_10m&timezone=Asia%2FShanghai`;
    const ctrl = ("AbortController" in window) ? new AbortController() : null;
    const timer = setTimeout(() => { try { ctrl && ctrl.abort(); } catch (e) {} }, 6000);
    return fetch(url, ctrl ? { signal: ctrl.signal } : undefined)
      .then(r => r.json())
      .then(j => {
        clearTimeout(timer);
        const c = j.current || {};
        const out = { ok: true, temp: c.temperature_2m, code: c.weather_code, rain: c.rain || 0,
          snow: c.snowfall || 0, cloud: c.cloud_cover || 0, wind: c.wind_speed_10m || 0,
          season: seasonOf(nowNanjing().month), label: weatherType(c.weather_code) };
        weatherCache = out; weatherAt = Date.now(); return out;
      })
      .catch(() => { clearTimeout(timer); const m = mockWeather(); weatherCache = m; weatherAt = Date.now(); return m; });
  }
  function weatherType(code) {
    if (code == null) return "云";
    if (code === 0) return "晴";
    if (code === 1) return "少云";
    if (code === 2) return "多云";
    if (code === 3) return "阴";
    if (code >= 45 && code <= 48) return "雾";
    if (code >= 51 && code <= 57) return "细雨";
    if (code >= 61 && code <= 67) return "雨";
    if (code >= 71 && code <= 77) return "雪";
    if (code >= 80 && code <= 82) return "阵雨";
    if (code >= 85 && code <= 86) return "阵雪";
    if (code >= 95) return "雷雨";
    return "云";
  }
  function weatherMood(code, rain, snow) {
    if (snow > 0 || (code >= 71 && code <= 77) || code === 85 || code === 86) return "snowing";
    if (rain > 0 || (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return "raining";
    if (code >= 45 && code <= 48) return "foggy";
    if (code === 0) return "sunny";
    return "cloudy";
  }

  /* ================= 数学 / 噪声 ================= */
  const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  const smooth = t => t * t * (3 - 2 * t);
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeInOut = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOutBack = t => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);

  function hash2(x, y) {
    let h = (x | 0) * 374761393 + (y | 0) * 668265263;
    h = (h ^ (h >> 13)) * 1274126177;
    h = h ^ (h >> 16);
    return (h & 0x7fffffff) / 0x7fffffff;
  }
  function noise2(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = smooth(xf), v = smooth(yf);
    const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
    return lerp(lerp(a, b, u), lerp(c, d, u), v);
  }
  function fbm(x, y, oct) {
    let v = 0, amp = .5, fx = x, fy = y;
    const n = oct || 4;
    for (let i = 0; i < n; i++) { v += noise2(fx, fy) * amp; fx *= 2.02; fy *= 2.03; amp *= .5; }
    return v;
  }

  /* ================= 生命周期（自动清理 rAF / timer / 监听） ================= */
  function life() {
    const rafs = new Set(), timers = new Set(), intervals = new Set(), offs = [];
    let dead = false;
    const L = {
      get dead() { return dead; },
      raf(fn) {
        if (dead) return 0;
        const id = requestAnimationFrame(function loop(t) {
          rafs.delete(id);
          if (dead) return;
          fn(t);
          if (!dead) { const nid = requestAnimationFrame(loop); rafs.add(nid); }
        });
        rafs.add(id);
        return id;
      },
      loop(fn) {
        if (dead) return;
        const id = requestAnimationFrame(function l(t) {
          if (dead) return;
          rafs.delete(id);
          fn(t);
          if (!dead) { const nid = requestAnimationFrame(l); rafs.add(nid); }
        });
        rafs.add(id);
      },
      timeout(fn, ms) {
        const id = setTimeout(() => { timers.delete(id); if (!dead) fn(); }, ms);
        timers.add(id); return id;
      },
      interval(fn, ms) {
        const id = setInterval(() => { if (!dead) fn(); }, ms);
        intervals.add(id); return id;
      },
      on(node, ev, fn, opt) {
        if (!node) return;
        node.addEventListener(ev, fn, opt);
        offs.push(() => node.removeEventListener(ev, fn, opt));
      },
      off(fn) { offs.push(fn); },
      kill() {
        dead = true;
        rafs.forEach(r => cancelAnimationFrame(r)); rafs.clear();
        timers.forEach(t => clearTimeout(t)); timers.clear();
        intervals.forEach(i => clearInterval(i)); intervals.clear();
        offs.forEach(f => { try { f(); } catch (e) {} }); offs.length = 0;
      },
    };
    return L;
  }

  /* ================= Canvas ================= */
  const DPR = () => Math.min(window.devicePixelRatio || 1, 2);
  function fitCanvas(c) {
    const dpr = DPR();
    const w = c.clientWidth || (c.parentElement && c.parentElement.clientWidth) || window.innerWidth;
    const h = c.clientHeight || (c.parentElement && c.parentElement.clientHeight) || window.innerHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    }
    const ctx = c.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h, dpr };
  }
  function mkCanvas(w, h) {
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
    return c;
  }
  function glowCircle(ctx, x, y, r, rgb, alpha) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${alpha})`);
    g.addColorStop(.45, `rgba(${rgb},${alpha * .42})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  // 有机云团路径
  function cloudBlob(ctx, cx, cy, w, h, seed, t, wobble) {
    const n = 30, s = seed || 1, wb = wobble == null ? 1 : wobble, tt = t || 0;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = i / n * TAU;
      const r1 = .72 + .3 * fbm(Math.cos(a) * 1.7 + s * 7.1, Math.sin(a) * 1.7 + s * 3.7, 3);
      const wob = 1 + Math.sin(tt * .0004 + s * 5 + a * 2) * .03 * wb;
      const bulge = 1 + Math.cos(a * 3 + s) * .06;
      const x = cx + Math.cos(a) * w * .5 * r1 * wob * bulge;
      const y = cy + Math.sin(a) * h * .5 * r1 * wb * (0.86 + Math.cos(a * 2 + s * 2) * .1);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
  }

  /* ================= 补间 ================= */
  function tween(from, to, dur, onUpdate, ease) {
    const e = ease || easeInOut;
    const t0 = performance.now();
    let id = 0, cancelled = false;
    function step() {
      if (cancelled) return;
      const p = Math.min(1, (performance.now() - t0) / dur);
      onUpdate(from + (to - from) * e(p), p);
      if (p < 1) id = requestAnimationFrame(step);
    }
    id = requestAnimationFrame(step);
    return { cancel() { cancelled = true; cancelAnimationFrame(id); } };
  }

  /* ================= 资源 ================= */
  const imgCache = new Map();
  function loadImg(src) {
    const key = src;
    if (imgCache.has(key)) return imgCache.get(key);
    const p = new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => rej(new Error("img " + src));
      im.src = encodeURI(src);
    });
    imgCache.set(key, p);
    return p;
  }
  function preload(list, onProgress) {
    let done = 0; const total = list.length;
    return Promise.all(list.map(src => loadImg(src)
      .then(im => { done++; onProgress && onProgress(done / total, src); return im; })
      .catch(() => { done++; onProgress && onProgress(done / total, src); return null; })));
  }

  /* ================= 文本 ================= */
  function sentences(text) {
    return (text || "").split(/(?<=[。！？；\n])/).map(s => s.trim()).filter(Boolean);
  }
  function fracText(text, frac) { return text.slice(0, Math.floor(text.length * clamp(frac, 0, 1))); }

  /* ================= DOM / CSS ================= */
  function injectCSS(id, css) {
    if (document.getElementById(id)) return;
    const st = document.createElement("style");
    st.id = id; st.textContent = css;
    document.head.appendChild(st);
  }
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function debounce(fn, ms) { let t; return function (...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); }; }
  function throttle(fn, ms) {
    let last = 0, tm = null;
    return function (...a) {
      const now = Date.now(), wait = ms - (now - last);
      if (wait <= 0) { last = now; fn.apply(this, a); }
      else if (!tm) { tm = setTimeout(() => { tm = null; last = Date.now(); fn.apply(this, a); }, wait); }
    };
  }
  function pointer(node, L) {
    const p = { x: -999, y: -999, down: false, inside: false, sx: 0, sy: 0 };
    L.on(node, "pointermove", e => {
      const r = node.getBoundingClientRect ? node.getBoundingClientRect() : { left: 0, top: 0 };
      p.x = e.clientX - r.left; p.y = e.clientY - r.top; p.sx = e.clientX; p.sy = e.clientY; p.inside = true;
    });
    L.on(node, "pointerleave", () => { p.inside = false; });
    L.on(window, "pointerdown", e => { p.down = true; p.x = e.clientX; p.y = e.clientY; p.inside = true; });
    L.on(window, "pointerup", () => { p.down = false; });
    return p;
  }

  return {
    TAU, store,
    nowIn, nowNanjing, dayPhase, phaseLabel, seasonOf, seasonImage, lightLevel,
    NJ, fetchWeather, weatherType, weatherMood, mockWeather,
    rand, randInt, lerp, clamp, pick, dist, smooth, easeOut, easeInOut, easeOutBack,
    noise2, fbm, hash2,
    life, tween,
    DPR, fitCanvas, mkCanvas, glowCircle, roundRect, cloudBlob,
    loadImg, preload,
    sentences, fracText,
    injectCSS, el, esc, debounce, throttle, pointer,
  };
})();

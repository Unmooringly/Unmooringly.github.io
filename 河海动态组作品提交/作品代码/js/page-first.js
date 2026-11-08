/* ============================================================
 * L2 第一页面
 *  上部：接入南京实时「季节 × 时段」的四季三时背景 + 实时天气特征
 *        中央怀表：甩下摆动 → 自转到背面显示时光回溯总次数
 *                点击 → 指针由慢到快倒转、季节天气回溯、怀表化作数码字节上流
 *  下部：阴云下雨（雨从云中下）· 雨点在水面溅射 · 云可被鼠标/点击蒸发
 *        雨停放晴的偏白太阳（点击驱散所有云，雨停 30 秒）
 *        三座校门（西康路/江宁/金坛）：雨点水墨显影 → 点击露出全貌
 *        → 悬停右侧毛笔正楷书写简介 + 飘落花（梅/月季）落地堆积
 *        → 点击进入对应校区的图书馆页面
 * ============================================================ */
(function () {
  const U = window.Utils, D = window.DATA;
  const FF = () => getComputedStyle(document.body).fontFamily;

  /* ---------------------------------------------------------------- CSS */
  U.injectCSS("css-first", `
  #first-root{position:absolute;inset:0;display:block;overflow-y:auto;overflow-x:hidden;scroll-snap-type:y mandatory;background:#040a14;}
  /* 页面内上下翻滚：上部一整屏 + 下部一整屏，同一张四季三时背景 */
  #first-upper{position:relative;height:100%;scroll-snap-align:start;overflow:hidden;background:transparent;}
  .season-layer{position:absolute;inset:-4%;background-size:cover;background-position:center 44%;
    opacity:0;transition:opacity 1.4s ease, filter 1.2s ease;transform:scale(1.04);}
  .season-layer.on{opacity:1;}
  #first-upper::after{content:"";position:absolute;left:0;right:0;bottom:0;height:42%;pointer-events:none;
    background:linear-gradient(to bottom, rgba(4,10,20,0), rgba(4,10,20,.9));}
  #wx-cv{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}
  #watch-stage{position:absolute;left:50%;top:54%;transform:translate(-50%,-50%);z-index:12;}
  #watch-stage.drop{animation:watchDrop 1.35s cubic-bezier(.25,.6,.3,1) both;}
  @keyframes watchDrop{
    0%{transform:translate(-50%,-330%) rotate(-16deg);opacity:0;}
    22%{opacity:1;}
    52%{transform:translate(-50%,-46%) rotate(9deg);}
    68%{transform:translate(-50%,-57%) rotate(-6deg);}
    82%{transform:translate(-50%,-48%) rotate(3.5deg);}
    92%{transform:translate(-50%,-52%) rotate(-1.5deg);}
    100%{transform:translate(-50%,-50%) rotate(0deg);}
  }
  #watch-cv{display:block;cursor:pointer;}
  #first-hud{position:absolute;left:22px;top:16px;z-index:14;font-size:12px;letter-spacing:.16em;
    color:#cfe2f7;line-height:2;text-shadow:0 2px 10px rgba(0,0,0,.8);
    padding:10px 16px 11px;border-radius:12px;background:linear-gradient(120deg,rgba(3,10,22,.6),rgba(3,10,22,.2));
    backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border:1px solid rgba(150,190,240,.16);}
  #first-hud b{color:#ffe4b0;font-weight:400;font-size:14px;}
  #first-hud .sm{font-size:10px;letter-spacing:.24em;color:#8fb0cf;}
  #first-date{position:absolute;right:22px;top:16px;z-index:14;text-align:right;font-size:11px;
    letter-spacing:.2em;color:#bdd4ea;line-height:1.95;text-shadow:0 2px 10px rgba(0,0,0,.8);
    padding:9px 15px 10px;border-radius:12px;background:linear-gradient(240deg,rgba(3,10,22,.6),rgba(3,10,22,.18));
    backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border:1px solid rgba(150,190,240,.16);}
  #first-date .big{font-family:var(--f-kai);font-size:18px;letter-spacing:.1em;color:#f0f6ff;}
  #watch-tip{position:absolute;left:50%;top:calc(100% + 4px);transform:translateX(-50%);z-index:13;
    white-space:nowrap;font-size:11px;letter-spacing:.18em;color:#a9c6e6;opacity:0;
    transition:opacity .5s;text-shadow:0 2px 8px #000;}
  #watch-tip.on{opacity:.94;}

  /* ---------- 下部 ---------- */
  #first-lower{position:relative;height:100%;scroll-snap-align:start;overflow:hidden;background:transparent;cursor:none;}
  #lower-cv{position:absolute;inset:0;width:100%;height:100%;}
  .gate-txt{position:absolute;z-index:9;pointer-events:none;opacity:0;transition:opacity .7s ease;}
  .gate-txt.on{opacity:1;}
  .gate-txt .col{display:flex;flex-direction:column;}
  .gate-txt .nm{font-family:var(--f-kai);font-size:clamp(17px,1.66vw,23px);letter-spacing:.32em;
    color:#f4f9ff;text-shadow:0 0 24px rgba(150,205,255,.7),0 3px 12px rgba(0,0,0,.95);white-space:nowrap;}
  .gate-txt .en{font-family:var(--f-mono);font-size:9px;letter-spacing:.3em;color:#8babca;margin-top:3px;}
  .gate-txt .br{font-family:var(--f-kai);font-size:clamp(11px,1.06vw,14px);line-height:1.95;
    color:#dcebfa;text-shadow:0 2px 10px rgba(0,0,0,.95);margin-top:.55em;max-width:clamp(210px,26vw,400px);}
  .gate-txt .br i{font-style:normal;color:#ffe6b4;}
  .gate-txt .cur{display:inline-block;width:1.5px;height:1em;background:#bfe0ff;vertical-align:-.12em;
    margin-left:1px;animation:gateCaret 1s steps(1) infinite;}
  @keyframes gateCaret{0%,49%{opacity:1}50%,100%{opacity:0}}
  #lower-hint{position:absolute;left:50%;bottom:8px;transform:translateX(-50%);z-index:10;
    font-size:11px;letter-spacing:.2em;color:#7ea0c4;opacity:.85;text-align:center;pointer-events:none;
    text-shadow:0 2px 8px #000;white-space:nowrap;}
  #lower-hint b{color:#bfe0ff;font-weight:400;}
  @media (max-width:780px){
    #first-upper{flex:0 0 32%;}
    #first-hud{font-size:10px;left:12px;top:10px;}
    #first-date{font-size:9px;right:12px;top:10px;}
    #first-date .big{font-size:13px;}
    .gate-txt .br{font-size:9.5px;max-width:40vw;line-height:1.8;}
    #lower-hint{font-size:8.5px;letter-spacing:.08em;}
    #watch-tip{display:none;}
    #first-hud{padding:7px 11px 8px;border-radius:9px;}
    #first-date{padding:6px 10px 7px;border-radius:9px;}
  }
  @keyframes seasonPulse{
    0%{filter:none;}32%{filter:brightness(1.9) blur(3px) saturate(1.4);}100%{filter:none;}}
  `);

  /* ================================================================
   * 状态
   * ================================================================ */
  const S = { season: "秋", phase: "day", mood: "cloudy", label: "阴", temp: null,
    light: .9, layers: [], active: 0 };

  const SC = { w: 0, h: 0, waterY: 0, wind: .8,
    clouds: [], drops: [], splashes: [], ripples: [], petals: [], gates: [],
    sun: { x: 0, y: 0, r: 40, alpha: 1, visible: true, dispersing: false },
    raining: true, rainPauseUntil: 0, cloudlessSince: 0, regenTimer: false,
    ptr: { x: -999, y: -999, inside: false, down: false }, time: 0 };

  const WATCH = { r: 62, cx: 0, cy: 0, state: "hidden", dropT: 0, flip: 0, flipState: 0,
    angSec: 0, angMin: 0, angHour: 0, swayPhase: 0, alpha: 1, count: 0, bytes: [],
    rewindT: 0, rewindSpeed: 0, seasonStep: 0 };

  let L = null, upperCv, wxCtx, watchCv, wCtx, lowerCv, lCtx, layoutTimer = null;
  const wx = { drops: [], flakes: [], mist: [] };
  const CAMPUS_ORDER = ["西康路", "江宁", "金坛"];

  /* ================================================================
   * 上部：季节背景 + 天气
   * ================================================================ */
  function buildLayers() {
    const up = document.getElementById("first-upper");
    const lo = document.getElementById("first-lower");
    S.layers = []; S.layersLo = [];
    up.querySelectorAll(".season-layer").forEach(n => n.remove());
    if (lo) lo.querySelectorAll(".season-layer").forEach(n => n.remove());
    for (let i = 0; i < 2; i++) {
      const d = U.el("div", "season-layer");
      up.insertBefore(d, up.firstChild);
      S.layers.push(d);
      if (lo) {
        const d2 = U.el("div", "season-layer");
        lo.insertBefore(d2, lo.firstChild);
        S.layersLo.push(d2);
      }
    }
    S.active = 0;
  }

  function applySeason(immediate) {
    if (S.layers.length < 2) return;
    const cur = S.layers[S.active], nxt = S.layers[1 - S.active];
    const img = `url("${encodeURI(U.seasonImage(S.season, S.phase))}")`;
    let f = `brightness(${(.62 + S.light * .62).toFixed(2)}) saturate(${(.82 + S.light * .3).toFixed(2)}) contrast(1.02)`;
    if (S.mood === "raining" || S.mood === "cloudy") f += " brightness(.84) saturate(.88)";
    if (S.mood === "foggy") f += " contrast(.9) brightness(1.06)";
    if (S.mood === "snowing") f += " brightness(1.08) saturate(.55)";
    nxt.style.backgroundImage = img; nxt.style.filter = f;
    nxt.classList.add("on");
    // 下部共用同一张背景（怀表/校门只是表层插件）
    if (S.layersLo && S.layersLo.length >= 2) {
      const loCur = S.layersLo[S.active], loNxt = S.layersLo[1 - S.active];
      loNxt.style.backgroundImage = img; loNxt.style.filter = f;
      loNxt.classList.add("on");
      loCur.classList.remove("on");
    }
    if (immediate) { cur.classList.remove("on"); S.active = 1 - S.active; }
    else {
      S.active = 1 - S.active;
      cur.classList.remove("on");
    }
  }

  function initWx(w, h) {
    wx.drops = []; wx.flakes = []; wx.mist = [];
    for (let i = 0; i < 120; i++) wx.drops.push({ x: U.rand(-40, w + 40), y: U.rand(-h, h), v: U.rand(6, 11), len: U.rand(8, 20), a: U.rand(.1, .36) });
    for (let i = 0; i < 90; i++) wx.flakes.push({ x: U.rand(0, w), y: U.rand(0, h), r: U.rand(.8, 2.4), vy: U.rand(.3, 1.1), vx: U.rand(-.25, .25), a: U.rand(.3, .8), t: U.rand(0, 9) });
    for (let i = 0; i < 14; i++) wx.mist.push({ x: U.rand(0, w), y: U.rand(h * .3, h), r: U.rand(60, 190), a: U.rand(.02, .07), vx: U.rand(-.15, .15) });
  }

  function drawUpperWeather(dt, w, h) {
    if (!wxCtx) return;
    wxCtx.clearRect(0, 0, w, h);
    if (S.phase === "day" && (S.mood === "sunny" || S.mood === "cloudy")) {
      wxCtx.save();
      wxCtx.globalCompositeOperation = "lighter";
      const sx = w * .76, sy = h * .18;
      const g = wxCtx.createRadialGradient(sx, sy, 0, sx, sy, h * 1.05);
      g.addColorStop(0, `rgba(255,246,214,${.32 * S.light})`);
      g.addColorStop(.24, `rgba(255,232,180,${.12 * S.light})`);
      g.addColorStop(1, "rgba(255,220,150,0)");
      wxCtx.fillStyle = g; wxCtx.fillRect(0, 0, w, h);
      wxCtx.restore();
    }
    if (S.mood === "foggy") {
      wxCtx.save();
      for (const m of wx.mist) {
        m.x += m.vx; if (m.x < -m.r) m.x = w + m.r; if (m.x > w + m.r) m.x = -m.r;
        const g = wxCtx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r);
        g.addColorStop(0, `rgba(220,232,244,${m.a})`);
        g.addColorStop(1, "rgba(220,232,244,0)");
        wxCtx.fillStyle = g; wxCtx.beginPath(); wxCtx.arc(m.x, m.y, m.r, 0, U.TAU); wxCtx.fill();
      }
      wxCtx.fillStyle = "rgba(214,226,238,.16)"; wxCtx.fillRect(0, 0, w, h);
      wxCtx.restore();
    }
    if (S.mood === "snowing") {
      wxCtx.save();
      for (const f of wx.flakes) {
        f.y += f.vy * dt * .06 * 6; f.x += (f.vx + Math.sin(f.t += .02) * .4) * dt * .06 * 6;
        if (f.y > h + 6) { f.y = -6; f.x = U.rand(0, w); }
        if (f.x < -6) f.x = w + 6; if (f.x > w + 6) f.x = -6;
        wxCtx.fillStyle = `rgba(255,255,255,${f.a})`;
        wxCtx.beginPath(); wxCtx.arc(f.x, f.y, f.r, 0, U.TAU); wxCtx.fill();
      }
      wxCtx.restore();
    }
    if (S.mood === "raining") {
      wxCtx.save();
      for (const d of wx.drops) {
        d.y += d.v * dt * .22; d.x += 1.1 * dt * .06;
        if (d.y > h + 20) { d.y = -20; d.x = U.rand(-40, w + 40); }
        const lg = wxCtx.createLinearGradient(d.x, d.y, d.x - 1.3, d.y - d.len);
        lg.addColorStop(0, `rgba(225,240,255,${d.a * 2.2})`);
        lg.addColorStop(1, "rgba(160,200,240,0)");
        wxCtx.strokeStyle = lg; wxCtx.lineWidth = 1;
        wxCtx.beginPath(); wxCtx.moveTo(d.x, d.y); wxCtx.lineTo(d.x - 1.3, d.y - d.len); wxCtx.stroke();
      }
      wxCtx.restore();
    }
  }

  /* ================================================================
   * 怀表
   * ================================================================ */
  function setupWatch() {
    const r = Math.round(U.clamp(window.innerHeight * .082, 48, 96));
    WATCH.r = r;
    const dpr = U.DPR();
    watchCv.width = Math.round(r * 2.6 * dpr);
    watchCv.height = Math.round(r * 3.2 * dpr);
    watchCv.style.width = (r * 2.6) + "px";
    watchCv.style.height = (r * 3.2) + "px";
    wCtx = watchCv.getContext("2d");
    wCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    WATCH.cx = r * 1.3;
    WATCH.cy = r * 1.62;
  }

  function startWatch() {
    WATCH.state = "drop"; WATCH.dropT = 0; WATCH.alpha = 1;
    WATCH.flip = 0; WATCH.flipState = 0; WATCH.swayPhase = 0;
    WATCH.count = U.store.timeBack();
    WATCH.angSec = 0; WATCH.angMin = 0; WATCH.angHour = 0; WATCH.bytes = [];
    const stage = document.getElementById("watch-stage");
    if (stage) { stage.classList.remove("drop"); void stage.offsetWidth; stage.classList.add("drop"); }
    const tip = document.getElementById("watch-tip");
    if (tip) { tip.textContent = ""; tip.classList.remove("on"); }
  }

  function drawWatch(dt) {
    const ctx = wCtx;
    if (!ctx) return;
    const r = WATCH.r, cx = WATCH.cx, cy = WATCH.cy;
    const W = r * 2.6, H = r * 3.2;
    ctx.setTransform(U.DPR(), 0, 0, U.DPR(), 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (WATCH.state === "hidden" || WATCH.alpha <= .01) return;

    let ang = 0;
    if (WATCH.state === "drop") {
      WATCH.dropT += dt;
      const p = Math.min(1, WATCH.dropT / 1350);
      ang = Math.sin(p * Math.PI * 3.6) * (1 - p) * .3;
      if (WATCH.dropT >= 1350) { WATCH.state = "settle"; WATCH.swayPhase = 0; }
    } else {
      WATCH.swayPhase += dt * .0015;
      ang = Math.sin(WATCH.swayPhase) * (WATCH.state === "rewind" ? .02 : .045);
    }

    const fx = Math.cos(WATCH.flip * Math.PI);
    const showBack = WATCH.flip > .5;

    ctx.save();
    ctx.globalAlpha = WATCH.alpha;
    if (WATCH.state !== "rewind") drawChain(ctx, cx, cy, r, ang);
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    ctx.scale(Math.max(.05, Math.abs(fx)), 1);
    const facing = fx < 0 ? -1 : 1;

    // 投影
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowBlur = r * .55; ctx.shadowOffsetY = r * .2;
    ctx.fillStyle = "#7a6029";
    ctx.beginPath(); ctx.arc(0, 0, r, 0, U.TAU); ctx.fill();
    ctx.restore();

    // 表壳
    const caseG = ctx.createLinearGradient(-r, -r, r, r);
    caseG.addColorStop(0, "#f4dfa4"); caseG.addColorStop(.26, "#c8a659");
    caseG.addColorStop(.5, "#f8edc8"); caseG.addColorStop(.74, "#b08e40"); caseG.addColorStop(1, "#8a6c31");
    ctx.fillStyle = caseG;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, U.TAU); ctx.fill();
    ctx.strokeStyle = "rgba(255,250,220,.85)"; ctx.lineWidth = r * .045;
    ctx.beginPath(); ctx.arc(0, 0, r * .962, 0, U.TAU); ctx.stroke();
    ctx.strokeStyle = "rgba(88,64,20,.5)"; ctx.lineWidth = r * .03;
    ctx.beginPath(); ctx.arc(0, 0, r * .925, 0, U.TAU); ctx.stroke();

    const rr = r * .84;
    if (!showBack) {
      // 表盘
      const dial = ctx.createRadialGradient(-rr * .28, -rr * .32, rr * .1, 0, 0, rr);
      dial.addColorStop(0, "#fffdf5"); dial.addColorStop(.72, "#f3ebd4"); dial.addColorStop(1, "#d9cba8");
      ctx.fillStyle = dial;
      ctx.beginPath(); ctx.arc(0, 0, rr, 0, U.TAU); ctx.fill();
      ctx.save();
      ctx.scale(facing, 1);
      ctx.fillStyle = "#3a3126"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = `600 ${rr * .16}px ${FF()}`;
      const roman = ["XII", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * U.TAU - Math.PI / 2;
        ctx.fillText(roman[i], Math.cos(a) * rr * .79, Math.sin(a) * rr * .79);
      }
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * U.TAU - Math.PI / 2;
        const inner = i % 5 === 0 ? rr * .65 : rr * .73;
        ctx.strokeStyle = i % 5 === 0 ? "rgba(50,42,30,.78)" : "rgba(72,62,46,.36)";
        ctx.lineWidth = i % 5 === 0 ? rr * .026 : rr * .013;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
        ctx.lineTo(Math.cos(a) * rr * .88, Math.sin(a) * rr * .88);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(60,50,36,.34)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, rr * .33, rr * .29, 0, U.TAU); ctx.stroke();
      drawHand(ctx, WATCH.angHour, rr * .46, rr * .045, "#2f2a20");
      drawHand(ctx, WATCH.angMin, rr * .66, rr * .031, "#2f2a20");
      drawHand(ctx, WATCH.angSec, rr * .74, rr * .015, "#a8332b");
      ctx.fillStyle = "#c9a75a"; ctx.beginPath(); ctx.arc(0, 0, rr * .05, 0, U.TAU); ctx.fill();
      ctx.fillStyle = "#5b4a26"; ctx.beginPath(); ctx.arc(0, 0, rr * .023, 0, U.TAU); ctx.fill();
      ctx.globalAlpha = WATCH.alpha * .45;
      const gl = ctx.createLinearGradient(-rr, -rr, rr * .4, rr * .6);
      gl.addColorStop(0, "rgba(255,255,255,.8)"); gl.addColorStop(.42, "rgba(255,255,255,.06)");
      gl.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gl;
      ctx.beginPath(); ctx.arc(0, 0, rr * .97, 0, U.TAU); ctx.fill();
      ctx.restore();
      // 表冠
      ctx.fillStyle = "#c9a75a";
      U.roundRect(ctx, -r * .1, -r * 1.1, r * .2, r * .17, r * .04); ctx.fill();
      ctx.strokeStyle = "#8a6c31"; ctx.lineWidth = 1; ctx.stroke();
    } else {
      // 背面：时光回溯次数
      const bg = ctx.createRadialGradient(-rr * .3, -rr * .3, rr * .08, 0, 0, rr);
      bg.addColorStop(0, "#f8efcd"); bg.addColorStop(.6, "#ddca90"); bg.addColorStop(1, "#a98b45");
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(0, 0, rr, 0, U.TAU); ctx.fill();
      ctx.save();
      ctx.scale(facing, 1);
      ctx.strokeStyle = "rgba(118,90,34,.42)"; ctx.lineWidth = 1;
      for (let k = 1; k <= 3; k++) { ctx.beginPath(); ctx.arc(0, 0, rr * (.34 + k * .17), 0, U.TAU); ctx.stroke(); }
      for (let k = 0; k < 24; k++) {
        const a = k / 24 * U.TAU;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * rr * .34, Math.sin(a) * rr * .34);
        ctx.lineTo(Math.cos(a) * rr * .87, Math.sin(a) * rr * .87);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(56,42,14,.84)";
      U.roundRect(ctx, -rr * .53, -rr * .31, rr * 1.06, rr * .64, rr * .08); ctx.fill();
      ctx.strokeStyle = "rgba(255,232,170,.72)"; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffe9b0";
      ctx.font = `${rr * .112}px ${FF()}`;
      ctx.fillText("时光回溯", 0, -rr * .155);
      ctx.fillStyle = "#fff8e0";
      ctx.font = `700 ${rr * .295}px ${FF()}`;
      ctx.fillText(String(WATCH.count), 0, rr * .115);
      ctx.fillStyle = "rgba(255,232,170,.72)";
      ctx.font = `${rr * .078}px ${FF()}`;
      ctx.fillText("TIMES OF REWIND", 0, rr * .3);
      ctx.restore();
    }
    ctx.restore();

    // 化作字节上流
    if (WATCH.bytes.length) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const b of WATCH.bytes) {
        ctx.globalAlpha = Math.min(1, b.life);
        ctx.fillStyle = `rgba(${b.c},1)`;
        ctx.font = `${b.s}px "Cascadia Mono",Consolas,monospace`;
        ctx.fillText(b.ch, b.x, b.y);
      }
      ctx.restore();
    }
  }

  function drawHand(ctx, ang, len, wide, color) {
    ctx.save(); ctx.rotate(ang);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-wide, 0); ctx.lineTo(0, -len); ctx.lineTo(wide, 0); ctx.lineTo(0, wide * 1.7);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function drawChain(ctx, cx, cy, r, ang) {
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(ang);
    ctx.strokeStyle = "rgba(228,208,152,.72)"; ctx.lineWidth = Math.max(1.2, r * .026);
    ctx.beginPath(); ctx.moveTo(0, -r * 1.08);
    let y = -r * 1.08;
    for (let i = 1; i <= 7; i++) {
      y -= r * .2;
      ctx.lineTo(Math.sin(i * .9 + performance.now() * .001) * r * .045, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function updateWatch(dt) {
    if (WATCH.flipState === 1) {
      WATCH.flip = Math.min(1, WATCH.flip + dt / 640);
      if (WATCH.flip >= 1) { WATCH.flipState = 2; WATCH.state = "back"; showWatchTip(); }
    }
    if (WATCH.flipState === 3) {
      WATCH.flip = Math.max(0, WATCH.flip - dt / 520);
      if (WATCH.flip <= 0) WATCH.flipState = 0;
    }
    if (WATCH.state === "rewind") {
      WATCH.rewindT += dt;
      WATCH.rewindSpeed = Math.min(.42, WATCH.rewindSpeed + dt * .00045);
      WATCH.angSec -= WATCH.rewindSpeed * dt * .3;
      WATCH.angMin -= WATCH.rewindSpeed * dt * .03;
      WATCH.angHour -= WATCH.rewindSpeed * dt * .0026;
      const step = Math.floor(WATCH.rewindT / 520);
      if (step > WATCH.seasonStep && WATCH.rewindT < 2300 && WATCH.rewindT > 380) {
        WATCH.seasonStep = step;
        const order = ["春", "夏", "秋", "冬"];
        S.season = order[(order.indexOf(S.season) - 1 + 4) % 4];
        const moods = ["sunny", "cloudy", "raining", "foggy"];
        S.mood = moods[(moods.indexOf(S.mood) - 1 + moods.length) % moods.length];
        S.label = U.weatherType({ sunny: 0, cloudy: 3, raining: 61, foggy: 45, snowing: 71 }[S.mood]);
        applySeason();
        updateHUD();
        pulseUpper();
        // 天气回溯同样作用于下部：云量/雨势变化
        if (S.mood === "sunny") { SC.clouds.forEach(c => c.alpha = Math.max(0, c.alpha - .3)); }
        else if (S.mood === "raining") { SC.raining = true; }
      }
      if (WATCH.rewindT > 1400) {
        WATCH.alpha = Math.max(0, 1 - (WATCH.rewindT - 1400) / 900);
        if (Math.random() < .7) {
          const r = WATCH.r;
          WATCH.bytes.push({
            x: WATCH.cx + U.rand(-r, r), y: WATCH.cy + U.rand(-r, r),
            ch: U.pick("01水云河海算力浪潮流未来智".split("")),
            s: U.rand(7, 13), c: U.pick(["150,210,255", "190,230,255", "255,226,160"]),
            vy: U.rand(-.6, -.28), vx: U.rand(-.16, .16), life: 1,
          });
        }
      }
      for (const b of WATCH.bytes) {
        b.x += b.vx * dt * .06; b.y += b.vy * dt * .06; b.life -= dt * .0007;
      }
      WATCH.bytes = WATCH.bytes.filter(b => b.life > 0);
      if (WATCH.rewindT > 2500) {
        WATCH.state = "back"; WATCH.alpha = 0;
        WATCH.count = U.store.timeBack();
        WATCH.flip = 1; WATCH.flipState = 2;
        WATCH.angSec = 0; WATCH.angMin = 0; WATCH.angHour = 0;
        updateHUD();
        const tip = document.getElementById("watch-tip");
        if (tip) L.timeout(() => {
          tip.textContent = "已回溯 " + WATCH.count + " 次 · 点击表盘可再次回溯";
          tip.classList.add("on");
        }, 300);
      }
    }
    if (WATCH.state === "back" && WATCH.alpha < 1 && WATCH.rewindT > 2500) {
      WATCH.alpha = Math.min(1, WATCH.alpha + dt / 700);
    }
    if (WATCH.state === "rewind") {
      // 回溯中指针完全由上面控制
    } else if (WATCH.flip < .5 && (WATCH.state === "settle" || WATCH.state === "drop")) {
      const now = new Date();
      const s = now.getSeconds() + now.getMilliseconds() / 1000;
      const m = now.getMinutes() + s / 60;
      const hh = (now.getHours() % 12) + m / 60;
      WATCH.angSec = (s / 60) * U.TAU;
      WATCH.angMin = (m / 60) * U.TAU;
      WATCH.angHour = (hh / 12) * U.TAU;
    }
  }

  function showWatchTip() {
    const tip = document.getElementById("watch-tip");
    if (!tip) return;
    tip.textContent = "时光已回溯 " + U.store.timeBack() + " 次 · 点击表盘，让江河倒流";
    tip.classList.add("on");
  }

  function pulseUpper() {
    const up = document.getElementById("first-upper");
    if (!up) return;
    up.style.animation = "none";
    void up.offsetWidth;
    up.style.animation = "seasonPulse .9s ease";
  }

  function startFlip() { if (WATCH.flipState === 0) WATCH.flipState = 1; }

  function startRewind() {
    if (WATCH.state === "rewind") return;
    WATCH.state = "rewind";
    WATCH.rewindSpeed = .01;
    WATCH.rewindT = 0;
    WATCH.seasonStep = 0;
    WATCH.bytes = [];
    U.store.addTimeBack();
    const tip = document.getElementById("watch-tip");
    if (tip) { tip.textContent = "时光回溯中 · 江河倒流"; tip.classList.add("on"); }
    pulseUpper();
  }

  /* ================================================================
   * 下部：场景
   * ================================================================ */
  function mkCloud(x, y, w) {
    const cw = U.rand(w * .15, w * .3);
    const c = { x, y, w: cw, h: cw * U.rand(.4, .56), alpha: 1, seed: U.rand(1, 90),
      vx: U.rand(-.1, .1), vy: U.rand(-.02, .02), blobs: [] };
    const parts = U.randInt(8, 14);
    for (let i = 0; i < parts; i++) {
      const a = (i / parts) * U.TAU;
      c.blobs.push({
        x: Math.cos(a) * c.w * .3 * U.rand(.55, 1.1),
        y: Math.sin(a) * c.h * .2 * U.rand(.5, 1.3) - c.h * .05,
        r: c.w * U.rand(.15, .29),
      });
    }
    c.img = renderCloud(c);
    return c;
  }

  function renderCloud(c) {
    const pad = 44;
    const W = Math.round(c.w + pad * 2), H = Math.round(c.h + pad * 2);
    const cv = U.mkCanvas(W, H), x = cv.getContext("2d");
    x.translate(W / 2, H / 2);
    // ① 外圈柔光（棉絮外沿，制造体积与空气感）
    for (const b of c.blobs) {
      const br = b.r * 1.18;
      const g = x.createRadialGradient(b.x - br * .2, b.y - br * .4, br * .05, b.x, b.y, br);
      g.addColorStop(0, "rgba(74,92,118,.46)");
      g.addColorStop(.55, "rgba(40,54,74,.3)");
      g.addColorStop(1, "rgba(26,36,52,0)");
      x.fillStyle = g;
      x.beginPath(); x.arc(b.x, b.y, br, 0, U.TAU); x.fill();
    }
    // ② 云体实心：联合的圆形成起伏清晰的云缘
    const body = x.createLinearGradient(0, -c.h * .66, 0, c.h * .66);
    body.addColorStop(0, "rgba(150,170,196,.99)");
    body.addColorStop(.26, "rgba(112,132,160,.98)");
    body.addColorStop(.56, "rgba(74,92,120,.97)");
    body.addColorStop(.84, "rgba(48,62,86,.96)");
    body.addColorStop(1, "rgba(28,38,56,.92)");
    x.fillStyle = body;
    for (const b of c.blobs) {
      x.beginPath(); x.arc(b.x, b.y, b.r * .99, 0, U.TAU); x.fill();
    }
    // ③ 顶部受光高光
    x.save();
    x.globalCompositeOperation = "lighter";
    for (const b of c.blobs) {
      if (b.y > -c.h * .04) continue;
      const g = x.createRadialGradient(b.x - b.r * .3, b.y - b.r * .52, 0, b.x, b.y - b.r * .28, b.r * .95);
      g.addColorStop(0, "rgba(226,238,252,.34)");
      g.addColorStop(.6, "rgba(200,218,242,.1)");
      g.addColorStop(1, "rgba(220,236,255,0)");
      x.fillStyle = g;
      x.beginPath(); x.arc(b.x, b.y - b.r * .26, b.r * .92, 0, U.TAU); x.fill();
    }
    x.restore();
    // ④ 底部暗影
    for (const b of c.blobs) {
      if (b.y < 0) continue;
      const g = x.createRadialGradient(b.x, b.y + b.r * .34, 0, b.x, b.y + b.r * .22, b.r);
      g.addColorStop(0, "rgba(16,26,42,.36)");
      g.addColorStop(1, "rgba(16,26,42,0)");
      x.fillStyle = g;
      x.beginPath(); x.arc(b.x, b.y + b.r * .3, b.r, 0, U.TAU); x.fill();
    }
    return cv;
  }

  function buildClouds(w, h) {
    SC.clouds = [];
    const n = U.clamp(Math.round(w / 170), 6, 11);
    for (let i = 0; i < n; i++) SC.clouds.push(mkCloud(U.rand(0, w), U.rand(h * .02, h * .19), w));
  }

  function layout() {
    const uw = U.fitCanvas(upperCv);
    wxCtx = uw.ctx;
    initWx(uw.w, uw.h);
    const lw = U.fitCanvas(lowerCv);
    lCtx = lw.ctx;
    SC.w = lw.w; SC.h = lw.h;
    SC.waterY = lw.h * .90;
    SC.sun.x = lw.w * .855; SC.sun.y = lw.h * .13;
    SC.sun.r = U.clamp(lw.w * .028, 22, 48);
    buildClouds(lw.w, lw.h);
    buildGates();
    rebuildGateTexts();
    setupWatch();
  }

  function buildGates() {
    const w = SC.w, h = SC.h;
    const startY = h * .245;
    const avail = SC.waterY - startY;
    const gh = Math.min(avail / 3.72, Math.max(w * .112, 90));
    const gw = gh / .56;
    const gap = (avail - gh * 3) / 4;
    SC.gates = [];
    CAMPUS_ORDER.forEach((id, i) => {
      const data = D.CAMPUS.find(c => c.id === id);
      const g = {
        id, data, x: w * .5 - gw / 2 - w * .035, y: startY + gap * (i + 1) + gh * i,
        w: gw, h: gh, imgCv: null, inkCv: U.mkCanvas(gw, gh), tmpCv: null,
        reveal: 0, full: false, hits: 0, pilePetal: [], hovering: false, overText: false,
        typed: 0, fullText: data.brief, glow: 0, textEl: null, brEl: null,
      };
      g.inkCtx = g.inkCv.getContext("2d");
      g.tmpCv = U.mkCanvas(gw, gh);
      SC.gates.push(g);
      U.loadImg(data.gate).then(im => {
        const cv = U.mkCanvas(gw, gh), cx = cv.getContext("2d");
        const sr = im.width / im.height, dr = gw / gh;
        let sx = 0, sy = 0, sw = im.width, sh = im.height;
        if (sr > dr) { sw = im.height * dr; sx = (im.width - sw) / 2; }
        else { sh = im.width / dr; sy = (im.height - sh) / 2; }
        cx.drawImage(im, sx, sy, sw, sh, 0, 0, gw, gh);
        // 水墨去色
        cx.globalCompositeOperation = "saturation";
        cx.fillStyle = "rgba(120,132,148,.42)"; cx.fillRect(0, 0, gw, gh);
        cx.globalCompositeOperation = "source-over";
        g.imgCv = cv;
      }).catch(() => {});
    });
  }

  function rebuildGateTexts() {
    const lower = document.getElementById("first-lower");
    if (!lower) return;
    lower.querySelectorAll(".gate-txt").forEach(n => n.remove());
    SC.gates.forEach(g => {
      const d = U.el("div", "gate-txt");
      d.innerHTML = `<div class="col">
        <div class="nm">${U.esc(g.data.name)}</div>
        <div class="en">${U.esc(g.data.en)}</div>
        <div class="br"></div></div>`;
      d.style.left = (g.x + g.w + 26) + "px";
      d.style.top = (g.y + 2) + "px";
      lower.appendChild(d);
      g.textEl = d;
      g.brEl = d.querySelector(".br");
      g.typed = 0;
    });
  }

  /* ------- 主循环 ------- */
  function loopLower(dt) {
    const ctx = lCtx;
    if (!ctx) return;
    const f = U.fitCanvas(lowerCv);
    if (f.w !== SC.w || f.h !== SC.h) { SC.w = f.w; SC.h = f.h; SC.waterY = f.h * .9; }
    const w = f.w, h = f.h;
    SC.time += dt;
    const T = SC.time;

    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "rgba(8,16,26,.6)"); sky.addColorStop(.34, "rgba(12,26,40,.52)");
    sky.addColorStop(.7, "rgba(18,36,50,.46)"); sky.addColorStop(1, "rgba(8,18,26,.58)");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);

    // 远岸剪影
    ctx.save();
    ctx.fillStyle = "rgba(7,16,26,.92)";
    ctx.beginPath(); ctx.moveTo(0, SC.waterY);
    for (let x = 0; x <= w; x += 24) {
      const y = SC.waterY - 10 - Math.sin(x * .0055) * 9 - U.fbm(x * .0032, 1.4, 3) * 30;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
    ctx.restore();

    updateClouds(dt, w, h);
    for (const c of SC.clouds) {
      if (c.alpha <= .02) continue;
      ctx.save(); ctx.globalAlpha = c.alpha;
      ctx.drawImage(c.img, c.x - c.w / 2 - 44, c.y - c.h / 2 - 44, c.w + 88, c.h + 88);
      ctx.restore();
    }
    // 太阳画在云之上：雨天刚刚放晴的偏白太阳（点击可驱散所有云）
    drawSun(ctx);

    for (const g of SC.gates) drawGate(ctx, g, T);

    drawWater(ctx, w, h, T);
    updatePetals(dt, w);
    updateRain(dt, w, h);
    drawCursor(ctx, T);

    const vg = ctx.createRadialGradient(w / 2, h * .45, Math.min(w, h) * .3, w / 2, h * .5, Math.max(w, h) * .82);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,4,10,.66)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
  }

  function drawSun(ctx) {
    const s = SC.sun;
    if (!s.visible) return;
    const { x, y, r } = s;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(x, y, r * .15, x, y, r * 7.5);
    g.addColorStop(0, `rgba(255,253,248,${.96 * s.alpha})`);
    g.addColorStop(.06, `rgba(250,250,246,${.88 * s.alpha})`);
    g.addColorStop(.19, `rgba(224,234,244,${.3 * s.alpha})`);
    g.addColorStop(1, "rgba(200,220,240,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 7.5, 0, U.TAU); ctx.fill();
    const c = ctx.createRadialGradient(x - r * .2, y - r * .2, 0, x, y, r);
    c.addColorStop(0, `rgba(255,255,255,${s.alpha})`);
    c.addColorStop(.78, `rgba(249,251,253,${.95 * s.alpha})`);
    c.addColorStop(1, `rgba(226,234,242,${.75 * s.alpha})`);
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, U.TAU); ctx.fill();
    ctx.restore();
  }

  function updateClouds(dt, w, h) {
    const now = performance.now();
    let alive = 0;
    for (const c of SC.clouds) {
      c.x += c.vx; c.y += c.vy;
      if (c.x < -c.w * .7) c.x = w + c.w * .7;
      if (c.x > w + c.w * .7) c.x = -c.w * .7;
      if (c.y < -c.h * .5) c.y = c.h * .5;
      if (c.y > h * .25) c.y = h * .25;
      if (SC.ptr.inside) {
        const d = U.dist(SC.ptr.x, SC.ptr.y, c.x, c.y);
        const rr = c.w * .58;
        if (d < rr) {
          const k = 1 - d / rr;
          c.alpha = Math.max(0, c.alpha - k * dt * .0012);
        }
        if (SC.ptr.down && d < rr * 1.6) c.alpha = Math.max(0, c.alpha - dt * .0018);
      }
      if (SC.sun.dispersing) c.alpha = Math.max(0, c.alpha - dt * .00042);
      if (c.alpha > .06) alive++;
    }
    SC.raining = alive > 0 && now > SC.rainPauseUntil;
    if (alive === 0) {
      if (!SC.cloudlessSince) SC.cloudlessSince = now;
      if (!SC.regenTimer && now - SC.cloudlessSince > 10000) {
        SC.regenTimer = true;
        let k = 0;
        const fresh = [];
        const n = U.clamp(Math.round(w / 170), 6, 11);
        for (let i = 0; i < n; i++) { const c = mkCloud(U.rand(0, w), U.rand(h * .02, h * .19), w); c.alpha = 0; fresh.push(c); }
        SC.clouds = fresh;
        const iv = setInterval(() => {
          if (!L || L.dead) { clearInterval(iv); return; }
          const c = SC.clouds[k % SC.clouds.length];
          if (c) c.alpha = Math.min(1, c.alpha + .09);
          k++;
          if (k > SC.clouds.length * 12) { clearInterval(iv); SC.regenTimer = false; }
        }, 70);
        SC.cloudlessSince = 0;
      }
    } else SC.cloudlessSince = 0;
  }

  function drawWater(ctx, w, h, T) {
    const wy = SC.waterY;
    const g = ctx.createLinearGradient(0, wy, 0, h);
    g.addColorStop(0, "rgba(13,30,42,.82)");
    g.addColorStop(.35, "rgba(9,22,32,.94)");
    g.addColorStop(1, "rgba(4,12,18,.99)");
    ctx.fillStyle = g; ctx.fillRect(0, wy, w, h - wy);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 22; i++) {
      const y = wy + (i / 22) * (h - wy);
      ctx.strokeStyle = `rgba(140,190,230,${.055 * (1 - i / 22)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 12) {
        const yy = y + Math.sin(x * .013 + T * .0015 + i * .7) * (2 + i * .4);
        x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy);
      }
      ctx.stroke();
    }
    for (const r of SC.ripples) {
      ctx.strokeStyle = `rgba(180,220,255,${r.a})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r, r.r * .3, 0, 0, U.TAU); ctx.stroke();
    }
    for (const s of SC.splashes) {
      if (!s.onWater) continue;
      for (const p of s.ps) {
        ctx.fillStyle = `rgba(214,238,255,${Math.min(1, p.life) * .78})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, U.TAU); ctx.fill();
      }
      ctx.strokeStyle = `rgba(190,225,255,${s.a * .45})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(s.x, s.y, s.r * 2.6, s.r * .82, 0, 0, U.TAU); ctx.stroke();
    }
    ctx.restore();
    // 雨打在背景处：水花绽开 + 颜色加深对比
    ctx.save();
    for (const s of SC.splashes) {
      if (s.onWater) continue;
      const rg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3.4);
      rg.addColorStop(0, `rgba(0,6,14,${.46 * s.a})`);
      rg.addColorStop(.55, `rgba(0,10,20,${.18 * s.a})`);
      rg.addColorStop(1, "rgba(0,6,14,0)");
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 3.4, 0, U.TAU); ctx.fill();
      // 水花环
      ctx.strokeStyle = `rgba(200,228,255,${s.a * .4})`;
      ctx.lineWidth = .9;
      ctx.beginPath(); ctx.ellipse(s.x, s.y, s.r * 2.2, s.r * .7, 0, 0, U.TAU); ctx.stroke();
    }
    ctx.restore();
  }

  function updateRain(dt, w, h) {
    // 从云的底部生成（雨从云中下）
    if (SC.raining) {
      const act = SC.clouds.filter(c => c.alpha > .35);
      const want = Math.min(130, act.length * 22);
      let guard = 0;
      while (SC.drops.length < want && guard++ < 10 && act.length) {
        const c = U.pick(act);
        SC.drops.push({ x: c.x + U.rand(-c.w * .4, c.w * .4), y: c.y + c.h * .34,
          v: U.rand(7, 12), len: U.rand(9, 18), a: U.rand(.3, .66) });
      }
    }
    const wy = SC.waterY;
    for (let i = SC.drops.length - 1; i >= 0; i--) {
      const d = SC.drops[i];
      d.y += d.v * dt * .062;
      d.x += SC.wind * dt * .0022;
      // 三座校门上下依次排列、x 区间相同：雨滴不能"命中即销毁"，
      // 否则只有最上面的西康路能显影。这里让雨滴穿过每一张校门画面都洒一次墨。
      for (const g of SC.gates) {
        if (g.full) continue;
        if (d.x > g.x && d.x < g.x + g.w && d.y > g.y && d.y < g.y + g.h) {
          inkStamp(g, d.x - g.x, d.y - g.y);
        }
      }
      if (d.y >= wy) { makeSplash(d.x, wy, true); SC.drops.splice(i, 1); continue; }
      if (d.y > h + 30) SC.drops.splice(i, 1);
    }
    // 打在地面/背景上的雨
    if (SC.raining && Math.random() < .55) {
      for (const g of SC.gates) {
        if (g.full && Math.random() < .5) {
          makeSplash(g.x + U.rand(0, g.w), g.y + g.h - 2, false);
        }
      }
    }
    // 画雨
    const ctx = lCtx;
    ctx.save();
    for (const d of SC.drops) {
      const lg = ctx.createLinearGradient(d.x, d.y, d.x - 1.5, d.y - d.len);
      lg.addColorStop(0, `rgba(232,244,255,${d.a * 1.3})`);
      lg.addColorStop(1, "rgba(150,200,245,0)");
      ctx.strokeStyle = lg; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - 1.5, d.y - d.len); ctx.stroke();
    }
    ctx.restore();

    for (let i = SC.splashes.length - 1; i >= 0; i--) {
      const s = SC.splashes[i];
      s.a -= dt * (s.onWater ? .0018 : .0026);
      s.r += dt * .013;
      if (s.onWater) {
        for (const p of s.ps) {
          p.x += p.vx * dt * .05; p.y += p.vy * dt * .05; p.vy += dt * .0017;
          if (p.y > SC.waterY + 5) p.life = 0;
        }
        s.ps = s.ps.filter(p => (p.life -= dt * .0017) > 0);
      }
      if (s.a <= 0) SC.splashes.splice(i, 1);
    }
    for (let i = SC.ripples.length - 1; i >= 0; i--) {
      const r = SC.ripples[i];
      r.r += dt * .048; r.a -= dt * .0013;
      if (r.a <= 0) SC.ripples.splice(i, 1);
    }
    if (SC.splashes.length > 200) SC.splashes.splice(0, SC.splashes.length - 200);
  }

  function makeSplash(x, y, onWater) {
    const ps = [];
    const n = onWater ? U.randInt(3, 6) : U.randInt(2, 4);
    for (let i = 0; i < n; i++) {
      ps.push({ x, y, vx: U.rand(-.9, .9), vy: U.rand(-1.6, -.5), r: U.rand(.6, 1.6), life: U.rand(.6, 1) });
    }
    SC.splashes.push({ x, y, r: U.rand(1, 2.4), a: U.rand(.5, 1), onWater, ps });
    if (onWater && Math.random() < .5) SC.ripples.push({ x, y, r: 1, a: U.rand(.3, .7) });
  }

  /* ------- 校门 ------- */
  function inkStamp(g, lx, ly) {
    if (g.full) return;
    const ctx = g.inkCtx;
    // 水墨显影：多层不规则"墨瓣"叠印 + 沿纸纤维方向的细晕 + 飞溅墨点。
    // 这张画布只当 alpha 蒙版用（颜色无所谓，形状与透明度才决定显影观感）。
    const base = U.rand(g.h * .07, g.h * .13);
    const lobes = U.randInt(3, 5);
    for (let k = 0; k < lobes; k++) {
      const a = U.rand(0, U.TAU), d = U.rand(0, base * .9);
      const rx = base * U.rand(.7, 1.35), ry = base * U.rand(.7, 1.35);
      const cx2 = lx + Math.cos(a) * d, cy2 = ly + Math.sin(a) * d;
      const grad = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, Math.max(rx, ry));
      grad.addColorStop(0, `rgba(255,255,255,${U.rand(.72, .95)})`);
      grad.addColorStop(.45, `rgba(255,255,255,${U.rand(.5, .7)})`);
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      ctx.save();
      ctx.translate(cx2, cy2); ctx.scale(1, ry / rx);
      ctx.beginPath(); ctx.arc(0, 0, rx, 0, U.TAU); ctx.fill();
      ctx.restore();
    }
    // 纤维晕（横向细长，模拟墨沿纸纹走）
    for (let i = 0; i < 2; i++) {
      const a = U.rand(-.35, .35);
      const len = base * U.rand(2.2, 4.2);
      ctx.save();
      ctx.translate(lx + U.rand(-base, base), ly + U.rand(-base, base));
      ctx.rotate(a);
      const lg = ctx.createLinearGradient(-len / 2, 0, len / 2, 0);
      lg.addColorStop(0, "rgba(255,255,255,0)");
      lg.addColorStop(.5, `rgba(255,255,255,${U.rand(.22, .45)})`);
      lg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = lg;
      ctx.fillRect(-len / 2, -U.rand(.5, 1.4), len, U.rand(1, 2.6));
      ctx.restore();
    }
    // 飞溅墨点
    for (let i = 0; i < 4; i++) {
      const a = U.rand(0, U.TAU), d = U.rand(base * .8, base * 3.4);
      ctx.fillStyle = `rgba(255,255,255,${U.rand(.18, .6)})`;
      ctx.beginPath(); ctx.arc(lx + Math.cos(a) * d, ly + Math.sin(a) * d, U.rand(.7, 2.8), 0, U.TAU); ctx.fill();
    }
    g.hits++;
    const need = 34 + (SC.gates.indexOf(g) + 1) * 14;   // 上→下逐级递进，显影有先后
    g.reveal = Math.min(.94, g.hits / need);
    if (g.hits >= need && !g.full) revealFull(g, false);
  }

  function revealFull(g, byClick) {
    g.full = true; g.glow = 1;
    g.inkCtx.fillStyle = "#fff";
    g.inkCtx.fillRect(0, 0, g.w, g.h);
    g.reveal = 1;
    if (byClick) App.toast(g.data.name + " 已显现 · 悬停书写简介，再点击进入图书馆");
  }

  function drawGate(ctx, g, T) {
    const { x, y, w, h } = g;
    if (g.imgCv) {
      ctx.save();
      if (g.full) {
        ctx.drawImage(g.imgCv, x, y, w, h);
        const dark = (SC.raining || SC.clouds.some(c => c.alpha > .5)) ? .18 : 0;
        if (dark) { ctx.fillStyle = `rgba(4,10,20,${dark})`; ctx.fillRect(x, y, w, h); }
        ctx.globalCompositeOperation = "lighter";
        const gl = .08 + g.glow * .38 + Math.sin(T * .0016) * .03 + (g.hovering ? .12 : 0);
        const gra = ctx.createLinearGradient(x, y, x + w, y);
        gra.addColorStop(0, "rgba(120,180,255,0)");
        gra.addColorStop(.5, `rgba(176,218,255,${gl * .34})`);
        gra.addColorStop(1, "rgba(120,180,255,0)");
        ctx.fillStyle = gra; ctx.fillRect(x, y, w, h);
        if (g.glow > 0) g.glow = Math.max(0, g.glow - .012);
      } else {
        const tc = g.tmpCv.getContext("2d");
        tc.setTransform(1, 0, 0, 1, 0, 0);
        tc.clearRect(0, 0, w, h);
        tc.drawImage(g.imgCv, 0, 0);
        tc.globalCompositeOperation = "destination-in";
        tc.drawImage(g.inkCv, 0, 0);
        tc.globalCompositeOperation = "source-over";
        ctx.globalAlpha = .95;
        ctx.drawImage(g.tmpCv, x, y);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    } else {
      // 图片尚未就绪：画一个工程图式占位框，避免"空一块"的观感
      ctx.save();
      ctx.fillStyle = "rgba(90,120,155,.1)"; ctx.fillRect(x, y, w, h);
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "rgba(150,190,230,.34)"; ctx.lineWidth = 1;
      ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(198,222,246,.5)";
      ctx.font = "11px " + FF();
      ctx.textAlign = "center";
      ctx.fillText(g.data.name + " · 显影中…", x + w / 2, y + h / 2);
      ctx.restore();
    }
    if (g.full) {
      ctx.save();
      ctx.strokeStyle = `rgba(150,200,255,${.2 + g.glow * .3 + (g.hovering ? .34 : 0)})`;
      ctx.lineWidth = 1.2;
      U.roundRect(ctx, x - 4, y - 4, w + 8, h + 8, 6); ctx.stroke();
      ctx.restore();
    } else {
      ctx.save();
      ctx.fillStyle = "rgba(198,222,246,.52)";
      ctx.font = `11px ${FF()}`;
      ctx.textAlign = "center";
      ctx.fillText("雨落成墨 · 显影 " + Math.round(g.reveal * 100) + "%", x + w / 2, y + h + 17);
      ctx.restore();
    }
    if (g.pilePetal && g.pilePetal.length) {
      for (const p of g.pilePetal) {
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = p.a;
        ctx.fillStyle = p.col;
        if (p.type === "梅") {
          for (let i = 0; i < 5; i++) {
            const a = i / 5 * U.TAU;
            ctx.beginPath();
            ctx.ellipse(Math.cos(a) * p.r * .55, Math.sin(a) * p.r * .55, p.r * .52, p.r * .4, a, 0, U.TAU);
            ctx.fill();
          }
          ctx.fillStyle = "rgba(255,238,152,.85)";
          ctx.beginPath(); ctx.arc(0, 0, p.r * .22, 0, U.TAU); ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(0, -p.r);
          ctx.bezierCurveTo(p.r * .92, -p.r * .38, p.r * .68, p.r * .62, 0, p.r);
          ctx.bezierCurveTo(-p.r * .68, p.r * .62, -p.r * .92, -p.r * .38, 0, -p.r);
          ctx.fill();
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
  }

  /* ------- 落花 ------- */
  function spawnPetal(g) {
    const isPlum = g.data.flower === "梅";
    const col = isPlum
      ? U.pick(["rgba(255,198,214,.94)", "rgba(250,174,198,.92)", "rgba(255,224,234,.96)"])
      : U.pick(["rgba(228,66,74,.92)", "rgba(248,122,122,.94)", "rgba(202,42,58,.9)"]);
    SC.petals.push({
      x: g.x + U.rand(g.w * .12, g.w * .88), y: g.y + U.rand(0, g.h * .55),
      vx: U.rand(-.5, .5), vy: U.rand(.26, .8), r: U.rand(3.2, 6.4),
      vx: U.rand(-.5, .5), vy: U.rand(.26, .8), r: U.rand(3.2, 6.4),
      rot: U.rand(0, U.TAU), vr: U.rand(-.004, .004), sway: U.rand(0, U.TAU),
      z: U.rand(.55, 1.25), flip: U.rand(0, U.TAU), vflip: U.rand(-.005, .005),
    });
  }

  function updatePetals(dt, w) {
    const ctx = lCtx;
    for (let i = SC.petals.length - 1; i >= 0; i--) {
      const p = SC.petals[i];
      p.sway += dt * .004;
      p.x += (p.vx + Math.sin(p.sway) * .5) * dt * .06;
      p.y += p.vy * dt * .06;
      p.rot += p.vr * dt * .06;
      p.flip += p.vflip * dt * .06;
      const sq = Math.max(.16, Math.abs(Math.cos(p.flip)));   // 花瓣翻面时的横向压缩（3D 翻转感）
      const g = p.gate;
      if (p.y >= p.groundY) {
        SC.petals.splice(i, 1);
        if (!g.pilePetal) g.pilePetal = [];
        if (g.pilePetal.length < 64) {
          g.pilePetal.push({
            x: p.x, y: g.y + g.h - (g.pilePetal.length % 5) * 1.1 + U.rand(-1.5, 1.5),
            rot: p.rot, r: p.r, col: p.col, type: p.type, a: .94,
          });
        }
        continue;
      }
      if (p.x < -20 || p.x > w + 20) { SC.petals.splice(i, 1); continue; }
      ctx.save();
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(p.z * sq, p.z);
      ctx.globalAlpha = .5 + p.z * .42;
      ctx.fillStyle = p.col;
      if (p.type === "梅") {
        for (let k = 0; k < 5; k++) {
          const a = k / 5 * U.TAU;
          ctx.beginPath();
          ctx.ellipse(Math.cos(a) * p.r * .55, Math.sin(a) * p.r * .55, p.r * .52, p.r * .4, a, 0, U.TAU);
          ctx.fill();
        }
        ctx.fillStyle = "rgba(255,238,152,.85)";
        ctx.beginPath(); ctx.arc(0, 0, p.r * .22, 0, U.TAU); ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -p.r);
        ctx.bezierCurveTo(p.r * .92, -p.r * .38, p.r * .68, p.r * .62, 0, p.r);
        ctx.bezierCurveTo(-p.r * .68, p.r * .62, -p.r * .92, -p.r * .38, 0, -p.r);
        ctx.fill();
        ctx.strokeStyle = "rgba(110,18,28,.35)"; ctx.lineWidth = .6; ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawCursor(ctx, T) {
    const p = SC.ptr;
    if (!p.inside) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const r = p.down ? 26 : 17;
    U.glowCircle(ctx, p.x, p.y, r, "160,215,255", p.down ? .5 : .28);
    ctx.strokeStyle = "rgba(212,238,255,.9)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(p.x, p.y, r * .33, 0, U.TAU); ctx.stroke();
    ctx.strokeStyle = "rgba(190,225,255,.5)";
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * U.TAU + T * .001;
      ctx.beginPath();
      ctx.moveTo(p.x + Math.cos(a) * r * .5, p.y + Math.sin(a) * r * .5);
      ctx.lineTo(p.x + Math.cos(a) * r * .82, p.y + Math.sin(a) * r * .82);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ================================================================
   * 交互
   * ================================================================ */
  function gateAt(x, y) {
    for (const g of SC.gates) {
      if (x > g.x - 6 && x < g.x + g.w + 6 && y > g.y - 6 && y < g.y + g.h + 8) return g;
    }
    return null;
  }

  function tickTyping() {
    for (const g of SC.gates) {
      if (!g.full || !g.textEl || !g.brEl) continue;
      if ((g.hovering || g.overText) && g.typed < g.fullText.length) {
        g.typed = Math.min(g.fullText.length, g.typed + 2);
        g.brEl.innerHTML = U.esc(g.fullText.slice(0, g.typed)) +
          (g.typed < g.fullText.length ? '<span class="cur"></span>' : "");
      }
      if (g.hovering && Math.random() < .28) spawnPetal(g);
    }
  }

  function bindLowerEvents() {
    const lower = document.getElementById("first-lower");
    L.on(lower, "pointermove", (e) => {
      const r = lower.getBoundingClientRect();
      SC.ptr.x = e.clientX - r.left; SC.ptr.y = e.clientY - r.top; SC.ptr.inside = true;
      const hovered = gateAt(SC.ptr.x, SC.ptr.y);
      for (const g of SC.gates) {
        const wasHover = g.hovering;
        g.hovering = (g === hovered && g.full);
        if (g.hovering && !wasHover && g.textEl) g.textEl.classList.add("on");
        if (!g.hovering && !g.overText && g.textEl) g.textEl.classList.remove("on");
      }
    });
    L.on(lower, "pointerleave", () => {
      SC.ptr.inside = false;
      for (const g of SC.gates) { g.hovering = false; if (g.textEl && !g.overText) g.textEl.classList.remove("on"); }
    });
    L.on(lower, "pointerdown", (e) => {
      SC.ptr.down = true;
      const r = lower.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      SC.ptr.x = x; SC.ptr.y = y;
      if (SC.sun.visible && U.dist(x, y, SC.sun.x, SC.sun.y) < SC.sun.r * 2.4) { dispelBySun(); return; }
      const g = gateAt(x, y);
      if (g) {
        if (!g.full) { if (g.reveal > .1) revealFull(g, true); return; }
        g.glow = 1.4;
        App.setCampus(g.id);
        App.toast("进入 " + g.data.name + " 图书馆…");
        L.timeout(() => App.navigate("library", { campus: g.id }), 560);
        return;
      }
      for (const c of SC.clouds) {
        if (U.dist(x, y, c.x, c.y) < c.w * .95) c.alpha = Math.max(0, c.alpha - .4);
      }
    });
    L.on(window, "pointerup", () => { SC.ptr.down = false; });

    SC.gates.forEach(g => {
      if (!g.textEl) return;
      L.on(g.textEl, "pointerenter", () => { g.overText = true; g.textEl.classList.add("on"); });
      L.on(g.textEl, "pointerleave", () => {
        g.overText = false;
        if (!g.hovering) g.textEl.classList.remove("on");
      });
    });
  }

  function dispelBySun() {
    SC.rainPauseUntil = performance.now() + 30000;
    SC.sun.dispersing = true;
    App.toast("云开日见 · 雨停三十秒");
    let k = 0;
    const iv = setInterval(() => {
      if (!L || L.dead) { clearInterval(iv); return; }
      k++;
      SC.clouds.forEach(c => { c.alpha = Math.max(0, c.alpha - .04); });
      if (k > 30) { clearInterval(iv); SC.sun.dispersing = false; }
    }, 110);
  }

  /* ================================================================
   * HUD
   * ================================================================ */
  function updateHUD() {
    const hud = document.getElementById("first-hud");
    const dt = document.getElementById("first-date");
    if (!hud) return;
    const t = U.nowNanjing();
    hud.innerHTML = `<div class="sm">南京 · 江宁 &nbsp;|&nbsp; 实时接入</div>
      <div><b>${S.season}</b> · ${U.phaseLabel(S.phase)} · ${U.esc(S.label)}${S.temp != null ? " · " + Math.round(S.temp) + "°C" : ""}</div>`;
    if (dt) dt.innerHTML = `<div class="big">${t.dateText}</div>
      <div>${t.hm} <span style="opacity:.55">NANJING</span></div>
      <div style="margin-top:5px;color:#ffe4b0">时光回溯 ${U.store.timeBack()} 次</div>`;
  }

  /* ================================================================
   * 生命周期
   * ================================================================ */
  let lastT = 0;

  function enter() {
    L = U.life();
    const p = document.getElementById("page-first");
    if (!p) return;
    if (!p.dataset.built) {
      p.innerHTML = `
        <div id="first-root">
          <div id="first-upper">
            <canvas id="wx-cv"></canvas>
            <div id="first-hud"></div>
            <div id="first-date"></div>
            <div id="watch-stage"><canvas id="watch-cv"></canvas><div id="watch-tip"></div></div>
          </div>
          <div id="first-lower">
            <canvas id="lower-cv"></canvas>
            <div id="lower-hint">雨水成墨，校门自现 —— 移到<b>云</b>上可蒸散阴云，点<b>校门</b>进入图书馆，点右上<b>太阳</b>驱散降雨</div>
          </div>
        </div>`;
      p.dataset.built = "1";
    }
    upperCv = document.getElementById("wx-cv");
    wxCtx = upperCv.getContext("2d");
    watchCv = document.getElementById("watch-cv");
    lowerCv = document.getElementById("lower-cv");
    lCtx = lowerCv.getContext("2d");

    const t = U.nowNanjing();
    S.season = U.seasonOf(t.month);
    S.phase = U.dayPhase(t.hour, t.minute);
    S.light = U.lightLevel(t.hour, t.minute);
    const w = App.getWeather();
    if (w) {
      S.mood = U.weatherMood(w.code, w.rain, w.snow);
      S.label = U.weatherType(w.code);
      S.temp = w.temp;
    } else { S.mood = "raining"; S.label = "雨"; S.temp = null; }

    SC.petals = []; SC.drops = []; SC.splashes = []; SC.ripples = [];
    SC.clouds = []; SC.regenTimer = false; SC.cloudlessSince = 0; SC.rainPauseUntil = 0;
    SC.sun = { x: 0, y: 0, r: 40, alpha: 1, visible: true, dispersing: false };
    SC.raining = true;

    buildLayers();
    layout();
    applySeason(true);
    updateHUD();
    L.interval(updateHUD, 1000);
    L.on(window, "resize", U.debounce(() => { layout(); }, 260));

    WATCH.state = "drop"; WATCH.flip = 0; WATCH.flipState = 0;
    startWatch();
    // 甩下摆动结束后自转到背面，显示时光回溯总次数
    L.timeout(() => startFlip(), 2400);

    lastT = performance.now();
    L.loop(() => {
      const now = performance.now();
      const dt = Math.min(50, now - lastT);
      lastT = now;
      const uw = U.fitCanvas(upperCv);
      wxCtx = uw.ctx;
      drawUpperWeather(dt, uw.w, uw.h);
      updateWatch(dt);
      drawWatch(dt);
      loopLower(dt);
    });
    L.interval(tickTyping, 40);
    bindLowerEvents();
  }

  function leave() {
    if (L) { L.kill(); L = null; }
    if (layoutTimer) { clearTimeout(layoutTimer); layoutTimer = null; }
    const lower = document.getElementById("first-lower");
    if (lower) lower.style.cursor = "";
    document.querySelectorAll("#page-first .gate-txt").forEach(n => n.remove());
    SC.petals = []; SC.drops = []; SC.splashes = []; SC.ripples = [];
  }

  /* 怀表点击 */
  document.addEventListener("click", (e) => {
    if (!L || L.dead) return;
    if (e.target.id !== "watch-cv") return;
    if (WATCH.state === "drop") return;
    if (WATCH.flip < .5) { startFlip(); return; }
    if (WATCH.state === "rewind") return;
    startRewind();
  });

  App.register("first", { enter, leave });
})();

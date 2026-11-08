/* ============================================================
 * 水利家国 · 十项大国重器
 *   背景：与名贤堂共用的陈列馆内墙 + 暖色环境光 + 射灯锥形光 + 漂浮尘埃
 *   图纸：10 张工程图纸横向首尾循环（与名贤堂同尺寸）
 *        长按 → 线条逐段描出建筑框架；第一次点击 → 建筑体上色；
 *        第二次点击 → 周边背景上色并弹出介绍
 *   修进：App.isUpgraded() 为真时 → 蓝色赛博背景、图纸缩为右上角一叠、
 *        中央电子全息屏；点击翻卡片，长按拖拽到全息屏 → 发光像素格自动绘图
 *
 * 【"单次进入网站不可重复绘画"的持久化策略】
 *   模块加载时生成一次性 LOAD_ID（本次页面载入的随机指纹），
 *   已完成的图纸记在 U.store("waterPainted") = { loadId, marks:{ 名称: 1|2|3 } }。
 *   进入页面时若记录里的 loadId 与当前 LOAD_ID 不一致，说明是新的载入
 *   （刷新 / 新标签打开），就把 marks 清空，于是可以重新绘画；
 *   同一次载入内（含反复进出本页），marks 始终保留 → 再点击只弹介绍、不重画。
 *   注意刻意不用 sessionStorage：它跨刷新仍然存在，会挡住"刷新后可重来"。
 * ============================================================ */
(function () {
  const U = window.Utils, D = window.DATA;

  /* 本次载入的会话指纹（刷新即变） */
  const LOAD_ID = "L" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  /* ============================================================
   * 样式
   * ============================================================ */
  U.injectCSS("css-water", `
  #wa-root{position:absolute;inset:0;overflow:hidden;background:#050b16;}
  #wa-bg{position:absolute;inset:-2%;background:#0b0f16 center/cover no-repeat;
    transition:filter 1.6s ease;will-change:filter;}
  #wa-bg::after{content:"";position:absolute;inset:0;
    background:linear-gradient(180deg,rgba(4,8,16,.42) 0%,rgba(4,8,16,.08) 34%,rgba(2,6,12,.55) 100%);}
  #wa-warm{position:absolute;inset:0;pointer-events:none;mix-blend-mode:screen;
    background:
      radial-gradient(56% 44% at 50% 28%, rgba(255,214,158,.28), transparent 72%),
      radial-gradient(78% 58% at 10% 80%, rgba(255,168,88,.16), transparent 70%),
      radial-gradient(90% 78% at 90% 20%, rgba(120,170,255,.10), transparent 74%);
    animation:waWarm 9s ease-in-out infinite;}
  @keyframes waWarm{0%,100%{opacity:.8}50%{opacity:1}}
  #wa-cones{position:absolute;inset:0;overflow:hidden;pointer-events:none;}
  .wa-cone{position:absolute;top:-8%;height:118%;transform-origin:50% 0;
    background:linear-gradient(to bottom, rgba(255,236,198,.30), rgba(255,226,176,.09) 44%, rgba(255,220,170,0) 84%);
    filter:blur(15px);mix-blend-mode:screen;opacity:.75;
    clip-path:polygon(47.5% 0,52.5% 0,100% 100%,0 100%);}
  .wa-cone.c1{left:2%;width:26%;animation:waSway 11s ease-in-out infinite alternate;}
  .wa-cone.c2{left:36%;width:30%;animation:waSway 13.5s ease-in-out infinite alternate-reverse;}
  .wa-cone.c3{left:71%;width:25%;animation:waSway 9.5s ease-in-out infinite alternate;}
  @keyframes waSway{0%{transform:rotate(-3.4deg) scaleY(.95);opacity:.5}100%{transform:rotate(3.6deg) scaleY(1.05);opacity:.9}}
  #wa-dust{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}
  #wa-cyber{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity 1.6s ease;
    mix-blend-mode:screen;
    background:
      repeating-linear-gradient(0deg, rgba(90,190,255,.055) 0 1px, transparent 1px 4px),
      radial-gradient(64% 54% at 50% 44%, rgba(26,132,255,.22), transparent 72%),
      linear-gradient(180deg, rgba(8,40,96,.28), rgba(2,12,32,.5));}
  #wa-cyber::after{content:"";position:absolute;left:0;right:0;height:36%;
    background:linear-gradient(180deg,transparent,rgba(120,220,255,.14),transparent);
    animation:waCyberScan 7.5s linear infinite;}
  @keyframes waCyberScan{0%{transform:translateY(-40%)}100%{transform:translateY(240%)}}
  .up #wa-cyber{opacity:1;}
  .up #wa-bg{filter:hue-rotate(172deg) saturate(.68) brightness(.6) contrast(1.08);}

  /* ---- 标题 ---- */
  #wa-title{position:absolute;left:34px;top:24px;z-index:40;pointer-events:none;
    font-family:var(--f-kai);font-size:clamp(12px,1.05vw,15px);letter-spacing:.26em;
    color:#f2e3c6;text-indent:.26em;
    text-shadow:0 2px 14px rgba(0,0,0,.9),0 0 34px rgba(255,200,120,.28);}
  #wa-title::after{content:"";display:block;width:56px;height:1px;margin-top:9px;
    background:linear-gradient(90deg,rgba(242,214,158,.85),transparent);}
  #wa-title em{display:block;font-style:normal;margin-top:7px;font-family:var(--f-mono);
    font-size:max(8px,.62vw);letter-spacing:.3em;color:#a9bdd6;}
  .up #wa-title{color:#c3e8ff;text-shadow:0 2px 14px rgba(0,0,0,.9),0 0 30px rgba(90,200,255,.6);}

  /* ---- 图纸 ---- */
  #wa-rail{position:absolute;inset:0;z-index:20;transition:opacity .6s ease,filter .6s ease;}
  #wa-root.intro-open #wa-rail{opacity:.5;filter:brightness(.72);}
  #wa-root.intro-open #wa-holo{opacity:.16;}
  .wa-card{position:absolute;left:0;top:0;transform-origin:50% 50%;perspective:1000px;
    will-change:transform,opacity;touch-action:none;cursor:pointer;
    transition:transform .9s cubic-bezier(.22,.61,.36,1),opacity .55s ease,filter .6s ease;}
  .wa-card .wa-sheet{position:absolute;inset:0;overflow:hidden;border-radius:2px;
    background:linear-gradient(158deg,#0d3159 0%,#08213e 44%,#050e1c 100%);
    box-shadow:0 20px 42px rgba(0,0,0,.62),0 0 0 1px rgba(150,200,255,.3),
      inset 0 0 0 1px rgba(190,225,255,.09),inset 0 0 46px rgba(24,80,150,.4);
    transition:box-shadow .5s ease;transform-style:preserve-3d;}
  .wa-grid{position:absolute;inset:0;
    background-image:
      linear-gradient(rgba(152,205,255,.075) 1px,transparent 1px),
      linear-gradient(90deg,rgba(152,205,255,.075) 1px,transparent 1px),
      linear-gradient(rgba(152,205,255,.14) 1px,transparent 1px),
      linear-gradient(90deg,rgba(152,205,255,.14) 1px,transparent 1px);
    background-size:13px 13px,13px 13px,65px 65px,65px 65px;
    -webkit-mask-image:radial-gradient(130% 130% at 50% 40%,#000 42%,rgba(0,0,0,.5) 100%);
    mask-image:radial-gradient(130% 130% at 50% 40%,#000 42%,rgba(0,0,0,.5) 100%);}
  .wa-photo{position:absolute;inset:0;background-position:center;background-size:cover;
    filter:grayscale(1) contrast(1.2) brightness(.95);opacity:.2;mix-blend-mode:screen;
    transition:opacity 1s ease;}
  .wa-draw{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}
  .wa-vig{position:absolute;inset:0;pointer-events:none;
    background:radial-gradient(120% 100% at 50% 42%,transparent 44%,rgba(0,6,16,.5) 100%);}
  .wa-head{position:absolute;left:7px;top:6px;display:flex;gap:7px;align-items:baseline;
    font-family:var(--f-mono);font-size:max(6.5px,calc(var(--cw) * .026));
    letter-spacing:.1em;color:#8db6dd;pointer-events:none;}
  .wa-head b{font-weight:400;color:#c8e2ff;}
  .wa-tb{position:absolute;right:6px;bottom:6px;padding:5px 8px 4px;
    min-width:38%;border:1px solid rgba(160,205,255,.32);background:rgba(5,20,42,.62);
    pointer-events:none;line-height:1.3;}
  .wa-tb .n{font-family:var(--f-kai);font-size:max(7.5px,calc(var(--cw) * .038));
    color:#e2efff;letter-spacing:.06em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .wa-tb .s{font-family:var(--f-mono);font-size:max(6px,calc(var(--cw) * .024));
    color:#8fb4d8;letter-spacing:.04em;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .wa-badge{position:absolute;left:50%;bottom:calc(var(--cw) * .12);transform:translateX(-50%);
    font-family:var(--f-song);font-size:max(6.5px,calc(var(--cw) * .028));letter-spacing:.18em;
    color:#d6e9ff;padding:3px 9px;border:1px solid rgba(170,215,255,.32);border-radius:99px;
    background:rgba(6,24,48,.66);white-space:nowrap;pointer-events:none;text-indent:.18em;
    opacity:0;transition:opacity .45s ease;}
  .wa-card.center .wa-badge{opacity:.92;}
  .wa-badge.gold{color:#ffe1a6;border-color:rgba(240,205,140,.55);background:rgba(48,32,8,.6);}
  .wa-scan{position:absolute;inset:-40% 0;opacity:0;transition:opacity .3s;pointer-events:none;
    background:linear-gradient(180deg,transparent 46%,rgba(150,220,255,.16) 49%,
      rgba(215,245,255,.5) 50%,rgba(150,220,255,.16) 51%,transparent 54%);
    animation:waHold .95s linear infinite;}
  @keyframes waHold{0%{transform:translateY(-30%)}100%{transform:translateY(30%)}}
  .wa-card.holding .wa-scan{opacity:1;}
  .wa-card.center .wa-sheet{box-shadow:0 26px 56px rgba(0,0,0,.7),0 0 0 1px rgba(170,215,255,.55),
    0 0 44px rgba(60,140,230,.35),inset 0 0 0 1px rgba(210,238,255,.14),inset 0 0 60px rgba(30,96,176,.45);}
  .wa-card.press .wa-sheet{filter:brightness(1.18);}
  .wa-card.dragging{opacity:.35;filter:grayscale(.6) brightness(.7);}
  .wa-card.flip .wa-sheet{animation:waFlip .55s cubic-bezier(.38,.05,.32,1);}
  @keyframes waFlip{
    0%{transform:rotateY(0deg)}42%{transform:rotateY(-74deg);filter:brightness(2.1)}
    58%{transform:rotateY(-88deg);filter:brightness(2.4)}100%{transform:rotateY(0deg)}}
  .up .wa-card{cursor:grab;}
  .up .wa-card.center .wa-sheet{box-shadow:0 18px 34px rgba(0,0,0,.7),0 0 0 1px rgba(120,225,255,.6),
    0 0 30px rgba(50,180,255,.45);}

  /* ---- 拖拽幽灵 ---- */
  .wa-ghost{position:absolute;left:0;top:0;z-index:80;pointer-events:none;
    transition:transform .32s cubic-bezier(.2,.7,.3,1),opacity .4s ease;transform-origin:50% 50%;}
  .wa-ghost .wa-gsheet{position:absolute;inset:0;border-radius:2px;overflow:hidden;
    background:linear-gradient(158deg,#0d3159,#08213e 44%,#050e1c);
    box-shadow:0 22px 48px rgba(0,0,0,.7),0 0 0 1px rgba(140,225,255,.7),
      0 0 46px rgba(50,170,255,.55);}
  .wa-ghost img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
  .wa-ghost .wa-gtag{position:absolute;left:50%;top:-26px;transform:translateX(-50%);
    font-family:var(--f-mono);font-size:11px;letter-spacing:.16em;color:#9ff0ff;white-space:nowrap;
    text-shadow:0 0 12px rgba(60,200,255,.9);}

  /* ---- 全息屏 ---- */
  #wa-holo{position:absolute;left:50%;top:50%;z-index:26;opacity:0;pointer-events:none;
    border-radius:5px;overflow:hidden;transition:opacity 1.1s ease;
    background:radial-gradient(120% 100% at 50% 40%,rgba(8,40,86,.7),rgba(2,10,26,.9));
    box-shadow:0 0 0 1px rgba(120,225,255,.45),0 0 40px rgba(40,160,255,.32),
      0 0 120px rgba(20,110,220,.24),inset 0 0 70px rgba(20,120,220,.32);
    animation:waFloat 8.5s ease-in-out infinite;}
  @keyframes waFloat{0%,100%{transform:translate(-50%,-50%) translateY(-7px)}
    50%{transform:translate(-50%,-50%) translateY(7px)}}
  .up #wa-holo{opacity:1;pointer-events:auto;}
  #wa-holo-cv{position:absolute;inset:0;width:100%;height:100%;}
  #wa-holo .wa-scanl{position:absolute;inset:0;pointer-events:none;
    background:repeating-linear-gradient(0deg,rgba(140,230,255,.06) 0 1px,transparent 1px 3px);}
  #wa-holo .wa-cn{position:absolute;width:16px;height:16px;pointer-events:none;
    border:1px solid rgba(150,240,255,.85);box-shadow:0 0 10px rgba(90,220,255,.8);}
  #wa-holo .wa-cn.a{left:7px;top:7px;border-right:0;border-bottom:0;}
  #wa-holo .wa-cn.b{right:7px;top:7px;border-left:0;border-bottom:0;}
  #wa-holo .wa-cn.c{left:7px;bottom:7px;border-right:0;border-top:0;}
  #wa-holo .wa-cn.d{right:7px;bottom:7px;border-left:0;border-top:0;}
  #wa-hud{position:absolute;left:0;right:0;bottom:0;padding:12px 18px 14px;pointer-events:none;
    font-family:var(--f-mono);letter-spacing:.14em;
    background:linear-gradient(180deg,rgba(2,12,28,0),rgba(2,12,28,.78) 42%,rgba(2,12,28,.94));}
  #wa-hud .row{display:flex;justify-content:space-between;align-items:baseline;}
  #wa-hud .t{font-size:max(9px,.78vw);color:#8fe8ff;text-shadow:0 0 14px rgba(60,210,255,.9);}
  #wa-hud .n{font-family:var(--f-song);font-size:max(8px,.7vw);color:#a8cbe6;margin-top:5px;
    letter-spacing:.2em;}
  #wa-hud .p{height:2px;margin-top:8px;background:rgba(80,190,255,.16);overflow:hidden;}
  #wa-hud .p i{display:block;height:100%;width:0%;background:linear-gradient(90deg,#1f8fd0,#9ff4ff);
    box-shadow:0 0 12px rgba(120,235,255,.95);transition:width .12s linear;}
  #wa-hud .tl{font-size:max(9px,.78vw);color:#79d8f5;opacity:.8;}

  /* ---- 介绍卡片（宣纸 / 全息） ---- */
  #wa-intro{position:absolute;left:50%;top:50%;z-index:70;width:min(640px,86vw);
    transform:translate(-50%,-50%) translateY(16px);opacity:0;pointer-events:none;
    transition:opacity .5s ease,transform .6s cubic-bezier(.2,.7,.3,1);}
  #wa-intro.on{opacity:1;pointer-events:auto;transform:translate(-50%,-50%) translateY(0);}
  .wa-paper{position:relative;padding:clamp(20px,3.4vh,34px) clamp(22px,3vw,40px);
    background:linear-gradient(158deg,rgba(250,244,229,.95),rgba(227,212,182,.93));
    border:1px solid rgba(176,146,96,.5);
    box-shadow:0 34px 90px rgba(0,0,0,.62),inset 0 0 70px rgba(205,175,124,.22),
      inset 0 0 0 1px rgba(255,252,242,.55);}
  .wa-paper::before{content:"";position:absolute;inset:0;opacity:.5;pointer-events:none;
    mix-blend-mode:multiply;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.86' numOctaves='4'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23p)' opacity='.2'/%3E%3C/svg%3E");}
  .wa-paper::after{content:"";position:absolute;left:14px;right:14px;top:14px;bottom:14px;
    border:1px solid rgba(176,146,96,.32);pointer-events:none;}
  .wa-seal{position:absolute;right:16px;top:14px;padding:4px 7px;border:1px solid rgba(178,54,43,.6);
    color:rgba(178,54,43,.9);font-family:var(--f-kai);font-size:12px;letter-spacing:.14em;
    transform:rotate(-4deg);line-height:1.1;text-indent:.14em;z-index:3;}
  .wa-i-t{font-family:var(--f-kai);font-size:clamp(17px,1.9vw,25px);color:#15375c;
    letter-spacing:.16em;line-height:1.35;}
  .wa-i-s{margin-top:7px;font-family:var(--f-song);font-size:clamp(9px,.9vw,12px);
    color:#8b7550;letter-spacing:.16em;}
  .wa-i-line{height:1px;margin:14px 0 13px;
    background:linear-gradient(90deg,rgba(150,120,70,.55),rgba(150,120,70,.06));}
  .wa-i-body{font-family:var(--f-song);font-size:clamp(11px,1.02vw,14px);line-height:2.06;
    color:#2f4361;letter-spacing:.055em;text-align:justify;max-height:46vh;overflow:auto;}
  .wa-i-foot{margin-top:16px;display:flex;justify-content:space-between;align-items:center;
    font-family:var(--f-mono);font-size:clamp(8px,.72vw,10px);letter-spacing:.2em;color:#8e7a55;}
  .wa-i-close{position:absolute;right:8px;bottom:6px;width:30px;height:30px;border:0;
    background:transparent;color:#8e7a55;font-size:19px;line-height:1;cursor:pointer;
    font-family:var(--f-hei);transition:color .3s,transform .3s;}
  .wa-i-close:hover{color:#b8362b;transform:rotate(90deg);}
  #wa-intro.up .wa-paper{background:linear-gradient(158deg,rgba(7,32,62,.93),rgba(3,14,32,.95));
    border-color:rgba(120,220,255,.5);
    box-shadow:0 34px 90px rgba(0,0,0,.7),0 0 50px rgba(40,170,255,.28),
      inset 0 0 70px rgba(20,110,200,.28),inset 0 0 0 1px rgba(150,235,255,.14);}
  #wa-intro.up .wa-paper::before{opacity:.16;mix-blend-mode:screen;}
  #wa-intro.up .wa-paper::after{border-color:rgba(120,220,255,.28);}
  #wa-intro.up .wa-seal{border-color:rgba(120,220,255,.65);color:rgba(160,235,255,.95);}
  #wa-intro.up .wa-i-t{color:#d8f2ff;text-shadow:0 0 22px rgba(80,200,255,.55);}
  #wa-intro.up .wa-i-s{color:#7fb6d8;}
  #wa-intro.up .wa-i-line{background:linear-gradient(90deg,rgba(110,215,255,.6),transparent);}
  #wa-intro.up .wa-i-body{color:#bfe2f8;}
  #wa-intro.up .wa-i-foot{color:#6f9ec0;}
  #wa-intro.up .wa-i-close{color:#8fd4ef;}

  @media (max-width:760px){
    #wa-title{left:16px;top:16px;letter-spacing:.2em;}
    .wa-i-body{max-height:40vh;}
    #wa-intro{top:48%;}
  }
  `);

  /* ============================================================
   * 工程描述表（让每张图纸的关键数字都贴合真实工程）
   * ============================================================ */
  const SPEC = {
    "佛子岭水库": { h: "74.4", L: "510", k1: "20 孔连拱", k2: "1954" },
    "葛洲坝水利枢纽": { h: "47.0", L: "2595", k1: "27 孔泄水闸", k2: "1988" },
    "三峡大坝": { h: "185", L: "2309", k1: "泄洪深孔 23 孔", k2: "2009" },
    "大亚湾核电站港口工程": { h: "15.0", L: "400", k1: "取排水口", k2: "1994" },
    "南水北调工程": { h: "6.0", L: "1432", k1: "1 : 2.5 边坡", k2: "2014" },
    "向家坝水电站": { h: "162", L: "909", k1: "12 台机组", k2: "2014" },
    "溪洛渡水电站": { h: "285.5", L: "698", k1: "18 孔泄洪表孔", k2: "2014" },
    "乌东德水电站": { h: "270", L: "988", k1: "最薄 300 米级", k2: "2020" },
    "白鹤滩水电站": { h: "289", L: "709", k1: "16 台百万机组", k2: "2022" },
    "赣江尾闾整治": { h: "12.5", L: "4 支联合", k1: "四支拦河闸", k2: "2026" },
  };

  /* ============================================================
   * 一、制图几何库（设计坐标系 1000 × 562.5，与 16:9 图纸一致）
   * ============================================================ */
  const DW = 1000, DH = 562.5, TAU = U.TAU;

  function quadPts(p0, c, p1, n) {
    const out = [];
    for (let i = 1; i <= n; i++) {
      const t = i / n, u = 1 - t;
      out.push([
        u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0],
        u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1],
      ]);
    }
    return out;
  }
  function wavy(x0, x1, y, amp, per) {
    const out = [];
    for (let x = x0; x <= x1 + .01; x += 5) out.push([x, y + Math.sin((x - x0) / per) * amp]);
    return out;
  }
  function circlePts(cx, cy, r, n, a0, a1) {
    const s = a0 == null ? 0 : a0, e = a1 == null ? TAU : a1, out = [];
    const m = n || 28;
    for (let i = 0; i <= m; i++) {
      const a = s + (e - s) * i / m;
      out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return out;
  }
  function rectPts(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]]; }
  function polyLen(pts) {
    let L = 0;
    for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return L;
  }
  function bbox(pts) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of pts) {
      if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1];
    }
    return [x0, y0, x1, y1];
  }
  /* 多边形内 45° 剖面线（扫描线求交 + 奇偶配对，再旋转回去） */
  function hatchPoly(pts, gap, ang) {
    const bb = bbox(pts), cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2;
    const ca = Math.cos(-ang), sa = Math.sin(-ang), cb = Math.cos(ang), sb = Math.sin(ang);
    const rot = pts.map(p => {
      const dx = p[0] - cx, dy = p[1] - cy;
      return [cx + dx * ca - dy * sa, cy + dx * sa + dy * ca];
    });
    let y0 = 1e9, y1 = -1e9;
    rot.forEach(p => { if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; });
    const out = [];
    const n = rot.length;
    for (let y = y0 + gap * .6; y < y1; y += gap) {
      const xs = [];
      for (let i = 0; i < n; i++) {
        const a = rot[i], b = rot[(i + 1) % n];
        if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
          const t = (y - a[1]) / (b[1] - a[1]);
          xs.push(a[0] + (b[0] - a[0]) * t);
        }
      }
      xs.sort((m, k) => m - k);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        if (xs[i + 1] - xs[i] < 2) continue;
        const p1 = [cx + (xs[i] - cx) * cb - (y - cy) * sb, cy + (xs[i] - cx) * sb + (y - cy) * cb];
        const p2 = [cx + (xs[i + 1] - cx) * cb - (y - cy) * sb, cy + (xs[i + 1] - cx) * sb + (y - cy) * cb];
        out.push([p1, p2]);
      }
    }
    return out;
  }

  /* 图元累加器 */
  function G() {
    const o = { strokes: [], dims: [], labels: [], bodies: [], regions: [], spread: [500, 380] };
    o.s = (pts, op) => {
      o.strokes.push(Object.assign({ pts, w: 1.4, a: .9, c: "216,238,255", dash: 0, at: 0, span: .45 }, op || {}));
    };
    o.h = (poly, op) => {
      const q = op || { };
      const gap = q.gap || 12, ang = q.ang == null ? Math.PI * .25 : q.ang;
      const at = q.at == null ? .55 : q.at, span = q.span == null ? .42 : q.span;
      const a = q.a == null ? .28 : q.a, c = q.c || "150,200,240";
      hatchPoly(poly, gap, ang).forEach(seg => o.strokes.push({ pts: seg, w: .6, a, c, dash: 0, at, span }));
    };
    o.dim = (a, b, label, op) => {
      o.dims.push(Object.assign({ a, b, label, off: 26, at: .78, span: .22, size: 10.5 }, op || {}));
    };
    o.lb = (x, y, text, op) => {
      o.labels.push(Object.assign({ x, y, text, size: 12, at: .82, c: "168,205,238", hei: true }, op || {}));
    };
    o.elev = (x, y, text, op) => {
      o.labels.push(Object.assign({ x, y, text, size: 10.5, at: .85, c: "168,205,238", hei: false, elev: true }, op || {}));
    };
    o.body = (pts, grad, op) => {
      o.bodies.push(Object.assign({ pts, grad, at: 0, span: 1, alpha: .85, dir: "up" }, op || {}));
    };
    o.region = (pts, grad, op) => {
      o.regions.push(Object.assign({ pts, grad, at: 0, span: 1, alpha: .55, dir: "radial" }, op || {}));
    };
    return o;
  }

  /* 通用：河床 / 基岩 / 图签辅助线 */
  function baseGround(g, y) {
    g.s([[34, y], [966, y]], { w: 1.8, a: .95, at: 0, span: .16 });
    g.h([[34, y], [966, y], [966, y + 78], [34, y + 78]], { gap: 15, a: .18, at: .5, span: .4 });
  }
  function centerLine(g, x, y0, y1, text) {
    g.s([[x, y0], [x, y1]], { w: .8, a: .55, c: "150,215,255", dash: [9, 4, 2, 4], at: .7, span: .2 });
    if (text) g.lb(x + 6, y1 - 8, text, { size: 10, at: .9, c: "130,186,224" });
  }

  /* ---------------- 重力坝（三峡 / 葛洲坝 / 向家坝） ---------------- */
  function geoGravity(d) {
    const g = G(), sp = SPEC[d.name] || { h: "185", L: "2309", k1: "泄洪深孔", k2: "" };
    g.spread = [470, 320];
    baseGround(g, 430);
    /* 上游/下游水体 */
    g.region([[34, 214], [250, 214], [250, 430], [34, 430]], ["96,186,226", "20,64,108"], { alpha: .64, at: 0, span: .5 });
    g.region([[662, 352], [966, 352], [966, 430], [662, 430]], ["82,164,212", "16,54,92"], { alpha: .62, at: .1, span: .5 });
    g.region([[0, 0], [1000, 0], [1000, 232], [0, 232]], ["116,186,236", "26,70,118"], { alpha: .6, at: 0, span: .6 });
    /* 坝体剖面：上游面直立 + 溢流跌坎 + 下游坡 */
    const dam = [[250, 430], [250, 190], [520, 190], [520, 238]]
      .concat(quadPts([520, 238], [572, 268], [616, 320], 8))
      .concat(quadPts([616, 320], [640, 366], [662, 430], 6))
      .concat([[250, 430]]);
    g.body(dam, ["212,204,186", "112,124,140"], { alpha: .82, at: 0, span: 1, dir: "up" });
    g.s(dam, { w: 2.2, a: .98, at: .02, span: .3 });
    g.h(dam, { gap: 15, a: .26, at: .44, span: .3 });
    /* 坝顶工作桥 + 桥墩 */
    g.s([[186, 152], [712, 152]], { w: 1.5, a: .9, at: .34, span: .06 });
    g.s([[190, 168], [708, 168]], { w: .9, a: .6, at: .36, span: .06 });
    [300, 436, 604].forEach(x => {
      g.s(rectPts(x, 152, 14, 38), { w: 1.1, a: .85, at: .38, span: .06 });
    });
    /* 启闭机房 + 溢流表孔 */
    g.s(rectPts(492, 132, 56, 20), { w: 1.1, a: .8, at: .4, span: .05 });
    g.s([[468, 190], [468, 232]], { w: 1.5, a: .95, at: .42, span: .05 });
    g.s([[544, 190], [544, 232]], { w: 1.5, a: .95, at: .42, span: .05 });
    g.s([[468, 232], [544, 232]], { w: 1.2, a: .85, at: .44, span: .05 });
    /* 弧形闸门（虚线） */
    g.s(quadPts([468, 190], [476, 226], [544, 232], 10), { w: 1, a: .7, dash: [5, 3], at: .48, span: .08 });
    g.s(circlePts(544, 232, 3.4, 10), { w: 1, a: .8, at: .5, span: .04 });
    /* 浸润线 + 坝基排水 + 灌浆帷幕 */
    g.s([[272, 216], [330, 268], [404, 330], [500, 386], [596, 418]], { w: 1, a: .55, dash: [7, 4, 2, 4], at: .56, span: .12 });
    for (let i = 0; i < 5; i++) {
      const x = 300 + i * 70;
      g.s([[x, 400], [x, 430]], { w: .8, a: .5, dash: [3, 3], at: .6, span: .1 });
    }
    g.s([[300, 430], [300, 470]], { w: 1.2, a: .6, dash: [6, 3], at: .62, span: .06 });
    /* 水面线 */
    g.s(wavy(40, 250, 214, 2.2, 34), { w: 1.1, a: .8, c: "150,225,255", at: .65, span: .1 });
    g.s(wavy(666, 960, 352, 2.2, 34), { w: 1.1, a: .8, c: "150,225,255", at: .66, span: .1 });
    g.s([[662, 430], [662, 352]], { w: 1.1, a: .7, dash: [4, 3], at: .66, span: .05 });
    /* 尾水/消力池 */
    g.s([[662, 430], [700, 402], [806, 402], [806, 430]], { w: 1.2, a: .8, at: .68, span: .06 });
    centerLine(g, 470, 108, 470, "坝轴线");
    /* 标注 */
    g.dim([250, 430], [250, 190], "坝高 " + sp.h + " m", { off: -46, at: .8 });
    g.dim([250, 190], [520, 190], "坝顶宽 40 m", { off: -30, at: .82 });
    g.dim([250, 430], [662, 430], "坝基宽 96 m", { off: 34, at: .84 });
    g.lb(624, 352, "1 : 0.75", { size: 11, at: .86 });
    g.elev(524, 188, "▽ " + sp.h + ".0 坝顶", { at: .87 });
    g.elev(40, 212, "▽ 175.0 正常蓄水位", { at: .88 });
    g.elev(676, 350, "▽ 62.0 下游水位", { at: .89 });
    g.lb(34, 96, "混凝土重力坝 · 横剖面", { size: 15, at: .9, c: "196,226,252" });
    g.lb(560, 168, sp.k1, { size: 10, at: .9 });
    g.lb(704, 398, "消力池", { size: 10, at: .91 });
    return g;
  }

  /* ---------------- 拱坝（白鹤滩 / 溪洛渡 / 乌东德 / 佛子岭） ---------------- */
  function geoArch(d) {
    const g = G(), sp = SPEC[d.name] || { h: "289", L: "709", k1: "泄洪表孔" };
    g.spread = [500, 360];
    baseGround(g, 480);
    /* 两岸山体 */
    const hillL = [[34, 480], [34, 232], [92, 206], [156, 236], [212, 278], [252, 316], [252, 480]];
    const hillR = [[966, 480], [966, 232], [908, 206], [844, 236], [788, 278], [748, 316], [748, 480]];
    g.region(hillL, ["98,158,128", "22,58,50"], { alpha: .62, dir: "up", at: 0, span: .5 });
    g.region(hillR, ["98,158,128", "22,58,50"], { alpha: .62, dir: "up", at: .06, span: .5 });
    g.region([[0, 0], [1000, 0], [1000, 250], [0, 250]], ["112,184,234", "26,68,116"], { alpha: .6, at: 0, span: .6 });
    g.s(hillL, { w: 1.9, a: .95, at: .02, span: .22 });
    g.s(hillR, { w: 1.9, a: .95, at: .04, span: .22 });
    g.h(hillL, { gap: 13, a: .2, at: .5, span: .3 });
    g.h(hillR, { gap: 13, a: .2, at: .5, span: .3 });
    /* 坝体：上下游弧面 */
    const crest = [[252, 268]].concat(quadPts([252, 268], [500, 244], [748, 268], 18));
    const toe = [[302, 436]].concat(quadPts([302, 436], [500, 418], [698, 436], 16));
    /* 轮廓 = 坝顶弧（左→右）+ 下游岸坡 + 坝底弧（右→左）+ 上游岸坡 */
    const outline = crest.concat([[748, 268], [698, 436]])
      .concat(toe.slice().reverse()).concat([[252, 268]]);
    g.body(outline, ["208,202,186", "110,122,138"], { alpha: .8, at: 0, span: 1, dir: "up" });
    g.s(crest, { w: 2.3, a: .98, at: .04, span: .2 });
    g.s(toe, { w: 2.3, a: .98, at: .1, span: .2 });
    g.s([[252, 268], [302, 436]], { w: 2, a: .95, at: .16, span: .08 });
    g.s([[748, 268], [698, 436]], { w: 2, a: .95, at: .18, span: .08 });
    g.h(outline, { gap: 16, a: .24, at: .46, span: .34 });
    /* 水平拱圈（虚线，向心弯曲） */
    for (let i = 1; i <= 6; i++) {
      const t = i / 7;
      const y1 = 268 + (436 - 268) * t;
      const l = [252 + (302 - 252) * t, y1];
      const r = [748 + (698 - 748) * t, y1];
      const bend = 26 * (1 - t * .55);
      g.s([l].concat(quadPts(l, [500, y1 - bend], r, 14)), { w: .8, a: .42, dash: [8, 4], at: .52 + t * .12, span: .1 });
    }
    /* 坝段分缝 */
    for (let i = 1; i <= 5; i++) {
      const x = 252 + (748 - 252) * i / 6;
      const yTop = 268 + Math.sin(i / 6 * Math.PI) * -8 + 8;
      g.s([[x, yTop], [x + (x - 500) * .02, 430]], { w: .7, a: .38, dash: [5, 4], at: .62, span: .14 });
    }
    /* 泄洪表孔（坝顶缺口） */
    for (let i = 0; i < 4; i++) {
      const x = 386 + i * 62;
      g.s([[x, 258], [x, 276], [x + 34, 276], [x + 34, 258]], { w: 1, a: .8, c: "170,225,255", at: .68, span: .08 });
    }
    /* 水垫塘 / 二道坝 / 下游水面 */
    g.s(wavy(300, 700, 466, 2, 32), { w: 1, a: .7, c: "150,225,255", at: .7, span: .1 });
    g.s([[430, 466], [470, 480], [530, 480], [570, 466]], { w: 1.1, a: .7, at: .72, span: .05 });
    g.s([[302, 436], [302, 466]], { w: 1, a: .6, dash: [4, 3], at: .72, span: .04 });
    g.s([[698, 436], [698, 466]], { w: 1, a: .6, dash: [4, 3], at: .73, span: .04 });
    centerLine(g, 500, 200, 492, "拱冠中心线");
    /* 标注 */
    g.dim([150, 436], [150, 268], "最大坝高 " + sp.h + " m", { off: -30, at: .8 });
    g.dim([252, 268], [748, 268], "坝顶弧长 " + sp.L + " m", { off: -34, at: .82 });
    g.lb(506, 342, "拱冠梁厚 13.5 m", { size: 10, at: .86 });
    g.elev(280, 264, "▽ 834.0 正常蓄水位", { at: .87 });
    g.elev(430, 462, "▽ 600.0 水垫塘", { at: .88 });
    g.lb(34, 96, "混凝土双曲拱坝 · 上游立面", { size: 15, at: .9, c: "196,226,252" });
    g.lb(392, 250, sp.k1, { size: 10, at: .9 });
    return g;
  }

  /* ---------------- 港口工程（大亚湾） ---------------- */
  function geoPort(d) {
    const g = G(), sp = SPEC[d.name] || { h: "15.0", L: "400" };
    g.spread = [560, 380];
    g.s([[0, 470], [1000, 470]], { w: 1.8, a: .95, at: 0, span: .16 });
    g.h([[0, 470], [1000, 470], [1000, 548], [0, 548]], { gap: 15, a: .18, at: .5, span: .4 });
    /* 海 / 陆 / 天空 */
    g.region([[300, 352], [966, 352], [966, 470], [300, 470]], ["74,176,214", "14,66,104"], { alpha: .66, at: 0, span: .5 });
    g.region([[0, 0], [1000, 0], [1000, 226], [0, 226]], ["120,190,238", "28,72,120"], { alpha: .6, at: 0, span: .6 });
    g.region([[0, 340], [300, 340], [300, 470], [0, 470]], ["152,134,98", "52,46,32"], { alpha: .6, at: .05, span: .5 });
    /* 岸壁（码头前沿） */
    const quay = [[300, 340], [300, 470], [346, 470], [346, 340]];
    g.body(quay, ["200,198,190", "96,102,112"], { alpha: .78, at: .1, span: 1, dir: "up" });
    g.s([[0, 340], [346, 340]], { w: 2.1, a: .96, at: .04, span: .18 });
    g.s(quay, { w: 1.7, a: .92, at: .16, span: .16 });
    g.h(quay, { gap: 9, a: .3, at: .5, span: .3 });
    /* 码头面标高符号 */
    g.s([[280, 340], [270, 334], [290, 334], [280, 340]], { w: 1, a: .7, at: .5, span: .04 });
    /* 门座式起重机 */
    const cr = [
      [[368, 340], [368, 214]], [[424, 340], [424, 214]],
      [[368, 214], [424, 214]], [[368, 340], [352, 340]], [[424, 340], [440, 340]],
      [[352, 214], [660, 186]], [[424, 214], [424, 186], [660, 186]],
      [[440, 214], [520, 200]],
    ];
    cr.forEach((p, i) => g.s(p, { w: i < 2 ? 2 : 1.2, a: .92, at: .26 + i * .012, span: .08 }));
    g.s(rectPts(384, 160, 24, 34), { w: 1.1, a: .85, at: .38, span: .05 });
    g.s([[604, 186], [604, 300]], { w: .9, a: .6, dash: [5, 3], at: .4, span: .07 });
    g.s([[592, 300], [616, 300], [604, 312], [592, 300]], { w: 1.1, a: .85, at: .44, span: .05 });
    /* 核电站穹顶 + 厂房 */
    const dome = circlePts(160, 292, 44, 26, Math.PI, TAU);
    g.s([[160, 292]].concat(dome).concat([[204, 292], [204, 340], [116, 340], [116, 292]]), { w: 1.9, a: .95, at: .28, span: .16 });
    g.body([[116, 292]].concat(dome).concat([[204, 292], [204, 340], [116, 340]]), ["222,222,224", "116,124,134"], { alpha: .8, at: .16, span: 1, dir: "up" });
    g.h([[116, 292]].concat(dome).concat([[204, 292], [204, 340], [116, 340]]), { gap: 10, a: .22, at: .54, span: .28 });
    g.s([[240, 340], [240, 288], [288, 288], [288, 340]], { w: 1.4, a: .85, at: .34, span: .1 });
    /* 防波堤（斜坡堤 + 抛石） */
    const bw = [[700, 470], [762, 342], [856, 342], [918, 470]];
    g.body(bw, ["178,168,146", "80,78,62"], { alpha: .75, at: .2, span: 1, dir: "up" });
    g.s(bw, { w: 1.9, a: .94, at: .32, span: .16 });
    g.h(bw, { gap: 12, a: .26, at: .58, span: .3 });
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      const x = 726 + t * 168, y = 458 - t * 96;
      g.s([[x - 8, y], [x, y - 9], [x + 9, y - 1], [x, y + 7], [x - 8, y]], { w: .9, a: .6, at: .72 + t * .06, span: .08 });
    }
    /* 船舶 */
    const hull = [[438, 402], [610, 402], [632, 428], [438, 428], [438, 402]];
    g.s(hull, { w: 1.6, a: .9, at: .42, span: .1 });
    g.s(rectPts(470, 372, 92, 30), { w: 1.2, a: .82, at: .46, span: .07 });
    g.s([[500, 372], [500, 344]], { w: 1.2, a: .8, at: .5, span: .05 });
    g.s([[500, 344], [560, 356]], { w: .9, a: .7, at: .52, span: .05 });
    g.s(circlePts(508, 418, 7, 12), { w: .9, a: .6, at: .54, span: .04 });
    /* 取排水口涵管 */
    g.s([[240, 418], [330, 418]], { w: 1.4, a: .85, at: .56, span: .06 });
    g.s([[322, 412], [334, 418], [322, 424]], { w: 1.2, a: .85, at: .6, span: .04 });
    g.s(wavy(350, 960, 352, 2.2, 30), { w: 1.1, a: .8, c: "150,225,255", at: .6, span: .1 });
    g.s(wavy(430, 640, 424, 1.6, 26), { w: .9, a: .5, c: "150,225,255", at: .64, span: .08 });
    centerLine(g, 664, 214, 470, "航道中心线");
    /* 标注 */
    g.dim([346, 340], [660, 340], "泊位长 " + sp.L + " m", { off: -22, at: .8 });
    g.dim([346, 352], [346, 470], "水深 -15.0 m", { off: 30, at: .82 });
    g.dim([368, 214], [424, 214], "轨距 12 m", { off: -18, at: .84 });
    g.elev(352, 338, "▽ +4.5 码头面", { at: .86 });
    g.elev(704, 340, "▽ +6.0 堤顶", { at: .87 });
    g.lb(34, 96, "大亚湾核电站港口工程 · 总体布置", { size: 14, at: .9, c: "196,226,252" });
    g.lb(120, 258, "反应堆安全壳", { size: 10, at: .9 });
    g.lb(664, 200, "岸桥 STL-01", { size: 10, at: .9 });
    return g;
  }

  /* ---------------- 渠道断面（南水北调） ---------------- */
  function geoCanal(d) {
    const g = G(), sp = SPEC[d.name] || { h: "6.0", L: "1432", k1: "1 : 2.5 边坡" };
    g.spread = [500, 400];
    /* 天空 + 地表 */
    g.region([[0, 0], [1000, 0], [1000, 248], [0, 248]], ["118,190,236", "26,70,118"], { alpha: .58, at: 0, span: .6 });
    g.s([[0, 250], [278, 250]], { w: 1.8, a: .92, at: 0, span: .12 });
    g.s([[722, 250], [1000, 250]], { w: 1.8, a: .92, at: 0, span: .12 });
    /* 开挖轮廓 */
    const cut = [[278, 250], [360, 430], [640, 430], [722, 250]];
    g.s(cut, { w: 2.2, a: .97, at: .08, span: .22 });
    /* 衬砌内轮廓 */
    const lin = [[292, 250], [372, 418], [628, 418], [708, 250]];
    g.s(lin, { w: 1.2, a: .8, c: "180,232,255", at: .18, span: .16 });
    /* 土体剖面 */
    g.h([[0, 250], [278, 250], [360, 430], [0, 430]], { gap: 14, a: .2, at: .44, span: .34 });
    g.h([[1000, 250], [722, 250], [640, 430], [1000, 430]], { gap: 14, a: .2, at: .46, span: .34 });
    /* 衬砌带剖面线（斜向） */
    g.h([[292, 250], [372, 418], [360, 430], [278, 250]], { gap: 8, a: .34, at: .58, span: .28 });
    g.h([[708, 250], [628, 418], [640, 430], [722, 250]], { gap: 8, a: .34, at: .6, span: .28 });
    g.h([[372, 418], [628, 418], [640, 430], [360, 430]], { gap: 8, a: .34, at: .62, span: .26 });
    /* 水体 */
    g.region([[326, 330], [674, 330], [628, 418], [372, 418]], ["96,196,232", "16,78,120"], { alpha: .72, at: .06, span: .8 });
    g.body([[326, 330], [674, 330], [628, 418], [372, 418]], ["150,214,240", "34,104,150"], { alpha: .62, at: 0, span: 1, dir: "down" });
    g.s(wavy(326, 674, 330, 2.4, 30), { w: 1.3, a: .85, c: "160,235,255", at: .26, span: .12 });
    /* 渠底 */
    g.s([[360, 430], [640, 430]], { w: 2, a: .95, at: .3, span: .1 });
    /* 交通桥 */
    g.s([[240, 222], [760, 222]], { w: 1.3, a: .85, at: .34, span: .1 });
    g.s([[240, 236], [760, 236]], { w: 1, a: .7, at: .36, span: .1 });
    [320, 500, 680].forEach((x, i) => {
      g.s(rectPts(x, 236, 16, 14), { w: 1, a: .8, at: .38 + i * .02, span: .05 });
      g.s([[x + 8, 236], [x + 4, 250]], { w: .8, a: .6, at: .42, span: .04 });
      g.s([[x + 8, 236], [x + 12, 250]], { w: .8, a: .6, at: .42, span: .04 });
    });
    /* 右侧分水闸 */
    g.s([[800, 250], [800, 322], [880, 322], [880, 250]], { w: 1.3, a: .85, at: .46, span: .08 });
    g.s([[824, 322], [824, 382]], { w: 1.4, a: .9, at: .5, span: .06 });
    g.s([[856, 322], [856, 382]], { w: 1.4, a: .9, at: .5, span: .06 });
    g.s([[824, 322], [856, 322]], { w: 1, a: .75, at: .52, span: .05 });
    g.s(rectPts(828, 296, 24, 26), { w: .9, a: .7, at: .54, span: .05 });
    g.s([[880, 382], [960, 382]], { w: 1.2, a: .8, at: .56, span: .06 });
    g.s(wavy(880, 960, 372, 2, 26), { w: 1, a: .7, c: "150,225,255", at: .58, span: .07 });
    /* 流向箭头 */
    g.s([[470, 392], [560, 392]], { w: 1.6, a: .9, c: "150,230,255", at: .6, span: .08 });
    g.s([[548, 386], [562, 392], [548, 398]], { w: 1.4, a: .9, c: "150,230,255", at: .64, span: .05 });
    /* 边坡比小三角 */
    g.s([[300, 300], [340, 300], [340, 380]], { w: .9, a: .7, dash: [4, 3], at: .66, span: .06 });
    g.lb(302, 292, "1", { size: 10, at: .9 });
    g.lb(344, 344, "2.5", { size: 10, at: .9 });
    centerLine(g, 500, 172, 486, "渠道中心线");
    /* 标注 */
    g.dim([360, 430], [640, 430], "渠底宽 24 m", { off: 32, at: .78 });
    g.dim([674, 330], [674, 430], "设计水深 " + sp.h + " m", { off: 30, at: .8 });
    g.dim([278, 250], [722, 250], "开口宽 58 m", { off: -26, at: .82 });
    g.elev(508, 328, "▽ 42.0 设计水位", { at: .85 });
    g.elev(340, 428, "▽ 36.0 渠底", { at: .86 });
    g.lb(0, 96, "南水北调中线 · 渠道横断面", { size: 14, at: .9, c: "196,226,252" });
    g.lb(806, 340, "分水闸", { size: 10, at: .9 });
    g.lb(474, 388, "设计流量 350 m³/s", { size: 10, at: .9 });
    return g;
  }

  /* ---------------- 拦河闸（赣江尾闾） ---------------- */
  function geoSluice(d) {
    const g = G(), sp = SPEC[d.name] || { h: "12.5", L: "4 支联合", k1: "四支拦河闸" };
    g.spread = [500, 360];
    baseGround(g, 470);
    g.region([[60, 340], [240, 340], [240, 470], [60, 470]], ["88,178,222", "16,60,100"], { alpha: .64, at: 0, span: .5 });
    g.region([[760, 376], [966, 376], [966, 470], [760, 470]], ["78,158,206", "14,52,88"], { alpha: .62, at: .06, span: .5 });
    g.region([[0, 0], [1000, 0], [1000, 300], [0, 300]], ["108,180,232", "24,64,112"], { alpha: .58, at: 0, span: .6 });
    /* 闸底板 */
    const floor = [[240, 392], [760, 392], [760, 424], [240, 424]];
    g.body(floor, ["196,190,178", "104,110,120"], { alpha: .8, at: 0, span: 1, dir: "up" });
    g.s(floor, { w: 2, a: .95, at: .04, span: .16 });
    g.h(floor, { gap: 9, a: .3, at: .46, span: .26 });
    /* 闸墩 */
    const piers = [[330, 300], [486, 300], [642, 300]];
    piers.forEach((p, i) => {
      const x = p[0];
      const pb = [[x, 300], [x + 26, 300], [x + 26, 392], [x, 392]];
      g.body(pb, ["204,198,186", "110,118,128"], { alpha: .78, at: .08 + i * .04, span: 1, dir: "up" });
      g.s(pb, { w: 1.6, a: .92, at: .12 + i * .03, span: .12 });
      g.h(pb, { gap: 8, a: .26, at: .54, span: .24 });
    });
    /* 弧形闸门 */
    [342, 498, 654].forEach((x, i) => {
      const arcPts = quadPts([x - 22, 392], [x - 26, 336], [x, 302], 10);
      g.s(arcPts, { w: 1.6, a: .9, c: "170,228,255", at: .34 + i * .03, span: .1 });
      g.s([[x - 22, 392], [x, 302]], { w: 1, a: .65, dash: [4, 3], at: .4 + i * .03, span: .08 });
      g.s(circlePts(x, 302, 3, 10), { w: 1, a: .8, at: .44 + i * .03, span: .04 });
    });
    /* 工作桥 + 启闭机房 */
    g.s([[288, 272], [724, 272]], { w: 1.5, a: .9, at: .4, span: .1 });
    g.s([[288, 286], [724, 286]], { w: 1, a: .7, at: .42, span: .1 });
    piers.forEach((p, i) => {
      g.s([[p[0] + 13, 272], [p[0] + 13, 300]], { w: 1.1, a: .85, at: .46 + i * .02, span: .05 });
      g.s(rectPts(p[0] - 2, 238, 30, 34), { w: 1.1, a: .85, at: .48 + i * .02, span: .05 });
      g.s(circlePts(p[0] + 13, 252, 8, 12), { w: .9, a: .7, at: .52 + i * .02, span: .04 });
    });
    /* 上游铺盖 / 下游消力池 / 海漫 */
    g.s([[140, 424], [240, 424]], { w: 1.6, a: .9, at: .56, span: .06 });
    g.h([[140, 424], [240, 424], [240, 448], [140, 448]], { gap: 9, a: .24, at: .7, span: .2 });
    g.s([[760, 424], [760, 424], [900, 424], [900, 452], [856, 452]], { w: 1.4, a: .85, at: .58, span: .08 });
    g.h([[760, 452], [900, 452], [900, 476], [760, 476]], { gap: 10, a: .2, at: .72, span: .2 });
    for (let i = 0; i < 7; i++) {
      const x = 770 + i * 18;
      g.s([[x, 452], [x + 8, 462], [x + 16, 452]], { w: .8, a: .55, at: .76 + i * .012, span: .06 });
    }
    /* 水面 */
    g.s(wavy(60, 240, 340, 2.2, 30), { w: 1.1, a: .8, c: "150,225,255", at: .62, span: .1 });
    g.s(wavy(760, 966, 376, 2.2, 30), { w: 1.1, a: .8, c: "150,225,255", at: .64, span: .1 });
    g.s([[240, 340], [240, 392]], { w: 1.1, a: .7, dash: [4, 3], at: .66, span: .05 });
    centerLine(g, 343, 214, 470, "");
    centerLine(g, 499, 214, 470, "闸室中心线");
    /* 标注 */
    g.dim([356, 392], [486, 392], "闸孔净宽 12.0 m", { off: -56, at: .8 });
    g.dim([240, 424], [760, 424], "闸室总宽 60 m", { off: 34, at: .82 });
    g.dim([240, 424], [240, 300], "闸高 " + sp.h + " m", { off: -34, at: .84 });
    g.elev(300, 298, "▽ 设计洪水位", { at: .86 });
    g.elev(246, 422, "▽ 闸底板高程 8.5 m", { at: .87 });
    g.lb(34, 96, "赣江尾闾 · 拦河闸纵剖面", { size: 14, at: .9, c: "196,226,252" });
    g.lb(300, 230, sp.k1, { size: 10, at: .9 });
    g.lb(772, 418, "消力池", { size: 10, at: .9 });
    return g;
  }

  const GEO_BUILD = { arch: geoArch, gravity: geoGravity, port: geoPort, canal: geoCanal, sluice: geoSluice };

  /* ============================================================
   * 二、几何缩放缓存 + 绘制
   * ============================================================ */
  function prepGeo(g, W, H) {
    const sx = W / DW, sy = H / DH;
    if (g._sx === sx && g._sy === sy && g._sc) return g._sc;
    const lk = U.clamp(W / 620, .62, 1.9);    // 线宽随图纸宽度
    const tk = U.clamp(W / 520, .74, 1.9);    // 文字随图纸宽度（略大，保证可读）
    const tr = pts => {
      const q = pts.map(p => [p[0] * sx, p[1] * sy]);
      q._len = (pts._len || 0) * sx;
      return q;
    };
    const mk = arr => arr.map(o => {
      const q = Object.assign({}, o, { pts: tr(o.pts) });
      q.bb = bbox(q.pts);
      q.cx = (q.bb[0] + q.bb[2]) / 2; q.cy = (q.bb[1] + q.bb[3]) / 2;
      polylenInit(q.pts);
      return q;
    });
    const sc = {
      strokes: mk(g.strokes), bodies: mk(g.bodies), regions: mk(g.regions),
      dims: g.dims.map(d => Object.assign({}, d, {
        a: [d.a[0] * sx, d.a[1] * sy], b: [d.b[0] * sx, d.b[1] * sy],
        off: d.off * sx, size: d.size * tk,
      })),
      labels: g.labels.map(l => Object.assign({}, l, { x: l.x * sx, y: l.y * sy, size: l.size * tk })),
      k: lk, tk, sx, sy,
      ox: g.spread[0] * sx, oy: g.spread[1] * sy,
    };
    g._sx = sx; g._sy = sy; g._sc = sc;
    return sc;
  }
  function polylenInit(pts) {
    let L = 0;
    for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    pts._len = L;
  }

  function pathOf(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  }
  /* 按长度比例描画折线（从起点生长） */
  function strokePartial(ctx, pts, p) {
    if (p >= .999) { pathOf(ctx, pts); ctx.stroke(); return; }
    const total = pts._len || 0;
    if (!total) return;
    const target = total * p;
    let acc = 0;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (acc + d <= target) { ctx.lineTo(pts[i][0], pts[i][1]); acc += d; }
      else {
        const t = (target - acc) / d;
        ctx.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t,
          pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t);
        break;
      }
    }
    ctx.stroke();
  }
  /* 多边形填色（带扩散/上升式显影） */
  function fillPoly(ctx, o, alpha, p, sx) {
    if (alpha <= 0 || p <= 0) return;
    const bb = o.bb;
    ctx.save();
    pathOf(ctx, o.pts); ctx.closePath(); ctx.clip();
    if (p < .999) {
      ctx.beginPath();
      if (o.dir === "up") {
        const w = bb[2] - bb[0] + 4, hh = bb[3] - bb[1] + 4;
        ctx.rect(bb[0] - 2, bb[3] + 2 - hh * p, w, hh * p);
      } else if (o.dir === "down") {
        const w = bb[2] - bb[0] + 4, hh = bb[3] - bb[1] + 4;
        ctx.rect(bb[0] - 2, bb[1] - 2, w, hh * p);
      } else {
        const r = Math.max(12, p * 1400 * sx);
        ctx.arc(o._cx, o._cy, r, 0, TAU);
      }
      ctx.clip();
    }
    const gd = ctx.createLinearGradient(bb[0], bb[1], bb[2], bb[3]);
    const n = o.grad.length;
    for (let i = 0; i < n; i++) gd.addColorStop(n === 1 ? 0 : i / (n - 1), "rgba(" + o.grad[i] + "," + alpha + ")");
    ctx.fillStyle = gd;
    ctx.fillRect(bb[0] - 2, bb[1] - 2, bb[2] - bb[0] + 4, bb[3] - bb[1] + 4);
    ctx.restore();
  }

  function arrowHead(ctx, x, y, ux, uy, s) {
    const px = -uy * s * .3, py = ux * s * .3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - ux * s + px, y - uy * s + py);
    ctx.lineTo(x - ux * s - px, y - uy * s - py);
    ctx.closePath(); ctx.fill();
  }

  /* canvas 无法使用 CSS 变量，运行时从 :root 读取同一套字体栈，保证中文观感统一 */
  let F_MONO = '"Cascadia Mono","JetBrains Mono",Consolas,monospace';
  let F_HEI = '"Microsoft YaHei","PingFang SC","Noto Sans SC",sans-serif';
  (function initFonts() {
    try {
      const cs = getComputedStyle(document.documentElement);
      const m = (cs.getPropertyValue("--f-mono") || "").trim();
      const h = (cs.getPropertyValue("--f-hei") || "").trim();
      if (m) F_MONO = m;
      if (h) F_HEI = h;
    } catch (e) {}
  })();

  function drawGeo(ctx, g, W, H, st) {
    const P = prepGeo(g, W, H);
    const k = P.k;
    P.regions.forEach(r => { r._cx = P.ox; r._cy = P.oy; });
    P.bodies.forEach(b => { b._cx = b.cx; b._cy = b.cy; });

    /* A. 周边背景上色 */
    if (st.region > 0) {
      P.regions.forEach((r, i) => {
        const p = U.clamp((st.region - r.at) / r.span, 0, 1);
        if (p <= 0) return;
        fillPoly(ctx, r, r.alpha * U.easeOut(Math.min(1, p * 1.25)), p, P.sx);
      });
    }
    /* B. 建筑体上色 */
    if (st.body > 0) {
      P.bodies.forEach(b => {
        const p = U.clamp((st.body - b.at) / b.span, 0, 1);
        if (p <= 0) return;
        fillPoly(ctx, b, b.alpha * (0.35 + 0.65 * U.easeOut(p)), p, P.sx);
      });
      /* 上色完成后的高光边 */
      if (st.body > .96) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = "rgba(180,235,255," + (.22 * (st.body - .96) / .04) + ")";
        ctx.lineWidth = Math.max(.6, 1.2 * k);
        P.bodies.forEach(b => { pathOf(ctx, b.pts); ctx.closePath(); ctx.stroke(); });
        ctx.restore();
      }
    }
    /* C. 线框（逐段描画） */
    const fr = st.frame == null ? 1 : st.frame;
    for (const s of P.strokes) {
      const p = U.clamp((fr - s.at) / s.span, 0, 1);
      if (p <= 0) continue;
      ctx.save();
      ctx.lineCap = "butt"; ctx.lineJoin = "round";
      ctx.lineWidth = Math.max(.4, s.w * k);
      ctx.strokeStyle = "rgba(" + s.c + "," + s.a + ")";
      if (s.dash && s.dash.length) ctx.setLineDash(s.dash.map(v => v * Math.max(.6, k * .9)));
      strokePartial(ctx, s.pts, p);
      ctx.restore();
    }
    /* D. 尺寸标注 */
    for (const d of P.dims) {
      const p = U.clamp((fr - d.at) / d.span, 0, 1);
      if (p <= 0) continue;
      const ax = d.a[0], ay = d.a[1], bx = d.b[0], by = d.b[1];
      const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
      const nx = -dy / L, ny = dx / L;
      const AX = ax + nx * d.off, AY = ay + ny * d.off;
      const BX = bx + nx * d.off, BY = by + ny * d.off;
      ctx.save();
      ctx.strokeStyle = "rgba(150,200,240," + (.6 * p) + ")";
      ctx.lineWidth = Math.max(.35, .7 * k);
      /* 尺寸界线 */
      ctx.beginPath();
      ctx.moveTo(ax + nx * Math.sign(d.off) * 3, ay + ny * Math.sign(d.off) * 3);
      ctx.lineTo(AX + nx * Math.sign(d.off) * 5, AY + ny * Math.sign(d.off) * 5);
      ctx.moveTo(bx + nx * Math.sign(d.off) * 3, by + ny * Math.sign(d.off) * 3);
      ctx.lineTo(BX + nx * Math.sign(d.off) * 5, BY + ny * Math.sign(d.off) * 5);
      ctx.stroke();
      /* 尺寸线 */
      const seg = [[AX, AY], [BX, BY]];
      seg._len = L;
      ctx.strokeStyle = "rgba(168,214,248," + (.85 * p) + ")";
      ctx.lineWidth = Math.max(.4, .8 * k);
      strokePartial(ctx, seg, p);
      /* 箭头 */
      if (p > .55) {
        const ux = dx / L, uy = dy / L, s0 = Math.max(3.4, 7 * k);
        ctx.fillStyle = "rgba(190,228,255," + (.9 * p) + ")";
        arrowHead(ctx, AX, AY, ux, uy, s0);
        arrowHead(ctx, BX, BY, -ux, -uy, s0);
      }
      /* 标注文字（沿尺寸线方向放置） */
      if (p > .72) {
        const a2 = (p - .72) / .28;
        const mx = (AX + BX) / 2, my = (AY + BY) / 2;
        let ang = Math.atan2(dy, dx);
        if (Math.abs(ang) > Math.PI / 2) ang += Math.PI;
        ctx.translate(mx, my); ctx.rotate(ang);
        ctx.font = "400 " + Math.max(6, d.size) + "px " + F_MONO;
        ctx.textAlign = "center"; ctx.textBaseline = "bottom";
        ctx.fillStyle = "rgba(206,232,255," + (.95 * a2) + ")";
        ctx.fillText(d.label, 0, -Math.max(2, 3 * k));
      }
      ctx.restore();    }
    /* E. 文字与标高 */
    for (const lb of P.labels) {
      const p = U.clamp((fr - lb.at) / .1, 0, 1);
      if (p <= 0) continue;
      ctx.save();
      ctx.globalAlpha = U.smooth(p);
      ctx.font = (lb.hei ? "400 " : "400 ") + Math.max(6, lb.size) + "px " + (lb.hei ? F_HEI : F_MONO);
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "rgba(" + lb.c + ",.95)";
      let x = lb.x;
      if (lb.elev) {
        /* 标高符号：小倒三角 */
        ctx.beginPath();
        ctx.moveTo(x - lb.size * .78, lb.y - lb.size * .62);
        ctx.lineTo(x - lb.size * .18, lb.y - lb.size * .62);
        ctx.lineTo(x - lb.size * .48, lb.y - lb.size * .2);
        ctx.closePath();
        ctx.strokeStyle = "rgba(" + lb.c + ",.9)";
        ctx.lineWidth = Math.max(.5, lb.size * .075);
        ctx.stroke();
        x += 1;
      }
      ctx.fillText(lb.text, x, lb.y);
      ctx.restore();
    }
  }

  /* ============================================================
   * 三、状态
   * ============================================================ */
  const S = {
    up: false, cursor: 0, deckTop: 0, marks: {},
    cw: 400, ch: 225, step: 440, deckSc: .22,
    built: false, press: null, drag: null, introEl: null, focus: null,
  };
  const cards = [];
  let L = null, rootEl = null, dustCv = null, ho = null;

  /* ============================================================
   * 四、图纸 DOM
   * ============================================================ */
  function buildCard(i) {
    const d = D.BUILDINGS[i];
    const el = U.el("div", "wa-card");
    el.dataset.i = i;
    el.style.width = S.cw + "px";
    el.style.height = S.ch + "px";
    const no = String(i + 1).padStart(2, "0");
    el.innerHTML =
      '<div class="wa-sheet">' +
        '<div class="wa-grid"></div>' +
        '<div class="wa-photo" style="background-image:url(&quot;' + encodeURI(d.image) + '&quot;)"></div>' +
        '<canvas class="wa-draw"></canvas>' +
        '<div class="wa-vig"></div>' +
        '<div class="wa-head"><b>HH·W-' + no + '</b><span>SCALE 1:2000</span></div>' +
        '<div class="wa-tb"><div class="n">' + U.esc(d.name) + '</div>' +
          '<div class="s">' + U.esc(d.sub || "") + ' · ' + U.esc(d.year || "") + '</div></div>' +
        '<div class="wa-badge">长按 · 描画框架</div>' +
        '<div class="wa-scan"></div>' +
      '</div>';
    const c = {
      i, data: d, el,
      cv: el.querySelector(".wa-draw"),
      badge: el.querySelector(".wa-badge"),
      geo: null, W: 0, H: 0,
      prog: 0, bodyP: 0, regionP: 0,
      state: 0, anim: null,
    };
    try { c.geo = (GEO_BUILD[d.draw] || geoGravity)(d); } catch (err) { c.geo = null; }
    cards.push(c);
    return c;
  }

  function badgeOf(c) {
    if (S.up) return "点击翻页 · 长按拖入全息屏";
    if (c.state === 0) return "长按 · 描画框架";
    if (c.state === 1) return "点击 · 建筑上色";
    if (c.state === 2) return "再点击 · 周边上色";
    return "已完成 · 点击看介绍";
  }
  function refreshBadge(c) {
    c.badge.textContent = badgeOf(c);
    c.badge.classList.toggle("gold", !S.up && c.state >= 3);
  }

  /* ============================================================
   * 五、绘制一张图纸
   * ============================================================ */
  function paintCard(c) {
    if (!c.cv || !c.el.isConnected) return;
    const r = U.fitCanvas(c.cv);
    c.W = r.w; c.H = r.h;
    const ctx = r.ctx;
    ctx.clearRect(0, 0, r.w, r.h);
    if (!c.geo || r.w < 8 || r.h < 8) return;
    drawGeo(ctx, c.geo, r.w, r.h, {
      frame: S.up ? 1 : c.prog,
      body: S.up ? 0 : c.bodyP,
      region: S.up ? 0 : c.regionP,
    });
  }

  /* ============================================================
   * 六、布局
   * ============================================================ */
  function layout() {
    const vw = rootEl.clientWidth || window.innerWidth;
    const vh = rootEl.clientHeight || window.innerHeight;
    const mobile = vw < 760;
    const cw = Math.max(120, Math.round(mobile ? vw * .5 : vw * .25));
    const ch = Math.round(cw * 9 / 16);
    S.cw = cw; S.ch = ch;
    S.step = cw * 1.04 + (mobile ? 10 : 20);
    S.deckSc = U.clamp(118 / cw, .14, .36);
    rootEl.style.setProperty("--cw", cw + "px");
    cards.forEach(c => {
      c.el.style.width = cw + "px";
      c.el.style.height = ch + "px";
      if (c.geo) c.geo._sc = null;    // 尺寸变了，几何缓存失效
    });
    /* 全息屏尺寸 */
    if (ho && ho.box) {
      const hw = Math.min(vw * (mobile ? .86 : .5), 720);
      const hh = Math.round(hw * .6);
      ho.box.style.width = hw + "px";
      ho.box.style.height = hh + "px";
      if (ho.W !== hw || ho.H !== hh) { ho.W = hw; ho.H = hh; ho.stamp = null; }
    }
    place();
    cards.forEach(paintCard);
  }

  function place() {
    const vw = rootEl.clientWidth || window.innerWidth;
    const vh = rootEl.clientHeight || window.innerHeight;
    const mobile = vw < 760;
    const cx = vw / 2;
    const cy = vh * (mobile ? .52 : .53);
    const cw = S.cw, ch = S.ch;
    cards.forEach((c, i) => {
      if (S.up) {
        const order = (i - S.deckTop + cards.length) % cards.length;
        const dcx = vw - 40 - 62;
        const dcy = 138;
        const tx = dcx + order * 4.2 - cw / 2;
        const ty = dcy - order * 4.6 - ch / 2;
        const dsc = S.deckSc * (1 - order * .012);
        c.el.style.transform = "translate3d(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px,0) scale(" +
          dsc.toFixed(3) + ") rotate(" + (order * 1.1 - 4).toFixed(2) + "deg)";
        c.el.style.zIndex = String(60 - order);
        c.el.style.opacity = order > 5 ? "0" : (order === 0 ? "1" : String(1 - order * .07));
        c.el.style.pointerEvents = order === 0 ? "auto" : "none";
        c.el.classList.toggle("center", order === 0);
      } else {
        let off = i - S.cursor;
        const half = cards.length / 2;
        if (off > half) off -= cards.length;
        if (off < -half) off += cards.length;
        const abs = Math.abs(off);
        const ccx = cx + off * S.step;
        const ccy = cy + abs * (mobile ? 4 : 8);
        const sc = off === 0 ? 1.06 : .93;
        c.el.style.transform = "translate3d(" + (ccx - cw / 2).toFixed(1) + "px," + (ccy - ch / 2).toFixed(1) +
          "px,0) scale(" + sc + ") rotate(" + (off * 1.2).toFixed(2) + "deg)";
        c.el.style.zIndex = String(40 - Math.round(abs));
        c.el.style.opacity = abs > 3 ? "0" : (off === 0 ? "1" : String(Math.max(.42, .82 - abs * .12)));
        c.el.style.pointerEvents = abs > 3 ? "none" : "auto";
        c.el.classList.toggle("center", off === 0);
      }
      refreshBadge(c);
    });
  }

  /* ============================================================
   * 七、绘制流程（普通形态）
   * ============================================================ */
  function saveMarks() {
    U.store.set("waterPainted", { loadId: LOAD_ID, marks: S.marks });
  }
  function mark(c, st) {
    c.state = st;
    S.marks[c.data.name] = st;
    saveMarks();
    refreshBadge(c);
  }

  function startFrame(c) {
    if (c.state > 0 || c.anim) { c.el.classList.add("holding"); L.timeout(() => c.el.classList.remove("holding"), 420); return; }
    c.el.classList.add("holding");
    c.anim = { kind: "frame", t0: performance.now(), dur: 1750 };
    c.prog = 0;
    if (window.App) App.toast("正在描画 · " + c.data.name + " 的工程框架");
  }

  function startBody(c) {
    if (c.anim) return;
    c.anim = { kind: "body", t0: performance.now(), dur: 1000 };
    if (c.bodyP < 0.02) c.bodyP = 0;
  }

  function startRegion(c) {
    if (c.anim) return;
    c.anim = { kind: "region", t0: performance.now(), dur: 1350 };
    if (c.regionP < 0.02) c.regionP = 0;
  }

  /* ============================================================
   * 八、介绍卡片
   * ============================================================ */
  function hideIntro() {
    const el = S.introEl;
    S.introEl = null;
    if (rootEl) rootEl.classList.remove("intro-open");
    if (!el) return;
    el.classList.remove("on");
    if (L) L.timeout(() => { try { el.remove(); } catch (e) {} }, 560);
  }

  /* 图纸类型的中文名（介绍卡副标题用） */
  const TYPE_CN = { arch: "双曲拱坝", gravity: "混凝土重力坝", port: "港口 · 取排水工程", canal: "渠道工程", sluice: "拦河闸" };

  function showIntro(c) {
    hideIntro();
    const d = c.data;
    const el = U.el("div", S.up ? "up" : "");
    el.id = "wa-intro";
    el.innerHTML =
      '<div class="wa-paper">' +
        '<div class="wa-seal">' + (S.up ? "全息" : "水利") + '</div>' +
        '<div class="wa-i-t">' + U.esc(d.name) + '</div>' +
        '<div class="wa-i-s">' + U.esc(d.sub || "") + '　·　' + U.esc(d.year || "") +
          '　·　' + U.esc(TYPE_CN[d.draw] || "水利工程") + '</div>' +
        '<div class="wa-i-line"></div>' +
        '<div class="wa-i-body">' + U.esc(d.intro || "") + '</div>' +
        '<div class="wa-i-foot"><span>河海大学 · 水利家国</span><span>' +
          (S.up ? "DIGITAL TWIN / AUTO-DRAW" : "ENGINEERING RECORD") + '</span></div>' +
        '<button class="wa-i-close" title="关闭">×</button>' +
      '</div>';
    rootEl.appendChild(el);
    S.introEl = el;
    rootEl.classList.add("intro-open");
    L.timeout(() => el.classList.add("on"), 20);
    L.on(el.querySelector(".wa-i-close"), "click", (e) => { e.stopPropagation(); hideIntro(); });
    L.on(el, "pointerdown", (e) => { if (e.target === el) hideIntro(); });
  }

  /* ============================================================
   * 九、全息屏（修进形态）
   * ============================================================ */
  function buildHolo() {
    const box = U.el("div");
    box.id = "wa-holo";
    box.innerHTML =
      '<canvas id="wa-holo-cv"></canvas>' +
      '<div class="wa-scanl"></div>' +
      '<div class="wa-cn a"></div><div class="wa-cn b"></div>' +
      '<div class="wa-cn c"></div><div class="wa-cn d"></div>' +
      '<div id="wa-hud"><div class="row"><span class="t">STANDBY · 待机</span>' +
        '<span class="tl">00%</span></div>' +
        '<div class="n">将右上角的图纸长按拖入全息屏</div>' +
        '<div class="p"><i></i></div></div>';
    rootEl.appendChild(box);
    ho = {
      box, cv: box.querySelector("#wa-holo-cv"),
      hudT: box.querySelector("#wa-hud .t"), hudN: box.querySelector("#wa-hud .n"),
      hudP: box.querySelector("#wa-hud .p i"), hudL: box.querySelector("#wa-hud .tl"),
      W: 0, H: 0, dpr: 1, stamp: null, stampCtx: null,
      cells: [], idx: 0, p: 0, playing: false, done: false, card: null,
      t0: 0, dur: 2600, streams: [], lastX: 0,
    };
    for (let i = 0; i < 7; i++) {
      ho.streams.push({ x: Math.random(), y: Math.random(), sp: U.rand(.00006, .00022), len: U.rand(.06, .2), a: U.rand(.15, .45) });
    }
  }

  /* 把线框采样成像素格（按扫描顺序排序）；内容框留出边框与 HUD 的余量 */
  function holoSample(card) {
    const W = ho.W, H = ho.H;
    const geo = card.geo;
    if (!geo || !W || !H) { ho.g = 5; return []; }
    const gw = W * .92, gh = H * .78;
    const ox = (W - gw) / 2, oy = (H - gh) / 2 - H * .035;
    const P = prepGeo(geo, gw, gh);
    const g = Math.max(4, Math.round(gw / 150));
    ho.g = g;
    const cells = [], seen = new Set();
    for (const s of P.strokes) {
      const pts = s.pts;
      for (let i = 1; i < pts.length; i++) {
        const x0 = pts[i - 1][0], y0 = pts[i - 1][1], x1 = pts[i][0], y1 = pts[i][1];
        const d = Math.hypot(x1 - x0, y1 - y0);
        const n = Math.max(1, Math.ceil(d / g));
        for (let k = 0; k <= n; k++) {
          const x = x0 + (x1 - x0) * k / n, y = y0 + (y1 - y0) * k / n;
          const gx = Math.floor(x / g), gy = Math.floor(y / g);
          const key = gx + "_" + gy;
          if (seen.has(key)) continue;
          seen.add(key);
          const o = (x / gw) * .74 + (y / gh) * .26 + U.rand(-.035, .035);
          cells.push({ x: ox + gx * g + g * .5, y: oy + gy * g + g * .5, o: U.clamp(o, 0, 1) });
          if (cells.length > 2600) break;
        }
        if (cells.length > 2600) break;
      }
      if (cells.length > 2600) break;
    }
    cells.sort((a, b) => a.o - b.o);
    return cells;
  }

  function holoBegin(card) {
    const r = U.fitCanvas(ho.cv);
    ho.W = r.w; ho.H = r.h; ho.dpr = r.dpr;
    ho.stamp = U.mkCanvas(ho.W * ho.dpr, ho.H * ho.dpr);
    ho.stampCtx = ho.stamp.getContext("2d");
    ho.stampCtx.setTransform(ho.dpr, 0, 0, ho.dpr, 0, 0);
    ho.cells = holoSample(card);
    ho.idx = 0; ho.p = 0; ho.playing = true; ho.done = false;
    ho.card = card; ho.t0 = performance.now();
    ho.dur = 2100 + ho.cells.length * .9;
    ho.hudT.textContent = "AUTO-DRAW · " + card.data.name;
    ho.hudN.textContent = "数码分辨率化重建中 · " + (card.data.sub || "");
    ho.hudP.style.width = "0%";
    ho.hudL.textContent = "00%";
  }

  function holoFrame(dt, ts) {
    if (!ho || !ho.box || !S.up) return;
    const r = U.fitCanvas(ho.cv);
    const W = r.w, H = r.h, ctx = r.ctx;
    if (!W || !H) return;
    if (W !== ho.W || H !== ho.H) {
      /* 尺寸变化：按新尺寸重建 */
      const c = ho.card;
      ho.W = W; ho.H = H; ho.dpr = r.dpr;
      ho.stamp = null; ho.stampCtx = null;
      if (c) holoBegin(c);
    }
    ctx.clearRect(0, 0, W, H);
    /* 全息底：深色玻璃 + 微网格 */
    const gd = ctx.createLinearGradient(0, 0, 0, H);
    gd.addColorStop(0, "rgba(6,28,56,.55)");
    gd.addColorStop(1, "rgba(2,10,24,.72)");
    ctx.fillStyle = gd; ctx.fillRect(0, 0, W, H);
    const gs = 32;
    const off = (ts * .006) % gs;
    ctx.strokeStyle = "rgba(90,200,255,.10)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = off; x < W; x += gs) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = 0; y < H; y += gs) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
    /* 大十字定位线 */
    ctx.strokeStyle = "rgba(120,220,255,.14)";
    ctx.beginPath();
    ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H);
    ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2);
    ctx.stroke();

    /* 待机时：缓慢旋转的瞄准环，提示"可投入图纸" */
    if (!ho.card) {
      ho.idleRot = (ho.idleRot || 0) + dt * .00035;
      const cx0 = W / 2, cy0 = H / 2 - 12, R = Math.min(W, H) * .21;
      ctx.save();
      ctx.translate(cx0, cy0);
      ctx.rotate(ho.idleRot);
      ctx.strokeStyle = "rgba(120,225,255,.3)";
      ctx.lineWidth = 1;
      ctx.setLineDash([9, 15]);
      ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(120,225,255,.45)";
      for (let i = 0; i < 4; i++) {
        const a = i / 4 * TAU;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (R - 8), Math.sin(a) * (R - 8));
        ctx.lineTo(Math.cos(a) * (R + 8), Math.sin(a) * (R + 8));
        ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = "rgba(140,235,255,.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx0 - 10, cy0); ctx.lineTo(cx0 + 10, cy0);
      ctx.moveTo(cx0, cy0 - 10); ctx.lineTo(cx0, cy0 + 10);
      ctx.stroke();
    }
    /* 进度推进 + 逐格点亮 */
    if (ho.playing && ho.stampCtx) {
      const p = U.clamp((ts - ho.t0) / ho.dur, 0, 1);
      ho.p = p;
      const sc = ho.stampCtx;
      const g = ho.g || Math.max(4, Math.round(W / 150));
      while (ho.idx < ho.cells.length && ho.cells[ho.idx].o <= p) {
        const c = ho.cells[ho.idx++];
        sc.fillStyle = "rgba(52,186,236,.30)";
        sc.fillRect(c.x - g * .95, c.y - g * .95, g * 1.9, g * 1.9);
        sc.fillStyle = "rgba(150,244,255,.92)";
        sc.fillRect(c.x - g * .42, c.y - g * .42, g * .84, g * .84);
        ho.lastX = c.x;
      }
      ho.hudP.style.width = Math.round(p * 100) + "%";
      ho.hudL.textContent = String(Math.floor(p * 100)).padStart(2, "0") + "%";
      if (p >= 1) {
        ho.playing = false; ho.done = true;
        ho.hudT.textContent = "RENDER DONE · " + ho.card.data.name;
        ho.hudN.textContent = "数字化重建完成 · 点击全息屏查看工程实录";
        ho.hudL.textContent = "100%";
        const cc = ho.card;
        L.timeout(() => { if (ho && ho.card === cc) showIntro(cc); }, 420);
      }
    }
    /* 合成发光线条 */
    if (ho.stamp) {
      const breathe = ho.done ? (.86 + Math.sin(ts * .0022) * .1) : 1;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = .95 * breathe;
      ctx.drawImage(ho.stamp, 0, 0, W, H);
      ctx.globalAlpha = .42 * breathe;
      ctx.drawImage(ho.stamp, -1.5, -1.5, W + 3, H + 3);
      ctx.restore();
    }
    /* 扫描前沿亮线 */
    if (ho.playing && ho.done === false && ho.lastX) {
      const x = ho.lastX;
      const lg = ctx.createLinearGradient(x - 26, 0, x + 4, 0);
      lg.addColorStop(0, "rgba(70,220,255,0)");
      lg.addColorStop(1, "rgba(190,250,255,.5)");
      ctx.fillStyle = lg;
      ctx.fillRect(x - 26, 0, 30, H);
      ctx.strokeStyle = "rgba(190,250,255,.75)";
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    /* 数据流 */
    ctx.save();
    for (const s of ho.streams) {
      s.y += s.sp * dt;
      if (s.y > 1.3) { s.y = -.3; s.x = Math.random(); }
      const x = s.x * W, y0 = s.y * H, len = s.len * H;
      const lgd = ctx.createLinearGradient(x, y0, x, y0 + len);
      lgd.addColorStop(0, "rgba(120,235,255,0)");
      lgd.addColorStop(.8, "rgba(120,235,255," + s.a + ")");
      lgd.addColorStop(1, "rgba(200,250,255,0)");
      ctx.fillStyle = lgd;
      ctx.fillRect(x, y0, 1.4, len);
    }
    ctx.restore();
    /* 缓慢横向扫描带 */
    const sy = ((ts * .05) % (H + 120)) - 60;
    const sg = ctx.createLinearGradient(0, sy - 50, 0, sy + 50);
    sg.addColorStop(0, "rgba(90,210,255,0)");
    sg.addColorStop(.5, "rgba(90,210,255,.09)");
    sg.addColorStop(1, "rgba(90,210,255,0)");
    ctx.fillStyle = sg;
    ctx.fillRect(0, sy - 50, W, 100);
  }

  /* ============================================================
   * 十、拖拽（修进形态：把图纸拖进全息屏）
   * ============================================================ */
  function beginDrag(c) {
    if (S.drag || !ho) return;
    const el = U.el("div", "wa-ghost");
    const cw = S.cw, ch = S.ch;
    el.style.width = cw + "px";
    el.style.height = ch + "px";
    const inner = U.el("div", "wa-gsheet");
    try {
      const snap = U.el("img");
      snap.src = c.cv.toDataURL("image/png");
      inner.appendChild(snap);
    } catch (e) {}
    const tag = U.el("div", "wa-gtag");
    tag.textContent = "⇢ " + c.data.name;
    el.appendChild(inner); el.appendChild(tag);
    rootEl.appendChild(el);
    S.drag = { card: c, el, x: 0, y: 0, sc: Math.min(.52, 260 / cw) };
    c.el.classList.add("dragging");
    S.drag.x = (window.__waPtrX || 0); S.drag.y = (window.__waPtrY || 0);
    moveDrag(S.drag.x, S.drag.y, true);
  }
  function moveDrag(x, y, first) {
    const D2 = S.drag;
    if (!D2) return;
    D2.x = x; D2.y = y;
    const cw = S.cw, ch = S.ch;
    const tx = x - cw / 2, ty = y - ch / 2;
    D2.el.style.transform = "translate3d(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px,0) scale(" + D2.sc + ") rotate(-1.5deg)";
    if (first) D2.el.style.opacity = "0";
    if (first) L.timeout(() => { if (D2.el) D2.el.style.opacity = "1"; }, 16);
  }
  function endDrag(x, y) {
    const D2 = S.drag;
    if (!D2) return;
    S.drag = null;
    D2.card.el.classList.remove("dragging");
    const r = ho && ho.box ? ho.box.getBoundingClientRect() : null;
    const inside = r && x > r.left && x < r.right && y > r.top && y < r.bottom;
    const el = D2.el;
    if (inside && ho) {
      el.style.transition = "transform .42s cubic-bezier(.3,.8,.3,1),opacity .42s ease";
      el.style.transform = "translate3d(" + (r.left + r.width / 2 - S.cw / 2) + "px," +
        (r.top + r.height / 2 - S.ch / 2) + "px,0) scale(.62)";
      el.style.opacity = "0";
      L.timeout(() => { el.remove(); }, 460);
      holoBegin(D2.card);
    } else {
      el.style.transition = "transform .38s ease,opacity .34s ease";
      el.style.opacity = "0";
      L.timeout(() => { el.remove(); }, 400);
    }
  }

  /* ============================================================
   * 十一、指针交互
   * ============================================================ */
  function onDown(c, e) {
    if (S.press) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    window.__waPtrX = e.clientX; window.__waPtrY = e.clientY;
    const p = { c, x: e.clientX, y: e.clientY, moved: false, held: false, tmr: null };
    S.press = p;
    c.el.classList.add("press");
    p.tmr = L.timeout(() => {
      p.tmr = null;
      if (S.press !== p || p.moved) return;
      p.held = true;
      c.el.classList.remove("press");
      if (S.up) beginDrag(c); else startFrame(c);
    }, 180);
  }

  function onMove(e) {
    window.__waPtrX = e.clientX; window.__waPtrY = e.clientY;
    const p = S.press;
    if (p && !p.moved) {
      if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > 8) {
        p.moved = true;
        if (p.tmr) { clearTimeout(p.tmr); p.tmr = null; }
        p.c.el.classList.remove("press");
      }
    }
    if (S.drag) moveDrag(e.clientX, e.clientY);
  }

  function onUp(e) {
    const p = S.press;
    S.press = null;
    if (S.drag) endDrag(e.clientX, e.clientY);
    if (!p) return;
    if (p.tmr) { clearTimeout(p.tmr); p.tmr = null; }
    p.c.el.classList.remove("press");
    if (p.moved || p.held) return;
    onClick(p.c);
  }

  function onClick(c) {
    /* 修进形态：点击翻卡片 */
    if (S.up) {
      const top = cards[S.deckTop];
      S.deckTop = (S.deckTop + 1) % cards.length;
      if (top) {
        top.el.classList.add("flip");
        L.timeout(() => top.el.classList.remove("flip"), 580);
      }
      place();
      return;
    }
    if (!c.el.classList.contains("center")) { S.cursor = c.i; place(); return; }
    if (c.state === 0) {
      if (window.App) App.toast("长按图纸约 0.2 秒，由线条构建工程框架");
      return;
    }
    if (c.state === 1) { startBody(c); return; }
    if (c.state === 2) { startRegion(c); return; }
    showIntro(c);
  }

  /* ============================================================
   * 十二、尘埃（光锥里的浮尘）
   * ============================================================ */
  function makeDust() {
    const n = rootEl.clientWidth < 760 ? 150 : 300;
    const arr = [];
    for (let i = 0; i < n; i++) {
      arr.push({
        x: Math.random(), y: Math.random(), r: U.rand(.6, 2.2),
        vy: U.rand(-.00006, -.00002), vx: U.rand(-.00003, .00003),
        a: U.rand(.16, .62), ph: U.rand(0, TAU), sp: U.rand(.0006, .0022),
      });
    }
    return arr;
  }
  const CONES = [{ x: .15, w: .30 }, { x: .51, w: .34 }, { x: .84, w: .28 }];

  function drawDust(dt, ts) {
    if (!dustCv) return;
    const r = U.fitCanvas(dustCv);
    const ctx = r.ctx, W = r.w, H = r.h;
    ctx.clearRect(0, 0, W, H);
    if (!S.built || !S.dust) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of S.dust) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.y < -.04) { p.y = 1.04; p.x = Math.random(); }
      if (p.x < -.04) p.x = 1.04;
      if (p.x > 1.04) p.x = -.04;
      /* 落在光锥内的浮尘更亮 */
      let lit = 0;
      for (const cn of CONES) {
        const dx = Math.abs(p.x - cn.x) / cn.w;
        if (dx < .5) lit += (1 - dx * 2) * (.3 + p.y * .9);
      }
      const tw = .55 + .45 * Math.sin(ts * p.sp + p.ph);
      const a = p.a * tw * (0.16 + lit * .9) * (S.up ? .55 : 1);
      if (a < .012) continue;
      ctx.fillStyle = S.up
        ? "rgba(170,240,255," + a.toFixed(3) + ")"
        : "rgba(255,232,190," + a.toFixed(3) + ")";
      const s = p.r * (1 + lit * .5);
      ctx.beginPath(); ctx.arc(p.x * W, p.y * H, s, 0, TAU); ctx.fill();
      if (lit > .5) {
        ctx.fillStyle = S.up ? "rgba(190,245,255," + (a * .28).toFixed(3) + ")"
          : "rgba(255,236,200," + (a * .26).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(p.x * W, p.y * H, s * 3.2, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
  }

  /* ============================================================
   * 十三、主循环
   * ============================================================ */
  let lastTs = 0;
  function loop(ts) {
    /* 统一用 performance.now() 作为时基：部分环境（无头/虚拟时钟）rAF 的
       timestamp 与 performance.now() 不同源，会造成动画停滞。 */
    const now = performance.now();
    const dt = Math.min(52, now - (lastTs || now));
    lastTs = now;
    ts = now;
    drawDust(dt, ts);
    /* 图纸动画 */
    for (const c of cards) {
      const a = c.anim;
      if (!a) continue;
      const p = U.clamp((ts - a.t0) / a.dur, 0, 1);
      if (a.kind === "frame") {
        c.prog = p;                        // 匀速描画，像绘图仪
        if (p >= 1) { c.prog = 1; c.anim = null; c.state = 1; c.el.classList.remove("holding");
          S.marks[c.data.name] = 1; saveMarks(); refreshBadge(c); }
      } else if (a.kind === "body") {
        c.bodyP = U.easeInOut(p);
        if (p >= 1) { c.bodyP = 1; c.anim = null; mark(c, 2); }
      } else if (a.kind === "region") {
        c.regionP = U.easeInOut(p);
        if (p >= 1) {
          c.regionP = 1; c.anim = null; mark(c, 3);
          L.timeout(() => { if (!L.dead && c.state >= 3) showIntro(c); }, 420);
        }
      }
      paintCard(c);
    }
    /* 全息屏 */
    if (S.up) holoFrame(dt, ts);
  }

  /* ============================================================
   * 十四、进出
   * ============================================================ */
  function applyMarks() {
    cards.forEach(c => {
      const m = S.marks[c.data.name] || 0;
      if (m <= 0) { c.state = 0; c.prog = 0; c.bodyP = 0; c.regionP = 0; c.anim = null; return; }
      c.anim = null;
      c.state = m;
      c.prog = 1;
      c.bodyP = m >= 2 ? 1 : 0;
      c.regionP = m >= 3 ? 1 : 0;
      refreshBadge(c);
    });
  }

  function build() {
    rootEl = U.el("div");
    rootEl.id = "wa-root";
    rootEl.innerHTML =
      '<div id="wa-bg"></div>' +
      '<div id="wa-warm"></div>' +
      '<div id="wa-cones"><i class="wa-cone c1"></i><i class="wa-cone c2"></i><i class="wa-cone c3"></i></div>' +
      '<canvas id="wa-dust"></canvas>' +
      '<div id="wa-cyber"></div>' +
      '<div id="wa-rail"></div>' +
      '<div id="wa-title">水利家国 · 十项大国重器<em>TEN GREAT WORKS · WATER CONSERVANCY</em></div>';
    document.getElementById("page-water").appendChild(rootEl);
    rootEl.querySelector("#wa-bg").style.backgroundImage = 'url("' + encodeURI("素材/背景/名贤堂.jpg") + '")';
    dustCv = rootEl.querySelector("#wa-dust");
    const rail = rootEl.querySelector("#wa-rail");
    for (let i = 0; i < D.BUILDINGS.length; i++) {
      const c = buildCard(i);
      rail.appendChild(c.el);
    }
    buildHolo();
    S.dust = makeDust();
    S.built = true;
  }

  function bindAll() {
    cards.forEach(c => {
      L.on(c.el, "pointerdown", (e) => { e.stopPropagation(); onDown(c, e); });
    });
    L.on(window, "pointermove", onMove);
    L.on(window, "pointerup", onUp);
    L.on(window, "pointercancel", onUp);
    L.on(window, "resize", () => layout());
    L.on(window, "keydown", (e) => {
      if (e.key === "Escape") { hideIntro(); return; }
      if (S.up || S.introEl) return;
      if (e.key === "ArrowLeft") { S.cursor = (S.cursor - 1 + cards.length) % cards.length; place(); }
      if (e.key === "ArrowRight") { S.cursor = (S.cursor + 1) % cards.length; place(); }
    });
    /* 全息屏点击：完成后可重新打开介绍 */
    if (ho && ho.box) {
      L.on(ho.box, "pointerdown", (e) => {
        e.stopPropagation();
        if (ho.done && ho.card) showIntro(ho.card);
      });
    }
  }

  function enter(params) {
    if (L) { L.kill(); L = null; }        // 同一页面被重复 enter 时先清掉上一轮
    L = U.life();
    lastTs = 0;
    const p = params || {};
    S.up = !!(window.App && App.isUpgraded && App.isUpgraded());
    /* 会话校验：loadId 变化（刷新/新开）即清空已绘记录 */
    const rec = U.store.get("waterPainted", null);
    if (!rec || rec.loadId !== LOAD_ID) {
      S.marks = {};
      U.store.set("waterPainted", { loadId: LOAD_ID, marks: {} });
    } else {
      S.marks = rec.marks || {};
    }
    if (!S.built) build();
    const page = document.getElementById("page-water");
    const root = document.getElementById("wa-root");
    if (root) root.classList.toggle("up", S.up);
    if (page) page.classList.toggle("up", S.up);
    rootEl = root || rootEl;
    if (rootEl) rootEl.classList.remove("intro-open");

    /* 复位交互态 */
    S.press = null; S.drag = null; S.introEl = null;
    const oldIntro = document.querySelectorAll("#wa-intro");
    for (let i = 0; i < oldIntro.length; i++) oldIntro[i].remove();
    const ghosts = document.querySelectorAll("#wa-root .wa-ghost");
    for (let i = 0; i < ghosts.length; i++) ghosts[i].remove();
    if (ho) {
      ho.playing = false; ho.done = false; ho.card = null; ho.idx = 0; ho.p = 0;
      ho.cells = []; ho.stamp = null; ho.stampCtx = null;
      ho.hudT.textContent = "STANDBY · 待机";
      ho.hudN.textContent = "将右上角的图纸长按拖入全息屏";
      ho.hudP.style.width = "0%"; ho.hudL.textContent = "00%";
    }
    cards.forEach(c => {
      c.anim = null;
      c.el.classList.remove("holding", "press", "flip", "dragging");
      refreshBadge(c);
    });
    /* 焦点定位（保留上次停留的图纸；带 focus 参数则直接跳到该图纸） */
    if (p.focus) {
      const k = cards.findIndex(c => c.data.name === p.focus);
      if (k >= 0) { S.cursor = k; S.deckTop = k; }
    }
    if (S.cursor < 0 || S.cursor >= cards.length) S.cursor = 0;
    if (S.deckTop < 0 || S.deckTop >= cards.length) S.deckTop = 0;
    applyMarks();
    layout();
    bindAll();
    /* 入场：图纸依次落位 */
    cards.forEach((c, i) => {
      c.el.style.transition = "none";
      const base = c.el.style.transform;
      c.el.style.transform = base + " translateY(26px)";
      c.el.style.opacity = "0";
      L.timeout(() => {
        c.el.style.transition = "";
        c.el.style.opacity = "";
        c.el.style.transform = base;
      }, 60 + i * 45);
    });
    L.loop(loop);
  }

  function leave() {
    if (L) { L.kill(); L = null; }
    if (ho) { ho.playing = false; }
    S.press = null; S.drag = null; S.introEl = null;
    if (rootEl) rootEl.classList.remove("intro-open");
    const intro = document.querySelectorAll("#wa-intro");
    for (let i = 0; i < intro.length; i++) intro[i].remove();
    const ghosts = document.querySelectorAll("#wa-root .wa-ghost");
    for (let i = 0; i < ghosts.length; i++) ghosts[i].remove();
    cards.forEach(c => {
      c.anim = null;
      c.el.classList.remove("holding", "press", "flip", "dragging");
      c.el.style.transition = "";
    });
    /* 清空画布，避免下次进入残留半成品 */
    cards.forEach(c => {
      if (!c.cv) return;
      const ctx = c.cv.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, c.cv.width, c.cv.height);
    });
    const dc = document.getElementById("wa-dust");
    if (dc) { const x = dc.getContext("2d"); if (x) x.clearRect(0, 0, dc.width, dc.height); }
    const hcv = document.getElementById("wa-holo-cv");
    if (hcv) { const x = hcv.getContext("2d"); if (x) x.clearRect(0, 0, hcv.width, hcv.height); }
  }

  App.register("water", { enter, leave });
})();

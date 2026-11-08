/* ============================================================
 * L4 · 史之枢机 —— 一百一十一年的行舟
 *   · 群星按"列扫描"分批汇聚为五星红旗（汇聚速度每次随机 1.6~3.2s，绝不乱飞）
 *   · 旗面边缘星与外围星做弹簧交换（不规则边界扰动，永不崩形）
 *   · 点击红旗：整面亮起 + 白光晕扩散 + 星点转白；点击星空：0.4s 散开 → 2s 聚合
 *   · 下部星河：星点沿正弦+噪声流动；四条折纸纸船漂流、船内灯笼呼吸、吐光星
 *   · 点击纸船：星流喷涌 + 从船位置放大淡入的宣纸星空卡片（DATA.HISTORY 依次）
 *   · 已弹出的校史累积成页底时间带；末船读罢 → 星点拼出「启航」→ App.navigate("cloud")
 * ------------------------------------------------------------
 * 性能约定：星点池总数 ≤ 2500（桌面 2416 / 移动 1290）
 *           全部用预渲染星点贴图 drawImage，逐帧零 new、零 createRadialGradient
 * ============================================================ */
(function () {
  const U = window.Utils, D = window.DATA;
  const App = window.App;
  const TAU = U.TAU;

  /* ================================================================
   * 1. 样式
   * ================================================================ */
  U.injectCSS("css-pivot", `
  #page-pivot{background:#01040b;}
  #pv-root{position:absolute;inset:0;overflow:hidden;}
  #pv-cv{position:absolute;inset:0;width:100%;height:100%;z-index:1;cursor:crosshair;touch-action:manipulation;}
  #pv-root::after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;
    background:radial-gradient(120% 118% at 50% 44%,rgba(0,0,0,0) 46%,rgba(0,0,0,.52) 100%);}

  /* ---------- 左上角题名 ---------- */
  #pv-head{position:absolute;left:clamp(14px,3.2vw,46px);top:clamp(12px,3.4vh,34px);z-index:6;
    pointer-events:none;opacity:0;transform:translateY(-10px);
    transition:opacity 1.7s ease,transform 1.7s var(--ease);}
  #pv-head.in{opacity:1;transform:none;}
  #pv-head .t{font-family:var(--f-kai);font-size:clamp(12px,1.18vw,17px);color:#e8f0fc;
    letter-spacing:.26em;text-indent:.26em;
    text-shadow:0 0 12px rgba(110,170,255,.6),0 0 34px rgba(30,80,190,.45);}
  #pv-head .rule{display:flex;align-items:center;gap:7px;margin-top:10px;}
  #pv-head .rule i{display:block;width:clamp(46px,6vw,92px);height:1px;
    background:linear-gradient(90deg,rgba(242,212,145,.95),rgba(242,212,145,0));}
  #pv-head .rule b{display:block;width:3px;height:3px;border-radius:50%;background:#f2d491;
    box-shadow:0 0 9px rgba(242,212,145,1);}
  #pv-head .e{margin-top:9px;font-family:var(--f-song);font-size:9.5px;letter-spacing:.30em;
    color:rgba(148,180,220,.6);text-indent:.30em;}

  /* ---------- 交互提示 ---------- */
  #pv-hint{position:absolute;right:clamp(14px,3.2vw,46px);bottom:calc(clamp(58px,8.6vh,86px) + 12px);
    z-index:7;text-align:right;font-family:var(--f-kai);font-size:clamp(10px,.98vw,13px);
    line-height:2;letter-spacing:.18em;color:rgba(158,192,232,.5);
    pointer-events:none;opacity:0;transition:opacity 1.8s ease;
    text-shadow:0 0 16px rgba(0,0,0,.85);}
  #pv-hint.in{opacity:1;}
  #pv-hint b{font-weight:400;color:rgba(242,212,145,.85);}

  /* ---------- 校史卡片 ---------- */
  #pv-mask{position:absolute;inset:0;z-index:20;opacity:0;pointer-events:none;
    background:radial-gradient(120% 120% at 50% 46%,rgba(2,8,20,.30),rgba(1,4,12,.74));
    transition:opacity .55s ease;}
  #pv-mask.on{opacity:1;pointer-events:auto;}
  #pv-card{position:absolute;left:50%;top:46%;z-index:22;width:min(660px,86vw);
    transform:translate(-50%,-50%);pointer-events:none;opacity:0;}
  #pv-card.on{pointer-events:auto;animation:pvCardIn .88s cubic-bezier(.16,.9,.26,1) both;}
  @keyframes pvCardIn{
    0%{opacity:0;transform:translate(calc(-50% + var(--fx,0px)),calc(-50% + var(--fy,0px))) scale(.18);
      filter:blur(8px);}
    52%{opacity:1;filter:blur(0);}
    100%{opacity:1;transform:translate(-50%,-50%) scale(1);filter:none;}}

  .pv-in{position:relative;border-radius:2px;overflow:hidden;
    padding:clamp(20px,3vw,34px) clamp(20px,3.4vw,42px) clamp(15px,2.2vw,24px);
    background:
      radial-gradient(130% 92% at 8% 0%,rgba(255,255,255,.78),transparent 58%),
      radial-gradient(92% 74% at 92% 100%,rgba(206,176,116,.30),transparent 62%),
      linear-gradient(160deg,#f9f3e5 0%,#f0e7d2 46%,#e4d7ba 100%);
    box-shadow:0 30px 80px rgba(0,0,0,.68),0 0 0 1px rgba(226,196,138,.55),
      0 0 46px rgba(120,170,255,.20),inset 0 0 70px rgba(120,90,40,.13);}
  .pv-in::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.40;mix-blend-mode:multiply;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='.32'/%3E%3C/svg%3E");}
  .pv-in::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:.5;
    background-image:
      radial-gradient(circle at 9% 14%,rgba(176,138,66,.55) 0 .7px,transparent 1.5px),
      radial-gradient(circle at 24% 8%,rgba(176,138,66,.4) 0 .6px,transparent 1.4px),
      radial-gradient(circle at 63% 11%,rgba(176,138,66,.5) 0 .8px,transparent 1.6px),
      radial-gradient(circle at 88% 20%,rgba(176,138,66,.45) 0 .6px,transparent 1.4px),
      radial-gradient(circle at 14% 74%,rgba(176,138,66,.4) 0 .7px,transparent 1.5px),
      radial-gradient(circle at 41% 88%,rgba(176,138,66,.45) 0 .6px,transparent 1.4px),
      radial-gradient(circle at 78% 82%,rgba(176,138,66,.5) 0 .8px,transparent 1.6px),
      radial-gradient(circle at 95% 62%,rgba(176,138,66,.38) 0 .6px,transparent 1.4px),
      radial-gradient(circle at 33% 46%,rgba(176,138,66,.28) 0 .6px,transparent 1.4px);}
  .pv-top{position:relative;z-index:3;display:flex;justify-content:space-between;align-items:baseline;
    font-family:var(--f-song);font-size:clamp(8px,.82vw,10.5px);letter-spacing:.30em;
    color:#a08e63;text-indent:.30em;}
  .pv-top span:last-child{letter-spacing:.14em;text-indent:0;color:#b6a273;}
  .pv-seal{position:absolute;right:clamp(16px,2.6vw,30px);top:clamp(30px,4.6vw,46px);z-index:3;
    width:clamp(24px,2.4vw,32px);height:clamp(24px,2.4vw,32px);border:1.4px solid rgba(178,54,43,.66);
    border-radius:2px;color:rgba(178,54,43,.86);font-family:var(--f-kai);
    font-size:clamp(12px,1.2vw,16px);display:flex;align-items:center;justify-content:center;
    transform:rotate(-6deg);box-shadow:0 0 0 1px rgba(178,54,43,.14) inset;line-height:1;}
  .pv-year{position:relative;z-index:3;margin-top:clamp(10px,1.6vw,18px);font-family:var(--f-kai);
    font-size:clamp(30px,4.4vw,54px);line-height:1.1;letter-spacing:.06em;
    color:#7a5a24;text-shadow:0 1px 0 rgba(255,255,255,.9),0 0 20px rgba(200,160,70,.30);}
  .pv-deco{display:flex;align-items:center;gap:9px;margin:clamp(8px,1.2vw,13px) 0 clamp(10px,1.6vw,16px);}
  .pv-deco i{display:block;height:1px;width:clamp(26px,5vw,64px);
    background:linear-gradient(90deg,rgba(150,120,60,.62),rgba(150,120,60,0));}
  .pv-deco i:last-child{background:linear-gradient(90deg,rgba(150,120,60,0),rgba(150,120,60,.62));}
  .pv-deco b{display:block;width:4px;height:4px;border-radius:50%;background:#b9893c;
    box-shadow:0 0 8px rgba(220,170,80,.9);}
  .pv-text{position:relative;z-index:3;font-family:var(--f-song);font-size:clamp(12.5px,1.16vw,15.5px);
    line-height:2.08;letter-spacing:.03em;color:#2c3a50;text-align:justify;text-indent:2em;
    max-height:min(40vh,320px);overflow:auto;scrollbar-width:thin;padding-right:4px;}
  .pv-text::-webkit-scrollbar{width:3px;}
  .pv-text::-webkit-scrollbar-thumb{background:rgba(150,120,60,.4);border-radius:2px;}
  .pv-foot{position:relative;z-index:3;margin-top:clamp(12px,2vw,20px);padding-top:clamp(8px,1.2vw,12px);
    border-top:1px solid rgba(150,120,60,.24);display:flex;justify-content:space-between;align-items:center;
    font-family:var(--f-song);font-size:clamp(8px,.8vw,10px);letter-spacing:.26em;color:#a2906a;}
  .pv-foot .pv-tip{letter-spacing:.14em;color:#bca87e;margin-right:34px;}
  .pv-x{position:absolute;right:clamp(10px,1.6vw,16px);bottom:clamp(9px,1.4vw,15px);z-index:5;
    width:30px;height:30px;border-radius:50%;cursor:pointer;font-family:var(--f-hei);font-size:12px;
    color:#8a7550;background:rgba(255,252,242,.5);border:1px solid rgba(150,120,60,.3);
    display:flex;align-items:center;justify-content:center;line-height:1;
    transition:all .3s var(--ease);}
  .pv-x:hover{background:rgba(178,54,43,.12);color:#b8362b;border-color:rgba(178,54,43,.5);
    transform:rotate(90deg);}

  /* ---------- 页底校史时间带 ---------- */
  #pv-time{position:absolute;left:0;right:0;bottom:0;height:clamp(58px,8.6vh,86px);z-index:12;
    pointer-events:none;
    background:linear-gradient(0deg,rgba(1,4,12,.96) 0%,rgba(2,7,18,.62) 48%,rgba(2,7,18,0) 100%);}
  #pv-time::before{content:"";position:absolute;left:0;right:0;top:0;height:1px;
    background:linear-gradient(90deg,rgba(120,168,235,0),rgba(120,168,235,.26) 16%,rgba(226,196,138,.34) 50%,rgba(120,168,235,.26) 84%,rgba(120,168,235,0));}
  #pv-time .lab{position:absolute;left:clamp(12px,2.4vw,32px);top:5px;z-index:2;
    font-family:var(--f-song);font-size:9px;letter-spacing:.30em;color:rgba(150,180,220,.42);
    pointer-events:none;text-indent:.30em;}
  #pv-time .rail{position:absolute;inset:0;display:flex;align-items:center;
    gap:clamp(14px,2vw,30px);padding:18px clamp(16px,3vw,44px) 0;
    overflow-x:auto;overflow-y:hidden;pointer-events:auto;
    scrollbar-width:none;-ms-overflow-style:none;scroll-behavior:smooth;}
  #pv-time .rail::-webkit-scrollbar{display:none;}
  #pv-time .rail::before{content:"";position:absolute;left:0;right:0;top:50%;height:1px;pointer-events:none;
    background:linear-gradient(90deg,rgba(120,168,235,.04),rgba(120,168,235,.22) 22%,rgba(226,196,138,.26) 50%,rgba(120,168,235,.22) 78%,rgba(120,168,235,.04));}
  .pv-chip{position:relative;flex:0 0 auto;max-width:clamp(118px,15vw,188px);padding-left:16px;
    cursor:pointer;pointer-events:auto;transition:transform .35s var(--ease);}
  .pv-cw{animation:pvChipIn .62s cubic-bezier(.2,.9,.3,1) both;}
  .pv-chip i{position:absolute;left:0;top:50%;width:6px;height:6px;margin-top:-3px;border-radius:50%;
    background:#f2d491;box-shadow:0 0 10px rgba(242,212,145,.95),0 0 22px rgba(255,190,90,.55);}
  .pv-chip .cy{font-family:var(--f-kai);font-size:clamp(11px,1.02vw,14px);color:#f6dfa8;
    letter-spacing:.06em;text-shadow:0 0 12px rgba(255,200,110,.5);}
  .pv-chip .cx{margin-top:4px;font-family:var(--f-song);font-size:clamp(9px,.8vw,11px);
    color:rgba(186,208,236,.6);letter-spacing:.03em;line-height:1.5;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .pv-chip:hover{transform:translateY(-3px);}
  .pv-chip:hover .cx{color:rgba(220,236,255,.92);}
  @keyframes pvChipIn{0%{opacity:0;transform:translateY(15px) scale(.84);}100%{opacity:1;transform:none;}}

  /* ---------- 启航 ---------- */
  #pv-launch{position:absolute;z-index:9;display:none;}
  #pv-launch.on{display:block;animation:pvLaunchIn 1.2s ease both;}
  #pv-launch .hit{position:absolute;inset:-18% -9%;cursor:pointer;border-radius:50%;}
  #pv-launch .cap{position:absolute;left:50%;bottom:-44px;transform:translateX(-50%);white-space:nowrap;
    font-family:var(--f-kai);font-size:clamp(10px,1vw,13.5px);letter-spacing:.36em;text-indent:.36em;
    color:rgba(246,224,168,.92);text-shadow:0 0 16px rgba(255,206,120,.8),0 0 44px rgba(255,170,60,.5);
    animation:pvCap 3.4s ease-in-out infinite;}
  #pv-launch .cap::after{content:" ››";letter-spacing:0;}
  @keyframes pvCap{0%,100%{opacity:.5;}50%{opacity:1;}}
  @keyframes pvLaunchIn{from{opacity:0;transform:scale(.9);}to{opacity:1;transform:none;}}

  @media (max-width:780px){
    #pv-head .t{font-size:12px;letter-spacing:.22em;text-indent:.22em;}
    #pv-head .e{font-size:8.5px;letter-spacing:.22em;}
    #pv-hint{font-size:10px;letter-spacing:.12em;}
    #pv-card{top:44%;width:88vw;}
    .pv-text{max-height:36vh;line-height:1.95;}
    #pv-time{height:60px;}
    #pv-time .rail{padding:16px 14px 0;gap:14px;}
    .pv-chip{max-width:132px;}
    .pv-foot .pv-tip{margin-right:30px;}
    #pv-launch .cap{bottom:-36px;letter-spacing:.26em;}
  }
  `);

  /* ================================================================
   * 2. 常量 / 状态
   * ================================================================ */
  const MOBILE_Q = 780;          // 移动断点
  const HIST = (D && D.HISTORY && D.HISTORY.length) ? D.HISTORY
    : [{ year: "1915", text: "河海工程专门学校创立于南京，开中国水利高等教育之先河。" }];

  let L = null;                  // 生命周期
  let rootEl = null, cv = null, ctx = null;
  let headEl = null, hintEl = null, maskEl = null, cardEl = null,
      timeEl = null, railEl = null, labEl = null, launchEl = null;
  let built = false;
  let W = 0, H = 0, DPR = 1;

  let bg = [];                   // 深空背景星（三层视差）
  let flag = [];                 // 红旗星点（已按入位顺序排序）
  let flagDust = null;           // 旗面星尘纹理（让红底本身也是星海）
  let sats = [];                 // 旗面外围交换星
  let gal = [];                  // 星河星点
  let boats = [];                // 纸船
  let burst = [];                // 爆散星池
  let emit = [];                 // 纸船吐出的光星池
  let pairs = [];                // 边缘↔外围 交换对
  let ripples = [];              // 涟漪池
  let words = null;              // 启航星字
  let starAnchors = [];          // 五颗星的圆心 / 外接半径（用于星芒光晕）
  let backdrop = null, tintSpr = null, nebSprs = [], boatSpr = null;

  const SPR = { white: null, gold: null, red: null, cyan: null, warm: null, flare: null, soft: null, haloWarm: null, haloGold: null };
  const flagBox = { l: 0, t: 0, r: 0, b: 0, cx: 0, cy: 0, w: 0, h: 0 };

  const S = {
    t: 0,             // 累计秒
    last: 0,
    tNow: 0,          // performance.now()
    mode: "gather",   // gather | idle | word
    gatherT0: 0, gatherDur: 2200,
    formVal: 0,       // 旗面成形度 0..1
    glow: 0,          // 红旗发光 0..1
    scat: false, scatT0: 0, scatE: 0,
    galY: 0, galAmp: 0,
    histIdx: 0,
    cardOpen: false,
    pendingLaunch: false, launchShown: false, launching: false,
    px: 0, py: 0, pxs: 0, pys: 0,     // 指针视差
    bi: 0, ei: 0,                      // 池游标
    frames: 0,
  };

  /* ================================================================
   * 3. 预渲染贴图（一次性）
   * ================================================================ */
  function mkSpr(midRgb, edgeRgb, coreRgb) {
    const SZ = 32, c = U.mkCanvas(SZ, SZ), x = c.getContext("2d");
    const g = x.createRadialGradient(SZ / 2, SZ / 2, 0, SZ / 2, SZ / 2, SZ / 2);
    g.addColorStop(0, "rgba(" + (coreRgb || "255,255,255") + ",1)");
    g.addColorStop(0.16, "rgba(" + midRgb + ",.96)");
    g.addColorStop(0.42, "rgba(" + edgeRgb + ",.34)");
    g.addColorStop(1, "rgba(" + edgeRgb + ",0)");
    x.fillStyle = g;
    x.beginPath(); x.arc(SZ / 2, SZ / 2, SZ / 2, 0, TAU); x.fill();
    return c;
  }
  // 十字星芒（少数主星用）
  function mkFlare() {
    const SZ = 64, c = U.mkCanvas(SZ, SZ), x = c.getContext("2d"), h = SZ / 2;
    const g = x.createRadialGradient(h, h, 0, h, h, h * 0.46);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.38, "rgba(232,244,255,.52)");
    g.addColorStop(1, "rgba(180,220,255,0)");
    x.fillStyle = g; x.beginPath(); x.arc(h, h, h * 0.46, 0, TAU); x.fill();
    x.globalCompositeOperation = "lighter";
    for (let i = 0; i < 2; i++) {
      const lg = x.createLinearGradient(i ? 0 : h, i ? h : 0, i ? SZ : h, i ? h : SZ);
      lg.addColorStop(0, "rgba(214,236,255,0)");
      lg.addColorStop(0.5, "rgba(255,255,255,.92)");
      lg.addColorStop(1, "rgba(214,236,255,0)");
      x.strokeStyle = lg; x.lineWidth = i ? 1.4 : 1.8;
      x.beginPath();
      if (i === 0) { x.moveTo(0, h); x.lineTo(SZ, h); } else { x.moveTo(h, 0); x.lineTo(h, SZ); }
      x.stroke();
    }
    return c;
  }
  // 大光晕（旗面发光 / 灯笼 / 星字）
  function mkHalo(rgb, a0) {
    const SZ = 128, c = U.mkCanvas(SZ, SZ), x = c.getContext("2d");
    const g = x.createRadialGradient(SZ / 2, SZ / 2, 0, SZ / 2, SZ / 2, SZ / 2);
    g.addColorStop(0, "rgba(" + rgb + "," + a0 + ")");
    g.addColorStop(0.30, "rgba(" + rgb + "," + (a0 * 0.42) + ")");
    g.addColorStop(0.62, "rgba(" + rgb + "," + (a0 * 0.12) + ")");
    g.addColorStop(1, "rgba(" + rgb + ",0)");
    x.fillStyle = g; x.fillRect(0, 0, SZ, SZ);
    return c;
  }
  function initSprites() {
    if (SPR.white) return;
    SPR.white = mkSpr("234,246,255", "150,200,255");
    SPR.gold = mkSpr("255,242,205", "255,190,86");
    // 旗面星：暖红外核（看起来是"旗面上的火星"，而不是白点阵）
    SPR.red = mkSpr("255,178,152", "222,62,46", "255,236,226");
    SPR.cyan = mkSpr("224,248,255", "110,205,255");
    SPR.warm = mkSpr("255,238,205", "255,172,78");
    SPR.flare = mkFlare();
    SPR.soft = mkHalo("170,210,255", 0.5);
    SPR.haloWarm = mkHalo("255,196,120", 0.5);
    SPR.haloGold = mkHalo("255,214,140", 0.42);
    boatSpr = mkBoatSprite();
  }

  /* ---------------- 纸船贴图（折纸质感，一次性预渲染） ---------------- */
  const BOAT = { BW: 200, BH: 120, W: 300, H: 300, OX: 150, OY: 208 };
  function boatHull(g) {
    const { BW, BH } = BOAT, deckY = -BH * 0.10, botY = BH * 0.50;
    const hT = BW * 0.50, hB = BW * 0.30;
    g.beginPath();
    g.moveTo(-hT, deckY);
    g.lineTo(-hB, botY - BH * 0.02);
    g.quadraticCurveTo(0, botY + BH * 0.11, hB, botY - BH * 0.02);
    g.lineTo(hT, deckY);
    g.closePath();
  }
  function mkBoatSprite() {
    const { BW, BH, W: BW2, H: BH2, OX, OY } = BOAT;
    const k = 2;                                  // 贴图分辨率倍数（保持清晰）
    const deckY = -BH * 0.10, botY = BH * 0.50;
    const hT = BW * 0.50, hB = BW * 0.30;
    const apexY = -BH * 1.50;
    const c = U.mkCanvas(BW2 * k, BH2 * k), x = c.getContext("2d");
    x.setTransform(k, 0, 0, k, 0, 0);
    x.translate(OX, OY);

    // ---- 水面投影
    x.save();
    x.translate(0, botY + BH * 0.14);
    x.scale(1, 0.22);
    const shg = x.createRadialGradient(0, 0, 0, 0, 0, BW * 0.66);
    shg.addColorStop(0, "rgba(0,0,0,.55)");
    shg.addColorStop(0.55, "rgba(0,0,0,.20)");
    shg.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = shg; x.beginPath(); x.arc(0, 0, BW * 0.66, 0, TAU); x.fill();
    x.restore();

    // ---- 船体
    const hg = x.createLinearGradient(0, deckY, 0, botY);
    hg.addColorStop(0, "#fcf7ea");
    hg.addColorStop(0.55, "#eee3c8");
    hg.addColorStop(1, "#cfbd97");
    boatHull(x); x.fillStyle = hg; x.fill();
    // 左暗右亮的面差
    x.save();
    boatHull(x); x.clip();
    const sg = x.createLinearGradient(-hT, 0, 0, 0);
    sg.addColorStop(0, "rgba(120,92,50,.32)");
    sg.addColorStop(0.60, "rgba(120,92,50,0)");
    x.fillStyle = sg; x.fillRect(-hT, deckY, hT, BH);
    const lg = x.createLinearGradient(0, 0, hT, 0);
    lg.addColorStop(0, "rgba(255,255,255,0)");
    lg.addColorStop(1, "rgba(255,255,255,.55)");
    x.fillStyle = lg; x.fillRect(0, deckY, hT, BH);
    x.restore();
    // 折痕
    x.lineJoin = "round";
    x.strokeStyle = "rgba(150,120,72,.42)"; x.lineWidth = 1;
    x.beginPath(); x.moveTo(-hT, deckY); x.lineTo(hT, deckY); x.stroke();
    x.beginPath(); x.moveTo(0, deckY + 1); x.lineTo(-hB * 0.14, botY + BH * 0.06);
    x.lineTo(hB * 0.14, botY + BH * 0.06); x.closePath(); x.stroke();
    x.strokeStyle = "rgba(255,255,255,.72)"; x.lineWidth = 1.1;
    x.beginPath(); x.moveTo(-hT + 2, deckY - 1.4); x.lineTo(hT - 2, deckY - 1.4); x.stroke();

    // ---- 折纸船帆（两片三角，中线折痕）
    const sailL = () => {
      x.beginPath();
      x.moveTo(-BW * 0.335, deckY); x.lineTo(0, apexY); x.lineTo(BW * 0.02, deckY); x.closePath();
    };
    const sailR = () => {
      x.beginPath();
      x.moveTo(BW * 0.02, deckY); x.lineTo(0, apexY); x.lineTo(BW * 0.335, deckY); x.closePath();
    };
    x.save();
    x.shadowColor = "rgba(10,20,40,.42)"; x.shadowBlur = 9; x.shadowOffsetY = 4;
    sailL(); x.fillStyle = "#e7dabe"; x.fill();
    sailR(); x.fillStyle = "#fbf6e8"; x.fill();
    x.restore();
    // 帆面渐变
    const lf = x.createLinearGradient(-BW * 0.335, deckY, 0, apexY);
    lf.addColorStop(0, "rgba(150,118,66,.20)");
    lf.addColorStop(1, "rgba(255,255,255,.30)");
    sailL(); x.fillStyle = lf; x.fill();
    const rf = x.createLinearGradient(0, apexY, BW * 0.335, deckY);
    rf.addColorStop(0, "rgba(255,255,255,.45)");
    rf.addColorStop(1, "rgba(150,118,66,.08)");
    sailR(); x.fillStyle = rf; x.fill();
    // 折痕线
    x.strokeStyle = "rgba(255,255,255,.85)"; x.lineWidth = 1.2;
    x.beginPath(); x.moveTo(0, apexY + 2); x.lineTo(BW * 0.02, deckY); x.stroke();
    x.strokeStyle = "rgba(140,110,60,.34)"; x.lineWidth = 1;
    x.beginPath(); x.moveTo(0, apexY + 2); x.lineTo(-BW * 0.335, deckY); x.stroke();
    x.beginPath(); x.moveTo(0, apexY + 2); x.lineTo(BW * 0.335, deckY); x.stroke();

    // ---- 两端折起的船头船尾
    for (let s = -1; s <= 1; s += 2) {
      x.beginPath();
      x.moveTo(s * BW * 0.50, deckY);
      x.lineTo(s * BW * 0.585, deckY - BH * 0.26);
      x.lineTo(s * BW * 0.20, deckY - BH * 0.02);
      x.closePath();
      x.fillStyle = s < 0 ? "#efe4c9" : "#fcf7ea";
      x.fill();
      x.strokeStyle = "rgba(150,120,72,.30)"; x.lineWidth = 0.8; x.stroke();
    }
    // 船头高光
    x.strokeStyle = "rgba(255,255,255,.6)"; x.lineWidth = 1;
    x.beginPath(); x.moveTo(-BW * 0.50, deckY); x.lineTo(-BW * 0.585, deckY - BH * 0.25); x.stroke();

    // ---- 船内暖光（独立贴图，逐帧只调 globalAlpha）
    const lc = U.mkCanvas(BW2 * k, BH2 * k), lx = lc.getContext("2d");
    lx.setTransform(k, 0, 0, k, 0, 0);
    lx.translate(OX, OY);
    lx.save();
    boatHull(lx); lx.clip();
    const rg = lx.createRadialGradient(0, botY * 0.18, 0, 0, botY * 0.18, BW * 0.58);
    rg.addColorStop(0, "rgba(255,232,178,.98)");
    rg.addColorStop(0.38, "rgba(255,190,96,.62)");
    rg.addColorStop(1, "rgba(255,140,44,0)");
    lx.fillStyle = rg; lx.fillRect(-hT, deckY, BW, BH * 1.4);
    lx.restore();
    // 甲板上的小灯笼点
    lx.globalCompositeOperation = "lighter";
    const lg2 = lx.createRadialGradient(0, deckY + BH * 0.06, 0, 0, deckY + BH * 0.06, BW * 0.26);
    lg2.addColorStop(0, "rgba(255,244,208,1)");
    lg2.addColorStop(0.4, "rgba(255,196,110,.55)");
    lg2.addColorStop(1, "rgba(255,150,50,0)");
    lx.fillStyle = lg2;
    lx.beginPath(); lx.arc(0, deckY + BH * 0.06, BW * 0.26, 0, TAU); lx.fill();

    return { img: c, light: lc };
  }

  /* ---------------- 深空底图（一次预渲染，逐帧一次 drawImage） ---------------- */
  function buildBackdrop() {
    const c = U.mkCanvas(W * DPR, H * DPR), x = c.getContext("2d");
    x.setTransform(DPR, 0, 0, DPR, 0, 0);
    // 深空渐变
    const g = x.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.52, Math.max(W, H) * 0.92);
    g.addColorStop(0, "#081e42");
    g.addColorStop(0.34, "#051431");
    g.addColorStop(0.68, "#020a1c");
    g.addColorStop(1, "#00040c");
    x.fillStyle = g; x.fillRect(0, 0, W, H);

    // 星云团
    x.globalCompositeOperation = "lighter";
    const cols = [[92, 132, 226], [128, 96, 208], [40, 150, 190], [176, 118, 96], [70, 90, 190]];
    for (let i = 0; i < 9; i++) {
      const ang = i * 2.39, rr = 0.16 + (i % 3) * 0.11;
      const cx = W * (0.5 + Math.cos(ang) * 0.42);
      const cy = H * (0.46 + Math.sin(ang * 1.37) * 0.38);
      const r = Math.min(W, H) * rr * (0.8 + 0.5 * U.noise2(i * 3.7, 11.1));
      const col = cols[i % cols.length];
      const ng = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      ng.addColorStop(0, "rgba(" + col + ",.16)");
      ng.addColorStop(0.44, "rgba(" + col + ",.075)");
      ng.addColorStop(1, "rgba(" + col + ",0)");
      x.fillStyle = ng;
      x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill();
    }

    // 星河底光（横贯下部）
    const bandH = Math.min(H * 0.20, 190);
    const bg2 = x.createLinearGradient(0, S.galY - bandH, 0, S.galY + bandH);
    bg2.addColorStop(0, "rgba(84,140,220,0)");
    bg2.addColorStop(0.46, "rgba(104,164,244,.15)");
    bg2.addColorStop(0.5, "rgba(168,204,255,.24)");
    bg2.addColorStop(0.56, "rgba(104,158,238,.14)");
    bg2.addColorStop(1, "rgba(84,140,220,0)");
    x.fillStyle = bg2; x.fillRect(0, S.galY - bandH, W, bandH * 2);
    // 星河里几条亮带
    for (let i = 0; i < 3; i++) {
      const yy = S.galY + (i - 1) * (bandH * 0.28);
      const hh = bandH * (0.06 + i * 0.02);
      const lg = x.createLinearGradient(0, yy - hh, 0, yy + hh);
      lg.addColorStop(0, "rgba(160,205,255,0)");
      lg.addColorStop(0.5, "rgba(186,220,255,.15)");
      lg.addColorStop(1, "rgba(160,205,255,0)");
      x.fillStyle = lg; x.fillRect(0, yy - hh, W, hh * 2);
    }
    x.globalCompositeOperation = "source-over";

    // 顶部与底部压暗（电影感）
    const tg = x.createLinearGradient(0, 0, 0, H * 0.30);
    tg.addColorStop(0, "rgba(0,2,8,.72)");
    tg.addColorStop(1, "rgba(0,2,8,0)");
    x.fillStyle = tg; x.fillRect(0, 0, W, H * 0.30);
    const dg = x.createLinearGradient(0, H * 0.80, 0, H);
    dg.addColorStop(0, "rgba(0,2,8,0)");
    dg.addColorStop(1, "rgba(0,2,8,.82)");
    x.fillStyle = dg; x.fillRect(0, H * 0.80, W, H * 0.20);

    backdrop = c;

    // 两团缓慢漂移的星云（逐帧仅变换）
    nebSprs = [];
    for (let i = 0; i < 2; i++) {
      const SZ = 256, nc = U.mkCanvas(SZ, SZ), nx = nc.getContext("2d");
      const col = i ? "132,96,214" : "62,130,226";
      const ng = nx.createRadialGradient(SZ / 2, SZ / 2, 0, SZ / 2, SZ / 2, SZ / 2);
      ng.addColorStop(0, "rgba(" + col + ",.26)");
      ng.addColorStop(0.42, "rgba(" + col + ",.12)");
      ng.addColorStop(1, "rgba(" + col + ",0)");
      nx.fillStyle = ng; nx.fillRect(0, 0, SZ, SZ);
      nebSprs.push({
        img: nc, x: W * (0.28 + i * 0.46), y: H * (0.24 + i * 0.42),
        r: Math.min(W, H) * (0.30 + i * 0.08), ph: U.rand(0, TAU), a: 0.55,
      });
    }
  }

  /* ================================================================
   * 4. 星点结构（全部字段预置，避免每帧隐藏类抖动）
   * ================================================================ */
  function mkP() {
    return {
      x: 0, y: 0, hx: 0, hy: 0, gx: 0, gy: 0, vx: 0, vy: 0,
      bx: 0, by: 0, a: 0, baseA: 0.6, size: 1.4, spr: null, kind: 0,
      ph: 0, wob: 0.4, depth: 1,
      sd: 0, sAng: 0, sAmp: 0, sRot: 0,
      sx: 0, sy: 0, delay: 0, fl: 800, cx: 0, cy: 0,
      spring: false, busy: false, edge: false, perturb: false, flare: false,
      sp: 0, y0: 0,
      wtx: 0, wty: 0, wsx: 0, wsy: 0, wcx: 0, wcy: 0,
      wd: 0, wfl: 1000, wsize: 2, wa: 1, word: false, ord: 0,
      on: false, life: 0, max: 1, warm: false, rot: 1, emitT: 0, isLast: false, w: 0,
    };
  }

  function budget() {
    const m = W < MOBILE_Q;
    return {
      bg: m ? 210 : 380,
      flag: m ? 900 : 2100,
      sats: m ? 16 : 34,
      galaxy: m ? 220 : 420,
      burst: m ? 90 : 140,
      emit: m ? 44 : 72,
    };
  }

  /* ================================================================
   * 5. 几何：五角星采样 / 旗面网格 / 星河 / 纸船
   * ================================================================ */
  function starPoly(cx, cy, R, rot) {
    const p = [];
    const r = R * 0.382;                      // 五角星内外半径比
    for (let i = 0; i < 10; i++) {
      const a = rot + i * Math.PI / 5;
      const rad = i % 2 === 0 ? R : r;
      p.push({ x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad });
    }
    return p;
  }
  function inPoly(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi + 1e-9) + xi) inside = !inside;
    }
    return inside;
  }
  function polyEdge(poly, u) {
    let total = 0;
    const segs = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      segs.push(d); total += d;
    }
    let need = ((u % 1) + 1) % 1 * total;
    for (let i = 0; i < poly.length; i++) {
      if (need <= segs[i]) {
        const a = poly[i], b = poly[(i + 1) % poly.length];
        const t = segs[i] ? need / segs[i] : 0;
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      }
      need -= segs[i];
    }
    return { x: poly[0].x, y: poly[0].y };
  }

  // 采样一颗星：58% 面填充 + 42% 轮廓（轮廓让五角星锐利可辨）
  function addStarPts(arr, cx, cy, R, rot, n, spr, kind) {
    const poly = starPoly(cx, cy, R, rot);
    const nArea = Math.max(6, Math.round(n * 0.58));
    let guard = 0, made = 0;
    while (made < nArea && guard < nArea * 40) {
      guard++;
      const a = Math.random() * TAU, rr = Math.sqrt(Math.random()) * R * 0.98;
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
      if (!inPoly(x, y, poly)) continue;
      arr.push(mkFlagP(x, y, spr, kind, U.rand(1.5, 2.7), U.rand(0.74, 1)));
      made++;
    }
    for (let i = 0; i < n - nArea; i++) {
      const q = polyEdge(poly, Math.random());
      arr.push(mkFlagP(q.x + U.rand(-0.9, 0.9), q.y + U.rand(-0.9, 0.9), spr, kind,
        U.rand(1.7, 3), U.rand(0.86, 1)));
    }
  }

  function mkFlagP(x, y, spr, kind, size, a) {
    const p = mkP();
    p.x = p.hx = p.gx = x; p.y = p.hy = p.gy = y;
    p.spr = spr; p.kind = kind; p.size = size; p.baseA = a;
    p.ph = U.rand(0, TAU);
    p.wob = kind === 2 ? U.rand(0.16, 0.4) : kind === 1 ? U.rand(0.3, 0.7) : U.rand(0.4, 0.95);
    p.sd = U.rand(-140, 210);
    const dx = x - flagBox.cx, dy = y - flagBox.cy;
    p.sAng = Math.atan2(dy, dx) + U.rand(-0.75, 0.75);
    p.sAmp = U.rand(80, 300) * (0.55 + 0.45 * Math.min(1, Math.hypot(dx, dy) / (flagBox.w * 0.6)));
    p.sRot = U.rand(-1.1, 1.1);
    p.flare = kind === 2 && Math.random() < 0.10;
    return p;
  }

  function buildFlag() {
    const m = W < MOBILE_Q;
    const total = budget().flag;
    const fw = Math.min(W * (m ? 0.80 : 0.44), m ? 520 : 640);
    const fh = fw * 2 / 3;
    const cx = m ? W * 0.5 : W * 0.53;
    const cy = H * (m ? 0.275 : 0.315);
    const l = cx - fw / 2, t = cy - fh / 2;
    flagBox.l = l; flagBox.t = t; flagBox.r = l + fw; flagBox.b = t + fh;
    flagBox.w = fw; flagBox.h = fh; flagBox.cx = cx; flagBox.cy = cy;

    const nBig = Math.round(total * 0.105);
    const nSmall = Math.round(total * 0.095);
    const nBorder = Math.round(total * 0.105);
    const nField = Math.max(40, total - nBig - nSmall - nBorder);

    flag = [];
    // ---- 五颗星（标准比例：旗宽 30u，高 20u；大星外接圆 3u，小星 1u）
    const u = fw / 30;
    addStarPts(flag, l + 5 * u, t + 5 * u, 3 * u, -Math.PI / 2, nBig, SPR.gold, 2);
    const bigX = l + 5 * u, bigY = t + 5 * u;
    starAnchors = [{ x: bigX, y: bigY, r: 3 * u, big: true }];
    const smalls = [
      [10, 2], [12, 4], [12, 7], [10, 9],
    ];
    for (let i = 0; i < 4; i++) {
      const sx = l + smalls[i][0] * u, sy = t + smalls[i][1] * u;
      const rot = Math.atan2(bigY - sy, bigX - sx);     // 一个尖角指向大星中心
      addStarPts(flag, sx, sy, 1 * u, rot, Math.round(nSmall / 4), SPR.gold, 2);
      starAnchors.push({ x: sx, y: sy, r: 1 * u, big: false });
    }

    // ---- 旗面网格 + 抖动（避开五颗星）
    const starZones = [{ x: bigX, y: bigY, r: 3 * u * 1.16 }];
    for (let i = 0; i < 4; i++) starZones.push({ x: l + smalls[i][0] * u, y: t + smalls[i][1] * u, r: 1 * u * 1.5 });
    const pad = Math.max(3, fw * 0.008);
    const iw = fw - pad * 2, ih = fh - pad * 2;
    const step = Math.sqrt((iw * ih) / nField);
    const cols = Math.max(2, Math.round(iw / step));
    const rows = Math.max(2, Math.round(ih / step));
    const keep = nField / (cols * rows);
    const dBig = Math.hypot(fw, fh) * 0.55;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (Math.random() > keep) continue;
        const gx = l + pad + (c + 0.5) * iw / cols + U.rand(-0.64, 0.64) * step;
        const gy = t + pad + (r + 0.5) * ih / rows + U.rand(-0.64, 0.64) * step;
        let bad = false;
        for (let k = 0; k < starZones.length; k++) {
          const z = starZones[k];
          if ((gx - z.x) * (gx - z.x) + (gy - z.y) * (gy - z.y) < z.r * z.r) { bad = true; break; }
        }
        if (bad) continue;
        // 靠近五颗星的地方更亮更密（像被星光点燃）
        const near = 1 - Math.min(1, Math.hypot(gx - bigX, gy - bigY) / dBig);
        const white = Math.random() < 0.10;
        flag.push(mkFlagP(gx, gy, white ? SPR.white : SPR.red, 1,
          U.rand(1.05, 2.5) * (0.9 + near * 0.2),
          (white ? U.rand(0.22, 0.5) : U.rand(0.26, 0.62)) * (0.66 + near * 0.62)));
      }
    }

    // ---- 旗面边界星（参与边缘扰动 / 交换）
    const per = 2 * (fw + fh);
    const span = per / nBorder;
    let bi = 0;
    for (let edge = 0; edge < 4; edge++) {
      for (let d = 0; d < (edge < 2 ? fw : fh); d += span) {
        let x, y;
        if (edge === 0) { x = l + d; y = t; }
        else if (edge === 1) { x = l + d; y = t + fh; }
        else if (edge === 2) { x = l; y = t + d; }
        else { x = l + fw; y = t + d; }
        // 向内抖 0~2px，避免出现一条死板直线
        if (edge === 0) y += U.rand(0, 2.2);
        else if (edge === 1) y -= U.rand(0, 2.2);
        else if (edge === 2) x += U.rand(0, 2.2);
        else x -= U.rand(0, 2.2);
        const p = mkFlagP(x, y, Math.random() < 0.35 ? SPR.gold : SPR.white, 1,
          U.rand(1.25, 2.3), U.rand(0.5, 0.92));
        p.edge = true;
        p.perturb = (bi % 4 === 0);          // 1/4 边缘星常驻弹簧扰动
        p.spring = p.perturb;
        flag.push(p);
        bi++;
      }
    }

    // ---- 按"列扫描"排序：从左到右分批入位（绝不乱飞）
    for (let i = 0; i < flag.length; i++) {
      const p = flag[i];
      p.ord = (p.hx - l) / fw * 0.84 + (p.hy - t) / fh * 0.16;
    }
    flag.sort(function (a, b) { return a.ord - b.ord; });

    // ---- 干扰标志位复位
    for (let i = 0; i < flag.length; i++) {
      const p = flag[i];
      p.a = 0; p.vx = p.vy = 0; p.busy = false; p.gx = p.hx; p.gy = p.hy;
      p.word = false;
    }
  }

  function buildSats() {
    sats = [];
    const n = budget().sats;
    const R = Math.hypot(flagBox.w, flagBox.h) * 0.5;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + U.rand(-0.2, 0.2);
      const r = R * U.rand(1.02, 1.5);
      const p = mkP();
      p.bx = flagBox.cx + Math.cos(a) * r * 1.08;
      p.by = flagBox.cy + Math.sin(a) * r * 0.94;
      p.hx = p.gx = p.x = p.bx;
      p.hy = p.gy = p.y = p.by;
      p.spr = SPR.white; p.kind = 3;
      p.size = U.rand(1.15, 2.1); p.baseA = U.rand(0.35, 0.78);
      p.ph = U.rand(0, TAU); p.wob = U.rand(0.4, 0.9);
      p.sd = U.rand(-160, 220); p.sAng = Math.atan2(p.by - flagBox.cy, p.bx - flagBox.cx);
      p.sAmp = U.rand(60, 200); p.sRot = U.rand(-1, 1);
      p.flare = Math.random() < 0.14;
      p.a = 0;
      sats.push(p);
    }
  }

  function buildBg() {
    bg = [];
    const n = budget().bg;
    for (let i = 0; i < n; i++) {
      const p = mkP();
      p.bx = U.rand(0, W); p.by = U.rand(0, H);
      p.depth = i % 3 === 0 ? 1 : (i % 3 === 1 ? 0.66 : 0.38);
      p.size = p.depth > 0.9 ? U.rand(1.05, 2.3) : p.depth > 0.5 ? U.rand(0.85, 1.6) : U.rand(0.6, 1.1);
      p.baseA = p.depth > 0.9 ? U.rand(0.5, 0.95) : p.depth > 0.5 ? U.rand(0.32, 0.72) : U.rand(0.18, 0.46);
      p.spr = Math.random() < 0.13 ? SPR.gold : (Math.random() < 0.12 ? SPR.cyan : SPR.white);
      p.ph = U.rand(0, TAU);
      p.flare = Math.random() < 0.045;
      p.sd = U.rand(-140, 210); p.sAng = U.rand(0, TAU);
      p.sAmp = U.rand(18, 78); p.sRot = 0;
      p.x = p.bx; p.y = p.by;
      bg.push(p);
    }
  }

  function buildGalaxy() {
    gal = [];
    const n = budget().galaxy;
    const amp = (W < MOBILE_Q ? 0.075 : 0.08) * H;
    for (let i = 0; i < n; i++) {
      const p = mkP();
      p.bx = U.rand(-W * 0.08, W * 1.08);
      p.y0 = U.rand(-1, 1);
      p.sp = U.rand(7, 32);
      p.depth = U.rand(0.3, 1);
      p.ph = U.rand(0, TAU);
      p.size = U.rand(1.0, 2.6) * (0.7 + 0.5 * p.depth);
      p.baseA = U.rand(0.26, 0.86) * (0.55 + 0.45 * p.depth);
      p.spr = Math.random() < 0.26 ? SPR.warm : SPR.cyan;
      p.warm = Math.random() < 0.09;
      p.flare = Math.random() < 0.03;
      p.a = p.baseA;
      gal.push(p);
    }
    S.galY = H * (W < MOBILE_Q ? 0.70 : 0.735);
    // 星河带宽（供绘制参考）
    S.galAmp = amp;
  }

  function buildBoats() {
    boats = [];
    const m = W < MOBILE_Q;
    const xs = m ? [0.20, 0.40, 0.60, 0.80] : [0.17, 0.385, 0.60, 0.815];
    const bw = m ? Math.max(56, W * 0.145) : Math.min(126, W * 0.086);
    for (let i = 0; i < xs.length; i++) {
      const p = mkP();
      p.bx = W * xs[i];
      p.w = bw * (0.92 + i * 0.035);
      p.ph = U.rand(0, TAU);
      p.rot = U.rand(0.7, 1.2);              // 漂流节奏
      p.vrot = (i % 2) ? -1 : 1;             // 镜像：让四条船不完全一样
      p.x = p.bx; p.y = S.galY;
      p.kind = i;
      p.isLast = (i === xs.length - 1);
      p.life = 0;                            // 点击高光计时
      p.emitT = U.rand(300, 1400);
      p.warm = false;                        // 是否已读
      boats.push(p);
    }
  }

  function buildPools() {
    const B = budget();
    burst = []; emit = [];
    for (let i = 0; i < B.burst; i++) burst.push(mkP());
    for (let i = 0; i < B.emit; i++) emit.push(mkP());
    pairs = [];
    const pn = W < MOBILE_Q ? 12 : 26;
    for (let i = 0; i < pn; i++) pairs.push({ on: false, ep: null, sp: null, t: 0, dur: 0 });
    ripples = [];
    for (let i = 0; i < 6; i++) ripples.push({ on: false, x: 0, y: 0, r0: 0, r1: 0, t: 0, dur: 800, col: "255,230,180" });
  }

  /* ================================================================
   * 6. 汇聚 / 归位 / 散开
   * ================================================================ */
  function startGather(dur) {
    S.mode = "gather";
    S.gatherDur = dur;
    S.gatherT0 = performance.now();
    const n = flag.length;
    const cx = flagBox.cx, cy = flagBox.cy;
    const R = Math.hypot(W, H) * 0.62;
    for (let i = 0; i < n; i++) {
      const p = flag[i];
      const rank = n > 1 ? i / (n - 1) : 0;
      // 起点：绕旗一周的同心环 → 螺旋收束，有序且壮观
      const ang = -1.15 + rank * TAU * 0.92 + ((i * 37) % 11) * 0.004;
      const rr = R * (0.58 + 0.52 * (((i * 53) % 100) / 100));
      p.sx = cx + Math.cos(ang) * rr;
      p.sy = cy + Math.sin(ang) * rr * 0.88;
      // 分批：rank 越大越晚出发（小抖动保持"人味"但不乱）
      p.delay = rank * dur * 0.54 + ((i * 17) % 13) * 5.5;
      p.fl = dur * 0.45;
      // 贝塞尔控制点：中点绕旗心旋转 → 统一方向的涡旋
      const mx = (p.sx + p.hx) * 0.5, my = (p.sy + p.hy) * 0.5;
      const dx = mx - cx, dy = my - cy;
      const rot = 0.34, co = Math.cos(rot), si = Math.sin(rot);
      p.cx = cx + dx * co - dy * si;
      p.cy = cy + dx * si + dy * co;
      p.x = p.sx; p.y = p.sy;
      p.a = 0; p.vx = p.vy = 0;
      p.spring = false; p.gx = p.hx; p.gy = p.hy;
      p.word = false;
    }
    for (let i = 0; i < sats.length; i++) { const p = sats[i]; p.a = 0; p.x = p.hx; p.y = p.hy; }
    deactivateAllPairs();
  }

  function snapHome() {
    for (let i = 0; i < flag.length; i++) {
      const p = flag[i];
      p.x = p.hx; p.y = p.hy; p.gx = p.hx; p.gy = p.hy;
      p.a = p.baseA; p.vx = p.vy = 0;
      p.spring = p.perturb; p.busy = false;
    }
    for (let i = 0; i < sats.length; i++) {
      const p = sats[i];
      p.x = p.hx; p.y = p.hy; p.gx = p.hx; p.gy = p.hy;
      p.a = p.baseA; p.vx = p.vy = 0; p.spring = false; p.busy = false;
    }
    S.mode = "idle";
    S.formVal = 1;
    S.scat = false;
    deactivateAllPairs();
  }

  function startScatter(x, y) {
    S.scat = true;
    S.scatT0 = performance.now();
    deactivateAllPairs();
    addRipple(x, y, 8, Math.max(W, H) * 0.28, 900, "160,205,255");
    spawnBurst(x, y, W < MOBILE_Q ? 16 : 26, false);
  }
  // 散开系数：0~400ms 快速散开，400~2400ms 缓慢聚拢
  function scatK(e) {
    if (e <= 0) return 0;
    if (e < 400) return U.easeOut(e / 400);
    return 1 - U.easeInOut(U.clamp((e - 400) / 2000, 0, 1));
  }

  /* ================================================================
   * 7. 边缘交换（弹簧 / 回位）
   * ================================================================ */
  function deactivateAllPairs() {
    for (let i = 0; i < pairs.length; i++) {
      const pr = pairs[i];
      if (pr.on) deactivatePair(pr);
    }
  }
  function activatePair() {
    let slot = null;
    for (let i = 0; i < pairs.length; i++) if (!pairs[i].on) { slot = pairs[i]; break; }
    if (!slot) return;
    // 边缘星
    let ep = null;
    for (let k = 0; k < 16; k++) {
      const c = flag[(Math.random() * flag.length) | 0];
      if (c && c.edge && !c.busy) { ep = c; break; }
    }
    if (!ep) { for (let i = 0; i < flag.length; i++) if (flag[i].edge && !flag[i].busy) { ep = flag[i]; break; } }
    if (!ep) return;
    // 外围星
    let sp = null;
    for (let k = 0; k < 16; k++) {
      const c = sats[(Math.random() * sats.length) | 0];
      if (c && !c.busy) { sp = c; break; }
    }
    if (!sp) return;

    ep.busy = true; sp.busy = true;
    ep.spring = true; sp.spring = true;
    ep.gx = sp.hx; ep.gy = sp.hy;                 // 边缘星漂到外围
    sp.gx = ep.hx; sp.gy = ep.hy;                 // 外围星补进旗面
    ep.vx = ep.vy = sp.vx = sp.vy = 0;
    slot.on = true; slot.ep = ep; slot.sp = sp;
    slot.t = 0; slot.dur = U.rand(2000, 5200);
  }
  function deactivatePair(pr) {
    const ep = pr.ep, sp = pr.sp;
    if (ep) { ep.gx = ep.hx; ep.gy = ep.hy; ep.busy = false; }
    if (sp) { sp.gx = sp.bx; sp.gy = sp.by; sp.busy = false; }
    pr.on = false; pr.ep = null; pr.sp = null;
  }
  // 弹簧步进：欠阻尼 + 双正弦扰动 → 不规则运动但必然回位
  function springStep(p, T) {
    p.vx += (p.gx - p.x) * 0.02;
    p.vy += (p.gy - p.y) * 0.02;
    p.vx += (Math.sin(T * 1.9 + p.ph) + Math.sin(T * 0.77 + p.ph * 2.1)) * 0.030;
    p.vy += (Math.cos(T * 1.63 + p.ph * 1.3) + Math.sin(T * 0.61 + p.ph * 1.7)) * 0.030;
    p.vx *= 0.94; p.vy *= 0.94;
    p.x += p.vx; p.y += p.vy;
  }

  /* ================================================================
   * 8. 涟漪 / 爆散 / 吐星
   * ================================================================ */
  function addRipple(x, y, r0, r1, dur, col) {
    for (let i = 0; i < ripples.length; i++) {
      const r = ripples[i];
      if (r.on) continue;
      r.on = true; r.x = x; r.y = y; r.r0 = r0; r.r1 = r1;
      r.t = 0; r.dur = dur; r.col = col;
      return;
    }
  }
  function spawnBurst(x, y, n, warm) {
    if (!burst.length) return;
    for (let i = 0; i < n; i++) {
      S.bi = (S.bi + 1) % burst.length;
      const p = burst[S.bi];
      const a = Math.random() * TAU;
      const sp = U.rand(38, 250) * (0.6 + 0.6 * Math.random());
      p.on = true;
      p.x = x + U.rand(-9, 9); p.y = y + U.rand(-9, 9);
      p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp - 34;
      p.life = 0; p.max = U.rand(680, 1550);
      p.size = U.rand(1.2, 3.1);
      p.warm = !!warm;
      p.spr = warm ? (Math.random() < 0.62 ? SPR.warm : SPR.white)
                   : (Math.random() < 0.5 ? SPR.cyan : SPR.white);
      p.ph = U.rand(0, TAU);
      p.flare = Math.random() < 0.14;
    }
  }
  function spawnEmit(b) {
    if (!emit.length) return;
    for (let i = 0; i < emit.length; i++) {
      S.ei = (S.ei + 1) % emit.length;
      const p = emit[S.ei];
      if (p.on) continue;
      p.on = true;
      p.x = b.x + U.rand(-b.w * 0.26, b.w * 0.26);
      p.y = b.y - b.w * 0.06;
      p.vx = U.rand(-7, 7); p.vy = U.rand(-30, -13);
      p.life = 0; p.max = U.rand(1500, 2900);
      p.size = U.rand(1.1, 2.5);
      p.spr = Math.random() < 0.62 ? SPR.warm : SPR.white;
      p.ph = U.rand(0, TAU);
      p.flare = Math.random() < 0.1;
      return;
    }
  }

  /* ================================================================
   * 9. 启航星字
   * ================================================================ */
  function sampleText(text) {
    const fs = Math.round(U.clamp(Math.min(W * 0.17, H * 0.25), 92, 236));
    const font = fs + 'px "KaiTi","STKaiti","Kaiti SC","Songti SC",serif';
    const pad = 18;
    const c = U.mkCanvas(8, 8);
    let x = c.getContext("2d");
    x.font = font;
    const tw = Math.max(40, Math.ceil(x.measureText(text).width));
    const cw = Math.ceil(tw + pad * 2), ch = Math.ceil(fs * 1.44);
    c.width = cw; c.height = ch;
    x = c.getContext("2d");
    x.font = font;
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillStyle = "#fff";
    x.fillText(text, cw / 2, ch / 2);
    let data = null;
    try { data = x.getImageData(0, 0, cw, ch).data; } catch (e) { data = null; }
    const pts = [];
    if (data) {
      const step = 2;
      for (let yy = 0; yy < ch; yy += step) {
        for (let xx = 0; xx < cw; xx += step) {
          if (data[(yy * cw + xx) * 4 + 3] > 128) pts.push({ x: xx - cw / 2, y: yy - ch / 2 });
        }
      }
    }
    return { fs: fs, w: cw, h: ch, pts: pts };
  }

  function showWord() {
    const res = sampleText("启航");
    // 星点密度：太少笔画会断，太多又会糊成一团
    const need = Math.min(flag.length, W < MOBILE_Q ? 460 : 780);
    const cx = W * 0.5, cy = H * (H < 620 ? 0.38 : 0.41);
    // 随机抽稀（逐行 stride 会留下斜向栅格，随机抽点更均匀自然）
    const list = res.pts;
    const picked = [];
    if (list.length) {
      const idx = [];
      for (let i = 0; i < list.length; i++) idx.push(i);
      const take = Math.min(need, list.length);
      for (let i = 0; i < take; i++) {
        const j = i + ((Math.random() * (idx.length - i)) | 0);
        const tmp = idx[i]; idx[i] = idx[j]; idx[j] = tmp;
        const q = list[idx[i]];
        picked.push({ x: q.x + U.rand(-0.7, 0.7), y: q.y + U.rand(-0.7, 0.7) });
      }
    }
    if (!picked.length) {
      for (let i = 0; i < need; i++) {
        picked.push({ x: (i % 30 - 15) * 8, y: (Math.floor(i / 30) - 8) * 8 });
      }
    }

    for (let i = 0; i < flag.length; i++) {
      const p = flag[i];
      if (i < picked.length) {
        const q = picked[i];
        p.word = true;
        p.wtx = cx + q.x; p.wty = cy + q.y;
        p.wsx = p.hx; p.wsy = p.hy;
        const mx = (p.wsx + p.wtx) * 0.5, my = (p.wsy + p.wty) * 0.5;
        const dx = mx - cx, dy = my - cy;
        const co = Math.cos(0.30), si = Math.sin(0.30);
        p.wcx = cx + dx * co - dy * si;
        p.wcy = cy + dx * si + dy * co;
        p.wd = (i / picked.length) * 640 + U.rand(0, 150);
        p.wfl = U.rand(880, 1240);
        p.wsize = U.rand(1.6, 2.9);
        p.wa = U.rand(0.76, 1);
        p.flare = Math.random() < 0.07;
      } else {
        p.word = false;
      }
    }
    for (let i = 0; i < sats.length; i++) sats[i].busy = true;   // 外围星淡出
    words = { cx: cx, cy: cy, w: res.w, h: res.h, fs: res.fs, t0: performance.now(), n: picked.length };
    S.formVal = 1;
  }

  function positionLaunch() {
    if (!launchEl || !words) return;
    launchEl.style.left = (words.cx - words.w * 0.5) + "px";
    launchEl.style.top = (words.cy - words.h * 0.5) + "px";
    launchEl.style.width = words.w + "px";
    launchEl.style.height = words.h + "px";
  }

  function showLaunch() {
    if (S.launchShown || S.launching) return;
    S.launchShown = true;
    showWord();
    positionLaunch();
    S.mode = "word";
    deactivateAllPairs();
    if (hintEl) {
      hintEl.classList.add("in");
      hintEl.innerHTML = "<b>启航</b> · 驶向「AI 为伴的云时代」";
    }
    if (L) {
      L.timeout(function () {
        if (!L || L.dead) return;
        if (launchEl) launchEl.classList.add("on");
      }, 1500);
    }
  }

  /* ================================================================
   * 10. 逐帧更新
   * ================================================================ */
  function updateFlag(dt) {
    const T = S.t, tNow = S.tNow;

    /* ---- 启航星字 ---- */
    if (S.mode === "word") {
      const e0 = tNow - (words ? words.t0 : tNow);
      S.formVal = Math.max(0, 1 - e0 / 900);
      for (let i = 0; i < flag.length; i++) {
        const p = flag[i];
        if (!p.word) {
          p.a = Math.max(0, p.a - dt * 0.0018);
          continue;
        }
        const q = U.clamp((e0 - p.wd) / p.wfl, 0, 1);
        const ee = U.easeInOut(q);
        const uu = 1 - ee;
        p.x = uu * uu * p.wsx + 2 * uu * ee * p.wcx + ee * ee * p.wtx;
        p.y = uu * uu * p.wsy + 2 * uu * ee * p.wcy + ee * ee * p.wty;
        p.a = p.wa * (0.25 + 0.75 * q);
      }
      for (let i = 0; i < sats.length; i++) sats[i].a = Math.max(0, sats[i].a - dt * 0.0012);
      return;
    }

    /* ---- 汇聚 ---- */
    if (S.mode === "gather") {
      const e = tNow - S.gatherT0;
      S.formVal = U.clamp(e / (S.gatherDur * 0.9), 0, 1);
      for (let i = 0; i < flag.length; i++) {
        const p = flag[i];
        const q = (e - p.delay) / p.fl;
        if (q <= 0) { p.x = p.sx; p.y = p.sy; p.a = 0; continue; }
        if (q >= 1) { p.x = p.hx; p.y = p.hy; p.a = p.baseA; continue; }
        const ee = U.easeOut(q), uu = 1 - ee;
        p.x = uu * uu * p.sx + 2 * uu * ee * p.cx + ee * ee * p.hx;
        p.y = uu * uu * p.sy + 2 * uu * ee * p.cy + ee * ee * p.hy;
        p.a = p.baseA * Math.min(1, q * 3.4);
      }
      const sf = S.formVal;
      for (let i = 0; i < sats.length; i++) sats[i].a = sats[i].baseA * sf;
      if (e > S.gatherDur + 260) {
        S.mode = "idle";
        S.formVal = 1;
        for (let i = 0; i < flag.length; i++) flag[i].spring = flag[i].perturb;
        addRipple(flagBox.cx, flagBox.cy, flagBox.w * 0.22,
          Math.max(flagBox.w, flagBox.h) * 0.92, 1500, "255,228,180");
        if (hintEl) hintEl.classList.add("in");
      }
      return;
    }

    /* ---- 散开 / 聚拢（分析式，零状态抖动） ---- */
    if (S.scat) {
      const e0 = tNow - S.scatT0;
      S.scatE = e0;
      // 旗面底光随散开一起消散（否则会变成"星星离开红板子"的假象）
      S.formVal = 1 - 0.94 * scatK(e0);
      for (let i = 0; i < flag.length; i++) {
        const p = flag[i];
        const k = scatK(e0 + p.sd);
        const ang = p.sAng + p.sRot * k * k;
        const rr = p.sAmp * k;
        p.x = p.hx + Math.cos(ang) * rr;
        p.y = p.hy + Math.sin(ang) * rr;
        p.a = Math.min(1, p.baseA * (0.30 + 0.74 * k) * 1.28);
      }
      for (let i = 0; i < sats.length; i++) {
        const p = sats[i];
        const k = scatK(e0 + p.sd);
        p.x = p.hx + Math.cos(p.sAng) * p.sAmp * k;
        p.y = p.hy + Math.sin(p.sAng) * p.sAmp * k;
        p.a = Math.min(1, p.baseA * (0.22 + 0.78 * k) * 1.15);
      }
      if (e0 > 2520) {
        S.scat = false;
        snapHome();
      }
      return;
    }

    /* ---- 常态：弹簧 / 归位 ---- */
    S.formVal += (1 - S.formVal) * 0.08;
    for (let i = 0; i < flag.length; i++) {
      const p = flag[i];
      if (p.spring) springStep(p, T);
      else { p.x = p.hx; p.y = p.hy; }
      p.a = p.baseA;
    }
    // 外围星：缓慢绕旗漂移，参与交换
    for (let i = 0; i < sats.length; i++) {
      const p = sats[i];
      p.hx = p.bx + Math.sin(T * 0.25 + p.ph) * 11;
      p.hy = p.by + Math.cos(T * 0.21 + p.ph * 1.6) * 10;
      if (p.busy) springStep(p, T);
      else { p.gx = p.hx; p.gy = p.hy; p.x = p.hx; p.y = p.hy; p.vx = p.vy = 0; }
      p.a = p.baseA;
    }
    // 随机开启交换对
    if (Math.random() < dt * 0.0017) activatePair();
    for (let i = 0; i < pairs.length; i++) {
      const pr = pairs[i];
      if (!pr.on) continue;
      pr.t += dt;
      if (pr.t > pr.dur) deactivatePair(pr);
    }
  }

  /* ================================================================
   * 11. 绘制
   * ================================================================ */
  function drawBackdrop() {
    if (backdrop) ctx.drawImage(backdrop, 0, 0, W, H);
    if (nebSprs.length) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < nebSprs.length; i++) {
        const n = nebSprs[i];
        const x = n.x + Math.sin(S.t * 0.05 + n.ph) * W * 0.04;
        const y = n.y + Math.cos(S.t * 0.042 + n.ph) * H * 0.03;
        ctx.globalAlpha = n.a * (0.62 + 0.38 * Math.sin(S.t * 0.22 + n.ph));
        ctx.drawImage(n.img, x - n.r, y - n.r, n.r * 2, n.r * 2);
      }
      ctx.restore();
    }
  }

  function drawBg(dt) {
    const T = S.t;
    const px = S.pxs, py = S.pys;
    ctx.globalCompositeOperation = "lighter";
    const scat = S.scat, e0 = S.scatE;
    for (let i = 0; i < bg.length; i++) {
      const p = bg[i];
      p.bx += p.depth * 3.2 * dt * 0.001;
      if (p.bx > W + 6) p.bx = -6;
      let x = p.bx + px * p.depth * 26;
      let y = p.by + py * p.depth * 18;
      if (scat) {
        const k = scatK(e0 + p.sd);
        x += Math.cos(p.sAng) * p.sAmp * k;
        y += Math.sin(p.sAng) * p.sAmp * k;
      }
      if (x < -30 || x > W + 30 || y < -30 || y > H + 30) continue;
      const tw = 0.62 + 0.38 * Math.sin(T * (0.9 + p.depth * 1.1) + p.ph);
      const a = p.baseA * tw * (scat ? 0.85 : 1);
      if (a <= 0.012) continue;
      const sz = p.size * (0.85 + 0.3 * tw);
      ctx.globalAlpha = a;
      ctx.drawImage(p.spr, x - sz, y - sz, sz * 2, sz * 2);
      if (p.flare) {
        ctx.globalAlpha = a * 0.42;
        const f = sz * 7;
        ctx.drawImage(SPR.flare, x - f / 2, y - f / 2, f, f);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  function drawFlagBase() {
    if (!tintSpr) return;
    const a = S.formVal * (0.66 + S.glow * 0.42) * (S.mode === "word" ? 0.6 : 1);
    if (a <= 0.01) return;
    ctx.globalAlpha = a;
    ctx.drawImage(tintSpr.img, flagBox.l - tintSpr.pad, flagBox.t - tintSpr.pad,
      tintSpr.w, tintSpr.h);
    ctx.globalAlpha = 1;
    // 旗面星尘：红底不是一块实色，而是一片低亮的星海
    if (!flagDust) {
      flagDust = [];
      const n = Math.round(620 * (flagBox.w * flagBox.h) / (1100 * 700));
      for (let i = 0; i < Math.min(900, Math.max(260, n)); i++) {
        flagDust.push({ x: flagBox.l + Math.random() * flagBox.w, y: flagBox.t + Math.random() * flagBox.h,
          r: U.rand(0.4, 1.5), a: U.rand(0.14, 0.62), ph: U.rand(0, 9), sp: U.rand(0.5, 1.7) });
      }
    }
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < flagDust.length; i++) {
      const d = flagDust[i];
      ctx.globalAlpha = a * d.a * (0.35 + 0.65 * Math.abs(Math.sin(S.t * d.sp + d.ph)));
      ctx.fillStyle = "#ffd9a8";
      ctx.fillRect(d.x, d.y, d.r, d.r);
    }
    ctx.restore();
    // 旗面布纹与折影：让红底有"绸料"的体积，而不是一块平色
    ctx.save();
    ctx.globalAlpha = a;
    for (let i = 0; i < 4; i++) {
      const t = (S.t * 0.00013 + i * 0.27) % 1;
      const x = flagBox.l + flagBox.w * (t * 1.3 - 0.15);
      const wb = flagBox.w * (0.18 + i * 0.03);
      const g = ctx.createLinearGradient(x - wb, 0, x + wb, 0);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(0.42, "rgba(58,2,2,.17)");
      g.addColorStop(0.5, "rgba(255,132,116,.12)");
      g.addColorStop(0.58, "rgba(58,2,2,.15)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(flagBox.l, flagBox.t, flagBox.w, flagBox.h);
    }
    // 四角与边缘压暗，强化幅面
    const vg2 = ctx.createRadialGradient(flagBox.cx, flagBox.cy, Math.min(flagBox.w, flagBox.h) * .28,
      flagBox.cx, flagBox.cy, Math.max(flagBox.w, flagBox.h) * .72);
    vg2.addColorStop(0, "rgba(0,0,0,0)");
    vg2.addColorStop(1, "rgba(30,0,0,.3)");
    ctx.fillStyle = vg2;
    ctx.fillRect(flagBox.l, flagBox.t, flagBox.w, flagBox.h);
    ctx.restore();
    ctx.globalAlpha = 1;

    // 五颗星背后的金色星芒（让星星比旗面更"亮"、更立体）
    if (starAnchors.length) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const breathe = 0.82 + 0.18 * Math.sin(S.t * 1.3);
      for (let i = 0; i < starAnchors.length; i++) {
        const s = starAnchors[i];
        const r = s.r * (s.big ? 4.4 : 4.2) * breathe;
        ctx.globalAlpha = S.formVal * (s.big ? 0.22 : 0.17) * (1 + S.glow);
        ctx.drawImage(SPR.haloGold, s.x - r, s.y - r, r * 2, r * 2);
      }
      ctx.restore();
    }

    // 发光：整面亮起 + 光晕扩散
    if (S.glow > 0.02) {
      const gw = Math.max(flagBox.w, flagBox.h) * 2.1;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = S.glow * 0.46 * S.formVal;
      ctx.drawImage(SPR.haloWarm, flagBox.cx - gw / 2, flagBox.cy - gw / 2, gw, gw);
      ctx.globalAlpha = S.glow * 0.30 * S.formVal;
      ctx.drawImage(SPR.haloWarm, flagBox.cx - gw * 0.32, flagBox.cy - gw * 0.32, gw * 0.64, gw * 0.64);
      ctx.restore();
    }

    // 四角金线（展览感，极淡）
    const fo = S.formVal * 0.30;
    if (fo > 0.02) {
      const L2 = Math.min(20, flagBox.w * 0.045);
      const l = flagBox.l - 6, t = flagBox.t - 6, r = flagBox.r + 6, b = flagBox.b + 6;
      ctx.strokeStyle = "rgba(242,212,145," + fo.toFixed(3) + ")";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(l, t + L2); ctx.lineTo(l, t); ctx.lineTo(l + L2, t);
      ctx.moveTo(r - L2, t); ctx.lineTo(r, t); ctx.lineTo(r, t + L2);
      ctx.moveTo(r, b - L2); ctx.lineTo(r, b); ctx.lineTo(r - L2, b);
      ctx.moveTo(l + L2, b); ctx.lineTo(l, b); ctx.lineTo(l, b - L2);
      ctx.stroke();
    }
  }

  function drawFlagStars() {
    if (S.mode === "word") return;              // 启航阶段由 drawWord 接管
    const T = S.t, glow = S.glow;
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < flag.length; i++) {
      const p = flag[i];
      if (p.a <= 0.015) continue;
      let x = p.x, y = p.y;
      if (p.wob > 0.01 && !p.spring && !p.word) {
        x += Math.sin(T * 1.25 + p.ph) * p.wob;
        y += Math.cos(T * 1.05 + p.ph * 1.7) * p.wob;
      }
      const sz = p.size;
      ctx.globalAlpha = p.a;
      ctx.drawImage(p.spr, x - sz, y - sz, sz * 2, sz * 2);
      if (p.flare) {
        ctx.globalAlpha = p.a * 0.5;
        const f = sz * 6;
        ctx.drawImage(SPR.flare, x - f / 2, y - f / 2, f, f);
      }
      if (glow > 0.02) {
        ctx.globalAlpha = p.a * glow * 0.92;
        ctx.drawImage(SPR.white, x - sz * 1.6, y - sz * 1.6, sz * 3.2, sz * 3.2);
      }
    }
    // 外围星
    for (let i = 0; i < sats.length; i++) {
      const p = sats[i];
      if (p.a <= 0.015) continue;
      const sz = p.size;
      ctx.globalAlpha = p.a;
      ctx.drawImage(p.spr, p.x - sz, p.y - sz, sz * 2, sz * 2);
      if (p.flare) {
        ctx.globalAlpha = p.a * 0.48;
        const f = sz * 6;
        ctx.drawImage(SPR.flare, p.x - f / 2, p.y - f / 2, f, f);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  function drawGalaxy(dt) {
    const T = S.t, cy = S.galY, amp = S.galAmp || H * 0.08;
    const wA = U.noise2(T * 0.06, 0.3) - 0.5;
    const wB = U.noise2(T * 0.05, 7.1) - 0.5;
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < gal.length; i++) {
      const p = gal[i];
      p.bx += p.sp * dt * 0.001 * p.depth;
      if (p.bx > W * 1.1) p.bx = -W * 0.1;
      const ph = p.bx * 0.010 + p.ph + T * 0.55;
      const ny = cy + p.y0 * amp * p.depth
        + Math.sin(ph) * amp * 0.42
        + Math.sin(ph * 2.7 + p.ph) * amp * 0.16
        + (wA * 0.8 + wB * 0.2) * 30 * p.depth;
      const edge = Math.min(p.bx / (W * 0.13), (W - p.bx) / (W * 0.13), 1);
      const tw = 0.74 + 0.26 * Math.sin(T * 2.05 + p.ph * 3.1);
      const a = p.baseA * tw * Math.max(0, edge);
      if (a <= 0.012) continue;
      const sz = p.size;
      ctx.globalAlpha = a;
      ctx.drawImage(p.spr, p.bx - sz, ny - sz, sz * 2, sz * 2);
      if (p.flare) {
        ctx.globalAlpha = a * 0.4;
        const f = sz * 6;
        ctx.drawImage(SPR.flare, p.bx - f / 2, ny - f / 2, f, f);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  function drawBoats(dt) {
    if (!boatSpr) return;
    const T = S.t;
    for (let i = 0; i < boats.length; i++) {
      const b = boats[i];
      // 漂流
      b.x = b.bx + Math.sin(T * 0.17 * b.rot + b.ph) * W * 0.022;
      b.y = S.galY + Math.sin(T * 0.26 * b.rot + b.ph * 1.7) * 7 - b.w * 0.26;
      const ang = Math.sin(T * 0.42 * b.rot + b.ph) * 0.055;
      const scf = b.w / BOAT.BW;
      const br = 0.36 + 0.26 * Math.sin(T * 1.55 + b.ph * 2.2);
      const hot = b.life > 0 ? Math.min(1, b.life / 520) : 0;
      if (b.life > 0) b.life = Math.max(0, b.life - dt);

      // 灯笼光晕
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(ang);
      if (b.vrot < 0) ctx.scale(-1, 1);
      const gr = b.w * 0.92;
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = Math.min(1, (br + hot * 0.8) * 0.9);
      ctx.drawImage(SPR.haloWarm, -gr, -gr - b.w * 0.05, gr * 2, gr * 2);
      // 已读纸船的柔和金环
      if (b.warm) {
        ctx.globalAlpha = 0.16 + 0.10 * Math.sin(T * 1.9 + i);
        ctx.drawImage(SPR.haloWarm, -gr * 0.7, -gr * 0.7, gr * 1.4, gr * 1.4);
      }
      // 纸船本体
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.drawImage(boatSpr.img,
        -BOAT.OX * scf, -BOAT.OY * scf, BOAT.W * scf, BOAT.H * scf);
      // 船内暖光（呼吸）
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = Math.min(1, br + hot * 0.5);
      ctx.drawImage(boatSpr.light,
        -BOAT.OX * scf, -BOAT.OY * scf, BOAT.W * scf, BOAT.H * scf);
      ctx.restore();

      // 吐星
      b.emitT -= dt;
      if (b.emitT <= 0) {
        b.emitT = U.rand(420, 1500);
        spawnEmit(b);
      }
    }
  }

  function drawEmit(dt) {
    const T = S.t;
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < emit.length; i++) {
      const p = emit[i];
      if (!p.on) continue;
      p.life += dt;
      if (p.life > p.max) { p.on = false; continue; }
      const q = p.life / p.max;
      p.vy += 12 * dt * 0.001;                 // 缓缓回落
      p.vx += Math.sin(T * 1.1 + p.ph) * 4 * dt * 0.001;
      p.x += p.vx * dt * 0.001;
      p.y += p.vy * dt * 0.001;
      const a = Math.sin(Math.PI * Math.min(1, q)) * 0.95;
      const sz = p.size * (1 - q * 0.5);
      ctx.globalAlpha = a;
      ctx.drawImage(p.spr, p.x - sz, p.y - sz, sz * 2, sz * 2);
      if (p.flare) {
        ctx.globalAlpha = a * 0.4;
        const f = sz * 6;
        ctx.drawImage(SPR.flare, p.x - f / 2, p.y - f / 2, f, f);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  function drawBurst(dt) {
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < burst.length; i++) {
      const p = burst[i];
      if (!p.on) continue;
      p.life += dt;
      if (p.life > p.max) { p.on = false; continue; }
      const q = p.life / p.max;
      p.vx *= 0.982;
      p.vy = p.vy * 0.982 + 26 * dt * 0.001;
      p.x += p.vx * dt * 0.001;
      p.y += p.vy * dt * 0.001;
      const a = (1 - q) * 0.95;
      const sz = p.size * (1 - q * 0.42);
      ctx.globalAlpha = a;
      ctx.drawImage(p.spr, p.x - sz, p.y - sz, sz * 2, sz * 2);
      // 运动拖尾（两颗残影，不额外旋转）
      ctx.globalAlpha = a * 0.34;
      ctx.drawImage(p.spr, p.x - p.vx * 0.012 - sz * 0.7, p.y - p.vy * 0.012 - sz * 0.7,
        sz * 1.4, sz * 1.4);
      if (p.flare) {
        ctx.globalAlpha = a * 0.45;
        const f = sz * 6;
        ctx.drawImage(SPR.flare, p.x - f / 2, p.y - f / 2, f, f);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  function drawRipples(dt) {
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < ripples.length; i++) {
      const r = ripples[i];
      if (!r.on) continue;
      r.t += dt;
      if (r.t > r.dur) { r.on = false; continue; }
      const q = r.t / r.dur;
      const rad = r.r0 + (r.r1 - r.r0) * U.easeOut(q);
      const a = (1 - q) * (1 - q) * 0.8;
      ctx.strokeStyle = "rgba(" + r.col + "," + a.toFixed(3) + ")";
      ctx.lineWidth = 1 + (1 - q) * 2.4;
      ctx.beginPath(); ctx.arc(r.x, r.y, rad, 0, TAU); ctx.stroke();
      if (q < 0.6) {
        ctx.globalAlpha = a * 0.5;
        const g = rad * 0.5;
        ctx.drawImage(SPR.haloWarm, r.x - g, r.y - g, g * 2, g * 2);
        ctx.globalAlpha = 1;
      }
    }
    ctx.globalCompositeOperation = "source-over";
  }

  function drawWord() {
    if (S.mode !== "word" || !words) return;
    const T = S.t;
    ctx.globalCompositeOperation = "lighter";
    // 字后光晕
    const gr = Math.max(words.w, words.h) * 0.82;
    const beat = 0.20 + 0.10 * Math.sin(T * 1.35);
    ctx.globalAlpha = beat;
    ctx.drawImage(SPR.haloWarm, words.cx - gr, words.cy - gr, gr * 2, gr * 2);
    for (let i = 0; i < flag.length; i++) {
      const p = flag[i];
      if (!p.word || p.a <= 0.012) continue;
      const tw = 0.60 + 0.40 * Math.sin(T * 1.75 + p.ph * 2.0);
      const sz = p.wsize;
      ctx.globalAlpha = p.a * tw;
      ctx.drawImage(SPR.gold, p.x - sz, p.y - sz, sz * 2, sz * 2);
      if (p.flare) {
        ctx.globalAlpha = p.a * tw * 0.5;
        const f = sz * 6;
        ctx.drawImage(SPR.flare, p.x - f / 2, p.y - f / 2, f, f);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  /* ================================================================
   * 12. 主循环
   * ================================================================ */
  function frame() {
    if (!cv) return;
    const f = U.fitCanvas(cv);
    if (f.w < 2 || f.h < 2) return;
    if (Math.abs(f.w - W) > 0.5 || Math.abs(f.h - H) > 0.5) {
      W = f.w; H = f.h; DPR = f.dpr;
      layout();
    } else {
      DPR = f.dpr;
    }
    ctx = f.ctx;
    if (!ctx) return;

    const tNow = performance.now();
    let dt = tNow - (S.last || tNow);
    S.last = tNow;
    if (dt > 64) dt = 64;
    if (dt < 0) dt = 0;
    S.tNow = tNow;
    S.t += dt * 0.001;
    S.frames++;
    S.pxs += (S.px - S.pxs) * 0.05;
    S.pys += (S.py - S.pys) * 0.05;
    S.scatE = S.scat ? (tNow - S.scatT0) : 0;
    // 发光衰减（与状态机解耦，任何阶段都在退光）
    if (S.glow > 0) S.glow = Math.max(0, S.glow - dt / 2100);

    ctx.clearRect(0, 0, W, H);
    drawBackdrop();
    drawBg(dt);
    updateFlag(dt);
    drawFlagBase();
    drawFlagStars();
    drawGalaxy(dt);
    drawBoats(dt);
    drawEmit(dt);
    drawBurst(dt);
    drawRipples(dt);
    drawWord();
  }

  /* ================================================================
   * 13. 布局
   * ================================================================ */
  function layout() {
    if (!W || !H) return;
    initSprites();
    // 星河位置需先知道（供底图使用）
    S.galY = H * (W < MOBILE_Q ? 0.70 : 0.735);
    S.galAmp = (W < MOBILE_Q ? 0.075 : 0.08) * H;
    buildFlag();
    buildSats();
    buildBg();
    buildGalaxy();
    buildBoats();
    buildPools();
    buildBackdrop();
    tintSpr = mkTint(flagBox.w, flagBox.h);
    words = null;
    if (S.mode === "word") {
      showWord();
      positionLaunch();
    } else if (S.mode === "gather") {
      startGather(S.gatherDur);
    } else {
      snapHome();
    }
  }

  function mkTint(w, h) {
    const pad = 26;
    const c = U.mkCanvas((w + pad * 2) * DPR, (h + pad * 2) * DPR);
    const x = c.getContext("2d");
    x.setTransform(DPR, 0, 0, DPR, 0, 0);
    x.shadowColor = "rgba(224,62,48,.95)";
    x.shadowBlur = 26;
    const g = x.createLinearGradient(0, 0, w * 0.85, h);
    g.addColorStop(0, "rgba(226,66,50,.60)");
    g.addColorStop(0.46, "rgba(196,42,34,.52)");
    g.addColorStop(1, "rgba(130,22,20,.46)");
    x.fillStyle = g;
    U.roundRect(x, pad, pad, w, h, 3); x.fill();
    x.shadowBlur = 0;
    x.globalCompositeOperation = "lighter";
    // 左上（五颗星一侧）的柔光，避免旗面死板
    const hl = x.createRadialGradient(pad + w * 0.22, pad + h * 0.26, 0,
      pad + w * 0.22, pad + h * 0.26, w * 0.72);
    hl.addColorStop(0, "rgba(255,146,118,.22)");
    hl.addColorStop(0.5, "rgba(255,110,86,.07)");
    hl.addColorStop(1, "rgba(255,80,60,0)");
    x.fillStyle = hl;
    U.roundRect(x, pad, pad, w, h, 3); x.fill();
    const g2 = x.createLinearGradient(0, pad, 0, pad + h);
    g2.addColorStop(0, "rgba(255,140,110,.12)");
    g2.addColorStop(1, "rgba(255,56,40,.02)");
    x.fillStyle = g2;
    U.roundRect(x, pad, pad, w, h, 3); x.fill();
    // 内阴影：让旗面有厚度，不至于像一张平色卡
    x.globalCompositeOperation = "source-over";
    const inner = x.createRadialGradient(pad + w * 0.42, pad + h * 0.42, Math.min(w, h) * 0.18,
      pad + w * 0.5, pad + h * 0.5, Math.max(w, h) * 0.72);
    inner.addColorStop(0, "rgba(70,8,6,0)");
    inner.addColorStop(0.62, "rgba(70,8,6,.06)");
    inner.addColorStop(1, "rgba(52,4,4,.26)");
    x.fillStyle = inner;
    U.roundRect(x, pad, pad, w, h, 3); x.fill();
    return { img: c, pad: pad, w: w + pad * 2, h: h + pad * 2 };
  }

  /* ================================================================
   * 14. 交互
   * ================================================================ */
  function hitBoat(x, y) {
    let best = null, bd = 1e9;
    for (let i = 0; i < boats.length; i++) {
      const b = boats[i];
      const dx = x - b.x, dy = y - b.y;
      const ang = Math.sin(S.t * 0.42 * b.rot + b.ph) * 0.055;
      const co = Math.cos(-ang), si = Math.sin(-ang);
      const lx = dx * co - dy * si;
      const ly = dx * si + dy * co;
      const hw = b.w * 0.62, top = -b.w * 1.28, bot = b.w * 0.34;
      if (Math.abs(lx) < hw && ly > top && ly < bot) {
        const d = Math.abs(lx) + Math.abs(ly);
        if (d < bd) { bd = d; best = b; }
      }
    }
    return best;
  }
  function inFlag(x, y) {
    const pd = 14;
    return x > flagBox.l - pd && x < flagBox.r + pd && y > flagBox.t - pd && y < flagBox.b + pd;
  }

  function onRootClick(e) {
    if (S.launching) return;
    if (S.cardOpen) return;
    const t = e.target;
    if (t && t.closest && t.closest(".pv-card,.pv-chip,#pv-launch,.pv-x,.pv-in")) return;
    if (S.mode === "word") return;
    const r = rootEl.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;

    // 1) 纸船
    const b = hitBoat(x, y);
    if (b) { onBoatClick(b); return; }
    // 2) 红旗
    if (inFlag(x, y)) { onFlagClick(x, y); return; }
    // 3) 星空
    if (!S.scat) startScatter(x, y);
  }

  function onFlagClick(x, y) {
    S.glow = 1;
    addRipple(flagBox.cx, flagBox.cy, flagBox.w * 0.18,
      Math.max(flagBox.w, flagBox.h) * 1.02, 1400, "255,226,170");
    addRipple(flagBox.cx, flagBox.cy, flagBox.w * 0.06,
      Math.max(flagBox.w, flagBox.h) * 0.58, 950, "255,255,255");
    spawnBurst(U.clamp(x, flagBox.l, flagBox.r), U.clamp(y, flagBox.t, flagBox.b), 14, true);
  }

  function onBoatClick(b) {
    b.life = 900;
    b.warm = true;
    spawnBurst(b.x, b.y - b.w * 0.1, b.isLast ? (W < MOBILE_Q ? 46 : 74) : (W < MOBILE_Q ? 28 : 46), true);
    addRipple(b.x, b.y - b.w * 0.1, b.w * 0.2, b.w * 1.9, 900, "255,214,150");
    const item = histNext();
    if (!item) {
      // 校史条目已全部弹出：直接让「启航」浮现
      if (L) L.timeout(showLaunch, 520);
      else showLaunch();
      return;
    }
    openCard(item.item, item.idx, b);
    addChip(item.item, item.idx);
    if (b.isLast) S.pendingLaunch = true;      // 末船 → 收卡后弹出「启航」
  }

  function histNext() {
    if (S.histIdx >= HIST.length) {
      if (!S.launchShown) { S.pendingLaunch = true; }
      return null;
    }
    const idx = S.histIdx;
    S.histIdx++;
    return { item: HIST[idx], idx: idx };
  }

  /* ---------------- 校史卡片 ---------------- */
  function openCard(item, idx, fromBoat) {
    if (!cardEl) return;
    let ox = W * 0.5, oy = H * 0.92;                     // 默认从时间带处放大
    if (fromBoat) { ox = fromBoat.x; oy = fromBoat.y; }   // 从纸船处放大淡入
    const cxp = W * 0.5, cyp = H * (W < MOBILE_Q ? 0.44 : 0.46);
    cardEl.style.setProperty("--fx", (ox - cxp).toFixed(1) + "px");
    cardEl.style.setProperty("--fy", (oy - cyp).toFixed(1) + "px");
    cardEl.innerHTML = cardHTML(item, idx, !!(fromBoat && fromBoat.isLast));
    cardEl.classList.remove("on");
    void cardEl.offsetWidth;
    cardEl.classList.add("on");
    if (maskEl) maskEl.classList.add("on");
    S.cardOpen = true;
    const btn = cardEl.querySelector(".pv-x");
    if (btn && L) L.on(btn, "click", function (ev) { ev.stopPropagation(); closeCard(); });
  }
  function cardHTML(item, idx, isLast) {
    const no = String(idx + 1).padStart(2, "0") + " / " + String(HIST.length).padStart(2, "0");
    const tip = isLast ? "收卷后 · 舟将启航" : "点击空白处收卷";
    return '<div class="pv-in">' +
      '<div class="pv-top"><span>史 之 枢 机 · 校 史 长 卷</span><span>' + no + '</span></div>' +
      '<div class="pv-seal">史</div>' +
      '<div class="pv-year">' + U.esc(item.year) + '</div>' +
      '<div class="pv-deco"><i></i><b></b><i></i></div>' +
      '<div class="pv-text">' + U.esc(item.text) + '</div>' +
      '<div class="pv-foot"><span>河海大学 · 一百一十一载</span>' +
      '<span class="pv-tip">' + tip + '</span></div>' +
      '<button class="pv-x" type="button" aria-label="关闭">✕</button>' +
      '</div>';
  }
  function closeCard() {
    if (!S.cardOpen) { if (maskEl) maskEl.classList.remove("on"); return; }
    S.cardOpen = false;
    if (cardEl) cardEl.classList.remove("on");
    if (maskEl) maskEl.classList.remove("on");
    if (S.pendingLaunch && !S.launchShown) {
      S.pendingLaunch = false;
      if (L) L.timeout(showLaunch, 460);
      else showLaunch();
    }
  }

  /* ---------------- 时间带 ---------------- */
  function addChip(item, idx) {
    if (!railEl) return;
    const chip = U.el("div", "pv-chip");
    chip.dataset.i = String(idx);
    const short = item.text.length > 18 ? item.text.slice(0, 18) + "…" : item.text;
    chip.innerHTML = '<div class="pv-cw"><div class="cy">' + U.esc(item.year) + '</div>' +
      '<div class="cx">' + U.esc(short) + '</div></div><i></i>';
    railEl.appendChild(chip);
    if (labEl) labEl.textContent = "校史 · 已录 " + railEl.children.length + " 段";
    try { railEl.scrollTo({ left: railEl.scrollWidth, behavior: "smooth" }); }
    catch (err) { railEl.scrollLeft = railEl.scrollWidth; }
    if (L) {
      L.on(chip, "click", function (ev) {
        ev.stopPropagation();
        if (S.cardOpen) return;
        openCard(item, idx, null);
      });
    }
  }

  /* ================================================================
   * 15. DOM 构建
   * ================================================================ */
  function build() {
    if (built) return;
    const page = document.getElementById("page-pivot");
    if (!page) return;
    page.innerHTML =
      '<div id="pv-root">' +
        '<canvas id="pv-cv"></canvas>' +
        '<div id="pv-head">' +
          '<div class="t">史之枢机 · 一百一十一年的行舟</div>' +
          '<div class="rule"><i></i><b></b></div>' +
          '<div class="e">CONSTELLATION OF 111 YEARS</div>' +
        '</div>' +
        '<div id="pv-hint">点击 <b>红旗</b> 令其发光 · 点击 <b>星空</b> 散而复聚<br>点击 <b>纸船</b> 打捞一段校史</div>' +
        '<div id="pv-time"><div class="lab">校史 · 已录 0 段</div><div class="rail"></div></div>' +
        '<div id="pv-launch"><div class="hit"></div><div class="cap">点击启航</div></div>' +
        '<div id="pv-mask"></div>' +
        '<div id="pv-card"></div>' +
      '</div>';

    rootEl = document.getElementById("pv-root");
    cv = document.getElementById("pv-cv");
    headEl = document.getElementById("pv-head");
    hintEl = document.getElementById("pv-hint");
    timeEl = document.getElementById("pv-time");
    railEl = timeEl ? timeEl.querySelector(".rail") : null;
    labEl = timeEl ? timeEl.querySelector(".lab") : null;
    launchEl = document.getElementById("pv-launch");
    maskEl = document.getElementById("pv-mask");
    cardEl = document.getElementById("pv-card");
    built = true;
  }

  function bind() {
    if (!L || !rootEl) return;
    L.on(rootEl, "click", onRootClick);
    if (maskEl) L.on(maskEl, "click", function (e) { e.stopPropagation(); closeCard(); });
    L.on(rootEl, "pointermove", function (e) {
      if (!W || !H) return;
      const r = rootEl.getBoundingClientRect();
      const nx = (e.clientX - r.left) / W - 0.5;
      const ny = (e.clientY - r.top) / H - 0.5;
      S.px = U.clamp(nx, -0.6, 0.6);
      S.py = U.clamp(ny, -0.6, 0.6);
      if (cv && e.target === cv && !S.cardOpen) {
        const x = e.clientX - r.left, y = e.clientY - r.top;
        cv.style.cursor = hitBoat(x, y) ? "pointer" : (inFlag(x, y) ? "pointer" : "crosshair");
      }
    });
    L.on(rootEl, "pointerleave", function () { S.px = 0; S.py = 0; });
    if (launchEl) {
      L.on(launchEl, "click", function (e) {
        e.stopPropagation();
        if (S.launching) return;
        S.launching = true;
        App.navigate("cloud", {}, { transition: "flash", flashMs: 420 });
      });
    }
    // 尺寸变化（节流，防抖定时器不受 life 管理 → 内部判活）
    const onRs = U.throttle(function () {
      if (!L || L.dead || !cv) return;
      const f = U.fitCanvas(cv);
      if (f.w < 2 || f.h < 2) return;
      W = f.w; H = f.h; DPR = f.dpr;
      layout();
    }, 220);
    L.on(window, "resize", onRs);
    L.on(window, "orientationchange", onRs);
  }

  function reset() {
    S.t = 0; S.last = 0; S.tNow = performance.now();
    S.mode = "gather";
    S.gatherDur = U.rand(1600, 3200);       // 每次进入速度随机
    S.formVal = 0; S.glow = 0; S.scat = false; S.scatE = 0;
    S.histIdx = 0;
    S.cardOpen = false; S.pendingLaunch = false; S.launchShown = false; S.launching = false;
    S.px = 0; S.py = 0; S.pxs = 0; S.pys = 0;
    S.bi = 0; S.ei = 0; S.frames = 0;
    words = null;
    if (cardEl) cardEl.classList.remove("on");
    if (maskEl) maskEl.classList.remove("on");
    if (launchEl) { launchEl.classList.remove("on"); launchEl.style.left = ""; launchEl.style.top = ""; launchEl.style.width = ""; launchEl.style.height = ""; }
    if (railEl) railEl.innerHTML = "";
    if (labEl) labEl.textContent = "校史 · 已录 0 段";
    if (headEl) headEl.classList.remove("in");
    if (hintEl) {
      hintEl.classList.remove("in");
      hintEl.innerHTML = "点击 <b>红旗</b> 令其发光 · 点击 <b>星空</b> 散而复聚<br>点击 <b>纸船</b> 打捞一段校史";
    }
    if (boats.length) for (let i = 0; i < boats.length; i++) { boats[i].warm = false; boats[i].life = 0; }
  }

  /* ================================================================
   * 16. 生命周期
   * ================================================================ */
  function enter() {
    L = U.life();
    build();
    if (!rootEl || !cv) return;
    // 先量尺寸，layout 才能算出旗面 / 星河
    const f = U.fitCanvas(cv);
    W = Math.max(2, f.w); H = Math.max(2, f.h); DPR = f.dpr;
    reset();
    bind();
    layout();
    if (hintEl) hintEl.classList.remove("in");
    L.timeout(function () { if (headEl) headEl.classList.add("in"); }, 260);
    // 汇聚结束再显提示（汇聚期间不打扰）
    L.timeout(function () { if (hintEl && S.mode === "idle") hintEl.classList.add("in"); },
      S.gatherDur + 900);
    L.loop(frame);
  }

  function leave() {
    if (L) { L.kill(); L = null; }
    S.cardOpen = false;
    if (cardEl) cardEl.classList.remove("on");
    if (maskEl) maskEl.classList.remove("on");
    if (launchEl) launchEl.classList.remove("on");
    if (hintEl) hintEl.classList.remove("in");
    if (headEl) headEl.classList.remove("in");
    if (cv && ctx) { try { ctx.clearRect(0, 0, W, H); } catch (e) {} }
    // 释放大图，避免多次进出累积显存
    backdrop = null; tintSpr = null; nebSprs = [];
    words = null;
    boats = []; flag = []; sats = []; bg = []; gal = []; burst = []; emit = [];
  }

  App.register("pivot", { enter: enter, leave: leave });
})();

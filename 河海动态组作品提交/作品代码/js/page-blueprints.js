/* ============================================================
 * L1 · Blueprints — 「你心目中的蓝图」
 *   · 赛博未来城市：深蓝紫夜空 + 极光 / 视差楼群 / 量子轨道列车 /
 *     极光能量鲸 / 低空飞行器 / 直通宇宙的电梯（均可点击，有 hover 指示）
 *   · DATA.BLUEPRINT_COPY 快速打字（等宽 + 青蓝辉光 + 扫描线）
 *   · 豆包 / 即梦 AI 入口 → 前端程序化生成「未来蓝图」并淡入为页面背景（本次到访仅一次）
 *   · 初始蓝图 / 自制图片 / AI 蓝图 三个图框，点击切换背景
 *   · 盗梦空间陀螺接口：点击旋转 + 累计点击数 → 全屏数码字节（上飘）+ 灰尘（下落）
 *     分解 → App.navigate("cloud")
 * ============================================================ */
(function () {
  "use strict";
  const U = window.Utils, D = window.DATA;
  const TAU = Math.PI * 2;

  /* ---------------------------------------------------------------- CSS */
  U.injectCSS("css-blueprints", `
  #bp-root{position:absolute;inset:0;overflow:hidden;background:#03060f;
    font-family:var(--f-hei);color:#dbeaff;}
  #bp-bg{position:absolute;inset:0;width:100%;height:100%;z-index:1;
    transition:opacity 1.2s ease, filter 1s ease;}
  #bp-root.has-img #bp-bg{opacity:.30;}

  /* 生成的蓝图背景（渐变淡入替换背景） */
  #bp-imgview{position:absolute;inset:0;z-index:2;pointer-events:none;opacity:0;
    background-position:center center;background-size:cover;background-repeat:no-repeat;
    transition:opacity 1.5s ease;transform:scale(1.03);
    filter:saturate(1.08) contrast(1.05);}
  #bp-imgview.on{opacity:.96;}
  #bp-imgview::after{content:"";position:absolute;inset:0;
    background:
      radial-gradient(120% 96% at 50% 26%, rgba(2,10,26,.10) 0%, rgba(2,8,20,.46) 58%, rgba(1,4,12,.86) 100%),
      linear-gradient(180deg, rgba(3,8,20,.44) 0%, rgba(3,8,20,0) 24%, rgba(2,6,16,.72) 100%);}

  /* 扫描线 + 暗角 */
  #bp-scan{position:absolute;inset:0;z-index:6;pointer-events:none;
    background:repeating-linear-gradient(0deg, rgba(120,200,255,.05) 0 1px, transparent 1px 3px);
    mix-blend-mode:screen;opacity:.6;}
  #bp-scan::after{content:"";position:absolute;inset:0;mix-blend-mode:multiply;
    background:radial-gradient(118% 118% at 50% 46%, rgba(0,0,0,0) 38%, rgba(1,6,16,.66) 100%);}
  #bp-scan::before{content:"";position:absolute;left:0;right:0;height:22%;top:-30%;opacity:.5;
    background:linear-gradient(180deg, transparent, rgba(120,205,255,.10) 50%, transparent);
    animation:bpSweep 7.5s linear infinite;}
  @keyframes bpSweep{0%{top:-30%;}100%{top:110%;}}

  /* 左上角小字标题 */
  #bp-title{position:absolute;left:26px;top:20px;z-index:22;pointer-events:none;
    display:flex;align-items:baseline;gap:9px;
    font-family:var(--f-mono);font-size:11.5px;letter-spacing:.2em;color:#8fb8e6;
    text-shadow:0 0 18px rgba(60,150,255,.55);}
  #bp-title b{font-weight:400;color:#d6ecff;letter-spacing:.26em;display:flex;align-items:center;}
  #bp-title b::before{content:"";display:inline-block;width:6px;height:6px;margin-right:9px;border-radius:50%;
    background:#5ee6ff;box-shadow:0 0 12px #5ee6ff,0 0 26px rgba(90,220,255,.7);
    animation:bpDot 2.4s ease-in-out infinite;}
  @keyframes bpDot{0%,100%{opacity:.35;transform:scale(.8);}50%{opacity:1;transform:scale(1.15);}}
  #bp-title::after{content:"";position:absolute;left:0;top:calc(100% + 7px);width:100%;height:1px;
    background:linear-gradient(90deg, rgba(94,230,255,.8), rgba(94,230,255,.05) 70%, transparent);}

  /* 主面板：页面上部中间 */
  #bp-panel{position:absolute;left:50%;top:4.6vh;transform:translateX(-50%);z-index:20;
    width:min(596px, 68vw);max-height:84vh;overflow-y:auto;overflow-x:hidden;padding:17px 20px 15px;
    border-radius:14px;border:1px solid rgba(96,180,255,.24);
    background:linear-gradient(162deg, rgba(7,21,44,.76), rgba(4,11,26,.62) 62%, rgba(3,9,22,.72));
    box-shadow:0 26px 76px rgba(0,8,24,.66), inset 0 1px 0 rgba(150,205,255,.12),
      0 0 70px rgba(22,90,200,.14);
    backdrop-filter:blur(9px) saturate(1.12);-webkit-backdrop-filter:blur(9px) saturate(1.12);
    scrollbar-width:thin;transition:opacity .9s ease, filter .9s ease, transform .9s ease;}
  #bp-panel::-webkit-scrollbar{width:4px;}
  #bp-panel::before{content:"";position:absolute;inset:6px;border:1px solid rgba(96,180,255,.09);
    border-radius:9px;pointer-events:none;}
  #bp-panel::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;pointer-events:none;
    background:linear-gradient(90deg, transparent, rgba(94,230,255,.7), transparent);}

  .bp-copy-head{display:flex;align-items:center;gap:9px;font-family:var(--f-mono);
    font-size:9.5px;letter-spacing:.28em;color:#4f8ec4;margin-bottom:11px;}
  .bp-copy-head i{width:15px;height:1px;background:#5ee6ff;box-shadow:0 0 9px #5ee6ff;}
  #bp-copy{font-family:var(--f-mono);font-size:clamp(12px,1.02vw,14.5px);line-height:2.15;
    letter-spacing:.052em;color:#d8f0ff;min-height:6.6em;word-break:break-word;
    text-shadow:0 0 12px rgba(74,190,255,.55), 0 0 34px rgba(30,120,255,.3);}
  #bp-copy .ch{display:inline-block;white-space:pre;}
  #bp-copy .ch.in{animation:bpCharIn .46s ease both;}
  @keyframes bpCharIn{0%{opacity:0;filter:blur(4px);transform:translateY(-4px);}
    100%{opacity:1;filter:none;transform:none;}}
  #bp-copy .cur{display:inline-block;width:7px;height:1.02em;margin-left:3px;vertical-align:-2px;
    background:#7fe9ff;box-shadow:0 0 14px #7fe9ff,0 0 30px rgba(90,200,255,.7);
    animation:bpCur 1s steps(2,end) infinite;}
  @keyframes bpCur{0%,50%{opacity:1;}51%,100%{opacity:0;}}
  .bp-copy-foot{margin-top:6px;font-family:var(--f-mono);font-size:9px;letter-spacing:.26em;color:#3f7cad;
    display:flex;align-items:center;gap:8px;}
  .bp-copy-foot em{font-style:normal;color:#6fd6ff;}

  .bp-ai-tabs{display:flex;align-items:center;gap:8px;margin:14px 0 10px;}
  .bp-tab{font-family:var(--f-mono);font-size:11px;letter-spacing:.16em;color:#7fa9cf;
    padding:6px 14px;border-radius:20px;border:1px solid rgba(96,160,230,.28);
    background:rgba(8,22,44,.55);cursor:pointer;transition:all .3s var(--ease);}
  .bp-tab:hover{color:#d8f0ff;border-color:rgba(110,210,255,.62);box-shadow:0 0 22px rgba(50,150,255,.34);}
  .bp-tab.on{color:#eafaff;border-color:rgba(94,230,255,.88);
    background:linear-gradient(135deg, rgba(20,90,180,.58), rgba(8,36,80,.5));
    box-shadow:0 0 24px rgba(70,190,255,.46), inset 0 0 16px rgba(90,210,255,.18);
    text-shadow:0 0 12px rgba(130,235,255,.9);}
  .bp-ai-state{margin-left:auto;font-family:var(--f-mono);font-size:9px;letter-spacing:.22em;color:#4f8ec4;}

  .bp-ai-dialog{display:flex;gap:9px;align-items:stretch;}
  #bp-desc{flex:1 1 auto;min-height:58px;max-height:92px;resize:none;padding:9px 12px;border-radius:9px;
    border:1px solid rgba(96,160,230,.3);background:rgba(3,12,28,.74);color:#dff2ff;
    font-family:var(--f-mono);font-size:11.5px;line-height:1.78;letter-spacing:.04em;outline:none;
    transition:border-color .3s, box-shadow .3s;user-select:text;-webkit-user-select:text;}
  #bp-desc:focus{border-color:rgba(94,230,255,.82);
    box-shadow:0 0 0 3px rgba(50,150,255,.14), 0 0 28px rgba(40,140,255,.26);}
  #bp-desc::placeholder{color:#4d6f96;}
  #bp-desc:disabled{color:#8fb6d6;opacity:.8;}
  .bp-gen{flex:0 0 96px;font-family:var(--f-mono);font-size:11.5px;letter-spacing:.14em;color:#06121f;
    border:none;border-radius:9px;cursor:pointer;
    background:linear-gradient(150deg,#a9f4ff,#4fb8ff 55%,#2c7bdc);
    box-shadow:0 0 26px rgba(80,200,255,.5), inset 0 1px 0 rgba(255,255,255,.55);
    transition:all .3s var(--ease);}
  .bp-gen:hover{transform:translateY(-1px);box-shadow:0 0 36px rgba(110,220,255,.78);}
  .bp-gen:active{transform:scale(.98);}
  .bp-gen[disabled]{background:rgba(28,50,78,.72);color:#71889f;cursor:not-allowed;
    box-shadow:none;transform:none;letter-spacing:.1em;}

  .bp-thumbs{display:flex;gap:9px;margin-top:12px;}
  .bp-thumb{position:relative;flex:1 1 0;height:58px;border-radius:8px;overflow:hidden;cursor:pointer;
    border:1px solid rgba(96,160,230,.3);background:#071528 center center/cover no-repeat;
    transition:all .3s var(--ease);padding:0;font-family:var(--f-mono);}
  .bp-thumb i{position:absolute;inset:0;z-index:1;
    background:linear-gradient(180deg, rgba(3,10,22,.05) 24%, rgba(2,8,20,.9));
    pointer-events:none;}
  .bp-thumb em{position:absolute;left:0;right:0;bottom:4px;z-index:2;font-style:normal;font-size:9px;
    letter-spacing:.14em;color:#a8cbe8;}
  .bp-thumb:hover{border-color:rgba(110,210,255,.72);box-shadow:0 0 24px rgba(60,170,255,.4);
    transform:translateY(-2px);}
  .bp-thumb.on{border-color:rgba(94,230,255,.95);
    box-shadow:0 0 26px rgba(80,210,255,.55), inset 0 0 18px rgba(80,210,255,.25);}
  .bp-thumb.on em{color:#eafaff;}
  .bp-thumb .empty{position:absolute;inset:0;z-index:2;display:flex;align-items:center;justify-content:center;
    font-family:var(--f-mono);font-style:normal;font-size:9px;letter-spacing:.16em;color:#3f6a92;}

  /* 陀螺 */
  #bp-gyro-box{position:relative;margin-top:14px;display:flex;align-items:center;gap:14px;
    padding-top:10px;border-top:1px solid rgba(96,160,230,.14);}
  #bp-gyro{width:86px;height:86px;flex:0 0 86px;cursor:pointer;
    filter:drop-shadow(0 6px 16px rgba(0,0,0,.6));
    transition:transform .4s var(--ease), filter .4s ease;}
  #bp-gyro:hover{transform:translateY(-2px) scale(1.06);
    filter:drop-shadow(0 0 22px rgba(120,210,255,.72));}
  #bp-gyro-line{font-family:var(--f-mono);font-size:clamp(11px,1vw,13.5px);letter-spacing:.13em;
    color:#bfe3ff;text-shadow:0 0 14px rgba(90,190,255,.7);
    transition:color .6s ease, text-shadow .6s ease, letter-spacing .6s ease;line-height:1.9;}
  #bp-gyro-line .bar{display:inline-block;margin-left:2px;color:#7fe9ff;
    animation:bpCur 1.05s steps(2,end) infinite;}
  #bp-gyro-line.jit{animation:bpJit .24s steps(2,end) 1;}
  @keyframes bpJit{0%{transform:translate(0,0);}25%{transform:translate(-1.5px,1px);}
    50%{transform:translate(1.5px,-1px);}75%{transform:translate(-1px,.5px);}100%{transform:none;}}
  #bp-gyro-line.welcome{color:#ecfdff;font-size:clamp(12px,1.06vw,15px);letter-spacing:.09em;
    text-shadow:0 0 18px rgba(120,235,255,.95), 0 0 46px rgba(50,150,255,.62);}

  /* 底部提示 */
  #bp-hint{position:absolute;left:0;right:0;bottom:2.6%;z-index:20;text-align:center;
    font-family:var(--f-mono);font-size:10px;letter-spacing:.22em;color:#5c86ad;
    text-shadow:0 0 14px rgba(40,120,220,.4);pointer-events:none;}
  #bp-hint b{font-weight:400;color:#9fd2f2;}

  /* 分解叠加层 */
  #bp-fx{position:absolute;inset:0;width:100%;height:100%;z-index:60;pointer-events:none;
    opacity:0;transition:opacity .35s ease;}
  #bp-fx.on{opacity:1;}

  #bp-root.decomposing #bp-panel{filter:brightness(1.9) blur(6px);opacity:.14;
    transform:translateX(-50%) scale(1.03);}
  #bp-root.decomposing #bp-title,
  #bp-root.decomposing #bp-hint{opacity:0;filter:blur(5px);transition:opacity .7s ease, filter .7s ease;}
  #bp-root.decomposing #bp-bg{filter:brightness(1.35) blur(3px);}
  #bp-root.decomposing #bp-imgview{filter:brightness(1.3) blur(4px);}

  @media (max-width:820px){
    #bp-title{left:14px;top:12px;font-size:9.5px;letter-spacing:.13em;}
    #bp-panel{width:93vw;top:3.2vh;padding:14px 15px 12px;max-height:88vh;}
    #bp-copy{font-size:11.5px;line-height:2.05;min-height:6.4em;}
    .bp-ai-tabs{gap:6px;}
    .bp-tab{font-size:10px;padding:5px 10px;letter-spacing:.1em;}
    .bp-gen{flex-basis:78px;font-size:10.5px;}
    #bp-gyro{width:72px;height:72px;flex-basis:72px;}
    #bp-hint{display:none;}
  }
  `);

  /* ================================================================
   * 一、程序化生图：generateBlueprint(desc)
   * ================================================================ */
  function kw(text, list) {
    for (let i = 0; i < list.length; i++) if (text.indexOf(list[i]) >= 0) return true;
    return false;
  }

  // 取全局 CSS 变量里的字体栈，保证生图文字与页面字体一致
  function cssFont(name, fallback) {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    } catch (e) { return fallback; }
  }

  // 依据关键词解析语义 → 配色 / 元素
  function parseDesc(desc) {
    const t = String(desc || "").toLowerCase();
    return {
      water: kw(t, ["水", "江", "河", "湖", "海", "浪", "波", "潮", "雨", "溪", "流", "川", "港", "坝", "洪", "渠", "湾", "泊", "水利", "治水", "涟漪", "渡"]),
      city: kw(t, ["城", "都市", "楼", "天际", "建筑", "厦", "街", "市", "霓虹", "塔"]),
      bridge: kw(t, ["桥", "拱", "跨", "闸", "栈"]),
      forest: kw(t, ["森林", "树", "林", "绿", "园", "花", "草", "木", "叶", "山"]),
      space: kw(t, ["太空", "宇宙", "星", "银河", "深空", "月", "火星", "行星", "卫星", "寰宇"]),
      light: kw(t, ["光", "辉", "闪", "灯", "电", "晶", "荧", "霓"]),
      whale: kw(t, ["鲸", "极光", "鱼", "灵", "海豚"]),
      train: kw(t, ["列车", "高铁", "轨道", "地铁", "动车", "磁浮", "车"]),
      lift: kw(t, ["电梯", "天梯", "直通", "升", "井", "梯"]),
      cloud: kw(t, ["云", "雾", "霭", "烟", "气", "穹"]),
      sun: kw(t, ["日", "朝阳", "晨", "曙光", "黄昏", "夕", "暖", "阳", "霞"]),
      paper: kw(t, ["蓝图", "图纸", "设计", "绘制", "构想", "想象", "未来", "计划"]),
      ai: kw(t, ["ai", "人工智能", "智能", "算法", "数字", "数据", "孪生", "算力", "模型"]),
    };
  }

  function pickPalette(f) {
    let sky = ["#030812", "#08182f", "#0c2f52", "#1a4a7c"];
    let accent = "#6fe3ff", accent2 = "#a98bff";
    if (f.forest) { sky = ["#03120c", "#062a1c", "#0a5138", "#2f9c74"]; accent = "#8ff0c0"; accent2 = "#d8f59a"; }
    else if (f.space) { sky = ["#04030e", "#0a0824", "#1a1448", "#3a2a72"]; accent = "#b79bff"; accent2 = "#7fd6ff"; }
    else if (f.water) { sky = ["#020a18", "#041d33", "#072f4a", "#0d5468"]; accent = "#5ee6ff"; accent2 = "#39a7ff"; }
    else if (f.sun) { sky = ["#0a0713", "#1d1030", "#4a2038", "#9c4f3a"]; accent = "#ffc98a"; accent2 = "#ff8f5e"; }
    else if (f.space === false && f.city) { sky = ["#050310", "#0b1030", "#1a2a5c", "#2f4f8f"]; accent = "#7fd0ff"; accent2 = "#9d8bff"; }
    if (f.paper && !f.water) accent = "#cfeeff";
    return { sky: sky, accent: accent, accent2: accent2 };
  }

  function drawSkyline(x, W, baseY, minH, maxH, alpha, tone) {
    let px = -20;
    while (px < W + 20) {
      const bw = U.rand(W * 0.012, W * 0.05);
      const bh = U.rand(minH, maxH);
      const top = baseY - bh;
      const g = x.createLinearGradient(px, top, px + bw, baseY);
      g.addColorStop(0, tone[0]);
      g.addColorStop(1, tone[1]);
      x.fillStyle = g;
      x.fillRect(px, top, bw, bh);
      // 楼顶结构
      if (Math.random() < .3) {
        x.fillStyle = tone[0];
        x.fillRect(px + bw * .45, top - U.rand(8, 30), Math.max(1.2, bw * .06), U.rand(8, 30));
      }
      if (Math.random() < .26) {
        x.fillStyle = "rgba(150,235,255," + (alpha * .55) + ")";
        x.fillRect(px + bw * .45, top - 2, Math.max(1.4, bw * .06), 2);
      }
      // 窗格
      if (Math.random() < .55) {
        for (let k = 0; k < 12; k++) {
          if (Math.random() < .45) continue;
          x.fillStyle = "rgba(140,220,255," + (alpha * U.rand(.16, .62)) + ")";
          x.fillRect(px + U.rand(2, bw - 4), top + U.rand(4, Math.max(6, bh - 6)), 1.6, 2.2);
        }
      }
      px += bw + U.rand(2, 10);
    }
  }

  function drawWhaleMark(x, cx, cy, s, accent) {
    x.save();
    x.translate(cx, cy);
    x.scale(s, s);
    x.beginPath();
    x.moveTo(1, .02);
    x.bezierCurveTo(.72, -.4, .18, -.44, -.28, -.26);
    x.lineTo(-.6, -.1); x.lineTo(-.94, -.42); x.lineTo(-.8, 0); x.lineTo(-.94, .42);
    x.lineTo(-.6, .1);
    x.bezierCurveTo(-.05, .42, .55, .4, 1, .02);
    x.closePath();
    x.shadowColor = accent; x.shadowBlur = 34;
    x.fillStyle = "rgba(120,225,255,.26)";
    x.fill();
    x.strokeStyle = "rgba(190,245,255,.72)";
    x.lineWidth = 1.6 / s;
    x.stroke();
    x.restore();
  }

  /* 生成一张「未来蓝图」（纯前端程序化合成） */
  function generateBlueprint(desc, opts) {
    opts = opts || {};
    const W = 1280, H = 720;
    const c = U.mkCanvas(W, H);
    const x = c.getContext("2d");
    const f = parseDesc(desc);
    const pal = pickPalette(f);
    const sky = pal.sky, accent = pal.accent, accent2 = pal.accent2;
    const horizon = H * 0.70;
    const seed = U.rand(0, 999);

    /* --- 天空 --- */
    const g = x.createLinearGradient(0, 0, W * 0.18, H);
    g.addColorStop(0, sky[0]); g.addColorStop(.40, sky[1]);
    g.addColorStop(.74, sky[2]); g.addColorStop(1, sky[3]);
    x.fillStyle = g; x.fillRect(0, 0, W, H);

    /* --- 星点 --- */
    const starN = f.space ? 320 : 150;
    for (let i = 0; i < starN; i++) {
      const sx = Math.random() * W, sy = Math.random() * H * .74;
      const r = Math.random() * 1.5 + .3;
      x.fillStyle = "rgba(" + (200 + (Math.random() * 55 | 0)) + ",232,255," + (.16 + Math.random() * .74) + ")";
      x.beginPath(); x.arc(sx, sy, r, 0, TAU); x.fill();
    }

    /* --- 极光 / 光带 --- */
    if (f.whale || f.light || f.space) {
      x.save();
      x.globalCompositeOperation = "lighter";
      for (let i = 0; i < 5; i++) {
        const bx = W * U.rand(.08, .86), bw = U.rand(120, 380), bh = H * U.rand(.2, .62);
        const lg = x.createLinearGradient(bx, 0, bx, bh);
        lg.addColorStop(0, "rgba(" + (i % 2 ? "150,150,255" : "100,225,255") + ",0)");
        lg.addColorStop(.42, "rgba(" + (i % 2 ? "150,150,255" : "100,225,255") + "," + U.rand(.06, .16) + ")");
        lg.addColorStop(1, "rgba(" + (i % 2 ? "150,150,255" : "100,225,255") + ",0)");
        x.fillStyle = lg;
        x.beginPath();
        x.moveTo(bx, 0);
        x.bezierCurveTo(bx + bw * .4, bh * .3, bx - bw * .3, bh * .7, bx + bw * .2, bh);
        x.lineTo(bx + bw * .9, bh);
        x.bezierCurveTo(bx + bw * .3, bh * .66, bx + bw * 1.1, bh * .3, bx + bw * .62, 0);
        x.closePath(); x.fill();
      }
      x.restore();
    }

    /* --- 日 / 月 --- */
    let sunPos = null;
    if (f.sun || f.space) {
      const sx = W * U.rand(.28, .78), sy = horizon - H * U.rand(.32, .48);
      const rr = H * U.rand(.045, .075);
      sunPos = { x: sx, y: sy, r: rr };
      x.save();
      x.globalCompositeOperation = "lighter";
      const gg = x.createRadialGradient(sx, sy, 0, sx, sy, rr * 6);
      gg.addColorStop(0, accent + "");
      gg.addColorStop(.18, "rgba(" + (f.sun ? "255,215,160" : "200,225,255") + ",.34)");
      gg.addColorStop(1, "rgba(180,220,255,0)");
      x.globalAlpha = .85; x.fillStyle = gg;
      x.beginPath(); x.arc(sx, sy, rr * 6, 0, TAU); x.fill();
      x.globalAlpha = 1;
      x.fillStyle = f.sun ? "rgba(255,246,222,.96)" : "rgba(232,242,255,.92)";
      x.beginPath(); x.arc(sx, sy, rr, 0, TAU); x.fill();
      x.restore();
      // 水面倒影
      if (f.water) {
        x.save(); x.globalCompositeOperation = "lighter";
        const rg = x.createLinearGradient(0, horizon, 0, H);
        rg.addColorStop(0, "rgba(255,225,180,.30)");
        rg.addColorStop(1, "rgba(255,225,180,0)");
        x.fillStyle = rg;
        x.fillRect(sx - rr * .55, horizon, rr * 1.1, H - horizon);
        x.restore();
      }
    }

    /* --- 云层 --- */
    if (f.cloud) {
      for (let i = 0; i < 9; i++) {
        const cy = U.rand(H * .1, horizon * .96), cw = U.rand(W * .16, W * .46), ch = U.rand(18, 62);
        const cg = x.createRadialGradient(0, 0, 0, 0, 0, 1);
        cg.addColorStop(0, "rgba(200,225,255,.16)");
        cg.addColorStop(1, "rgba(200,225,255,0)");
        x.save();
        x.translate(U.rand(0, W), cy);
        x.scale(cw * .5, ch);
        x.fillStyle = cg;
        x.beginPath(); x.arc(0, 0, 1, 0, TAU); x.fill();
        x.restore();
      }
    }

    /* --- 远山 / 远景剪影 --- */
    for (let layer = 0; layer < 2; layer++) {
      const baseY = horizon + layer * H * .03;
      const hgt = H * (.16 - layer * .05);
      x.beginPath();
      x.moveTo(0, baseY);
      for (let px = 0; px <= W; px += 26) {
        const n = U.fbm(px * .0022 + seed + layer * 5, layer * 3.1 + seed, 3);
        x.lineTo(px, baseY - n * hgt - hgt * .16);
      }
      x.lineTo(W, H); x.lineTo(0, H); x.closePath();
      x.fillStyle = layer === 0 ? "rgba(6,18,36,.72)" : "rgba(3,10,22,.9)";
      x.fill();
    }

    /* --- 城市天际线 --- */
    if (f.city || !f.forest) {
      drawSkyline(x, W, horizon + 4, H * .06, H * .26, .9, ["rgba(5,14,30,.96)", "rgba(4,10,22,.99)"]);
    }
    if (f.city) {
      drawSkyline(x, W, horizon + 10, H * .1, H * .34, 1, ["rgba(2,8,18,1)", "rgba(2,6,14,1)"]);
    }

    /* --- 水面 --- */
    if (f.water) {
      const wg = x.createLinearGradient(0, horizon, 0, H);
      wg.addColorStop(0, "rgba(9,44,66,.92)");
      wg.addColorStop(.5, "rgba(5,26,44,.97)");
      wg.addColorStop(1, "rgba(2,10,20,1)");
      x.fillStyle = wg; x.fillRect(0, horizon, W, H - horizon);
      // 波光
      x.save(); x.globalCompositeOperation = "lighter";
      for (let i = 0; i < 90; i++) {
        const wy = horizon + Math.pow(Math.random(), 1.7) * (H - horizon);
        const ww = U.rand(10, 120) * (1 + (wy - horizon) / (H - horizon));
        x.fillStyle = "rgba(120,215,255," + U.rand(.03, .16) + ")";
        x.fillRect(U.rand(-60, W), wy, ww, U.rand(.8, 2.2));
      }
      // 城市灯光倒影
      for (let i = 0; i < 26; i++) {
        const rx = U.rand(0, W), rh = U.rand(20, 130);
        const rg2 = x.createLinearGradient(0, horizon, 0, horizon + rh);
        rg2.addColorStop(0, "rgba(150,225,255,.22)");
        rg2.addColorStop(1, "rgba(120,200,255,0)");
        x.fillStyle = rg2;
        x.fillRect(rx, horizon, U.rand(1.4, 4), rh);
      }
      x.restore();
    }

    /* --- 桥 --- */
    if (f.bridge) {
      const by = horizon - H * .02, bspan = W * .78, bx0 = (W - bspan) / 2;
      x.save();
      x.strokeStyle = "rgba(180,235,255,.62)"; x.lineWidth = 3;
      x.beginPath(); x.moveTo(bx0, by);
      x.bezierCurveTo(bx0 + bspan * .3, by - H * .18, bx0 + bspan * .7, by - H * .18, bx0 + bspan, by);
      x.stroke();
      x.strokeStyle = "rgba(160,225,255,.22)"; x.lineWidth = 1;
      for (let i = 1; i < 16; i++) {
        const u = i / 16;
        const px = bx0 + bspan * u;
        const py = by - Math.sin(u * Math.PI) * H * .135;
        x.beginPath(); x.moveTo(px, py); x.lineTo(px, by); x.stroke();
      }
      x.restore();
    }

    /* --- 森林 --- */
    if (f.forest) {
      for (let layer = 0; layer < 3; layer++) {
        const baseY = H - layer * H * .012;
        const hh = H * (.13 - layer * .028);
        for (let px = -30; px < W + 30; px += U.rand(12, 30)) {
          const th = hh * U.rand(.6, 1.2);
          x.fillStyle = "rgba(" + (6 + layer * 4) + "," + (26 + layer * 12) + "," + (24 + layer * 10) + "," + (.65 + layer * .12) + ")";
          x.beginPath();
          x.moveTo(px, baseY - th);
          x.lineTo(px + th * .28, baseY);
          x.lineTo(px - th * .28, baseY);
          x.closePath(); x.fill();
        }
      }
    }

    /* --- 量子列车 --- */
    if (f.train) {
      const ty = horizon - H * .11;
      x.save();
      x.globalCompositeOperation = "lighter";
      x.strokeStyle = "rgba(130,215,255,.5)"; x.lineWidth = 2;
      x.beginPath();
      x.moveTo(-20, ty);
      x.bezierCurveTo(W * .3, ty - H * .1, W * .66, ty + H * .05, W + 20, ty - H * .03);
      x.stroke();
      // 列车 + 光尾
      const tx0 = W * U.rand(.42, .62);
      for (let i = 0; i < 34; i++) {
        const u = i / 34;
        x.fillStyle = "rgba(150,235,255," + ((1 - u) * .5) + ")";
        x.fillRect(tx0 - i * 9, ty - Math.sin(u * 2.2) * 3, 8, 2.4 * (1 - u * .6));
      }
      x.fillStyle = "rgba(235,252,255,.95)";
      x.shadowColor = accent; x.shadowBlur = 26;
      x.fillRect(tx0, ty - 5, 26, 10);
      x.restore();
    }

    /* --- 直通宇宙的电梯 --- */
    if (f.lift) {
      const ex = W * U.rand(.68, .9);
      x.save();
      x.globalCompositeOperation = "lighter";
      const eg = x.createLinearGradient(ex - 12, 0, ex + 12, 0);
      eg.addColorStop(0, "rgba(120,220,255,0)");
      eg.addColorStop(.5, "rgba(180,240,255,.42)");
      eg.addColorStop(1, "rgba(120,220,255,0)");
      x.fillStyle = eg;
      x.fillRect(ex - 12, -20, 24, H + 20);
      x.fillStyle = "rgba(238,252,255,.95)";
      x.shadowColor = accent; x.shadowBlur = 30;
      const cyy = H * U.rand(.22, .52);
      x.fillRect(ex - 5, cyy, 10, 18);
      x.restore();
    }

    /* --- 极光鲸 --- */
    if (f.whale) {
      // 与日/月错开，避免主体重叠
      const awayRight = sunPos ? sunPos.x <= W * .5 : Math.random() < .5;
      const wx = W * (awayRight ? U.rand(.62, .84) : U.rand(.16, .38));
      const wy = H * U.rand(.14, .26);
      drawWhaleMark(x, wx, wy, H * .115, accent);
    }

    /* --- 光轨 --- */
    if (f.light || f.ai) {
      x.save();
      x.globalCompositeOperation = "lighter";
      for (let i = 0; i < 4; i++) {
        const y0 = U.rand(H * .2, H * .8);
        const lg2 = x.createLinearGradient(0, y0, W, y0 + U.rand(-120, 120));
        lg2.addColorStop(0, "rgba(120,210,255,0)");
        lg2.addColorStop(.5, i % 2 ? "rgba(150,150,255,.5)" : "rgba(140,240,255,.5)");
        lg2.addColorStop(1, "rgba(120,210,255,0)");
        x.strokeStyle = lg2;
        x.lineWidth = U.rand(1, 2.6);
        x.beginPath();
        x.moveTo(-20, y0);
        x.bezierCurveTo(W * .3, y0 + U.rand(-90, 90), W * .7, y0 + U.rand(-90, 90), W + 20, y0 + U.rand(-60, 60));
        x.stroke();
      }
      x.restore();
    }

    /* --- 蓝图网格 / 制图标记（始终叠加，强化"蓝图"质感） --- */
    {
      x.save();
      x.strokeStyle = "rgba(140,215,255,.09)";
      x.lineWidth = 1;
      for (let gx = 0; gx < W; gx += 64) {
        x.beginPath(); x.moveTo(gx, horizon); x.lineTo(gx, H); x.stroke();
      }
      for (let i = 0; i < 9; i++) {
        const yy = horizon + Math.pow(i / 9, 1.9) * (H - horizon);
        x.beginPath(); x.moveTo(0, yy); x.lineTo(W, yy); x.stroke();
      }
      // 角框
      x.strokeStyle = "rgba(180,235,255,.4)";
      x.lineWidth = 1.4;
      const m = 34, L = 54;
      [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(function (p) {
        x.beginPath();
        x.moveTo(p[0], p[1] + p[3] * L); x.lineTo(p[0], p[1]); x.lineTo(p[0] + p[2] * L, p[1]);
        x.stroke();
      });
      // 十字准星
      x.strokeStyle = "rgba(180,235,255,.22)";
      x.beginPath(); x.moveTo(W * .5 - 14, H * .5); x.lineTo(W * .5 + 14, H * .5);
      x.moveTo(W * .5, H * .5 - 14); x.lineTo(W * .5, H * .5 + 14); x.stroke();
      x.restore();
    }

    /* --- 粒子 --- */
    x.save();
    x.globalCompositeOperation = "lighter";
    for (let i = 0; i < 220; i++) {
      const px = Math.random() * W, py = Math.random() * H;
      const pr = Math.random() * 1.8 + .4;
      x.fillStyle = "rgba(" + (140 + (Math.random() * 110 | 0)) + ",225,255," + (.1 + Math.random() * .5) + ")";
      x.beginPath(); x.arc(px, py, pr, 0, TAU); x.fill();
    }
    x.restore();

    /* --- 暗角 + 扫描线 --- */
    const vg = x.createRadialGradient(W * .5, H * .44, 0, W * .5, H * .44, Math.max(W, H) * .74);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(.68, "rgba(0,0,0,.12)");
    vg.addColorStop(1, "rgba(0,0,0,.56)");
    x.fillStyle = vg; x.fillRect(0, 0, W, H);
    x.save();
    x.globalAlpha = .05; x.fillStyle = "#9fdcff";
    for (let yy = 0; yy < H; yy += 3) x.fillRect(0, yy, W, 1);
    x.restore();

    /* --- 文字水印 --- */
    const engine = opts.ai === "jimeng" ? "JIMENG AI ENGINE" : "DOUBAO AI ENGINE";
    const fMono = cssFont("--f-mono", "Consolas, monospace");
    const fHei = cssFont("--f-hei", "sans-serif");
    const stamp = new Date();
    const ts = stamp.getFullYear() + "." + String(stamp.getMonth() + 1).padStart(2, "0") + "." +
      String(stamp.getDate()).padStart(2, "0");
    x.save();
    x.textBaseline = "alphabetic";
    // 主标题
    x.font = "600 25px " + fMono;
    x.fillStyle = "rgba(236,252,255,.94)";
    x.shadowColor = accent; x.shadowBlur = 26;
    x.fillText("BLUEPRINT · AI GENERATED", 62, H - 92);
    x.shadowBlur = 0;
    // 细线
    x.strokeStyle = "rgba(180,235,255,.42)"; x.lineWidth = 1;
    x.beginPath(); x.moveTo(62, H - 78); x.lineTo(W - 62, H - 78); x.stroke();
    // 描述
    x.font = "400 17px " + fHei;
    x.fillStyle = "rgba(206,238,255,.86)";
    const tw = W - 124 - 300;
    let line = "", ly = H - 52;
    const chars = String(desc || "你心目中的蓝图").split("");
    for (let i = 0; i < chars.length; i++) {
      const test = line + chars[i];
      if (x.measureText(test).width > tw && line) {
        x.fillText(line, 62, ly); line = chars[i]; ly += 24;
        if (ly > H - 26) break;
      } else line = test;
    }
    if (line) x.fillText(line, 62, ly);
    // 右侧铭牌
    x.font = "400 13px " + fMono;
    x.fillStyle = "rgba(150,215,255,.62)";
    x.textAlign = "right";
    x.fillText(engine, W - 62, H - 92);
    x.fillText("河海大学 · 111 · " + ts, W - 62, H - 62);
    x.restore();

    return { url: c.toDataURL("image/jpeg", 0.86), canvas: c };
  }

  /* ================================================================
   * 二、赛博未来城市场景
   * ================================================================ */
  function mkStarSprite() {
    const S = 48, c = U.mkCanvas(S, S), x = c.getContext("2d");
    const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(.2, "rgba(226,244,255,.9)");
    g.addColorStop(.5, "rgba(150,210,255,.24)");
    g.addColorStop(1, "rgba(110,175,255,0)");
    x.fillStyle = g; x.beginPath(); x.arc(S / 2, S / 2, S / 2, 0, TAU); x.fill();
    return c;
  }
  function mkGlowSprite() {
    const S = 64, c = U.mkCanvas(S, S), x = c.getContext("2d");
    const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, "rgba(220,250,255,.95)");
    g.addColorStop(.26, "rgba(120,220,255,.55)");
    g.addColorStop(.6, "rgba(70,150,255,.16)");
    g.addColorStop(1, "rgba(50,120,255,0)");
    x.fillStyle = g; x.beginPath(); x.arc(S / 2, S / 2, S / 2, 0, TAU); x.fill();
    return c;
  }
  function mkSkySprite() {
    const W = 512, H = 512, c = U.mkCanvas(W, H), x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, W * .22, H);
    g.addColorStop(0, "#05031a");
    g.addColorStop(.26, "#080a2c");
    g.addColorStop(.5, "#0a1740");
    g.addColorStop(.74, "#102a56");
    g.addColorStop(1, "#173b68");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    // 星云团
    x.globalCompositeOperation = "lighter";
    const cols = ["140,110,235", "60,140,225", "40,190,200", "120,90,200"];
    for (let i = 0; i < 6; i++) {
      const cx = U.rand(0, W), cy = U.rand(0, H * .7), r = U.rand(60, 210);
      const rg = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      rg.addColorStop(0, "rgba(" + cols[i % 4] + "," + U.rand(.05, .14) + ")");
      rg.addColorStop(1, "rgba(" + cols[i % 4] + ",0)");
      x.fillStyle = rg; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill();
    }
    // 地平线雾光
    const hg = x.createLinearGradient(0, H * .62, 0, H);
    hg.addColorStop(0, "rgba(30,90,170,0)");
    hg.addColorStop(.7, "rgba(40,120,200,.16)");
    hg.addColorStop(1, "rgba(90,190,255,.26)");
    x.fillStyle = hg; x.fillRect(0, H * .6, W, H * .4);
    // 静态微星
    for (let i = 0; i < 150; i++) {
      x.fillStyle = "rgba(200,235,255," + U.rand(.06, .5) + ")";
      x.fillRect(U.rand(0, W), U.rand(0, H * .74), 1, 1);
    }
    return c;
  }
  function mkAurora(seed, rgb) {
    const W = 720, H = 460, c = U.mkCanvas(W, H), x = c.getContext("2d");
    x.globalCompositeOperation = "lighter";
    for (let i = 0; i < 9; i++) {
      const bx = ((i + .5) / 9) * W + U.rand(-40, 40);
      const bw = U.rand(34, 130);
      const bh = U.rand(.45, 1) * H;
      const g = x.createLinearGradient(0, 0, 0, bh);
      g.addColorStop(0, "rgba(" + rgb + ",0)");
      g.addColorStop(.16, "rgba(" + rgb + "," + U.rand(.05, .12) + ")");
      g.addColorStop(.55, "rgba(" + rgb + "," + U.rand(.08, .2) + ")");
      g.addColorStop(1, "rgba(" + rgb + ",0)");
      x.fillStyle = g;
      x.beginPath();
      const N = 12;
      for (let k = 0; k <= N; k++) {
        const y = (k / N) * bh;
        const off = Math.sin(k * .82 + i * 1.7 + seed) * bw * .38 +
          (U.fbm(k * .5 + i * 3.1, seed * 2, 3) - .5) * bw * 1.1;
        if (k === 0) x.moveTo(bx + off + bw * .5, y); else x.lineTo(bx + off + bw * .5, y);
      }
      for (let k = N; k >= 0; k--) {
        const y = (k / N) * bh;
        const off = Math.sin(k * .82 + i * 1.7 + seed) * bw * .38 +
          (U.fbm(k * .5 + i * 3.1, seed * 2, 3) - .5) * bw * 1.1;
        x.lineTo(bx + off - bw * .5, y);
      }
      x.closePath(); x.fill();
    }
    return c;
  }
  function mkFarSkyline(W, H) {
    const c = U.mkCanvas(W, H), x = c.getContext("2d");
    let px = -10;
    while (px < W) {
      const bw = U.rand(16, 58), bh = U.rand(H * .2, H * .94);
      x.fillStyle = "rgba(8,19,40,.96)";
      x.fillRect(px, H - bh, bw, bh);
      if (Math.random() < .3) {
        x.fillRect(px + bw * .5, H - bh - U.rand(5, 24), Math.max(1, bw * .05), U.rand(5, 24));
      }
      x.fillStyle = "rgba(80,165,240,.30)";
      x.fillRect(px, H - bh, bw, 1.2);
      // 稀疏窗光
      for (let k = 0; k < 6; k++) {
        if (Math.random() < .62) continue;
        x.fillStyle = "rgba(150,220,255," + U.rand(.1, .4) + ")";
        x.fillRect(px + U.rand(2, Math.max(3, bw - 3)), H - bh + U.rand(4, Math.max(6, bh - 5)), 1.4, 1.8);
      }
      px += bw + U.rand(2, 9);
    }
    // 雾
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "rgba(24,78,140,0)");
    g.addColorStop(.65, "rgba(20,72,132,.30)");
    g.addColorStop(1, "rgba(16,60,112,.56)");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    return c;
  }
  function mkBuildingSprite(b) {
    const w = Math.max(2, Math.ceil(b.w)), h = Math.max(2, Math.ceil(b.h));
    const c = U.mkCanvas(w, h + 8), x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, "#040b18");
    g.addColorStop(.42, "#0a1b34");
    g.addColorStop(.72, "#071426");
    g.addColorStop(1, "#03080f");
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    // 顶面高光
    x.fillStyle = "rgba(110,200,255,.42)";
    x.fillRect(0, 0, w, 1.4);
    x.fillStyle = "rgba(60,140,220,.14)";
    x.fillRect(0, 1.4, w, 2);
    // 竖向结构
    x.fillStyle = "rgba(90,170,240,.07)";
    const cols = Math.max(2, Math.round(w / 14));
    for (let i = 1; i < cols; i++) x.fillRect(Math.round(w * i / cols), 3, 1, h - 3);
    // 顶部突起
    if (b.idx % 3 === 0) {
      x.fillStyle = "#0a1a30";
      x.fillRect(w * .5 - 1.6, -6, 3.2, 8);
      x.fillStyle = "rgba(150,235,255,.9)";
      x.fillRect(w * .5 - 1.6, -7.5, 3.2, 2);
    }
    // 底部接地暗
    const bg = x.createLinearGradient(0, h * .6, 0, h);
    bg.addColorStop(0, "rgba(0,0,0,0)");
    bg.addColorStop(1, "rgba(0,4,12,.85)");
    x.fillStyle = bg; x.fillRect(0, h * .6, w, h * .4);
    return c;
  }
  function whalePath(s) {
    const p = new Path2D();
    p.moveTo(1 * s, .02 * s);
    p.bezierCurveTo(.72 * s, -.40 * s, .18 * s, -.44 * s, -.28 * s, -.26 * s);
    p.lineTo(-.60 * s, -.10 * s);
    p.lineTo(-.94 * s, -.42 * s);
    p.lineTo(-.80 * s, 0);
    p.lineTo(-.94 * s, .42 * s);
    p.lineTo(-.60 * s, .10 * s);
    p.bezierCurveTo(-.05 * s, .42 * s, .55 * s, .40 * s, 1 * s, .02 * s);
    p.closePath();
    // 胸鳍
    p.moveTo(.32 * s, .16 * s);
    p.quadraticCurveTo(.14 * s, .50 * s, -.06 * s, .28 * s);
    p.closePath();
    return p;
  }
  function mkWhaleSprite() {
    const unit = 260, pad = 48;
    const W = unit * 2 + pad * 2, H = unit * 1.16 + pad * 2;
    const c = U.mkCanvas(W, H), x = c.getContext("2d");
    x.translate(W / 2, H / 2);
    const path = whalePath(unit);
    // 光晕
    x.save();
    x.shadowColor = "rgba(110,225,255,.95)";
    x.shadowBlur = 46;
    const g = x.createLinearGradient(-unit, 0, unit, 0);
    g.addColorStop(0, "rgba(24,70,140,.26)");
    g.addColorStop(.42, "rgba(38,140,215,.44)");
    g.addColorStop(.78, "rgba(96,208,255,.58)");
    g.addColorStop(1, "rgba(206,250,255,.76)");
    x.fillStyle = g;
    x.fill(path);
    x.restore();
    // 轮廓
    x.save();
    x.strokeStyle = "rgba(180,242,255,.6)";
    x.lineWidth = 2.2;
    x.shadowColor = "rgba(120,220,255,.9)";
    x.shadowBlur = 18;
    x.stroke(path);
    x.restore();
    // 能量脊线
    x.save();
    x.globalCompositeOperation = "lighter";
    x.strokeStyle = "rgba(190,245,255,.20)";
    x.lineWidth = 1.4;
    for (let i = 1; i <= 5; i++) {
      x.beginPath();
      x.moveTo(unit * .96, -unit * .02);
      x.bezierCurveTo(unit * .5, -unit * (.05 + i * .055), -unit * .1, -unit * (.04 + i * .04),
        -unit * .62, -unit * (.02 + i * .014));
      x.stroke();
    }
    for (let i = 0; i < 4; i++) {
      x.beginPath();
      x.moveTo(unit * (.66 - i * .07), unit * .12);
      x.quadraticCurveTo(unit * (.5 - i * .07), unit * .3, unit * (.28 - i * .06), unit * .32);
      x.stroke();
    }
    // 眼
    x.fillStyle = "rgba(244,255,255,.96)";
    x.shadowColor = "#a8f0ff"; x.shadowBlur = 14;
    x.beginPath(); x.arc(unit * .74, -unit * .055, unit * .022, 0, TAU); x.fill();
    x.restore();
    c._ar = H / W;   // 供绘制时保持比例
    return c;
  }
  function mkWhalePoints(n) {
    const pts = [];
    const path = whalePath(100);
    const scratch = U.mkCanvas(4, 4).getContext("2d");
    let guard = 0;
    while (pts.length < n && guard < n * 40) {
      guard++;
      const u = U.rand(-.98, .98), v = U.rand(-.46, .46);
      if (!scratch.isPointInPath(path, u * 100, v * 100)) continue;
      pts.push({ u: u, v: v, ph: U.rand(0, TAU), sp: U.rand(.9, 3.4), r: U.rand(.8, 2.4) });
    }
    return pts;
  }
  function mkBeamSprite() {
    const W = 64, H = 512, c = U.mkCanvas(W, H), x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, "rgba(110,215,255,0)");
    g.addColorStop(.34, "rgba(140,228,255,.22)");
    g.addColorStop(.5, "rgba(226,250,255,.62)");
    g.addColorStop(.66, "rgba(140,228,255,.22)");
    g.addColorStop(1, "rgba(110,215,255,0)");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    // 竖向流动刻度
    x.globalCompositeOperation = "lighter";
    for (let i = 0; i < 40; i++) {
      x.fillStyle = "rgba(200,248,255," + U.rand(.05, .3) + ")";
      x.fillRect(W * .5 - 12, U.rand(0, H), U.rand(3, 24), 1.4);
    }
    // 上下渐隐
    const fg = x.createLinearGradient(0, 0, 0, H);
    fg.addColorStop(0, "rgba(0,0,0,0)");
    fg.addColorStop(.12, "rgba(0,0,0,1)");
    fg.addColorStop(.86, "rgba(0,0,0,1)");
    fg.addColorStop(1, "rgba(0,0,0,0)");
    x.globalCompositeOperation = "destination-in";
    x.fillStyle = fg; x.fillRect(0, 0, W, H);
    return c;
  }

  /* ---------------- 场景类 ---------------- */
  class Scene {
    constructor(canvas) {
      this.c = canvas;
      this.W = 0; this.H = 0;
      this.px = -999; this.py = -999;
      this.hover = null;
      this.frozen = false;
      this.t0 = performance.now();
      this.ripples = [];
      this.sparks = [];
      this.trainTrail = [];
      this.whaleTrail = [];
      this.sparkMax = 320;
      this.nextPulse = 5.5;
      this.star = mkStarSprite();
      this.glow = mkGlowSprite();
      this.sky = mkSkySprite();
      this.aurora = [
        mkAurora(1.7, "120,225,255"),
        mkAurora(4.3, "150,140,255"),
        mkAurora(8.1, "80,255,215"),
      ];
      this.whaleSprite = mkWhaleSprite();
      this.whalePts = mkWhalePoints(150);
      this.beam = mkBeamSprite();
      this.ready = false;
      this.build();
    }

    build() {
      const w = this.c.clientWidth || window.innerWidth;
      const h = this.c.clientHeight || window.innerHeight;
      if (w < 8 || h < 8) return;
      if (w === this.W && h === this.H && this.ready) return;
      this.W = w; this.H = h;
      const horizon = this.horizon = h * 0.735;
      const groundY = this.groundY = h * 0.868;

      this.far = mkFarSkyline(Math.ceil(w * 1.3), Math.ceil(h * 0.31));
      this.farY = groundY - h * 0.31 + 4;

      /* 星 */
      this.stars = [];
      const sn = Math.min(300, Math.round(w * h / 7600));
      for (let i = 0; i < sn; i++) {
        this.stars.push({
          x: U.rand(0, w), y: U.rand(0, h * 0.72),
          r: U.rand(.6, 1.8), a: U.rand(.18, .92),
          ph: U.rand(0, TAU), sp: U.rand(.5, 2.4),
          big: Math.random() < .10,
        });
      }

      /* 近景楼群 + 窗格 */
      this.buildings = [];
      this.windows = [[], [], []];
      let bx = -34, idx = 0;
      while (bx < w + 30) {
        const bw = U.rand(46, 114);
        const bh = U.rand(h * 0.10, h * 0.285);
        const b = { x: bx, w: bw, h: bh, y: groundY - bh, idx: idx++ };
        b.img = mkBuildingSprite(b);
        const cols = Math.max(2, Math.floor(bw / 17));
        const rows = Math.max(3, Math.floor(bh / 23));
        for (let r = 0; r < rows; r++) {
          for (let cc = 0; cc < cols; cc++) {
            if (Math.random() > .60) continue;
            const bucket = Math.random() < .17 ? 1 : 0;
            this.windows[bucket].push({
              x: bx + 7 + cc * ((bw - 14) / cols),
              y: b.y + 9 + r * ((bh - 18) / rows),
              w: 3.4, h: 4.6,
              ph: U.rand(0, TAU), sp: U.rand(.7, 2.4),
              th: U.rand(-.5, .78), on: true,
            });
          }
        }
        this.buildings.push(b);
        bx += bw + U.rand(9, 38);
      }

      /* 量子轨道列车 */
      this.track = {
        cx: w * 0.47, cy: h * 0.652,
        rx: Math.min(w * 0.455, 780), ry: h * 0.076,
      };
      this.trainP = U.rand(0, 1);
      this.trainBoost = 0;
      this.trainHead = { x: 0, y: 0 };
      this.trainTrail = [];

      /* 直通宇宙的电梯 */
      this.elev = { x: w * 0.885, p: U.rand(0, .7), boost: 0, flash: 0 };
      this.elevY = groundY;

      /* 极光鲸 */
      this.whale = {
        x: w * .5, y: h * .29, L: Math.min(w * 0.165, 265),
        faceS: 1, ang: 0, glow: .3,
      };
      this.whaleTrail = [];

      /* 低空飞行器 */
      this.ships = [];
      for (let i = 0; i < 4; i++) this.ships.push(this.mkShip(i));

      /* 数据字节 */
      this.bytes = [];
      for (let i = 0; i < 26; i++) {
        this.bytes.push({
          x: U.rand(0, w), y: U.rand(0, h * .8),
          vy: U.rand(6, 18), a: U.rand(.06, .2),
          ch: U.pick(["0", "1", "藍", "水", "浪", "λ", "01", "河", "海", "≈"]),
          sz: U.rand(8, 12),
        });
      }

      // 循环用的渐变（只在尺寸变化时重建）
      const ctx = this.c.getContext("2d");
      this.gradGround = ctx.createLinearGradient(0, groundY - 10, 0, h);
      this.gradGround.addColorStop(0, "rgba(8,26,48,.0)");
      this.gradGround.addColorStop(.35, "rgba(4,14,30,.72)");
      this.gradGround.addColorStop(1, "rgba(1,4,12,.97)");
      this.gradNeon = ctx.createLinearGradient(0, horizon, 0, h);
      this.gradNeon.addColorStop(0, "rgba(60,160,255,0)");
      this.gradNeon.addColorStop(.62, "rgba(40,140,235,.10)");
      this.gradNeon.addColorStop(1, "rgba(90,220,255,.16)");
      this.gradRefl = ctx.createLinearGradient(0, groundY, 0, h);
      this.gradRefl.addColorStop(0, "rgba(120,215,255,.10)");
      this.gradRefl.addColorStop(1, "rgba(90,190,255,0)");

      this.ready = true;
    }

    mkShip(i) {
      const w = this.W || window.innerWidth, h = this.H || window.innerHeight;
      const dir = Math.random() < .5 ? 1 : -1;
      return {
        x: dir > 0 ? U.rand(-80, w * .7) : U.rand(w * .3, w + 80),
        y: this.horizon - U.rand(26, 150),
        vx: dir * U.rand(26, 68),
        size: U.rand(8, 15),
        ph: U.rand(0, TAU),
        boost: 0,
        alive: true,
        respawn: 0,
        id: i,
      };
    }

    /* ---------- 命中检测（距离判定） ---------- */
    hit(x, y) {
      if (x < -100) return null;
      for (let i = 0; i < this.ships.length; i++) {
        const s = this.ships[i];
        if (!s.alive) continue;
        if (Math.hypot(x - s.x, y - s.y) < s.size * 2.4 + 12) return { type: "ship", o: s };
      }
      if (this.elevY > -40 && Math.hypot(x - this.elev.x, y - this.elevY) < 34) return { type: "elev" };
      if (Math.hypot(x - this.trainHead.x, y - this.trainHead.y) < 34) return { type: "train" };
      const w = this.whale;
      if (w) {
        const dx = x - w.x, dy = y - w.y;
        const ca = Math.cos(-w.ang), sa = Math.sin(-w.ang);
        const lx = dx * ca - dy * sa, ly = dx * sa + dy * ca;
        if (Math.abs(lx) < w.L * 1.0 && Math.abs(ly) < w.L * 0.40) return { type: "whale" };
      }
      return null;
    }

    /* ---------- 点击特效 ---------- */
    click(x, y) {
      if (this.frozen) return;
      const h = this.hit(x, y);
      if (!h) {
        this.addRipple(x, y, 4, 56, "130,205,255", .45);
        return;
      }
      if (h.type === "ship") {
        const s = h.o;
        s.boost = 1;
        s.vx *= 2.2;
        for (let i = 0; i < 16; i++) {
          this.addSpark(s.x + U.rand(-6, 6), s.y + U.rand(-4, 4), "150,235,255");
        }
        this.addRipple(s.x, s.y, 6, 74, "160,240,255", .8);
        App.toast("飞行器跃迁离场 · 低空航道清空");
      } else if (h.type === "elev") {
        this.elev.boost = 1;
        this.elev.flash = 1;
        this.addRipple(this.elev.x, this.elevY, 10, 150, "150,235,255", .95);
        for (let i = 0; i < 20; i++) {
          this.addSpark(this.elev.x + U.rand(-8, 8), this.elevY + U.rand(-14, 14), "180,245,255");
        }
        App.toast("天梯轿厢超频 · 直抵深空");
      } else if (h.type === "train") {
        this.trainBoost = 1;
        this.addRipple(this.trainHead.x, this.trainHead.y, 8, 120, "140,230,255", .95);
        for (let i = 0; i < 18; i++) {
          this.addSpark(this.trainHead.x + U.rand(-10, 10), this.trainHead.y + U.rand(-6, 6), "170,240,255");
        }
        App.toast("量子列车超频 · 云间光轨加速");
      } else if (h.type === "whale") {
        const w = this.whale;
        w.glow = 1.6;
        this.addRipple(w.x, w.y, 20, Math.max(240, w.L * 2.2), "130,225,255", 1);
        this.addRipple(w.x, w.y, 8, Math.max(160, w.L * 1.4), "200,250,255", .8);
        for (let i = 0; i < 30; i++) {
          this.addSpark(w.x + U.rand(-w.L, w.L) * .8, w.y + U.rand(-w.L * .4, w.L * .4), "160,240,255");
        }
        App.toast("极光鲸共鸣 · 数据星群向深空扩散");
      }
    }

    addRipple(x, y, r, max, rgb, a) {
      this.ripples.push({ x: x, y: y, r: r, max: max, rgb: rgb, a: a });
      if (this.ripples.length > 26) this.ripples.shift();
    }
    addSpark(x, y, rgb) {
      if (this.sparks.length > this.sparkMax) return;
      this.sparks.push({
        x: x, y: y, rgb: rgb,
        vx: U.rand(-42, 42), vy: U.rand(-46, 26),
        life: 1, r: U.rand(.8, 2.6),
      });
    }

    /* ---------- 主绘制 ---------- */
    frame(ts) {
      const fit = U.fitCanvas(this.c);
      const ctx = fit.ctx, w = fit.w, h = fit.h;
      if (w < 8 || h < 8) return;
      if (w !== this.W || h !== this.H) this.build();
      let dt = this.last ? ts - this.last : 16;
      this.last = ts;
      if (!(dt >= 0) || dt > 46) dt = 16;
      const T = (ts - this.t0) / 1000;
      const W = this.W, H = this.H;

      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      /* 1. 夜空 */
      ctx.drawImage(this.sky, 0, 0, w, h);

      /* 2. 星 */
      for (let i = 0; i < this.stars.length; i++) {
        const s = this.stars[i];
        const tw = .45 + .55 * Math.sin(T * s.sp + s.ph);
        const a = s.a * tw;
        if (a < .03) continue;
        if (s.big) {
          const r = s.r * 5.5;
          ctx.globalAlpha = a * .8;
          ctx.drawImage(this.star, s.x - r, s.y - r, r * 2, r * 2);
          ctx.globalAlpha = 1;
        } else {
          ctx.fillStyle = "rgba(202,232,255," + a + ")";
          ctx.fillRect(s.x, s.y, s.r, s.r);
        }
      }

      /* 3. 极光 */
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < this.aurora.length; i++) {
        const au = this.aurora[i];
        const drift = Math.sin(T * (0.033 + i * 0.011) + i * 2.1);
        const a = (.30 + .12 * Math.sin(T * .35 + i)) * (i === 0 ? 1 : .78);
        const sw = w * (.72 + i * .1), sh = h * (.42 + i * .06);
        ctx.globalAlpha = a;
        ctx.drawImage(au,
          -w * .06 + drift * w * .05 + i * w * .12,
          -h * .10 + Math.sin(T * .21 + i) * h * .015,
          sw, sh);
        ctx.globalAlpha = 1;
      }
      ctx.restore();

      /* 4. 远景剪影（视差） */
      ctx.globalAlpha = .92;
      const farOff = Math.sin(T * .012) * 26;
      ctx.drawImage(this.far, farOff, this.farY, this.far.width, this.far.height);
      ctx.globalAlpha = 1;

      /* 5. 天际雾光 + 楼群 */
      ctx.fillStyle = this.gradNeon;
      ctx.fillRect(0, this.horizon - H * .1, w, h - this.horizon + H * .1);

      for (let i = 0; i < this.buildings.length; i++) {
        const b = this.buildings[i];
        ctx.drawImage(b.img, b.x, b.y - 7);
      }

      /* 6. 窗格（批量：首次更新亮灭状态） */
      const winAll = this.windows;
      for (let bi = 0; bi < 2; bi++) {
        const arr = winAll[bi];
        for (let i = 0; i < arr.length; i++) {
          const wd = arr[i];
          if (Math.random() < .0035) wd.ph = Math.random() * TAU;
          wd.on = Math.sin(T * wd.sp + wd.ph) > wd.th;
        }
      }
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = "rgba(150,235,255,.86)";
      ctx.beginPath();
      for (let i = 0; i < winAll[0].length; i++) {
        const wd = winAll[0][i];
        if (wd.on) ctx.rect(wd.x, wd.y, wd.w, wd.h);
      }
      ctx.fill();
      ctx.fillStyle = "rgba(255,206,140,.72)";
      ctx.beginPath();
      for (let i = 0; i < winAll[1].length; i++) {
        const wd = winAll[1][i];
        if (wd.on) ctx.rect(wd.x, wd.y, wd.w, wd.h);
      }
      ctx.fill();
      ctx.restore();

      /* 7. 地面 / 霓虹湿地 */
      ctx.fillStyle = this.gradGround;
      ctx.fillRect(0, this.groundY - 10, w, h - this.groundY + 10);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = this.gradRefl;
      for (let i = 0; i < this.buildings.length; i += 2) {
        const b = this.buildings[i];
        ctx.globalAlpha = .5 + .5 * Math.sin(T * 1.4 + i);
        ctx.fillRect(b.x + b.w * .5 - 2, this.groundY, 4, h - this.groundY);
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      /* 8. 直通宇宙的电梯 */
      this.drawElev(ctx, T, dt);

      /* 9. 量子轨道列车 */
      this.drawTrain(ctx, T, dt);

      /* 10. 飞行器 */
      this.drawShips(ctx, T, dt);

      /* 11. 极光鲸 */
      this.drawWhale(ctx, T, dt);

      /* 12. 数据字节 */
      ctx.save();
      ctx.font = "10px \"Cascadia Mono\", Consolas, monospace";
      for (let i = 0; i < this.bytes.length; i++) {
        const b = this.bytes[i];
        b.y -= b.vy * dt / 1000;
        if (b.y < -14) { b.y = h * .8; b.x = U.rand(0, w); }
        ctx.fillStyle = "rgba(120,215,255," + b.a + ")";
        ctx.font = b.sz + "px \"Cascadia Mono\", Consolas, monospace";
        ctx.fillText(b.ch, b.x, b.y);
      }
      ctx.restore();

      /* 13. 光效 */
      this.drawFx(ctx, dt);

      /* 14. hover 指示 */
      if (!this.frozen) {
        const hh = this.hit(this.px, this.py);
        if (hh !== this.hover) {
          this.hover = hh;
          this.c.style.cursor = hh ? "pointer" : "default";
        }
      } else {
        this.hover = null;
        this.c.style.cursor = "default";
      }
      this.drawHover(ctx, T);

      /* 15. 顶部/底部压暗 */
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      const topG = ctx.createLinearGradient(0, 0, 0, h * .12);
      topG.addColorStop(0, "rgba(1,4,12,.55)");
      topG.addColorStop(1, "rgba(1,4,12,0)");
      ctx.fillStyle = topG; ctx.fillRect(0, 0, w, h * .12);
      ctx.restore();
    }

    drawElev(ctx, T, dt) {
      const e = this.elev, gY = this.groundY;
      const bwid = 42;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = .42 + e.flash * .5 + Math.sin(T * 2.1) * .05;
      ctx.drawImage(this.beam, e.x - bwid / 2, -90, bwid, gY + 90);
      ctx.globalAlpha = 1;
      // 顶部星门
      const rr = 24 + Math.sin(T * 1.5) * 3;
      ctx.strokeStyle = "rgba(150,235,255," + (.42 + e.flash * .4) + ")";
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(e.x, 34, rr, rr * 0.28, 0, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(e.x, 34, rr * .62, rr * .17, 0, 0, TAU); ctx.stroke();
      ctx.restore();

      const sp = 0.085 + e.boost * 0.20;
      e.p += sp * dt / 1000;
      if (e.p > 1.1) e.p = 0;
      e.boost = Math.max(0, e.boost - dt * 0.0009);
      e.flash = Math.max(0, e.flash - dt * 0.0014);
      const cy = U.lerp(gY - 8, -26, U.clamp(e.p, 0, 1));
      this.elevY = cy;
      const ca = U.clamp(Math.min(1, e.p * 8) * Math.min(1, (1.08 - e.p) * 5), 0, 1);

      ctx.save();
      ctx.globalAlpha = ca;
      ctx.globalCompositeOperation = "lighter";
      // 轿厢光晕
      ctx.drawImage(this.glow, e.x - 34, cy - 34, 68, 68);
      ctx.globalCompositeOperation = "source-over";
      const g = ctx.createLinearGradient(e.x - 7, 0, e.x + 7, 0);
      g.addColorStop(0, "rgba(30,110,190,.95)");
      g.addColorStop(.5, "rgba(210,248,255,.98)");
      g.addColorStop(1, "rgba(30,110,190,.95)");
      ctx.fillStyle = g;
      U.roundRect(ctx, e.x - 7, cy - 11, 14, 22, 3);
      ctx.fill();
      ctx.strokeStyle = "rgba(180,245,255,.9)";
      ctx.lineWidth = .9;
      ctx.stroke();
      // 窗
      ctx.fillStyle = "rgba(120,240,255,.85)";
      ctx.fillRect(e.x - 3.4, cy - 7, 6.8, 4);
      ctx.restore();
    }

    drawTrain(ctx, T, dt) {
      const tr = this.track;
      /* 高架轨道 */
      ctx.save();
      // 桥体（半透明结构带）
      ctx.strokeStyle = "rgba(20,58,104,.55)";
      ctx.lineWidth = 11;
      ctx.beginPath(); ctx.ellipse(tr.cx, tr.cy, tr.rx, tr.ry, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = "rgba(70,140,215,.22)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(tr.cx, tr.cy, tr.rx, tr.ry - 6, 0, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(tr.cx, tr.cy, tr.rx, tr.ry + 6, 0, 0, TAU); ctx.stroke();
      // 双轨
      ctx.strokeStyle = "rgba(130,215,255,.42)";
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.ellipse(tr.cx, tr.cy, tr.rx, tr.ry - 4, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = "rgba(160,235,255,.22)";
      ctx.beginPath(); ctx.ellipse(tr.cx, tr.cy, tr.rx, tr.ry + 4, 0, 0, TAU); ctx.stroke();
      // 轨道内侧暖光带
      ctx.strokeStyle = "rgba(94,200,255,.10)";
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.ellipse(tr.cx, tr.cy, tr.rx, tr.ry - 2, 0, 0, TAU); ctx.stroke();
      // 流光刻度
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * TAU + T * .06;
        const px = tr.cx + Math.cos(a) * tr.rx;
        const py = tr.cy + Math.sin(a) * (tr.ry - 5);
        ctx.fillStyle = "rgba(160,235,255," + (.12 + .22 * (.5 + .5 * Math.sin(a * 5 + T * 2))) + ")";
        ctx.fillRect(px - 1, py - 1, 2, 2);
      }
      // 支柱
      ctx.globalCompositeOperation = "source-over";
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * TAU;
        const px = tr.cx + Math.cos(a) * tr.rx;
        const py = tr.cy + Math.sin(a) * tr.ry;
        if (py < this.horizon * .95) continue;
        ctx.strokeStyle = "rgba(70,140,220,.14)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, this.groundY); ctx.stroke();
      }
      ctx.restore();

      /* 列车运行 */
      const sp = 0.05 + this.trainBoost * 0.17;
      this.trainP = (this.trainP + sp * dt / 1000) % 1;
      this.trainBoost = Math.max(0, this.trainBoost - dt * 0.0009);

      const headP = this.trainP;
      const ang0 = headP * TAU;
      const hx = tr.cx + Math.cos(ang0) * tr.rx;
      const hy = tr.cy + Math.sin(ang0) * tr.ry;
      this.trainHead.x = hx; this.trainHead.y = hy;

      // 光尾
      this.trainTrail.push({ x: hx, y: hy });
      if (this.trainTrail.length > 46) this.trainTrail.shift();
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 1; i < this.trainTrail.length; i++) {
        const a = i / this.trainTrail.length;
        const p0 = this.trainTrail[i - 1], p1 = this.trainTrail[i];
        ctx.strokeStyle = "rgba(140,230,255," + (a * a * (.28 + this.trainBoost * .4)) + ")";
        ctx.lineWidth = a * (7 + this.trainBoost * 6);
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
      }
      ctx.restore();

      // 车厢
      const cars = 5;
      for (let i = cars - 1; i >= 0; i--) {
        const pp = (headP - i * 0.0085 + 1) % 1;
        const a = pp * TAU;
        const cx = tr.cx + Math.cos(a) * tr.rx;
        const cy = tr.cy + Math.sin(a) * tr.ry;
        const ca = Math.cos(a), sa = Math.sin(a);
        const tan = Math.atan2(ca * tr.ry, -sa * tr.rx);
        const cw = 27, chh = 9.5;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(tan);
        // 光晕
        ctx.globalCompositeOperation = "lighter";
        ctx.drawImage(this.glow, -cw * .7, -chh * 1.1, cw * 1.4, chh * 2.2);
        ctx.globalCompositeOperation = "source-over";
        const g = ctx.createLinearGradient(0, -chh, 0, chh);
        g.addColorStop(0, "rgba(190,245,255,.96)");
        g.addColorStop(.5, "rgba(56,160,240,.92)");
        g.addColorStop(1, "rgba(10,50,110,.95)");
        ctx.fillStyle = g;
        U.roundRect(ctx, -cw / 2, -chh / 2, cw, chh, 3.2);
        ctx.fill();
        ctx.strokeStyle = "rgba(180,242,255,.85)";
        ctx.lineWidth = .8;
        ctx.stroke();
        // 车窗
        ctx.fillStyle = "rgba(240,255,255,.92)";
        for (let k = 0; k < 3; k++) ctx.fillRect(-cw * .32 + k * 8, -chh * .22, 4, 3);
        ctx.restore();
      }
      // 车头灯
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, 26 + this.trainBoost * 20);
      hg.addColorStop(0, "rgba(240,255,255,.95)");
      hg.addColorStop(.4, "rgba(120,225,255,.4)");
      hg.addColorStop(1, "rgba(100,200,255,0)");
      ctx.fillStyle = hg;
      ctx.beginPath(); ctx.arc(hx, hy, 26 + this.trainBoost * 20, 0, TAU); ctx.fill();
      ctx.restore();
    }

    drawShips(ctx, T, dt) {
      const w = this.W;
      for (let i = 0; i < this.ships.length; i++) {
        const s = this.ships[i];
        if (!s.alive) {
          s.respawn -= dt;
          if (s.respawn <= 0) {
            const dir = Math.random() < .5 ? 1 : -1;
            s.x = dir > 0 ? -70 : w + 70;
            s.y = this.horizon - U.rand(26, 150);
            s.vx = dir * U.rand(26, 68);
            s.size = U.rand(8, 15);
            s.boost = 0;
            s.alive = true;
            s.ph = U.rand(0, TAU);
          }
          continue;
        }
        s.x += s.vx * (1 + s.boost * 2.6) * dt / 1000;
        s.y += Math.sin(T * 1.3 + s.ph) * 7 * dt / 1000;
        if (s.boost > 0) s.boost = Math.max(0, s.boost - dt * 0.001);
        if (s.x < -100 || s.x > w + 100) { s.alive = false; s.respawn = U.rand(600, 2600); continue; }

        const hov = this.hover && this.hover.type === "ship" && this.hover.o === s;
        const sc = (hov ? 1.2 : 1) * (1 + s.boost * .12);
        const dir = s.vx >= 0 ? 1 : -1;

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.scale(sc * dir, sc);
        // 跃迁时闪烁
        if (s.boost > 0) ctx.globalAlpha = .55 + .45 * Math.abs(Math.sin(T * 34));
        // 引擎拖尾
        ctx.globalCompositeOperation = "lighter";
        const tg = ctx.createLinearGradient(-s.size * 4, 0, 0, 0);
        tg.addColorStop(0, "rgba(120,220,255,0)");
        tg.addColorStop(1, "rgba(150,235,255," + (.35 + s.boost * .5) + ")");
        ctx.fillStyle = tg;
        ctx.beginPath();
        ctx.moveTo(-s.size * 3.4, 0);
        ctx.lineTo(-s.size * .4, -s.size * .3);
        ctx.lineTo(-s.size * .4, s.size * .3);
        ctx.closePath(); ctx.fill();
        // 机身
        ctx.globalCompositeOperation = "source-over";
        const bw = s.size * 2.1, bh = s.size * .5;
        const g = ctx.createLinearGradient(0, -bh, 0, bh);
        g.addColorStop(0, "rgba(190,240,255,.95)");
        g.addColorStop(.55, "rgba(46,130,205,.95)");
        g.addColorStop(1, "rgba(8,36,72,.95)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(bw, 0);
        ctx.quadraticCurveTo(bw * .3, -bh, -bw * .72, -bh * .55);
        ctx.lineTo(-bw * .95, 0);
        ctx.lineTo(-bw * .72, bh * .55);
        ctx.quadraticCurveTo(bw * .3, bh, bw, 0);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "rgba(180,245,255,.85)";
        ctx.lineWidth = .8; ctx.stroke();
        // 背鳍
        ctx.beginPath();
        ctx.moveTo(bw * .14, -bh * .5);
        ctx.lineTo(-bw * .12, -bh * 2.1);
        ctx.lineTo(-bw * .34, -bh * .5);
        ctx.closePath();
        ctx.fillStyle = "rgba(120,200,245,.8)";
        ctx.fill();
        // 座舱
        ctx.fillStyle = "rgba(230,255,255," + (.7 + .3 * Math.sin(T * 3 + s.ph)) + ")";
        ctx.beginPath(); ctx.arc(bw * .30, -bh * .10, s.size * .15, 0, TAU); ctx.fill();
        // 引擎光点
        ctx.globalCompositeOperation = "lighter";
        for (let k = 0; k < 2; k++) {
          const ex = -bw * (.72 + k * .18), ey = (k ? 1 : -1) * bh * .3;
          ctx.drawImage(this.glow, ex - 6, ey - 6, 12, 12);
        }
        ctx.restore();
      }
    }

    drawWhale(ctx, T, dt) {
      const w = this.whale, W = this.W, H = this.H;
      const a = T * 0.088;
      const R = W * 0.355;
      const nx = W * 0.5 + Math.cos(a) * R;
      const ny = H * 0.272 + Math.sin(a * 1.55 + .7) * H * 0.082 + Math.sin(T * .72) * 4;
      w.x = nx; w.y = ny;

      const targetFace = -Math.sin(a) >= 0 ? 1 : -1;
      w.faceS += (targetFace - w.faceS) * Math.min(1, dt * 0.0035);
      w.ang = Math.sin(a * 1.55 + .7) * 0.17;

      // 鲸鸣脉冲
      if (T > this.nextPulse) {
        this.nextPulse = T + U.rand(7, 13);
        w.glow = Math.max(w.glow, 1);
        this.addRipple(w.x, w.y, 22, Math.max(220, w.L * 2), "130,225,255", .9);
        for (let i = 0; i < 12; i++) {
          this.addSpark(w.x + U.rand(-w.L * .7, w.L * .7), w.y + U.rand(-w.L * .3, w.L * .3), "150,235,255");
        }
      }
      w.glow = Math.max(0, w.glow - dt * 0.00085);

      const L = w.L;
      const sw = L * 2.36;
      const sh = sw * (this.whaleSprite._ar || 0.645);

      ctx.save();
      ctx.translate(nx, ny);
      ctx.rotate(w.ang);
      const sxx = w.faceS >= 0 ? Math.max(.10, w.faceS) : Math.min(-.10, w.faceS);

      // 光晕
      ctx.globalCompositeOperation = "lighter";
      const gr = L * (1.55 + w.glow * 1.15);
      ctx.globalAlpha = .40 + w.glow * .5;
      ctx.drawImage(this.glow, -gr, -gr * .60, gr * 2, gr * 1.2);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      ctx.scale(sxx, 1);
      ctx.globalAlpha = .92;
      ctx.drawImage(this.whaleSprite, -sw / 2, -sh / 2, sw, sh);
      ctx.globalAlpha = 1;
      ctx.restore();

      // 体内能量粒子
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const cosA = Math.cos(w.ang), sinA = Math.sin(w.ang);
      const fs = sxx >= 0 ? 1 : -1;
      for (let i = 0; i < this.whalePts.length; i++) {
        const p = this.whalePts[i];
        const lu = p.u * L * fs, lv = p.v * L;
        const px = nx + lu * cosA - lv * sinA;
        const py = ny + lu * sinA + lv * cosA;
        const al = (.14 + .52 * (.5 + .5 * Math.sin(T * p.sp + p.ph))) * (.5 + w.glow * .9);
        const r = p.r * (1 + w.glow * .8);
        ctx.globalAlpha = al;
        ctx.drawImage(this.glow, px - r, py - r, r * 2.6, r * 2.6);
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // 尾迹
      if (T - (this._lastWe || 0) > .085) {
        this._lastWe = T;
        const tx = nx - Math.cos(w.ang) * L * 1.04 * (sxx >= 0 ? 1 : -1);
        const ty = ny - Math.sin(w.ang) * L * 1.04;
        this.whaleTrail.push({ x: tx + U.rand(-6, 6), y: ty + U.rand(-9, 9), life: 1, r: U.rand(1.2, 3.4) });
        if (this.whaleTrail.length > 70) this.whaleTrail.shift();
      }
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < this.whaleTrail.length; i++) {
        const d = this.whaleTrail[i];
        d.life -= dt * 0.00055;
        d.y += dt * 0.004;
        d.x -= dt * 0.0025;
        if (d.life <= 0) continue;
        ctx.globalAlpha = d.life * .55;
        const r = d.r * (1.4 - d.life * .4);
        ctx.drawImage(this.glow, d.x - r * 2, d.y - r * 2, r * 4, r * 4);
      }
      ctx.globalAlpha = 1;
      ctx.restore();
      if (this.whaleTrail.length && this.whaleTrail[0].life <= 0) this.whaleTrail.shift();
    }

    drawFx(ctx, dt) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      // 涟漪
      for (let i = this.ripples.length - 1; i >= 0; i--) {
        const r = this.ripples[i];
        r.r += (r.max - r.r) * 0.055;
        r.a *= 0.972;
        if (r.a < .015) { this.ripples.splice(i, 1); continue; }
        ctx.strokeStyle = "rgba(" + r.rgb + "," + r.a + ")";
        ctx.lineWidth = 1 + r.a * 2.2;
        ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r, r.r * .72, 0, 0, TAU); ctx.stroke();
        if (r.a > .25) {
          ctx.strokeStyle = "rgba(" + r.rgb + "," + (r.a * .4) + ")";
          ctx.lineWidth = .8;
          ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r * .66, r.r * .47, 0, 0, TAU); ctx.stroke();
        }
      }
      // 光尘
      for (let i = this.sparks.length - 1; i >= 0; i--) {
        const s = this.sparks[i];
        s.x += s.vx * dt / 1000;
        s.y += s.vy * dt / 1000;
        s.vy += dt * 0.018;
        s.life -= dt * 0.0011;
        if (s.life <= 0) { this.sparks.splice(i, 1); continue; }
        ctx.globalAlpha = s.life * .85;
        const r = s.r * (1 + (1 - s.life) * 2);
        ctx.drawImage(this.glow, s.x - r * 2, s.y - r * 2, r * 4, r * 4);
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    drawHover(ctx, T) {
      const h = this.hover;
      if (!h || this.frozen) return;
      let x = 0, y = 0, r = 30, rot = 0;
      if (h.type === "ship") { x = h.o.x; y = h.o.y; r = h.o.size * 2.8 + 14; }
      else if (h.type === "elev") { x = this.elev.x; y = this.elevY; r = 42; }
      else if (h.type === "train") { x = this.trainHead.x; y = this.trainHead.y; r = 38; }
      else { x = this.whale.x; y = this.whale.y; r = this.whale.L * 1.24; rot = this.whale.ang; }
      const pulse = .55 + .45 * Math.sin(T * 5.5);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "rgba(150,240,255," + (.5 * pulse) + ")";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([7, 9]);
      ctx.lineDashOffset = -T * 30;
      ctx.beginPath(); ctx.ellipse(0, 0, r, r * .66, 0, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
      // 四角标记
      ctx.strokeStyle = "rgba(190,250,255," + (.7 * pulse) + ")";
      ctx.lineWidth = 1.4;
      for (let k = 0; k < 4; k++) {
        const aa = k * Math.PI / 2 + Math.PI / 4;
        const cx = Math.cos(aa) * r * .92, cy = Math.sin(aa) * r * .62;
        ctx.beginPath();
        ctx.moveTo(cx - 5 * Math.cos(aa), cy - 5 * Math.sin(aa) * .66);
        ctx.lineTo(cx, cy);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  /* ================================================================
   * 三、页面状态
   * ================================================================ */
  const STATE = {
    ai: "doubao",
    generated: false,
    bg: "none",
    urls: { init: null, upload: null, ai: null },
    lockDesc: "",
    spinning: false,
    navigating: false,
  };

  let L = null, scene = null, rootEl = null, gyro = null, lastTs = 0;

  // 页面内部根节点（承载 has-img / decomposing 等状态类）
  function pageRoot() { return document.getElementById("bp-root"); }

  /* ---------------- DOM ---------------- */
  function build(root) {
    root.innerHTML =
      '<div id="bp-root">' +
      '<canvas id="bp-bg"></canvas>' +
      '<div id="bp-imgview"></div>' +
      '<div id="bp-scan"></div>' +
      '<div id="bp-title"><b>Blueprints</b><span>· 你心目中的蓝图</span></div>' +
      '<div id="bp-panel">' +
        '<div class="bp-copy-head"><i></i>TRANSMISSION · 111 · BLUEPRINT</div>' +
        '<div id="bp-copy"></div>' +
        '<div class="bp-copy-foot">DECODED <em id="bp-copy-pct">0%</em> · SIGNAL STABLE</div>' +
        '<div id="bp-ai">' +
          '<div class="bp-ai-tabs">' +
            '<button class="bp-tab on" data-ai="doubao">豆包 AI</button>' +
            '<button class="bp-tab" data-ai="jimeng">即梦 AI</button>' +
            '<span class="bp-ai-state" id="bp-ai-state">READY · DOUBAO</span>' +
          '</div>' +
          '<div class="bp-ai-dialog">' +
            '<textarea id="bp-desc" maxlength="120" rows="2" ' +
              'placeholder="描述你心目中的蓝图…… 例如：江水上的量子列车与极光鲸"></textarea>' +
            '<button class="bp-gen" id="bp-gen">生成蓝图</button>' +
          '</div>' +
          '<div class="bp-thumbs" id="bp-thumbs">' +
            '<button class="bp-thumb" data-k="init"><i></i><em>初始蓝图</em><em class="empty">LOADING</em></button>' +
            '<button class="bp-thumb" data-k="upload"><i></i><em>自制图片</em><em class="empty">本地上传</em></button>' +
            '<button class="bp-thumb" data-k="ai"><i></i><em>AI 生成</em><em class="empty">尚未生成</em></button>' +
            '<input type="file" id="bp-file" accept="image/*" hidden>' +
          '</div>' +
        '</div>' +
        '<div id="bp-gyro-box">' +
          '<canvas id="bp-gyro"></canvas>' +
          '<div id="bp-gyro-line"><span id="bp-gyro-txt">我们需要你......</span>' +
            '<span class="bar">|</span></div>' +
        '</div>' +
      '</div>' +
      '<div id="bp-hint">可点击 · <b>量子列车</b> · <b>极光鲸</b> · <b>飞行器</b> · <b>天梯轿厢</b></div>' +
      '<canvas id="bp-fx"></canvas>' +
      '</div>';
  }

  /* ---------------- 打字 ---------------- */
  function startTyping() {
    const el = document.getElementById("bp-copy");
    const pct = document.getElementById("bp-copy-pct");
    if (!el) return;
    const txt = String(D.BLUEPRINT_COPY || "");
    el.innerHTML = "";
    const cur = U.el("span", "cur");
    el.appendChild(cur);
    let i = 0, acc = 0, last = 0, done = false;
    L.raf(function (t) {
      if (done) return;
      // 用帧增量推进（对时间源异常也稳健）
      let d = last ? t - last : 16;
      last = t;
      if (d < 0 || d > 240) d = 16;
      acc += d;
      const gap = 30;
      let guard = 0;
      while (acc >= gap && i < txt.length && guard < 6) {
        const ch = txt.charAt(i++);
        const sp = U.el("span", "ch in");
        sp.textContent = ch;
        el.insertBefore(sp, cur);
        acc -= gap;
        guard++;
      }
      if (pct) pct.textContent = Math.round(i / Math.max(1, txt.length) * 100) + "%";
      if (i >= txt.length) {
        done = true;
        if (pct) pct.textContent = "100%";
      }
    });
  }

  /* ---------------- 陀螺绘制 ---------------- */
  function drawGyroShape(ctx, cx, baseY, hh, sx, alpha, solid) {
    const r = hh * 0.30;
    const topY = baseY - hh;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(cx - r * sx, topY);
    ctx.bezierCurveTo(cx - r * sx * .58, topY + hh * .34, cx - 3.2, baseY - hh * .16, cx, baseY - 1.2);
    ctx.bezierCurveTo(cx + 3.2, baseY - hh * .16, cx + r * sx * .58, topY + hh * .34, cx + r * sx, topY);
    ctx.closePath();
    if (solid) {
      ctx.fillStyle = solid;
      ctx.fill();
      return;
    }
    const lg = ctx.createLinearGradient(cx - r, 0, cx + r, 0);
    lg.addColorStop(0, "#2a1d0c");
    lg.addColorStop(.32, "#c69a53");
    lg.addColorStop(.5, "#fff2cf");
    lg.addColorStop(.7, "#c99a52");
    lg.addColorStop(1, "#241a0a");
    ctx.fillStyle = lg;
    ctx.fill();
    ctx.strokeStyle = "rgba(150,232,255,.55)";
    ctx.lineWidth = 1;
    ctx.stroke();
    // 顶面
    ctx.beginPath();
    ctx.ellipse(cx, topY, Math.max(1.4, r * sx), r * 0.30, 0, 0, TAU);
    const tg = ctx.createLinearGradient(cx - r, topY - r * .3, cx + r, topY + r * .3);
    tg.addColorStop(0, "#e8c88c");
    tg.addColorStop(.5, "#fff8e2");
    tg.addColorStop(1, "#a97f3e");
    ctx.fillStyle = tg;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,242,206,.7)";
    ctx.lineWidth = 1;
    ctx.stroke();
    // 顶部轴心
    ctx.fillStyle = "rgba(255,250,232,.9)";
    ctx.beginPath(); ctx.arc(cx, topY, Math.max(1, r * .09), 0, TAU); ctx.fill();
  }

  function drawGyro(ts) {
    const cv = document.getElementById("bp-gyro");
    if (!cv || !gyro) return;
    const fit = U.fitCanvas(cv);
    const ctx = fit.ctx, w = fit.w, h = fit.h;
    if (w < 4 || h < 4) return;
    const dt = lastTs ? Math.max(0, Math.min(46, ts - lastTs)) : 16;
    lastTs = ts;
    ctx.clearRect(0, 0, w, h);

    gyro.spin += (gyro.target - gyro.spin) * Math.min(1, dt / 200);
    gyro.angle += gyro.spin * dt * 0.0055;
    gyro.prec += dt * (0.0012 + gyro.spin * 0.0016);

    const hh = h * 0.52;
    const baseY = h * 0.86;
    const spinning = gyro.spin > .06;
    const sx = spinning ? Math.cos(gyro.angle) : .92;
    const wobX = spinning ? Math.sin(gyro.prec) * gyro.spin * h * .045 : 0;
    const tilt = spinning ? Math.sin(gyro.prec * .9) * gyro.spin * .10 : 0;
    const cx = w / 2 + wobX;

    // 阴影（旋转时扩散变淡）
    const shR = (hh * .40) * (1 + (spinning ? .30 : .06) * Math.abs(Math.sin(gyro.prec)));
    const shA = spinning ? .26 : .38;
    ctx.save();
    const sg = ctx.createRadialGradient(cx, baseY + 3, 0, cx, baseY + 3, shR);
    sg.addColorStop(0, "rgba(4,12,26," + shA + ")");
    sg.addColorStop(1, "rgba(4,12,26,0)");
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.ellipse(cx, baseY + 3, shR, shR * .30, 0, 0, TAU); ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(cx, baseY);
    ctx.rotate(tilt);
    ctx.translate(-cx, -baseY);
    // 旋转残影
    if (spinning) {
      for (let k = 1; k <= 2; k++) {
        const off = Math.sin(gyro.angle - k * .5) * hh * .05;
        drawGyroShape(ctx, cx + off, baseY, hh, sx * (1 - k * .12), .16 / k,
          "rgba(180,235,255," + (.5 / k) + ")");
      }
    }
    drawGyroShape(ctx, cx, baseY, hh, sx, 1, null);
    // 冷光反射（赛博侧光）
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "rgba(120,225,255," + (.25 + gyro.spin * .35) + ")";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - hh * .30 * sx, baseY - hh - hh * .02);
    ctx.bezierCurveTo(cx - hh * .18 * sx, baseY - hh * .5, cx - 8, baseY - hh * .2, cx - 2, baseY - 2);
    ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  /* ---------------- 抖动字幕 ---------------- */
  function scheduleJitter() {
    L.timeout(function () {
      if (!STATE.spinning) {
        const line = document.getElementById("bp-gyro-line");
        if (line) {
          line.classList.remove("jit");
          void line.offsetWidth;
          line.classList.add("jit");
        }
      }
      scheduleJitter();
    }, U.rand(1700, 4400));
  }

  /* ================================================================
   * 四、分解动画：数码字节（上飘）+ 灰尘（下落）
   * ================================================================ */
  function sampleRect(parts, r, density) {
    const step = 17;
    for (let y = r.top + 4; y < r.bottom - 2; y += step) {
      for (let x = r.left + 4; x < r.right - 2; x += step) {
        if (Math.random() > density) continue;
        parts.push({
          kind: "block",
          x: x, y: y,
          w: U.rand(2, 6.5), h: U.rand(2, 5.5),
          vx: U.rand(-.6, .6), vy: U.rand(-.2, .5),
          rot: U.rand(-.4, .4),
          delay: Math.random() * .3,
          warm: Math.random() < .16,
        });
      }
    }
  }

  function samplePage(root) {
    const parts = [];
    // 1) 文案：逐字
    const chars = root.querySelectorAll("#bp-copy .ch");
    for (let i = 0; i < chars.length; i++) {
      const sp = chars[i];
      const r = sp.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      parts.push({
        kind: "byte",
        x: r.left + r.width / 2, y: r.top + r.height / 2,
        ch: sp.textContent,
        size: Math.min(16, r.height * .82),
        vx: U.rand(-.5, .5),
        delay: Math.random() * .28,
      });
    }
    // 2) 其它元素：方块采样
    const nodes = root.querySelectorAll(
      "#bp-title, .bp-copy-head, .bp-copy-foot, .bp-ai-tabs, .bp-tab, #bp-desc, " +
      ".bp-gen, #bp-thumbs, .bp-thumb, #bp-gyro, #bp-gyro-line");
    const seenRect = [];
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) continue;
      let dup = false;
      for (let k = 0; k < seenRect.length; k++) {
        const s = seenRect[k];
        if (Math.abs(s.x - r.left) < 3 && Math.abs(s.y - r.top) < 3 &&
            Math.abs(s.w - r.width) < 3 && Math.abs(s.h - r.height) < 3) { dup = true; break; }
      }
      if (dup) continue;
      seenRect.push({ x: r.left, y: r.top, w: r.width, h: r.height });
      sampleRect(parts, r, .34);
    }
    // 3) 全屏灰尘
    const W = window.innerWidth, H = window.innerHeight;
    for (let i = 0; i < 240; i++) {
      parts.push({
        kind: "dust",
        x: Math.random() * W, y: Math.random() * H,
        w: U.rand(.8, 2.6), h: U.rand(.8, 2.6),
        vx: U.rand(-28, 28), vy: U.rand(-14, 10),
        delay: Math.random() * .34,
        warm: Math.random() < .5,
      });
    }
    return parts;
  }

  function drawDecomp(ctx, w, h, parts, p, T) {
    ctx.clearRect(0, 0, w, h);
    // 压暗
    ctx.fillStyle = "rgba(2,6,14," + (0.62 * U.clamp(p * 2.2, 0, 1)) + ")";
    ctx.fillRect(0, 0, w, h);

    // 字节（向上飘离）
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const fonts = ["11px \"Cascadia Mono\",monospace", "15px \"Cascadia Mono\",monospace"];
    for (let f = 0; f < 2; f++) {
      ctx.font = fonts[f];
      const alphas = [.95, .65, .38, .16];
      for (let a = 0; a < alphas.length; a++) {
        ctx.fillStyle = "rgba(" + (a < 2 ? "205,246,255" : "120,215,255") + "," + alphas[a] + ")";
        for (let i = 0; i < parts.length; i++) {
          const d = parts[i];
          if (d.kind !== "byte") continue;
          if ((d.size > 13 ? 1 : 0) !== f) continue;
          const q = U.clamp((p - d.delay) / Math.max(.05, 1 - d.delay), 0, 1);
          if (q <= 0 || q >= 1) continue;
          const e = q * q;
          const y = d.y - (h * .62 + d.vy * 220) * e;
          const x = d.x + Math.sin(q * 7 + d.delay * 20) * 12 * e + d.vx * q * 90;
          const al = 1 - q;
          const bucket = al > .72 ? 0 : al > .45 ? 1 : al > .22 ? 2 : 3;
          if (bucket !== a) continue;
          ctx.fillText(d.ch, x, y);
        }
      }
    }
    ctx.restore();

    // 方块（向上 + 下落）
    ctx.save();
    const blockAlpha = [.92, .62, .36, .14];
    for (let a = 0; a < blockAlpha.length; a++) {
      ctx.fillStyle = a < 2 ? "rgba(190,242,255," + blockAlpha[a] + ")"
        : "rgba(255,206,150," + blockAlpha[a] + ")";
      ctx.beginPath();
      for (let i = 0; i < parts.length; i++) {
        const d = parts[i];
        if (d.kind !== "block") continue;
        if ((d.warm ? 1 : 0) !== (a < 2 ? 0 : 1)) continue;
        const q = U.clamp((p - d.delay) / Math.max(.05, 1 - d.delay), 0, 1);
        if (q <= 0 || q >= 1) continue;
        const e = q * q;
        const y = d.y - (h * .40 + d.vy * 160) * e;
        const x = d.x + d.vx * q * 130;
        const al = 1 - q;
        const bucket = al > .72 ? 0 : al > .45 ? 1 : al > .22 ? 2 : 3;
        if (bucket !== a) continue;
        ctx.rect(x, y, d.w * (1 - q * .5), d.h * (1 - q * .5));
      }
      ctx.fill();
    }
    ctx.restore();

    // 灰尘（四散落下消失）
    ctx.save();
    const dustAlpha = [.55, .34, .18, .07];
    for (let a = 0; a < dustAlpha.length; a++) {
      ctx.fillStyle = "rgba(196,214,238," + dustAlpha[a] + ")";
      ctx.beginPath();
      for (let i = 0; i < parts.length; i++) {
        const d = parts[i];
        if (d.kind !== "dust") continue;
        const q = U.clamp((p - d.delay) / Math.max(.05, 1 - d.delay), 0, 1);
        if (q <= 0 || q >= 1) continue;
        const e = q * q;
        const x = d.x + d.vx * q * 3.4;
        const y = d.y + d.vy * q * 2.4 + e * h * .42;
        const al = 1 - q;
        const bucket = al > .7 ? 0 : al > .42 ? 1 : al > .2 ? 2 : 3;
        if (bucket !== a) continue;
        ctx.rect(x, y, d.w, d.h);
      }
      ctx.fill();
    }
    ctx.restore();

    // 高光扫过 + 末端白闪
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    if (p > .35 && p < .92) {
      const sy = h * (1 - (p - .35) / .57);
      const g = ctx.createLinearGradient(0, sy - 90, 0, sy + 90);
      g.addColorStop(0, "rgba(90,200,255,0)");
      g.addColorStop(.5, "rgba(140,225,255,.14)");
      g.addColorStop(1, "rgba(90,200,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, sy - 90, w, 180);
    }
    if (p > .82) {
      const k = (p - .82) / .18;
      ctx.fillStyle = "rgba(180,235,255," + (k * k * .5) + ")";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(220,250,255," + (k * .9) + ")";
      ctx.lineWidth = 1.5 + k * 4;
      ctx.beginPath();
      ctx.ellipse(w * .5, h * .5, k * Math.max(w, h) * .8, k * Math.max(w, h) * .5, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function navCloud() {
    if (!(window.App && App.pages && App.pages.cloud)) {
      // 兜底：云端页面尚未注册，则恢复现场
      if (pageRoot()) pageRoot().classList.remove("decomposing");
      const fx = document.getElementById("bp-fx");
      if (fx) { fx.classList.remove("on"); const c = fx.getContext("2d"); c && c.clearRect(0, 0, fx.width, fx.height); }
      STATE.navigating = false;
      STATE.spinning = false;
      if (gyro) { gyro.target = 0; gyro.spin = 0; }
      const line = document.getElementById("bp-gyro-line");
      const txt = document.getElementById("bp-gyro-txt");
      if (line) line.classList.remove("welcome");
      if (txt) txt.textContent = "我们需要你......";
      if (App.toast) App.toast("Cloud Era 尚未开启 · 请稍后再试");
      return;
    }
    App.navigate("cloud", {}, { transition: "dark", flashMs: 420 });
  }

  function decomposeToCloud() {
    if (STATE.navigating) return;
    STATE.navigating = true;
    if (scene) scene.frozen = true;
    if (pageRoot()) pageRoot().classList.add("decomposing");
    const fx = document.getElementById("bp-fx");
    if (!fx) { navCloud(); return; }
    fx.classList.add("on");
    const parts = samplePage(rootEl || document);
    const DUR = 2200;
    let elapsed = 0, lastT = 0, finished = false;
    L.raf(function (ts) {
      if (finished) return;
      const fit = U.fitCanvas(fx);
      // 帧增量累计 → 进度（对时间源异常稳健）
      let d = lastT ? ts - lastT : 16;
      lastT = ts;
      if (d < 0 || d > 120) d = 16;
      elapsed += d;
      const p = Math.min(1, elapsed / DUR);
      drawDecomp(fit.ctx, fit.w, fit.h, parts, p, ts);
      if (p >= 1) {
        finished = true;
        navCloud();
      }
    });
  }

  /* ================================================================
   * 五、陀螺点击（接口）
   * ================================================================ */
  function spinGyro() {
    if (STATE.spinning || STATE.navigating) return;
    STATE.spinning = true;
    U.store.seed("gyro", 111);            // 首次访问给一个合理的历史基数（111 · 百十一年）
    const before = U.store.gyro();        // 之前的累计点击
    const total = U.store.addGyro();      // 加上本次点击
    if (gyro) gyro.target = 3.4;

    L.timeout(function () {
      const line = document.getElementById("bp-gyro-line");
      const txt = document.getElementById("bp-gyro-txt");
      const bar = line && line.querySelector(".bar");
      if (txt) txt.textContent = "欢迎第 " + total + " 名来自时光的蓝图畅想者——";
      if (bar) bar.style.display = "none";
      if (line) line.classList.add("welcome");
      if (App.toast) App.toast("陀螺已启动 · 这是第 " + total + " 次旋转（此前 " + before + " 次）");
    }, 400);

    L.timeout(function () { decomposeToCloud(); }, 1180);
  }

  /* ================================================================
   * 六、图框 / 生图
   * ================================================================ */
  function setThumb(k, url) {
    const b = document.querySelector('.bp-thumb[data-k="' + k + '"]');
    if (!b) return;
    b.style.backgroundImage = 'url("' + url + '")';
    const em = b.querySelector(".empty");
    if (em) em.remove();
  }

  function applyBg(k, silent) {
    const url = STATE.urls[k];
    if (!url) {
      if (!silent && App.toast) App.toast(k === "ai" ? "尚未生成 AI 蓝图" : "该图框还没有图片");
      return;
    }
    const iv = document.getElementById("bp-imgview");
    if (!iv) return;
    STATE.bg = k;
    // 令牌：连续切换时只让最后一次生效，避免淡入竞态
    const token = (STATE.bgToken = (STATE.bgToken || 0) + 1);
    const show = function () {
      if (STATE.bgToken !== token || L.dead) return;
      iv.style.backgroundImage = 'url("' + url + '")';
      void iv.offsetWidth;
      iv.classList.add("on");
      if (pageRoot()) pageRoot().classList.add("has-img");
    };
    if (iv.classList.contains("on")) {
      iv.classList.remove("on");
      L.timeout(show, 320);
    } else show();
    const ths = document.querySelectorAll(".bp-thumb");
    for (let i = 0; i < ths.length; i++) {
      ths[i].classList.toggle("on", ths[i].dataset.k === k);
    }
  }

  function ensureInitBlueprint() {
    if (STATE.urls.init) { setThumb("init", STATE.urls.init); return; }
    L.timeout(function () {
      const art = generateBlueprint("数字孪生流域，量子列车穿行云间站台，极光鲸掠过未来天际线", { ai: "init" });
      STATE.urls.init = art.url;
      if (!L.dead) setThumb("init", art.url);
    }, 420);
  }

  function refreshGenState() {
    const btn = document.getElementById("bp-gen");
    const st = document.getElementById("bp-ai-state");
    const ta = document.getElementById("bp-desc");
    if (!btn) return;
    if (STATE.generated) {
      btn.disabled = true;
      btn.textContent = "已定格";
      if (st) st.textContent = "本次到访的蓝图已定格";
      if (ta) {
        ta.readOnly = true;
        ta.value = STATE.lockDesc || "本次到访的蓝图已定格 —— 它属于此刻的你。";
      }
      // 没有本地缓存图时，仍提示"已定格"
      if (!STATE.urls.ai) {
        const th = document.querySelector('.bp-thumb[data-k="ai"] .empty');
        if (th) th.textContent = "本次到访已定格";
      }
    } else {
      btn.disabled = false;
      btn.textContent = "生成蓝图";
      if (st) st.textContent = "READY · " + (STATE.ai === "doubao" ? "DOUBAO" : "JIMENG");
    }
  }

  /* 真实 AI 生图：优先走本地演示服务器的 /api/image 代理（Key 不出服务端、无 CORS 问题），
     没有服务器时才尝试浏览器直连；两者都不可用时返回 null，由上层降级为程序化生成。
     返回 { url } 成功 / { error, message } 失败 / null 未配置。 */
  async function aiGenerate(desc, ai) {
    const cfg = window.CONFIG || {};
    const isDoubao = ai === "doubao";
    const p = isDoubao ? cfg.doubao : cfg.jimeng;
    const proxy = location.protocol === "file:" ? "" : (cfg.imageProxyUrl || "");
    const canDirect = !!(p && p.apiKey && p.endpoint);
    if (!proxy && !canDirect) return null;

    if (proxy) {
      try {
        const resp = await fetch(proxy, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: desc, ai: ai, model: (p && p.model) || "", size: "1280x720" }),
        });
        const j = await resp.json().catch(() => null);
        if (j && j.ok && j.url) return { url: j.url, fromApi: true, model: j.model };
        if (j && !j.ok) return { error: j.code || "API_FAIL", message: j.message || "" };
      } catch (e) {
        return { error: "NETWORK", message: String(e && e.message || e) };
      }
      return null;
    }

    try {
      const resp = await fetch(p.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + p.apiKey },
        body: JSON.stringify({ model: p.model, prompt: desc, size: "1024x1024", response_format: "url", watermark: false }),
      });
      const j = await resp.json();
      let url = (j.data && j.data[0] && (j.data[0].url || j.data[0].b64_json)) || null;
      // 有的返回 b64_json（裸 base64），需要补成 data URL 才能直接用作背景图
      if (url && !/^(https?:|data:)/.test(url)) url = "data:image/png;base64," + url;
      if (url) return { url, fromApi: true };
      const code = j && j.error && j.error.code;
      if (code) return { error: code, message: (j.error && j.error.message) || "" };
    } catch (e) { return { error: "NETWORK", message: String(e && e.message || e) }; }
    return null;
  }

  function doGenerate() {
    if (STATE.generated) return;
    const ta = document.getElementById("bp-desc");
    const btn = document.getElementById("bp-gen");
    const st = document.getElementById("bp-ai-state");
    const desc = ((ta && ta.value) || "").trim() ||
      "江水之上，量子列车穿过霓虹云站，极光鲸驮着星群掠过未来天际线";
    if (btn) { btn.disabled = true; btn.textContent = "生成中…"; }
    if (st) st.textContent = "RENDERING · " + (STATE.ai === "doubao" ? "DOUBAO" : "JIMENG");
    L.timeout(async function () {
      let art = null;
      let apiNote = "";
      try {
        art = await aiGenerate(desc, STATE.ai);
        if (art && art.error) {
          // 接口失败（额度用尽 / 未开通 / 网络）：把原因如实告诉用户，再降级为程序化生成
          apiNote = art.error === "SetLimitExceeded"
            ? "AI 额度已用尽（模型已暂停）· 已用程序化蓝图替代"
            : art.error === "ModelNotOpen"
              ? "该模型未在方舟控制台开通 · 已用程序化蓝图替代"
              : "AI 接口暂不可用（" + art.error + "）· 已用程序化蓝图替代";
          art = null;
        }
        if (!art) art = generateBlueprint(desc, { ai: STATE.ai });
      } catch (e) { art = null; }
      if (!art) {
        if (btn) { btn.disabled = false; btn.textContent = "生成蓝图"; }
        if (st) st.textContent = "RENDER FAILED";
        if (App.toast) App.toast("蓝图生成失败 · 请再试一次");
        return;
      }
      STATE.urls.ai = art.url;
      STATE.generated = true;
      STATE.lockDesc = desc;
      U.store.set("bpGenerated", true);
      U.store.set("bpImage", art.url);
      U.store.set("bpImageDesc", desc);
      setThumb("ai", art.url);
      refreshGenState();
      applyBg("ai");
      if (App.toast) App.toast(apiNote ? ("蓝图已定格 · " + apiNote) : "蓝图已生成并定格 · 本次到访仅此一次");
    }, 760);
  }

  /* ---------------- 交互绑定 ---------------- */
  function bindUI() {
    const ai = document.getElementById("bp-ai");
    if (ai) {
      L.on(ai, "click", function (e) {
        const tab = e.target.closest ? e.target.closest(".bp-tab") : null;
        if (!tab) return;
        STATE.ai = tab.dataset.ai;
        const tabs = ai.querySelectorAll(".bp-tab");
        for (let i = 0; i < tabs.length; i++) tabs[i].classList.toggle("on", tabs[i] === tab);
        const st = document.getElementById("bp-ai-state");
        if (st && !STATE.generated) st.textContent = "READY · " + (STATE.ai === "doubao" ? "DOUBAO" : "JIMENG");
      });
    }
    const gen = document.getElementById("bp-gen");
    if (gen) L.on(gen, "click", doGenerate);

    const thumbs = document.getElementById("bp-thumbs");
    if (thumbs) {
      L.on(thumbs, "click", function (e) {
        const b = e.target.closest ? e.target.closest(".bp-thumb") : null;
        if (!b) return;
        const k = b.dataset.k;
        if (k === "upload" && !STATE.urls.upload) {
          const inp = document.getElementById("bp-file");
          if (inp) inp.click();
          return;
        }
        if (k === "ai" && !STATE.urls.ai) {
          if (App.toast) App.toast("先在下方描述你心目中的蓝图，再生成");
          const ta = document.getElementById("bp-desc");
          if (ta && !STATE.generated) ta.focus();
          return;
        }
        applyBg(k);
      });
    }
    const file = document.getElementById("bp-file");
    if (file) {
      L.on(file, "change", function () {
        const f = file.files && file.files[0];
        if (!f) return;
        const fr = new FileReader();
        fr.onload = function () {
          if (L.dead) return;
          STATE.urls.upload = String(fr.result);
          setThumb("upload", STATE.urls.upload);
          applyBg("upload");
          if (App.toast) App.toast("自制蓝图已载入 · 背景已切换");
        };
        fr.readAsDataURL(f);
        file.value = "";
      });
    }

    const gy = document.getElementById("bp-gyro");
    if (gy) L.on(gy, "click", spinGyro);
  }

  /* ================================================================
   * 七、生命周期
   * ================================================================ */
  function enter() {
    if (L) { try { L.kill(); } catch (e) {} }
    L = U.life();
    STATE.spinning = false;
    STATE.navigating = false;
    lastTs = 0;

    rootEl = document.getElementById("page-blueprints");
    if (!rootEl) return;
    rootEl.classList.remove("decomposing");
    build(rootEl);

    // 读取「本次到访已生成」状态
    if (!STATE.generated) {
      if (U.store.get("bpGenerated", false)) {
        STATE.generated = true;
        STATE.lockDesc = U.store.get("bpImageDesc", "") || "";
        const img = U.store.get("bpImage", null);
        if (img) STATE.urls.ai = img;
      }
    }
    if (STATE.urls.ai) setThumb("ai", STATE.urls.ai);
    if (STATE.urls.upload) setThumb("upload", STATE.urls.upload);

    // 场景
    scene = new Scene(document.getElementById("bp-bg"));

    // 陀螺状态（初始不转动）
    gyro = { spin: 0, target: 0, angle: 0, prec: 0 };

    // 单循环：场景 + 陀螺
    L.loop(function (ts) {
      if (scene) scene.frame(ts);
      drawGyro(ts);
    });

    // 指针 / 点击（命中检测）
    const cv = document.getElementById("bp-bg");
    if (cv) {
      L.on(cv, "pointermove", function (e) {
        if (!scene) return;
        const r = cv.getBoundingClientRect();
        scene.px = e.clientX - r.left;
        scene.py = e.clientY - r.top;
      });
      L.on(cv, "pointerleave", function () {
        if (!scene) return;
        scene.px = -999; scene.py = -999;
        scene.hover = null;
        cv.style.cursor = "default";
      });
      L.on(cv, "click", function (e) {
        if (!scene) return;
        const r = cv.getBoundingClientRect();
        scene.click(e.clientX - r.left, e.clientY - r.top);
      });
    }

    // 文案打字 / 抖动 / 状态
    startTyping();
    scheduleJitter();
    refreshGenState();
    bindUI();
    ensureInitBlueprint();

    // 若本次到访已生成过，直接恢复背景
    if (STATE.generated && STATE.urls.ai) L.timeout(function () { applyBg("ai", true); }, 600);
  }

  function leave() {
    if (L) { L.kill(); L = null; }
    scene = null;
    gyro = null;
    lastTs = 0;
    STATE.spinning = false;
    STATE.navigating = false;
    const fx = document.getElementById("bp-fx");
    if (fx) {
      fx.classList.remove("on");
      try { const c = fx.getContext("2d"); c && c.clearRect(0, 0, fx.width, fx.height); } catch (e) {}
    }
    const file = document.getElementById("bp-file");
    if (file && file.parentNode) file.parentNode.removeChild(file);
    if (rootEl) {
      if (pageRoot()) pageRoot().classList.remove("decomposing", "has-img");
      rootEl.innerHTML = "";
    }
  }

  App.register("blueprints", { enter: enter, leave: leave });
})();

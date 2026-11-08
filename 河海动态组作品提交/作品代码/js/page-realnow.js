/* ============================================================
 * Real-now World · 此刻的世界
 * ------------------------------------------------------------
 * · canvas 程序化绘制：南京梧桐大道（透视林荫 + 梧桐树冠 + 光斑 + 光束）
 *   其余七城各一张离屏地标图层（预渲染，切换只做淡入淡出 + 镜头推移）
 * · 悬停「金陵」展开栏目；鼠标完全离开栏目容器才收起
 * · 右上英伦怀表：U.nowIn(tz) 实时时间，秒针平滑走动，切城指针旋转
 * · 实时新闻：fetch(AbortController 5s) → localStorage 缓存
 *   抓取冷却 3 分钟 / 检索 6 小时；失败降级 DATA.CITIES[i].news
 * ============================================================ */
(function () {
  const U = window.Utils, D = window.DATA;
  const TAU = Math.PI * 2;

  /* ================================================================
   * 0. 样式
   * ================================================================ */
  U.injectCSS("css-realnow", `
  #page-realnow{background:#04080f;}
  #rn-root{position:absolute;inset:0;overflow:hidden;font-family:var(--f-hei);}
  #rn-bg{position:absolute;inset:0;width:100%;height:100%;z-index:1;}
  #rn-tint{position:absolute;inset:0;z-index:2;pointer-events:none;
    background:linear-gradient(180deg,rgba(6,12,24,.3) 0%,rgba(6,12,24,0) 24%,rgba(3,7,14,0) 66%,rgba(3,7,14,.4) 100%);}
  #rn-vig{position:absolute;inset:0;z-index:2;pointer-events:none;
    background:radial-gradient(126% 122% at 50% 46%,rgba(0,0,0,0) 46%,rgba(2,5,12,.46) 100%);}
  #rn-grain{position:absolute;inset:-40%;z-index:3;pointer-events:none;opacity:.045;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.86' numOctaves='3'/%3E%3C/filter%3E%3Crect width='150' height='150' filter='url(%23n)'/%3E%3C/svg%3E");
    animation:rnGrain 5.5s steps(5) infinite;}
  @keyframes rnGrain{0%{transform:translate(0,0)}25%{transform:translate(-2%,1.5%)}
    50%{transform:translate(1.5%,-2%)}75%{transform:translate(-1%,-1.5%)}100%{transform:translate(0,0)}}

  /* ---------- 左上角小字标题 ---------- */
  #rn-top{position:absolute;left:26px;top:22px;z-index:7;display:flex;align-items:center;gap:11px;
    pointer-events:none;opacity:0;transform:translateY(-8px);
    transition:opacity 1.1s var(--ease) .25s, transform 1.1s var(--ease) .25s;}
  #rn-top .dot{width:5px;height:5px;border-radius:50%;background:#f2d491;flex:0 0 auto;
    box-shadow:0 0 10px rgba(255,214,138,.95),0 0 22px rgba(255,190,80,.6);
    animation:rnDot 3.4s ease-in-out infinite;}
  @keyframes rnDot{0%,100%{opacity:.45;transform:scale(.82)}50%{opacity:1;transform:scale(1.14)}}
  #rn-top .tx{font-family:var(--f-hei);font-size:11.5px;letter-spacing:.24em;
    color:rgba(228,236,246,.7);text-shadow:0 1px 12px rgba(0,0,0,.8);}
  #rn-top .tx b{font-weight:400;color:#f2d491;letter-spacing:.2em;}

  /* ---------- 大字标题 + 栏目 ---------- */
  #rn-topwrap{position:absolute;left:0;right:0;top:7%;z-index:8;display:flex;justify-content:center;
    pointer-events:none;opacity:0;transform:translateY(-20px) scale(.985);
    transition:opacity 1.5s var(--ease) .1s, transform 1.5s var(--ease) .1s;}
  /* 标题后的柔和暗场：保证任何地标背景下题字都清晰 */
  #rn-topwrap::before{content:"";position:absolute;left:50%;top:-22%;width:min(1180px,104vw);
    height:190%;transform:translateX(-50%);pointer-events:none;
    background:radial-gradient(48% 46% at 50% 38%,rgba(3,7,14,.72) 0%,rgba(3,7,14,.42) 46%,
      rgba(3,7,14,.14) 70%,rgba(3,7,14,0) 88%);}
  #rn-menu-zone{position:relative;pointer-events:auto;padding:0 14px 6px;text-align:center;}
  #rn-title{cursor:default;position:relative;padding:0 4px;}
  #rn-title-cn{position:relative;display:inline-block;font-family:var(--f-kai);
    font-size:clamp(52px,8.6vw,120px);line-height:1.08;letter-spacing:.15em;text-indent:.15em;
    background:linear-gradient(176deg,#fffdf5 0%,#f9e6ba 34%,#e2bc76 68%,#b48d47 100%);
    -webkit-background-clip:text;background-clip:text;color:transparent;
    -webkit-text-fill-color:transparent;
    filter:drop-shadow(0 0 20px rgba(255,208,124,.55)) drop-shadow(0 0 64px rgba(255,178,72,.3));
    animation:rnTitleGlow 7.5s ease-in-out infinite;}
  @keyframes rnTitleGlow{
    0%,100%{filter:drop-shadow(0 0 16px rgba(255,200,110,.42)) drop-shadow(0 0 56px rgba(255,170,60,.22));}
    50%{filter:drop-shadow(0 0 30px rgba(255,226,152,.8)) drop-shadow(0 0 104px rgba(255,186,72,.46));}}
  #rn-title-cn.swap{animation:rnTitleGlow 7.5s ease-in-out infinite, rnSwap .9s var(--ease);}
  @keyframes rnSwap{0%{opacity:0;filter:blur(16px) brightness(2.1);transform:translateY(-12px) scale(1.07);}
    100%{opacity:1;filter:blur(0);transform:none;}}
  #rn-title-en{margin-top:8px;font-family:var(--f-mono);font-size:clamp(8px,.82vw,11px);
    letter-spacing:.42em;color:rgba(236,220,180,.5);text-indent:.42em;}
  #rn-title-en b{font-weight:400;font-family:var(--f-song);font-size:1.05em;
    color:rgba(244,230,196,.82);letter-spacing:.2em;text-indent:.2em;}

  #rn-menu{position:absolute;left:50%;top:calc(100% + 14px);
    display:flex;align-items:flex-start;gap:1px;padding:11px 16px;border-radius:15px;
    transform:translate(-50%,-9px) scale(.975);opacity:0;pointer-events:none;
    background:linear-gradient(180deg,rgba(10,16,26,.76),rgba(6,10,18,.88));
    border:1px solid rgba(226,196,138,.22);
    box-shadow:0 26px 70px rgba(0,0,0,.62),inset 0 1px 0 rgba(255,255,255,.05);
    backdrop-filter:blur(15px) saturate(1.15);-webkit-backdrop-filter:blur(15px) saturate(1.15);
    transition:opacity .42s var(--ease), transform .52s var(--ease);}
  #rn-menu::before{content:"";position:absolute;left:-70px;right:-70px;top:-16px;height:17px;}
  #rn-menu-zone.open #rn-menu{opacity:1;pointer-events:auto;transform:translate(-50%,0) scale(1);}
  .rn-city{position:relative;flex:0 0 auto;border:0;background:transparent;cursor:pointer;
    padding:7px 10px 9px;min-width:52px;text-align:center;transition:transform .35s var(--ease);}
  .rn-city em{display:block;font-style:normal;font-family:var(--f-song);white-space:nowrap;
    font-size:clamp(12px,1.02vw,15px);letter-spacing:.15em;text-indent:.15em;
    color:rgba(240,234,220,.72);transition:color .35s ease,text-shadow .35s ease;}
  .rn-city span{display:block;margin-top:4px;font-family:var(--f-mono);white-space:nowrap;
    font-size:8px;letter-spacing:.16em;color:rgba(210,192,156,.3);transition:color .35s ease;}
  .rn-city::after{content:"";position:absolute;left:50%;bottom:3px;width:0;height:1px;
    transform:translateX(-50%);
    background:linear-gradient(90deg,transparent,#f2d491 45%,#ffeeba 55%,transparent);
    transition:width .42s var(--ease);}
  .rn-city:hover{transform:translateY(-1px);}
  .rn-city:hover em{color:#fff2cd;text-shadow:0 0 16px rgba(255,214,120,.85);}
  .rn-city:hover span{color:rgba(226,200,150,.6);}
  .rn-city:hover::after{width:80%;}
  .rn-city.on em{color:#f2d491;text-shadow:0 0 18px rgba(255,200,110,.9);}
  .rn-city.on::after{width:80%;}
  .rn-city.on span{color:rgba(226,200,150,.72);}
  .rn-div{width:1px;align-self:stretch;margin:9px 7px;
    background:linear-gradient(180deg,transparent,rgba(226,196,138,.34),transparent);}

  /* ---------- 怀表 + 新闻 ---------- */
  #rn-watch-col{position:absolute;right:26px;top:80px;width:272px;z-index:7;
    display:flex;flex-direction:column;align-items:center;opacity:0;transform:translateX(30px);
    transition:opacity 1.3s var(--ease) .3s, transform 1.3s var(--ease) .3s;}
  #rn-watch{display:block;filter:drop-shadow(0 20px 36px rgba(0,0,0,.6));}
  #rn-wdate{margin-top:3px;font-family:var(--f-mono);font-size:9.5px;letter-spacing:.18em;
    color:rgba(240,232,212,.62);text-align:center;text-indent:.18em;
    text-shadow:0 1px 8px rgba(0,0,0,.95),0 0 18px rgba(0,0,0,.8);}
  #rn-wdate b{font-weight:400;font-family:var(--f-song);color:rgba(246,220,158,.9);
    letter-spacing:.16em;text-indent:.16em;}

  #rn-news{margin-top:15px;width:100%;padding:13px 15px 12px;border-radius:13px;position:relative;
    overflow:hidden;background:linear-gradient(180deg,rgba(9,15,25,.66),rgba(5,9,16,.8));
    border:1px solid rgba(226,196,138,.17);
    box-shadow:0 18px 44px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.05);
    backdrop-filter:blur(12px) saturate(1.1);-webkit-backdrop-filter:blur(12px) saturate(1.1);}
  #rn-news::before{content:"";position:absolute;left:0;top:0;bottom:0;width:1.5px;
    background:linear-gradient(180deg,rgba(242,212,145,0),rgba(242,212,145,.66),rgba(242,212,145,0));}
  .rn-nh{display:flex;align-items:center;gap:7px;font-family:var(--f-song);
    font-size:11px;letter-spacing:.19em;color:#f4ddaa;text-indent:.19em;}
  .rn-nh i{display:block;flex:1;height:1px;
    background:linear-gradient(90deg,rgba(242,212,145,.42),transparent);}
  .rn-nb{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;
    margin-top:8px;font-family:var(--f-hei);font-size:11.5px;line-height:1.86;
    letter-spacing:.03em;color:rgba(234,240,248,.92);text-decoration:none;
    max-height:calc(1.86em * 3);transition:color .4s ease;}
  .rn-nb[href]{cursor:pointer;}
  .rn-nb[href]:hover{color:#fff5da;}
  .rn-nf{display:flex;align-items:center;gap:8px;margin-top:9px;
    font-family:var(--f-mono);font-size:9px;letter-spacing:.09em;color:rgba(216,202,178,.5);}
  .rn-nf i{width:11px;height:1px;background:rgba(214,200,176,.3);}
  .rn-ns{margin-top:5px;font-family:var(--f-mono);font-size:8.5px;letter-spacing:.07em;
    color:rgba(200,186,160,.34);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .rn-ns.live{color:rgba(152,218,180,.7);}
  .rn-ns.demo{color:rgba(206,186,146,.4);}

  /* ---------- 左下角地标注解 ---------- */
  #rn-cap{position:absolute;left:28px;bottom:24px;z-index:7;display:flex;align-items:center;gap:11px;
    pointer-events:none;opacity:0;transform:translateY(10px);
    transition:opacity 1.2s var(--ease) .5s, transform 1.2s var(--ease) .5s;}
  #rn-cap b{font-weight:400;font-family:var(--f-song);font-size:clamp(12px,1.15vw,16px);
    letter-spacing:.24em;color:rgba(242,230,200,.86);text-indent:.24em;
    text-shadow:0 2px 14px rgba(0,0,0,.85);}
  #rn-cap i{width:34px;height:1px;background:linear-gradient(90deg,rgba(242,212,145,.66),transparent);}
  #rn-cap span{font-family:var(--f-mono);font-size:9px;letter-spacing:.24em;
    color:rgba(226,214,188,.44);}

  /* ---------- 标语 ---------- */
  #rn-slogan{position:absolute;left:50%;top:73%;z-index:9;pointer-events:none;white-space:nowrap;
    transform:translate(-50%,14px) scale(.95);opacity:0;
    transition:opacity 1.8s var(--ease), transform 2.2s var(--ease);}
  #rn-slogan.on{opacity:1;transform:translate(-50%,0) scale(1);}
  #rn-slogan span{display:inline-block;font-family:var(--f-song);
    font-size:clamp(11px,1.55vw,22px);letter-spacing:.3em;text-indent:.3em;
    background:linear-gradient(100deg,#ab823a 0%,#f2ddaa 18%,#fffdf0 32%,#e9c884 48%,
      #b3803a 64%,#f7e6b8 82%,#c8a05a 100%);
    background-size:300% 100%;-webkit-background-clip:text;background-clip:text;
    -webkit-text-fill-color:transparent;color:transparent;
    animation:rnGoldFlow 7.5s linear infinite;
    filter:drop-shadow(0 0 18px rgba(255,214,130,.6)) drop-shadow(0 2px 10px rgba(0,0,0,.75));}
  @keyframes rnGoldFlow{0%{background-position:0% 50%}100%{background-position:300% 50%}}

  #rn-root.on #rn-top{opacity:1;transform:none;}
  #rn-root.on #rn-topwrap{opacity:1;transform:none;}
  #rn-root.on #rn-watch-col{opacity:1;transform:none;}
  #rn-root.on #rn-cap{opacity:1;transform:none;}

  /* ---------- 移动端 ---------- */
  @media (max-width:780px){
    #rn-top{left:14px;top:15px;}
    #rn-top .tx{font-size:9.5px;letter-spacing:.15em;}
    #rn-topwrap{top:8.5%;}
    #rn-topwrap::before{top:-40%;height:230%;}
    #rn-title-cn{font-size:clamp(40px,13vw,72px);}
    #rn-title-en{font-size:7.5px;letter-spacing:.28em;text-indent:.28em;margin-top:5px;}
    #rn-menu{flex-wrap:wrap;justify-content:center;width:min(94vw,410px);padding:7px 4px;gap:0;}
    .rn-city{flex:0 0 25%;width:25%;min-width:0;padding:5px 0 7px;}
    .rn-city em{font-size:11px;letter-spacing:.06em;text-indent:.06em;}
    .rn-city span{font-size:5.8px;letter-spacing:0;}
    .rn-div{display:none;}
    #rn-watch-col{right:10px;top:31%;width:min(66vw,232px);}
    #rn-wdate{font-size:8px;}
    #rn-news{margin-top:9px;padding:9px 10px;}
    .rn-nh{font-size:9.5px;letter-spacing:.1em;}
    .rn-nb{font-size:10px;line-height:1.72;max-height:calc(1.72em * 3);}
    .rn-ns{font-size:7px;}
    #rn-cap{left:14px;bottom:14px;}
    #rn-cap b{font-size:11px;letter-spacing:.16em;}
    #rn-cap span{display:none;}
    #rn-slogan{top:79%;}
    #rn-slogan span{font-size:11px;letter-spacing:.16em;}
  }
  `);

  /* ================================================================
   * 1. 绘图小工具
   * ================================================================ */
  // 确定性随机（同一城市每次重绘地形一致）
  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return function () {
      s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }
  function hx(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  // 亮度系数 k + 透明度 a
  function adj(hex, k, a) {
    const c = hx(hex);
    const f = v => Math.max(0, Math.min(255, Math.round(v * k)));
    return `rgba(${f(c[0])},${f(c[1])},${f(c[2])},${a == null ? 1 : a})`;
  }
  function vg(ctx, y0, y1, stops) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    for (let i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
    return g;
  }
  // 径向光斑（可椭圆）
  function glowEllipse(ctx, cx, cy, rx, ry, rgb, a) {
    if (rx <= 0 || ry <= 0 || a <= 0) return;
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, `rgba(${rgb},${a})`);
    g.addColorStop(.42, `rgba(${rgb},${a * .42})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill();
    ctx.restore();
  }
  // 贝塞尔叶片轮廓
  function leafPath(ctx, sz) {
    ctx.beginPath();
    ctx.moveTo(0, -sz);
    ctx.bezierCurveTo(sz * .64, -sz * .42, sz * .52, sz * .5, 0, sz);
    ctx.bezierCurveTo(-sz * .52, sz * .5, -sz * .64, -sz * .42, 0, -sz);
    ctx.closePath();
  }
  function stampLeaf(ctx, x, y, sz, rot, col, a) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = a;
    leafPath(ctx, sz); ctx.fillStyle = col; ctx.fill();
    ctx.strokeStyle = "rgba(58,64,26,.3)"; ctx.lineWidth = Math.max(.4, sz * .1);
    ctx.beginPath(); ctx.moveTo(0, -sz * .86); ctx.lineTo(0, sz * .86); ctx.stroke();
    ctx.restore();
  }
  // 树冠贴图：一簇密集小叶片（逐帧只做贴图变换，保证 60fps）
  function mkCanopy(seed, pal, density) {
    const S0 = 128, c = U.mkCanvas(S0, S0), x = c.getContext("2d");
    const R = rng(seed), n = density || 160;
    for (let i = 0; i < n; i++) {
      const a = R() * TAU, r = Math.pow(R(), .58) * S0 * .47;
      const px = S0 / 2 + Math.cos(a) * r, py = S0 / 2 + Math.sin(a) * r * .9;
      const sz = 2 + R() * 6.5;
      x.save(); x.translate(px, py); x.rotate(R() * TAU);
      x.globalAlpha = .5 + R() * .5;
      x.fillStyle = pal[Math.floor(R() * pal.length)];
      x.beginPath(); x.ellipse(0, 0, sz, sz * (.42 + R() * .52), 0, 0, TAU); x.fill();
      x.restore();
    }
    return c;
  }
  // 水面倒影：地标翻转绘制 + 横向波纹打碎
  function reflect(ctx, W, H, hz, fn, alpha, rgb) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, hz, W, H - hz); ctx.clip();
    ctx.globalAlpha = alpha;
    ctx.translate(0, hz * 2); ctx.scale(1, -1);
    fn();
    ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.rect(0, hz, W, H - hz); ctx.clip();
    for (let i = 0; i < 30; i++) {
      const u = i / 30;
      const y = hz + Math.pow(u, 1.4) * (H - hz);
      ctx.fillStyle = `rgba(${rgb},${.03 + .09 * Math.abs(Math.sin(i * 2.7))})`;
      ctx.fillRect(0, y, W, Math.max(1, (H - hz) * .01 * (1 + u * 2)));
    }
    ctx.restore();
  }
  // 底部前景树线（低矮剪影），制造纵深
  function fgTrees(x, W, H, R, rgb, count, topY) {
    const n = count || 16, base = H * (topY || 1.004);
    x.fillStyle = `rgba(${rgb},.9)`;
    for (let i = 0; i < n; i++) {
      const px = -W * .08 + (i / (n - 1)) * W * 1.16;
      const rr = H * (.016 + R() * .026);
      x.beginPath();
      x.ellipse(px, base, rr * 2.1, rr, 0, 0, TAU);
      x.fill();
    }
    x.fillRect(0, base, W, H - base + 2);
    // 贴近地面的薄雾，柔化剪影边缘
    glowEllipse(x, W * .5, base - H * .012, W * .7, H * .05, rgb, .12);
  }
  // 统一后处理：上下压暗 + 暗角 + 颗粒
  function finish(x, W, H, nk, grade) {
    let g = x.createLinearGradient(0, 0, 0, H * .22);
    g.addColorStop(0, "rgba(3,7,15,.46)"); g.addColorStop(1, "rgba(3,7,15,0)");
    x.fillStyle = g; x.fillRect(0, 0, W, H * .22);
    g = x.createLinearGradient(0, H * .82, 0, H);
    g.addColorStop(0, "rgba(2,5,12,0)"); g.addColorStop(1, "rgba(2,5,12,.56)");
    x.fillStyle = g; x.fillRect(0, H * .82, W, H * .18);
    const r = x.createRadialGradient(W * .5, H * .47, Math.min(W, H) * .24,
      W * .5, H * .5, Math.max(W, H) * .82);
    r.addColorStop(0, "rgba(0,0,0,0)"); r.addColorStop(1, "rgba(1,4,10,.5)");
    x.fillStyle = r; x.fillRect(0, 0, W, H);
    if (nk > .04) { x.fillStyle = `rgba(4,9,20,${nk * .3})`; x.fillRect(0, 0, W, H); }
    if (grade) {
      x.save(); x.globalCompositeOperation = "overlay";
      x.fillStyle = grade; x.fillRect(0, 0, W, H); x.restore();
    }
    const R = rng(911);
    x.fillStyle = "rgba(255,255,255,.024)";
    for (let i = 0; i < 2200; i++) x.fillRect(R() * W, R() * H, 1, 1);
  }
  // 天空：渐变 + 云 + 星 + 日/月 + 地平线薄雾
  function paintSky(x, W, H, city, nk, seed) {
    const R = rng(seed), sky = city.sky;
    const dim = nk > .3 ? .66 : 1;
    const g = x.createLinearGradient(0, 0, W * .1, H);
    g.addColorStop(0, adj(sky[0], dim * (nk > .3 ? .8 : 1)));
    g.addColorStop(.46, adj(sky[1], dim));
    g.addColorStop(1, adj(sky[2], nk > .3 ? .8 : 1.04));
    x.fillStyle = g; x.fillRect(0, 0, W, H);

    // 星
    if (nk > .3) {
      const a0 = (nk - .3) / .7;
      for (let i = 0; i < 170; i++) {
        const sx = R() * W, sy = R() * H * .62, sz = .5 + R() * 1.25;
        x.fillStyle = `rgba(238,246,255,${(.14 + R() * .62) * a0})`;
        x.beginPath(); x.arc(sx, sy, sz, 0, TAU); x.fill();
      }
    }
    // 云
    for (let i = 0; i < 34; i++) {
      const cx = (R() * 1.3 - .15) * W, cy = (.03 + R() * .48) * H;
      const rx = (.05 + R() * .16) * W;
      glowEllipse(x, cx, cy, rx, rx * (.1 + R() * .18), "255,248,236",
        (.02 + R() * .06) * (nk > .4 ? .5 : 1));
    }
    // 光源
    const lx = W * (.56 + R() * .24), ly = H * (.15 + R() * .11);
    if (nk > .45) {
      glowEllipse(x, lx, ly, Math.max(W, H) * .26, Math.max(W, H) * .2, "206,224,255", .14);
      glowEllipse(x, lx, ly, W * .05, W * .05, "236,244,255", .5);
      const mg = x.createRadialGradient(lx - W * .006, ly - W * .008, 0, lx, ly, W * .019);
      mg.addColorStop(0, "rgba(255,255,252,.98)");
      mg.addColorStop(.7, "rgba(232,238,244,.92)");
      mg.addColorStop(1, "rgba(198,208,220,.7)");
      x.fillStyle = mg;
      x.beginPath(); x.arc(lx, ly, W * .018, 0, TAU); x.fill();
    } else {
      glowEllipse(x, lx, ly, Math.max(W, H) * .58, Math.max(W, H) * .46, "255,238,200", .2);
      glowEllipse(x, lx, ly, W * .1, W * .1, "255,248,220", .46);
      x.fillStyle = "rgba(255,253,244,.9)";
      x.beginPath(); x.arc(lx, ly, W * .024, 0, TAU); x.fill();
    }
    // 地平线薄雾
    const h3 = hx(sky[2]);
    glowEllipse(x, W * .5, H * .8, W * .8, H * .1, `${h3[0]},${h3[1]},${h3[2]}`, .16);
    return { lx: lx, ly: ly };
  }

  /* ================================================================
   * 2. 地标关键坐标（图层与动效共用，保证对齐）
   * ================================================================ */
  const KP = {
    bjFlag: { x: .148, top: .30 }, bjPoleBot: .888,
    nyTorch: { x: .478, y: .315 },
    sgSplash: { x: .47, y: .70 },
    syArch: { x: .26, y: .43 },
  };

  /* ================================================================
   * 3. 南京 · 梧桐大道
   * ================================================================ */
  const CANOPY = {
    bright: ["#d3c95e", "#e6da72", "#c2c352", "#f0dd80", "#dccb64"],
    mid: ["#94a044", "#84953c", "#a7b055", "#75843a", "#9cab4c"],
    deep: ["#37421f", "#44502a", "#2c3719", "#515e33", "#3d4924"],
    gold: ["#e8c873", "#dab65f", "#cbaa52", "#f2da94", "#dfc26d"],
  };
  let SPR = null;
  function canopySprites() {
    if (SPR) return SPR;
    SPR = {
      bright: mkCanopy(11, CANOPY.bright, 150), mid: mkCanopy(23, CANOPY.mid, 170),
      deep: mkCanopy(37, CANOPY.deep, 170), gold: mkCanopy(53, CANOPY.gold, 140),
    };
    return SPR;
  }

  function paintNJ(x, W, H, nk) {
    const R = rng(1177);
    const vpx = W * .5, vpy = H * .42;      // 消失点
    const hz = H * .50;                     // 地面起始线
    const spr = canopySprites();
    const night = nk > .35;
    const sun = night ? .3 : 1;             // 阳光强度
    const keys = ["deep", "mid", "bright", "mid", "gold", "deep", "mid"];

    /* --- 天光：叶隙尽头是明亮的天 --- */
    x.fillStyle = vg(x, 0, hz + H * .02, [
      [0, night ? "#0a1828" : "#122b44"],
      [.42, night ? "#22405a" : "#48789e"],
      [.78, night ? "#57696f" : "#a6bfb4"],
      [1, night ? "#86866f" : "#fff3d2"]]);
    x.fillRect(0, 0, W, hz + H * .02);
    glowEllipse(x, vpx, vpy + H * .04, W * .32, H * .26, "255,238,190", .42 * sun + .1);
    glowEllipse(x, vpx, vpy + H * .01, W * .1, H * .075, "255,252,238", .5 * sun);

    /* --- 尽头的树线与薄雾 --- */
    const rl = hz + H * .012;
    for (let i = 0; i < 70; i++) {
      const bx = R() * W, rr = H * (.006 + R() * .02);
      x.fillStyle = night ? "rgba(20,30,26,.5)" : "rgba(54,76,56,.36)";
      x.beginPath(); x.ellipse(bx, rl - rr * .5, rr * 1.7, rr, 0, 0, TAU); x.fill();
    }
    for (let i = 0; i < 30; i++) {
      const bx = R() * W, bw = Math.max(1, W * (.0015 + R() * .0035)), bh = H * (.025 + R() * .055);
      x.fillStyle = night ? "rgba(16,24,20,.44)" : "rgba(42,60,46,.32)";
      x.fillRect(bx, rl - bh, bw, bh);
    }
    glowEllipse(x, W * .5, rl - H * .012, W * .62, H * .05,
      night ? "120,140,150" : "255,246,214", night ? .14 : .24);

    /* --- 地面 --- */
    x.fillStyle = vg(x, hz, H, [[0, "#5c5a42"], [.42, "#3a382b"], [1, "#141310"]]);
    x.fillRect(0, hz, W, H - hz);

    /* --- 路面与人行道（透视梯形） --- */
    const portrait = H > W * 1.1;                     // 竖屏时路面更宽
    const rBot = W * (portrait ? .42 : .33);
    // extra=0 路面边缘；extra=1 人行道（一直铺到画面外）
    const edgeAt = (y, extra) => {
      const t = U.clamp((y - hz) / (H * 1.02 - hz), 0, 1);
      return U.lerp(W * .042 + (extra ? W * .008 : 0), rBot + (extra ? W * .8 : 0), t);
    };
    for (let s = -1; s <= 1; s += 2) {
      x.beginPath();
      x.moveTo(vpx + s * edgeAt(hz, 0), hz);
      x.lineTo(vpx + s * edgeAt(hz, 1), hz);
      x.lineTo(vpx + s * edgeAt(H * 1.02, 1), H * 1.02);
      x.lineTo(vpx + s * edgeAt(H * 1.02, 0), H * 1.02);
      x.closePath();
      x.fillStyle = vg(x, hz, H, [[0, "#8b8465"], [.45, "#514d3c"], [1, "#211f18"]]);
      x.fill();
    }
    x.beginPath();
    x.moveTo(vpx - rBot, H * 1.02);
    x.lineTo(vpx - W * .042, hz);
    x.lineTo(vpx + W * .042, hz);
    x.lineTo(vpx + rBot, H * 1.02);
    x.closePath();
    x.fillStyle = vg(x, hz, H, [[0, "#a2977a"], [.14, "#8b8168"], [.55, "#514d3e"], [1, "#2a2820"]]);
    x.fill();
    // 路缘
    x.strokeStyle = "rgba(232,224,192,.26)"; x.lineWidth = Math.max(1, W * .0014);
    for (let s = -1; s <= 1; s += 2) {
      x.beginPath();
      x.moveTo(vpx + s * edgeAt(hz, 0), hz);
      x.lineTo(vpx + s * edgeAt(H * 1.02, 0), H * 1.02);
      x.stroke();
    }
    // 中线虚线
    for (let i = 0; i < 12; i++) {
      const u0 = i / 12, u1 = u0 + .48 / 12;
      const y0 = U.lerp(hz, H * 1.02, Math.pow(u0, 1.65));
      const y1 = U.lerp(hz, H * 1.02, Math.pow(u1, 1.65));
      const wd = U.lerp(W * .0022, W * .014, Math.pow(u0, 1.5));
      x.fillStyle = "rgba(240,232,200,.15)";
      x.fillRect(vpx - wd / 2, y0, wd, y1 - y0);
    }

    /* --- 路面斑驳光斑 --- */
    x.save(); x.globalCompositeOperation = "lighter";
    for (let i = 0; i < 170; i++) {
      const u = Math.pow(R(), .72);
      const yy = U.lerp(hz, H * 1.01, u);
      const xx = vpx + (R() * 2 - 1) * edgeAt(yy, 0) * 1.5;
      const rx = U.lerp(2.5, W * .05, u) * (.5 + R() * 1.15);
      glowEllipse(x, xx, yy, rx, rx * .34, "255,231,166", U.lerp(.3, .07, u) * sun);
    }
    x.restore();

    /* --- 地上的落叶 --- */
    for (let i = 0; i < 160; i++) {
      const yy = hz + Math.pow(R(), .6) * (H * 1.01 - hz);
      const xx = vpx + (R() * 2 - 1) * edgeAt(yy, 1) * 1.02;
      const sz = (1.6 + R() * 3.6) * (W / 1440 + .34);
      const col = R() < .5 ? "#b79a4e" : (R() < .5 ? "#8d7a3a" : "#cbb05c");
      stampLeaf(x, xx, yy, sz, R() * TAU, col, .28 + R() * .38);
    }

    /* --- 梧桐：树干 + 树冠，按透视深度由远及近 --- */
    function trunk(bx, by, tw, th) {
      const inner = bx < vpx ? 1 : -1;
      const lean = inner * tw * .5, topW = tw * .44;
      x.beginPath();
      x.moveTo(bx - tw * .66, by);
      x.quadraticCurveTo(bx - tw * .5, by - th * .14, bx - topW * .5 + lean * .3, by - th * .58);
      x.lineTo(bx - topW * .5 + lean, by - th);
      x.lineTo(bx + topW * .5 + lean, by - th);
      x.quadraticCurveTo(bx + tw * .5 + lean * .3, by - th * .58, bx + tw * .66, by);
      x.closePath();
      x.fillStyle = vg(x, by - th, by, [
        [0, night ? "#221f16" : "#4e4836"], [.32, night ? "#2e2a1c" : "#6f6650"],
        [.8, night ? "#241f15" : "#3b3527"], [1, "#1c1a13"]]);
      x.fill();
      x.save(); x.clip();
      // 斑驳树皮
      const bn = Math.max(6, Math.round(tw * .34));
      for (let i = 0; i < bn; i++) {
        const py = by - R() * th;
        const pw = tw * (.07 + R() * .17);
        const u = (by - py) / th;
        const cx2 = bx + (R() - .5) * tw * .8 + lean * u;
        x.fillStyle = `rgba(${188 + (R() * 42 | 0)},${184 + (R() * 42 | 0)},${146 + (R() * 40 | 0)},${.05 + R() * .12})`;
        x.beginPath(); x.ellipse(cx2, py, pw, pw * (.32 + R() * .7), 0, 0, TAU); x.fill();
      }
      // 背光面 / 迎光边
      x.fillStyle = "rgba(10,10,8,.34)";
      x.fillRect(bx + inner * tw * .08, by - th, tw * .6, th);
      const rim = x.createLinearGradient(bx - inner * tw * .66, 0, bx - inner * tw * .08, 0);
      rim.addColorStop(0, `rgba(255,228,168,${.22 * sun})`);
      rim.addColorStop(1, "rgba(255,228,168,0)");
      x.fillStyle = rim;
      x.fillRect(bx - (inner > 0 ? tw * .66 : 0), by - th, tw * .66, th);
      x.restore();
      // 主枝
      x.strokeStyle = night ? "#1e1c15" : "#3a3527";
      x.lineWidth = Math.max(1, tw * .16);
      for (let s = -1; s <= 1; s += 2) {
        x.beginPath();
        x.moveTo(bx + lean * .9, by - th * .97);
        x.quadraticCurveTo(bx + lean + s * tw * .7, by - th * 1.08,
          bx + lean + s * tw * 1.5, by - th * 1.24);
        x.stroke();
      }
    }
    function crown(ccx, ccy, rx, ry, dens) {
      x.fillStyle = `rgba(${14 + (R() * 16 | 0)},${24 + (R() * 20 | 0)},${11 + (R() * 12 | 0)},.58)`;
      x.beginPath(); x.ellipse(ccx, ccy, rx, ry, 0, 0, TAU); x.fill();
      for (let i = 0; i < dens; i++) {
        const a = R() * TAU, rr = Math.pow(R(), .52);
        const px = ccx + Math.cos(a) * rx * rr;
        const py = ccy + Math.sin(a) * ry * rr;
        const k = (rx / 150) * (.5 + R() * .85);
        const sp = spr[keys[Math.floor(R() * keys.length)]];
        x.save();
        x.translate(px, py); x.rotate(R() * TAU);
        x.globalAlpha = .32 + R() * .5;
        x.drawImage(sp, -64 * k, -64 * k, 128 * k, 128 * k);
        x.restore();
      }
      // 下缘逆光叶
      const nl = Math.max(6, Math.round(dens * .7));
      for (let i = 0; i < nl; i++) {
        const a = Math.PI * (.06 + R() * .88);
        const px = ccx + Math.cos(a) * rx * (.7 + R() * .32);
        const py = ccy + Math.sin(a) * ry * (.7 + R() * .32);
        const sz = (1.8 + R() * 4.6) * (W / 1440 + .36);
        const col = R() < .5 ? "#ded470" : (R() < .55 ? "#bcc55c" : "#f0d67c");
        stampLeaf(x, px, py, sz, R() * TAU, col, (.26 + R() * .42) * sun);
      }
    }
    for (let i = 10; i >= 1; i--) {
      const yBase = hz + (H * 1.06 - hz) / (.5 + i * .75);
      if (yBase > H * 1.03) continue;
      const d = yBase - hz;
      const tw = Math.max(1.6, d * .19), th = d * 1.42;
      const t2 = U.clamp(d / (H * 1.02 - hz), 0, 1);
      // 树干站在路缘外侧的人行道上
      const tx0 = edgeAt(yBase, 0) + U.lerp(W * .008, W * .075, t2);
      for (let s = -1; s <= 1; s += 2) {
        const tx = vpx + s * tx0;
        trunk(tx, yBase, tw, th);
        const topY = yBase - th;
        const cw = th * .52, chh = th * .34;
        crown(tx + (vpx - tx) * .12, topY - chh * .5, cw, chh,
          Math.round(U.clamp(cw / 2.6, 12, 78)));
      }
    }
    // 画面上沿的近景树冠（形成"树洞"取景框）
    for (let i = 0; i < 64; i++) {
      const px = R() * W, py = R() * H * .16;
      const k = (W / 1440) * (.45 + R() * .8);
      x.save();
      x.translate(px, py); x.rotate(R() * TAU); x.globalAlpha = .3 + R() * .45;
      x.drawImage(spr[keys[Math.floor(R() * keys.length)]], -64 * k, -64 * k, 128 * k, 128 * k);
      x.restore();
    }
    const topG = x.createLinearGradient(0, 0, 0, H * .2);
    topG.addColorStop(0, "rgba(9,15,10,.8)");
    topG.addColorStop(.6, "rgba(9,15,10,.32)");
    topG.addColorStop(1, "rgba(9,15,10,0)");
    x.fillStyle = topG; x.fillRect(0, 0, W, H * .2);
    // 叶隙亮斑（天空漏光）
    for (let i = 0; i < 6; i++) {
      const px = vpx + (R() - .5) * W * .6;
      const py = H * (.02 + R() * .16);
      glowEllipse(x, px, py, W * (.015 + R() * .04), H * (.015 + R() * .035),
        "255,246,214", .26 * sun);
    }

    /* --- 阳光透过叶隙的光束 --- */
    x.save(); x.globalCompositeOperation = "lighter";
    for (let i = 0; i < 11; i++) {
      const ang = Math.PI * .5 + U.lerp(-.85, .85, i / 10) + (R() - .5) * .06;
      const len = H * 1.2;
      const w0 = W * .003, w1 = W * (.035 + R() * .055);
      const dx = Math.cos(ang), dy = Math.sin(ang);
      const sx = vpx + (R() - .5) * W * .07, sy = vpy - H * .03;
      x.beginPath();
      x.moveTo(sx - dy * w0, sy + dx * w0);
      x.lineTo(sx + dy * w0, sy - dx * w0);
      x.lineTo(sx + dy * w1 + dx * len, sy - dx * w1 + dy * len);
      x.lineTo(sx - dy * w1 + dx * len, sy + dx * w1 + dy * len);
      x.closePath();
      const g2 = x.createLinearGradient(sx, sy, sx + dx * len, sy + dy * len);
      g2.addColorStop(0, `rgba(255,242,202,${.11 * sun})`);
      g2.addColorStop(.4, `rgba(255,224,156,${.035 * sun})`);
      g2.addColorStop(1, "rgba(255,212,132,0)");
      x.fillStyle = g2; x.fill();
    }
    x.restore();

    /* --- 近景虚焦叶（景深） --- */
    x.save();
    x.filter = "blur(10px)";
    for (let i = 0; i < 14; i++) {
      const px = (R() < .5 ? R() * .26 : .74 + R() * .26) * W;
      const py = R() * H * .3;
      const rr = W * (.04 + R() * .1);
      x.fillStyle = `rgba(${14 + (R() * 22 | 0)},${26 + (R() * 24 | 0)},${12 + (R() * 12 | 0)},${.42 + R() * .38})`;
      x.beginPath(); x.ellipse(px, py, rr, rr * .74, R() * TAU, 0, TAU); x.fill();
    }
    x.filter = "none";
    x.restore();

    finish(x, W, H, nk, night ? "rgba(60,70,110,.12)" : "rgba(150,116,48,.11)");
  }

  /* ================================================================
   * 4. 北京 · 天安门
   * ================================================================ */
  function paintBJ(x, W, H, nk) {
    const R = rng(2077), hz = H * .84, cx = W * .5;
    paintSky(x, W, H, D.CITIES[1], nk, 3311);
    const night = nk > .4;

    /* 远景紫禁城剪影 */
    x.fillStyle = `rgba(${night ? 26 : 54},${night ? 22 : 38},${night ? 26 : 33},.78)`;
    for (let i = 0; i < 10; i++) {
      const bx = W * (-.02 + i * .11), bw = W * (.1 + R() * .04);
      const bh = H * (.03 + R() * .022), by = hz - H * .12;
      x.fillRect(bx, by - bh, bw, bh);
      x.beginPath();
      x.moveTo(bx - bw * .12, by - bh);
      x.lineTo(bx + bw * .5, by - bh - H * .024);
      x.lineTo(bx + bw * 1.12, by - bh);
      x.closePath(); x.fill();
    }
    // 远处树影
    x.fillStyle = `rgba(${night ? 16 : 34},${night ? 24 : 46},${night ? 20 : 36},.7)`;
    for (let i = 0; i < 26; i++) {
      const bx = (i < 13 ? W * (.0 + R() * .22) : W * (.78 + R() * .22));
      x.beginPath();
      x.ellipse(bx, hz - H * .04, W * (.02 + R() * .04), H * (.02 + R() * .03), 0, 0, TAU);
      x.fill();
    }

    /* 广场地面 */
    x.fillStyle = vg(x, hz - H * .02, H, [[0, "#6a6155"], [.35, "#4a453c"], [1, "#1e1c19"]]);
    x.fillRect(0, hz - H * .02, W, H);

    /* 城台 */
    const wallW = W * .44, wallTop = hz - H * .16, wallBot = hz - H * .028;
    x.fillStyle = vg(x, wallBot, hz + H * .01, [[0, "#b3a795"], [1, "#5d554b"]]);
    x.fillRect(cx - wallW * .54, wallBot, wallW * 1.08, H * .036);
    x.fillStyle = vg(x, wallTop, wallBot, [[0, "#9a4a44"], [.4, "#7a332c"], [1, "#4c1e1b"]]);
    x.fillRect(cx - wallW * .5, wallTop, wallW, wallBot - wallTop);
    // 墙面横向砖缝
    x.strokeStyle = "rgba(30,10,8,.16)"; x.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      const yy = U.lerp(wallTop, wallBot, i / 6);
      x.beginPath(); x.moveTo(cx - wallW * .5, yy); x.lineTo(cx + wallW * .5, yy); x.stroke();
    }
    // 三个拱门
    for (let i = -1; i <= 1; i++) {
      const ax = cx + i * wallW * .15, aw = wallW * .085;
      const ah = (wallBot - wallTop) * .76;
      x.beginPath();
      x.moveTo(ax - aw / 2, wallBot);
      x.lineTo(ax - aw / 2, wallTop + ah * .58);
      x.quadraticCurveTo(ax, wallTop + ah * .02, ax + aw / 2, wallTop + ah * .58);
      x.lineTo(ax + aw / 2, wallBot);
      x.closePath();
      x.fillStyle = vg(x, wallTop, wallBot, [[0, "#2b1514"], [1, "#120909"]]);
      x.fill();
      // 门洞里的暗廊
      x.fillStyle = "rgba(0,0,0,.35)";
      x.fillRect(ax - aw * .3, wallTop + ah * .62, aw * .6, wallBot - wallTop - ah * .62);
      if (night) glowEllipse(x, ax, wallTop + ah * .9, aw * 1.7, ah * .55, "255,200,120", .22);
    }
    // 城台栏杆
    x.fillStyle = "rgba(232,222,200,.4)";
    for (let i = 0; i < 28; i++) {
      x.fillRect(cx - wallW * .5 + i * (wallW / 27), wallTop - H * .013, Math.max(1, W * .0022), H * .013);
    }
    x.fillRect(cx - wallW * .5, wallTop - H * .015, wallW, H * .005);

    /* 城楼（柱 + 双檐） */
    const hW = wallW * .86, hB = wallTop - H * .013, hH = H * .085;
    x.fillStyle = vg(x, hB - hH, hB, [[0, "#94463c"], [1, "#5e2822"]]);
    x.fillRect(cx - hW / 2, hB - hH, hW, hH);
    // 窗格
    for (let i = 0; i < 10; i++) {
      const wx = cx - hW / 2 + hW * (.05 + i * .096);
      x.fillStyle = night ? "rgba(255,198,110,.5)" : "rgba(42,20,17,.55)";
      x.fillRect(wx, hB - hH * .76, hW * .052, hH * .58);
    }
    // 柱
    x.fillStyle = "rgba(56,22,18,.42)";
    for (let i = 0; i < 11; i++) {
      const px = cx - hW / 2 + hW * (.04 + i * .092);
      x.fillRect(px, hB - hH, Math.max(1.2, W * .0034), hH);
    }
    const roof = (y, w, hh) => {
      x.beginPath();
      x.moveTo(cx - w * .54, y - hh * .1);
      x.quadraticCurveTo(cx - w * .40, y - hh * .02, cx - w * .30, y - hh * .3);
      x.quadraticCurveTo(cx - w * .16, y - hh * .72, cx - w * .07, y - hh);
      x.lineTo(cx + w * .07, y - hh);
      x.quadraticCurveTo(cx + w * .16, y - hh * .72, cx + w * .30, y - hh * .3);
      x.quadraticCurveTo(cx + w * .40, y - hh * .02, cx + w * .54, y - hh * .1);
      x.quadraticCurveTo(cx + w * .30, y + hh * .1, cx, y + hh * .13);
      x.quadraticCurveTo(cx - w * .30, y + hh * .1, cx - w * .54, y - hh * .1);
      x.closePath();
      x.fillStyle = vg(x, y - hh * 1.4, y + hh * .2, [
        [0, night ? "#2a2024" : "#523930"], [1, night ? "#171014" : "#231917"]]);
      x.fill();
      // 正脊 + 檐口反光
      x.strokeStyle = "rgba(240,208,138,.42)"; x.lineWidth = Math.max(1, W * .0014);
      x.beginPath(); x.moveTo(cx - w * .07, y - hh); x.lineTo(cx + w * .07, y - hh); x.stroke();
      x.strokeStyle = "rgba(255,232,170,.2)";
      x.beginPath();
      x.moveTo(cx - w * .54, y - hh * .1);
      x.quadraticCurveTo(cx - w * .30, y + hh * .1, cx, y + hh * .13);
      x.quadraticCurveTo(cx + w * .30, y + hh * .1, cx + w * .54, y - hh * .1);
      x.stroke();
    };
    roof(hB - hH * .94, hW * 1.16, H * .058);
    roof(hB - hH * 1.58, hW * .86, H * .05);
    if (night) glowEllipse(x, cx, hB - hH * .45, hW * .55, hH * .9, "255,178,88", .18);

    /* 华表 */
    for (let s = -1; s <= 1; s += 2) {
      const px = cx + s * wallW * .82, top = hz - H * .33, bot = hz - H * .004;
      x.fillStyle = vg(x, top, bot, [[0, "#ded5c0"], [.45, "#b3a996"], [1, "#6f6759"]]);
      // 柱身（略收分）
      x.beginPath();
      x.moveTo(px - W * .0058, bot);
      x.lineTo(px - W * .0042, top);
      x.lineTo(px + W * .0042, top);
      x.lineTo(px + W * .0058, bot);
      x.closePath(); x.fill();
      // 底座
      x.beginPath();
      x.moveTo(px - W * .013, bot);
      x.lineTo(px - W * .008, bot - H * .014);
      x.lineTo(px + W * .008, bot - H * .014);
      x.lineTo(px + W * .013, bot);
      x.closePath(); x.fill();
      // 云板（双翼）
      const cy2 = top + H * .06;
      x.beginPath();
      x.moveTo(px - W * .023, cy2 + H * .009);
      x.quadraticCurveTo(px - W * .012, cy2 - H * .005, px, cy2 + H * .002);
      x.quadraticCurveTo(px + W * .012, cy2 - H * .005, px + W * .023, cy2 + H * .009);
      x.quadraticCurveTo(px, cy2 + H * .018, px - W * .023, cy2 + H * .009);
      x.closePath(); x.fill();
      // 承露盘 + 蹲兽
      x.beginPath(); x.ellipse(px, top, W * .013, H * .0055, 0, 0, TAU); x.fill();
      x.beginPath(); x.ellipse(px, top - H * .009, W * .0062, H * .009, 0, 0, TAU); x.fill();
    }

    /* 旗杆（旗面由动效层绘制） */
    const fx = W * KP.bjFlag.x, ftop = H * KP.bjFlag.top, fbot = H * KP.bjPoleBot;
    x.fillStyle = "rgba(232,228,214,.82)";
    x.fillRect(fx - Math.max(1, W * .0014), ftop, Math.max(2, W * .0028), fbot - ftop);
    x.beginPath(); x.arc(fx, ftop - H * .008, Math.max(2, W * .0048), 0, TAU);
    x.fillStyle = "#eadfc4"; x.fill();
    // 旗杆下的花坛
    x.fillStyle = `rgba(${night ? 18 : 40},${night ? 26 : 58},${night ? 18 : 34},.85)`;
    x.beginPath(); x.ellipse(fx, fbot, W * .05, H * .014, 0, 0, TAU); x.fill();

    /* 广场灯火 */
    if (night) {
      for (let i = 0; i < 14; i++) {
        const px = W * (.04 + i * .07), py = hz + H * (.03 + R() * .11);
        glowEllipse(x, px, py, W * .03, H * .022, "255,198,116", .18);
      }
    }
    x.save(); x.globalCompositeOperation = "lighter";
    glowEllipse(x, cx, hz + H * .03, wallW * .72, H * .055, "255,156,96", night ? .12 : .06);
    x.restore();

    finish(x, W, H, nk, "rgba(160,96,44,.12)");
  }

  /* ================================================================
   * 5. 纽约 · 自由女神像
   * ================================================================ */
  function paintNY(x, W, H, nk) {
    const R = rng(3041), hz = H * .82, bx = W * .455;
    paintSky(x, W, H, D.CITIES[2], nk, 771);
    const night = nk > .4;

    /* 远景曼哈顿 */
    for (let i = 0; i < 26; i++) {
      const px = (i < 13 ? W * (.02 + R() * .3) : W * (.68 + R() * .3));
      const bw = W * (.013 + R() * .024), bh = H * (.03 + R() * .13);
      x.fillStyle = `rgba(${night ? 12 : 32},${night ? 20 : 50},${night ? 30 : 66},.82)`;
      x.fillRect(px, hz - bh, bw, bh);
      const rows = Math.floor(bh / (H * .013)), cols = Math.max(1, Math.floor(bw / (W * .0055)));
      for (let a = 0; a < rows; a++) for (let b = 0; b < cols; b++) {
        if (R() < .58) continue;
        x.fillStyle = `rgba(255,214,140,${.1 + R() * .3})`;
        x.fillRect(px + b * W * .0055 + W * .0014, hz - bh + a * H * .013 + H * .002,
          W * .0024, H * .0046);
      }
    }

    /* 水面 */
    x.fillStyle = vg(x, hz, H, [[0, night ? "#122436" : "#3c6478"], [.55, "#152c3c"], [1, "#060e16"]]);
    x.fillRect(0, hz, W, H - hz);
    glowEllipse(x, W * .55, hz + H * .01, W * .5, H * .05, "150,196,224", .14);

    /* 岛 + 基座 + 雕像（倒影用同一段绘制） */
    function statue() {
      // 岛
      x.fillStyle = "rgba(16,22,22,.94)";
      x.beginPath();
      x.moveTo(bx - W * .16, hz + H * .004);
      x.quadraticCurveTo(bx - W * .1, hz - H * .03, bx - W * .04, hz - H * .032);
      x.lineTo(bx + W * .05, hz - H * .032);
      x.quadraticCurveTo(bx + W * .11, hz - H * .028, bx + W * .17, hz + H * .004);
      x.closePath(); x.fill();
      // 星形炮台（11 角）
      x.fillStyle = vg(x, hz - H * .06, hz - H * .02, [[0, "#8f8977"], [1, "#4d4a41"]]);
      x.beginPath();
      for (let i = 0; i <= 22; i++) {
        const a = Math.PI + i / 22 * Math.PI;
        const rr = i % 2 ? W * .045 : W * .062;
        const px = bx + Math.cos(a) * rr, py = hz - H * .026 + Math.sin(a) * rr * .3;
        i ? x.lineTo(px, py) : x.moveTo(px, py);
      }
      x.closePath(); x.fill();
      // 主基座
      const pT = hz - H * .115, pB = hz - H * .055;
      x.fillStyle = vg(x, pT, pB, [[0, "#c0b7a2"], [.5, "#948c78"], [1, "#5d5849"]]);
      x.beginPath();
      x.moveTo(bx - W * .05, pB);
      x.lineTo(bx - W * .036, pT);
      x.lineTo(bx + W * .036, pT);
      x.lineTo(bx + W * .05, pB);
      x.closePath(); x.fill();
      // 檐口 + 壁柱
      x.fillStyle = "rgba(226,218,198,.68)";
      x.fillRect(bx - W * .042, pT - H * .01, W * .084, H * .012);
      x.fillStyle = "rgba(52,48,42,.22)";
      for (let i = 0; i < 5; i++) {
        x.fillRect(bx - W * .03 + i * W * .016, pT + H * .008, W * .007, pB - pT - H * .012);
      }
      x.fillStyle = "rgba(16,18,18,.6)";
      x.fillRect(bx - W * .011, pT + H * .022, W * .022, pB - pT - H * .02);

      /* 雕像 */
      const top = pT - H * .33, sh = pT - H * .285;
      // 袍身（长袍 + 裙摆）
      x.beginPath();
      x.moveTo(bx - W * .048, pT + H * .004);
      x.quadraticCurveTo(bx - W * .036, pT - H * .12, bx - W * .028, sh);
      x.quadraticCurveTo(bx, sh - H * .014, bx + W * .028, sh);
      x.quadraticCurveTo(bx + W * .038, pT - H * .12, bx + W * .05, pT + H * .004);
      x.closePath();
      x.fillStyle = vg(x, sh, pT, [[0, "#a7b6b2"], [.4, "#82958f"], [1, "#3f514c"]]);
      x.fill();
      // 褶皱
      x.strokeStyle = "rgba(28,42,40,.3)"; x.lineWidth = Math.max(1, W * .0015);
      for (let i = 0; i < 8; i++) {
        const t = i / 7;
        x.beginPath();
        x.moveTo(bx - W * .026 + W * .052 * t, sh + H * .008);
        x.quadraticCurveTo(bx - W * .032 + W * .066 * t, pT - H * .11,
          bx - W * .046 + W * .094 * t, pT);
        x.stroke();
      }
      // 头 + 冠
      const hy = top + H * .026;
      x.fillStyle = "#9eadab";
      x.beginPath(); x.ellipse(bx, hy, W * .0165, H * .025, 0, 0, TAU); x.fill();
      x.strokeStyle = "#aab9b5"; x.lineWidth = Math.max(1.3, W * .0023);
      for (let i = -3; i <= 3; i++) {
        const a = -Math.PI / 2 + i * .36;
        x.beginPath();
        x.moveTo(bx + Math.cos(a) * W * .015, hy + Math.sin(a) * H * .021);
        x.lineTo(bx + Math.cos(a) * W * .032, hy + Math.sin(a) * H * .046);
        x.stroke();
      }
      // 举起的右臂 + 火炬
      const tx = W * KP.nyTorch.x, ty = H * KP.nyTorch.y;
      x.strokeStyle = "#93a3a0"; x.lineWidth = Math.max(2.4, W * .0055);
      x.lineCap = "round";
      x.beginPath();
      x.moveTo(bx + W * .019, sh + H * .016);
      x.quadraticCurveTo(bx + W * .034, sh - H * .03, tx, ty + H * .022);
      x.stroke();
      // 火炬柄 + 火盆
      x.fillStyle = "#7f908c";
      x.beginPath();
      x.moveTo(tx - W * .012, ty + H * .024);
      x.lineTo(tx + W * .012, ty + H * .024);
      x.lineTo(tx + W * .015, ty + H * .004);
      x.lineTo(tx - W * .015, ty + H * .004);
      x.closePath(); x.fill();
      // 左臂 + 独立宣言石板
      x.strokeStyle = "#8b9c99"; x.lineWidth = Math.max(2.2, W * .005);
      x.beginPath();
      x.moveTo(bx - W * .021, sh + H * .02);
      x.quadraticCurveTo(bx - W * .045, sh + H * .002, bx - W * .05, sh - H * .016);
      x.stroke();
      x.lineCap = "butt";
      x.save();
      x.translate(bx - W * .055, sh - H * .024); x.rotate(-.26);
      x.fillStyle = vg(x, -H * .03, H * .03, [[0, "#9aa8a2"], [1, "#6b7a75"]]);
      x.fillRect(-W * .0095, -H * .028, W * .019, H * .056);
      x.strokeStyle = "rgba(232,238,232,.3)"; x.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        x.beginPath();
        x.moveTo(-W * .0055, -H * .018 + i * H * .01);
        x.lineTo(W * .0055, -H * .018 + i * H * .01); x.stroke();
      }
      x.restore();
      // 火炬一侧的暖光（右侧受光）
      x.save();
      x.beginPath();
      x.moveTo(bx - W * .048, pT + H * .004);
      x.quadraticCurveTo(bx - W * .036, pT - H * .12, bx - W * .028, sh);
      x.quadraticCurveTo(bx, sh - H * .014, bx + W * .028, sh);
      x.quadraticCurveTo(bx + W * .038, pT - H * .12, bx + W * .05, pT + H * .004);
      x.closePath(); x.clip();
      const rg = x.createLinearGradient(bx + W * .05, sh, bx - W * .04, pT);
      rg.addColorStop(0, "rgba(255,226,176,.26)");
      rg.addColorStop(.5, "rgba(255,214,150,0)");
      x.fillStyle = rg; x.fillRect(bx - W * .06, sh - H * .02, W * .12, pT - sh + H * .04);
      x.restore();
    }
    statue();
    reflect(x, W, H, hz, statue, .3, "58,88,110");

    /* 火炬常亮光晕 */
    glowEllipse(x, W * KP.nyTorch.x, H * KP.nyTorch.y, W * .05, W * .05, "255,208,132", .42);
    finish(x, W, H, nk, "rgba(40,90,140,.11)");
  }

  /* ================================================================
   * 6. 伦敦 · 伊丽莎白塔
   * ================================================================ */
  function paintLD(x, W, H, nk) {
    const R = rng(4093), hz = H * .845, tx = W * .635;
    paintSky(x, W, H, D.CITIES[3], nk, 1187);
    const night = nk > .4;
    const stone = night ? "#464d57" : "#949892";

    /* 议会大厦（连续体量 + 维多利亚塔） */
    const pt = hz - H * .072, pcol = `rgba(${night ? 30 : 56},${night ? 36 : 60},${night ? 44 : 62},.96)`;
    x.fillStyle = pcol;
    x.fillRect(-2, pt, W * .58, H * .082);
    x.fillStyle = `rgba(${night ? 20 : 40},${night ? 24 : 44},${night ? 30 : 46},.96)`;
    x.fillRect(-2, pt, W * .58, H * .007);
    // 雉堞 + 屋脊小尖塔
    for (let i = 0; i < 46; i++) {
      const bx = W * (.002 + i * .0126);
      if (i % 5 === 0) {
        const hh = H * .028;
        x.beginPath();
        x.moveTo(bx - W * .0055, pt);
        x.lineTo(bx - W * .0035, pt - hh * .7);
        x.lineTo(bx, pt - hh);
        x.lineTo(bx + W * .0035, pt - hh * .7);
        x.lineTo(bx + W * .0055, pt);
        x.closePath(); x.fill();
      } else {
        x.fillRect(bx - W * .0035, pt - H * .011, W * .007, H * .011);
      }
    }
    // 维多利亚塔
    const vt = W * .47, vw = W * .052, vh = H * .115;
    x.fillStyle = pcol;
    x.fillRect(vt - vw / 2, pt - vh, vw, vh + H * .022);
    x.fillRect(vt - vw * .62, pt - vh - H * .008, vw * 1.24, H * .012);
    for (let s2 = -1; s2 <= 1; s2 += 2) for (let k = 0; k < 2; k++) {
      const px = vt + s2 * vw * (.42 - k * .5);
      x.beginPath();
      x.moveTo(px - W * .005, pt - vh - H * .008);
      x.lineTo(px, pt - vh - H * .04);
      x.lineTo(px + W * .005, pt - vh - H * .008);
      x.closePath(); x.fill();
    }
    // 中央钟楼
    const cs = W * .21, csh = H * .145, cwk = W * .034;
    x.fillRect(cs - cwk / 2, pt - csh, cwk, csh);
    x.beginPath();
    x.moveTo(cs - cwk * .62, pt - csh);
    x.lineTo(cs, pt - csh - H * .055);
    x.lineTo(cs + cwk * .62, pt - csh);
    x.closePath(); x.fill();
    // 窗光
    for (let i = 0; i < 70; i++) {
      if (R() < .6) continue;
      x.fillStyle = `rgba(255,206,140,${.05 + R() * .18})`;
      x.fillRect(W * (.01 + R() * .54), pt + H * (.014 + R() * .05), W * .0045, H * .011);
    }

    /* 泰晤士河 */
    x.fillStyle = vg(x, hz, H, [[0, night ? "#18222c" : "#47606d"], [.5, night ? "#101a22" : "#2c4049"], [1, "#070d12"]]);
    x.fillRect(0, hz, W, H - hz);
    glowEllipse(x, W * .5, hz, W * .6, H * .04, "170,196,208", .1);

    /* 塔（倒影用） */
    function tower() {
      const bw = W * .088, bodyTop = hz - H * .34;
      // 塔身
      x.fillStyle = vg(x, bodyTop, hz, [[0, adj(stone, .84)], [.45, stone], [1, adj(stone, .58)]]);
      x.fillRect(tx - bw / 2, bodyTop, bw, hz - bodyTop);
      // 扶壁（明暗）
      for (let i = 0; i < 3; i++) {
        const px = tx - bw / 2 + bw * (.06 + i * .32);
        x.fillStyle = "rgba(28,32,36,.22)";
        x.fillRect(px, bodyTop, bw * .1, hz - bodyTop);
        x.fillStyle = "rgba(240,240,236,.08)";
        x.fillRect(px + bw * .1, bodyTop, bw * .05, hz - bodyTop);
      }
      // 哥特窗
      for (let r2 = 0; r2 < 5; r2++) for (let c2 = 0; c2 < 2; c2++) {
        const wx = tx - bw * .28 + c2 * bw * .34, wy = hz - H * .095 - r2 * H * .047;
        x.fillStyle = night ? "rgba(255,208,136,.46)" : "rgba(40,46,52,.66)";
        x.beginPath();
        x.moveTo(wx, wy); x.lineTo(wx, wy - H * .024);
        x.quadraticCurveTo(wx + bw * .055, wy - H * .04, wx + bw * .11, wy - H * .024);
        x.lineTo(wx + bw * .11, wy);
        x.closePath(); x.fill();
        if (night) glowEllipse(x, wx + bw * .055, wy - H * .012, bw * .14, H * .022, "255,196,120", .1);
      }
      // 钟室
      const cT = hz - H * .45, cB = hz - H * .33, cW = bw * 1.26;
      x.fillStyle = vg(x, cT, cB, [[0, adj(stone, .96)], [1, adj(stone, .66)]]);
      x.fillRect(tx - cW / 2, cT, cW, cB - cT);
      // 四角尖塔
      for (let s = -1; s <= 1; s += 2) for (let k = 0; k < 2; k++) {
        const px = tx + s * (cW / 2 - cW * .07) - (k ? s * cW * .16 : 0);
        x.fillStyle = adj(stone, .8);
        x.beginPath();
        x.moveTo(px - cW * .052, cT + H * .006);
        x.lineTo(px, cT - H * .035);
        x.lineTo(px + cW * .052, cT + H * .006);
        x.closePath(); x.fill();
      }
      // 钟面
      const cy2 = (cT + cB) / 2 + H * .004, cr = Math.min(cW * .32, (cB - cT) * .4);
      x.fillStyle = vg(x, cy2 - cr, cy2 + cr, [[0, "#f8f1de"], [.6, "#e8dfc8"], [1, "#c2b79c"]]);
      x.beginPath(); x.arc(tx, cy2, cr, 0, TAU); x.fill();
      x.strokeStyle = "rgba(44,42,38,.78)"; x.lineWidth = Math.max(1.4, cr * .08);
      x.beginPath(); x.arc(tx, cy2, cr * .95, 0, TAU); x.stroke();
      x.strokeStyle = "rgba(40,40,38,.55)"; x.lineWidth = Math.max(1, cr * .032);
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * TAU;
        x.beginPath();
        x.moveTo(tx + Math.cos(a) * cr * .76, cy2 + Math.sin(a) * cr * .76);
        x.lineTo(tx + Math.cos(a) * cr * .87, cy2 + Math.sin(a) * cr * .87);
        x.stroke();
      }
      // 指针：按伦敦真实时间摆放（烘焙时刻）
      const lt = U.nowIn("Europe/London");
      const secs = lt.hour * 3600 + lt.minute * 60 + lt.second;
      const aH = (secs % 43200) / 43200 * TAU, aM = (secs % 3600) / 3600 * TAU;
      x.strokeStyle = "rgba(30,28,26,.9)"; x.lineCap = "round";
      x.lineWidth = Math.max(1.6, cr * .09);
      x.beginPath(); x.moveTo(tx, cy2);
      x.lineTo(tx + Math.sin(aH) * cr * .46, cy2 - Math.cos(aH) * cr * .46); x.stroke();
      x.lineWidth = Math.max(1.3, cr * .062);
      x.beginPath(); x.moveTo(tx, cy2);
      x.lineTo(tx + Math.sin(aM) * cr * .66, cy2 - Math.cos(aM) * cr * .66); x.stroke();
      x.lineCap = "butt";
      if (night) glowEllipse(x, tx, cy2, cr * 3.4, cr * 3.4, "255,214,150", .18);
      // 尖顶
      x.fillStyle = vg(x, hz - H * .60, cT, [[0, adj(stone, .58)], [1, adj(stone, .92)]]);
      x.beginPath();
      x.moveTo(tx - cW * .47, cT);
      x.lineTo(tx, hz - H * .615);
      x.lineTo(tx + cW * .47, cT);
      x.closePath(); x.fill();
      // 尖顶横向线脚
      x.strokeStyle = "rgba(20,24,28,.28)"; x.lineWidth = Math.max(1, W * .0011);
      for (let i = 1; i < 8; i++) {
        const u = i / 8, yy = U.lerp(cT, hz - H * .615, u), ww = cW * .47 * (1 - u);
        x.beginPath(); x.moveTo(tx - ww, yy); x.lineTo(tx + ww, yy); x.stroke();
      }
      // 塔尖 + 旗
      x.strokeStyle = adj(stone, 1.3); x.lineWidth = Math.max(1.2, W * .0018);
      x.beginPath(); x.moveTo(tx, hz - H * .615); x.lineTo(tx, hz - H * .648); x.stroke();
      x.fillStyle = night ? "rgba(150,160,170,.85)" : "rgba(232,232,226,.92)";
      x.beginPath();
      x.moveTo(tx, hz - H * .648);
      x.lineTo(tx + W * .017, hz - H * .639);
      x.lineTo(tx, hz - H * .63);
      x.closePath(); x.fill();
    }
    tower();
    reflect(x, W, H, hz, tower, .34, "56,72,84");

    finish(x, W, H, nk, "rgba(74,94,124,.13)");
  }

  /* ================================================================
   * 7. 巴黎 · 埃菲尔铁塔
   * ================================================================ */
  function paintPA(x, W, H, nk) {
    const R = rng(5209), hz = H * .875, cx = W * .5;
    paintSky(x, W, H, D.CITIES[4], nk, 2203);
    const night = nk > .4, gold = night ? "#c08f4c" : "#8e7550";

    /* 远景：奥斯曼式屋顶带 + 烟囱 + 树冠 */
    const rw = H * .046;
    x.fillStyle = `rgba(${night ? 26 : 54},${night ? 30 : 56},${night ? 44 : 72},.94)`;
    x.beginPath();
    x.moveTo(-2, hz);
    let bx2 = -2;
    while (bx2 < W + 2) {
      const bw = W * (.025 + R() * .05), bh = rw * (.45 + R() * .7);
      x.lineTo(bx2, hz - bh);
      x.lineTo(bx2 + bw, hz - bh);
      bx2 += bw;
    }
    x.lineTo(W + 2, hz);
    x.closePath(); x.fill();
    for (let i = 0; i < 44; i++) {
      x.fillStyle = `rgba(${night ? 22 : 46},${night ? 26 : 50},${night ? 38 : 62},.9)`;
      x.fillRect(R() * W, hz - rw * (.9 + R() * .55), W * .0035, H * .013);
    }
    x.fillStyle = `rgba(${night ? 16 : 28},${night ? 24 : 42},${night ? 20 : 32},.82)`;
    for (let i = 0; i < 26; i++) {
      x.beginPath();
      x.ellipse(R() * W, hz - H * .006, W * (.014 + R() * .026), H * (.01 + R() * .016), 0, 0, TAU);
      x.fill();
    }

    /* 塞纳河 */
    x.fillStyle = vg(x, hz, H, [[0, night ? "#1c2330" : "#5b6b74"], [.5, night ? "#121821" : "#33454d"], [1, "#080d12"]]);
    x.fillRect(0, hz, W, H - hz);
    glowEllipse(x, W * .5, hz, W * .58, H * .04, "196,174,164", .14);

    /* 铁塔（倒影用） */
    const baseW = W * .30, p1y = hz - H * .27, p2y = hz - H * .44, topY = hz - H * .575;
    function tower() {
      // 两条塔腿
      for (let s = -1; s <= 1; s += 2) {
        x.save();
        x.beginPath();
        x.moveTo(cx + s * baseW * .5, hz);
        x.quadraticCurveTo(cx + s * baseW * .3, hz - H * .15, cx + s * baseW * .115, p1y);
        x.lineTo(cx + s * baseW * .072, p1y);
        x.quadraticCurveTo(cx + s * baseW * .2, hz - H * .14, cx + s * baseW * .052, hz);
        x.closePath();
        x.fillStyle = vg(x, p1y, hz, [[0, adj(gold, 1.06)], [1, adj(gold, .42)]]);
        x.fill();
        x.clip();
        x.strokeStyle = night ? "rgba(255,214,150,.34)" : "rgba(32,26,18,.4)";
        x.lineWidth = Math.max(1, W * .0013);
        for (let i = 0; i < 22; i++) {
          const yy = U.lerp(hz, p1y, i / 22);
          x.beginPath(); x.moveTo(cx - baseW * .6, yy); x.lineTo(cx + baseW * .6, yy); x.stroke();
        }
        for (let i = 0; i < 34; i++) {
          const u = i / 34;
          x.beginPath();
          x.moveTo(cx - baseW * .6 + u * baseW * 1.2, hz);
          x.lineTo(cx - baseW * .6 + (u + .28) * baseW * 1.2, p1y); x.stroke();
          x.beginPath();
          x.moveTo(cx + baseW * .6 - u * baseW * 1.2, hz);
          x.lineTo(cx + baseW * .6 - (u + .28) * baseW * 1.2, p1y); x.stroke();
        }
        x.restore();
      }
      // 一层平台拱
      x.strokeStyle = adj(gold, 1.12); x.lineWidth = Math.max(1.8, W * .0032);
      x.beginPath();
      x.moveTo(cx - baseW * .16, p1y - H * .008);
      x.quadraticCurveTo(cx, p1y - H * .072, cx + baseW * .16, p1y - H * .008);
      x.stroke();
      x.fillStyle = adj(gold, 1.08);
      x.fillRect(cx - baseW * .19, p1y - H * .012, baseW * .38, H * .015);
      // 上部塔身（含网格）
      x.save();
      x.beginPath();
      x.moveTo(cx - baseW * .105, p1y);
      x.quadraticCurveTo(cx - baseW * .05, p2y + H * .02, cx - baseW * .035, p2y);
      x.lineTo(cx + baseW * .035, p2y);
      x.quadraticCurveTo(cx + baseW * .05, p2y + H * .02, cx + baseW * .105, p1y);
      x.closePath();
      x.fillStyle = vg(x, p2y, p1y, [[0, adj(gold, 1.08)], [1, adj(gold, .66)]]);
      x.fill(); x.clip();
      x.strokeStyle = night ? "rgba(255,218,158,.3)" : "rgba(34,28,20,.36)";
      x.lineWidth = Math.max(.9, W * .0011);
      for (let i = 0; i < 12; i++) {
        const yy = U.lerp(p1y, p2y, i / 12);
        x.beginPath(); x.moveTo(cx - baseW * .12, yy); x.lineTo(cx + baseW * .12, yy); x.stroke();
      }
      for (let i = 0; i < 16; i++) {
        const u = i / 16;
        x.beginPath();
        x.moveTo(cx - baseW * .11 + u * baseW * .15, p1y);
        x.lineTo(cx - baseW * .11 + (u + .3) * baseW * .15, p2y); x.stroke();
        x.beginPath();
        x.moveTo(cx + baseW * .11 - u * baseW * .15, p1y);
        x.lineTo(cx + baseW * .11 - (u + .3) * baseW * .15, p2y); x.stroke();
      }
      x.restore();
      // 二层平台
      x.fillStyle = adj(gold, 1.14);
      x.fillRect(cx - baseW * .058, p2y - H * .011, baseW * .116, H * .014);
      // 顶部塔身
      x.beginPath();
      x.moveTo(cx - baseW * .035, p2y);
      x.quadraticCurveTo(cx - baseW * .017, topY + H * .04, cx - baseW * .01, topY);
      x.lineTo(cx + baseW * .01, topY);
      x.quadraticCurveTo(cx + baseW * .017, topY + H * .04, cx + baseW * .035, p2y);
      x.closePath();
      x.fillStyle = vg(x, topY, p2y, [[0, adj(gold, 1.18)], [1, adj(gold, .8)]]);
      x.fill();
      // 塔尖
      x.strokeStyle = adj(gold, 1.24); x.lineWidth = Math.max(1.4, W * .0022);
      x.beginPath(); x.moveTo(cx, topY); x.lineTo(cx, topY - H * .042); x.stroke();
      x.beginPath(); x.arc(cx, topY - H * .046, Math.max(1.6, W * .0034), 0, TAU);
      x.fillStyle = adj(gold, 1.32); x.fill();
      if (night) {
        glowEllipse(x, cx, p1y - H * .02, baseW * .55, H * .1, "255,196,110", .18);
        glowEllipse(x, cx, p2y, baseW * .22, H * .06, "255,206,130", .2);
        glowEllipse(x, cx, topY - H * .01, baseW * .12, H * .05, "255,220,160", .24);
      }
    }
    tower();
    reflect(x, W, H, hz, tower, .34, "52,56,66");
    // 河岸树线
    fgTrees(x, W, H, R, night ? "12,14,18" : "26,30,24", 13, 1.0);

    finish(x, W, H, nk, "rgba(150,110,110,.13)");
  }

  /* ================================================================
   * 8. 柏林 · 柏林大教堂
   * ================================================================ */
  function paintBE(x, W, H, nk) {
    const R = rng(6311), hz = H * .875, cx = W * .5;
    paintSky(x, W, H, D.CITIES[5], nk, 5501);
    const night = nk > .4;
    const stone = night ? "#414b54" : "#9ba19f";
    const copper = night ? "#31564d" : "#7ea697";

    /* 远景城市 */
    x.fillStyle = `rgba(${night ? 24 : 50},${night ? 32 : 56},${night ? 42 : 60},.8)`;
    for (let i = 0; i < 18; i++) {
      const bx = W * (-.02 + i * .058), bw = W * .05, bh = H * (.028 + R() * .038);
      x.fillRect(bx, hz - bh - H * .045, bw, bh);
    }
    /* 草坪 + 施普雷河 */
    x.fillStyle = vg(x, hz - H * .045, hz + H * .04, [
      [0, night ? "#1b2620" : "#4f5c3c"], [.6, night ? "#141c18" : "#2f3626"], [1, "#12160f"]]);
    x.fillRect(0, hz - H * .045, W, H);
    x.fillStyle = vg(x, hz + H * .04, H, [[0, night ? "#151d26" : "#4a5d6b"], [1, "#080d12"]]);
    x.fillRect(0, hz + H * .042, W, H);
    glowEllipse(x, W * .8, hz + H * .1, W * .2, H * .05, "180,210,220", .1);

    /* 教堂（倒影用） */
    function dom() {
      const bT = hz - H * .155, bW = W * .35;
      // 主殿
      x.fillStyle = vg(x, bT, hz + H * .045, [[0, adj(stone, 1.08)], [.45, stone], [1, adj(stone, .58)]]);
      x.fillRect(cx - bW / 2, bT, bW, hz + H * .045 - bT);
      // 柱廊
      for (let i = 0; i < 13; i++) {
        const px = cx - bW / 2 + bW * (.03 + i * .078);
        x.fillStyle = adj(stone, 1.16);
        x.fillRect(px, bT + H * .013, bW * .022, H * .1);
        x.fillStyle = "rgba(26,30,32,.22)";
        x.fillRect(px + bW * .022, bT + H * .013, bW * .006, H * .1);
      }
      // 拱门
      for (let i = 0; i < 6; i++) {
        const ax = cx - bW * .40 + i * bW * .16, aw = bW * .088;
        x.fillStyle = night ? "rgba(255,200,124,.34)" : "rgba(26,30,32,.58)";
        x.beginPath();
        x.moveTo(ax, hz + H * .018); x.lineTo(ax, bT + H * .07);
        x.quadraticCurveTo(ax + aw / 2, bT + H * .024, ax + aw, bT + H * .07);
        x.lineTo(ax + aw, hz + H * .018);
        x.closePath(); x.fill();
      }
      // 檐口
      x.fillStyle = adj(stone, 1.2);
      x.fillRect(cx - bW * .53, bT - H * .011, bW * 1.06, H * .015);
      x.fillStyle = "rgba(20,24,26,.2)";
      x.fillRect(cx - bW * .53, bT + H * .003, bW * 1.06, H * .004);
      // 中央鼓座
      const dT = hz - H * .255, dW = W * .17;
      x.fillStyle = vg(x, dT, bT, [[0, adj(stone, 1.04)], [1, adj(stone, .7)]]);
      x.fillRect(cx - dW / 2, dT, dW, bT - dT);
      // 鼓座窗
      for (let i = 0; i < 5; i++) {
        const wx = cx - dW * .38 + i * dW * .19;
        x.fillStyle = night ? "rgba(255,206,138,.42)" : "rgba(30,34,36,.55)";
        x.beginPath();
        x.moveTo(wx, bT - H * .014); x.lineTo(wx, dT + H * .03);
        x.quadraticCurveTo(wx + dW * .062, dT + H * .006, wx + dW * .124, dT + H * .03);
        x.lineTo(wx + dW * .124, bT - H * .014);
        x.closePath(); x.fill();
      }
      // 大穹顶
      const dr = dW * .58, dcy = dT;
      x.beginPath();
      x.ellipse(cx, dcy, dr, dr * .94, 0, Math.PI, TAU);
      x.fillStyle = vg(x, dcy - dr, dcy, [[0, adj(copper, 1.24)], [.5, copper], [1, adj(copper, .56)]]);
      x.fill();
      // 肋 + 高光
      x.save();
      x.beginPath(); x.ellipse(cx, dcy, dr, dr * .94, 0, Math.PI, TAU); x.clip();
      x.strokeStyle = night ? "rgba(186,220,210,.16)" : "rgba(26,48,42,.3)";
      x.lineWidth = Math.max(1, W * .0014);
      for (let i = 0; i <= 9; i++) {
        const a = Math.PI + i / 9 * Math.PI;
        x.beginPath(); x.moveTo(cx, dcy);
        x.lineTo(cx + Math.cos(a) * dr, dcy + Math.sin(a) * dr * .94); x.stroke();
      }
      x.beginPath(); x.ellipse(cx, dcy, dr * .64, dr * .6, 0, Math.PI, TAU); x.stroke();
      x.beginPath(); x.ellipse(cx, dcy, dr * .32, dr * .3, 0, Math.PI, TAU); x.stroke();
      const hl = x.createLinearGradient(cx - dr, dcy - dr, cx + dr * .4, dcy);
      hl.addColorStop(0, "rgba(255,255,255,.16)"); hl.addColorStop(.5, "rgba(255,255,255,0)");
      x.fillStyle = hl; x.fillRect(cx - dr, dcy - dr, dr * 2, dr);
      x.restore();
      // 采光亭 + 十字
      const lY = dcy - dr * .94;
      x.fillStyle = adj(stone, 1.14);
      x.fillRect(cx - dr * .21, lY - H * .032, dr * .42, H * .034);
      x.beginPath(); x.ellipse(cx, lY - H * .032, dr * .21, dr * .17, 0, Math.PI, TAU);
      x.fillStyle = adj(copper, 1.24); x.fill();
      x.strokeStyle = night ? "rgba(255,214,150,.9)" : "rgba(64,58,44,.88)";
      x.lineWidth = Math.max(1.2, W * .0019);
      x.beginPath(); x.moveTo(cx, lY - H * .05); x.lineTo(cx, lY - H * .082); x.stroke();
      x.beginPath(); x.moveTo(cx - dr * .07, lY - H * .072); x.lineTo(cx + dr * .07, lY - H * .072); x.stroke();
      // 双塔
      for (let s = -1; s <= 1; s += 2) {
        const px = cx + s * bW * .41, tW = W * .078, tT = hz - H * .325;
        x.fillStyle = vg(x, tT, hz + H * .02, [[0, adj(stone, 1.08)], [1, adj(stone, .62)]]);
        x.fillRect(px - tW / 2, tT, tW, hz + H * .02 - tT);
        // 窗（带框）
        for (let i = 0; i < 3; i++) {
          const wy = tT + H * .028 + i * H * .042;
          x.fillStyle = "rgba(22,26,28,.22)";
          x.fillRect(px - tW * .21, wy - H * .003, tW * .42, H * .028);
          x.fillStyle = night ? "rgba(255,204,132,.4)" : "rgba(30,34,36,.6)";
          x.fillRect(px - tW * .18, wy, tW * .36, H * .022);
        }
        // 小穹顶
        x.beginPath();
        x.ellipse(px, tT, tW * .63, tW * .52, 0, Math.PI, TAU);
        x.fillStyle = vg(x, tT - tW * .52, tT, [[0, adj(copper, 1.24)], [1, adj(copper, .64)]]);
        x.fill();
        x.fillStyle = adj(stone, 1.16);
        x.fillRect(px - tW * .1, tT - tW * .52 - H * .027, tW * .2, H * .029);
        x.beginPath(); x.ellipse(px, tT - tW * .52 - H * .027, tW * .1, tW * .1, 0, Math.PI, TAU);
        x.fillStyle = adj(copper, 1.26); x.fill();
        x.strokeStyle = night ? "rgba(255,214,150,.85)" : "rgba(64,58,44,.85)";
        x.lineWidth = Math.max(1.1, W * .0017);
        x.beginPath(); x.moveTo(px, tT - tW * .52 - H * .04); x.lineTo(px, tT - tW * .52 - H * .064); x.stroke();
        x.beginPath(); x.moveTo(px - tW * .06, tT - tW * .52 - H * .056);
        x.lineTo(px + tW * .06, tT - tW * .52 - H * .056); x.stroke();
        if (night) glowEllipse(x, px, tT - tW * .3, tW * .9, tW * .7, "255,196,120", .1);
      }
      // 台阶
      x.fillStyle = adj(stone, .84);
      for (let i = 0; i < 5; i++) {
        x.fillRect(cx - bW * (.5 + i * .017), hz + H * .03 + i * H * .006,
          bW * (1 + i * .034), H * .007);
      }
      if (night) glowEllipse(x, cx, hz - H * .1, bW * .6, H * .16, "255,180,100", .1);
    }
    dom();
    reflect(x, W, H, hz + H * .042, dom, .24, "40,54,62");

    /* 前景：公园树线 */
    fgTrees(x, W, H, R, night ? "10,14,12" : "18,24,16", 15, 1.0);
    finish(x, W, H, nk, "rgba(70,110,120,.11)");
  }

  /* ================================================================
   * 9. 悉尼 · 悉尼歌剧院
   * ================================================================ */
  function paintSY(x, W, H, nk) {
    const R = rng(7403), hz = H * .80, cx = W * .60;
    paintSky(x, W, H, D.CITIES[6], nk, 6607);
    const night = nk > .4;

    /* 海港大桥（钢拱 + 吊杆 + 桥塔） */
    const ax = W * KP.syArch.x, span = W * .32, deckY = hz - H * .055, apexY = H * .445;
    const bcol = `rgba(${night ? 24 : 42},${night ? 32 : 50},${night ? 42 : 54},.95)`;
    x.strokeStyle = bcol;
    x.lineWidth = Math.max(2.2, H * .011);
    x.beginPath();
    x.moveTo(ax - span, deckY);
    x.quadraticCurveTo(ax, apexY - H * .05, ax + span, deckY);
    x.stroke();
    x.lineWidth = Math.max(1, H * .0038);
    x.beginPath();
    x.moveTo(ax - span, deckY + H * .02);
    x.quadraticCurveTo(ax, apexY + H * .02, ax + span, deckY + H * .02);
    x.stroke();
    // 桥面
    x.lineWidth = Math.max(3, H * .015);
    x.beginPath();
    x.moveTo(ax - span * 1.06, deckY + H * .006);
    x.lineTo(ax + span * 1.06, deckY + H * .006);
    x.stroke();
    // 吊杆
    x.lineWidth = Math.max(1, H * .0016);
    for (let i = 1; i < 16; i++) {
      const u = i / 16;
      const bx2 = ax - span + u * span * 2;
      const archY = (1 - u) * (1 - u) * deckY + 2 * (1 - u) * u * (apexY - H * .05) + u * u * deckY;
      x.beginPath(); x.moveTo(bx2, archY); x.lineTo(bx2, deckY); x.stroke();
    }
    // 桥塔
    for (let s = -1; s <= 1; s += 2) {
      const px = ax + s * span * .62;
      x.fillStyle = bcol;
      x.beginPath();
      x.moveTo(px - W * .011, hz + H * .012);
      x.lineTo(px - W * .008, deckY - H * .075);
      x.lineTo(px + W * .008, deckY - H * .075);
      x.lineTo(px + W * .011, hz + H * .012);
      x.closePath(); x.fill();
    }
    // 远岸
    x.fillStyle = `rgba(${night ? 20 : 34},${night ? 28 : 44},${night ? 34 : 42},.7)`;
    for (let i = 0; i < 18; i++) {
      const px = W * (.55 + R() * .46), bh = H * (.01 + R() * .035);
      x.fillRect(px, hz - bh, W * (.02 + R() * .03), bh);
    }

    /* 海面 */
    x.fillStyle = vg(x, hz, H, [[0, night ? "#123039" : "#4d8189"], [.45, "#20505a"], [1, "#07161a"]]);
    x.fillRect(0, hz, W, H - hz);
    glowEllipse(x, W * .5, hz, W * .62, H * .045, "176,224,222", .12);

    /* 歌剧院（倒影用） */
    function opera() {
      const pY = hz - H * .012;
      // 基座
      x.fillStyle = vg(x, pY - H * .06, pY, [[0, night ? "#6c6156" : "#cdbda6"], [1, night ? "#37312a" : "#8a7e6b"]]);
      x.fillRect(cx - W * .31, pY - H * .055, W * .62, H * .06);
      x.fillStyle = "rgba(26,22,18,.16)";
      for (let i = 0; i < 24; i++) x.fillRect(cx - W * .31 + i * W * .026, pY - H * .055, W * .0035, H * .055);
      x.fillStyle = adj(night ? "#6c6156" : "#cdbda6", 1.14);
      x.fillRect(cx - W * .31, pY - H * .06, W * .62, H * .007);

      const sail = function (bx, by, sw, shh) {
        x.beginPath();
        x.moveTo(bx, by);
        x.bezierCurveTo(bx + sw * .04, by - shh * .7, bx + sw * .28, by - shh * .97,
          bx + sw * .56, by - shh * 1.0);
        x.bezierCurveTo(bx + sw * .74, by - shh * .84, bx + sw * .88, by - shh * .42,
          bx + sw * 1.0, by);
        x.closePath();
      };
      // 后排小帆
      const back = [[-.26, .10, .22], [-.13, .115, .29], [.02, .105, .25], [.13, .08, .18]];
      for (let i = 0; i < back.length; i++) {
        const b = back[i];
        sail(cx + W * b[0], pY - H * .05, W * b[1], H * b[2]);
        x.fillStyle = night ? "rgba(126,124,116,.62)" : "rgba(216,212,198,.78)";
        x.fill();
      }
      // 前三组帆
      const front = [[-.21, .17, .23], [-.05, .19, .31], [.11, .14, .21]];
      for (let i = 0; i < front.length; i++) {
        const b = front[i];
        sail(cx + W * b[0] + W * .012, pY - H * .05, W * b[1], H * b[2]);
        x.fillStyle = night ? "rgba(56,58,56,.92)" : "rgba(132,132,124,.96)";
        x.fill();
        sail(cx + W * b[0], pY - H * .05, W * b[1], H * b[2]);
        x.fillStyle = vg(x, pY - H * (.05 + b[2]), pY - H * .05,
          [[0, night ? "#c3bcac" : "#fdfaf0"], [.5, night ? "#8f8a7e" : "#e6dfcd"],
            [1, night ? "#5c5a53" : "#b6afa0"]]);
        x.fill();
        // 壳体接缝
        x.strokeStyle = night ? "rgba(28,30,28,.42)" : "rgba(118,114,102,.34)";
        x.lineWidth = Math.max(1, W * .0013);
        x.beginPath();
        x.moveTo(cx + W * b[0], pY - H * .05);
        x.quadraticCurveTo(cx + W * (b[0] + b[1] * .38), pY - H * (.05 + b[2] * .62),
          cx + W * (b[0] + b[1] * .96), pY - H * (.05 + b[2] * .6));
        x.stroke();
        x.beginPath();
        x.moveTo(cx + W * b[0], pY - H * .05);
        x.quadraticCurveTo(cx + W * (b[0] + b[1] * .2), pY - H * (.05 + b[2] * .74),
          cx + W * (b[0] + b[1] * .5), pY - H * (.05 + b[2] * .98));
        x.stroke();
      }
      // 玻璃幕墙
      x.fillStyle = night ? "rgba(255,206,138,.52)" : "rgba(48,54,56,.66)";
      x.fillRect(cx - W * .17, pY - H * .056, W * .34, H * .032);
      if (night) glowEllipse(x, cx, pY - H * .032, W * .22, H * .05, "255,196,120", .2);
    }
    opera();
    reflect(x, W, H, hz, opera, .32, "40,74,82");

    finish(x, W, H, nk, "rgba(50,110,120,.13)");
  }

  /* ================================================================
   * 10. 新加坡 · 鱼尾狮公园
   * ================================================================ */
  function paintSG(x, W, H, nk) {
    const R = rng(8527), hz = H * .795, mx = W * .40;
    paintSky(x, W, H, D.CITIES[7], nk, 8801);
    const night = nk > .4;

    /* 天际线：滨海湾金沙 + CBD */
    for (let i = 0; i < 3; i++) {
      const bx = W * (.62 + i * .105), bw = W * .062;
      const bh = H * (.27 + (i === 1 ? .03 : 0));
      x.fillStyle = `rgba(${night ? 26 : 42},${night ? 34 : 56},${night ? 44 : 64},.94)`;
      x.beginPath();
      x.moveTo(bx, hz);
      x.lineTo(bx + bw * .07, hz - bh);
      x.lineTo(bx + bw * .93, hz - bh);
      x.lineTo(bx + bw, hz);
      x.closePath(); x.fill();
      const rows = 24, cols = 4;
      for (let a = 0; a < rows; a++) for (let b = 0; b < cols; b++) {
        if (R() < .5) continue;
        x.fillStyle = `rgba(255,220,160,${.07 + R() * .24})`;
        x.fillRect(bx + bw * (.15 + b * .2), hz - bh + H * .012 + a * bh / rows, bw * .09, H * .004);
      }
    }
    // 空中花园
    x.fillStyle = `rgba(${night ? 34 : 54},${night ? 42 : 64},${night ? 52 : 72},.96)`;
    x.beginPath();
    x.moveTo(W * .6, H * .505);
    x.quadraticCurveTo(W * .72, H * .462, W * .925, H * .492);
    x.lineTo(W * .925, H * .524);
    x.quadraticCurveTo(W * .72, H * .498, W * .6, H * .532);
    x.closePath(); x.fill();
    // 其他楼
    for (let i = 0; i < 16; i++) {
      const bx = W * (.01 + R() * .38), bw = W * (.018 + R() * .032), bh = H * (.06 + R() * .15);
      x.fillStyle = `rgba(${night ? 16 : 36},${night ? 26 : 54},${night ? 34 : 60},.88)`;
      x.fillRect(bx, hz - bh, bw, bh);
      for (let a = 0; a < 7; a++) {
        if (R() < .55) continue;
        x.fillStyle = `rgba(255,214,150,${.07 + R() * .18})`;
        x.fillRect(bx + bw * .18, hz - bh + H * .008 + a * bh / 8, bw * .62, H * .0034);
      }
    }

    /* 滨海湾 */
    x.fillStyle = vg(x, hz, H, [[0, night ? "#123030" : "#3f7c74"], [.5, night ? "#12393a" : "#1d4c46"], [1, "#061413"]]);
    x.fillRect(0, hz, W, H - hz);
    glowEllipse(x, W * .72, hz, W * .42, H * .035, "180,236,220", .12);

    /* 鱼尾狮（倒影用） */
    function merlion() {
      const bY = hz - H * .012, bW = W * .15;
      // 基座
      x.fillStyle = vg(x, bY - H * .052, bY, [[0, night ? "#6f685d" : "#d2c9b5"], [1, night ? "#39342c" : "#877f6e"]]);
      x.fillRect(mx - bW * .52, bY - H * .052, bW * 1.04, H * .054);
      x.fillStyle = "rgba(28,24,20,.28)";
      for (let i = 0; i < 9; i++) x.fillRect(mx - bW * .52 + i * bW / 9, bY - H * .052, W * .0028, H * .052);
      x.fillStyle = adj(night ? "#6f685d" : "#d2c9b5", 1.14);
      x.fillRect(mx - bW * .52, bY - H * .054, bW * 1.04, H * .006);

      // 上身 + 鱼尾（同一路径：尾部向右上扬起）
      const skin = vg(x, bY - H * .23, bY - H * .05,
        [[0, night ? "#a8aea6" : "#f6f7ee"], [.55, night ? "#7d837b" : "#dcdfd2"],
          [1, night ? "#4a4e46" : "#adb2a4"]]);
      x.beginPath();
      x.moveTo(mx - bW * .12, bY - H * .052);
      x.quadraticCurveTo(mx - bW * .30, bY - H * .07, mx - bW * .26, bY - H * .14);
      x.quadraticCurveTo(mx - bW * .16, bY - H * .11, mx - bW * .06, bY - H * .13);
      x.quadraticCurveTo(mx - bW * .02, bY - H * .19, mx + bW * .06, bY - H * .215);
      x.lineTo(mx + bW * .11, bY - H * .20);
      x.quadraticCurveTo(mx + bW * .17, bY - H * .13, mx + bW * .12, bY - H * .052);
      x.closePath();
      x.fillStyle = skin; x.fill();
      // 鳞片
      x.strokeStyle = night ? "rgba(26,30,28,.32)" : "rgba(112,120,108,.3)";
      x.lineWidth = Math.max(1, W * .0011);
      for (let r2 = 0; r2 < 4; r2++) for (let c2 = 0; c2 < 4; c2++) {
        x.beginPath();
        x.arc(mx - bW * .12 + c2 * bW * .07 + (r2 % 2) * bW * .035,
          bY - H * .075 - r2 * H * .022, bW * .036, Math.PI * .08, Math.PI * .92);
        x.stroke();
      }
      // 尾鳍纹
      x.strokeStyle = night ? "rgba(30,34,32,.36)" : "rgba(120,128,116,.34)";
      for (let i = 0; i < 5; i++) {
        x.beginPath();
        x.moveTo(mx - bW * .24, bY - H * .075);
        x.quadraticCurveTo(mx - bW * .2, bY - H * (.1 + i * .008), mx - bW * .1, bY - H * (.1 + i * .006));
        x.stroke();
      }

      // 狮头（侧脸向右）
      const hx2 = mx + bW * .07, hY = bY - H * .243, hR = bW * .105;
      x.beginPath();
      x.ellipse(hx2, hY, hR * 1.05, hR * 1.04, -.1, 0, TAU);
      x.fillStyle = skin; x.fill();
      // 鬃毛：一圈圆润的绒团
      for (let i = 0; i < 18; i++) {
        const a = -Math.PI * .95 + i * .175;
        const rr = hR * (.22 + (i % 2) * .07);
        x.beginPath();
        x.ellipse(hx2 + Math.cos(a) * hR * .9, hY + Math.sin(a) * hR * .92, rr, rr * .92, a, 0, TAU);
        x.fillStyle = night ? "rgba(120,126,118,.95)" : "rgba(236,238,226,.98)";
        x.fill();
      }
      // 吻部 + 张开的嘴
      x.beginPath();
      x.moveTo(hx2 + hR * .42, hY + hR * .06);
      x.quadraticCurveTo(hx2 + hR * 1.18, hY + hR * .16, hx2 + hR * 1.12, hY + hR * .62);
      x.quadraticCurveTo(hx2 + hR * .7, hY + hR * .56, hx2 + hR * .48, hY + hR * .3);
      x.closePath();
      x.fillStyle = night ? "rgba(154,160,152,.98)" : "rgba(252,252,246,1)";
      x.fill();
      // 开口
      x.beginPath();
      x.moveTo(hx2 + hR * .58, hY + hR * .34);
      x.quadraticCurveTo(hx2 + hR * .98, hY + hR * .32, hx2 + hR * 1.02, hY + hR * .58);
      x.quadraticCurveTo(hx2 + hR * .76, hY + hR * .44, hx2 + hR * .56, hY + hR * .44);
      x.closePath();
      x.fillStyle = night ? "#161b19" : "#3a3d35"; x.fill();
      // 眼 + 耳 + 鼻
      x.fillStyle = night ? "rgba(16,20,18,.95)" : "#2e312a";
      x.beginPath(); x.arc(hx2 + hR * .34, hY - hR * .2, hR * .13, 0, TAU); x.fill();
      x.fillStyle = night ? "rgba(126,132,124,.9)" : "rgba(230,232,220,.95)";
      x.beginPath();
      x.ellipse(hx2 - hR * .46, hY - hR * .58, hR * .18, hR * .14, -.3, 0, TAU);
      x.fill();
      x.fillStyle = night ? "#1d2220" : "#3b3c34";
      x.beginPath(); x.arc(hx2 + hR * .86, hY + hR * .34, hR * .1, 0, TAU); x.fill();

      // 喷水
      const sx0 = hx2 + hR * .95, sy0 = hY + hR * .46;
      x.strokeStyle = night ? "rgba(214,240,242,.55)" : "rgba(248,254,254,.85)";
      x.lineWidth = Math.max(2.2, W * .0042);
      x.lineCap = "round";
      x.beginPath();
      x.moveTo(sx0, sy0);
      x.quadraticCurveTo(sx0 + W * .06, sy0 - H * .11, W * KP.sgSplash.x, H * KP.sgSplash.y);
      x.stroke();
      x.lineWidth = Math.max(1, W * .0018);
      x.strokeStyle = "rgba(255,255,255,.34)";
      x.beginPath();
      x.moveTo(sx0, sy0 - H * .004);
      x.quadraticCurveTo(sx0 + W * .07, sy0 - H * .135, W * KP.sgSplash.x, H * KP.sgSplash.y);
      x.stroke();
      x.lineCap = "butt";
    }
    merlion();
    reflect(x, W, H, hz, merlion, .3, "30,68,66");

    finish(x, W, H, nk, "rgba(40,120,110,.13)");
  }

  /* ================================================================
   * 11. 图层烘焙 + 动效层
   * ================================================================ */
  const PAINT = [paintNJ, paintBJ, paintNY, paintLD, paintPA, paintBE, paintSY, paintSG];
  const WATER = [
    null, null,
    { y: .82, h: .18, rgb: "150,196,224" },
    { y: .845, h: .155, rgb: "168,190,206" },
    { y: .875, h: .125, rgb: "198,174,152" },
    { y: .92, h: .08, rgb: "150,180,190" },
    { y: .80, h: .20, rgb: "160,214,218" },
    { y: .795, h: .205, rgb: "170,222,208" },
  ];

  const PLATES = new Map();
  function nightOf(idx) {
    const t = U.nowIn(D.CITIES[idx].tz);
    return 1 - U.lightLevel(t.hour, t.minute);
  }
  function bakePlate(idx, W, H) {
    const sc = Math.min(window.devicePixelRatio || 1, 1.5);
    const c = U.mkCanvas(W * sc, H * sc);
    const x = c.getContext("2d");
    x.setTransform(sc, 0, 0, sc, 0, 0);
    try { PAINT[idx](x, W, H, nightOf(idx)); }
    catch (e) { console.warn("[realnow] 地标绘制失败", idx, e); }
    return { c: c, w: W, h: H };
  }
  function getPlate(idx, W, H) {
    const key = idx + "|" + Math.round(W) + "|" + Math.round(H);
    if (PLATES.has(key)) { const p = PLATES.get(key); PLATES.delete(key); PLATES.set(key, p); return p; }
    const p = bakePlate(idx, W, H);
    PLATES.set(key, p);
    if (PLATES.size > 3) PLATES.delete(PLATES.keys().next().value);
    return p;
  }

  /* ---- 水面波光 ---- */
  function shimmer(ctx, W, H, cfg, t) {
    const y0 = cfg.y * H, hh = cfg.h * H;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 30; i++) {
      const u = i / 30;
      const y = y0 + u * u * hh;
      const w0 = U.lerp(W * .015, W * .13, u);
      const x = (Math.sin(t * .3 + i * 2.31) * .5 + .5) * (W + w0 * 2) - w0;
      const a = (.012 + .045 * (.5 + .5 * Math.sin(t * 1.5 + i * .9))) * (1 - u * .5);
      ctx.fillStyle = `rgba(${cfg.rgb},${a})`;
      ctx.fillRect(x, y, w0, Math.max(1, (u * 1.7 + .6)));
    }
    ctx.restore();
  }
  /* ---- 南京：叶隙光束呼吸 ---- */
  function fxBeams(ctx, W, H, t, nk) {
    const vpx = W * .5, vpy = H * .42;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 8; i++) {
      const ang = Math.PI * .5 + U.lerp(-.75, .75, i / 7) + Math.sin(t * .1 + i) * .05;
      const len = H * 1.2;
      const dx = Math.cos(ang), dy = Math.sin(ang);
      const w0 = W * .004, w1 = W * (.03 + i * .008);
      const sx = vpx + (i - 3.5) * W * .012, sy = vpy - H * .03;
      const a = (.03 + .04 * Math.sin(t * .6 + i * 1.7)) * (1 - Math.abs(i - 3.5) / 5.5) * (1 - nk * .7);
      if (a <= 0) continue;
      ctx.beginPath();
      ctx.moveTo(sx - dy * w0, sy + dx * w0);
      ctx.lineTo(sx + dy * w0, sy - dx * w0);
      ctx.lineTo(sx + dy * w1 + dx * len, sy - dx * w1 + dy * len);
      ctx.lineTo(sx - dy * w1 + dx * len, sy + dx * w1 + dy * len);
      ctx.closePath();
      const g = ctx.createLinearGradient(sx, sy, sx + dx * len, sy + dy * len);
      g.addColorStop(0, `rgba(255,242,204,${a})`);
      g.addColorStop(.4, `rgba(255,224,156,${a * .4})`);
      g.addColorStop(1, "rgba(255,212,132,0)");
      ctx.fillStyle = g; ctx.fill();
    }
    ctx.restore();
  }
  /* ---- 北京：红旗飘动 ---- */
  function fxFlag(ctx, W, H, t) {
    const px = W * KP.bjFlag.x, py = H * KP.bjFlag.top + H * .008;
    const fw = W * .09, fh = H * .05;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(px, py);
    for (let i = 1; i <= 14; i++) {
      const u = i / 14;
      ctx.lineTo(px + fw * u, py + Math.sin(t * 2.1 + u * 4.2) * fh * .15 * u);
    }
    for (let i = 14; i >= 0; i--) {
      const u = i / 14;
      ctx.lineTo(px + fw * u, py + fh + Math.sin(t * 2.1 + u * 4.2 + .8) * fh * .19 * u);
    }
    ctx.closePath();
    const g = ctx.createLinearGradient(px, py, px + fw, py + fh);
    g.addColorStop(0, "#dc3a2c"); g.addColorStop(.5, "#c3221c"); g.addColorStop(1, "#981414");
    ctx.fillStyle = g; ctx.fill();
    // 五星
    for (let i = 0; i < 5; i++) {
      const r = i === 0 ? fh * .16 : fh * .07;
      const sx = px + fw * (i === 0 ? .17 : .33 + i * .045);
      const sy = py + fh * (i === 0 ? .28 : .13 + i * .075);
      ctx.fillStyle = i === 0 ? "rgba(255,232,132,.95)" : "rgba(255,232,132,.8)";
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, TAU); ctx.fill();
    }
    // 旗面高光
    ctx.strokeStyle = "rgba(255,180,150,.16)"; ctx.lineWidth = Math.max(1, W * .0012);
    ctx.beginPath();
    ctx.moveTo(px, py + fh * .14);
    for (let i = 1; i <= 12; i++) {
      const u = i / 12;
      ctx.lineTo(px + fw * u, py + fh * .14 + Math.sin(t * 2.1 + u * 4.2) * fh * .15 * u);
    }
    ctx.stroke();
    ctx.restore();
  }
  /* ---- 纽约：火炬跳动 ---- */
  function fxTorch(ctx, W, H, t) {
    const x = W * KP.nyTorch.x, y = H * KP.nyTorch.y;
    const f = 1 + Math.sin(t * 7.3) * .12 + Math.sin(t * 3.1) * .07;
    glowEllipse(ctx, x, y - H * .014, W * .042 * f, W * .05 * f, "255,204,120", .5);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    ctx.beginPath();
    ctx.moveTo(x, y - H * .042 * f);
    ctx.quadraticCurveTo(x + W * .011, y - H * .012, x, y - H * .004);
    ctx.quadraticCurveTo(x - W * .011, y - H * .012, x, y - H * .042 * f);
    ctx.fillStyle = "rgba(255,232,168,.9)"; ctx.fill();
    ctx.restore();
  }
  /* ---- 新加坡：水花 ---- */
  function fxSpray(ctx, W, H, t) {
    const x = W * KP.sgSplash.x, y = H * KP.sgSplash.y;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 16; i++) {
      const p = ((t * .55 + i * .13) % 1);
      const a = (1 - p) * .4;
      ctx.fillStyle = `rgba(230,252,250,${a})`;
      ctx.beginPath();
      ctx.arc(x + Math.sin(i * 2.1) * W * .026 * p,
        y - Math.sin(p * Math.PI) * H * .02 - p * H * .006, 1 + p * 2.4, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
  /* ---- 悉尼：海鸥 ---- */
  function fxGulls(ctx, W, H, t) {
    ctx.save();
    ctx.strokeStyle = "rgba(242,248,248,.55)"; ctx.lineWidth = Math.max(1, W * .0016);
    for (let i = 0; i < 4; i++) {
      const p = (t * .04 + i * .27) % 1;
      const x = W * (.04 + p * .92), y = H * (.2 + Math.sin(i * 2.3) * .05 + Math.sin(t * .8 + i) * .012);
      const s = W * (.005 + .0025 * Math.sin(i));
      const flap = Math.sin(t * 3 + i * 2) * .5 + .5;
      ctx.beginPath();
      ctx.moveTo(x - s, y + s * flap * .5);
      ctx.quadraticCurveTo(x - s * .4, y - s * .5 * flap, x, y);
      ctx.quadraticCurveTo(x + s * .4, y - s * .5 * flap, x + s, y + s * flap * .5);
      ctx.stroke();
    }
    ctx.restore();
  }
  /* ---- 巴黎：塔身灯光闪动 ---- */
  function fxTwinkle(ctx, W, H, t) {
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const cx = W * .5, hz = H * .875, baseW = W * .30;
    for (let i = 0; i < 28; i++) {
      const u = (i * .618) % 1;
      const y = U.lerp(hz, hz - H * .58, u);
      const spread = U.lerp(baseW * .5, baseW * .012, u);
      const x = cx + Math.sin(i * 2.7 + t * 1.1) * spread;
      const a = Math.max(0, Math.sin(t * 3.2 + i * 1.9)) * .45;
      if (a < .04) continue;
      ctx.fillStyle = `rgba(255,232,180,${a})`;
      ctx.beginPath(); ctx.arc(x, y, 1.1 + (i % 3) * .5, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  /* ---- 伦敦：雾 ---- */
  function fxMist(ctx, W, H, t) {
    ctx.save();
    for (let i = 0; i < 4; i++) {
      const x = ((t * .011 + i * .27) % 1.3 - .15) * W;
      glowEllipse(ctx, x, H * (.74 + i * .045), W * .3, H * .055, "216,226,232", .05);
    }
    ctx.restore();
  }
  /* ---- 柏林：水岸微光 ---- */
  function fxSparkle(ctx, W, H, t) {
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 14; i++) {
      const p = (t * .32 + i * .16) % 1;
      const a = (1 - p) * .26;
      ctx.fillStyle = `rgba(226,246,246,${a})`;
      ctx.beginPath();
      ctx.arc(W * (.05 + (i / 14) * .9), H * .955 - p * H * .012, 1 + p, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function paintLive(ctx, W, H, idx, t, A, main) {
    if (A <= .004) return;
    const city = D.CITIES[idx];
    ctx.save(); ctx.globalAlpha = A;
    switch (city.id) {
      case "nj": fxBeams(ctx, W, H, t, S.nightK); break;
      case "bj": fxFlag(ctx, W, H, t); break;
      case "ny": fxTorch(ctx, W, H, t); break;
      case "pa": fxTwinkle(ctx, W, H, t); break;
      case "ld": fxMist(ctx, W, H, t); break;
      case "be": fxSparkle(ctx, W, H, t); break;
      case "sy": fxGulls(ctx, W, H, t); break;
      case "sg": fxSpray(ctx, W, H, t); break;
      default: break;
    }
    ctx.restore();
    const wl = WATER[idx];
    if (wl) { ctx.save(); ctx.globalAlpha = A; shimmer(ctx, W, H, wl, t); ctx.restore(); }
    if (main) drawDust(ctx, W, H, t, idx);
  }

  /* ================================================================
   * 12. 落叶粒子（< 180）
   * ================================================================ */
  const LEAF_COL = [
    ["#e4d06e", "#b9a83f"], ["#d1c35a", "#9d9436"], ["#b6bf51", "#7f8a33"],
    ["#eaba64", "#b1842f"], ["#abb44c", "#6f7c2c"], ["#dcac5c", "#96692c"],
  ];
  function mkLeaf(W, H, init) {
    const c = U.pick(LEAF_COL);
    return {
      x: U.rand(-0.04, 1.04) * W,
      y: init ? U.rand(-0.12, 1) * H : U.rand(-0.3, -0.02) * H,
      z: U.rand(.3, 1.7),
      vy: U.rand(.05, .15),
      sw: U.rand(0, U.TAU), swS: U.rand(.5, 1.5), swA: U.rand(.1, .5),
      rot: U.rand(0, U.TAU), rotV: U.rand(-1.3, 1.3),
      flip: U.rand(0, U.TAU), flipV: U.rand(-3.1, 3.1),
      sz: U.rand(3.2, 10),
      col: c[0], col2: c[1],
    };
  }
  function drawLeaves(ctx, W, H, dt, A) {
    const n = S.leaves.length;
    const px = W / 1440 + .55;
    ctx.save();
    for (let i = 0; i < n; i++) {
      const lf = S.leaves[i];
      lf.y += lf.vy * lf.z * H * dt * .42;
      lf.sw += lf.swS * dt;
      lf.x += Math.sin(lf.sw) * lf.swA * dt * 46;
      lf.rot += lf.rotV * dt;
      lf.flip += lf.flipV * dt;
      if (lf.y > H * 1.03 || lf.x < -W * .14 || lf.x > W * 1.14) {
        S.leaves[i] = mkLeaf(W, H, false);
        continue;
      }
      // 顶部淡入 + 底部淡出
      const fadeIn = U.clamp(lf.y / (H * .1), 0, 1);
      const fadeOut = U.clamp((H * 1.0 - lf.y) / (H * .16), 0, 1);
      const a = A * fadeIn * fadeOut * (.4 + .5 / lf.z);
      if (a <= .004) continue;
      const sz = lf.sz * lf.z * px;
      const sq = Math.abs(Math.cos(lf.flip)) * .92 + .08;
      ctx.save();
      ctx.globalAlpha = Math.min(1, a);
      ctx.translate(lf.x, lf.y);
      ctx.rotate(lf.rot);
      ctx.scale(sq, 1);
      leafPath(ctx, sz);
      ctx.fillStyle = Math.cos(lf.flip) > 0 ? lf.col : lf.col2;
      ctx.fill();
      ctx.strokeStyle = "rgba(64,58,26,.42)";
      ctx.lineWidth = Math.max(.4, sz * .09);
      ctx.beginPath(); ctx.moveTo(0, -sz * .84); ctx.lineTo(0, sz * .84); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
  function drawDust(ctx, W, H, t, idx) {
    const warm = idx === 0 || idx === 1 || idx === 4;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < S.dust.length; i++) {
      const d = S.dust[i];
      const x = ((d.x + t * d.vx) % 1.15 + 1.15) % 1.15;
      const y = ((d.y + t * d.vy) % 1.15 + 1.15) % 1.15;
      const a = (.07 + .22 * Math.max(0, Math.sin(t * d.tw + d.ph))) * d.a;
      ctx.fillStyle = warm ? `rgba(255,228,172,${a})` : `rgba(226,242,255,${a})`;
      ctx.fillRect(x * W, y * H, d.s, d.s);
    }
    ctx.restore();
  }

  /* ================================================================
   * 13. 怀表
   * ================================================================ */
  const ROMAN = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
  const WD_CN = { Mon: "周一", Tue: "周二", Wed: "周三", Thu: "周四", Fri: "周五", Sat: "周六", Sun: "周日" };
  let face = null, faceSize = 0;
  const WT = { base: 0, t0: 0, aH: 0, aM: 0, aS: 0, kick: -9e5, pulse: 0 };

  function bakeWatchFace(size) {
    const sc = 2;
    const w = size, h = size * 1.1;
    const R = size * .428, cx = w / 2, cy = R * 1.46;
    const c = U.mkCanvas(w * sc, h * sc);
    const x = c.getContext("2d");
    x.setTransform(sc, 0, 0, sc, 0, 0);

    /* 表耳 + 表冠（在表壳上方，故 cy 下移留出空间） */
    x.strokeStyle = "#b6bfc9"; x.lineWidth = Math.max(2.6, size * .026);
    x.beginPath(); x.arc(cx, cy - R - size * .048, size * .043, 0, TAU); x.stroke();
    x.strokeStyle = "rgba(255,255,255,.6)"; x.lineWidth = Math.max(1, size * .009);
    x.beginPath(); x.arc(cx, cy - R - size * .048, size * .043, Math.PI * 1.1, Math.PI * 1.7); x.stroke();
    const cw = size * .058, chh = size * .068;
    const cg = x.createLinearGradient(cx - cw, 0, cx + cw, 0);
    cg.addColorStop(0, "#79848f"); cg.addColorStop(.3, "#eef3f8");
    cg.addColorStop(.55, "#a9b3bd"); cg.addColorStop(1, "#68727d");
    x.fillStyle = cg;
    U.roundRect(x, cx - cw / 2, cy - R - size * .048, cw, chh, size * .01);
    x.fill();
    x.strokeStyle = "rgba(48,56,64,.45)"; x.lineWidth = 1;
    for (let i = 1; i < 7; i++) {
      const yy = cy - R - size * .048 + (chh * i / 7);
      x.beginPath(); x.moveTo(cx - cw / 2, yy); x.lineTo(cx + cw / 2, yy); x.stroke();
    }

    /* 表壳（银） */
    const shell = x.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    shell.addColorStop(0, "#f8fbfe"); shell.addColorStop(.2, "#c8d1db");
    shell.addColorStop(.42, "#7f8b99"); shell.addColorStop(.58, "#eaf0f6");
    shell.addColorStop(.78, "#96a1ae"); shell.addColorStop(1, "#e6ecf2");
    x.beginPath(); x.arc(cx, cy, R, 0, TAU); x.fillStyle = shell; x.fill();
    // 壳面拉丝
    for (let i = 0; i < 44; i++) {
      const a = i / 44 * TAU;
      x.strokeStyle = i % 2 ? "rgba(255,255,255,.16)" : "rgba(40,48,58,.1)";
      x.lineWidth = Math.max(1, R * .026);
      x.beginPath();
      x.moveTo(cx + Math.cos(a) * R * .9, cy + Math.sin(a) * R * .9);
      x.lineTo(cx + Math.cos(a) * R * .99, cy + Math.sin(a) * R * .99);
      x.stroke();
    }
    // 内圈斜面
    x.beginPath(); x.arc(cx, cy, R * .90, 0, TAU);
    const bg2 = x.createRadialGradient(cx - R * .2, cy - R * .3, R * .1, cx, cy, R * .9);
    bg2.addColorStop(0, "rgba(255,255,255,.5)");
    bg2.addColorStop(.55, "rgba(120,132,146,.5)");
    bg2.addColorStop(1, "rgba(38,46,56,.62)");
    x.fillStyle = bg2; x.fill();
    // 表盘
    x.beginPath(); x.arc(cx, cy, R * .865, 0, TAU);
    const dial = x.createRadialGradient(cx - R * .3, cy - R * .36, R * .08, cx, cy, R * .9);
    dial.addColorStop(0, "#fdfaf1"); dial.addColorStop(.5, "#f3ecdb");
    dial.addColorStop(.85, "#e2d4b4"); dial.addColorStop(1, "#c9b995");
    x.fillStyle = dial; x.fill();

    /* 分钟刻度 */
    x.strokeStyle = "rgba(42,40,36,.76)";
    for (let i = 0; i < 60; i++) {
      const a = i / 60 * TAU - Math.PI / 2;
      const big = i % 5 === 0;
      const r0 = R * (big ? .775 : .805), r1 = R * .85;
      x.lineWidth = big ? Math.max(1.4, R * .024) : Math.max(.7, R * .009);
      x.beginPath();
      x.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      x.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      x.stroke();
    }
    x.strokeStyle = "rgba(72,66,54,.3)"; x.lineWidth = 1;
    x.beginPath(); x.arc(cx, cy, R * .615, 0, TAU); x.stroke();

    /* 罗马数字 */
    x.textAlign = "center"; x.textBaseline = "middle";
    x.font = `500 ${Math.max(7, R * .15)}px "Songti SC","Times New Roman",Georgia,serif`;
    x.fillStyle = "rgba(36,34,30,.92)";
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU - Math.PI / 2;
      x.fillText(ROMAN[i], cx + Math.cos(a) * R * .69, cy + Math.sin(a) * R * .69);
    }
    /* 铭文 */
    x.fillStyle = "rgba(88,78,58,.6)";
    x.font = `400 ${Math.max(5, R * .068)}px "Cascadia Mono",Consolas,monospace`;
    x.fillText("H E H A I", cx, cy - R * .35);
    x.fillStyle = "rgba(124,104,66,.5)";
    x.font = `400 ${Math.max(4.4, R * .052)}px "Cascadia Mono",Consolas,monospace`;
    x.fillText("111 · ANNIVERSARY", cx, cy + R * .38);

    /* 玻璃 */
    x.save();
    x.beginPath(); x.arc(cx, cy, R * .865, 0, TAU); x.clip();
    let gl = x.createLinearGradient(cx - R, cy - R, cx + R * .1, cy + R * .55);
    gl.addColorStop(0, "rgba(255,255,255,.42)");
    gl.addColorStop(.3, "rgba(255,255,255,.05)");
    gl.addColorStop(.6, "rgba(255,255,255,0)");
    x.fillStyle = gl; x.fillRect(cx - R, cy - R, R * 2, R * 2);
    gl = x.createRadialGradient(cx + R * .42, cy + R * .48, 0, cx + R * .42, cy + R * .48, R * .66);
    gl.addColorStop(0, "rgba(255,255,255,.13)"); gl.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = gl; x.fillRect(cx - R, cy - R, R * 2, R * 2);
    x.strokeStyle = "rgba(255,255,255,.28)"; x.lineWidth = Math.max(1, R * .013);
    x.beginPath(); x.arc(cx, cy, R * .845, Math.PI * 1.02, Math.PI * 1.56); x.stroke();
    x.restore();
    // 表圈内沿描边
    x.strokeStyle = "rgba(246,250,255,.5)"; x.lineWidth = Math.max(1, R * .016);
    x.beginPath(); x.arc(cx, cy, R * .878, Math.PI * .1, Math.PI * .9); x.stroke();
    x.strokeStyle = "rgba(30,38,46,.3)";
    x.beginPath(); x.arc(cx, cy, R * .878, Math.PI * 1.1, Math.PI * 1.9); x.stroke();

    return { c: c, w: w, h: h, cx: cx, cy: cy, R: R, size: size };
  }

  function syncWatch(idx) {
    const city = D.CITIES[idx];
    const t = U.nowIn(city.tz);
    WT.base = t.hour * 3600 + t.minute * 60 + t.second;
    WT.t0 = performance.now();
    if (EL.wdate) {
      const wd = WD_CN[t.weekday] || "";
      EL.wdate.innerHTML = U.esc(t.dateText) + " · " + U.esc(wd) +
        " <b>" + U.esc(city.cn) + "时间</b>";
    }
  }
  function kickWatch() { WT.kick = performance.now(); WT.pulse = 1; }
  // 角度按最短路径缓动
  function easeAng(cur, target, k) {
    let d = ((target - cur) % TAU + TAU) % TAU;
    if (d > Math.PI) d -= TAU;
    return cur + d * k;
  }
  function drawHand(x, len, wid, tail, c1, c2) {
    x.beginPath();
    x.moveTo(-wid * .5, 0);
    x.lineTo(-wid * .34, -len * .88);
    x.lineTo(0, -len);
    x.lineTo(wid * .34, -len * .88);
    x.lineTo(wid * .5, 0);
    x.lineTo(wid * .3, tail);
    x.lineTo(-wid * .3, tail);
    x.closePath();
    const g = x.createLinearGradient(-wid, 0, wid, 0);
    g.addColorStop(0, c1); g.addColorStop(.42, c2); g.addColorStop(1, c1);
    x.fillStyle = g; x.fill();
  }

  function drawWatch(now, dt) {
    if (!EL.watch || !face) return;
    const f = U.fitCanvas(EL.watch);
    const x = f.ctx;
    x.clearRect(0, 0, f.w, f.h);
    // 投影
    x.save(); x.globalAlpha = .45; x.filter = "blur(9px)"; x.fillStyle = "#000";
    x.beginPath();
    x.ellipse(face.cx, face.cy + face.R * .98, face.R * .88, face.R * .12, 0, 0, TAU);
    x.fill(); x.restore();
    x.drawImage(face.c, 0, 0, f.w, f.h);

    const sx = f.w / face.w, sy = f.h / face.h;
    const cx = face.cx, cy = face.cy, R = face.R;
    x.save(); x.scale(sx, sy);

    /* 时间（每秒由 syncWatch 校准，帧间插值使秒针平滑） */
    const el = U.clamp((now - WT.t0) / 1000, 0, 1.6);
    const secs = WT.base + el;
    const tH = (secs % 43200) / 43200 * TAU;
    const tM = (secs % 3600) / 3600 * TAU;
    const tS = (secs % 60) / 60 * TAU;
    const boost = 1 + 1.6 * Math.exp(-(now - WT.kick) / 240);
    const fr = U.clamp(dt * 60, .2, 3);
    const kk = k => U.clamp(1 - Math.pow(1 - k, fr), 0, .92);
    WT.aH = easeAng(WT.aH, tH, kk(U.clamp(.15 * boost, 0, .92)));
    WT.aM = easeAng(WT.aM, tM, kk(U.clamp(.2 * boost, 0, .92)));
    WT.aS = easeAng(WT.aS, tS, kk(U.clamp(.28 * boost, 0, .92)));

    // 玻璃反光缓慢游走
    x.save();
    x.beginPath(); x.arc(cx, cy, R * .86, 0, TAU); x.clip();
    const gp = (now / 5600) % 1;
    const gx = cx - R + gp * R * 2.6;
    const gl = x.createLinearGradient(gx - R * .45, cy - R, gx + R * .45, cy + R);
    gl.addColorStop(0, "rgba(255,255,255,0)");
    gl.addColorStop(.5, "rgba(255,255,255,.09)");
    gl.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = gl; x.fillRect(cx - R, cy - R, R * 2, R * 2);
    x.restore();

    // 指针
    x.save(); x.translate(cx, cy); x.rotate(WT.aH);
    drawHand(x, R * .45, R * .07, R * .1, "#1a222b", "#5b6e83");
    x.restore();
    x.save(); x.translate(cx, cy); x.rotate(WT.aM);
    drawHand(x, R * .655, R * .052, R * .12, "#1a222b", "#647789");
    x.restore();
    x.save(); x.translate(cx, cy); x.rotate(WT.aS);
    x.strokeStyle = "#ae3a30"; x.lineWidth = Math.max(1, R * .016); x.lineCap = "round";
    x.beginPath(); x.moveTo(0, R * .17); x.lineTo(0, -R * .79); x.stroke();
    x.beginPath(); x.arc(0, R * .135, R * .036, 0, TAU);
    x.fillStyle = "#ae3a30"; x.fill();
    x.lineCap = "butt";
    x.restore();
    // 轴帽
    const cap = x.createRadialGradient(cx - R * .02, cy - R * .03, 0, cx, cy, R * .072);
    cap.addColorStop(0, "#fff8e2"); cap.addColorStop(.5, "#dcb56f"); cap.addColorStop(1, "#8d6c30");
    x.beginPath(); x.arc(cx, cy, R * .06, 0, TAU); x.fillStyle = cap; x.fill();
    x.beginPath(); x.arc(cx, cy, R * .021, 0, TAU); x.fillStyle = "#493b21"; x.fill();

    // 切换城市的金色脉冲
    if (WT.pulse > .005) {
      WT.pulse -= dt * 1.1;
      if (WT.pulse < 0) WT.pulse = 0;
      const p = 1 - WT.pulse;
      x.beginPath();
      x.arc(cx, cy, R * (1.04 + p * .5), 0, TAU);
      x.strokeStyle = `rgba(255,214,138,${WT.pulse * .5})`;
      x.lineWidth = Math.max(.8, R * .02 * WT.pulse + .5);
      x.stroke();
    }
    x.restore();
  }

  /* ================================================================
   * 14. 实时新闻（人民日报 / 纽约时报 · 抓取 + 缓存 + 优雅降级）
   * ================================================================ */
  const NEWS = {
    cache: U.store.get("rn_news", null) || {},
    try: U.store.get("rn_news_try", null) || {},
    busy: {},
  };
  const TTL = 6 * 60 * 60 * 1000;    // 检索：6 小时
  const COOL = 3 * 60 * 1000;        // 抓取冷却：3 分钟（每城独立）
  const FEEDS = {
    cn: [
      "https://www.people.com.cn/rss/politics.xml",
      "http://www.people.com.cn/rss/politics.xml",
      "https://www.people.com.cn/rss/world.xml",
    ],
    intl: [
      "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
      "http://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    ],
  };
  const CTRLS = new Set();

  function stripTags(s) {
    if (!s) return "";
    let t = String(s).replace(/<!\[CDATA\[|\]\]>/g, "");
    // 用 DOMParser 解析成"惰性文档"取纯文本：
    // 这样既不会执行脚本，也不会像 innerHTML 那样在分离节点里触发 <img> 的资源请求。
    try {
      const doc = new DOMParser().parseFromString("<div>" + t + "</div>", "text/html");
      t = (doc.body && doc.body.textContent) || "";
    } catch (e) {
      t = t.replace(/<[^>]*>/g, " ");
    }
    return t.replace(/\s+/g, " ").trim();
  }
  function tagText(node, tag) {
    const e = node.getElementsByTagName(tag)[0];
    return e ? (e.textContent || "") : "";
  }
  function parseFeed(txt) {
    let doc;
    try { doc = new DOMParser().parseFromString(txt, "text/xml"); } catch (e) { return null; }
    if (!doc || doc.getElementsByTagName("parsererror").length) return null;
    const list = doc.getElementsByTagName("item");
    if (!list.length) return null;
    const out = [];
    for (let i = 0; i < Math.min(list.length, 40); i++) {
      const it = list[i];
      const title = stripTags(tagText(it, "title"));
      const body = stripTags(tagText(it, "description") || tagText(it, "content:encoded"));
      if (!title && !body) continue;
      out.push({ title: title, body: body, link: stripTags(tagText(it, "link")) });
    }
    return out.length ? out : null;
  }
  function pickFeed(list, kws, offset) {
    if (!list || !list.length) return null;
    for (let k = 0; k < kws.length; k++) {
      const kw = kws[k];
      if (!kw) continue;
      for (let i = 0; i < list.length; i++) {
        if ((list[i].title + list[i].body).toLowerCase().indexOf(kw.toLowerCase()) >= 0) return list[i];
      }
    }
    return list[(offset || 0) % list.length];
  }
  function fallbackOf(idx) {
    const city = D.CITIES[idx];
    return { body: city.news, link: "", ts: 0, ok: false, title: "" };
  }
  function saveNews() {
    try { U.store.set("rn_news", NEWS.cache); U.store.set("rn_news_try", NEWS.try); } catch (e) {}
  }
  function hmIn(tz, ts) {
    try {
      return new Intl.DateTimeFormat("en-GB", {
        timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false,
      }).format(new Date(ts));
    } catch (e) {
      const d = new Date(ts);
      return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
    }
  }
  function agoText(ts) {
    if (!ts) return "";
    const d = Math.max(0, Date.now() - ts);
    if (d < 60000) return "刚刚";
    if (d < 3600000) return Math.floor(d / 60000) + " 分钟前";
    return Math.floor(d / 3600000) + " 小时前";
  }
  function renderNews(idx, item, st) {
    const city = D.CITIES[idx];
    const ts = item.ts || Date.now();
    if (EL.newsH) EL.newsH.textContent = "今日 · " + (idx === 0 ? "金陵" : city.cn);
    if (EL.newsB) {
      EL.newsB.textContent = item.body || city.news;
      EL.newsB.title = item.title || item.body || city.news;
      if (item.link) EL.newsB.setAttribute("href", item.link);
      else EL.newsB.removeAttribute("href");
    }
    if (EL.newsT) EL.newsT.textContent = hmIn(city.tz, ts) + " · " + agoText(ts);
    if (EL.newsSrc) EL.newsSrc.textContent = "来源 · " + city.src;
    if (EL.newsS) {
      EL.newsS.className = "rn-ns " + (st === "live" ? "live" : "demo");
      EL.newsS.textContent = st === "live" ? "实时抓取 · 6 小时内沿用缓存"
        : st === "cache" ? "缓存内容 · 实时抓取受限"
        : st === "loading" ? "检索中… 跨域失败将降级为演示数据"
        : "演示数据 · 浏览器跨域限制，实时抓取已降级";
    }
  }
  function ensureNews(idx) {
    if (NEWS.busy[idx] || !L) return;
    const city = D.CITIES[idx];
    const cached = NEWS.cache[city.id];
    if (cached && cached.ts && (Date.now() - cached.ts < TTL)) {
      renderNews(idx, cached, cached.ok ? "cache" : "demo");
      return;
    }
    // 3 分钟冷却（每城独立）
    if (Date.now() - (NEWS.try[city.id] || 0) < COOL) {
      renderNews(idx, cached || fallbackOf(idx), "demo");
      return;
    }
    NEWS.try[city.id] = Date.now();
    saveNews();
    NEWS.busy[idx] = true;
    renderNews(idx, cached || fallbackOf(idx), "loading");

    const relayBase = (location.protocol === "file:" ? "" : ((window.CONFIG && window.CONFIG.relayUrl) || ""));
    // 每个源准备两个候选：先直连（快），失败后走本地中继（绕 CORS）；
    // 人民日报没有跨域头，直连必失败 → 中继成为它的唯一可行路径。
    const rawUrls = (city.id === "nj" || city.id === "bj") ? FEEDS.cn : FEEDS.intl;
    const urls = [];
    rawUrls.forEach(function (u2) {
      const isCN = /people\.com\.cn/.test(u2);
      // 人民系没有跨域头：有中继就直接用中继（不浪费一次 5 秒超时）
      if (!isCN) urls.push(u2);
      if (relayBase) urls.push(relayBase + "?url=" + encodeURIComponent(u2));
      else if (isCN) urls.push(u2);
    });
    const kws = city.id === "nj" ? ["南京", "金陵"]
      : city.id === "bj" ? ["北京"] : [city.en.split(" ")[0]];
    const offset = idx * 2;
    let i = 0;
    const done = (ok, item) => {
      NEWS.busy[idx] = false;
      if (!L || L.dead) return;
      if (ok && item) {
        const rec = {
          body: (item.body && item.body.length > 24)
            ? (item.title ? item.title + "｜" + item.body : item.body)
            : (item.title || item.body),
          link: item.link || "", ts: Date.now(), ok: true, title: item.title || "",
        };
        NEWS.cache[city.id] = rec;
        saveNews();
        if (S.city === idx) renderNews(idx, rec, "live");
      } else {
        const fb = fallbackOf(idx);
        NEWS.cache[city.id] = fb;
        saveNews();
        if (S.city === idx) renderNews(idx, fb, "demo");
      }
    };
    const next = () => {
      if (!L || L.dead) { NEWS.busy[idx] = false; return; }
      if (i >= urls.length) { done(false); return; }
      const url = urls[i++];
      const pendingTargets = [url];   // fetch 目标队列（直连 → 中继 由 urls 序列保证）
      let ctrl = null;
      try { ctrl = new AbortController(); } catch (e) { ctrl = null; }
      if (ctrl) {
        CTRLS.add(ctrl);
        L.off(() => { try { ctrl.abort(); } catch (e) {} CTRLS.delete(ctrl); });
        L.timeout(() => { try { ctrl.abort(); } catch (e) {} }, 5000);   // 5 秒超时
      }
      const opt = { cache: "no-store", credentials: "omit" };
      if (ctrl) opt.signal = ctrl.signal;
      // 有本地演示服务器时走 /api/relay 中继（绕开 CORS）：
      // 人民日报没有开放跨域，直连必失败；中继后可以真正抓到头条。
      const target = pendingTargets.shift() || url;
      fetch(target, opt)
        .then(r => { if (!r.ok) throw new Error("http " + r.status); return r.text(); })
        .then(txt => {
          if (ctrl) CTRLS.delete(ctrl);
          const item = pickFeed(parseFeed(txt), kws, offset);
          if (!item) throw new Error("empty");
          done(true, item);
        })
        .catch(() => { if (ctrl) CTRLS.delete(ctrl); next(); });
    };
    next();
  }

  /* ================================================================
   * 15. 状态 & DOM
   * ================================================================ */
  let built = false, L = null;
  const EL = {};
  const S = {
    city: 0, prevIdx: -1, trans: 1, W: 0, H: 0,
    plate: null, prevPlate: null, stale: false, staleAt: 0,
    leaves: [], dust: [], t: 0, last: 0, menuOpen: false, nightK: 0,
  };

  function build() {
    const p = document.getElementById("page-realnow");
    if (!p) return;
    const others = [1, 2, 3, 4, 5, 6, 7].map(function (i) {
      const c = D.CITIES[i];
      return '<button class="rn-city" data-i="' + i + '"><em>' + U.esc(c.cn) +
        '</em><span>' + U.esc(c.en) + '</span></button>';
    }).join("");
    p.innerHTML =
      '<div id="rn-root">' +
        '<canvas id="rn-bg"></canvas>' +
        '<div id="rn-tint"></div><div id="rn-vig"></div><div id="rn-grain"></div>' +
        '<div id="rn-top"><span class="dot"></span>' +
          '<span class="tx">Real-now World · <b>此刻的世界</b></span></div>' +
        '<div id="rn-topwrap"><div id="rn-menu-zone">' +
          '<div id="rn-title">' +
            '<div id="rn-title-cn" data-t="金陵">金陵</div>' +
            '<div id="rn-title-en">NANJING · 梧桐大道</div>' +
          '</div>' +
          '<div id="rn-menu">' + others +
            '<i class="rn-div"></i>' +
            '<button class="rn-city" data-i="0"><em>金陵</em><span>NANJING</span></button>' +
          '</div>' +
        '</div></div>' +
        '<div id="rn-watch-col">' +
          '<canvas id="rn-watch"></canvas>' +
          '<div id="rn-wdate">—</div>' +
          '<div id="rn-news">' +
            '<div class="rn-nh">今日 · 金陵<i></i></div>' +
            '<a class="rn-nb" target="_blank" rel="noopener">—</a>' +
            '<div class="rn-nf"><span class="t">--:--</span><i></i>' +
              '<span class="s">来源 · 人民日报</span></div>' +
            '<div class="rn-ns">检索中…</div>' +
          '</div>' +
        '</div>' +
        '<div id="rn-cap"><b>梧桐大道</b><i></i><span>PLANE-TREE AVENUE</span></div>' +
        '<div id="rn-slogan"><span>— 穿越时区，去到你想去的地方 —</span></div>' +
      '</div>';

    EL.root = document.getElementById("rn-root");
    EL.bg = document.getElementById("rn-bg");
    EL.zone = document.getElementById("rn-menu-zone");
    EL.menu = document.getElementById("rn-menu");
    EL.tcn = document.getElementById("rn-title-cn");
    EL.ten = document.getElementById("rn-title-en");
    EL.watch = document.getElementById("rn-watch");
    EL.wdate = document.getElementById("rn-wdate");
    EL.newsH = document.querySelector("#rn-news .rn-nh");
    EL.newsB = document.querySelector("#rn-news .rn-nb");
    EL.newsT = document.querySelector("#rn-news .rn-nf .t");
    EL.newsSrc = document.querySelector("#rn-news .rn-nf .s");
    EL.newsS = document.querySelector("#rn-news .rn-ns");
    EL.cap = document.getElementById("rn-cap");
    EL.slogan = document.getElementById("rn-slogan");
    built = true;
  }

  /* ---------- 标题 / 栏目 / 切换 ---------- */
  function setTitle(idx) {
    const c = D.CITIES[idx];
    if (!EL.tcn) return;
    const cn = idx === 0 ? "金陵" : c.cn;
    EL.tcn.textContent = cn;
    EL.tcn.setAttribute("data-t", cn);
    EL.tcn.style.fontSize = cn.length > 2 ? "clamp(36px,6.2vw,88px)" : "";
    EL.tcn.classList.remove("swap");
    void EL.tcn.offsetWidth;
    EL.tcn.classList.add("swap");
    EL.ten.innerHTML = U.esc(c.en) + " · <b>" + U.esc(c.landmark) + "</b>";
    if (EL.cap) {
      const b = EL.cap.querySelector("b"), sp = EL.cap.querySelector("span");
      if (b) b.textContent = c.landmark;
      if (sp) sp.textContent = c.en;
    }
    const btns = document.querySelectorAll("#rn-menu .rn-city");
    for (let i = 0; i < btns.length; i++) {
      btns[i].classList.toggle("on", +btns[i].dataset.i === idx);
    }
  }
  function openMenu(v) {
    if (!EL.zone) return;
    S.menuOpen = !!v;
    EL.zone.classList.toggle("open", !!v);
  }
  function switchCity(idx) {
    idx = U.clamp(idx | 0, 0, D.CITIES.length - 1);
    if (idx === S.city) { openMenu(false); return; }
    if (S.trans < .5) return;                 // 过渡中忽略连点
    S.prevIdx = S.city;
    S.prevPlate = S.plate;
    S.city = idx;
    S.nightK = nightOf(idx);
    S.plate = getPlate(idx, S.W, S.H);
    S.trans = 0;
    setTitle(idx);
    syncWatch(idx);
    kickWatch();
    ensureNews(idx);
    openMenu(false);
  }

  /* ================================================================
   * 16. 每帧
   * ================================================================ */
  function drawPlate(ctx, p, W, H, zoom, alpha, dy) {
    if (!p || alpha <= .003) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, alpha);
    ctx.translate(W * .5, H * .5 + (dy || 0));
    ctx.scale(zoom, zoom);
    ctx.drawImage(p.c, -W * .5, -H * .5, W, H);
    ctx.restore();
  }

  function frame(now) {
    if (!L || L.dead) return;
    if (!S.last) S.last = now;
    let dt = (now - S.last) / 1000;
    S.last = now;
    if (dt > .06) dt = .06;
    if (dt <= 0) dt = .016;
    S.t += dt;

    /* ---------- 背景 ---------- */
    if (EL.bg) {
      const f = U.fitCanvas(EL.bg);
      const ctx = f.ctx, W = f.w, H = f.h;
      if (Math.abs(W - S.W) > 1 || Math.abs(H - S.H) > 1) {
        S.W = W; S.H = H; S.stale = true; S.staleAt = now;
        S.dust = mkDust(W, H);
        S.leaves = mkLeaves(W, H);
      }
      if (!S.plate) S.plate = getPlate(S.city, S.W, S.H);
      if (S.stale && now - S.staleAt > 240) {
        PLATES.clear();
        S.prevPlate = null;
        S.plate = getPlate(S.city, S.W, S.H);
        S.stale = false; S.trans = 1;
      }
      ctx.clearRect(0, 0, W, H);

      if (S.trans < 1) S.trans = Math.min(1, S.trans + dt / 1.15);
      const e = U.easeInOut(S.trans);
      const trans = S.trans < 1;

      // 淡出淡入 + 轻微镜头推移
      if (trans && S.prevPlate) drawPlate(ctx, S.prevPlate, W, H, 1 + .05 * e, 1 - e, -H * .014 * e);
      drawPlate(ctx, S.plate, W, H, 1.06 - .06 * e, trans ? e : 1, H * .016 * (1 - e));

      // 过渡暖白纱
      if (trans) {
        const v = Math.sin(Math.PI * S.trans);
        ctx.fillStyle = `rgba(255,246,226,${v * .13})`;
        ctx.fillRect(0, 0, W, H);
      }

      // 前景动效（新旧城市交叉淡出）
      paintLive(ctx, W, H, S.city, S.t, trans ? e : 1, true);
      if (trans && S.prevPlate) paintLive(ctx, W, H, S.prevIdx, S.t, 1 - e, false);

      // 落叶只在南京
      const njA = S.city === 0 ? (trans ? e : 1) : (S.prevIdx === 0 && trans ? 1 - e : 0);
      if (njA > .004) drawLeaves(ctx, W, H, dt, njA);
    }

    /* ---------- 怀表 ---------- */
    if (faceSize !== watchSize()) ensureWatch();
    drawWatch(now, dt);
  }

  /* ================================================================
   * 17. 粒子 / 怀表尺寸
   * ================================================================ */
  function mkDust(W, H) {
    const out = [];
    for (let i = 0; i < 46; i++) {
      out.push({ x: Math.random(), y: Math.random(), vx: U.rand(-.008, .008),
        vy: U.rand(-.01, -.002), tw: U.rand(.6, 2.2), ph: U.rand(0, TAU),
        a: U.rand(.3, 1), s: U.rand(.8, 2.1) });
    }
    return out;
  }
  function mkLeaves(W, H) {
    const n = U.clamp(Math.round(W * H / 14000), 64, 150);   // < 180
    const out = [];
    for (let i = 0; i < n; i++) out.push(mkLeaf(W, H, true));
    return out;
  }
  function watchSize() { return window.innerWidth < 780 ? 116 : 176; }
  function ensureWatch() {
    if (!EL.watch) return;
    const size = watchSize();
    faceSize = size;
    face = bakeWatchFace(size);
    EL.watch.style.width = face.w + "px";
    EL.watch.style.height = face.h + "px";
  }

  /* ================================================================
   * 18. 进入 / 离开
   * ================================================================ */
  function enter() {
    if (L) { try { L.kill(); } catch (e) {} }
    L = U.life();
    if (!built) build();
    if (!EL.root) return;

    // 复位
    S.city = 0; S.prevIdx = -1; S.prevPlate = null; S.trans = 1;
    S.t = 0; S.last = 0; S.menuOpen = false; S.stale = false;
    S.W = window.innerWidth; S.H = window.innerHeight;
    S.nightK = nightOf(0);
    S.dust = mkDust(S.W, S.H);
    S.leaves = mkLeaves(S.W, S.H);
    PLATES.clear();
    S.plate = getPlate(0, S.W, S.H);

    EL.root.classList.remove("on");
    openMenu(false);
    if (EL.slogan) EL.slogan.classList.remove("on");
    setTitle(0);
    ensureWatch();
    syncWatch(0);
    // 指针先摆到目标时刻，避免首次进入看到"旋转"
    (function preset() {
      const t = U.nowIn(D.CITIES[0].tz);
      const secs = t.hour * 3600 + t.minute * 60 + t.second;
      WT.aH = (secs % 43200) / 43200 * TAU;
      WT.aM = (secs % 3600) / 3600 * TAU;
      WT.aS = (secs % 60) / 60 * TAU;
      WT.kick = -9e5; WT.pulse = 0;
    })();
    ensureNews(0);

    /* ---- 栏目：容器 hover（完全离开才收起） ---- */
    L.on(EL.zone, "pointerenter", function () { openMenu(true); });
    L.on(EL.zone, "pointerleave", function () { openMenu(false); });
    // 触屏：点大字切换栏目
    L.on(EL.tcn, "click", function (e) {
      e.stopPropagation();
      openMenu(!S.menuOpen);
    });
    L.on(EL.menu, "click", function (e) {
      const b = e.target.closest ? e.target.closest(".rn-city") : null;
      if (!b) return;
      switchCity(+b.dataset.i);
    });

    /* ---- 每秒校准怀表 ---- */
    L.interval(function () { syncWatch(S.city); }, 1000);

    /* ---- 3 秒后标语，停留 4 秒 ---- */
    L.timeout(function () { if (EL.slogan) EL.slogan.classList.add("on"); }, 3000);
    L.timeout(function () { if (EL.slogan) EL.slogan.classList.remove("on"); }, 7000);

    /* ---- 入场 ---- */
    L.timeout(function () { if (EL.root) EL.root.classList.add("on"); }, 60);

    /* ---- 尺寸变化：延迟重烘焙 ---- */
    L.on(window, "resize", function () {
      if (!EL.root) return;
      S.stale = true; S.staleAt = performance.now();
      ensureWatch();
    });

    L.loop(frame);
  }

  function leave() {
    if (L) { L.kill(); L = null; }
    CTRLS.forEach(function (c) { try { c.abort(); } catch (e) {} });
    CTRLS.clear();
    NEWS.busy = {};
    if (EL.root) EL.root.classList.remove("on");
    openMenu(false);
    if (EL.slogan) EL.slogan.classList.remove("on");
    PLATES.clear();
    S.plate = null; S.prevPlate = null; S.trans = 1; S.last = 0;
  }

  App.register("realnow", { enter: enter, leave: leave });
})();

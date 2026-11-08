/* ============================================================
 * L1 初始化页面
 *   · 宇宙：急行流星 → 拉视角急转 → 恒星/行星/卫星/星云全貌
 *   · 星体随机以"小方片瓦解/重建"方式生灭；点击大星加装光板加速
 *   · 中央书卷：高光点闪光出现 → 自动快速翻页（真实翻书质感）→ 末页"寻梦河海"
 *   · 照片流光：四边光点闭合轨迹 → 光向下渗成介绍文字 → 收回留边框光路与光尘
 *   · 按南京实时时段三种转场：白昼白热化 / 夜色星流入"梦"字 / 晨昏星流螺旋压迫
 * ============================================================ */
(function () {
  const U = window.Utils, D = window.DATA;

  /* ---------------------------------------------------------------- CSS */
  U.injectCSS("css-init", `
  #init-root{position:absolute;inset:0;overflow:hidden;background:
    radial-gradient(120% 140% at 50% 34%, #0a2350 0%, #05122c 46%, #01060e 100%);}
  #u3d{position:absolute;inset:0;width:100%;height:100%;z-index:1;cursor:crosshair;}
  #entry-fx{position:absolute;inset:0;width:100%;height:100%;z-index:60;pointer-events:none;}

  /* 顶部题记 */
  #init-head{position:absolute;top:5.5%;left:0;right:0;z-index:30;text-align:center;pointer-events:none;
    transition:opacity 1.1s ease, transform 1.1s var(--ease);}
  #init-head.dim{opacity:.0;transform:translateY(-26px);}
  #init-title{font-family:var(--f-kai);font-size:clamp(17px,2.05vw,28px);color:#eef5ff;letter-spacing:.13em;
    line-height:1.7;opacity:0;transform:translateY(-16px);transition:opacity 1.6s ease, transform 1.6s var(--ease);
    text-shadow:0 0 30px rgba(90,160,255,.8), 0 0 10px rgba(255,255,255,.28);}
  #init-title.in{opacity:1;transform:none;}
  #init-epigraph{font-family:var(--f-kai);font-size:clamp(12px,1.22vw,16px);color:#b9d0ee;letter-spacing:.09em;
    line-height:2.05;margin-top:20px;opacity:0;transform:translateY(10px);
    transition:opacity 2s ease .6s, transform 2s var(--ease) .6s;text-shadow:0 0 16px rgba(110,170,255,.45);}
  #init-epigraph.in{opacity:1;transform:none;}
  #init-epigraph .q{color:#7fb0f0;font-size:.92em;letter-spacing:.14em;}

  /* 书卷舞台 */
  #book-stage{position:absolute;left:50%;top:61%;transform:translate(-50%,-50%);z-index:20;
    perspective:2600px;perspective-origin:50% 50%;
    transition:transform 1.1s cubic-bezier(.34,.06,.22,1), opacity .8s ease;}
  #book-stage.closed{transform:translate(-50%,-50%) translateX(calc(var(--bw) * -.25));}
  #book{position:relative;width:100%;height:100%;transform-style:preserve-3d;}
  #book-stage::after{content:"";position:absolute;left:6%;right:6%;top:100%;height:8%;
    background:radial-gradient(50% 100% at 50% 0%, rgba(60,120,220,.32), transparent 72%);filter:blur(9px);pointer-events:none;}

  .book-rim{position:absolute;inset:-4px -6px -10px;z-index:0;border-radius:3px;
    background:repeating-linear-gradient(0deg,rgba(246,238,220,.96) 0 1px,rgba(206,192,162,.9) 1px 2.2px);
    box-shadow:0 30px 70px rgba(0,0,0,.62), 0 10px 24px rgba(0,0,0,.42), inset 0 0 0 1px rgba(120,95,50,.4);
    transition:opacity .55s ease;opacity:.92;}
  /* 合上的书只有封面那一页，不该露出整迭书页厚度 */
  #book-stage.closed .book-rim{opacity:0;}
  .sheet{position:absolute;top:0;height:100%;transform-style:preserve-3d;
    transform-origin:left center;will-change:transform;}
  .sheet.half{left:50%;width:50%;}
  .sheet.full{left:0;width:100%;}
  .sheet .face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;
    overflow:hidden;border-radius:3px;background:#f6efdd;
    box-shadow:0 0 0 1px rgba(90,70,30,.18) inset;}
  .sheet .face.back{transform:rotateY(180deg);}
  .sheet .shade{position:absolute;inset:0;pointer-events:none;z-index:9;
    background:linear-gradient(90deg, rgba(20,12,0,.34) 0%, rgba(20,12,0,0) 16%, rgba(20,12,0,0) 84%, rgba(20,12,0,.2) 100%);
    opacity:.55;transition:opacity .3s;}
  .sheet-inner{position:absolute;inset:0;transform-style:preserve-3d;}

  /* 封皮 */
  .cover{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;
    gap:clamp(8px,1.4vh,18px);
    background:linear-gradient(155deg,#0d4aa8 0%,#0a357c 34%,#061f4c 68%,#04142f 100%);}
  .cover::before{content:"";position:absolute;inset:2.6%;border:1px solid rgba(226,196,138,.5);
    box-shadow:inset 0 0 0 1px rgba(226,196,138,.16), inset 0 0 60px rgba(0,0,0,.5);border-radius:2px;}
  .cover::after{content:"";position:absolute;inset:0;
    background:radial-gradient(120% 80% at 50% 0%, rgba(120,190,255,.22), transparent 58%),
      repeating-linear-gradient(115deg, rgba(255,255,255,.028) 0 2px, transparent 2px 5px);mix-blend-mode:screen;}
  .cover .emb{width:clamp(58px,13%,112px);border-radius:50%;box-shadow:0 0 26px rgba(140,200,255,.7),0 0 70px rgba(60,130,255,.35);z-index:2;}
  .cover .nm{width:clamp(120px,44%,300px);z-index:2;
    /* 已用脚本把"白底墨字"的校名处理成透明底鎏金 PNG（素材/校徽/校名-金.png） */
    filter:drop-shadow(0 0 18px rgba(255,222,150,.62)) drop-shadow(0 2px 3px rgba(0,0,0,.5));}
  .cover .cc{font-family:var(--f-kai);letter-spacing:.62em;font-size:clamp(11px,1.25vw,17px);color:#dbe8ff;z-index:2;text-indent:.62em;}
  .cover .ct{font-size:clamp(8px,.86vw,11px);letter-spacing:.34em;color:#8fb0e0;z-index:2;text-indent:.34em;}
  .cover .c111{position:absolute;bottom:6.4%;left:0;right:0;text-align:center;font-family:var(--f-song);
    font-size:clamp(9px,.95vw,12px);letter-spacing:.5em;color:rgba(226,196,138,.72);z-index:2;text-indent:.5em;}

  /* 内页 */
  .leaf{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;
    padding:7% 9% 6%;box-sizing:border-box;
    background:
      radial-gradient(80% 60% at 24% 12%, rgba(255,255,255,.66), transparent 62%),
      radial-gradient(70% 60% at 82% 88%, rgba(196,166,110,.16), transparent 66%),
      linear-gradient(158deg,#f8f2e2 0%,#f0e7d1 48%,#e7dcc2 100%);}
  .leaf::before{content:"";position:absolute;inset:0;opacity:.5;mix-blend-mode:multiply;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23p)' opacity='.22'/%3E%3C/svg%3E");}
  .leaf::after{content:"";position:absolute;inset:0;pointer-events:none;
    background:repeating-linear-gradient(0deg, rgba(120,90,40,.028) 0 1px, transparent 1px 4px);}
  .leaf .no{position:absolute;bottom:3.2%;font-family:var(--f-song);font-size:10px;letter-spacing:.3em;
    color:#a08e63;z-index:4;}
  .leaf .no.l{left:8%;} .leaf .no.r{right:8%;}

  .photo-mount{position:relative;width:100%;flex:1 1 auto;min-height:0;display:flex;flex-direction:column;
    align-items:center;justify-content:center;z-index:3;}
  .pm-frame{position:relative;padding:clamp(4px,.7vh,8px);background:linear-gradient(140deg,#fffdf6,#efe6d0);
    box-shadow:0 10px 26px rgba(60,40,10,.26), 0 1px 0 rgba(255,255,255,.9) inset, 0 0 0 1px rgba(140,110,60,.22);
    border-radius:2px;transition:transform .5s var(--ease), box-shadow .5s ease;cursor:pointer;
    max-width:100%;max-height:100%;display:flex;align-items:center;justify-content:center;}
  .pm-frame img{display:block;max-width:100%;max-height:100%;object-fit:contain;background:#cbbfa2;border-radius:1px;
    filter:saturate(.94) contrast(1.02);}
  .pm-frame:hover{transform:translateY(-2px);box-shadow:0 16px 34px rgba(60,40,10,.34), 0 0 0 1px rgba(140,110,60,.3);}
  .pm-cap{margin-top:clamp(6px,1.2vh,14px);text-align:center;z-index:3;flex:0 0 auto;}
  .pm-cap .n{font-family:var(--f-kai);font-size:clamp(14px,1.62vw,21px);color:#153a63;letter-spacing:.22em;text-indent:.22em;}
  .pm-cap .y{font-family:var(--f-song);font-size:clamp(9px,.92vw,12px);color:#8a7550;letter-spacing:.2em;margin-top:4px;}
  .pm-cap .t{font-family:var(--f-song);font-size:clamp(8px,.82vw,11px);color:#9c8a66;letter-spacing:.12em;margin-top:3px;}
  .stamp{position:absolute;right:7%;top:6%;width:clamp(22px,2.6vw,34px);height:clamp(22px,2.6vw,34px);
    border:1.5px solid rgba(178,54,43,.62);border-radius:2px;color:rgba(178,54,43,.8);
    font-family:var(--f-kai);font-size:clamp(9px,1vw,13px);display:flex;align-items:center;justify-content:center;
    transform:rotate(-7deg);letter-spacing:0;line-height:1;opacity:.78;z-index:4;
    box-shadow:0 0 0 1px rgba(178,54,43,.16) inset;}

  /* 流光画布 */
  .trail-cv{position:absolute;left:0;top:0;pointer-events:none;z-index:6;}

  /* 末页 · 寻梦河海 */
  .dream{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;
    background:
      radial-gradient(60% 48% at 50% 46%, rgba(120,185,255,.2), transparent 70%),
      radial-gradient(120% 100% at 50% 0%, #0d3f8c 0%, #071f4d 44%, #030d22 100%);}
  .dream::before{content:"";position:absolute;inset:2.4%;border:1px solid rgba(226,196,138,.34);border-radius:2px;}
  .dream::after{content:"";position:absolute;inset:0;
    background:repeating-linear-gradient(115deg, rgba(255,255,255,.03) 0 2px, transparent 2px 6px);mix-blend-mode:screen;}
  #dream-text{position:relative;font-family:var(--f-kai);font-size:clamp(42px,6.4vw,86px);letter-spacing:.18em;
    text-indent:.18em;color:#cfe6ff;cursor:pointer;z-index:3;padding:.1em .2em;
    animation:dreamBreath 4.6s ease-in-out infinite;transition:transform .5s var(--ease), filter .5s;}
  #dream-text::before{content:"寻梦河海";position:absolute;inset:0;color:#4ea1ff;filter:blur(16px);
    opacity:.85;animation:dreamHalo 4.6s ease-in-out infinite;}
  #dream-text:hover{transform:scale(1.045);filter:brightness(1.25);}
  @keyframes dreamBreath{
    0%{color:#4f81bb;text-shadow:0 0 10px rgba(8,34,96,.95),0 0 34px rgba(14,58,150,.5);}
    28%{color:#eef8ff;text-shadow:0 0 30px rgba(140,205,255,1),0 0 86px rgba(52,132,255,.85),0 0 168px rgba(20,70,190,.6);}
    44%{color:#2d5f9e;text-shadow:0 0 12px rgba(6,28,84,.95),0 0 30px rgba(10,44,120,.55);}
    58%{color:#dcefff;text-shadow:0 0 26px rgba(126,196,255,.98),0 0 70px rgba(40,118,240,.7),0 0 140px rgba(16,58,170,.5);}
    76%{color:#6ea3d8;text-shadow:0 0 16px rgba(10,40,110,.9),0 0 44px rgba(18,66,168,.5);}
    100%{color:#4f81bb;text-shadow:0 0 10px rgba(8,34,96,.95),0 0 34px rgba(14,58,150,.5);}}
  @keyframes dreamHalo{0%,100%{opacity:.35;filter:blur(12px);}50%{opacity:.95;filter:blur(24px);}}
  #dream-sub{margin-top:clamp(10px,2vh,24px);font-family:var(--f-song);font-size:clamp(9px,.95vw,12px);
    letter-spacing:.5em;color:rgba(180,210,245,.55);z-index:3;text-indent:.5em;}
  #dream-hand{position:absolute;right:6.5%;bottom:8%;text-align:right;
    font-family:var(--f-kai);font-size:clamp(13px,1.42vw,19px);letter-spacing:.1em;line-height:1.9;
    color:#c9b48a;z-index:3;text-shadow:0 0 12px rgba(0,0,0,.5);}
  #dream-hand .gl{position:relative;color:#d8c49a;}
  #dream-hand .gl::after{content:attr(data-c);position:absolute;left:0;top:0;color:#ffe9a8;
    text-shadow:0 0 16px rgba(255,214,120,.95),0 0 34px rgba(255,190,60,.6);
    animation:goldSweep 4.2s ease-in-out infinite;opacity:0;}
  @keyframes goldSweep{0%,86%,100%{opacity:0;}90%{opacity:1;}94%{opacity:.35;}}

  /* 底部提示 */
  #init-hint{position:absolute;bottom:3.4%;left:0;right:0;text-align:center;z-index:30;pointer-events:none;
    font-size:11px;letter-spacing:.26em;color:#6f8fbb;opacity:0;transition:opacity 1.2s ease;text-indent:.26em;}
  #init-hint.on{opacity:.9;}
  #init-hint b{color:#9dc2f0;font-weight:400;}

  /* 高光点 → 书卷出现 */
  #spark-pt{position:absolute;left:50%;top:61%;width:8px;height:8px;margin:-4px 0 0 -4px;z-index:24;pointer-events:none;
    border-radius:50%;background:#fff;box-shadow:0 0 30px #fff,0 0 80px rgba(150,200,255,.9),0 0 160px rgba(60,120,255,.6);
    opacity:0;transform:scale(.2);}
  #spark-pt.on{animation:sparkBurst 2.1s cubic-bezier(.4,0,.2,1) forwards;}
  @keyframes sparkBurst{
    0%{opacity:0;transform:scale(.05);}
    18%{opacity:1;transform:scale(1);}
    34%{opacity:1;transform:scale(2.4);}
    52%{opacity:1;transform:scale(.7);}
    70%{opacity:.9;transform:scale(9);filter:blur(3px);}
    84%{opacity:.5;transform:scale(22);filter:blur(14px);}
    100%{opacity:0;transform:scale(34);filter:blur(30px);}
  }
  @media (max-width:760px){
    #init-head{top:3.5%;}
    .leaf{padding:6% 7% 5%;}
    #dream-hand{font-size:12px;right:5%;bottom:6%;}
  }
  `);

  /* ================================================================
   * 宇宙引擎
   * ================================================================ */
  class Universe {
    constructor(canvas) {
      this.c = canvas;
      this.t = 0;
      this.stars = [];
      this.bytes = [];
      this.nebulae = [];
      this.planets = [];
      this.moons = [];
      this.meteors = [];
      this.bigStars = [];
      this.panels = [];
      this.warp = 0;         // 0: 急行  1: 平静
      this.phase = "warp";   // warp -> turn -> calm
      this.started = 0;
      this.dim = 0;          // 外部可调暗
      this.white = 0;        // 白热化系数
      this.flowTarget = null;// 星流目标（转场用）
      this.ready = false;
      this.resize();
      this.build();
      this.ready = true;
    }

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = this.c.clientWidth || window.innerWidth;
      const h = this.c.clientHeight || window.innerHeight;
      this.W = w; this.H = h; this.dpr = dpr;
      if (this.c.width !== Math.round(w * dpr)) { this.c.width = Math.round(w * dpr); this.c.height = Math.round(h * dpr); }
      this.ctx = this.c.getContext("2d");
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    build() {
      const w = this.W, h = this.H;
      // 深空星（多层视差）
      this.stars = [];
      const N = Math.min(620, Math.round(w * h / 2600));
      for (let i = 0; i < N; i++) this.stars.push(this.mkStar());
      // 大星（可点击）
      this.bigStars = [];
      for (let i = 0; i < 26; i++) {
        const s = { x: U.rand(.05, .95) * w, y: U.rand(.06, .94) * h, r: U.rand(2.6, 5.4),
          tw: U.rand(U.TAU), tws: U.rand(.5, 1.6), hue: U.pick([205, 215, 228, 250, 42]),
          ax: 0, ay: 0, avx: 0, avy: 0, boost: 0, boostT: 0, panels: 0, shatter: 0, mode: "on", t: 0 };
        this.bigStars.push(s);
      }
      // 字节
      this.bytes = [];
      for (let i = 0; i < 90; i++) this.bytes.push(this.mkByte());
      // 星云（预渲染为贴图，逐帧只做位移/旋转/缩放，保证 60fps）
      const cols = [[124, 82, 220], [40, 126, 226], [176, 84, 206], [36, 168, 190], [212, 128, 88]];
      this.nebulae = [];
      for (let i = 0; i < 7; i++) {
        const n = {
          x: U.rand(0, w), y: U.rand(0, h), r: U.rand(.16, .4) * Math.min(w, h),
          rgb: cols[i % cols.length], a: U.rand(.1, .2), vx: U.rand(-.05, .05), vy: U.rand(-.04, .04),
          rot: U.rand(0, U.TAU), vr: U.rand(-.0004, .0004), sy: U.rand(.55, .95), seed: U.rand(1, 99),
        };
        n.img = this.renderNebula(n);
        this.nebulae.push(n);
      }
      this.starSprite = this.mkStarSprite();
      this.streakSprite = this.mkStreakSprite();
      this.galaxy = this.mkGalaxyBand();
      this.farGalaxies = [];
      for (let i = 0; i < 7; i++) {
        this.farGalaxies.push({ x: U.rand(.05, .95), y: U.rand(.06, .94), r: U.rand(.012, .03) * Math.min(w, h),
          rot: U.rand(0, U.TAU), sp: U.rand(-.00012, .00012), img: null });
      }
      this.farGalaxies.forEach(g => { g.img = this.mkGalaxySprite(); });
      // 行星系
      const R = Math.min(w, h);
      this.sun = { x: w * .5, y: h * .52, r: R * .052, rot: 0, flare: 0 };
      this.planets = [
        { a: R * .2, b: R * .08, ang: .9, sp: .00042, r: R * .026, hue: 208, ring: false, lit: 1, moons: [] },
        { a: R * .31, b: R * .13, ang: 2.4, sp: .00028, r: R * .034, hue: 32, ring: true, lit: 1, moons: [] },
        { a: R * .42, b: R * .19, ang: 4.1, sp: .00019, r: R * .022, hue: 158, ring: false, lit: 1, moons: [] },
        { a: R * .52, b: R * .245, ang: 5.6, sp: .00013, r: R * .04, hue: 268, ring: false, lit: 1, moons: [] },
      ];
      this.planets.forEach((p, i) => {
        p.moons = [{ a: p.r * 2.6, ang: U.rand(0, U.TAU), sp: .0028 + i * .0004, r: p.r * .26 }];
      });
    }

    /* 预渲染：星点精灵 */
    mkStarSprite() {
      const S = 64, c = U.mkCanvas(S, S), x = c.getContext("2d");
      const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(.22, "rgba(235,246,255,.92)");
      g.addColorStop(.5, "rgba(170,215,255,.28)");
      g.addColorStop(1, "rgba(120,180,255,0)");
      x.fillStyle = g; x.beginPath(); x.arc(S / 2, S / 2, S / 2, 0, U.TAU); x.fill();
      return c;
    }
    /* 预渲染：流星拉丝精灵（竖向，顶部亮） */
    mkStreakSprite() {
      const W = 8, H = 96, c = U.mkCanvas(W, H), x = c.getContext("2d");
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(.14, "rgba(215,238,255,.85)");
      g.addColorStop(.55, "rgba(140,195,255,.24)");
      g.addColorStop(1, "rgba(110,170,255,0)");
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      return c;
    }
    /* 预渲染：银河星尘带（斜贯全屏的一条尘埃带） */
    mkGalaxyBand() {
      const W = 1600, H = 520;
      const c = U.mkCanvas(W, H), x = c.getContext("2d");
      // 底层柔光
      for (let i = 0; i < 26; i++) {
        const cx = U.rand(0, W), cy = H * .5 + U.rand(-1, 1) * H * .16;
        const r = U.rand(H * .18, H * .55);
        const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
        const hue = U.rand() < .5 ? "150,175,225" : "196,170,220";
        g.addColorStop(0, `rgba(${hue},.13)`);
        g.addColorStop(1, `rgba(${hue},0)`);
        x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, U.TAU); x.fill();
      }
      // 星尘点：沿中线做高斯分布
      for (let i = 0; i < 5200; i++) {
        const cx = U.rand(0, W);
        const gauss = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
        const cy = H * .5 + gauss * H * .13;
        const s = U.rand(.4, 1.5);
        x.fillStyle = `rgba(${226 + U.rand(-30, 26) | 0},${236 + U.rand(-26, 18) | 0},255,${U.rand(.18, .8)})`;
        x.fillRect(cx, cy, s, s);
      }
      // 暗尘带（遮出一条"尘埃裂缝"）
      x.globalCompositeOperation = "destination-out";
      for (let i = 0; i < 16; i++) {
        const cx = U.rand(0, W);
        const cy = H * .5 + U.rand(-1, 1) * H * .06;
        const r = U.rand(H * .05, H * .16);
        const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `rgba(0,0,0,${U.rand(.16, .4)})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, U.TAU); x.fill();
      }
      return c;
    }
    /* 预渲染：远处的旋涡星系 */
    mkGalaxySprite() {
      const S = 128, c = U.mkCanvas(S, S), x = c.getContext("2d");
      x.translate(S / 2, S / 2);
      const g = x.createRadialGradient(0, 0, 0, 0, 0, S / 2);
      g.addColorStop(0, "rgba(255,248,228,.95)");
      g.addColorStop(.14, "rgba(255,232,190,.55)");
      g.addColorStop(.5, "rgba(200,190,255,.16)");
      g.addColorStop(1, "rgba(150,170,255,0)");
      x.fillStyle = g; x.beginPath(); x.arc(0, 0, S / 2, 0, U.TAU); x.fill();
      // 旋臂
      x.globalCompositeOperation = "lighter";
      for (let arm = 0; arm < 2; arm++) {
        for (let i = 0; i < 60; i++) {
          const t = i / 60, a = arm * Math.PI + t * 3.1;
          const r = S * .07 + t * S * .4;
          x.fillStyle = `rgba(${210 + t * 40 | 0},${200 + t * 30 | 0},255,${(1 - t) * .5})`;
          x.fillRect(Math.cos(a) * r, Math.sin(a) * r * .42, 1.6, 1.6);
        }
      }
      return c;
    }

    /* 预渲染：星云贴图 */
    renderNebula(n) {
      const S = Math.round(n.r * 2);
      const c = U.mkCanvas(S, S), x = c.getContext("2d");
      x.translate(S / 2, S / 2);
      const g = x.createRadialGradient(0, 0, 0, 0, 0, S / 2);
      g.addColorStop(0, `rgba(${n.rgb},${n.a})`);
      g.addColorStop(.42, `rgba(${n.rgb},${n.a * .48})`);
      g.addColorStop(1, `rgba(${n.rgb},0)`);
      x.fillStyle = g; x.beginPath(); x.arc(0, 0, S / 2, 0, U.TAU); x.fill();
      x.globalCompositeOperation = "screen";
      for (let k = 0; k < 9; k++) {
        const a = n.seed + k * 1.7;
        const rr = n.r * (.16 + .42 * U.noise2(k * 3.1 + n.seed, n.seed * 2));
        const ox = Math.cos(a) * n.r * .46, oy = Math.sin(a) * n.r * .4;
        const g2 = x.createRadialGradient(ox, oy, 0, ox, oy, rr);
        g2.addColorStop(0, `rgba(${n.rgb},${n.a * .62})`);
        g2.addColorStop(1, `rgba(${n.rgb},0)`);
        x.fillStyle = g2; x.beginPath(); x.arc(ox, oy, rr, 0, U.TAU); x.fill();
      }
      return c;
    }

    mkStar() {      const w = this.W, h = this.H;
      return { x: U.rand(0, w), y: U.rand(0, h), z: U.rand(.25, 1),
        r: U.rand(.5, 1.9), a: U.rand(.25, .95), tw: U.rand(0, U.TAU), tws: U.rand(.4, 1.8),
        hue: U.rand() < .12 ? U.pick([200, 46, 268]) : 219,
        mode: "on", shatter: 0, frags: null, delay: U.rand(0, 1000) };
    }
    mkByte() {
      const chars = "01水云河海算浪潮流未来智π∞≈01λ";
      return { x: U.rand(0, this.W), y: U.rand(0, this.H), ch: chars[Math.floor(U.rand(0, chars.length))],
        vx: U.rand(-.16, .16), vy: U.rand(-.14, .14), size: U.rand(8, 16), a: U.rand(.2, .55), hue: U.rand(190, 215) };
    }

    /* --------- 主循环 --------- */
    start(L) {
      this.t0 = performance.now();
      L.loop(() => this.frame());
    }

    frame() {
      const now = performance.now();
      this.t = (now - this.t0) / 1000;
      const T = this.t;
      // 阶段：0-1.5 急行；1.5-3.4 缓速转向；3.4+ 平静
      if (T < 1.5) this.warp = 0;
      else if (T < 3.4) this.warp = U.easeInOut((T - 1.5) / 1.9);
      else this.warp = 1;
      this.phase = T < 1.5 ? "warp" : T < 3.4 ? "turn" : "calm";
      this.draw(T);
    }

    /* --------- 绘制 --------- */
    draw(T) {
      const { ctx, W: w, H: h } = this;
      ctx.clearRect(0, 0, w, h);
      const wp = this.warp;

      // ---- 背景底色
      const bg = ctx.createRadialGradient(w * .5, h * .48, 0, w * .5, h * .48, Math.max(w, h) * .78);
      bg.addColorStop(0, `rgba(12,36,84,${.9 - wp * .25})`);
      bg.addColorStop(.55, "rgba(5,16,40,.96)");
      bg.addColorStop(1, "rgba(1,4,12,1)");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

      // ---- 银河星尘带（斜贯全屏的尘埃带，随镜头极缓慢漂移）
      if (this.galaxy) {
        const gw = Math.max(w * 1.5, 1600), gh = gw * (520 / 1600);
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = (.1 + wp * .62);
        ctx.translate(w * .5, h * .46);
        ctx.rotate(-0.36 + Math.sin(T * .02) * .006);
        ctx.drawImage(this.galaxy, -gw * .5, -gh * .5, gw, gh);
        ctx.restore();
      }
      // ---- 远处旋涡星系
      if (wp > .34) {
        const gA = U.clamp((wp - .34) / .5, 0, 1) * .8;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        for (const g of this.farGalaxies) {
          g.rot += g.sp;
          const s = g.r * 2.6;
          ctx.globalAlpha = gA * .55;
          ctx.save();
          ctx.translate(g.x * w, g.y * h); ctx.rotate(g.rot);
          ctx.drawImage(g.img, -s / 2, -s / 2, s, s);
          ctx.restore();
        }
        ctx.restore();
      }

      // ---- 星云（贴图，逐帧仅变换）
      const nebA = wp;
      if (nebA > .01) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        for (const n of this.nebulae) {
          n.x += n.vx + Math.sin(T * .12 + n.seed) * .06; n.y += n.vy + Math.cos(T * .1 + n.seed) * .05;
          n.rot += n.vr;
          if (n.x < -n.r) n.x = w + n.r; if (n.x > w + n.r) n.x = -n.r;
          if (n.y < -n.r) n.y = h + n.r; if (n.y > h + n.r) n.y = -n.r;
          const d = n.r * 2;
          ctx.save();
          ctx.translate(n.x, n.y); ctx.rotate(n.rot); ctx.scale(1, n.sy);
          ctx.globalAlpha = nebA;
          ctx.drawImage(n.img, -n.r, -n.r, d, d);
          ctx.restore();
        }
        ctx.restore();
      }

      // ---- 深空星 + 急行拉丝（精灵贴图）
      const speed = 1 - wp;
      for (const s of this.stars) {
        s.tw += s.tws * .016;
        const tw = .55 + .45 * Math.sin(s.tw);
        if (this.flowTarget) { this.drawFlowStar(ctx, s); continue; }
        if (s.mode === "shatter") { this.drawShatter(ctx, s, T); continue; }
        const a = s.a * tw * (.45 + wp * .55);
        if (a <= .02) continue;
        if (speed > .04) {
          const cx = w / 2, cy = h * .52;
          const dx = s.x - cx, dy = s.y - cy;
          const dl = Math.hypot(dx, dy) || 1;
          const len = Math.min(280, speed * (70 + 190 * s.z));
          const ang = Math.atan2(dy, dx) + Math.PI;
          ctx.save();
          ctx.translate(s.x, s.y); ctx.rotate(ang);
          ctx.globalAlpha = a * .9;
          const wd = Math.max(1, s.r * 1.1);
          ctx.drawImage(this.streakSprite, 0, -wd / 2, len, wd);
          ctx.restore();
        } else {
          const sz = s.r * (2.6 + tw);
          if (sz > 5) {
            ctx.globalAlpha = a;
            ctx.drawImage(this.starSprite, s.x - sz, s.y - sz, sz * 2, sz * 2);
            ctx.globalAlpha = 1;
          }
          if (Math.random() < .5) {
            ctx.fillStyle = `hsla(${s.hue},70%,${88}%,${a})`;
            ctx.beginPath(); ctx.arc(s.x, s.y, Math.max(.5, s.r * .8), 0, U.TAU); ctx.fill();
          }
        }
        if (wp > .9 && Math.random() < 0.0009) { s.mode = "shatter"; s.shatter = 0; }
      }
      ctx.globalAlpha = 1;

      // ---- 行星系（急行时不画）
      if (wp > .18) {
        const pA = U.clamp((wp - .18) / .55, 0, 1);
        this.drawSystem(ctx, T, pA);
      }

      // ---- 大星
      if (wp > .5) this.drawBigStars(ctx, T, (wp - .5) / .5);

      // ---- 字节
      const bA = wp * .9;
      ctx.font = "10px monospace";
      for (const b of this.bytes) {
        b.x += b.vx * (.4 + wp); b.y += b.vy * (.4 + wp);
        if (b.x < -24) b.x = w + 24; if (b.x > w + 24) b.x = -24;
        if (b.y < -24) b.y = h + 24; if (b.y > h + 24) b.y = -24;
        ctx.fillStyle = `hsla(${b.hue},85%,74%,${b.a * bA})`;
        ctx.font = `${b.size}px "Cascadia Mono",monospace`;
        ctx.fillText(b.ch, b.x, b.y);
      }

      // ---- 急行动感：径向暗角 + 速度线
      if (wp < .96) {
        const v = (1 - wp);
        const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .18, w / 2, h / 2, Math.max(w, h) * .72);
        g.addColorStop(0, "rgba(0,0,8,0)");
        g.addColorStop(.7, `rgba(0,2,10,${v * .42})`);
        g.addColorStop(1, `rgba(0,0,6,${v * .82})`);
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      }

      // ---- 白热化
      if (this.white > 0) {
        ctx.fillStyle = `rgba(235,245,255,${this.white})`;
        ctx.fillRect(0, 0, w, h);
      }
      // ---- 外部调暗
      if (this.dim > 0) { ctx.fillStyle = `rgba(1,4,12,${this.dim})`; ctx.fillRect(0, 0, w, h); }
    }

    drawSystem(ctx, T, A) {
      const { W: w, H: h } = this;
      const sun = this.sun;
      sun.rot += .0042;
      const px = w * .5, py = h * .52;

      // 轨道线
      for (const p of this.planets) {
        ctx.save();
        ctx.strokeStyle = `rgba(120,175,255,${.09 * A})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(px, py, p.a, p.b, 0, 0, U.TAU); ctx.stroke();
        ctx.restore();
      }

      // 太阳光晕
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const cg = ctx.createRadialGradient(px, py, sun.r * .3, px, py, sun.r * 12);
      cg.addColorStop(0, `rgba(255,238,196,${.55 * A})`);
      cg.addColorStop(.12, `rgba(255,206,120,${.3 * A})`);
      cg.addColorStop(.42, `rgba(255,150,60,${.1 * A})`);
      cg.addColorStop(1, "rgba(255,120,0,0)");
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(px, py, sun.r * 12, 0, U.TAU); ctx.fill();

      // 日冕射线
      for (let i = 0; i < 26; i++) {
        const a = sun.rot + i / 26 * U.TAU;
        const l = sun.r * (2.1 + 1.5 * Math.abs(Math.sin(T * .7 + i * 1.3)));
        const x2 = px + Math.cos(a) * l, y2 = py + Math.sin(a) * l;
        const lg = ctx.createLinearGradient(px, py, x2, y2);
        lg.addColorStop(0, `rgba(255,226,160,${.24 * A})`);
        lg.addColorStop(1, "rgba(255,190,90,0)");
        ctx.strokeStyle = lg; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(px + Math.cos(a) * sun.r, py + Math.sin(a) * sun.r); ctx.lineTo(x2, y2); ctx.stroke();
      }
      ctx.restore();

      // 太阳：变形镜横向光条 + 鬼影（lens flare）
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const fl = sun.r * 15;
      const air = ctx.createLinearGradient(px - fl, py, px + fl, py);
      air.addColorStop(0, "rgba(120,180,255,0)");
      air.addColorStop(.42, `rgba(190,225,255,${.16 * A})`);
      air.addColorStop(.5, `rgba(255,250,235,${.3 * A})`);
      air.addColorStop(.58, `rgba(190,225,255,${.16 * A})`);
      air.addColorStop(1, "rgba(120,180,255,0)");
      ctx.fillStyle = air;
      ctx.fillRect(px - fl, py - sun.r * .1, fl * 2, sun.r * .2);
      // 沿"日心—画面中心"轴线的鬼影圆
      const ax = w * .5 - px, ay = h * .5 - py;
      for (let i = 1; i <= 4; i++) {
        const k = i * .62;
        const gx = px + ax * k * 1.5, gy = py + ay * k * 1.5;
        const gr = sun.r * (.16 + i * .075);
        const gg = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
        gg.addColorStop(0, `rgba(${i % 2 ? "150,200,255" : "255,214,160"},${.13 * A})`);
        gg.addColorStop(.7, `rgba(180,210,255,${.05 * A})`);
        gg.addColorStop(1, "rgba(180,210,255,0)");
        ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(gx, gy, gr, 0, U.TAU); ctx.fill();
      }
      // 六芒星芒（缓慢旋转）
      ctx.translate(px, py); ctx.rotate(sun.rot * .18);
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * U.TAU;
        const len = sun.r * (3.4 + 1.6 * Math.abs(Math.sin(T * .5 + i)));
        const lg2 = ctx.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
        lg2.addColorStop(0, `rgba(255,244,214,${.3 * A})`);
        lg2.addColorStop(1, "rgba(255,220,150,0)");
        ctx.strokeStyle = lg2; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len); ctx.stroke();
      }
      ctx.restore();

      // 太阳本体
      const sg = ctx.createRadialGradient(px - sun.r * .2, py - sun.r * .2, sun.r * .1, px, py, sun.r);
      sg.addColorStop(0, "#fffdf2"); sg.addColorStop(.5, "#ffe7ad");
      sg.addColorStop(.85, "#ffc063"); sg.addColorStop(1, "#ff9a3c");
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(px, py, sun.r, 0, U.TAU); ctx.fill();

      // 行星
      for (const p of this.planets) {
        p.ang += p.sp;
        const ex = px + Math.cos(p.ang) * p.a;
        const ey = py + Math.sin(p.ang) * p.b;
        const depth = Math.sin(p.ang); // -1..1 前后
        const sc = 1 + depth * .12;
        const rr = p.r * sc;

        // 光环（后半）
        if (p.ring) this.drawRing(ctx, ex, ey, rr, depth < 0, A);

        // 球体：明暗交界
        const litX = px, litY = py;
        const ang2 = Math.atan2(litY - ey, litX - ex);
        const lx = Math.cos(ang2) * rr * .52, ly = Math.sin(ang2) * rr * .52;
        const bg2 = ctx.createRadialGradient(ex + lx, ey + ly, rr * .08, ex, ey, rr);
        bg2.addColorStop(0, `hsl(${p.hue},58%,74%)`);
        bg2.addColorStop(.45, `hsl(${p.hue},52%,44%)`);
        bg2.addColorStop(1, `hsl(${p.hue},58%,9%)`);
        ctx.fillStyle = bg2; ctx.beginPath(); ctx.arc(ex, ey, rr, 0, U.TAU); ctx.fill();

        // 云带 / 地表纹理：裁到球体内画几道明暗条
        ctx.save();
        ctx.beginPath(); ctx.arc(ex, ey, rr, 0, U.TAU); ctx.clip();
        ctx.globalAlpha = .5;
        for (let b = 0; b < 5; b++) {
          const by = ey - rr + (rr * 2) * ((b + .5) / 5) + Math.sin(T * .12 + b + p.hue) * rr * .04;
          const bh = rr * (.1 + .07 * Math.abs(Math.sin(b * 1.7 + p.hue)));
          const bgrd = ctx.createLinearGradient(ex - rr, by, ex + rr, by);
          bgrd.addColorStop(0, `hsla(${p.hue + 12},58%,${72 - b * 4}%,0)`);
          bgrd.addColorStop(.35, `hsla(${p.hue + 12},58%,${72 - b * 4}%,${.3 + .1 * Math.sin(b)})`);
          bgrd.addColorStop(.68, `hsla(${p.hue - 8},48%,${38 + b * 3}%,${.26})`);
          bgrd.addColorStop(1, `hsla(${p.hue},48%,30%,0)`);
          ctx.fillStyle = bgrd;
          ctx.beginPath(); ctx.ellipse(ex, by, rr * 1.4, bh, 0, 0, U.TAU); ctx.fill();
        }
        // 极地亮冠
        ctx.globalAlpha = .4;
        const pgl = ctx.createRadialGradient(ex, ey - rr * .82, 0, ex, ey - rr * .82, rr * .5);
        pgl.addColorStop(0, `hsla(${p.hue},80%,92%,.5)`);
        pgl.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = pgl; ctx.beginPath(); ctx.arc(ex, ey - rr * .82, rr * .5, 0, U.TAU); ctx.fill();
        ctx.restore();

        // 晨昏线（用一条硬朗的暗弧强化体积）
        ctx.save();
        ctx.beginPath(); ctx.arc(ex, ey, rr, 0, U.TAU); ctx.clip();
        const tgl = ctx.createLinearGradient(ex + lx * 1.9, ey + ly * 1.9, ex - lx * 1.1, ey - ly * 1.1);
        tgl.addColorStop(0, "rgba(0,0,10,0)");
        tgl.addColorStop(.52, "rgba(2,4,14,.1)");
        tgl.addColorStop(.78, `rgba(2,4,14,${.72 * A})`);
        tgl.addColorStop(1, "rgba(0,2,8,.94)");
        ctx.fillStyle = tgl; ctx.beginPath(); ctx.arc(ex, ey, rr, 0, U.TAU); ctx.fill();
        // 高光
        const spec = ctx.createRadialGradient(ex + lx * 1.25, ey + ly * 1.25, 0, ex + lx * 1.25, ey + ly * 1.25, rr * .55);
        spec.addColorStop(0, `rgba(255,255,245,${.3 * A})`);
        spec.addColorStop(1, "rgba(255,255,245,0)");
        ctx.fillStyle = spec; ctx.beginPath(); ctx.arc(ex, ey, rr, 0, U.TAU); ctx.fill();
        ctx.restore();

        // 大气辉光
        ctx.save(); ctx.globalCompositeOperation = "screen";
        const ag = ctx.createRadialGradient(ex, ey, rr * .9, ex, ey, rr * 1.9);
        ag.addColorStop(0, `hsla(${p.hue},90%,72%,${.2 * A})`);
        ag.addColorStop(1, `hsla(${p.hue},90%,60%,0)`);
        ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(ex, ey, rr * 1.9, 0, U.TAU); ctx.fill();
        ctx.restore();

        // 卫星
        for (const m of p.moons) {
          m.ang += m.sp;
          const mx = ex + Math.cos(m.ang) * m.a, my = ey + Math.sin(m.ang) * m.a * .45;
          ctx.fillStyle = `rgba(210,222,240,${.9 * A})`;
          ctx.beginPath(); ctx.arc(mx, my, Math.max(1, m.r * sc), 0, U.TAU); ctx.fill();
          ctx.strokeStyle = `rgba(150,190,240,${.14 * A})`; ctx.lineWidth = .8;
          ctx.beginPath(); ctx.ellipse(ex, ey, m.a, m.a * .45, 0, 0, U.TAU); ctx.stroke();
        }

        if (p.ring) this.drawRing(ctx, ex, ey, rr, depth >= 0, A);
      }
    }

    drawRing(ctx, cx, cy, r, front, A) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, .26);
      ctx.rotate(-.28);
      ctx.beginPath();
      if (front) ctx.arc(0, 0, r * 1.72, 0, Math.PI);
      else ctx.arc(0, 0, r * 1.72, Math.PI, U.TAU);
      ctx.strokeStyle = `rgba(226,206,168,${.5 * A})`;
      ctx.lineWidth = Math.max(4, r * .22);
      ctx.stroke();
      ctx.beginPath();
      if (front) ctx.arc(0, 0, r * 1.44, 0, Math.PI);
      else ctx.arc(0, 0, r * 1.44, Math.PI, U.TAU);
      ctx.strokeStyle = `rgba(255,236,196,${.26 * A})`;
      ctx.lineWidth = Math.max(2, r * .1);
      ctx.stroke();
      ctx.restore();
    }

    drawBigStars(ctx, T, A) {
      const w = this.W, h = this.H;
      for (const s of this.bigStars) {
        s.t += .016;
        // 光板加速
        if (s.panels > 0) {
          s.boostT += .016;
          s.ax += Math.cos(s.t * 4.2) * .9 * s.boost;
          s.ay += Math.sin(s.t * 3.6) * .9 * s.boost;
          if (s.boostT > s.boostDur) {
            s.panels = Math.max(0, s.panels - .02);
            s.boost = Math.max(0, s.boost - .03);
          }
        } else {
          s.ax *= .97; s.ay *= .97;
          s.boostT = 0;
        }
        const x = s.x + s.ax, y = s.y + s.ay;
        s.tw += s.tws * .016;
        const tw = .6 + .4 * Math.sin(s.tw);
        const a = A * (.55 + .45 * tw);

        if (s.mode === "shatter") {
          this.drawShatter(ctx, Object.assign({}, s, { x: x, y: y }), T, true);
          s.shatter += .022;
          if (s.shatter >= 1) { s.mode = "on"; s.shatter = 0; }
          continue;
        }
        // 光板
        if (s.panels > 0) this.drawPanels(ctx, x, y, s.r, s.t, s.panels, a);
        // 本体
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        U.glowCircle(ctx, x, y, s.r * 7, "150,205,255", .34 * a);
        ctx.restore();
        const grd = ctx.createRadialGradient(x - s.r * .25, y - s.r * .25, 0, x, y, s.r);
        grd.addColorStop(0, `hsla(${s.hue},100%,99%,${a})`);
        grd.addColorStop(.6, `hsla(${s.hue},95%,84%,${a})`);
        grd.addColorStop(1, `hsla(${s.hue},90%,68%,0)`);
        ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(x, y, s.r, 0, U.TAU); ctx.fill();
        // 十字星芒
        ctx.save(); ctx.globalCompositeOperation = "screen";
        const sl = s.r * (4 + 2 * tw);
        for (const ang of [0, Math.PI / 2]) {
          const lg = ctx.createLinearGradient(x - Math.cos(ang) * sl, y - Math.sin(ang) * sl, x + Math.cos(ang) * sl, y + Math.sin(ang) * sl);
          lg.addColorStop(0, "rgba(200,230,255,0)");
          lg.addColorStop(.5, `rgba(235,246,255,${a * .8})`);
          lg.addColorStop(1, "rgba(200,230,255,0)");
          ctx.strokeStyle = lg; ctx.lineWidth = 1.1;
          ctx.beginPath(); ctx.moveTo(x - Math.cos(ang) * sl, y - Math.sin(ang) * sl);
          ctx.lineTo(x + Math.cos(ang) * sl, y + Math.sin(ang) * sl); ctx.stroke();
        }
        ctx.restore();
        if (A > .4 && Math.random() < .0012) { s.mode = "shatter"; s.shatter = 0; s.frags = null; }
      }
    }

    drawPanels(ctx, x, y, r, t, alpha, a) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, alpha) * a;
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.translate(x + side * r * 2.6, y);
        ctx.rotate(side * .42 + Math.sin(t * 1.6) * .05);
        const pw = r * 3.4, ph = r * 1.15;
        const g = ctx.createLinearGradient(-pw / 2, 0, pw / 2, 0);
        g.addColorStop(0, "#0d2b57"); g.addColorStop(.5, "#1d5ba8"); g.addColorStop(1, "#0a1f40");
        ctx.fillStyle = g;
        U.roundRect(ctx, -pw / 2, -ph / 2, pw, ph, 1.2); ctx.fill();
        ctx.strokeStyle = "rgba(120,190,255,.85)"; ctx.lineWidth = .8; ctx.stroke();
        // 电池格
        ctx.strokeStyle = "rgba(90,160,240,.5)"; ctx.lineWidth = .6;
        for (let i = 1; i < 4; i++) {
          const gx = -pw / 2 + pw * i / 4;
          ctx.beginPath(); ctx.moveTo(gx, -ph / 2); ctx.lineTo(gx, ph / 2); ctx.stroke();
        }
        // 支架
        ctx.strokeStyle = "rgba(160,205,255,.7)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-side * pw / 2, 0); ctx.lineTo(side * -r * .6, 0); ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }

    drawShatter(ctx, s, T, fromBig) {
      const p = s.shatter;
      const out = U.easeOut(Math.min(1, p * 1.4));
      const fade = 1 - Math.max(0, (p - .55) / .45);
      const n = 9;
      ctx.save();
      ctx.globalAlpha = fade;
      for (let i = 0; i < n; i++) {
        const ang = i / n * U.TAU + (fromBig ? s.r : 0);
        const d = out * (8 + i % 3 * 5);
        const sz = Math.max(1, (fromBig ? s.r * .42 : 1.8) * (1 - out * .5));
        ctx.fillStyle = `hsla(${s.hue || 210},95%,${86 - out * 20}%,${fade})`;
        ctx.fillRect(s.x + Math.cos(ang) * d - sz / 2, s.y + Math.sin(ang) * d - sz / 2, sz, sz);
      }
      ctx.restore();
    }

    drawFlowStar(ctx, s) {
      const T = this.flowTarget;
      s.fx = s.fx == null ? s.x : s.fx;
      s.fy = s.fy == null ? s.y : s.fy;
      s.fx += (T.x - s.fx) * T.pull * (0.6 + s.z * .8);
      s.fy += (T.y - s.fy) * T.pull * (0.6 + s.z * .8);
      const d = Math.hypot(T.x - s.fx, T.y - s.fy);
      const a = Math.min(1, d / 120) * .95;
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      if (d > 16) {
        const lg = ctx.createLinearGradient(s.fx, s.fy, s.fx + (T.x - s.fx) * .12, s.fy + (T.y - s.fy) * .12);
        lg.addColorStop(0, `hsla(${s.hue},95%,88%,${a})`);
        lg.addColorStop(1, `hsla(${s.hue},95%,70%,0)`);
        ctx.strokeStyle = lg; ctx.lineWidth = Math.max(.8, s.r * .8);
        ctx.beginPath(); ctx.moveTo(s.fx, s.fy);
        ctx.lineTo(s.fx + (T.x - s.fx) * .12, s.fy + (T.y - s.fy) * .12); ctx.stroke();
      }
      ctx.fillStyle = `rgba(235,246,255,${a})`;
      ctx.beginPath(); ctx.arc(s.fx, s.fy, Math.max(.6, s.r * .8), 0, U.TAU); ctx.fill();
      ctx.restore();
    }

    /* 点击大星：加装太阳能光板并加速 */
    hitTest(x, y) {
      let best = null, bd = 1e9;
      for (const s of this.bigStars) {
        const d = Math.hypot(x - (s.x + s.ax), y - (s.y + s.ay));
        if (d < Math.max(30, s.r * 5) && d < bd) { bd = d; best = s; }
      }
      return best;
    }
    boost(star) {
      star.boost = 1;
      star.panels = 1;
      star.boostDur = U.rand(3, 6);
      star.boostT = 0;
    }
  }

  /* ================================================================
   * 书卷
   * ================================================================ */
  const BOOK = { sheets: [], N: 0, idx: 0, flipping: false };

  function faceHTML(kind, item, side, pageNo) {
    const cls = "face" + (side === "back" ? " back" : "");
    if (kind === "cover") {
      return `<div class="${cls}"><div class="cover">
        <img class="emb" src="${encodeURI(D.EMBLEM)}" alt="河海大学校徽">
        <img class="nm" src="${encodeURI(D.EMBLEM_NAME)}" alt="河海大学">
        <div class="cc">百十一年 · 治水兴邦</div>
        <div class="ct">THE 111TH ANNIVERSARY · AI ERA</div>
        <div class="c111">时代的命题从未止息</div>
      </div><div class="shade"></div></div>`;
    }
    if (kind === "alumni") {
      return `<div class="${cls}"><div class="leaf">
        <div class="stamp">名贤</div>
        <div class="photo-mount"><div class="pm-frame" data-entry="hall" data-name="${U.esc(item.name)}">
          <img src="${encodeURI(item.image)}" alt="${U.esc(item.name)}" draggable="false"></div></div>
        <div class="pm-cap"><div class="n">${U.esc(item.name)}</div>
          <div class="y">${U.esc(item.years)}</div>
          <div class="t">${U.esc(item.title || "")}</div></div>
        <div class="no ${side === "back" ? "l" : "r"}">${pageNo}</div>
      </div><div class="shade"></div></div>`;
    }
    if (kind === "building") {
      return `<div class="${cls}"><div class="leaf">
        <div class="stamp">水利</div>
        <div class="photo-mount"><div class="pm-frame" data-entry="water" data-name="${U.esc(item.name)}">
          <img src="${encodeURI(item.image)}" alt="${U.esc(item.name)}" draggable="false"></div></div>
        <div class="pm-cap"><div class="n">${U.esc(item.name)}</div>
          <div class="y">${U.esc(item.sub || "")}</div>
          <div class="t">${U.esc(item.year || "")} · 大国重器</div></div>
        <div class="no ${side === "back" ? "l" : "r"}">${pageNo}</div>
      </div><div class="shade"></div></div>`;
    }
    if (kind === "fly") {
      return `<div class="${cls}"><div class="leaf fly">
        <div class="fly-title">时代的命题从未止息</div>
        <div class="fly-body">江河不息，因源头有雪山之诺；<br>弦歌不辍，因浪尖有掌灯之人。<br><br>
        当算法的潮水漫过百年堤岸，<br>我们仍以水的方式思考——<br>汇流、蓄势、穿峡、入海。</div>
        <div class="fly-sign">河海大学 · 一九一五 — 二〇二六</div>
        <div class="no r">序</div>
      </div><div class="shade"></div></div>`;
    }
    if (kind === "dream") {
      return `<div class="${cls}"><div class="dream">
        <div id="dream-text">寻梦河海</div>
        <div id="dream-sub">CLICK TO ENTER · 河海大学 · 一百一十一载</div>
        <div id="dream-hand">
          江河是流动的文明，<br>
          治理是永续的<span class="gl" data-c="使命">使命</span>
        </div>
      </div><div class="shade"></div></div>`;
    }
    return `<div class="${cls}"><div class="leaf"><div class="no">${pageNo}</div></div><div class="shade"></div></div>`;
  }

  function buildBook(stage, bookEl) {
    const items = [];
    D.ALUMNI.forEach(a => items.push({ kind: "alumni", data: a }));
    D.BUILDINGS.forEach(b => items.push({ kind: "building", data: b }));

    const rim = U.el("div", "book-rim");
    bookEl.appendChild(rim);
    const sheets = [];
    let pageNo = 1;
    // 封面（右半页显示，通过 stage 偏移实现"合上的书"）
    const cover = U.el("div", "sheet half");
    cover.innerHTML = `<div class="sheet-inner">${faceHTML("cover", null, "front", "")}${faceHTML("fly", null, "back", "")}</div>`;
    bookEl.appendChild(cover); sheets.push(cover);

    for (let i = 0; i < items.length; i += 2) {
      const a = items[i], b = items[i + 1];
      const s = U.el("div", "sheet half");
      const front = faceHTML(a.kind, a.data, "front", String(pageNo).padStart(2, "0"));
      const back = b ? faceHTML(b.kind, b.data, "back", String(pageNo + 1).padStart(2, "0"))
                     : faceHTML("blank", null, "back", "");
      s.innerHTML = `<div class="sheet-inner">${front}${back}</div>`;
      bookEl.appendChild(s); sheets.push(s);
      pageNo += 2;
    }
    // 末页（整幅）
    const dream = U.el("div", "sheet full");
    dream.innerHTML = `<div class="sheet-inner">${faceHTML("dream", null, "front", "")}</div>`;
    bookEl.appendChild(dream); sheets.push(dream);

    BOOK.sheets = sheets;
    BOOK.N = sheets.length;
    BOOK.idx = 0;
    layoutBook(stage);
    renderBook();
  }

  function layoutBook(stage) {
    const vw = window.innerWidth, vh = window.innerHeight;
    const maxW = Math.min(vw * .9, 1120);
    const maxH = Math.min(vh * .56, 660);
    let w = maxW, h = w / 1.52;
    if (h > maxH) { h = maxH; w = h * 1.52; }
    stage.style.setProperty("--bw", w + "px");
    stage.style.width = w + "px";
    stage.style.height = h + "px";
    stage.style.top = (vh < 760 ? "60%" : "61.5%") + "%";
  }

  function renderBook() {
    const N = BOOK.N;
    const dreamIdx = N - 1;
    // 三星层共享一个 preserve-3d 渲染上下文时 z-index 不可靠，
    // 因此只显示"当前跨页"涉及的两张纸：彻底避免 3D 排序错乱。
    BOOK.sheets.forEach((s, i) => {
      const flipped = i < BOOK.idx;
      s.classList.toggle("flipped", flipped);
      const visible = (i === BOOK.idx) || (i === BOOK.idx - 1) || (s._anim === true);
      s.style.display = visible ? "" : "none";
      if (s._anim) return;
      s.style.transform = flipped ? "rotateY(-180deg)" : "rotateY(0deg)";
      let z;
      if (flipped) z = 300 + i;
      else z = 200 + (N - i);
      if (i === dreamIdx && BOOK.idx >= dreamIdx) z = 400;
      s.style.zIndex = String(z);
      s.style.pointerEvents = visible ? "auto" : "none";
    });
    const dream = BOOK.sheets[dreamIdx];
    if (BOOK.idx >= dreamIdx) {
      if (dream.dataset.revealed === "1") return;
      dream.dataset.revealed = "1";
      dream.style.animation = "none";
      void dream.offsetWidth;
      dream.style.animation = "dreamReveal 1.5s cubic-bezier(.2,.8,.2,1) both";
    } else {
      dream.dataset.revealed = "";
      dream.style.animation = "";
    }
  }

  // 带真实翻书感的翻页（JS 逐帧控制角度 + 明暗 + 弯曲）
  function flipTo(target, life, cb, fast) {
    const N = BOOK.N;
    target = U.clamp(target, 0, N - 1);
    if (target === BOOK.idx || BOOK.flipping) { if (cb) cb(); return; }
    const dir = target > BOOK.idx ? 1 : -1;
    const from = BOOK.idx, to = target;
    const steps = Math.abs(to - from);
    let step = 0;
    BOOK.flipping = true;
    const stage = document.getElementById("book-stage");

    function one() {
      if (life.dead) { BOOK.flipping = false; return; }
      if (dir > 0) {
        // 前翻：当前 sheet 从 0 → -180
        const i = BOOK.idx;
        const s = BOOK.sheets[i];
        s.style.zIndex = "900"; s._anim = true;
        const dur = fast ? 180 : 560;
        const t0 = performance.now();
        const anim = () => {
          if (life.dead) return;
          const p = Math.min(1, (performance.now() - t0) / dur);
          const e = U.easeInOut(p);
          const ang = -180 * e;
          s.style.transform = `rotateY(${ang}deg)`;
          const sh = s.querySelector(".shade");
          if (sh) sh.style.opacity = String(.4 + Math.sin(p * Math.PI) * .35);
          if (p < 1) requestAnimationFrame(anim);
          else {
            BOOK.idx = i + 1; s._anim = false;
            renderBook();
            // 末页出现
            if (BOOK.idx >= BOOK.N - 1 && stage) stage.classList.remove("closed");
            step++;
            if (step < steps) setTimeout(one, 26); else { BOOK.flipping = false; cb && cb(); }
          }
        };
        requestAnimationFrame(anim);
      } else {
        // 后翻：上一 sheet 从 -180 → 0
        const i = BOOK.idx - 1;
        const s = BOOK.sheets[i];
        s.style.zIndex = "900"; s._anim = true;
        const dur = fast ? 180 : 520;
        const t0 = performance.now();
        const anim = () => {
          if (life.dead) return;
          const p = Math.min(1, (performance.now() - t0) / dur);
          const e = U.easeInOut(p);
          s.style.transform = `rotateY(${-180 + 180 * e}deg)`;
          const sh = s.querySelector(".shade");
          if (sh) sh.style.opacity = String(.4 + Math.sin((1 - p) * Math.PI) * .35);
          if (p < 1) requestAnimationFrame(anim);
          else {
            BOOK.idx = i; s._anim = false;
            renderBook();
            step++;
            if (step < steps) setTimeout(one, 26); else { BOOK.flipping = false; cb && cb(); }
          }
        };
        requestAnimationFrame(anim);
      }
    }
    one();
  }

  /* ================================================================
   * 流光文字特效
   * ================================================================ */
  function attachTrail(mount) {
    const frame = mount.querySelector(".pm-frame");
    const img = frame && frame.querySelector("img");
    if (!img) return;
    const name = frame.dataset.name;
    const isHall = frame.dataset.entry === "hall";
    const al = isHall ? D.ALUMNI.find(a => a.name === name) : null;
    const bd = !isHall ? D.BUILDINGS.find(b => b.name === name) : null;
    const text = isHall
      ? (al.intro + "　" + (al.quote ? "「" + al.quote + "」" : ""))
      : (bd ? bd.intro : "");

    const leaf = mount.closest(".leaf");
    const cv = U.el("canvas", "trail-cv");
    leaf.appendChild(cv);
    const ctx = cv.getContext("2d");

    const ST = {
      phase: "idle",   // idle | trace | seep | holding | retract
      p: 0,            // 0..1 进度
      traced: false,
      hover: false,
      dust: [],
      textLayer: null,
      tw: 0, th: 0,
      font: 11,
      lineH: 0,
      rect: null,
    };
    for (let i = 0; i < 46; i++) {
      ST.dust.push({ x: Math.random(), y: Math.random(), vx: U.rand(-.35, .35), vy: U.rand(-.3, .3),
        a: U.rand(.3, 1), s: U.rand(.8, 1.9), px: Math.random(), py: Math.random() });
    }

    function measure() {
      const fr = frame.getBoundingClientRect();
      const lf = leaf.getBoundingClientRect();
      if (fr.width < 20 || lf.width < 20) { ST.rect = null; return; }
      const left = fr.left - lf.left, top = fr.top - lf.top;
      const w = fr.width, h = fr.height;
      const textTop = top + h + Math.max(6, h * .03);
      const availH = lf.height - textTop - lf.height * .045;
      const availW = Math.min(lf.width * .94, w + lf.width * .3);
      const pad = 10;
      cv.width = Math.round((availW + pad * 2) * U.DPR());
      cv.height = Math.round((h + (availH > 40 ? availH : 2)) * U.DPR());
      cv.style.width = (availW + pad * 2) + "px";
      cv.style.height = (cv.height / U.DPR()) + "px";
      cv.style.left = (left - pad) + "px";
      cv.style.top = top + "px";
      ST.rect = { left, top, w, h, textTop, availH: Math.max(30, availH), availW, pad };
      buildTextLayer();
    }

    function buildTextLayer() {
      const { w, h, textTop, availH, availW, pad } = ST.rect;
      // 自适应字号
      let fs = 11.5, lines = [];
      const c = document.createElement("canvas");
      const cx = c.getContext("2d");
      for (let k = 0; k < 7; k++) {
        cx.font = `${fs}px ${getComputedStyle(document.body).fontFamily}`;
        const maxW = w * .96;
        lines = wrap(text, fs, cx, maxW);
        const need = lines.length * fs * 1.62;
        if (need <= ST.rect.availH && fs >= 8) break;
        fs -= .6;
      }
      ST.font = fs;
      ST.lineH = fs * 1.62;
      const bw = Math.round(w + pad * 2);
      const bh = Math.round(h + (ST.rect.availH || 30) + pad);
      const lay = U.mkCanvas(bw * U.DPR(), bh * U.DPR());
      const lc = lay.getContext("2d");
      lc.setTransform(U.DPR(), 0, 0, U.DPR(), 0, 0);
      lc.clearRect(0, 0, bw, bh);

      // 连接细光线的位置：字中心
      const centers = [];
      lc.font = `${fs}px ${getComputedStyle(document.body).fontFamily}`;
      lc.textBaseline = "top";
      let y = textTop - ST.rect.top;
      const startX = pad + (w - w * .96) / 2;
      lines.forEach((line) => {
        // 逐字绘制以记录中心
        let x = startX + (w * .96 - lc.measureText(line).width) / 2;
        for (const ch of line) {
          const cw = lc.measureText(ch).width;
          centers.push({ x: x + cw / 2, y: y + ST.lineH * .42 });
          x += cw;
        }
        y += ST.lineH;
      });
      // 细光线（比字体更细）
      lc.strokeStyle = "rgba(70,150,235,.5)";
      lc.lineWidth = .55;
      for (let i = 1; i < centers.length; i++) {
        const a = centers[i - 1], b = centers[i];
        if (Math.abs(a.y - b.y) > 2) continue;
        lc.beginPath(); lc.moveTo(a.x, a.y); lc.lineTo(b.x, b.y); lc.stroke();
      }
      // 文字
      y = textTop - ST.rect.top;
      lines.forEach((line) => {
        const lw = lc.measureText(line).width;
        lc.fillStyle = "rgba(22,72,130,.97)";
        lc.shadowColor = "rgba(96,180,255,.95)";
        lc.shadowBlur = 9;
        lc.fillText(line, startX + (w * .96 - lw) / 2, y);
        y += ST.lineH;
      });
      lc.shadowBlur = 0;

      ST.textLayer = lay;
      ST.mask = U.mkCanvas(lay.width, lay.height);
      ST.textW = bw; ST.textH = bh;
      ST.maskTop = textTop - ST.rect.top;
    }

    function wrap(t, fs, cx, maxW) {
      cx.font = `${fs}px ${getComputedStyle(document.body).fontFamily}`;
      const out = [];
      let line = "";
      for (const ch of t) {
        if (ch === "\n") { out.push(line); line = ""; continue; }
        if (cx.measureText(line + ch).width > maxW && line) { out.push(line); line = ch; }
        else line += ch;
      }
      if (line) out.push(line);
      return out;
    }

    // 四边周长取点
    function perimeter(u, w, h, pad) {
      const x0 = pad, y0 = 0, ww = w, hh = h;
      const P = 2 * (ww + hh);
      let d = ((u % 1) + 1) % 1 * P;
      if (d < ww) return { x: x0 + d, y: y0, side: 0 };
      d -= ww;
      if (d < hh) return { x: x0 + ww, y: y0 + d, side: 1 };
      d -= hh;
      if (d < ww) return { x: x0 + ww - d, y: y0 + hh, side: 2 };
      d -= ww;
      return { x: x0, y: y0 + hh - d, side: 3 };
    }

    let raf = 0, last = 0, perf = 0;
    function loop(ts) {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(48, ts - (last || ts)); last = ts;
      perf += dt;
      if (!ST.rect) return;
      drawFrame(dt);
    }
    function drawFrame(dt) {
      const { w, h, pad } = ST.rect;
      const dpr = U.DPR();
      const W = cv.width / dpr, H = cv.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const active = ST.phase !== "idle" || ST.traced;
      if (!active) return;

      // ---- 进度推进
      if (ST.phase === "trace") {
        ST.p = Math.min(1, ST.p + dt / 780);
        if (ST.p >= 1) { ST.phase = "seep"; ST.p = 0; }
      } else if (ST.phase === "seep") {
        ST.p = Math.min(1, ST.p + dt / 1150);
        if (ST.p >= 1) { ST.phase = "holding"; ST.p = 1; ST.traced = true; }
      } else if (ST.phase === "retract") {
        ST.p = Math.max(0, ST.p - dt / 620);
        if (ST.p <= 0) { ST.phase = "holding"; }
      } else if (ST.phase === "holding" && !ST.hover && ST.p >= 1) {
        // 保持
      }

      // ---- 照片四边光路
      const ringA = ST.traced ? (ST.hover ? .95 : .5) : .9;
      const segs = 120;
      const upto = ST.phase === "trace" ? ST.p : (ST.phase === "retract" ? ST.p : 1);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      // 轨道底光
      ctx.strokeStyle = `rgba(90,150,235,${.16 * ringA})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      for (let i = 0; i <= segs; i++) {
        const p = perimeter(i / segs, w, h, pad);
        i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
      }
      ctx.closePath(); ctx.stroke();
      // 已走过的光轨
      if (upto > 0) {
        for (const off of [0, .5]) {
          ctx.strokeStyle = `rgba(170,225,255,${.85 * ringA})`;
          ctx.lineWidth = 1.9;
          ctx.shadowColor = "rgba(120,200,255,.95)"; ctx.shadowBlur = 9;
          ctx.beginPath();
          const n = Math.max(2, Math.floor(segs * Math.min(1, upto)));
          for (let i = 0; i <= n; i++) {
            const u = off + (i / segs) * Math.min(1, upto);
            const p = perimeter(u, w, h, pad);
            i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
          }
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
        // 两个光点
        if (ST.phase !== "holding") {
          for (const off of [0, .5]) {
            const p = perimeter(off + upto * .5, w, h, pad);
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 11);
            g.addColorStop(0, "rgba(255,255,255,.98)");
            g.addColorStop(.35, "rgba(160,215,255,.85)");
            g.addColorStop(1, "rgba(80,150,255,0)");
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 11, 0, U.TAU); ctx.fill();
          }
        }
      }
      ctx.restore();

      // ---- 文字：光向下渗
      if (ST.textLayer && ST.mask && (ST.phase === "seep" || ST.phase === "holding" || ST.phase === "retract")) {
        const seepP = ST.phase === "seep" ? ST.p : (ST.phase === "retract" ? ST.p : 1);
        const top = ST.maskTop;
        const textH = ST.textH - top;
        const cut = top + textH * seepP;
        const off = ST.mask;
        const oc = off.getContext("2d");
        oc.setTransform(1, 0, 0, 1, 0, 0);
        oc.globalCompositeOperation = "source-over";
        oc.clearRect(0, 0, off.width, off.height);
        oc.drawImage(ST.textLayer, 0, 0);
        oc.globalCompositeOperation = "destination-in";
        const gy0 = cut - textH * .34, gy1 = cut + 4;
        const lg = oc.createLinearGradient(0, gy0, 0, gy1);
        lg.addColorStop(0, "rgba(255,255,255,1)");
        lg.addColorStop(1, "rgba(255,255,255,0)");
        oc.fillStyle = lg;
        oc.fillRect(0, 0, off.width, Math.max(0, cut * U.DPR()));
        oc.globalCompositeOperation = "source-over";
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.drawImage(off, 0, 0, ST.textW, ST.textH);
        // 渗流前沿的亮线
        if (seepP < .995) {
          const lw = ST.rect.w * .96;
          const fx = (ST.textW - lw) / 2;
          const y = top + textH * seepP;
          const lgr = ctx.createLinearGradient(fx, 0, fx + lw, 0);
          lgr.addColorStop(0, "rgba(140,205,255,0)");
          lgr.addColorStop(.5, "rgba(220,242,255,.9)");
          lgr.addColorStop(1, "rgba(140,205,255,0)");
          ctx.strokeStyle = lgr; ctx.lineWidth = 1.2;
          ctx.shadowColor = "rgba(150,210,255,.9)"; ctx.shadowBlur = 10;
          ctx.beginPath(); ctx.moveTo(fx, y); ctx.lineTo(fx + lw, y); ctx.stroke();
          ctx.shadowBlur = 0;
        }
        ctx.restore();
      }

      // ---- 光尘（照片周围 + 光线周围）
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const d of ST.dust) {
        d.px += d.vx * .018 * (dt / 16); d.py += d.vy * .018 * (dt / 16);
        if (d.px < -.05) d.px = 1.05; if (d.px > 1.05) d.px = -.05;
        if (d.py < -.05) d.py = 1.05; if (d.py > 1.05) d.py = -.05;
        const dx = pad + d.px * w, dy = d.py * (h + 40);
        const a = d.a * (ST.hover ? .85 : .42) * (.5 + .5 * Math.sin(perf * .001 + d.a * 10));
        ctx.fillStyle = `rgba(200,232,255,${a * .8})`;
        ctx.fillRect(dx, dy, d.s, d.s);
      }
      ctx.restore();
    }

    // 事件
    frame.addEventListener("mouseenter", () => {
      ST.hover = true;
      measure();
      const cap = leaf.querySelector(".pm-cap");
      if (cap) { cap.style.transition = "opacity .45s ease"; cap.style.opacity = "0"; }
      if (!ST.rect || ST.rect.w < 20) return;
      if (ST.phase === "idle" || ST.phase === "retract") {
        if (!ST.traced) { ST.phase = "trace"; ST.p = 0; }
        else { ST.phase = "holding"; ST.p = 1; }
      }
    });
    frame.addEventListener("mouseleave", () => {
      ST.hover = false;
      const cap = leaf.querySelector(".pm-cap");
      if (cap) cap.style.opacity = "";
      if (ST.phase === "seep" || ST.phase === "holding") { ST.phase = "retract"; ST.p = Math.min(1, ST.p); }
      else if (ST.phase === "trace") { ST.phase = "retract"; }
    });
    queueMicrotask(() => { measure(); raf = requestAnimationFrame(loop); });
    return () => cancelAnimationFrame(raf);
  }
  const trailStops = [];
  function bindTrails() {
    trailStops.forEach(f => { try { f(); } catch (e) {} });
    trailStops.length = 0;
    document.querySelectorAll("#page-init .trail-cv").forEach(c => c.remove());
    document.querySelectorAll("#page-init .pm-frame").forEach(fr => {
      const stop = attachTrail(fr.closest(".photo-mount"));
      if (stop) trailStops.push(stop);
    });
  }

  /* ================================================================
   * 转场特效（entry-fx 画布）
   * ================================================================ */
  function makeEntryFx(canvas) {
    const ctx = canvas.getContext("2d");
    let raf = 0, running = false, scene = null;
    function size() {
      const dpr = U.DPR();
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w: canvas.clientWidth, h: canvas.clientHeight };
    }
    function start(kind, payload) {
      const { w, h } = size();
      running = true;
      const t0 = performance.now();
      const parts = payload.parts || [];
      const streaks = payload.streaks || [];
      function loop(ts) {
        if (!running) return;
        const p = Math.max(0, Math.min(1, (ts - t0) / payload.dur));
        ctx.clearRect(0, 0, w, h);
        scene = kind;
        if (kind === "day") drawDay(p, w, h);
        else if (kind === "night") drawNight(p, w, h, parts, streaks);
        else if (kind === "dusk") drawDusk(p, w, h, streaks);
        if (p < 1) raf = requestAnimationFrame(loop);
        else { running = false; ctx.clearRect(0, 0, w, h); payload.done && payload.done(); }
      }
      raf = requestAnimationFrame(loop);
    }
    function stop() { running = false; cancelAnimationFrame(raf); ctx.clearRect(0, 0, canvas.width, canvas.height); }

    function drawDay(p, w, h) {
      // 群星白热化 + 光晕扩散
      const a = Math.min(1, p * 1.5);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(w / 2, h * .45, 0, w / 2, h * .45, Math.max(w, h) * (.2 + p * .9));
      g.addColorStop(0, `rgba(255,255,255,${.92 * a})`);
      g.addColorStop(.35, `rgba(210,232,255,${.5 * a})`);
      g.addColorStop(1, "rgba(160,205,255,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.restore();
      // 白色冲击波环
      const rr = p * Math.max(w, h) * .95;
      ctx.strokeStyle = `rgba(255,255,255,${(1 - p) * .8})`;
      ctx.lineWidth = 2 + (1 - p) * 10;
      ctx.beginPath(); ctx.arc(w / 2, h * .45, rr, 0, U.TAU); ctx.stroke();
      // 收尾全白
      if (p > .72) { ctx.fillStyle = `rgba(255,255,255,${(p - .72) / .28})`; ctx.fillRect(0, 0, w, h); }
    }

    function drawNight(p, w, h, parts, streaks) {
      // 1) 星流汇入"梦"字
      if (p < .55) {
        const q = p / .55;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        for (const s of streaks) {
          const e = U.easeInOut(q);
          const x = s.x + (s.tx - s.x) * e;
          const y = s.y + (s.ty - s.y) * e;
          const sc = 1 - e * .78;
          ctx.strokeStyle = `rgba(180,220,255,${(1 - e * .5) * .8})`;
          ctx.lineWidth = Math.max(.5, 1.6 * sc);
          ctx.beginPath(); ctx.moveTo(x, y);
          ctx.lineTo(x + (s.tx - x) * .1, y + (s.ty - y) * .1); ctx.stroke();
          ctx.fillStyle = `rgba(240,250,255,${1 - e * .3})`;
          ctx.beginPath(); ctx.arc(x, y, Math.max(.5, 1.5 * sc), 0, U.TAU); ctx.fill();
        }
        ctx.restore();
      }
      // 2) 书页一页页飞扬变星
      if (p > .18 && p < .92) {
        const q = U.clamp((p - .18) / .74, 0, 1);
        for (const s of parts) {
          const t = U.clamp(q * 1.4 - s.delay * .4, 0, 1);
          if (t <= 0) continue;
          const e = U.easeOut(t);
          const x = s.x + s.dx * e * 1.6;
          const y = s.y - e * h * .95;
          const sc = 1 - e * .95;
          ctx.save();
          ctx.globalAlpha = (1 - t * .9) * .95;
          ctx.translate(x, y); ctx.rotate(s.rot * e);
          ctx.scale(Math.max(.04, sc), Math.max(.04, sc * .7));
          ctx.fillStyle = "rgba(242,236,221,.92)";
          U.roundRect(ctx, -s.w / 2, -s.h / 2, s.w, s.h, 3); ctx.fill();
          ctx.restore();
          // 变成的星
          if (t > .55) {
            ctx.save(); ctx.globalCompositeOperation = "lighter";
            const a = (t - .55) / .45;
            U.glowCircle(ctx, x, y, 9 * (1 + a), "190,225,255", .8 * a);
            ctx.fillStyle = `rgba(255,255,255,${a})`;
            ctx.beginPath(); ctx.arc(x, y, 1.3, 0, U.TAU); ctx.fill();
            ctx.restore();
          }
        }
      }
      // 3) 末页化月
      if (p > .42) {
        const q = U.clamp((p - .42) / .58, 0, 1);
        const cx = w / 2, cy = h * .34;
        const r = Math.max(w, h) * .04 + q * Math.max(w, h) * .16;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        U.glowCircle(ctx, cx, cy, r * 5.5, "150,200,255", .38 * q);
        const g = ctx.createRadialGradient(cx - r * .3, cy - r * .3, 0, cx, cy, r);
        g.addColorStop(0, `rgba(255,253,242,${q})`);
        g.addColorStop(.55, `rgba(246,244,226,${q * .96})`);
        g.addColorStop(1, `rgba(198,214,238,${q * .9})`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, U.TAU); ctx.fill();
        // 月球纹理
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = q * .16;
        for (let i = 0; i < 9; i++) {
          const a2 = i * 2.4, rr = r * (.2 + (i % 4) * .16);
          ctx.fillStyle = "#9fb0c6";
          ctx.beginPath(); ctx.arc(cx + Math.cos(a2) * rr, cy + Math.sin(a2) * rr * .9, r * (.06 + (i % 3) * .04), 0, U.TAU); ctx.fill();
        }
        ctx.restore();
        if (p > .8) { ctx.fillStyle = `rgba(2,6,16,${(p - .8) / .2 * .85})`; ctx.fillRect(0, 0, w, h); }
      }
    }

    function drawDusk(p, w, h, streaks) {
      const cx = w / 2, cy = h * .5;
      // 1) 星流螺旋环绕书卷（0~.5）
      if (p < .52) {
        const q = p / .52;
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        for (const s of streaks) {
          const e = U.easeInOut(q);
          const ang = s.ang + e * U.TAU * 1.35 * s.dir;
          const rad = s.rad * (1 - e * .82);
          const x = cx + Math.cos(ang) * rad;
          const y = cy + Math.sin(ang) * rad * .52;
          ctx.strokeStyle = `rgba(255,205,140,${.85 * (1 - e * .3)})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(x, y);
          const pang = ang - .16 * s.dir;
          ctx.lineTo(cx + Math.cos(pang) * rad, cy + Math.sin(pang) * rad * .52); ctx.stroke();
        }
        ctx.restore();
      }
      // 2) 星流放大划过全屏（.38~1）
      if (p > .38) {
        const q = U.clamp((p - .38) / .62, 0, 1);
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        const R = Math.max(w, h) * (.12 + q * 1.5);
        for (let i = 0; i < 160; i++) {
          const a = (i / 160) * U.TAU + q * 1.2;
          const rr = R * (1 + (i % 7) * .06);
          const x = cx + Math.cos(a) * rr;
          const y = cy + Math.sin(a) * rr * .78;
          if (x < -200 || x > w + 200 || y < -200 || y > h + 200) continue;
          const len = 26 + q * 220;
          const grd = ctx.createLinearGradient(x, y, x - Math.cos(a) * len, y - Math.sin(a) * len * .78);
          grd.addColorStop(0, `rgba(255,226,170,${.8 * (1 - q * .35)})`);
          grd.addColorStop(1, "rgba(255,150,80,0)");
          ctx.strokeStyle = grd; ctx.lineWidth = 1.4 + q * 2;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - Math.cos(a) * len, y - Math.sin(a) * len * .78); ctx.stroke();
        }
        ctx.restore();
        // 压迫感暗角
        const vg = ctx.createRadialGradient(cx, cy, Math.min(w, h) * (.5 - q * .35), cx, cy, Math.max(w, h) * .8);
        vg.addColorStop(0, "rgba(0,0,0,0)");
        vg.addColorStop(1, `rgba(20,6,0,${q * .8})`);
        ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
        // 黄昏天色
        if (p > .82) {
          const k = (p - .82) / .18;
          const sky = ctx.createLinearGradient(0, 0, 0, h);
          sky.addColorStop(0, `rgba(38,26,72,${k})`);
          sky.addColorStop(.45, `rgba(122,58,72,${k})`);
          sky.addColorStop(.78, `rgba(226,124,74,${k})`);
          sky.addColorStop(1, `rgba(255,196,120,${k})`);
          ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
        }
      }
    }

    return { start, stop };
  }

  /* ================================================================
   * 页面主体
   * ================================================================ */
  let built = false, universe = null, fx = null, L = null, rootEl = null;

  function enter() {
    L = U.life();
    if (!built) build();
    // 重置
    const stage = document.getElementById("book-stage");
    stage.classList.add("closed");
    stage.style.opacity = "0";
    BOOK.idx = 0;
    BOOK.flipping = false;
    BOOK.sheets.forEach(s => { s._anim = false; s.style.animation = ""; s.dataset.revealed = ""; });
    renderBook();

    universe = new Universe(document.getElementById("u3d"));
    universe.start(L);
    fx = makeEntryFx(document.getElementById("entry-fx"));

    // 标题 / 引语
    L.timeout(() => document.getElementById("init-title").classList.add("in"), 240);
    L.timeout(() => document.getElementById("init-epigraph").classList.add("in"), 760);

    // 高光点 → 书卷出现
    const spark = document.getElementById("spark-pt");
    L.timeout(() => {
      spark.classList.add("on");
      // 镜头急转：宇宙淡出到星云
      universe.dim = .18;
    }, 2500);
    L.timeout(() => {
      stage.style.opacity = "1";
      stage.classList.add("show-book");
      document.getElementById("init-head").classList.add("dim");
      U.tween(0, .18, 900, v => { if (universe) universe.dim = v; });
    }, 3150);

    // 自动翻页
    L.timeout(() => autoFlip(), 2800);

    bindEvents();
    bindTrails();
    window.addEventListener("resize", onResize);
    L.off(() => window.removeEventListener("resize", onResize));
  }

  function autoFlip() {
    if (!built) return;
    const stage = document.getElementById("book-stage");
    stage.classList.remove("closed");
    L.timeout(() => {
      const N = BOOK.N;
      let i = 1;
      const step = () => {
        if (i >= N) { showHint(); return; }
        const target = i;
        i++;
        flipTo(target, L, () => {
          if (i >= N) showHint();
          L.timeout(step, 12);
        }, true);
      };
      step();
    }, 420);
  }

  function showHint() {
    const h = document.getElementById("init-hint");
    if (h) h.classList.add("on");
  }

  function bindEvents() {
    const stage = document.getElementById("book-stage");
    const u3 = document.getElementById("u3d");

    // --- 点击书页翻页；末页整幅可点击进入第一页面
    L.on(stage, "click", (e) => {
      if (e.target.closest("#dream-text") || BOOK.idx >= BOOK.N - 1) { enterWorld(); return; }
      const fr = stage.getBoundingClientRect();
      const leftHalf = (e.clientX - fr.left) < fr.width / 2;
      if (leftHalf) flipTo(BOOK.idx - 1, L);
      else flipTo(BOOK.idx + 1, L);
    });

    // --- 悬停水波浮动感：随鼠标轻微倾斜
    L.on(stage, "pointermove", (e) => {
      const fr = stage.getBoundingClientRect();
      const nx = (e.clientX - fr.left) / fr.width - .5;
      const ny = (e.clientY - fr.top) / fr.height - .5;
      BOOK.sheets.forEach((s, i) => {
        if (i !== BOOK.idx && i !== BOOK.idx - 1) return;
        const inner = s.querySelector(".sheet-inner");
        if (!inner) return;
        const base = i < BOOK.idx ? -180 : 0;
        inner.style.transform = `rotateY(${-nx * 7}deg) rotateX(${ny * 5}deg) translateZ(${6 + Math.abs(nx) * 4}px)`;
      });
    });
    L.on(stage, "pointerleave", () => {
      BOOK.sheets.forEach(s => {
        const inner = s.querySelector(".sheet-inner");
        if (inner) inner.style.transform = "";
      });
    });

    // --- 点击大星加装光板
    L.on(u3, "click", (e) => {
      const fr = u3.getBoundingClientRect();
      const x = e.clientX - fr.left, y = e.clientY - fr.top;
      const s = universe && universe.hitTest(x, y);
      if (s) {
        universe.boost(s);
        App.toast("已为星体加装太阳能光板 · 轨道加速中");
      }
    });

    // --- 键盘翻页
    L.on(window, "keydown", (e) => {
      if (e.key === "ArrowRight") flipTo(BOOK.idx + 1, L);
      if (e.key === "ArrowLeft") flipTo(BOOK.idx - 1, L);
    });

    // --- 寻梦河海入口
    const dreamText = document.getElementById("dream-text");
    L.on(dreamText, "click", (e) => { e.stopPropagation(); enterWorld(); });
  }

  /* --------- 时段转场 --------- */
  let entering = false;
  function enterWorld() {
    const t = U.nowNanjing();
    const phase = U.dayPhase(t.hour, t.minute);
    if (entering) return;
    entering = true;
    const dream = document.getElementById("dream-text");
    if (dream) { dream.style.pointerEvents = "none"; dream.style.opacity = ".4"; }
    const stage = document.getElementById("book-stage");
    const u3 = document.getElementById("u3d");
    const root = document.getElementById("init-root");

    if (!fx) { App.navigate("first", {}, { transition: "flash" }); return; }

    if (phase === "day") {
      /* 白昼：群星变亮白热化点亮全屏 */
      if (universe) { universe.flowTarget = null; }
      U.tween(0, 1, 900, v => { if (universe) universe.white = v; });
      stage.style.transition = "opacity 1.2s ease, transform 1.2s ease, filter 1.2s ease";
      stage.style.opacity = "0";
      stage.style.filter = "brightness(3) blur(6px)";
      fx.start("day", { dur: 2100, done: () => { App.navigate("first", {}, { transition: "flash", flashMs: 500 }); } });
    } else if (phase === "night") {
      /* 夜色：群星收回流入"梦"字；书页一页页飞扬上夜空缩为星；末页幻化为月 */
      const dreamRect = dream.getBoundingClientRect();
      const target = { x: dreamRect.left + dreamRect.width / 2, y: dreamRect.top + dreamRect.height / 2 };
      const streaks = universe.stars.filter(() => Math.random() < .55).map(s => ({ x: s.x, y: s.y, tx: target.x, ty: target.y }));
      // 书页数据
      const parts = [];
      BOOK.sheets.forEach((s, i) => {
        const r = s.getBoundingClientRect();
        if (i < BOOK.idx - 1) return;
        parts.push({ x: r.left + r.width * (i < BOOK.idx ? .3 : .7), y: r.top + r.height * .5,
          w: r.width * .42, h: r.height, dx: U.rand(-160, 160), rot: U.rand(-1.4, 1.4), delay: U.rand(0, 1) });
      });
      if (universe) universe.flowTarget = { x: target.x, y: target.y, pull: .022 };
      U.tween(0, 1, 1200, v => { if (universe) universe.dim = .18 + v * .5; });
      fx.start("night", { dur: 4200, streaks, parts, done: () => App.navigate("first", {}, { transition: "dark", flashMs: 420 }) });
    } else {
      /* 晨昏：群星螺旋环绕书卷使其消失，星流放大划过全屏，压迫感，最后换黄昏天色 */
      const streaks = [];
      for (let i = 0; i < 200; i++) {
        streaks.push({ ang: U.rand(0, U.TAU), rad: U.rand(140, 520), dir: Math.random() < .5 ? 1 : -1 });
      }
      stage.style.transition = "transform 1.4s cubic-bezier(.6,.02,.8,.4), opacity 1.4s ease";
      stage.style.transform = "translate(-50%,-50%) rotate(28deg) scale(.2)";
      stage.style.opacity = "0";
      if (universe) { universe.flowTarget = null; U.tween(0, .5, 1400, v => { if (universe) universe.dim = .18 + v; }); }
      fx.start("dusk", { dur: 4600, streaks, done: () => App.navigate("first", {}, { transition: "flash", color: "white", flashMs: 300 }) });
    }

    // 转场期间停止大星点击
    L.timeout(() => { if (u3) u3.style.pointerEvents = "none"; }, 10);
  }

  function onResize() {
    if (!universe) return;
    universe.resize();
    universe.build();
    const stage = document.getElementById("book-stage");
    if (stage) layoutBook(stage);
    renderBook();
  }

  /* --------- 构建 DOM --------- */
  function build() {
    const p = document.getElementById("page-init");
    p.innerHTML = `
      <div id="init-root">
        <canvas id="u3d"></canvas>
        <div id="init-head">
          <div id="init-title">时代的命题从未止息，今天是未来回望的历史，明天是此刻畅想的未来</div>
          <div id="init-epigraph">
            <span class="q">「</span>江河不息，因源头有雪山之诺；弦歌不辍，因浪尖有掌灯之人。<br>
            当算法的潮水漫过百年堤岸，我们仍以水的方式思考——汇流、蓄势、穿峡、入海。<br>
            此卷所录，皆为此前赴后继的答案。<span class="q">」</span>
          </div>
        </div>
        <div id="spark-pt"></div>
        <div id="book-stage" class="closed"><div id="book"></div></div>
        <div id="init-hint">点击书页翻页 · 悬停照片见流光 · 点击照片进入子页 · 点击大星可加装光板</div>
        <canvas id="entry-fx"></canvas>
      </div>`;
    U.injectCSS("css-init-more", `
      @keyframes dreamReveal{
        0%{opacity:0;transform:scale(.86) rotateX(18deg);filter:brightness(2.4) blur(10px);}
        55%{opacity:1;filter:brightness(1.3) blur(1px);}
        100%{opacity:1;transform:none;filter:none;}
      }
      #book-stage{opacity:0;}
      .sheet .sheet-inner{transition:transform .45s cubic-bezier(.2,.7,.3,1);}
      .leaf.fly{justify-content:center;padding:9% 12%;}
      .fly-title{font-family:var(--f-kai);font-size:clamp(14px,1.6vw,21px);color:#14365e;letter-spacing:.28em;
        text-indent:.28em;margin-bottom:clamp(14px,3vh,30px);}
      .fly-body{font-family:var(--f-kai);font-size:clamp(10px,1.05vw,14px);line-height:2.3;color:#3d5478;
        letter-spacing:.1em;text-align:center;}
      .fly-sign{margin-top:clamp(14px,3.4vh,34px);font-family:var(--f-song);font-size:clamp(8px,.85vw,11px);
        color:#96835c;letter-spacing:.30em;text-indent:.30em;}
    `);
    buildBook(document.getElementById("book-stage"), document.getElementById("book"));
    // 为每张照片绑定点击（一次性）
    document.querySelectorAll("#page-init .pm-frame").forEach(fr => {
      fr.addEventListener("click", (e) => {
        e.stopPropagation();
        App.navigate(fr.dataset.entry, { focus: fr.dataset.name });
      });
    });
    built = true;
  }

  function leave() {
    if (L) { L.kill(); L = null; }
    if (universe) { universe = null; }
    if (fx) { fx.stop(); fx = null; }
    trailStops.forEach(f => { try { f(); } catch (e) {} });
    trailStops.length = 0;
    document.querySelectorAll("#page-init .trail-cv").forEach(c => c.remove());
    const stage = document.getElementById("book-stage");
    if (stage) { stage.style.transform = ""; stage.style.filter = ""; stage.style.opacity = ""; stage.style.transition = ""; }
    const d = document.getElementById("dream-text");
    if (d) { d.style.pointerEvents = ""; d.style.opacity = ""; }
  }

  App.register("init", { enter, leave });
})();

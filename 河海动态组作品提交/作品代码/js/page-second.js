/* ============================================================
 * L3 第二页面（本文件一次注册两个页面）
 *   future  —— 「AI为伴的云时代」：水之生灵 · 科技海洋
 *              · 深海科技海洋：多层水波 / 焦散光斑 / 丁达尔光柱 /
 *                上升数据字节 / 粒子鲸与光之水母（尾迹发光残影）/ 量子光点
 *              · 主标题由汉字·字节粒子自下而上堆积拼装，随后字形结晶发光
 *              · 副标题打字机；底部两枚光框入口（history / cloud）
 *   history —— 「历史上的今天」：缓慢穿越历史陈列馆走廊
 *              · 走廊照片 cover 铺满 + 无缝循环的呼吸式缓推镜头
 *              · 宣纸卷轴 + 毛笔墨迹渐显（飞白 / 晕染 / 墨滴）
 *              · 三封鸡毛信（左 名贤堂 / 中 史之枢机 / 右 水利家国）
 *              · historyUpgraded 为真时叠加赛博光栅"修进形态"
 * 规范：严格 IIFE；生命周期统一走 U.life()；离屏画布只在尺寸变化时重建
 * ============================================================ */
(function () {
  "use strict";

  const U = window.Utils, D = window.DATA;
  const TAU = U.TAU;

  /* ---------------- 常量 ---------------- */
  const IMG_CORRIDOR = "素材/背景/走廊.jpg";   // 中文路径，加载统一走 U.loadImg（内部已 encodeURI）
  const F_KAI = '"KaiTi","STKaiti","Kaiti SC","楷体","Songti SC","SimSun",serif';
  const F_HEI = '"Microsoft YaHei","PingFang SC","Noto Sans SC","Hiragino Sans GB",sans-serif';
  const F_MONO = '"JetBrains Mono","Cascadia Mono","Consolas","Courier New",monospace';

  const TITLE_TEXT = "AI为伴的云时代";
  const SUB_TEXT = "——数字浪潮，正考验着百年水利的堤岸——";
  const HIST_TITLE = "历史上的今天";

  const narrow = () => window.innerWidth < 780;
  // 画质系数：窄屏统一削减粒子，保证移动端 60fps
  const quality = () => (narrow() ? 0.55 : 1);
  const clamp = U.clamp, lerp = U.lerp;

  /* ============================================================
   * 样式（一次注入；两个页面共用一张样式表）
   * ============================================================ */
  U.injectCSS("css-second", `
  #page-future, #page-history { background:#03070f; }
  #page-future canvas, #page-history canvas { display:block; }

  /* ================= A · 未来线 ================= */
  #future-root{position:absolute;inset:0;overflow:hidden;
    background:radial-gradient(122% 90% at 50% 0%, #0a3d91 0%, #061a3a 50%, #02070f 100%);
    opacity:0;transition:opacity 1.1s var(--ease);}
  #future-root.in{opacity:1;}
  #future-sea{position:absolute;inset:0;width:100%;height:100%;z-index:1;}
  #future-title{position:absolute;inset:0;width:100%;height:100%;z-index:5;pointer-events:none;}
  #future-scan{position:absolute;inset:0;z-index:6;pointer-events:none;opacity:.45;
    background:repeating-linear-gradient(0deg, rgba(126,222,255,.055) 0 1px, transparent 1px 3px);
    mix-blend-mode:screen;}
  #future-grid{position:absolute;inset:0;z-index:6;pointer-events:none;opacity:.13;
    background-image:linear-gradient(rgba(96,200,255,.5) 1px, transparent 1px),
      linear-gradient(90deg, rgba(96,200,255,.5) 1px, transparent 1px);
    background-size:clamp(48px,5.6vw,78px) clamp(48px,5.6vw,78px);
    -webkit-mask-image:radial-gradient(72% 60% at 50% 58%, #000 0%, transparent 80%);
    mask-image:radial-gradient(72% 60% at 50% 58%, #000 0%, transparent 80%);}
  .fh-corner{position:absolute;z-index:7;width:clamp(22px,2.8vw,44px);height:clamp(22px,2.8vw,44px);
    border:1px solid rgba(112,208,255,.45);pointer-events:none;}
  .fh-corner.tl{left:2.6vw;top:3.2vh;border-right:0;border-bottom:0;}
  .fh-corner.tr{right:2.6vw;top:3.2vh;border-left:0;border-bottom:0;}
  .fh-corner.bl{left:2.6vw;bottom:3.6vh;border-right:0;border-top:0;}
  .fh-corner.br{right:2.6vw;bottom:3.6vh;border-left:0;border-top:0;}

  #future-kicker{position:absolute;left:2.6vw;top:calc(3.2vh + clamp(22px,2.8vw,44px) + 10px);
    z-index:8;font-family:var(--f-mono);font-size:10px;letter-spacing:.34em;color:#5f9dd6;
    text-transform:uppercase;pointer-events:none;opacity:0;transition:opacity 1.4s ease .5s;}
  #future-kicker.in{opacity:.9;}

  #future-ui{position:absolute;left:0;right:0;top:60%;z-index:9;display:flex;flex-direction:column;
    align-items:center;padding:0 6vw;pointer-events:none;}
  #future-sub{font-family:var(--f-kai);font-size:clamp(13px,1.34vw,19px);letter-spacing:.16em;
    color:#a9d6f5;text-align:center;line-height:1.9;min-height:1.9em;
    text-shadow:0 0 18px rgba(78,161,255,.55),0 0 42px rgba(20,70,170,.4);}
  #future-sub::after{content:"";display:inline-block;width:.55em;height:1em;margin-left:.12em;
    vertical-align:-.12em;background:#7fe3ff;box-shadow:0 0 12px rgba(127,227,255,.9);
    opacity:0;animation:ftCaret 1s steps(1) infinite;}
  #future-sub.done::after{animation:none;opacity:0;}
  @keyframes ftCaret{0%,49%{opacity:1;}50%,100%{opacity:0;}}

  #future-btns{display:flex;gap:clamp(14px,2.4vw,34px);margin-top:clamp(16px,3.6vh,44px);
    pointer-events:auto;opacity:0;transform:translateY(16px);
    transition:opacity 1s var(--ease),transform 1s var(--ease);}
  #future-btns.on{opacity:1;transform:none;}
  .ft-btn{position:relative;padding:14px clamp(20px,2.4vw,34px) 12px;border:1px solid rgba(94,196,255,.4);
    border-radius:2px;cursor:pointer;background:linear-gradient(180deg,rgba(24,86,170,.4),rgba(8,28,64,.66));
    box-shadow:0 0 0 1px rgba(8,30,64,.55) inset,0 0 20px rgba(40,140,245,.16) inset,
      0 8px 26px rgba(0,10,30,.5);
    -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);overflow:hidden;
    transition:transform .38s var(--ease),border-color .38s ease,box-shadow .38s ease,color .38s ease;
    font-family:var(--f-hei);font-size:clamp(12px,1.02vw,15px);letter-spacing:.24em;text-indent:.24em;
    color:#cfeaff;text-align:center;min-width:clamp(150px,17vw,224px);}
  .ft-btn .fb-en{display:block;margin-top:5px;font-family:var(--f-mono);font-size:9px;
    letter-spacing:.3em;text-indent:.3em;color:#5f9ed8;transition:color .38s ease;}
  .ft-btn i{position:absolute;left:-40%;top:0;width:30%;height:100%;pointer-events:none;
    background:linear-gradient(100deg,transparent,rgba(160,230,255,.28),transparent);
    transform:skewX(-18deg);transition:left .62s var(--ease);}
  .ft-btn:hover{border-color:rgba(87,232,216,.9);color:#eafcff;transform:translateY(-3px);
    box-shadow:0 0 0 1px rgba(87,232,216,.28) inset,0 0 26px rgba(87,232,216,.3) inset,
      0 0 34px rgba(60,190,255,.3),0 12px 30px rgba(0,10,30,.55);}
  .ft-btn:hover i{left:110%;}
  .ft-btn:hover .fb-en{color:#7fe7dd;}
  .ft-btn:active{transform:translateY(-1px) scale(.985);}
  .ft-btn::before,.ft-btn::after{content:"";position:absolute;width:10px;height:10px;
    border:1px solid rgba(110,232,220,.85);transition:border-color .38s ease;}
  .ft-btn::before{left:-1px;top:-1px;border-right:0;border-bottom:0;}
  .ft-btn::after{right:-1px;bottom:-1px;border-left:0;border-top:0;}

  #future-foot{position:absolute;left:0;right:0;bottom:3.4vh;z-index:8;text-align:center;
    font-family:var(--f-mono);font-size:10px;letter-spacing:.3em;color:#3f6f9f;
    pointer-events:none;opacity:0;transition:opacity 1.6s ease 1.2s;}
  #future-foot.in{opacity:.85;}
  #future-to-history{pointer-events:auto;cursor:pointer;color:#ffd980;letter-spacing:.12em;margin-right:1.2em;}
  #future-to-history:hover{color:#ffe9b0;text-shadow:0 0 12px rgba(255,220,120,.8);}

  /* ================= B · 历史线 ================= */
  #history-root{position:absolute;inset:0;overflow:hidden;background:#0a0805;
    opacity:0;transition:opacity 1s var(--ease);}
  #history-root.in{opacity:1;}
  #hist-bg{position:absolute;inset:0;width:100%;height:100%;z-index:1;}
  #hist-vign{position:absolute;inset:0;z-index:3;pointer-events:none;
    background:radial-gradient(116% 88% at 50% 46%,transparent 30%,rgba(4,3,2,.66) 78%,rgba(2,2,2,.94) 100%);}
  #hist-cyber{position:absolute;inset:0;z-index:4;pointer-events:none;opacity:0;
    transition:opacity 1.6s ease;
    background:
      repeating-linear-gradient(0deg,rgba(122,150,255,.09) 0 1px,transparent 1px 4px),
      radial-gradient(120% 90% at 50% 10%,rgba(78,110,255,.24),transparent 62%),
      linear-gradient(180deg,rgba(52,40,130,.36),rgba(18,10,58,.5));
    mix-blend-mode:screen;}
  #hist-cyber::after{content:"";position:absolute;left:0;right:0;height:26%;
    background:linear-gradient(180deg,transparent,rgba(126,236,255,.16),transparent);
    animation:histScan 7.5s linear infinite;}
  @keyframes histScan{0%{top:-30%;}100%{top:104%;}}
  #history-root.upgraded #hist-cyber{opacity:1;}

  #hist-banner{position:absolute;left:50%;top:clamp(20px,4.6vh,58px);transform:translateX(-50%) rotate(-.55deg);
    width:clamp(288px,44vw,700px);padding:clamp(8px,1.5vh,18px) clamp(14px,2.2vw,30px);
    background:linear-gradient(158deg,#f8f2e2 0%,#efe5cd 56%,#e2d5b7 100%);
    box-shadow:0 22px 52px rgba(0,0,0,.62),0 0 0 1px rgba(126,100,56,.42),
      inset 0 0 70px rgba(150,120,64,.2),inset 0 0 0 6px rgba(255,255,255,.16);
    border-radius:2px;z-index:8;}
  #hist-banner::before{content:"";position:absolute;inset:0;opacity:.5;pointer-events:none;
    mix-blend-mode:multiply;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.86' numOctaves='4'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23p)' opacity='.2'/%3E%3C/svg%3E");}
  .hb-roller{position:absolute;left:-1.4%;right:-1.4%;height:9px;border-radius:5px;z-index:2;
    background:linear-gradient(180deg,#6b4425 0%,#9a6533 34%,#4a2c14 72%,#2c1a0c 100%);
    box-shadow:0 3px 10px rgba(0,0,0,.6);}
  .hb-top{top:-6px;} .hb-bot{bottom:-6px;}
  #hist-brush{display:block;width:100%;height:clamp(58px,10.4vh,124px);}
  .hist-seal{position:absolute;right:clamp(8px,1.3vw,18px);bottom:clamp(2px,.7vh,7px);
    width:clamp(22px,2.2vw,32px);height:clamp(22px,2.2vw,32px);
    border:1.6px solid rgba(170,50,40,.82);border-radius:2px;
    color:rgba(170,50,40,.9);font-family:var(--f-kai);font-size:clamp(12px,1.3vw,18px);
    display:flex;align-items:center;justify-content:center;transform:rotate(4deg);
    background:rgba(255,246,228,.35);box-shadow:0 0 0 1px rgba(170,50,40,.2) inset;
    mix-blend-mode:multiply;opacity:0;transition:opacity 1.2s ease 2.1s;}
  #history-root.sealed .hist-seal{opacity:.86;}

  #hist-date{position:absolute;left:clamp(16px,3vw,44px);top:clamp(18px,4vh,50px);z-index:8;
    font-family:var(--f-song);font-size:clamp(10px,.92vw,12px);letter-spacing:.28em;color:#b7a583;
    text-shadow:0 2px 10px rgba(0,0,0,.85);pointer-events:none;
    opacity:0;transition:opacity 1.4s ease .8s;}
  #hist-date.in{opacity:.9;}
  #hist-date b{color:#e0cfa6;font-weight:400;}

  #hist-tag{position:absolute;left:clamp(16px,3vw,44px);
    top:calc(clamp(18px,4vh,50px) + 26px);z-index:8;
    font-family:var(--f-mono);font-size:10px;letter-spacing:.22em;color:#8fa8ff;
    text-shadow:0 0 14px rgba(120,150,255,.9),0 0 30px rgba(70,90,255,.6);
    pointer-events:none;opacity:0;transition:opacity 1.2s ease;}
  #history-root.upgraded #hist-tag{opacity:.95;}

  #hist-letters{position:absolute;inset:0;z-index:9;pointer-events:none;}
  .fea-letter{position:absolute;top:56%;width:clamp(108px,14.6vw,208px);
    transform:translate(-50%,-50%);pointer-events:auto;cursor:pointer;
    transition:transform .5s var(--ease),filter .5s ease;}
  .fea-l{left:19%;} .fea-c{left:50%;top:58%;} .fea-r{left:81%;}
  .fea-swing{transform-origin:50% 0;will-change:transform;
    animation:feaSwing 7.6s ease-in-out infinite;}
  .fea-c .fea-swing{animation-duration:8.8s;animation-delay:-2.2s;}
  .fea-r .fea-swing{animation-duration:9.6s;animation-delay:-4.4s;}
  @keyframes feaSwing{0%,100%{transform:rotate(-1.5deg) translateY(0);}
    50%{transform:rotate(1.6deg) translateY(3px);}}
  .fea-svg{display:block;width:100%;height:auto;
    filter:drop-shadow(0 14px 26px rgba(0,0,0,.6));transition:filter .45s ease,transform .45s var(--ease);}
  .fea-letter:hover{transform:translate(-50%,-50%) scale(1.1);}
  .fea-letter:hover .fea-svg{filter:drop-shadow(0 0 16px rgba(255,226,178,.92))
    drop-shadow(0 0 44px rgba(120,205,255,.62)) drop-shadow(0 16px 26px rgba(0,0,0,.6));}
  .fea-feather{transform-box:fill-box;transform-origin:50% 100%;
    animation:feaWind 5.4s ease-in-out infinite;}
  @keyframes feaWind{0%,100%{transform:rotate(-2deg);}50%{transform:rotate(2.6deg);}}
  .fea-plate{margin-top:4px;text-align:center;}
  .fea-name{display:block;font-family:var(--f-kai);font-size:clamp(14px,1.22vw,19px);letter-spacing:.24em;
    text-indent:.24em;color:#e6d6b4;text-shadow:0 2px 12px rgba(0,0,0,.9);transition:color .4s ease;}
  .fea-letter:hover .fea-name{color:#fff2d2;text-shadow:0 0 18px rgba(255,214,150,.8),0 2px 12px rgba(0,0,0,.9);}
  .fea-en{display:block;margin-top:3px;font-family:var(--f-mono);font-size:8px;letter-spacing:.24em;
    color:#8b7a5c;}
  .fea-tip{display:block;margin-top:4px;font-family:var(--f-song);font-size:10px;letter-spacing:.2em;
    color:#c2ab84;opacity:.86;transition:opacity .4s ease,color .4s ease;
    text-shadow:0 2px 10px rgba(0,0,0,.95);}
  .fea-letter:hover .fea-tip{opacity:1;color:#ffdca0;}
  .fea-burst{position:absolute;left:50%;top:58%;width:12px;height:12px;margin:-6px 0 0 -6px;
    border-radius:50%;pointer-events:none;opacity:0;
    background:radial-gradient(circle,#fff 0%,rgba(255,240,206,.92) 30%,rgba(140,210,255,.55) 60%,transparent 74%);}
  .fea-letter.opening{pointer-events:none;}
  .fea-letter.opening .fea-svg{transform:scale(1.06) rotate(-2.5deg);filter:brightness(1.7)
    drop-shadow(0 0 26px rgba(255,238,200,.95)) drop-shadow(0 0 70px rgba(120,205,255,.8));}
  .fea-letter.opening .fea-burst{animation:feaBurst .64s cubic-bezier(.2,.7,.3,1) forwards;}
  @keyframes feaBurst{0%{opacity:0;transform:scale(.2);}
    20%{opacity:1;transform:scale(2.4);}100%{opacity:0;transform:scale(17);}}
  .fea-letter.opening .fea-plate{opacity:0;transition:opacity .3s ease;}

  #hist-hint{position:absolute;left:0;right:0;bottom:3.4vh;z-index:9;text-align:center;
    font-family:var(--f-song);font-size:clamp(10px,.94vw,13px);letter-spacing:.3em;color:#9b8a6b;
    pointer-events:none;opacity:0;transition:opacity 1.5s ease 1.4s;text-shadow:0 2px 10px rgba(0,0,0,.9);}
  #hist-hint.in{opacity:.86;}

  @media (max-width:780px){
    #future-ui{padding:0 8vw;}
    #future-sub{letter-spacing:.1em;line-height:1.8;}
    .ft-btn{min-width:132px;padding:11px 14px 9px;font-size:11.5px;letter-spacing:.16em;}
    #future-foot{bottom:5.6vh;font-size:8px;letter-spacing:.12em;padding:0 12vw;line-height:1.9;}
    .fea-letter{width:clamp(86px,25vw,124px);}
    .fea-l{left:16%;} .fea-r{left:84%;}
    .fea-letter{top:60%;}
    .fea-c{top:62%;}
    .fea-en{display:none;}
    #hist-banner{width:88vw;top:clamp(50px,7.2vh,74px);}
    #hist-date{left:0;right:0;text-align:center;top:auto;bottom:12.4vh;
      font-size:9px;letter-spacing:.14em;}
    #hist-tag{left:0;right:0;top:auto;bottom:8.6vh;text-align:center;font-size:9px;
      letter-spacing:.16em;}
    #hist-hint{letter-spacing:.16em;}
  }
  `);

  /* ============================================================
   * 通用小工具
   * ============================================================ */
  // 预渲染柔光圆点（一次性），后续用 drawImage 复用，避免逐帧建渐变
  function mkGlowSprite(size, stops) {
    const c = U.mkCanvas(size, size), x = c.getContext("2d");
    const h = size / 2;
    const g = x.createRadialGradient(h, h, 0, h, h, h);
    stops.forEach(s => g.addColorStop(s[0], s[1]));
    x.fillStyle = g; x.fillRect(0, 0, size, size);
    return c;
  }

  /* ============================================================
   * A · 未来线引擎 ①：科技海洋
   * ============================================================ */
  function createSea(canvas) {
    const S = {
      canvas: canvas, W: 0, H: 0, t: 0, last: 0,
      sprites: {}, grads: {}, waves: [], caust: [], beams: [],
      bytes: [], quanta: [], beasts: [], surface: null, vign: null,
      px: 0, py: 0, tpx: 0, tpy: 0,
    };

    /* ---------- 贴图（只建一次） ---------- */
    function sprites() {
      S.sprites.glow = mkGlowSprite(64, [
        [0, "rgba(255,255,255,1)"], [.24, "rgba(206,242,255,.82)"],
        [.55, "rgba(110,190,255,.24)"], [1, "rgba(60,140,255,0)"]]);
      // 近景大光斑（景深虚化）
      S.sprites.bokeh = mkGlowSprite(96, [
        [0, "rgba(190,240,255,.5)"], [.56, "rgba(140,215,255,.24)"],
        [.82, "rgba(110,200,255,.34)"], [1, "rgba(80,170,255,0)"]]);

      // 焦散光斑：多团柔光 + 细网线，一次性画好
      const SZ = 300, c = U.mkCanvas(SZ, SZ), x = c.getContext("2d");
      x.globalCompositeOperation = "lighter";
      for (let i = 0; i < 22; i++) {
        const cx = U.rand(.1, .9) * SZ, cy = U.rand(.1, .9) * SZ;
        const r = U.rand(.05, .16) * SZ;
        const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, "rgba(180,240,255,.5)");
        g.addColorStop(.5, "rgba(110,200,255,.16)");
        g.addColorStop(1, "rgba(80,160,255,0)");
        x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill();
      }
      // 焦散网线
      x.strokeStyle = "rgba(150,225,255,.15)"; x.lineWidth = 1.1;
      for (let i = 0; i < 26; i++) {
        x.beginPath();
        const y0 = U.rand(0, SZ);
        x.moveTo(-10, y0);
        for (let k = 1; k <= 6; k++) {
          x.lineTo(k / 6 * (SZ + 20) - 10, y0 + (U.noise2(k * 1.7 + i, i * 2.3) - .5) * SZ * .28);
        }
        x.stroke();
      }
      S.sprites.caustic = c;
    }

    /* ---------- 水波层 / 光柱 / 粒子 ---------- */
    function build(w, h) {
      const q = quality();
      // 水波（远 → 近）；ys 预分配，避免逐帧建数组
      S.waves = [];
      const wn = narrow() ? 4 : 6;
      for (let i = 0; i < wn; i++) {
        const y = h * (0.26 + i * 0.118);
        const segs = narrow() ? 26 : 40;
        S.waves.push({
          y: y, amp: h * (0.012 + i * 0.007), freq: 0.0055 + i * 0.0018,
          sp: (0.09 + i * 0.03) * (i % 2 ? 1 : -1), ph: U.rand(0, TAU),
          segs: segs, ys: new Float32Array(segs + 1), a: 0.1 + i * 0.045,
          col: ["rgba(24,96,180,", "rgba(4,18,44,"],
        });
      }
      // 丁达尔光柱
      S.beams = [];
      for (let i = 0; i < (narrow() ? 4 : 5); i++) {
        S.beams.push({
          x: U.rand(.08, .92), wf: U.rand(.04, .095), skew: U.rand(-.16, .16),
          ph: U.rand(0, TAU), sp: U.rand(.07, .17), a: U.rand(.24, .5),
        });
      }
      // 上升字节
      const bc = Math.round((narrow() ? 26 : 54) * 1);
      const CH = "01水云河海算浪潮流未来智∞λ≈01";
      S.bytes = [];
      for (let i = 0; i < bc; i++) {
        S.bytes.push({
          x: U.rand(0, w), y: U.rand(0, h),
          ch: CH[Math.floor(U.rand(0, CH.length))],
          size: U.rand(9, 15) * (narrow() ? .9 : 1),
          sp: U.rand(9, 30), a: U.rand(.14, .42), hue: U.rand(178, 210),
          ph: U.rand(0, TAU), sw: U.rand(.4, 1.4),
        });
      }
      // 量子光点（含近景虚化）
      const qn = Math.round((narrow() ? 40 : 78) * 1);
      S.quanta = [];
      for (let i = 0; i < qn; i++) S.quanta.push(mkQuantum(w, h, true));
      // 生灵：鲸 + 光之水母
      S.beasts = [];
      const whales = narrow() ? 1 : 2;
      for (let i = 0; i < whales; i++) {
        S.beasts.push({
          kind: "whale", x: U.rand(w * .18, w * .82), y: h * U.rand(.13, .33),
          dir: i === 0 ? 1 : -1, len: Math.min(w * .31, 420) * (narrow() ? .82 : 1),
          amp: h * .036, drift: U.rand(9, 16), ph: U.rand(0, TAU),
          n: narrow() ? 14 : 22, a: U.rand(.6, .88), trail: [], tAcc: 0,
        });
      }
      const jellies = 2;
      for (let i = 0; i < jellies; i++) {
        S.beasts.push({
          kind: "jelly", x: U.rand(w * .08, w * .92), y: U.rand(0, h),
          r: Math.min(w * .052, 74) * U.rand(.72, 1.2), sp: U.rand(5, 13),
          ph: U.rand(0, TAU), a: U.rand(.42, .72), drift: U.rand(-6, 6), tent: 7,
        });
      }
      S.q = q;
    }

    function mkQuantum(w, h, anywhere) {
      return {
        x: U.rand(0, w), y: anywhere ? U.rand(0, h) : h + U.rand(0, 40),
        z: U.rand(.16, 1), sp: U.rand(4, 16), ph: U.rand(0, TAU),
        sw: U.rand(.5, 1.6), hue: U.rand(178, 214),
      };
    }

    /* ---------- 尺寸相关（缓存的渐变） ---------- */
    function fitSize(w, h) {
      S.W = w; S.H = h;
      S.vign = (w > 0 && h > 0) ? { w: w, h: h, g: null, bottom: null } : null;
    }

    /* ---------- 绘制：基础水体 ---------- */
    function drawBase(ctx, w, h) {
      const px = S.px, py = S.py;
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#0a3d91");
      g.addColorStop(.34, "#082a63");
      g.addColorStop(.68, "#061a3a");
      g.addColorStop(1, "#020a18");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // 水面天光（顶部）
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const sg = ctx.createRadialGradient(w * .5 + px * .6, -h * .16, 0, w * .5, h * .1, Math.max(w, h) * .78);
      sg.addColorStop(0, "rgba(120,205,255,.36)");
      sg.addColorStop(.34, "rgba(60,150,230,.15)");
      sg.addColorStop(1, "rgba(20,80,170,0)");
      ctx.fillStyle = sg; ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    /* ---------- 绘制：焦散光斑 ---------- */
    function drawCaustics(ctx, w, h) {
      if (!S.caust.length) {
        for (let i = 0; i < (narrow() ? 4 : 7); i++) {
          S.caust.push({
            x: U.rand(0, w), y: U.rand(0, h * .9), r: U.rand(.13, .3) * Math.max(w, h),
            rot: U.rand(0, TAU), vr: U.rand(-.00022, .00022),
            vx: U.rand(-3, 3), vy: U.rand(-2.2, 2.2), a: U.rand(.07, .17), ph: U.rand(0, TAU),
          });
        }
      }
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const c of S.caust) {
        c.x += c.vx * .016; c.y += c.vy * .016; c.rot += c.vr;
        if (c.x < -c.r) c.x = w + c.r; if (c.x > w + c.r) c.x = -c.r;
        if (c.y < -c.r) c.y = h + c.r; if (c.y > h + c.r) c.y = -c.r;
        const a = c.a * (.62 + .38 * Math.sin(S.t * .7 + c.ph));
        ctx.globalAlpha = a;
        ctx.drawImage(S.sprites.caustic, c.x + S.px * .3 - c.r, c.y + S.py * .3 - c.r * .62,
          c.r * 2, c.r * 1.24);
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    /* ---------- 绘制：多层水波 ---------- */
    function drawWaves(ctx, w, h) {
      for (let li = 0; li < S.waves.length; li++) {
        const wl = S.waves[li];
        const y0 = wl.y + S.py * (0.12 + li * 0.05);
        const step = (w + 60) / wl.segs;
        // 只填一条有限高度的水带（避免每层全屏填充，性能与观感都更好）
        const bandH = h * (0.17 + li * 0.02);
        for (let i = 0; i <= wl.segs; i++) {
          const x = -30 + step * i;
          const n = U.noise2(x * 0.0042 + S.t * 0.11 + wl.ph, wl.ph * 2.1) - .5;
          wl.ys[i] = y0
            + Math.sin(x * wl.freq + S.t * wl.sp + wl.ph) * wl.amp
            + Math.sin(x * wl.freq * 2.35 - S.t * wl.sp * 1.6 + wl.ph * 1.7) * wl.amp * .42
            + n * wl.amp * 1.5;
        }
        const g = ctx.createLinearGradient(0, y0 - wl.amp * 2, 0, y0 + bandH);
        g.addColorStop(0, wl.col[0] + wl.a + ")");
        g.addColorStop(.38, wl.col[0] + (wl.a * .5) + ")");
        g.addColorStop(1, wl.col[1] + "0)");
        ctx.beginPath();
        ctx.moveTo(-30, wl.ys[0]);
        for (let i = 1; i <= wl.segs; i++) ctx.lineTo(-30 + step * i, wl.ys[i]);
        for (let i = wl.segs; i >= 0; i--) ctx.lineTo(-30 + step * i, wl.ys[i] + bandH);
        ctx.closePath();
        ctx.fillStyle = g;
        ctx.fill();

        // 波峰高光
        ctx.beginPath();
        ctx.moveTo(-30, wl.ys[0]);
        for (let i = 1; i <= wl.segs; i++) ctx.lineTo(-30 + step * i, wl.ys[i]);
        ctx.strokeStyle = "rgba(150,222,255," + (0.07 + li * 0.022) + ")";
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }
    }

    /* ---------- 绘制：丁达尔光柱 ---------- */
    function drawBeams(ctx, w, h) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      // 同一道光柱用三种宽度叠印 → 横向柔边（避免硬切边）
      const passes = [[1, .34], [.72, .3], [.44, .24]];
      for (const b of S.beams) {
        const sway = Math.sin(S.t * b.sp + b.ph);
        const x0 = w * b.x + sway * w * .035 + S.px * .5;
        const tw = w * b.wf;
        const x1 = x0 + w * b.skew + sway * w * .07;
        const tw2 = tw * 1.9;
        const flick = b.a * (.62 + .38 * Math.sin(S.t * .8 + b.ph));
        const g = ctx.createLinearGradient(0, 0, 0, h * .96);
        g.addColorStop(0, "rgba(170,238,255,1)");
        g.addColorStop(.4, "rgba(96,190,255,.5)");
        g.addColorStop(1, "rgba(60,150,255,0)");
        ctx.fillStyle = g;
        for (let pi = 0; pi < passes.length; pi++) {
          const k = passes[pi][0], al = passes[pi][1];
          const twp = tw * k, tw2p = tw2 * k;
          const ox = x0 + (1 - k) * (x1 - x0) * .5;
          const ox2 = x1 + (1 - k) * (x1 - x0) * .5;
          ctx.globalAlpha = flick * al;
          ctx.beginPath();
          ctx.moveTo(ox - twp, -20);
          ctx.lineTo(ox + twp, -20);
          ctx.lineTo(ox2 + tw2p, h * .96);
          ctx.lineTo(ox2 - tw2p, h * .96);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    /* ---------- 绘制：生灵（鲸 / 水母） ---------- */
    function drawBeasts(ctx, w, h, dt) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const b of S.beasts) {
        if (b.kind === "whale") whale(ctx, b, w, h, dt);
        else jelly(ctx, b, w, h, dt);
      }
      ctx.restore();
    }

    function whale(ctx, b, w, h, dt) {
      const t = S.t;
      b.x += b.dir * b.drift * dt;
      const half = b.len * .5;
      if (b.dir > 0 && b.x - half > w + 60) b.x = -half - 60;
      if (b.dir < 0 && b.x + half < -60) b.x = w + half + 60;

      // 身体曲线（头 u=0 → 尾 u=1）
      const n = b.n, len = b.len, amp = b.amp;
      const WF = .155;   // 体型宽度系数（够宽才读得出"鲸"）
      let tipX = b.x, tipY = b.y;
      // 背脊连线：一条极淡的连续线，让轮廓一眼能读出来
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const u = i / n;
        const bx = b.x + (0.5 - u) * len * b.dir;
        const by = b.y + Math.sin(u * 5.2 - t * .9 + b.ph) * amp * (.22 + u * 1.15);
        const wp = (Math.sin(Math.PI * Math.pow(u, .75)) * (1 - u * .32) + .05) * len * WF;
        i ? ctx.lineTo(bx, by - wp) : ctx.moveTo(bx, by - wp);
      }
      ctx.strokeStyle = "rgba(150,225,255,.26)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      // 四条纵向点带（上缘 / 上内 / 下内 / 下缘）→ 形成可辨认的半透明鲸形剪影
      for (let i = 0; i <= n; i++) {
        const u = i / n;
        const bx = b.x + (0.5 - u) * len * b.dir;
        const by = b.y + Math.sin(u * 5.2 - t * .9 + b.ph) * amp * (.22 + u * 1.15);
        const wp = (Math.sin(Math.PI * Math.pow(u, .75)) * (1 - u * .32) + .05) * len * WF;
        const a = b.a * (0.3 + 0.7 * Math.sin(Math.PI * Math.min(1, u * 1.02 + .06)));
        const sz = 3.1 - u * 1.3;
        // 上缘（受光）
        ctx.globalAlpha = a * .95;
        ctx.fillStyle = "rgba(198,246,255,1)";
        ctx.fillRect(bx - sz * .5, by - wp - sz * .5, sz, sz);
        // 体内两排
        ctx.globalAlpha = a * .26;
        ctx.fillStyle = "rgba(120,214,255,1)";
        ctx.fillRect(bx - .9, by - wp * .4, 1.8, 1.8);
        ctx.globalAlpha = a * .3;
        ctx.fillRect(bx - .9, by + wp * .28, 1.8, 1.8);
        // 下缘（暗侧）
        ctx.globalAlpha = a * .72;
        ctx.fillStyle = "rgba(86,176,255,1)";
        ctx.fillRect(bx - sz * .42, by + wp * .78 - sz * .42, sz * .84, sz * .84);
        if (i === n) { tipX = bx; tipY = by; }
      }
      // 背鳍 / 胸鳍
      ctx.fillStyle = "rgba(120,205,255,1)";
      ctx.globalAlpha = b.a * .45;
      for (let k = 0; k < 5; k++) {
        const u = .3 + k * .022;
        const bx = b.x + (0.5 - u) * len * b.dir;
        const by = b.y + Math.sin(u * 5.2 - t * .9 + b.ph) * amp * (.22 + u * 1.15);
        ctx.fillRect(bx - 1.3, by - len * .1 - k * 3.2, 2.6, 2.6);
      }
      for (let k = 0; k < 5; k++) {
        const u = .34 + k * .026;
        const bx = b.x + (0.5 - u) * len * b.dir;
        const by = b.y + Math.sin(u * 5.2 - t * .9 + b.ph) * amp * (.22 + u * 1.15);
        ctx.globalAlpha = b.a * (.34 - k * .05);
        ctx.fillRect(bx + k * 2.4 * b.dir, by + len * .07 + k * 3.4, 2.4, 2.4);
      }
      // 头部光斑 + 眼
      ctx.globalAlpha = b.a * .3;
      const headX = b.x + .4 * len * b.dir;
      const headY = b.y + Math.sin(.1 * 5.2 - t * .9 + b.ph) * amp * .3;
      const hr = len * .14;
      ctx.drawImage(S.sprites.glow, headX - hr, headY - hr, hr * 2, hr * 2);

      // 尾迹残影（环形缓冲）
      b.tAcc += dt;
      if (b.tAcc > .028) {
        b.tAcc = 0;
        b.trail.push({ x: tipX, y: tipY });
        if (b.trail.length > 24) b.trail.shift();
      }
      ctx.fillStyle = "rgba(87,232,216,1)";
      for (let i = 0; i < b.trail.length; i++) {
        const p = b.trail[i], k = i / b.trail.length;
        const sz = .9 + k * 3.6;
        ctx.globalAlpha = k * k * .46;
        ctx.fillRect(p.x - sz * .5, p.y - sz * .5, sz, sz);
      }
      // 尾迹连丝
      if (b.trail.length > 2) {
        ctx.beginPath();
        ctx.moveTo(b.trail[0].x, b.trail[0].y);
        for (let i = 1; i < b.trail.length; i++) ctx.lineTo(b.trail[i].x, b.trail[i].y);
        ctx.strokeStyle = "rgba(87,232,216,.26)";
        ctx.lineWidth = 1.3;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function jelly(ctx, b, w, h, dt) {
      const t = S.t;
      b.y -= b.sp * dt;
      b.x += b.drift * dt + Math.sin(t * .5 + b.ph) * .2;
      if (b.y < -b.r * 3.2) { b.y = h + b.r * 2.6; b.x = U.rand(w * .06, w * .94); }
      const pulse = 1 + Math.sin(t * 1.5 + b.ph) * .1;
      const r = b.r * pulse;
      // 伞盖外缘 + 内缘
      const seg = 14;
      for (let i = 0; i <= seg; i++) {
        const ang = Math.PI + (i / seg) * Math.PI;
        const al = b.a * (.4 + .6 * (1 - Math.abs(i / seg - .5) * 2));
        for (let ring = 0; ring < 2; ring++) {
          const rr = r * (ring ? .74 : 1);
          const x = b.x + Math.cos(ang) * rr;
          const y = b.y + Math.sin(ang) * rr * .82 * pulse;
          ctx.globalAlpha = al * (ring ? .3 : .9);
          ctx.fillStyle = ring ? "rgba(226,255,255,1)" : "rgba(150,235,255,1)";
          const s = ring ? 1.2 : 2.3;
          ctx.fillRect(x - s * .5, y - s * .5, s, s);
        }
      }
      // 伞盖内的亮点
      ctx.globalAlpha = b.a * .45;
      ctx.fillStyle = "rgba(232,255,255,1)";
      for (let k = 0; k < 5; k++) {
        const ang = Math.PI * (.2 + k * .2);
        ctx.fillRect(b.x - Math.cos(ang) * r * .46 - 1, b.y - Math.sin(ang) * r * .3 - 1, 2, 2);
      }
      // 触须
      for (let k = 0; k < b.tent; k++) {
        const u = (k / (b.tent - 1) - .5) * 1.72;
        const x0 = b.x + u * r;
        const y0 = b.y + r * .3;
        for (let j = 1; j <= 6; j++) {
          const q = j / 6;
          const x = x0 + Math.sin(t * 1.15 + b.ph + q * 3.1 + k) * r * .24 * q;
          const y = y0 + q * r * (1.9 + (k % 3) * .28);
          ctx.globalAlpha = b.a * (1 - q) * .46;
          ctx.fillStyle = "rgba(126,223,255,1)";
          const s = 2 - q * .7;
          ctx.fillRect(x - s * .5, y - s * .5, s, s);
        }
      }
      // 发光核心
      ctx.globalAlpha = b.a * .28;
      const gr = r * 2;
      ctx.drawImage(S.sprites.glow, b.x - gr, b.y - gr * .9, gr * 2, gr * 1.8);
      ctx.globalAlpha = 1;
    }

    /* ---------- 绘制：字节 / 量子点 ---------- */
    function drawBytes(ctx, w, h, dt) {
      let curFont = 0;
      for (const b of S.bytes) {
        b.y -= b.sp * dt;
        b.x += Math.sin(S.t * .5 + b.ph) * b.sw * .18;
        if (b.y < -26) { b.y = h + U.rand(10, 90); b.x = U.rand(0, w); }
        const a = b.a * (.55 + .45 * Math.sin(S.t * 1.3 + b.ph));
        ctx.globalAlpha = a;
        ctx.fillStyle = "hsl(" + b.hue + ",88%,78%)";
        // 字号量化，避免每帧重复解析字体字符串
        const fs = b.size | 0;
        if (fs !== curFont) { curFont = fs; ctx.font = fs + "px " + F_MONO; }
        ctx.fillText(b.ch, b.x, b.y);
      }
      ctx.globalAlpha = 1;
    }

    function drawQuanta(ctx, w, h, dt) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const q of S.quanta) {
        q.y -= q.sp * dt;
        q.x += Math.sin(S.t * .7 + q.ph) * q.sw * .35;
        if (q.y < -30) { q.y = h + U.rand(10, 60); q.x = U.rand(0, w); }
        if (q.x < -30) q.x = w + 30; if (q.x > w + 30) q.x = -30;
        const tw = .55 + .45 * Math.sin(S.t * 2.1 + q.ph);
        ctx.globalAlpha = (.12 + q.z * .5) * tw;
        if (q.z > .68) {
          // 近处：更大更虚
          const r = 8 + q.z * 20;
          ctx.drawImage(S.sprites.bokeh, q.x - r, q.y - r, r * 2, r * 2);
        } else {
          const r = 2 + q.z * 5;
          ctx.drawImage(S.sprites.glow, q.x - r, q.y - r, r * 2, r * 2);
        }
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    /* ---------- 主循环 ---------- */
    function frame(now) {
      const f = U.fitCanvas(S.canvas);   // 每帧取尺寸：自动处理 DPR 与 resize
      const ctx = f.ctx, w = f.w, h = f.h;
      if (w !== S.W || h !== S.H) { fitSize(w, h); S.caust.length = 0; S.W = w; S.H = h; if (S.beasts.length) build(w, h); }
      if (!S.beasts.length) build(w, h);

      const dt = Math.min(0.05, (now - (S.last || now)) / 1000);
      S.last = now;
      S.t += dt;
      // 视差缓动
      S.px += (S.tpx - S.px) * .045;
      S.py += (S.tpy - S.py) * .045;

      // ---- 背景层：半分辨率离屏渲染（水/光都是软渐变，缩一半几乎无差别，
      //      但填充面积只剩 1/4，是这一页能跑满 60fps 的关键）
      const bs = narrow() ? .42 : .5;
      const bw = Math.max(2, Math.ceil(w * bs)), bh = Math.max(2, Math.ceil(h * bs));
      if (!S.bg || S.bg.width !== bw || S.bg.height !== bh) {
        S.bg = U.mkCanvas(bw, bh);
        S.bgx = S.bg.getContext("2d");
      }
      const bx = S.bgx;
      bx.setTransform(bs, 0, 0, bs, 0, 0);
      bx.clearRect(0, 0, w, h);
      bx.globalAlpha = 1;
      bx.globalCompositeOperation = "source-over";
      drawBase(bx, w, h);
      drawCaustics(bx, w, h);
      drawWaves(bx, w, h);
      drawBeams(bx, w, h);

      // 底部深水 + 暗角直接烘进背景层（尺寸不变时复用缓存渐变），省掉两次全屏填充
      if (S.vign && !S.vign.g) {
        const dg = bx.createLinearGradient(0, h * .62, 0, h);
        dg.addColorStop(0, "rgba(2,8,20,0)");
        dg.addColorStop(1, "rgba(1,4,12,.82)");
        S.vign.bottom = dg;
        const g = bx.createRadialGradient(w * .5, h * .46, Math.min(w, h) * .18, w * .5, h * .46, Math.max(w, h) * .82);
        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(.62, "rgba(0,4,12,.22)");
        g.addColorStop(1, "rgba(0,2,8,.8)");
        S.vign.g = g;
      }
      if (S.vign && S.vign.g) {
        bx.fillStyle = S.vign.bottom;
        bx.fillRect(0, h * .62, w, h * .38);
        bx.fillStyle = S.vign.g;
        bx.fillRect(0, 0, w, h);
      }

      // ---- 合成到主画布
      ctx.drawImage(S.bg, 0, 0, w, h);

      // ---- 前景：生灵与粒子（全分辨率，保持锐度）
      drawBeasts(ctx, w, h, dt);
      drawBytes(ctx, w, h, dt);
      drawQuanta(ctx, w, h, dt);
    }

    function pointer(nx, ny) {
      S.tpx = nx * 26;
      S.tpy = ny * 16;
    }

    sprites();
    return { frame: frame, pointer: pointer };
  }

  /* ============================================================
   * A · 未来线引擎 ②：粒子标题「AI为伴的云时代」
   * ============================================================ */
  function createTitle(canvas) {
    const T = {
      canvas: canvas, W: 0, H: 0, built: false, need: false, buildAt: 0,
      parts: [], sprite: null, sprRect: null, blk: null,
      t0: 0, t: 0, crisp: 0, scanned: 0,
    };

    /* 逐字绘制（手动字距，保证掩膜采样与预渲染像素级一致） */
    function drawChars(ctx, chars, gap, padX, baseY, stroke) {
      let x = padX;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      for (const ch of chars) {
        if (stroke) ctx.strokeText(ch, x, baseY);
        else ctx.fillText(ch, x, baseY);
        x += ctx.measureText(ch).width + gap;
      }
    }

    function layout(w, h) {
      if (w < 40 || h < 40) return;
      T.W = w; T.H = h;
      const chars = TITLE_TEXT.split("");
      const nr = narrow();
      const availW = w * (nr ? .93 : .84);
      const pad = 20;

      // 反推字号
      const mc = U.mkCanvas(8, 8).getContext("2d");
      let fs = 120;
      mc.font = "900 " + fs + "px " + F_HEI;
      let raw = 0;
      chars.forEach((c, i) => { raw += mc.measureText(c).width + (i ? fs * .05 : 0); });
      fs = fs * availW / Math.max(1, raw);
      fs = Math.min(fs, h * (nr ? .16 : .2));
      fs = Math.max(16, fs);
      const gap = fs * .05;
      // 字距与字号同比例缩放，故实际字宽可直接按比例求出 → 掩膜块贴合文字，保证居中
      const textW = raw * fs / 120;

      // 掩膜（一次性离屏）
      const maskW = Math.ceil(textW + pad * 2);
      const maskH = Math.ceil(fs * 1.55);
      const mask = U.mkCanvas(maskW, maskH);
      const mctx = mask.getContext("2d");
      mctx.font = "900 " + fs + "px " + F_HEI;
      mctx.fillStyle = "#fff";
      drawChars(mctx, chars, gap, pad, fs * 1.2);

      // 采样
      let data = null;
      try { data = mctx.getImageData(0, 0, maskW, maskH).data; } catch (e) { data = null; }
      const target = Math.round(nr ? 420 : 720);
      const pts = [];
      if (data) {
        let step = 4;
        for (let tries = 0; tries < 4; tries++) {
          pts.length = 0;
          for (let y = 0; y < maskH; y += step) {
            for (let x = 0; x < maskW; x += step) {
              const jx = (U.rand(-step, step) * .35) | 0;
              const jy = (U.rand(-step, step) * .35) | 0;
              const px = clamp(x + jx, 0, maskW - 1), py = clamp(y + jy, 0, maskH - 1);
              const a = data[(py * maskW + px) * 4 + 3];
              if (a > 96) pts.push({ x: x + jx, y: y + jy, a: a / 255 });
            }
          }
          if (pts.length >= target * 1.25) break;
          if (step <= 2) break;
          step -= 1;
        }
      }
      // 随机抽稀到目标数量
      if (pts.length > target) {
        for (let i = pts.length - 1; i > 0; i--) {
          const j = (Math.random() * (i + 1)) | 0;
          const t = pts[i]; pts[i] = pts[j]; pts[j] = t;
        }
        pts.length = target;
      }
      // 屏幕坐标块
      const blkY = h * (nr ? .28 : .32);
      const blkW = maskW, blkH = maskH;
      const blkX = (w - blkW) * .5;
      T.blk = { x: blkX, y: blkY, w: blkW, h: blkH, fs: fs };

      // 粒子初始状态：自下方升起，底部先到
      T.parts = [];
      for (const p of pts) {
        const tx = blkX + p.x, ty = blkY + p.y;
        const normY = clamp((p.y) / blkH, 0, 1);
        T.parts.push({
          tx: tx, ty: ty,
          sx: tx + U.rand(-w * .1, w * .1),
          sy: h + U.rand(30, h * .55 + 260),
          a: .35 + p.a * .65,
          delay: (1 - normY) * 900 + U.rand(0, 280),
          dur: U.rand(620, 1180),
          tw: U.rand(0, TAU), tws: U.rand(.7, 2.4),
          jit: U.rand(.35, 1.25),
          sz: 1.1 + p.a * 1.5 + U.rand(0, .8),
          glyph: Math.random() < .07,
        });
      }

      // 预渲染清晰字形（结晶层）
      const k = Math.min(2, U.DPR());
      const spr = U.mkCanvas(blkW * k, blkH * k);
      const sc = spr.getContext("2d");
      sc.setTransform(k, 0, 0, k, 0, 0);
      sc.font = "900 " + fs + "px " + F_HEI;
      sc.textAlign = "left"; sc.textBaseline = "alphabetic";
      // 光晕
      sc.shadowColor = "rgba(78,190,255,.95)";
      sc.shadowBlur = 18;
      sc.fillStyle = "rgba(72,176,255,.7)";
      drawChars(sc, chars, gap, pad, fs * 1.2);
      // 主体
      const tg = sc.createLinearGradient(0, fs * .1, 0, fs * 1.32);
      tg.addColorStop(0, "rgba(255,255,255,.98)");
      tg.addColorStop(.45, "rgba(198,242,255,.96)");
      tg.addColorStop(1, "rgba(87,232,216,.9)");
      sc.shadowBlur = 8;
      sc.fillStyle = tg;
      drawChars(sc, chars, gap, pad, fs * 1.2);
      sc.shadowBlur = 0;
      // 细描边（赛博锐边）：逐字描边，保证与手动字距对齐
      sc.lineWidth = .7;
      sc.strokeStyle = "rgba(190,246,255,.55)";
      drawChars(sc, chars, gap, pad, fs * 1.2, true);

      T.sprite = spr;
      T.sprRect = { x: blkX, y: blkY, w: blkW, h: blkH };

      // 副标题定位：标题正下方
      const ui = document.getElementById("future-ui");
      if (ui) {
        const top = Math.min(blkY + blkH + Math.max(10, h * .012), h - 168);
        ui.style.top = Math.max(h * .3, top) + "px";
      }

      T.t0 = performance.now();
      T.built = true;
      T.crisp = 0;
      T.scanned = 0;
    }

    function frame(now) {
      const f = U.fitCanvas(T.canvas);
      const ctx = f.ctx, w = f.w, h = f.h;
      if (Math.abs(w - T.W) > 6 || Math.abs(h - T.H) > 6) {
        T.W = w; T.H = h;
        T.need = true;
        T.buildAt = now + (T.built ? 200 : 0);
      }
      if (T.need && now >= T.buildAt) { layout(w, h); T.need = false; }
      ctx.clearRect(0, 0, w, h);
      if (!T.built) return;

      T.t = (now - T.t0) / 1000;
      const t = T.t;

      // ---- 粒子装配 + 常驻微抖动 ----
      const n = T.parts.length;
      if (!T.buf || T.buf.length < n * 4) T.buf = new Float32Array(n * 4);
      const buf = T.buf;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      // ① 光晕层：整批生成一条矩形路径，只 fill 一次（逐粒子 fillRect 在软件渲染下太贵）
      let cnt = 0, glyphs = null;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const p = T.parts[i];
        const raw = (now - T.t0 - p.delay) / p.dur;
        if (raw <= 0) continue;
        let x, y, e;
        if (raw < 1) {
          e = U.easeOut(raw);
          x = lerp(p.sx, p.tx, e);
          y = lerp(p.sy, p.ty, e);
        } else {
          e = 1;
          x = p.tx; y = p.ty;
        }
        const amp = p.jit * e;
        const px = x + Math.sin(t * 1.5 + p.tw) * amp;
        const py = y + Math.cos(t * 1.2 + p.tw * 1.4) * amp;
        const al = p.a * (.58 + .42 * Math.sin(t * p.tws + p.tw)) * (raw < 1 ? .55 + .45 * raw : 1);
        const gs = p.sz * 2.6;
        ctx.rect(px - gs * .5, py - gs * .5, gs, gs);
        const k = cnt * 4;
        buf[k] = px; buf[k + 1] = py; buf[k + 2] = al; buf[k + 3] = p.sz;
        cnt++;
        if (p.glyph) { if (!glyphs) glyphs = []; glyphs.push(px, py, al); }
      }
      ctx.globalAlpha = .2;
      ctx.fillStyle = "rgba(70,150,255,1)";
      ctx.fill();

      // ② 核心层：按亮度分桶，每桶只 fill 一次（700+ 次 fillRect 在软件光栅下太贵）
      const NB = 5;
      for (let bk = 0; bk < NB; bk++) {
        ctx.beginPath();
        for (let k = 0; k < cnt; k++) {
          const b4 = k * 4;
          const al = buf[b4 + 2];
          const q = al < .34 ? 0 : al < .5 ? 1 : al < .66 ? 2 : al < .84 ? 3 : 4;
          if (q !== bk) continue;
          const cs = buf[b4 + 3];
          ctx.rect(buf[b4] - cs * .5, buf[b4 + 1] - cs * .5, cs, cs);
        }
        ctx.globalAlpha = (bk + .55) / NB;
        ctx.fillStyle = "rgba(210,248,255,1)";
        ctx.fill();
      }
      // 青绿点缀粒子（约 1/11）
      ctx.beginPath();
      for (let k = 0; k < cnt; k += 11) {
        const b4 = k * 4, cs = buf[b4 + 3] * 1.15;
        ctx.rect(buf[b4] - cs * .5, buf[b4 + 1] - cs * .5, cs, cs);
      }
      ctx.globalAlpha = .85;
      ctx.fillStyle = "rgba(87,232,216,1)";
      ctx.fill();
      // 少量字节字符粒子（统一字体，一次批量绘制）
      if (glyphs) {
        ctx.font = "10px " + F_MONO;
        ctx.fillStyle = "rgba(150,238,255,1)";
        const GA = "01云水智";
        for (let i = 0; i < glyphs.length; i += 3) {
          ctx.globalAlpha = glyphs[i + 2] * .5;
          ctx.fillText(GA[(i / 3) % GA.length | 0], glyphs[i], glyphs[i + 1]);
        }
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // ---- 字形结晶（粒子聚拢后淡入真实字形）----
      const settleAt = 2.0;
      const want = clamp((t - settleAt) / 1.1, 0, 1);
      if (want > T.crisp) T.crisp = want;
      if (T.crisp > 0 && T.sprite) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = T.crisp * .82;
        ctx.drawImage(T.sprite, T.sprRect.x, T.sprRect.y, T.sprRect.w, T.sprRect.h);
        // 扫描光带（周期性掠过字形）
        const cyc = (t - 2.4) % 6.2;
        if (cyc > 0 && cyc < 1.5 && T.blk) {
          const band = T.blk.y + (cyc / 1.5) * T.blk.h;
          ctx.globalAlpha = Math.sin(cyc / 1.5 * Math.PI) * .8;
          ctx.beginPath();
          ctx.rect(T.blk.x, band - 7, T.blk.w, 14);
          ctx.clip();
          ctx.drawImage(T.sprite, T.sprRect.x, T.sprRect.y, T.sprRect.w, T.sprRect.h);
        }
        ctx.restore();
      }
    }

    function reset() { T.t0 = performance.now(); T.crisp = 0; }
    return { frame: frame, reset: reset, layout: layout };
  }

  /* ============================================================
   * A · 未来线页面
   * ============================================================ */
  const FUT = { built: false, L: null, sea: null, title: null, busy: false };

  function buildFuture() {
    const page = document.getElementById("page-future");
    if (!page) return null;
    if (FUT.built && page.querySelector("#future-root")) return page.querySelector("#future-root");

    page.innerHTML = `
      <div id="future-root">
        <canvas id="future-sea"></canvas>
        <canvas id="future-title"></canvas>
        <div id="future-grid"></div>
        <div id="future-scan"></div>
        <i class="fh-corner tl"></i><i class="fh-corner tr"></i>
        <i class="fh-corner bl"></i><i class="fh-corner br"></i>
        <div id="future-kicker">FUTURE · 云时代 · 水之生灵</div>
        <div id="future-ui">
          <div id="future-sub"></div>
          <div id="future-btns">
            <button class="ft-btn" data-go="blueprints">Blueprints<i></i>
              <span class="fb-en">YOUR BLUEPRINT</span></button>
            <button class="ft-btn" data-go="realnow">Real-now World<i></i>
              <span class="fb-en">THE LIVING NOW</span></button>
            <button class="ft-btn" data-go="cloud">Cloud Era<i></i>
              <span class="fb-en">ENTER THE CLOUD</span></button>
          </div>
        </div>
        <div id="future-foot"><span id="future-to-history">↺ 重回历史上的今天</span> · BYTES DESCEND INTO WATER · 一百一十一载 · 浪尖掌灯</div>
      </div>`;

    FUT.sea = createSea(document.getElementById("future-sea"));
    FUT.title = createTitle(document.getElementById("future-title"));
    FUT.built = true;
    return document.getElementById("future-root");
  }

  function typeSubtitle(L) {
    const el = document.getElementById("future-sub");
    if (!el) return;
    el.textContent = "";
    el.classList.remove("done");
    let i = 0;
    const step = () => {
      if (!L || L.dead) return;
      i++;
      el.textContent = SUB_TEXT.slice(0, i);
      if (i < SUB_TEXT.length) L.timeout(step, 72);
      else el.classList.add("done");
    };
    L.timeout(step, 60);
  }

  function enterFuture() {
    const L = U.life();
    FUT.L = L;
    FUT.busy = false;
    buildFuture();
    const root = document.getElementById("future-root");
    const sea = FUT.sea, title = FUT.title;
    if (!root || !sea || !title) return;

    // 重开：副标题、按钮、标题粒子
    const sub = document.getElementById("future-sub");
    if (sub) { sub.textContent = ""; sub.classList.remove("done"); }
    const btns = document.getElementById("future-btns");
    if (btns) btns.classList.remove("on");
    const kick = document.getElementById("future-kicker");
    if (kick) kick.classList.remove("in");
    const foot = document.getElementById("future-foot");
    if (foot) foot.classList.remove("in");
    root.classList.remove("in");
    void root.offsetWidth;
    L.timeout(() => root.classList.add("in"), 20);

    title.layout(window.innerWidth, window.innerHeight);
    title.reset();

    // 视差：鼠标轻微推移
    L.on(root, "pointermove", (e) => {
      const r = root.getBoundingClientRect();
      sea.pointer((e.clientX - r.left) / r.width - .5, (e.clientY - r.top) / r.height - .5);
    });
    L.on(root, "pointerleave", () => sea.pointer(0, 0));

    // 入口按钮
    const btnsEl = document.getElementById("future-btns");
    if (btnsEl) {
      // 清掉上次离开时可能残留的按下样式
      btnsEl.querySelectorAll(".ft-btn").forEach(x => { x.style.transform = ""; });
      L.on(btnsEl, "click", (e) => {
        const b = e.target.closest(".ft-btn");
        if (!b || FUT.busy) return;
        const go = b.dataset.go;
        if (!go) return;
        FUT.busy = true;
        b.style.transform = "translateY(-1px) scale(.97)";
        L.timeout(() => {
          App.navigate(go, {}, { transition: "flash", flashMs: 420 });
          FUT.busy = false;
        }, 240);
      });
    }

    // 重回历史上的今天（解锁火箭 / 旋转星空 / 彩虹桥）
    const toHist = document.getElementById("future-to-history");
    if (toHist) {
      L.on(toHist, "click", () => {
        if (FUT.busy) return;
        App.setUpgraded(true);
        App.navigate("history", {}, { transition: "flash", flashMs: 420 });
      });
    }

    // 时间线
    L.timeout(() => { if (kick) kick.classList.add("in"); }, 900);
    L.timeout(() => typeSubtitle(L), 2100);
    L.timeout(() => { if (btns) btns.classList.add("on"); }, 2600);
    L.timeout(() => { if (foot) foot.classList.add("in"); }, 3100);

    // 主循环（所有 rAF 都挂在 L 上）
    L.loop((now) => {
      sea.frame(now);
      title.frame(now);
    });
  }

  function leaveFuture() {
    const L = FUT.L;
    if (L) { L.kill(); FUT.L = null; }
    FUT.busy = false;
    const root = document.getElementById("future-root");
    if (root) root.classList.remove("in");
    const btns = document.getElementById("future-btns");
    if (btns) btns.classList.remove("on");
    const sub = document.getElementById("future-sub");
    if (sub) { sub.textContent = ""; sub.classList.remove("done"); }
    const foot = document.getElementById("future-foot");
    if (foot) foot.classList.remove("in");
    const kick = document.getElementById("future-kicker");
    if (kick) kick.classList.remove("in");
  }

  App.register("future", { enter: enterFuture, leave: leaveFuture });

  /* ============================================================
   * B · 历史线引擎 ①：陈列馆走廊
   * ============================================================ */
  function createHall(canvas) {
    const H = {
      canvas: canvas, W: 0, H: 0, t: 0, last: 0, img: null,
      dust: [], vign: null, fallbackGrad: null, LOOP: 46,
    };

    function buildDust(w, h) {
      H.dust = [];
      const n = narrow() ? 34 : 62;
      for (let i = 0; i < n; i++) {
        H.dust.push({
          x: U.rand(0, w), y: U.rand(0, h),
          z: U.rand(.15, 1), sp: U.rand(4, 16), ph: U.rand(0, TAU),
          sw: U.rand(.4, 1.6), sz: U.rand(.8, 2.4),
        });
      }
    }

    function drawCover(ctx, w, h, zoom, dx, dy) {
      const im = H.img;
      const iw = im.width, ih = im.height;
      const sc = Math.max(w / iw, h / ih) * zoom;
      const dw = iw * sc, dh = ih * sc;
      ctx.drawImage(im, (w - dw) * .5 + dx, (h - dh) * .5 + dy, dw, dh);
    }

    // 图片缺失时的降级画面：透视走廊 + 尽头光
    function drawFallback(ctx, w, h, zoom, dx, dy, t) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#171009");
      g.addColorStop(.55, "#241809");
      g.addColorStop(1, "#0b0704");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      const cx = w * .5 + dx, cy = h * .5 + dy;
      // 尽头光
      const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * .34 * zoom);
      rg.addColorStop(0, "rgba(255,206,138,.5)");
      rg.addColorStop(.4, "rgba(190,132,64,.18)");
      rg.addColorStop(1, "rgba(60,34,12,0)");
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.ellipse(cx, cy, Math.min(w, h) * .3 * zoom, Math.min(w, h) * .42 * zoom, 0, 0, TAU); ctx.fill();
      // 透视墙面
      ctx.save();
      ctx.globalAlpha = .5;
      ctx.strokeStyle = "rgba(226,190,132,.28)";
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 9; i++) {
        const q = i / 8;
        const top = h * (.42 - q * .46), bot = h * (.62 + q * .48);
        const lx = w * (.5 - q * .86), rx = w * (.5 + q * .86);
        ctx.beginPath(); ctx.moveTo(lx, top); ctx.lineTo(rx, top); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(lx, bot); ctx.lineTo(rx, bot); ctx.stroke();
      }
      for (let i = -4; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * w * .02, cy + i * h * .02);
        ctx.lineTo(cx + i * w * .26, cy + i * h * .3);
        ctx.stroke();
      }
      // 拱
      ctx.strokeStyle = "rgba(90,60,30,.7)";
      ctx.lineWidth = 6;
      for (let i = 1; i <= 3; i++) {
        const s = 1 + i * .42;
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.min(w, h) * .3 * s, Math.min(w, h) * .42 * s, 0, Math.PI, TAU);
        ctx.stroke();
      }
      ctx.restore();
    }

    function frame(now) {
      const f = U.fitCanvas(H.canvas);
      const ctx = f.ctx, w = f.w, h = f.h;
      const dt = Math.min(.05, (now - (H.last || now)) / 1000);
      H.last = now;
      H.t += dt;
      const t = H.t;

      if (w !== H.W || h !== H.H) {
        H.W = w; H.H = h;
        H.vign = null; H.fallbackGrad = null;
        buildDust(w, h);
      }

      // ---- 无缝循环镜头：sin 周期呼吸式缓推（1 → 1.18 → 1）
      const ph = (t % H.LOOP) / H.LOOP * TAU;
      const zoom = 1.09 - .09 * Math.cos(ph);          // 1.00 ~ 1.18
      const dx = Math.sin(ph) * w * .012;              // 轻微横向漂移
      const dy = Math.sin(ph * 2 + .7) * h * .006;

      if (H.img) drawCover(ctx, w, h, zoom, dx, dy);
      else drawFallback(ctx, w, h, zoom, dx, dy, t);

      // ---- 走过的窗光（缓慢横扫）
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const lp = (t % 19) / 19;
      const lx = (-.35 + lp * 1.7) * w;
      const lg = ctx.createLinearGradient(lx - w * .22, 0, lx + w * .22, h * .2);
      lg.addColorStop(0, "rgba(255,214,150,0)");
      lg.addColorStop(.46, "rgba(255,222,166,.16)");
      lg.addColorStop(.54, "rgba(255,238,196,.2)");
      lg.addColorStop(1, "rgba(255,210,140,0)");
      ctx.fillStyle = lg;
      ctx.save();
      ctx.transform(1, 0, -.16, 1, 0, 0);
      ctx.fillRect(lx - w * .22, 0, w * .44, h);
      ctx.restore();

      // 地面光池
      const pool = (t % 23) / 23;
      ctx.globalAlpha = .34 * Math.sin(pool * Math.PI);
      const prx = (.2 + pool * .6) * w, pry = h * .82;
      const pg = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.min(w, h) * .26);
      pg.addColorStop(0, "rgba(255,214,150,.5)");
      pg.addColorStop(1, "rgba(255,190,110,0)");
      ctx.save();
      ctx.translate(prx, pry);
      ctx.scale(1, .34);
      ctx.fillStyle = pg;
      ctx.beginPath(); ctx.arc(0, 0, Math.min(w, h) * .26, 0, TAU); ctx.fill();
      ctx.restore();
      ctx.restore();

      // ---- 漂浮尘埃光点
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const d of H.dust) {
        d.y -= d.sp * dt * (.3 + d.z);
        d.x += Math.sin(t * .55 + d.ph) * d.sw * .22;
        if (d.y < -12) { d.y = h + 12; d.x = U.rand(0, w); }
        if (d.x < -12) d.x = w + 12; if (d.x > w + 12) d.x = -12;
        const a = (.1 + d.z * .4) * (.35 + .65 * Math.sin(t * 1.4 + d.ph) * .5 + .35);
        ctx.globalAlpha = a;
        ctx.fillStyle = d.z > .7 ? "rgba(255,238,204,1)" : "rgba(255,226,178,1)";
        const s = d.sz * (.6 + d.z * 1.6);
        ctx.fillRect(d.x, d.y, s, s);
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // 暗角交给 CSS 层 #hist-vign（浏览器合成更便宜），此处不再做全屏填充
    }

    function setImage(im) { if (im && im.width) H.img = im; }
    function ready() { return !!H.img; }
    return { frame: frame, setImage: setImage, ready: ready };
  }

  /* ============================================================
   * B · 历史线引擎 ②：毛笔标题（飞白 / 晕染 / 墨滴）
   * ============================================================ */
  function createBrush(canvas) {
    const B = {
      canvas: canvas, W: 0, H: 0, sig: "",
      ink: null, bleed: null, drop: null, noise: null,
      layout: null, drops: [], t0: 0, prog: 0, playing: false,
    };

    // 纸面颗粒（destination-out 用）
    function mkNoise() {
      const c = U.mkCanvas(96, 96), x = c.getContext("2d");
      const id = x.createImageData(96, 96);
      for (let i = 0; i < id.data.length; i += 4) {
        const r = Math.random();
        id.data[i] = 0; id.data[i + 1] = 0; id.data[i + 2] = 0;
        id.data[i + 3] = r < .55 ? 0 : (r - .55) * 300;
      }
      x.putImageData(id, 0, 0);
      return c;
    }

    function mkDropSprite() {
      return mkGlowSprite(64, [
        [0, "rgba(18,14,9,.96)"], [.42, "rgba(26,19,11,.5)"],
        [.72, "rgba(34,25,15,.2)"], [1, "rgba(40,30,18,0)"]]);
    }

    function build(w, h) {
      const k = Math.min(2, U.DPR());
      const chars = HIST_TITLE.split("");
      const fs = Math.max(18, Math.min(h * .68, w * .138));
      const gap = fs * .1;
      const m = U.mkCanvas(8, 8).getContext("2d");
      m.font = "700 " + fs + "px " + F_KAI;
      let total = 0;
      chars.forEach((c, i) => { total += m.measureText(c).width + (i ? gap : 0); });
      const padX = fs * .16, padY = fs * .14;
      const cw = Math.ceil(total + padX * 2);
      const ch = Math.ceil(fs * 1.34 + padY * 2);

      const ink = U.mkCanvas(cw * k, ch * k);
      const ic = ink.getContext("2d");
      ic.setTransform(k, 0, 0, k, 0, 0);
      ic.font = "700 " + fs + "px " + F_KAI;
      ic.textBaseline = "alphabetic";
      ic.fillStyle = "#141009";
      const baseY = padY + fs * 1.02;
      const xs = [];
      let x = padX;
      chars.forEach((c) => {
        xs.push(x);
        ic.save();
        ic.translate(x, baseY + (Math.random() - .5) * fs * .03);
        ic.rotate((Math.random() - .5) * .026);
        ic.fillText(c, 0, 0);
        ic.restore();
        x += m.measureText(c).width + gap;
      });

      // 飞白：横向干笔擦除
      ic.globalCompositeOperation = "destination-out";
      for (let i = 0; i < 130; i++) {
        ic.globalAlpha = U.rand(.04, .2);
        ic.fillStyle = "#000";
        ic.fillRect(U.rand(0, cw), U.rand(0, ch), fs * U.rand(.1, .5), U.rand(.5, 1.8));
      }
      // 纸颗粒侵蚀
      if (!B.noise) B.noise = mkNoise();
      try {
        const pat = ic.createPattern(B.noise, "repeat");
        ic.globalAlpha = .34;
        ic.fillStyle = pat;
        ic.fillRect(0, 0, cw, ch);
      } catch (e) { /* 忽略 */ }
      ic.globalAlpha = 1;
      ic.globalCompositeOperation = "source-over";

      // 墨晕：偏移叠印 + 着色
      const bleed = U.mkCanvas(cw * k, ch * k);
      const bc = bleed.getContext("2d");
      for (let i = 0; i < 9; i++) {
        const a = i / 9 * TAU;
        bc.globalAlpha = .16;
        bc.drawImage(ink, Math.cos(a) * 5 * k, Math.sin(a) * 5 * k);
      }
      bc.globalAlpha = 1;
      bc.globalCompositeOperation = "source-in";
      bc.fillStyle = "rgba(46,34,18,.9)";
      bc.fillRect(0, 0, bleed.width, bleed.height);

      // 墨滴
      B.drops = [];
      const dn = narrow() ? 6 : 10;
      for (let i = 0; i < dn; i++) {
        B.drops.push({
          x: U.rand(.06, .94) * cw, y: U.rand(.12, .88) * ch,
          r: U.rand(4, 12) * (fs / 60), t0: U.rand(.05, .78), a: U.rand(.35, .7),
        });
      }

      B.ink = ink; B.bleed = bleed;
      B.drop = B.drop || mkDropSprite();
      B.layout = { cw: cw, ch: ch, fs: fs, xs: xs, chars: chars, gap: gap, k: k };
      B.sig = w + "x" + h;
    }

    function frame(now) {
      const f = U.fitCanvas(B.canvas);
      const ctx = f.ctx, w = f.w, h = f.h;
      if (w < 30 || h < 20) return;
      const sig = w + "x" + h;
      // 尺寸变化才重建离屏墨迹；连续拖动窗口时最多每 160ms 重建一次
      if (sig !== B.sig && (B.sig === "" || now - (B.lastBuildAt || 0) > 160)) {
        build(w, h);
        B.lastBuildAt = now;
      }

      const L = B.layout;
      if (!L) return;
      ctx.clearRect(0, 0, w, h);

      // 揭示进度：约 2.6s
      if (B.playing) B.prog = Math.min(1, (now - B.t0) / 2600);
      const prog = U.easeOut(B.prog);
      const ox = (w - L.cw) * .5, oy = (h - L.ch) * .5;
      const n = L.chars.length;

      // 逐字竖向笔触渐显（裁剪窗口必须以文字块偏移 ox/oy 为基准）
      ctx.save();
      for (let i = 0; i < n; i++) {
        if (prog <= 0) break;
        const st = i * .072, du = .46;
        const p = clamp((prog - st) / du, 0, 1);
        if (p <= 0) continue;
        const cx0 = ox + L.xs[i] - L.gap * .5;
        const cwid = L.gap + L.fs * 1.02;
        const cutY = L.ch * p;
        ctx.save();
        ctx.beginPath();
        ctx.rect(cx0, oy, cwid, cutY);
        ctx.clip();
        ctx.globalAlpha = .85;
        ctx.drawImage(B.bleed, ox, oy, L.cw, L.ch);
        ctx.globalAlpha = 1;
        ctx.drawImage(B.ink, ox, oy, L.cw, L.ch);
        ctx.restore();
      }
      ctx.restore();

      // 墨滴扩散
      ctx.save();
      for (const d of B.drops) {
        const age = prog - d.t0;
        if (age <= 0 || age > .46) continue;
        const q = age / .46;
        const r = d.r * (1.1 + q * 2.6);
        ctx.globalAlpha = (1 - q) * d.a;
        ctx.drawImage(B.drop, ox + d.x - r, oy + d.y - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // 完成后湿墨微呼吸
      if (prog >= 1) {
        const br = .06 + .05 * Math.sin(now * .0016);
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = br;
        ctx.drawImage(B.bleed, ox, oy, L.cw, L.ch);
        ctx.globalAlpha = 1;
      }
    }

    function play(now) { B.t0 = now; B.prog = 0; B.playing = true; }
    function reset() { B.playing = false; B.prog = 0; }
    return { frame: frame, play: play, reset: reset };
  }

  /* ============================================================
   * B · 历史线页面
   * ============================================================ */
  const HIST = { built: false, L: null, hall: null, brush: null, busy: false };

  // 鸡毛信 SVG（牛皮质感 + 蜡封 + 羽毛）；i 用于区分渐变 id
  function letterSVG(i) {
    const G = "s" + i;
    return `<svg class="fea-svg" viewBox="0 0 220 214" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="fp${G}" x1="0" y1="0" x2=".9" y2="1">
          <stop offset="0" stop-color="#d2b585"/><stop offset=".42" stop-color="#b7966a"/>
          <stop offset=".78" stop-color="#9d7f53"/><stop offset="1" stop-color="#7d6239"/>
        </linearGradient>
        <linearGradient id="ff${G}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#cdb083"/><stop offset="1" stop-color="#977a52"/>
        </linearGradient>
        <radialGradient id="fw${G}" cx=".36" cy=".3" r=".78">
          <stop offset="0" stop-color="#d0564a"/><stop offset=".5" stop-color="#9d2f28"/>
          <stop offset="1" stop-color="#5d1512"/>
        </radialGradient>
        <linearGradient id="fq${G}" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stop-color="#efd8ad"/><stop offset=".5" stop-color="#c99a5c"/>
          <stop offset="1" stop-color="#8a5f33"/>
        </linearGradient>
      </defs>
      <path d="M110 0 L110 82" stroke="rgba(214,192,150,.5)" stroke-width="1.5" fill="none"/>
      <circle cx="110" cy="80" r="2.6" fill="#dcc59a"/>
      <g transform="rotate(-12 148 88)"><g class="fea-feather">
        <path d="M147 96 C166 74 179 44 176 5 C159 22 149 50 142 84 Z"
          fill="url(#fq${G})" stroke="rgba(88,56,24,.85)" stroke-width=".9"/>
        <path d="M145 92 C156 66 167 36 176 5" fill="none" stroke="rgba(84,52,20,.92)" stroke-width="1.5"/>
        <g stroke="rgba(255,240,208,.6)" stroke-width=".75" fill="none" stroke-linecap="round">
          <path d="M149 84 C158 78 166 74 174 71"/><path d="M152 70 C161 64 169 60 178 57"/>
          <path d="M155 56 C163 51 171 47 179 44"/><path d="M159 42 C166 38 172 35 179 32"/>
          <path d="M166 26 C171 23 175 21 179 19"/>
        </g>
        <g stroke="rgba(96,58,22,.7)" stroke-width=".7" fill="none" stroke-linecap="round">
          <path d="M146 88 C143 82 142 76 142 70"/><path d="M149 74 C146 68 145 62 146 56"/>
          <path d="M152 60 C150 54 150 48 151 42"/><path d="M156 46 C155 41 155 36 156 31"/>
        </g>
        <path d="M176 5 C173 14 172 22 173 30" fill="none" stroke="rgba(255,246,220,.5)" stroke-width=".8"/>
      </g></g>
      <g class="fea-body">
        <rect x="14" y="86" width="192" height="118" rx="3" fill="url(#fp${G})"
          stroke="#6a5132" stroke-width="1.1"/>
        <path d="M14 86 L110 154 L206 86" fill="none" stroke="rgba(88,64,32,.55)" stroke-width="1.4"/>
        <path d="M14 204 L76 152 M206 204 L144 152" fill="none" stroke="rgba(108,80,42,.4)" stroke-width="1.1"/>
        <path d="M14 86 L110 154 L206 86 L206 204 L14 204 Z" fill="none"
          stroke="rgba(68,48,22,.34)" stroke-width="1"/>
        <ellipse cx="62" cy="186" rx="26" ry="12" fill="rgba(96,68,32,.12)"/>
        <g class="fea-wax">
          <circle cx="110" cy="154" r="18" fill="url(#fw${G})" stroke="rgba(255,220,190,.24)"/>
          <circle cx="110" cy="154" r="18" fill="none" stroke="rgba(56,10,8,.5)" stroke-width="1"/>
          <circle cx="110" cy="154" r="12.5" fill="none" stroke="rgba(255,226,196,.24)" stroke-width=".8"/>
          <text x="110" y="160" text-anchor="middle" font-family="KaiTi,STKaiti,serif"
            font-size="16" fill="rgba(252,228,200,.88)">河</text>
        </g>
      </g>
    </svg>`;
  }

  const LETTERS = [
    { side: "l", go: "hall", name: "名贤堂", en: "HALL OF NOTABLES",
      tip: "点击启封 · 敬 " + D.ALUMNI.length + " 位先生" },
    { side: "c", go: "pivot", name: "史之枢机", en: "PIVOT OF HISTORY",
      tip: "点击启封 · 观校史 " + D.HISTORY.length + " 节点" },
    { side: "r", go: "water", name: "水利家国", en: "WATER & NATION",
      tip: "点击启封 · 览 " + D.BUILDINGS.length + " 项大国重器" },
  ];

  function buildHistory() {
    const page = document.getElementById("page-history");
    if (!page) return null;
    if (HIST.built && page.querySelector("#history-root")) return page.querySelector("#history-root");

    const now = U.nowNanjing();
    const letters = LETTERS.map((L, i) => `
      <div class="fea-letter fea-${L.side}" data-go="${L.go}">
        <div class="fea-swing">
          ${letterSVG(i)}
          <div class="fea-plate">
            <span class="fea-name">${L.name}</span>
            <span class="fea-en">${L.en}</span>
            <span class="fea-tip">${L.tip}</span>
          </div>
        </div>
        <div class="fea-burst"></div>
      </div>`).join("");

    page.innerHTML = `
      <div id="history-root">
        <canvas id="hist-bg"></canvas>
        <div id="hist-vign"></div>
        <div id="hist-cyber"></div>
        <div id="hist-banner">
          <i class="hb-roller hb-top"></i>
          <canvas id="hist-brush"></canvas>
          <div class="hist-seal">史</div>
          <i class="hb-roller hb-bot"></i>
        </div>
        <div id="hist-date">今日 · <b>${now.dateText}</b> · 河海一百一十一载</div>
        <div id="hist-tag">修进形态 · 已从云时代归来</div>
        <div id="hist-letters">${letters}</div>
        <div id="hist-hint">悬停信笺可见微光 · 点击启封，入子卷</div>
      </div>`;

    HIST.hall = createHall(document.getElementById("hist-bg"));
    HIST.brush = createBrush(document.getElementById("hist-brush"));
    HIST.built = true;
    return document.getElementById("history-root");
  }

  function enterHistory() {
    const L = U.life();
    HIST.L = L;
    HIST.busy = false;
    buildHistory();
    const root = document.getElementById("history-root");
    const hall = HIST.hall, brush = HIST.brush;
    if (!root || !hall || !brush) return;

    // 修进形态判定（从云时代归来）
    const upgraded = !!(App.state && App.state.historyUpgraded);
    root.classList.toggle("upgraded", upgraded);

    root.classList.remove("in");
    root.classList.remove("sealed");
    void root.offsetWidth;
    L.timeout(() => root.classList.add("in"), 20);

    // 背景图加载（失败则保持程序化降级画面；已加载过就直接复用，避免闪一帧）
    U.loadImg(IMG_CORRIDOR)
      .then((im) => { if (!L.dead) hall.setImage(im); })
      .catch(() => { /* 降级：程序化走廊 */ });

    // 毛笔标题：延迟起笔
    brush.reset();
    const brushStart = (now) => brush.play(now);
    L.timeout(() => brushStart(performance.now()), 380);
    L.timeout(() => root.classList.add("sealed"), 2400);

    const dateEl = document.getElementById("hist-date");
    if (dateEl) {
      // 每次进入都刷新"今日"
      const nd = U.nowNanjing();
      dateEl.innerHTML = "今日 · <b>" + nd.dateText + "</b> · 河海一百一十一载";
      L.timeout(() => dateEl.classList.add("in"), 1000);
    }
    const hintEl = document.getElementById("hist-hint");
    if (hintEl) L.timeout(() => hintEl.classList.add("in"), 2600);

    // 三封鸡毛信
    const box = document.getElementById("hist-letters");
    if (box) {
      L.on(box, "click", (e) => {
        const el = e.target.closest(".fea-letter");
        if (!el || HIST.busy) return;
        const go = el.dataset.go;
        if (!go) return;
        HIST.busy = true;
        el.classList.add("opening");
        // 拆封的光散 → 跳转（约 500ms）
        L.timeout(() => {
          App.navigate(go, {}, { transition: "flash", flashMs: 460 });
          HIST.busy = false;
        }, 520);
      });
    }

    // 主循环
    L.loop((now) => {
      hall.frame(now);
      brush.frame(now);
    });
  }

  function leaveHistory() {
    const L = HIST.L;
    if (L) { L.kill(); HIST.L = null; }
    HIST.busy = false;
    if (HIST.brush) HIST.brush.reset();
    const root = document.getElementById("history-root");
    if (root) {
      root.classList.remove("in");
      root.classList.remove("upgraded");
      root.classList.remove("sealed");
    }
    const box = document.getElementById("hist-letters");
    if (box) box.querySelectorAll(".fea-letter.opening").forEach(el => el.classList.remove("opening"));
    const d = document.getElementById("hist-date");
    if (d) d.classList.remove("in");
    const h = document.getElementById("hist-hint");
    if (h) h.classList.remove("in");
  }

  App.register("history", { enter: enterHistory, leave: leaveHistory });
})();

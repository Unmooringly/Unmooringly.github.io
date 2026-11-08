/* ============================================================
 * Cloud Era · 算力之上的云海
 * 河海大学 111 校史 · 在 AI 时代的蜕变与憧憬
 * ------------------------------------------------------------
 * 结构：
 *   #cl-root
 *     #cl-bg     背景画布：天光 → 三层云海（预渲染贴图）→ 光纤束 → 云上算力中心 → 浮尘
 *     #cl-scroll 内容滚动层：首屏 → 三支浮窗（云形）→ 尾结语 → 无尽代码
 *     #cl-fx     前景画布：悬停浮窗的量子/夸克环绕与拖尾
 *     #cl-head   左上角小字标题
 *     #cl-more   右上角「了解更多」（抓取冷却时变为 deepseek 深度思考ing 动效）
 * ------------------------------------------------------------
 * 性能：
 *   · 每朵云一张离屏贴图，只在初始化 / 改尺寸时生成一次，逐帧只 drawImage
 *   · 光纤用 Path2D 缓存路径，脉冲只做精灵贴图 + 少量短线
 *   · 粒子总数 < 1200；代码输出框 DOM 限长 120 行
 * ============================================================ */
(function () {
  "use strict";
  const U = window.Utils, D = window.DATA;
  const TAU = Math.PI * 2;

  /* ================================================================
   * 常量 / 文案
   * ================================================================ */
  const COOLDOWN = 30000;                       // 抓取成功后最短间隔（毫秒）
  const GLYPHS = "01河海云算光流∞λΩ<>/01";      // 字节乱码字符表
  const HERO_LINE = "当算力升上云层，\n江河也有了新的海拔。";
  const EPI_1 = "读取着复兴的关键词，你心里正创造着怎样的时代？";
  const EPI_2 = "望向信息的云端，你的思维正飞向怎样的云海？";
  const FIBER_COLS = [
    [70, 205, 238], [140, 108, 226], [232, 172, 52],
    [54, 198, 152], [226, 106, 178], [72, 140, 228],
  ];
  const BRANCH_KEYS = ["分支一", "分支二", "分支三"];
  const BRANCH_NO = ["BRANCH 01", "BRANCH 02", "BRANCH 03"];
  const BRANCH_SUB = [
    "从电子管到智能体 · 八段坐标",
    "世界级云算力中心 · 八座机房",
    "近期尖端科技成品 · 自动检索",
  ];

  /* ================================================================
   * 样式
   * ================================================================ */
  U.injectCSS("css-cloud", `
  #page-cloud{background:#cbe6f6;}
  #cl-root{position:absolute;inset:0;overflow:hidden;cursor:default;background:
    radial-gradient(120% 90% at 18% 0%, #f2fbff 0%, #d8eefb 42%, #c2e0f2 100%);}
  #cl-root.grabbing{cursor:grabbing;}
  /* 顶部柔光罩：滚动内容在标题区域柔和淡出 */
  #cl-root::after{content:"";position:absolute;left:0;right:0;top:0;height:74px;z-index:5;
    pointer-events:none;
    background:linear-gradient(180deg,rgba(247,252,255,.6) 0%,rgba(247,252,255,.22) 52%,
      rgba(247,252,255,0) 100%);}
  #cl-bg{position:absolute;inset:0;width:100%;height:100%;z-index:1;display:block;}
  #cl-fx{position:absolute;inset:0;width:100%;height:100%;z-index:4;display:block;pointer-events:none;}
  #cl-scroll{position:absolute;inset:0;z-index:3;overflow-y:auto;overflow-x:hidden;
    overscroll-behavior:contain;-webkit-overflow-scrolling:touch;}
  #cl-scroll::-webkit-scrollbar{width:5px;}
  #cl-scroll::-webkit-scrollbar-thumb{background:rgba(96,140,180,.4);border-radius:3px;}
  #cl-doc{position:relative;width:100%;padding-bottom:10vh;}

  /* ---------- 左上角小字标题 ---------- */
  #cl-head{position:absolute;left:clamp(16px,3vw,42px);top:clamp(16px,3vh,30px);z-index:7;
    pointer-events:none;transition:opacity .6s ease,transform .6s var(--ease);}
  #cl-head.dim{opacity:0;transform:translateY(-8px);}
  #cl-head .h-en{font-family:var(--f-mono);font-size:clamp(8px,.82vw,10px);letter-spacing:.42em;
    color:rgba(28,74,110,.66);text-indent:.42em;margin-bottom:6px;}
  #cl-head .h-cn{font-family:var(--f-kai);font-size:clamp(13px,1.34vw,17px);letter-spacing:.16em;
    color:#103c5e;text-shadow:0 1px 0 rgba(255,255,255,.72),0 0 22px rgba(255,255,255,.6);}
  #cl-head .h-cn i{font-style:normal;color:rgba(28,74,110,.5);margin:0 .28em;}

  /* ---------- 右上角 了解更多 ---------- */
  #cl-more-wrap{position:absolute;right:clamp(12px,2.2vw,26px);top:clamp(72px,10vh,96px);z-index:7;
    display:flex;flex-direction:column;align-items:flex-end;gap:7px;}
  #cl-more{position:relative;display:inline-flex;align-items:center;gap:8px;cursor:pointer;
    font-family:var(--f-hei);font-size:12px;letter-spacing:.18em;color:#0e3d61;
    padding:9px 18px;border-radius:22px;border:1px solid rgba(52,110,158,.34);
    background:linear-gradient(150deg,rgba(255,255,255,.92),rgba(214,236,250,.86));
    box-shadow:0 8px 22px -10px rgba(24,70,110,.55),inset 0 1px 0 rgba(255,255,255,.95);
    transition:transform .35s var(--ease),box-shadow .35s ease,opacity .35s ease;text-indent:.18em;}
  #cl-more:hover{transform:translateY(-2px);
    box-shadow:0 12px 28px -10px rgba(20,80,140,.62),0 0 0 1px rgba(120,200,255,.5),inset 0 1px 0 #fff;}
  #cl-more .arw{font-family:var(--f-mono);font-size:11px;opacity:.6;text-indent:0;transition:transform .35s var(--ease);}
  #cl-more:hover .arw{transform:translateX(3px);}
  #cl-more .mt{display:none;align-items:center;gap:5px;text-indent:0;}
  #cl-more .mt b{font-family:var(--f-hei);font-weight:400;font-size:11px;letter-spacing:.1em;
    color:#1b6f97;opacity:.9;}
  #cl-more .mt s{display:inline-flex;gap:4px;align-items:center;text-decoration:none;}
  #cl-more .mt i{width:4.5px;height:4.5px;border-radius:50%;background:#59cdf2;
    box-shadow:0 0 8px rgba(90,210,255,.9);animation:clDot 1.15s ease-in-out infinite;}
  #cl-more .mt i:nth-child(2){animation-delay:.16s;}
  #cl-more .mt i:nth-child(3){animation-delay:.32s;}
  @keyframes clDot{0%,58%,100%{transform:translateY(0) scale(.62);opacity:.35;}
    26%{transform:translateY(-4px) scale(1);opacity:1;}}
  #cl-more.thinking{cursor:not-allowed;color:#1b6f97;pointer-events:none;
    animation:clHalo 2.6s ease-in-out infinite;border-color:rgba(90,200,240,.55);}
  #cl-more.thinking .ml,#cl-more.thinking .arw{display:none;}
  #cl-more.thinking .mt{display:inline-flex;}
  @keyframes clHalo{0%,100%{box-shadow:0 0 0 0 rgba(90,205,250,.08),inset 0 1px 0 #fff;}
    50%{box-shadow:0 0 26px 2px rgba(90,205,250,.42),inset 0 1px 0 #fff;}}
  #cl-src{display:flex;align-items:center;gap:6px;font-family:var(--f-mono);
    font-size:9.5px;letter-spacing:.08em;color:rgba(24,68,102,.66);max-width:min(56vw,320px);
    text-align:right;line-height:1.5;}
  #cl-src em{width:5px;height:5px;border-radius:50%;background:#3fc0e0;flex:0 0 auto;
    box-shadow:0 0 9px rgba(63,192,224,.9);animation:clSrc 2.4s ease-in-out infinite;}
  #cl-src.warn em{background:#e2a94a;box-shadow:0 0 9px rgba(226,169,74,.9);}
  @keyframes clSrc{0%,100%{opacity:.35;}50%{opacity:1;}}

  /* ---------- 首屏 ---------- */
  .cl-hero{position:relative;min-height:58vh;display:flex;flex-direction:column;
    justify-content:center;padding:6vh clamp(20px,6vw,96px) 0;box-sizing:border-box;}
  .cl-hero .kick{font-family:var(--f-mono);font-size:clamp(8px,.8vw,10px);letter-spacing:.44em;
    color:rgba(30,80,118,.62);margin-bottom:clamp(12px,2vh,22px);text-indent:.44em;}
  .cl-hero h1{font-family:var(--f-kai);font-weight:400;letter-spacing:.06em;
    font-size:clamp(21px,3.05vw,42px);line-height:1.62;color:#0d3653;max-width:12.5em;
    text-shadow:0 2px 0 rgba(255,255,255,.6),0 0 40px rgba(255,255,255,.55);}
  .cl-hero h1 .by{transition:color .25s ease;}
  .cl-hero .kicker{font-family:var(--f-song);font-size:clamp(11px,1.05vw,14px);letter-spacing:.22em;
    color:rgba(22,72,104,.72);margin-top:clamp(14px,2.4vh,26px);line-height:2;
    opacity:0;animation:clFade 1.8s ease 1.1s forwards;}
  .cl-hero .kick{opacity:0;animation:clFade 1.4s ease .3s forwards;}
  @keyframes clFade{to{opacity:1;}}
  .cl-hint{position:absolute;left:clamp(20px,6vw,96px);bottom:2.4vh;
    display:flex;flex-direction:column;align-items:flex-start;gap:9px;
    font-family:var(--f-mono);font-size:9.5px;letter-spacing:.34em;
    color:rgba(26,74,108,.62);text-indent:.34em;pointer-events:none;}
  .cl-hint s{display:block;width:1px;height:44px;text-decoration:none;
    background:linear-gradient(180deg,rgba(60,150,210,.7),rgba(60,150,210,0));
    animation:clHint 2.6s ease-in-out infinite;transform-origin:top;}
  @keyframes clHint{0%,100%{transform:scaleY(.25);opacity:.3;}50%{transform:scaleY(1);opacity:1;}}

  /* ---------- 字节显现 ---------- */
  .by{position:relative;display:inline-block;white-space:pre;opacity:.16;
    transition:opacity .3s ease,color .35s ease,text-shadow .35s ease;}
  .by.on{opacity:1;}

  /* ---------- 三支浮窗 ---------- */
  .cl-branches{position:relative;padding:clamp(10px,2vh,26px) clamp(14px,4.4vw,64px) 2vh;}
  .cl-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));
    gap:clamp(14px,2.1vw,38px);max-width:1460px;margin:0 auto;align-items:start;}
  .cl-col{position:relative;min-width:0;}
  .cl-bh{position:relative;margin:0 0 clamp(24px,3.4vh,40px);padding-left:2px;}
  .cl-bh .no{font-family:var(--f-mono);font-size:9px;letter-spacing:.36em;
    color:rgba(26,82,120,.62);text-indent:.36em;}
  .cl-bh h2{font-family:var(--f-kai);font-weight:400;font-size:clamp(15px,1.6vw,22px);
    letter-spacing:.13em;color:#0e3a58;margin:7px 0 6px;
    text-shadow:0 1px 0 rgba(255,255,255,.7),0 0 26px rgba(255,255,255,.6);}
  .cl-bh .sub{font-family:var(--f-song);font-size:clamp(10px,.94vw,12px);letter-spacing:.1em;
    color:rgba(26,74,108,.6);line-height:1.8;}
  .cl-bh .line{height:1px;margin-top:12px;width:74%;
    background:linear-gradient(90deg,rgba(70,150,205,.55),rgba(70,150,205,0));}

  /* 云形浮窗 */
  .cw{position:relative;display:block;isolation:isolate;margin:0 0 clamp(50px,6.2vh,70px);
    padding:clamp(14px,1.5vw,19px) clamp(16px,1.7vw,22px) clamp(15px,1.6vw,20px);
    transition:transform .5s var(--ease);}
  .cw-body{position:absolute;inset:-15px -17px -13px;z-index:-1;
    border-radius:46px 62px 40px 50px / 44px 52px 38px 42px;
    background:
      radial-gradient(78% 92% at 22% -26%, rgba(255,255,255,.55) 0%, rgba(255,255,255,0) 62%),
      linear-gradient(168deg, rgba(96,136,180,.96) 0%, rgba(66,104,150,.96) 46%, rgba(40,74,116,.98) 100%);
    box-shadow:0 20px 34px -18px rgba(26,64,104,.7),
      0 2px 0 rgba(255,255,255,.4) inset,0 -16px 26px -20px rgba(16,46,80,.95) inset;
    transition:transform .5s var(--ease),box-shadow .5s ease;}
  .cw-body::before,.cw-body::after{content:"";position:absolute;border-radius:50%;
    background:radial-gradient(circle at 38% 20%, rgba(232,244,252,.99), rgba(152,188,222,.98) 54%, rgba(92,132,176,1) 100%);
    box-shadow:0 2px 0 rgba(255,255,255,.5) inset,0 -8px 14px -10px rgba(16,46,80,.85) inset,0 10px 16px -12px rgba(26,64,104,.6);}
  .cw-body::before{width:23%;height:31%;left:5%;top:-12%;}
  .cw-body::after{width:17%;height:24%;right:7%;top:-9%;}
  .cw-ring{position:absolute;inset:-18px -20px -16px;z-index:-2;pointer-events:none;opacity:0;
    border-radius:48px 64px 42px 52px / 46px 54px 40px 44px;padding:2.4px;
    background:conic-gradient(from 0deg,#5ee6ff,#9d8bff,#ffd08a,#8dffce,#ff9ad8,#5ee6ff);
    -webkit-mask:linear-gradient(#000,#000) content-box,linear-gradient(#000,#000);
    -webkit-mask-composite:xor;mask:linear-gradient(#000,#000) content-box,linear-gradient(#000,#000);
    mask-composite:exclude;
    transition:opacity .4s ease,transform .5s var(--ease);filter:saturate(1.3);}
  .cw.on .cw-ring{opacity:1;animation:cwRing 2.6s linear infinite;}
  @keyframes cwRing{0%{filter:hue-rotate(0deg) brightness(1.15) saturate(1.4);}
    50%{filter:hue-rotate(180deg) brightness(1.75) saturate(1.6);}
    100%{filter:hue-rotate(360deg) brightness(1.15) saturate(1.4);}}
  .cw.on .cw-body{transform:translateY(-3px);
    box-shadow:0 26px 42px -18px rgba(30,80,150,.75),0 0 30px -6px rgba(140,230,255,.75),
      0 0 0 1px rgba(190,240,255,.6) inset,0 -16px 26px -20px rgba(24,58,96,.9) inset;}
  .cw-copy{position:relative;z-index:2;transition:transform .55s var(--ease),opacity .45s ease;}
  .cw-meta{display:flex;align-items:center;gap:9px;margin-bottom:7px;}
  .cw-tag{font-family:var(--f-hei);font-size:9.5px;letter-spacing:.16em;padding:2.5px 8px;
    border-radius:20px;color:#eaf7ff;background:rgba(24,78,120,.5);
    border:1px solid rgba(198,236,255,.42);text-indent:.16em;white-space:nowrap;}
  .cw-no{font-family:var(--f-mono);font-size:9px;letter-spacing:.2em;color:rgba(228,244,255,.6);}
  .cw-t{font-family:var(--f-kai);font-weight:400;font-size:clamp(13px,1.16vw,16.5px);
    letter-spacing:.06em;line-height:1.6;color:#f6fbff;
    text-shadow:0 1px 12px rgba(12,44,74,.6);}
  .cw-d{font-family:var(--f-hei);font-size:clamp(10.5px,.9vw,12.5px);line-height:1.92;
    letter-spacing:.03em;color:rgba(238,246,255,.82);margin-top:7px;
    text-shadow:0 1px 10px rgba(12,44,74,.45);}
  .cw-dot{position:absolute;left:50%;top:50%;width:7px;height:7px;margin:-3.5px 0 0 -3.5px;
    border-radius:50%;background:radial-gradient(circle,#fff,#8ee6ff 55%,rgba(90,200,255,0));
    box-shadow:0 0 14px 2px rgba(120,220,255,.85),0 0 34px 6px rgba(80,180,255,.4);
    opacity:0;transform:scale(.4);transition:opacity .5s ease .2s,transform .6s var(--ease) .12s;
    z-index:3;pointer-events:none;}
  .cw.gone{cursor:pointer;}
  .cw.gone .cw-body,.cw.gone .cw-ring{opacity:0;transform:scale(.05);transition:transform .5s var(--ease),opacity .45s ease;}
  .cw.gone .cw-copy{opacity:0;transform:scale(.06);}
  .cw.gone .cw-dot{opacity:1;transform:scale(1);animation:cwDot 2.4s ease-in-out infinite;}
  @keyframes cwDot{0%,100%{box-shadow:0 0 12px 2px rgba(120,220,255,.7),0 0 30px 5px rgba(80,180,255,.32);}
    50%{box-shadow:0 0 20px 4px rgba(160,240,255,1),0 0 46px 10px rgba(90,190,255,.55);}}
  .cw.pop{animation:cwPop .6s var(--ease);}
  @keyframes cwPop{0%{transform:scale(.9);}60%{transform:scale(1.03);}100%{transform:scale(1);}}

  /* ---------- 尾结语 ---------- */
  .cl-epi{position:relative;padding:clamp(50px,9vh,110px) clamp(16px,4vw,58px) clamp(30px,6vh,70px);}
  .cl-epi-card{position:relative;max-width:1120px;margin:0 auto;
    padding:clamp(30px,5.6vw,64px) clamp(24px,5vw,72px);
    border-radius:46px 72px 42px 64px / 54px 46px 68px 48px;
    background:linear-gradient(168deg,rgba(30,66,102,.88) 0%,rgba(18,46,74,.9) 58%,rgba(12,34,56,.92) 100%);
    box-shadow:0 48px 100px -46px rgba(8,26,46,.9),inset 0 1px 0 rgba(210,240,255,.2),
      inset 0 -30px 60px -40px rgba(0,0,0,.9);
    overflow:hidden;}
  .cl-epi-card::before{content:"";position:absolute;left:0;right:0;top:0;height:2px;
    background:linear-gradient(90deg,transparent,rgba(140,225,255,.85),rgba(255,208,140,.7),transparent);}
  .cl-epi-card::after{content:"";position:absolute;inset:0;pointer-events:none;
    background:radial-gradient(80% 60% at 20% 0%, rgba(120,200,255,.16), transparent 62%),
      radial-gradient(60% 50% at 92% 100%, rgba(255,190,120,.1), transparent 60%);}
  .cl-epi .cap{position:relative;z-index:2;font-family:var(--f-mono);font-size:9.5px;
    letter-spacing:.4em;color:rgba(150,205,235,.62);margin-bottom:clamp(16px,3vh,30px);text-indent:.4em;}
  .cli{position:relative;z-index:2;margin-bottom:clamp(12px,2vh,22px);}
  .cli-line{position:relative;display:block;
    font-family:var(--f-kai);font-size:clamp(15px,2.02vw,27px);line-height:1.92;
    letter-spacing:.06em;color:rgba(230,240,248,.82);}
  .cli-sheen{position:absolute;left:0;top:0;right:0;pointer-events:none;
    color:transparent;-webkit-text-fill-color:transparent;
    background-image:linear-gradient(100deg,rgba(255,255,255,0) 34%,#7fe6ff 43%,#f2b8ff 49%,
      #ffdc94 55%,#8dffd2 61%,rgba(255,255,255,0) 70%);
    background-size:300% 100%;background-repeat:no-repeat;
    -webkit-background-clip:text;background-clip:text;
    animation:clSheen 9s linear infinite;}
  .cli-sheen .by{color:transparent;}
  @keyframes clSheen{0%{background-position:180% 0;}100%{background-position:-80% 0;}}
  .cl-epi .sign{position:relative;z-index:2;margin-top:clamp(20px,3.4vh,36px);
    display:flex;justify-content:space-between;align-items:flex-end;gap:20px;flex-wrap:wrap;
    font-family:var(--f-song);font-size:clamp(10px,.94vw,12px);letter-spacing:.24em;
    color:rgba(168,206,232,.6);}
  .cl-epi .sign b{font-weight:400;color:rgba(210,235,250,.82);font-family:var(--f-kai);}

  /* ---------- 无尽代码 ---------- */
  .cl-end{position:relative;padding:clamp(10px,3vh,40px) clamp(14px,4vw,58px) clamp(40px,8vh,90px);}
  .cl-code{position:relative;max-width:1460px;margin:0 auto;border-radius:18px;overflow:hidden;
    border:1px solid rgba(120,190,235,.32);
    background:linear-gradient(178deg,rgba(6,17,30,.94),rgba(3,9,18,.97));
    box-shadow:0 40px 90px -44px rgba(0,16,34,.95),inset 0 1px 0 rgba(160,225,255,.16),
      0 0 70px -30px rgba(80,180,255,.4);}
  .cl-code::before{content:"";position:absolute;left:0;right:0;top:0;height:1px;
    background:linear-gradient(90deg,transparent,rgba(120,220,255,.8),transparent);}
  .cl-code-hd{display:flex;align-items:center;gap:10px;padding:9px 14px;
    border-bottom:1px solid rgba(110,180,225,.16);
    font-family:var(--f-mono);font-size:9.5px;letter-spacing:.18em;color:rgba(150,205,235,.7);
    background:linear-gradient(180deg,rgba(16,40,62,.6),rgba(8,20,34,.2));}
  .cl-code-hd .d{display:flex;gap:5px;margin-right:4px;}
  .cl-code-hd .d s{width:7px;height:7px;border-radius:50%;background:rgba(120,190,230,.32);}
  .cl-code-hd .d s:first-child{background:rgba(120,230,255,.7);box-shadow:0 0 8px rgba(120,230,255,.7);}
  .cl-code-hd .nm b{font-weight:400;color:#9ed8f4;letter-spacing:.06em;}
  .cl-code-hd .rt{margin-left:auto;display:flex;gap:14px;align-items:center;}
  .cl-code-hd .cnt{color:rgba(120,220,255,.9);font-variant-numeric:tabular-nums;}
  .cl-code-hd .live{display:inline-flex;align-items:center;gap:5px;color:rgba(120,220,255,.85);}
  .cl-code-hd .live i{width:5px;height:5px;border-radius:50%;background:#5ce0ff;
    box-shadow:0 0 9px #5ce0ff;animation:clSrc 1.6s ease-in-out infinite;}
  .cl-code pre{margin:0;height:clamp(180px,30vh,280px);overflow-y:auto;padding:12px 16px 24px;
    font-family:var(--f-mono);font-size:11.5px;line-height:1.78;letter-spacing:.01em;
    color:rgba(226,242,250,.9);white-space:pre;tab-size:2;
    -webkit-mask-image:linear-gradient(180deg,transparent 0,#000 26px,#000 100%);
    mask-image:linear-gradient(180deg,transparent 0,#000 26px,#000 100%);}
  .cl-code pre::-webkit-scrollbar{width:3px;}
  .cl-code pre::-webkit-scrollbar-thumb{background:rgba(110,200,240,.35);}
  .cl-code .ln{white-space:pre;}
  .cl-code i{font-style:normal;}
  .cl-code .kw{color:#63d8f5;}
  .cl-code .nm{color:#a8ecff;}
  .cl-code .st{color:rgba(232,246,255,.78);}
  .cl-code .fn{color:#8fe9ff;}
  .cl-code .cm{color:rgba(140,182,208,.55);}
  .cl-code i.fl{color:#fff;text-shadow:0 0 10px rgba(190,240,255,.95),0 0 22px rgba(120,210,255,.7);}
  .cl-code .cur{display:inline-block;width:6px;height:1em;vertical-align:-.16em;
    background:rgba(140,230,255,.9);box-shadow:0 0 10px rgba(140,230,255,.8);
    animation:clCur 1.05s steps(1) infinite;}
  @keyframes clCur{0%,55%{opacity:1;}56%,100%{opacity:0;}}

  /* ---------- 移动端 ---------- */
  @media (max-width:780px){
    #cl-head .h-cn{font-size:12px;letter-spacing:.1em;}
    #cl-more-wrap{top:60px;right:10px;}
    #cl-more{font-size:11px;padding:7px 14px;}
    #cl-src{font-size:8.5px;max-width:52vw;}
    .cl-hero{min-height:88vh;padding:0 20px;}
    .cl-hero h1{font-size:clamp(19px,6.4vw,26px);line-height:1.66;}
    .cl-grid{grid-template-columns:1fr;gap:0;}
    .cl-col{margin-bottom:26px;}
    .cl-bh{margin-bottom:20px;}
    .cw{padding:12px 14px 13px;margin-bottom:44px;}
    .cw-body{inset:-12px -9px -10px;}
    .cw-ring{inset:-14px -11px -12px;}
    .cw-t{font-size:14px;}
    .cw-d{font-size:11.5px;line-height:1.86;}
    .cl-epi-card{border-radius:34px;padding:30px 22px;}
    .cli-line{font-size:15px;line-height:1.9;}
    .cl-epi .sign{font-size:9.5px;letter-spacing:.16em;}
    .cl-code pre{font-size:10px;height:200px;}
  }
  `);

  /* ================================================================
   * 精灵：云 / 光点 / 算力中心
   * ================================================================ */
  const RES = () => Math.min(U.DPR(), 1.25);

  /* 一朵云 → 一张带受光面、背光面、底部投影的贴图 */
  function makeCloudSprite(o) {
    const res = RES();
    const soft = o.soft || 0;
    const pad = o.pad != null ? o.pad : Math.ceil(soft * 3 + 9);
    const cw = o.w + pad * 2, ch = o.h + pad * 2 + o.h * 0.54;
    const cv = U.mkCanvas(cw * res, ch * res);
    const x = cv.getContext("2d");
    x.scale(res, res);
    const cx = cw / 2, cy = pad + o.h * 0.42;
    const hw = o.w / 2, hh = o.h / 2;
    const a = o.a == null ? 1 : o.a;
    const sh = o.shadow == null ? 1 : o.shadow;

    /* ① 云下投影 —— 云与云之间的阴影层次 */
    const sy = cy + hh * 0.86;
    const sg = x.createRadialGradient(cx, sy, 0, cx, sy, hw * 1.06);
    sg.addColorStop(0, "rgba(74,108,148," + (0.30 * sh * a) + ")");
    sg.addColorStop(0.46, "rgba(92,126,166," + (0.16 * sh * a) + ")");
    sg.addColorStop(1, "rgba(110,144,184,0)");
    x.fillStyle = sg;
    x.beginPath(); x.ellipse(cx, sy, hw * 1.06, hh * 0.66, 0, 0, TAU); x.fill();

    /* ② 云体：顶部受光 → 中部 → 底部背光 */
    const useFilter = "filter" in x;
    if (soft > 0.3 && useFilter) x.filter = "blur(" + soft + "px)";
    const body = () => U.cloudBlob(x, cx, cy, o.w, o.h, o.seed, 0, 0.5);
    body();
    const g = x.createLinearGradient(0, cy - hh * 1.18, 0, cy + hh * 1.14);
    g.addColorStop(0, "rgba(255,255,255," + a + ")");
    g.addColorStop(0.30, "rgba(" + o.mid + "," + (a * 0.99) + ")");
    g.addColorStop(0.66, "rgba(" + o.low + "," + (a * 0.98) + ")");
    g.addColorStop(1, "rgba(" + o.shade + "," + (a * 0.95) + ")");
    x.fillStyle = g; x.fill();
    if (soft > 0.3 && useFilter) x.filter = "none";

    /* ③ 云体内部：受光鼓包 / 底部暗影 / 顶部亮边 */
    x.save();
    body(); x.clip();
    const lumps = o.lumps || 10;
    for (let i = 0; i < lumps; i++) {
      const f = (i + 0.5) / lumps;
      const bx = cx + (f - 0.5) * o.w * 0.88;
      const by = cy - hh * (0.10 + U.noise2(i * 2.7 + o.seed, 5) * 0.60);
      const br = o.w * (0.09 + 0.13 * U.noise2(i * 5.3 + o.seed, 9));
      const bg = x.createRadialGradient(bx, by - br * 0.35, 0, bx, by, br * 2.3);
      bg.addColorStop(0, "rgba(255,255,255," + (0.26 * a) + ")");
      bg.addColorStop(0.5, "rgba(255,255,255," + (0.08 * a) + ")");
      bg.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = bg;
      x.beginPath(); x.arc(bx, by, br * 2.3, 0, TAU); x.fill();
    }
    const dg = x.createLinearGradient(0, cy + hh * 0.02, 0, cy + hh * 1.02);
    dg.addColorStop(0, "rgba(96,128,166,0)");
    dg.addColorStop(0.62, "rgba(96,128,166," + (0.17 * a) + ")");
    dg.addColorStop(1, "rgba(72,104,144," + (0.46 * a) + ")");
    x.fillStyle = dg; x.fillRect(cx - hw, cy, o.w, o.h);

    const rim = x.createLinearGradient(0, cy - hh * 1.02, 0, cy + hh);
    rim.addColorStop(0, "rgba(255,255,255," + (0.66 * a) + ")");
    rim.addColorStop(0.42, "rgba(255,255,255," + (0.14 * a) + ")");
    rim.addColorStop(1, "rgba(255,255,255,0)");
    x.lineWidth = Math.max(1.6, o.h * 0.05);
    x.strokeStyle = rim; body(); x.stroke();

    const brim = x.createLinearGradient(0, cy + hh * 0.18, 0, cy + hh * 1.04);
    brim.addColorStop(0, "rgba(88,120,158,0)");
    brim.addColorStop(1, "rgba(80,112,152," + (0.34 * a) + ")");
    x.lineWidth = Math.max(2.2, o.h * 0.07);
    x.strokeStyle = brim; body(); x.stroke();
    x.restore();

    return { cv, w: cw, h: ch, cy };
  }

  /* 光点精灵（脉冲 / 粒子共用） */
  function makeGlowSprite(rgb, size, hard) {
    const S = size || 64, cv = U.mkCanvas(S, S), x = cv.getContext("2d");
    const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(hard ? 0.3 : 0.18, "rgba(" + rgb + ",1)");
    g.addColorStop(0.52, "rgba(" + rgb + ",0.32)");
    g.addColorStop(1, "rgba(" + rgb + ",0)");
    x.fillStyle = g; x.beginPath(); x.arc(S / 2, S / 2, S / 2, 0, TAU); x.fill();
    return cv;
  }

  /* ---------------- 算力中心：静态部分预渲染 ---------------- */
  const CB = { w: 470, h: 330, ground: 236 };     // 基础（局部）坐标
  const PIPE = [[62, 238], [116, 232], [172, 240], [230, 234], [288, 240], [344, 232], [406, 238]];
  const TOWERS = [[372, 224, 62, 15], [412, 226, 50, 12]];

  function pipeAt(s) {
    let d = s, i = 0;
    while (i < PIPE.length - 1) {
      const a = PIPE[i], b = PIPE[i + 1];
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (d <= l) {
        const k = d / l;
        return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
      }
      d -= l; i++;
    }
    return PIPE[PIPE.length - 1];
  }
  function pipeLen() {
    let L = 0;
    for (let i = 0; i < PIPE.length - 1; i++) L += Math.hypot(PIPE[i + 1][0] - PIPE[i][0], PIPE[i + 1][1] - PIPE[i][1]);
    return L;
  }

  function makeComputeSprite() {
    const res = RES();
    const cv = U.mkCanvas(CB.w * res, CB.h * res);
    const x = cv.getContext("2d");
    x.scale(res, res);

    /* 云基座（浮空岛）：上白下蓝灰，保证在明亮天空中仍有体积 */
    const by = CB.ground;
    const bgShadow = x.createRadialGradient(CB.w * 0.5, by + 34, 0, CB.w * 0.5, by + 34, CB.w * 0.46);
    bgShadow.addColorStop(0, "rgba(46,80,120,.4)");
    bgShadow.addColorStop(1, "rgba(56,92,134,0)");
    x.fillStyle = bgShadow;
    x.beginPath(); x.ellipse(CB.w * 0.5, by + 30, CB.w * 0.44, 40, 0, 0, TAU); x.fill();

    const base = () => U.cloudBlob(x, CB.w * 0.5, by + 6, 400, 110, 7.3, 0, 0.35);
    base();
    const bg = x.createLinearGradient(0, by - 52, 0, by + 62);
    bg.addColorStop(0, "rgba(255,255,255,.99)");
    bg.addColorStop(0.3, "rgba(236,247,255,.98)");
    bg.addColorStop(0.66, "rgba(158,190,218,.97)");
    bg.addColorStop(1, "rgba(88,124,164,.94)");
    x.fillStyle = bg; x.fill();

    x.save();
    base(); x.clip();
    for (let i = 0; i < 7; i++) {
      const bx = 70 + i * 56, br = 26 + U.noise2(i * 3.1, 2) * 22;
      const gg = x.createRadialGradient(bx, by - 12, 0, bx, by - 12, br * 1.8);
      gg.addColorStop(0, "rgba(255,255,255,.55)");
      gg.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = gg; x.beginPath(); x.arc(bx, by - 12, br * 1.8, 0, TAU); x.fill();
    }
    const dg2 = x.createLinearGradient(0, by + 6, 0, by + 62);
    dg2.addColorStop(0, "rgba(56,92,132,0)");
    dg2.addColorStop(1, "rgba(40,74,114,.6)");
    x.fillStyle = dg2; x.fillRect(0, by, CB.w, 80);
    x.restore();
    x.strokeStyle = "rgba(56,98,140,.3)"; x.lineWidth = 1;
    base(); x.stroke();

    /* 冷却塔 ×2 */
    TOWERS.forEach(function (t) {
      const tx = t[0], ty = t[1], hh = t[2], tw = t[3];
      const tg = x.createLinearGradient(tx - tw, 0, tx + tw, 0);
      tg.addColorStop(0, "rgba(250,254,255,.99)");
      tg.addColorStop(0.28, "rgba(196,220,238,.98)");
      tg.addColorStop(0.68, "rgba(126,160,192,.97)");
      tg.addColorStop(1, "rgba(78,114,152,.95)");
      x.fillStyle = tg;
      x.beginPath();
      x.moveTo(tx - tw * 0.74, ty);
      x.bezierCurveTo(tx - tw * 0.44, ty - hh * 0.42, tx - tw * 0.32, ty - hh * 0.76, tx - tw * 0.52, ty - hh);
      x.lineTo(tx + tw * 0.52, ty - hh);
      x.bezierCurveTo(tx + tw * 0.32, ty - hh * 0.76, tx + tw * 0.44, ty - hh * 0.42, tx + tw * 0.74, ty);
      x.closePath(); x.fill();
      x.strokeStyle = "rgba(52,96,138,.4)"; x.lineWidth = 0.8; x.stroke();
      x.fillStyle = "rgba(214,238,252,.95)";
      x.beginPath(); x.ellipse(tx, ty - hh, tw * 0.52, tw * 0.16, 0, 0, TAU); x.fill();
      x.strokeStyle = "rgba(52,96,138,.4)"; x.lineWidth = 0.8; x.stroke();
      x.strokeStyle = "rgba(58,104,146,.22)"; x.lineWidth = 0.7;
      for (let r = 1; r <= 3; r++) {
        const yy = ty - hh * (r / 4);
        x.beginPath();
        x.moveTo(tx - tw * (0.5 + r * 0.05), yy);
        x.lineTo(tx + tw * (0.5 - r * 0.02), yy);
        x.stroke();
      }
    });

    /* 机架阵列 */
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        const rx = 206 + c * 32, ry = by - 46 + r * 24, rw = 26, rh = 21;
        const rg2 = x.createLinearGradient(rx, ry, rx, ry + rh);
        rg2.addColorStop(0, "rgba(238,250,255,.99)");
        rg2.addColorStop(0.42, "rgba(168,198,222,.98)");
        rg2.addColorStop(1, "rgba(104,142,178,.97)");
        x.fillStyle = rg2;
        U.roundRect(x, rx, ry, rw, rh, 2.5); x.fill();
        x.strokeStyle = "rgba(44,88,130,.42)"; x.lineWidth = 0.7;
        U.roundRect(x, rx, ry, rw, rh, 2.5); x.stroke();
        x.fillStyle = "rgba(40,84,126,.42)";
        for (let s = 0; s < 3; s++) x.fillRect(rx + 3, ry + 4 + s * 5, rw - 6, 1.1);
      }
    }

    /* 玻璃穹顶 */
    const dx = 140, dy = by - 8, dr = 52;
    const domeFill = x.createRadialGradient(dx - dr * 0.42, dy - dr * 0.92, 0, dx, dy, dr * 1.1);
    domeFill.addColorStop(0, "rgba(255,255,255,.99)");
    domeFill.addColorStop(0.36, "rgba(186,232,252,.95)");
    domeFill.addColorStop(0.74, "rgba(104,180,222,.9)");
    domeFill.addColorStop(1, "rgba(58,132,180,.88)");
    x.fillStyle = domeFill;
    x.beginPath(); x.arc(dx, dy, dr, Math.PI, 0); x.closePath(); x.fill();
    x.strokeStyle = "rgba(40,96,142,.5)"; x.lineWidth = 1.2;
    x.beginPath(); x.arc(dx, dy, dr, Math.PI, 0); x.stroke();
    x.strokeStyle = "rgba(46,116,164,.4)"; x.lineWidth = 0.85;
    for (let k = 0.24; k < 1; k += 0.25) {
      x.beginPath(); x.ellipse(dx, dy, dr * k, dr, 0, Math.PI, 0); x.stroke();
    }
    x.beginPath(); x.ellipse(dx, dy, dr, dr * 0.34, 0, Math.PI, 0); x.stroke();
    x.strokeStyle = "rgba(46,120,168,.55)"; x.lineWidth = 1;
    x.beginPath(); x.moveTo(dx, dy - dr); x.lineTo(dx, dy - dr - 9); x.stroke();
    x.fillStyle = "rgba(120,232,255,.98)";
    x.beginPath(); x.arc(dx, dy - dr - 10, 2.4, 0, TAU); x.fill();

    /* 天线桅杆 + 抛物面 */
    x.strokeStyle = "rgba(62,102,140,.9)"; x.lineWidth = 1.6;
    x.beginPath(); x.moveTo(72, by - 6); x.lineTo(72, by - 82); x.stroke();
    x.lineWidth = 0.9;
    for (let i = 1; i <= 3; i++) {
      const yy = by - 8 - i * 20;
      x.beginPath(); x.moveTo(72 - 11, yy); x.lineTo(72 + 11, yy); x.stroke();
    }
    x.beginPath(); x.moveTo(72, by - 62); x.lineTo(94, by - 70); x.stroke();
    const dg3 = x.createLinearGradient(88, by - 78, 104, by - 62);
    dg3.addColorStop(0, "rgba(250,254,255,.99)");
    dg3.addColorStop(1, "rgba(138,178,210,.97)");
    x.fillStyle = dg3;
    x.beginPath(); x.ellipse(98, by - 72, 11, 7, -0.62, 0, TAU); x.fill();
    x.strokeStyle = "rgba(52,100,142,.55)"; x.lineWidth = 0.8; x.stroke();

    /* 管道（静态暗管） */
    x.strokeStyle = "rgba(64,110,152,.6)"; x.lineWidth = 3.6;
    x.lineJoin = "round";
    x.beginPath();
    PIPE.forEach(function (p, i) { i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]); });
    x.stroke();
    x.strokeStyle = "rgba(196,238,255,.85)"; x.lineWidth = 1.1;
    x.beginPath();
    PIPE.forEach(function (p, i) { i ? x.lineTo(p[0], p[1] - 1.2) : x.moveTo(p[0], p[1] - 1.2); });
    x.stroke();

    /* 连接栈桥 */
    x.fillStyle = "rgba(212,236,252,.85)";
    x.fillRect(192, by - 12, 12, 12);
    x.fillRect(334, by - 14, 10, 14);
    x.strokeStyle = "rgba(52,96,138,.3)"; x.lineWidth = 0.6;
    x.strokeRect(192, by - 12, 12, 12);
    x.strokeRect(334, by - 14, 10, 14);

    return { cv, w: CB.w, h: CB.h };
  }

  /* ================================================================
   * 云海场：三层纵深 + 拖拽弹簧
   * ================================================================ */
  class CloudField {
    constructor() {
      this.clouds = [];
      this.motes = [];
      this.W = 0; this.H = 0;
      this.built = false;
      this.glow = makeGlowSprite("96,196,236", 48, true);
    }
    resize(W, H) {
      this.W = W; this.H = H;
      this.build();
    }
    build() {
      const W = this.W, H = this.H;
      const res = RES();
      const DEFS = [
        { z: 0.3, n: 7, y0: 0.01, y1: 0.56, w0: 0.17, w1: 0.31, cap: 470, a: 0.55, soft: 7,
          sh: 0.6, par: 0.022, mid: "250,253,255", low: "226,238,248", shade: "192,212,232" },
        { z: 0.62, n: 8, y0: 0.14, y1: 0.82, w0: 0.25, w1: 0.40, cap: 640, a: 0.76, soft: 4.2,
          sh: 0.95, par: 0.05, mid: "252,254,255", low: "222,236,248", shade: "182,204,226" },
        { z: 1, n: 5, y0: 0.56, y1: 1.08, w0: 0.36, w1: 0.58, cap: 900, a: 0.93, soft: 1.1,
          sh: 1.25, par: 0.092, mid: "255,255,255", low: "224,238,250", shade: "174,198,222" },
      ];
      const list = [];
      DEFS.forEach((d, li) => {
        for (let i = 0; i < d.n; i++) {
          const w = Math.min(W * U.rand(d.w0, d.w1), d.cap);
          const h = w * U.rand(0.40, 0.54);
          let x = U.rand(-0.14, 1.14) * W;
          let y = H * U.rand(d.y0, d.y1);
          if (li === 2 && i === 0) { x = W * 0.5; y = H * 1.06; }  // 云堤
          const seed = U.rand(1, 90);
          const spr = makeCloudSprite({
            w, h, seed, a: 1, soft: d.soft, shadow: d.sh, res,
            mid: d.mid, low: d.low, shade: d.shade,
            lumps: 9 + Math.round(U.rand(0, 4)),
          });
          list.push({
            li, z: d.z, a: d.a, par: d.par, spr,
            x, y, w, h, sx: x, sy: y,
            ox: 0, oy: 0, svx: 0, svy: 0, lx: 0, ly: 0,
            vx: U.rand(-0.06, 0.10) * (0.4 + d.z), drag: false,
            bs: U.rand(0.00018, 0.00042), bp: U.rand(0, TAU), ba: U.rand(2.5, 7),
            spring: 0.013 + d.z * 0.004,
          });
        }
      });
      this.clouds = list;
      // 浮尘
      this.motes = [];
      const mn = 86;
      for (let i = 0; i < mn; i++) {
        this.motes.push({
          x: U.rand(0, W), y: U.rand(0, H), r: U.rand(0.9, 3.4),
          vx: U.rand(-0.02, 0.05), vy: U.rand(-0.05, -0.005),
          a: U.rand(0.10, 0.42), ph: U.rand(0, TAU), sp: U.rand(0.0004, 0.0013),
        });
      }
      this.built = true;
    }
    /* 每帧：漂移 / 弹簧回位 / 邻云联动 / 视差坐标 */
    update(dt, time, scrollY) {
      const cs = this.clouds, n = cs.length;
      for (let i = 0; i < n; i++) {
        const c = cs[i];
        c.x += c.vx * dt * 0.055;
        if (c.x - c.w * 0.62 > this.W) c.x = -c.w * 0.7;
        if (c.x + c.w * 0.62 < 0) c.x = this.W + c.w * 0.7;
        if (!c.drag) {
          c.svx += -c.ox * c.spring; c.svx *= 0.9; c.ox += c.svx;
          c.svy += -c.oy * c.spring; c.svy *= 0.9; c.oy += c.svy;
          if (Math.abs(c.ox) < 0.02 && Math.abs(c.svx) < 0.02) { c.ox = 0; c.svx = 0; }
          if (Math.abs(c.oy) < 0.02 && Math.abs(c.svy) < 0.02) { c.oy = 0; c.svy = 0; }
        }
      }
      // 邻近联动：被拉动云朵的位移，轻微带动周围
      for (let i = 0; i < n; i++) {
        const c = cs[i];
        let tx = 0, ty = 0;
        for (let j = 0; j < n; j++) {
          if (i === j) continue;
          const o = cs[j];
          if (!o.ox && !o.oy) continue;
          const d = Math.hypot(o.x - c.x, o.y - c.y);
          if (d > 340) continue;
          const k = (1 - d / 340) * 0.3 * (1 - Math.abs(o.z - c.z) * 0.35);
          tx += o.ox * k; ty += o.oy * k;
        }
        c.lx += (tx - c.lx) * 0.1;
        c.ly += (ty - c.ly) * 0.1;
      }
      // 视差 + 呼吸
      for (let i = 0; i < n; i++) {
        const c = cs[i];
        const bob = Math.sin(time * c.bs + c.bp) * c.ba;
        c.sx = c.x + c.ox + c.lx;
        c.sy = c.y - scrollY * c.par + c.oy + c.ly + bob;
        c.ds = c.drag ? 1.055 : 1;
      }
      // 浮尘
      for (let i = 0; i < this.motes.length; i++) {
        const m = this.motes[i];
        m.x += m.vx * dt * 0.06; m.y += m.vy * dt * 0.06;
        if (m.y < -20) { m.y = this.H + 20; m.x = U.rand(0, this.W); }
        if (m.x < -20) m.x = this.W + 20;
        if (m.x > this.W + 20) m.x = -20;
      }
    }
    drawSky(ctx, W, H, scrollY, flash) {
      const p = U.clamp(scrollY / (H * 2.4), 0, 1);
      const A = [166, 216, 244], A2 = [128, 190, 232];
      const B = [210, 236, 249], B2 = [180, 216, 238];
      const C = [248, 246, 238], C2 = [232, 238, 240];
      const mix = (a, b) => "rgb(" + Math.round(U.lerp(a[0], b[0], p)) + "," +
        Math.round(U.lerp(a[1], b[1], p)) + "," + Math.round(U.lerp(a[2], b[2], p)) + ")";
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, mix(A, A2));
      g.addColorStop(0.46, mix(B, B2));
      g.addColorStop(1, mix(C, C2));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      // 天光
      const sx = W * 0.16, sy = H * 0.06, sr = Math.max(W, H) * 0.66;
      const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
      sg.addColorStop(0, "rgba(255,255,255," + (0.9 + flash * 0.08) + ")");
      sg.addColorStop(0.16, "rgba(255,253,242,.62)");
      sg.addColorStop(0.46, "rgba(255,248,232,.2)");
      sg.addColorStop(1, "rgba(255,250,240,0)");
      ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);

      // 地平线雾带
      const hz = ctx.createLinearGradient(0, H * 0.44, 0, H * 0.86);
      hz.addColorStop(0, "rgba(255,255,255,0)");
      hz.addColorStop(0.55, "rgba(255,255,255,.34)");
      hz.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = hz; ctx.fillRect(0, H * 0.44, W, H * 0.42);
    }
    drawLayer(ctx, li, scrollY, flash) {
      const cs = this.clouds;
      for (let i = 0; i < cs.length; i++) {
        const c = cs[i];
        if (c.li !== li) continue;
        const s = c.spr, k = c.ds || 1;
        const w = s.w * k, h = s.h * k;
        const x = c.sx, y = c.sy;
        if (x + w * 0.6 < -60 || x - w * 0.6 > this.W + 60) continue;
        if (y + h * 0.8 < -80 || y - h * 0.7 > this.H + 80) continue;
        // 光纤闪动 → 云层整体亮度轻微脉动
        ctx.globalAlpha = U.clamp(c.a * (0.9 + flash * 0.13), 0, 1);
        ctx.drawImage(s.cv, x - w / 2, y - s.cy * k, w, h);
      }
      ctx.globalAlpha = 1;
    }
    drawMotes(ctx, time, W, H) {
      ctx.globalCompositeOperation = "source-over";
      for (let i = 0; i < this.motes.length; i++) {
        const m = this.motes[i];
        const a = m.a * (0.55 + 0.45 * Math.sin(time * m.sp + m.ph));
        if (a <= 0.01) continue;
        ctx.globalAlpha = a;
        const r = m.r * 3.6;
        ctx.drawImage(this.glow, m.x - r, m.y - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }
    /* 光纤整体泛光：整屏加一层极淡的彩色呼吸 */
    drawBloom(ctx, W, H, flash, time) {
      const a = 0.05 + flash * 0.07;
      const cx = W * 0.5 + Math.sin(time * 0.00042) * W * 0.04;
      const g = ctx.createRadialGradient(cx, H * 0.32, 0, cx, H * 0.32, Math.max(W, H) * 0.72);
      g.addColorStop(0, "rgba(198,240,255," + a + ")");
      g.addColorStop(0.5, "rgba(190,210,255," + (a * 0.4) + ")");
      g.addColorStop(1, "rgba(180,215,255,0)");
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";
    }
    /* 命中：由近及远取最上层云 */
    pick(px, py) {
      const cs = this.clouds;
      let best = null, bestZ = -1;
      for (let i = 0; i < cs.length; i++) {
        const c = cs[i];
        const rx = c.w * 0.44, ry = c.h * 0.48;
        const dx = (px - c.sx) / rx, dy = (py - c.sy) / ry;
        if (dx * dx + dy * dy > 1) continue;
        if (c.z > bestZ) { bestZ = c.z; best = c; }
      }
      return best;
    }
  }

  /* ================================================================
   * 光纤束：主线 + 三支
   * ================================================================ */
  class Fiber {
    constructor() {
      this.segs = [];
      this.W = 0; this.H = 0;
      this.flash = 0.5;
      this.nodes = [];
      this.surge = 0;
      this.nextSurge = 2600;
      this.glowS = makeGlowSprite("150,232,255", 32, true);
      this.glowL = makeGlowSprite("130,200,255", 96, false);
      this.len = pipeLen();
    }
    /* 几何：主线上端 → 分叉 → 三支沿列中线向下 */
    setGeometry(g) {
      this.W = g.W; this.H = g.H;
      this.segs = [];
      const splitY = g.splitY;
      const cx = g.W * 0.5;
      const trunkPts = this.curve(cx - g.W * 0.02, -70, cx + g.W * 0.018, splitY * 0.52, cx, splitY, 26);
      this.segs.push(this.mkSeg(trunkPts, 0, "trunk"));
      const cols = g.branches;
      const mob = !!g.mob;
      for (let i = 0; i < cols.length; i++) {
        const b = cols[i];
        const pts = [];
        // 移动端三列上下堆叠：第二三支直接从本列上方垂落，避免长斜线横穿版面
        const sx = (mob && i > 0) ? b.x : cx;
        const sy0 = (mob && i > 0) ? b.top - 110 : splitY;
        // 分叉弧：从主线末端甩向列中线
        const c1 = [sx + (b.x - sx) * 0.12, sy0 + 40];
        const c2 = [b.x - (b.x - sx) * 0.06, b.top + 4];
        const end = [b.x, b.top + 26];
        for (let k = 0; k <= 16; k++) {
          const t = k / 16, mt = 1 - t;
          const x = mt * mt * mt * sx + 3 * mt * mt * t * c1[0] + 3 * mt * t * t * c2[0] + t * t * t * end[0];
          const y = mt * mt * mt * sy0 + 3 * mt * mt * t * c1[1] + 3 * mt * t * t * c2[1] + t * t * t * end[1];
          pts.push([x, y]);
        }
        pts.push([b.x, b.bottom + 120]);
        this.segs.push(this.mkSeg(pts, i + 1, "branch"));
      }
      this.splitPt = [cx, splitY];
      this.nodes = g.nodes || [];
    }
    curve(x0, y0, x1, y1, x2, y2, n) {
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n, mt = 1 - t;
        pts.push([
          mt * mt * x0 + 2 * mt * t * x1 + t * t * x2,
          mt * mt * y0 + 2 * mt * t * y1 + t * t * y2,
        ]);
      }
      return pts;
    }
    mkSeg(basePts, idx, kind) {
      const strs = [];
      const count = kind === "trunk" ? 6 : 5;
      for (let k = 0; k < count; k++) {
        const spread = kind === "trunk" ? 4.6 : 4;
        const ox = (k - (count - 1) / 2) * (spread / (count - 1)) * 2;
        const oy = (k % 2 ? 1 : -1) * 1.4;
        const pts = basePts.map(function (p) { return [p[0] + ox, p[1] + oy]; });
        const path = new Path2D();
        for (let i = 0; i < pts.length; i++) {
          if (i) path.lineTo(pts[i][0], pts[i][1]); else path.moveTo(pts[i][0], pts[i][1]);
        }
        // 长度表
        const cum = [0];
        let tot = 0;
        for (let i = 1; i < pts.length; i++) {
          tot += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
          cum.push(tot);
        }
        const pulses = [];
        const pn = 2;
        for (let p = 0; p < pn; p++) {
          pulses.push({
            s: U.rand(0, tot),
            sp: U.rand(0.17, 0.42) * (kind === "trunk" ? 1.1 : 1),
            w: U.rand(14, 30),
            col: FIBER_COLS[(k + p * 2 + idx) % FIBER_COLS.length],
            ph: U.rand(0, TAU),
          });
        }
        strs.push({
          col: FIBER_COLS[(k + idx) % FIBER_COLS.length],
          pts, path, cum, tot, pulses,
          a: kind === "trunk" ? 1 : 0.86 - Math.abs(ox) * 0.03,
        });
      }
      const top = basePts[0][1], bottom = basePts[basePts.length - 1][1];
      return { idx, kind, strs, top, bottom };
    }
    at(strand, s) {
      const cum = strand.cum, pts = strand.pts;
      let v = U.clamp(s, 0, strand.tot);
      let lo = 0, hi = cum.length - 1;
      while (lo < hi - 1) { const mid = (lo + hi) >> 1; if (cum[mid] <= v) lo = mid; else hi = mid; }
      const seg = cum[hi] - cum[lo] || 1;
      const k = (v - cum[lo]) / seg;
      return [
        pts[lo][0] + (pts[hi][0] - pts[lo][0]) * k,
        pts[lo][1] + (pts[hi][1] - pts[lo][1]) * k,
      ];
    }
    update(dt, time) {
      this.nextSurge -= dt;
      if (this.nextSurge <= 0) { this.surge = 1; this.nextSurge = U.rand(3200, 7200); }
      this.surge *= 0.985;
      for (let i = 0; i < this.segs.length; i++) {
        const st = this.segs[i].strs;
        for (let j = 0; j < st.length; j++) {
          const ps = st[j].pulses;
          for (let p = 0; p < ps.length; p++) {
            const pu = ps[p];
            pu.s += pu.sp * dt;
            if (pu.s > st[j].tot) { pu.s = 0; pu.w = U.rand(14, 34); }
          }
        }
      }
      // 亮度：多频叠加 + 涌流
      const w = 0.5 + 0.5 * Math.sin(time * 0.0013) * Math.sin(time * 0.00071 + 1.2);
      this.flash = U.clamp(0.34 + w * 0.56 + this.surge * 0.34, 0, 1);
      return this.flash;
    }
    draw(ctx, scrollY, H, flash) {
      ctx.save();
      ctx.translate(0, -scrollY);
      const vTop = scrollY - 120, vBot = scrollY + H + 120;
      for (let i = 0; i < this.segs.length; i++) {
        const sg = this.segs[i];
        if (sg.bottom < vTop || sg.top > vBot) continue;
        for (let j = 0; j < sg.strs.length; j++) {
          const st = sg.strs[j];
          const c = st.col;
          const rgb = c[0] + "," + c[1] + "," + c[2];
          // 彩色柔晕（在明亮天空中用 source-over 才看得见颜色）
          ctx.globalCompositeOperation = "source-over";
          ctx.strokeStyle = "rgba(" + rgb + "," + (0.15 + flash * 0.1) + ")";
          ctx.lineWidth = 10;
          ctx.stroke(st.path);
          // 主光丝
          ctx.strokeStyle = "rgba(" + rgb + "," + ((0.66 + flash * 0.26) * st.a) + ")";
          ctx.lineWidth = 2.3;
          ctx.stroke(st.path);
          // 白热芯
          ctx.globalCompositeOperation = "lighter";
          ctx.strokeStyle = "rgba(255,255,255," + ((0.18 + flash * 0.3) * st.a) + ")";
          ctx.lineWidth = 0.9;
          ctx.stroke(st.path);
          // 光脉冲
          ctx.globalCompositeOperation = "source-over";
          for (let p = 0; p < st.pulses.length; p++) {
            const pu = st.pulses[p];
            const p1 = this.at(st, pu.s);
            const p2 = this.at(st, pu.s - pu.w * 0.55);
            const prgb = pu.col[0] + "," + pu.col[1] + "," + pu.col[2];
            ctx.lineWidth = 3.4;
            ctx.strokeStyle = "rgba(" + prgb + "," + (0.62 + flash * 0.3) + ")";
            ctx.beginPath(); ctx.moveTo(p2[0], p2[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
            const rr = 30 + Math.sin(pu.ph + flash * 6) * 5;
            ctx.globalAlpha = 0.3 + flash * 0.35;
            ctx.drawImage(this.glowL, p1[0] - rr, p1[1] - rr, rr * 2, rr * 2);
            ctx.globalAlpha = 1;
            ctx.fillStyle = "rgba(" + prgb + ",1)";
            ctx.beginPath(); ctx.arc(p1[0], p1[1], 2.5, 0, TAU); ctx.fill();
            ctx.fillStyle = "rgba(255,255,255,.95)";
            ctx.beginPath(); ctx.arc(p1[0], p1[1], 1.1, 0, TAU); ctx.fill();
          }
        }
        // 时间线节点
        if (sg.kind === "branch") {
          const bi = sg.idx - 1;
          for (let n = 0; n < this.nodes.length; n++) {
            const nd = this.nodes[n];
            if (nd.bi !== bi) continue;
            if (nd.y < vTop || nd.y > vBot) continue;
            const x = nd.x;
            ctx.globalCompositeOperation = "source-over";
            ctx.strokeStyle = "rgba(60,150,196," + (0.3 + flash * 0.25) + ")";
            ctx.lineWidth = 0.9;
            ctx.beginPath(); ctx.moveTo(x - 13, nd.y); ctx.lineTo(x + 13, nd.y); ctx.stroke();
            ctx.fillStyle = "rgba(255,255,255," + (0.85 + flash * 0.15) + ")";
            ctx.beginPath(); ctx.arc(x, nd.y, 2.2, 0, TAU); ctx.fill();
            ctx.strokeStyle = "rgba(24,140,190," + (0.5 + flash * 0.3) + ")";
            ctx.lineWidth = 1.1;
            ctx.beginPath(); ctx.arc(x, nd.y, 3.4, 0, TAU); ctx.stroke();
          }
        }
      }
      // 分叉点辉光
      if (this.splitPt && this.splitPt[1] > vTop && this.splitPt[1] < vBot) {
        const sp = this.splitPt;
        const r = 44 + Math.sin(Date.now() * 0.0012) * 8 + flash * 14;
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 0.42 + flash * 0.4;
        ctx.drawImage(this.glowL, sp[0] - r, sp[1] - r, r * 2, r * 2);
        ctx.globalAlpha = 1;
        ctx.fillStyle = "rgba(255,255,255,.95)";
        ctx.beginPath(); ctx.arc(sp[0], sp[1], 3.4, 0, TAU); ctx.fill();
        ctx.strokeStyle = "rgba(34,150,200," + (0.5 + flash * 0.4) + ")";
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(sp[0], sp[1], 7 + flash * 3, 0, TAU); ctx.stroke();
      }
      ctx.restore();
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    }
  }

  /* ================================================================
   * 云上算力中心（运行时绘制）
   * ================================================================ */
  const CLUSTERS = [
    { nx: 0.775, ny: 0.585, s: 0.96, k: 0.105, fade: 1 },
    { nx: 0.5, ny: 0.155, s: 0.37, k: 0.045, fade: 0.6 },
  ];
  let EXS = null;
  function extraSprites() {
    if (!EXS) EXS = {
      flow: makeGlowSprite("70,214,255", 48, true),
      vapor: makeGlowSprite("246,251,255", 48, false),
    };
    return EXS;
  }

  function drawCompute(ctx, spr, cl, W, H, scrollY, time, flash) {
    const x = W * cl.nx;
    const y = H * cl.ny - scrollY * cl.k;
    if (y < -300 || y > H + 320) return;
    const k = cl.s * U.clamp(W / 1440, 0.62, 1.08);
    const a = cl.fade * U.clamp(1 - scrollY / (H * 2.6), 0, 1) *
      U.clamp(1 - Math.max(0, H * 0.12 - y) / (H * 0.5), 0, 1);
    if (a <= 0.02) return;
    const ex = extraSprites();
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(x, y);
    ctx.scale(k, k);
    ctx.translate(-spr.w / 2, -CB.ground);
    ctx.drawImage(spr.cv, 0, 0, spr.w, spr.h);

    // —— 管道流光（硬件上流动的粒子光）
    const PL = pipeLen();
    for (let i = 0; i < 9; i++) {
      const s = (time * 0.052 + i * PL / 9) % PL;
      const p = pipeAt(s);
      const r = 7 + Math.sin(time * 0.004 + i) * 2;
      ctx.globalAlpha = a * (0.6 + 0.32 * Math.sin(time * 0.006 + i * 1.7));
      ctx.drawImage(ex.flow, p[0] - r * 1.9, p[1] - r * 1.9, r * 3.8, r * 3.8);
    }
    // 机架指示灯
    for (let i = 0; i < 12; i++) {
      if (Math.sin(time * 0.0021 + i * 2.3) <= 0.15) continue;
      ctx.globalAlpha = a * 0.95;
      ctx.fillStyle = i % 3 ? "rgba(24,168,214,.95)" : "rgba(226,146,30,.95)";
      const rx = 209 + (i % 4) * 32, ry = (CB.ground - 46 + Math.floor(i / 4) * 24) + 4;
      ctx.beginPath(); ctx.arc(rx, ry, 1.5, 0, TAU); ctx.fill();
    }
    // 冷却塔蒸汽
    for (let t = 0; t < TOWERS.length; t++) {
      const tw = TOWERS[t];
      for (let i = 0; i < 5; i++) {
        const ph = (time * 0.00035 + i * 0.2 + t * 0.4) % 1;
        const ry = tw[1] - tw[2] - 4 - ph * 46;
        const rx = tw[0] + Math.sin(ph * 5 + i) * 12;
        const rr = 9 + ph * 22;
        ctx.globalAlpha = a * (1 - ph) * 0.5;
        ctx.drawImage(ex.vapor, rx - rr, ry - rr, rr * 2, rr * 2);
      }
    }
    // 穹顶旋转光弧
    const dx = 140, dy = CB.ground - 8, dr = 52;
    ctx.globalAlpha = a * (0.35 + flash * 0.4);
    ctx.strokeStyle = "rgba(22,150,196,.95)";
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 2; i++) {
      const a0 = time * 0.0013 + i * Math.PI;
      ctx.beginPath();
      ctx.ellipse(dx, dy - 4, dr * 1.34, dr * 0.55, 0, a0, a0 + 1.06);
      ctx.stroke();
    }
    // 上升数据微尘
    for (let i = 0; i < 7; i++) {
      const ph = (time * 0.00024 + i * 0.137) % 1;
      const y2 = dy - dr - ph * 90;
      const x2 = dx + Math.sin(ph * 4.4 + i) * 26;
      ctx.globalAlpha = a * (1 - ph) * 0.8;
      ctx.fillStyle = "rgba(28,164,208,.95)";
      ctx.beginPath(); ctx.arc(x2, y2, 1.35, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  /* ================================================================
   * 字节显现
   * ================================================================ */
  class Reveal {
    constructor(hosts, text, opt) {
      opt = opt || {};
      this.hosts = hosts;
      this.items = [];
      this.delay = opt.delay || 0;
      this.stagger = opt.stagger || 42;
      this.flick = opt.flick || 300;
      this.started = false;
      this.t0 = 0;
      this.done = false;
      this.over = false;
      const frags = hosts.map(function () { return document.createDocumentFragment(); });
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === "\n") {
          frags.forEach(function (f) { f.appendChild(document.createElement("br")); });
          continue;
        }
        const els = hosts.map(function (h, hi) {
          const sp = document.createElement("span");
          sp.className = "by";
          sp.textContent = ch;
          frags[hi].appendChild(sp);
          return sp;
        });
        this.items.push({ els, c: ch, t0: this.delay + i * this.stagger, tick: -1, done: false });
      }
      hosts.forEach(function (h, i) { h.textContent = ""; h.appendChild(frags[i]); });
    }
    start() {
      if (this.started) return;
      this.started = true;
      this.t0 = performance.now();
    }
    update(now) {
      if (!this.started) return false;
      const el = now - this.t0;
      let all = true;
      for (let i = 0; i < this.items.length; i++) {
        const it = this.items[i];
        if (it.done) continue;
        if (el < it.t0) { all = false; continue; }
        const k = (el - it.t0) / this.flick;
        if (k >= 1) {
          for (let j = 0; j < it.els.length; j++) {
            it.els[j].textContent = it.c;
            it.els[j].classList.add("on");
          }
          it.done = true;
        } else {
          all = false;
          const tick = Math.floor((el - it.t0) / 52);
          if (tick !== it.tick) {
            it.tick = tick;
            const g = GLYPHS[(Math.random() * GLYPHS.length) | 0];
            for (let j = 0; j < it.els.length; j++) it.els[j].textContent = g;
          }
        }
      }
      this.done = all;
      return all;
    }
    reset() {
      for (let i = 0; i < this.items.length; i++) {
        const it = this.items[i];
        it.done = false; it.tick = -1;
        for (let j = 0; j < it.els.length; j++) {
          it.els[j].textContent = it.c;
          it.els[j].classList.remove("on");
        }
      }
      this.started = false; this.done = false;
    }
  }

  /* ================================================================
   * 无尽代码流
   * ================================================================ */
  const CP = {
    basin: ["长江上游", "淮河中游", "太湖流域", "汉江支流", "澜沧江下游", "珠江三角洲", "海河流域", "闽江上游"],
    model: ["HydroFormer", "TwinLSTM", "FloodNet", "RiverMoE", "AquaDiffusion", "GateFormer"],
    var: ["q_pred", "h_seq", "rainfall", "runoff", "sediment", "gate_open", "et0", "soil_moisture", "turbine_flow"],
    unit: ["m3/s", "mm/h", "km2", "m", "Pa"],
    city: ["南京", "杭州", "武汉", "成都", "贵阳", "中卫", "怀来"],
  };
  const ri = (a, b) => U.randInt(a, b);
  const rf = (a, b, d) => U.rand(a, b).toFixed(d == null ? 2 : d);

  const CODE_GEN = [
    () => "# " + U.pick(CP.basin) + " · 数字孪生同步 · step " + ri(10000, 99999),
    () => "import torch, torch.nn as nn, xarray as xr",
    () => "from twin.river import HydroGraph, GateArray, RainfallField",
    () => "const twin = await Twin.load(\"" + U.pick(CP.basin) + "\", epsg=\"EPSG:4326\")",
    () => "class " + U.pick(CP.model) + "(nn.Module):  # 时空注意力 · " + U.pick(CP.basin),
    () => "    def __init__(self, d_model=" + ri(192, 768) + ", heads=" + ri(6, 16) + "):",
    () => "        self.q = nn.Linear(" + ri(64, 512) + ", d_model, bias=False)",
    () => "        self.attn = nn.MultiheadAttention(d_model, heads, batch_first=True)",
    () => "    async def forward(self, x: Tensor[B, T, C]) -> Forecast:",
    () => "        h = self.attn(x, x, x, mask=self.causal)[0]",
    () => "        return Forecast(mean=h[:, -1], sigma=softplus(self.sd(h)))",
    () => "rain = RainfallField.from_gauge(\"gauge_" + ri(100, 999) + "\", window=" + ri(6, 48) + "h)",
    () => "grid = xr.open_zarr(f\"s3://hhu-twin/{basin}/{t:%Y%m%d%H}.zarr\")",
    () => "dq = twin.discharge(t, unit=\"" + U.pick(CP.unit) + "\")  # 流量演进",
    () => "if dq.max() > flood_risk(" + rf(0.9, 4.6) + "): await gate.open(deg=" + ri(5, 60) + ")",
    () => "loss = mse(pred, obs) + " + rf(0.001, 0.2, 3) + " * kl_div(posterior, prior)",
    () => "opt = torch.optim.AdamW(model.parameters(), lr=" + rf(1e-5, 3e-3, 5) + ")",
    () => "with torch.autocast(\"cuda\", dtype=torch.bfloat16): y = model(batch)",
    () => "viewer.pointSize = " + ri(2, 9) + "  // 点云流域渲染",
    () => "await pipeline.exec({ basin: \"" + U.pick(CP.basin) + "\", horizon: " + ri(6, 72) + " })",
    () => "assert not torch.isnan(q_pred).any(), \"发散：检查边界条件\"",
    () => "console.log(`[twin] ${basin} 预测完成 @ ${Date.now()}`)",
    () => "reservoir.level += " + rf(-0.4, 0.9, 3) + "  # 调度一档",
    () => "# 精度复核：" + U.pick(CP.city) + " 站 · NSE=" + rf(0.82, 0.988, 3),
    () => "sensor = Sensor(\"" + U.pick(CP.var) + "\", hz=" + ri(1, 30) + ")",
    () => "def quantile_loss(p, q=0." + ri(50, 99) + "): return max((q - 1) * (y - p), q * (y - p))",
    () => "gate = GateArray(" + ri(3, 18) + ").bind(hydraulic_model)",
    () => "viz.layer(\"" + U.pick(CP.basin) + "\", color=\"#5ce0ff\", opacity=" + rf(0.35, 0.95) + ")",
    () => "yield Inference(chunk=" + ri(256, 4096) + ", sliding=window // 2)",
    () => "tokens = tokenizer(\"" + U.pick(CP.basin) + " 汛期调度方案\").input_ids",
    () => "await sleep(" + ri(8, 60) + "); // 心跳 · 云上机架 #" + ri(1, 96),
    () => "# cloud racks: " + ri(2, 40) + " × A100 · pue=" + rf(1.02, 1.24, 3),
    () => "export const predict = async (b) => model.run(await prep(b))",
  ];

  function hl(raw) {
    const RX = /(#.*$)|("(?:[^"\\]|\\.)*")|(\b\d+(?:\.\d+)?\b)|(\b(?:def|class|import|from|return|await|async|if|else|elif|for|in|while|try|except|with|as|const|let|function|new|yield|lambda|not|and|or|is|assert|export)\b)|([A-Za-z_][A-Za-z0-9_]*)(?=\()/gm;
    let out = "", last = 0, m;
    RX.lastIndex = 0;
    while ((m = RX.exec(raw))) {
      out += U.esc(raw.slice(last, m.index));
      const cls = m[1] ? "cm" : m[2] ? "st" : m[3] ? "nm" : m[4] ? "kw" : "fn";
      out += '<i class="' + cls + '">' + U.esc(m[0]) + "</i>";
      last = RX.lastIndex;
    }
    return out + U.esc(raw.slice(last));
  }

  class CodeStream {
    constructor(pre, cnt) {
      this.pre = pre; this.cnt = cnt;
      this.cur = null;
      this.lines = 0;
      this.pool = [];
      this.flash = [];
      this.nextFlash = 0;
      this.acc = 0;
    }
    reset() {
      this.pre.innerHTML = "";
      this.cur = null; this.lines = 0; this.pool.length = 0; this.flash.length = 0;
      if (this.cnt) this.cnt.textContent = "0";
    }
    nextRaw() {
      const g = CODE_GEN[(Math.random() * CODE_GEN.length) | 0];
      let s;
      try { s = g(); } catch (e) { s = "# stream"; }
      return s;
    }
    step() {
      if (!this.cur) {
        const el = document.createElement("div");
        el.className = "ln";
        this.pre.appendChild(el);
        this.cur = { el, raw: "", target: this.nextRaw() };
        this.lines++;
        if (this.cnt) this.cnt.textContent = String(this.lines);
      }
      const c = this.cur;
      const n = 2 + ((Math.random() * 4) | 0);
      c.raw = c.target.slice(0, c.raw.length + n);
      c.el.innerHTML = hl(c.raw) + '<i class="cur"></i>';
      if (c.raw.length >= c.target.length) {
        c.el.innerHTML = hl(c.raw);
        const spans = c.el.querySelectorAll("i.kw,i.fn,i.nm,i.st,i.cm");
        for (let i = 0; i < spans.length; i++) {
          this.pool.push(spans[i]);
        }
        if (this.pool.length > 480) this.pool.splice(0, this.pool.length - 480);
        this.cur = null;
      }
      while (this.pre.childElementCount > 120) this.pre.removeChild(this.pre.firstChild);
      this.pre.scrollTop = this.pre.scrollHeight;
    }
    /* 随机字符短暂闪白（黑白光在字体上闪） */
    update(dt) {
      const now = performance.now();
      if (now >= this.nextFlash && this.pool.length) {
        this.nextFlash = now + 70 + Math.random() * 130;
        const n = 1 + ((Math.random() * 2) | 0);
        for (let i = 0; i < n; i++) {
          const el = this.pool[(Math.random() * this.pool.length) | 0];
          if (!el || el.__fl) continue;
          el.__fl = 1;
          el.classList.add("fl");
          this.flash.push({ el, until: now + 90 + Math.random() * 190 });
        }
      }
      for (let i = this.flash.length - 1; i >= 0; i--) {
        if (this.flash[i].until <= now) {
          const it = this.flash[i];
          it.el.classList.remove("fl");
          it.el.__fl = 0;
          this.flash.splice(i, 1);
        }
      }
    }
  }

  /* ================================================================
   * 科学周刊抓取
   * ================================================================ */
  function httpText(url, ms) {
    return new Promise(function (res, rej) {
      let ctrl = null, timer = 0, done = false;
      const fin = function (fn, v) { if (done) return; done = true; clearTimeout(timer); fn(v); };
      try { if ("AbortController" in window) ctrl = new AbortController(); } catch (e) {}
      timer = setTimeout(function () {
        try { ctrl && ctrl.abort(); } catch (e) {}
        fin(rej, new Error("timeout"));
      }, ms);
      let p;
      // 有本地演示服务器时走 /api/relay 中继，Science 的 RSS 才能真正抓到；
      // 没有服务器时退回直连（会因 CORS 失败 → 由上层降级到本地精选）。
      // Science 的 RSS 本身允许跨域：优先直连（快）；失败时上层会换下一个候选，
      // 其中有 /api/relay 中继版本兜底（例如被本机网络/防火墙挡住时）。
      const target = url;
      try {
        p = fetch(target, {
          mode: "cors", cache: "no-store", credentials: "omit",
          signal: ctrl ? ctrl.signal : undefined,
        });
      } catch (e) { fin(rej, e); return; }
      p.then(function (r) {
        if (!r || !r.ok) throw new Error("HTTP " + (r && r.status));
        return r.text();
      }).then(function (t) { fin(res, t); }).catch(function (e) { fin(rej, e); });
    });
  }
  function cut(s, n) {
    s = String(s || "").replace(/\s+/g, " ").trim();
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
  }
  function parseRSS(txt) {
    const doc = new DOMParser().parseFromString(txt, "text/xml");
    const items = doc.querySelectorAll("item");
    const out = [];
    for (let i = 0; i < items.length && out.length < 8; i++) {
      const it = items[i];
      const gt = function (tag) {
        const n = it.querySelector(tag);
        return n && n.textContent ? n.textContent : "";
      };
      let d = gt("description").replace(/<[^>]*>/g, " ").replace(/&[a-z]+;/gi, " ");
      const t = gt("title");
      if (!t) continue;
      const cat = (gt("category") || "Science").trim();
      out.push({ t: cut(t, 44), d: cut(d, 92) || "Science 周刊最新刊发，详见原文。", tag: cut(cat, 8) });
    }
    return out;
  }
  function parseHTML(txt) {
    const re = /<a[^>]+href="(\/(?:doi|news|content)\/[^"]+)"[^>]*>([\s\S]{12,180}?)<\/a>/gi;
    const out = [];
    let m;
    while ((m = re.exec(txt)) && out.length < 8) {
      const t = m[2].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      if (t.length < 14) continue;
      out.push({ t: cut(t, 46), d: "Science 周刊 · 标题自动抽取，摘要请见原文。", tag: "SCIENCE" });
    }
    return out;
  }

  /* ================================================================
   * 模块状态
   * ================================================================ */
  let built = false, L = null;
  let root = null, bg = null, fx = null, scrollEl = null, docEl = null;
  let moreBtn = null, srcEl = null, srcTxt = null, cntEl = null, preEl = null, headEl = null;
  let field = null, fiber = null, cSpr = null, code = null, io = null;
  let reveals = [];          // 主循环驱动的字节显现
  let pendingRv = [];        // 等待进入视口的字节显现
  let hover = null;          // 悬停浮窗
  let orbit = null;          // 环绕粒子
  let drag = null;
  let scrollY = 0, TIME = 0, lastT = 0;
  let rzT = 0;
  let lastOk = 0;            // 上次抓取成功时间
  let coolLeft = 0;
  let thirdItems = null;
  let autoGuard = 0;
  let lastCursor = "";

  /* ---------------- 环绕粒子 ---------------- */
  function mkOrbit() {
    const ps = [];
    for (let i = 0; i < 16; i++) {
      ps.push({
        a: U.rand(0, TAU), sp: U.rand(0.00055, 0.0015) * (Math.random() < 0.35 ? -1 : 1),
        r: U.rand(0.84, 1.18), tilt: U.rand(-0.16, 0.16), trail: [],
        hue: i % 3,
      });
    }
    return { ps, t0: performance.now() };
  }
  function drawOrbit(ctx, rect, time) {
    if (!rect) return;
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    const rx = rect.width * 0.63, ry = rect.height * 0.62;
    ctx.save();
    // 光晕
    const g = ctx.createRadialGradient(cx, cy, Math.min(rect.width, rect.height) * 0.2, cx, cy, Math.max(rx, ry) * 1.5);
    g.addColorStop(0, "rgba(120,220,255,.13)");
    g.addColorStop(0.55, "rgba(150,180,255,.06)");
    g.addColorStop(1, "rgba(140,200,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - rx * 1.6, cy - ry * 1.6, rx * 3.2, ry * 3.2);
    // 三条量子轨道
    ctx.globalCompositeOperation = "source-over";
    for (let i = 0; i < 3; i++) {
      const tilt = (i - 1) * 0.34 + Math.sin(time * 0.0006 + i) * 0.12;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(tilt);
      ctx.strokeStyle = "rgba(26,146,196," + (0.16 + i * 0.07) + ")";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx * (0.9 + i * 0.08), ry * (0.34 + i * 0.1), 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    // 夸克 / 量子环绕
    const cols = ["18,176,214", "126,104,224", "226,150,32"];
    for (let i = 0; i < orbit.ps.length; i++) {
      const p = orbit.ps[i];
      const a = p.a + (time - orbit.t0) * p.sp;
      const tilt = p.tilt + Math.sin(time * 0.0007 + i) * 0.2;
      const ex = Math.cos(a) * rx * p.r;
      const ey = Math.sin(a) * ry * p.r * 0.62;
      const x = cx + ex * Math.cos(tilt) - ey * Math.sin(tilt);
      const y = cy + ex * Math.sin(tilt) + ey * Math.cos(tilt);
      p.trail.push([x, y]);
      if (p.trail.length > 8) p.trail.shift();
      const c = cols[p.hue];
      for (let t = 0; t < p.trail.length; t++) {
        const q = p.trail[t];
        const k = (t + 1) / p.trail.length;
        const rr = 1 + k * 2.4;
        ctx.fillStyle = "rgba(" + c + "," + (k * k * 0.5) + ")";
        ctx.beginPath(); ctx.arc(q[0], q[1], rr, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = "rgba(" + c + ",.95)";
      ctx.beginPath(); ctx.arc(x, y, 1.9 + Math.sin(time * 0.004 + i) * 0.5, 0, TAU); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.9)";
      ctx.beginPath(); ctx.arc(x, y, 0.9, 0, TAU); ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
  }

  /* ================================================================
   * DOM 构建
   * ================================================================ */
  function panelHTML(item, i, k) {
    return '<article class="cw" data-k="' + k + '" data-i="' + i + '">' +
      '<div class="cw-ring"></div><div class="cw-body"></div>' +
      '<div class="cw-copy">' +
      '<div class="cw-meta"><span class="cw-tag">' + U.esc(item.tag || "前沿") + "</span>" +
      '<span class="cw-no">' + String(i + 1).padStart(2, "0") + "</span></div>" +
      '<h3 class="cw-t"></h3><p class="cw-d"></p>' +
      "</div><i class=\"cw-dot\"></i></article>";
  }

  function build() {
    root = U.el("div");
    root.id = "cl-root";
    root.innerHTML =
      '<canvas id="cl-bg"></canvas>' +
      '<div id="cl-scroll"><div id="cl-doc">' +
      '<section class="cl-hero">' +
      '<div class="kick">CLOUD ERA · 云 · 算力 · 111</div>' +
      '<h1 class="hero-line"></h1>' +
      '<div class="kicker">云层之上，机架无声运转；光纤之内，颜色正在奔跑。<br>自 1915 年至今，河海人第一次把水文站设在了云上。</div>' +
      '<div class="cl-hint"><span>继续向下 · 光纤贯穿三层云</span><s></s></div>' +
      "</section>" +
      '<section class="cl-branches"><div class="cl-grid" id="cl-grid"></div></section>' +
      '<section class="cl-epi"><div class="cl-epi-card">' +
      '<div class="cap">EPILOGUE · 云端结语</div>' +
      '<div class="cli"><span class="cli-line" id="cl-l1"></span>' +
      '<span class="cli-line cli-sheen" id="cl-l1s"></span></div>' +
      '<div class="cli"><span class="cli-line" id="cl-l2"></span>' +
      '<span class="cli-line cli-sheen" id="cl-l2s"></span></div>' +
      '<div class="sign"><span>河海大学 · 百十一年 · <b>治水兴邦</b></span>' +
      "<span>READ THE RIVER · RENDER THE CLOUD</span></div>" +
      "</div></section>" +
      '<section class="cl-end"><div class="cl-code">' +
      '<div class="cl-code-hd"><span class="d"><s></s><s></s><s></s></span>' +
      '<span class="nm"><b>ocean_digital_twin.py</b></span>' +
      '<span class="rt"><span>UTF-8</span><span class="live"><i></i>STREAM</span>' +
      '<span class="cnt" id="cl-cnt">0</span></span></div>' +
      '<pre id="cl-pre"></pre>' +
      "</div></section>" +
      "</div></div>" +
      '<canvas id="cl-fx"></canvas>' +
      '<div id="cl-head"><div class="h-en">CLOUD ERA</div>' +
      '<div class="h-cn">Cloud Era<i>·</i>算力之上的云海</div></div>' +
      '<div id="cl-more-wrap">' +
      '<button id="cl-more"><span class="ml">了解更多</span>' +
      '<span class="mt"><b>深度思考ing</b><s><i></i><i></i><i></i></s></span>' +
      '<span class="arw">↗</span></button>' +
      '<div id="cl-src"><em></em><span id="cl-src-txt">Science · News / Latest Research</span></div>' +
      "</div>";
    document.getElementById("page-cloud").appendChild(root);
    bg = document.getElementById("cl-bg");
    fx = document.getElementById("cl-fx");
    scrollEl = document.getElementById("cl-scroll");
    docEl = document.getElementById("cl-doc");
    moreBtn = document.getElementById("cl-more");
    srcEl = document.getElementById("cl-src");
    srcTxt = document.getElementById("cl-src-txt");
    headEl = document.getElementById("cl-head");
    cntEl = document.getElementById("cl-cnt");
    preEl = document.getElementById("cl-pre");

    // 三列
    const grid = document.getElementById("cl-grid");
    let html = "";
    BRANCH_KEYS.forEach(function (key, k) {
      const src = (D.CLOUD && D.CLOUD[key]) || { title: "", windows: [] };
      html += '<div class="cl-col" data-k="' + k + '">' +
        '<header class="cl-bh"><div class="no">' + BRANCH_NO[k] + "</div>" +
        "<h2>" + U.esc(src.title || key) + "</h2>" +
        '<div class="sub">' + BRANCH_SUB[k] + "</div>" +
        '<div class="line"></div></header>' +
        '<div class="cl-list" data-k="' + k + '"></div></div>';
    });
    grid.innerHTML = html;
    renderBranch(0);
    renderBranch(1);
    thirdItems = fallbackItems(true);
    renderBranch(2);
    code = new CodeStream(preEl, cntEl);
    built = true;
  }

  function renderBranch(k) {
    const list = document.querySelector('.cl-list[data-k="' + k + '"]');
    if (!list) return;
    let items;
    if (k === 2) items = thirdItems || [];
    else items = ((D.CLOUD && D.CLOUD[BRANCH_KEYS[k]]) || {}).windows || [];
    let html = "";
    for (let i = 0; i < items.length; i++) html += panelHTML(items[i], i, k);
    list.innerHTML = html;
    // 填充文本 + 字节显现
    const cards = list.querySelectorAll(".cw");
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i], it = items[i];
      const tEl = card.querySelector(".cw-t");
      const dEl = card.querySelector(".cw-d");
      tEl.textContent = it.t || "";
      dEl.textContent = it.d || "";
      if (!card.__revealed) {
        const r1 = new Reveal([tEl], it.t || "", { stagger: 26, flick: 240, delay: 90 + i * 60 });
        const r2 = new Reveal([dEl], it.d || "", { stagger: 7, flick: 200, delay: 320 + i * 90 });
        watch(card, [r1, r2]);
      }
    }
  }

  /* 观察进入视口 → 触发字节显现（IntersectionObserver + 主循环兜底扫描） */
  function startEntry(en) {
    if (!en || en.done) return;
    en.done = true;
    for (let i = 0; i < en.list.length; i++) { en.list[i].start(); reveals.push(en.list[i]); }
    const k = pendingRv.indexOf(en);
    if (k >= 0) pendingRv.splice(k, 1);
  }

  function watch(host, list) {
    if (!host) return;
    const entry = { host: host, list: list, done: false };
    host.__rv = entry;
    pendingRv.push(entry);
    if (io) { try { io.observe(host); } catch (e) {} }
  }

  function scanReveals() {
    if (!pendingRv.length) return;
    const H = window.innerHeight || 800;
    for (let i = pendingRv.length - 1; i >= 0; i--) {
      const r = pendingRv[i].host.getBoundingClientRect();
      if (r.bottom > -40 && r.top < H * 0.94) startEntry(pendingRv[i]);
    }
  }

  function setupIO() {
    if (io) { try { io.disconnect(); } catch (e) {} io = null; }
    if (!("IntersectionObserver" in window) || !scrollEl) { io = null; return; }
    io = new IntersectionObserver(function (ents) {
      for (let i = 0; i < ents.length; i++) {
        const en = ents[i];
        if (!en.isIntersecting) continue;
        startEntry(en.target.__rv);
        try { io.unobserve(en.target); } catch (e) {}
      }
    }, { threshold: 0.12, root: scrollEl, rootMargin: "0px 0px -6% 0px" });
    for (let i = 0; i < pendingRv.length; i++) {
      try { io.observe(pendingRv[i].host); } catch (e) {}
    }
  }

  function fallbackItems(first) {
    const arr = (D.CLOUD_FALLBACK && D.CLOUD_FALLBACK.length) ? D.CLOUD_FALLBACK
      : (((D.CLOUD && D.CLOUD.分支三) || {}).windows || []);
    const srcDefault = (((D.CLOUD && D.CLOUD.分支三) || {}).windows || []);
    const base = arr.length ? arr : srcDefault;
    if (!base.length) return [];
    const n = Math.min(6, base.length);
    let start = first ? 0 : Math.floor(Math.random() * base.length);
    if (!first && U.store) start = (U.store.get("cloudFbIdx", 0) + 1) % base.length;
    if (U.store) U.store.set("cloudFbIdx", start);
    const out = [];
    for (let i = 0; i < n; i++) out.push(base[(start + i) % base.length]);
    return out;
  }

  /* ================================================================
   * 几何测量
   * ================================================================ */
  function measure() {
    if (!fiber || !docEl) return;
    const W = window.innerWidth, H = window.innerHeight;
    const docRect = docEl.getBoundingClientRect();
    const rel = function (el) {
      const r = el.getBoundingClientRect();
      return {
        x: r.left - docRect.left + r.width / 2,
        top: r.top - docRect.top, h: r.height, w: r.width,
        left: r.left - docRect.left,
      };
    };
    const hero = docEl.querySelector(".cl-hero");
    const grid = document.getElementById("cl-grid");
    const cols = docEl.querySelectorAll(".cl-col");
    if (!hero || !grid || !cols.length) return;
    const mob = W < 780;
    const gridRel = rel(grid);
    const heroH = hero.offsetHeight;
    const splitY = Math.max(heroH * 0.52, gridRel.top - 58);
    const branches = [];
    const nodes = [];
    for (let i = 0; i < cols.length; i++) {
      const r = rel(cols[i]);
      const bx = mob ? W / 2 + (i - 1) * 14 : r.x;
      branches.push({ x: bx, top: r.top, bottom: r.top + r.h });
      // 每个浮窗在光纤上的时间线节点
      const cards = cols[i].querySelectorAll(".cw");
      for (let c = 0; c < cards.length; c++) {
        const cr = cards[c].getBoundingClientRect();
        const cy = cr.top - docRect.top + cr.height / 2;
        nodes.push({ bi: i, x: bx, y: cy });
      }
    }
    fiber.setGeometry({ W, H, splitY, branches, nodes, mob });
  }

  /* ================================================================
   * 抓取 / 渲染第三支
   * ================================================================ */
  function setSrc(text, warn) {
    if (srcEl) srcEl.classList.toggle("warn", !!warn);
    if (srcTxt) srcTxt.textContent = text;
  }
  function stamp() {
    const t = U.nowNanjing();
    return String(t.hour).padStart(2, "0") + ":" + String(t.minute).padStart(2, "0");
  }
  function setCool(ms) {
    coolLeft = Math.max(0, ms || 0);
    if (moreBtn) moreBtn.classList.toggle("thinking", coolLeft > 0);
  }
  function applyThird(items, label, warn) {
    thirdItems = items;
    renderBranch(2);
    setSrc(label, warn);
    measure();
  }
  function refreshThird(auto) {
    if (!L || L.dead) return;
    if (auto) {
      const now = Date.now();
      if (now - autoGuard < 4000) return;
      autoGuard = now;
    }
    const myL = L;
    let settled = false;
    const done = function (items, label, warn) {
      if (settled) return;
      settled = true;
      if (myL.dead || L !== myL) return;
      applyThird(items, label, warn);
      // 只有手动点击「了解更多」才产生 30 秒冷却；自动刷新不受限
      if (!auto) {
        lastOk = Date.now();
        U.store.set("cloudFetchAt", lastOk);
        setCool(COOLDOWN);
      }
    };
    setSrc("正在检索 Science …", false);
    const tt = myL.timeout(function () {
      done(fallbackItems(false), "Science 抓取受限 · 本地精选 · " + stamp(), true);
    }, auto ? 5200 : 6500);
    const clear = function () { try { clearTimeout(tt); } catch (e) {} };
    // 直连优先；若失败，用本地中继再试一次（绕开本机网络/防火墙与偶发 CORS 限制）
    const sciRelay = (location.protocol === "file:" ? "" : ((window.CONFIG && window.CONFIG.relayUrl) || ""));
    const sciFeed = "https://www.science.org/rss/news_current.xml";
    httpText(sciFeed, 4200)
      .catch(function (e) {
        if (!sciRelay) throw e;
        return httpText(sciRelay + "?url=" + encodeURIComponent(sciFeed), 6000);
      })
      .then(function (txt) {
        const items = parseRSS(txt);
        if (items.length >= 3) { clear(); done(items.slice(0, 6), "Science News RSS · " + stamp(), false); return Promise.reject(new Error("empty")); }
        return httpText("https://www.science.org/", 4200).then(function (html) {
          const it2 = parseHTML(html);
          clear();
          if (it2.length >= 3) done(it2.slice(0, 6), "Science 首页 · Latest Research · " + stamp(), false);
          else done(fallbackItems(false), "Science 结构变更 · 本地精选 · " + stamp(), true);
        });
      })
      .catch(function () {
        clear();
        if (settled) return;
        done(fallbackItems(false), "Science 跨域受限 · 本地精选 · " + stamp(), true);
      });
  }

  /* ================================================================
   * 交互
   * ================================================================ */
  function bind() {
    // —— 拖拽云朵（松开后弹簧回位，并带动周围云）
    const canvasRect = function () {
      const r = bg.getBoundingClientRect();
      return { l: r.left, t: r.top };
    };
    L.on(scrollEl, "pointerdown", function (e) {
      if (e.target.closest(".cw,button,a,.cl-code")) return;
      const r = canvasRect();
      const c = field && field.pick(e.clientX - r.l, e.clientY - r.t);
      if (!c) return;
      drag = { c, sx: e.clientX, sy: e.clientY, ox: c.ox, oy: c.oy };
      c.drag = true; c.svx = 0; c.svy = 0;
      if (root) root.classList.add("grabbing");
    });
    L.on(window, "pointermove", function (e) {
      if (drag) {
        const c = drag.c;
        const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
        c.ox = drag.ox + dx;
        c.oy = drag.oy + dy * 0.92;
        c.svx = dx * 0.05; c.svy = dy * 0.045;
        return;
      }
      if (!field || !root) return;
      const r = canvasRect();
      const cur = field.pick(e.clientX - r.l, e.clientY - r.t) ? "grab" : "";
      if (cur !== lastCursor) { lastCursor = cur; root.style.cursor = cur; }
    });
    const up = function () {
      if (!drag) return;
      drag.c.drag = false;
      drag = null;
      if (root) root.classList.remove("grabbing");
    };
    L.on(window, "pointerup", up);
    L.on(window, "pointercancel", up);

    // —— 悬停浮窗：边框闪光 + 量子环绕
    const grid = document.getElementById("cl-grid");
    L.on(grid, "pointerover", function (e) {
      const card = e.target.closest(".cw");
      if (!card || hover === card) return;
      if (hover) hover.classList.remove("on");
      hover = card;
      card.classList.add("on");
      orbit = mkOrbit();
    });
    L.on(grid, "pointerout", function (e) {
      const card = e.target.closest(".cw");
      if (!card) return;
      const to = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest(".cw") : null;
      if (to === card) return;
      card.classList.remove("on");
      if (hover === card) { hover = null; orbit = null; }
    });
    L.on(grid, "click", function (e) {
      const card = e.target.closest(".cw");
      if (!card) return;
      if (card.classList.contains("gone")) {
        card.classList.remove("gone");
        card.classList.add("pop");
        L.timeout(function () { card.classList.remove("pop"); }, 640);
      }
    });
    L.on(grid, "dblclick", function (e) {
      const card = e.target.closest(".cw");
      if (!card || card.classList.contains("gone")) return;
      card.classList.add("gone");
      card.classList.remove("on");
      if (hover === card) { hover = null; orbit = null; }
    });

    // —— 了解更多：抓取成功后 30 秒冷却，期间为深度思考ing
    L.on(moreBtn, "click", function () {
      if (coolLeft > 0) return;
      refreshThird(false);
    });
    L.interval(function () {
      if (coolLeft <= 0) return;
      coolLeft -= 500;
      if (coolLeft <= 0) { coolLeft = 0; if (moreBtn) moreBtn.classList.remove("thinking"); }
    }, 500);

    // —— 尺寸变化
    L.on(window, "resize", onResize);
  }

  function onResize() {
    if (rzT) clearTimeout(rzT);
    rzT = setTimeout(function () {
      rzT = 0;
      if (!L || L.dead) return;
      const W = window.innerWidth, H = window.innerHeight;
      if (field) field.resize(W, H);
      cSpr = makeComputeSprite();
      measure();
    }, 240);
  }

  /* ================================================================
   * 主循环
   * ================================================================ */
  function startLoop() {
    lastT = performance.now();
    let frame = 0, headDim = false;
    L.loop(function (now) {
      let dt = now - lastT;
      lastT = now;
      if (dt > 64) dt = 64;
      if (dt < 0) dt = 0;
      TIME += dt;

      if (scrollEl) {
        const sy = scrollEl.scrollTop;
        // 平滑跟随，避免抖动
        scrollY += (sy - scrollY) * 0.35;
        if (Math.abs(sy - scrollY) < 0.3) scrollY = sy;
      }
      // 深入云层后淡出左上角标题，避免与内容重叠
      if (headEl) {
        const d = scrollY > 70;
        if (d !== headDim) { headDim = d; headEl.classList.toggle("dim", d); }
      }

      const B = U.fitCanvas(bg);
      const ctx = B.ctx, W = B.w, H = B.h;
      if (!field.built || field.W !== W || field.H !== H) field.resize(W, H);

      const flash = fiber.update(dt, TIME);
      field.update(dt, TIME, scrollY);

      ctx.clearRect(0, 0, W, H);
      field.drawSky(ctx, W, H, scrollY, flash);
      field.drawLayer(ctx, 0, scrollY, flash * 0.6);
      field.drawLayer(ctx, 1, scrollY, flash);
      field.drawLayer(ctx, 2, scrollY, flash);
      // 光纤在云层之上：保证"时间线"始终可读，同时穿过三层云
      fiber.draw(ctx, scrollY, H, flash);
      if (cSpr) {
        for (let i = 0; i < CLUSTERS.length; i++) {
          drawCompute(ctx, cSpr, CLUSTERS[i], W, H, scrollY, TIME, flash);
        }
      }
      field.drawMotes(ctx, TIME, W, H);
      field.drawBloom(ctx, W, H, flash, TIME);

      // —— 前景：环绕粒子
      const F = U.fitCanvas(fx);
      F.ctx.clearRect(0, 0, F.w, F.h);
      if (hover && orbit && !hover.classList.contains("gone")) {
        drawOrbit(F.ctx, hover.getBoundingClientRect(), TIME);
      }

      // —— 字节显现
      for (let i = reveals.length - 1; i >= 0; i--) {
        const r = reveals[i];
        if (!r.started) continue;
        if (r.update(now)) reveals.splice(i, 1);
      }
      // —— 兜底可见性扫描（每 12 帧一次，保证文字一定显现）
      if ((frame++ % 12) === 0) scanReveals();
      // —— 代码闪字
      if (code) code.update(dt);
    });
  }

  /* ================================================================
   * 进场 / 离场
   * ================================================================ */
  function enter() {
    if (L) { L.kill(); L = null; }              // 同页重入
    L = U.life();
    if (!built) build();
    if (!field) field = new CloudField();
    if (!fiber) fiber = new Fiber();
    if (!cSpr) cSpr = makeComputeSprite();
    reveals = []; pendingRv = []; hover = null; orbit = null;
    if (drag) { drag.c.drag = false; drag = null; } else drag = null;
    scrollY = 0;
    if (scrollEl) scrollEl.scrollTop = 0;

    // 冷却：上次抓取成功后 30 秒内按钮保持深度思考ing（自动刷新不受限）
    lastOk = U.store.get("cloudFetchAt", 0) || 0;
    setCool(lastOk ? Math.max(0, COOLDOWN - (Date.now() - lastOk)) : 0);

    // 重绘三支（同时复位上次的隐藏状态）
    if (!thirdItems) thirdItems = fallbackItems(true);
    renderBranch(0); renderBranch(1); renderBranch(2);

    // 首屏字节显现
    const heroHost = docEl.querySelector(".hero-line");
    if (heroHost) {
      const r = new Reveal([heroHost], HERO_LINE, { stagger: 54, flick: 460, delay: 260 });
      r.start(); reveals.push(r);
    }
    // 分支标题同样以字节显现
    const heads = docEl.querySelectorAll(".cl-bh h2");
    for (let i = 0; i < heads.length; i++) {
      const txt = heads[i].textContent || "";
      if (!txt) continue;
      watch(heads[i], [new Reveal([heads[i]], txt, { stagger: 62, flick: 400, delay: 200 + i * 140 })]);
    }
    // 结语字节显现（进入视口后触发）
    const l1 = document.getElementById("cl-l1"), l1s = document.getElementById("cl-l1s");
    const l2 = document.getElementById("cl-l2"), l2s = document.getElementById("cl-l2s");
    const epi = docEl.querySelector(".cl-epi");
    if (epi && l1 && l1s && l2 && l2s) {
      watch(epi, [
        new Reveal([l1, l1s], EPI_1, { stagger: 46, flick: 380, delay: 120 }),
        new Reveal([l2, l2s], EPI_2, { stagger: 46, flick: 380, delay: 900 }),
      ]);
    }
    setupIO();

    // 无尽代码流
    code.reset();
    L.interval(function () { code.step(); }, 110);
    L.timeout(function () { for (let i = 0; i < 16; i++) code.step(); }, 60);

    measure();
    L.timeout(function () { measure(); }, 420);
    L.timeout(function () { measure(); }, 1500);

    bind();
    startLoop();
    refreshThird(true);
  }

  function leave() {
    if (L) { L.kill(); L = null; }
    if (io) { try { io.disconnect(); } catch (e) {} io = null; }
    if (rzT) { clearTimeout(rzT); rzT = 0; }
    reveals = [];
    pendingRv = [];
    hover = null; orbit = null;
    if (drag) { drag.c.drag = false; drag = null; }
    if (code) { code.reset(); code.pool.length = 0; code.flash.length = 0; }
    if (root) { root.classList.remove("grabbing"); root.style.cursor = ""; }
    if (scrollEl) scrollEl.scrollTop = 0;
    if (moreBtn) moreBtn.classList.remove("thinking");
    coolLeft = 0;
  }

  App.register("cloud", { enter: enter, leave: leave });
})();

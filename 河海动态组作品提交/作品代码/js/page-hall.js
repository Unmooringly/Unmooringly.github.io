/* ============================================================
 * 名贤堂 —— 二十位把江河写进生命的人
 *   · 昏暗陈列馆：全屏内墙背景 + 暖色环境光 + 顶部射灯锥光 + 尘埃/火星
 *   · 信息栏：20 个 16:9 相框（电脑屏宽 1/4、手机 1/2）首尾循环；长按拖拽 + 惯性吸附；
 *             单击相框把「下一个 / 被点的那一个」送到正中并放大（最大 1.18 倍）
 *   · 框面火光：canvas 叠加层，随整体时间抖动，边缘暖色高光沿框跳动
 *   · 续火花：左下角火花（灰→火星 1→火苗 10→火炬 100→烽火台 1000）；
 *             每日首次点击才 +1；相邻两座烽火台自动在下方连成长城
 *   · 今日景仰：右下角「景仰」→ 登录（学号 + 姓名）→ 发表敬言 → 弹幕飘过 + 小红花
 *   · 重回历史修进（App.isUpgraded）：右下角火箭（装配 7 秒 / 4 支喷射器 / 升空）
 *             + 名贤堂上空旋转星空 + 阿斯加德彩虹桥轨道
 * 写法：严格 IIFE，无 ES module；enter() 建 U.life()，leave() 全部清理。
 * ============================================================ */
(function () {
  "use strict";

  const U = window.Utils, D = window.DATA;
  const TAU = Math.PI * 2;
  const AL = (D && D.ALUMNI) || [];
  const N = AL.length;

  const WALL_IMG = "素材/背景/名贤堂.jpg";

  /* ================================================================
   * 一 · 样式
   * ================================================================ */
  U.injectCSS("css-hall", `
  /* ---------- 页面根 ---------- */
  #page-hall{background:#07050a;}
  #hall-root{position:absolute;inset:0;overflow:hidden;background:#07050a;
    --hw:320px;--hh:180px;--cy:55%;}

  /* ---------- 陈列馆内墙（全屏 cover） ---------- */
  #hall-wall{position:absolute;inset:-3%;z-index:0;background-color:#1b1009;
    background-size:cover;background-position:center 44%;background-repeat:no-repeat;
    filter:brightness(.74) saturate(.86) contrast(1.06);
    animation:hallBreath 32s ease-in-out infinite alternate;will-change:transform;}
  #hall-wall.fallback{background-image:linear-gradient(158deg,#33200f 0%,#1d120a 44%,#0b0705 100%);}
  #hall-wall::after{content:"";position:absolute;inset:0;pointer-events:none;
    background:linear-gradient(180deg,rgba(6,4,2,.74) 0%,rgba(6,4,2,.14) 24%,rgba(6,4,2,0) 52%,rgba(6,4,2,.62) 100%),
      radial-gradient(70% 60% at 50% 44%,rgba(255,168,88,.1),transparent 72%);}
  @keyframes hallBreath{from{transform:scale(1.04) translate3d(0,0,0);}
    to{transform:scale(1.1) translate3d(-1.3%,-1%,0);}}

  /* ---------- 后景 / 前景画布 ---------- */
  #hall-atmo,#hall-fx{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}
  #hall-atmo{z-index:1;}
  #hall-fx{z-index:6;}

  /* ---------- 信息栏舞台 ---------- */
  #hall-stage{position:absolute;inset:0;z-index:4;cursor:grab;touch-action:none;}
  #hall-stage.dragging{cursor:grabbing;}
  #hall-items{position:absolute;inset:0;perspective:1800px;perspective-origin:50% 46%;
    animation:hallIn 1.05s var(--ease) both;}
  @keyframes hallIn{from{opacity:0;}to{opacity:1;}}

  .hall-item{position:absolute;left:50%;top:var(--cy);width:var(--hw);height:var(--hh);
    margin-left:calc(var(--hw) / -2);margin-top:calc(var(--hh) / -2);
    transform-origin:50% 50%;will-change:transform,opacity;border-radius:4px;}
  .hi-frame{position:absolute;inset:0;border-radius:3px;overflow:hidden;
    background:linear-gradient(152deg,rgba(46,34,23,.95) 0%,rgba(22,15,10,.97) 58%,rgba(12,8,6,.98) 100%);
    box-shadow:0 22px 48px rgba(0,0,0,.66),
      0 0 0 1px rgba(216,178,112,.32) inset,
      0 0 0 4px rgba(26,17,10,.9),
      0 0 0 5px rgba(216,178,112,.16),
      0 0 42px rgba(0,0,0,.55);
    transition:box-shadow .4s ease;}
  .hall-item.cur .hi-frame{box-shadow:0 26px 58px rgba(0,0,0,.72),
      0 0 0 1px rgba(255,214,140,.62) inset,
      0 0 0 4px rgba(30,19,11,.94),
      0 0 0 5px rgba(255,206,120,.4),
      0 0 60px rgba(255,150,60,.28);}
  .hall-item.cur .hi-no{color:rgba(255,214,140,.95);}

  .hi-in{position:absolute;inset:0;display:flex;align-items:stretch;overflow:hidden;border-radius:2px;}
  .hi-photo{position:relative;flex:0 0 37%;min-width:0;overflow:hidden;
    background:linear-gradient(160deg,#3b2c1d,#1a1109 70%,#0d0805);}
  .hi-photo img{width:100%;height:100%;object-fit:cover;object-position:50% 16%;display:block;
    filter:sepia(.14) saturate(.9) contrast(1.04) brightness(.98);
    transition:transform .8s var(--ease),filter .6s ease;}
  .hall-item.cur .hi-photo img{filter:sepia(.06) saturate(1.02) contrast(1.06) brightness(1.05);}
  .hi-photo::after{content:"";position:absolute;inset:0;pointer-events:none;
    background:linear-gradient(90deg,rgba(10,6,3,0) 46%,rgba(14,9,5,.92) 100%),
      linear-gradient(180deg,rgba(255,190,110,.14),rgba(0,0,0,0) 40%,rgba(0,0,0,.42) 100%);}
  .hi-photo.fail img{display:none;}
  .hi-photo.fail::before{content:attr(data-n);position:absolute;inset:0;display:flex;
    align-items:center;justify-content:center;font-family:var(--f-kai);color:rgba(240,214,170,.5);
    font-size:clamp(16px,4.4vw,34px);letter-spacing:.1em;}

  .hi-txt{position:relative;flex:1 1 auto;min-width:0;display:flex;flex-direction:column;
    justify-content:center;gap:.28em;padding:5% 5% 8% 4%;}
  .hi-name{font-family:var(--f-kai);font-weight:400;color:#f4e2c0;line-height:1.15;
    font-size:clamp(12px,calc(var(--hw) * .062),22px);letter-spacing:.1em;
    text-shadow:0 0 18px rgba(255,170,80,.42),0 1px 4px rgba(0,0,0,.9);}
  .hi-years{font-family:var(--f-song);color:rgba(226,190,138,.82);line-height:1.2;
    font-size:clamp(8px,calc(var(--hw) * .031),12px);letter-spacing:.09em;}
  .hi-title{font-family:var(--f-song);color:rgba(206,192,172,.72);line-height:1.3;
    font-size:clamp(7px,calc(var(--hw) * .028),11px);letter-spacing:.04em;
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .hi-quote{font-family:var(--f-kai);color:rgba(238,208,160,.5);line-height:1.5;
    font-size:clamp(7px,calc(var(--hw) * .026),10.5px);letter-spacing:.02em;
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
  .hi-no{position:absolute;right:6px;top:5px;z-index:3;font-family:var(--f-song);
    font-size:clamp(7px,calc(var(--hw) * .023),10px);letter-spacing:.16em;
    color:rgba(216,178,112,.5);text-shadow:0 1px 3px rgba(0,0,0,.9);}

  /* 玻璃反光 + 缓慢扫光 */
  .hi-glass{position:absolute;inset:0;z-index:2;pointer-events:none;border-radius:3px;
    background:linear-gradient(112deg,rgba(255,246,226,.1) 0%,rgba(255,255,255,0) 24%,
      rgba(255,255,255,0) 64%,rgba(255,240,210,.06) 80%,rgba(255,255,255,0) 100%);
    mix-blend-mode:screen;}
  .hi-glass::after{content:"";position:absolute;inset:0;
    background:linear-gradient(104deg,transparent 36%,rgba(255,248,230,.17) 48%,transparent 60%);
    transform:translateX(-130%);animation:hiSweep 9s ease-in-out infinite;
    animation-delay:var(--dl,0s);}
  @keyframes hiSweep{0%,74%{transform:translateX(-130%);}90%{transform:translateX(130%);}
    100%{transform:translateX(130%);}}

  /* 左下火花 / 右下景仰 */
  .hi-act{position:absolute;bottom:5px;z-index:4;display:inline-flex;align-items:center;gap:4px;
    padding:2px 7px 2px 5px;border-radius:20px;cursor:pointer;
    appearance:none;-webkit-appearance:none;
    border:1px solid rgba(216,178,112,.24);background:rgba(10,7,4,.72);
    color:#c9b083;font-family:var(--f-song);letter-spacing:.06em;
    font-size:clamp(8px,calc(var(--hw) * .026),11px);line-height:1;
    transition:background .28s ease,border-color .28s ease,color .28s ease,transform .28s ease;}
  .hi-act:hover{background:rgba(78,48,22,.86);border-color:rgba(255,206,130,.68);color:#ffe7bc;
    transform:translateY(-1px);}
  .hi-act:active{transform:translateY(0) scale(.96);}
  .hi-spark{left:6px;}
  .hi-tribute{right:6px;}
  .hs-icon{width:1.34em;height:1.34em;display:block;flex:0 0 auto;}
  .hs-num{font-variant-numeric:tabular-nums;opacity:.9;}
  .hi-spark[data-lv="0"]{color:#7b7770;}
  .hi-spark[data-lv="1"],.hi-spark[data-lv="2"],.hi-spark[data-lv="3"],.hi-spark[data-lv="4"]{
    border-color:rgba(255,150,80,.45);color:#ffcf8e;background:rgba(58,20,8,.62);}
  .hi-spark[data-lv="4"]{border-color:rgba(255,214,110,.8);box-shadow:0 0 16px rgba(255,160,50,.5);}
  .hs-pop{position:absolute;left:14px;bottom:24px;z-index:6;pointer-events:none;
    font-family:var(--f-song);font-size:clamp(9px,calc(var(--hw) * .028),12px);color:#ffd79a;
    text-shadow:0 0 14px rgba(255,150,50,.9);animation:hsPop 1.4s ease-out both;}
  @keyframes hsPop{0%{opacity:0;transform:translateY(6px) scale(.8);}
    22%{opacity:1;transform:translateY(0) scale(1);}
    100%{opacity:0;transform:translateY(-26px) scale(.96);}}

  /* SVG 火焰图标 */
  .sp{width:100%;height:100%;display:block;overflow:visible;}
  .sp .f,.sp .b{fill:currentColor;}
  .sp .b{opacity:.82;}
  .sp .g{fill:#fff3c8;opacity:.82;}
  .sp .e{fill:#ffd07a;opacity:.9;}
  .sp-lv0{color:#726c66;}
  .sp-lv1{color:#dc4a2b;animation:spFlick 1.7s ease-in-out infinite;}
  .sp-lv2{color:#ff7a2a;filter:drop-shadow(0 0 5px rgba(255,126,42,.85));
    animation:spFlick 1.15s ease-in-out infinite;}
  .sp-lv3{color:#ffb13c;filter:drop-shadow(0 0 7px rgba(255,166,60,.9));
    animation:spFlick .95s ease-in-out infinite;}
  .sp-lv4{color:#ffd76a;filter:drop-shadow(0 0 8px rgba(255,196,86,1));
    animation:spBeacon 2.6s ease-in-out infinite;}
  @keyframes spFlick{0%,100%{transform:scale(1) translateY(0);opacity:.9;}
    32%{transform:scale(1.12,.9) translateY(-.5px);opacity:1;}
    62%{transform:scale(.93,1.08) translateY(.4px);opacity:.86;}}
  @keyframes spBeacon{0%,100%{transform:scale(1);opacity:.94;}
    40%{transform:scale(1.1);opacity:1;}66%{transform:scale(.97);opacity:.9;}}
  .fl-svg{width:1.15em;height:1.15em;display:block;}
  .fl-svg .petals ellipse{fill:#d43a2b;}
  .fl-svg .core{fill:#ffd76a;}

  /* ---------- 多层暗角 / 暖调 ---------- */
  #hall-vig{position:absolute;inset:0;z-index:7;pointer-events:none;
    background:
      radial-gradient(118% 92% at 50% 46%,rgba(0,0,0,0) 33%,rgba(4,2,0,.5) 74%,rgba(3,1,0,.9) 100%),
      radial-gradient(56% 44% at 2% 98%,rgba(0,0,0,.6),rgba(0,0,0,0) 72%),
      radial-gradient(52% 42% at 98% 94%,rgba(0,0,0,.52),rgba(0,0,0,0) 74%),
      radial-gradient(80% 58% at 50% 106%,rgba(255,120,30,.11),rgba(255,90,20,0) 72%),
      linear-gradient(180deg,rgba(2,1,0,.7) 0%,rgba(2,1,0,.1) 20%,rgba(0,0,0,0) 54%,rgba(2,1,0,.6) 100%);}
  #hall-root.upgraded #hall-vig{box-shadow:inset 0 70px 140px -60px rgba(70,130,230,.34);}

  /* ---------- 左上标题 ---------- */
  #hall-head{position:absolute;left:clamp(16px,3vw,44px);top:clamp(14px,2.6vh,32px);z-index:9;
    pointer-events:none;max-width:76vw;}
  #hall-title{font-family:var(--f-kai);font-weight:400;letter-spacing:.16em;
    font-size:clamp(13px,1.36vw,19px);color:#f2ddb8;
    text-shadow:0 0 24px rgba(255,168,80,.45),0 2px 10px rgba(0,0,0,.85);}
  #hall-title .dot{color:#d9b26a;margin:0 .4em;}
  #hall-sub{margin-top:7px;font-family:var(--f-song);letter-spacing:.08em;line-height:1.8;
    font-size:clamp(9px,.95vw,12px);color:rgba(226,200,160,.62);
    text-shadow:0 1px 6px rgba(0,0,0,.9);}
  #hall-sub b{color:#ffd79a;font-weight:400;}

  /* ---------- 左下图例 ---------- */
  #hall-legend{position:absolute;left:clamp(14px,2.4vw,38px);bottom:clamp(12px,2.2vh,26px);z-index:8;
    display:flex;flex-direction:column;gap:5px;pointer-events:none;
    font-family:var(--f-song);letter-spacing:.07em;line-height:1.6;
    font-size:clamp(8px,.85vw,11px);color:rgba(216,192,156,.62);
    text-shadow:0 1px 5px rgba(0,0,0,.9);}
  #hall-legend .row{display:flex;align-items:center;gap:11px;flex-wrap:wrap;}
  #hall-legend .lg{display:inline-flex;align-items:center;gap:3px;}
  #hall-legend .lg svg{width:13px;height:13px;display:block;}
  #hall-legend .tag{color:#ffd79a;}
  #hall-tip{font-family:var(--f-kai);letter-spacing:.1em;color:rgba(246,222,182,.9);
    font-size:clamp(9px,1vw,13px);}
  #hall-tip b{color:#ffd28a;font-weight:400;margin:0 .28em;}
  #hall-tip span{opacity:.62;font-size:.86em;}

  /* ---------- 景仰弹幕 ---------- */
  #hall-danmu{position:absolute;left:0;right:0;top:11%;height:21%;z-index:8;overflow:hidden;
    pointer-events:none;
    -webkit-mask-image:linear-gradient(90deg,transparent 0,#000 5%,#000 93%,transparent 100%);
    mask-image:linear-gradient(90deg,transparent 0,#000 5%,#000 93%,transparent 100%);}
  .hall-dm{position:absolute;left:100%;top:0;white-space:nowrap;display:inline-flex;
    align-items:baseline;gap:8px;padding:3px 13px;border-radius:20px;
    background:rgba(14,9,5,.34);color:#f6e7cb;font-family:var(--f-kai);
    letter-spacing:.04em;font-size:clamp(12px,1.5vw,19px);
    text-shadow:0 0 16px rgba(255,176,86,.55),0 2px 7px rgba(0,0,0,.85);
    animation-name:dmRun;animation-timing-function:linear;animation-fill-mode:forwards;
    will-change:transform;}
  @keyframes dmRun{from{transform:translate3d(0,0,0);}
    to{transform:translate3d(calc(-100vw - 140%),0,0);}}
  .hall-dm .dm-name{position:relative;font-family:var(--f-song);font-size:.82em;
    color:#ffd79a;font-style:normal;padding-right:2px;}
  .hall-dm .dm-fl{position:absolute;right:-7px;bottom:-6px;width:.82em;height:.82em;
    font-style:normal;filter:drop-shadow(0 0 5px rgba(255,90,60,.9));}
  .hall-dm.mine{background:rgba(104,26,16,.46);border:1px solid rgba(255,150,90,.4);
    box-shadow:0 0 28px rgba(255,110,60,.34);color:#fff0d6;}

  /* ---------- 火箭（修进形态） ---------- */
  #hall-rocket-wrap{position:absolute;right:clamp(10px,2vw,32px);bottom:clamp(8px,1.4vh,20px);
    z-index:9;width:clamp(108px,11vw,164px);pointer-events:none;
    display:flex;flex-direction:column;align-items:center;gap:3px;}
  #hall-root:not(.upgraded) #hall-rocket-wrap{display:none;}
  #hall-rocketcv{width:100%;aspect-ratio:2/3;height:auto;display:block;
    filter:drop-shadow(0 6px 22px rgba(255,140,50,.24));}
  #rk-hud{width:100%;text-align:center;font-family:var(--f-song);letter-spacing:.05em;
    font-size:clamp(8px,.82vw,10.5px);color:rgba(232,210,176,.82);line-height:1.5;
    text-shadow:0 1px 5px rgba(0,0,0,.95);}
  #rk-hud b{color:#ffd88f;font-weight:400;}
  #rk-hud .lit{color:#ffb85e;}
  #rk-bar{height:2px;width:84%;margin:4px auto 0;border-radius:2px;overflow:hidden;
    background:rgba(255,190,110,.16);}
  #rk-bar i{display:block;height:100%;width:0%;border-radius:2px;
    background:linear-gradient(90deg,#ff9a3c,#ffe9b0);box-shadow:0 0 8px rgba(255,180,80,.95);
    transition:width .12s linear;}

  /* ---------- 升空横幅 ---------- */
  #hall-banner{position:absolute;left:50%;top:25%;z-index:11;pointer-events:none;opacity:0;
    transform:translate(-50%,0);text-align:center;line-height:2.1;letter-spacing:.12em;
    font-family:var(--f-kai);color:#ffeac6;font-size:clamp(13px,1.5vw,22px);
    text-shadow:0 0 30px rgba(255,164,64,.85),0 4px 20px rgba(0,0,0,.95);}
  #hall-banner.on{animation:hallBanner 5.4s cubic-bezier(.2,.8,.2,1) both;}
  #hall-banner b{font-family:var(--f-song);font-weight:400;font-size:1.22em;
    color:#ffcf7a;padding:0 .1em;}
  @keyframes hallBanner{0%{opacity:0;transform:translate(-50%,28px) scale(.9);filter:blur(9px);}
    15%{opacity:1;transform:translate(-50%,0) scale(1);filter:blur(0);}
    80%{opacity:1;}100%{opacity:0;transform:translate(-50%,-20px) scale(1);}}

  /* ---------- 登录 / 敬言弹层 ---------- */
  .hall-modal{position:absolute;inset:0;z-index:30;display:none;align-items:center;
    justify-content:center;background:rgba(6,4,3,.82);}
  .hall-modal.on{display:flex;}
  .hm-card{width:min(92vw,436px);padding:22px 24px 18px;border-radius:6px;position:relative;
    font-family:var(--f-song);
    background:linear-gradient(160deg,rgba(42,29,18,.975) 0%,rgba(15,10,7,.985) 100%);
    border:1px solid rgba(216,178,112,.36);
    box-shadow:0 32px 84px rgba(0,0,0,.82),0 0 0 1px rgba(0,0,0,.6) inset,
      0 0 70px rgba(255,146,60,.12) inset;
    animation:hmIn .44s cubic-bezier(.2,.9,.25,1) both;}
  .hm-card::before{content:"";position:absolute;inset:7px;border:1px solid rgba(216,178,112,.14);
    border-radius:3px;pointer-events:none;}
  @keyframes hmIn{from{opacity:0;transform:translateY(20px) scale(.96);}
    to{opacity:1;transform:none;}}
  .hm-title{font-family:var(--f-kai);letter-spacing:.2em;margin-bottom:5px;
    font-size:clamp(15px,1.5vw,20px);color:#ffdfae;}
  .hm-sub{letter-spacing:.06em;line-height:1.8;margin-bottom:14px;
    font-size:clamp(9px,.9vw,11px);color:rgba(220,196,158,.62);}
  .hm-field{display:block;margin-bottom:10px;position:relative;z-index:2;}
  .hm-field span{display:block;margin-bottom:4px;letter-spacing:.12em;
    font-size:11px;color:rgba(226,200,160,.78);}
  .hm-field input,.hm-card textarea{width:100%;padding:9px 11px;border-radius:3px;
    border:1px solid rgba(216,178,112,.28);background:rgba(9,6,4,.84);
    color:#f7e8cf;font-family:var(--f-song);font-size:13px;letter-spacing:.06em;
    outline:none;transition:border-color .25s ease,box-shadow .25s ease;}
  .hm-field input:focus,.hm-card textarea:focus{border-color:rgba(255,196,110,.78);
    box-shadow:0 0 0 1px rgba(255,180,90,.22),0 0 22px rgba(255,150,50,.16);}
  .hm-card textarea{resize:none;height:76px;line-height:1.7;}
  .hm-err{min-height:16px;letter-spacing:.05em;font-size:11px;color:#ff9a72;position:relative;z-index:2;}
  .hm-btns{display:flex;gap:10px;justify-content:flex-end;margin-top:4px;position:relative;z-index:2;}
  .hm-btn{padding:8px 16px;border-radius:2px;cursor:pointer;letter-spacing:.14em;
    font-family:var(--f-song);font-size:12px;color:#e8d3ad;
    appearance:none;-webkit-appearance:none;
    border:1px solid rgba(216,178,112,.32);background:rgba(48,32,20,.5);
    transition:background .25s ease,color .25s ease,border-color .25s ease;}
  .hm-btn:hover{background:rgba(120,72,30,.62);color:#fff0cf;border-color:rgba(255,200,120,.7);}
  .hm-btn.pri{color:#fff2d8;border-color:rgba(255,196,120,.55);
    background:linear-gradient(180deg,rgba(168,102,44,.88),rgba(112,58,22,.92));}
  .hm-btn.pri:hover{background:linear-gradient(180deg,rgba(206,128,54,.95),rgba(138,72,28,.95));}
  .hm-chips{display:flex;flex-wrap:wrap;gap:6px;margin:9px 0 3px;position:relative;z-index:2;}
  .hm-chip{padding:4px 9px;border-radius:16px;cursor:pointer;letter-spacing:.02em;
    font-family:var(--f-kai);font-size:11px;color:rgba(232,211,173,.82);
    border:1px dashed rgba(216,178,112,.3);background:transparent;
    transition:background .2s ease,color .2s ease;}
  .hm-chip:hover{background:rgba(120,70,26,.42);color:#ffe9c4;}
  .hm-flower{display:inline-flex;align-items:center;gap:5px;letter-spacing:.06em;
    font-size:11px;color:rgba(255,190,120,.88);}
  .hm-flower svg{width:12px;height:12px;}

  /* ---------- 入场光晕 ---------- */
  #hall-flash{position:absolute;inset:0;z-index:12;pointer-events:none;opacity:0;
    background:radial-gradient(62% 46% at 50% 52%,rgba(255,196,128,.42),rgba(255,140,50,0) 72%);}
  #hall-flash.on{animation:hallFlash 1.9s ease-out both;}
  @keyframes hallFlash{0%{opacity:0;}20%{opacity:1;}100%{opacity:0;}}

  /* ---------- 移动端 ---------- */
  @media (max-width:779px){
    #hall-title{font-size:12px;letter-spacing:.1em;}
    #hall-sub{font-size:9px;max-width:80vw;}
    #hall-danmu{top:16%;height:17%;}
    .hall-dm{font-size:12px;padding:2px 10px;}
    .hi-quote{display:none;}
    .hi-title{display:none;}
    .hi-txt{padding:4% 4% 12% 4%;gap:.2em;}
    #hall-legend{font-size:8px;gap:3px;bottom:78px;}
    #hall-legend .row:nth-child(2){display:none;}
    #hall-rocket-wrap{width:92px;bottom:clamp(6px,1vh,14px);}
    .hm-card{padding:18px 18px 14px;}
  }
  `);

  /* ================================================================
   * 二 · 常量与工具
   * ================================================================ */
  const LV_NAME = ["未点亮", "火星", "火苗", "火炬", "烽火台"];
  const lvOf = n => (n >= 1000 ? 4 : n >= 100 ? 3 : n >= 10 ? 2 : n >= 1 ? 1 : 0);
  const fmt = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // 火花图标（一组火焰 / 火炬 / 烽火台造型，靠 CSS 抖动）
  const FLAME_D =
    "M12 1.6c3.7 4.6 5.6 7.6 5.6 10.7a5.6 5.6 0 0 1-11.2 0c0-2 .9-3.7 2.4-5.5" +
    ".35 1.9 1 3 2 3.4-.15-3.4.5-6.1 1.2-8.6z";

  function sparkSVG(lv) {
    const c = "sp sp-lv" + lv;
    if (lv >= 4) {
      return '<svg class="' + c + '" viewBox="0 0 24 24" aria-hidden="true">' +
        '<path class="b" d="M5.2 21.2h13.6l-1.5-6.6H6.7z"/>' +
        '<path class="b" d="M4.2 14.6h15.6v-2H4.2z"/>' +
        '<path class="b" d="M4.8 12.6V9.9h2.3v2.7zM10.85 12.6V9.4h2.3v3.2zM16.9 12.6V9.9h2.3v2.7z"/>' +
        '<path class="f" d="M12 1.4c1.9 2.4 2.9 4 2.9 5.6a2.9 2.9 0 0 1-5.8 0c0-1 .5-1.9 1.2-2.8' +
        '.2.9.5 1.4 1 1.7 0-1.7.2-3.1.7-4.5z"/>' +
        '<circle class="e" cx="6.4" cy="6" r=".8"/><circle class="e" cx="17.8" cy="5.2" r=".7"/>' +
        '<circle class="e" cx="15.2" cy="3.1" r=".55"/></svg>';
    }
    if (lv === 3) {
      return '<svg class="' + c + '" viewBox="0 0 24 24" aria-hidden="true">' +
        '<path class="b" d="M10.9 15.6h2.2l1.2 6.4H9.7z"/>' +
        '<path class="b" d="M8.5 14.7h7v1.8h-7z"/>' +
        '<g transform="translate(12 10.6) scale(.64) translate(-12 -12)">' +
        '<path class="f" d="' + FLAME_D + '"/></g></svg>';
    }
    if (lv === 2) {
      return '<svg class="' + c + '" viewBox="0 0 24 24" aria-hidden="true">' +
        '<path class="f" d="' + FLAME_D + '"/>' +
        '<path class="g" d="M12 8.4c1.6 2 2.4 3.3 2.4 4.6a2.4 2.4 0 0 1-4.8 0c0-.9.4-1.6 1-2.3' +
        '.1.8.4 1.2.8 1.4.1-1.4.3-2.6.6-3.7z"/>' +
        '<circle class="e" cx="5.6" cy="6.2" r=".85"/><circle class="e" cx="18.4" cy="5" r=".7"/>' +
        '<circle class="e" cx="16.2" cy="9.4" r=".5"/></svg>';
    }
    if (lv === 1) {
      return '<svg class="' + c + '" viewBox="0 0 24 24" aria-hidden="true">' +
        '<g transform="translate(12 12.8) scale(.62) translate(-12 -12)">' +
        '<path class="f" d="' + FLAME_D + '"/></g>' +
        '<circle class="e" cx="7.4" cy="6.6" r=".72"/></svg>';
    }
    return '<svg class="' + c + '" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path class="f" d="' + FLAME_D + '"/></svg>';
  }

  function flowerSVG() {
    let p = "";
    for (let k = 0; k < 8; k++) {
      const a = k * 45;
      p += '<ellipse cx="12" cy="6.1" rx="2.7" ry="4.1" transform="rotate(' + a + ' 12 12)"/>';
    }
    return '<svg class="fl-svg" viewBox="0 0 24 24" aria-hidden="true">' +
      '<g class="petals">' + p + '</g><circle class="core" cx="12" cy="12" r="3.2"/></svg>';
  }

  // 稳定伪随机（同一姓名每次得到同一个基数）
  function nameHash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0) % 100000 / 100000;
  }
  // 演示友好：让等级阶梯在首屏就能看到（含两处相邻烽火台可连长墙，也留两处未点亮的灰）
  const BASE_BOOST = { 0: 1286, 1: 1042, 3: 1008, 4: 1032, 12: 402, 13: 118 };
  const BASE_FORCE = { 2: 872, 6: 34, 7: 0, 10: 6, 18: 0, 19: 87 };
  function baseSpark(name, idx) {
    const stable = Math.floor(nameHash(name) * 1200);
    let v = U.store.seed("hallSparkBase_" + name, stable);
    if (typeof v !== "number" || !isFinite(v)) v = stable;
    if (BASE_BOOST[idx] != null) v = Math.max(v, BASE_BOOST[idx]);
    if (BASE_FORCE[idx] != null) v = BASE_FORCE[idx];
    return v;
  }

  // 每日首次点亮
  function dayKey() {
    const t = U.nowNanjing();
    return t.year + "-" + t.month + "-" + t.day;
  }
  function sparkedToday(name) {
    const m = U.store.get("sparkDay_" + dayKey(), {}) || {};
    return !!m[name];
  }
  function markSparked(name) {
    const key = "sparkDay_" + dayKey();
    const m = U.store.get(key, {}) || {};
    m[name] = 1;
    U.store.set(key, m);
  }

  /* ================================================================
   * 三 · 运行状态
   * ================================================================ */
  let L = null, built = false, rootEl = null;
  let els = [], cvAtmo = null, cvFx = null, cvRocket = null;
  let sprWarm = null, sprCool = null, dmLane = 0;
  let hudTxt = null, hudBar = null, hudCache = "";
  const PH = [];                       // 每个信息框的火光相位

  const st = {
    W: 0, H: 0, mobile: false,
    w0: 320, h0: 180, gap: 340, cy: 400, railY: 700,
    cur: 0, vel: 0, snap: null,
    drag: false, moved: 0, downX: 0, downY: 0, downCur: 0, lastT: 0, downTarget: null,
    T: 0, last: 0,
    up: false, focus: -1, tributeIdx: 0, modal: "",
    geo: [], spark: [],
  };

  const BG = { dust: [], embers: [], stars: [], beams: [], flow: [], bridge: [], bokeh: [] };
  const RK = { state: "build", t0: 0, buildMs: 7000, lit: 0, y: 0, p: 0, launchT: 0 };

  /* ================================================================
   * 四 · 构建 DOM
   * ================================================================ */
  function itemHTML(a, i) {
    const tot = baseSpark(a.name, i) + U.store.sparkOf(a.name);
    const lv = lvOf(tot);
    const no = String(i + 1).padStart(2, "0");
    return '<div class="hall-item" data-i="' + i + '" style="--dl:' + (i * .63).toFixed(2) + 's">' +
      '<div class="hi-frame">' +
        '<div class="hi-in">' +
          '<div class="hi-photo" data-n="' + U.esc(a.name.slice(0, 1)) + '">' +
            '<img src="' + encodeURI(a.image) + '" alt="' + U.esc(a.name) + '" draggable="false">' +
          '</div>' +
          '<div class="hi-txt">' +
            '<div class="hi-name">' + U.esc(a.name) + '</div>' +
            '<div class="hi-years">' + U.esc(a.years || "") + '</div>' +
            '<div class="hi-title">' + U.esc(a.title || "") + '</div>' +
            '<div class="hi-quote">「' + U.esc(a.quote || "") + '」</div>' +
          '</div>' +
        '</div>' +
        '<div class="hi-no">' + no + '</div>' +
      '</div>' +
      '<div class="hi-glass"></div>' +
      '<button class="hi-act hi-spark" data-act="spark" data-lv="' + lv + '" title="擦亮火花 · ' +
        LV_NAME[lv] + '">' +
        '<span class="hs-icon">' + sparkSVG(lv) + '</span>' +
        '<span class="hs-num">' + (tot > 0 ? fmt(tot) : "擦亮") + '</span>' +
      '</button>' +
      '<button class="hi-act hi-tribute" data-act="tribute" title="今日景仰 · 发表敬言">' +
        '<span class="hs-icon">' + flowerSVG() + '</span><span>景仰</span>' +
      '</button>' +
    '</div>';
  }

  function build() {
    const page = document.getElementById("page-hall");
    if (!page) return;

    let legend = "";
    for (let lv = 0; lv <= 4; lv++) {
      legend += '<span class="lg">' + sparkSVG(lv) + LV_NAME[lv] +
        (lv > 0 ? '<em style="font-style:normal;opacity:.6">' + [0, 1, 10, 100, 1000][lv] + '</em>' : "") +
        '</span>';
    }

    page.innerHTML =
      '<div id="hall-root">' +
        '<div id="hall-wall"></div>' +
        '<canvas id="hall-atmo"></canvas>' +
        '<div id="hall-stage"><div id="hall-items"></div></div>' +
        '<canvas id="hall-fx"></canvas>' +
        '<div id="hall-vig"></div>' +
        '<div id="hall-danmu"></div>' +
        '<div id="hall-head">' +
          '<h1 id="hall-title">名贤堂<span class="dot">·</span>二十位把江河写进生命的人</h1>' +
          '<p id="hall-sub">长按拖拽横向巡览 · 单击相框让「下一位」走到正中并放大 · ' +
            '<b>每日首次点亮可擦亮火花</b>（灰 → 火星 → 火苗 → 火炬 → 烽火台）</p>' +
        '</div>' +
        '<div id="hall-legend">' +
          '<div class="row"><span class="tag">续火花</span>' + legend + '</div>' +
          '<div class="row"><span class="tag">相邻两座烽火台</span><span>→ 走廊里自动连起一段长城</span></div>' +
          '<div class="row"><span id="hall-tip"></span></div>' +
        '</div>' +
        '<div id="hall-rocket-wrap">' +
          '<canvas id="hall-rocketcv"></canvas>' +
          '<div id="rk-hud"><div id="rk-txt">装配中</div><div id="rk-bar"><i></i></div></div>' +
        '</div>' +
        '<div id="hall-banner"></div>' +
        '<div id="hall-flash"></div>' +
        /* --- 登录 --- */
        '<div id="hall-login" class="hall-modal">' +
          '<div class="hm-card">' +
            '<div class="hm-title">今日景仰 · 登录</div>' +
            '<div class="hm-sub">留下学号与姓名，你的敬言会化作一条弹幕，飘过名贤堂上空的屏幕；' +
              '每发表一条敬言，赠你一朵小红花。</div>' +
            '<label class="hm-field"><span>学号</span>' +
              '<input id="hl-sid" inputmode="numeric" maxlength="12" placeholder="如 2314010101" autocomplete="off"></label>' +
            '<label class="hm-field"><span>姓名</span>' +
              '<input id="hl-name" maxlength="12" placeholder="你的名字" autocomplete="off"></label>' +
            '<div class="hm-err" id="hl-err"></div>' +
            '<div class="hm-btns"><button class="hm-btn" id="hl-cancel">取消</button>' +
              '<button class="hm-btn pri" id="hl-ok">登录并敬言</button></div>' +
          '</div>' +
        '</div>' +
        /* --- 敬言 --- */
        '<div id="hall-tribute" class="hall-modal">' +
          '<div class="hm-card">' +
            '<div class="hm-title">敬言 · <span id="ht-target" style="font-family:var(--f-kai)"></span></div>' +
            '<div class="hm-sub">写下你想对先生说的话，它会以弹幕形式飘过名贤堂。</div>' +
            '<textarea id="ht-text" maxlength="60" placeholder="例：我们会把您的公式继续算下去。"></textarea>' +
            '<div class="hm-chips" id="ht-chips"></div>' +
            '<div class="hm-err" id="ht-err"></div>' +
            '<div class="hm-btns">' +
              '<span class="hm-flower" id="ht-flower"></span>' +
              '<button class="hm-btn" id="ht-close">关闭</button>' +
              '<button class="hm-btn pri" id="ht-send">发送敬言</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    /* --- 背景图（失败降级为暖色渐变） --- */
    const wallEl = document.getElementById("hall-wall");
    U.loadImg(WALL_IMG)
      .then(() => { wallEl.style.backgroundImage = 'url("' + encodeURI(WALL_IMG) + '")'; })
      .catch(() => wallEl.classList.add("fallback"));

    /* --- 信息栏 --- */
    const box = document.getElementById("hall-items");
    let html = "";
    for (let i = 0; i < N; i++) html += itemHTML(AL[i], i);
    box.innerHTML = html;
    els = Array.prototype.slice.call(box.querySelectorAll(".hall-item"));

    /* --- 照片加载失败降级 --- */
    els.forEach(el => {
      const ph = el.querySelector(".hi-photo");
      const img = ph && ph.querySelector("img");
      if (!img) return;
      img.addEventListener("error", () => ph.classList.add("fail"));
      img.addEventListener("load", () => ph.classList.remove("fail"));
      if (img.complete && img.naturalWidth === 0) ph.classList.add("fail");
    });

    /* --- 元素引用 --- */
    rootEl = document.getElementById("hall-root");
    cvAtmo = document.getElementById("hall-atmo");
    cvFx = document.getElementById("hall-fx");
    cvRocket = document.getElementById("hall-rocketcv");
    hudTxt = document.getElementById("rk-txt");
    hudBar = document.querySelector("#rk-bar > i");
    mkSprites();
    for (let i = 0; i < N; i++) { PH.push(U.rand(0, TAU)); st.geo.push({}); }

    built = true;
  }

  /* 预渲染光斑贴图（比逐帧 createRadialGradient 便宜得多） */
  function mkSprites() {
    const S = 96;
    sprWarm = U.mkCanvas(S, S);
    let x = sprWarm.getContext("2d");
    let g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, "rgba(255,232,178,.96)");
    g.addColorStop(.24, "rgba(255,170,92,.44)");
    g.addColorStop(.62, "rgba(226,108,40,.13)");
    g.addColorStop(1, "rgba(170,56,8,0)");
    x.fillStyle = g; x.fillRect(0, 0, S, S);

    sprCool = U.mkCanvas(S, S);
    x = sprCool.getContext("2d");
    g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(.2, "rgba(226,242,255,.85)");
    g.addColorStop(.55, "rgba(150,196,255,.22)");
    g.addColorStop(1, "rgba(110,160,255,0)");
    x.fillStyle = g; x.fillRect(0, 0, S, S);
  }

  function sprite(ctx, img, x, y, size, alpha, squash) {
    if (alpha <= .004) return;
    const a = ctx.globalAlpha;
    ctx.globalAlpha = Math.min(1, alpha);
    ctx.drawImage(img, x - size / 2, y - (size * (squash || 1)) / 2, size, size * (squash || 1));
    ctx.globalAlpha = a;
  }

  /* ================================================================
   * 五 · 布局与运动
   * ================================================================ */
  function layout() {
    st.W = (rootEl && rootEl.clientWidth) || window.innerWidth;
    st.H = (rootEl && rootEl.clientHeight) || window.innerHeight;
    const vw = st.W, vh = st.H;
    const mobile = vw < 780;
    st.mobile = mobile;
    const w0 = mobile ? U.clamp(vw * .5, 148, 300) : U.clamp(vw * .25, 210, 470);
    const h0 = w0 * 9 / 16;
    st.w0 = w0; st.h0 = h0;
    st.gap = w0 * (mobile ? 1.05 : 1.13);
    st.cy = vh * (mobile ? .53 : .55);
    st.railY = st.cy + h0 * .59 + (mobile ? 26 : 46);
    const items = document.getElementById("hall-items");
    if (items) {
      items.style.setProperty("--hw", w0.toFixed(1) + "px");
      items.style.setProperty("--hh", h0.toFixed(1) + "px");
      items.style.setProperty("--cy", st.cy.toFixed(1) + "px");
    }
  }

  // 环形最短距离（-N/2 … N/2）
  function wrapDist(i, cur) {
    let d = (i - cur) % N;
    if (d > N / 2) d -= N;
    if (d < -N / 2) d += N;
    return d;
  }

  function placeItems() {
    const { w0, h0, gap, W, mobile } = st;
    for (let i = 0; i < N; i++) {
      const el = els[i];
      if (!el) continue;
      const d = wrapDist(i, st.cur);
      const ad = Math.abs(d);
      const s = Math.max(.32, 1.18 - .12 * ad);           // 最中间 1.18，两侧递减
      const dx = d * gap;
      const dy = Math.pow(Math.min(ad, 8), 1.55) * (mobile ? 1.35 : 2.7);
      const ry = U.clamp(-d * 4.2, -17, 17);
      const vis = ad <= 7.4;
      el.style.transform = "translate3d(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px,0)" +
        " rotateY(" + ry.toFixed(2) + "deg) scale(" + s.toFixed(3) + ")";
      el.style.opacity = vis ? U.clamp(1 - ad * .118, .12, 1).toFixed(3) : "0";
      el.style.zIndex = String(240 - Math.round(ad * 12));
      el.style.pointerEvents = ad <= 3.2 ? "auto" : "none";
      el.style.visibility = vis ? "visible" : "hidden";

      const g = st.geo[i] || (st.geo[i] = {});
      g.vis = vis && ad <= 6.4;
      g.d = d;
      g.s = s;
      g.cx = W * .5 + dx;
      g.cy = st.cy + dy;
      g.w = w0 * s * Math.cos(ry * Math.PI / 180);
      g.h = h0 * s;
    }
  }

  function slideTo(target, dur) {
    st.vel = 0;
    st.snap = { from: st.cur, to: target, t0: performance.now(), dur: dur || 470 };
  }

  function updateMotion(dt) {
    if (st.drag) return;
    const now = performance.now();
    if (st.snap) {
      const p = U.clamp((now - st.snap.t0) / st.snap.dur, 0, 1);
      st.cur = U.lerp(st.snap.from, st.snap.to, U.easeOut(p));
      if (p >= 1) st.snap = null;
      return;
    }
    if (Math.abs(st.vel) > .0015) {
      st.cur += st.vel;
      st.vel *= Math.pow(.935, dt / 16.7);
      if (Math.abs(st.vel) <= .0015) {
        st.vel = 0;
        const t = Math.round(st.cur);
        if (Math.abs(t - st.cur) > .002) st.snap = { from: st.cur, to: t, t0: now, dur: 420 };
      }
    }
  }

  function onDown(e) {
    if (e.button != null && e.button !== 0) return;
    if (e.target && e.target.closest && e.target.closest(".hall-modal")) return;
    st.drag = true;
    st.moved = 0;
    st.snap = null;
    st.vel = 0;
    st.downX = e.clientX;
    st.downY = e.clientY;
    st.downCur = st.cur;
    st.lastT = performance.now();
    st.downTarget = e.target;
    const stage = document.getElementById("hall-stage");
    if (stage) stage.classList.add("dragging");
  }

  function onMove(e) {
    const dx = e.clientX - st.downX;
    const dy = e.clientY - st.downY;
    const mv = Math.abs(dx) + Math.abs(dy);
    if (mv > st.moved) st.moved = mv;
    const now = performance.now();
    const dt = Math.max(8, now - st.lastT);
    const prev = st.cur;
    st.cur = st.downCur - dx / st.gap;
    const v = (st.cur - prev) * (16 / dt);
    st.vel = st.vel * .6 + v * .4;
    st.lastT = now;
  }

  function onUp() {
    if (!st.drag) return;
    st.drag = false;
    const stage = document.getElementById("hall-stage");
    if (stage) stage.classList.remove("dragging");
    const target = st.downTarget;
    st.downTarget = null;

    if (st.moved < 9) {                        // 视为单击
      st.vel = 0;
      if (target && target.closest && target.closest(".hi-act")) return;  // 按钮各自处理
      const item = target && target.closest ? target.closest(".hall-item") : null;
      if (item) onFrameClick(+item.dataset.i);
      return;
    }
    // 惯性吸附
    const v = U.clamp(st.vel, -2.8, 2.8);
    const proj = st.cur + v * 6.5;
    let goal = Math.round(proj);
    const maxGap = target && target.closest && target.closest(".hall-item") ? 99 : 3;
    goal = U.clamp(goal, Math.round(st.cur) - maxGap, Math.round(st.cur) + maxGap);
    st.vel = 0;
    st.snap = { from: st.cur, to: goal, t0: performance.now(),
      dur: U.clamp(560 - Math.abs(v) * 90, 300, 620) };
  }

  // 单击相框：中间那一个 → 下一位走到正中；侧边那一个 → 被点的那一个走到正中
  function onFrameClick(i) {
    const center = ((Math.round(st.cur) % N) + N) % N;
    const target = i === center ? st.cur + 1 : st.cur + wrapDist(i, st.cur);
    slideTo(target);
    if (st.up) igniteThruster();
  }

  function updateFocusUI() {
    const f = ((Math.round(st.cur) % N) + N) % N;
    if (f === st.focus) return;
    st.focus = f;
    for (let i = 0; i < N; i++) if (els[i]) els[i].classList.toggle("cur", i === f);
    const tip = document.getElementById("hall-tip");
    const a = AL[f];
    if (tip && a) {
      tip.innerHTML = "正在景仰 <b>" + U.esc(a.name) + "</b><span>" + U.esc(a.years || "") +
        "</span> · <span>" + U.esc(a.title || "") + "</span>";
    }
  }

  /* ================================================================
   * 六 · 后景引擎：环境光 / 射灯 / 星空 / 尘埃 / 火星
   * ================================================================ */
  function initParticles() {
    const { W, H, mobile } = st;
    BG.dust.length = 0;
    const nd = mobile ? 44 : 88;
    for (let i = 0; i < nd; i++) {
      BG.dust.push({
        x: U.rand(0, W), y: U.rand(0, H), r: U.rand(.6, 2.1),
        vx: U.rand(-.05, .05), vy: U.rand(-.1, -.012),
        a: U.rand(.14, .5), ph: U.rand(0, TAU),
      });
    }
    BG.embers.length = 0;
    const ne = mobile ? 32 : 62;
    for (let i = 0; i < ne; i++) BG.embers.push(mkEmber(true));

    BG.stars.length = 0;
    const ns = mobile ? 120 : 220;
    const maxR = Math.min(W, H) * 1.1;
    for (let i = 0; i < ns; i++) {
      const r = U.rand(50, maxR);
      BG.stars.push({
        r, a: U.rand(0, TAU), sz: U.rand(.45, 2.1),
        ph: U.rand(0, TAU), sp: U.rand(.000018, .00006) + 300 / r * .00001,
        warm: Math.random() < .3,
      });
    }
    BG.beams = [
      { x: .16, w: .095, ph: 0, sp: .00032, k: 1 },
      { x: .46, w: .13, ph: 2.1, sp: .00021, k: 1.18 },
      { x: .79, w: .1, ph: 4.2, sp: .00027, k: .92 },
    ];
    BG.flow.length = 0;
    for (let i = 0; i < 4; i++) {
      BG.flow.push({ x: U.rand(0, 1), y: U.rand(.25, .85), r: U.rand(.3, .55),
        sp: U.rand(.00002, .00005), ph: U.rand(0, TAU), a: U.rand(.05, .1) });
    }
    // 彩虹桥流光
    BG.bridge.length = 0;
    const nb = mobile ? 20 : 36;
    for (let i = 0; i < nb; i++) {
      BG.bridge.push({ u: Math.random(), sp: U.rand(.00006, .00018), sz: U.rand(.5, 1.5),
        cool: Math.random() < .45, ph: U.rand(0, TAU) });
    }
    // 焦外光斑（填满走廊尽头的空处）
    BG.bokeh.length = 0;
    const nk = mobile ? 4 : 7;
    for (let i = 0; i < nk; i++) {
      BG.bokeh.push({
        x: U.rand(.02, .98), y: U.rand(.66, .97), r: U.rand(.045, .12),
        a: U.rand(.045, .11), ph: U.rand(0, TAU), sp: U.rand(.00002, .00006),
        warm: Math.random() < .8,
      });
    }
  }

  function mkEmber(first) {
    const { W, H } = st;
    return {
      x: U.rand(0, W),
      y: first ? U.rand(H * .25, H) : U.rand(H * .72, H * 1.02),
      vy: U.rand(-.05, -.15), vx: U.rand(-.03, .03),
      life: U.rand(600, 2300), max: 2300,
      r: U.rand(.7, 2.2), a: U.rand(.3, .95), ph: U.rand(0, TAU),
    };
  }

  function drawAtmo(dt) {
    if (!cvAtmo) return;
    const { ctx, w, h } = U.fitCanvas(cvAtmo);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, w, h);
    const T = st.T;

    /* --- 1 暖色环境光（对面在烧火） --- */
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const pulse = .5 + .5 * Math.sin(T * .00068);
    sprite(ctx, sprWarm, w * (.12 + Math.sin(T * .00017) * .02), h * .44, w * .95, .38 + .16 * pulse);
    sprite(ctx, sprWarm, w * (.88 + Math.cos(T * .00023) * .022), h * .56, w * 1.02, .3 + .18 * (1 - pulse));
    sprite(ctx, sprWarm, w * .5, h * 1.06, w * .85, .26 + .08 * Math.sin(T * .0009));
    ctx.restore();

    /* --- 2 缓慢流动的光影 --- */
    for (const f of BG.flow) {
      const x = w * (f.x + Math.sin(T * f.sp + f.ph) * .06);
      const y = h * (f.y + Math.cos(T * f.sp * .8 + f.ph) * .05);
      sprite(ctx, sprWarm, x, y, Math.max(w, h) * f.r, f.a * (.6 + .4 * Math.sin(T * .0006 + f.ph)), .42);
    }

    /* --- 3 顶部射灯锥形光 --- */
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const b of BG.beams) {
      const bx = w * b.x + Math.sin(T * b.sp + b.ph) * w * .014;
      const topY = -h * .05, botY = h * .7;
      const tw = w * .02, bw = w * b.w;
      const k = (.075 + .04 * Math.sin(T * .0009 + b.ph)) * b.k;
      const lg = ctx.createLinearGradient(0, topY, 0, botY);
      lg.addColorStop(0, "rgba(255,238,198," + (k * 1.6).toFixed(3) + ")");
      lg.addColorStop(.4, "rgba(255,212,152," + k.toFixed(3) + ")");
      lg.addColorStop(1, "rgba(255,176,104,0)");
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.moveTo(bx - tw, topY);
      ctx.lineTo(bx + tw, topY);
      ctx.lineTo(bx + bw, botY);
      ctx.lineTo(bx - bw, botY);
      ctx.closePath();
      ctx.fill();
      sprite(ctx, sprWarm, bx, topY + h * .03, w * .05, .35 + .18 * Math.sin(T * .0021 + b.ph));
    }
    ctx.restore();

    /* --- 4 修进形态：上空旋转星空（极坐标差速 + 弧线拖尾） --- */
    if (st.up) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      // 天顶的冷色微光：让"星空"有开口
      sprite(ctx, sprCool, w * .5, h * .05, w * .95, .1 + .035 * Math.sin(T * .0006), .52);
      const cx = w * .5, cy = -h * .07;
      const maxY = h * .62;
      for (const s of BG.stars) {
        s.a += s.sp * dt;
        const x = cx + Math.cos(s.a) * s.r * 1.7;
        const y = cy + Math.sin(s.a) * s.r * .66;
        if (y > maxY || x < -60 || x > w + 60 || y < -40) continue;
        const fade = 1 - U.clamp((y - h * .03) / (maxY - h * .03), 0, 1) * .55;
        const tw = .5 + .5 * Math.sin(T * .0022 + s.ph);
        const alpha = fade * (.4 + .6 * tw) * 1.05;
        // 旋转拖尾
        if (s.sz > 1.05) {
          const ta = s.a - .055;
          const tx = cx + Math.cos(ta) * s.r * 1.7;
          const ty = cy + Math.sin(ta) * s.r * .66;
          ctx.strokeStyle = "rgba(186,218,255," + (alpha * .5).toFixed(3) + ")";
          ctx.lineWidth = Math.max(.6, s.sz * .55);
          ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.stroke();
        }
        const sz = s.sz * 7.5;
        sprite(ctx, s.warm ? sprWarm : sprCool, x, y, sz, alpha);
      }
      // 一条淡淡的银河带
      const bandA = .1 + .04 * Math.sin(T * .0004);
      ctx.save();
      ctx.translate(w * .5, h * .16);
      ctx.rotate(-.22 + Math.sin(T * .00005) * .05);
      for (let i = 0; i < 5; i++) {
        sprite(ctx, sprCool, (i - 2) * w * .3, 0, w * .55, bandA * (1 - Math.abs(i - 2) * .22), .1);
      }
      ctx.restore();
      ctx.restore();
    }

    /* --- 5 漂浮尘埃 --- */
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const d of BG.dust) {
      d.x += d.vx * dt * .06 + Math.sin(T * .0006 + d.ph) * .14;
      d.y += d.vy * dt * .06;
      if (d.y < -10) { d.y = h + 10; d.x = U.rand(0, w); }
      if (d.x < -10) d.x = w + 10;
      if (d.x > w + 10) d.x = -10;
      const a = d.a * (.4 + .6 * Math.sin(T * .0013 + d.ph));
      if (a <= .02) continue;
      ctx.fillStyle = "rgba(255,232,196," + a.toFixed(3) + ")";
      ctx.fillRect(d.x, d.y, d.r, d.r);
    }
    ctx.restore();

    /* --- 6 微弱火光粒子 --- */
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < BG.embers.length; i++) {
      const e = BG.embers[i];
      e.y += e.vy * dt * .06;
      e.x += e.vx * dt * .06 + Math.sin(T * .0018 + e.ph) * .26;
      e.life -= dt;
      if (e.life <= 0) { BG.embers[i] = mkEmber(false); continue; }
      const a = U.clamp(e.life / 1500, 0, 1) * e.a;
      if (a <= .02) continue;
      ctx.fillStyle = "rgba(255," + (150 + Math.round(70 * a)) + ",80," + a.toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    /* --- 7 地面暖光（走廊光池） --- */
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    sprite(ctx, sprWarm, w * .5, st.railY + 30, w * .8, .1 + .03 * Math.sin(T * .0011), .34);
    // 走廊地面反光
    const fg = ctx.createLinearGradient(0, st.railY + 12, 0, h);
    fg.addColorStop(0, "rgba(255,152,72,.11)");
    fg.addColorStop(.45, "rgba(214,106,38,.055)");
    fg.addColorStop(1, "rgba(150,56,16,0)");
    ctx.fillStyle = fg;
    ctx.fillRect(0, st.railY + 12, w, Math.max(0, h - st.railY - 12));
    ctx.restore();

    /* --- 8 焦外光斑 --- */
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const b of BG.bokeh) {
      const x = w * (b.x + Math.sin(T * b.sp + b.ph) * .022);
      const y = h * (b.y + Math.cos(T * b.sp * .9 + b.ph) * .016);
      const r = Math.min(w, h) * b.r * 2;
      sprite(ctx, b.warm ? sprWarm : sprCool, x, y, r,
        b.a * (.62 + .38 * Math.sin(T * .0008 + b.ph)));
    }
    ctx.restore();
  }


  /* ================================================================
   * 七 · 前景引擎：轨道（彩虹桥）/ 长城 / 框面火光
   * ================================================================ */
  function railYAt(x, w) {
    const nx = (x - w * .5) / (w * .5);
    return st.railY - (1 - nx * nx) * (st.mobile ? 5 : 9);
  }

  function traceRail(ctx, w, step) {
    ctx.beginPath();
    const s = step || 16;
    for (let x = -20; x <= w + 20; x += s) {
      const y = railYAt(x, w);
      if (x <= -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
  }

  function drawRail(ctx, w, h) {
    const T = st.T;
    const y = st.railY;

    // 地面光池
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const pg = ctx.createLinearGradient(0, y - 80, 0, y + 96);
    pg.addColorStop(0, "rgba(255,150,60,0)");
    pg.addColorStop(.38, "rgba(255,150,60,.1)");
    pg.addColorStop(.6, "rgba(255,120,40,.055)");
    pg.addColorStop(1, "rgba(255,110,30,0)");
    ctx.fillStyle = pg;
    ctx.fillRect(0, y - 80, w, 178);
    ctx.restore();

    if (!st.up) {
      /* ---- 普通：昏暗的青铜长廊轨道 ---- */
      ctx.save();
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, "rgba(216,178,112,0)");
      g.addColorStop(.16, "rgba(216,178,112,.4)");
      g.addColorStop(.5, "rgba(246,216,160,.72)");
      g.addColorStop(.84, "rgba(216,178,112,.4)");
      g.addColorStop(1, "rgba(216,178,112,0)");
      ctx.strokeStyle = g;
      ctx.lineWidth = st.mobile ? 1.4 : 2;
      traceRail(ctx, w);
      ctx.stroke();
      // 下沿阴影线
      ctx.strokeStyle = "rgba(0,0,0,.55)";
      ctx.lineWidth = st.mobile ? 3 : 5;
      ctx.beginPath();
      for (let x = -20; x <= w + 20; x += 16) {
        const yy = railYAt(x, w) + 4;
        if (x <= -20) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
      // 铜钉
      ctx.fillStyle = "rgba(255,226,168,.5)";
      for (let x = 46; x < w; x += 92) {
        const yy = railYAt(x, w);
        ctx.beginPath(); ctx.arc(x, yy, 1.5, 0, TAU); ctx.fill();
      }
      // 流动高光
      const u = (T * .00008) % 1;
      const hx = u * (w + 420) - 210;
      ctx.globalCompositeOperation = "lighter";
      sprite(ctx, sprWarm, hx, railYAt(hx, w), w * .18, .32, .16);
      ctx.restore();
      return;
    }

    /* ---- 修进形态：阿斯加德彩虹桥 ---- */
    const bh = U.clamp(st.h0 * .075, 8, 22);
    const stops = 20;
    const g = ctx.createLinearGradient(0, 0, w, 0);
    for (let k = 0; k <= stops; k++) {
      const hue = (k / stops * 320 + T * .05) % 360;
      const sat = 72 + 10 * Math.sin(k * .8 + T * .001);
      const lig = 58 + 8 * Math.sin(k * 1.3 - T * .0008);
      g.addColorStop(k / stops, "hsla(" + hue.toFixed(0) + "," + sat.toFixed(0) + "%," + lig.toFixed(0) + "%,.8)");
    }
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    // 外光晕
    ctx.strokeStyle = g;
    ctx.globalAlpha = .16;
    ctx.lineWidth = bh * 3.4;
    traceRail(ctx, w, 12);
    ctx.stroke();
    // 桥面
    ctx.globalAlpha = .9;
    ctx.lineWidth = bh;
    traceRail(ctx, w, 12);
    ctx.stroke();
    // 桥面中脊高光
    ctx.globalAlpha = .36;
    ctx.strokeStyle = "rgba(255,255,255,.95)";
    ctx.lineWidth = Math.max(1, bh * .16);
    ctx.beginPath();
    for (let x = -20; x <= w + 20; x += 12) {
      const yy = railYAt(x, w) - bh * .12;
      if (x <= -20) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    // 沿轨道跑动的流光
    for (const p of BG.bridge) {
      p.u += p.sp * (16.7 / 16);
      if (p.u > 1.06) p.u = -0.06;
      const x = p.u * w;
      const yy = railYAt(x, w) - bh * .1;
      const flick = .55 + .45 * Math.sin(T * .004 + p.ph);
      const sz = bh * (1.1 + p.sz * .9);
      sprite(ctx, p.cool ? sprCool : sprWarm, x, yy, sz, .8 * flick);
      sprite(ctx, p.cool ? sprCool : sprWarm, x - bh * 2.6, yy, sz * .8, .26 * flick, .5);
    }

    // 巡游的亮扫（沿桥面流动的能量）
    const sweep = (T * .00006) % 1.5 - .25;
    const sx = sweep * w;
    sprite(ctx, sprCool, sx, railYAt(sx, w), bh * 9, .45, .5);
    sprite(ctx, sprCool, sx - bh * 3, railYAt(sx, w), bh * 4, .3, .5);

    // 桥面下方的镜像倒影
    ctx.globalAlpha = .16;
    ctx.strokeStyle = g;
    ctx.lineWidth = bh * .85;
    ctx.beginPath();
    for (let x = -20; x <= w + 20; x += 12) {
      const yy = railYAt(x, w) + bh * 1.2;
      if (x <= -20) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
    }
    ctx.stroke();
    ctx.restore();

    // 两侧桥头光
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    sprite(ctx, sprCool, w * .02, railYAt(w * .02, w), bh * 7, .3);
    sprite(ctx, sprCool, w * .98, railYAt(w * .98, w), bh * 7, .3);
    ctx.restore();
  }

  /* ---------------- 长城：相邻两座烽火台 → 墙 ---------------- */
  function wallPairs() {
    const out = [];
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N;
      if (st.spark[i] >= 1000 && st.spark[j] >= 1000) out.push([i, j]);
    }
    return out;
  }

  function quadY(y0, yc, y1, t) {
    const it = 1 - t;
    return it * it * y0 + 2 * it * t * yc + t * t * y1;
  }

  function drawWall(ctx, w, h) {
    const pairs = wallPairs();
    if (!pairs.length) return;
    const T = st.T;

    for (const pr of pairs) {
      const A = st.geo[pr[0]], B = st.geo[pr[1]];
      if (!A || !B || !A.vis || !B.vis) continue;
      if (Math.abs(B.d - A.d) > 3.2) continue;          // 屏幕上并不相邻（跨环缝）
      if (Math.abs(B.cx - A.cx) < 50) continue;

      const pad = st.mobile ? 10 : 16;
      const yA = A.cy + A.h * .5 + pad;
      const yB = B.cy + B.h * .5 + pad;
      const leftFirst = B.cx > A.cx;
      const xa = leftFirst ? A.cx : B.cx;
      const ya = leftFirst ? yA : yB;
      const xb = leftFirst ? B.cx : A.cx;
      const yb = leftFirst ? yB : yA;
      const hgt = U.clamp(Math.min(A.h, B.h) * .17, 13, 34);
      const yc = (ya + yb) / 2 - hgt * .12;

      function wallPath(c) {
        c.beginPath();
        c.moveTo(xa, ya);
        c.quadraticCurveTo((xa + xb) / 2, yc, xb, yb);
        c.lineTo(xb, yb + hgt);
        c.quadraticCurveTo((xa + xb) / 2, (ya + yb) / 2 + hgt * 1.02, xa, ya + hgt);
        c.closePath();
      }

      // 墙体（砖石渐变 + 顶部受火光照亮）
      ctx.save();
      const wg = ctx.createLinearGradient(0, Math.min(ya, yb) - hgt, 0, Math.max(ya, yb) + hgt);
      wg.addColorStop(0, "rgba(78,58,40,.96)");
      wg.addColorStop(.35, "rgba(46,32,22,.97)");
      wg.addColorStop(1, "rgba(16,11,8,.98)");
      wallPath(ctx);
      ctx.fillStyle = wg;
      ctx.fill();
      // 砖纹
      ctx.save();
      wallPath(ctx);
      ctx.clip();
      ctx.strokeStyle = "rgba(196,158,110,.26)";
      ctx.lineWidth = 1;
      const rowH = Math.max(4, hgt / 3.2);
      let row = 0;
      for (let yy = Math.min(ya, yb) - rowH; yy < Math.max(ya, yb) + hgt * 1.8; yy += rowH) {
        ctx.beginPath(); ctx.moveTo(xa - 6, yy); ctx.lineTo(xb + 6, yy); ctx.stroke();
        const off = (row % 2) ? rowH * 1.1 : 0;
        for (let xx = xa + off; xx < xb + 6; xx += rowH * 2.3) {
          ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx, yy + rowH); ctx.stroke();
        }
        row++;
      }
      // 火光在墙面上的投影
      ctx.globalCompositeOperation = "lighter";
      sprite(ctx, sprWarm, (xa + xb) / 2, (ya + yb) / 2 + hgt * .2, (xb - xa) * 1.1, .1, .5);
      ctx.restore();
      ctx.restore();

      // 金色描边
      const gg = ctx.createLinearGradient(xa, 0, xb, 0);
      gg.addColorStop(0, "rgba(255,214,138,.9)");
      gg.addColorStop(.5, "rgba(214,160,74,.85)");
      gg.addColorStop(1, "rgba(255,214,138,.9)");
      ctx.strokeStyle = gg;
      ctx.lineWidth = st.mobile ? 1.1 : 1.6;
      ctx.shadowColor = "rgba(255,176,80,.85)";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(xa, ya);
      ctx.quadraticCurveTo((xa + xb) / 2, yc, xb, yb);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 城垛
      const segs = U.clamp(Math.round((xb - xa) / 70), 3, 9);
      for (let k = 0; k <= segs; k++) {
        const t = .1 + (k / segs) * .8;
        const px = xa + (xb - xa) * t;
        const py = quadY(ya, yc, yb, t);
        const bw2 = Math.max(4, (xb - xa) / 30);
        const bhh = hgt * .55;
        ctx.fillStyle = "rgba(24,16,11,.96)";
        ctx.fillRect(px - bw2 / 2, py - bhh, bw2, bhh);
        ctx.strokeStyle = "rgba(255,206,128,.62)";
        ctx.lineWidth = 1;
        ctx.strokeRect(px - bw2 / 2, py - bhh, bw2, bhh);
      }

      // 两端墩台：把相框与城墙接成一体
      for (let pi = 0; pi < 2; pi++) {
        const ex = pi ? xb : xa;
        const ey = pi ? yb : ya;
        const pwT = Math.max(7, hgt * .6);
        const pwB = pwT * 1.4;
        ctx.beginPath();
        ctx.moveTo(ex - pwT / 2, ey - pad * .9);
        ctx.lineTo(ex + pwT / 2, ey - pad * .9);
        ctx.lineTo(ex + pwB / 2, ey + hgt * .95);
        ctx.lineTo(ex - pwB / 2, ey + hgt * .95);
        ctx.closePath();
        ctx.fillStyle = "rgba(40,28,19,.97)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,206,128,.55)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 连接处火光
      ctx.globalCompositeOperation = "lighter";
      const joints = [[xa, ya], [(xa + xb) / 2, quadY(ya, yc, yb, .5)], [xb, yb]];
      for (let ji = 0; ji < joints.length; ji++) {
        const jx = joints[ji][0], jy = joints[ji][1];
        const fl = .6 + .4 * Math.sin(T * .007 + ji * 2.1);
        sprite(ctx, sprWarm, jx, jy - hgt * .4, hgt * 3.4, .42 * fl, .9);
        for (let s = 0; s < 5; s++) {
          const ph = ((T * .00042 + s * .21 + ji * .13) % 1);
          const sx = jx + Math.sin(s * 2.4 + T * .002) * hgt * .5;
          const sy = jy - hgt * .35 - ph * hgt * 2.6;
          ctx.fillStyle = "rgba(255," + (176 - ph * 70 | 0) + ",80," + ((1 - ph) * .85).toFixed(3) + ")";
          ctx.fillRect(sx, sy, 1.6, 1.6);
        }
      }
      ctx.restore();
    }
  }

  /* ---------------- 框面火光 ---------------- */
  function flick(i) {
    const p = PH[i] || 0;
    const T = st.T;
    return U.clamp(.5 + .26 * Math.sin(T * .0061 + p) + .17 * Math.sin(T * .0137 + p * 2.3) +
      .12 * Math.sin(T * .0031 + p * .7), 0, 1);
  }

  function perim(x, y, w, h, u) {
    u = ((u % 1) + 1) % 1;
    const Lp = 2 * (w + h);
    let d = u * Lp;
    if (d < w) return [x + d, y];
    d -= w;
    if (d < h) return [x + w, y + d];
    d -= h;
    if (d < w) return [x + w - d, y + h];
    d -= w;
    return [x, y + h - d];
  }

  function drawFrameFire(ctx, w, h) {
    const T = st.T;
    // 整体时间抖动：整屏火光强弱随机起伏
    const gfl = .55 + .3 * Math.sin(T * .0009) + .22 * (U.noise2(T * .00035, 5.3) - .5) * 2;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < N; i++) {
      const a = st.geo[i];
      if (!a || !a.vis || Math.abs(a.d) > 6.4) continue;
      const fl = flick(i) * (.6 + .55 * gfl);
      const s = a.s;
      const x0 = a.cx - a.w / 2, y0 = a.cy - a.h / 2;

      // 1) 相框表面的暖色反光（对面火烧过来）
      ctx.globalAlpha = .1 + .17 * U.clamp(fl, 0, 1);
      const gw = a.w * 1.7, gh = a.h * 1.55;
      ctx.drawImage(sprWarm, a.cx - gw / 2, a.cy - gh * .3, gw, gh);

      // 2) 边缘跳动高光：亮点沿四边缓慢游走
      const u = (T * .00007 * (1 + i % 3 * .16) + i * .137) % 1;
      const segN = 6;
      ctx.globalAlpha = 1;
      const eg = ctx.createLinearGradient(x0, y0, x0 + a.w, y0 + a.h);
      eg.addColorStop(0, "rgba(255,214,150," + (.22 + .5 * U.clamp(fl, 0, 1)).toFixed(3) + ")");
      eg.addColorStop(.5, "rgba(255,176,88," + (.12 + .3 * U.clamp(fl, 0, 1)).toFixed(3) + ")");
      eg.addColorStop(1, "rgba(255,140,56," + (.06 + .2 * U.clamp(fl, 0, 1)).toFixed(3) + ")");
      ctx.strokeStyle = eg;
      ctx.lineWidth = Math.max(1, 1.5 * s);
      ctx.beginPath();
      for (let q = 0; q <= segN; q++) {
        const pt = perim(x0, y0, a.w, a.h, u + .12 * (q / segN));
        if (q) ctx.lineTo(pt[0], pt[1]); else ctx.moveTo(pt[0], pt[1]);
      }
      ctx.stroke();

      // 3) 底部火光：柔和的向上光晕（没有硬边）+ 沿下沿跳动的火星
      const pool = U.clamp(fl, 0, 1.2);
      ctx.globalAlpha = .12 + .15 * pool;
      ctx.drawImage(sprWarm, x0 - a.w * .16, y0 + a.h * .5, a.w * 1.32, a.h * .66);
      const lh = a.h * (.2 + .18 * Math.abs(Math.sin(T * .0047 + i * 1.7))) * (.6 + pool * .7);
      const vg = ctx.createLinearGradient(0, y0 + a.h, 0, y0 + a.h - lh);
      vg.addColorStop(0, "rgba(255,226,168," + (.2 + .17 * pool).toFixed(3) + ")");
      vg.addColorStop(.45, "rgba(255,158,70," + (.09 + .09 * pool).toFixed(3) + ")");
      vg.addColorStop(1, "rgba(255,116,32,0)");
      ctx.fillStyle = vg;
      ctx.fillRect(x0 + a.w * .02, y0 + a.h - lh, a.w * .96, lh);
      // 下沿跳动的火星
      for (let k = 0; k < 6; k++) {
        const ph2 = (T * .0011 + i * .37 + k * .19) % 1;
        const bx = x0 + a.w * (.07 + k * .155) + Math.sin(T * .004 + k) * 3;
        const by = y0 + a.h - Math.abs(Math.sin(ph2 * Math.PI)) * a.h * .055;
        const aa = (1 - ph2) * (.4 + .55 * pool);
        if (aa <= .03) continue;
        ctx.fillStyle = "rgba(255,216,152," + aa.toFixed(3) + ")";
        ctx.fillRect(bx, by, 1.6, 1.6);
      }

      // 4) 飘起的小火星
      for (let k = 0; k < 3; k++) {
        const ph = ((T * .0005 * (1 + k * .18) + i * .27 + k * .33) % 1);
        const sx = x0 + a.w * (.18 + k * .3) + Math.sin(T * .003 + k * 2) * a.w * .06;
        const sy = y0 + a.h - ph * a.h * .95;
        const alpha = (1 - ph) * .75 * U.clamp(fl, 0, 1);
        if (alpha <= .02) continue;
        ctx.fillStyle = "rgba(255," + ((190 - ph * 80) | 0) + ",96," + alpha.toFixed(3) + ")";
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function drawFx(dt) {
    if (!cvFx) return;
    const { ctx, w, h } = U.fitCanvas(cvFx);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, w, h);
    drawRail(ctx, w, h);
    drawWall(ctx, w, h);
    drawFrameFire(ctx, w, h);
  }

  /* ================================================================
   * 八 · 火箭（仅修进形态）：装配 7 秒 → 4 支喷射器 → 升空
   * ================================================================ */
  const RK_PARTS = [
    { from: [-46, 26], path(c) {
        c.beginPath();
        c.moveTo(-21, -48); c.lineTo(-22, -132); c.lineTo(22, -132); c.lineTo(23, -48); c.closePath();
      } },
    { from: [40, -44], path(c) {
        c.beginPath(); c.moveTo(0, -180); c.lineTo(21, -132); c.lineTo(-21, -132); c.closePath();
      } },
    { from: [-74, 8], path(c) {
        c.beginPath(); c.moveTo(-21, -78); c.lineTo(-44, -36); c.lineTo(-22, -46); c.closePath();
      } },
    { from: [74, 8], path(c) {
        c.beginPath(); c.moveTo(21, -78); c.lineTo(44, -36); c.lineTo(22, -46); c.closePath();
      } },
    { from: [0, 70], path(c) {
        c.beginPath();
        [-30, -10, 10, 30].forEach(px => {
          c.moveTo(px - 7, -48); c.lineTo(px + 7, -48);
          c.lineTo(px + 10, -16); c.lineTo(px - 10, -16); c.closePath();
        });
      } },
    { from: [0, -70], path(c) { c.beginPath(); c.arc(0, -104, 7.5, 0, TAU); } },
  ];
  const RK_X = [-30, -10, 10, 30];

  function setHud(mode) {
    if (!hudTxt || !hudBar) return;
    const total = U.store.rockets();
    if (mode === "build") {
      hudTxt.innerHTML = "火箭装配中 <b>0s</b>";
      hudBar.style.display = "";
      hudCache = "build";
    } else if (mode === "ready") {
      hudTxt.innerHTML = "点击信息栏点燃喷射器 <b class='lit'>" + RK.lit + "/4</b>" +
        "<br><span style='opacity:.6'>已升空 " + total + " 枚 · 第 " + (total * 4) + " 簇火</span>";
      hudBar.style.display = "none";
      hudCache = "ready";
    } else {
      hudTxt.innerHTML = "升空！第 <b class='lit'>" + (total * 4) + "</b> 簇火 · 第 <b>" + total + "</b> 枚火箭";
      hudBar.style.display = "none";
      hudCache = "launch";
    }
  }

  function startBuild() {
    RK.state = "build";
    RK.t0 = performance.now();
    RK.p = 0;
    RK.lit = 0;
    RK.y = 0;
    setHud("build");
  }

  let lastBuildToast = 0;
  function igniteThruster() {
    if (RK.state === "build") {
      const now = performance.now();
      if (now - lastBuildToast > 2400) {
        lastBuildToast = now;
        App.toast("火箭仍在装配 · 还需 " + (RK.buildMs * (1 - RK.p) / 1000).toFixed(1) + " 秒");
      }
      return;
    }
    if (RK.state !== "ready") return;
    RK.lit = Math.min(4, RK.lit + 1);
    if (RK.lit >= 4) {
      RK.state = "launch";
      RK.launchT = performance.now();
      RK.y = 0;
      const cnt = U.store.addRocket();
      setHud("launch");
      showLaunchBanner(cnt);
    } else {
      setHud("ready");
    }
  }

  function showLaunchBanner(cnt) {
    const b = document.getElementById("hall-banner");
    if (!b) return;
    b.innerHTML = "<div>为河海的梦点起的第 <b>" + (cnt * 4) + "</b> 簇火</div>" +
      "<div>为我们的天空翱翔的第 <b>" + cnt + "</b> 枚火箭</div>";
    b.classList.remove("on");
    void b.offsetWidth;
    b.classList.add("on");
  }

  function updateRocket(dt) {
    if (!cvRocket || !st.up) return;
    const now = performance.now();
    if (RK.state === "build") {
      RK.p = U.clamp((now - RK.t0) / RK.buildMs, 0, 1);
      const left = (RK.buildMs * (1 - RK.p) / 1000).toFixed(1);
      const key = "b" + left;
      if (key !== hudCache && hudTxt) {
        hudTxt.innerHTML = "火箭装配中 <b>" + left + "s</b>";
        hudCache = key;
      }
      if (hudBar) hudBar.style.width = (RK.p * 100).toFixed(1) + "%";
      if (RK.p >= 1) { RK.state = "ready"; setHud("ready"); }
    } else if (RK.state === "launch") {
      const t = (now - RK.launchT) / 1000;
      RK.y = -(620 * t * t + 300 * t);
      if (RK.y < -900) startBuild();
    }
    drawRocket(now);
  }

  function drawRocket(now) {
    const { ctx, w, h } = U.fitCanvas(cvRocket);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, w, h);
    if (w < 6 || h < 6) return;
    const T = st.T;
    const scale = Math.min(w / 128, h / 232);

    ctx.save();
    ctx.translate(w * .5, h - 30 * scale + RK.y);
    ctx.scale(scale, scale);

    /* 发射台 / 装配台 */
    if (RK.state !== "launch") {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      sprite(ctx, sprWarm, 0, -4, 150, .18 + .06 * Math.sin(T * .0021), .3);
      ctx.restore();
      ctx.strokeStyle = "rgba(216,178,112,.3)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-46, 0); ctx.lineTo(46, 0);
      ctx.moveTo(-34, 0); ctx.lineTo(-40, 10);
      ctx.moveTo(34, 0); ctx.lineTo(40, 10);
      ctx.stroke();
    }

    if (RK.state === "build") drawRocketBuild(ctx, RK.p);
    else drawRocketBody(ctx);

    /* 升空尾焰与烟迹 */
    if (RK.state === "launch") {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const fl = .8 + .2 * Math.sin(T * .03);
      for (let k = 0; k < 4; k++) {
        sprite(ctx, sprWarm, (k - 1.5) * 19, 10 + 40 * fl, 66, .5, 2.6);
      }
      sprite(ctx, sprCool, 0, 24, 34, .4, 3.2);
      // 烟圈
      const t = (now - RK.launchT) / 1000;
      for (let k = 0; k < 5; k++) {
        const rr = 18 + k * 16 + t * 34;
        ctx.globalAlpha = U.clamp(.3 - t * .09, 0, .3);
        sprite(ctx, sprWarm, Math.sin(k * 2.1) * 10, 20 + rr * .6, rr * 1.6, .3, 1.6);
      }
      ctx.restore();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawRocketBuild(ctx, p) {
    const n = RK_PARTS.length;
    for (let k = 0; k < n; k++) {
      const part = RK_PARTS[k];
      const q = U.clamp((p - k * .115) / .24, 0, 1);
      if (q <= 0) continue;
      const e = U.easeOutBack(q);
      ctx.save();
      ctx.translate(part.from[0] * (1 - e), part.from[1] * (1 - e));
      // 线框
      part.path(ctx);
      ctx.setLineDash(q < .97 ? [5, 4] : []);
      ctx.strokeStyle = "rgba(150,220,255," + (.8 * (1 - q * .5)).toFixed(3) + ")";
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.setLineDash([]);
      // 成型填充
      const f = U.clamp((q - .48) / .52, 0, 1);
      if (f > 0) {
        part.path(ctx);
        const fa = f * .78;
        const mg = ctx.createLinearGradient(-26, 0, 26, 0);
        mg.addColorStop(0, "rgba(62,70,82," + fa.toFixed(3) + ")");
        mg.addColorStop(.4, "rgba(176,186,200," + fa.toFixed(3) + ")");
        mg.addColorStop(.68, "rgba(118,128,142," + fa.toFixed(3) + ")");
        mg.addColorStop(1, "rgba(46,52,62," + fa.toFixed(3) + ")");
        ctx.fillStyle = mg;
        ctx.fill();
      }
      ctx.restore();
    }
    // 扫描线
    const sp = (st.T * .00022) % 1;
    const sy = -180 + sp * 176;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const sg = ctx.createLinearGradient(0, sy - 14, 0, sy + 14);
    sg.addColorStop(0, "rgba(120,210,255,0)");
    sg.addColorStop(.5, "rgba(180,236,255,.42)");
    sg.addColorStop(1, "rgba(120,210,255,0)");
    ctx.fillStyle = sg;
    ctx.fillRect(-52, sy - 14, 104, 28);
    ctx.restore();
    // 进度环
    ctx.save();
    ctx.strokeStyle = "rgba(255,196,110,.22)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, -200, 12, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,214,130,.92)";
    ctx.shadowColor = "rgba(255,170,70,.9)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, -200, 12, -Math.PI / 2, -Math.PI / 2 + TAU * p);
    ctx.stroke();
    ctx.restore();
  }

  function drawRocketBody(ctx) {
    const T = st.T;
    // 已点燃的喷射器尾焰（先画，压在机体后面）
    for (let k = 0; k < RK.lit; k++) {
      const px = RK_X[k];
      const boost = RK.state === "launch" ? 2.6 : 1;
      const f = .78 + .26 * Math.sin(T * .02 + k * 1.7) + .12 * Math.sin(T * .047 + k);
      const len = (20 + 12 * f) * boost;
      const fg = ctx.createLinearGradient(0, -16, 0, -16 + len);
      fg.addColorStop(0, "rgba(255,252,232,.98)");
      fg.addColorStop(.3, "rgba(255,208,112,.9)");
      fg.addColorStop(.66, "rgba(255,122,40,.5)");
      fg.addColorStop(1, "rgba(220,60,10,0)");
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(px - 9, -16);
      ctx.quadraticCurveTo(px - 5, -16 + len * .62, px, -16 + len);
      ctx.quadraticCurveTo(px + 5, -16 + len * .62, px + 9, -16);
      ctx.closePath();
      ctx.fill();
      sprite(ctx, sprWarm, px, -14, 30 + len, .5);
      ctx.restore();
    }
    // 机体
    const mg = ctx.createLinearGradient(-26, 0, 26, 0);
    mg.addColorStop(0, "#434b58");
    mg.addColorStop(.18, "#aeb8c6");
    mg.addColorStop(.42, "#eef2f7");
    mg.addColorStop(.62, "#b6c0ce");
    mg.addColorStop(.85, "#6b7480");
    mg.addColorStop(1, "#2c323c");
    ctx.save();
    ctx.strokeStyle = "rgba(255,236,200,.5)";
    ctx.lineWidth = 1;
    // 箭体
    ctx.beginPath();
    ctx.moveTo(-21, -48); ctx.lineTo(-22, -132); ctx.lineTo(22, -132); ctx.lineTo(23, -48); ctx.closePath();
    ctx.fillStyle = mg; ctx.fill(); ctx.stroke();
    // 红色条纹
    ctx.fillStyle = "rgba(198,52,38,.92)";
    ctx.fillRect(-21.5, -96, 44, 9);
    ctx.fillRect(-21, -60, 44, 6);
    // 箭头
    ctx.beginPath();
    ctx.moveTo(0, -180); ctx.lineTo(21, -132); ctx.lineTo(-21, -132); ctx.closePath();
    const ng = ctx.createLinearGradient(-21, -180, 21, -132);
    ng.addColorStop(0, "#d8dee8");
    ng.addColorStop(.5, "#f6f8fb");
    ng.addColorStop(1, "#8d97a4");
    ctx.fillStyle = ng; ctx.fill(); ctx.stroke();
    // 尾翼
    ctx.fillStyle = "rgba(206,60,44,.95)";
    ctx.beginPath(); ctx.moveTo(-21, -78); ctx.lineTo(-44, -36); ctx.lineTo(-22, -46); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(21, -78); ctx.lineTo(44, -36); ctx.lineTo(22, -46); ctx.closePath(); ctx.fill(); ctx.stroke();
    // 四支喷射器
    for (let k = 0; k < 4; k++) {
      const px = RK_X[k];
      ctx.beginPath();
      ctx.moveTo(px - 7, -48); ctx.lineTo(px + 7, -48);
      ctx.lineTo(px + 10, -16); ctx.lineTo(px - 10, -16); ctx.closePath();
      const bg = ctx.createLinearGradient(px - 10, 0, px + 10, 0);
      const lit = k < RK.lit;
      bg.addColorStop(0, "#3d434f");
      bg.addColorStop(.45, lit ? "#ffd9a0" : "#9aa4b2");
      bg.addColorStop(1, "#2a2f39");
      ctx.fillStyle = bg; ctx.fill(); ctx.stroke();
      if (lit) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        sprite(ctx, sprWarm, px, -18, 26, .8);
        ctx.restore();
      }
    }
    // 舷窗
    ctx.beginPath(); ctx.arc(0, -104, 7.5, 0, TAU);
    const pg = ctx.createRadialGradient(-2, -107, 0, 0, -104, 8);
    pg.addColorStop(0, "#cfe9ff");
    pg.addColorStop(.55, "#5aa8e8");
    pg.addColorStop(1, "#123a66");
    ctx.fillStyle = pg; ctx.fill();
    ctx.strokeStyle = "rgba(255,240,210,.7)"; ctx.stroke();
    ctx.restore();
    // 整体微光
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    sprite(ctx, sprWarm, 0, -100, 150, .08 + .03 * Math.sin(T * .0015));
    ctx.restore();
  }

  /* ================================================================
   * 九 · 续火花
   * ================================================================ */
  function refreshSparkUI(i) {
    const el = els[i];
    if (!el) return;
    const btn = el.querySelector(".hi-spark");
    if (!btn) return;
    const tot = st.spark[i];
    const lv = lvOf(tot);
    btn.dataset.lv = String(lv);
    const icon = btn.querySelector(".hs-icon");
    if (icon) icon.innerHTML = sparkSVG(lv);
    const num = btn.querySelector(".hs-num");
    if (num) num.textContent = tot > 0 ? fmt(tot) : "擦亮";
    btn.title = "擦亮火花 · " + LV_NAME[lv] + "（" + fmt(tot) + " 次）· 每日首次点亮可擦亮";
  }

  function popSpark(i, text) {
    const el = els[i];
    if (!el) return;
    const p = U.el("span", "hs-pop", U.esc(text));
    el.appendChild(p);
    // 定时器挂在生命周期上，离开页面即被清理
    const kill = () => { if (p.parentNode) p.parentNode.removeChild(p); };
    if (L && !L.dead) L.timeout(kill, 1450); else setTimeout(kill, 1450);
  }

  function doSpark(i) {
    const a = AL[i];
    if (!a) return;
    if (sparkedToday(a.name)) {
      popSpark(i, "今日已擦亮");
      App.toast("今日已为" + a.name + "先生擦亮过火花，明日再来。");
      return;
    }
    markSparked(a.name);
    U.store.addSpark(a.name);
    const before = st.spark[i];
    st.spark[i] = baseSpark(a.name, i) + U.store.sparkOf(a.name);
    const lv = lvOf(st.spark[i]);
    refreshSparkUI(i);
    popSpark(i, "+1 · " + LV_NAME[lv]);
    App.toast("火花已擦亮 · 第 " + fmt(st.spark[i]) + " 次 · " + LV_NAME[lv]);

    // 点亮到烽火台：检查相邻是否连成长城
    if (before < 1000 && st.spark[i] >= 1000) {
      const j1 = (i + 1) % N, j0 = (i - 1 + N) % N;
      if (st.spark[j1] >= 1000 || st.spark[j0] >= 1000) {
        if (L) L.timeout(() => App.toast("两座烽火台相邻 · 走廊里连起一段长城"), 1600);
      }
    }
  }

  /* ================================================================
   * 十 · 今日景仰：登录 / 敬言 / 弹幕 / 小红花
   * ================================================================ */
  function openModal(id) {
    closeModals();
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.add("on");
    st.modal = id;
    const f = m.querySelector("input,textarea");
    if (f) {
      const focus = () => { try { f.focus(); } catch (e) {} };
      if (L && !L.dead) L.timeout(focus, 60); else setTimeout(focus, 60);
    }
  }

  function closeModals() {
    document.querySelectorAll("#page-hall .hall-modal.on").forEach(m => m.classList.remove("on"));
    st.modal = "";
  }

  function openTribute(i) {
    st.tributeIdx = i;
    const u = U.store.user();
    if (u && u.name) openComposer(i, u);
    else openLogin(i);
  }

  function openLogin(i) {
    const err = document.getElementById("hl-err");
    if (err) err.textContent = "";
    const sid = document.getElementById("hl-sid");
    const nm = document.getElementById("hl-name");
    const u = U.store.user();
    if (sid && u && u.sid) sid.value = u.sid;
    if (nm && u && u.name) nm.value = u.name;
    openModal("hall-login");
    st.tributeIdx = i;
  }

  function openComposer(i, user) {
    const tgt = document.getElementById("ht-target");
    const a = AL[i];
    if (tgt) tgt.textContent = a ? a.name : "";
    const chips = document.getElementById("ht-chips");
    if (chips && !chips.childElementCount) {
      const pool = (D.TRIBUTE_PRESETS || []).slice();
      for (let k = 0; k < 4 && pool.length; k++) {
        const t = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
        const b = U.el("button", "hm-chip", U.esc(t.length > 14 ? t.slice(0, 14) + "…" : t));
        b.type = "button";
        b.dataset.full = t;
        chips.appendChild(b);
      }
    }
    const fl = document.getElementById("ht-flower");
    if (fl && user) {
      const n = U.store.get("flower_" + user.sid, 0) || 0;
      fl.innerHTML = flowerSVG() + " 你的小红花 " + fmt(n) + " 朵";
    }
    const err = document.getElementById("ht-err");
    if (err) err.textContent = "";
    const ta = document.getElementById("ht-text");
    if (ta) ta.value = "";
    openModal("hall-tribute");
  }

  function submitLogin() {
    const sidEl = document.getElementById("hl-sid");
    const nmEl = document.getElementById("hl-name");
    const err = document.getElementById("hl-err");
    const sid = (sidEl && sidEl.value || "").trim();
    const nm = (nmEl && nmEl.value || "").trim();
    if (!/^\d{4,}$/.test(sid)) {
      if (err) err.textContent = "学号需为 4 位以上的数字。";
      return;
    }
    if (nm.length < 1) {
      if (err) err.textContent = "请填写姓名。";
      return;
    }
    U.store.setUser({ sid: sid, name: nm, at: Date.now() });
    App.toast("欢迎，@" + nm + " · 请写下你的敬言");
    openComposer(st.tributeIdx, U.store.user());
  }

  function submitTribute() {
    const ta = document.getElementById("ht-text");
    const err = document.getElementById("ht-err");
    const txt = (ta && ta.value || "").trim();
    if (txt.length < 2) {
      if (err) err.textContent = "至少写两个字吧。";
      return;
    }
    const u = U.store.user();
    if (!u || !u.name) { openLogin(st.tributeIdx); return; }
    const a = AL[st.tributeIdx] || null;
    const flowers = U.store.inc("flower_" + u.sid);
    U.store.addTribute({
      name: u.name, sid: u.sid, text: txt,
      alumnus: a ? a.name : "", t: Date.now(), flower: flowers,
    });
    closeModals();
    spawnDanmu({ name: u.name, text: txt, flower: flowers, mine: true });
    App.toast("敬言已记入名贤堂 · 赠你一朵小红花（共 " + flowers + " 朵）");
  }

  let dmCount = 0;
  function spawnDanmu(d) {
    const box = document.getElementById("hall-danmu");
    if (!box) return;
    const lanes = st.mobile ? 3 : 5;
    // 控制同屏数量
    while (box.childElementCount > lanes * 3) box.removeChild(box.firstChild);
    const el = U.el("div", "hall-dm" + (d.mine ? " mine" : ""));
    let html = '<i class="dm-name">' + U.esc(d.name);
    if (d.flower > 0) html += '<i class="dm-fl">' + flowerSVG() + "</i>";
    html += "</i><span>" + U.esc(d.text) + "</span>";
    el.innerHTML = html;
    const boxH = box.clientHeight || 160;
    const laneH = boxH / lanes;
    el.style.top = (dmCount++ % lanes) * laneH + laneH * .14 + "px";
    el.style.animationDuration = U.rand(15, 22).toFixed(1) + "s";
    box.appendChild(el);
    // 动画结束的清理交给 #hall-danmu 上的委托监听（见 bindEvents），避免逐条挂监听
  }

  function nextDanmu() {
    const hist = U.store.tributes() || [];
    if (hist.length && Math.random() < .44) {
      const t = hist[Math.floor(Math.random() * hist.length)];
      return { name: t.name || "河海学子", text: t.text || "", flower: t.flower || 0, mine: false };
    }
    const pool = D.TRIBUTE_PRESETS || ["先生之风，山高水长。"];
    return { name: "河海学子", text: U.pick(pool), flower: 0, mine: false };
  }

  function startDanmaku() {
    const box = document.getElementById("hall-danmu");
    if (box) box.innerHTML = "";
    const first = st.mobile ? 2 : 4;
    for (let k = 0; k < first; k++) L.timeout(() => spawnDanmu(nextDanmu()), 420 + k * 900);
    L.interval(() => { if (!document.hidden) spawnDanmu(nextDanmu()); }, 2500);
  }

  /* ================================================================
   * 十一 · 事件绑定
   * ================================================================ */
  function bindEvents() {
    const stage = document.getElementById("hall-stage");
    if (!stage) return;

    L.on(stage, "pointerdown", onDown);
    L.on(window, "pointermove", onMove);
    L.on(window, "pointerup", onUp);
    L.on(window, "pointercancel", onUp);

    // 按钮：火花 / 景仰
    L.on(stage, "click", (e) => {
      const b = e.target && e.target.closest ? e.target.closest(".hi-act") : null;
      if (!b) return;
      e.stopPropagation();
      const item = b.closest(".hall-item");
      if (!item) return;
      const i = +item.dataset.i;
      if (b.dataset.act === "spark") doSpark(i);
      else openTribute(i);
    });

    // 键盘左右
    L.on(window, "keydown", (e) => {
      if (st.modal) return;
      if (e.key === "ArrowRight") slideTo(st.cur + 1);
      else if (e.key === "ArrowLeft") slideTo(st.cur - 1);
    });

    // 滚轮（桌面）
    let lastWheel = 0;
    L.on(stage, "wheel", (e) => {
      if (st.modal) return;
      const now = performance.now();
      if (now - lastWheel < 220) return;
      lastWheel = now;
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      slideTo(Math.round(st.cur) + (d > 0 ? 1 : -1), 380);
    }, { passive: true });

    // 弹幕飘完自动移除（animationend 会冒泡，用一个委托监听即可）
    const dmBox = document.getElementById("hall-danmu");
    L.on(dmBox, "animationend", (e) => {
      const t = e.target;
      if (t && t.parentNode && t.classList && t.classList.contains("hall-dm")) t.parentNode.removeChild(t);
    });

    /* --- 登录 --- */
    const hlOk = document.getElementById("hl-ok");
    const hlCancel = document.getElementById("hl-cancel");
    if (hlOk) L.on(hlOk, "click", submitLogin);
    if (hlCancel) L.on(hlCancel, "click", closeModals);
    const sidEl = document.getElementById("hl-sid");
    const nmEl = document.getElementById("hl-name");
    if (sidEl) L.on(sidEl, "keydown", e => { if (e.key === "Enter" && nmEl) nmEl.focus(); });
    if (nmEl) L.on(nmEl, "keydown", e => { if (e.key === "Enter") submitLogin(); });

    /* --- 敬言 --- */
    const htSend = document.getElementById("ht-send");
    const htClose = document.getElementById("ht-close");
    if (htSend) L.on(htSend, "click", submitTribute);
    if (htClose) L.on(htClose, "click", closeModals);
    const chips = document.getElementById("ht-chips");
    if (chips) L.on(chips, "click", (e) => {
      const c = e.target && e.target.closest ? e.target.closest(".hm-chip") : null;
      if (!c) return;
      const ta = document.getElementById("ht-text");
      if (ta) { ta.value = c.dataset.full || c.textContent; ta.focus(); }
    });
    const htText = document.getElementById("ht-text");
    if (htText) L.on(htText, "keydown", e => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submitTribute();
    });
    // 点遮罩关闭
    L.on(document.getElementById("hall-login"), "click", (e) => {
      if (e.target && e.target.id === "hall-login") closeModals();
    });
    L.on(document.getElementById("hall-tribute"), "click", (e) => {
      if (e.target && e.target.id === "hall-tribute") closeModals();
    });
  }

  /* ================================================================
   * 十二 · 主循环 / 生命周期
   * ================================================================ */
  function loop(ts) {
    const dt = U.clamp(ts - (st.last || ts), 0, 48);
    st.last = ts;
    st.T += dt;
    updateMotion(dt);
    placeItems();
    drawAtmo(dt);
    drawFx(dt);
    updateRocket(dt);
    updateFocusUI();
  }

  function onResize() {
    layout();
    initParticles();
    placeItems();
  }

  function enter() {
    // 同一页面被重复 enter（未经过 leave）时，先清掉上一轮的循环与监听，避免叠加
    if (L) { L.kill(); L = null; }
    L = U.life();
    if (!built) build();
    if (!built) return;
    closeModals();
    rootEl = document.getElementById("hall-root");
    st.up = !!(App.isUpgraded && App.isUpgraded());
    if (rootEl) rootEl.classList.toggle("upgraded", st.up);

    layout();
    st.cur = 0;
    st.vel = 0;
    st.snap = null;
    st.drag = false;
    st.focus = -1;
    st.T = 0;
    st.last = 0;

    // 火花数据（初始基数 + 已擦亮次数）
    st.spark = [];
    for (let i = 0; i < N; i++) {
      st.spark.push(baseSpark(AL[i].name, i) + U.store.sparkOf(AL[i].name));
      refreshSparkUI(i);
    }

    initParticles();
    placeItems();
    updateFocusUI();
    startBuild();
    startDanmaku();
    bindEvents();

    // 入场：光晕 + 信息栏淡入
    const flash = document.getElementById("hall-flash");
    if (flash) {
      flash.classList.remove("on");
      void flash.offsetWidth;
      flash.classList.add("on");
    }
    const items = document.getElementById("hall-items");
    if (items) {
      items.style.animation = "none";
      void items.offsetWidth;
      items.style.animation = "";
    }

    L.on(window, "resize", onResize);
    L.loop(loop);
  }

  function leave() {
    if (L) { L.kill(); L = null; }
    st.drag = false;
    st.snap = null;
    st.vel = 0;
    st.downTarget = null;
    RK.state = "build";
    RK.lit = 0;
    RK.y = 0;

    // 弹幕层与飘字
    const dm = document.getElementById("hall-danmu");
    if (dm) dm.innerHTML = "";
    document.querySelectorAll("#page-hall .hs-pop").forEach(n => {
      if (n.parentNode) n.parentNode.removeChild(n);
    });
    closeModals();

    // 清空画布（避免下次进入时残留上一帧）
    [cvAtmo, cvFx, cvRocket].forEach(c => {
      if (!c) return;
      const x = c.getContext && c.getContext("2d");
      if (x) { x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, c.width, c.height); }
    });
    const stage = document.getElementById("hall-stage");
    if (stage) stage.classList.remove("dragging");
  }

  App.register("hall", { enter: enter, leave: leave });
})();

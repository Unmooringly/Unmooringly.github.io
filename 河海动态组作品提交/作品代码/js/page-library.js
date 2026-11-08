/* ============================================================
 * L3/L4 图书馆 / 第二页面
 *  · 背景：三校区各自的动态场景（对应"三段视频"的意象）
 *  · 文本：大学介绍开场打字 → 点击非文本区域随机续写图书馆介绍
 *          （单次登入不重复，句库来自「图书馆介绍参考文本」）
 *  · 文本末左「我的记忆」→ 历史线；右「我的续写」→ 未来线
 * ============================================================ */
(function () {
  const U = window.Utils, D = window.DATA;

  U.injectCSS("css-library", `
  #library-root{position:absolute;inset:0;overflow:hidden;background:#050a12;}
  #lib-cv{position:absolute;inset:0;width:100%;height:100%;}
  #lib-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 45%;
    opacity:0;transition:opacity 1.1s ease;
    filter:saturate(.86) contrast(1.05) brightness(.72) blur(1.6px);transform:scale(1.04);}
  #lib-video.on{opacity:1;}
  #lib-veil{position:absolute;inset:0;pointer-events:none;
    background:radial-gradient(120% 100% at 50% 40%, rgba(3,8,16,0) 26%, rgba(3,8,16,.55) 100%);}
  #lib-wrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
    padding:4vh 0;box-sizing:border-box;}
  #lib-paper{position:relative;width:min(880px,84vw);max-height:88vh;overflow:hidden;
    padding:clamp(26px,4vh,48px) clamp(26px,3.4vw,56px);
    background:linear-gradient(160deg, rgba(248,243,230,.94) 0%, rgba(240,232,212,.93) 55%, rgba(232,222,196,.94) 100%);
    box-shadow:0 30px 90px rgba(0,0,0,.6), 0 0 0 1px rgba(150,120,60,.25), inset 0 0 80px rgba(150,120,60,.1);
    border-radius:3px;color:#23324a;}
  #lib-paper::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.4;mix-blend-mode:multiply;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23p)' opacity='.2'/%3E%3C/svg%3E");}
  #lib-seal{position:absolute;right:26px;top:22px;width:44px;height:44px;border:2px solid rgba(178,54,43,.62);
    border-radius:3px;display:flex;align-items:center;justify-content:center;transform:rotate(-6deg);
    font-family:var(--f-kai);font-size:12px;line-height:1.15;color:rgba(178,54,43,.82);text-align:center;
    letter-spacing:0;z-index:3;}
  #lib-campus{font-family:var(--f-mono);font-size:9.5px;letter-spacing:.34em;color:#9a8a68;margin-bottom:10px;}
  #lib-title{font-family:var(--f-kai);font-size:clamp(19px,2.1vw,30px);letter-spacing:.2em;color:#153a63;
    margin-bottom:clamp(10px,1.8vh,20px);text-indent:.2em;}
  #lib-body{font-family:var(--f-kai);font-size:clamp(12px,1.06vw,15px);line-height:2.05;letter-spacing:.055em;
    color:#2a3b55;text-align:justify;max-height:56vh;overflow-y:auto;padding-right:6px;}
  #lib-body .cur{display:inline-block;width:2px;height:1em;background:#3a6ea8;vertical-align:-.12em;
    animation:libCaret .9s steps(1) infinite;}
  @keyframes libCaret{0%,49%{opacity:1}50%,100%{opacity:0}}
  #lib-body p{margin-bottom:.55em;}
  #lib-body .added{animation:addedIn .8s ease both;}
  @keyframes addedIn{from{opacity:0;transform:translateY(6px);filter:blur(3px);}to{opacity:1;transform:none;filter:none;}}
  #lib-ends{display:flex;justify-content:space-between;align-items:flex-end;margin-top:clamp(14px,2.4vh,26px);gap:14px;}
  .lib-end{position:relative;font-family:var(--f-kai);font-size:clamp(15px,1.5vw,21px);letter-spacing:.28em;
    color:#12406e;cursor:pointer;padding:6px 10px;text-indent:.28em;transition:all .4s var(--ease);
    background:none;border:none;}
  .lib-end::after{content:"";position:absolute;left:50%;bottom:0;width:0;height:1px;background:#1d6bb0;
    transition:all .45s var(--ease);transform:translateX(-50%);}
  .lib-end:hover{color:#0a7fd0;text-shadow:0 0 20px rgba(60,150,255,.7);}
  .lib-end:hover::after{width:90%;}
  .lib-end .shine{position:absolute;inset:0;pointer-events:none;border-radius:4px;
    background:linear-gradient(105deg,transparent 34%,rgba(120,180,245,.5) 48%,transparent 62%);
    background-size:280% 100%;animation:endShine 4.2s linear infinite;mix-blend-mode:screen;opacity:.42;}
  @keyframes endShine{0%{background-position:180% 0;}100%{background-position:-80% 0;}}
  .lib-end small{display:block;font-family:var(--f-mono);font-size:8px;letter-spacing:.24em;color:#8f9cae;
    margin-top:4px;text-indent:.24em;}
  #lib-hint{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);z-index:5;
    font-size:10.5px;letter-spacing:.2em;color:#8aa3bd;text-shadow:0 2px 10px #000;text-align:center;white-space:nowrap;}
  @media (max-width:780px){
    #lib-paper{width:92vw;padding:20px 18px;}
    #lib-body{font-size:11px;line-height:1.95;max-height:50vh;}
    .lib-end{font-size:14px;}
    #lib-hint{font-size:8.5px;letter-spacing:.06em;}
  }
  `);

  /* ---------------- 三校区背景场景（Canvas） ---------------- */
  const BG = { t: 0, mode: "jiangning", rain: [], motes: [], towers: [], videoOk: false };

  function setMode(campus) {
    BG.mode = { 江宁: "jiangning", 西康路: "xikanglu", 金坛: "jintan" }[campus] || "jiangning";
    // ---- 三段校区视频（需求「背景：三段视频分别对应」）----
    const v = document.getElementById("lib-video");
    if (v) {
      const key = campus || "江宁";
      if (v.dataset.campus !== key) {
        v.dataset.campus = key;
        BG.videoOk = false;
        v.classList.remove("on");
        try { v.pause(); } catch (e) {}
        v.poster = encodeURI("素材/视频/" + key + ".jpg");
        v.src = encodeURI("素材/视频/" + key + ".mp4");
        const tryPlay = () => { const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); };
        v.oncanplay = () => { BG.videoOk = true; v.classList.add("on"); tryPlay(); };
        v.onerror = () => { BG.videoOk = false; v.classList.remove("on"); };
        try { v.load(); } catch (e) {}
        tryPlay();
      } else if (v.paused) {
        const pr = v.play(); if (pr && pr.catch) pr.catch(() => {});
      }
    }
    BG.motes = [];
    for (let i = 0; i < 90; i++) BG.motes.push({ x: Math.random(), y: Math.random(), r: U.rand(.6, 2.2), v: U.rand(.04, .22), a: U.rand(.2, .8), ph: U.rand(0, 9) });
    BG.rain = [];
    for (let i = 0; i < 70; i++) BG.rain.push({ x: Math.random(), y: Math.random(), l: U.rand(.02, .07), v: U.rand(.4, 1.1), a: U.rand(.1, .3) });
  }

  function drawBG(ctx, w, h, dt) {
    BG.t += dt;
    const T = BG.t;
    const mode = BG.mode;
    // 构图思路：中央被宣纸遮住，画面重点放在左右两侧（建筑/树干框住纸面），
    // 上方是天空与树冠，下方是水面倒影——形成"透过窗看校园"的取景。
    const groundY = h * 0.72;

    /* ---------- 天空（三校区共用基调，按模式换色） ---------- */
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    if (mode === "xikanglu") {
      sky.addColorStop(0, "#22170f"); sky.addColorStop(.36, "#3d291a");
      sky.addColorStop(.7, "#4c3620"); sky.addColorStop(1, "#0b0705");
    } else if (mode === "jintan") {
      sky.addColorStop(0, "#0a1a2c"); sky.addColorStop(.4, "#1a3b56");
      sky.addColorStop(.72, "#2c5c7c"); sky.addColorStop(1, "#0a1218");
    } else {
      sky.addColorStop(0, "#081a33"); sky.addColorStop(.4, "#123753");
      sky.addColorStop(.72, "#1d5074"); sky.addColorStop(1, "#0a141d");
    }
    if (BG.videoOk) {
      /* 视频模式：天空与建筑由 <video> 呈现，这里只叠加氛围层 */
    } else {
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    }
    
    if (BG.videoOk) {
      /* 视频可用 —— 跳过所有程序化校园场景，仅保留光尘与细雨 */
    } else if (mode === "xikanglu") {
      /* ================= 西康路：红墙老馆 + 法国梧桐 ================= */
      // 暖光晕（灯）
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      U.glowCircle(ctx, w * .5, h * .16, w * .5, "255,196,116", .16);
      U.glowCircle(ctx, w * .13, h * .48, w * .13, "255,186,110", .3);
      U.glowCircle(ctx, w * .87, h * .48, w * .13, "255,186,110", .3);
      ctx.restore();

      // 树冠（两侧压边）
      ctx.save();
      for (let side = 0; side < 2; side++) {
        const bx = side ? w * .95 : w * .05, dir = side ? -1 : 1;
        for (let i = 0; i < 34; i++) {
          const x = bx + dir * U.noise2(i * 1.7, 3.1) * w * .34;
          const y = h * (.02 + .34 * U.noise2(i * .9 + side * 7, 5.3));
          const r = w * (.045 + .075 * U.noise2(i * 1.3, 2.2));
          const g = ctx.createRadialGradient(x, y - r * .3, 0, x, y, r);
          const lit = .32 + .3 * U.noise2(i * 2.1, T * .0002);
          g.addColorStop(0, `rgba(${(66 + lit * 90) | 0},${(96 + lit * 96) | 0},${(46 + lit * 52) | 0},${.34 + lit * .2})`);
          g.addColorStop(.6, "rgba(38,60,34,.32)");
          g.addColorStop(1, "rgba(24,40,24,0)");
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(x, y, r, 0, U.TAU); ctx.fill();
        }
      }
      ctx.restore();
      // 树干剪影
      ctx.save();
      ctx.strokeStyle = "rgba(22,15,10,.92)";
      for (const side of [0, 1]) {
        const bx = side ? w * .93 : w * .07;
        ctx.lineWidth = w * .014;
        ctx.beginPath();
        ctx.moveTo(bx, h);
        for (let k = 0; k <= 10; k++) {
          const y = h - (h * .78) * (k / 10);
          ctx.lineTo(bx + Math.sin(k * .9 + side * 3) * w * .012, y);
        }
        ctx.stroke();
        ctx.lineWidth = w * .006;
        for (let k = 2; k <= 7; k++) {
          const y = h - (h * .7) * (k / 10);
          ctx.beginPath(); ctx.moveTo(bx, y);
          ctx.quadraticCurveTo(bx + (side ? -1 : 1) * w * .05, y - h * .04, bx + (side ? -1 : 1) * w * .1, y - h * .1);
          ctx.stroke();
        }
      }
      ctx.restore();

      // 红墙楼体（横贯，纸面两侧可读）
      const bh2 = h * .3, by2 = groundY;
      const g2 = ctx.createLinearGradient(0, by2 - bh2, 0, by2);
      g2.addColorStop(0, "rgba(112,52,40,.98)");
      g2.addColorStop(.5, "rgba(86,38,30,.98)");
      g2.addColorStop(1, "rgba(48,22,18,.99)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, by2 - bh2, w, bh2);

      // 窗（带十字窗棂 + 暖光）
      const cols = Math.max(6, Math.round(w / 150));
      const rows = 2;
      const ww = w / cols * .5, wh = bh2 / (rows + 1.6);
      for (let r0 = 0; r0 < rows; r0++) {
        for (let c0 = 0; c0 < cols; c0++) {
          const x = (c0 + .5) * (w / cols) - ww / 2;
          const y = by2 - bh2 + bh2 * .16 + r0 * wh * 1.55;
          const lit = .2 + .55 * Math.abs(Math.sin(c0 * 1.7 + r0 * 2.3 + T * .00035));
          const gg = ctx.createLinearGradient(x, y, x, y + wh);
          gg.addColorStop(0, `rgba(255,226,164,${lit})`);
          gg.addColorStop(1, `rgba(212,150,84,${lit * .7})`);
          ctx.fillStyle = gg; ctx.fillRect(x, y, ww, wh);
          // 窗棂
          ctx.strokeStyle = "rgba(30,16,12,.85)"; ctx.lineWidth = Math.max(1.5, w * .0022);
          ctx.strokeRect(x, y, ww, wh);
          ctx.beginPath();
          ctx.moveTo(x + ww / 2, y); ctx.lineTo(x + ww / 2, y + wh);
          ctx.moveTo(x, y + wh / 2); ctx.lineTo(x + ww, y + wh / 2);
          ctx.stroke();
          // 窗台
          ctx.fillStyle = "rgba(214,198,170,.22)";
          ctx.fillRect(x - 3, y + wh, ww + 6, Math.max(2, h * .004));
        }
      }
      // 屋檐（瓦当剪影 + 起翘）
      ctx.fillStyle = "#2b1610";
      ctx.beginPath();
      ctx.moveTo(-10, by2 - bh2);
      ctx.quadraticCurveTo(w * .5, by2 - bh2 - h * .075, w + 10, by2 - bh2);
      ctx.lineTo(w + 10, by2 - bh2 + h * .02);
      ctx.quadraticCurveTo(w * .5, by2 - bh2 - h * .05, -10, by2 - bh2 + h * .02);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(198,160,96,.3)"; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-10, by2 - bh2 + h * .021);
      ctx.quadraticCurveTo(w * .5, by2 - bh2 - h * .049, w + 10, by2 - bh2 + h * .021);
      ctx.stroke();

      // 地面 + 反光
      const gr = ctx.createLinearGradient(0, groundY, 0, h);
      gr.addColorStop(0, "rgba(30,20,14,.96)");
      gr.addColorStop(1, "rgba(8,5,4,1)");
      ctx.fillStyle = gr; ctx.fillRect(0, groundY, w, h - groundY);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 14; i++) {
        const x = (i + .5) * (w / 14);
        const gg = ctx.createLinearGradient(x, groundY, x, h);
        gg.addColorStop(0, "rgba(255,196,120,.16)");
        gg.addColorStop(1, "rgba(255,170,80,0)");
        ctx.fillStyle = gg;
        ctx.fillRect(x - w * .02, groundY, w * .04, h - groundY);
      }
      ctx.restore();

    } else if (mode === "jiangning") {
      /* ================= 江宁：巨帆图书馆 + 玻璃幕墙 + 水池 ================= */
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 7; i++) {
        const cx = ((T * .005 + i * .17) % 1.25 - .12) * w;
        const cy = h * (.08 + (i % 3) * .055);
        U.glowCircle(ctx, cx, cy, w * .17, "126,178,226", .07);
      }
      U.glowCircle(ctx, w * .78, h * .17, w * .3, "198,226,255", .12);
      ctx.restore();

      // 远景城市剪影
      ctx.fillStyle = "rgba(10,26,44,.72)";
      for (let i = 0; i < 22; i++) {
        const bw2 = w * .028 + (i * 37 % 41) * w * .0012;
        const bh3 = h * (.02 + ((i * 17) % 9) / 60);
        ctx.fillRect(w * .04 + i * w * .043, groundY - bh3, bw2, bh3);
      }

      // 帆形主馆（偏左，纸面右侧留白给水面）
      const bx = w * .19, bw = w * .34, bh = h * .46, by = groundY + h * .01;
      ctx.save();
      const gf = ctx.createLinearGradient(bx - bw / 2, by - bh, bx + bw / 2, by);
      gf.addColorStop(0, "rgba(30,62,98,.96)");
      gf.addColorStop(.45, "rgba(48,94,138,.97)");
      gf.addColorStop(1, "rgba(18,42,70,.96)");
      ctx.fillStyle = gf;
      ctx.beginPath();
      ctx.moveTo(bx - bw / 2, by);
      ctx.lineTo(bx - bw / 2 + bw * .12, by - bh * .82);
      ctx.quadraticCurveTo(bx + bw * .06, by - bh * 1.24, bx + bw / 2 - bw * .02, by - bh * .58);
      ctx.lineTo(bx + bw / 2, by);
      ctx.closePath(); ctx.fill();
      ctx.clip();
      // 幕墙玻璃格
      ctx.strokeStyle = "rgba(158,206,246,.24)"; ctx.lineWidth = 1;
      for (let i = 1; i < 22; i++) {
        const x = bx - bw / 2 + (bw * i) / 22;
        ctx.beginPath(); ctx.moveTo(x, by); ctx.lineTo(x, by - bh); ctx.stroke();
      }
      for (let j = 1; j < 13; j++) {
        const y = by - (bh * j) / 13;
        ctx.beginPath(); ctx.moveTo(bx - bw / 2, y); ctx.lineTo(bx + bw / 2, y); ctx.stroke();
      }
      // 亮窗
      for (let i = 0; i < 130; i++) {
        const x = bx - bw / 2 + (bw * (i % 22)) / 22 + 2;
        const y = by - (bh * (Math.floor(i / 22) + 1)) / 13 + 2;
        const on = .1 + .42 * Math.abs(Math.sin(i * 1.9 + T * .0006));
        ctx.fillStyle = `rgba(255,232,178,${on})`;
        ctx.fillRect(x, y, Math.max(2.5, bw / 30), Math.max(2, bh / 26));
      }
      // 顶部高光边
      ctx.strokeStyle = "rgba(210,235,255,.5)"; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx - bw / 2 + bw * .12, by - bh * .82);
      ctx.quadraticCurveTo(bx + bw * .06, by - bh * 1.24, bx + bw / 2 - bw * .02, by - bh * .58);
      ctx.stroke();
      ctx.restore();

      // 右侧一组矮楼（对称感）
      ctx.save();
      for (let i = 0; i < 3; i++) {
        const x = w * .72 + i * w * .085, bw3 = w * .062, bh4 = h * (.16 + i * .035);
        const g4 = ctx.createLinearGradient(x, groundY - bh4, x, groundY);
        g4.addColorStop(0, "rgba(30,58,90,.94)"); g4.addColorStop(1, "rgba(14,32,52,.96)");
        ctx.fillStyle = g4; ctx.fillRect(x, groundY - bh4, bw3, bh4);
        for (let k = 0; k < 6; k++) {
          ctx.fillStyle = `rgba(255,230,176,${.1 + .35 * Math.abs(Math.sin(k * 2.1 + i + T * .0004))})`;
          ctx.fillRect(x + bw3 * .16, groundY - bh4 + h * .022 + k * bh4 * .15, bw3 * .68, Math.max(2, bh4 * .05));
        }
      }
      ctx.restore();

      // 水面 + 倒影
      const wat = ctx.createLinearGradient(0, groundY, 0, h);
      wat.addColorStop(0, "rgba(20,48,72,.9)");
      wat.addColorStop(.5, "rgba(10,26,42,.96)");
      wat.addColorStop(1, "rgba(4,12,20,1)");
      ctx.fillStyle = wat; ctx.fillRect(0, groundY, w, h - groundY);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 16; i++) {
        const x = bx - bw / 2 + (bw * i) / 16;
        const gg = ctx.createLinearGradient(x, groundY, x, h);
        gg.addColorStop(0, "rgba(120,190,240,.14)");
        gg.addColorStop(1, "rgba(90,160,220,0)");
        ctx.fillStyle = gg;
        ctx.fillRect(x - 3, groundY, 6, (h - groundY) * .8);
      }
      for (let i = 0; i < 26; i++) {
        const y = groundY + ((i / 26) * (h - groundY));
        ctx.strokeStyle = `rgba(150,205,246,${.06 * (1 - i / 26)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 16) {
          const yy = y + Math.sin(x * .013 + T * .0014 + i * .8) * (1.6 + i * .28);
          x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy);
        }
        ctx.stroke();
      }
      ctx.restore();

    } else {
      /* ================= 金坛：白墙现代组团 + 长荡湖 ================= */
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      U.glowCircle(ctx, w * .7, h * .16, w * .34, "180,218,255", .13);
      ctx.restore();
      // 远山
      ctx.fillStyle = "rgba(14,34,52,.6)";
      ctx.beginPath(); ctx.moveTo(0, groundY);
      for (let x = 0; x <= w; x += 28) {
        ctx.lineTo(x, groundY - 18 - U.fbm(x * .0034, 2.1, 3) * h * .13);
      }
      ctx.lineTo(w, groundY); ctx.closePath(); ctx.fill();

      // 现代建筑群：左右各一组，中间留白给纸面
      const blocks = [
        { x: .02, wdt: .12, hgt: .3 }, { x: .15, wdt: .09, hgt: .22 },
        { x: .79, wdt: .1, hgt: .26 }, { x: .9, wdt: .085, hgt: .34 },
      ];
      blocks.forEach((b, bi) => {
        const x = w * b.x, bw2 = w * b.wdt, bh2 = h * b.hgt, y = groundY - bh2;
        const g3 = ctx.createLinearGradient(x, y, x + bw2, groundY);
        g3.addColorStop(0, "rgba(236,241,246,.96)");
        g3.addColorStop(.55, "rgba(198,210,222,.95)");
        g3.addColorStop(1, "rgba(150,166,182,.95)");
        ctx.fillStyle = g3; ctx.fillRect(x, y, bw2, bh2);
        // 檐口
        ctx.fillStyle = "rgba(52,64,78,.85)";
        ctx.fillRect(x - 2, y - h * .012, bw2 + 4, h * .012);
        // 玻璃带
        const bands = 5;
        for (let k = 0; k < bands; k++) {
          const byk = y + bh2 * (.12 + k * .17);
          ctx.fillStyle = `rgba(96,150,190,${.28 + .26 * Math.abs(Math.sin(k + bi + T * .0005))})`;
          ctx.fillRect(x + bw2 * .1, byk, bw2 * .8, bh2 * .08);
          ctx.strokeStyle = "rgba(255,255,255,.22)"; ctx.lineWidth = 1;
          ctx.strokeRect(x + bw2 * .1, byk, bw2 * .8, bh2 * .08);
        }
        // 侧墙阴影
        const sh = ctx.createLinearGradient(x + bw2 * .7, 0, x + bw2, 0);
        sh.addColorStop(0, "rgba(60,80,100,0)");
        sh.addColorStop(1, "rgba(40,58,76,.4)");
        ctx.fillStyle = sh; ctx.fillRect(x + bw2 * .7, y, bw2 * .3, bh2);
      });

      // 湖面 + 倒影
      const lake = ctx.createLinearGradient(0, groundY, 0, h);
      lake.addColorStop(0, "rgba(30,66,90,.92)");
      lake.addColorStop(.45, "rgba(14,36,54,.96)");
      lake.addColorStop(1, "rgba(5,14,22,1)");
      ctx.fillStyle = lake; ctx.fillRect(0, groundY, w, h - groundY);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      blocks.forEach((b) => {
        const x = w * b.x, bw2 = w * b.wdt;
        const gg = ctx.createLinearGradient(x, groundY, x, h);
        gg.addColorStop(0, "rgba(210,232,250,.2)");
        gg.addColorStop(1, "rgba(150,200,240,0)");
        ctx.fillStyle = gg;
        ctx.fillRect(x, groundY, bw2, (h - groundY) * .78);
      });
      for (let i = 0; i < 24; i++) {
        const y = groundY + (i / 24) * (h - groundY);
        ctx.strokeStyle = `rgba(160,210,246,${.07 * (1 - i / 24)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 15) {
          const yy = y + Math.sin(x * .012 + T * .0015 + i * .9) * (1.5 + i * .3);
          x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy);
        }
        ctx.stroke();
      }
      ctx.restore();
      // 芦苇剪影（前景压边）
      ctx.save();
      ctx.strokeStyle = "rgba(8,18,26,.9)";
      for (const side of [0, 1]) {
        const bx = side ? w : 0;
        for (let i = 0; i < 16; i++) {
          const x = bx + (side ? -1 : 1) * (8 + i * w * .012);
          const hh = h * (.1 + .16 * U.noise2(i * 2.3 + side * 5, 1.1));
          ctx.lineWidth = 1 + (i % 3) * .6;
          ctx.beginPath();
          ctx.moveTo(x, h);
          ctx.quadraticCurveTo(x + (side ? -1 : 1) * hh * .18, h - hh * .6, x + (side ? -1 : 1) * hh * .3, h - hh);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    /* ---------- 光尘 ---------- */
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const m of BG.motes) {
      m.y -= m.v * dt * .004;
      m.ph += dt * .001;
      if (m.y < -.04) { m.y = 1.04; m.x = Math.random(); }
      ctx.fillStyle = `rgba(214,236,255,${m.a * (.28 + .3 * Math.sin(m.ph))})`;
      ctx.beginPath(); ctx.arc(m.x * w, m.y * h, m.r, 0, U.TAU); ctx.fill();
    }
    ctx.restore();

    /* ---------- 细雨（江宁/金坛的湿润感） ---------- */
    if (mode !== "xikanglu") {
      ctx.save();
      ctx.lineWidth = 1;
      for (const r of BG.rain) {
        r.y += r.v * dt * .02;
        if (r.y > 1.05) { r.y = -.05; r.x = Math.random(); }
        const lg = ctx.createLinearGradient(r.x * w, r.y * h, r.x * w - 2, r.y * h - r.l * h);
        lg.addColorStop(0, `rgba(210,235,255,${r.a})`);
        lg.addColorStop(1, "rgba(160,205,240,0)");
        ctx.strokeStyle = lg;
        ctx.beginPath();
        ctx.moveTo(r.x * w, r.y * h);
        ctx.lineTo(r.x * w - 2, r.y * h - r.l * h);
        ctx.stroke();
      }
      ctx.restore();
    }

    /* ---------- 上下压暗，聚焦中间纸面 ---------- */
    const top = ctx.createLinearGradient(0, 0, 0, h * .2);
    top.addColorStop(0, "rgba(3,8,16,.72)");
    top.addColorStop(1, "rgba(3,8,16,0)");
    ctx.fillStyle = top; ctx.fillRect(0, 0, w, h * .2);
    const bot = ctx.createLinearGradient(0, h * .84, 0, h);
    bot.addColorStop(0, "rgba(3,8,16,0)");
    bot.addColorStop(1, "rgba(3,8,16,.7)");
    ctx.fillStyle = bot; ctx.fillRect(0, h * .84, w, h * .16);
  }

  /* ---------------- 文本 ---------------- */
  let typingTimer = null, introDone = false, usedLines = 0;

  function typeInto(el, text, speed, done) {
    let i = 0;
    const step = () => {
      if (!el.isConnected) return;
      i += 2;
      el.innerHTML = U.esc(text.slice(0, i)) + (i < text.length ? '<span class="cur"></span>' : "");
      autoscroll();
      if (i >= text.length) { el.innerHTML = U.esc(text); done && done(); }
      else typingTimer = setTimeout(step, speed);
    };
    step();
  }

  function autoscroll() {
    const body = document.getElementById("lib-body");
    if (body) body.scrollTop = body.scrollHeight;
  }

  function addRandomLine() {
    const body = document.getElementById("lib-body");
    if (!body) return;
    const campusLines = D.LIBRARY_LINES[App.getCampus()] || [];
    const pool = D.LIBRARY_LINES.通用.concat(campusLines);
    const all = pool.length;
    let idx = U.store.useIdx("library", all);
    if (idx == null) { U.store.resetUse("library"); idx = U.store.useIdx("library", all); }
    if (idx == null) return;
    const line = pool[idx];
    const p = U.el("p", "added", "");
    body.appendChild(p);
    usedLines++;
    typeInto(p, line, 26, autoscroll);
  }

  /* ---------------- 生命周期 ---------------- */
  let L = null;

  function enter(params) {
    L = U.life();
    const campus = (params && params.campus) || App.getCampus() || "江宁";
    App.setCampus(campus);
    const cdata = D.CAMPUS.find(c => c.id === campus) || D.CAMPUS[1];

    const p = document.getElementById("page-library");
    const first = !p.dataset.built;
    if (first) {
      p.innerHTML = `
        <div id="library-root">
          <canvas id="lib-cv"></canvas>
          <video id="lib-video" playsinline muted loop preload="auto"></video>
          <div id="lib-veil"></div>
          <div id="lib-wrap">
            <div id="lib-paper">
              <div id="lib-seal">河海<br>图书馆</div>
              <div id="lib-campus"></div>
              <div id="lib-title"></div>
              <div id="lib-body"></div>
              <div id="lib-ends">
                <button class="lib-end" id="lib-memory">我的记忆<small>HISTORY · 历史上的今天</small><span class="shine"></span></button>
                <button class="lib-end" id="lib-write">我的续写<small>FUTURE · AI 为伴的云时代</small><span class="shine"></span></button>
              </div>
            </div>
          </div>
          <div id="lib-hint">点击纸面空白处 · 让图书馆的文字自己继续生长</div>
        </div>`;
      p.dataset.built = "1";
    }

    document.getElementById("lib-campus").textContent =
      cdata.library + " · " + cdata.en + " · " + cdata.video;
    document.getElementById("lib-title").textContent =
      campus === "西康路" ? "书中寻途，路由未来" : campus === "江宁" ? "书中寻途，路由未来" : "书中寻途，路由未来";

    const cv = document.getElementById("lib-cv");
    const ctx = cv.getContext("2d");
    setMode(campus);

    // 入场：重新打字
    const body = document.getElementById("lib-body");
    body.innerHTML = "";
    const ends = document.getElementById("lib-ends");
    ends.style.opacity = "0"; ends.style.transition = "opacity .8s ease";
    introDone = false;
    if (typingTimer) { clearTimeout(typingTimer); typingTimer = null; }

    const intro = "　　" + D.UNI_INTRO;
    typeInto(body, intro, 16, () => {
      introDone = true;
      ends.style.opacity = "1";
      App.toast("点击纸面空白处，让图书馆的文字继续生长");
    });

    let lastT = performance.now();
    L.loop(() => {
      const now = performance.now();
      const dt = Math.min(50, now - lastT);
      lastT = now;
      const f = U.fitCanvas(cv);
      drawBG(f.ctx, f.w, f.h, dt);
    });

    // 点击非文本空间 → 随机续写
    const root = document.getElementById("library-root");
    L.on(root, "click", (e) => {
      if (e.target.closest("#lib-paper") && !e.target.closest("#lib-body")) return;
      if (e.target.closest(".lib-end")) return;
      if (!introDone) return;
      addRandomLine();
    });
    // 点击纸面空白（非文本行）也续写
    const paper = document.getElementById("lib-paper");
    L.on(paper, "click", (e) => {
      if (e.target.closest("#lib-ends") || e.target.closest("#lib-body")) return;
      if (!introDone) return;
      addRandomLine();
    });

    // 两个入口
    const mem = document.getElementById("lib-memory");
    const wr = document.getElementById("lib-write");
    L.on(mem, "click", (e) => {
      e.stopPropagation();
      App.setUpgraded(App.state.visitFuture);
      App.navigate("history");
    });
    L.on(wr, "click", (e) => {
      e.stopPropagation();
      App.navigate("future");
    });
  }

  function leave() {
    if (typingTimer) { clearTimeout(typingTimer); typingTimer = null; }
    if (L) { L.kill(); L = null; }
  }

  App.register("library", { enter, leave });
})();

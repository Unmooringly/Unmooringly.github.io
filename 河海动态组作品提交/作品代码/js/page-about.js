/* ============================================================
 * L6 关于
 *  制作者信息 / 制作过程 / 技术亮点 / 数据统计 / 网址与源码位置
 *  ⚠ 请把下面的 AUTHOR 填成你自己的信息。
 * ============================================================ */
(function () {
  const U = window.Utils, D = window.DATA;

  // ⬇⬇⬇ 在这里改成你自己的信息 ⬇⬇⬇
  const AUTHOR = {
    name: "（请填写姓名）",
    school: "河海大学",
    major: "（请填写专业 / 年级）",
    team: "",
    contact: "（邮箱 / 微信，可留空）",
    site: "",
    repo: "本项目源码位于交付目录：index.html / css/style.css / js/*.js",
  };

  U.injectCSS("css-about", `
  #about-root{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;background:
    radial-gradient(120% 90% at 50% 0%, #0b2450 0%, #05122c 46%, #01060e 100%);}
  #about-cv{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;opacity:.55;}
  .ab-wrap{position:relative;z-index:2;max-width:980px;margin:0 auto;padding:8vh 26px 12vh;}
  .ab-kicker{font-family:var(--f-mono);font-size:10px;letter-spacing:.44em;color:#7f9dc4;margin-bottom:14px;}
  .ab-h1{font-family:var(--f-kai);font-size:clamp(30px,4.2vw,58px);letter-spacing:.16em;color:#eef5ff;
    line-height:1.3;text-shadow:0 0 40px rgba(90,150,255,.6);}
  .ab-h1 em{font-style:normal;color:#ffe0a0;}
  .ab-sub{margin-top:18px;font-family:var(--f-kai);font-size:clamp(12px,1.16vw,15px);line-height:2.1;
    color:#b9cfe8;letter-spacing:.08em;}
  .ab-sec{margin-top:clamp(34px,6vh,64px);padding-top:22px;border-top:1px solid rgba(130,170,230,.16);}
  .ab-sec h2{font-family:var(--f-kai);font-size:clamp(16px,1.7vw,22px);letter-spacing:.22em;color:#dceaff;
    margin-bottom:16px;}
  .ab-sec h2 span{font-family:var(--f-mono);font-size:9px;letter-spacing:.3em;color:#6d8bb0;margin-left:12px;}
  .ab-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;}
  .ab-card{padding:16px 18px;border-radius:12px;background:rgba(8,22,46,.55);
    border:1px solid rgba(130,175,240,.16);transition:all .35s var(--ease);}
  .ab-card:hover{border-color:rgba(140,200,255,.5);transform:translateY(-3px);
    box-shadow:0 14px 40px rgba(20,70,160,.34);}
  .ab-card .k{font-family:var(--f-mono);font-size:9px;letter-spacing:.24em;color:#7f9dc4;margin-bottom:8px;}
  .ab-card .v{font-family:var(--f-kai);font-size:clamp(14px,1.3vw,18px);color:#f0f7ff;letter-spacing:.08em;}
  .ab-card .v small{display:block;font-size:10px;letter-spacing:.1em;color:#93aecb;margin-top:6px;font-family:var(--f-hei);}
  .ab-list{list-style:none;}
  .ab-list li{position:relative;padding-left:20px;margin-bottom:12px;line-height:1.95;
    font-size:13px;color:#c2d6ec;letter-spacing:.04em;}
  .ab-list li::before{content:"";position:absolute;left:0;top:.68em;width:7px;height:7px;border-radius:50%;
    background:linear-gradient(135deg,#6fc0ff,#2a6fd0);box-shadow:0 0 10px rgba(90,170,255,.8);}
  .ab-list li b{color:#ffe0a0;font-weight:400;}
  .ab-quote{margin-top:clamp(30px,6vh,58px);padding:26px 30px;border-left:2px solid rgba(226,196,138,.6);
    background:linear-gradient(90deg, rgba(226,196,138,.08), transparent);
    font-family:var(--f-kai);font-size:clamp(13px,1.3vw,17px);line-height:2.1;color:#e9d9b4;letter-spacing:.1em;}
  .ab-foot{margin-top:46px;font-size:11px;letter-spacing:.2em;color:#5f7796;text-align:center;line-height:2;}
  .ab-tag{display:inline-block;margin:4px 6px 0 0;padding:3px 10px;border-radius:20px;font-size:10px;
    letter-spacing:.14em;color:#a8c8ec;border:1px solid rgba(130,175,240,.24);background:rgba(20,50,100,.34);}
  @media (max-width:780px){ .ab-wrap{padding:6vh 16px 10vh;} .ab-sub{font-size:12px;} }
  `);

  let L = null, cv, ctx, stars = [];

  function enter() {
    L = U.life();
    const p = document.getElementById("page-about");
    if (!p.dataset.built) {
      p.innerHTML = `
        <div id="about-root">
          <canvas id="about-cv"></canvas>
          <div class="ab-wrap">
            <div class="ab-kicker">ABOUT THIS WORK</div>
            <div class="ab-h1">江河是流动的文明，<br>治理是永续的<em>使命</em>。</div>
            <div class="ab-sub">
              这件作品以河海大学 111 年校史为骨，以「AI 时代」为翼。<br>
              上卷记录一百一十一载的治水行舟，下卷畅想数字浪潮里的云与星。
            </div>

            <div class="ab-sec">
              <h2>制作者 <span>THE MAKER</span></h2>
              <div class="ab-grid">
                <div class="ab-card"><div class="k">NAME</div><div class="v">${U.esc(AUTHOR.name)}</div></div>
                <div class="ab-card"><div class="k">SCHOOL</div><div class="v">${U.esc(AUTHOR.school)}<small>${U.esc(AUTHOR.major)}</small></div></div>
                <div class="ab-card"><div class="k">CONTACT</div><div class="v" style="font-size:13px">${U.esc(AUTHOR.contact || "—")}</div></div>
                <div class="ab-card"><div class="k">SCALE</div><div class="v">12 个页面<small>纯前端 · 零依赖 · 可离线</small></div></div>
              </div>
            </div>

            <div class="ab-sec">
              <h2>制作过程 <span>THE PROCESS</span></h2>
              <ul class="ab-list">
                <li><b>读稿</b>：把三千字需求反复拆成「页面—层级—交互—数据」四张表，先定信息架构，再定视觉语言。</li>
                <li><b>定调</b>：以河海蓝（#0a3d91）为底色，用宇宙／宣纸／水墨／云海四种材质区分「溯源—历史—当下—未来」。</li>
                <li><b>搭架</b>：原生 JS 的路由 + 生命周期（rAF / 定时器 / 监听统一回收）+ Canvas 粒子引擎，做到零依赖、可离线。</li>
                <li><b>实现</b>：逐个攻克粒子星系、3D 翻书、流光下渗文字、四季天气回溯、水墨显影校门、群星凝旗、云层拖拽等效果。</li>
                <li><b>打磨</b>：以无头浏览器逐帧截图自检，逐版调整明暗、密度、节奏与字体，直到每一屏都站得住。</li>
              </ul>
            </div>

            <div class="ab-sec">
              <h2>技术亮点 <span>TECH</span></h2>
              <ul class="ab-list">
                <li><b>3D 书卷</b>：17 张纸的 preserve-3d 翻页，逐帧控制角度与明暗，末页整幅「寻梦河海」以闪光显影。</li>
                <li><b>流光文字</b>：沿照片四边闭合的光点轨迹，把介绍文字做 alpha 蒙版自上而下「渗」出，字间以更细光线相连。</li>
                <li><b>实时接入</b>：南京时间（Intl/Asia-Shanghai）决定四季三时与转场；open-meteo 实时天气驱动雨雪雾晴，失败自动降级。</li>
                <li><b>粒子系统</b>：星点预渲染贴图 + 精灵化绘制，600+ 星体、2500 星点凝旗仍保持 60fps。</li>
                <li><b>自绘一切</b>：云、雨、水花、怀表、纸船、地标、梧桐、蓝图与全息屏全部程序化生成，无一张外部贴图参与。</li>
              </ul>
              <div style="margin-top:10px">
                <span class="ab-tag">Canvas 2D</span><span class="ab-tag">CSS 3D</span><span class="ab-tag">Intl TimeZone</span>
                <span class="ab-tag">open-meteo</span><span class="ab-tag">粒子上限控制</span><span class="ab-tag">生命周期回收</span>
                <span class="ab-tag">localStorage 统计</span><span class="ab-tag">响应式</span>
              </div>
            </div>

            <div class="ab-sec">
              <h2>本卷数据 <span>DATA</span></h2>
              <div class="ab-grid">
                <div class="ab-card"><div class="k">ALUMNI</div><div class="v">${D.ALUMNI.length} 位<small>按出生年份排序</small></div></div>
                <div class="ab-card"><div class="k">PROJECTS</div><div class="v">${D.BUILDINGS.length} 项<small>水利工程</small></div></div>
                <div class="ab-card"><div class="k">CHRONICLE</div><div class="v">${D.HISTORY.length} 条<small>校史年表</small></div></div>
                <div class="ab-card"><div class="k">REWIND</div><div class="v">${U.store.timeBack()} 次<small>时光回溯</small></div></div>
                <div class="ab-card"><div class="k">ROCKETS</div><div class="v">${U.store.rockets()} 枚<small>为河海的梦点火</small></div></div>
                <div class="ab-card"><div class="k">GYRO</div><div class="v">${U.store.gyro()} 次<small>蓝图畅想者</small></div></div>
              </div>
            </div>

            <div class="ab-sec">
              <h2>网址与源码 <span>LINKS</span></h2>
              <ul class="ab-list">
                <li><b>源码位置</b>：${U.esc(AUTHOR.repo)}</li>
                <li><b>运行方式</b>：直接双击 <code style="font-family:var(--f-mono);color:#9fd0ff">index.html</code>，
                  或在目录内执行 <code style="font-family:var(--f-mono);color:#9fd0ff">python -m http.server 8000</code> 后访问
                  <code style="font-family:var(--f-mono);color:#9fd0ff">http://localhost:8000</code>。</li>
                <li><b>学校官网</b>：<a href="https://www.hhu.edu.cn" target="_blank" rel="noopener"
                  style="color:#8fc9ff;text-decoration:none;border-bottom:1px solid rgba(140,200,255,.4)">www.hhu.edu.cn</a></li>
                <li><b>参考数据</b>：河海大学校史馆、各工程公开资料；天气数据来自 open-meteo，新闻与科技资讯均标注来源并做降级。</li>
              </ul>
            </div>

            <div class="ab-quote">
              「今天是未来回望的历史，明天是此刻畅想的未来。」<br>
              一百一十一载，河海人把论文写在江河湖海之上；<br>
              当算法的潮水漫过堤岸，我们仍以水的方式思考——汇流、蓄势、穿峡、入海。
            </div>

            <div class="ab-foot">
              大哉河海，奔流不息 · 治水兴国，弦歌不辍<br>
              © 2026 · 本作品为原创参赛作品，素材版权归河海大学及相关权利人所有
            </div>
          </div>
        </div>`;
      p.dataset.built = "1";
    }

    cv = document.getElementById("about-cv");
    ctx = cv.getContext("2d");
    stars = [];
    for (let i = 0; i < 220; i++) {
      stars.push({ x: Math.random(), y: Math.random(), r: U.rand(.4, 1.8), tw: U.rand(0, 9), v: U.rand(.006, .03) });
    }
    L.loop(() => {
      const f = U.fitCanvas(cv);
      const { ctx: c, w, h } = f;
      c.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.tw += s.v * .06;
        s.y -= s.v * .0006;
        if (s.y < -.02) s.y = 1.02;
        const a = .25 + .6 * Math.abs(Math.sin(s.tw));
        c.fillStyle = `rgba(180,215,255,${a * .8})`;
        c.beginPath(); c.arc(s.x * w, s.y * h, s.r, 0, U.TAU); c.fill();
      }
    });
  }

  function leave() {
    if (L) { L.kill(); L = null; }
    const p = document.getElementById("page-about");
    if (p) p.querySelector("#about-root") && (p.querySelector("#about-root").scrollTop = 0);
  }

  App.register("about", { enter, leave });
})();

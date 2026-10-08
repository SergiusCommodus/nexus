/* Astro: shared starfield background + launch intro.
   Set window.ASTRO_INTRO = 'short' before loading for a quicker intro, or 'off' to skip it. */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mode = window.ASTRO_INTRO || 'full';
  const SOUND = new URL('intro.mp3', (document.currentScript && document.currentScript.src) || location.href).href;
  const MARK = '<svg viewBox="0 0 64 64" aria-hidden="true" class="nx-mark"><defs><linearGradient id="nxig" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B9A8FF"/><stop offset=".55" stop-color="#7C5CFF"/><stop offset="1" stop-color="#3FD0F0"/></linearGradient><linearGradient id="nxio" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#DCD4FF"/></linearGradient><mask id="nxim" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64"><rect width="64" height="64" fill="#fff"/><path transform="rotate(-18 32 34)" d="M4 34A28 9.5 0 0 0 60 34" fill="none" stroke="#000" stroke-width="8.6" stroke-linecap="round"/></mask></defs><path class="nx-orbit" transform="rotate(-18 32 34)" d="M4 34A28 9.5 0 0 1 60 34" fill="none" stroke="url(#nxig)" stroke-width="3.4" stroke-linecap="round"/><path class="nx-n" d="M17.5 51L32 12L46.5 51" fill="none" stroke="url(#nxio)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" mask="url(#nxim)"/><path class="nx-orbit" transform="rotate(-18 32 34)" d="M4 34A28 9.5 0 0 0 60 34" fill="none" stroke="url(#nxig)" stroke-width="3.4" stroke-linecap="round"/><circle class="nx-moon" cx="58.6" cy="25.3" r="4.4" fill="#3FD0F0"/><path class="nx-star" d="M49 9l1.3 3.2L53.5 13.5l-3.2 1.3L49 18l-1.3-3.2L44.5 13.5l3.2-1.3z" fill="#fff"/></svg>';

  const css = `
  html { background-color: #04050C; -webkit-tap-highlight-color: transparent; }
  #nx-stars { position: fixed; inset: 0; width: 100%; height: 100%; z-index: -1; pointer-events: none; background-color: #04050C; background-image: radial-gradient(1200px 800px at 85% -10%, rgba(124,92,255,.22), transparent 60%), radial-gradient(900px 700px at -10% 110%, rgba(63,208,240,.13), transparent 60%); }
  a, button { touch-action: manipulation; }
  #nx-intro { position: fixed; inset: 0; z-index: 9999; background: #02030A; display: grid; place-items: center; overflow: hidden; cursor: pointer; transition: opacity .7s cubic-bezier(.2,.8,.2,1), transform .9s cubic-bezier(.2,.8,.2,1); }
  #nx-intro canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
  #nx-intro .nx-c { position: relative; display: flex; flex-direction: column; align-items: center; gap: 18px; text-align: center; color: #fff; font-family: "Bricolage Grotesque", "Avenir Next", system-ui, sans-serif; }
  #nx-intro .nx-mark { width: 120px; height: 120px; overflow: visible; filter: drop-shadow(0 0 24px rgba(124,92,255,.65)); opacity: 0; transform: scale(.4) rotate(-40deg); }
  #nx-intro.go .nx-mark { animation: nxIn .9s var(--d, .9s) cubic-bezier(.2,1.3,.3,1) forwards; }
  #nx-intro .nx-orbit, #nx-intro .nx-gap { stroke-dasharray: 140; stroke-dashoffset: 140; }
  #nx-intro.go .nx-orbit, #nx-intro.go .nx-gap { animation: nxDraw 1.1s calc(var(--d, .9s) + .2s) cubic-bezier(.2,.8,.2,1) forwards; }
  #nx-intro .nx-moon { opacity: 0; }
  #nx-intro.go .nx-moon { animation: nxPop .4s calc(var(--d, .9s) + 1s) ease-out forwards; }
  #nx-intro .nx-word { font-weight: 800; font-size: clamp(40px, 9vw, 76px); letter-spacing: .9em; margin-right: -.9em; opacity: 0; line-height: 1; background: linear-gradient(90deg, #fff, #CFC4FF 50%, #9BE7F7); -webkit-background-clip: text; background-clip: text; color: transparent; }
  #nx-intro.go .nx-word { animation: nxWord 1.1s calc(var(--d, .9s) + .35s) cubic-bezier(.2,.8,.2,1) forwards; }
  #nx-intro .nx-tag { font-family: "Figtree", system-ui, sans-serif; font-size: 15px; letter-spacing: .3em; text-transform: uppercase; color: #A3ABD1; opacity: 0; }
  #nx-intro.go .nx-tag { animation: nxPop .8s calc(var(--d, .9s) + .9s) ease-out forwards; }
  #nx-intro .nx-skip { position: absolute; bottom: calc(24px + env(safe-area-inset-bottom, 0px)); left: 0; right: 0; text-align: center; font: 600 12px "Figtree", system-ui, sans-serif; letter-spacing: .2em; text-transform: uppercase; color: rgba(255,255,255,.35); }
  #nx-intro.out { opacity: 0; transform: scale(1.15); pointer-events: none; }

  #nx-intro .nx-gate { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; transition: opacity .35s ease, transform .35s ease; }
  #nx-intro.entered .nx-gate { opacity: 0; transform: scale(.9); pointer-events: none; }
  #nx-intro .nx-enter { display: inline-flex; align-items: center; gap: 12px; padding: 14px 26px 14px 16px; border-radius: 999px; border: 1px solid rgba(185,168,255,.45); background: rgba(20,16,60,.55); color: #fff; font: 700 18px "Figtree", system-ui, sans-serif; letter-spacing: .04em; cursor: pointer; box-shadow: 0 0 0 0 rgba(124,92,255,.55), 0 10px 40px -10px rgba(124,92,255,.8); animation: nxPulse 2.2s ease-out infinite; -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); }
  #nx-intro .nx-enter:hover { background: rgba(60,40,150,.6); }
  #nx-intro .nx-enter:focus-visible { outline: 2px solid #B9A8FF; outline-offset: 4px; }
  #nx-intro .nx-mini { width: 40px; height: 40px; overflow: visible; filter: drop-shadow(0 0 10px rgba(124,92,255,.7)); }
  #nx-intro .nx-sound { font: 600 12px "Figtree", system-ui, sans-serif; letter-spacing: .2em; text-transform: uppercase; color: rgba(255,255,255,.45); }
  #nx-intro .nx-skip { opacity: 0; transition: opacity .4s 1s; }
  #nx-intro.entered .nx-skip { opacity: 1; }
  @keyframes nxPulse { 0% { box-shadow: 0 0 0 0 rgba(124,92,255,.55), 0 10px 40px -10px rgba(124,92,255,.8); } 70% { box-shadow: 0 0 0 18px rgba(124,92,255,0), 0 10px 40px -10px rgba(124,92,255,.8); } 100% { box-shadow: 0 0 0 0 rgba(124,92,255,0), 0 10px 40px -10px rgba(124,92,255,.8); } }
  @keyframes nxIn { to { opacity: 1; transform: none; } }
  @keyframes nxDraw { to { stroke-dashoffset: 0; } }
  @keyframes nxPop { to { opacity: 1; } }
  @keyframes nxWord { to { opacity: 1; letter-spacing: .32em; margin-right: -.32em; } }
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // ---------- background starfield ----------
  const cv = document.createElement('canvas'); cv.id = 'nx-stars'; cv.setAttribute('aria-hidden', 'true');
  document.body.prepend(cv);
  const ctx = cv.getContext('2d');
  let W, H, DPR, stars = [], shoot = null, nextShoot = performance.now() + 3000;
  const TINTS = ['255,255,255', '255,255,255', '255,255,255', '200,190,255', '170,230,255', '255,236,210'];
  function size() {
    const small = innerWidth < 700;
    DPR = Math.min(devicePixelRatio || 1, small ? 1.5 : 2); W = innerWidth; H = innerHeight;
    cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const n = Math.round(W * H / (small ? 3400 : 2600));
    stars = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() < .08 ? 1.1 + Math.random() * .9 : .3 + Math.random() * .8, a: .35 + Math.random() * .65, tw: .5 + Math.random() * 2.2, ph: Math.random() * 6.3, z: .2 + Math.random() * .8, c: TINTS[Math.floor(Math.random() * TINTS.length)] }));
  }
  let paused = false, last = 0;
  document.addEventListener('visibilitychange', () => { paused = document.hidden; if (!paused && !reduce) requestAnimationFrame(frame); });
  function frame(t) {
    if (paused) return;
    if (t - last < 24) { requestAnimationFrame(frame); return; } // ~40fps is plenty for a backdrop
    last = t;
    ctx.clearRect(0, 0, W, H);
    const drift = reduce ? 0 : t * .004;
    for (const s of stars) {
      const tw = reduce ? 1 : .55 + .45 * Math.sin(t * .001 * s.tw + s.ph);
      let x = (s.x - drift * s.z) % W; if (x < 0) x += W;
      ctx.globalAlpha = s.a * tw; ctx.fillStyle = `rgb(${s.c})`;
      ctx.beginPath(); ctx.arc(x, s.y, s.r, 0, 6.283); ctx.fill();
      if (s.r > 1.3) { ctx.globalAlpha = s.a * tw * .18; ctx.beginPath(); ctx.arc(x, s.y, s.r * 3.2, 0, 6.283); ctx.fill(); }
    }
    if (!reduce) {
      if (!shoot && t > nextShoot) { const ang = .35 + Math.random() * .3; shoot = { x: Math.random() * W * .8, y: Math.random() * H * .4, vx: Math.cos(ang) * 11, vy: Math.sin(ang) * 11, life: 0 }; }
      if (shoot) {
        shoot.life++; shoot.x += shoot.vx; shoot.y += shoot.vy;
        const g = ctx.createLinearGradient(shoot.x, shoot.y, shoot.x - shoot.vx * 10, shoot.y - shoot.vy * 10);
        g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(160,140,255,0)');
        ctx.globalAlpha = Math.max(0, 1 - shoot.life / 55); ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(shoot.x, shoot.y); ctx.lineTo(shoot.x - shoot.vx * 10, shoot.y - shoot.vy * 10); ctx.stroke();
        if (shoot.life > 55) { shoot = null; nextShoot = t + 5000 + Math.random() * 7000; }
      }
    }
    ctx.globalAlpha = 1;
    if (!reduce) requestAnimationFrame(frame);
  }
  size(); let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (Math.abs(innerWidth - W) < 2 && Math.abs(innerHeight - H) < 120) return; size(); if (reduce) frame(0); }, 150); });
  requestAnimationFrame(frame);

  // ---------- launch intro: tap to enter, then sound + warp ----------
  let seen = false; try { seen = sessionStorage.getItem('nx-intro') === '1'; } catch (e) {}
  if (mode === 'off' || reduce || seen) return;
  const short = mode === 'short';
  const total = short ? 2200 : 4300;
  const audio = new Audio(SOUND); audio.preload = 'auto'; audio.volume = .9;
  const ov = document.createElement('div'); ov.id = 'nx-intro'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Welcome to Astro');
  ov.style.setProperty('--d', short ? '.25s' : '.9s');
  ov.innerHTML = `<canvas></canvas>
    <div class="nx-c">${MARK}<div class="nx-word">ASTRO</div>${short ? '' : '<div class="nx-tag">Your crew, in one orbit</div>'}</div>
    <div class="nx-gate"><button type="button" class="nx-enter" aria-label="Enter Astro with sound">${MARK.replace('class="nx-mark"', 'class="nx-mini"').replace(/nxi/g, 'nxj').replace(/ class="nx-(orbit|gap|n|moon|star)"/g, '')}<span>Tap to enter</span></button><div class="nx-sound"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:6px"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg>Sound on</div></div>
    <div class="nx-skip">Tap to skip</div>`;
  document.body.appendChild(ov);
  document.documentElement.classList.add('nx-wait');
  const prevOverflow = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden';
  const ic = ov.querySelector('canvas'), ix = ic.getContext('2d');
  let IW, IH;
  const isz = () => { const d = Math.min(devicePixelRatio || 1, 2); IW = innerWidth; IH = innerHeight; ic.width = IW * d; ic.height = IH * d; ix.setTransform(d, 0, 0, d, 0, 0); };
  isz(); addEventListener('resize', isz);
  const warp = Array.from({ length: 420 }, () => ({ x: (Math.random() - .5) * 2, y: (Math.random() - .5) * 2, z: Math.random() }));
  let t0 = 0, started = false, done = false;
  setTimeout(() => ov.querySelector('.nx-enter').focus({ preventScroll: true }), 50);
  function wf(t) {
    if (done) return;
    let sp;
    if (!started) sp = .0025; // slow drift while waiting at the gate
    else {
      const e = (t - t0) / 1000;
      // fast warp first, settling into a slow drift as the logo arrives
      sp = short ? Math.max(.004, .05 * Math.exp(-e * 3)) : (e < 1 ? .012 + e * .06 : Math.max(.003, .072 * Math.exp(-(e - 1) * 2.2)));
    }
    ix.fillStyle = 'rgba(2,3,10,.35)'; ix.fillRect(0, 0, IW, IH);
    const cx = IW / 2, cy = IH / 2, f = Math.max(IW, IH) * .5;
    for (const s of warp) {
      const pz = s.z; s.z -= sp; if (s.z <= .02) { s.x = (Math.random() - .5) * 2; s.y = (Math.random() - .5) * 2; s.z = 1; continue; }
      const x1 = cx + s.x / pz * f * .5, y1 = cy + s.y / pz * f * .5, x2 = cx + s.x / s.z * f * .5, y2 = cy + s.y / s.z * f * .5;
      const b = Math.min(1, (1 - s.z) * 1.4);
      ix.strokeStyle = `rgba(${s.x > 0 ? '210,200,255' : '190,235,255'},${b})`; ix.lineWidth = Math.max(.5, (1 - s.z) * 2.2);
      ix.beginPath(); ix.moveTo(x1, y1); ix.lineTo(x2, y2); ix.stroke();
    }
    requestAnimationFrame(wf);
  }
  requestAnimationFrame(wf);
  function fadeOut() {
    // the clip fades out on its own; this just speeds it up where the browser allows volume changes
    const v0 = audio.volume, t1 = performance.now();
    (function step(t) { const k = Math.min(1, (t - t1) / 1800); try { audio.volume = v0 * (1 - k); } catch (e) {} if (k < 1) requestAnimationFrame(step); else audio.pause(); })(t1);
  }
  function start() {
    if (started) return; started = true; t0 = performance.now();
    try { sessionStorage.setItem('nx-intro', '1'); } catch (e) {}
    try { const pr = audio.play(); if (pr && pr.catch) pr.catch(() => {}); } catch (e) {}
    ov.classList.add('go', 'entered');
    setTimeout(end, total);
  }
  function end() {
    if (done) return; done = true; ov.classList.add('out');
    document.documentElement.style.overflow = prevOverflow; document.documentElement.classList.remove('nx-wait');
    setTimeout(() => { ov.remove(); removeEventListener('resize', isz); }, 900);
    setTimeout(fadeOut, 1200);
    document.dispatchEvent(new Event('astro:ready'));
  }
  ov.addEventListener('click', () => { if (!started) start(); else end(); });
  function onKey(e) { if (done) return removeEventListener('keydown', onKey); if (!started) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); start(); } } else end(); }
  addEventListener('keydown', onKey);
})();

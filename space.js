/* Nexus: shared starfield background + launch intro.
   Set window.NEXUS_INTRO = 'short' before loading for a quicker intro, or 'off' to skip it. */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mode = window.NEXUS_INTRO || 'full';
  const MARK = '<svg viewBox="0 0 64 64" aria-hidden="true" class="nx-mark"><defs><linearGradient id="nxg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B9A8FF"/><stop offset=".55" stop-color="#7C5CFF"/><stop offset="1" stop-color="#3FD0F0"/></linearGradient></defs>'
    + '<ellipse class="nx-orbit" cx="32" cy="32" rx="29" ry="11" transform="rotate(-25 32 32)" fill="none" stroke="url(#nxg)" stroke-width="2.4"/>'
    + '<path class="nx-n" d="M20 44V20l24 24V20" fill="none" stroke="#fff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<circle class="nx-moon" cx="58.3" cy="19.7" r="4" fill="#3FD0F0"/></svg>';

  const css = `
  html { background: #04050C radial-gradient(1200px 800px at 85% -10%, rgba(124,92,255,.22), transparent 60%) fixed, radial-gradient(900px 700px at -10% 110%, rgba(63,208,240,.13), transparent 60%) fixed; }
  #nx-stars { position: fixed; inset: 0; width: 100%; height: 100%; z-index: -1; pointer-events: none; }
  #nx-intro { position: fixed; inset: 0; z-index: 9999; background: #02030A; display: grid; place-items: center; overflow: hidden; cursor: pointer; transition: opacity .7s cubic-bezier(.2,.8,.2,1), transform .9s cubic-bezier(.2,.8,.2,1); }
  #nx-intro canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
  #nx-intro .nx-c { position: relative; display: flex; flex-direction: column; align-items: center; gap: 18px; text-align: center; color: #fff; font-family: "Bricolage Grotesque", "Avenir Next", system-ui, sans-serif; }
  #nx-intro .nx-mark { width: 120px; height: 120px; overflow: visible; filter: drop-shadow(0 0 24px rgba(124,92,255,.65)); opacity: 0; transform: scale(.4) rotate(-40deg); }
  #nx-intro.go .nx-mark { animation: nxIn .9s var(--d, .9s) cubic-bezier(.2,1.3,.3,1) forwards; }
  #nx-intro .nx-orbit { stroke-dasharray: 140; stroke-dashoffset: 140; }
  #nx-intro.go .nx-orbit { animation: nxDraw 1.1s calc(var(--d, .9s) + .2s) cubic-bezier(.2,.8,.2,1) forwards; }
  #nx-intro .nx-moon { opacity: 0; }
  #nx-intro.go .nx-moon { animation: nxPop .4s calc(var(--d, .9s) + 1s) ease-out forwards; }
  #nx-intro .nx-word { font-weight: 800; font-size: clamp(40px, 9vw, 76px); letter-spacing: .9em; margin-right: -.9em; opacity: 0; line-height: 1; background: linear-gradient(90deg, #fff, #CFC4FF 50%, #9BE7F7); -webkit-background-clip: text; background-clip: text; color: transparent; }
  #nx-intro.go .nx-word { animation: nxWord 1.1s calc(var(--d, .9s) + .35s) cubic-bezier(.2,.8,.2,1) forwards; }
  #nx-intro .nx-tag { font-family: "Figtree", system-ui, sans-serif; font-size: 15px; letter-spacing: .3em; text-transform: uppercase; color: #A3ABD1; opacity: 0; }
  #nx-intro.go .nx-tag { animation: nxPop .8s calc(var(--d, .9s) + .9s) ease-out forwards; }
  #nx-intro .nx-skip { position: absolute; bottom: calc(24px + env(safe-area-inset-bottom, 0px)); left: 0; right: 0; text-align: center; font: 600 12px "Figtree", system-ui, sans-serif; letter-spacing: .2em; text-transform: uppercase; color: rgba(255,255,255,.35); }
  #nx-intro.out { opacity: 0; transform: scale(1.15); pointer-events: none; }
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
    DPR = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
    cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const n = Math.round(W * H / 2600);
    stars = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() < .08 ? 1.1 + Math.random() * .9 : .3 + Math.random() * .8, a: .35 + Math.random() * .65, tw: .5 + Math.random() * 2.2, ph: Math.random() * 6.3, z: .2 + Math.random() * .8, c: TINTS[Math.floor(Math.random() * TINTS.length)] }));
  }
  function frame(t) {
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
  size(); addEventListener('resize', () => { size(); if (reduce) frame(0); });
  requestAnimationFrame(frame);

  // ---------- launch intro ----------
  if (mode === 'off' || reduce) return;
  const short = mode === 'short';
  const total = short ? 1900 : 3300;
  const ov = document.createElement('div'); ov.id = 'nx-intro'; ov.setAttribute('role', 'presentation');
  ov.style.setProperty('--d', short ? '.25s' : '.9s');
  ov.innerHTML = `<canvas></canvas><div class="nx-c">${MARK}<div class="nx-word">NEXUS</div>${short ? '' : '<div class="nx-tag">Your crew, in one orbit</div>'}</div><div class="nx-skip">Tap to skip</div>`;
  document.body.appendChild(ov);
  document.documentElement.classList.add('nx-wait');
  const prevOverflow = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden';
  const ic = ov.querySelector('canvas'), ix = ic.getContext('2d');
  let IW, IH;
  const isz = () => { const d = Math.min(devicePixelRatio || 1, 2); IW = innerWidth; IH = innerHeight; ic.width = IW * d; ic.height = IH * d; ix.setTransform(d, 0, 0, d, 0, 0); };
  isz();
  const warp = Array.from({ length: 420 }, () => ({ x: (Math.random() - .5) * 2, y: (Math.random() - .5) * 2, z: Math.random() }));
  const t0 = performance.now(); let done = false;
  ov.classList.add('go');
  function wf(t) {
    if (done) return;
    const e = (t - t0) / 1000;
    // speed: fast warp at first, settling into a slow drift as the logo arrives
    const sp = short ? Math.max(.004, .05 * Math.exp(-e * 3)) : (e < .9 ? .012 + e * .06 : Math.max(.003, .066 * Math.exp(-(e - .9) * 2.6)));
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
  function end() {
    if (done) return; done = true; ov.classList.add('out');
    document.documentElement.style.overflow = prevOverflow; document.documentElement.classList.remove('nx-wait');
    setTimeout(() => ov.remove(), 900);
    document.dispatchEvent(new Event('nexus:ready'));
  }
  ov.addEventListener('click', end);
  addEventListener('keydown', end, { once: true });
  setTimeout(end, total);
})();

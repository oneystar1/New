// IRON DIAMOND — bootstrap: canvas sizing, main loop, touch pad, test hooks.
'use strict';
(function () {
  const cv = document.getElementById('game'), ctx = cv.getContext('2d');
  const params = new URLSearchParams(location.search);
  let scale = 1;
  function resize() {
    const r = cv.getBoundingClientRect(); const dpr = Math.min(FX.high ? 2 : 1.25, window.devicePixelRatio || 1);
    const bw = Math.max(320, Math.round(r.width * dpr)), bh = Math.round(bw * H / W);
    if (cv.width !== bw) { cv.width = bw; cv.height = bh; }
    scale = bw / W;
  }
  addEventListener('resize', resize); resize();
  Input.init();
  Input.onKey = code => { if (code === 'KeyM') Sfx.toggleMute(); };

  // focus / audio unlock overlay
  const focus = document.getElementById('focus');
  const unlock = () => { Sfx.init(); if (focus) focus.hidden = true; cv.focus(); };
  if (params.has('auto')) { if (focus) focus.hidden = true; }
  addEventListener('pointerdown', unlock, { once: false }); addEventListener('keydown', unlock, { once: true });

  // tap the picture: hit a menu item / team card, or act as A outside a live match
  cv.addEventListener('pointerdown', e => {
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
    const z = (Game.taps || []).slice().reverse().find(t => x >= t.x && x <= t.x + t.w && y >= t.y && y <= t.y + t.h);
    if (z) { e.preventDefault(); z.fn(); return; }
    const sc = Game.scene, live = sc instanceof GameScene && !sc.paused && !sc.m.over;
    if (!live && !(Game.taps || []).length) Input.touchLatch.a = true;
  });
  // touch controls
  const touchEl = document.getElementById('touch');
  if (touchEl) {
    const bind = el => {
      const k = el.dataset.k; const on = e => { e.preventDefault(); Input.touch[k] = true; Input.touchLatch[k] = true; el.classList.add('on'); unlock(); }; const off = e => { e.preventDefault(); Input.touch[k] = false; el.classList.remove('on'); };
      el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('pointerleave', off);
    };
    touchEl.querySelectorAll('[data-k]').forEach(bind);
    // d-pad: slide between directions
    const dpad = document.getElementById('dpad');
    if (dpad) {
      const set = e => { const r = dpad.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; Input.touch.left = x < -0.17; Input.touch.right = x > 0.17; Input.touch.up = y < -0.17; Input.touch.down = y > 0.17; };
      const clear = () => { Input.touch.left = Input.touch.right = Input.touch.up = Input.touch.down = false; };
      dpad.addEventListener('pointerdown', e => { e.preventDefault(); dpad.setPointerCapture(e.pointerId); set(e); unlock(); });
      dpad.addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'touch') set(e); });
      dpad.addEventListener('pointerup', clear); dpad.addEventListener('pointercancel', clear);
    }
    if (matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');
  }

  const fsb = document.getElementById('fs');
  if (fsb) {
    const el = document.documentElement; if (!(document.fullscreenEnabled || document.webkitFullscreenEnabled)) fsb.hidden = true;
    fsb.addEventListener('click', e => { e.preventDefault(); unlock(); const req = el.requestFullscreen || el.webkitRequestFullscreen; if (document.fullscreenElement) { document.exitFullscreen && document.exitFullscreen(); return; }
      if (req) Promise.resolve(req.call(el)).then(() => { try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => { }); } catch (e) { } }).catch(() => { fsb.hidden = true; }); });
  }
  // start scene (test hooks: ?demo=1 runs CPU vs CPU, ?speed=N fast-forwards)
  if (params.has('fx')) { Game.settings.fx = params.get('fx'); applyFx(); }
  const speed = Math.max(1, Math.min(32, +params.get('speed') || 1));
  if (params.has('demo')) {
    const a = +(params.get('away') ?? Math.floor(Math.random() * 12)), b = +(params.get('home') ?? (a + 1 + Math.floor(Math.random() * 11)) % 12);
    const cfg = { teams: [a, b], rosters: [buildRoster(a), buildRoster(b)], ctrl: [null, null], innings: +(params.get('innings') || 3), diff: 1, clash: params.get('clash') !== '0', speed };
    Game.set(new GameScene(cfg, m => { window.__lastMatch = m; Game.set(new ResultScene(m, null)); }));
  } else Game.set(new TitleScene());

  window.ID = { Game, Input, TEAMS, buildRoster, Match, GameScene, Park, get scene() { return Game.scene; }, errors: [] };
  addEventListener('error', e => window.ID.errors.push(String(e.message)));

  let last = performance.now(), acc = 0; const STEP = 1 / 60;
  // bloom: highlights extracted by squaring the image twice at low resolution, then added back blurred
  const bA = document.createElement('canvas'), bB = document.createElement('canvas'), bC = document.createElement('canvas');
  const xA = bA.getContext('2d'), xB = bB.getContext('2d'), xC = bC.getContext('2d');
  bA.width = bB.width = 240; bA.height = bB.height = 135; bC.width = 80; bC.height = 45;
  function bloom() {
    xA.globalCompositeOperation = 'copy'; xA.drawImage(cv, 0, 0, 240, 135);
    for (let i = 0; i < 3; i++) { xB.globalCompositeOperation = 'copy'; xB.drawImage(bA, 0, 0); xA.globalCompositeOperation = 'multiply'; xA.drawImage(bB, 0, 0); }
    xC.globalCompositeOperation = 'copy'; xC.drawImage(bA, 0, 0, 80, 45);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true; ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.45; ctx.drawImage(bA, 0, 0, cv.width, cv.height); ctx.globalAlpha = 0.6; ctx.drawImage(bC, 0, 0, cv.width, cv.height); ctx.restore();
  }
  Game.bloom = () => { if (FX.high) bloom(); };
  let toast = '', toastT = 0, slowT = 0, ema = 16;
  window.ID_toast = (m) => { toast = m; toastT = 2.5; };
  function frame(now) {
    const raw = now - last; ema = ema * 0.95 + Math.min(100, raw) * 0.05;
    if (FX.high && FX.auto && document.visibilityState === 'visible' && now > 4000) { slowT = ema > 24 ? slowT + raw / 1000 : 0; if (slowT > 3) { FX.high = false; toast = 'EFFECTS LOWERED FOR SMOOTHER PLAY'; toastT = 3; } }
    Game.touchLand = document.body.classList.contains('touch') && innerWidth > innerHeight;
    acc += Math.min(0.1, (now - last) / 1000); last = now;
    let n = 0;
    while (acc >= STEP && n < 5) {
      Input.poll();
      try { Game.scene.update(STEP); } catch (e) { console.error(e); { const m = String(e && e.stack || e); if (!window.ID.errors.includes(m) && window.ID.errors.length < 20) window.ID.errors.push(m); } }
      acc -= STEP; n++;
    }
    resize();
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    Game.taps = [];
    try { Game.scene.draw(ctx); } catch (e) { const m = String(e && e.stack || e); if (!window.ID.errors.includes(m) && window.ID.errors.length < 20) { console.error(e); window.ID.errors.push(m); } }
    if (Sfx.muted) { txt(ctx, '🔇', W - 18, 18, 14, '#8f9bc0', 'center'); }
    if (toastT > 0) { toastT -= 1 / 60; ctx.globalAlpha = Math.min(1, toastT); txt(ctx, toast, W / 2, 16, 13, '#9fdcff', 'center', FONT_H, 700); ctx.globalAlpha = 1; }
    requestAnimationFrame(frame);
  }
  // wait for webfonts so canvas text uses them
  const go = () => requestAnimationFrame(t => { last = t; frame(t); });
  if (document.fonts && document.fonts.load) Promise.race([Promise.all([document.fonts.load('900 20px Orbitron'), document.fonts.load('700 20px Rajdhani')]), new Promise(r => setTimeout(r, 1500))]).then(go, go); else go();
})();

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
  // touch controls: a thumbstick plus A / B / Start that size themselves to the screen
  const touchEl = document.getElementById('touch');
  if (touchEl) {
    const bind = el => {
      const k = el.dataset.k;
      el.addEventListener('pointerdown', e => { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (x) { } Input.touch[k] = true; Input.touchLatch[k] = true; el.classList.add('on'); unlock(); });
      const off = e => { e.preventDefault(); Input.touch[k] = false; el.classList.remove('on'); };
      el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off);
    };
    touchEl.querySelectorAll('[data-k]').forEach(bind);
    const stick = document.getElementById('stick'), knob = document.getElementById('knob'); let sid = null;
    const DIRS = ['left', 'right', 'up', 'down'];
    const setV = e => {
      const r = stick.getBoundingClientRect(), R = r.width / 2, m = R * 0.6; let dx = e.clientX - (r.left + R), dy = e.clientY - (r.top + R); const l = hyp(dx, dy);
      if (l > m) { dx *= m / l; dy *= m / l; } knob.style.transform = `translate(${dx}px, ${dy}px)`;
      const nx = dx / m, ny = dy / m, th = 0.38, now = { left: nx < -th, right: nx > th, up: ny < -th, down: ny > th };
      for (const d of DIRS) { if (now[d] && !Input.touch[d]) Input.touchLatch[d] = true; Input.touch[d] = now[d]; }
    };
    const clear = () => { sid = null; stick.classList.remove('on'); knob.style.transform = ''; for (const d of DIRS) Input.touch[d] = false; };
    stick.addEventListener('pointerdown', e => { e.preventDefault(); if (sid != null) return; sid = e.pointerId; try { stick.setPointerCapture(sid); } catch (x) { } stick.classList.add('on'); setV(e); unlock(); });
    stick.addEventListener('pointermove', e => { if (e.pointerId === sid) setV(e); });
    stick.addEventListener('pointerup', e => { if (e.pointerId === sid) clear(); }); stick.addEventListener('pointercancel', e => { if (e.pointerId === sid) clear(); });
    if (matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');
  }
  // lay out picture + controls: below the picture when there's room (tablets), floating over it otherwise (phones sideways)
  const stageEl = document.getElementById('stage');
  function layoutTouch() {
    const B = document.body; if (!B.classList.contains('touch')) return;
    const vw = innerWidth, vh = innerHeight, base = Math.min(vw, vh), land = vw > vh;
    let stick = clamp(base * 0.3, 120, 260), btn = clamp(base * 0.15, 64, 132), cw = vw - 32, ch = cw * 9 / 16, overlay = false;
    if (!land) { const room = vh - ch - 90; stick = Math.max(110, Math.min(stick, room * 0.8)); btn = Math.max(60, Math.min(btn, room * 0.4)); }
    else {
      ch = Math.min(vh - 8, cw * 9 / 16); cw = ch * 16 / 9; let room = vh - ch - 16;
      if (room < stick * 0.75) { const need = stick * 0.78, ch2 = vh - need - 16; if (ch2 * 16 / 9 >= vw * 0.75) { ch = ch2; cw = ch * 16 / 9; room = need; } else overlay = true; }
      if (!overlay) { stick = Math.min(stick, room - 6); btn = Math.min(btn, (room - 6) * 0.5); }
    }
    stageEl.style.width = Math.floor(cw) + 'px';
    document.documentElement.style.setProperty('--stick', Math.round(stick) + 'px'); document.documentElement.style.setProperty('--btn', Math.round(btn) + 'px');
    B.classList.toggle('overlay', overlay);
  }
  addEventListener('resize', layoutTouch); addEventListener('orientationchange', () => setTimeout(layoutTouch, 200)); layoutTouch();
  // A / B show what they do right now
  const la = document.getElementById('la'), lb = document.getElementById('lb'); let lastLbl = '';
  function touchLabels() {
    const sc = Game.scene, m = sc && sc.m; let a = 'OK', b = 'BACK';
    if (m && !sc.paused) {
      const hb = m.pad(m.bat) != null, hf = m.pad(m.fld) != null;
      if (m.state === 'pitch') { if (hb) { a = 'SWING'; b = 'POWER'; } else if (hf) { a = m.pt.pickSel ? 'PICKOFF' : 'PITCH'; b = 'TYPE'; } }
      else if (m.state === 'play') { if (hf) { a = m.ball && m.ball.held && m.ball.held.f ? 'THROW' : 'CATCH'; b = '—'; } else if (hb) { a = 'RUN'; b = 'BACK'; } }
      else if (m.state === 'clash') { a = 'STRIKE'; b = 'HEAVY'; }
      else if (m.state === 'replay') { a = 'SKIP'; b = '—'; }
      else { a = '—'; b = '—'; }
    }
    const key = a + '|' + b; if (key !== lastLbl && la && lb) { lastLbl = key; la.textContent = a; lb.textContent = b; }
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
    Game.touchLand = document.body.classList.contains('overlay');
    touchLabels();
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

// IRON DIAMOND — the broadcast booth (play-by-play + color analyst) and a crowd that reacts to the game.
'use strict';
// ------------------------------------------------------------------ BOOTH
// Clips live in voice.js. Keys ending in _N are variant groups ("single_1".."single_6" -> group "single").
// Keys starting with "x" are the color analyst; everything else is the play-by-play caller.
// Priority: 3 = big call (interrupts), 2 = play description, 1 = color. Lines queue FIFO and expire if stale.
const CITY_KEY = { 'NEO TOKYO': 'ntk', DETROIT: 'det', 'NOVA VEGAS': 'nvg', 'LUNAR BASE': 'lun', 'MARS COLONY': 'mar', ATLANTIS: 'atl', 'SILICON VALLEY': 'sil', 'ARCTIC CIRCUIT': 'arc', CAIRO: 'cai', BERLIN: 'ber', RIO: 'rio', SYDNEY: 'syd' };
const Booth = {
  q: [], cur: null, busyUntil: 0, lastColor: -99, recent: [], groups: null, colorGap: 5.5,
  on() { return Sfx.ac && !Sfx.muted && !(typeof Game !== 'undefined' && Game.settings && Game.settings.announcer === false); },
  now() { return Sfx.ac ? Sfx.ac.currentTime : 0; },
  grp() {
    if (this.groups) return this.groups; this.groups = {};
    if (typeof VOICE_CLIPS !== 'undefined') for (const k in VOICE_CLIPS) { const g = k.replace(/_\d+$/, ''); if (g !== k) (this.groups[g] = this.groups[g] || []).push(k); }
    return this.groups;
  },
  pick(cat) { // a variant from a group, avoiding the last few lines used
    const g = this.grp()[cat]; if (!g) return VOICE_CLIPS && VOICE_CLIPS[cat] ? cat : null;
    const fresh = g.filter(k => !this.recent.includes(k)), k = pick(fresh.length ? fresh : g); this.recent.push(k); if (this.recent.length > 14) this.recent.shift(); return k;
  },
  reset() { this.stop(); this.q = []; this.lastColor = -99; },
  stop() { if (this.cur) for (const s of this.cur.srcs) try { s.stop(); } catch (e) { } this.cur = null; this.busyUntil = 0; },
  // queue a line made of clip keys or group names
  line(parts, pri = 2, o = {}) {
    if (!this.on()) return; const now = this.now();
    const keys = parts.map(p => (this.grp()[p] ? this.pick(p) : p)).filter(k => k && Sfx.voice && Sfx.voice[k]);
    if (!keys.length) { Sfx.loadVoice(); return; }
    if (pri === 1) { if (now - this.lastColor < (o.gap ?? this.colorGap)) return; this.lastColor = now; }
    const it = { keys, pri, at: now + (o.delay || 0), exp: now + (o.delay || 0) + (o.ttl ?? (pri === 3 ? 3 : pri === 2 ? 2.4 : 3.5)) };
    if (pri === 3) { if (this.cur && this.cur.pri < 3) this.stop(); this.q = this.q.filter(x => x.pri === 3 || x.at > now + 0.05); }
    else if (pri === 2 && o.cut && this.cur && this.cur.pri === 1) this.stop();
    this.q.push(it); this.pump();
  },
  color(cat, chance = 1, o = {}) { if (Math.random() < chance) this.line([cat], 1, o); },
  pump() {
    if (!this.on()) { this.q = []; return; } const now = this.now();
    this.q = this.q.filter(x => x.exp > now); if (now < this.busyUntil - 0.02) return;
    const i = this.q.findIndex(x => x.at <= now); if (i < 0) return; const it = this.q.splice(i, 1)[0];
    let t = now + 0.02; const srcs = [];
    for (let j = 0; j < it.keys.length; j++) { const r = Sfx.clip(it.keys[j], t, it.keys[j][0] === 'x'); if (!r) continue; srcs.push(r.src); t += r.dur + (j < it.keys.length - 1 ? 0.06 : 0); }
    this.cur = { srcs, pri: it.pri }; this.busyUntil = t + 0.25;
  },
  // ---- game events -> lines
  score(m) { // "Neo Tokyo three, Detroit two" (leader first) or "all tied up at two"
    const [a, b] = m.score, ca = CITY_KEY[m.sides[0].team.city], cb = CITY_KEY[m.sides[1].team.city];
    if (a === b) return a ? ['tied', 'n' + Math.min(20, a)] : null; if (!ca || !cb || a > 20 || b > 20) return null;
    return a > b ? ['city_' + ca, 'n' + a, 'city_' + cb, 'n' + b] : ['city_' + cb, 'n' + b, 'city_' + ca, 'n' + a];
  },
  event(m, ev, d) {
    if (m.cfg.derby || m.cfg.practice || m.cfg.tutorial) return;
    const late = m.inning >= m.innings, diff = Math.abs(m.score[0] - m.score[1]);
    switch (ev) {
      case 'half': {
        if (m.inning === 1 && m.half === 0) { this.color('xfirst', 0.8, { delay: 1.2, ttl: 4 }); break; }
        if (d.updown) this.line(['updown'], 2);
        const parts = m.inning > 9 || m.inning > m.innings ? ['extra'] : [m.half ? 'bot' : 'top', 'ord' + m.inning];
        this.line(parts, 2, { delay: 0.3, ttl: 3 }); const sc = this.score(m); if (sc) this.line(sc, 2, { delay: 0.35, ttl: 5 });
        if (late && m.half === 1 && m.score[1] < m.score[0]) this.line(['last'], 2, { delay: 0.4, ttl: 6 });
        else if (diff >= 6) this.color('xblow', 0.5, { delay: 0.5, ttl: 6 }); else if (late && diff <= 1) this.color('xclose', 0.6, { delay: 0.5, ttl: 6 });
        break;
      }
      case 'newpitch': {
        const on = m.bases.filter(Boolean).length;
        if (d.first) { this.line(['firstp'], 2, { delay: 0.2, ttl: 3 }); break; }
        if (d.newBatter) { if (on === 3) this.line(['loaded'], 2); else if (m.bases[1] || m.bases[2]) { if (Math.random() < 0.35) this.line(['risp'], 2); } else if (m.outs === 2 && Math.random() < 0.2) this.line(['twoout'], 2); if (on === 1 && m.outs === 0 && d.leadoff) this.line(['leadoff'], 2); }
        else if (m.balls === 3 && m.strikes === 2) { if (Math.random() < 0.7) this.line(['full'], 2); }
        else if (m.strikes === 2 && Math.random() < 0.22) this.line(['twostrike'], 2);
        if (d.newBatter && on >= 2 && m.half === 1) this.color('xrally', 0.3);
        break;
      }
      case 'swmiss': if (Math.random() < 0.35) this.line(['swmiss'], 2, { ttl: 1.2 }); break;
      case 'cstrike': if (Math.random() < 0.25) this.line(['cstrike'], 2, { ttl: 1.2 }); break;
      case 'ball': if (Math.random() < 0.18) this.line(['ballc'], 2, { ttl: 1.2 }); break;
      case 'foul': if (d.deep) { this.line(['foul_2'], 2, { ttl: 1.2 }); this.color('xfoul', 0.5); } else if (Math.random() < 0.25) this.line(['foul'], 2, { ttl: 1.2 }); break;
      case 'k': if (!d.swinging || Math.random() < 0.6) this.line([d.swinging ? 'kswing' : 'klook'], 2, { ttl: 3 }); this.color('xk', 0.4, { delay: 0.2 }); break;
      case 'walk': if (Math.random() < 0.5) this.line(['walk'], 2); this.color('xwalk', 0.35); break;
      case 'hbp': this.line(['hbp'], 2); this.color('xhbp', 0.5); break;
      case 'contact': if (d.deep) this.line(['drive'], 2, { cut: true, ttl: 0.8 }); else if (d.v > 150 && d.launch !== 'fly') this.line(['sharp'], 2, { cut: true, ttl: 0.6 }); break;
      case 'hr': this.color('xhr', 0.85, { delay: 0.5, gap: 1 }); break;
      case 'result': {
        if (d.hit) { if (!d.hr) this.line([['', 'single', 'double', 'triple', 'itp'][d.hit]], 2, { cut: true }); this.color(d.hit >= 2 ? 'xxbh' : 'xhit', d.hit >= 2 ? 0.5 : 0.3); }
        else if (d.dp) { this.line(['doubleplay'], 3); this.line(['dp'], 2); this.color('xdp', 0.4); }
        else if (d.great) { this.line(['gcatch'], 2, { cut: true }); this.color('xcatch', 0.7); }
        else if (d.out) { if (Math.random() < 0.6) this.line([d.out === 'fly' ? 'fout' : d.out === 'liner' ? 'lout' : 'gout'], 2); this.color('xout', 0.2); }
        if (d.runs && !d.hr) this.line([d.runs >= 3 ? 'runs3' : d.runs === 2 ? 'runs2' : 'scores'], 2, { ttl: 4 });
        if (d.lead || d.tie) { this.line([d.tie ? 'tie' : 'lead'], 2, { ttl: 6 }); const sc = this.score(m); if (sc) this.line(sc, 2, { ttl: 8 }); if (d.lead) this.color('xlead', 0.5, { ttl: 8 }); }
        else if (d.runs && Math.random() < 0.5) { const sc = this.score(m); if (sc) this.line(sc, 2, { ttl: 6 }); }
        if (d.hit && m.bat === 1 && m.bases.filter(Boolean).length >= 2) this.color('xcrowd', 0.4);
        if ((d.hit >= 2 || d.hr) && m.bat === 0) this.color('xquiet', 0.3);
        break;
      }
      case 'steal': if (Math.random() < 0.6) this.line(['running'], 2, { ttl: 1 }); break;
      case 'stolen': this.color(Math.random() < 0.5 ? 'steal' : 'xsteal', 0.5); break;
      case 'cs': this.line(['cs'], 2); break;
      case 'clash': this.color('xclash', 0.7, { gap: 1 }); break;
      case 'clashwin': this.line(['ko'], 2); break;
      case 'destroyed': this.color('xko', 0.8, { gap: 1 }); break;
      case 'od': this.color('xod', 0.6, { gap: 1 }); break;
      case 'pchange': this.line(['pchange'], 2, { ttl: 4 }); this.color('xpchange', 0.6, { ttl: 6 }); break;
      case 'gameover': { const sc = this.score(m); if (sc) this.line(sc, 2, { ttl: 6, delay: 0.2 }); this.color('xgame', 0.8, { ttl: 8, gap: 0 }); break; }
    }
  },
};

// ------------------------------------------------------------------ CROWD
// Home fans (bottom-half team). Voices are many detuned saw "throats" through vowel formants, so cheers, oohs,
// groans and boos sound like people rather than hiss. Applause is a pre-rendered bank of individual claps.
const VOWELS = { ae: [[660, 6, 1], [1720, 8, 0.5], [2410, 10, 0.25]], oo: [[310, 5, 1], [870, 7, 0.35], [2240, 10, 0.1]], aw: [[570, 6, 1], [840, 7, 0.6], [2410, 10, 0.15]], ah: [[730, 6, 1], [1090, 7, 0.55], [2440, 10, 0.2]], eh: [[530, 6, 1], [1840, 8, 0.45], [2480, 10, 0.2]] };
const Crowd = {
  hype: 0, jump: 0, wave: -1, chant: false, nextBeat: 0, charged: -1, lastShout: 0, bufs: null,
  reset() { this.hype = 0.1; this.jump = 0; this.wave = -1; this.chant = false; this.charged = -1; },
  ok() { return Sfx.ac && !Sfx.muted; },
  build() {
    if (this.bufs || !Sfx.ac) return; const ac = Sfx.ac, sr = ac.sampleRate;
    const clapInto = (d, at, amp) => { const n = Math.floor(sr * 0.018), dec = sr * (0.003 + Math.random() * 0.004), c = 0.1 + Math.random() * 0.14; let lp = 0, prev = 0; for (let i = 0; i < n && at + i < d.length; i++) { const w = Math.random() * 2 - 1, hp = w - prev; prev = w; lp += (hp - lp) * c; d[at + i] += lp * amp * Math.exp(-i / dec); } };
    const app = ac.createBuffer(1, sr * 4, sr), ad = app.getChannelData(0); for (let k = 0; k < 190; k++) clapInto(ad, Math.floor(Math.random() * (ad.length - sr * 0.03)), 0.25 + Math.random() * 0.5);
    const clap = ac.createBuffer(1, Math.floor(sr * 0.12), sr), cd = clap.getChannelData(0); for (let k = 0; k < 26; k++) clapInto(cd, Math.floor(Math.random() * sr * 0.04), 0.3 + Math.random() * 0.4);
    this.bufs = { app, clap };
  },
  // a crowd voice: n throats on a vowel, pitch bending by `bend` over the duration
  vox(vowel, dur, vol, o = {}) {
    if (!this.ok()) return; const ac = Sfx.ac, t = ac.currentTime + (o.when || 0), n = o.n || 14, F = VOWELS[vowel];
    const bus = ac.createGain(), out = ac.createGain(), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2800;
    for (const [f, q, g] of F) { const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q; const gg = ac.createGain(); gg.gain.value = g * 8.5; bus.connect(bp); bp.connect(gg); gg.connect(out); }
    const a = o.attack || 0.18; out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(vol, t + a); out.gain.setValueAtTime(vol, t + Math.max(a, dur * (o.hold || 0.45))); out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    out.connect(lp); Sfx.out(lp, 0.45);
    const lo = o.lo || 105, hi = o.hi || 290;
    for (let i = 0; i < n; i++) {
      const v = ac.createOscillator(), vg = ac.createGain(), f = lo * Math.pow(hi / lo, Math.random()), st = t + Math.random() * (o.spread ?? 0.15);
      v.type = 'sawtooth'; v.frequency.setValueAtTime(f, st); v.frequency.exponentialRampToValueAtTime(f * (o.bend || 1) * (0.94 + Math.random() * 0.12), st + dur * 0.8);
      const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 4 + Math.random() * 3; lg.gain.value = f * 0.025; lfo.connect(lg); lg.connect(v.frequency);
      vg.gain.value = 1 / n; v.connect(vg); vg.connect(bus); v.start(st); lfo.start(st); v.stop(t + dur + 0.1); lfo.stop(t + dur + 0.1);
    }
    // breath: a little noise through the same vowel
    const ns = ac.createBufferSource(), ng = ac.createGain(); ns.buffer = Sfx.noiseBuf; ng.gain.value = 0.06; ns.connect(ng); ng.connect(bus); ns.start(t, Math.random()); ns.stop(t + dur + 0.1);
  },
  applause(dur, vol, o = {}) {
    if (!this.ok()) return; this.build(); const ac = Sfx.ac, t = ac.currentTime + (o.when || 0);
    for (let k = 0; k < (o.layers || 1); k++) {
      const s = ac.createBufferSource(), g = ac.createGain(), bp = ac.createBiquadFilter(); s.buffer = this.bufs.app; s.loop = true; s.playbackRate.value = 0.85 + Math.random() * 0.3; bp.type = 'lowpass'; bp.frequency.value = 3600; bp.Q.value = 0.5; const pk = ac.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 1400; pk.gain.value = 5; bp.connect(pk);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol * 7.5, t + 0.2); g.gain.setValueAtTime(vol * 7.5, t + dur * 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(bp); pk.connect(g); Sfx.out(g, 0.5); s.start(t, Math.random() * 3); s.stop(t + dur + 0.05);
    }
  },
  clap(vol, when = 0) { if (!this.ok()) return; this.build(); const ac = Sfx.ac, s = ac.createBufferSource(), g = ac.createGain(); s.buffer = this.bufs.clap; g.gain.value = vol * 1.1; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200; s.connect(lp); lp.connect(g); Sfx.out(g, 0.6); s.start(ac.currentTime + when); },
  stomp(vol, when = 0) { Sfx.osc('sine', 85, 0.2, vol, { to: 42, when, wet: 0.5 }); Sfx.nz(0.12, vol * 0.5, { type: 'lowpass', f: 380, when, wet: 0.5 }); },
  organ(notes, vol = 0.05) { // [midi, start, dur]
    if (!this.ok()) return; const ac = Sfx.ac, t0 = ac.currentTime;
    for (const [m, st, du] of notes) { const f = 440 * Math.pow(2, (m - 69) / 12), t = t0 + st, g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.setValueAtTime(vol, t + du * 0.85); g.gain.exponentialRampToValueAtTime(0.0001, t + du + 0.12);
      const tr = ac.createOscillator(), tg = ac.createGain(); tr.frequency.value = 6.5; tg.gain.value = vol * 0.25; tr.connect(tg); tg.connect(g.gain); tr.start(t); tr.stop(t + du + 0.2);
      [[1, 1], [2, 0.55], [3, 0.3], [4, 0.22], [6, 0.08]].forEach(([h, a]) => { const o = ac.createOscillator(), og = ac.createGain(); o.type = 'sine'; o.frequency.value = f * h; og.gain.value = a; o.connect(og); og.connect(g); o.start(t); o.stop(t + du + 0.2); });
      Sfx.out(g, 0.55); }
  },
  charge() { this.organ([[67, 0, 0.16], [72, 0.18, 0.16], [76, 0.36, 0.16], [79, 0.54, 0.3], [76, 0.9, 0.14], [79, 1.05, 0.55]]); this.vox('ah', 0.7, 0.16, { when: 1.75, attack: 0.04, bend: 0.85, n: 18, lo: 120, hi: 300, spread: 0.06 }); this.hype = Math.min(1, this.hype + 0.2); this.jump = Math.max(this.jump, 0.4); },
  inningRiff() { const r = pick([[[60, 0, .12], [64, .14, .12], [67, .28, .12], [72, .42, .3], [67, .76, .12], [72, .9, .45]], [[72, 0, .14], [71, .16, .14], [69, .32, .14], [67, .48, .14], [65, .64, .14], [64, .8, .14], [62, .96, .14], [60, 1.12, .5]], [[67, 0, .2], [69, .22, .2], [71, .44, .2], [72, .66, .5], [74, 1.2, .14], [76, 1.36, .6]]]); this.organ(r, 0.04); },
  cheer(k, o = {}) { this.vox('ae', 1.4 + k * 1.6, 0.05 + k * 0.12, { n: 12 + Math.round(k * 10), bend: 1.12, attack: 0.12, ...o }); this.applause(1.2 + k * 2.6, 0.05 + k * 0.1, { layers: k > 0.6 ? 2 : 1, when: 0.3 }); if (k > 0.5) for (let i = 0; i < 3; i++) Sfx.osc('sine', 1900 + Math.random() * 900, 0.4, 0.012 + k * 0.01, { when: 0.3 + Math.random(), to: 2600, attack: 0.05, wet: 0.5 }); },
  groan(k) { this.vox('aw', 1.1 + k, 0.04 + k * 0.08, { bend: 0.72, attack: 0.08, hold: 0.25, lo: 95, hi: 230 }); },
  ooh(k, rise = 1.3) { this.vox('oo', 1.2 + k, 0.04 + k * 0.09, { bend: rise, attack: 0.3, hold: 0.6 }); },
  boo() { this.vox('oo', 1.8, 0.07, { lo: 90, hi: 170, bend: 0.9, attack: 0.2, hold: 0.7, n: 16 }); },
  bump(h, j = 0) { this.hype = clamp(this.hype + h, 0, 1); this.jump = Math.max(this.jump, j); },
  update(dt, m) {
    const late = m.inning >= m.innings, close = Math.abs(m.score[0] - m.score[1]) <= 1, risp = m.bat === 1 && (m.bases[1] || m.bases[2]);
    const base = 0.08 + (late && close ? 0.18 : 0) + (risp ? 0.15 : 0) + (m.strikes === 2 && m.bat === 0 ? 0.1 : 0);
    this.hype += (base - this.hype) * Math.min(1, dt * 0.3); this.jump *= Math.exp(-dt * 1.8);
    if (this.wave >= 0) { this.wave += dt * 0.4; if (this.wave > 1) this.wave = -1; }
    if (!this.ok() || m.cfg.practice || m.cfg.tutorial) return; const now = Sfx.ac.currentTime;
    // two-strike chant (stomp, stomp, CLAP) while the home pitcher gets set
    const pitchSet = m.state === 'pitch' && m.pt && m.pt.stage === 'aim';
    if (this.chant && pitchSet && now >= this.nextBeat) { this.stomp(0.11); this.stomp(0.11, 0.36); this.clap(0.5, 0.72); this.nextBeat = now + 1.45; }
    if (!pitchSet) this.chant = false;
    // stray shouts and whistles when the place is buzzing
    if (this.hype > 0.3 && now - this.lastShout > 1.2 && Math.random() < dt * this.hype * 1.2) { this.lastShout = now; if (Math.random() < 0.5) Sfx.osc('sine', 1800 + Math.random() * 1000, 0.35, 0.015, { to: 2700, attack: 0.04, wet: 0.5 }); else this.vox(pick(['eh', 'ae', 'ah']), 0.45, 0.025, { n: 3, attack: 0.05, spread: 0.02, bend: 1.15 }); }
  },
  event(m, ev, d) {
    if (m.cfg.practice || m.cfg.tutorial) return; const home = m.bat === 1, homeFld = !home; // bottom-half team is home
    switch (ev) {
      case 'newpitch':
        if (m.strikes === 2 && homeFld && !m.cfg.derby) { if (!this.chant) this.nextBeat = Sfx.ac ? Sfx.ac.currentTime + 0.4 : 0; this.chant = true; }
        if (home && d.newBatter && (m.bases[1] || m.bases[2]) && this.charged !== m.inning && Math.random() < 0.6) { this.charged = m.inning; this.charge(); }
        break;
      case 'windup': this.chant = false; break;
      case 'swmiss': case 'cstrike': if (homeFld) { this.clap(0.35); this.clap(0.3, 0.22); } break;
      case 'k': if (homeFld) { this.cheer(0.55); this.bump(0.25, 0.4); } else { this.groan(0.4); this.bump(-0.1); } break;
      case 'walk': if (home) this.applause(1.4, 0.06); break;
      case 'hbp': if (home) { this.boo(); this.bump(0.15); } else this.ooh(0.3); break;
      case 'contact': if (d.deep) { this.ooh(0.7, 1.45); this.bump(0.3, 0.25); } else if (d.v > 150) this.ooh(0.3, 1.2); break;
      case 'foul': if (d.deep) this.groan(0.25); break;
      case 'hr': if (home) { this.cheer(1); this.vox('ah', 3.4, 0.12, { n: 20, bend: 1.05, when: 0.8 }); for (let i = 0; i < 6; i++) this.stomp(0.08, 1.5 + i * 0.36); this.bump(0.8, 1); this.wave = 0; } else { this.groan(0.9); this.bump(-0.3); } break;
      case 'result': {
        if (d.hr) break;
        if (d.hit) { if (home) { this.cheer(0.35 + d.hit * 0.12); this.bump(0.15 + d.hit * 0.08, 0.3 + d.hit * 0.1); } else this.groan(0.2 + d.hit * 0.1); }
        else if (d.out) { if (homeFld) { if (d.great || d.dp) { this.cheer(0.8); this.bump(0.35, 0.6); } else this.applause(1.1, 0.05); } else this.groan(d.dp ? 0.6 : 0.2); }
        if (d.runs && home) this.bump(0.15 * d.runs, 0.5);
        if ((d.lead || d.tie) && home) { this.cheer(0.9); this.bump(0.5, 0.9); if (d.lead) this.wave = 0; } else if (d.lead && !home) { this.groan(0.7); this.hype *= 0.5; }
        break;
      }
      case 'stolen': if (home) this.cheer(0.3); break;
      case 'cs': if (homeFld) this.cheer(0.45); else this.groan(0.35); break;
      case 'clash': this.vox('oo', 1.3, 0.1, { bend: 1.5, attack: 0.1 }); this.bump(0.35, 0.5); break;
      case 'clashwin': if (d.side === 1) this.cheer(0.6); else this.groan(0.4); break;
      case 'destroyed': if (d.side === 1) this.groan(0.5); else this.cheer(0.6); this.bump(0.3, 0.6); break;
      case 'od': this.ooh(0.4, 1.35); break;
      case 'half': if (!m.cfg.derby && (m.inning > 1 || m.half > 0)) { this.inningRiff(); if (homeFld) this.applause(1.5, 0.05, { when: 0.5 }); } break;
      case 'gameover': if (d.winner === 1) { this.cheer(1); this.applause(6, 0.12, { layers: 2, when: 1 }); this.vox('ae', 4, 0.1, { n: 20, when: 1.4 }); this.bump(1, 1); this.wave = 0; this.organ([[72, 1.4, .16], [76, 1.6, .16], [79, 1.8, .16], [84, 2.0, .7]], 0.045); } else if (d.winner === 0) this.groan(1); break;
    }
  },
};

// IRON DIAMOND — real 3D robots (three.js), composited into the 2D canvas with the same camera.
// Each robot is a procedural rig: a pose function computes joint points (hips, knees, shoulders,
// elbows by two-bone IK, hands), then armour pieces are laid between those points every frame.
// World is z-up feet; three is y-up: world (x, y, z) -> three (x, z, -y). Rigs face +Z locally,
// and the robot's right side is -X.
'use strict';
const R3D = { ok: false, frame: 0, rigs: new Map() };
(function () {
  if (!window.THREE) return;
  const T = THREE;
  let renderer, glc;
  try { glc = document.createElement('canvas'); renderer = new T.WebGLRenderer({ canvas: glc, alpha: true, antialias: true, powerPreference: 'high-performance' }); renderer.setClearColor(0x000000, 0); }
  catch (e) { return; }
  const scene = new T.Scene(), camera = new T.PerspectiveCamera(40, W / H, 0.5, 5000);
  const hemi = new T.HemisphereLight(0xd8e6ff, 0x34503a, 1.45); scene.add(hemi);
  const key = new T.DirectionalLight(0xffffff, 1.6); key.position.set(-120, 180, 140); scene.add(key);
  const rim = new T.DirectionalLight(0x88c8ff, 0.8); rim.position.set(160, 90, -200); scene.add(rim);
  const fill = new T.AmbientLight(0x505a78, 0.75); scene.add(fill);
  // shared geometry, scaled per piece
  const GEO = {
    cyl: new T.CylinderGeometry(1, 1, 1, 10), limb: new T.CylinderGeometry(0.82, 1, 1, 8), torso: new T.CylinderGeometry(1, 0.66, 1, 6),
    box: new T.BoxGeometry(1, 1, 1), sph: new T.SphereGeometry(1, 14, 10), oct: new T.OctahedronGeometry(1, 0), cone4: new T.ConeGeometry(1, 1, 4), cone: new T.ConeGeometry(1, 1, 10),
    ring: new T.TorusGeometry(1, 0.22, 6, 18), plane: new T.PlaneGeometry(1, 1), hemi: new T.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
  };
  const matCache = new Map();
  function mats(team, scrap, ghost) {
    const k = team.id + (scrap ? 'S' : '') + (ghost ? 'G' : ''); if (matCache.has(k)) return matCache.get(k);
    const P = scrap ? '#7a7f88' : team.p, S = scrap ? '#3b3f46' : team.s, G = scrap ? '#ffb347' : team.g;
    const std = (c, m, r) => new T.MeshStandardMaterial({ color: new T.Color(c), metalness: m, roughness: r, transparent: !!ghost, opacity: ghost ? 0.45 : 1, flatShading: true });
    const M = { p: std(P, 0.45, 0.36), pd: std(shade(P, -0.32), 0.5, 0.4), s: std(S, 0.4, 0.4), dark: std('#1a1f2c', 0.55, 0.5), steel: std('#8a94a8', 0.75, 0.3),
      glow: new T.MeshBasicMaterial({ color: new T.Color(G), transparent: !!ghost, opacity: ghost ? 0.5 : 1 }), white: new T.MeshBasicMaterial({ color: 0xffffff }),
      visor: new T.MeshStandardMaterial({ color: 0x070a14, metalness: 0.9, roughness: 0.12, emissive: new T.Color(G), emissiveIntensity: 0.55, transparent: !!ghost, opacity: ghost ? 0.5 : 1 }),
      bat: new T.MeshBasicMaterial({ color: new T.Color(shade(G, 0.55)) }), batGrip: std('#1a1f2c', 0.4, 0.6) };
    matCache.set(k, M); return M;
  }
  const numTex = new Map();
  function numberTexture(n, team) {
    const k = team.id + n; if (numTex.has(k)) return numTex.get(k);
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    g.font = `900 78px ${FONT_H}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = team.s; g.shadowColor = team.g; g.shadowBlur = 10; g.fillText(String(n), 64, 68);
    const tx = new T.CanvasTexture(c); numTex.set(k, tx); return tx;
  }
  const DIM = {
    STRIKER: { hip: 3.3, torso: 2.15, shW: 1.1, upA: 1.25, foA: 1.15, th: 1.72, sh: 1.68, limb: 0.26, legs: 'biped', headY: 0.95, chestW: 1.18 },
    RAPTOR: { hip: 3.2, torso: 1.95, shW: 1.0, upA: 1.15, foA: 1.2, th: 1.35, sh: 1.25, ft: 0.95, limb: 0.25, legs: 'digi', headY: 0.85, chestW: 1.08 },
    TITAN: { hip: 1.95, torso: 3.55, shW: 1.95, upA: 1.45, foA: 1.4, limb: 0.4, legs: 'tread', headY: 0.55, chestW: 1.75 },
    VECTOR: { hip: 2.5, torso: 2.25, shW: 1.0, upA: 1.1, foA: 1.05, limb: 0.2, legs: 'hover', headY: 1.05, chestW: 1.1 },
  };
  // ---------------------------------------------------------------- rig construction
  function buildRig(r, team, ghost) {
    const M0 = mats(team, r.scrap, ghost), M = Object.assign({}, M0, { glow: M0.glow.clone() }), root = new T.Group(), P = {}, D = DIM[r.cls] || DIM.STRIKER;
    const add = (name, geo, mat) => { const m = new T.Mesh(geo, mat); root.add(m); P[name] = m; return m; };
    add('pelvis', GEO.box, M.dark); add('torso', GEO.torso, M.p); add('chest', GEO.box, M.s); add('core', GEO.oct, M.glow);
    add('head', r.cls === 'RAPTOR' ? GEO.cone4 : GEO.box, M.p); add('visor', GEO.box, M.visor);
    for (const s of ['L', 'R']) { add('sh' + s, r.cls === 'RAPTOR' ? GEO.cone4 : GEO.sph, M.s); add('ua' + s, GEO.limb, M.p); add('fa' + s, GEO.limb, M.pd); add('el' + s, GEO.sph, M.glow); add('ha' + s, GEO.box, M.dark); }
    const num = new T.Mesh(GEO.plane, new T.MeshBasicMaterial({ map: numberTexture(r.num || 0, r.scrap ? { id: 'SCR', s: '#cccccc', g: '#ffb347' } : team), transparent: true, opacity: ghost ? 0.5 : 1, depthWrite: false }));
    root.add(num); P.num = num;
    if (D.legs === 'biped' || D.legs === 'digi') for (const s of ['L', 'R']) { add('th' + s, GEO.limb, M.p); add('sn' + s, GEO.limb, M.pd); add('kn' + s, GEO.sph, M.glow); add('ft' + s, GEO.box, M.s); if (D.legs === 'digi') add('an' + s, GEO.limb, M.dark); }
    if (D.legs === 'digi') { for (let i = 0; i < 5; i++) add('tail' + i, GEO.box, i % 2 ? M.pd : M.p); add('tailTip', GEO.sph, M.glow); add('bladeL', GEO.cone4, M.s); add('bladeR', GEO.cone4, M.s); add('crest', GEO.cone4, M.s); }
    if (D.legs === 'tread') { add('tread', GEO.box, M.dark); add('skirt', GEO.box, M.s); for (let i = 0; i < 6; i++) add('wh' + i, GEO.cyl, M.steel); add('vent', GEO.box, M.glow); }
    if (D.legs === 'hover') { add('wingL', GEO.box, M.s); add('wingR', GEO.box, M.s); add('jet', GEO.cone, M.glow); add('neck', GEO.cyl, M.glow); add('fin', GEO.cone4, M.s); }
    for (const s of ['L', 'R']) { add('faG' + s, GEO.box, M.s); add('faS' + s, GEO.box, M.glow); }
    if (D.legs === 'biped' || D.legs === 'digi') for (const s of ['L', 'R']) { add('thG' + s, GEO.box, M.p); add('thS' + s, GEO.box, M.glow); add('snG' + s, GEO.box, M.s); }
    if (D.legs !== 'hover') { add('pack', GEO.box, M.pd); add('thrL', GEO.cyl, M.steel); add('thrR', GEO.cyl, M.steel); add('flL', GEO.cone, M.glow); add('flR', GEO.cone, M.glow); }
    if (r.cls === 'STRIKER' || r.cls === 'VECTOR') { P.head.geometry = GEO.sph; add('earL', GEO.cyl, M.s); add('earR', GEO.cyl, M.s); add('ant', GEO.cyl, M.steel); add('antT', GEO.sph, M.glow); }
    add('bat', GEO.limb, M.bat); add('batGrip', GEO.cyl, M.batGrip); add('ball', GEO.sph, M.white);
    root.traverse(o => { o.frustumCulled = false; });
    scene.add(root); return { root, P, D, M, r, team, ghost, seen: 0 };
  }
  // ---------------------------------------------------------------- math helpers
  const V = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z), UP = V(0, 1, 0), tv = V(), tq = new T.Quaternion(), tq2 = new T.Quaternion();
  function seg(m, a, b, rx, rz = rx, twist = 0) { tv.subVectors(b, a); const len = Math.max(0.01, tv.length()); m.position.copy(a).addScaledVector(tv, 0.5); tv.divideScalar(len); m.quaternion.setFromUnitVectors(UP, tv); if (twist) { tq2.setFromAxisAngle(UP, twist); m.quaternion.multiply(tq2); } m.scale.set(rx, len, rz); m.visible = true; }
  function put(m, p, sx, sy, sz, yaw = 0, pitch = 0, roll = 0) { m.position.copy(p); m.rotation.set(pitch, yaw, roll, 'YXZ'); m.scale.set(sx, sy, sz); m.visible = true; }
  function ik(S, Tg, a, b, pole) {
    const d = V().subVectors(Tg, S); let L = d.length(); const max = (a + b) * 0.999; if (L > max) { d.multiplyScalar(max / L); L = max; } const dir = d.clone().normalize();
    const along = (a * a - b * b + L * L) / (2 * L), h = Math.sqrt(Math.max(0, a * a - along * along));
    const pp = pole.clone().addScaledVector(dir, -pole.dot(dir)).normalize(); return { E: S.clone().addScaledVector(dir, along).addScaledVector(pp, h), Tg: S.clone().add(d) };
  }
  const rotY = (v, a) => { const c = Math.cos(a), s = Math.sin(a); return V(v.x * c + v.z * s, v.y, -v.x * s + v.z * c); };
  // world (feet, z-up) -> rig local (three axes, rig facing +Z) given the rig transform
  function toLocal(rig, wx, wy, wz) { const p = V(wx, wz, -wy).sub(rig.root.position).divideScalar(rig.root.scale.x); return rotY(p, -rig.root.rotation.y); }
  function dirLocal(rig, dx, dy, dz) { return rotY(V(dx, dz, -dy), -rig.root.rotation.y).normalize(); }
  // ---------------------------------------------------------------- posing
  function pose(rig, o) {
    const { P, D } = rig, cls = rig.r.cls, t = o.t || 0, k = o.kind || 'idle';
    for (const key in P) P[key].visible = false;
    const run = o.run || 0, ph = t * 11;
    let crouch = 0, bend = 0, twist = 0, bob = 0, hipShift = V();
    const hand = o.hand || 1, sR = -1, sL = 1; // local x of right / left side
    let footL = V(0.48, 0, 0.05), footR = V(-0.48, 0, 0.05), liftL = 0, liftR = 0;
    let handL = null, handR = null, holdBall = !!o.ball, bat = null;
    if (k === 'run') { const sw = Math.sin(ph) * run; footL.z = sw * 1.0; footR.z = -sw * 1.0; liftL = Math.max(0, -Math.cos(ph)) * 0.7 * run; liftR = Math.max(0, Math.cos(ph)) * 0.7 * run; bend = 0.32 * run; bob = Math.abs(Math.cos(ph)) * 0.18 * run; crouch = 0.12; }
    if (k === 'ready') { crouch = 0.42; bend = 0.38; footL.x = 0.85; footR.x = -0.85; }
    if (k === 'lead') { crouch = 0.5; bend = 0.3; footL.x = 1.0; footR.x = -1.0; }
    if (k === 'catcher') { crouch = 1.35; bend = 0.25; footL.x = 1.05; footR.x = -1.05; footL.z = 0.2; footR.z = 0.2; }
    if (k === 'bat' || k === 'bunt') { // side-on stance: front foot toward the pitcher (local +X for a right-handed batter)
      const p = o.p == null ? 0 : o.p; crouch = 0.38; bend = 0.22;
      const stride = k === 'bat' ? clamp((p - 0.05) / 0.3, 0, 1) * 0.45 : 0;
      footL = V(hand * (1.15 + stride), 0, 0.05); footR = V(-hand * 1.1, 0, 0.05);
      // load: shoulders coiled away from the pitcher, then rotate through the swing
      twist = k === 'bunt' ? -hand * 1.2 : -hand * lerp(0.35, -1.25, clamp((p - 0.2) / 0.5, 0, 1));
      if (o.grip && o.dir) { bat = { grip: toLocal(rig, ...o.grip), dir: dirLocal(rig, ...o.dir) }; }
    }
    if (k === 'pitch' || k === 'throw') {
      const p = o.p || 0, gl = -hand; // glove side
      if (k === 'pitch') {
        if (p < 0.35) { const q = p / 0.35; if (gl > 0) liftL = q * 1.6; else liftR = q * 1.6; (gl > 0 ? footL : footR).z = 0.3 * q; crouch = 0.1; }
        else if (p < 0.6) { const q = (p - 0.35) / 0.25; (gl > 0 ? footL : footR).z = lerp(0.3, 1.9, q); if (gl > 0) liftL = (1 - q) * 1.6; else liftR = (1 - q) * 1.6; crouch = 0.35 * q; bend = 0.1; twist = hand * 0.6 * q; }
        else { const q = (p - 0.6) / 0.4; (gl > 0 ? footL : footR).z = 1.9; crouch = 0.45; bend = 0.15 + 0.55 * Math.min(1, q * 1.6); twist = hand * lerp(0.6, -0.7, Math.min(1, q * 1.5)); if (gl > 0) liftR = q * 0.8; else liftL = q * 0.8; }
      } else { crouch = 0.2; bend = 0.25 * p; twist = hand * lerp(0.5, -0.6, p); }
    }
    // body points
    const hipY = (D.legs === 'hover' ? D.hip + Math.sin(t * 3.3) * 0.15 : D.hip) - crouch * (D.legs === 'tread' ? 0.2 : 1) - bob;
    const pel = V(0, hipY, 0).add(hipShift);
    const chest = pel.clone().add(V(0, Math.cos(bend) * D.torso, Math.sin(bend) * D.torso));
    const shOff = (s) => { const v = rotY(V(s * D.shW, -0.12, 0), twist); return chest.clone().add(v); };
    const shL = shOff(sL), shR = shOff(sR);
    const headP = chest.clone().add(rotY(V(0, D.headY, Math.sin(bend) * 0.35), twist));
    // hands
    const relax = (S, s) => S.clone().add(rotY(V(s * 0.25, -D.upA - D.foA * 0.85, 0.15 + (k === 'run' ? Math.sin(ph) * -s * 0.7 * run : 0)), twist * 0.5));
    if (k === 'ready' || k === 'lead') { handL = V(0.55, hipY * 0.62, 0.95); handR = V(-0.55, hipY * 0.62, 0.95); }
    if (k === 'catcher') { handL = V(0.35, hipY + 1.2, 1.25); handR = V(-0.6, hipY + 0.6, 0.6); }
    if (k === 'pitch' || k === 'throw') {
      const p = o.p || 0, tS = hand > 0 ? shR : shL, gS = hand > 0 ? shL : shR, thr = hand > 0 ? 'R' : 'L';
      let th, gv;
      if (k === 'pitch' && p < 0.35) { th = V(-hand * 0.1, chest.y - 0.6, 0.7); gv = th.clone().add(V(hand * 0.25, 0, 0)); }
      else { const q = k === 'pitch' ? (p - 0.35) / 0.65 : p; const a = lerp(-2.3, 1.9, clamp(q * 1.15, 0, 1)); th = tS.clone().add(V(-hand * 0.35, Math.cos(a) * (D.upA + D.foA) * 0.9, -Math.sin(-a) * (D.upA + D.foA) * 0.9)); gv = gS.clone().add(V(hand * 0.3, -0.6, 0.9 - q * 0.6)); }
      if (thr === 'R') { handR = th; handL = gv; } else { handL = th; handR = gv; }
      holdBall = (k === 'pitch' && p < 0.62) || (k === 'throw' && p < 0.55);
    }
    if (bat) { const g2 = bat.grip.clone().addScaledVector(bat.dir, 0.38); if (hand > 0) { handR = bat.grip; handL = g2; } else { handL = bat.grip; handR = g2; } }
    if (!handL) handL = relax(shL, sL); if (!handR) handR = relax(shR, sR);
    if (holdBall && !bat && !(k === 'pitch' || k === 'throw')) { handR = chest.clone().add(V(-0.4, -0.8, 0.8)); }
    // ---- lay the armour
    const yawT = twist;
    put(P.pelvis, pel, D.chestW * 1.05, 0.55, 0.72, twist * 0.4);
    if (D.legs === 'hover') {
      const top = chest.clone().add(V(0, 0.15, 0)), bot = pel.clone().add(V(0, -0.55, 0));
      put(P.torso, top.clone().lerp(bot, 0.5), 1, 1, 1, 0); P.torso.geometry = GEO.cone4; P.torso.scale.set(D.chestW * 1.05, top.y - bot.y, 0.62); P.torso.rotation.set(Math.PI, Math.PI / 4 + yawT, 0, 'YXZ');
      for (const s of [sL, sR]) { const w = s === sL ? P.wingL : P.wingR; const base = s === sL ? shL : shR; put(w, base.clone().add(rotY(V(s * 0.75, 0.45, -0.15), yawT)), 1.25, 0.12, 0.55, yawT, 0, s * 0.62); }
      put(P.jet, bot.clone().add(V(0, -0.6, 0)), 0.22, 0.9 + 0.2 * Math.sin(t * 30), 0.22, 0, Math.PI); put(P.neck, chest.clone().add(V(0, 0.45, 0)), 0.07, 0.5, 0.07);
      put(P.fin, headP.clone().add(V(0, 0.45, 0)), 0.08, 0.45, 0.05, yawT);
    } else {
      const tb = pel.clone().add(V(0, 0.25, 0)); seg(P.torso, tb, chest, D.chestW, D.chestW * 0.62, yawT + Math.PI / 6);
    }
    const fwd = rotY(V(0, 0, 1), yawT);
    put(P.chest, chest.clone().add(V(0, -0.42, 0)).addScaledVector(fwd, D.chestW * 0.45), D.chestW * 1.25, 0.85, 0.22, yawT, -bend);
    put(P.core, chest.clone().add(V(0, -0.5, 0)).addScaledVector(fwd, D.chestW * 0.6), 0.2, 0.2, 0.12, yawT + t * 1.5);
    put(P.num, chest.clone().add(V(0, -0.5, 0)).addScaledVector(fwd, -D.chestW * 0.7), 0.95, 0.95, 1, yawT + Math.PI);
    // head
    if (cls === 'RAPTOR') { put(P.head, headP, 0.48, 0.95, 0.48, yawT + Math.PI / 4, Math.PI / 2 - 0.15); P.head.position.addScaledVector(fwd, 0.25); put(P.crest, headP.clone().add(V(0, 0.42, -0.1)), 0.1, 0.5, 0.1, yawT); }
    else if (cls === 'TITAN') { P.head.geometry = GEO.hemi; put(P.head, headP.clone().add(V(0, -0.15, 0)), 0.58, 0.5, 0.58, yawT); }
    else { put(P.head, headP, cls === 'VECTOR' ? 0.42 : 0.47, 0.48, 0.47, yawT); for (const s2 of [sL, sR]) { const e2 = s2 === sL ? P.earL : P.earR; put(e2, headP.clone().add(rotY(V(s2 * 0.47, 0, -0.02), yawT)), 0.16, 0.12, 0.16, yawT, 0, Math.PI / 2); }
      const at = headP.clone().add(rotY(V(-0.18, 0.45, -0.12), yawT)); seg(P.ant, headP.clone().add(rotY(V(-0.18, 0.3, -0.12), yawT)), at, 0.03); put(P.antT, at, 0.07, 0.07, 0.07); }
    put(P.visor, headP.clone().add(V(0, cls === 'TITAN' ? 0.05 : 0.04, 0)).addScaledVector(fwd, cls === 'RAPTOR' ? 0.62 : cls === 'TITAN' ? 0.48 : 0.36), cls === 'TITAN' ? 0.7 : 0.66, cls === 'RAPTOR' ? 0.12 : 0.2, 0.22, yawT);
    // arms
    for (const [s, S, H] of [['L', shL, handL], ['R', shR, handR]]) {
      const side = s === 'L' ? sL : sR, pole = rotY(V(side * 0.6, -0.5, -0.6), yawT); const sol = ik(S, H, D.upA, D.foA, pole);
      put(P['sh' + s], S, cls === 'TITAN' ? 0.7 : 0.42, cls === 'TITAN' ? 0.55 : 0.38, cls === 'TITAN' ? 0.6 : 0.42, yawT);
      if (cls === 'RAPTOR') { P['sh' + s].scale.set(0.2, 0.8, 0.2); P['sh' + s].rotation.set(0, yawT, -side * 0.7); P['sh' + s].position.y += 0.35; }
      seg(P['ua' + s], S, sol.E, D.limb * 1.1); seg(P['fa' + s], sol.E, sol.Tg, D.limb); put(P['el' + s], sol.E, D.limb * 0.85, D.limb * 0.85, D.limb * 0.85);
      put(P['ha' + s], sol.Tg, D.limb * 1.5, D.limb * 1.6, D.limb * 1.5, yawT);
      { const a = sol.E.clone().lerp(sol.Tg, 0.25), b = sol.E.clone().lerp(sol.Tg, 0.85); seg(P['faG' + s], a, b, D.limb * 1.55, D.limb * 1.35); const out = rotY(V(side * D.limb * 0.9, 0, 0), yawT); seg(P['faS' + s], a.clone().add(out), b.clone().add(out), 0.04, 0.12); }
      if (cls === 'RAPTOR') { const bl = P['blade' + s], dir = V().subVectors(sol.Tg, sol.E).normalize(); bl.position.copy(sol.E).lerp(sol.Tg, 0.55).add(V(0, 0.1, 0)); bl.quaternion.setFromUnitVectors(UP, dir); bl.scale.set(0.1, 1.15, 0.05); bl.visible = true; }
    }
    // legs
    if (D.legs === 'biped' || D.legs === 'digi') {
      for (const [s, F, lift] of [['L', footL, liftL], ['R', footR, liftR]]) {
        const side = s === 'L' ? sL : sR, hipP = pel.clone().add(rotY(V(side * 0.4, -0.1, 0), twist * 0.3)), foot = F.clone().add(V(0, lift, lift * 0.35));
        if (D.legs === 'biped') {
          const sol = ik(hipP, foot.clone().add(V(0, 0.3, 0)), D.th, D.sh, V(side * 0.15, 0, 1)); seg(P['th' + s], hipP, sol.E, D.limb * 1.35); seg(P['sn' + s], sol.E, sol.Tg, D.limb * 1.15); put(P['kn' + s], sol.E, 0.2, 0.2, 0.2);
          { const fo = V(0, 0, D.limb * 0.75); seg(P['thG' + s], hipP.clone().lerp(sol.E, 0.12).add(fo), hipP.clone().lerp(sol.E, 0.88).add(fo), D.limb * 1.9, D.limb * 0.9); seg(P['thS' + s], hipP.clone().lerp(sol.E, 0.2).add(fo).add(V(side * D.limb * 0.95, 0, 0.05)), hipP.clone().lerp(sol.E, 0.8).add(fo).add(V(side * D.limb * 0.95, 0, 0.05)), 0.04, 0.1);
            seg(P['snG' + s], sol.E.clone().lerp(sol.Tg, 0.1).add(V(0, 0, D.limb * 0.7)), sol.E.clone().lerp(sol.Tg, 0.85).add(V(0, 0, D.limb * 0.7)), D.limb * 1.5, D.limb * 0.7); }
          put(P['ft' + s], foot.clone().add(V(0, 0.15, 0.18)), 0.48, 0.32, 0.92, (s === 'L' ? 0.1 : -0.1) + (k === 'bat' ? hand * 0.9 : 0));
        } else { // reverse-knee hunter: hip -> knee (forward) -> ankle (back) -> toe
          const ank = foot.clone().add(V(0, 0.85, -0.45)); const sol = ik(hipP, ank, D.th, D.sh, V(0, 0, 1)); seg(P['th' + s], hipP, sol.E, D.limb * 1.4); seg(P['sn' + s], sol.E, sol.Tg, D.limb); put(P['kn' + s], sol.E, 0.2, 0.2, 0.2);
          seg(P['an' + s], sol.Tg, foot.clone().add(V(0, 0.12, 0.25)), D.limb * 0.8); { const fo = V(0, 0, D.limb * 0.8); seg(P['thG' + s], hipP.clone().lerp(sol.E, 0.1).add(fo), hipP.clone().lerp(sol.E, 0.9).add(fo), D.limb * 1.9, D.limb * 0.9); seg(P['thS' + s], hipP.clone().lerp(sol.E, 0.2).add(fo).add(V(side * D.limb * 0.95, 0, 0.05)), hipP.clone().lerp(sol.E, 0.8).add(fo).add(V(side * D.limb * 0.95, 0, 0.05)), 0.04, 0.1); seg(P['snG' + s], sol.E.clone().lerp(sol.Tg, 0.15).add(V(0, 0, -0.18)), sol.E.clone().lerp(sol.Tg, 0.85).add(V(0, 0, -0.18)), D.limb * 1.2, D.limb * 0.6); } put(P['ft' + s], foot.clone().add(V(0, 0.1, 0.4)), 0.4, 0.2, 0.8, k === 'bat' ? hand * 0.9 : 0);
        }
      }
      if (D.legs === 'digi') { let prev = pel.clone().add(V(0, 0, -0.35)); for (let i = 0; i < 5; i++) { const q = (i + 1) / 5, nxt = pel.clone().add(V(Math.sin(t * 3 + q * 2) * 0.25 * q, -0.4 * q + q * q * 0.9, -0.35 - q * 2.0)); seg(P['tail' + i], prev, nxt, 0.18 - i * 0.025, 0.14 - i * 0.02); prev = nxt; } put(P.tailTip, prev, 0.11, 0.11, 0.11); }
    }
    if (D.legs === 'tread') {
      put(P.tread, V(0, 0.62, 0), 2.9, 1.2, 1.9, 0); put(P.skirt, V(0, 1.35, 0.05), 3.15, 0.35, 2.05, 0);
      for (let i = 0; i < 6; i++) { const w = P['wh' + i]; put(w, V(i < 3 ? 1.48 : -1.48, 0.62, (i % 3 - 1) * 0.62), 0.32, 0.1, 0.32, 0, 0, Math.PI / 2); w.rotation.x = (t * (o.run ? 9 : 0)); }
      put(P.vent, chest.clone().add(V(0, -1.4, 0)).addScaledVector(fwd, D.chestW * 0.62), 1.2, 0.55, 0.05, yawT, -bend);
    }
    if (P.pack) { const back = rotY(V(0, 0, -1), yawT), pk = chest.clone().add(V(0, -0.75, 0)).addScaledVector(back, D.chestW * 0.62);
      put(P.pack, pk, D.chestW * 1.0, 1.2, 0.45, yawT, bend); P.num.position.copy(pk).addScaledVector(back, 0.24); P.num.scale.setScalar(0.85);
      for (const s2 of [sL, sR]) { const tp = pk.clone().add(rotY(V(s2 * D.chestW * 0.33, -0.75, -0.05), yawT)); put(s2 === sL ? P.thrL : P.thrR, tp, 0.14, 0.4, 0.14); const fl = s2 === sL ? P.flL : P.flR; put(fl, tp.clone().add(V(0, -0.38, 0)), 0.1, 0.35 + 0.12 * Math.sin(t * 40 + s2), 0.1, 0, Math.PI); } }
    // bat and ball
    if (bat) { const tip = bat.grip.clone().addScaledVector(bat.dir, 3.1), mid = bat.grip.clone().addScaledVector(bat.dir, 0.85); seg(P.batGrip, bat.grip.clone().addScaledVector(bat.dir, -0.2), mid, 0.07); seg(P.bat, mid, tip, 0.13, 0.13); P.bat.scale.x = P.bat.scale.z = 0.14; }
    if (holdBall) { const hb = hand > 0 ? handR : handL; put(P.ball, hb.clone().add(V(0, 0.05, 0.12)), 0.2, 0.2, 0.2); }
    // battle damage: joints flicker when armour is low
    const flick = (o.hp != null && o.hp < 0.35 && Math.sin(t * 25) > 0.4);
    rig.M.glow.color.set(flick ? '#ff6a2a' : (rig.r.scrap ? '#ffb347' : rig.team.g));
  }
  // ---------------------------------------------------------------- frame API
  R3D.ok = true;
  R3D.begin = function () { R3D.frame++; };
  R3D.add = function (r, team, x, y, yaw, scale, o, ghost) {
    const key = r; let rig = R3D.rigs.get(key);
    if (!rig || rig.team !== team || rig.ghost !== !!ghost || rig.r.cls !== r.cls) { if (rig) scene.remove(rig.root); rig = buildRig(r, team, !!ghost); R3D.rigs.set(key, rig); }
    rig.seen = R3D.frame; rig.root.visible = true;
    rig.root.position.set(x, 0, -y); rig.root.rotation.set(0, yaw, 0); rig.root.scale.setScalar(scale || 1);
    pose(rig, o || {});
  };
  R3D.draw = function (ctx, cam, cv) {
    for (const [k, rig] of R3D.rigs) if (rig.seen !== R3D.frame) { rig.root.visible = false; if (R3D.frame - rig.seen > 600) { scene.remove(rig.root); R3D.rigs.delete(k); } }
    const bw = Math.min(cv.width, 1600), bh = Math.round(bw * H / W);
    if (glc.width !== bw || glc.height !== bh) renderer.setSize(bw, bh, false);
    camera.fov = 2 * Math.atan((H / 2) / cam.f) * 180 / Math.PI; camera.aspect = W / H; camera.updateProjectionMatrix();
    camera.position.set(cam.pos.x, cam.pos.z, -cam.pos.y); camera.up.set(0, 1, 0); camera.lookAt(cam.tgt.x, cam.tgt.z, -cam.tgt.y);
    renderer.render(scene, camera);
    ctx.drawImage(glc, 0, 0, W, H);
  };
  R3D.hideAll = function () { for (const [, rig] of R3D.rigs) rig.root.visible = false; };
})();

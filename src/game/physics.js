// Batted / thrown ball physics (feet, seconds).
const G = 32.2;

export class Ball {
  constructor() { this.reset(); }
  reset() {
    this.x = 0; this.y = 0; this.z = 0; this.vx = 0; this.vy = 0; this.vz = 0;
    this.bounces = 0; this.rolling = false; this.stopped = false; this.airborne = false;
    this.drag = 0.0016; this.maxHeight = 0;
  }
  launch(x, y, z, speed, launchDeg, sprayDeg) {
    const la = launchDeg * Math.PI / 180, sa = sprayDeg * Math.PI / 180;
    this.x = x; this.y = y; this.z = z;
    this.vy = speed * Math.sin(la);
    const h = speed * Math.cos(la);
    this.vx = h * Math.sin(sa); this.vz = h * Math.cos(sa);
    this.bounces = 0; this.rolling = false; this.stopped = false; this.airborne = true; this.maxHeight = y;
  }
  step(dt) {
    if (this.stopped) return;
    if (!this.rolling) {
      const v = Math.hypot(this.vx, this.vy, this.vz);
      const k = 1 - this.drag * v * dt;
      this.vx *= k; this.vz *= k; this.vy = this.vy * k - G * dt;
      this.x += this.vx * dt; this.y += this.vy * dt; this.z += this.vz * dt;
      if (this.y > this.maxHeight) this.maxHeight = this.y;
      if (this.y <= 0 && this.vy < 0) {
        this.y = 0; this.bounces++;
        this.vy = -this.vy * 0.42; this.vx *= 0.72; this.vz *= 0.72;
        this.airborne = false;
        if (this.vy < 4) { this.vy = 0; this.rolling = true; }
        return true; // bounced
      }
    } else {
      const v = Math.hypot(this.vx, this.vz);
      const dec = 18 * dt;
      if (v <= dec) { this.vx = 0; this.vz = 0; this.stopped = true; }
      else { const k = (v - dec) / v; this.vx *= k; this.vz *= k; }
      this.x += this.vx * dt; this.z += this.vz * dt;
    }
    return false;
  }
  speed() { return Math.hypot(this.vx, this.vy, this.vz); }
  /** Simulate ahead: where & when does the ball first touch the ground (or get below `h`)? */
  predictLanding(h = 0.5) {
    const b = Object.assign(new Ball(), this);
    let t = 0;
    if (!b.airborne || b.y <= h && b.vy <= 0) return { x: b.x, z: b.z, t: 0, y: b.y };
    for (let i = 0; i < 600; i++) {
      const before = b.bounces;
      b.step(1 / 60); t += 1 / 60;
      if ((b.y <= h && b.vy < 0) || b.bounces > before) break;
    }
    return { x: b.x, z: b.z, t, y: b.y };
  }
  /** Position after t seconds (approx). */
  predictAt(t) {
    const b = Object.assign(new Ball(), this);
    const steps = Math.max(0, Math.round(t * 60));
    for (let i = 0; i < steps; i++) b.step(1 / 60);
    return { x: b.x, y: b.y, z: b.z };
  }
}

/** Compute initial velocity for a throw from A to B arriving in ~t seconds with an arc. */
export function throwVelocity(ax, ay, az, bx, by, bz, speed) {
  const dx = bx - ax, dz = bz - az;
  const d = Math.hypot(dx, dz);
  // Flat-ish throw: aim slightly up so gravity drop is cancelled over the flight.
  const t = d / speed;
  const vy = (by - ay) / t + 0.5 * G * t * 0.9;
  return { vx: dx / t, vz: dz / t, vy, t };
}

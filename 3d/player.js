// Free-roaming 3D movement, Roblox-obby style. Position is the player's feet.
const HW = 0.3;       // half width of the body box
const H = 1.45;       // body height
const SPEED = 5;      // blocks per second
const JUMP = 11.2;    // about 2.2 blocks high
const GRAVITY = 28;
const MAX_FALL = 30;
const COYOTE = 0.1;   // seconds you can still jump after running off an edge
const BUFFER = 0.13;  // seconds an early jump press is remembered

export class Player3D {
  constructor(x, y, z) {
    this.pos = { x, y, z };
    this.vel = { x: 0, y: 0, z: 0 };
    this.onGround = false;
    this.facing = 0;
    this.coyote = 0;
    this.buffer = 0;
  }

  respawn(p) {
    this.pos = { x: p[0], y: p[1], z: p[2] };
    this.vel = { x: 0, y: 0, z: 0 };
  }

  // move = {x, z} direction in the world (length 0..1)
  update(dt, move, jumpPressed, world) {
    const accel = this.onGround ? 45 : 18;
    for (const a of ['x', 'z']) {
      const want = move[a] * SPEED;
      const diff = want - this.vel[a];
      this.vel[a] += Math.max(-accel * dt, Math.min(accel * dt, diff));
    }
    if (Math.hypot(move.x, move.z) > 0.1) {
      const target = Math.atan2(move.x, move.z);
      let d = target - this.facing;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      this.facing += d * Math.min(1, dt * 14);
    }

    this.coyote = this.onGround ? COYOTE : Math.max(0, this.coyote - dt);
    this.buffer = jumpPressed ? BUFFER : Math.max(0, this.buffer - dt);
    this.jumped = false;
    if (this.buffer > 0 && this.coyote > 0) {
      this.vel.y = JUMP;
      this.buffer = 0; this.coyote = 0; this.onGround = false;
      this.jumped = true;
    }
    this.vel.y = Math.max(this.vel.y - GRAVITY * dt, -MAX_FALL);

    this.sweep('x', this.vel.x * dt, world);
    this.sweep('z', this.vel.z * dt, world);
    this.onGround = false;
    this.sweep('y', this.vel.y * dt, world);
  }

  // Move along one axis, then push back out of any solid block we ran into.
  sweep(axis, amount, world) {
    if (!amount) return;
    const p = this.pos;
    p[axis] += amount;
    const x0 = Math.floor(p.x - HW), x1 = Math.floor(p.x + HW - 1e-6);
    const y0 = Math.floor(p.y), y1 = Math.floor(p.y + H - 1e-6);
    const z0 = Math.floor(p.z - HW), z1 = Math.floor(p.z + HW - 1e-6);
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
      if (!world.solid(x, y, z)) continue;
      if (axis === 'x') p.x = amount > 0 ? x - HW - 1e-4 : x + 1 + HW + 1e-4;
      if (axis === 'z') p.z = amount > 0 ? z - HW - 1e-4 : z + 1 + HW + 1e-4;
      if (axis === 'y') {
        if (amount > 0) p.y = y - H - 1e-4;
        else { p.y = y + 1; this.onGround = true; }
      }
      this.vel[axis] = 0;
      return;
    }
  }

  // Thorns only hurt if you're really in them (a little forgiving).
  touchingHazard(world) {
    const p = this.pos, m = 0.12;
    for (let x = Math.floor(p.x - HW + m); x <= Math.floor(p.x + HW - m); x++) {
      for (let y = Math.floor(p.y + m); y <= Math.floor(p.y + H - m); y++) {
        for (let z = Math.floor(p.z - HW + m); z <= Math.floor(p.z + HW - m); z++) if (world.hazard(x, y, z)) return true;
      }
    }
    return false;
  }
}

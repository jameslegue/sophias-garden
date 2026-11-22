import { SPR } from '../sprites.js';

// Rosie follows the path the player took a moment ago, so she hops along
// behind them without ever getting stuck. She can't get hurt.
const DELAY = 18;

export class Rosie {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.trail = [];
    this.facing = 1;
    this.mode = 'follow';
    this.anim = 0;
    this.moving = false;
    this.carry = null;  // fruit id of the seed she's showing off
    this.carryT = 0;
  }

  snap(p) {
    this.trail = [];
    this.x = p.x + p.w / 2 - p.facing * 9 - 5;
    this.y = p.y + p.h - 8;
  }

  // Run over to a seed, then call done() when she grabs it.
  fetch(seed, done) {
    this.mode = 'fetch';
    this.target = seed;
    this.done = done;
  }

  update(p) {
    const px = this.x;
    if (this.mode === 'fetch') {
      const tx = this.target.x - 2, ty = this.target.y - 1;
      const dx = tx - this.x, dy = ty - this.y;
      const d = Math.hypot(dx, dy);
      if (d < 2) {
        this.mode = 'follow';
        this.carry = this.target.fruit;
        this.carryT = 150;
        this.trail = [];
        this.done();
      } else {
        const sp = Math.min(2.2, d);
        this.x += (dx / d) * sp;
        this.y += (dy / d) * sp;
      }
    } else {
      this.trail.push({ x: p.x + p.w / 2, y: p.y + p.h, f: p.facing });
      if (this.trail.length > DELAY) {
        const t = this.trail.shift();
        this.x += (t.x - t.f * 9 - 5 - this.x) * 0.5;
        this.y += (t.y - 8 - this.y) * 0.5;
      }
      if (Math.hypot(this.x - p.x, this.y - p.y) > 120) this.snap(p);
    }
    const mv = this.x - px;
    if (Math.abs(mv) > 0.1) this.facing = Math.sign(mv);
    this.moving = Math.abs(mv) > 0.2;
    this.anim++;
    if (this.carryT > 0) this.carryT--;
  }

  draw(r) {
    const img = this.moving && (this.anim >> 3) % 2 ? SPR.rosieRun : SPR.rosie;
    r.spr(img, this.x, this.y, this.facing < 0);
    if (this.carryT > 0 && this.carry) {
      r.spr(SPR.seed[this.carry], this.x + (this.facing > 0 ? 6 : -2), this.y - 7);
    }
  }
}

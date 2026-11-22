import { SPR } from '../sprites.js';
import { T, tileAt, isSolid } from '../engine/physics.js';

const PERIOD = 150;  // frames between apples
const WARN = 45;     // the hanging apple wiggles this long before it drops

// Apple floor: an apple grows here, wiggles, then drops. Dodge it!
export class AppleTree {
  constructor(c, r) {
    this.x = c * T;
    this.y = r * T;
    this.t = (c * 37 + r * 11) % PERIOD; // spread trees out so they don't all drop together
  }

  update(scene) {
    if (++this.t >= PERIOD) {
      this.t = 0;
      scene.apples.push({ x: this.x, y: this.y, vy: 0 });
    }
  }

  draw(r) {
    r.rect(this.x + 3, this.y - 2, 1, 3, 'D'); // stem
    if (this.t < 20) return;                   // still regrowing
    const wiggle = this.t > PERIOD - WARN ? ((this.t >> 2) % 2 ? 1 : -1) : 0;
    r.spr(SPR.fruit.apple, this.x + wiggle, this.y);
  }
}

// Falling apples: return false once one should disappear.
export function updateApple(a, level) {
  a.vy = Math.min(a.vy + 0.12, 2.6);
  a.y += a.vy;
  const ch = tileAt(level, Math.floor((a.x + 3) / T), Math.floor((a.y + 6) / T));
  return !isSolid(ch) && a.y < level.h * T;
}

export const appleBox = (a) => ({ x: a.x + 1, y: a.y + 1, w: 5, h: 5 });

export function drawApple(r, a) { r.spr(SPR.fruit.apple, a.x, a.y); }

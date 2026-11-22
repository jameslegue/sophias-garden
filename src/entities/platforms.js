import { SPR } from '../sprites.js';
import { T } from '../engine/physics.js';

const standingOn = (player, p) => player.onGround && player.platform === p;

// Carrot floor: sinks into the soil while you stand on it, pops back up when you leave.
export class SinkingCarrot {
  constructor(x, y) {
    this.x = x; this.y = y; this.baseY = y;
    this.w = T; this.h = T;
    this.active = true;
  }

  update(player) {
    if (standingOn(player, this)) this.y = Math.min(this.baseY + 16, this.y + 0.2);
    else this.y = Math.max(this.baseY, this.y - 0.5);
  }

  draw(r) {
    for (let x = this.x; x < this.x + this.w; x += T) {
      r.spr(SPR.carrotLeaf, x, this.y - 3);
      r.spr(SPR.carrot, x, this.y);
    }
  }
}

// Strawberry floor: wobbles once you land, then vanishes and grows back.
const VANISH_AFTER = 40;
const REGROW = 150;

export class VanishingBerry {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.w = T; this.h = T;
    this.active = true;
    this.t = 0;      // frames since someone landed
    this.gone = 0;   // frames until it grows back
  }

  update(player) {
    if (this.gone > 0) {
      if (--this.gone === 0) { this.active = true; this.t = 0; }
      return;
    }
    if (this.t > 0 || standingOn(player, this)) this.t++;
    if (this.t > VANISH_AFTER) { this.active = false; this.gone = REGROW; }
  }

  draw(r) {
    if (!this.active) {
      // a faint sprout shows where it will grow back
      if (this.gone < 40 && (this.gone >> 2) % 2) for (let x = this.x; x < this.x + this.w; x += T) r.rect(x + 3, this.y + 2, 2, 2, 'G');
      return;
    }
    const wobble = this.t > 0 ? ((this.t >> 1) % 2 ? 1 : -1) : 0;
    for (let x = this.x; x < this.x + this.w; x += T) r.spr(SPR.berry, x + wobble, this.y);
  }
}

export function makePlatform(kind, x, y) {
  return kind === 'carrot' ? new SinkingCarrot(x, y) : new VanishingBerry(x, y);
}

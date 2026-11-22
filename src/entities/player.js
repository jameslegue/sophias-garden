import { moveBody } from '../engine/physics.js';
import { sfx } from '../engine/audio.js';

const RUN = 1.2;
const ACCEL = 0.3;
const GRAVITY = 0.22;
const JUMP = -3.9;   // about 4 tiles high
const MAX_FALL = 3.5;
const COYOTE = 6;    // frames you can still jump after walking off a ledge
const BUFFER = 8;    // frames an early jump press is remembered

export class Player {
  constructor(x, y, frames) {
    this.x = x; this.y = y;
    this.w = 6; this.h = 11;
    this.vx = 0; this.vy = 0;
    this.onGround = false;
    this.facing = 1;
    this.coyote = 0; this.buffer = 0;
    this.frames = frames;
    this.anim = 0;
    this.blink = 0;
  }

  box() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }

  // input can be null to freeze the player (cutscenes)
  update(input, level) {
    const left = input?.held.left, right = input?.held.right;
    const jumpPressed = input && (input.pressed('jump') || input.pressed('up'));
    const dir = (right ? 1 : 0) - (left ? 1 : 0);

    if (dir) {
      this.vx = Math.max(-RUN, Math.min(RUN, this.vx + dir * ACCEL));
      this.facing = dir;
    } else {
      this.vx *= this.onGround ? 0.6 : 0.85;
      if (Math.abs(this.vx) < 0.05) this.vx = 0;
    }

    this.coyote = this.onGround ? COYOTE : Math.max(0, this.coyote - 1);
    this.buffer = jumpPressed ? BUFFER : Math.max(0, this.buffer - 1);
    if (this.buffer > 0 && this.coyote > 0) {
      this.vy = JUMP;
      this.buffer = 0; this.coyote = 0; this.onGround = false;
      sfx.jump();
    }

    this.vy = Math.min(this.vy + GRAVITY, MAX_FALL);
    moveBody(this, level);
    this.anim++;
    if (this.blink > 0) this.blink--;
  }

  respawn(x, y) {
    this.x = x; this.y = y; this.vx = 0; this.vy = 0;
    this.blink = 45;
  }

  draw(r) {
    if (this.blink > 0 && (this.blink >> 2) % 2) return;
    const f = this.frames;
    let img = f.idle;
    if (!this.onGround) img = f.jump;
    else if (Math.abs(this.vx) > 0.2) img = [f.run1, f.idle, f.run2, f.idle][Math.floor(this.anim / 5) % 4];
    r.spr(img, this.x - 1, this.y - 1, this.facing < 0);
  }
}

import { wrap } from '../engine/render.js';
import { sfx } from '../engine/audio.js';

// Story text box at the bottom of the screen. Press JUMP or tap to continue.
export class Dialog {
  constructor(lines, done, { top = false } = {}) {
    this.top = top;
    this.lines = lines;
    this.done = done;
    this.i = 0;
    this.n = 0;
    this.t = 0;
    this.finished = false;
    this.start();
  }

  start() {
    const line = this.lines[this.i];
    if (!line) return;
    this.wrapped = wrap(line.text, 32);
    this.total = this.wrapped.join('').length;
    this.n = 0;
    if (line.who === 'ROSIE') sfx.bark();
  }

  update(input) {
    this.t++;
    if (this.finished) return;
    if (this.i >= this.lines.length) { this.finish(); return; }
    const advance = input.pressed('jump') || input.taps.length > 0;
    if (this.n < this.total) {
      this.n = advance ? this.total : this.n + 1;
    } else if (advance) {
      this.i++;
      sfx.blip();
      if (this.i >= this.lines.length) this.finish();
      else this.start();
    }
  }

  finish() { this.finished = true; this.done(); }

  draw(r) {
    const line = this.lines[this.i];
    if (!line || this.finished) return;
    const y = this.top ? 16 : 190;
    r.box(3, y, 138, 62, 'K', 'M');
    r.rect(4, y + 1, 136, 1, 'P');
    let ty = y + 5;
    if (line.who) { r.text(line.who, 8, ty, 'Y'); ty += 8; }
    let left = this.n;
    for (const l of this.wrapped) {
      if (left <= 0) break;
      r.text(l.slice(0, left), 8, ty, 'W');
      left -= l.length;
      ty += 7;
    }
    if (this.n >= this.total && (this.t >> 4) % 2) r.text('>', 133, y + 54, 'M');
  }
}

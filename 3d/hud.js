import { Renderer, wrap } from '../src/engine/render.js';
import { FRUITS, SPR } from '../src/sprites.js';

// Text on top of the 3D view, in the same chunky pixel font as the 2D game.
const HUD_W = 160;

export class Hud {
  constructor(canvas) {
    this.canvas = canvas;
    this.r = new Renderer(canvas);
    this.popups = [];
    this.speech = [];
    this.flash = 0;
    this.t = 0;
    this.hint = null;
    this.resize();
  }

  resize() {
    this.canvas.width = HUD_W;
    this.canvas.height = Math.round((HUD_W * innerHeight) / innerWidth);
    this.r.W = this.canvas.width;
    this.r.H = this.canvas.height;
    this.r.ctx.imageSmoothingEnabled = false;
  }

  popup(text, color = 'Y') { this.popups.push({ text, color, t: 2 }); }

  // Speech bubble at the top (Sophia's lines, story text)
  say(who, text, seconds = 3) { this.speech = [{ who, lines: wrap(text, 36), t: seconds }]; }

  draw(dt, info) {
    const r = this.r;
    this.t += dt;
    r.ctx.clearRect(0, 0, r.W, r.H);

    // Top bar: seeds (gray until you have them) + floor name
    r.rect(0, 0, r.W, 12, 'K');
    FRUITS.forEach((f, i) => r.spr(info.seeds.includes(f.id) ? SPR.fruit[f.id] : SPR.fruitGray[f.id], 3 + i * 9, 3));
    r.text(info.title, 50, 4, 'M');

    if (this.hint && this.t < 7) {
      r.box(14, 24, r.W - 28, 10 + this.hint.length * 8, 'K', 'M');
      this.hint.forEach((l, i) => r.textC(l, r.W / 2, 28 + i * 8, i === this.hint.length - 1 ? 'Y' : 'W'));
    }

    this.speech = this.speech.filter((s) => (s.t -= dt) > 0);
    for (const s of this.speech) {
      const h = 8 + s.lines.length * 7 + (s.who ? 8 : 0);
      r.box(3, 16, r.W - 6, h, 'K', 'M');
      let y = 20;
      if (s.who) { r.text(s.who, 7, y, 'Y'); y += 8; }
      s.lines.forEach((l) => { r.text(l, 7, y, 'W'); y += 7; });
    }

    this.popups = this.popups.filter((p) => (p.t -= dt) > 0);
    this.popups.forEach((p, i) => r.textC(p.text, r.W / 2, r.H * 0.36 - i * 9 - (2 - p.t) * 6, p.color, 1, 'K'));

    if (this.flash > 0) {
      this.flash -= dt;
      r.ctx.globalAlpha = Math.max(0, this.flash * 2);
      r.rect(0, 0, r.W, r.H, 'W');
      r.ctx.globalAlpha = 1;
    }
  }
}

import { Renderer } from '../src/engine/render.js';

// Text on top of the 3D view, in the same chunky pixel font as the 2D game.
const HUD_W = 160;

export class Hud {
  constructor(canvas) {
    this.canvas = canvas;
    this.r = new Renderer(canvas);
    this.popups = [];
    this.flash = 0;
    this.t = 0;
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

  draw(dt, info) {
    const r = this.r;
    this.t += dt;
    r.ctx.clearRect(0, 0, r.W, r.H);

    r.rect(0, 0, r.W, 11, 'K');
    r.text(info.title, 3, 3, 'M');
    r.text(info.status, 60, 3, 'Y');

    if (this.t < 7) {
      const lines = ['LEFT SIDE: MOVE', 'RIGHT SIDE: LOOK', 'GET THE SEED ON TOP!'];
      r.box(16, 22, r.W - 32, 28, 'K', 'M');
      lines.forEach((l, i) => r.textC(l, r.W / 2, 26 + i * 8, i === 2 ? 'Y' : 'W'));
    }

    this.popups = this.popups.filter((p) => (p.t -= dt) > 0);
    this.popups.forEach((p, i) => r.textC(p.text, r.W / 2, r.H * 0.32 - i * 9 - (2 - p.t) * 6, p.color, 1, 'K'));

    if (this.flash > 0) {
      this.flash -= dt;
      r.ctx.globalAlpha = Math.max(0, this.flash * 2);
      r.rect(0, 0, r.W, r.H, 'W');
      r.ctx.globalAlpha = 1;
    }
  }
}

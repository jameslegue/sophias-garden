import { PAL } from './palette.js';
import { GLYPHS } from './font.js';

// Turn rows of palette letters into a small canvas. '.' is transparent.
// `map` swaps letters for other letters (e.g. avatar parts), `force` paints everything one color.
export function makeSprite(rows, map = {}, force = null) {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  rows.forEach((row, j) => [...row].forEach((ch, i) => {
    if (ch === '.' || ch === ' ') return;
    const hex = PAL[force || map[ch] || ch];
    if (!hex) return;
    x.fillStyle = hex;
    x.fillRect(i, j, 1, 1);
  }));
  return c;
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.W = canvas.width;
    this.H = canvas.height;
  }

  color(c) { return PAL[c] || c; }

  clear(c = 'K') { this.ctx.fillStyle = this.color(c); this.ctx.fillRect(0, 0, this.W, this.H); }

  rect(x, y, w, h, c) {
    this.ctx.fillStyle = this.color(c);
    this.ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  box(x, y, w, h, fill, border) {
    this.rect(x, y, w, h, border);
    this.rect(x + 1, y + 1, w - 2, h - 2, fill);
  }

  spr(img, x, y, flip = false, scale = 1) {
    const ctx = this.ctx;
    x = Math.round(x); y = Math.round(y);
    const w = img.width * scale, h = img.height * scale;
    if (!flip) { ctx.drawImage(img, x, y, w, h); return; }
    ctx.save();
    ctx.translate(x + w, y);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0, w, h);
    ctx.restore();
  }

  text(str, x, y, c = 'W', s = 1) {
    const ctx = this.ctx;
    ctx.fillStyle = this.color(c);
    let cx = Math.round(x);
    y = Math.round(y);
    for (const ch of String(str).toUpperCase()) {
      const g = GLYPHS[ch];
      if (g) for (const [px, py] of g) ctx.fillRect(cx + px * s, y + py * s, s, s);
      cx += 4 * s;
    }
  }

  textW(str, s = 1) { return str.length ? str.length * 4 * s - s : 0; }

  // Centered text with an optional drop shadow.
  textC(str, cx, y, c = 'W', s = 1, shadow = null) {
    const x = Math.round(cx - this.textW(str, s) / 2);
    if (shadow) this.text(str, x + s, y + s, shadow, s);
    this.text(str, x, y, c, s);
  }
}

// Word-wrap a string to lines of at most `max` characters.
export function wrap(str, max) {
  const lines = [];
  let line = '';
  for (const word of str.split(/\s+/)) {
    if (!word) continue;
    if (line && (line + ' ' + word).length > max) { lines.push(line); line = word; }
    else line = line ? line + ' ' + word : word;
  }
  if (line) lines.push(line);
  return lines;
}

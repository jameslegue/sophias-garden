import { COLORS } from '../engine/palette.js';
import { HAIR, HATS, SKINS } from '../avatar/parts.js';
import { SPR } from '../sprites.js';
import { drawButton, tapped } from '../ui/button.js';
import { sfx } from '../engine/audio.js';

const ROWS = [
  { label: 'SKIN', key: 'skin', values: SKINS, color: true },
  { label: 'HAIR', key: 'hair', values: Object.keys(HAIR) },
  { label: 'HAIR COLOR', key: 'hairColor', values: COLORS, color: true },
  { label: 'SHIRT', key: 'shirt', values: COLORS, color: true },
  { label: 'PANTS', key: 'pants', values: COLORS, color: true },
  { label: 'SHOES', key: 'shoes', values: COLORS, color: true },
  { label: 'HAT', key: 'hat', values: Object.keys(HATS) },
  { label: 'HAT COLOR', key: 'hatColor', values: COLORS, color: true },
];
const ROW_Y = 78;
const ROW_H = 15;
const PREV = { x: 74, w: 13 };
const NEXT = { x: 127, w: 13 };

// Roblox-style avatar maker: flip through parts and colors.
export class AvatarBuilderScene {
  constructor(game) {
    this.game = game;
    this.av = { ...game.avatar };
    this.sel = 0;
    this.t = 0;
    this.random = { label: 'RANDOM', x: 8, y: 206, w: 60, h: 20 };
    this.doneBtn = { label: 'DONE', x: 76, y: 206, w: 60, h: 20 };
  }

  change(row, step) {
    const vals = row.values;
    const i = vals.indexOf(this.av[row.key]);
    this.av[row.key] = vals[(i + step + vals.length) % vals.length];
    this.game.setAvatar(this.av);
    sfx.select();
  }

  randomize() {
    for (const row of ROWS) this.av[row.key] = row.values[Math.floor(Math.random() * row.values.length)];
    this.game.setAvatar(this.av);
    sfx.bark();
  }

  update() {
    const input = this.game.input;
    this.t++;
    const n = ROWS.length + 2; // rows + RANDOM + DONE
    if (input.pressed('down')) { this.sel = (this.sel + 1) % n; sfx.blip(); }
    if (input.pressed('up')) { this.sel = (this.sel + n - 1) % n; sfx.blip(); }
    const row = ROWS[this.sel];
    if (row) {
      if (input.pressed('left')) this.change(row, -1);
      if (input.pressed('right') || input.pressed('jump')) this.change(row, 1);
    } else if (input.pressed('jump')) {
      if (this.sel === ROWS.length) this.randomize(); else { this.game.toTitle(); return; }
    }

    ROWS.forEach((rw, i) => {
      const y = ROW_Y + i * ROW_H;
      if (input.tapIn(PREV.x - 4, y - 2, PREV.w + 8, ROW_H)) { this.sel = i; this.change(rw, -1); }
      if (input.tapIn(NEXT.x - 4, y - 2, NEXT.w + 8, ROW_H)) { this.sel = i; this.change(rw, 1); }
    });
    if (tapped(input, this.random)) this.randomize();
    if (tapped(input, this.doneBtn)) { sfx.blip(); this.game.toTitle(); }
  }

  draw(r) {
    r.rect(0, 0, r.W, r.H, 'N');
    r.textC('MY AVATAR', 72, 5, 'Y', 1, 'K');

    // Preview: walking avatar + Rosie on a little patch of grass
    const f = this.game.avatarFrames();
    const cycle = [f.idle, f.run1, f.idle, f.run2, f.idle, f.jump];
    const img = cycle[Math.floor(this.t / 10) % cycle.length];
    r.box(15, 13, 114, 58, 'S', 'M');
    r.spr(img, 40, img === f.jump ? 10 : 14, false, 4);
    r.rect(16, 62, 112, 8, 'G');
    r.rect(16, 62, 112, 1, 'L');
    r.spr(SPR.rosie, 84, 44, true, 2);

    ROWS.forEach((row, i) => {
      const y = ROW_Y + i * ROW_H;
      const on = i === this.sel;
      if (on) r.rect(2, y - 3, 140, ROW_H - 2, 'P');
      r.text(row.label, 6, y + 1, on ? 'Y' : 'Q');
      r.box(PREV.x, y - 2, PREV.w, 11, 'K', 'M');
      r.text('<', PREV.x + 5, y + 1, 'W');
      const v = this.av[row.key];
      if (row.color) r.box(92, y - 1, 30, 9, v, 'W');
      else r.textC(v, 107, y + 1, 'W');
      r.box(NEXT.x, y - 2, NEXT.w, 11, 'K', 'M');
      r.text('>', NEXT.x + 5, y + 1, 'W');
    });

    drawButton(r, this.random, this.sel === ROWS.length);
    drawButton(r, this.doneBtn, this.sel === ROWS.length + 1);
    r.textC('TAP < > TO CHANGE', 72, 236, 'E');
  }
}

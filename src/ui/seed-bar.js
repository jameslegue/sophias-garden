import { FRUITS, SPR } from '../sprites.js';

export const HUD_H = 12;

// Top bar: the five fruit seeds (gray until collected) and a MENU button.
export function drawSeedBar(r, seeds) {
  r.rect(0, 0, r.W, HUD_H, 'K');
  r.rect(0, HUD_H, r.W, 1, 'P');
  r.text('SEEDS', 3, 4, 'Q');
  FRUITS.forEach((f, i) => {
    r.spr(seeds.includes(f.id) ? SPR.fruit[f.id] : SPR.fruitGray[f.id], 25 + i * 10, 3);
  });
  r.text(`${seeds.length}/5`, 78, 4, seeds.length ? 'Y' : 'E');
  r.box(114, 1, 29, 10, 'P', 'M');
  r.text('MENU', 117, 3, 'W');
}

export function tappedMenu(input) { return input.tapIn(110, 0, 34, HUD_H + 2); }

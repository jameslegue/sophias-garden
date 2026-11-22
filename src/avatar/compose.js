import { makeSprite } from '../engine/render.js';
import { HEAD, BODY, HAIR, HATS, OUTFITS } from './parts.js';

// An avatar is just data, so it can be saved and (later) shared.
export const DEFAULT_AVATAR = {
  skin: 'Y',
  hair: 'LONG',
  hairColor: 'D',
  outfit: 'CLASSIC',
  shirt: 'M',
  pants: 'B',
  shoes: 'K',
  hat: 'NONE',
  hatColor: 'Y',
};

function overlay(grid, rows, top = 0) {
  rows.forEach((row, i) => {
    const y = i + top;
    [...row].forEach((ch, x) => { if (ch !== '.' && grid[y]) grid[y][x] = ch; });
  });
}

// Build the sprite for one animation frame (8x12).
export function composeFrame(av, frame) {
  const grid = [...HEAD, ...BODY[frame]].map((r) => [...r]);
  overlay(grid, OUTFITS[av.outfit] || [], HEAD.length);
  overlay(grid, HAIR[av.hair] || []);
  overlay(grid, HATS[av.hat] || []);
  const map = { s: av.skin, e: 'K', h: av.hairColor, t: av.shirt, p: av.pants, f: av.shoes, a: av.hatColor };
  return makeSprite(grid.map((r) => r.join('')), map);
}

export function composeFrames(av) {
  const out = {};
  for (const f of Object.keys(BODY)) out[f] = composeFrame(av, f);
  return out;
}

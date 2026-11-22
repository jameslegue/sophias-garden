import { BLOCKS } from '../blocks.js';

export const T = 8; // tile size in pixels
const BOUNCE = -5.6; // melon bounce - about twice a normal jump

// Off the sides or bottom counts as wall, so nobody falls out of the world.
export function tileAt(level, c, r) {
  if (c < 0 || c >= level.w || r >= level.h) return '#';
  if (r < 0) return '.';
  return level.tiles[r][c];
}

export const isSolid = (ch) => !!BLOCKS[ch]?.solid;
const oneway = (ch) => !!BLOCKS[ch]?.oneway;

export function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Move a body {x, y, w, h, vx, vy} through the tile map and moving platforms, X first then Y.
export function moveBody(b, level) {
  // X
  b.x += b.vx;
  const top = Math.floor(b.y / T);
  const bot = Math.floor((b.y + b.h - 0.01) / T);
  if (b.vx > 0) {
    const c = Math.floor((b.x + b.w - 0.01) / T);
    for (let r = top; r <= bot; r++) if (isSolid(tileAt(level, c, r))) { b.x = c * T - b.w; b.vx = 0; break; }
  } else if (b.vx < 0) {
    const c = Math.floor(b.x / T);
    for (let r = top; r <= bot; r++) if (isSolid(tileAt(level, c, r))) { b.x = (c + 1) * T; b.vx = 0; break; }
  }

  // Y
  const prevBottom = b.y + b.h;
  b.y += b.vy;
  b.onGround = false;
  b.platform = null;
  const left = Math.floor(b.x / T);
  const right = Math.floor((b.x + b.w - 0.01) / T);
  if (b.vy > 0) {
    let landY = Infinity, landTile = null, landPlat = null;
    const r = Math.floor((b.y + b.h - 0.01) / T);
    for (let c = left; c <= right; c++) {
      const ch = tileAt(level, c, r);
      // One-way blocks only catch you from above.
      if (isSolid(ch) || (oneway(ch) && prevBottom <= r * T + 0.01)) {
        landY = r * T; landTile = ch;
        if (BLOCKS[ch]?.bounce) break; // a melon wins if you touch one
      }
    }
    for (const p of level.platforms || []) {
      if (!p.active || b.x >= p.x + p.w || b.x + b.w <= p.x) continue;
      if (prevBottom <= p.y + 0.01 && b.y + b.h >= p.y && p.y < landY) { landY = p.y; landPlat = p; landTile = null; }
    }
    if (landY !== Infinity) {
      b.y = landY - b.h;
      if (BLOCKS[landTile]?.bounce) {
        b.vy = BOUNCE; b.bounced = true;
      } else {
        b.vy = 0; b.onGround = true; b.groundTile = landTile; b.platform = landPlat;
      }
    }
  } else if (b.vy < 0) {
    const r = Math.floor(b.y / T);
    for (let c = left; c <= right; c++) if (isSolid(tileAt(level, c, r))) { b.y = (r + 1) * T; b.vy = 0; break; }
  }
}

// Thorns only hurt in their spiky part, so near misses feel fair.
export function touchingHazard(b, level) {
  const c0 = Math.floor(b.x / T), c1 = Math.floor((b.x + b.w - 0.01) / T);
  const r0 = Math.floor(b.y / T), r1 = Math.floor((b.y + b.h - 0.01) / T);
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      if (!BLOCKS[tileAt(level, c, r)]?.hazard) continue;
      if (overlaps(b, { x: c * T + 1, y: r * T + 3, w: 6, h: 5 })) return true;
    }
  }
  return false;
}

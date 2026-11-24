import * as THREE from '../vendor/three.module.min.js';
import { FACES } from './voxels.js';
import { blockMaterial, TILE, TILE_COUNT } from './textures.js';

// Every block a 3D level can use. tex = [top, sides, bottom] tiles.
// Carrots and strawberries move/vanish, so they aren't part of the fixed block grid
// (see mechanics.js) - but they use the same look.
export const BLOCKS3D = {
  grass: { id: 1, solid: true, tex: [TILE.grassTop, TILE.grassSide, TILE.dirt] },
  dirt: { id: 2, solid: true, tex: [TILE.dirt, TILE.dirt, TILE.dirt] },
  brick: { id: 3, solid: true, tex: [TILE.brick, TILE.brick, TILE.brick] },
  vine: { id: 4, solid: true, tex: [TILE.leaf, TILE.leaf, TILE.leaf] },
  thorn: { id: 5, hazard: true, tex: [TILE.thorn, TILE.thorn, TILE.thorn] },
  branch: { id: 6, solid: true, tex: [TILE.leaves, TILE.wood, TILE.wood] },
  leaves: { id: 7, solid: true, tex: [TILE.leaves, TILE.leaves, TILE.leaves] },
  melon: { id: 8, solid: true, bounce: true, tex: [TILE.melonTop, TILE.melonSide, TILE.melonSide] },
  juice: { id: 9, solid: true, slippery: true, tex: [TILE.juice, TILE.dirt, TILE.dirt] },
  seedstep: { id: 10, solid: true, tex: [TILE.seedStep, TILE.seedStep, TILE.seedStep] },
  carrot: { id: 11, solid: true, tex: [TILE.carrotTop, TILE.carrotSide, TILE.carrotSide] },
  berry: { id: 12, solid: true, tex: [TILE.berryTop, TILE.berrySide, TILE.berrySide] },
};
export const BY_ID = [];
for (const b of Object.values(BLOCKS3D)) BY_ID[b.id] = b;

// Build a mesh from a box of block ids, skipping faces that touch another solid block.
export function blockMesh(w, h, d, getId) {
  const solid = (x, y, z) => !!BY_ID[getId(x, y, z)]?.solid;
  const pos = [], uv = [], col = [], idx = [];
  const eps = 0.001;
  for (let y = 0; y < h; y++) for (let z = 0; z < d; z++) for (let x = 0; x < w; x++) {
    const b = BY_ID[getId(x, y, z)];
    if (!b) continue;
    for (const f of FACES) {
      if (solid(x + f.dir[0], y + f.dir[1], z + f.dir[2])) continue;
      const tile = f.dir[1] > 0 ? b.tex[0] : f.dir[1] < 0 ? b.tex[2] : b.tex[1];
      const u0 = tile / TILE_COUNT + eps, u1 = (tile + 1) / TILE_COUNT - eps;
      const n = pos.length / 3;
      f.corners.forEach(([cx, cy, cz], i) => {
        pos.push(x + cx, y + cy, z + cz);
        uv.push(i === 0 || i === 3 ? u0 : u1, i < 2 ? eps : 1 - eps);
        col.push(f.shade, f.shade, f.shade);
      });
      idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return new THREE.Mesh(g, blockMaterial());
}

// A level is a box of blocks, like Minecraft. Level files list rectangular chunks of blocks:
// [x, y, z, width, height, depth, type]. Moving platforms live in `boxes`.
export class World {
  constructor(level) {
    [this.w, this.h, this.d] = level.size;
    this.grid = new Uint8Array(this.w * this.h * this.d);
    for (const [x0, y0, z0, w, h, d, type] of level.blocks) {
      const id = BLOCKS3D[type].id;
      for (let x = x0; x < x0 + w; x++) for (let y = y0; y < y0 + h; y++) for (let z = z0; z < z0 + d; z++) this.set(x, y, z, id);
    }
    this.boxes = []; // {x0,y0,z0,x1,y1,z1, active, type}
    this.mesh = blockMesh(this.w, this.h, this.d, (x, y, z) => this.get(x, y, z));
  }

  inside(x, y, z) { return x >= 0 && y >= 0 && z >= 0 && x < this.w && y < this.h && z < this.d; }
  get(x, y, z) { return this.inside(x, y, z) ? this.grid[(y * this.d + z) * this.w + x] : 0; }
  set(x, y, z, id) { if (this.inside(x, y, z)) this.grid[(y * this.d + z) * this.w + x] = id; }
  block(x, y, z) { return BY_ID[this.get(x, y, z)]; }
  solid(x, y, z) { return !!this.block(x, y, z)?.solid; }
  hazard(x, y, z) { return !!this.block(x, y, z)?.hazard; }

  // Top of the highest solid thing under a point (for the shadow), or null.
  groundBelow(x, y, z) {
    let best = null;
    const cx = Math.floor(x), cz = Math.floor(z);
    for (let cy = Math.floor(y); cy >= 0; cy--) if (this.solid(cx, cy, cz)) { best = cy + 1; break; }
    for (const b of this.boxes) {
      if (b.active && x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1 && b.y1 <= y + 0.01 && (best === null || b.y1 > best)) best = b.y1;
    }
    return best;
  }
}

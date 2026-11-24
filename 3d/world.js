import * as THREE from '../vendor/three.module.min.js';
import { FACES } from './voxels.js';
import { makeAtlas, TILE, TILE_COUNT } from './textures.js';

// Every block a 3D level can use. tex = [top, sides, bottom] tiles.
export const BLOCKS3D = {
  grass: { id: 1, solid: true, tex: [TILE.grassTop, TILE.grassSide, TILE.dirt] },
  dirt: { id: 2, solid: true, tex: [TILE.dirt, TILE.dirt, TILE.dirt] },
  brick: { id: 3, solid: true, tex: [TILE.brick, TILE.brick, TILE.brick] },
  vine: { id: 4, solid: true, tex: [TILE.leaf, TILE.leaf, TILE.leaf] },
  thorn: { id: 5, hazard: true, tex: [TILE.thorn, TILE.thorn, TILE.thorn] },
};
const BY_ID = [];
for (const b of Object.values(BLOCKS3D)) BY_ID[b.id] = b;

// A level is a box of blocks, like Minecraft. Level files list rectangular chunks of blocks:
// [x, y, z, width, height, depth, type].
export class World {
  constructor(level) {
    [this.w, this.h, this.d] = level.size;
    this.grid = new Uint8Array(this.w * this.h * this.d);
    for (const [x0, y0, z0, w, h, d, type] of level.blocks) {
      const id = BLOCKS3D[type].id;
      for (let x = x0; x < x0 + w; x++) for (let y = y0; y < y0 + h; y++) for (let z = z0; z < z0 + d; z++) this.set(x, y, z, id);
    }
    this.mesh = this.buildMesh();
  }

  inside(x, y, z) { return x >= 0 && y >= 0 && z >= 0 && x < this.w && y < this.h && z < this.d; }
  get(x, y, z) { return this.inside(x, y, z) ? this.grid[(y * this.d + z) * this.w + x] : 0; }
  set(x, y, z, id) { if (this.inside(x, y, z)) this.grid[(y * this.d + z) * this.w + x] = id; }
  solid(x, y, z) { return !!BY_ID[this.get(x, y, z)]?.solid; }
  hazard(x, y, z) { return !!BY_ID[this.get(x, y, z)]?.hazard; }

  // Top of the highest solid block under a point (for the shadow), or null.
  groundBelow(x, y, z) {
    const cx = Math.floor(x), cz = Math.floor(z);
    for (let cy = Math.floor(y); cy >= 0; cy--) if (this.solid(cx, cy, cz)) return cy + 1;
    return null;
  }

  buildMesh() {
    const pos = [], uv = [], col = [], idx = [];
    const eps = 0.001;
    for (let y = 0; y < this.h; y++) for (let z = 0; z < this.d; z++) for (let x = 0; x < this.w; x++) {
      const b = BY_ID[this.get(x, y, z)];
      if (!b) continue;
      for (const f of FACES) {
        if (this.solid(x + f.dir[0], y + f.dir[1], z + f.dir[2])) continue; // hidden face
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
    return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: makeAtlas(), vertexColors: true }));
  }
}

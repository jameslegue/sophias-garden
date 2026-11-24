import * as THREE from '../vendor/three.module.min.js';
import { PAL } from '../src/engine/palette.js';

// Cube faces: outward direction, the 4 corners (bottom-left, bottom-right, top-right,
// top-left as seen from outside), and how bright that side is (fake sunlight, Minecraft-style).
export const FACES = [
  { dir: [1, 0, 0], corners: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], shade: 0.8 },
  { dir: [-1, 0, 0], corners: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], shade: 0.8 },
  { dir: [0, 1, 0], corners: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], shade: 1.0 },
  { dir: [0, -1, 0], corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], shade: 0.55 },
  { dir: [0, 0, 1], corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], shade: 0.9 },
  { dir: [0, 0, -1], corners: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], shade: 0.7 },
];

const rgb = (letter) => new THREE.Color(PAL[letter]);

// Turn pixel art (rows of palette letters) into a chunky 3D model by pushing it out
// `depth(row)` blocks deep. color(letter, row, col, layer, depth) can recolor inner layers.
// The model's feet are at y=0, centered on x and z, front facing +z.
export function extrude(rows, { size, depth, color = (ch) => ch }) {
  const cells = new Map();
  const h = rows.length;
  rows.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === '.') return;
    const d = depth(r);
    for (let k = 0; k < d; k++) {
      const z = k - Math.floor(d / 2);
      cells.set(`${c},${h - 1 - r},${z}`, color(ch, r, c, k, d));
    }
  }));
  const w = Math.max(...rows.map((r) => r.length));
  return voxelGeometry(cells, size, -w / 2);
}

// Build one mesh from a set of colored cubes, skipping faces hidden between cubes.
export function voxelGeometry(cells, size, offsetX = 0) {
  const pos = [], col = [], idx = [];
  for (const [key, letter] of cells) {
    const [x, y, z] = key.split(',').map(Number);
    const base = rgb(letter);
    for (const f of FACES) {
      if (cells.has(`${x + f.dir[0]},${y + f.dir[1]},${z + f.dir[2]}`)) continue;
      const n = pos.length / 3;
      for (const [cx, cy, cz] of f.corners) {
        pos.push((x + cx + offsetX) * size, (y + cy) * size, (z + cz - 0.5) * size);
        col.push(base.r * f.shade, base.g * f.shade, base.b * f.shade);
      }
      idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}

export const voxelMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });

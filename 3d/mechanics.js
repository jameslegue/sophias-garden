import { blockMesh, BLOCKS3D } from './world.js';
import { extrude, voxelMaterial } from './voxels.js';
import { FRUITS } from '../src/sprites.js';
import * as THREE from '../vendor/three.module.min.js';

// A box of one block type (moving platforms are drawn as their own mesh).
function boxOf(type, w, h, d) {
  const id = BLOCKS3D[type].id;
  return blockMesh(w, h, d, (x, y, z) => (x >= 0 && y >= 0 && z >= 0 && x < w && y < h && z < d ? id : 0));
}

function platform(type, [x, y, z, w, h, d], scene, world) {
  const box = { x0: x, y0: y, z0: z, x1: x + w, y1: y + h, z1: z + d, active: true, moving: true, block: BLOCKS3D[type] };
  world.boxes.push(box);
  const mesh = boxOf(type, w, h, d);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  return { box, mesh, x, base: y, h };
}

// Carrot floor: sinks while you stand on it (into the thorns!), pops back up when you leave.
export class SinkingCarrot {
  constructor(spec, scene, world) { Object.assign(this, platform('carrot', spec, scene, world)); }

  update(dt, player) {
    const on = player.groundBox === this.box;
    const y = on ? Math.max(this.base - 2.6, this.box.y0 - 0.55 * dt) : Math.min(this.base, this.box.y0 + 1.2 * dt);
    if (on) player.pos.y += y - this.box.y0; // carry the player down with it
    this.box.y0 = y;
    this.box.y1 = y + this.h;
    this.mesh.position.y = y;
  }
}

// Strawberry floor: wobbles once you land, vanishes, then grows back.
export class VanishingBerry {
  constructor(spec, scene, world) {
    Object.assign(this, platform('berry', spec, scene, world));
    this.t = 0;
    this.gone = 0;
  }

  update(dt, player) {
    if (this.gone > 0) {
      this.gone -= dt;
      this.mesh.visible = this.gone < 0.7 && Math.floor(this.gone * 10) % 2 === 0; // blinks back in
      if (this.gone <= 0) { this.box.active = true; this.mesh.visible = true; this.t = 0; }
      return;
    }
    if (this.t > 0 || player.groundBox === this.box) this.t += dt;
    this.mesh.position.x = this.x + (this.t > 0 ? Math.sin(this.t * 45) * 0.05 : 0);
    if (this.t > 0.7) { this.box.active = false; this.mesh.visible = false; this.gone = 3; }
  }
}

// Apple floor: an apple hangs from the leaves, wiggles, then drops.
const PERIOD = 2.6;
const WARN = 0.9;
const appleRows = FRUITS.find((f) => f.id === 'apple').icon;
export const appleModel = () => new THREE.Mesh(extrude(appleRows, { size: 0.1, depth: () => 7 }), voxelMaterial);

export class AppleTree {
  constructor([x, y, z], scene) {
    this.x = x + 0.5; this.y = y; this.z = z + 0.5;
    this.t = ((x * 7 + z * 13 + y * 3) % 26) / 10; // spread the drops out
    this.hanging = appleModel();
    this.hanging.position.set(this.x, this.y, this.z);
    scene.add(this.hanging);
  }

  update(dt, apples, scene) {
    this.t += dt;
    if (this.t >= PERIOD) {
      this.t = 0;
      const m = appleModel();
      m.position.set(this.x, this.y, this.z);
      scene.add(m);
      apples.push({ mesh: m, vy: 0 });
    }
    this.hanging.visible = this.t > 0.5;
    this.hanging.rotation.z = this.t > PERIOD - WARN ? Math.sin(this.t * 30) * 0.3 : 0;
  }
}

// Move falling apples; returns true if one hit the player.
export function updateApples(dt, apples, world, player, scene) {
  let hit = false;
  for (let i = apples.length - 1; i >= 0; i--) {
    const a = apples[i];
    a.vy = Math.max(a.vy - 18 * dt, -14);
    a.mesh.position.y += a.vy * dt;
    const p = a.mesh.position;
    if (Math.hypot(p.x - player.pos.x, p.z - player.pos.z) < 0.55 && Math.abs(p.y + 0.35 - (player.pos.y + 0.75)) < 1.05) hit = true;
    if (world.solid(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z)) || p.y < -10) {
      scene.remove(a.mesh);
      apples.splice(i, 1);
    }
  }
  return hit;
}

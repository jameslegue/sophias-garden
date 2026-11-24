import * as THREE from '../vendor/three.module.min.js';
import { World } from './world.js';
import { Player3D } from './player.js';
import { Controls } from './controls.js';
import { Hud } from './hud.js';
import { extrude, voxelMaterial } from './voxels.js';
import { composeRows, DEFAULT_AVATAR } from '../src/avatar/compose.js';
import { ROWS } from '../src/sprites.js';
import { PAL } from '../src/engine/palette.js';
import { load } from '../src/engine/save.js';
import { sfx, unlock, setMuted } from '../src/engine/audio.js';
import { playSong } from '../src/engine/music.js';

// ---------- setup ----------
const view = document.getElementById('view');
const renderer = new THREE.WebGLRenderer({ canvas: view, antialias: false });
const scene = new THREE.Scene();
scene.background = new THREE.Color(PAL.S);
scene.fog = new THREE.Fog(PAL.S, 28, 70);
const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 200);
const hud = new Hud(document.getElementById('hud'));

// Draw the 3D view at a low resolution and blow it up, so it stays chunky and 8-bit
// (and runs fast on phones).
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setPixelRatio(Math.min(w, h) / 200 < 1 ? 1 : 200 / Math.min(w, h));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w < h ? 75 : 60; // tall phone screens need a wider view
  camera.updateProjectionMatrix();
  hud.resize();
}
addEventListener('resize', resize);
resize();

const settings = load('settings', { muted: false });
setMuted(settings.muted);
let started = false;
const controls = new Controls(view, document.getElementById('jump'), document.getElementById('joy'), document.getElementById('knob'), () => {
  unlock();
  if (!started) { started = true; playSong('title'); }
});

const level = await (await fetch('levels/rose.json', { cache: 'no-cache' })).json();
const world = new World(level);
scene.add(world.mesh);

// ---------- models (made from the 2D pixel art) ----------
const avatar = load('avatar', DEFAULT_AVATAR);

// The avatar: head 6 blocks deep, body 4. Eyes only on the front; the back of the head is hair.
function avatarModel(frame) {
  const rows = composeRows(avatar, frame);
  return new THREE.Mesh(extrude(rows, {
    size: 0.125,
    depth: (r) => (r < 6 ? 6 : 4),
    color: (ch, r, c, layer, d) => {
      if (layer === d - 1) return ch;                          // the face is only on the front
      const c2 = r < 6 && ch === 'K' ? avatar.skin : ch;       // no eyes on the sides or back
      if (r < 6 && avatar.hair !== 'NONE' && layer < d - 2 && c2 === avatar.skin) return avatar.hairColor; // back of head is hair
      return c2;
    },
  }), voxelMaterial);
}
const playerModel = new THREE.Group();
const frames = {};
for (const f of ['idle', 'run1', 'run2', 'jump']) { frames[f] = avatarModel(f); playerModel.add(frames[f]); }
scene.add(playerModel);
const showFrame = (name) => { for (const k in frames) frames[k].visible = k === name; };

// Rosie: her side view, 5 blocks thick. Eyes on both sides only.
const rosieModel = new THREE.Mesh(extrude(ROWS.ROSIE, {
  size: 0.09,
  depth: () => 5,
  color: (ch, r, c, layer, d) => (ch === 'K' && layer > 0 && layer < d - 1 ? 'R' : ch),
}), voxelMaterial);
const rosie = new THREE.Group();
rosie.add(rosieModel);
scene.add(rosie);

const seedRows = ROWS.SEED.map((r) => r.replaceAll('X', 'M'));
const seedModel = new THREE.Mesh(extrude(seedRows, { size: 0.12, depth: () => 3 }), voxelMaterial);
scene.add(seedModel);

// Checkpoint flowers: two crossed flat flowers, like Minecraft plants.
function flower(rows) {
  const g = new THREE.Group();
  for (const rot of [Math.PI / 4, -Math.PI / 4]) {
    const m = new THREE.Mesh(extrude(rows, { size: 0.14, depth: () => 1 }), voxelMaterial);
    m.rotation.y = rot;
    g.add(m);
  }
  return g;
}
const checkpoints = level.checkpoints.map((p) => {
  const off = flower(ROWS.CHECKPOINT_OFF), on = flower(ROWS.CHECKPOINT_ON);
  on.visible = false;
  for (const m of [off, on]) { m.position.set(p[0], p[1], p[2]); scene.add(m); }
  return { pos: p, off, on, active: false };
});

// Round shadow under the player, so it's easy to see where you'll land.
const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.36, 12), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 }));
shadow.rotation.x = -Math.PI / 2;
scene.add(shadow);

// ---------- game state ----------
const player = new Player3D(...level.start);
player.facing = level.startYaw + Math.PI; // face away from the camera, toward the tower
let respawn = level.start;
let state = 'play';  // play -> collect -> done
let camYaw = level.startYaw;
let camPitch = 0.42;
const camTarget = new THREE.Vector3(level.start[0], level.start[1] + 1.1, level.start[2]);
const trail = [];
let rosieMode = 'follow';
let rosieCarry = false;
let anim = 0;
let time = 0;
let doneTimer = 0;
rosie.position.set(level.start[0] - 1, level.start[1], level.start[2] + 0.5);

function die() {
  sfx.hurt();
  hud.flash = 0.5;
  player.respawn(respawn);
  rosie.position.set(respawn[0] - 0.8, respawn[1], respawn[2]);
  trail.length = 0;
}

document.getElementById('again').addEventListener('click', () => location.reload());

// ---------- every frame ----------
function step(dt) {
  time += dt;
  const look = controls.takeLook(dt);
  camYaw += look.yaw;
  camPitch = Math.max(0.05, Math.min(1.2, camPitch + look.pitch));

  // Joystick is relative to where the camera is looking.
  const inp = state === 'play' ? controls.move() : { x: 0, y: 0 };
  const fwd = { x: -Math.sin(camYaw), z: -Math.cos(camYaw) };
  const right = { x: Math.cos(camYaw), z: -Math.sin(camYaw) };
  const move = { x: fwd.x * inp.y + right.x * inp.x, z: fwd.z * inp.y + right.z * inp.x };
  const jump = controls.takeJump() && state === 'play';
  player.update(dt, move, jump, world);
  if (player.jumped) sfx.jump();

  if (state === 'play') {
    if (player.touchingHazard(world) || player.pos.y < level.fallY) die();

    for (const cp of checkpoints) {
      const [x, y, z] = cp.pos;
      if (!cp.active && Math.hypot(player.pos.x - x, player.pos.z - z) < 1 && Math.abs(player.pos.y - y) < 1.5) {
        checkpoints.forEach((o) => { o.active = false; o.on.visible = false; o.off.visible = true; });
        cp.active = true; cp.on.visible = true; cp.off.visible = false;
        respawn = [x, y, z];
        sfx.checkpoint();
        hud.popup('SAVED!', 'M');
      }
    }

    const [sx, sy, sz] = level.seed;
    if (Math.hypot(player.pos.x - sx, player.pos.z - sz) < 1.1 && Math.abs(player.pos.y + 0.7 - sy) < 1.6) {
      state = 'collect';
      rosieMode = 'fetch';
      // if Rosie is way behind, she catches up first
      if (rosie.position.distanceTo(new THREE.Vector3(player.pos.x, player.pos.y, player.pos.z)) > 3) rosie.position.set(player.pos.x - 0.8, player.pos.y, player.pos.z);
    }
  }

  // Rosie follows the path you took a moment ago.
  trail.push({ t: time, x: player.pos.x, y: player.pos.y, z: player.pos.z, f: player.facing });
  while (trail.length > 2 && trail[1].t < time - 0.35) trail.shift();
  const prev = rosie.position.clone();
  if (rosieMode === 'fetch') {
    const target = new THREE.Vector3(level.seed[0], level.seed[1] - 0.6, level.seed[2]);
    const d = target.clone().sub(rosie.position);
    if (d.length() < 0.15) {
      rosieMode = 'follow';
      rosieCarry = true;
      state = 'done';
      doneTimer = 2.2;
      sfx.seed();
      sfx.bark();
      hud.popup('+1 ROSE SEED!', 'Y');
    } else rosie.position.add(d.clampLength(0, 7 * dt));
  } else if (trail[0].t <= time - 0.3) {
    const t = trail[0];
    const goal = new THREE.Vector3(t.x - Math.sin(t.f) * 0.9, t.y, t.z - Math.cos(t.f) * 0.9);
    rosie.position.lerp(goal, 1 - Math.exp(-10 * dt));
    if (rosie.position.distanceTo(new THREE.Vector3(player.pos.x, player.pos.y, player.pos.z)) > 10) rosie.position.copy(goal);
  }
  const moved = rosie.position.clone().sub(prev);
  if (Math.hypot(moved.x, moved.z) > 0.002) rosie.rotation.y = Math.atan2(moved.x, moved.z) - Math.PI / 2;
  rosieModel.position.y = Math.hypot(moved.x, moved.z) > 0.01 ? Math.abs(Math.sin(time * 14)) * 0.1 : 0;

  if (state === 'done' && doneTimer > 0 && (doneTimer -= dt) <= 0) document.getElementById('end').style.display = 'flex';

  // Seed: spins and bobs; after Rosie grabs it, she carries it on her head.
  if (rosieCarry) {
    seedModel.position.set(rosie.position.x, rosie.position.y + 0.85, rosie.position.z);
  } else {
    seedModel.position.set(level.seed[0], level.seed[1] - 0.4 + Math.sin(time * 3) * 0.12, level.seed[2]);
  }
  seedModel.rotation.y += dt * 2;

  // Player model + animation
  playerModel.position.set(player.pos.x, player.pos.y, player.pos.z);
  playerModel.rotation.y = player.facing;
  const speed = Math.hypot(player.vel.x, player.vel.z);
  anim += dt * speed * 2.2;
  if (!player.onGround) showFrame('jump');
  else if (speed > 0.5) showFrame(['run1', 'idle', 'run2', 'idle'][Math.floor(anim) % 4]);
  else showFrame('idle');

  const g = world.groundBelow(player.pos.x, player.pos.y + 0.01, player.pos.z);
  shadow.visible = g !== null;
  if (g !== null) {
    shadow.position.set(player.pos.x, g + 0.02, player.pos.z);
    shadow.scale.setScalar(Math.max(0.4, 1 - (player.pos.y - g) * 0.08));
  }

  // Third-person camera that won't go inside blocks.
  camTarget.lerp(new THREE.Vector3(player.pos.x, player.pos.y + 1.1, player.pos.z), 1 - Math.exp(-12 * dt));
  const dir = new THREE.Vector3(Math.sin(camYaw) * Math.cos(camPitch), Math.sin(camPitch), Math.cos(camYaw) * Math.cos(camPitch));
  let dist = 7;
  for (let d = 0.5; d <= 7; d += 0.25) {
    const p = camTarget.clone().addScaledVector(dir, d);
    if (world.solid(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z))) { dist = Math.max(1, d - 0.4); break; }
  }
  camera.position.copy(camTarget).addScaledVector(dir, dist);
  camera.lookAt(camTarget);

  const saved = checkpoints.filter((c) => c.active).length ? checkpoints.findIndex((c) => c.active) + 1 : 0;
  hud.draw(dt, { title: 'ROSE TOWER 3D', status: state === 'play' ? `FLOWER ${saved}/${checkpoints.length}` : 'GOT IT!' });
}

let last = performance.now();
function frame(now) {
  let dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  // small physics steps so fast falls never skip through a block
  while (dt > 0) { const s = Math.min(dt, 1 / 60); step(s); dt -= s; }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

window.__game3d = { player, world, level, checkpoints, get state() { return state; }, setYaw: (y) => { camYaw = y; } };

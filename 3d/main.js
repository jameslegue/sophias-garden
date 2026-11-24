import * as THREE from '../vendor/three.module.min.js';
import { World } from './world.js';
import { Player3D } from './player.js';
import { Controls } from './controls.js';
import { Hud } from './hud.js';
import { extrude, voxelMaterial } from './voxels.js';
import { SinkingCarrot, VanishingBerry, AppleTree, updateApples } from './mechanics.js';
import { Battle } from './boss.js';
import { composeRows, DEFAULT_AVATAR } from '../src/avatar/compose.js';
import { ROWS, FRUITS, fruitById } from '../src/sprites.js';
import { load, save } from '../src/engine/save.js';
import { sfx, unlock, setMuted } from '../src/engine/audio.js';
import { playSong } from '../src/engine/music.js';

// ---------- which level? ----------
// /3d/ shows the menu; /3d/?level=carrot plays a floor. Each floor is its own page load,
// which keeps things simple and means a fresh start every floor.
const LEVELS = ['rose', 'carrot', 'apple', 'melon', 'strawberry', 'battle'];
const NAMES = { rose: 'ROSE TOWER', carrot: 'CARROT TOWER', apple: 'APPLE TOWER', melon: 'MELON TOWER', strawberry: 'STRAWBERRY TOWER', battle: 'BATTLE VS SOPHIA' };
const TIPS = {
  rose: 'WATCH OUT FOR THORNS!',
  carrot: "CARROTS SINK - DON'T STOP!",
  apple: 'WATCH FOR FALLING APPLES!',
  melon: 'MELONS BOUNCE! JUICE IS SLIPPY!',
  strawberry: "BERRIES VANISH - DON'T WAIT!",
};
const asked = new URLSearchParams(location.search).get('level');
const levelId = LEVELS.includes(asked) ? asked : null;
const go = (id) => { location.search = `?level=${id}`; };

// 3D seeds are saved separately from the 2D game.
const progress = load('progress3d', { seeds: [], won: false });
const saveProgress = () => save('progress3d', progress);
const nextLevel = () => FRUITS.find((f) => !progress.seeds.includes(f.id))?.id || 'battle';

// ---------- setup ----------
const view = document.getElementById('view');
const renderer = new THREE.WebGLRenderer({ canvas: view, antialias: false });
const scene = new THREE.Scene();
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
  if (!started) { started = true; playSong(levelId === 'battle' ? 'battle' : 'title'); }
});

// The menu shows Rose Tower spinning slowly behind it.
const level = await (await fetch(`levels/${levelId || 'rose'}.json`, { cache: 'no-cache' })).json();
scene.background = new THREE.Color(level.sky);
scene.fog = new THREE.Fog(level.sky, 28, 70);
const world = new World(level);
scene.add(world.mesh);

// ---------- menu / end screens ----------
const panel = document.getElementById('panel');
function showPanel(title, msg, buttons) {
  panel.querySelector('.title').innerHTML = title;
  panel.querySelector('.msg').innerHTML = msg;
  const box = panel.querySelector('.buttons');
  box.innerHTML = '';
  for (const b of buttons) {
    const el = document.createElement(b.href ? 'a' : 'button');
    el.textContent = b.label;
    if (b.href) el.href = b.href; else el.addEventListener('click', b.go);
    if (b.main) el.className = 'main';
    box.appendChild(el);
  }
  panel.style.display = 'flex';
}

if (!levelId) {
  const next = nextLevel();
  const buttons = [];
  if (progress.seeds.length || progress.won) buttons.push({ label: `CONTINUE: ${NAMES[next].replace(' TOWER', '')}`, main: true, go: () => go(next) });
  buttons.push({ label: progress.seeds.length ? 'START OVER' : 'PLAY', main: !progress.seeds.length, go: () => { progress.seeds = []; saveProgress(); go('rose'); } });
  buttons.push({ label: 'BACK TO 2D GAME', href: '../' });
  showPanel("SOPHIA'S<br>GARDEN 3D", `${progress.seeds.length}/5 SEEDS${progress.won ? ' - LEVEL 1 COMPLETE!' : ''}`, buttons);
}

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

// Seeds (each fruit's seed color), used on the tower top and when Rosie carries one.
const seedModel = (id) => new THREE.Mesh(extrude(ROWS.SEED.map((r) => r.replaceAll('X', fruitById(id).seed)), { size: 0.12, depth: () => 3 }), voxelMaterial);
const goalSeed = level.fruit ? seedModel(level.fruit) : null;
if (goalSeed) scene.add(goalSeed);
const carried = {};
for (const f of FRUITS) { carried[f.id] = seedModel(f.id); carried[f.id].visible = false; carried[f.id].scale.setScalar(0.7); scene.add(carried[f.id]); }
let carrying = null;

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

// Each floor's trick blocks
const platforms = level.dynamic.map((spec) => (spec[6] === 'carrot' ? new SinkingCarrot(spec, scene, world) : new VanishingBerry(spec, scene, world)));
const trees = level.apples.map((p) => new AppleTree(p, scene));
const apples = [];

// Round shadow under the player, so it's easy to see where you'll land.
const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.36, 12), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 }));
shadow.rotation.x = -Math.PI / 2;
scene.add(shadow);

// ---------- game state ----------
const player = new Player3D(...level.start);
player.facing = level.startYaw + Math.PI; // face away from the camera
let respawn = level.start;
let state = levelId ? 'play' : 'menu'; // menu | play | collect | done
let camYaw = level.startYaw;
let camPitch = 0.42;
const camTarget = new THREE.Vector3(level.start[0], level.start[1] + 1.1, level.start[2]);
const trail = [];
let rosieMode = 'follow';
let fetchTarget = null;
let fetchDone = null;
let anim = 0;
let time = 0;
rosie.position.set(level.start[0] - 1, level.start[1], level.start[2] + 0.5);
if (levelId && levelId !== 'battle') hud.hint = ['LEFT SIDE: MOVE', 'RIGHT SIDE: LOOK', TIPS[levelId], 'GET THE SEED ON TOP!'];

const rosieApi = {
  fetch(target, done) {
    rosieMode = 'fetch';
    fetchTarget = target;
    fetchDone = done;
    // if Rosie is way behind, she catches up first
    if (rosie.position.distanceTo(new THREE.Vector3(player.pos.x, player.pos.y, player.pos.z)) > 3) rosie.position.set(player.pos.x - 0.8, player.pos.y, player.pos.z);
  },
  carry(id) { carrying = id; },
};

function die() {
  sfx.hurt();
  hud.flash = 0.5;
  player.respawn(respawn);
  rosie.position.set(respawn[0] - 0.8, respawn[1], respawn[2]);
  trail.length = 0;
  battle?.onRespawn();
}

const battle = levelId === 'battle' ? new Battle({
  scene, world, level, hud, player, die, rosie: rosieApi,
  onWin() {
    progress.won = true;
    saveProgress();
    showPanel('LEVEL 1<br>COMPLETE!', "SOPHIA'S GARDEN IS BLOOMING!", [
      { label: 'PLAY BATTLE AGAIN', main: true, go: () => go('battle') },
      { label: 'START OVER', go: () => { progress.seeds = []; saveProgress(); go('rose'); } },
      { label: 'BACK TO 2D GAME', href: '../' },
    ]);
  },
}) : null;

function floorDone() {
  const f = fruitById(level.fruit);
  if (!progress.seeds.includes(f.id)) progress.seeds.push(f.id);
  saveProgress();
  const nxt = level.next;
  showPanel(`YOU GOT THE<br>${f.name} SEED!`, nxt === 'battle' ? 'ALL 5 SEEDS! SOPHIA IS WAITING AT THE TOP... AND SHE IS MAD!' : 'ROSIE WILL CARRY IT FOR SOPHIA.', [
    { label: `NEXT: ${NAMES[nxt].replace(' TOWER', '')}`, main: true, go: () => go(nxt) },
    { label: 'PLAY AGAIN', go: () => go(levelId) },
    { label: 'BACK TO 2D GAME', href: '../' },
  ]);
}

// ---------- every frame ----------
const playerVec = () => new THREE.Vector3(player.pos.x, player.pos.y, player.pos.z);

function step(dt) {
  time += dt;
  const look = controls.takeLook(dt);
  camYaw += look.yaw;
  camPitch = Math.max(0.05, Math.min(1.2, camPitch + look.pitch));

  // Joystick is relative to where the camera is looking.
  const playing = state === 'play';
  const inp = playing ? controls.move() : { x: 0, y: 0 };
  const fwd = { x: -Math.sin(camYaw), z: -Math.cos(camYaw) };
  const right = { x: Math.cos(camYaw), z: -Math.sin(camYaw) };
  const move = { x: fwd.x * inp.y + right.x * inp.x, z: fwd.z * inp.y + right.z * inp.x };
  const jump = controls.takeJump() && playing;
  for (const p of platforms) p.update(dt, player);
  player.update(dt, move, jump, world);
  if (player.jumped) sfx.jump();
  if (player.bounced) sfx.bounce();
  for (const t of trees) t.update(dt, apples, scene);
  const appleHit = updateApples(dt, apples, world, player, scene);

  if (playing) {
    if (appleHit || player.touchingHazard(world) || player.pos.y < level.fallY) die();

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

    if (level.seed) {
      const [sx, sy, sz] = level.seed;
      if (Math.hypot(player.pos.x - sx, player.pos.z - sz) < 1.1 && Math.abs(player.pos.y + 0.7 - sy) < 1.6) {
        state = 'collect';
        rosieApi.fetch(new THREE.Vector3(sx, sy - 0.6, sz), () => {
          goalSeed.visible = false;
          carrying = level.fruit;
          state = 'done';
          sfx.seed();
          sfx.bark();
          hud.popup(`+1 ${fruitById(level.fruit).name} SEED!`, 'Y');
          setTimeout(floorDone, 2200);
        });
      }
    }
    battle?.update(dt);
  }

  // Rosie follows the path you took a moment ago (or runs to fetch something).
  trail.push({ t: time, x: player.pos.x, y: player.pos.y, z: player.pos.z, f: player.facing });
  while (trail.length > 2 && trail[1].t < time - 0.35) trail.shift();
  const prev = rosie.position.clone();
  if (rosieMode === 'fetch') {
    const d = fetchTarget.clone().sub(rosie.position);
    if (d.length() < 0.15) {
      rosieMode = 'follow';
      const done = fetchDone;
      fetchDone = null;
      done?.();
    } else rosie.position.add(d.clampLength(0, 7 * dt));
  } else if (trail[0].t <= time - 0.3) {
    const t = trail[0];
    // a little behind you and off to the side, so she doesn't block the camera
    const goal = new THREE.Vector3(t.x - Math.sin(t.f) * 0.6 + Math.cos(t.f) * 0.8, t.y, t.z - Math.cos(t.f) * 0.6 - Math.sin(t.f) * 0.8);
    rosie.position.lerp(goal, 1 - Math.exp(-10 * dt));
    if (rosie.position.distanceTo(playerVec()) > 10) rosie.position.copy(goal);
  }
  const moved = rosie.position.clone().sub(prev);
  if (Math.hypot(moved.x, moved.z) > 0.002) rosie.rotation.y = Math.atan2(moved.x, moved.z) - Math.PI / 2;
  rosieModel.position.y = Math.hypot(moved.x, moved.z) > 0.01 ? Math.abs(Math.sin(time * 14)) * 0.1 : 0;

  // Seeds: the goal spins and bobs; the one Rosie carries sits on her head.
  if (goalSeed) {
    goalSeed.position.set(level.seed[0], level.seed[1] - 0.4 + Math.sin(time * 3) * 0.12, level.seed[2]);
    goalSeed.rotation.y += dt * 2;
  }
  for (const f of FRUITS) {
    const m = carried[f.id];
    m.visible = carrying === f.id;
    if (m.visible) { m.position.set(rosie.position.x, rosie.position.y + 0.85, rosie.position.z); m.rotation.y += dt * 2; }
  }

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

  // Third-person camera that won't go inside blocks. On the menu it slowly circles the tower.
  if (state === 'menu') {
    camYaw += dt * 0.25;
    camTarget.set(9.5, 12, 9.5);
  } else {
    camTarget.lerp(new THREE.Vector3(player.pos.x, player.pos.y + 1.1, player.pos.z), 1 - Math.exp(-12 * dt));
  }
  const dir = new THREE.Vector3(Math.sin(camYaw) * Math.cos(camPitch), Math.sin(camPitch), Math.cos(camYaw) * Math.cos(camPitch));
  const maxDist = state === 'menu' ? 22 : 7;
  let dist = maxDist;
  if (state !== 'menu') {
    for (let d = 0.5; d <= maxDist; d += 0.25) {
      const p = camTarget.clone().addScaledVector(dir, d);
      if (world.solid(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z))) { dist = Math.max(1, d - 0.4); break; }
    }
  }
  camera.position.copy(camTarget).addScaledVector(dir, dist);
  camera.lookAt(camTarget);
}

let last = performance.now();
function frame(now) {
  let dt = Math.min(0.05, (now - last) / 1000);
  const frameDt = dt;
  last = now;
  // small physics steps so fast falls never skip through a block
  while (dt > 0) { const s = Math.min(dt, 1 / 60); step(s); dt -= s; }
  hud.draw(frameDt, { title: state === 'menu' ? '3D' : level.name, seeds: battle ? battle.delivered : progress.seeds });
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

window.__game3d = {
  player, world, level, checkpoints, platforms, apples, battle, progress,
  get state() { return state; },
  setYaw: (y) => { camYaw = y; },
};

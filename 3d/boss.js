import * as THREE from '../vendor/three.module.min.js';
import { extrude, voxelMaterial } from './voxels.js';
import { ROWS, FRUITS } from '../src/sprites.js';
import { sfx } from '../src/engine/audio.js';
import { playSong } from '../src/engine/music.js';

// Battle vs Sophia, 3D. Same rules Sophia made for the 2D game: she's MAD, throws fruit
// from a karate stance and cartwheels away. When she's dizzy, run to her and Rosie hands
// her a seed. Five seeds and her garden blooms.

const THROWS = [3, 4, 4, 5, 6];
const DIZZY = 6;
const GRAVITY = 20;
const LINES = [
  "A ROSE SEED? ...HMPH. THAT WON'T STOP ME! HI-YA!",
  "A CARROT SEED?! I DO LIKE CARROTS... BUT I'M STILL MAD!",
  'AN APPLE SEED... WAIT. ARE THESE FOR MY GARDEN?',
  "MELON! MY FAVORITE! I'M ONLY A LITTLE BIT MAD NOW.",
];
const INTRO = [
  ['SOPHIA', 'WHO IS CLIMBING MY TOWER?!'],
  ['SOPHIA', 'HI-YA! NOBODY GETS INTO MY GARDEN!'],
  ['', 'KEEP MOVING TO DODGE HER FRUIT. WHEN SHE IS DIZZY, RUN TO HER!'],
];

// Sophia in blocks: head 6 deep, body 4. Face only on the front, hair on the back.
function sophiaModel(rows) {
  return new THREE.Mesh(extrude(rows, {
    size: 0.13,
    depth: (r) => (r < 8 ? 6 : 4),
    color: (ch, r, c, layer, d) => {
      if (layer === d - 1) return ch;
      const c2 = r < 8 && (ch === 'K' || ch === 'R') ? 'Y' : ch;
      return r < 8 && layer < d - 2 && c2 === 'Y' ? 'D' : c2;
    },
  }), voxelMaterial);
}

const fruitModel = (id, size = 0.1) => new THREE.Mesh(extrude(FRUITS.find((f) => f.id === id).icon, { size, depth: () => 7 }), voxelMaterial);

export class Battle {
  // game: { scene, world, level, hud, player, die(), rosie: { fetch(pos, cb), carry(id) }, onWin() }
  constructor(game) {
    this.g = game;
    const b = game.level.battle;
    this.spots = b.spots.map(([x, y, z]) => new THREE.Vector3(x, y, z));
    this.round = 0;
    this.fruits = [];
    this.plants = [];
    this.confetti = [];
    this.time = 0;

    // Sophia: an outer group that turns to face you, and an inner pivot for cartwheels
    this.group = new THREE.Group();
    this.pivot = new THREE.Group();
    this.pivot.position.y = 1.05;
    this.group.add(this.pivot);
    this.frames = {};
    for (const [k, rows] of Object.entries(ROWS.SOPHIA)) {
      const m = sophiaModel(rows);
      m.position.y = -1.05;
      this.frames[k] = m;
      this.pivot.add(m);
    }
    this.group.position.copy(this.spots[1]);
    game.scene.add(this.group);

    // Dizzy stars
    this.stars = [0, 1, 2].map(() => {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), new THREE.MeshBasicMaterial({ color: 0xffcd75 }));
      game.scene.add(s);
      return s;
    });

    this.phase = 'wait';
    this.timer = 0;
    INTRO.forEach(([who, text], i) => setTimeout(() => game.hud.say(who, text, 2.6), i * 2700));
    this.timer = INTRO.length * 2.7;
    this.show('stance');
    playSong('battle');
  }

  get fruit() { return FRUITS[this.round]; }
  get delivered() { return FRUITS.slice(0, this.round).map((f) => f.id); }

  show(name) { for (const k in this.frames) this.frames[k].visible = k === name; }

  startRound() {
    this.throwsLeft = THROWS[this.round];
    this.phase = 'stance';
    this.timer = 0.9;
    this.pivot.rotation.z = 0;
    this.g.rosie.carry(null);
  }

  // Got hit: start this round again, Sophia jumps to the spot farthest from you.
  onRespawn() {
    for (const f of this.fruits) this.g.scene.remove(f.mesh);
    this.fruits = [];
    if (this.phase === 'wait' || this.phase === 'happy' || this.phase === 'still') return;
    const p = this.playerVec();
    this.group.position.copy(this.spots.reduce((a, s) => (s.distanceTo(p) > a.distanceTo(p) ? s : a)));
    this.startRound();
  }

  playerVec() { const q = this.g.player.pos; return new THREE.Vector3(q.x, q.y, q.z); }

  update(dt) {
    this.time += dt;
    const s = this.group.position;
    const p = this.playerVec();
    this.timer -= dt;

    if (this.phase !== 'cartwheel') this.group.rotation.y = Math.atan2(p.x - s.x, p.z - s.z);

    switch (this.phase) {
      case 'wait':
        if (this.timer <= 0) this.startRound();
        break;

      case 'stance':
        this.show('stance');
        if (this.timer > 0) break;
        if (this.throwsLeft > 0) { this.phase = 'throw'; this.timer = 0.4; this.thrown = false; }
        else {
          this.phase = 'dizzy';
          this.timer = DIZZY;
          this.g.rosie.carry(this.fruit.id);
          this.g.hud.popup('SHE IS DIZZY! GO!', 'Y');
        }
        break;

      case 'throw':
        this.show('throw');
        if (!this.thrown && this.timer < 0.2) { this.thrown = true; this.throwFruit(p); }
        if (this.timer <= 0) {
          this.throwsLeft--;
          const options = this.spots.filter((x) => x.distanceTo(s) > 0.5);
          this.target = options[Math.floor(Math.random() * options.length)];
          this.phase = 'cartwheel';
          // a real cartwheel goes sideways: face across the direction she travels
          this.group.rotation.y = Math.atan2(this.target.x - s.x, this.target.z - s.z) + Math.PI / 2;
        }
        break;

      case 'cartwheel': {
        this.show('stance');
        const speed = 4 + this.round * 0.5;
        const d = this.target.clone().sub(s);
        if (d.length() <= speed * dt) {
          s.copy(this.target);
          this.pivot.rotation.z = 0;
          this.phase = 'stance';
          this.timer = Math.max(0.35, 0.9 - this.round * 0.12);
        } else {
          s.addScaledVector(d.normalize(), speed * dt);
          this.pivot.rotation.z -= dt * 11; // round and round
        }
        break;
      }

      case 'dizzy':
        this.show('dizzy');
        if (Math.hypot(p.x - s.x, p.z - s.z) < 1.3 && Math.abs(p.y - s.y) < 1.5) this.deliver();
        else if (this.timer <= 0) {
          this.g.hud.popup('SHE IS MAD AGAIN!', 'R');
          this.g.rosie.carry(null);
          this.startRound();
        }
        break;

      case 'happy':
        this.show('happy');
        this.frames.happy.position.y = -1.05 + Math.abs(Math.sin(this.time * 6)) * 0.4;
        break;

      default:
        break;
    }

    // Dizzy stars circle her head
    const dizzy = this.phase === 'dizzy' || this.phase === 'still';
    this.stars.forEach((st, i) => {
      st.visible = dizzy;
      const a = this.time * 4 + (i * Math.PI * 2) / 3;
      st.position.set(s.x + Math.cos(a) * 0.6, s.y + 2.3, s.z + Math.sin(a) * 0.6);
    });

    this.updateFruits(dt);
    this.updatePlants(dt);
    this.updateConfetti(dt);
  }

  // Lob the fruit so it lands where you're standing right now.
  throwFruit(p) {
    const s = this.group.position;
    const start = new THREE.Vector3(s.x, s.y + 1.7, s.z);
    const T = Math.max(0.8, 1.15 - this.round * 0.06);
    const vel = new THREE.Vector3((p.x - start.x) / T, (p.y + 0.3 - start.y + 0.5 * GRAVITY * T * T) / T, (p.z - start.z) / T);
    const mesh = fruitModel(this.fruit.id);
    mesh.position.copy(start);
    this.g.scene.add(mesh);
    this.fruits.push({ mesh, vel, bounces: this.fruit.id === 'melon' ? 1 : 0 });
    sfx.hiya();
  }

  updateFruits(dt) {
    const { world, player } = this.g;
    for (let i = this.fruits.length - 1; i >= 0; i--) {
      const f = this.fruits[i];
      f.vel.y -= GRAVITY * dt;
      f.mesh.position.addScaledVector(f.vel, dt);
      f.mesh.rotation.y += dt * 6;
      const q = f.mesh.position;
      if (Math.hypot(q.x - player.pos.x, q.z - player.pos.z) < 0.6 && Math.abs(q.y + 0.35 - (player.pos.y + 0.75)) < 1.05) {
        this.g.die();
        return;
      }
      if (world.solid(Math.floor(q.x), Math.floor(q.y), Math.floor(q.z)) || q.y < -10) {
        if (f.bounces > 0 && q.y > 0) {
          f.bounces--;
          q.y = Math.floor(q.y) + 1;
          f.vel.y = 7;
          sfx.bounce();
        } else {
          sfx.splat();
          this.g.scene.remove(f.mesh);
          this.fruits.splice(i, 1);
        }
      }
    }
  }

  deliver() {
    this.phase = 'still';
    const s = this.group.position;
    this.g.rosie.fetch(new THREE.Vector3(s.x, s.y, s.z + 0.6), () => {
      this.g.rosie.carry(null);
      this.plant(this.round);
      sfx.seed();
      sfx.bloom();
      this.g.hud.popup(`${this.fruit.name} PLANTED!`, 'Y');
      if (this.round < FRUITS.length - 1) {
        this.g.hud.say('SOPHIA', LINES[this.round], 3);
        this.round++;
        setTimeout(() => { if (this.phase === 'still') this.startRound(); }, 2500);
      } else {
        this.round++;
        this.win();
      }
    });
  }

  // A fruit plant grows in Sophia's garden for each seed she gets.
  plant(i) {
    const [x, y, z] = this.g.level.battle.patches[i];
    const g = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 0.12), new THREE.MeshBasicMaterial({ color: 0x38b764 }));
    stem.position.y = 0.45;
    const fruit = fruitModel(FRUITS[i].id, 0.11);
    fruit.position.y = 0.85;
    g.add(stem, fruit);
    g.position.set(x, y, z);
    g.scale.setScalar(0.01);
    this.g.scene.add(g);
    this.plants.push({ g, t: 0 });
  }

  updatePlants(dt) {
    for (const p of this.plants) {
      p.t += dt;
      p.g.scale.setScalar(Math.min(1, p.t * 1.5));
      p.g.rotation.y = this.phase === 'happy' ? Math.sin(this.time * 3 + p.t) * 0.4 : 0;
    }
  }

  win() {
    this.phase = 'happy';
    playSong('victory');
    this.g.hud.say('SOPHIA', "MY GARDEN IS BLOOMING! I'M NOT MAD ANYMORE! THANK YOU - AND THANK YOU, ROSIE!", 5);
    const colors = [0xff77a8, 0xffcd75, 0xa7f070, 0x41a6f6, 0xf4f4f4, 0xef7d57, 0xb8a1ec];
    const s = this.group.position;
    for (let i = 0; i < 90; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), new THREE.MeshBasicMaterial({ color: colors[i % colors.length] }));
      m.position.set(s.x + (Math.random() - 0.5) * 12, s.y + 4 + Math.random() * 8, s.z + (Math.random() - 0.5) * 12);
      this.g.scene.add(m);
      this.confetti.push({ m, vy: -1 - Math.random() * 1.5, spin: Math.random() * 6 });
    }
    setTimeout(() => this.g.onWin(), 4500);
  }

  updateConfetti(dt) {
    for (const c of this.confetti) {
      c.m.position.y += c.vy * dt;
      c.m.rotation.x += c.spin * dt;
      c.m.rotation.y += c.spin * dt;
      if (c.m.position.y < 3) c.m.position.y += 12;
    }
  }
}

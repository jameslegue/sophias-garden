import { PlayScene } from './tower.js';
import { SPR, SOPHIA, FRUITS } from '../sprites.js';
import { overlaps } from '../engine/physics.js';
import { sfx } from '../engine/audio.js';
import { playSong } from '../engine/music.js';

// Battle vs Sophia, as Sophia designed it: she's MAD, fights from a karate stance,
// throws fruit and cartwheels out of the way. When she gets dizzy, run to her and
// Rosie hands her a seed. Five seeds and her garden blooms.

const FLOOR_Y = 232;               // top of the arena floor
const SPOTS = [18, 66, 114];       // where Sophia lands after a cartwheel
const THROWS = [3, 4, 4, 5, 6];    // fruit per round - a little harder each time
const DIZZY_TIME = 330;            // how long you have to reach her
const PATCH_X = [8, 34, 60, 86, 112];
const GRAVITY = 0.12;
const SPLAT = { rose: 'M', carrot: 'O', apple: 'R', melon: 'R', strawberry: 'R' };
const CONFETTI = ['M', 'Y', 'L', 'S', 'W', 'O', 'V'];

// What Sophia says after each seed (the last one is the ending in the level file).
const LINES = [
  "A ROSE SEED? ...HMPH. THAT WON'T STOP ME! HI-YA!",
  "A CARROT SEED?! I DO LIKE CARROTS... BUT I'M STILL MAD!",
  'AN APPLE SEED... WAIT. ARE THESE FOR MY GARDEN?',
  "MELON! MY FAVORITE! I'M ONLY A LITTLE BIT MAD NOW.",
];

export class BattleScene extends PlayScene {
  constructor(game, data) {
    super(game, data);
    this.round = 0;
    this.delivered = [];
    this.bloom = [];
    this.fruits = [];
    this.splats = [];
    this.confetti = [];
    this.boss = { x: SPOTS[2], y: FLOOR_Y - 16, phase: 'wait', timer: 0, facing: -1, throwsLeft: 0, angle: 0, targetX: SPOTS[2] };
    this.say(data.intro, () => { playSong('battle'); this.startRound(); }, { top: true });
  }

  get fruit() { return FRUITS[this.round]; }

  // In the battle the seed bar fills up as Sophia gets each seed.
  hudSeeds() { return this.delivered; }

  get hudLabel() { return 'GIVEN'; }

  startRound() {
    const b = this.boss;
    b.throwsLeft = THROWS[this.round];
    b.phase = 'stance';
    b.timer = 50;
    b.angle = 0;
    this.rosie.carryT = 0;
  }

  // Got hit: back to the start of this round, Sophia jumps to the far side.
  onRespawn() {
    this.fruits = [];
    const px = this.player.x;
    this.boss.x = SPOTS.reduce((far, x) => (Math.abs(x - px) > Math.abs(far - px) ? x : far));
    this.startRound();
  }

  update() {
    if (this.state === 'ending' && !this.fade) {
      this.t++;
      this.updateParticles();
      const input = this.game.input;
      if (this.t > this.endT + 40 && (input.pressed('jump') || input.taps.length)) this.fadeOut(() => this.game.toTitle());
      return;
    }
    super.update();
    this.updateParticles();
  }

  onUpdate() {
    this.updateBoss();
    this.updateFruits();
    const pb = this.player.box();
    if (this.fruits.some((f) => overlaps(pb, { x: f.x + 1, y: f.y + 1, w: 5, h: 5 }))) this.die();
  }

  updateBoss() {
    const b = this.boss;
    const p = this.player;
    b.timer--;
    if (b.phase !== 'cartwheel') b.facing = p.x + 3 < b.x + 6 ? -1 : 1;

    switch (b.phase) {
      case 'stance':
        if (b.timer > 0) break;
        if (b.throwsLeft > 0) {
          b.phase = 'throw';
          b.timer = 22;
        } else {
          b.phase = 'dizzy';
          b.timer = DIZZY_TIME;
          this.rosie.carry = this.fruit.id;      // Rosie gets the seed ready
          this.rosie.carryT = DIZZY_TIME + 200;
          this.popup('SHE IS DIZZY! GO!', b.x + 6, b.y - 12, 'Y');
        }
        break;

      case 'throw':
        if (b.timer === 12) this.throwFruit();
        if (b.timer <= 0) {
          b.throwsLeft--;
          const options = SPOTS.filter((x) => x !== b.x);
          b.targetX = options[Math.floor(Math.random() * options.length)];
          b.phase = 'cartwheel';
        }
        break;

      case 'cartwheel': {
        const d = b.targetX - b.x;
        const speed = 1.6 + this.round * 0.2;
        if (Math.abs(d) <= speed) {
          b.x = b.targetX;
          b.angle = 0;
          b.phase = 'stance';
          b.timer = Math.max(14, 34 - this.round * 4);
        } else {
          b.x += Math.sign(d) * speed;
          b.angle += Math.sign(d) * 0.25;
        }
        break;
      }

      case 'dizzy':
        if (overlaps(p.box(), { x: b.x + 1, y: b.y, w: 10, h: 16 })) this.deliver();
        else if (b.timer <= 0) {
          this.popup('SHE IS MAD AGAIN!', b.x + 6, b.y - 12, 'R');
          this.rosie.carryT = 0;
          b.throwsLeft = THROWS[this.round];
          b.phase = 'stance';
          b.timer = 30;
        }
        break;

      default:
        break;
    }
  }

  // Lob the round's fruit so it lands where the player is standing.
  throwFruit() {
    const b = this.boss;
    const p = this.player;
    const sx = b.x + (b.facing > 0 ? 10 : -2);
    const sy = b.y + 2;
    const vy = -2.6 - this.round * 0.1;
    const dy = FLOOR_Y - 7 - sy;
    const t = (-vy + Math.sqrt(vy * vy + 2 * GRAVITY * dy)) / GRAVITY;
    const vx = Math.max(-3, Math.min(3, (p.x - sx) / t));
    this.fruits.push({ x: sx, y: sy, vx, vy, id: this.fruit.id, bounces: this.fruit.id === 'melon' ? 1 : 0 });
    sfx.hiya();
  }

  updateFruits() {
    this.fruits = this.fruits.filter((f) => {
      f.vy += GRAVITY;
      f.x += f.vx;
      f.y += f.vy;
      if (f.x < 8 || f.x > 129) f.vx *= -1;
      if (f.y + 7 < FLOOR_Y) return true;
      if (f.bounces > 0) { f.bounces--; f.y = FLOOR_Y - 7; f.vy = -2.4; sfx.bounce(); return true; }
      this.splat(f);
      return false;
    });
  }

  splat(f) {
    sfx.splat();
    for (let i = 0; i < 6; i++) {
      this.splats.push({ x: f.x + 3, y: f.y + 5, vx: Math.random() * 2 - 1, vy: -Math.random() * 1.6, t: 22, c: SPLAT[f.id] });
    }
  }

  deliver() {
    const b = this.boss;
    b.phase = 'still';
    this.state = 'collect';
    this.rosie.fetch({ x: b.x + 6, y: b.y + 10, fruit: null }, () => {
      const f = this.fruit;
      this.delivered.push(f.id);
      this.bloom.push({ i: this.round, t: 0 });
      sfx.seed();
      sfx.bloom();
      this.popup(`${f.name} PLANTED!`, PATCH_X[this.round] + 5, FLOOR_Y - 34, 'Y');
      this.timer = 70;
    });
  }

  // Called by the play scene once Rosie has handed over a seed.
  finishFloor() {
    if (this.round < FRUITS.length - 1) {
      this.say([{ who: 'SOPHIA', text: LINES[this.round] }], () => {
        this.round++;
        this.state = 'play';
        this.fruits = [];
        this.startRound();
      }, { top: true });
    } else {
      this.win();
    }
  }

  win() {
    this.boss.phase = 'happy';
    this.fruits = [];
    playSong('victory');
    this.game.progress.won = true;
    this.game.saveProgress();
    this.say(this.data.outro, () => { this.state = 'ending'; this.endT = this.t; }, { top: true });
  }

  updateParticles() {
    for (const b of this.bloom) b.t++;
    this.splats = this.splats.filter((s) => { s.vy += 0.15; s.x += s.vx; s.y += s.vy; return --s.t > 0; });
    if (this.boss.phase === 'happy' && this.t % 2 === 0) {
      this.confetti.push({ x: Math.random() * 144, y: -4, vy: 0.6 + Math.random(), c: CONFETTI[Math.floor(Math.random() * CONFETTI.length)] });
    }
    this.confetti = this.confetti.filter((c) => { c.y += c.vy; c.x += Math.sin((this.t + c.y) / 9) * 0.4; return c.y < 260; });
  }

  // ---------- drawing ----------

  drawBackground(r) {
    r.rect(0, 0, r.W, 256, 'S');
    const drift = (this.t / 25) % 200;
    r.spr(SPR.cloud, ((20 + drift) % 200) - 30, 60);
    r.spr(SPR.cloud, ((110 + drift * 0.6) % 200) - 30, 120);
    r.spr(SPR.cloud, ((60 + drift * 0.8) % 200) - 30, 170);
  }

  drawFront(r) {
    const won = this.boss.phase === 'happy';

    // Garden patches - each one blooms when Sophia gets its seed
    PATCH_X.forEach((px, i) => {
      r.rect(px + 1, FLOOR_Y - 3, 9, 1, 'D');
      r.rect(px, FLOOR_Y - 2, 11, 2, 'D');
      const b = this.bloom.find((x) => x.i === i);
      if (!b) return;
      const h = Math.min(8, Math.floor(b.t / 3));
      r.rect(px + 5, FLOOR_Y - 3 - h, 1, h, 'G');
      if (h > 4) { r.rect(px + 3, FLOOR_Y - 6, 2, 1, 'L'); r.rect(px + 6, FLOOR_Y - 7, 2, 1, 'L'); }
      if (b.t > 24) r.spr(SPR.fruit[FRUITS[i].id], px + 2, FLOOR_Y - 18 - (won ? Math.round(Math.abs(Math.sin((this.t + i * 9) / 10)) * 2) : 0));
    });

    // Flowers everywhere once she's happy
    if (won) {
      [[14, 25], [30, 25], [98, 25], [114, 25], [58, 22], [74, 22]].forEach(([x, row], i) => {
        r.spr(i % 2 ? SPR.flower : SPR.flowerY, x, row * 8 - 5);
      });
    }

    this.drawSophia(r);
    for (const f of this.fruits) r.spr(SPR.fruit[f.id], f.x, f.y);
    for (const s of this.splats) r.rect(s.x, s.y, 1, 1, s.c);
  }

  drawSophia(r) {
    const b = this.boss;
    const img = {
      throw: SOPHIA.throw, dizzy: SOPHIA.dizzy, still: SOPHIA.dizzy, happy: SOPHIA.happy,
    }[b.phase] || SOPHIA.stance;

    if (b.phase === 'cartwheel') {
      // Cartwheel in crisp quarter turns
      const ctx = r.ctx;
      ctx.save();
      ctx.translate(Math.round(b.x) + 6, b.y + 8);
      ctx.rotate(Math.round(b.angle / (Math.PI / 2)) * (Math.PI / 2));
      ctx.drawImage(img, -6, -8);
      ctx.restore();
      return;
    }
    const hop = b.phase === 'happy' ? -Math.round(Math.abs(Math.sin(this.t / 8)) * 6) : 0;
    r.spr(img, b.x, b.y + hop, b.facing < 0);

    if (b.phase === 'dizzy' || b.phase === 'still') {
      for (let k = 0; k < 3; k++) {
        const a = this.t / 8 + k * 2.1;
        r.rect(b.x + 5 + Math.cos(a) * 7, b.y - 3 + Math.sin(a) * 2, 2, 2, 'Y');
      }
    } else if (b.phase !== 'happy' && b.phase !== 'wait' && (this.t >> 4) % 2) {
      // little angry puff
      r.rect(b.x + (b.facing > 0 ? 1 : 9), b.y - 3, 2, 2, 'R');
      r.rect(b.x + (b.facing > 0 ? 0 : 11), b.y - 5, 1, 1, 'R');
    }
  }

  draw(r) {
    super.draw(r);
    for (const c of this.confetti) r.rect(c.x, c.y, 2, 2, c.c);
    if (this.state === 'ending') {
      r.box(14, 70, 116, 84, 'K', 'M');
      r.textC('LEVEL 1', 72, 80, 'Y', 2, 'P');
      r.textC('COMPLETE!', 72, 96, 'M', 2, 'P');
      r.textC("SOPHIA'S GARDEN", 72, 118, 'W');
      r.textC('IS BLOOMING!', 72, 125, 'W');
      if ((this.t >> 4) % 2) r.textC('TAP TO CONTINUE', 72, 142, 'Q');
    }
  }
}

import { BLOCKS, ENTITIES, PLATFORMS } from '../blocks.js';
import { SPR, fruitById, themedBg, flowerSprite } from '../sprites.js';
import { makePlatform } from '../entities/platforms.js';
import { AppleTree, updateApple, appleBox, drawApple } from '../entities/apple.js';
import { Player } from '../entities/player.js';
import { Rosie } from '../entities/rosie.js';
import { Camera } from '../engine/camera.js';
import { T, overlaps, touchingHazard } from '../engine/physics.js';
import { sfx } from '../engine/audio.js';
import { stopMusic } from '../engine/music.js';
import { Dialog } from '../ui/dialog.js';
import { drawSeedBar, tappedMenu } from '../ui/seed-bar.js';

export async function loadLevel(path) {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Could not load ${path}`);
  return res.json();
}

// Split a floor's text map into blocks and things (start, checkpoints, seed...).
export function parseLevel(data) {
  const ents = [];
  const platforms = [];
  const tiles = data.map.map((row, r) => [...row].map((ch, c, line) => {
    if (PLATFORMS[ch]) {
      if (line[c - 1] === ch) platforms[platforms.length - 1].w += T; // join a run into one platform
      else platforms.push(makePlatform(PLATFORMS[ch], c * T, r * T));
      return '.';
    }
    if (ENTITIES[ch]) { ents.push({ type: ENTITIES[ch], c, r }); return '.'; }
    return BLOCKS[ch] ? ch : '.';
  }));
  return { w: tiles[0].length, h: tiles.length, tiles, ents, platforms };
}

// A playable floor. The spawn area is a floor too (see spawn.js).
export class PlayScene {
  constructor(game, data) {
    this.game = game;
    this.data = data;
    this.level = parseLevel(data);
    const ents = this.level.ents;

    const s = ents.find((e) => e.type === 'start') || { c: 1, r: 1 };
    this.start = { x: s.c * T + 1, y: (s.r + 1) * T - 11 };
    this.respawn = { ...this.start };
    this.player = new Player(this.start.x, this.start.y, game.avatarFrames());
    this.rosie = new Rosie(0, 0);
    this.rosie.snap(this.player);

    this.checkpoints = ents.filter((e) => e.type === 'checkpoint').map((e) => ({ x: e.c * T, y: e.r * T, active: false }));
    this.seeds = ents.filter((e) => e.type === 'seed').map((e) => ({ x: e.c * T + 1, y: e.r * T + 1, fruit: data.fruit, taken: false }));
    this.trees = ents.filter((e) => e.type === 'apple').map((e) => new AppleTree(e.c, e.r));
    this.apples = [];

    // Floor look: background brick colors, wall decoration, checkpoint flower color
    this.bgTile = data.bg ? themedBg(data.bg) : SPR.bgBrick;
    this.deco = !data.fruit || data.fruit === 'rose' ? SPR.bgRose : SPR.fruit[data.fruit];
    this.cpOn = data.flower ? flowerSprite(data.flower) : SPR.cpOn;
    if (data.floor) { game.progress.lastLevel = game.levelPath; game.saveProgress(); }

    this.cam = new Camera(game.r.H, this.level.h * T);
    this.cam.snap(this.player.y);
    this.state = 'play';
    this.timer = 0;
    this.t = 0;
    this.dialog = null;
    this.popups = [];
    this.banner = data.floor ? { a: `FLOOR ${data.floor}`, b: data.name, t: 150 } : null;
    this.fade = { a: 1, dir: -1 }; // fade in
    stopMusic();
  }

  say(lines, then, opts) {
    this.dialog = new Dialog(lines, () => { this.dialog = null; then?.(); }, opts);
  }

  fadeOut(cb) { this.fade = { a: 0, dir: 1, cb }; }

  popup(text, x, y, c = 'Y') { this.popups.push({ text, x, y, c, t: 70 }); }

  update() {
    const input = this.game.input;
    this.t++;

    if (this.fade) {
      this.fade.a += this.fade.dir * 0.06;
      if (this.fade.dir > 0 && this.fade.a >= 1) {
        const cb = this.fade.cb;
        this.fade = { a: 1, dir: 0 };
        cb?.();
        return;
      }
      if (this.fade.dir < 0 && this.fade.a <= 0) this.fade = null;
      else if (this.fade.dir >= 0) return;
    }

    if (tappedMenu(input) && !this.dialog) { this.game.toTitle(); return; }

    this.popups.forEach((p) => { p.t--; p.y -= 0.3; });
    this.popups = this.popups.filter((p) => p.t > 0);
    if (this.banner && --this.banner.t <= 0) this.banner = null;

    if (this.dialog) {
      this.dialog.update(input);
      this.player.update(null, this.level);
      this.rosie.update(this.player);
      return;
    }

    if (this.state === 'dying') {
      if (--this.timer <= 0) {
        this.player.respawn(this.respawn.x, this.respawn.y);
        this.rosie.snap(this.player);
        this.state = 'play';
        this.onRespawn?.();
      }
      return;
    }

    if (this.state === 'collect') {
      this.player.update(null, this.level);
      this.rosie.update(this.player);
      if (this.timer > 0 && --this.timer === 0) this.finishFloor();
      return;
    }

    if (this.state !== 'play') return;

    this.updateWorld();
    this.player.update(input, this.level);
    this.rosie.update(this.player);
    this.cam.follow(this.player.y);
    const pb = this.player.box();

    if (touchingHazard(pb, this.level) || this.apples.some((a) => overlaps(pb, appleBox(a)))) { this.die(); return; }

    for (const cp of this.checkpoints) {
      if (!cp.active && overlaps(pb, { x: cp.x, y: cp.y, w: T, h: T })) {
        this.checkpoints.forEach((o) => { o.active = false; });
        cp.active = true;
        this.respawn = { x: cp.x + 1, y: cp.y + T - 11 };
        sfx.checkpoint();
        this.popup('SAVED!', cp.x + 4, cp.y - 6, 'M');
      }
    }

    for (const s of this.seeds) {
      if (!s.taken && !s.claimed && overlaps(pb, { x: s.x - 3, y: s.y - 3, w: 12, h: 13 })) this.collectSeed(s);
    }

    this.onUpdate?.();
  }

  updateWorld() {
    for (const p of this.level.platforms) p.update(this.player);
    for (const tree of this.trees) tree.update(this);
    this.apples = this.apples.filter((a) => updateApple(a, this.level));
  }

  die() {
    this.state = 'dying';
    this.timer = 36;
    this.shake = 10;
    sfx.hurt();
  }

  collectSeed(s) {
    s.claimed = true;
    this.state = 'collect';
    this.rosie.fetch(s, () => {
      s.taken = true;
      const p = this.game.progress;
      if (!p.seeds.includes(s.fruit)) p.seeds.push(s.fruit);
      this.game.saveProgress();
      sfx.seed();
      sfx.bark();
      this.popup(`+1 ${fruitById(s.fruit).name} SEED!`, s.x + 3, s.y - 8, 'Y');
      this.timer = 100;
    });
  }

  finishFloor() {
    this.say(this.data.outro || [], () => {
      this.fadeOut(() => (this.data.next ? this.game.startLevel(this.data.next) : this.game.toTitle()));
    });
  }

  // ---------- drawing ----------

  drawBackground(r, top, bottom) {
    for (let row = top; row <= bottom; row++) {
      for (let c = 0; c < this.level.w; c++) {
        r.spr(this.bgTile, c * T, row * T);
        if (((c * 7 + row * 13) % 23) === 0) {
          r.ctx.globalAlpha = this.deco === SPR.bgRose ? 1 : 0.3;
          r.spr(this.deco, c * T, row * T);
          r.ctx.globalAlpha = 1;
        }
      }
    }
  }

  drawExtras() {}

  hudSeeds() { return this.game.progress.seeds; }

  draw(r) {
    const ctx = r.ctx;
    let cy = Math.round(this.cam.y);
    if (this.shake > 0) { this.shake--; cy += (this.shake % 2 ? 2 : -2); }
    const top = Math.max(0, Math.floor(cy / T));
    const bottom = Math.min(this.level.h - 1, top + Math.ceil(r.H / T) + 1);

    ctx.save();
    ctx.translate(0, -cy);
    this.drawBackground(r, top, bottom);
    this.drawExtras(r);
    for (let row = top; row <= bottom; row++) {
      for (let c = 0; c < this.level.w; c++) {
        const b = BLOCKS[this.level.tiles[row][c]];
        if (b?.sprite) r.spr(SPR[b.sprite], c * T, row * T);
      }
    }
    for (const p of this.level.platforms) p.draw(r);
    for (const tree of this.trees) tree.draw(r);
    for (const a of this.apples) drawApple(r, a);
    for (const cp of this.checkpoints) r.spr(cp.active ? this.cpOn : SPR.cpOff, cp.x, cp.y);
    this.drawFront?.(r);
    for (const s of this.seeds) {
      if (s.taken) continue;
      const bob = Math.round(Math.sin(this.t / 10) * 2);
      if ((this.t >> 3) % 4 === 0) r.rect(s.x + 6, s.y - 2 + bob, 1, 1, 'W');
      r.spr(SPR.seed[s.fruit], s.x, s.y + bob);
    }
    this.rosie.draw(r);
    if (this.state !== 'dying' || (this.timer >> 2) % 2) this.player.draw(r);
    for (const p of this.popups) r.textC(p.text, p.x, p.y, p.c, 1, 'K');
    ctx.restore();

    drawSeedBar(r, this.hudSeeds(), this.hudLabel);
    if (this.banner) {
      r.box(30, 22, 84, 22, 'K', 'M');
      r.textC(this.banner.a, 72, 26, 'Q');
      r.textC(this.banner.b, 72, 34, 'Y');
    }
    this.dialog?.draw(r);
    if (this.fade) {
      ctx.globalAlpha = Math.max(0, Math.min(1, this.fade.a));
      r.rect(0, 0, r.W, r.H, 'K');
      ctx.globalAlpha = 1;
    }
  }
}

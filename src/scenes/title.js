import { SPR, FRUITS } from '../sprites.js';
import { wrap } from '../engine/render.js';
import { drawButton, tapped } from '../ui/button.js';
import { sfx } from '../engine/audio.js';
import { AvatarBuilderScene } from './avatar-builder.js';
import { playSong } from '../engine/music.js';
import { VERSION } from '../version.js';

const SOUND = { x: 98, y: 3, w: 43, h: 11 };

export class TitleScene {
  constructor(game) {
    this.game = game;
    this.t = 0;
    this.sel = 0;
    // CONTINUE goes to the first floor whose seed you don't have yet (then the battle).
    const seeds = game.progress.seeds;
    const nextIdx = FRUITS.findIndex((f) => !seeds.includes(f.id));
    const next = nextIdx === -1 ? 'levels/level1/06-battle.json' : `levels/level1/0${nextIdx + 1}-${FRUITS[nextIdx].id}.json`;
    this.nextName = nextIdx === -1 ? 'BATTLE' : FRUITS[nextIdx].name;
    const last = seeds.length > 0;
    this.buttons = [
      { label: 'PLAY', go: () => game.startLevel('levels/level1/00-spawn.json') },
      last && { label: 'CONTINUE', go: () => game.startLevel(next) },
      { label: 'MY AVATAR', go: () => game.go(new AvatarBuilderScene(game)) },
    ].filter(Boolean);
    // Continue is the easy pick when there's a floor to go back to
    if (last) this.sel = 1;
    const gap = this.buttons.length > 2 ? 24 : 28;
    this.buttons.forEach((b, i) => Object.assign(b, { x: 32, y: 162 + i * gap, w: 80, h: 20 }));
    playSong('title');
  }

  update() {
    const input = this.game.input;
    this.t++;
    if (input.pressed('down') || input.pressed('right')) { this.sel = (this.sel + 1) % this.buttons.length; sfx.select(); }
    if (input.pressed('up') || input.pressed('left')) { this.sel = (this.sel + this.buttons.length - 1) % this.buttons.length; sfx.select(); }
    if (tapped(input, SOUND)) { this.game.setMuted(!this.game.settings.muted); sfx.select(); return; }
    const hit = this.buttons.find((b) => tapped(input, b));
    if (hit) { sfx.blip(); hit.go(); return; }
    if (input.pressed('jump')) { sfx.blip(); this.buttons[this.sel].go(); }
  }

  draw(r) {
    r.rect(0, 0, r.W, r.H, 'S');
    r.spr(SPR.cloud, 10 + ((this.t / 15) % 160) - 20, 80);
    r.spr(SPR.cloud, 100 - ((this.t / 25) % 160) + 20, 100);

    r.textC("SOPHIA'S", 72, 24, 'W', 2, 'P');
    r.textC('GARDEN', 72, 42, 'M', 3, 'P');
    if (this.game.progress.won) r.textC('LEVEL 1 COMPLETE!', 72, 66, 'Y', 1, 'P');
    r.box(SOUND.x, SOUND.y, SOUND.w, SOUND.h, 'P', 'M');
    r.textC(this.game.settings.muted ? 'SOUND OFF' : 'SOUND ON', SOUND.x + SOUND.w / 2, SOUND.y + 3, 'W');

    // Player + Rosie on the grass
    r.rect(0, 148, r.W, 108, 'G');
    r.rect(0, 148, r.W, 2, 'L');
    for (let x = 0; x < r.W; x += 24) r.spr((x / 24) % 2 ? SPR.flower : SPR.flowerY, x + 6, 152);
    const f = this.game.avatarFrames();
    const hop = Math.floor(this.t / 40) % 4 === 3;
    r.spr(hop ? f.jump : f.idle, 42, hop ? 106 : 112, false, 3);
    r.spr(SPR.rosie, 76, 121, true, 3);

    this.buttons.forEach((b, i) => drawButton(r, b, i === this.sel));
    r.textC('A GAME BY SOPHIA', 72, 243, 'P');
    r.text(VERSION, 3, 249, 'T');
    if (this.buttons.length > 2) r.textC(`NEXT: ${this.nextName}`, 72, 234, 'Y', 1, 'P');
    // If something ever breaks on a phone, show it here so we can screenshot it.
    if (this.game.error) {
      const lines = wrap(this.game.error, 34).slice(0, 4);
      r.box(2, 70, 140, 10 + lines.length * 7, 'K', 'R');
      lines.forEach((l, i) => r.text(l, 5, 74 + i * 7, 'Y'));
    }
  }
}

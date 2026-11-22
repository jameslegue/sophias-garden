import { SPR } from '../sprites.js';
import { drawButton, tapped } from '../ui/button.js';
import { sfx } from '../engine/audio.js';
import { AvatarBuilderScene } from './avatar-builder.js';

export class TitleScene {
  constructor(game) {
    this.game = game;
    this.t = 0;
    this.sel = 0;
    this.buttons = [
      { label: 'PLAY', x: 32, y: 168, w: 80, h: 20, go: () => game.startLevel('levels/level1/00-spawn.json') },
      { label: 'MY AVATAR', x: 32, y: 196, w: 80, h: 20, go: () => game.go(new AvatarBuilderScene(game)) },
    ];
  }

  update() {
    const input = this.game.input;
    this.t++;
    if (input.pressed('down') || input.pressed('right')) { this.sel = (this.sel + 1) % this.buttons.length; sfx.select(); }
    if (input.pressed('up') || input.pressed('left')) { this.sel = (this.sel + this.buttons.length - 1) % this.buttons.length; sfx.select(); }
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

    // Player + Rosie on the grass
    r.rect(0, 148, r.W, 108, 'G');
    r.rect(0, 148, r.W, 2, 'L');
    for (let x = 0; x < r.W; x += 24) r.spr((x / 24) % 2 ? SPR.flower : SPR.flowerY, x + 6, 152);
    const f = this.game.avatarFrames();
    const hop = Math.floor(this.t / 40) % 4 === 3;
    r.spr(hop ? f.jump : f.idle, 42, hop ? 106 : 112, false, 3);
    r.spr(SPR.rosie, 76, 124, true, 3);

    this.buttons.forEach((b, i) => drawButton(r, b, i === this.sel));
    r.textC('A GAME BY SOPHIA', 72, 240, 'P');
  }
}

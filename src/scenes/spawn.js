import { PlayScene } from './tower.js';
import { SPR } from '../sprites.js';
import { T, overlaps } from '../engine/physics.js';
import { sfx } from '../engine/audio.js';

// The tower as Sophia drew it: bottom to top.
const FLOORS = ['ROSE', 'CARROT', 'APPLE', 'MELON', 'STRAWBERRY', 'BATTLE VS SOPHIA'];
const TOWER = { x: 60, y: 28, w: 80, bottom: 224 };

// Outside the tower: intro story, meet Rosie, walk to the door.
export class SpawnScene extends PlayScene {
  constructor(game, data) {
    super(game, data);
    const d = this.level.ents.find((e) => e.type === 'door');
    this.door = { x: d.c * T + 2, y: (d.r + 1) * T - 24, w: 16, h: 24 };
    if (!game.progress.introSeen) {
      this.say(data.intro, () => { game.progress.introSeen = true; game.saveProgress(); }, { top: true });
    }
  }

  onUpdate() {
    const d = this.door;
    if (overlaps(this.player.box(), { x: d.x + 4, y: d.y + 6, w: 8, h: 18 })) {
      this.state = 'door';
      sfx.door();
      this.fadeOut(() => this.game.startLevel(this.data.next));
    }
  }

  drawBackground(r) {
    r.rect(0, 0, r.W, 256, 'S');
    for (const [hx, hw, hh] of [[-20, 70, 40], [30, 60, 28], [100, 70, 46]]) {
      for (let i = 0; i < hh; i += 2) {
        const inset = Math.round(hw / 2 - Math.sqrt(Math.max(0, 1 - ((hh - i) / hh) ** 2)) * (hw / 2));
        r.rect(hx + inset, 224 - hh + i, hw - inset * 2, 2, 'T');
      }
    }
    const drift = (this.t / 20) % 200;
    r.spr(SPR.cloud, ((8 + drift) % 200) - 30, 40);
    r.spr(SPR.cloud, ((90 + drift * 0.7) % 200) - 30, 90);
    r.spr(SPR.cloud, ((150 + drift * 0.5) % 200) - 30, 140);

    // Tower facade with Sophia's floor labels
    const { x, y, w, bottom } = TOWER;
    for (let ty = y; ty < bottom; ty += T) for (let tx = x; tx < x + w; tx += T) r.spr(SPR.facade, tx, ty);
    const fh = (bottom - y) / FLOORS.length;
    FLOORS.forEach((name, i) => {
      const fy = bottom - (i + 1) * fh;
      r.rect(x, Math.round(fy), w, 1, 'M');
      const lines = name === 'BATTLE VS SOPHIA' ? ['BATTLE', 'VS SOPHIA'] : [name];
      const ly = i === 0 ? fy + 6 : fy + fh / 2 - lines.length * 3;
      const lx = i === 0 ? x + 50 : x + w / 2;
      lines.forEach((l, j) => r.textC(l, lx, Math.round(ly + j * 7), 'P'));
    });
    r.rect(x - 1, y, 1, bottom - y, 'M');
    r.rect(x + w, y, 1, bottom - y, 'M');
    r.rect(x - 1, y - 1, w + 2, 1, 'M');
    r.textC("SOPHIA'S GARDEN", 72, 18, 'M', 1, 'K');
  }

  drawExtras(r) {
    r.spr(SPR.door, this.door.x, this.door.y);
    r.textC('SPAWN', 20, 196, 'W', 1, 'K');
    r.textC('V', 20, 203, 'W', 1, 'K');
    [[4, 'flower'], [30, 'flowerY'], [46, 'flower'], [100, 'flowerY'], [126, 'flower']].forEach(([fx, k]) => r.spr(SPR[k], fx, 219));
  }
}

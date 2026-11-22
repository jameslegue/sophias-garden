import { Renderer } from './engine/render.js';
import { Input } from './engine/input.js';
import { start } from './engine/loop.js';
import { unlock } from './engine/audio.js';
import { load, save } from './engine/save.js';
import { composeFrames, DEFAULT_AVATAR } from './avatar/compose.js';
import { TitleScene } from './scenes/title.js';
import { PlayScene, loadLevel } from './scenes/tower.js';
import { SpawnScene } from './scenes/spawn.js';
import { BattleScene } from './scenes/battle.js';
import { setMuted } from './engine/audio.js';

const SCENES = { spawn: SpawnScene, battle: BattleScene };

const canvas = document.getElementById('game');
const pad = document.getElementById('pad');

// Scale the 144x256 screen by a whole number of real pixels so it stays crisp.
function fit() {
  const dpr = window.devicePixelRatio || 1;
  const availW = window.innerWidth;
  const availH = window.innerHeight - pad.offsetHeight - 24;
  const scale = Math.max(1, Math.floor(Math.min((availW * dpr) / canvas.width, (availH * dpr) / canvas.height)));
  canvas.style.width = `${(canvas.width * scale) / dpr}px`;
  canvas.style.height = `${(canvas.height * scale) / dpr}px`;
}
addEventListener('resize', fit);
fit();

const game = {
  r: new Renderer(canvas),
  input: new Input(canvas, pad, unlock),
  avatar: load('avatar', DEFAULT_AVATAR),
  progress: load('progress', { seeds: [], introSeen: false, won: false }),
  settings: load('settings', { muted: false }),
  scene: null,
  frames: null,

  avatarFrames() { return (this.frames ||= composeFrames(this.avatar)); },
  setAvatar(av) { this.avatar = { ...av }; this.frames = null; save('avatar', this.avatar); },
  saveProgress() { save('progress', this.progress); },
  setMuted(v) { this.settings.muted = v; setMuted(v); save('settings', this.settings); },

  go(scene) { this.scene = scene; },
  toTitle() { this.go(new TitleScene(this)); },
  async startLevel(path) {
    try {
      const data = await loadLevel(path);
      this.levelPath = path;
      const Scene = SCENES[data.theme] || PlayScene;
      this.go(new Scene(this, data));
    } catch (e) {
      console.error(e);
      this.toTitle();
    }
  },
};

setMuted(game.settings.muted);

// Works offline once installed to the home screen.
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

// ?level=levels/level1/01-rose.json jumps straight to a floor (handy for testing).
const jump = new URLSearchParams(location.search).get('level');
if (jump) game.startLevel(jump); else game.toTitle();

start(
  () => { game.scene?.update(); game.input.endStep(); },
  () => { game.r.clear('K'); game.scene?.draw(game.r); },
);

window.__game = game;

import { Renderer } from './engine/render.js';
import { Input } from './engine/input.js';
import { start } from './engine/loop.js';
import { unlock } from './engine/audio.js';
import { load, save } from './engine/save.js';
import { composeFrames, DEFAULT_AVATAR } from './avatar/compose.js';
import { TitleScene } from './scenes/title.js';
import { PlayScene, loadLevel } from './scenes/tower.js';
import { SpawnScene } from './scenes/spawn.js';

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
  progress: load('progress', { seeds: [], introSeen: false }),
  scene: null,
  frames: null,

  avatarFrames() { return (this.frames ||= composeFrames(this.avatar)); },
  setAvatar(av) { this.avatar = { ...av }; this.frames = null; save('avatar', this.avatar); },
  saveProgress() { save('progress', this.progress); },

  go(scene) { this.scene = scene; },
  toTitle() { this.go(new TitleScene(this)); },
  async startLevel(path) {
    try {
      const data = await loadLevel(path);
      this.go(data.theme === 'spawn' ? new SpawnScene(this, data) : new PlayScene(this, data));
    } catch (e) {
      console.error(e);
      this.toTitle();
    }
  },
};

// ?level=levels/level1/01-rose.json jumps straight to a floor (handy for testing).
const jump = new URLSearchParams(location.search).get('level');
if (jump) game.startLevel(jump); else game.toTitle();

start(
  () => { game.scene?.update(); game.input.endStep(); },
  () => { game.r.clear('K'); game.scene?.draw(game.r); },
);

window.__game = game;

import * as THREE from '../vendor/three.module.min.js';
import { makeSprite } from '../src/engine/render.js';
import { ROWS } from '../src/sprites.js';

// Block faces are 8x8 pixel tiles (several shared with the 2D game), packed side by side
// into one texture (an "atlas"), drawn with no smoothing so they stay pixelated.
const T = {
  grassTop: ['GLGGGLGG', 'GGGLGGGG', 'LGGGGGLG', 'GGGGLGGG', 'GLGGGGGL', 'GGGLGGGG', 'GGGGGLGG', 'LGGGGGGG'],
  grassSide: ROWS.TILES.grass,
  dirt: ROWS.TILES.dirt,
  brick: ROWS.TILES.facade,
  leaf: ['GGLGTGGL', 'GMMGGLGG', 'GMRGTGGG', 'GGGGGGMM', 'TGLGGGMR', 'GGGTGGGG', 'LGMMGTGL', 'GGMRGGGG'],
  thorn: ['TGTGRTGT', 'GRWGTGRW', 'TGRGTRGT', 'GTGTGTGT', 'RWGTGRWG', 'GRGTTGRT', 'TGTGRTGT', 'GTRWGTGT'],
  carrotTop: ['OOGOOGOO', 'OGLGOLGO', 'OOGOOGOO', 'OOOOOOOO', 'OOOKOOOO', 'OOOOOOKO', 'OKOOOOOO', 'OOOOOOOO'],
  carrotSide: ['OOOOOOOO', 'OYOOOOKO', 'OOOOOOOO', 'OOOKOOOO', 'OOOOOOOO', 'OOOOOKOO', 'OKOOOOOO', 'OOOOOOOO'],
  wood: ['DDDDDDDD', 'DODDDDOD', 'DDDDDDDD', 'DDKDDDDD', 'DDDDDODD', 'DODDDDDD', 'DDDDKDDD', 'DDDDDDDD'],
  leaves: ['GTGGLGTG', 'TGGTGGGL', 'GGLGGTGG', 'GTGGGGLT', 'LGGTGLGG', 'GGTGGGTG', 'TGGLGTGG', 'GGTGGGGL'],
  melonTop: ['GGGGGGGG', 'GLLGGLLG', 'GLGGGGLG', 'GGGTTGGG', 'GGGTTGGG', 'GLGGGGLG', 'GLLGGLLG', 'GGGGGGGG'],
  melonSide: ['GLGGLGGL', 'GLGGLGGL', 'TLGGLGTL', 'GLGGLGGL', 'GLGTLGGL', 'GLGGLGGL', 'GLTGLGGL', 'GLGGLGGL'],
  juice: ['MMRMMMRM', 'RMMMRMMM', 'MMMRMMMM', 'MRMMMMRM', 'MMMMRMMM', 'RMMMMMMR', 'MMRMMRMM', 'MMMMMMMM'],
  berryTop: ['GLGRRGLG', 'LGRRRRGL', 'GRRYRRRG', 'RRRRRRYR', 'RYRRRRRR', 'GRRRYRRG', 'LGRRRRGL', 'GLGRRGLG'],
  berrySide: ['RRRRRRRR', 'RYRRRYRR', 'RRRYRRRR', 'RRRRRRYR', 'RYRRRRRR', 'RRRRYRRR', 'RRYRRRRY', 'RRRRRRRR'],
  seedStep: ['YYYYYYYY', 'YWYYYYOY', 'YYYYYYYY', 'YYOYYYYY', 'YYYYYWYY', 'YOYYYYYY', 'YYYYOYYY', 'YYYYYYYY'],
};

const NAMES = Object.keys(T);
export const TILE = Object.fromEntries(NAMES.map((n, i) => [n, i]));
export const TILE_COUNT = NAMES.length;

let material = null;

// One shared material for every block in the game.
export function blockMaterial() {
  if (material) return material;
  const c = document.createElement('canvas');
  c.width = 8 * TILE_COUNT;
  c.height = 8;
  const x = c.getContext('2d');
  NAMES.forEach((n, i) => x.drawImage(makeSprite(T[n]), i * 8, 0));
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  material = new THREE.MeshBasicMaterial({ map: tex, vertexColors: true });
  return material;
}

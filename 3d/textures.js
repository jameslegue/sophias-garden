import * as THREE from '../vendor/three.module.min.js';
import { makeSprite } from '../src/engine/render.js';
import { ROWS } from '../src/sprites.js';

// Block faces are the same 8x8 pixel tiles as the 2D game, packed side by side
// into one texture (an "atlas"), drawn with no smoothing so they stay pixelated.
const GRASS_TOP = ['GLGGGLGG', 'GGGLGGGG', 'LGGGGGLG', 'GGGGLGGG', 'GLGGGGGL', 'GGGLGGGG', 'GGGGGLGG', 'LGGGGGGG'];
const LEAF = ['GGLGTGGL', 'GMMGGLGG', 'GMRGTGGG', 'GGGGGGMM', 'TGLGGGMR', 'GGGTGGGG', 'LGMMGTGL', 'GGMRGGGG'];
const THORN = ['TGTGRTGT', 'GRWGTGRW', 'TGRGTRGT', 'GTGTGTGT', 'RWGTGRWG', 'GRGTTGRT', 'TGTGRTGT', 'GTRWGTGT'];

const TILES = [GRASS_TOP, ROWS.TILES.grass, ROWS.TILES.dirt, ROWS.TILES.facade, LEAF, THORN];
export const TILE = { grassTop: 0, grassSide: 1, dirt: 2, brick: 3, leaf: 4, thorn: 5 };
export const TILE_COUNT = TILES.length;

export function makeAtlas() {
  const c = document.createElement('canvas');
  c.width = 8 * TILES.length;
  c.height = 8;
  const x = c.getContext('2d');
  TILES.forEach((rows, i) => x.drawImage(makeSprite(rows), i * 8, 0));
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

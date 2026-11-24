import { makeSprite } from './engine/render.js';

// ---------- Tiles (8x8) ----------
const TILES = {
  brick: [
    'QQQKQQQQ',
    'EEEKEEEE',
    'EEEKEEEE',
    'KKKKKKKK',
    'QQQQQQQK',
    'EEEEEEEK',
    'EEEEEEEK',
    'KKKKKKKK',
  ],
  grass: [
    'LLLLLLLL',
    'GLGGLGGL',
    'GGDGGGDG',
    'DDDDDDDD',
    'DDKDDDDD',
    'DDDDDKDD',
    'DKDDDDDD',
    'DDDDDDDD',
  ],
  dirt: [
    'DDDDDDDD',
    'DDKDDDDD',
    'DDDDDKDD',
    'DKDDDDDD',
    'DDDDDDDD',
    'DDDDKDDD',
    'DDDDDDDK',
    'DKDDDDDD',
  ],
  vine: [
    'GLGGGLGG',
    'GGMGGGMG',
    'T.T.T.T.',
    '.T...T..',
    '........',
    '........',
    '........',
    '........',
  ],
  thorn: [
    '........',
    '........',
    '........',
    '.W...W..',
    '.R...R..',
    'RRR.RRR.',
    'RPR.RPR.',
    'GGGGGGGG',
  ],
  branch: [
    'GLDDDDLG',
    'DDDDDODD',
    '.DDDDDD.',
    '........',
    '........',
    '........',
    '........',
    '........',
  ],
  melon: [
    'TGGGGGGT',
    'GLGGLGGL',
    'GLGGLGGL',
    'GLGGLGGL',
    'GLGGLGGL',
    'GLGGLGGL',
    'GLGGLGGL',
    'TGGGGGGT',
  ],
  juice: [
    'MMRMMMRM',
    'RMMMRMMM',
    'DDDDDDDD',
    'DDKDDDDD',
    'DDDDDKDD',
    'DKDDDDDD',
    'DDDDDDDD',
    'DDDDDDKD',
  ],
  seedStep: [
    '..YYYY..',
    '.YYWYYY.',
    '..YYYY..',
    '........',
    '........',
    '........',
    '........',
    '........',
  ],
  // Background (no collision)
  bgBrick: [
    'PPPNPPPP',
    'PPPNPPPP',
    'PPPNPPPP',
    'NNNNNNNN',
    'PPPPPPPN',
    'PPPPPPPN',
    'PPPPPPPN',
    'NNNNNNNN',
  ],
  bgRose: [
    '........',
    '..RR....',
    '.RPRR...',
    '..RR....',
    '...T....',
    '..TT....',
    '...T....',
    '........',
  ],
  facade: [
    'WWWEWWWW',
    'QQQEQQQQ',
    'QQQEQQQQ',
    'EEEEEEEE',
    'WWWWWWWE',
    'QQQQQQQE',
    'QQQQQQQE',
    'EEEEEEEE',
  ],
};

// ---------- Things ----------
const DOOR = ['....KKKKKKKK....', '..KKDDDDDDDDKK..', '.KDDDDDKDDDDDDK.', '.KDDDDDKDDDDDDK.'];
for (let i = 4; i < 23; i++) DOOR.push(i === 13 ? 'KDDDDDDKDDDDYDDK' : 'KDDDDDDKDDDDDDDK');
DOOR.push('KKKKKKKKKKKKKKKK');

const CHECKPOINT_OFF = [
  '........',
  '...GG...',
  '...GL...',
  '....G...',
  '..G.G...',
  '..GGG...',
  '....G...',
  '....G...',
];
const CHECKPOINT_ON = [
  '..MM.M..',
  '.MRMMM..',
  '.MMRMM..',
  '..MMM...',
  '..G.G...',
  '...GG.L.',
  '....GL..',
  '....G...',
];

const CLOUD = [
  '....WWWW........',
  '..WWWWWWWW.WW...',
  '.WWWWWWWWWWWWW..',
  'WWWWWWWWWWWWWWWW',
  '.QQQQQQQQQQQQQQ.',
];

const FLOWER = ['..M..', '.MYM.', '..M..', '..G..', '.GG..'];

// Rosie - our red toy poodle, with a ponytail and a pink bow (10x9, facing right)
const ROSIE = [
  '....MPM...',
  '...RR.RRR.',
  'R..R.RRRRR',
  'RR...PRKRR',
  '.R..RPRRRK',
  '..RRRRRRR.',
  '..RRRRRR..',
  '..P.P.P.P.',
  '..R.R.R.R.',
];
const ROSIE_RUN = [
  '....MPM...',
  '...RR.RRR.',
  'R..R.RRRRR',
  'RR...PRKRR',
  '.R..RPRRRK',
  '..RRRRRRR.',
  '..RRRRRR..',
  '.P..PP..P.',
  'R...RR...R',
];

const CARROT = [
  'OOOOOOOO',
  'OYOOOOKO',
  '.OOOOOO.',
  '..OOOO..',
  '..OOKO..',
  '...OO...',
  '...OO...',
  '....O...',
];
const CARROT_LEAF = ['.G.L.G.', '..GGG..', '...G...'];
const BERRY = [
  '.GLGGLG.',
  'RRRRRRRR',
  'RYRRRYRR',
  'RRRYRRRR',
  '.RRRRYR.',
  '..RRRR..',
  '...RR...',
  '........',
];

const SEED = ['..XX..', '.XXXX.', 'XWXXXX', 'XWXXXX', 'XXXXXX', '.XXXX.', '..XX..'];

// ---------- Fruits (the five floors) ----------
export const FRUITS = [
  { id: 'rose', name: 'ROSE', seed: 'M', icon: ['..MMM..', '.MRMMM.', '.MMRMM.', '..MMM..', '...G...', '..GG...', '...G...'] },
  { id: 'carrot', name: 'CARROT', seed: 'O', icon: ['..G.G..', '...G...', '.OOOO..', '.OOKO..', '..OOO..', '..OO...', '...O...'] },
  { id: 'apple', name: 'APPLE', seed: 'D', icon: ['...DL..', '.RRRRR.', 'RWRRRRR', 'RRRRRRR', 'RRRRRRR', '.RRRRR.', '..R.R..'] },
  { id: 'melon', name: 'MELON', seed: 'G', icon: ['.......', 'RRRRRRR', 'RKRRRKR', 'RRRKRRR', 'LRRRRRL', '.LLLLL.', '..GGG..'] },
  { id: 'strawberry', name: 'STRAWBERRY', seed: 'Y', icon: ['.GLGLG.', 'RRRRRRR', 'RYRRYRR', 'RRRYRRR', '.RYRRR.', '..RRR..', '...R...'] },
];
export const fruitById = (id) => FRUITS.find((f) => f.id === id);

export const SPR = {
  door: makeSprite(DOOR),
  cpOff: makeSprite(CHECKPOINT_OFF),
  cpOn: makeSprite(CHECKPOINT_ON),
  cloud: makeSprite(CLOUD),
  flower: makeSprite(FLOWER),
  flowerY: makeSprite(FLOWER, { M: 'Y', Y: 'O' }),
  rosie: makeSprite(ROSIE),
  rosieRun: makeSprite(ROSIE_RUN),
  carrot: makeSprite(CARROT),
  carrotLeaf: makeSprite(CARROT_LEAF),
  berry: makeSprite(BERRY),
  fruit: {},
  fruitGray: {},
  seed: {},
};
for (const [k, rows] of Object.entries(TILES)) SPR[k] = makeSprite(rows);
for (const f of FRUITS) {
  SPR.fruit[f.id] = makeSprite(f.icon);
  SPR.fruitGray[f.id] = makeSprite(f.icon, {}, 'E');
  SPR.seed[f.id] = makeSprite(SEED, { X: f.seed });
}

// Each floor can recolor the background bricks and the checkpoint flower.
export const themedBg = (map) => makeSprite(TILES.bgBrick, map);
export const flowerSprite = (color) => makeSprite(CHECKPOINT_ON, { M: color });

// ---------- Sophia, the boss (12x16, facing right) ----------
// White karate gi, black belt, brown ponytail with a pink bow - and she is MAD.
const SOPHIA_STANCE = [
  '....DDDD....',
  '..MDDDDDD...',
  '.MMDYYYYD...',
  '..DKKYYKKY..',
  '..DYKYYKYY..',
  '..DYYYYYYY..',
  '...YYRRRY...',
  '....YYYY....',
  '..WWWWWWWYY.',
  '.YWWQWWW....',
  '..WKKKKKW...',
  '..WWWWWWW...',
  '.WWW...WWW..',
  'WWW.....WWW.',
  'WW.......WW.',
  'YY.......YY.',
];
const sophiaFrame = (rows) => makeSprite(SOPHIA_STANCE.map((r, i) => rows[i] ?? r));
export const SOPHIA = {
  stance: sophiaFrame({}),
  throw: sophiaFrame({
    3: '..DKKYYKKY.Y',
    4: '..DYKYYKYY.W',
    5: '..DYYYYYYYW.',
    6: '...YYRRRYW..',
    7: '....YYYYW...',
    8: '..WWWWWWW...',
  }),
  dizzy: sophiaFrame({
    3: '..DYYYYYYY..',
    4: '..DYKKYKKY..',
    6: '....YRRY....',
    8: '..WWWWWWW...',
    9: '.YWWQWWWY...',
  }),
  happy: sophiaFrame({
    3: '..DYYYYYYY..',
    4: '..DYKYYKYY..',
    6: '...YRYYRY...',
    7: '....YRRY....',
    8: 'Y.WWWWWWW.Y.',
    9: '.WWWQWWWWW..',
  }),
};

// Raw pixel rows, shared with the 3D version (which turns them into blocks).
export const ROWS = { TILES, ROSIE, SEED, CHECKPOINT_OFF, CHECKPOINT_ON };

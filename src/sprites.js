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

// Rosie - our red toy poodle (10x8, facing right)
const ROSIE = [
  '......RRR.',
  'R....RRRRR',
  'RR...PRKRR',
  '.R..RPRRRK',
  '..RRRRRRR.',
  '..RRRRRR..',
  '..P.P.P.P.',
  '..R.R.R.R.',
];
const ROSIE_RUN = [
  '......RRR.',
  'R....RRRRR',
  'RR...PRKRR',
  '.R..RPRRRK',
  '..RRRRRRR.',
  '..RRRRRR..',
  '.P..PP..P.',
  'R...RR...R',
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

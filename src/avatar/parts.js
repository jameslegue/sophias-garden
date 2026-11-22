// Avatar parts. Lowercase letters are "roles" that get the player's chosen colors:
//   s = skin, e = eyes, h = hair, t = shirt, p = pants, f = shoes, a = hat
// Uppercase letters are fixed palette colors.

export const HEAD = [
  '........',
  '..ssss..',
  '.ssssss.',
  '.sesses.',
  '.ssssss.',
  '..ssss..',
];

export const BODY = {
  idle: ['.tttttt.', 'stttttts', '.tttttt.', '.pp..pp.', '.pp..pp.', '.ff..ff.'],
  run1: ['.tttttt.', 'stttttts', '.tttttt.', '.pp..pp.', 'pp....pp', 'ff....ff'],
  run2: ['.tttttt.', 'stttttts', '.tttttt.', '..pppp..', '...pp...', '..ffff..'],
  jump: ['stttttts', '.tttttt.', '.tttttt.', '.pp..pp.', '.pp..pp.', 'ff....ff'],
};

// Overlays start at the top row of the sprite. '.' leaves what's underneath.
export const HAIR = {
  NONE: [],
  SHORT: ['..hhhh..', '.hhhhhh.', '.h....h.'],
  LONG: ['..hhhh..', '.hhhhhh.', 'hh....hh', 'h......h', 'h......h', 'h......h', 'h......h'],
  BUN: ['...hh...', '..hhhh..', '.hhhhhh.'],
  SPIKY: ['.h.hh.h.', '.hhhhhh.', '.h....h.'],
  CURLY: ['.hhhhhh.', 'hhhhhhhh', 'hhh..hhh', 'hh....hh', 'h......h'],
};

export const HATS = {
  NONE: [],
  CAP: ['..aaaa..', '.aaaaaaa'],
  CROWN: ['.a.aa.a.', '.aaaaaa.'],
  BOW: ['.aa.....', 'aaa.....', '.aa.....'],
  FLOWER: ['......a.', '.....aYa', '......a.'],
  TOPHAT: ['..aaaa..', '..aaaa..', '.aaaaaa.'],
};

export const SKINS = ['Y', 'O', 'D'];

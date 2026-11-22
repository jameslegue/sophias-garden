// Every block a floor can be built from. Floors (and later, player-made obbies)
// are text grids that use these characters.
export const BLOCKS = {
  '.': { name: 'Air' },
  '#': { name: 'Tower Brick', solid: true, sprite: 'brick' },
  '=': { name: 'Grass', solid: true, sprite: 'grass' },
  '%': { name: 'Dirt', solid: true, sprite: 'dirt' },
  '-': { name: 'Rose Vine', oneway: true, sprite: 'vine' },
  '^': { name: 'Thorns', hazard: true, sprite: 'thorn' },
  b: { name: 'Apple Branch', oneway: true, sprite: 'branch' },
  m: { name: 'Bouncy Melon', solid: true, bounce: true, sprite: 'melon' },
  j: { name: 'Juice Puddle', solid: true, slippery: true, sprite: 'juice' },
  o: { name: 'Seed Step', oneway: true, sprite: 'seedStep' },
};

// Blocks that move or change. Runs of the same letter join into one wider platform.
export const PLATFORMS = {
  c: 'carrot', // sinks while you stand on it
  v: 'berry',  // vanishes a moment after you land
};

// Characters that place a thing instead of a block.
export const ENTITIES = {
  P: 'start',      // where the player appears
  C: 'checkpoint', // flower that saves your spot
  S: 'seed',       // the floor's fruit seed (end of floor)
  D: 'door',       // tower door
  a: 'apple',      // apple that keeps falling from here
};

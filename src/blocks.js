// Every block a floor can be built from. Floors (and later, player-made obbies)
// are text grids that use these characters.
export const BLOCKS = {
  '.': { name: 'Air' },
  '#': { name: 'Tower Brick', solid: true, sprite: 'brick' },
  '=': { name: 'Grass', solid: true, sprite: 'grass' },
  '%': { name: 'Dirt', solid: true, sprite: 'dirt' },
  '-': { name: 'Rose Vine', oneway: true, sprite: 'vine' },
  '^': { name: 'Thorns', hazard: true, sprite: 'thorn' },
};

// Characters that place a thing instead of a block.
export const ENTITIES = {
  P: 'start',      // where the player appears
  C: 'checkpoint', // flower that saves your spot
  S: 'seed',       // the floor's fruit seed (end of floor)
  D: 'door',       // tower door
};

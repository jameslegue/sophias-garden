# Sophia's Garden

An 8-bit tower-climbing game designed by Sophia. Built for phones (portrait).

Climb the tower one obby floor at a time - Rose, Carrot, Apple, Melon, Strawberry - and collect each fruit's seed with Rosie the poodle. At the top: **Battle vs Sophia**, where you give her every seed to make the garden bloom.

## How to play
- **◀ ▶** to move, **JUMP** to jump (keyboard: arrows / A D, Space or Up to jump)
- Touch a flower to save your spot. Hit a thorn and you go back to your last flower.
- Reach the seed at the top of each floor - Rosie grabs it for you.
- **MY AVATAR** on the title screen to design your character (or hit RANDOM).

## Run it
No build step. Serve the folder and open it:

```
python3 -m http.server 8000
```

Then go to http://localhost:8000. (Opening `index.html` directly won't work - browsers block modules from `file://`.)

On a phone: host on GitHub Pages (repo Settings → Pages → deploy from branch), open the link, then "Add to Home Screen".

Testing shortcut: `?level=levels/level1/01-rose.json` jumps straight to a floor.

## How it's built
- Plain JavaScript modules + an HTML canvas at 144x256, scaled up in whole pixels so it stays crisp
- One 16-color palette (`src/engine/palette.js`); all art is text grids of palette letters (`src/sprites.js`, `src/avatar/parts.js`)
- **Floors are data:** `levels/level1/*.json` - a text map using the blocks in `src/blocks.js`:

| Char | Block |
|---|---|
| `#` | Tower brick (solid) |
| `=` | Grass (solid) |
| `%` | Dirt (solid) |
| `-` | Rose vine (jump up through it, stand on top) |
| `^` | Thorns (send you back to your flower) |
| `b` | Apple branch (jump up through it) |
| `m` | Bouncy melon (boing!) |
| `j` | Juice puddle (slippery) |
| `o` | Seed step (tiny, jump up through it) |
| `c` | Carrot - sinks while you stand on it |
| `v` | Strawberry - vanishes after you land, grows back |
| `a` | Apple that keeps dropping from here |
| `P` | Player start |
| `C` | Checkpoint flower |
| `S` | Seed (end of floor) |
| `D` | Door |

The later "make your own obby" builder will save floors in this same format.

## Roadmap
1. ✅ Foundation + Rose floor - controls, avatar builder, spawn intro, Rosie, checkpoints, seed bar
2. ✅ Floors 2-5 - Carrot, Apple, Melon, Strawberry, plus CONTINUE from your last floor
3. Battle vs Sophia (she's mad, karate stance, cartwheels away after throwing fruit) + music, ending, offline install
4. Avatar pixel editor - draw your own hats and outfits
5. Obby builder - make your own floors
6. Sharing + Level 2

# Sophia's Garden - game plan

## Context
Building a game with my daughter (8-10, lead designer). Her requirements: 8-bit pixel look, mini games, and eventually players make their own games - built in stages. She plays on a **phone, held portrait**.

Her drawing defines **Level 1 = a tower climb**. Players spawn on the ground (bottom left), walk into the tower door, and climb one obby per floor:

`Rose → Carrot → Apple → Melon → Strawberry → Battle vs Sophia (boss)`

Her rules:
- Players **design their own avatar** (Roblox-style)
- **Multiple checkpoints per floor** - fall or get hit and you restart at the latest checkpoint on the floor you're on

- **Seeds:** finishing each floor earns that fruit's seed for Sophia's Garden. This is explained at the start. In the battle, players are told to give each seed to Sophia.
- **Rosie** - a dog companion named after our red toy poodle. She follows the player and collects each seed as it's earned.

Repo (`jameslegue/sophias-garden`) is empty - greenfield.

## Story loop
1. **Intro at spawn:** a short pixel cutscene/sign. Sophia's Garden needs seeds - climb the tower, get a seed from each floor, bring them to Sophia. You meet Rosie (a red toy poodle, curly pixel fur).
2. **Each floor:** a seed waits at the top of the obby. When you reach it, Rosie runs over, grabs it and shows it (a "+1 Rose seed" pop-up). A seed bar at the top of the screen fills up (Rose, Carrot, Apple, Melon, Strawberry).
3. **Battle vs Sophia:** you're told to give her each seed. 5 rounds, one per seed: dodge Sophia's fruit attacks, and when a round's window opens, reach Sophia so Rosie hands her that seed. Each seed delivered plants and blooms that fruit in the arena. All 5 = the garden blooms = win.

## Approach

**Tech:** plain JavaScript (ES modules) + HTML5 canvas, no framework, no build step. Hosted on GitHub Pages so it's a link on her phone, and installable to the home screen (PWA).

**8-bit look:** render at 144x256 (portrait 9:16), scale up by whole numbers with nearest-neighbor. Fixed 16-color palette, 8x8 tiles, 8x12-ish characters, a pixel font, and square/triangle-wave sound via WebAudio.

**Controls (phone first):** a control bar under the game screen (phones are taller than 9:16, so it fits) with ◀ ▶ and a big JUMP button. Arrow keys and space on desktop. Kid-friendly jump feel: coyote time, jump buffering, forgiving hitboxes.

**Engine core = platformer:** fixed 60Hz timestep, tile collision on boxes, camera that scrolls up the tower, checkpoint system.

**Key architecture call - everything is data:**
- **Floors** are JSON: a text-grid tile map + checkpoint positions + theme. Example row: `"..R....===..^^.."`
- **Block types** live in one registry (`src/blocks.js`): solid, thorn, bouncy melon, falling apple, sinking carrot, vanishing strawberry, checkpoint, etc.
- **Avatars** are JSON: chosen parts + colors, assembled into a sprite at runtime.
- The built-in floors use the exact format the later **obby builder** will save. IOW her tower is the first thing made with the game maker.

## Floor ideas (draft - she picks/edits)
| Floor | Twist | Checkpoint |
|---|---|---|
| Rose | Tutorial: basic jumps, thorn spikes, climbable vines | Rose bloom |
| Carrot | Carrots that sink into the soil when you stand on them | Carrot sprout |
| Apple | Apples fall from branches - dodge them; branches are platforms | Apple core |
| Melon | Bouncy melon trampolines, slippery juice puddles | Melon slice |
| Strawberry | Strawberries vanish a moment after you land; tiny seed platforms | Strawberry flower |
| Battle vs Sophia | Boss arena, 5 rounds: mad Sophia throws that round's fruit from a karate stance, then cartwheels away; survive, then deliver the seed (Rosie hands it over) | Start of each round |

Each floor ends at its seed. Win = garden blooms with all 5 fruits + "Level 1 complete" screen (Rosie celebration).

## Rosie (companion)
- Follows the player with simple trailing/hopping AI. She can't get hurt and teleports to the player if she falls behind (no babysitting the dog).
- Picks up seeds at the end of each floor; carries the seed inventory; hands seeds to Sophia in the battle.
- Pixel sprite: red curly poodle with a **ponytail and a cute pink bow** (Sophia's call), idle/run frames.

## Sophia (the boss) - from Sophia
- She's **mad**.
- Fights from a **karate stance**.
- Throws fruit, then **cartwheels out of the way**.
- Built in Stage 3: each of the 5 rounds she throws that round's fruit from her karate stance, cartwheels across the arena, and the player delivers that seed when she stops (Rosie hands it over).

## Avatar builder (Roblox-style, pixel)
Pick parts + colors from our palette: skin tone, hair style + color, shirt, pants, shoes, hat/accessory. Live preview walking/jumping. Saved on the phone (localStorage, with a fallback if storage is unavailable). Later stage adds free drawing of your own parts.

## Stages
1. **Foundation + Rose floor** - engine, touch controls, title screen, avatar builder v1, spawn intro (seeds + meet Rosie), tower door, Rose floor with checkpoints, Rosie following and collecting the Rose seed, seed bar. Live on her phone.
2. **Floors 2-5** - Carrot, Apple, Melon, Strawberry + their block types and seeds. Progress (floor reached, seeds held) saved.
3. **Boss battle + polish** - Battle vs Sophia (Sophia boss sprite designed by her): 5 seed-delivery rounds, garden bloom ending, music/SFX, PWA install.
4. **Avatar pixel editor** - draw your own hats/shirts/accessories on a grid.
5. **Obby builder** - make your own floor from the block palette, test-play it, add it to "My Tower."
6. **Sharing + Level 2** - export/import floors as a file/code, gallery, next level design (her next drawing).

Each stage ends with a playtest - she signs off on what's fun.

## Files (stage 1)
- `index.html`, `manifest.webmanifest`
- `src/main.js` - boot, scene manager
- `src/engine/` - `loop.js`, `render.js` (scaling, palette, sprites, font), `input.js` (touch + keys), `physics.js`, `camera.js`, `audio.js`, `save.js`
- `src/blocks.js` - block type registry
- `src/avatar/` - `parts.js` (pixel part data), `compose.js` (build sprite from avatar JSON)
- `src/scenes/` - `title.js`, `avatar-builder.js`, `spawn.js` (intro), `tower.js` (loads floor JSON, checkpoints, seed pickup)
- `src/entities/rosie.js` - companion follow AI, seed inventory
- `src/ui/seed-bar.js` - seed collection HUD
- `levels/level1/01-rose.json`
- `README.md` - how to play/run

## Verification
- Run locally with `python3 -m http.server`; Playwright with iPhone emulation (portrait) to screenshot title → avatar builder → spawn → tower.
- Scripted checks: walk into the door, jump through Rose, touch a thorn → respawn at the latest checkpoint; Rosie follows and catches up after a respawn; reach the seed → Rosie collects it and the seed bar updates; avatar choices persist after a reload.
- Check pixels stay crisp (no blur) across a couple of phone sizes.
- Push to `claude/game-planning-daughter-vr7467`. GitHub Pages needs turning on in repo settings (James) - then she plays it on her phone. That's the real test.

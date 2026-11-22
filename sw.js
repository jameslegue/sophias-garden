// Lets the game run offline from the home screen.
// Network first (so updates show up right away), saved copy when offline.
const CACHE = 'sophias-garden-v1';
const FILES = [
  './',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './index.html',
  './levels/level1/00-spawn.json',
  './levels/level1/01-rose.json',
  './levels/level1/02-carrot.json',
  './levels/level1/03-apple.json',
  './levels/level1/04-melon.json',
  './levels/level1/05-strawberry.json',
  './levels/level1/06-battle.json',
  './manifest.webmanifest',
  './src/avatar/compose.js',
  './src/avatar/parts.js',
  './src/blocks.js',
  './src/engine/audio.js',
  './src/engine/camera.js',
  './src/engine/font.js',
  './src/engine/input.js',
  './src/engine/loop.js',
  './src/engine/music.js',
  './src/engine/palette.js',
  './src/engine/physics.js',
  './src/engine/render.js',
  './src/engine/save.js',
  './src/entities/apple.js',
  './src/entities/platforms.js',
  './src/entities/player.js',
  './src/entities/rosie.js',
  './src/main.js',
  './src/scenes/avatar-builder.js',
  './src/scenes/battle.js',
  './src/scenes/spawn.js',
  './src/scenes/title.js',
  './src/scenes/tower.js',
  './src/sprites.js',
  './src/ui/button.js',
  './src/ui/dialog.js',
  './src/ui/seed-bar.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })),
  );
});

import { getCtx, isMuted } from './audio.js';

// Tiny chiptune player. Each track is a list of 8th notes:
//   'A4' = play a note, '-' = keep holding it, '.' = rest, '|' = bar line (ignored).
const SEMI = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
const freq = (n) => {
  const m = n.match(/^([A-G]#?)(\d)$/);
  return 440 * 2 ** (((+m[2] + 1) * 12 + SEMI[m[1]] - 69) / 12);
};

const SONGS = {
  title: {
    bpm: 112, loop: true,
    tracks: [
      { wave: 'triangle', vol: 0.07, notes: 'C5 . E5 G5 . E5 D5 . | C5 . E5 G5 A5 G5 E5 . | F5 . A5 G5 . E5 D5 . | C5 . D5 E5 D5 - C5 .' },
      { wave: 'square', vol: 0.015, notes: 'C3 . G3 . C3 . G3 . | A2 . E3 . A2 . E3 . | F2 . C3 . F2 . C3 . | G2 . D3 . G2 . C3 .' },
    ],
  },
  battle: {
    bpm: 150, loop: true,
    tracks: [
      { wave: 'square', vol: 0.03, notes: 'A4 . C5 A4 E5 . D5 C5 | B4 . G4 B4 D5 . C5 B4 | A4 . C5 A4 E5 . A5 G5 | F5 E5 D5 C5 B4 . E5 .' },
      { wave: 'triangle', vol: 0.08, notes: 'A2 A2 A3 A2 A2 A2 A3 A2 | G2 G2 G3 G2 G2 G2 G3 G2 | F2 F2 F3 F2 F2 F2 F3 F2 | E2 E2 E3 E2 E2 E2 E3 E2' },
    ],
  },
  victory: {
    bpm: 140, loop: false,
    tracks: [
      { wave: 'square', vol: 0.035, notes: 'C5 E5 G5 C6 - - G5 C6 | - - - - . . . .' },
      { wave: 'triangle', vol: 0.08, notes: 'C3 . G3 . C3 . E3 G3 | C4 - - - . . . .' },
    ],
  },
};

let song = null;
let step = 0;
let nextTime = 0;
let timer = null;

export function playSong(name) {
  if (song?.name === name) return;
  stopMusic();
  const s = SONGS[name];
  song = { name, ...s, parsed: s.tracks.map((t) => t.notes.split(/\s+/).filter((x) => x && x !== '|')) };
  step = 0;
  nextTime = 0;
  timer = setInterval(tick, 25);
}

export function stopMusic() {
  clearInterval(timer);
  timer = null;
  song = null;
}

function note(ctx, track, f, t, dur) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = track.wave;
  o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(track.vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

// Schedule a little ahead of time so the music never stutters.
function tick() {
  const ctx = getCtx();
  if (!ctx || !song) return;
  if (isMuted()) { nextTime = 0; return; }
  const dur = 60 / song.bpm / 2;
  if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.05;
  while (nextTime < ctx.currentTime + 0.15) {
    const len = song.parsed[0].length;
    if (step >= len) {
      if (!song.loop) { stopMusic(); return; }
      step = 0;
    }
    song.tracks.forEach((track, i) => {
      const notes = song.parsed[i];
      const tok = notes[step];
      if (!tok || tok === '.' || tok === '-') return;
      let n = 1;
      while (notes[step + n] === '-') n++;
      note(ctx, track, freq(tok), nextTime, dur * n * 0.9);
    });
    step++;
    nextTime += dur;
  }
}

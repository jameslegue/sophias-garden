// Chiptune-style sound effects made from simple square waves.
let ctx = null;

// Browsers only allow sound after the player touches/presses something.
export function unlock() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
  }
  if (ctx.state === 'suspended') ctx.resume();
}

function tone(freq, dur, { type = 'square', vol = 0.05, to = null, delay = 0 } = {}) {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function notes(freqs, d, opts = {}) {
  freqs.forEach((f, i) => tone(f, d * 1.5, { ...opts, delay: i * d }));
}

export const sfx = {
  jump: () => tone(300, 0.12, { to: 620 }),
  hurt: () => tone(220, 0.3, { to: 55, type: 'sawtooth', vol: 0.04 }),
  checkpoint: () => notes([523, 659, 784], 0.07),
  seed: () => notes([523, 659, 784, 1047, 784, 1047], 0.08),
  blip: () => tone(880, 0.04, { vol: 0.03 }),
  select: () => tone(660, 0.05, { vol: 0.04 }),
  door: () => notes([392, 523, 659], 0.09, { type: 'triangle', vol: 0.08 }),
  bark: () => { tone(700, 0.06, { to: 350 }); tone(700, 0.06, { to: 350, delay: 0.14 }); },
};

// Saves live on the phone. If storage is blocked (private mode etc.) the game still works,
// it just won't remember things.
const PREFIX = 'sophias-garden.';

export function load(key, fallback) {
  try {
    const v = localStorage.getItem(PREFIX + key);
    if (v) return { ...structuredClone(fallback), ...JSON.parse(v) };
  } catch { /* storage unavailable */ }
  return structuredClone(fallback);
}

export function save(key, value) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

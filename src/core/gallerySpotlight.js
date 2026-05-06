function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffledIndexes(seed, len) {
  const rand = mulberry32(seed);
  const out = Array.from({ length: len }, (_, i) => i);
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

export function spotlightIndexForTick(seed, tick, len) {
  if (len <= 0) return 0;
  if (len === 1) return 0;
  const t = Math.max(0, Math.floor(Number(tick) || 0));
  const combined = (Number(seed) ^ Math.imul(t, 0x45d9f3b)) >>> 0;
  const rand = mulberry32(combined);
  return Math.floor(rand() * len);
}

export function visibleIndexesForTick(seed, tick, len, count) {
  const safeLen = Math.max(0, Math.floor(Number(len) || 0));
  const safeCount = Math.max(0, Math.floor(Number(count) || 0));
  if (safeLen === 0 || safeCount === 0) return [];
  if (safeLen <= safeCount) return Array.from({ length: safeLen }, (_, i) => i);

  const t = Math.max(0, Math.floor(Number(tick) || 0));
  const combined = (Number(seed) ^ Math.imul(t + 1, 0x9e3779b1)) >>> 0;
  return shuffledIndexes(combined, safeLen).slice(0, safeCount);
}

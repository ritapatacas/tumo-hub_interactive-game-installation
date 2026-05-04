function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function spotlightIndexForTick(seed, tick, len) {
  if (len <= 0) return 0;
  if (len === 1) return 0;
  const t = Math.max(0, Math.floor(Number(tick) || 0));
  const combined = (Number(seed) ^ Math.imul(t, 0x45d9f3b)) >>> 0;
  const rand = mulberry32(combined);
  return Math.floor(rand() * len);
}

/**
 * Seeded pseudo-random number generator (Mulberry32).
 * Ensures deterministic output across Remotion renders.
 */

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Create a seeded random number generator.
 * @param baseSeed - A fixed seed for the animation type (e.g. 1000 for particles)
 * @returns A function that returns the next random number in [0, 1)
 */
export function createRng(baseSeed: number): () => number {
  return mulberry32(baseSeed);
}

/**
 * Utility: generate a random float in [min, max) from a seeded rng.
 */
export function rngFloat(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

/**
 * Utility: generate a random int in [min, max] from a seeded rng.
 */
export function rngInt(rng: () => number, min: number, max: number): number {
  return Math.floor(min + rng() * (max - min + 1));
}

/**
 * Utility: pick a random element from an array.
 */
export function rngPick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

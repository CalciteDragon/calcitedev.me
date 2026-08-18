/**
 * Deterministic pseudo-random number generator for background-scene entities.
 *
 * The scene must look identical on every load: stars are decorative furniture,
 * not variety. `Math.random()` reshuffles them on each page load *and* on each
 * resize re-seed, which reads as flicker rather than as detail.
 */

/** Seed for the star field. Change it to reroll the sky layout. */
export const SCENE_SEED = 0x5ca1c17e;

/** Seed for the drifting particles — distinct so they do not mirror the stars. */
export const PARTICLE_SEED = 0x0dd17e55;

/**
 * mulberry32 — a small, fast 32-bit PRNG with a good enough distribution for
 * scattering decorative entities. Returns values in [0, 1) like `Math.random`.
 */
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

import { PARTICLE_SEED, SCENE_SEED, createSeededRandom } from './seeded-random';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Star {
  x: number;             // CSS px
  y: number;             // CSS px (base position; drawn at y - scrollY * parallaxFactor)
  radius: number;        // 0.4–2.5 CSS px
  opacity: number;       // 0.2–0.8
  twinklePhase: number;  // radians (0–2π)
  twinkleSpeed: number;  // radians per ms
  parallaxFactor: number; // 0.01–0.04 — how far star drifts per CSS px of scrollY
}

export interface SceneParticle {
  x: number;       // CSS px
  y: number;       // CSS px
  vy: number;      // CSS px per ms (negative = upward drift)
  opacity: number; // 0.15–0.35
  size: number;    // 1–2 CSS px
}

export interface SceneConfig {
  starCount: number;
  particleCount: number;
  reducedComplexity: boolean;
}

// ─── Config ───────────────────────────────────────────────────────────────────

export function defaultConfig(reducedComplexity: boolean): SceneConfig {
  return {
    starCount: reducedComplexity ? 65 : 130,
    particleCount: reducedComplexity ? 8 : 20,
    reducedComplexity,
  };
}

// ─── Factory Functions ─────────────────────────────────────────────────────────

/**
 * Build the star field. Seeded by default, so the same sky is drawn on every
 * page load and after every resize re-seed — pass a different `seed` to reroll.
 */
export function createStars(
  count: number,
  cssWidth: number,
  cssHeight: number,
  seed: number = SCENE_SEED,
): Star[] {
  const rand = createSeededRandom(seed);
  return Array.from({ length: count }, () => ({
    x: rand() * cssWidth,
    // Concentrate stars in upper 85% — they appear above the mountains naturally
    y: rand() * cssHeight * 0.85,
    radius: 0.4 + rand() * 2.1,            // 0.4–2.5 CSS px
    opacity: 0.2 + rand() * 0.6,           // 0.2–0.8 — more visible
    twinklePhase: rand() * Math.PI * 2,
    twinkleSpeed: 0.0003 + rand() * 0.0012,
    parallaxFactor: 0.01 + rand() * 0.03,  // subtle depth: 0.01–0.04
  }));
}

/**
 * Build the drifting particle field. Starting positions are seeded for the same
 * reason the stars are; respawns after a particle drifts off-screen stay random,
 * since by then the field has already diverged from its initial state anyway.
 */
export function createParticles(
  count: number,
  cssWidth: number,
  cssHeight: number,
  seed: number = PARTICLE_SEED,
): SceneParticle[] {
  const rand = createSeededRandom(seed);
  return Array.from({ length: count }, () => ({
    x: rand() * cssWidth,
    y: rand() * cssHeight,
    vy: -(0.02 + rand() * 0.03),
    opacity: 0.15 + rand() * 0.2,
    size: 1 + rand(),
  }));
}

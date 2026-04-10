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

export interface UFO {
  nx: number;           // normalized horizontal position (0–1)
  baseNy: number;       // normalized vertical base position (0–1)
  bobPhase: number;     // radians; advances each frame
  bobSpeed: number;     // radians per ms
  bobAmplitude: number; // CSS px
}

export interface Rocket {
  nx: number;        // normalized horizontal position (0–1)
  ny: number;        // normalized vertical position (0–1)
  flamePhase: number;
  flameSpeed: number; // radians per ms
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

export function createStars(count: number, cssWidth: number, cssHeight: number): Star[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * cssWidth,
    // Concentrate stars in upper 85% — they appear above the mountains naturally
    y: Math.random() * cssHeight * 0.85,
    radius: 0.4 + Math.random() * 2.1,            // 0.4–2.5 CSS px
    opacity: 0.2 + Math.random() * 0.6,           // 0.2–0.8 — more visible
    twinklePhase: Math.random() * Math.PI * 2,
    twinkleSpeed: 0.0003 + Math.random() * 0.0012,
    parallaxFactor: 0.01 + Math.random() * 0.03,  // subtle depth: 0.01–0.04
  }));
}

export function createUFO(): UFO {
  return {
    nx: 0.75,
    baseNy: 0.22,
    bobPhase: 0,
    bobSpeed: 0.0008,
    bobAmplitude: 8,
  };
}

export function createRocket(): Rocket {
  return {
    nx: 0.87,
    ny: 0.52,
    flamePhase: 0,
    flameSpeed: 0.003,
  };
}

export function createParticles(
  count: number,
  cssWidth: number,
  cssHeight: number,
): SceneParticle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * cssWidth,
    y: Math.random() * cssHeight,
    vy: -(0.02 + Math.random() * 0.03),
    opacity: 0.15 + Math.random() * 0.2,
    size: 1 + Math.random(),
  }));
}

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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Star {
  x: number;             // CSS px
  y: number;             // CSS px (base position; drawn at y - scrollY * parallaxFactor)
  radius: number;        // 0.5–2 CSS px
  opacity: number;       // 0.15–0.40 (reduced for global site use)
  twinklePhase: number;  // radians (0–2π)
  twinkleSpeed: number;  // radians per ms
  parallaxFactor: number; // 0.01–0.04 — how far star drifts per CSS px of scrollY
}

export interface MountainLayer {
  /** Normalized (0–1) vertex coords — multiplied by cssWidth/cssHeight at draw time. */
  vertices: Array<{ nx: number; ny: number }>;
  strokeColor: string;    // rgba() — neon wireframe outline
  fillColor: string;      // rgba() — very faint fill below outline
  parallaxFactor: number; // CSS px shifted per CSS px of window.scrollY
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
    starCount: reducedComplexity ? 50 : 100,
    particleCount: reducedComplexity ? 8 : 20,
    reducedComplexity,
  };
}

// ─── Factory Functions ─────────────────────────────────────────────────────────

export function createStars(count: number, cssWidth: number, cssHeight: number): Star[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * cssWidth,
    y: Math.random() * cssHeight,
    radius: 0.5 + Math.random() * 1.5,
    opacity: 0.15 + Math.random() * 0.25,         // dimmer — global background use
    twinklePhase: Math.random() * Math.PI * 2,
    twinkleSpeed: 0.0005 + Math.random() * 0.001,
    parallaxFactor: 0.01 + Math.random() * 0.03,  // subtle depth: 0.01–0.04
  }));
}

export function createMountainLayers(): MountainLayer[] {
  return [
    {
      // Back layer — taller peaks, blue, low parallax
      vertices: generateMountainVertices(6, 0.52, 0.70),
      strokeColor: 'rgba(59, 130, 246, 0.2)',  // --accent-blue
      fillColor: 'rgba(59, 130, 246, 0.04)',
      parallaxFactor: 0.08,
    },
    {
      // Front layer — shorter/wider peaks, purple, more parallax
      vertices: generateMountainVertices(4, 0.62, 0.80),
      strokeColor: 'rgba(139, 92, 246, 0.25)', // --accent-purple
      fillColor: 'rgba(139, 92, 246, 0.05)',
      parallaxFactor: 0.15,
    },
  ];
}

function generateMountainVertices(
  peakCount: number,
  minNy: number,
  maxNy: number,
): Array<{ nx: number; ny: number }> {
  const step = 1 / (peakCount + 1);
  const verts: Array<{ nx: number; ny: number }> = [{ nx: 0, ny: 1 }];
  for (let i = 1; i <= peakCount; i++) {
    verts.push({
      nx: i * step + (Math.random() - 0.5) * step * 0.4,
      ny: minNy + Math.random() * (maxNy - minNy),
    });
  }
  verts.push({ nx: 1, ny: 1 });
  return verts;
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

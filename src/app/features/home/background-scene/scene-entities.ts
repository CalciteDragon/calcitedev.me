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

export interface MountainLayer {
  /** Normalized (0–1) vertex coords — multiplied by cssWidth/cssHeight at draw time. */
  vertices: Array<{ nx: number; ny: number }>;
  strokeColor: string;    // rgba() — neon wireframe outline
  fillColor: string;      // rgba() — opaque dark fill to occlude stars behind the range
  glowColor: string;      // rgba() — ctx.shadowColor for neon bloom
  glowBlur: number;       // ctx.shadowBlur in CSS px
  parallaxFactor: number; // CSS px shifted per CSS px of window.scrollY (clamped at heroHeight)
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

export function createMountainLayers(): MountainLayer[] {
  return [
    {
      // Far back layer — many sharp distant peaks, deep indigo
      vertices: generateMountainVertices(16, 0.3, 0.71),
      strokeColor: 'rgba(99, 102, 241, 0.5)',
      fillColor: 'rgba(5, 8, 20, 0.92)',
      glowColor: 'rgba(99, 102, 241, 0.65)',
      glowBlur: 8,
      parallaxFactor: 0.1,
    },
    {
      // Mid layer — taller dramatic peaks, electric blue
      vertices: generateMountainVertices(12, 0.65, 0.95),
      strokeColor: 'rgba(56, 189, 248, 0.45)',
      fillColor: 'rgba(5, 8, 20, 0.94)',
      glowColor: 'rgba(56, 189, 248, 0.6)',
      glowBlur: 11,
      parallaxFactor: 0.17,
    },
    {
      // Front layer — wide low foothills, vibrant purple
      vertices: generateMountainVertices(8, 0.80, 1.50),
      strokeColor: 'rgba(168, 85, 247, 0.6)',
      fillColor: 'rgba(5, 8, 20, 0.96)',
      glowColor: 'rgba(168, 85, 247, 0.75)',
      glowBlur: 14,
      parallaxFactor: 0.3,
    },
  ];
}

function generateMountainVertices(
  peakCount: number,
  minNy: number,
  maxNy: number,
): Array<{ nx: number; ny: number }> {
  // Only peak vertices — no corner anchors. The renderer handles off-screen
  // extensions when building the fill and stroke paths.
  const step = 1 / (peakCount + 1);
  const verts: Array<{ nx: number; ny: number }> = [];
  for (let i = 1; i <= peakCount; i++) {
    const nx = i * step + (Math.random() - 0.5) * step * 0.4;
    // Valley bias: upward parabola — peaks near edges are tall (low ny),
    // peaks near center are short (high ny), as if the viewer is in a valley.
    const bias = 3 * Math.pow(nx - 0.5, 2); // 1.0 at edges, 0.0 at center
    const targetNy = minNy + (1 - bias) * (maxNy - minNy);
    const jitter = (Math.random() - 0.5) * (maxNy - minNy) * 0.22;
    const ny = Math.max(minNy, Math.min(maxNy, targetNy + jitter));
    verts.push({ nx, ny });
  }
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

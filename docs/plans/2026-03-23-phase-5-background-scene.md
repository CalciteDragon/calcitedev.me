# Phase 5: Home Page — Background Scene (Canvas) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `BackgroundSceneComponent` — a `position: fixed` full-viewport canvas that renders a cyberpunk scene behind the entire site: a twinkling star field with subtle per-star parallax visible everywhere, plus hero-only elements (low-poly neon mountains with scroll parallax, floating UFO with glow beam, pixel rocket with animated flame, drifting particles) that render only while the hero section is in view. A CSS scanline overlay completes the CRT aesthetic.

**Architecture:** The canvas is `position: fixed; z-index: -1` — always viewport-sized, always composited as a single GPU layer behind all page content. All drawing is delegated to `SceneRenderer`, a plain TypeScript class with no Angular dependencies. Entity types and factory functions live in `scene-entities.ts`. `BackgroundSceneComponent` owns the Angular lifecycle (SSR guard, rAF loop, ResizeObserver against `document.documentElement`), reads `window.scrollY` and `#home` section height each frame, and passes both to the renderer to gate hero-only elements. `body { background-color }` is set to `transparent` so the fixed canvas shows through all sections; `html { background-color: var(--bg-primary) }` (already in `styles.scss`) provides the dark viewport base below the canvas.

**Tech Stack:** Angular 21 standalone components, `isPlatformBrowser`, `DOCUMENT`, signal-based `viewChild`, `requestAnimationFrame`, `ResizeObserver`, Canvas 2D API, `devicePixelRatio` DPR scaling, SCSS CSS custom properties, Vitest via `@angular/build:unit-test`

---

## Questions & Decisions

Resolved before writing the plan:

### Q1: Should the canvas cover only the hero section or the full page?

A full-site animated background creates more depth and keeps the site feeling alive as users scroll through Projects, About, Skills, and Contact. A hero-only canvas would leave a flat background elsewhere.

**Decision:** Canvas is `position: fixed; inset: 0` — always viewport-sized. It renders behind the entire site. Hero-specific elements (mountains, UFO, rocket) render only when `scrollY < heroHeight`, so they disappear cleanly as the user scrolls away from the hero. Stars and particles render everywhere.

### Q2: Why `z-index: -1` rather than a higher value with content above it?

A canvas at `z-index: -1` paints before non-positioned block descendants in CSS stacking order, including `body`'s background box. If `body { background-color: var(--bg-primary) }` remains, it covers the canvas entirely.

**Decision:** Set `body { background-color: transparent }` in `styles.scss`. The existing `html { background-color: var(--bg-primary) }` propagates to the viewport canvas (painted below all elements, including `z-index: -1`), providing the dark base. Body is transparent, sections are transparent — the canvas shows through. Canvas at `z-index: -1`, content naturally above.

### Q3: Do stars need wrapping as they drift off-screen during parallax?

With parallax factors of 0.01–0.04 and a total page scroll height of ~4,000–5,000px, a star shifts at most 50–200px upward over the full scroll. Canvas height is 600–900px (viewport). Stars near the very top of the canvas could drift slightly off-screen at max scroll, but the effect is negligible.

**Decision:** No wrapping for stars. Stars that drift off-screen top (`drawnY < -radius`) are simply skipped that frame. With factors this small over a portfolio-length scroll, the visible star field remains dense enough without reseeding.

### Q4: How does the renderer know when to render hero-only elements?

The renderer needs to know the pixel height of the `#home` section to determine whether the hero is in view.

**Decision:** `BackgroundSceneComponent` injects `DOCUMENT` and reads `document.getElementById('home')?.offsetHeight` in the rAF loop each frame. This is a single DOM read per frame (just an integer property access — no layout thrash). Passed to `drawFrame(timestamp, scrollY, heroHeight)`. Fallback: `window.innerHeight` when the element isn't found (SSR, first render).

### Q5: Should the canvas be in `HomeComponent` or `LayoutComponent`?

`LayoutComponent` is the better long-term home (persists across all routes, including the future `/projects/:slug` detail page). However, since this is currently a single-page scroll app with one route, placing it in `HomeComponent` works identically — `HomeComponent` is always alive. Because `position: fixed` breaks elements out of their containing block, the canvas covers the viewport regardless of where in the DOM it lives.

**Decision:** Keep in `HomeComponent` (stays with existing `features/home/background-scene/` folder, no cross-feature import concerns). Add a note to move to `LayoutComponent` in Phase 6 when route navigation is added.

### Q6: How does ResizeObserver work with a fixed canvas?

A `position: fixed` canvas sizes from the viewport, not its container. Observing the container gives no signal when the viewport resizes (e.g., mobile browser chrome appearing/disappearing).

**Decision:** Observe `document.documentElement` (the `<html>` element), which ResizeObserver treats as a viewport-size proxy. On callback, `scheduleResize()` reads `window.innerWidth/innerHeight` (not container dimensions) and calls `renderer.resize()`.

### Q7: How does DPR scaling work with a fixed canvas?

Setting `canvas.width/height` resets the 2D context transform.

**Decision:** `SceneRenderer.resize(cssWidth, cssHeight)` sets physical dimensions via `Math.round(cssWidth * dpr)`, then calls `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` to re-establish the scale. All internal coordinates and entity positions remain in CSS pixels throughout.

### Q8: Should mountains/UFO/rocket fade out or cut off when scrolling past the hero?

A fade would require tracking progress through the hero boundary, adding per-frame alpha math.

**Decision:** Hard cut — hero elements are rendered when `scrollY < heroHeight`, not rendered otherwise. The transition is instantaneous but invisible in practice: by the time the hero section fully scrolls out of view, the canvas background is already mostly covered by the next section's card content.

### Q9: Should star opacity be different for full-site use vs. hero-only?

Stars that were appropriate behind a single hero section (opacity 0.3–1.0) may feel too bright when visible throughout the entire site, competing with card text.

**Decision:** Reduce star opacity to 0.15–0.40 for the full-site global layer. Stars should read as atmospheric depth, not focal elements. The hero section's rich elements (mountains, UFO, rocket) provide the visual interest there.

### Q10: Does the scanline overlay need to be global too?

The existing plan puts the scanline as a `::after` pseudo-element on `:host` (the canvas component). Since the canvas is now fixed and covers the full viewport, the scanline is global automatically.

**Decision:** Keep scanline on `:host::after`. No change needed — it already covers the full viewport via the fixed host.

---

## File Structure

### Created by this plan

```
src/app/features/home/background-scene/
├── scene-entities.ts               # Star/Mountain/UFO/Rocket/Particle types + factory fns (pure TS)
├── scene-entities.spec.ts          # Unit tests for factory functions
├── scene-renderer.ts               # SceneRenderer — all canvas draw logic (pure TS, no Angular)
├── scene-renderer.spec.ts          # Unit tests for SceneRenderer
├── background-scene.component.ts   # Angular shell — lifecycle, SSR guard, rAF loop, ResizeObserver
├── background-scene.component.html # Single <canvas> element
├── background-scene.component.scss # Host: position: fixed; z-index: -1; scanline overlay
└── background-scene.component.spec.ts # Component tests — SSR safety, canvas presence, cleanup
```

### Modified by this plan

```
src/app/features/home/
├── home.component.ts               # Import BackgroundSceneComponent
├── home.component.html             # Add <app-background-scene> as first child of #home
├── home.component.scss             # background-color: transparent; remove relative/z-index rules
└── home.component.spec.ts          # Add rAF/ResizeObserver/matchMedia stubs; BackgroundScene test
src/
└── styles.scss                     # body { background-color: transparent }
docs/
└── development.md                  # Mark Phase 5 tasks complete; add Built summary
```

---

## Task 1: Scene Entity Types and Factory Functions

**Files:**
- Create: `src/app/features/home/background-scene/scene-entities.spec.ts`
- Create: `src/app/features/home/background-scene/scene-entities.ts`

- [ ] **Step 1: Write failing tests for all factory functions**

Create `src/app/features/home/background-scene/scene-entities.spec.ts`:

```typescript
import {
  createStars,
  createMountainLayers,
  createUFO,
  createRocket,
  createParticles,
  defaultConfig,
} from './scene-entities';

describe('defaultConfig', () => {
  it('returns fewer stars and particles when reducedComplexity is true', () => {
    const full = defaultConfig(false);
    const reduced = defaultConfig(true);
    expect(reduced.starCount).toBeLessThan(full.starCount);
    expect(reduced.particleCount).toBeLessThan(full.particleCount);
    expect(reduced.reducedComplexity).toBe(true);
  });
});

describe('createStars', () => {
  it('returns exactly the requested count', () => {
    expect(createStars(10, 800, 600)).toHaveLength(10);
  });

  it('places every star within canvas bounds', () => {
    for (const star of createStars(50, 800, 600)) {
      expect(star.x).toBeGreaterThanOrEqual(0);
      expect(star.x).toBeLessThanOrEqual(800);
      expect(star.y).toBeGreaterThanOrEqual(0);
      expect(star.y).toBeLessThanOrEqual(600);
    }
  });

  it('assigns each star a radius between 0.5 and 2', () => {
    for (const star of createStars(30, 100, 100)) {
      expect(star.radius).toBeGreaterThanOrEqual(0.5);
      expect(star.radius).toBeLessThanOrEqual(2);
    }
  });

  it('assigns each star an initial opacity between 0.15 and 0.40', () => {
    for (const star of createStars(30, 100, 100)) {
      expect(star.opacity).toBeGreaterThanOrEqual(0.15);
      expect(star.opacity).toBeLessThanOrEqual(0.40);
    }
  });

  it('assigns each star a parallaxFactor between 0.01 and 0.04', () => {
    for (const star of createStars(30, 100, 100)) {
      expect(star.parallaxFactor).toBeGreaterThanOrEqual(0.01);
      expect(star.parallaxFactor).toBeLessThanOrEqual(0.04);
    }
  });
});

describe('createMountainLayers', () => {
  it('returns exactly 2 layers', () => {
    expect(createMountainLayers()).toHaveLength(2);
  });

  it('back layer has a smaller parallaxFactor than the front layer', () => {
    const [back, front] = createMountainLayers();
    expect(back.parallaxFactor).toBeLessThan(front.parallaxFactor);
  });

  it('each layer starts at the left edge and ends at the right edge at the bottom', () => {
    for (const layer of createMountainLayers()) {
      const first = layer.vertices.at(0)!;
      const last = layer.vertices.at(-1)!;
      expect(first.nx).toBe(0);
      expect(first.ny).toBe(1);
      expect(last.nx).toBe(1);
      expect(last.ny).toBe(1);
    }
  });

  it('each layer has at least 4 vertices (left-edge, peaks, right-edge)', () => {
    for (const layer of createMountainLayers()) {
      expect(layer.vertices.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('interior peak vertices have ny between 0 and 1 exclusive', () => {
    for (const layer of createMountainLayers()) {
      const peaks = layer.vertices.slice(1, -1);
      for (const v of peaks) {
        expect(v.ny).toBeGreaterThan(0);
        expect(v.ny).toBeLessThan(1);
      }
    }
  });
});

describe('createParticles', () => {
  it('returns the requested count', () => {
    expect(createParticles(15, 800, 600)).toHaveLength(15);
  });

  it('all particles drift upward (negative vy)', () => {
    for (const p of createParticles(20, 800, 600)) {
      expect(p.vy).toBeLessThan(0);
    }
  });

  it('places particles within canvas x bounds', () => {
    for (const p of createParticles(20, 800, 600)) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(800);
    }
  });
});

describe('createUFO', () => {
  it('returns a UFO with normalized position in 0..1', () => {
    const ufo = createUFO();
    expect(ufo.nx).toBeGreaterThanOrEqual(0);
    expect(ufo.nx).toBeLessThanOrEqual(1);
    expect(ufo.baseNy).toBeGreaterThanOrEqual(0);
    expect(ufo.baseNy).toBeLessThanOrEqual(1);
  });

  it('returns a UFO with a positive bob amplitude', () => {
    expect(createUFO().bobAmplitude).toBeGreaterThan(0);
  });
});

describe('createRocket', () => {
  it('returns a Rocket with normalized position in 0..1', () => {
    const rocket = createRocket();
    expect(rocket.nx).toBeGreaterThanOrEqual(0);
    expect(rocket.nx).toBeLessThanOrEqual(1);
    expect(rocket.ny).toBeGreaterThanOrEqual(0);
    expect(rocket.ny).toBeLessThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: Multiple import errors — `createStars`, `parallaxFactor`, etc. not found.

- [ ] **Step 3: Implement entity types and factory functions**

Create `src/app/features/home/background-scene/scene-entities.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: All `scene-entities.spec.ts` tests pass. No regressions.

- [ ] **Step 5: Commit**

```bash
git add src/app/features/home/background-scene/scene-entities.ts src/app/features/home/background-scene/scene-entities.spec.ts
git commit -m "feat: add BackgroundScene entity types and factory functions with per-star parallax"
```

---

## Task 2: SceneRenderer — Canvas Drawing Logic

**Files:**
- Create: `src/app/features/home/background-scene/scene-renderer.spec.ts`
- Create: `src/app/features/home/background-scene/scene-renderer.ts`

- [ ] **Step 1: Write failing tests for SceneRenderer**

Create `src/app/features/home/background-scene/scene-renderer.spec.ts`:

```typescript
import { SceneRenderer } from './scene-renderer';
import { defaultConfig } from './scene-entities';

describe('SceneRenderer', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
  });

  it('constructs without error given a valid canvas', () => {
    expect(() => new SceneRenderer(canvas, defaultConfig(false))).not.toThrow();
  });

  it('throws when canvas.getContext("2d") returns null', () => {
    vi.spyOn(canvas, 'getContext').mockReturnValue(null);
    expect(() => new SceneRenderer(canvas, defaultConfig(false))).toThrow(
      'Could not get 2D context',
    );
  });

  describe('after construction', () => {
    let renderer: SceneRenderer;

    beforeEach(() => {
      renderer = new SceneRenderer(canvas, defaultConfig(false));
    });

    afterEach(() => renderer.destroy());

    it('init() does not throw', () => {
      expect(() => renderer.init(800, 600)).not.toThrow();
    });

    it('drawFrame() does not throw after init() — hero visible (scrollY < heroHeight)', () => {
      renderer.init(800, 600);
      expect(() => renderer.drawFrame(0, 0, 900)).not.toThrow();
      expect(() => renderer.drawFrame(16, 100, 900)).not.toThrow();
    });

    it('drawFrame() does not throw when hero is not visible (scrollY >= heroHeight)', () => {
      renderer.init(800, 600);
      // scrollY=1000, heroHeight=900 — mountains/UFO/rocket should be skipped
      expect(() => renderer.drawFrame(16, 1000, 900)).not.toThrow();
      expect(() => renderer.drawFrame(32, 2000, 900)).not.toThrow();
    });

    it('resize() re-seeds entities by calling init() with the new CSS dimensions', () => {
      renderer.init(800, 600);
      const initSpy = vi.spyOn(renderer, 'init');
      renderer.resize(1600, 900);
      expect(initSpy).toHaveBeenCalledWith(1600, 900);
      // Smoke test: drawFrame still works after resize
      expect(() => renderer.drawFrame(16, 0, 900)).not.toThrow();
    });

    it('destroy() does not throw', () => {
      renderer.init(800, 600);
      expect(() => renderer.destroy()).not.toThrow();
    });

    it('drawFrame() is a no-op after destroy() — does not throw', () => {
      renderer.init(800, 600);
      renderer.destroy();
      expect(() => renderer.drawFrame(32, 0, 900)).not.toThrow();
    });
  });

  describe('with reducedComplexity config', () => {
    it('init() does not throw', () => {
      const r = new SceneRenderer(canvas, defaultConfig(true));
      expect(() => r.init(800, 600)).not.toThrow();
      r.destroy();
    });

    it('drawFrame() does not throw after init()', () => {
      const r = new SceneRenderer(canvas, defaultConfig(true));
      r.init(800, 600);
      expect(() => r.drawFrame(16, 0, 900)).not.toThrow();
      r.destroy();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: `SceneRenderer` not found.

- [ ] **Step 3: Implement SceneRenderer**

Create `src/app/features/home/background-scene/scene-renderer.ts`:

```typescript
import {
  Star,
  MountainLayer,
  UFO,
  Rocket,
  SceneParticle,
  SceneConfig,
  createStars,
  createMountainLayers,
  createUFO,
  createRocket,
  createParticles,
} from './scene-entities';

export class SceneRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly config: SceneConfig;

  private cssWidth = 0;
  private cssHeight = 0;
  private stars: Star[] = [];
  private mountains: MountainLayer[] = [];
  private ufo: UFO | null = null;
  private rocket: Rocket | null = null;
  private particles: SceneParticle[] = [];
  private lastTimestamp = 0;
  private destroyed = false;

  constructor(canvas: HTMLCanvasElement, config: SceneConfig) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context from canvas element');
    this.ctx = ctx;
    this.config = config;
  }

  /**
   * Seed all scene entities for the given CSS dimensions.
   * Called directly and also internally by resize().
   */
  init(cssWidth: number, cssHeight: number): void {
    this.cssWidth = cssWidth;
    this.cssHeight = cssHeight;
    this.stars = createStars(this.config.starCount, cssWidth, cssHeight);
    this.mountains = createMountainLayers();
    this.particles = createParticles(this.config.particleCount, cssWidth, cssHeight);
    if (!this.config.reducedComplexity) {
      this.ufo = createUFO();
      this.rocket = createRocket();
    } else {
      this.ufo = null;
      this.rocket = null;
    }
    this.lastTimestamp = 0;
  }

  /**
   * Set canvas physical dimensions (accounting for DPR) and re-seed all entities.
   * Setting canvas.width/height resets context state — re-apply DPR scale after.
   */
  resize(cssWidth: number, cssHeight: number): void {
    const dpr = window.devicePixelRatio || 1;
    const canvas = this.ctx.canvas;
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.init(cssWidth, cssHeight);
  }

  /**
   * Draw one animation frame.
   * @param timestamp  — rAF timestamp in ms
   * @param scrollY    — window.scrollY in CSS px
   * @param heroHeight — offsetHeight of the #home section; gates hero-only elements
   */
  drawFrame(timestamp: number, scrollY: number, heroHeight: number): void {
    if (this.destroyed || this.cssWidth === 0) return;

    const deltaTime = this.lastTimestamp === 0 ? 16 : timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    this.ctx.clearRect(0, 0, this.cssWidth, this.cssHeight);

    // Stars and particles render on every section
    this.drawStars(timestamp, scrollY);
    this.drawParticles(deltaTime);

    // Hero-specific elements only while the hero section is in view
    const heroVisible = scrollY < heroHeight;
    if (heroVisible) {
      this.drawMountains(scrollY);
      if (!this.config.reducedComplexity) {
        if (this.ufo) this.drawUFO(deltaTime);
        if (this.rocket) this.drawRocket(deltaTime);
      }
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.stars = [];
    this.mountains = [];
    this.particles = [];
    this.ufo = null;
    this.rocket = null;
  }

  // ─── Private Draw Methods ──────────────────────────────────────────────────

  private drawStars(timestamp: number, scrollY: number): void {
    for (const star of this.stars) {
      // Apply per-star parallax — deeper stars (smaller factor) drift less
      const drawnY = star.y - scrollY * star.parallaxFactor;
      // Skip stars that have drifted entirely off-screen
      if (drawnY < -star.radius || drawnY > this.cssHeight + star.radius) continue;

      const twinkle = 0.4 + 0.6 * Math.sin(star.twinklePhase + timestamp * star.twinkleSpeed);
      this.ctx.beginPath();
      this.ctx.arc(star.x, drawnY, star.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(229, 231, 235, ${(twinkle * star.opacity).toFixed(3)})`;
      this.ctx.fill();
    }
  }

  private drawMountains(scrollY: number): void {
    for (const layer of this.mountains) {
      const offsetY = scrollY * layer.parallaxFactor;
      const w = this.cssWidth;
      const h = this.cssHeight;

      this.ctx.beginPath();
      const first = layer.vertices[0];
      this.ctx.moveTo(first.nx * w, first.ny * h + offsetY);
      for (let i = 1; i < layer.vertices.length; i++) {
        const v = layer.vertices[i];
        this.ctx.lineTo(v.nx * w, v.ny * h + offsetY);
      }
      this.ctx.closePath();

      this.ctx.strokeStyle = layer.strokeColor;
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
      this.ctx.fillStyle = layer.fillColor;
      this.ctx.fill();
    }
  }

  private drawParticles(deltaTime: number): void {
    for (const p of this.particles) {
      p.y += p.vy * deltaTime;
      if (p.y < -2) {
        p.y = this.cssHeight + 2;
        p.x = Math.random() * this.cssWidth;
      }
      this.ctx.fillStyle = `rgba(139, 92, 246, ${p.opacity.toFixed(3)})`;
      this.ctx.fillRect(p.x, p.y, p.size, p.size);
    }
  }

  private drawUFO(deltaTime: number): void {
    const ufo = this.ufo!;
    ufo.bobPhase += ufo.bobSpeed * deltaTime;

    const x = ufo.nx * this.cssWidth;
    const y = ufo.baseNy * this.cssHeight + Math.sin(ufo.bobPhase) * ufo.bobAmplitude;

    // Saucer body
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, 28, 10, 0, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(34, 211, 238, 0.7)';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();
    this.ctx.fillStyle = 'rgba(34, 211, 238, 0.08)';
    this.ctx.fill();

    // Dome
    this.ctx.beginPath();
    this.ctx.ellipse(x, y - 4, 14, 10, 0, Math.PI, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(34, 211, 238, 0.5)';
    this.ctx.stroke();
    this.ctx.fillStyle = 'rgba(34, 211, 238, 0.06)';
    this.ctx.fill();

    // Tractor beam
    const beam = this.ctx.createLinearGradient(x, y + 10, x, y + 60);
    beam.addColorStop(0, 'rgba(34, 211, 238, 0.1)');
    beam.addColorStop(1, 'rgba(34, 211, 238, 0)');
    this.ctx.beginPath();
    this.ctx.moveTo(x - 12, y + 10);
    this.ctx.lineTo(x + 12, y + 10);
    this.ctx.lineTo(x + 20, y + 60);
    this.ctx.lineTo(x - 20, y + 60);
    this.ctx.closePath();
    this.ctx.fillStyle = beam;
    this.ctx.fill();
  }

  private drawRocket(deltaTime: number): void {
    const rocket = this.rocket!;
    rocket.flamePhase += rocket.flameSpeed * deltaTime;

    const x = rocket.nx * this.cssWidth;
    const y = rocket.ny * this.cssHeight;
    const flicker = 0.7 + 0.3 * Math.sin(rocket.flamePhase);

    this.ctx.save();
    this.ctx.translate(x, y);

    // Nose cone
    this.ctx.beginPath();
    this.ctx.moveTo(0, -22);
    this.ctx.lineTo(-7, 0);
    this.ctx.lineTo(7, 0);
    this.ctx.closePath();
    this.ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();
    this.ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
    this.ctx.fill();

    // Fuselage
    this.ctx.strokeRect(-7, 0, 14, 14);

    // Left fin
    this.ctx.beginPath();
    this.ctx.moveTo(-7, 8);
    this.ctx.lineTo(-13, 18);
    this.ctx.lineTo(-7, 14);
    this.ctx.closePath();
    this.ctx.stroke();

    // Right fin
    this.ctx.beginPath();
    this.ctx.moveTo(7, 8);
    this.ctx.lineTo(13, 18);
    this.ctx.lineTo(7, 14);
    this.ctx.closePath();
    this.ctx.stroke();

    // Animated flame
    const flameHeight = 16 * flicker;
    const flame = this.ctx.createLinearGradient(0, 14, 0, 14 + flameHeight);
    flame.addColorStop(0, `rgba(245, 158, 11, ${(0.8 * flicker).toFixed(2)})`);
    flame.addColorStop(0.5, `rgba(236, 72, 153, ${(0.5 * flicker).toFixed(2)})`);
    flame.addColorStop(1, 'rgba(139, 92, 246, 0)');
    this.ctx.beginPath();
    this.ctx.moveTo(-5, 14);
    this.ctx.lineTo(5, 14);
    this.ctx.lineTo(0, 14 + flameHeight);
    this.ctx.closePath();
    this.ctx.fillStyle = flame;
    this.ctx.fill();

    this.ctx.restore();
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: All `scene-renderer.spec.ts` tests pass. Entity tests still pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/features/home/background-scene/scene-renderer.ts src/app/features/home/background-scene/scene-renderer.spec.ts
git commit -m "feat: add SceneRenderer with global star parallax and hero-gated scene elements"
```

---

## Task 3: BackgroundSceneComponent Angular Shell

**Files:**
- Create: `src/app/features/home/background-scene/background-scene.component.spec.ts`
- Create: `src/app/features/home/background-scene/background-scene.component.html`
- Create: `src/app/features/home/background-scene/background-scene.component.scss`
- Create: `src/app/features/home/background-scene/background-scene.component.ts`

- [ ] **Step 1: Write failing component tests**

Create `src/app/features/home/background-scene/background-scene.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { BackgroundSceneComponent } from './background-scene.component';

describe('BackgroundSceneComponent', () => {
  function stubBrowserAPIs(): void {
    vi.stubGlobal(
      'ResizeObserver',
      vi.fn(() => ({ observe: vi.fn(), disconnect: vi.fn() })),
    );
    vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
  }

  afterEach(() => vi.restoreAllMocks());

  describe('browser environment', () => {
    let fixture: ComponentFixture<BackgroundSceneComponent>;

    beforeEach(async () => {
      stubBrowserAPIs();
      await TestBed.configureTestingModule({
        imports: [BackgroundSceneComponent],
      }).compileComponents();
      fixture = TestBed.createComponent(BackgroundSceneComponent);
      fixture.detectChanges();
    });

    it('creates without error', () => {
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('renders a canvas element', () => {
      expect(fixture.nativeElement.querySelector('canvas')).toBeTruthy();
    });

    it('canvas has aria-hidden="true"', () => {
      const canvas = fixture.nativeElement.querySelector('canvas');
      expect(canvas?.getAttribute('aria-hidden')).toBe('true');
    });

    it('calls cancelAnimationFrame on destroy', () => {
      fixture.destroy();
      expect(cancelAnimationFrame).toHaveBeenCalled();
    });

    it('disconnects the ResizeObserver on destroy', () => {
      const disconnectSpy = vi.fn();
      vi.stubGlobal(
        'ResizeObserver',
        vi.fn(() => ({ observe: vi.fn(), disconnect: disconnectSpy })),
      );
      const cleanupFixture = TestBed.createComponent(BackgroundSceneComponent);
      cleanupFixture.detectChanges();
      cleanupFixture.destroy();
      expect(disconnectSpy).toHaveBeenCalled();
    });
  });

  describe('SSR (server) environment', () => {
    it('creates without error when PLATFORM_ID is server', async () => {
      await TestBed.configureTestingModule({
        imports: [BackgroundSceneComponent],
        providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
      }).compileComponents();
      const fixture = TestBed.createComponent(BackgroundSceneComponent);
      expect(() => fixture.detectChanges()).not.toThrow();
    });
  });

  describe('mobile (reduced complexity) environment', () => {
    let fixture: ComponentFixture<BackgroundSceneComponent>;
    let rendererResizeSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(async () => {
      // All stubs must be in place before configureTestingModule —
      // ngAfterViewInit fires during detectChanges() which runs after compile
      vi.stubGlobal(
        'ResizeObserver',
        vi.fn(() => ({ observe: vi.fn(), disconnect: vi.fn() })),
      );
      vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(1));
      vi.stubGlobal('cancelAnimationFrame', vi.fn());
      // matchMedia returns true → reducedComplexity: true path
      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));

      const { SceneRenderer } = await import('./scene-renderer');
      rendererResizeSpy = vi
        .spyOn(SceneRenderer.prototype, 'resize')
        .mockImplementation(() => {});

      await TestBed.configureTestingModule({
        imports: [BackgroundSceneComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(BackgroundSceneComponent);
      fixture.detectChanges();
    });

    afterEach(() => vi.restoreAllMocks());

    it('creates without error in mobile mode', () => {
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('renderer.resize() is called — canvas initializes in mobile mode', () => {
      expect(rendererResizeSpy).toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: `BackgroundSceneComponent` not found.

- [ ] **Step 3: Create the component template**

Create `src/app/features/home/background-scene/background-scene.component.html`:

```html
<canvas #canvas aria-hidden="true"></canvas>
```

- [ ] **Step 4: Create the component SCSS**

Create `src/app/features/home/background-scene/background-scene.component.scss`:

```scss
:host {
  display: block;
  position: fixed;     // Covers the full viewport, behind all page content
  inset: 0;
  pointer-events: none;
  z-index: -1;         // Paints before non-positioned body/sections (see Q2 in plan)
  overflow: hidden;

  // CRT scanline overlay — CSS only; covers full viewport via fixed host
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.025) 2px,
      rgba(0, 0, 0, 0.025) 4px
    );
    pointer-events: none;
    z-index: 1;
  }
}

canvas {
  // CSS size fills the fixed host. Pixel dimensions set by SceneRenderer.resize()
  // via window.innerWidth/Height to account for devicePixelRatio.
  width: 100%;
  height: 100%;
}
```

- [ ] **Step 5: Create the component TypeScript**

Create `src/app/features/home/background-scene/background-scene.component.ts`:

```typescript
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  inject,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SceneRenderer } from './scene-renderer';
import { defaultConfig } from './scene-entities';

@Component({
  selector: 'app-background-scene',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './background-scene.component.html',
  styleUrl: './background-scene.component.scss',
})
export class BackgroundSceneComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  private renderer: SceneRenderer | null = null;
  private rafId = 0;
  private resizeObserver: ResizeObserver | null = null;
  private resizeTimeout = 0;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const canvas = this.canvasRef().nativeElement;
    const isReduced = window.matchMedia('(max-width: 767px)').matches;

    this.renderer = new SceneRenderer(canvas, defaultConfig(isReduced));
    // Canvas is position: fixed — size from viewport, not container
    this.renderer.resize(window.innerWidth, window.innerHeight);

    // Observe <html> element as a viewport-resize proxy for fixed elements
    this.resizeObserver = new ResizeObserver(() => this.scheduleResize());
    this.resizeObserver.observe(this.document.documentElement);

    this.startLoop();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.rafId);
    clearTimeout(this.resizeTimeout);
    this.resizeObserver?.disconnect();
    this.renderer?.destroy();
  }

  private startLoop(): void {
    const loop = (timestamp: number): void => {
      const heroHeight = this.getHeroHeight();
      this.renderer?.drawFrame(timestamp, window.scrollY, heroHeight);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  /**
   * Returns the pixel height of the #home section — used to gate hero-only
   * canvas elements. Falls back to window.innerHeight when element isn't found.
   */
  private getHeroHeight(): number {
    return (
      (this.document.getElementById('home') as HTMLElement | null)?.offsetHeight ??
      window.innerHeight
    );
  }

  private scheduleResize(): void {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = window.setTimeout(() => {
      if (this.renderer) {
        this.renderer.resize(window.innerWidth, window.innerHeight);
      }
    }, 100);
  }
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npm test
```

Expected: All `background-scene.component.spec.ts` tests pass. All prior tests still pass.

- [ ] **Step 7: Commit**

```bash
git add src/app/features/home/background-scene/
git commit -m "feat: add BackgroundSceneComponent — fixed viewport canvas with SSR guard and hero-gated rendering"
```

---

## Task 4: Global Background Transparency

The canvas is `z-index: -1`. For it to be visible through the page, `body`'s solid background must be made transparent. `html { background-color: var(--bg-primary) }` (already in `styles.scss`) propagates to the viewport canvas background and provides the dark base below the canvas. Section and page backgrounds must also be transparent.

> **Note:** No automated tests apply to pure CSS background-color changes — correctness is verified visually in Step 3. Proceed directly to implementation.

**Files:**
- Modify: `src/styles.scss`
- Modify: `src/app/features/home/home.component.scss`

- [ ] **Step 1: Set body to transparent in styles.scss**

In `src/styles.scss`, change:

```scss
body {
  background-color: var(--bg-primary);
}
```

to:

```scss
body {
  // transparent — html { background-color } propagates to the viewport canvas
  // and provides the dark base. body must be transparent so the fixed
  // BackgroundSceneComponent canvas (z-index: -1) shows through all sections.
  background-color: transparent;
}
```

- [ ] **Step 2: Make main-page background transparent in home.component.scss**

In `src/app/features/home/home.component.scss`, replace the entire `.main-page` block with:

```scss
.main-page {
  // Transparent — fixed BackgroundSceneComponent canvas shows through all sections.
  // Dark base color comes from html { background-color: var(--bg-primary) } in styles.scss.
  background-color: transparent;

  &__section {
    scroll-margin-top: var(--navbar-height);
    min-height: 100svh;
    // No position: relative needed — BackgroundSceneComponent is position: fixed,
    // not position: absolute. No z-index layering needed — canvas is z-index: -1.
  }
}
```

- [ ] **Step 3: Verify visually**

```bash
npm start
```

Open `http://localhost:4200`. Confirm:
- Dark background is still correct (no white flash, no light background)
- `html` background color provides the dark base color correctly

- [ ] **Step 4: Commit**

```bash
git add src/styles.scss src/app/features/home/home.component.scss
git commit -m "style: make body and main-page transparent so fixed BackgroundScene canvas shows through"
```

---

## Task 5: Integrate BackgroundSceneComponent into HomeComponent

**Files:**
- Modify: `src/app/features/home/home.component.ts`
- Modify: `src/app/features/home/home.component.html`
- Modify: `src/app/features/home/home.component.spec.ts`

- [ ] **Step 1: Add failing test for BackgroundSceneComponent presence**

In `src/app/features/home/home.component.spec.ts`:

1. Add browser API stubs inside the existing `beforeEach`, directly after the `IntersectionObserver` stub and **before** `await TestBed.configureTestingModule(...)`. This ordering is required — stubs must exist before `detectChanges()` triggers `ngAfterViewInit`, and `TestBed` starts compiling components during `configureTestingModule`:

```typescript
// ← paste directly after this existing stub:
//   vi.stubGlobal('IntersectionObserver', vi.fn(function () { ... }));

vi.stubGlobal(
  'ResizeObserver',
  vi.fn(() => ({ observe: vi.fn(), disconnect: vi.fn() })),
);
vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(1));
vi.stubGlobal('cancelAnimationFrame', vi.fn());
vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));

// ← await TestBed.configureTestingModule({ ... }) must come AFTER all stubs above
```

2. Add a new test inside the `describe` block:

```typescript
it('should render the background scene component inside the #home section', () => {
  const homeSection = compiled.querySelector('#home');
  expect(homeSection?.querySelector('app-background-scene')).toBeTruthy();
});
```

- [ ] **Step 2: Run test to verify the new assertion fails**

```bash
npm test
```

Expected: The new `app-background-scene` assertion fails (returns `null` — element not yet in template); all other tests pass because the browser-API stubs from Step 1 are already in place.

- [ ] **Step 3: Import BackgroundSceneComponent in HomeComponent**

In `src/app/features/home/home.component.ts`, add the import:

```typescript
import { BackgroundSceneComponent } from './background-scene/background-scene.component';
```

Add `BackgroundSceneComponent` to the `imports` array (first, before `HeroComponent`):

```typescript
imports: [
  BackgroundSceneComponent,
  HeroComponent,
  FeatureCardsComponent,
  ScrollRevealDirective,
  ProjectsSectionComponent,
  AboutSectionComponent,
  SkillsSectionComponent,
  ContactSectionComponent,
],
```

- [ ] **Step 4: Add `<app-background-scene>` to the home section template**

In `src/app/features/home/home.component.html`, update the `#home` section:

```html
<section id="home" class="main-page__section" aria-label="Home">
  <app-background-scene />
  <app-hero [bio]="bio" />
  <app-feature-cards appScrollReveal />
</section>
```

(All other sections unchanged. The canvas is `position: fixed` and escapes normal flow — placing it here is semantic ownership only.)

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test
```

Expected: All tests pass including the new presence test.

- [ ] **Step 6: Verify visually**

```bash
npm start
```

Open `http://localhost:4200`. Confirm:
- Animated star field visible behind hero content
- Stars remain visible as you scroll through Projects, About, Skills, Contact
- Stars drift very slowly relative to content (subtle parallax depth)
- Hero-only elements (mountains, UFO, rocket) visible in hero, disappear after scrolling past
- Hero text, cards, and all content remain fully legible above the canvas
- Scanlines visible as a very faint texture throughout
- Mobile (DevTools → 375px): UFO and Rocket absent; fewer stars; stars still visible in all sections

- [ ] **Step 7: Commit**

```bash
git add src/app/features/home/home.component.ts src/app/features/home/home.component.html src/app/features/home/home.component.spec.ts
git commit -m "feat: integrate BackgroundSceneComponent into HomeComponent"
```

---

## Task 6: Update Living Documentation

**Files:**
- Modify: `docs/development.md`

- [ ] **Step 1: Mark all Phase 5 tasks complete and add Built summary**

In `docs/development.md`, inside the `## Phase 5: Home Page — Background Scene (Canvas)` section, change all `- [ ]` task items to `- [x]`:

```markdown
- [x] `BackgroundSceneComponent` — full-viewport `<canvas>` element positioned behind hero content
- [x] `isPlatformBrowser` guard — skip canvas init during SSR/prerender
- [x] **Star field:** sparse pixel-style stars, subtle twinkle animation, random placement
- [x] **Cyber mountains:** low-poly wireframe silhouettes along the horizon, faint neon outlines (blue/purple)
- [x] **Parallax:** mountains and elements shift based on scroll position
- [x] **UFO sprite:** placeholder graphic, slow floating bob animation, soft glow beam downward
- [x] **Rocket sprite:** placeholder graphic, launch animation with stylized smoke particles
- [x] **Floating particles:** minimal pixel particles drifting (very subtle)
- [x] **Faint scanline/grid overlay:** CSS pseudo-element on the page background (very low opacity)
- [x] Performance: use `requestAnimationFrame`, reduce on mobile
- [ ] Performance: throttle on hidden tab (deferred to Phase 9 — canvas: skip rendering when `document.hidden`)
```

Then add a **Built** line after the tasks:

```markdown
**Built:** `SceneRenderer` (plain TS — stars with per-star parallax, mountains, UFO, rocket, particles; DPR-aware `resize()`; `heroHeight`-gated hero elements), `BackgroundSceneComponent` (`position: fixed; z-index: -1` — covers full viewport; SSR guard; rAF loop; `document.documentElement` ResizeObserver; `window.scrollY` + `#home` offsetHeight read each frame; mobile `matchMedia` detection). Stars render site-wide with subtle parallax (0.01–0.04 factor). Hero elements (mountains/UFO/rocket) render only when `scrollY < heroHeight`. `body { background-color: transparent }` in `styles.scss` lets canvas show through all sections. Scanline overlay as CSS `::after` pseudo-element. Entity factory functions in `scene-entities.ts` (pure TS, fully unit-tested). Note: move to `LayoutComponent` in Phase 6 when `/projects/:slug` route is added.
```

- [ ] **Step 2: Commit**

```bash
git add docs/development.md
git commit -m "docs: mark Phase 5 background scene complete with Built summary"
```

---

## Visual Acceptance Criteria

After all tasks are complete, verify the following manually at `http://localhost:4200`:

| Criterion | How to check |
|-----------|-------------|
| Stars visible throughout site | Scroll to Projects, About, Skills, Contact — stars still visible in background |
| Star parallax | Stars drift very slightly relative to scrolling content (different speeds = depth) |
| Star twinkle | Individual stars fade in and out at varying speeds |
| Hero mountains | Low-poly blue/purple wireframe silhouettes in lower hero area |
| Mountain parallax | Scroll slowly in hero — mountains shift slower than page content |
| UFO bob | UFO floats gently up and down in upper-right of hero |
| UFO beam | Faint cyan trapezoid below the UFO body |
| Rocket flame | Gold→pink→purple gradient flickers at rocket base |
| Particles | Tiny purple 1px squares drift slowly upward — visible in all sections |
| Hero elements disappear | Scroll past hero — mountains/UFO/rocket gone, only stars + particles remain |
| Scanlines | Very faint horizontal texture throughout the full page |
| Dark background | Page background remains dark (no white flash, no light areas) |
| Content legibility | All text, cards, nav fully readable over the star field |
| Mobile (DevTools → 375px) | UFO and Rocket absent; fewer stars; canvas still renders |
| SSR/prerender | `npm run build` completes without errors |

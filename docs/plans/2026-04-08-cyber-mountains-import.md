# Cyber-Mountains Import Plan

**Date:** 2026-04-08

**Goal:** Replace the existing flat-polygon mountain silhouettes in `BackgroundSceneComponent` with a new 3D perspective-projected FBM terrain renderer tuned in a separate project. The existing atmosphere, horizon glow, stars, particles, UFO, and rocket are preserved. The import introduces a two-canvas layered architecture.

**Source:** `mountains-import/` (5 files in project root — reference only, deleted after integration)

---

## Background

The current `SceneRenderer` draws mountains as three flat polygon silhouette layers with scroll parallax. The imported `MountainRenderer` uses 3D perspective projection over an FBM noise grid — a full valley/mountain landscape with depth fog, per-face color grading, glow wireframe, and a fog overlay gradient.

`MountainRenderer.draw()` is monolithic: it clears the canvas, fills a dark background, draws a radial horizon glow, draws the terrain, draws a fog overlay, and draws scanlines. It cannot be spliced directly into the existing single-canvas `SceneRenderer` without erasing the atmosphere and stars drawn before it.

**Architecture decision:** Two canvases inside the same fixed `BackgroundSceneComponent` host.

- **Mountain canvas** (bottom, DOM-order first): `MountainRenderer.draw()` owns the full layer — dark background, radial horizon glow, 3D terrain, depth fog, in-canvas scanlines.
- **Scene canvas** (top, DOM-order second): `SceneRenderer.drawFrame()` draws on a transparent canvas — `drawAtmosphere()`, `drawHorizonGlow()`, stars, particles, UFO, rocket.
- **CSS `::after` scanlines** on `:host` cover both canvases as a viewport-wide CRT overlay. Combined opacity with mountain in-canvas scanlines is ~0.055 — imperceptible.

---

## Files Changed

| File | Action |
|---|---|
| `background-scene/mountain.config.ts` | New — copy verbatim |
| `background-scene/mountain-renderer.ts` | New — copy verbatim |
| `background-scene.component.html` | Edit — add `#mountainCanvas` element |
| `background-scene.component.scss` | Edit — two-canvas absolute positioning |
| `background-scene.component.ts` | Edit — add mountain canvas ref, `MountainRenderer` init/resize/loop |
| `scene-renderer.ts` | Edit — remove `drawMountains()` only; keep `drawAtmosphere()`, `drawHorizonGlow()` |
| `scene-entities.ts` | Edit — remove `MountainLayer` interface and factory functions |
| `scene-entities.spec.ts` | Edit — remove `createMountainLayers` test block |
| `docs/development.md` | Edit — update Phase 5 Built section |
| `docs/architecture.md` | Edit — update component map note |
| `mountains-import/` | Delete — all 5 files |

---

## Tasks

### Step 1 — Copy renderer and config files

- [ ] Copy `mountains-import/mountain.config.ts` → `src/app/features/home/background-scene/mountain.config.ts` verbatim
- [ ] Copy `mountains-import/mountain-renderer.ts` → `src/app/features/home/background-scene/mountain-renderer.ts` verbatim

No modifications needed — both are pure TypeScript with zero Angular dependencies. The `MountainComponent` wrapper (`mountain.component.ts`, `.html`, `.scss`) is reference-only and is not copied.

---

### Step 2 — Update `background-scene.component.html`

- [ ] Add `<canvas #mountainCanvas class="mountain-canvas"></canvas>` as the **first** element, before the existing `<canvas #canvas>`

DOM order determines stacking — mountain canvas first = renders below the scene canvas. No `z-index` needed.

```html
<canvas #mountainCanvas class="mountain-canvas"></canvas>
<canvas #canvas></canvas>
```

---

### Step 3 — Update `background-scene.component.scss`

- [ ] Add `position: absolute; inset: 0` to both canvases so they overlap within the fixed host (without this they stack vertically in block flow, pushing the scene canvas off-screen)
- [ ] Keep the `::after` CRT scanline pseudo-element unchanged — it covers both canvases as a viewport-wide overlay

```scss
:host {
  display: block;
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  overflow: hidden;

  // CRT scanline overlay — CSS only; covers both canvases via fixed host
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

canvas,
.mountain-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
```

---

### Step 4 — Update `background-scene.component.ts`

- [ ] Add `viewChild.required<ElementRef<HTMLCanvasElement>>('mountainCanvas')` alongside the existing canvas ref
- [ ] Add a private `mountainRenderer: MountainRenderer | null = null` field
- [ ] In `ngAfterViewInit`, inside the `isPlatformBrowser` guard:
  - Instantiate `new MountainRenderer(mountainCanvasRef.nativeElement)`
  - Call `mountainRenderer.setConfig(DEFAULT_MOUNTAIN_CONFIG)` to build the initial terrain grid
  - Call `mountainRenderer.resize(window.innerWidth, window.innerHeight)` **before** `startLoop()` — `MountainRenderer.draw()` early-exits when `W === 0`, so this must happen first
- [ ] In `scheduleResize()`, call `mountainRenderer.resize(window.innerWidth, window.innerHeight)` alongside the existing `renderer.resize()`
- [ ] In `startLoop()` rAF loop, before `sceneRenderer.drawFrame()`:
  - Compute `camY = window.scrollY / 1200` (matching `MountainComponent`'s default `scrollRange`)
  - Call `mountainRenderer.setConfig({ ...DEFAULT_MOUNTAIN_CONFIG, camY })` — `setConfig` detects that only `camY` changed and skips grid rebuild; the spread is cheap
  - Call `mountainRenderer.draw()`
- [ ] In `ngOnDestroy`, no additional cleanup needed — `MountainRenderer` holds no rAF, observers, or external listeners

**Convention notes:**
- Use `inject()` function (not constructor injection) — no `NgZone` needed since `ChangeDetectionStrategy.OnPush` with no template bindings means the rAF loop doesn't trigger change detection
- Use `viewChild.required()` signal API consistent with the existing canvas ref pattern
- Both renderers init under the same `isPlatformBrowser` guard — SSR-safe by construction

**Known limitation — DPR:** `MountainRenderer.resize()` sets canvas pixel dimensions equal to CSS dimensions (no `devicePixelRatio` scaling). On high-DPR displays the terrain renders at lower resolution than stars/UFO/rocket. Acceptable for a fog-heavy background; defer DPR fix to Phase 9 performance work.

---

### Verify A — Mountain canvas renders (after Steps 1–4)

> **Prerequisite:** `npm start` running at `http://localhost:4200`

- [ ] `browser_navigate` → `http://localhost:4200`
- [ ] `browser_take_screenshot` — capture the initial state

**What to confirm:**
- 3D terrain is visible in the lower half of the viewport — wireframe grid lines, depth fog, dark valley shape
- Dark background fills the full viewport (mountain canvas providing it)
- Hero content (text, CTA) renders above the canvas and is readable
- Stars and atmosphere haze are visible over the mountains (scene canvas layer)

**Failure indicators to diagnose:**
- Entirely blank/black — `mountainRenderer.resize()` not called before `startLoop()` so `W === 0` causes early exit; or `setConfig()` not called so grid was never built
- Two dark rectangles stacked vertically — `position: absolute; inset: 0` missing from `.mountain-canvas` in SCSS
- Mountains cover hero text — `z-index` issue; mountain canvas is on top of content instead of behind it
- Old flat silhouette mountains still visible — `mountainRenderer.draw()` call missing from the rAF loop

---

### Step 5 — Update `scene-renderer.ts`

- [ ] Remove `private drawMountains(scrollY: number)` method entirely
- [ ] Remove the `drawMountains(scrollY)` call from `drawFrame()`
- [ ] Remove `drawAtmosphere()` call from `drawFrame()` — **no, keep it** (user intent)
- [ ] Remove `drawHorizonGlow()` call from `drawFrame()` — **no, keep it** (user intent)
- [ ] Keep `drawAtmosphere()` and `drawHorizonGlow()` methods unchanged
- [ ] Remove the `private mountains: MountainLayer[] = []` field
- [ ] Remove `this.mountains = createMountainLayers()` from `init()`
- [ ] Remove `MountainLayer` and `createMountainLayers` from the `scene-entities` import line

Updated `drawFrame()` render order:
```
clearRect
→ drawAtmosphere()      (cyan/indigo haze, lower 58% of canvas)
→ drawHorizonGlow()     (linear neon bloom band)
→ drawStars()
→ drawParticles()
→ [hero-gated] drawUFO() / drawRocket()
```

The scene canvas is transparent between drawn elements — the mountain canvas beneath shows through everywhere.

---

### Verify B — Scene layer intact, full layering correct (after Step 5)

- [ ] `browser_take_screenshot` — hot reload should have applied; refresh if needed
- [ ] `browser_snapshot` — inspect accessibility tree to confirm canvas elements have `pointer-events: none` and don't trap interaction

**What to confirm:**
- Stars and particles are visible over the mountains (scene canvas transparent background is working)
- `drawAtmosphere()` haze and `drawHorizonGlow()` band are visible (the cyan/indigo tint in the lower viewport and the neon bloom strip)
- Old flat polygon mountains are gone — no sharp-edged dark silhouettes
- UFO and rocket visible in the hero area

**What to check if stars are missing:**
- Scene canvas may have an opaque background fill — verify `clearRect` is the only background operation in `drawFrame()` after removing `drawMountains()`

- [ ] `browser_evaluate` `window.scrollTo(0, 600)` — scroll partway down
- [ ] `browser_take_screenshot` — capture mid-scroll state

**What to confirm at mid-scroll:**
- Mountain terrain has shifted perspective (camY changed — valley floor visible, or camera panned)
- Stars are still visible and parallaxing
- UFO and rocket have disappeared (scrollY past heroHeight)
- Mountains still cover the full viewport width — no bare edges

- [ ] `browser_evaluate` `window.scrollTo(0, 0)` — scroll back to top

---

### Step 6 — Update `scene-entities.ts`

- [ ] Remove `MountainLayer` interface
- [ ] Remove exported `createMountainLayers()` function
- [ ] Remove internal `generateMountainVertices()` helper function

Keep: `Star`, `UFO`, `Rocket`, `SceneParticle`, `SceneConfig`, all their factory functions, `defaultConfig`.

---

### Step 7 — Update `scene-entities.spec.ts`

- [ ] Remove the full `describe('createMountainLayers', ...)` block (4 tests)
- [ ] Remove `createMountainLayers` from the import line

`scene-renderer.spec.ts` requires no changes — it tests `drawFrame()` as a black box and the method signature is unchanged.

- [ ] Run `npm test` and confirm all tests pass

---

### Verify C — Full visual QA (after Step 7, tests passing)

#### Desktop viewport

- [ ] `browser_navigate` → `http://localhost:4200` (fresh load)
- [ ] `browser_take_screenshot` — full hero at rest, record as baseline

#### Scroll through all sections

- [ ] `browser_evaluate` `window.scrollTo(0, 400)` then `browser_take_screenshot` — early scroll, terrain panning
- [ ] `browser_evaluate` `window.scrollTo(0, 1200)` then `browser_take_screenshot` — scrollRange boundary; camY ≈ 1.0, maximum terrain pan
- [ ] `browser_evaluate` `window.scrollTo(0, 2400)` then `browser_take_screenshot` — deep scroll; stars still rendering, mountains settled, scanline overlay visible
- [ ] `browser_evaluate` `window.scrollTo(0, 0)`

#### Viewport resize

- [ ] `browser_resize` to `375 × 812` (mobile)
- [ ] `browser_take_screenshot` — confirm mountains fill the narrower viewport, no white/blank gaps at edges
- [ ] `browser_resize` to `1440 × 900` (desktop)
- [ ] `browser_take_screenshot` — confirm wide viewport is fully covered

#### Layer integrity check

- [ ] `browser_snapshot` — confirm no canvas element is intercepting pointer events or appearing in the accessibility tree as interactive content

**Final acceptance criteria:**
- 3D terrain visible at all viewport sizes with no bare edges
- Stars, atmosphere, and horizon glow render above mountains
- camY scroll response feels smooth — mountains pan noticeably but not jarringly on a 1200px scroll range
- UFO and rocket appear at top of page, disappear after scrolling past hero
- No console errors (check `browser_console_messages` if anything looks off)

---

### Step 8 — Update docs

- [ ] `docs/development.md` — update Phase 5 Built section:
  - Replace mountain description: "3 flat polygon silhouette layers" → "3D perspective-projected FBM terrain via `MountainRenderer`"
  - Note two-canvas architecture: mountain canvas (bottom) + scene canvas (top)
  - Note `MountainConfig` / `MountainRenderer` added to `background-scene/`
  - Note `camY`-driven scroll parallax replacing `scrollY * parallaxFactor`
  - Mark the mountain throttle-on-hidden-tab task as still deferred (unchanged)
- [ ] `docs/architecture.md` — update `BackgroundSceneComponent` entry in component map to note two-canvas approach

---

### Step 9 — Cleanup

- [ ] Delete `mountains-import/` directory (all 5 files: `mountain.config.ts`, `mountain-renderer.ts`, `mountain.component.ts`, `mountain.component.html`, `mountain.component.scss`)

---

## Post-Integration Tuning Notes

These are not implementation tasks — visual polish to revisit after seeing the result running:

- **Horizon glow color:** `MountainRenderer.draw()` uses `rgba(0,180,150,...)` (teal-green) for its radial horizon glow. The project palette uses `rgba(56,189,248,...)` (Sky cyan). Nudging line 57 of `mountain-renderer.ts` toward cyan will unify the atmospheric palette with the rest of the scene.
- **`scrollRange` tuning:** `1200` matches `MountainComponent`'s default. Adjust to taste based on how fast the camera pans through the valley during scroll.
- **`fogIntensity` tuning:** Default `0.12` is subtle. Can be raised toward `0.3` for a heavier atmospheric depth effect.
- **DPR (Phase 9):** Add `devicePixelRatio` scaling to `MountainRenderer.resize()` and apply `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` — same pattern as `SceneRenderer.resize()`.

# Mountain Renderer Performance — Phased Caching + OffscreenCanvas Worker

**Date:** 2026-04-12
**Branch:** `mountains-refactor`
**Goal:** Eliminate per-frame allocations and string building (Phase 1), split projection math so scroll frames do near-zero arithmetic (Phase 2), then offload the entire mountain rAF loop to an OffscreenCanvas web worker so the main thread does zero mountain rendering work during scroll (Phase 3).

> **July 16, 2026 measured follow-up:** Later row-batching and alternate worker-scheduling changes were reverted after a user-visible scroll regression. The production renderer again uses the original dirty-gated worker rAF loop described here. A real-document scroll harness now measures frame cadence and end-to-end worker timing. Of the follow-up candidates tested independently, only precomposing the static fog blend into `faceColors` was retained; it removes the second per-face fog fill while preserving the original draw order and appearance.

**Execution order:** Phase 1 → Phase 2 → Phase 3. Each phase ships and measures independently.

---

## Current Bottlenecks

All line numbers reference `mountain-renderer.ts` on branch `mountains-refactor`.

| Location | What happens every frame | Cost |
|----------|--------------------------|------|
| `draw()` lines 48–57 | Allocates `pts[r][c] = { x, y, d } \| null` — ~3,087 JS objects per frame (49 rows × 63 cols) | GC pressure, heap churn |
| `draw()` lines 61–62 | Recomputes `fogA` per row — 48 `clamp` calls | Wasteful; only depends on `r` and `fogIntensity` |
| `draw()` line 72 | `faceColor()` called per quad — ~2,976 `rgb(…)` string builds | Template literal + `Math.round` per call |
| `draw()` lines 101–104 | `wireColor()` + inline glow string for H-wires — ~2,976 `rgba(…)` string builds | `.toFixed(2)` and `.toFixed(3)` per call |
| `draw()` lines 115–118 | `wireColor()` + inline glow string for V-wires — ~3,024 `rgba(…)` string builds | Same as above |
| `drawForegroundAtmosphere()` lines 237, 245 | `createLinearGradient` + `createRadialGradient` every frame | Two gradient object constructions per frame |
| `background-scene.component.ts` line 77 | `setConfig({ ...DEFAULT_MOUNTAIN_CONFIG, camY })` on every scroll frame | Object spread + full 10-key config comparison on the hot path |

**Total per frame:** ~9,000 string allocations, ~3,087 object allocations, 2 gradient constructions, ~3,087 per-point divisions in `project()`.

---

## Architecture Overview

### Cache Lifecycle (after all three phases)

```
buildGrid()
  │
  ├── fills: grid[][], rawH[][]
  ├── calls: buildColorCaches()
  │             fills: faceColors[][], wireColorsH[][], wireColorsV[][],
  │                    glowColorsH[][], glowColorsV[][], fogAlphas[],
  │                    lineWidthsH[]
  └── calls: buildProjectionCache()        ← Phase 2
                fills: ptsX[], ptsYBase[], ptsScale[], ptsNull[]

resize(W, H)
  ├── sets: this.W, this.H
  ├── calls: buildGradients()
  │             fills: mistGradient, bloomGradient
  └── calls: buildProjectionCache()        ← Phase 2

setCamY(v)                                 ← Phase 1
  └── sets: config.camY (no rebuild)

draw()
  ├── eyeY = 1.1 − camY × 0.42            ← one scalar per frame
  ├── ptsY[i] = ptsYBase[i] + eyeY × ptsScale[i]   ← Phase 2: 3k multiply-adds
  └── reads from all cached arrays — zero string building, zero object allocation
```

---

## Phase 1 — Static Caches

**Goal:** Eliminate per-frame string building and color/fog cache allocations. `draw()` reads from pre-built arrays. The render algorithm is identical; only the data source changes. Note: `project()` still allocates one transient `{ x, y, d }` object per visible grid point throughout Phase 1 — full projection object elimination happens in Phase 2.

### Step 1.1 — Add `setCamY()` to `MountainRenderer`

**File:** `mountain-renderer.ts`, public API section (alongside `setConfig` and `resize`).

```typescript
setCamY(v: number): void {
  this.config.camY = v;
}
```

`camY` does not affect the grid, color caches, or projection caches — it only feeds into `eyeY` in `project()`. A direct setter avoids the `{ ...DEFAULT_MOUNTAIN_CONFIG, camY }` spread and full 10-key `needsRebuild` comparison that currently runs on every scroll frame.

**Also tighten `setConfig()`:** verify that the `needsRebuild` check only keys on `peakSeparation`, `terrainNoise`, `gridResolution`, and `horizontalWidth` (not `camY`, `zoom`, `tilt`, `verticalStretch`, `fogIntensity`, or `colorGradient`). Add a separate `needsColorRebuild` path for `fogIntensity` and `colorGradient` changes — `wireColor()` reads `this.config.colorGradient` directly for both `heightT` and `sideT`, so cached wire color strings become stale if it changes without a grid rebuild:

```typescript
const needsColorRebuild =
  needsRebuild ||
  !this.config ||
  config.fogIntensity  !== this.config.fogIntensity ||
  config.colorGradient !== this.config.colorGradient;
```

After the `this.config = { ...config }` assignment and optional `buildGrid()` call:
```typescript
if (needsColorRebuild && !needsRebuild) {
  // Grid unchanged but fog/colorGradient changed — rebuild color/fog caches only
  this.buildColorCaches();
}
```

(`buildGrid()` already calls `buildColorCaches()` at its end, so skip when a full rebuild ran.)

---

### Step 1.2 — Pre-allocate flat `ptsX` / `ptsY` typed arrays

**File:** `mountain-renderer.ts`, private fields section.

```typescript
private ptsX!: Float32Array;    // length: (ROWS+1) × (COLS+1)
private ptsY!: Float32Array;    // length: (ROWS+1) × (COLS+1)
private ptsNull!: Uint8Array;   // 1 = behind camera; same length
```

Flat index formula (inline — no helper function to keep the hot path call-free):
```
i = r * (COLS + 1) + c
```

Allocate at the end of `buildGrid()` (before `buildColorCaches()`):
```typescript
const total = (this.ROWS + 1) * (this.COLS + 1);
this.ptsX   = new Float32Array(total);
this.ptsY   = new Float32Array(total);
this.ptsNull = new Uint8Array(total);
```

In `draw()`, replace the `pts` array construction and object access:

```typescript
// Phase 1 projection loop — still calls project(), but writes to typed arrays
for (let r = 0; r <= this.ROWS; r++) {
  for (let c = 0; c <= this.COLS; c++) {
    const i = r * (this.COLS + 1) + c;
    const wx = (c / this.COLS) * xHalf * 2 - xHalf;
    const wy = this.grid[r][c];
    const wz = (r / this.ROWS) * 6.5 + 0.1;
    const p = this.project(wx, wy, wz);
    if (p === null) {
      this.ptsNull[i] = 1;
    } else {
      this.ptsNull[i] = 0;
      this.ptsX[i] = p.x;
      this.ptsY[i] = p.y;
    }
  }
}
```

Access in the back-to-front render loop uses typed array reads:
```typescript
const i00 = r       * (this.COLS + 1) + c;
const i01 = r       * (this.COLS + 1) + c + 1;
const i10 = (r + 1) * (this.COLS + 1) + c;
const i11 = (r + 1) * (this.COLS + 1) + c + 1;
if (this.ptsNull[i00] || this.ptsNull[i01] || this.ptsNull[i10] || this.ptsNull[i11]) continue;
const x00 = this.ptsX[i00], y00 = this.ptsY[i00];
// ... similarly for i01, i10, i11
```

Flat `Float32Array` has better CPU cache locality than a jagged array of JS objects. `Uint8Array` for the null sentinel keeps the memory footprint tight.

---

### Step 1.3 — Pre-compute `fogAlphas[]`

`fogA` is a function of `r` and `fogIntensity` only — it never changes on scroll. Pre-compute it once per grid build.

**File:** `mountain-renderer.ts`, private fields:
```typescript
private fogAlphas!: Float32Array;   // length: ROWS
```

Fill in `buildColorCaches()` (see Step 1.4 for its location):
```typescript
this.fogAlphas = new Float32Array(this.ROWS);
for (let r = 0; r < this.ROWS; r++) {
  const depth  = (r / this.ROWS) * 6.5 + 0.1;
  const depthT = this.clamp(depth / 6.5, 0, 1);
  this.fogAlphas[r] = this.clamp(
    (depthT - 0.3) / 0.7 * this.config.fogIntensity,
    0, 0.98
  );
}
```

In `draw()`, replace the per-row `fogA` block:
```typescript
// Before:
const depth  = (r / this.ROWS) * 6.5 + 0.1;
const depthT = this.clamp(depth / 6.5, 0, 1);
const fogA   = this.clamp((depthT - 0.3) / 0.7 * this.config.fogIntensity, 0, 0.98);

// After:
const fogA = this.fogAlphas[r];
```

---

### Step 1.4 — Pre-compute color and glow string arrays

`faceColor()`, `wireColor()`, and the inline glow color strings all depend only on grid heights and `fogIntensity`. None depend on `camY`, viewport size, or time — they are constant for the lifetime of a given grid + `fogIntensity` combination.

**File:** `mountain-renderer.ts`, private fields:
```typescript
private faceColors!:  string[][];       // [ROWS][COLS]
private wireColorsH!: string[][];       // [ROWS][COLS]     — horizontal wire primary color
private wireColorsV!: string[][];       // [ROWS][COLS+1]   — vertical wire primary color
private glowColorsH!: string[][];       // [ROWS][COLS]     — horizontal wire glow color
private glowColorsV!: string[][];       // [ROWS][COLS+1]   — vertical wire glow color
private lineWidthsH!: Float32Array;     // ROWS × COLS
```

Add `buildColorCaches()` as a private method. Call it at the end of `buildGrid()` (after the grid arrays are filled), and in the `fogIntensity`-change branch of `setConfig()`.

```typescript
private buildColorCaches(): void {
  const { ROWS, COLS } = this;

  this.fogAlphas   = new Float32Array(ROWS);
  this.faceColors  = Array.from({ length: ROWS }, () => new Array<string>(COLS));
  this.wireColorsH = Array.from({ length: ROWS }, () => new Array<string>(COLS));
  this.wireColorsV = Array.from({ length: ROWS }, () => new Array<string>(COLS + 1));
  this.glowColorsH = Array.from({ length: ROWS }, () => new Array<string>(COLS));
  this.glowColorsV = Array.from({ length: ROWS }, () => new Array<string>(COLS + 1));
  this.lineWidthsH = new Float32Array(ROWS * COLS);

  for (let r = 0; r < ROWS; r++) {
    const depth  = (r / ROWS) * 6.5 + 0.1;
    const depthT = this.clamp(depth / 6.5, 0, 1);
    const fogA   = this.clamp((depthT - 0.3) / 0.7 * this.config.fogIntensity, 0, 0.98);
    this.fogAlphas[r] = fogA;

    // Face colors (one per quad)
    for (let c = 0; c < COLS; c++) {
      const avgH = (
        this.grid[r][c] + this.grid[r][c + 1] +
        this.grid[r + 1][c] + this.grid[r + 1][c + 1]
      ) * 0.25;
      this.faceColors[r][c] = this.faceColor(depth, avgH, c / COLS);
    }

    // Horizontal wire colors (front edge of each row quad)
    for (let c = 0; c < COLS; c++) {
      const h   = (this.grid[r][c] + this.grid[r][c + 1]) * 0.5;
      const hf  = this.clamp(h / 2.5, 0, 1);
      const cx01 = (c + 0.5) / COLS;
      const alpha = this.clamp((0.7 + hf * 0.3) * (1 - fogA * 0.9), 0, 1);
      this.wireColorsH[r][c] = this.wireColor(depth, h, cx01, alpha);
      this.glowColorsH[r][c] = `rgba(0,255,190,${((0.04 + hf * 0.05) * (1 - fogA)).toFixed(3)})`;
      this.lineWidthsH[r * COLS + c] = 0.6 + hf * 0.6;
    }

    // Vertical wire colors (left/right edges of each quad column)
    for (let c = 0; c <= COLS; c++) {
      const h   = (this.grid[r][c] + this.grid[r + 1][c]) * 0.5;
      const hf  = this.clamp(h / 2.5, 0, 1);
      const alpha = this.clamp((0.45 + hf * 0.3) * (1 - fogA * 0.9), 0, 1);
      this.wireColorsV[r][c] = this.wireColor(depth, h, c / COLS, alpha);
      this.glowColorsV[r][c] = `rgba(0,255,190,${((0.02 + hf * 0.03) * (1 - fogA)).toFixed(3)})`;
      // V-wire lineWidth is constant 0.45 — no typed array needed; use the literal in draw()
    }
  }
}
```

The `faceColor()` and `wireColor()` methods remain on the class — they move off the hot path and are only called from `buildColorCaches()`.

---

### Step 1.5 — Cache gradient objects

The two gradient objects in `drawForegroundAtmosphere()` are created fresh every frame. They only depend on canvas dimensions.

**File:** `mountain-renderer.ts`, private fields:
```typescript
private mistGradient:  CanvasGradient | null = null;
private bloomGradient: CanvasGradient | null = null;
```

Add `buildGradients()`:
```typescript
private buildGradients(): void {
  const { ctx, W, H } = this;

  const mist = ctx.createLinearGradient(0, H * 0.5, 0, H);
  mist.addColorStop(0,    'rgba(56, 189, 248, 0)');
  mist.addColorStop(0.45, 'rgba(99, 102, 241, 0.06)');
  mist.addColorStop(0.8,  'rgba(168, 85, 247, 0.10)');
  mist.addColorStop(1,    'rgba(168, 85, 247, 0.15)');
  this.mistGradient = mist;

  const bloom = ctx.createRadialGradient(W * 0.5, H * 1.1, 0, W * 0.5, H * 1.1, W * 0.55);
  bloom.addColorStop(0,   'rgba(56, 189, 248, 0.10)');
  bloom.addColorStop(0.4, 'rgba(99, 102, 241, 0.07)');
  bloom.addColorStop(1,   'rgba(99, 102, 241, 0)');
  this.bloomGradient = bloom;
}
```

Call from `resize()` after `this.W`/`this.H` are set:
```typescript
resize(width: number, height: number): void {
  this.W = this.canvas.width = width;
  this.H = this.canvas.height = height;
  this.buildGradients();
}
```

Update `drawForegroundAtmosphere()` to read from the cache:
```typescript
private drawForegroundAtmosphere(): void {
  if (!this.mistGradient || !this.bloomGradient) return;
  const { ctx, W, H } = this;
  ctx.globalAlpha = 1;
  ctx.fillStyle = this.mistGradient;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = this.bloomGradient;
  ctx.fillRect(0, 0, W, H);
}
```

---

### Step 1.6 — Update `draw()` to read from caches

The back-to-front render loop reads color values from the pre-built arrays instead of calling the color methods:

```typescript
// Fill pass
ctx.fillStyle = this.faceColors[r][c];

// Fog pass — intentionally omits beginPath(). The existing code reconstructs the quad path
// inside the fog branch; here we reuse the current path set during the fill pass above.
// ctx.fill() re-fills whatever path is current — safe because nothing else touches the path
// between the fill pass and this branch within the same quad iteration.
const fogA = this.fogAlphas[r];
if (fogA > 0.01) {
  ctx.fillStyle = 'rgba(4,6,16,1)';
  ctx.globalAlpha = fogA * 0.88;
  ctx.fill();
}

// H-wire pass
const lw = this.lineWidthsH[r * this.COLS + c];
this.glowLine(x0, y0, x1, y1, this.wireColorsH[r][c], this.glowColorsH[r][c], lw);

// V-wire pass
this.glowLine(x0, y0, x1, y1, this.wireColorsV[r][c], this.glowColorsV[r][c], 0.45);
```

No changes to `glowLine()` itself.

---

### Step 1.7 — Update `BackgroundSceneComponent`

**File:** `background-scene.component.ts`, `startLoop()` scroll branch (line 77).

```typescript
// Before:
this.mountainRenderer?.setConfig({ ...DEFAULT_MOUNTAIN_CONFIG, camY });
this.mountainRenderer?.draw();

// After:
this.mountainRenderer?.setCamY(camY);
this.mountainRenderer?.draw();
```

The initial `setConfig(DEFAULT_MOUNTAIN_CONFIG)` call in `ngAfterViewInit()` is unchanged — it still builds the grid and all caches on first load.

---

### Phase 1 Verification

Open DevTools Performance panel and record a scroll session:

- **Before:** flame chart shows repeated `faceColor`, `wireColor`, string template literal bars inside `draw()` on every scroll frame
- **After:** `draw()` flame chart should be dominated by Canvas 2D API calls (`fill`, `stroke`, `beginPath`), not string allocation. Transient `project()` return objects (~3k per frame) still appear in the allocator — these are eliminated in Phase 2.
- No visual change to the rendered mountains — the cached values reproduce the identical output

---

## Phase 2 — Projection Split

**Goal:** On scroll frames, replace ~3,087 full `project()` invocations (each containing a floating-point division and several multiplications) with a single scalar and ~3,087 multiply-adds on pre-computed arrays.

**Depends on:** Phase 1 (`ptsX`/`ptsY`/`ptsNull` typed arrays and `setCamY()` must exist)

### Math

Expanding `project()` (lines 189–199 of `mountain-renderer.ts`):

```
dz        = wz − 0.8                              ← constant per grid point (wz fixed, eyeZ = 0.8)
scale     = zoom / dz                             ← constant (zoom fixed, dz fixed)
tiltShift = tilt × dz                             ← constant (tilt fixed, dz fixed)

sx        = W/2 + wx × scale × W × 0.56          ← constant (wx fixed)

sy        = H/2 − (wy×vs − eyeY + tiltShift) × scale × H × 0.56
          = H/2 − (wy×vs + tiltShift) × scale × H × 0.56  +  eyeY × scale × H × 0.56
          = ptsYBase[i]  +  eyeY × ptsScale[i]
```

Where `eyeY = 1.1 − camY × 0.42` — one scalar computed once per frame.

New caches:
```
ptsX[i]     = W/2 + wx × (zoom/dz) × W × 0.56               invalidated by: resize, zoom change, grid rebuild
ptsYBase[i] = H/2 − (wy×vs + tilt×dz) × (zoom/dz) × H × 0.56   invalidated by: resize, zoom/tilt/vs change, grid rebuild
ptsScale[i] = (zoom/dz) × H × 0.56                           invalidated by: resize, zoom change, grid rebuild

Per frame on scroll:
eyeY = 1.1 − camY × 0.42                    ← 1 multiply-subtract
ptsY[i] = ptsYBase[i] + eyeY × ptsScale[i]  ← 3,087 multiply-adds (no divisions)
```

Division is ~3–5× slower than multiplication on modern CPUs. Removing 3,087 per-frame divisions is a meaningful hot-path gain.

### Step 2.1 — Add projection cache arrays

**File:** `mountain-renderer.ts`, private fields:
```typescript
private ptsYBase!: Float32Array;   // length: (ROWS+1) × (COLS+1)
private ptsScale!: Float32Array;   // length: (ROWS+1) × (COLS+1)
private ptsDirty = true;
```

`ptsX` was pre-allocated in Phase 1 (as output of a per-frame loop). In Phase 2, it becomes a true static cache filled by `buildProjectionCache()` and never recomputed during `draw()`.

---

### Step 2.2 — Add `buildProjectionCache()`

```typescript
private buildProjectionCache(): void {
  if (this.W === 0 || this.H === 0 || !this.config) return;

  const total = (this.ROWS + 1) * (this.COLS + 1);
  if (!this.ptsX || this.ptsX.length !== total) {
    this.ptsX     = new Float32Array(total);
    this.ptsYBase = new Float32Array(total);
    this.ptsScale = new Float32Array(total);
    this.ptsY     = new Float32Array(total);
    this.ptsNull  = new Uint8Array(total);
  }

  const { zoom, verticalStretch: vs, tilt, horizontalWidth: xHalf } = this.config;
  const eyeZ = 0.8;
  const W056 = this.W * 0.56;
  const H056 = this.H * 0.56;

  for (let r = 0; r <= this.ROWS; r++) {
    for (let c = 0; c <= this.COLS; c++) {
      const i  = r * (this.COLS + 1) + c;
      const wx = (c / this.COLS) * xHalf * 2 - xHalf;
      const wy = this.grid[r][c];
      const wz = (r / this.ROWS) * 6.5 + 0.1;
      const dz = wz - eyeZ;

      if (dz <= 0.02) {
        this.ptsNull[i] = 1;
        continue;
      }
      this.ptsNull[i] = 0;
      const scale      = zoom / dz;
      this.ptsX[i]     = this.W / 2 + wx * scale * W056;
      this.ptsYBase[i] = this.H / 2 - (wy * vs + tilt * dz) * scale * H056;
      this.ptsScale[i] = scale * H056;
    }
  }

  this.ptsDirty = false;
}
```

Note: `ptsY` is still allocated here (it's written at the top of `draw()`), but `ptsYBase` and `ptsScale` are the new static caches.

> **Phase 1 → Phase 2 migration:** When implementing Phase 2, remove the typed array allocation block added to `buildGrid()` in Step 1.2 (`ptsX`, `ptsY`, `ptsNull` allocations at the end of `buildGrid()`). After Phase 2, `buildProjectionCache()` is the sole owner of all five projection arrays. Leaving the Phase 1 allocations in `buildGrid()` creates two authoritative allocation sites for the same arrays — a maintenance trap.

---

### Step 2.3 — `ptsDirty` invalidation call sites

`buildProjectionCache()` must run whenever `ptsX`/`ptsYBase`/`ptsScale` would be stale.

**1. End of `buildGrid()`** (after `buildColorCaches()`):
```typescript
this.buildColorCaches();
this.buildProjectionCache();
```

**2. `resize()`** (after `buildGradients()`):
```typescript
this.buildGradients();
this.buildProjectionCache();
```

**3. `setConfig()`** when `zoom`, `tilt`, or `verticalStretch` change without triggering a grid rebuild (these affect projection but not grid heights):
```typescript
// Note: horizontalWidth (xHalf) also feeds into ptsX, but it is a needsRebuild key —
// a horizontalWidth change triggers buildGrid() → buildProjectionCache() automatically.
const needsProjectionRebuild =
  needsRebuild ||  // buildGrid() already calls buildProjectionCache()
  !this.config ||
  config.zoom            !== this.config.zoom ||
  config.tilt            !== this.config.tilt ||
  config.verticalStretch !== this.config.verticalStretch;

// After the config assignment and optional buildGrid():
if (needsProjectionRebuild && !needsRebuild) {
  this.buildProjectionCache();
}
```

---

### Step 2.4 — Update `draw()` to use projection caches

Replace the per-frame `project()` loop with a single `eyeY` scalar and a flat `ptsY` update:

```typescript
draw(): void {
  if (!this.config || this.W === 0 || this.ptsDirty) return;
  const { ctx, W, H } = this;

  // One scalar per frame — the only camY-dependent computation
  const eyeY = 1.1 - this.config.camY * 0.42;

  // Update all Y screen coords: 3,087 multiply-adds on pre-cached Float32Arrays
  const total = (this.ROWS + 1) * (this.COLS + 1);
  for (let i = 0; i < total; i++) {
    if (!this.ptsNull[i]) {
      this.ptsY[i] = this.ptsYBase[i] + eyeY * this.ptsScale[i];
    }
  }

  ctx.clearRect(0, 0, W, H);

  // Back-to-front render passes — reads ptsX[i] / ptsY[i], all color arrays, fogAlphas
  for (let r = this.ROWS - 1; r >= 0; r--) {
    // ...
  }

  this.drawForegroundAtmosphere();
  ctx.globalAlpha = 1;
}
```

The former `project()` call is removed from `draw()` entirely. The method remains on the class for use in `buildProjectionCache()`.

---

### Phase 2 Verification

Performance panel scroll recording:
- `draw()` time should be dominated by Canvas 2D API calls, not arithmetic
- The `ptsY` update loop (3k multiply-adds on `Float32Array`) runs in < 0.1ms on modern hardware and will not appear as a notable bar
- No visual change to the terrain

---

## Phase 3 — OffscreenCanvas Worker

**Goal:** Move the entire mountain rAF loop off the main thread. On scroll, the main thread does one multiply-subtract and one `postMessage` call — zero canvas draw cost.

**Depends on:** Phase 2 (the optimized renderer is what the worker wraps)

### New Files

| File | Location |
|------|----------|
| `mountain-worker.protocol.ts` | `src/app/features/home/background-scene/` |
| `mountain.worker.ts` | `src/app/features/home/background-scene/` |
| `mountain-worker-bridge.ts` | `src/app/features/home/background-scene/` |
| `tsconfig.worker.json` | project root |

### Step 3.1 — Add worker TypeScript config

**New file:** `tsconfig.worker.json` (project root):
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/worker",
    "lib": ["ES2018", "webworker"],
    "types": []
  },
  "include": ["src/**/*.worker.ts"]
}
```

**`angular.json`** — add to `projects.<name>.architect.build.options`:
```json
"webWorkerTsConfig": "tsconfig.worker.json"
```

This tells Angular CLI to discover `*.worker.ts` files and bundle them as separate worker chunks with the `webworker` lib type context. The `"webworker"` lib entry exposes `self`, `postMessage`, and — as of TypeScript 5.x — `requestAnimationFrame` on `DedicatedWorkerGlobalScope`. Angular 21 ships with TypeScript 5.x, so `requestAnimationFrame` resolves correctly. The `/// <reference lib="webworker" />` triple-slash directive at the top of `mountain.worker.ts` is load-bearing for this type resolution — removing it causes a type error on `requestAnimationFrame`.

---

### Step 3.2 — Create `mountain-worker.protocol.ts`

```typescript
import type { MountainConfig } from './mountain.config';

export type MountainWorkerMsg =
  | { type: 'init';   canvas: OffscreenCanvas; width: number; height: number }
  | { type: 'resize'; width: number; height: number }
  | { type: 'config'; config: MountainConfig }
  | { type: 'camY';   value: number };
```

Typed discriminated union — exhausts all messages the worker can receive. No response messages are needed: rendering is fire-and-forget. The `init` message carries both the `OffscreenCanvas` (transferred, not copied) and initial `width`/`height` so the renderer can `resize()` immediately.

---

### Step 3.3 — Update `MountainRenderer` constructor to accept `OffscreenCanvas`

Inside a worker, the canvas is an `OffscreenCanvas`. `OffscreenCanvas.getContext('2d')` returns `OffscreenCanvasRenderingContext2D`, which exposes the same 2D drawing API used by `MountainRenderer`.

**File:** `mountain-renderer.ts`:

Add field:
```typescript
private ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
```

Update constructor:
```typescript
constructor(private canvas: HTMLCanvasElement | OffscreenCanvas) {
  this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
}
```

No other changes to `MountainRenderer` — all drawing calls (`fillRect`, `beginPath`, `moveTo`, `fill`, `stroke`, `createLinearGradient`, `createRadialGradient`, `globalAlpha`, `fillStyle`, `strokeStyle`, `lineWidth`) are identical on both context types. The `resize()` method still uses `this.canvas.width = width` — both `HTMLCanvasElement` and `OffscreenCanvas` support these setters.

---

### Step 3.4 — Create `mountain.worker.ts`

```typescript
/// <reference lib="webworker" />

import { MountainRenderer } from './mountain-renderer';
import { DEFAULT_MOUNTAIN_CONFIG } from './mountain.config';
import type { MountainWorkerMsg } from './mountain-worker.protocol';

let renderer: MountainRenderer | null = null;
let dirty = false;

function loop(): void {
  if (dirty && renderer) {
    renderer.draw();
    dirty = false;
  }
  requestAnimationFrame(loop);
}

self.addEventListener('message', ({ data }: MessageEvent<MountainWorkerMsg>) => {
  switch (data.type) {
    case 'init':
      renderer = new MountainRenderer(data.canvas);
      renderer.setConfig(DEFAULT_MOUNTAIN_CONFIG);
      renderer.resize(data.width, data.height);
      dirty = true;
      requestAnimationFrame(loop);  // starts the loop once; loop() self-reschedules perpetually
      break;

    case 'resize':
      renderer?.resize(data.width, data.height);
      dirty = true;
      break;

    case 'config':
      renderer?.setConfig(data.config);
      dirty = true;
      break;

    case 'camY':
      renderer?.setCamY(data.value);
      dirty = true;
      break;
  }
});
```

Key design decisions:
- **`dirty` flag:** `draw()` is called only when state has changed (scroll, resize, config update). Idle frames — where `camY` and the viewport are unchanged — skip the canvas draw entirely, reducing worker CPU cost to near-zero between scroll events.
- **Single rAF loop:** starts on `init`, never stops. The `dirty` gate is the only throttle needed.
- **No response messages:** rendering is asynchronous; the main thread does not observe or wait for draw completion.

---

### Step 3.5 — Create `MountainWorkerBridge`

A plain class (no Angular dependencies) that wraps the `Worker` lifecycle and presents a typed interface matching the current `MountainRenderer` API. This keeps `BackgroundSceneComponent` clean of Worker boilerplate and mirrors the existing pattern of keeping rendering logic out of the component.

**File:** `mountain-worker-bridge.ts`:
```typescript
import type { MountainWorkerMsg } from './mountain-worker.protocol';
import type { MountainConfig } from './mountain.config';

export class MountainWorkerBridge {
  private readonly worker: Worker;

  constructor() {
    this.worker = new Worker(
      new URL('./mountain.worker', import.meta.url),
      { type: 'module' }
    );
  }

  init(canvas: HTMLCanvasElement, width: number, height: number): void {
    const offscreen = canvas.transferControlToOffscreen();
    const msg: MountainWorkerMsg = { type: 'init', canvas: offscreen, width, height };
    this.worker.postMessage(msg, [offscreen]);
  }

  resize(width: number, height: number): void {
    this.worker.postMessage({ type: 'resize', width, height } satisfies MountainWorkerMsg);
  }

  setConfig(config: MountainConfig): void {
    this.worker.postMessage({ type: 'config', config } satisfies MountainWorkerMsg);
  }

  setCamY(value: number): void {
    this.worker.postMessage({ type: 'camY', value } satisfies MountainWorkerMsg);
  }

  destroy(): void {
    this.worker.terminate();
  }
}
```

`new URL('./mountain.worker', import.meta.url)` is the pattern Angular CLI uses to discover and code-split worker bundles at build time. The `{ type: 'module' }` option is required for the worker to use ES module `import` statements (including `mountain-renderer.ts`).

`canvas.transferControlToOffscreen()` permanently transfers pixel buffer ownership. After this call, the component must not attempt to read or draw to the canvas element. The `<canvas #mountainCanvas>` element remains in the DOM for layout and CSS purposes; its GPU buffer is owned by the worker.

---

### Step 3.6 — Update `BackgroundSceneComponent`

**File:** `background-scene.component.ts`

**Remove:**
- `import { MountainRenderer } from './mountain-renderer'`
- `private mountainRenderer: MountainRenderer | null = null`
- `mountainRenderer.setConfig(...)` / `mountainRenderer.draw()` in `startLoop()`
- `mountainRenderer.resize(...)` in `scheduleResize()`

**Keep:**
- `import { DEFAULT_MOUNTAIN_CONFIG } from './mountain.config'` — `camYOffset` is still read in the scroll branch to compute `camY`. Only the config spread (`{ ...DEFAULT_MOUNTAIN_CONFIG, camY }`) is removed, not the import itself.

**Add:**
- `import { MountainWorkerBridge } from './mountain-worker-bridge'`
- `private mountainWorker: MountainWorkerBridge | null = null`

**`ngAfterViewInit()`, inside the `isPlatformBrowser` guard:**
```typescript
this.mountainWorker = new MountainWorkerBridge();
this.mountainWorker.init(
  this.mountainCanvasRef().nativeElement,
  window.innerWidth,
  window.innerHeight
);
```

**`startLoop()`, scroll branch:**
```typescript
if (scrollY !== this.lastScrollY) {
  this.lastScrollY = scrollY;
  const camY = scrollY / 1200 - DEFAULT_MOUNTAIN_CONFIG.camYOffset;
  this.mountainWorker?.setCamY(camY);   // fire-and-forget postMessage — no draw call here
}
// SceneRenderer.drawFrame() continues unchanged on the main thread
```

**`scheduleResize()`:**
```typescript
this.mountainWorker?.resize(window.innerWidth, window.innerHeight);
```

**`ngOnDestroy()`:**
```typescript
this.mountainWorker?.destroy();
```

**SSR safety:** `MountainWorkerBridge` creates a `Worker` and calls `transferControlToOffscreen()` — both browser-only APIs. Both calls happen exclusively inside the `isPlatformBrowser` guard in `ngAfterViewInit()`. No SSR/prerender compatibility change required.

The `will-change: transform` + `transform: translateZ(0)` CSS on `.mountain-canvas` is retained. The GPU compositor layer promotion hint remains valid even with an `OffscreenCanvas` controlling the pixel buffer.

---

### Phase 3 Verification

**1. Visual check (Playwright):**
```
browser_navigate → http://localhost:4200
browser_take_screenshot        — terrain renders identically to Phase 2
browser_evaluate window.scrollTo(0, 600)
browser_take_screenshot        — camY parallax still present
browser_console_messages       — no OffscreenCanvas transfer errors
```

**2. Performance check (DevTools → Performance panel):**
- Record a scroll session
- Main thread flame chart: **no** `MountainRenderer.draw()` bars during scroll
- A separate **Worker** track appears with the mountain `draw()` bars
- Main thread scroll cost: one multiply-subtract + `postMessage` < 0.1ms

**3. Idle frame check:**
- Record a 5-second idle period (no scroll, no resize)
- Worker `draw()` should not appear (dirty flag is `false` on idle frames)
- Main thread continues `SceneRenderer.drawFrame()` for stars, UFO, and rocket unchanged

---

## Files Changed

| File | Action | Phase |
|------|--------|-------|
| `background-scene/mountain-renderer.ts` | Add `setCamY()`, `buildColorCaches()`, `buildGradients()`, `buildProjectionCache()`; update `draw()`, `buildGrid()`, `resize()`, `setConfig()`, constructor | 1, 2, 3 |
| `background-scene/background-scene.component.ts` | Use `setCamY()` in scroll branch | 1 |
| `background-scene/background-scene.component.ts` | Replace `MountainRenderer` with `MountainWorkerBridge`; remove mountain `draw()` from `startLoop()` | 3 |
| `background-scene/mountain-worker.protocol.ts` | **New** — discriminated union of worker messages | 3 |
| `background-scene/mountain.worker.ts` | **New** — worker entry point, rAF loop, message handler | 3 |
| `background-scene/mountain-worker-bridge.ts` | **New** — typed class wrapping Worker API | 3 |
| `tsconfig.worker.json` | **New** — worker TypeScript compilation config | 3 |
| `angular.json` | Add `webWorkerTsConfig` to build target options | 3 |
| `docs/development.md` | Update Phase 5 Built notes after each phase lands | ongoing |

`mountain.config.ts` — no changes.

---

## Execution Order & Dependencies

```
Phase 1 — Static Caches
  └── no deps; ships independently
      │
      ▼
Phase 2 — Projection Split
  └── needs Phase 1: requires ptsX/ptsY/ptsNull typed arrays and setCamY()
      │
      ▼
Phase 3 — OffscreenCanvas Worker
  └── needs Phase 2: worker wraps the optimized renderer
      needs tsconfig.worker.json + angular.json changes before first build
```

---

## Unit Tests

No spec exists for `MountainRenderer` yet. Phase 1 is the right time to introduce `mountain-renderer.spec.ts` — the new cache methods have crisp contracts that map directly to unit tests, and the spec becomes the regression harness for the projection split (Phase 2) and worker integration (Phase 3).

All tests follow the project convention: vitest, `vi.spyOn` / `vi.stubGlobal`, no Angular TestBed (pure class, no DI). Model the structure after `scene-renderer.spec.ts`.

---

### New file: `mountain-renderer.spec.ts`

```
src/app/features/home/background-scene/mountain-renderer.spec.ts
```

#### Scaffold

```typescript
import { MountainRenderer } from './mountain-renderer';
import { DEFAULT_MOUNTAIN_CONFIG, MountainConfig } from './mountain.config';

describe('MountainRenderer', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
  });

  // test blocks below
});
```

#### Phase 1 test cases

**Construction and config:**
```typescript
it('constructs without error', () => {
  expect(() => new MountainRenderer(canvas)).not.toThrow();
});

it('draw() is a no-op before setConfig() is called', () => {
  const r = new MountainRenderer(canvas);
  r.resize(800, 600);
  expect(() => r.draw()).not.toThrow();
});

it('draw() is a no-op before resize() is called', () => {
  const r = new MountainRenderer(canvas);
  r.setConfig(DEFAULT_MOUNTAIN_CONFIG);
  expect(() => r.draw()).not.toThrow();
});
```

**`setCamY()` — direct setter, no rebuild:**
```typescript
describe('setCamY()', () => {
  it('updates camY without throwing', () => {
    const r = new MountainRenderer(canvas);
    r.setConfig(DEFAULT_MOUNTAIN_CONFIG);
    r.resize(800, 600);
    expect(() => r.setCamY(0.5)).not.toThrow();
  });

  it('draw() completes after setCamY() — no stale-cache crash', () => {
    const r = new MountainRenderer(canvas);
    r.setConfig(DEFAULT_MOUNTAIN_CONFIG);
    r.resize(800, 600);
    r.draw();
    r.setCamY(1.2);
    expect(() => r.draw()).not.toThrow();
  });
});
```

**Color and fog cache dimensions:**
```typescript
describe('buildColorCaches() — called internally by setConfig()', () => {
  it('faceColors has ROWS × COLS entries', () => {
    const r = new MountainRenderer(canvas);
    r.setConfig(DEFAULT_MOUNTAIN_CONFIG);
    // Access via cast to inspect private state
    const rr = r as unknown as {
      faceColors: string[][];
      ROWS: number;
      COLS: number;
    };
    expect(rr.faceColors.length).toBe(rr.ROWS);
    expect(rr.faceColors[0].length).toBe(rr.COLS);
  });

  it('fogAlphas has ROWS entries, all in [0, 0.98]', () => {
    const r = new MountainRenderer(canvas);
    r.setConfig(DEFAULT_MOUNTAIN_CONFIG);
    const rr = r as unknown as { fogAlphas: Float32Array; ROWS: number };
    expect(rr.fogAlphas.length).toBe(rr.ROWS);
    for (const v of rr.fogAlphas) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(0.98);
    }
  });

  it('rebuilds color caches when fogIntensity changes without a grid rebuild', () => {
    const r = new MountainRenderer(canvas);
    r.setConfig(DEFAULT_MOUNTAIN_CONFIG);
    const rr = r as unknown as { fogAlphas: Float32Array };
    const before = rr.fogAlphas[rr.fogAlphas.length - 1];

    r.setConfig({ ...DEFAULT_MOUNTAIN_CONFIG, fogIntensity: 0.9 });
    const after = rr.fogAlphas[rr.fogAlphas.length - 1];

    // Deepest row fog value must differ when fogIntensity changes
    expect(after).not.toBe(before);
  });

  it('does NOT rebuild the grid when only fogIntensity changes', () => {
    const r = new MountainRenderer(canvas);
    r.setConfig(DEFAULT_MOUNTAIN_CONFIG);
    const rr = r as unknown as { grid: number[][] };
    const gridBefore = rr.grid;

    r.setConfig({ ...DEFAULT_MOUNTAIN_CONFIG, fogIntensity: 0.5 });

    // grid reference unchanged proves no rebuild occurred — no spy on private needed
    expect(rr.grid).toBe(gridBefore);
  });
});
```

**Gradient cache:**
```typescript
describe('buildGradients() — called internally by resize()', () => {
  it('caches gradients after resize()', () => {
    const r = new MountainRenderer(canvas);
    r.setConfig(DEFAULT_MOUNTAIN_CONFIG);
    r.resize(800, 600);
    const rr = r as unknown as {
      mistGradient: CanvasGradient | null;
      bloomGradient: CanvasGradient | null;
    };
    expect(rr.mistGradient).not.toBeNull();
    expect(rr.bloomGradient).not.toBeNull();
  });

  it('rebuilds gradients on second resize()', () => {
    const r = new MountainRenderer(canvas);
    r.setConfig(DEFAULT_MOUNTAIN_CONFIG);
    r.resize(800, 600);
    const rr = r as unknown as { mistGradient: CanvasGradient | null };
    const first = rr.mistGradient;
    r.resize(1280, 720);
    expect(rr.mistGradient).not.toBe(first);
  });
});
```

**`draw()` end-to-end smoke:**
```typescript
describe('draw()', () => {
  it('completes without error after setConfig() + resize()', () => {
    const r = new MountainRenderer(canvas);
    r.setConfig(DEFAULT_MOUNTAIN_CONFIG);
    r.resize(800, 600);
    expect(() => r.draw()).not.toThrow();
  });

  it('completes without error after multiple setCamY() calls', () => {
    const r = new MountainRenderer(canvas);
    r.setConfig(DEFAULT_MOUNTAIN_CONFIG);
    r.resize(800, 600);
    for (let i = 0; i <= 10; i++) {
      r.setCamY(i * 0.1);
      expect(() => r.draw()).not.toThrow();
    }
  });
});
```

---

#### Phase 2 additions to `mountain-renderer.spec.ts`

**Projection cache dimensions:**
```typescript
describe('buildProjectionCache() — Phase 2', () => {
  it('ptsX, ptsYBase, ptsScale have (ROWS+1)×(COLS+1) entries after setConfig()+resize()', () => {
    const r = new MountainRenderer(canvas);
    r.setConfig(DEFAULT_MOUNTAIN_CONFIG);
    r.resize(800, 600);
    const rr = r as unknown as {
      ptsX: Float32Array;
      ptsYBase: Float32Array;
      ptsScale: Float32Array;
      ROWS: number;
      COLS: number;
    };
    const expected = (rr.ROWS + 1) * (rr.COLS + 1);
    expect(rr.ptsX.length).toBe(expected);
    expect(rr.ptsYBase.length).toBe(expected);
    expect(rr.ptsScale.length).toBe(expected);
  });

  it('ptsScale values are all positive (no behind-camera points in default config)', () => {
    const r = new MountainRenderer(canvas);
    r.setConfig(DEFAULT_MOUNTAIN_CONFIG);
    r.resize(800, 600);
    const rr = r as unknown as { ptsScale: Float32Array; ptsNull: Uint8Array };
    for (let i = 0; i < rr.ptsScale.length; i++) {
      if (!rr.ptsNull[i]) {
        expect(rr.ptsScale[i]).toBeGreaterThan(0);
      }
    }
  });

  it('rebuilds projection cache when zoom changes in setConfig()', () => {
    const r = new MountainRenderer(canvas);
    r.setConfig(DEFAULT_MOUNTAIN_CONFIG);
    r.resize(800, 600);
    const rr = r as unknown as { ptsX: Float32Array };
    const ptsXBefore = Float32Array.from(rr.ptsX);

    r.setConfig({ ...DEFAULT_MOUNTAIN_CONFIG, zoom: 1.5 });

    // ptsX values must differ after zoom change
    let changed = false;
    for (let i = 0; i < rr.ptsX.length; i++) {
      if (rr.ptsX[i] !== ptsXBefore[i]) { changed = true; break; }
    }
    expect(changed).toBe(true);
  });

  it('rebuilds projection cache when tilt changes in setConfig()', () => {
    const r = new MountainRenderer(canvas);
    r.setConfig(DEFAULT_MOUNTAIN_CONFIG);
    r.resize(800, 600);
    const rr = r as unknown as { ptsYBase: Float32Array };
    const before = Float32Array.from(rr.ptsYBase);

    r.setConfig({ ...DEFAULT_MOUNTAIN_CONFIG, tilt: 0.5 });

    let changed = false;
    for (let i = 0; i < rr.ptsYBase.length; i++) {
      if (rr.ptsYBase[i] !== before[i]) { changed = true; break; }
    }
    expect(changed).toBe(true);
  });

  it('ptsY is updated on draw() after setCamY() changes camY', () => {
    const r = new MountainRenderer(canvas);
    r.setConfig(DEFAULT_MOUNTAIN_CONFIG);
    r.resize(800, 600);
    const rr = r as unknown as { ptsY: Float32Array; ptsNull: Uint8Array };

    r.setCamY(0);
    r.draw();
    // Find a non-null point
    const idx = Array.from(rr.ptsNull).findIndex(v => v === 0);
    const yAt0 = rr.ptsY[idx];

    r.setCamY(1.0);
    r.draw();
    const yAt1 = rr.ptsY[idx];

    // Different camY → different screen Y for the same grid point
    expect(yAt1).not.toBe(yAt0);
  });

  it('ptsDirty = true causes draw() to skip rendering without throwing', () => {
    const r = new MountainRenderer(canvas);
    r.setConfig(DEFAULT_MOUNTAIN_CONFIG);
    r.resize(800, 600);
    const rr = r as unknown as { ptsDirty: boolean };
    rr.ptsDirty = true;
    expect(() => r.draw()).not.toThrow();
  });
});
```

---

#### Phase 3 addition: `mountain-worker-bridge.spec.ts`

```
src/app/features/home/background-scene/mountain-worker-bridge.spec.ts
```

The `Worker` global must be stubbed since there is no real worker bundle in the test environment.

```typescript
import { MountainWorkerBridge } from './mountain-worker-bridge';
import { DEFAULT_MOUNTAIN_CONFIG } from './mountain.config';

describe('MountainWorkerBridge', () => {
  let postMessageSpy: ReturnType<typeof vi.fn>;
  let terminateSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    postMessageSpy = vi.fn();
    terminateSpy   = vi.fn();
    vi.stubGlobal('Worker', vi.fn(() => ({
      postMessage: postMessageSpy,
      terminate:   terminateSpy,
    })));
  });

  afterEach(() => vi.restoreAllMocks());

  it('constructs without error', () => {
    expect(() => new MountainWorkerBridge()).not.toThrow();
  });

  it('setCamY() posts a camY message', () => {
    const bridge = new MountainWorkerBridge();
    bridge.setCamY(0.75);
    expect(postMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'camY', value: 0.75 })
    );
  });

  it('resize() posts a resize message', () => {
    const bridge = new MountainWorkerBridge();
    bridge.resize(1280, 720);
    expect(postMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'resize', width: 1280, height: 720 })
    );
  });

  it('setConfig() posts a config message', () => {
    const bridge = new MountainWorkerBridge();
    bridge.setConfig(DEFAULT_MOUNTAIN_CONFIG);
    expect(postMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'config', config: DEFAULT_MOUNTAIN_CONFIG })
    );
  });

  it('destroy() calls worker.terminate()', () => {
    const bridge = new MountainWorkerBridge();
    bridge.destroy();
    expect(terminateSpy).toHaveBeenCalledTimes(1);
  });
});
```

---

### Updates to `background-scene.component.spec.ts`

#### After Phase 1

The scroll-skip test at line 84 spies on `MountainRenderer.prototype.draw`. After Phase 1 the hot path calls `setCamY()` instead of `setConfig()`. Update the test description and assertion accordingly:

- Rename the `describe` block from `'scroll-skip optimization'` to `'scroll-path optimization'` (find the exact string at `background-scene.component.spec.ts:81`)
- The existing `drawSpy` on `MountainRenderer.prototype.draw` at line 95 remains valid — in Phase 1 the scroll branch still calls `mountainRenderer.draw()` directly (now preceded by `setCamY()` instead of `setConfig()`). No assertion changes needed, only the describe label.
- Add a new test: `'calls setCamY() instead of setConfig() on scroll'` — spy on `MountainRenderer.prototype.setCamY` and verify it is called when `scrollY` changes. This replaces the implicit coverage from the removed `setConfig()` call on the scroll hot path.

#### After Phase 3

`MountainRenderer` is no longer instantiated in `BackgroundSceneComponent`. The component-level scroll test must be rewritten to spy on `MountainWorkerBridge` instead:

```typescript
describe('scroll path (Phase 3 worker)', () => {
  it('calls MountainWorkerBridge.setCamY() when scrollY changes', async () => {
    // ... standard stub setup ...
    const { MountainWorkerBridge } = await import('./mountain-worker-bridge');
    const setCamYSpy = vi
      .spyOn(MountainWorkerBridge.prototype, 'setCamY')
      .mockImplementation(() => {});

    Object.defineProperty(window, 'scrollY', { value: 200, writable: true, configurable: true });
    // ... create fixture, detect changes, fire rAF callback ...
    expect(setCamYSpy).toHaveBeenCalled();
  });

  it('does NOT call MountainWorkerBridge.setCamY() when scrollY is unchanged', async () => {
    // ... same setup, fire two rAF frames with same scrollY ...
    expect(setCamYSpy).toHaveBeenCalledTimes(1);
  });
});
```

Also add a `'calls mountainWorker.destroy() on component destroy'` test alongside the existing `SceneRenderer.destroy()` test.

---

### Run command and passing bar

After each phase, verify with:
```bash
npm test
```

The test suite uses vitest with no watch mode (`npm test` runs once and exits). All tests must pass before a phase is considered complete. The mountain-renderer spec replaces the absence of coverage on the renderer; `background-scene.component.spec.ts` updates prevent the component tests from testing against a removed code path.

---

## Documentation Updates

Update living docs immediately after each phase lands — stale docs are explicitly called out as worse than no docs in `CLAUDE.md`.

---

### After Phase 1

**`docs/development.md` — Phase 5 Built section**

In the `MountainRenderer` paragraph, update the description of the scroll mechanism:

> Before: "The rAF loop skips `MountainRenderer.draw()` when `scrollY` has not changed since the last frame (`lastScrollY` guard in `BackgroundSceneComponent`)."
>
> After: "On scroll frames `BackgroundSceneComponent` calls `mountainRenderer.setCamY(camY)` (a direct field write — no config spread or comparison). `draw()` is only called when `scrollY` has changed since the last frame (`lastScrollY` guard). Pre-built color string arrays (`faceColors`, `wireColorsH`, `wireColorsV`, `glowColorsH`, `glowColorsV`) and fog alpha cache (`fogAlphas`) eliminate all per-frame string allocations. Gradient objects (`mistGradient`, `bloomGradient`) are cached on `resize()`. `setConfig()` triggers color cache rebuild when `fogIntensity` changes independently of the grid."

---

### After Phase 2

**`docs/development.md` — Phase 5 Built section**

Extend the `MountainRenderer` paragraph:

> Append: "Projection is split into static caches (`ptsX`, `ptsYBase`, `ptsScale` — built in `buildProjectionCache()`, invalidated by resize, zoom, tilt, verticalStretch, or grid rebuild) and a per-frame multiply-add: `ptsY[i] = ptsYBase[i] + eyeY × ptsScale[i]` where `eyeY = 1.1 − camY × 0.42` is one scalar per frame. This eliminates ~3,087 per-frame floating-point divisions from the scroll hot path."

---

### After Phase 3

**`docs/development.md` — Phase 5 Built section**

Replace the `MountainRenderer` ownership line with the worker architecture:

> Before: "mountain canvas (DOM-order first, bottom layer) owned by `MountainRenderer`"
>
> After: "mountain canvas (DOM-order first, bottom layer) rendered by `MountainRenderer` running inside a dedicated web worker (`mountain.worker.ts`). `BackgroundSceneComponent` owns a `MountainWorkerBridge` instance that transfers `OffscreenCanvas` ownership to the worker on init and posts fire-and-forget messages (`camY`, `resize`, `config`). The worker runs its own rAF loop gated by a `dirty` flag — idle frames incur zero draw cost. Main-thread scroll cost is one multiply-subtract + one `postMessage` call."

Remove the sentence: "The rAF loop skips `MountainRenderer.draw()` when `scrollY` has not changed since the last frame (`lastScrollY` guard in `BackgroundSceneComponent`)." — this guard still exists for the main-thread `SceneRenderer` branch but no longer applies to the mountain renderer.

Add to the new files bullet list:
- `mountain-worker.protocol.ts` — typed `MountainWorkerMsg` discriminated union
- `mountain.worker.ts` — worker entry: rAF loop, message handler, `MountainRenderer` owner
- `mountain-worker-bridge.ts` — main-thread bridge: `init()`, `setCamY()`, `resize()`, `setConfig()`, `destroy()`
- `tsconfig.worker.json` — worker TypeScript compilation target

---

**`docs/architecture.md` — Folder Structure section**

Under `background-scene/`, add:
```
│   │   ├── background-scene/
│   │   │   ├── mountain.config.ts
│   │   │   ├── mountain-renderer.ts          ← accepts HTMLCanvasElement | OffscreenCanvas
│   │   │   ├── mountain.worker.ts            ← web worker: owns renderer + rAF loop
│   │   │   ├── mountain-worker.protocol.ts   ← MountainWorkerMsg discriminated union
│   │   │   └── mountain-worker-bridge.ts     ← main-thread bridge to worker
```

---

**`docs/architecture.md` — Component Architecture / Key Component Map**

Update the `BackgroundSceneComponent` entry:

> Before: "two-canvas: mountain canvas (MountainRenderer, bottom) + scene canvas (SceneRenderer, top — stars, atmosphere, UFO, rocket)"
>
> After: "two-canvas: mountain canvas (OffscreenCanvas — owned by `MountainRenderer` in `mountain.worker.ts` via `MountainWorkerBridge`) + scene canvas (SceneRenderer, main thread — stars, atmosphere, UFO, rocket)"

---

**`docs/development.md` — Phase 9 Performance task list**

Mark as complete (or remove from the open list) once Phase 3 ships:
- "Canvas: skip rendering when `document.hidden`" — note that the worker `dirty` flag handles idle suppression; full visibility-change throttle remains a Phase 9 polish task but is no longer the primary performance concern for mountains.

---

## Post-Implementation Notes

- **DPR scaling (Phase 9 task):** After Phase 3, `MountainWorkerBridge.resize()` sends raw `innerWidth`/`innerHeight`. The Phase 9 DPR fix will multiply by `devicePixelRatio` and pass it through the `resize` message; `MountainRenderer.resize()` will apply it to canvas pixel dimensions while CSS dimensions stay at `100%`.

- **Background-tab throttle (Phase 9 task, currently deferred):** The worker `dirty` flag already prevents redundant redraws on idle. For full background-tab suppression, add `{ type: 'pause' }` / `{ type: 'resume' }` to the protocol and send them from a `document.addEventListener('visibilitychange', …)` in `BackgroundSceneComponent`.

- **Live config tuning:** `MountainWorkerBridge.setConfig()` is available for any future debug panel or user-facing quality toggle. Config changes are cheap worker messages.

import { MountainRenderer } from './mountain-renderer';
import { DEFAULT_MOUNTAIN_CONFIG } from './mountain.config';

describe('MountainRenderer', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
  });

  // ─── Construction ──────────────────────────────────────────────────────────

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

  // ─── setCamY() ─────────────────────────────────────────────────────────────

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

  // ─── buildColorCaches() ────────────────────────────────────────────────────

  describe('buildColorCaches() — called internally by setConfig()', () => {
    it('faceColors has ROWS × COLS entries', () => {
      const r = new MountainRenderer(canvas);
      r.setConfig(DEFAULT_MOUNTAIN_CONFIG);
      const rr = r as unknown as { faceColors: string[][]; ROWS: number; COLS: number };
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

      // Same grid reference proves no rebuild occurred
      expect(rr.grid).toBe(gridBefore);
    });
  });

  // ─── buildGradients() ──────────────────────────────────────────────────────

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

  // ─── buildProjectionCache() — Phase 2 ──────────────────────────────────────

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

    it('ptsScale values are all positive for non-null points in default config', () => {
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

  // ─── draw() smoke ──────────────────────────────────────────────────────────

  describe('draw()', () => {
    it('batches face fills and wire strokes by row', () => {
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
      vi.spyOn(canvas, 'getContext').mockReturnValue(ctx);
      const fillSpy = vi.spyOn(ctx, 'fill');
      const strokeSpy = vi.spyOn(ctx, 'stroke');
      const beginPathSpy = vi.spyOn(ctx, 'beginPath');
      const r = new MountainRenderer(canvas);
      r.setConfig(DEFAULT_MOUNTAIN_CONFIG);
      r.resize(800, 600);
      const rr = r as unknown as { ROWS: number };

      r.draw();

      // Per visible row: one terrain fill, at most one fog fill, two wire
      // orientations with two strokes each, and three path constructions.
      expect(fillSpy.mock.calls.length).toBeLessThanOrEqual(rr.ROWS * 2 + 2);
      expect(strokeSpy.mock.calls.length).toBeLessThanOrEqual(rr.ROWS * 4);
      expect(beginPathSpy.mock.calls.length).toBeLessThanOrEqual(rr.ROWS * 3);
    });

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
});

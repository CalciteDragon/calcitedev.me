import { MountainRenderer } from './mountain-renderer';
import { DEFAULT_MOUNTAIN_CONFIG, PROJECTION_REFERENCE_WIDTH } from './mountain.config';

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

    it('precomposes fog into cached face colors when fogIntensity changes', () => {
      const r = new MountainRenderer(canvas);
      r.setConfig(DEFAULT_MOUNTAIN_CONFIG);
      const rr = r as unknown as { faceColors: string[][]; ROWS: number; COLS: number };
      const row = rr.ROWS - 1;
      const column = Math.floor(rr.COLS / 2);
      const foggedColor = rr.faceColors[row][column];

      r.setConfig({ ...DEFAULT_MOUNTAIN_CONFIG, fogIntensity: 0 });

      expect(rr.faceColors[row][column]).not.toBe(foggedColor);
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
  // ─── terrainSeed ───────────────────────────────────────────────────────────

  describe('terrainSeed', () => {
    it('produces the same terrain for the same seed on every build', () => {
      const grid = (seed: number): number[][] => {
        const r = new MountainRenderer(document.createElement('canvas'));
        r.setConfig({ ...DEFAULT_MOUNTAIN_CONFIG, terrainSeed: seed });
        return (r as unknown as { grid: number[][] }).grid;
      };
      expect(grid(0)).toEqual(grid(0));
    });

    it('rebuilds the grid into a different range when the seed changes', () => {
      const r = new MountainRenderer(canvas);
      r.setConfig(DEFAULT_MOUNTAIN_CONFIG);
      const rr = r as unknown as { grid: number[][] };
      const before = rr.grid.map(row => [...row]);

      r.setConfig({ ...DEFAULT_MOUNTAIN_CONFIG, terrainSeed: 7 });
      expect(rr.grid).not.toEqual(before);
    });
  });

  // ─── Horizontal projection ─────────────────────────────────────────────────

  describe('horizontal projection below the reference width', () => {
    /**
     * Screen X of every projected point, measured from the canvas center.
     * Points behind the camera are skipped — buildProjectionCache() never writes
     * them, so their slots hold a stale 0. The behind-camera set depends only on
     * depth, so it is identical at every width and the arrays stay index-aligned.
     */
    const offsetsFromCenter = (width: number): number[] => {
      const r = new MountainRenderer(document.createElement('canvas'));
      r.setConfig(DEFAULT_MOUNTAIN_CONFIG);
      r.resize(width, 900);
      const rr = r as unknown as { ptsX: Float32Array; ptsNull: Uint8Array };
      return Array.from(rr.ptsX)
        .filter((_, i) => !rr.ptsNull[i])
        .map(x => x - width / 2);
    };

    it('crops rather than squishes — pixel offsets match below the reference width', () => {
      const wide = offsetsFromCenter(PROJECTION_REFERENCE_WIDTH);
      const narrow = offsetsFromCenter(900);
      expect(narrow).toHaveLength(wide.length);
      // Offsets are stored in a Float32Array around a different center, so they
      // agree to float32 precision rather than bit-for-bit.
      narrow.forEach((offset, i) => expect(offset).toBeCloseTo(wide[i], 2));
    });

    it('still widens with the viewport above the reference width', () => {
      const atReference = offsetsFromCenter(PROJECTION_REFERENCE_WIDTH);
      const ultrawide = offsetsFromCenter(PROJECTION_REFERENCE_WIDTH * 2);
      const i = atReference.findIndex(v => Math.abs(v) > 1);
      expect(Math.abs(ultrawide[i])).toBeGreaterThan(Math.abs(atReference[i]));
    });
  });
});

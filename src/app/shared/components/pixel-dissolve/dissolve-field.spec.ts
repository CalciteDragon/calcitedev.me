import { DISSOLVE_BLOCK } from './dissolve-pattern';
import { DISSOLVE_RAMP_HEIGHT, buildDissolvePath, dissolveCoverage } from './dissolve-field';

const CENTRE = 0.5;
const EDGE = 0;

/** First depth at which a column has crossed `fraction` coverage. */
function depthReaching(tx: number, fraction: number): number {
  for (let ty = 0; ty <= 1.0001; ty += 0.002) {
    if (dissolveCoverage(tx, ty) >= fraction) return ty;
  }
  return Infinity;
}

describe('dissolveCoverage', () => {
  it('never decreases going down, and ends solid', () => {
    for (const tx of [0, 0.25, CENTRE, 0.75, 1]) {
      let previous = -1;
      for (let ty = 0; ty <= 1.0001; ty += 0.01) {
        const coverage = dissolveCoverage(tx, ty);
        expect(coverage).toBeGreaterThanOrEqual(previous);
        previous = coverage;
      }
      expect(dissolveCoverage(tx, 1)).toBeCloseTo(1, 5);
    }
  });

  it('accelerates rather than ramping linearly', () => {
    // Each successive quarter of the ramp must add more coverage than the last.
    const gains = [0, 0.25, 0.5, 0.75, 1]
      .map(ty => dissolveCoverage(CENTRE, ty))
      .map((value, i, all) => (i === 0 ? 0 : value - all[i - 1]))
      .slice(1);
    for (let i = 1; i < gains.length; i++) {
      expect(gains[i]).toBeGreaterThan(gains[i - 1]);
    }
    // A linear ramp would sit at 0.5 halfway down; this one must be well under.
    expect(dissolveCoverage(CENTRE, 0.5)).toBeLessThan(0.25);
  });

  it('is more intense toward the sides at every depth', () => {
    for (let ty = 0.05; ty < 1; ty += 0.05) {
      // Non-strict: once a column saturates at 1 it cannot outrun its neighbour.
      expect(dissolveCoverage(EDGE, ty)).toBeGreaterThanOrEqual(dissolveCoverage(0.25, ty));
      expect(dissolveCoverage(0.25, ty)).toBeGreaterThanOrEqual(dissolveCoverage(CENTRE, ty));
      // Strictly ahead of the middle for as long as the middle has room to grow.
      if (dissolveCoverage(CENTRE, ty) < 1) {
        expect(dissolveCoverage(EDGE, ty)).toBeGreaterThan(dissolveCoverage(CENTRE, ty));
      }
    }
  });

  it('starts and finishes earlier at the sides than in the middle', () => {
    expect(depthReaching(EDGE, 0.01)).toBeLessThan(depthReaching(CENTRE, 0.01));
    expect(depthReaching(EDGE, 0.999)).toBeLessThan(depthReaching(CENTRE, 0.999));
  });

  it('is symmetric about the middle of the page', () => {
    for (const tx of [0, 0.1, 0.3, 0.45]) {
      for (const ty of [0.2, 0.5, 0.8]) {
        expect(dissolveCoverage(tx, ty)).toBeCloseTo(dissolveCoverage(1 - tx, ty), 10);
      }
    }
  });
});

describe('buildDissolvePath', () => {
  it('renders nothing until a width is known, so SSR emits no grid', () => {
    expect(buildDissolvePath(0)).toBe('');
    expect(buildDissolvePath(-1)).toBe('');
  });

  it('keeps every block on the grid and inside the ramp', () => {
    const width = 800;
    const commands = [...buildDissolvePath(width).matchAll(/M(-?\d+) (\d+)h(\d+)v(\d+)h-\d+z/g)];
    expect(commands.length).toBeGreaterThan(0);

    for (const [, x, y, run, height] of commands) {
      expect(Number(y) % DISSOLVE_BLOCK).toBe(0);
      expect(Number(run) % DISSOLVE_BLOCK).toBe(0);
      expect(Number(height)).toBe(DISSOLVE_BLOCK);
      expect(Number(y)).toBeLessThan(DISSOLVE_RAMP_HEIGHT);
      expect(Number(x) + Number(run)).toBeLessThanOrEqual(width + DISSOLVE_BLOCK);
    }
  });

  it('merges adjacent blocks into runs instead of emitting one per cell', () => {
    const commands = [...buildDissolvePath(800).matchAll(/h(\d+)v/g)];
    const merged = commands.filter(([, run]) => Number(run) > DISSOLVE_BLOCK);
    expect(merged.length).toBeGreaterThan(0);
  });

  it('covers the bottom row edge to edge and leaves the top row bare', () => {
    const width = 800;
    const rows = DISSOLVE_RAMP_HEIGHT / DISSOLVE_BLOCK;
    const bottomY = (rows - 1) * DISSOLVE_BLOCK;
    const path = buildDissolvePath(width);
    const bottom = [...path.matchAll(/M(-?\d+) (\d+)h(\d+)v/g)].filter(
      ([, , y]) => Number(y) === bottomY,
    );
    expect(bottom).toHaveLength(1);
    expect(Number(bottom[0][3])).toBeGreaterThanOrEqual(width);
    expect(path).not.toContain(` 0h`); // no run starts on the very first row
  });
});

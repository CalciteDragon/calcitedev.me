import {
  DISSOLVE_RANKS,
  TILE_CELLS,
  TILE_COLS,
  TILE_ROWS,
  buildBlueNoiseRanks,
} from './dissolve-pattern';

describe('buildBlueNoiseRanks', () => {
  it('ranks every cell exactly once', () => {
    const sorted = [...DISSOLVE_RANKS].sort((a, b) => a - b);
    expect(sorted).toEqual(Array.from({ length: TILE_CELLS }, (_, i) => i));
  });

  it('is deterministic, so server and browser renders agree', () => {
    expect(buildBlueNoiseRanks(TILE_COLS, TILE_ROWS)).toEqual(DISSOLVE_RANKS);
  });

  it('spreads early blocks across every row instead of filling rows in turn', () => {
    // The first attempt used a repulsion kernel wider than the tile is tall,
    // which made the fill complete whole rows in lockstep and read as stripes.
    const firstPass = DISSOLVE_RANKS.map((rank, cell) => ({ rank, row: Math.floor(cell / TILE_COLS) }))
      .filter(({ rank }) => rank < TILE_ROWS * 2);
    const rowsTouched = new Set(firstPass.map(({ row }) => row));
    expect(rowsTouched.size).toBe(TILE_ROWS);
  });

  it('keeps per-row coverage balanced at every band threshold', () => {
    for (const coverage of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      const threshold = Math.round(TILE_CELLS * coverage);
      const perRow = new Array<number>(TILE_ROWS).fill(0);
      DISSOLVE_RANKS.forEach((rank, cell) => {
        if (rank < threshold) perRow[Math.floor(cell / TILE_COLS)]++;
      });
      const expected = threshold / TILE_ROWS;
      for (const count of perRow) {
        // Blue noise never lands perfectly even; a third of a row's share is
        // loose enough for that and tight enough to catch a degenerate fill.
        expect(Math.abs(count - expected)).toBeLessThan(expected / 3 + 1);
      }
    }
  });
});

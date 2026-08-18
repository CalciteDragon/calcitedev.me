import { DISSOLVE_BLOCK, DISSOLVE_RANKS, TILE_CELLS, TILE_COLS, TILE_ROWS } from './dissolve-pattern';

/**
 * Height of the dithered ramp, in CSS pixels — 22 blocks. The ramp's bottom
 * edge is pinned to the top of the footer, so trimming rows off the bottom is
 * what slides the whole effect further down the page.
 */
export const DISSOLVE_RAMP_HEIGHT = 220;

/**
 * How sharply coverage accelerates on the way down. Above 1 the ramp opens
 * gently and closes fast, so the page frays before it collapses. Tuned high
 * enough that the last contact card, which sits in the first quarter of the
 * ramp, picks up only a couple of stray blocks near its lower edge instead of
 * a scatter across its text.
 */
const VERTICAL_CURVE = 3.2;

/**
 * How sharply the edge boost ramps in from the centre. Above 1 the middle of
 * the page — where the content sits — stays clear the longest; the closer to 1,
 * the flatter the valley the edges carve.
 */
const EDGE_CURVE = 1.9;

/** Extra downward progress the page edges get, as a fraction of the ramp. */
const EDGE_LEAD = 0.62;

/** Head start the edges begin with, so the corners break up first. */
const EDGE_OFFSET = 0.07;

/** Fraction of the ramp by which coverage reaches solid black. */
const FULL_AT = 0.96;

/**
 * Fraction of blocks that should be black at a point in the ramp.
 *
 * @param tx horizontal position, 0 at the left edge, 1 at the right edge
 * @param ty vertical position, 0 at the top of the ramp, 1 at its bottom
 */
export function dissolveCoverage(tx: number, ty: number): number {
  const edge = Math.pow(Math.abs(tx * 2 - 1), EDGE_CURVE);
  const progress = (ty * (1 + EDGE_LEAD * edge) + EDGE_OFFSET * edge) / FULL_AT;
  return Math.pow(Math.min(Math.max(progress, 0), 1), VERTICAL_CURVE);
}

/**
 * Blue-noise threshold for one block of the grid, in 0-1. The tile wraps
 * toroidally, so sampling it with modulo tiles seamlessly across any width.
 */
export function cellThreshold(col: number, row: number): number {
  const index = (row % TILE_ROWS) * TILE_COLS + (col % TILE_COLS);
  return (DISSOLVE_RANKS[index] + 0.5) / TILE_CELLS;
}

/**
 * Builds the whole dissolve as one SVG path.
 *
 * Coverage varies in two dimensions, which a `<pattern>` cannot express — a
 * pattern tiles uniformly, so it can only shade by row. Splitting the ramp
 * into percentage-width columns or clipping it with a curve both cut blocks
 * mid-edge and lose the square-pixel look, so the grid is laid out against the
 * measured pixel width instead and every block stays whole and on-grid.
 *
 * Runs of adjacent black blocks merge into one rectangle: at high coverage
 * that roughly halves both the path string and the work the rasteriser does.
 *
 * @returns path data, or an empty string before the width is known (server-side
 *   render, where there is no viewport to measure).
 */
export function buildDissolvePath(width: number, height = DISSOLVE_RAMP_HEIGHT): string {
  if (width <= 0 || height <= 0) return '';

  const size = DISSOLVE_BLOCK;
  const cols = Math.ceil(width / size);
  const rows = Math.ceil(height / size);
  // Centre the grid so the partial block at each end matches, keeping the
  // horizontal curve symmetric about the middle of the page.
  const originX = Math.round((width - cols * size) / 2);
  const parts: string[] = [];

  for (let row = 0; row < rows; row++) {
    const ty = (row + 0.5) / rows;
    let runStart = -1;

    for (let col = 0; col <= cols; col++) {
      const filled =
        col < cols &&
        dissolveCoverage((originX + col * size + size / 2) / width, ty) > cellThreshold(col, row);

      if (filled && runStart === -1) {
        runStart = col;
      } else if (!filled && runStart !== -1) {
        const x = originX + runStart * size;
        const run = (col - runStart) * size;
        parts.push(`M${x} ${row * size}h${run}v${size}h-${run}z`);
        runStart = -1;
      }
    }
  }

  return parts.join('');
}

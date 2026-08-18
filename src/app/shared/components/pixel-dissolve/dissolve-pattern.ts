/** Edge length of a single dissolve block, in CSS pixels. */
export const DISSOLVE_BLOCK = 10;

/** Threshold-tile width, in blocks. Wide tiles hide the horizontal repeat. */
export const TILE_COLS = 32;

/**
 * Threshold-tile height, in blocks. Kept at 6 rather than a shorter tile:
 * below ~6 rows the noise has too little vertical room and half-covered
 * regions read as horizontal bars instead of scattered blocks.
 */
export const TILE_ROWS = 6;

export const TILE_CELLS = TILE_COLS * TILE_ROWS;

/**
 * Repulsion radius, in blocks. Must stay well under TILE_ROWS: a kernel as
 * wide as the shorter axis makes vertical repulsion dominate, and the fill
 * degenerates into completing whole rows in lockstep instead of spreading.
 */
const SIGMA = 1;

/**
 * Deterministic tie-break weight, as a fraction of one neighbour's repulsion.
 * Small enough that void-filling still decides placement, large enough to stop
 * a symmetric grid from resolving every tie the same way down a whole row.
 */
const TIE_BREAK = 0.05;

/** Integer hash → [0, 1). Deterministic across server and browser. */
function hashUnit(value: number): number {
  let h = Math.imul(value + 1, 2654435761) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 2246822519) >>> 0;
  h ^= h >>> 13;
  return h / 4294967296;
}

/**
 * Void-and-cluster blue-noise ordering over the tile, wrapping toroidally so
 * neighbouring tiles never collide.
 *
 * Ordered (Bayer) dithering was the first thing tried here and looked wrong:
 * at low coverage every tile lights the same cell, so sparse bands read as a
 * precise lattice of dots rather than as something coming apart. Blue noise
 * puts each new block in the largest remaining gap instead — evenly spread,
 * but with no visible grid.
 *
 * @returns `rank[cell]`, the 0-based order in which each cell turns black.
 *   Because every band takes a prefix of this one ordering, band *n+1* can
 *   only ever add blocks to band *n* — which is what makes the ramp read as a
 *   single dissolve rather than as a stack of unrelated textures.
 */
export function buildBlueNoiseRanks(cols: number, rows: number): readonly number[] {
  const total = cols * rows;
  const energy = new Float64Array(total);
  const rank = new Array<number>(total).fill(-1);
  const falloff = 2 * SIGMA * SIGMA;

  for (let cell = 0; cell < total; cell++) {
    energy[cell] = hashUnit(cell) * TIE_BREAK;
  }

  for (let step = 0; step < total; step++) {
    let best = -1;
    let bestEnergy = Infinity;
    for (let cell = 0; cell < total; cell++) {
      if (rank[cell] === -1 && energy[cell] < bestEnergy) {
        bestEnergy = energy[cell];
        best = cell;
      }
    }

    rank[best] = step;

    const bx = best % cols;
    const by = Math.floor(best / cols);
    for (let cell = 0; cell < total; cell++) {
      const x = cell % cols;
      const y = Math.floor(cell / cols);
      const dx = Math.min(Math.abs(x - bx), cols - Math.abs(x - bx));
      const dy = Math.min(Math.abs(y - by), rows - Math.abs(y - by));
      energy[cell] += Math.exp(-(dx * dx + dy * dy) / falloff);
    }
  }

  return rank;
}

/** Computed once at module load; the ordering has no inputs, so it never changes. */
export const DISSOLVE_RANKS = buildBlueNoiseRanks(TILE_COLS, TILE_ROWS);

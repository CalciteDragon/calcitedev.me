import { summarizeCanvasPerf } from './canvas-perf-benchmark';

describe('summarizeCanvasPerf', () => {
  it('reports distribution and missed-frame metrics', () => {
    const summary = summarizeCanvasPerf([1, 2, 3, 20]);

    expect(summary).toEqual({
      sampleCount: 4,
      medianMs: 3,
      p95Ms: 20,
      maxMs: 20,
      meanMs: 6.5,
      missed60HzFrames: 1,
    });
  });

  it('handles an empty sample set', () => {
    expect(summarizeCanvasPerf([])).toEqual({
      sampleCount: 0,
      medianMs: 0,
      p95Ms: 0,
      maxMs: 0,
      meanMs: 0,
      missed60HzFrames: 0,
    });
  });
});

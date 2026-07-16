import { summarizeCanvasPerf, summarizeLiveCanvasPerf } from './canvas-perf-benchmark';

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

describe('summarizeLiveCanvasPerf', () => {
  it('reports live scheduling and draw latency percentiles', () => {
    const summary = summarizeLiveCanvasPerf([
      { type: 'perf', sequence: 1, sampleToFrameStartMs: 2, drawDurationMs: 1, sampleToFrameEndMs: 3 },
      { type: 'perf', sequence: 2, sampleToFrameStartMs: 6, drawDurationMs: 2, sampleToFrameEndMs: 8 },
    ], 3);

    expect(summary).toEqual({
      sampleCount: 2,
      coalescedUpdates: 3,
      medianSampleToStartMs: 6,
      p95SampleToStartMs: 6,
      medianDrawMs: 2,
      p95DrawMs: 2,
      medianEndToEndMs: 8,
      p95EndToEndMs: 8,
    });
  });
});

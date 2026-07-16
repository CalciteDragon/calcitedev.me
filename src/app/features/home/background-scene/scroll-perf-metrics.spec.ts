import {
  CanvasScrollPerfMetrics,
  canvasScrollPerfEnabled,
  distribution,
} from './scroll-perf-metrics';

describe('CanvasScrollPerfMetrics', () => {
  afterEach(() => vi.restoreAllMocks());

  it('enables only for the scroll benchmark query', () => {
    expect(canvasScrollPerfEnabled('?canvasPerf=scroll')).toBe(true);
    expect(canvasScrollPerfEnabled('', '#canvasPerf=scroll')).toBe(true);
    expect(canvasScrollPerfEnabled('?canvasPerf=benchmark')).toBe(false);
    expect(canvasScrollPerfEnabled('', '#projects')).toBe(false);
  });

  it('summarizes real scroll, worker, draw, and main-frame timings', () => {
    let now = 0;
    const clock = { timeOrigin: 1000, now: () => now } as Performance;
    const target = {} as Window;
    const metrics = new CanvasScrollPerfMetrics(target, clock);
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    metrics.start();
    now = 10;
    metrics.recordScrollEvent();
    metrics.recordFrame(16);
    metrics.recordFrame(33);
    now = 12;
    const request = metrics.createWorkerRequest()!;
    metrics.recordWorkerSample({
      type: 'perf',
      ...request,
      workerReceivedAt: 1013,
      drawStartedAt: 1015,
      drawEndedAt: 1019,
      mainReceivedAt: 1020,
    });
    now = 25;
    const summary = metrics.stop('baseline');

    expect(summary.scrollEvents).toBe(1);
    expect(summary.renderedUpdates).toBe(1);
    expect(summary.mainFrameInterval.medianMs).toBe(17);
    expect(summary.scrollToDrawStart.medianMs).toBe(5);
    expect(summary.workerQueue.medianMs).toBe(2);
    expect(summary.draw.medianMs).toBe(4);
    expect(summary.scrollToMainReceipt.medianMs).toBe(10);
    expect(infoSpy).toHaveBeenCalledWith('[canvas-scroll-perf]', expect.any(String));
  });

  it('reports percentiles and empty distributions', () => {
    expect(distribution([])).toEqual({ sampleCount: 0, medianMs: 0, p95Ms: 0, maxMs: 0 });
    expect(distribution([4, 1, 3, 2])).toEqual({
      sampleCount: 4,
      medianMs: 3,
      p95Ms: 4,
      maxMs: 4,
    });
  });

  it('exposes inert DOM controls for browser-driven scroll runs', () => {
    const metrics = new CanvasScrollPerfMetrics(window, performance);
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    document.querySelector<HTMLButtonElement>('#canvas-scroll-perf-start')?.click();
    document.querySelector<HTMLButtonElement>('#canvas-scroll-perf-stop')?.click();

    expect(document.querySelector('#canvas-scroll-perf-output')?.textContent).toContain('scroll-run');
    metrics.destroy();
    expect(document.querySelector('#canvas-scroll-perf-output')).toBeNull();
    infoSpy.mockRestore();
  });
});

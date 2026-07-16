/// <reference lib="webworker" />

import { MountainRenderer } from './mountain-renderer';
import { DEFAULT_MOUNTAIN_CONFIG } from './mountain.config';
import type { MountainWorkerMsg, MountainWorkerPerfSample } from './mountain-worker.protocol';
import { CoalescedTaskScheduler } from './coalesced-task-scheduler';

let renderer: MountainRenderer | null = null;
let dirty = false;
let metricsEnabled = false;
let latestSample: { sequence: number; sampledAt: number } | null = null;
const drawScheduler = new CoalescedTaskScheduler(
  callback => { self.setTimeout(callback, 0); },
  drawPending,
);

/** Coalesce queued state changes, then draw without waiting for worker-vsync. */
function invalidate(): void {
  dirty = true;
  drawScheduler.invalidate();
}

function drawPending(): void {
  if (dirty && renderer) {
    dirty = false;

    const frameStart = absoluteNow();
    renderer.draw();
    const frameEnd = absoluteNow();
    if (metricsEnabled && latestSample) {
      const sample: MountainWorkerPerfSample = {
        type: 'perf',
        sequence: latestSample.sequence,
        sampleToFrameStartMs: frameStart - latestSample.sampledAt,
        drawDurationMs: frameEnd - frameStart,
        sampleToFrameEndMs: frameEnd - latestSample.sampledAt,
      };
      self.postMessage(sample);
      latestSample = null;
    }
  }
}

self.addEventListener('message', ({ data }: MessageEvent<MountainWorkerMsg>) => {
  switch (data.type) {
    case 'init':
      metricsEnabled = Boolean(data.metricsEnabled);
      renderer = new MountainRenderer(data.canvas);
      renderer.setConfig({ ...DEFAULT_MOUNTAIN_CONFIG, camY: data.camY });
      renderer.resize(data.width, data.height);
      // The first paint must run in worker-rAF so the transferred canvas has
      // joined the browser's rendering lifecycle before its bitmap is shown.
      requestAnimationFrame(() => renderer?.draw());
      break;

    case 'resize':
      renderer?.resize(data.width, data.height);
      invalidate();
      break;

    case 'config':
      renderer?.setConfig(data.config);
      invalidate();
      break;

    case 'camY':
      renderer?.setCamY(data.value);
      if (metricsEnabled && data.sequence !== undefined && data.sampledAt !== undefined) {
        latestSample = { sequence: data.sequence, sampledAt: data.sampledAt };
      }
      invalidate();
      break;
  }
});

function absoluteNow(): number {
  return performance.timeOrigin + performance.now();
}

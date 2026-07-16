/// <reference lib="webworker" />

import { MountainRenderer } from './mountain-renderer';
import { DEFAULT_MOUNTAIN_CONFIG } from './mountain.config';
import type {
  MountainWorkerMsg,
  MountainWorkerPerfRequest,
  MountainWorkerPerfSample,
} from './mountain-worker.protocol';

let renderer: MountainRenderer | null = null;
let dirty = false;
let pendingPerf: (MountainWorkerPerfRequest & { workerReceivedAt: number }) | null = null;

function loop(): void {
  if (dirty && renderer) {
    const perf = pendingPerf;
    const drawStartedAt = absoluteNow();
    renderer.draw();
    const drawEndedAt = absoluteNow();
    if (perf) {
      self.postMessage({
        type: 'perf',
        ...perf,
        drawStartedAt,
        drawEndedAt,
        mainReceivedAt: 0,
      } satisfies MountainWorkerPerfSample);
    }
    pendingPerf = null;
    dirty = false;
  }
  requestAnimationFrame(loop);
}

self.addEventListener('message', ({ data }: MessageEvent<MountainWorkerMsg>) => {
  switch (data.type) {
    case 'init':
      renderer = new MountainRenderer(data.canvas);
      renderer.setConfig(DEFAULT_MOUNTAIN_CONFIG);
      renderer.resize(data.width, data.height);
      dirty = true;
      requestAnimationFrame(loop); // starts the loop once; loop() self-reschedules perpetually
      break;

    case 'resize':
      renderer?.resize(data.width, data.height);
      dirty = true;
      break;

    case 'config':
      renderer?.setConfig(data.config);
      dirty = true;
      break;

    case 'camY':
      renderer?.setCamY(data.value);
      pendingPerf = data.perf
        ? { ...data.perf, workerReceivedAt: absoluteNow() }
        : null;
      dirty = true;
      break;
  }
});

function absoluteNow(): number {
  return performance.timeOrigin + performance.now();
}

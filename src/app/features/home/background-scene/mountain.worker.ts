/// <reference lib="webworker" />

import { MountainRenderer } from './mountain-renderer';
import { DEFAULT_MOUNTAIN_CONFIG } from './mountain.config';
import type { MountainWorkerMsg } from './mountain-worker.protocol';

let renderer: MountainRenderer | null = null;
let frameRequestId: number | null = null;

/** Coalesce all state changes received before the next worker frame. */
function invalidate(): void {
  if (frameRequestId !== null) return;

  frameRequestId = requestAnimationFrame(() => {
    frameRequestId = null;
    renderer?.draw();
  });
}

self.addEventListener('message', ({ data }: MessageEvent<MountainWorkerMsg>) => {
  switch (data.type) {
    case 'init':
      renderer = new MountainRenderer(data.canvas);
      renderer.setConfig({ ...DEFAULT_MOUNTAIN_CONFIG, camY: data.camY });
      renderer.resize(data.width, data.height);
      invalidate();
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
      invalidate();
      break;
  }
});

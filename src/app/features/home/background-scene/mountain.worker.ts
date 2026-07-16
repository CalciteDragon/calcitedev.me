/// <reference lib="webworker" />

import { MountainRenderer } from './mountain-renderer';
import { DEFAULT_MOUNTAIN_CONFIG } from './mountain.config';
import type { MountainWorkerMsg } from './mountain-worker.protocol';

let renderer: MountainRenderer | null = null;
let dirty = false;

function loop(): void {
  if (dirty && renderer) {
    renderer.draw();
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
      dirty = true;
      break;
  }
});

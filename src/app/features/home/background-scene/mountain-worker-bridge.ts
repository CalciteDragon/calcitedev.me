import type {
  MountainWorkerMsg,
  MountainWorkerPerfRequest,
  MountainWorkerPerfSample,
} from './mountain-worker.protocol';
import type { MountainConfig } from './mountain.config';

/**
 * Typed wrapper around the mountain web worker.
 * Mirrors the MountainRenderer public API so BackgroundSceneComponent
 * needs no knowledge of Worker mechanics.
 */
export class MountainWorkerBridge {
  private readonly worker: Worker;

  constructor(onPerfSample?: (sample: MountainWorkerPerfSample) => void) {
    this.worker = new Worker(
      new URL('./mountain.worker', import.meta.url),
      { type: 'module' },
    );
    if (onPerfSample) {
      this.worker.addEventListener('message', ({ data }: MessageEvent<MountainWorkerPerfSample>) => {
        if (data.type === 'perf') {
          onPerfSample({ ...data, mainReceivedAt: absoluteNow() });
        }
      });
    }
  }

  /** Transfer canvas control to the worker and start the render loop. */
  init(canvas: HTMLCanvasElement, width: number, height: number): void {
    const offscreen = canvas.transferControlToOffscreen();
    const msg: MountainWorkerMsg = { type: 'init', canvas: offscreen, width, height };
    this.worker.postMessage(msg, [offscreen]);
  }

  resize(width: number, height: number): void {
    this.worker.postMessage({ type: 'resize', width, height } satisfies MountainWorkerMsg);
  }

  setConfig(config: MountainConfig): void {
    this.worker.postMessage({ type: 'config', config } satisfies MountainWorkerMsg);
  }

  /** Fire-and-forget camY update — < 0.1 ms on the main thread. */
  setCamY(value: number, perf?: MountainWorkerPerfRequest): void {
    this.worker.postMessage({ type: 'camY', value, perf } satisfies MountainWorkerMsg);
  }

  destroy(): void {
    this.worker.terminate();
  }
}

function absoluteNow(): number {
  return performance.timeOrigin + performance.now();
}

import type { MountainWorkerMsg } from './mountain-worker.protocol';
import type { MountainConfig } from './mountain.config';

/**
 * Typed wrapper around the mountain web worker.
 * Mirrors the MountainRenderer public API so BackgroundSceneComponent
 * needs no knowledge of Worker mechanics.
 */
export class MountainWorkerBridge {
  private readonly worker: Worker;
  private lastCamY: number | null = null;

  constructor() {
    this.worker = new Worker(
      new URL('./mountain.worker', import.meta.url),
      { type: 'module' },
    );
  }

  /** Transfer canvas control and provide the camera for the worker's first draw. */
  init(canvas: HTMLCanvasElement, width: number, height: number, camY: number): void {
    const offscreen = canvas.transferControlToOffscreen();
    this.lastCamY = camY;
    const msg: MountainWorkerMsg = { type: 'init', canvas: offscreen, width, height, camY };
    this.worker.postMessage(msg, [offscreen]);
  }

  resize(width: number, height: number): void {
    this.worker.postMessage({ type: 'resize', width, height } satisfies MountainWorkerMsg);
  }

  setConfig(config: MountainConfig): void {
    this.lastCamY = config.camY;
    this.worker.postMessage({ type: 'config', config } satisfies MountainWorkerMsg);
  }

  /** Fire-and-forget camera update, suppressing values the worker already has. */
  setCamY(value: number): void {
    if (value === this.lastCamY) return;

    this.lastCamY = value;
    this.worker.postMessage({ type: 'camY', value } satisfies MountainWorkerMsg);
  }

  destroy(): void {
    this.worker.terminate();
  }
}

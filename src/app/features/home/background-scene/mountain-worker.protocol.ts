import type { MountainConfig } from './mountain.config';

export type MountainWorkerMsg =
  | {
      type: 'init';
      canvas: OffscreenCanvas;
      width: number;
      height: number;
      camY: number;
      metricsEnabled?: boolean;
    }
  | { type: 'resize'; width: number; height: number }
  | { type: 'config'; config: MountainConfig }
  | { type: 'camY';   value: number; sequence?: number; sampledAt?: number };

export interface MountainWorkerPerfSample {
  type: 'perf';
  sequence: number;
  sampleToFrameStartMs: number;
  drawDurationMs: number;
  sampleToFrameEndMs: number;
}

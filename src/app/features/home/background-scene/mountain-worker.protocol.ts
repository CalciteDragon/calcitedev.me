import type { MountainConfig } from './mountain.config';

export type MountainWorkerMsg =
  | { type: 'init';   canvas: OffscreenCanvas; width: number; height: number }
  | { type: 'resize'; width: number; height: number }
  | { type: 'config'; config: MountainConfig }
  | { type: 'camY';   value: number; perf?: MountainWorkerPerfRequest };

export interface MountainWorkerPerfRequest {
  sequence: number;
  scrollEventAt: number;
  postedAt: number;
}

export interface MountainWorkerPerfSample extends MountainWorkerPerfRequest {
  type: 'perf';
  workerReceivedAt: number;
  drawStartedAt: number;
  drawEndedAt: number;
  mainReceivedAt: number;
}

import type { MountainConfig } from './mountain.config';

export type MountainWorkerMsg =
  | { type: 'init';   canvas: OffscreenCanvas; width: number; height: number }
  | { type: 'resize'; width: number; height: number }
  | { type: 'config'; config: MountainConfig }
  | { type: 'camY';   value: number };

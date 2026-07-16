import { DEFAULT_MOUNTAIN_CONFIG } from './mountain.config';
import { MountainRenderer } from './mountain-renderer';

export interface CanvasPerfSummary {
  sampleCount: number;
  medianMs: number;
  p95Ms: number;
  maxMs: number;
  meanMs: number;
  missed60HzFrames: number;
}

interface CanvasPerfGlobal {
  __canvasPerfResults?: CanvasPerfSummary;
}

const WARMUP_FRAMES = 12;
const SAMPLE_FRAMES = 120;
const FRAME_BUDGET_60HZ_MS = 1000 / 60;

/**
 * Opt-in diagnostic benchmark used through `?canvasPerf=benchmark`.
 * It renders the production terrain into an isolated canvas so command count,
 * raster work, and JavaScript execution are timed together without scrolling.
 */
export async function runCanvasPerfBenchmark(width: number, height: number): Promise<CanvasPerfSummary> {
  const canvas = typeof OffscreenCanvas === 'function'
    ? new OffscreenCanvas(width, height)
    : createFallbackCanvas(width, height);
  const renderer = new MountainRenderer(canvas);
  renderer.setConfig(DEFAULT_MOUNTAIN_CONFIG);
  renderer.resize(width, height);

  for (let i = 0; i < WARMUP_FRAMES; i++) {
    renderer.setCamY(cameraPosition(i));
    renderer.draw();
  }

  const samples: number[] = [];
  for (let i = 0; i < SAMPLE_FRAMES; i++) {
    await nextAnimationFrame();
    renderer.setCamY(cameraPosition(i + WARMUP_FRAMES));
    const start = performance.now();
    renderer.draw();
    samples.push(performance.now() - start);
  }

  const summary = summarizeCanvasPerf(samples);
  (globalThis as unknown as CanvasPerfGlobal).__canvasPerfResults = summary;
  console.info('[canvas-perf]', JSON.stringify(summary));
  return summary;
}

export function summarizeCanvasPerf(samples: number[]): CanvasPerfSummary {
  const sorted = [...samples].sort((a, b) => a - b);
  const total = samples.reduce((sum, sample) => sum + sample, 0);
  return {
    sampleCount: samples.length,
    medianMs: round(percentile(sorted, 0.5)),
    p95Ms: round(percentile(sorted, 0.95)),
    maxMs: round(sorted.at(-1) ?? 0),
    meanMs: round(samples.length > 0 ? total / samples.length : 0),
    missed60HzFrames: samples.filter(sample => sample > FRAME_BUDGET_60HZ_MS).length,
  };
}

function cameraPosition(frame: number): number {
  return -3 + (frame % 120) / 120 * 4;
}

function percentile(sorted: number[], fraction: number): number {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))];
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function nextAnimationFrame(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

function createFallbackCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

import { DEFAULT_MOUNTAIN_CONFIG } from './mountain.config';
import { MountainRenderer } from './mountain-renderer';
import type { MountainWorkerPerfSample } from './mountain-worker.protocol';
import { SceneRenderer } from './scene-renderer';
import { defaultConfig } from './scene-entities';

export interface CanvasPerfSummary {
  sampleCount: number;
  medianMs: number;
  p95Ms: number;
  maxMs: number;
  meanMs: number;
  missed60HzFrames: number;
}

export interface LiveCanvasPerfSummary {
  sampleCount: number;
  coalescedUpdates: number;
  medianSampleToStartMs: number;
  p95SampleToStartMs: number;
  medianDrawMs: number;
  p95DrawMs: number;
  medianEndToEndMs: number;
  p95EndToEndMs: number;
}

interface CanvasPerfGlobal {
  __canvasPerfResults?: CanvasPerfSummary;
  __canvasLivePerfResults?: LiveCanvasPerfSummary;
}

const WARMUP_FRAMES = 12;
const SAMPLE_FRAMES = 120;
const FRAME_BUDGET_60HZ_MS = 1000 / 60;
const LIVE_SAMPLE_WINDOW = 10;

export class LiveCanvasPerfCollector {
  private samples: MountainWorkerPerfSample[] = [];
  private lastSequence = 0;
  private coalescedUpdates = 0;

  record(sample: MountainWorkerPerfSample): void {
    if (this.lastSequence > 0) {
      this.coalescedUpdates += Math.max(0, sample.sequence - this.lastSequence - 1);
    }
    this.lastSequence = sample.sequence;
    this.samples.push(sample);

    if (this.samples.length < LIVE_SAMPLE_WINDOW) return;

    const summary = summarizeLiveCanvasPerf(this.samples, this.coalescedUpdates);
    (globalThis as unknown as CanvasPerfGlobal).__canvasLivePerfResults = summary;
    console.info('[canvas-perf-live]', JSON.stringify(summary));
    this.samples = [];
    this.coalescedUpdates = 0;
  }
}

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
  await runScenePerfBenchmark(width, height);
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

export function summarizeLiveCanvasPerf(
  samples: MountainWorkerPerfSample[],
  coalescedUpdates: number,
): LiveCanvasPerfSummary {
  const sampleToStart = sortedValues(samples.map(sample => sample.sampleToFrameStartMs));
  const draw = sortedValues(samples.map(sample => sample.drawDurationMs));
  const endToEnd = sortedValues(samples.map(sample => sample.sampleToFrameEndMs));
  return {
    sampleCount: samples.length,
    coalescedUpdates,
    medianSampleToStartMs: round(percentile(sampleToStart, 0.5)),
    p95SampleToStartMs: round(percentile(sampleToStart, 0.95)),
    medianDrawMs: round(percentile(draw, 0.5)),
    p95DrawMs: round(percentile(draw, 0.95)),
    medianEndToEndMs: round(percentile(endToEnd, 0.5)),
    p95EndToEndMs: round(percentile(endToEnd, 0.95)),
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

function sortedValues(values: number[]): number[] {
  return values.sort((a, b) => a - b);
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

async function runScenePerfBenchmark(width: number, height: number): Promise<void> {
  const canvas = document.createElement('canvas');
  const renderer = new SceneRenderer(canvas, defaultConfig(false));
  renderer.resize(width, height);

  for (let i = 0; i < WARMUP_FRAMES; i++) renderer.drawFrame(i * 16, i * 12);

  const samples: number[] = [];
  for (let i = 0; i < SAMPLE_FRAMES; i++) {
    await nextAnimationFrame();
    const start = performance.now();
    renderer.drawFrame(i * 16, i * 12);
    samples.push(performance.now() - start);
  }

  renderer.destroy();
  console.info('[canvas-perf-scene]', JSON.stringify(summarizeCanvasPerf(samples)));
}

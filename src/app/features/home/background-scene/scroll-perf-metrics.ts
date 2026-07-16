import type {
  MountainWorkerPerfRequest,
  MountainWorkerPerfSample,
} from './mountain-worker.protocol';

export interface PerfDistribution {
  sampleCount: number;
  medianMs: number;
  p95Ms: number;
  maxMs: number;
}

export interface CanvasScrollPerfSummary {
  label: string;
  durationMs: number;
  scrollEvents: number;
  postedUpdates: number;
  renderedUpdates: number;
  coalescedUpdates: number;
  mainFrameInterval: PerfDistribution & { over20Ms: number; over34Ms: number };
  scrollToWorkerReceive: PerfDistribution;
  scrollToDrawStart: PerfDistribution;
  workerQueue: PerfDistribution;
  draw: PerfDistribution;
  scrollToMainReceipt: PerfDistribution;
}

export interface CanvasScrollPerfController {
  start(): void;
  stop(label?: string): CanvasScrollPerfSummary;
}

declare global {
  interface Window {
    __canvasScrollPerf?: CanvasScrollPerfController;
    __canvasScrollPerfLast?: CanvasScrollPerfSummary;
  }
}

const SCROLL_ACTIVITY_WINDOW_MS = 120;

/**
 * Opt-in measurement of the production scroll path. It remains inert unless
 * `?canvasPerf=scroll` is present, and logs only after a run so logging itself
 * cannot disturb the measured frames.
 */
export class CanvasScrollPerfMetrics implements CanvasScrollPerfController {
  private active = false;
  private startedAt = 0;
  private sequence = 0;
  private scrollEvents = 0;
  private postedUpdates = 0;
  private lastScrollEventAt: number | null = null;
  private lastFrameTimestamp: number | null = null;
  private readonly frameIntervals: number[] = [];
  private readonly workerSamples: MountainWorkerPerfSample[] = [];

  constructor(
    private readonly target: Window,
    private readonly clock: Performance,
  ) {
    target.__canvasScrollPerf = this;
  }

  start(): void {
    this.active = true;
    this.startedAt = this.absoluteNow();
    this.sequence = 0;
    this.scrollEvents = 0;
    this.postedUpdates = 0;
    this.lastScrollEventAt = null;
    this.lastFrameTimestamp = null;
    this.frameIntervals.length = 0;
    this.workerSamples.length = 0;
  }

  stop(label = 'scroll-run'): CanvasScrollPerfSummary {
    const summary = this.summarize(label);
    this.active = false;
    this.target.__canvasScrollPerfLast = summary;
    console.info('[canvas-scroll-perf]', JSON.stringify(summary));
    return summary;
  }

  recordScrollEvent(): void {
    if (!this.active) return;
    this.scrollEvents++;
    this.lastScrollEventAt = this.absoluteNow();
  }

  recordFrame(timestamp: number): void {
    if (!this.active) return;

    const lastTimestamp = this.lastFrameTimestamp;
    this.lastFrameTimestamp = timestamp;
    if (
      lastTimestamp === null ||
      this.lastScrollEventAt === null ||
      this.absoluteNow() - this.lastScrollEventAt > SCROLL_ACTIVITY_WINDOW_MS
    ) return;

    this.frameIntervals.push(timestamp - lastTimestamp);
  }

  createWorkerRequest(): MountainWorkerPerfRequest | undefined {
    if (!this.active || this.lastScrollEventAt === null) return undefined;
    this.postedUpdates++;
    return {
      sequence: ++this.sequence,
      scrollEventAt: this.lastScrollEventAt,
      postedAt: this.absoluteNow(),
    };
  }

  recordWorkerSample(sample: MountainWorkerPerfSample): void {
    if (this.active) this.workerSamples.push(sample);
  }

  destroy(): void {
    if (this.target.__canvasScrollPerf === this) delete this.target.__canvasScrollPerf;
  }

  private summarize(label: string): CanvasScrollPerfSummary {
    const now = this.absoluteNow();
    const samples = this.workerSamples;
    return {
      label,
      durationMs: round(now - this.startedAt),
      scrollEvents: this.scrollEvents,
      postedUpdates: this.postedUpdates,
      renderedUpdates: samples.length,
      coalescedUpdates: Math.max(0, this.postedUpdates - samples.length),
      mainFrameInterval: {
        ...distribution(this.frameIntervals),
        over20Ms: this.frameIntervals.filter(value => value > 20).length,
        over34Ms: this.frameIntervals.filter(value => value > 34).length,
      },
      scrollToWorkerReceive: distribution(
        samples.map(sample => sample.workerReceivedAt - sample.scrollEventAt),
      ),
      scrollToDrawStart: distribution(
        samples.map(sample => sample.drawStartedAt - sample.scrollEventAt),
      ),
      workerQueue: distribution(
        samples.map(sample => sample.drawStartedAt - sample.workerReceivedAt),
      ),
      draw: distribution(
        samples.map(sample => sample.drawEndedAt - sample.drawStartedAt),
      ),
      scrollToMainReceipt: distribution(
        samples.map(sample => sample.mainReceivedAt - sample.scrollEventAt),
      ),
    };
  }

  private absoluteNow(): number {
    return this.clock.timeOrigin + this.clock.now();
  }
}

export function canvasScrollPerfEnabled(search: string): boolean {
  return new URLSearchParams(search).get('canvasPerf') === 'scroll';
}

export function distribution(samples: number[]): PerfDistribution {
  const sorted = [...samples].sort((a, b) => a - b);
  return {
    sampleCount: sorted.length,
    medianMs: round(percentile(sorted, 0.5)),
    p95Ms: round(percentile(sorted, 0.95)),
    maxMs: round(sorted.at(-1) ?? 0),
  };
}

function percentile(sorted: number[], fraction: number): number {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))];
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

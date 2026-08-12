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
  scrollEventInterval: PerfDistribution;
  workerDrawInterval: PerfDistribution & { over20Ms: number; over34Ms: number };
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
const TRACE_FRAMES_PER_DIRECTION = 30;

/**
 * Opt-in measurement of the production scroll path. It remains inert unless
 * `?canvasPerf=scroll` is present, and logs only after a run so logging itself
 * cannot disturb the measured frames.
 */
export class CanvasScrollPerfMetrics implements CanvasScrollPerfController {
  private active = false;
  private traceRun = 0;
  private startedAt = 0;
  private sequence = 0;
  private scrollEvents = 0;
  private postedUpdates = 0;
  private lastScrollEventAt: number | null = null;
  private lastFrameTimestamp: number | null = null;
  private readonly frameIntervals: number[] = [];
  private readonly scrollEventTimes: number[] = [];
  private readonly workerSamples: MountainWorkerPerfSample[] = [];
  private controls: HTMLElement | null = null;
  private output: HTMLOutputElement | null = null;

  constructor(
    private readonly target: Window,
    private readonly clock: Performance,
  ) {
    target.__canvasScrollPerf = this;
    this.installDomControls();
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
    this.scrollEventTimes.length = 0;
    this.workerSamples.length = 0;
    if (this.output) {
      delete this.output.dataset['summary'];
      this.output.dataset['state'] = 'recording';
    }
  }

  stop(label = 'scroll-run'): CanvasScrollPerfSummary {
    const summary = this.summarize(label);
    this.active = false;
    this.traceRun++;
    this.target.__canvasScrollPerfLast = summary;
    if (this.output) {
      const serialized = JSON.stringify(summary);
      this.output.value = serialized;
      this.output.textContent = serialized;
      this.output.dataset['summary'] = serialized;
      this.output.dataset['state'] = 'complete';
    }
    console.info('[canvas-scroll-perf]', JSON.stringify(summary));
    return summary;
  }

  recordScrollEvent(): void {
    if (!this.active) return;
    this.scrollEvents++;
    this.lastScrollEventAt = this.absoluteNow();
    this.scrollEventTimes.push(this.lastScrollEventAt);
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
    this.controls?.remove();
  }

  private summarize(label: string): CanvasScrollPerfSummary {
    const now = this.absoluteNow();
    const samples = this.workerSamples;
    const workerDrawIntervals = intervals(samples.map(sample => sample.drawStartedAt));
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
      scrollEventInterval: distribution(intervals(this.scrollEventTimes)),
      workerDrawInterval: {
        ...distribution(workerDrawIntervals),
        over20Ms: workerDrawIntervals.filter(value => value > 20).length,
        over34Ms: workerDrawIntervals.filter(value => value > 34).length,
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

  private installDomControls(): void {
    const document = this.target.document;
    if (!document?.body) return;

    const controls = document.createElement('div');
    controls.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483647;';
    controls.dataset['canvasScrollPerf'] = 'ready';

    const start = document.createElement('button');
    start.id = 'canvas-scroll-perf-start';
    start.textContent = 'Start canvas scroll metrics';
    start.addEventListener('click', () => this.start());

    const stop = document.createElement('button');
    stop.id = 'canvas-scroll-perf-stop';
    stop.textContent = 'Stop canvas scroll metrics';
    stop.addEventListener('click', () => this.stop(stop.dataset['label'] ?? 'scroll-run'));

    const run = document.createElement('button');
    run.id = 'canvas-scroll-perf-run';
    run.textContent = 'Run canvas scroll metrics';
    run.addEventListener('click', () => void this.runScrollTrace());

    this.output = document.createElement('output');
    this.output.id = 'canvas-scroll-perf-output';
    this.output.hidden = true;
    controls.append(run, start, stop, this.output);
    document.body.append(controls);
    this.controls = controls;
  }

  private async runScrollTrace(): Promise<void> {
    if (this.active) return;
    const traceRun = ++this.traceRun;
    const maxScroll = Math.max(
      0,
      this.target.document.documentElement.scrollHeight - this.target.innerHeight,
    );
    const root = this.target.document.documentElement;
    const originalScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    root.scrollTop = 0;
    this.start();

    await new Promise<void>(resolve => {
      let frame = 0;
      const totalFrames = TRACE_FRAMES_PER_DIRECTION * 2;
      const step = (): void => {
        if (traceRun !== this.traceRun) {
          resolve();
          return;
        }
        const directionalFrame = frame <= TRACE_FRAMES_PER_DIRECTION
          ? frame
          : totalFrames - frame;
        root.scrollTop = Math.round(
          maxScroll * directionalFrame / TRACE_FRAMES_PER_DIRECTION,
        );
        frame++;
        if (frame <= totalFrames) {
          this.target.requestAnimationFrame(step);
        } else {
          resolve();
        }
      };
      this.target.requestAnimationFrame(step);
    });

    root.style.scrollBehavior = originalScrollBehavior;
    if (traceRun !== this.traceRun) return;
    await new Promise(resolve => this.target.setTimeout(resolve, 100));
    if (traceRun !== this.traceRun) return;
    this.stop('standard-scroll-trace');
  }
}

export function canvasScrollPerfEnabled(search: string, hash = ''): boolean {
  const queryMode = new URLSearchParams(search).get('canvasPerf');
  const fragmentMode = new URLSearchParams(hash.replace(/^#/, '')).get('canvasPerf');
  return queryMode === 'scroll' || fragmentMode === 'scroll';
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

function intervals(timestamps: number[]): number[] {
  return timestamps.slice(1).map((timestamp, index) => timestamp - timestamps[index]);
}

function percentile(sorted: number[], fraction: number): number {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))];
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

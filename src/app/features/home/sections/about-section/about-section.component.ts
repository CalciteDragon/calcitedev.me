import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  computed,
  inject,
  input,
  isDevMode,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Bio } from '../../../../models/bio.model';
import { SectionHeaderComponent } from '../../../../shared/components/section-header/section-header.component';
import { ScrollRevealDirective } from '../../../../shared/directives/scroll-reveal.directive';

const SCROLL_SMOOTHING_TIME_MS = 90;
const PROGRESS_SETTLE_THRESHOLD = 0.0005;
const TILT_SETTLE_THRESHOLD = 0.01;
const RAIL_START_VIEWPORT_LINE = 0.6;
const RAIL_END_PAGE_PROGRESS = 0.46;

export function aboutScrollDebugEnabled(search: string, hash = ''): boolean {
  const queryMode = new URLSearchParams(search).get('aboutDebug');
  const fragmentMode = new URLSearchParams(hash.replace(/^#/, '')).get('aboutDebug');
  return queryMode === 'scroll' || fragmentMode === 'scroll';
}

export function aboutRailProgressForGeometry(
  firstNodeCenter: number,
  viewportHeight: number,
  scrollY: number,
  maximumPageScroll: number,
): number {
  if (maximumPageScroll < 1) return 0;

  const startScroll = scrollY + firstNodeCenter - viewportHeight * RAIL_START_VIEWPORT_LINE;
  const endScroll = maximumPageScroll * RAIL_END_PAGE_PROGRESS;
  const travel = endScroll - startScroll;
  if (travel < 1) return 0;

  return (scrollY - startScroll) / travel;
}

export function closestTimelineNodeIndex(
  progress: number,
  nodeProgresses: readonly number[],
): number {
  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;

  nodeProgresses.forEach((nodeProgress, index) => {
    const distance = Math.abs(nodeProgress - progress);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
}

@Component({
  selector: 'app-about-section',
  standalone: true,
  imports: [SectionHeaderComponent, ScrollRevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './about-section.component.html',
  styleUrl: './about-section.component.scss',
})
export class AboutSectionComponent implements AfterViewInit, OnDestroy {
  readonly bio = input.required<Bio>();
  protected readonly showScrollDebug = signal(false);
  protected readonly activeEntryIndex = signal(0);
  protected readonly timelineProgress = signal(0);
  protected readonly timelineTargetProgress = signal(0);
  protected readonly rawTimelineProgress = signal(0);
  protected readonly pageScrollY = signal(0);
  protected readonly pageProgress = signal(0);
  protected readonly sectionProgress = signal(0);
  protected readonly timelineRailTop = signal('1.5rem');
  protected readonly timelineRailHeight = signal('calc(100% - 3rem)');
  protected readonly timelineBlueStop = signal('33%');
  protected readonly timelinePurpleStop = signal('66%');
  protected readonly activeTone = computed(
    () => this.bio().about.history[this.activeEntryIndex()]?.tone ?? 'cyan',
  );
  private readonly entryTilts = signal<readonly number[]>([]);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private animationFrame: number | null = null;
  private reducedMotionQuery: MediaQueryList | null = null;
  private nodeProgresses: readonly number[] = [];
  private targetTilts: readonly number[] = [];
  private targetProgress = 0;
  private needsMeasurement = false;
  private lastFrameTimestamp: number | null = null;
  private prefersReducedMotion = false;

  private readonly onViewportChange = (): void => {
    this.needsMeasurement = true;
    this.scheduleAnimationFrame();
  };

  private readonly onMotionPreferenceChange = (event: MediaQueryListEvent): void => {
    this.prefersReducedMotion = event.matches;
    this.needsMeasurement = true;
    this.scheduleAnimationFrame();
  };

  private readonly animateTimeline = (timestamp: number): void => {
    this.animationFrame = null;

    if (this.needsMeasurement) {
      this.needsMeasurement = false;
      if (!this.measureTimelineTargets()) return;
    }

    if (this.prefersReducedMotion) {
      this.applyTargetState();
      this.lastFrameTimestamp = null;
      return;
    }

    const elapsed =
      this.lastFrameTimestamp === null
        ? 1000 / 60
        : Math.min(Math.max(timestamp - this.lastFrameTimestamp, 0), 64);
    this.lastFrameTimestamp = timestamp;
    const smoothingFactor = 1 - Math.exp(-elapsed / SCROLL_SMOOTHING_TIME_MS);
    const currentTilts = this.entryTilts();
    const nextTilts = this.targetTilts.map((target, index) => {
      const current = currentTilts[index] ?? target;
      return current + (target - current) * smoothingFactor;
    });
    const currentProgress = this.timelineProgress();
    const nextProgress =
      currentProgress + (this.targetProgress - currentProgress) * smoothingFactor;
    const progressSettled =
      Math.abs(this.targetProgress - nextProgress) <= PROGRESS_SETTLE_THRESHOLD;
    const tiltsSettled = nextTilts.every(
      (tilt, index) =>
        Math.abs((this.targetTilts[index] ?? tilt) - tilt) <= TILT_SETTLE_THRESHOLD,
    );

    if (progressSettled && tiltsSettled) {
      this.applyTargetState();
      this.lastFrameTimestamp = null;
      return;
    }

    this.entryTilts.set(nextTilts);
    this.timelineProgress.set(nextProgress);
    this.updateActiveEntry(nextProgress);
    this.scheduleAnimationFrame();
  };

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.showScrollDebug.set(
      isDevMode() && aboutScrollDebugEnabled(window.location.search, window.location.hash),
    );

    if (typeof window.matchMedia === 'function') {
      this.reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.prefersReducedMotion = this.reducedMotionQuery.matches;
      this.reducedMotionQuery.addEventListener?.('change', this.onMotionPreferenceChange);
    }

    if (this.measureTimelineTargets()) this.applyTargetState();
    window.addEventListener('scroll', this.onViewportChange, { passive: true });
    window.addEventListener('resize', this.onViewportChange);
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    window.removeEventListener('scroll', this.onViewportChange);
    window.removeEventListener('resize', this.onViewportChange);
    this.reducedMotionQuery?.removeEventListener?.('change', this.onMotionPreferenceChange);
    if (this.animationFrame !== null) window.cancelAnimationFrame(this.animationFrame);
  }

  protected entryTilt(index: number): number {
    return this.entryTilts()[index] ?? 0;
  }

  protected formatPercent(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
  }

  private scheduleAnimationFrame(): void {
    if (this.animationFrame !== null) return;

    this.animationFrame = window.requestAnimationFrame(this.animateTimeline);
  }

  private measureTimelineTargets(): boolean {
    const viewportHeight = Math.max(window.innerHeight, 1);
    const scrollY = Math.max(window.scrollY, 0);
    const maximumPageScroll = Math.max(
      document.documentElement.scrollHeight - viewportHeight,
      0,
    );
    this.pageScrollY.set(Math.round(scrollY));
    const pageProgress =
      maximumPageScroll === 0 ? 0 : Math.max(0, Math.min(1, scrollY / maximumPageScroll));
    this.pageProgress.set(pageProgress);
    const sectionRect = this.host.nativeElement.getBoundingClientRect();
    const sectionHeight = Math.max(sectionRect.height, 1);
    const sectionProgress = -sectionRect.top / sectionHeight;
    this.sectionProgress.set(sectionProgress);

    const entries = Array.from(
      this.host.nativeElement.querySelectorAll<HTMLElement>('.about-section__entry'),
    );
    if (entries.length === 0) return false;

    const activationLine = viewportHeight * 0.6;
    const centers = entries.map((entry) => {
      const rect = entry.getBoundingClientRect();
      return rect.top + rect.height / 2;
    });

    const tiltRange = viewportHeight * 0.7;
    this.targetTilts = centers.map((center) => {
      const normalizedDistance = (center - activationLine) / tiltRange;
      return Math.max(-1, Math.min(1, normalizedDistance)) * 3.25;
    });

    const timeline = this.host.nativeElement.querySelector<HTMLElement>(
      '.about-section__timeline',
    );
    const nodes = Array.from(
      this.host.nativeElement.querySelectorAll<HTMLElement>('.about-section__node'),
    );
    if (timeline && nodes.length > 0) {
      const timelineTop = timeline.getBoundingClientRect().top;
      const nodeCenters = nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        return rect.top + rect.height / 2;
      });
      const firstNodeCenter = nodeCenters[0];
      const lastNodeCenter = nodeCenters[nodeCenters.length - 1];
      const nodeSpan = Math.max(lastNodeCenter - firstNodeCenter, 1);
      this.nodeProgresses = nodeCenters.map(
        (nodeCenter) => (nodeCenter - firstNodeCenter) / nodeSpan,
      );
      this.timelineRailTop.set(`${firstNodeCenter - timelineTop}px`);
      this.timelineRailHeight.set(`${nodeSpan}px`);
      this.timelineBlueStop.set(this.formatPercent(this.nodeProgresses[1] ?? 1 / 3));
      this.timelinePurpleStop.set(this.formatPercent(this.nodeProgresses[2] ?? 2 / 3));

      const rawTimelineProgress = aboutRailProgressForGeometry(
        firstNodeCenter,
        viewportHeight,
        scrollY,
        maximumPageScroll,
      );
      this.targetProgress = Math.max(0, Math.min(1, rawTimelineProgress));
      this.rawTimelineProgress.set(rawTimelineProgress);
      this.timelineTargetProgress.set(this.targetProgress);
    }

    return true;
  }

  private applyTargetState(): void {
    this.entryTilts.set(this.targetTilts);
    this.timelineProgress.set(this.targetProgress);
    this.updateActiveEntry(this.targetProgress);
  }

  private updateActiveEntry(progress: number): void {
    this.activeEntryIndex.set(closestTimelineNodeIndex(progress, this.nodeProgresses));
  }
}

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
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Bio } from '../../../../models/bio.model';
import { SectionHeaderComponent } from '../../../../shared/components/section-header/section-header.component';
import { ScrollRevealDirective } from '../../../../shared/directives/scroll-reveal.directive';

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
  protected readonly activeEntryIndex = signal(0);
  protected readonly timelineProgress = signal(0);
  protected readonly activeTone = computed(
    () => this.bio().about.history[this.activeEntryIndex()]?.tone ?? 'cyan',
  );
  private readonly entryTilts = signal<readonly number[]>([]);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private scheduledFrame: number | null = null;

  private readonly onViewportChange = (): void => {
    if (this.scheduledFrame !== null) return;

    this.scheduledFrame = window.requestAnimationFrame(() => {
      this.scheduledFrame = null;
      this.updateTimelineState();
    });
  };

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.updateTimelineState();
    window.addEventListener('scroll', this.onViewportChange, { passive: true });
    window.addEventListener('resize', this.onViewportChange);
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    window.removeEventListener('scroll', this.onViewportChange);
    window.removeEventListener('resize', this.onViewportChange);
    if (this.scheduledFrame !== null) window.cancelAnimationFrame(this.scheduledFrame);
  }

  protected entryTilt(index: number): number {
    return this.entryTilts()[index] ?? 0;
  }

  private updateTimelineState(): void {
    const entries = Array.from(
      this.host.nativeElement.querySelectorAll<HTMLElement>('.about-section__entry'),
    );
    if (entries.length === 0) return;

    const viewportHeight = Math.max(window.innerHeight, 1);
    const activationLine = viewportHeight * 0.6;
    const centers = entries.map((entry) => {
      const rect = entry.getBoundingClientRect();
      return rect.top + rect.height / 2;
    });

    let nextActiveIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    centers.forEach((center, index) => {
      const distance = Math.abs(center - activationLine);
      if (distance < closestDistance) {
        closestDistance = distance;
        nextActiveIndex = index;
      }
    });

    const tiltRange = viewportHeight * 0.7;
    const nextTilts = centers.map((center) => {
      const normalizedDistance = (center - activationLine) / tiltRange;
      return Math.max(-1, Math.min(1, normalizedDistance)) * 3.25;
    });
    const firstCenter = centers[0] ?? activationLine;
    const lastCenter = centers.at(-1) ?? firstCenter;
    const timelineRange = Math.max(lastCenter - firstCenter, 1);
    const nextProgress = Math.max(
      0,
      Math.min(1, (activationLine - firstCenter) / timelineRange),
    );

    this.activeEntryIndex.set(nextActiveIndex);
    this.entryTilts.set(nextTilts);
    this.timelineProgress.set(nextProgress);
  }
}

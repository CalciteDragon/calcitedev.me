import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DISSOLVE_RAMP_HEIGHT, buildDissolvePath } from './dissolve-field';

/** Debounce for viewport resizes, matching BackgroundSceneComponent. */
const RESIZE_DEBOUNCE_MS = 100;

/**
 * Blocky "pixel disintegration" that closes the page: a blue-noise dither
 * whose coverage grows non-linearly downward and runs ahead of itself toward
 * the left and right edges, until the page ends on solid black.
 *
 * The host is pulled up over the end of the content with a negative margin, so
 * the ramp visibly begins just above the last contact card. It is `aria-hidden`
 * and `pointer-events: none`, so the content underneath stays readable to
 * assistive tech and clickable with a mouse.
 *
 * Nothing animates — the only runtime work is re-measuring on resize.
 */
@Component({
  selector: 'app-pixel-dissolve',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pixel-dissolve.component.html',
  styleUrl: './pixel-dissolve.component.scss',
})
export class PixelDissolveComponent implements OnDestroy {
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly rampHeight = DISSOLVE_RAMP_HEIGHT;

  /** 0 until measured, which is also the server-side render's state. */
  private readonly width = signal(0);

  protected readonly path = computed(() => buildDissolvePath(this.width()));

  private resizeObserver: ResizeObserver | null = null;
  private resizeTimeout = 0;

  constructor() {
    // afterNextRender is browser-only and runs past change detection, so the
    // first measurement cannot trip an already-checked expression.
    afterNextRender(() => {
      this.measure();
      this.resizeObserver = new ResizeObserver(() => this.scheduleMeasure());
      this.resizeObserver.observe(this.hostRef.nativeElement);
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.resizeTimeout);
    this.resizeObserver?.disconnect();
  }

  private scheduleMeasure(): void {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => this.measure(), RESIZE_DEBOUNCE_MS) as unknown as number;
  }

  private measure(): void {
    this.width.set(Math.round(this.hostRef.nativeElement.clientWidth));
  }
}

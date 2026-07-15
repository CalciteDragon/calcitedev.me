import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  NgZone,
  OnDestroy,
  PLATFORM_ID,
  inject,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SceneRenderer } from './scene-renderer';
import { defaultConfig } from './scene-entities';
import { MountainWorkerBridge } from './mountain-worker-bridge';
import { DEFAULT_MOUNTAIN_CONFIG } from './mountain.config';

@Component({
  selector: 'app-background-scene',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './background-scene.component.html',
  styleUrl: './background-scene.component.scss',
})
export class BackgroundSceneComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly ngZone = inject(NgZone);
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly mountainCanvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('mountainCanvas');

  private renderer: SceneRenderer | null = null;
  private mountainWorker: MountainWorkerBridge | null = null;
  private rafId = 0;
  private resizeObserver: ResizeObserver | null = null;
  private resizeTimeout = 0;
  private lastScrollY = -1;
  private reducedMotionQuery: MediaQueryList | null = null;
  private prefersReducedMotion = false;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const canvas = this.canvasRef().nativeElement;
    const isReduced = window.matchMedia('(max-width: 767px)').matches;

    this.renderer = new SceneRenderer(canvas, defaultConfig(isReduced));
    // Canvas is position: fixed — size from viewport, not container
    this.renderer.resize(window.innerWidth, window.innerHeight);

    // Transfer mountain canvas to OffscreenCanvas worker — main thread does zero draw work
    this.mountainWorker = new MountainWorkerBridge();
    this.mountainWorker.init(
      this.mountainCanvasRef().nativeElement,
      window.innerWidth,
      window.innerHeight,
    );

    // Observe <html> element as a viewport-resize proxy for fixed elements
    this.resizeObserver = new ResizeObserver(() => this.scheduleResize());
    this.resizeObserver.observe(this.document.documentElement);

    // Motion policy: honor prefers-reduced-motion, and pause on hidden tabs.
    // (The unit-test matchMedia stub returns a bare object — guard the listener.)
    this.reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.prefersReducedMotion = this.reducedMotionQuery.matches;
    if (typeof this.reducedMotionQuery.addEventListener === 'function') {
      this.reducedMotionQuery.addEventListener('change', this.onReducedMotionChange);
    }
    this.document.addEventListener('visibilitychange', this.onVisibilityChange);

    this.ngZone.runOutsideAngular(() => this.startRendering());
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      cancelAnimationFrame(this.rafId);
      clearTimeout(this.resizeTimeout);
      window.removeEventListener('scroll', this.onStaticScroll);
      this.document.removeEventListener('visibilitychange', this.onVisibilityChange);
      if (this.reducedMotionQuery && typeof this.reducedMotionQuery.removeEventListener === 'function') {
        this.reducedMotionQuery.removeEventListener('change', this.onReducedMotionChange);
      }
    }
    this.resizeObserver?.disconnect();
    this.renderer?.destroy();
    this.mountainWorker?.destroy();
  }

  /** Enter the rendering mode matching the current motion preference. */
  private startRendering(): void {
    window.removeEventListener('scroll', this.onStaticScroll);
    if (this.prefersReducedMotion) {
      this.startStaticMode();
    } else {
      this.startLoop();
    }
  }

  private startLoop(): void {
    cancelAnimationFrame(this.rafId);
    const loop = (timestamp: number): void => {
      const scrollY = window.scrollY;

      if (scrollY !== this.lastScrollY) {
        this.lastScrollY = scrollY;
        const camY = scrollY / 1200 - DEFAULT_MOUNTAIN_CONFIG.camYOffset;
        this.mountainWorker?.setCamY(camY); // fire-and-forget postMessage — no draw call here
      }

      this.renderer?.drawFrame(timestamp, scrollY);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  /**
   * Reduced motion: no autonomous animation. Draw one still frame, then
   * redraw only on scroll so the parallax layers stay in sync with the
   * user's own gesture (scroll-driven movement is not autonomous motion).
   */
  private startStaticMode(): void {
    cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    this.drawStaticFrame();
    window.addEventListener('scroll', this.onStaticScroll, { passive: true });
  }

  private readonly onStaticScroll = (): void => this.drawStaticFrame();

  private drawStaticFrame(): void {
    const scrollY = window.scrollY;
    this.lastScrollY = scrollY;
    this.mountainWorker?.setCamY(scrollY / 1200 - DEFAULT_MOUNTAIN_CONFIG.camYOffset);
    // Constant timestamp — star twinkle and particle drift stay frozen.
    this.renderer?.drawFrame(0, scrollY);
  }

  /** Pause the animation loop entirely while the tab is hidden. */
  private readonly onVisibilityChange = (): void => {
    if (this.document.hidden) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    } else if (!this.prefersReducedMotion) {
      this.ngZone.runOutsideAngular(() => this.startLoop());
    }
    // Static mode needs no resume work — the still frame is already drawn.
  };

  private readonly onReducedMotionChange = (event: MediaQueryListEvent): void => {
    this.prefersReducedMotion = event.matches;
    this.ngZone.runOutsideAngular(() => this.startRendering());
  };

  private scheduleResize(): void {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = window.setTimeout(() => {
      if (this.renderer) {
        this.renderer.resize(window.innerWidth, window.innerHeight);
      }
      this.mountainWorker?.resize(window.innerWidth, window.innerHeight);
      // resize() re-seeds entities and leaves the canvas cleared — in static
      // mode nothing else will repaint it, so draw the still frame now.
      if (this.prefersReducedMotion) {
        this.drawStaticFrame();
      }
    }, 100);
  }
}

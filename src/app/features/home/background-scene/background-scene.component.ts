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

    this.ngZone.runOutsideAngular(() => this.startLoop());
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      cancelAnimationFrame(this.rafId);
      clearTimeout(this.resizeTimeout);
    }
    this.resizeObserver?.disconnect();
    this.renderer?.destroy();
    this.mountainWorker?.destroy();
  }

  private startLoop(): void {
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

  private scheduleResize(): void {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = window.setTimeout(() => {
      if (this.renderer) {
        this.renderer.resize(window.innerWidth, window.innerHeight);
      }
      this.mountainWorker?.resize(window.innerWidth, window.innerHeight);
    }, 100);
  }
}

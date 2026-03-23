import {
  Directive,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  Renderer2,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  readonly revealThreshold = input<number>(0.1);
  readonly revealOnce = input<boolean>(true);

  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.renderer.addClass(this.el.nativeElement, 'scroll-reveal');

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.renderer.addClass(entry.target, 'scroll-reveal--visible');

            if (this.revealOnce()) {
              this.observer?.unobserve(entry.target);
            }
          } else if (!this.revealOnce()) {
            this.renderer.removeClass(entry.target, 'scroll-reveal--visible');
          }
        }
      },
      { threshold: this.revealThreshold() }
    );

    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

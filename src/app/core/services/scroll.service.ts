import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

/** Tracks the active viewport section and provides smooth-scroll navigation. SSR-safe. */
@Injectable({ providedIn: 'root' })
export class ScrollService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private observer: IntersectionObserver | null = null;

  readonly activeSection = signal<string>('home');

  scrollToSection(id: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  initSectionObserver(sectionIds: string[]): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.destroySectionObserver(); // Disconnect any previous observer before creating a new one
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            this.activeSection.set(id);
            history.replaceState(null, '', id === 'home' ? '/' : `/#${id}`);
          }
        }
      },
      { rootMargin: '-10% 0px -85% 0px' },
    );
    for (const id of sectionIds) {
      const el = this.document.getElementById(id);
      if (el) this.observer.observe(el);
    }
  }

  destroySectionObserver(): void {
    this.observer?.disconnect();
    this.observer = null;
  }
}

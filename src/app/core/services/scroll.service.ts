import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

/** Tracks the active viewport section and provides smooth-scroll navigation. SSR-safe. */
@Injectable({ providedIn: 'root' })
export class ScrollService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private observer: IntersectionObserver | null = null;
  private sectionIds: string[] = [];

  readonly activeSection = signal<string>('home');

  scrollToSection(id: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  initSectionObserver(sectionIds: string[]): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.destroySectionObserver();
    this.sectionIds = [...sectionIds];
    this.observer = new IntersectionObserver(
      () => this.updateActiveSection(),
      { rootMargin: '0px 0px -50% 0px' },
    );
    for (const id of sectionIds) {
      const el = this.document.getElementById(id);
      if (el) this.observer.observe(el);
    }
  }

  private updateActiveSection(): void {
    const midpoint = this.document.documentElement.clientHeight / 2;
    let activeId: string | null = null;
    let closestDistance = Infinity;

    for (const id of this.sectionIds) {
      const el = this.document.getElementById(id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (rect.top <= midpoint) {
        const distance = midpoint - rect.top;
        if (distance < closestDistance) {
          closestDistance = distance;
          activeId = id;
        }
      }
    }

    if (activeId !== null) {
      this.activeSection.set(activeId);
      const search = this.document.defaultView?.location.search ?? '';
      const fragment = activeId === 'home' ? '' : `#${activeId}`;
      history.replaceState(null, '', `/${search}${fragment}`);
    }
  }

  destroySectionObserver(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.sectionIds = [];
  }
}

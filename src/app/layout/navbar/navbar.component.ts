import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ScrollService } from '../../core/services/scroll.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly scrollService = inject(ScrollService);

  isMenuOpen = signal(false);

  constructor() {
    // Lock page scroll behind the open drawer.
    effect(() => {
      this.document.body.style.overflow = this.isMenuOpen() ? 'hidden' : '';
    });

    // The drawer is display: none from the md breakpoint up — close it when
    // crossing that boundary so the scroll lock can't strand the page.
    // (matchMedia is absent in the jsdom unit-test environment.)
    if (isPlatformBrowser(this.platformId) && typeof window.matchMedia === 'function') {
      const mdQuery = window.matchMedia('(min-width: 768px)');
      const onChange = (event: MediaQueryListEvent): void => {
        if (event.matches) this.closeMenu();
      };
      mdQuery.addEventListener('change', onChange);
      this.destroyRef.onDestroy(() => mdQuery.removeEventListener('change', onChange));
    }
  }

  toggleMenu(): void {
    this.isMenuOpen.update(open => !open);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  protected navigateToSection(id: string): void {
    const urlPath = this.router.url.split(/[?#]/)[0];
    if (urlPath === '' || urlPath === '/') {
      this.scrollService.scrollToSection(id);
    } else {
      this.router.navigate([''], { fragment: id });
    }
    this.closeMenu();
  }
}

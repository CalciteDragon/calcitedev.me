import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { BackgroundSceneComponent } from '../features/home/background-scene/background-scene.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, BackgroundSceneComponent],
  template: `
    <a class="skip-link" href="#main-content" (click)="skipToContent($event)">Skip to content</a>
    <app-navbar />
    <app-background-scene />
    <main id="main-content" tabindex="-1" class="layout__content">
      <router-outlet />
    </main>
    <app-footer />
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .layout__content {
      flex: 1;
      padding-top: var(--navbar-height);
      outline: none; // receives programmatic focus from the skip link
    }

    .skip-link {
      position: fixed;
      top: 10px;
      left: 10px;
      z-index: 200;
      padding: 10px 18px;
      background: var(--bg-surface);
      color: var(--accent-cyan);
      border: 1px solid rgba(var(--accent-cyan-rgb), 0.5);
      border-radius: 6px;
      box-shadow: var(--glow-cyan);
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      // Parked offscreen until keyboard focus reveals it.
      transform: translateY(calc(-100% - 20px));

      &:focus-visible {
        transform: translateY(0);
      }
    }
  `],
})
export class LayoutComponent {
  private readonly document = inject(DOCUMENT);

  // Jump and focus manually so the skip link behaves consistently after redirects.
  protected skipToContent(event: Event): void {
    event.preventDefault();
    const main = this.document.getElementById('main-content');
    main?.focus();
    main?.scrollIntoView();
  }
}

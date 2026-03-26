import { ChangeDetectionStrategy, Component } from '@angular/core';
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
    <app-navbar />
    <app-background-scene />
    <main class="layout__content">
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
    }
  `],
})
export class LayoutComponent {}

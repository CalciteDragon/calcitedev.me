import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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
  protected readonly scrollService = inject(ScrollService);

  isMenuOpen = signal(false);

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

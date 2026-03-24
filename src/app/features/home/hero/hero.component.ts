import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  inject,
  input,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { CtaButtonComponent } from '../../../shared/components/cta-button/cta-button.component';
import { Bio } from '../../../models/bio.model';

@Component({
  selector: 'app-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CtaButtonComponent],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
})
export class HeroComponent {
  readonly bio = input.required<Bio>();

  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  scrollToWork(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.document
      .getElementById('projects')
      ?.scrollIntoView({ behavior: 'smooth' });
  }
}

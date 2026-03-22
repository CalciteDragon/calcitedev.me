import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { GlowColor } from '../card/card.component';

@Component({
  selector: 'app-cta-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cta-button.component.html',
  styleUrl: './cta-button.component.scss',
})
export class CtaButtonComponent {
  readonly glowColor = input<GlowColor>('cyan');
  readonly ctaClick = output<void>();
}

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { GlowColor } from '../../types/glow-color.type';

export type { GlowColor } from '../../types/glow-color.type';

@Component({
  selector: 'app-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
})
export class CardComponent {
  readonly glowColor = input<GlowColor>('cyan');
}

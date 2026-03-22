import { Component, ChangeDetectionStrategy, input } from '@angular/core';

export type GlowColor = 'cyan' | 'blue' | 'purple' | 'pink' | 'gold';

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

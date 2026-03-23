import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CardComponent } from '../card/card.component';
import { TechTagComponent } from '../tech-tag/tech-tag.component';
import { GlowColor } from '../../types/glow-color.type';

@Component({
  selector: 'app-project-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardComponent, TechTagComponent],
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.scss',
  host: {
    '(click)': 'cardClick.emit()',
  },
})
export class ProjectCardComponent {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly imageUrl = input<string>('');
  readonly tags = input<string[]>([]);
  readonly glowColor = input<GlowColor>('cyan');
  readonly cardClick = output<void>();
}

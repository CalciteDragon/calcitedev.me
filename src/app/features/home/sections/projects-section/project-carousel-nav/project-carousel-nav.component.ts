import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { GlowColor } from '../../../../../shared/types/glow-color.type';

export type CarouselDirection = 'previous' | 'next';

@Component({
  selector: 'app-project-carousel-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-carousel-nav.component.html',
  styleUrl: './project-carousel-nav.component.scss',
})
export class ProjectCarouselNavComponent {
  readonly direction = input.required<CarouselDirection>();
  readonly label = input.required<string>();
  readonly accent = input.required<GlowColor>();
  readonly stepped = output<void>();

  readonly buttonClass = computed(() => `carousel-nav carousel-nav--${this.accent()}`);
  readonly glyph = computed(() => (this.direction() === 'previous' ? '\u2039' : '\u203A'));
}

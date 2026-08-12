import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../card/card.component';
import { TechTagComponent } from '../tech-tag/tech-tag.component';
import { GlowColor } from '../../types/glow-color.type';

@Component({
  selector: 'app-project-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CardComponent, TechTagComponent],
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.scss',
})
export class ProjectCardComponent {
  readonly title = input.required<string>();
  readonly slug = input.required<string>();
  readonly description = input.required<string>();
  readonly imageUrl = input<string>('');
  readonly tags = input<string[]>([]);
  readonly glowColor = input<GlowColor>('cyan');
  readonly liveUrl = input<string>();
  readonly githubUrl = input<string>();
}

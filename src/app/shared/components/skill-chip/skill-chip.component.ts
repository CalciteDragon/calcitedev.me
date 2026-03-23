import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { GlowColor } from '../../types/glow-color.type';

@Component({
  selector: 'app-skill-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span [class]="'skill-chip skill-chip--' + color()">{{ name() }}</span>`,
  styleUrl: './skill-chip.component.scss',
})
export class SkillChipComponent {
  readonly name = input.required<string>();
  readonly color = input<GlowColor>('cyan');
}

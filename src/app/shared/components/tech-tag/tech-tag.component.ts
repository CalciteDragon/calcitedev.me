import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-tech-tag',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="tech-tag">{{ name() }}</span>`,
  styleUrl: './tech-tag.component.scss',
})
export class TechTagComponent {
  readonly name = input.required<string>();
}

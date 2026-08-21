import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-section-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './section-header.component.html',
  styleUrl: './section-header.component.scss',
  // `title="..."` in a parent template sets the signal input *and* leaves a literal `title`
  // attribute on the host, which the browser turns into a native tooltip over the whole header.
  // Strip it so hovering a section heading stays silent.
  host: { '[attr.title]': 'null' },
})
export class SectionHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}

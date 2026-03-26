import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Bio } from '../../../../models/bio.model';

@Component({
  selector: 'app-about-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './about-section.component.html',
  styleUrl: './about-section.component.scss',
})
export class AboutSectionComponent {
  readonly bio = input.required<Bio>();
}

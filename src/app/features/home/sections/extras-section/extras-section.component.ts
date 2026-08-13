import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ExtraTopic } from '../../../../models/extra.model';
import { ScrollRevealDirective } from '../../../../shared/directives/scroll-reveal.directive';
import { SectionHeaderComponent } from '../../../../shared/components/section-header/section-header.component';
import { ExtrasPlatformerComponent } from './extras-platformer/extras-platformer.component';

@Component({
  selector: 'app-extras-section',
  standalone: true,
  imports: [SectionHeaderComponent, ScrollRevealDirective, ExtrasPlatformerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './extras-section.component.html',
  styleUrl: './extras-section.component.scss',
})
export class ExtrasSectionComponent {
  readonly topics = input.required<readonly ExtraTopic[]>();
}

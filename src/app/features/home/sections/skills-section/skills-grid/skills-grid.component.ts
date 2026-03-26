import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SkillGroup } from '../../../../../models/skill.model';
import { SkillChipComponent } from '../../../../../shared/components/skill-chip/skill-chip.component';
import { ScrollRevealDirective } from '../../../../../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-skills-grid',
  standalone: true,
  imports: [SkillChipComponent, ScrollRevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './skills-grid.component.html',
  styleUrl: './skills-grid.component.scss',
})
export class SkillsGridComponent {
  readonly skillGroups = input.required<SkillGroup[]>();
}

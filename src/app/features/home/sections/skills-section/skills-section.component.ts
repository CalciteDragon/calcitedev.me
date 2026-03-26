import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SkillGroup } from '../../../../models/skill.model';

@Component({
  selector: 'app-skills-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './skills-section.component.html',
  styleUrl: './skills-section.component.scss',
})
export class SkillsSectionComponent {
  readonly skillGroups = input.required<readonly SkillGroup[]>();
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SkillGroup } from '../../../../models/skill.model';
import { SectionHeaderComponent } from '../../../../shared/components/section-header/section-header.component';
import { SkillsGridComponent } from './skills-grid/skills-grid.component';

@Component({
  selector: 'app-skills-section',
  standalone: true,
  imports: [SectionHeaderComponent, SkillsGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './skills-section.component.html',
  styleUrl: './skills-section.component.scss',
})
export class SkillsSectionComponent {
  readonly skillGroups = input.required<readonly SkillGroup[]>();
}

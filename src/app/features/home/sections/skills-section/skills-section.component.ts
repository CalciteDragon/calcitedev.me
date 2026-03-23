import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-skills-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './skills-section.component.html',
  styleUrl: './skills-section.component.scss',
})
export class SkillsSectionComponent {}

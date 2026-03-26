import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Project } from '../../../../models/project.model';

@Component({
  selector: 'app-projects-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './projects-section.component.html',
  styleUrl: './projects-section.component.scss',
})
export class ProjectsSectionComponent {
  readonly projects = input.required<Project[]>();
}

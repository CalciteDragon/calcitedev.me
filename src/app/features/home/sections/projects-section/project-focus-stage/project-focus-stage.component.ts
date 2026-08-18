import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Project } from '../../../../../models/project.model';
import { TechTagComponent } from '../../../../../shared/components/tech-tag/tech-tag.component';

@Component({
  selector: 'app-project-focus-stage',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TechTagComponent],
  templateUrl: './project-focus-stage.component.html',
  styleUrl: './project-focus-stage.component.scss',
})
export class ProjectFocusStageComponent {
  readonly projects = input.required<readonly Project[]>();
  readonly selectedSlug = input.required<string>();

  projectClass(project: Project): string {
    return `project-focus project-focus--${project.glowColor}`;
  }

  projectNumber(index: number): string {
    return String(index + 1).padStart(2, '0');
  }
}

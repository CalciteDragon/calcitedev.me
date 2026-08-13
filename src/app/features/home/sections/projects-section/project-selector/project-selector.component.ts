import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Project } from '../../../../../models/project.model';
import { ScrollRevealDirective } from '../../../../../shared/directives/scroll-reveal.directive';

export interface ProjectSelection {
  readonly slug: string;
  readonly focusDetails: boolean;
}

@Component({
  selector: 'app-project-selector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrollRevealDirective],
  templateUrl: './project-selector.component.html',
  styleUrl: './project-selector.component.scss',
})
export class ProjectSelectorComponent {
  readonly projects = input.required<readonly Project[]>();
  readonly selectedSlug = input.required<string>();
  readonly projectSelected = output<ProjectSelection>();

  projectClass(project: Project): string {
    return `project-selector__button project-selector__button--${project.glowColor}`;
  }

  selectProject(project: Project, event: MouseEvent): void {
    this.projectSelected.emit({ slug: project.slug, focusDetails: event.detail === 0 });
  }

  previewTags(project: Project): readonly string[] {
    return project.tags.slice(0, 3);
  }

  projectNumber(index: number): string {
    return String(index + 1).padStart(2, '0');
  }
}

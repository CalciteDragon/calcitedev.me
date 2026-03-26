import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Project } from '../../../../../models/project.model';
import { ProjectCardComponent } from '../../../../../shared/components/project-card/project-card.component';

@Component({
  selector: 'app-project-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProjectCardComponent],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss',
})
export class ProjectListComponent {
  readonly projects = input.required<readonly Project[]>();
}

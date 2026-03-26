import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { Project } from '../../../../models/project.model';
import { SectionHeaderComponent } from '../../../../shared/components/section-header/section-header.component';
import { ScrollRevealDirective } from '../../../../shared/directives/scroll-reveal.directive';
import { ProjectListComponent } from './project-list/project-list.component';

@Component({
  selector: 'app-projects-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionHeaderComponent, ScrollRevealDirective, ProjectListComponent],
  templateUrl: './projects-section.component.html',
  styleUrl: './projects-section.component.scss',
})
export class ProjectsSectionComponent {
  readonly projects = input.required<readonly Project[]>();

  readonly activeFilter = signal<string | null>(null);

  readonly allTags = computed(() =>
    [...new Set(this.projects().flatMap(p => p.tags))]
  );

  readonly filteredProjects = computed(() => {
    const filter = this.activeFilter();
    if (!filter) return this.projects();
    return this.projects().filter(p => p.tags.includes(filter));
  });

  setFilter(tag: string | null): void {
    this.activeFilter.set(tag);
  }
}

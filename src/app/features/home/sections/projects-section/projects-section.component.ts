import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { Project } from '../../../../models/project.model';
import { SectionHeaderComponent } from '../../../../shared/components/section-header/section-header.component';
import { ScrollRevealDirective } from '../../../../shared/directives/scroll-reveal.directive';
import { ProjectListComponent } from './project-list/project-list.component';

const POPULAR_TAG_MIN_COUNT = 2;

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

  readonly popularTags = computed(() => {
    const counts = new Map<string, number>();
    for (const project of this.projects()) {
      for (const tag of project.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .filter(([, count]) => count >= POPULAR_TAG_MIN_COUNT)
      .map(([tag]) => tag);
  });

  readonly filteredProjects = computed(() => {
    const filter = this.activeFilter();
    if (!filter) return this.projects();
    return this.projects().filter(p => p.tags.includes(filter));
  });

  setFilter(tag: string | null): void {
    this.activeFilter.set(tag);
  }
}

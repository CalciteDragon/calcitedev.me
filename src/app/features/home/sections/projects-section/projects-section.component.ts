import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Project } from '../../../../models/project.model';
import { SectionHeaderComponent } from '../../../../shared/components/section-header/section-header.component';
import { ScrollRevealDirective } from '../../../../shared/directives/scroll-reveal.directive';
import { ProjectFocusStageComponent } from './project-focus-stage/project-focus-stage.component';
import {
  ProjectSelection,
  ProjectSelectorComponent,
} from './project-selector/project-selector.component';

@Component({
  selector: 'app-projects-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SectionHeaderComponent,
    ScrollRevealDirective,
    ProjectFocusStageComponent,
    ProjectSelectorComponent,
  ],
  templateUrl: './projects-section.component.html',
  styleUrl: './projects-section.component.scss',
})
export class ProjectsSectionComponent {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  readonly projects = input.required<readonly Project[]>();
  readonly selectedSlug = signal<string | null>(null);
  readonly announcement = signal('');

  readonly selectedProject = computed(() => {
    const projects = this.projects();
    const selected = projects.find(project => project.slug === this.selectedSlug());
    return selected ?? projects[0] ?? null;
  });

  selectProject(selection: ProjectSelection): void {
    const project = this.projects().find(item => item.slug === selection.slug);
    if (!project || project.slug === this.selectedProject()?.slug) return;

    this.selectedSlug.set(project.slug);
    this.announcement.set(`Now viewing ${project.title}. Project details updated above.`);

    if (!isPlatformBrowser(this.platformId)) return;

    requestAnimationFrame(() => {
      const focusCard = this.document.getElementById(`project-focus-${project.slug}`);
      if (selection.focusDetails) {
        focusCard?.focus({ preventScroll: true });
      }

      const rect = focusCard?.getBoundingClientRect();
      const navbarOffset = 80;
      if (rect && (rect.top < navbarOffset || rect.bottom > window.innerHeight)) {
        focusCard?.scrollIntoView({
          behavior: this.prefersReducedMotion() ? 'auto' : 'smooth',
          block: 'start',
        });
      }
    });
  }

  private prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}

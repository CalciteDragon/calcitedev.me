import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Project } from '../../../../../models/project.model';
import { TechTagComponent } from '../../../../../shared/components/tech-tag/tech-tag.component';
import { GlowColor } from '../../../../../shared/types/glow-color.type';
import { ProjectCarouselNavComponent } from '../project-carousel-nav/project-carousel-nav.component';

@Component({
  selector: 'app-project-focus-stage',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TechTagComponent, ProjectCarouselNavComponent],
  templateUrl: './project-focus-stage.component.html',
  styleUrl: './project-focus-stage.component.scss',
})
export class ProjectFocusStageComponent {
  readonly projects = input.required<readonly Project[]>();
  readonly selectedSlug = input.required<string>();
  readonly projectStepped = output<string>();

  readonly hasCarousel = computed(() => this.projects().length > 1);
  readonly accent = computed<GlowColor>(() => this.selectedProject()?.glowColor ?? 'cyan');
  readonly previousProject = computed(() => this.projectAtOffset(-1));
  readonly nextProject = computed(() => this.projectAtOffset(1));
  readonly previousLabel = computed(() => this.stepLabel('previous', this.previousProject()));
  readonly nextLabel = computed(() => this.stepLabel('next', this.nextProject()));

  private readonly selectedProject = computed(() => this.projects()[this.selectedIndex()] ?? null);

  private readonly selectedIndex = computed(() => {
    const index = this.projects().findIndex(project => project.slug === this.selectedSlug());
    return index === -1 ? 0 : index;
  });

  projectClass(project: Project): string {
    return `project-focus project-focus--${project.glowColor}`;
  }

  projectNumber(index: number): string {
    return String(index + 1).padStart(2, '0');
  }

  step(offset: number): void {
    const target = this.projectAtOffset(offset);
    if (target) {
      this.projectStepped.emit(target.slug);
    }
  }

  private projectAtOffset(offset: number): Project | null {
    const projects = this.projects();
    if (projects.length < 2) return null;

    const index = (this.selectedIndex() + offset + projects.length) % projects.length;
    return projects[index] ?? null;
  }

  private stepLabel(direction: 'previous' | 'next', project: Project | null): string {
    return project ? `Show ${direction} project, ${project.title}` : `Show ${direction} project`;
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
} from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { TechTagComponent } from '../../../shared/components/tech-tag/tech-tag.component';
import { projectsData } from '../../../data/projects.data';
import { Project } from '../../../models/project.model';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TechTagComponent, RouterLink],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss',
})
export class ProjectDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly titleService = inject(Title);

  private readonly params = toSignal(this.route.paramMap);

  readonly project = computed(() => {
    const slug = this.params()?.get('slug');
    return projectsData.find(p => p.slug === slug) ?? null;
  });

  readonly relatedProjects = computed((): readonly Project[] => {
    const current = this.project();
    if (!current) return [];
    const currentTags = new Set(current.tags);
    const others = projectsData.filter(p => p.slug !== current.slug);
    const withSharedTags = others.filter(p => p.tags.some(t => currentTags.has(t)));
    const withoutSharedTags = others.filter(p => !p.tags.some(t => currentTags.has(t)));
    return [...withSharedTags, ...withoutSharedTags].slice(0, 3);
  });

  constructor() {
    effect(() => {
      const p = this.project();
      this.titleService.setTitle(p ? `${p.title} — Calcite` : 'Portfolio — Calcite');
    });
  }
}

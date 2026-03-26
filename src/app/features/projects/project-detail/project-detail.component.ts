import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TechTagComponent } from '../../../shared/components/tech-tag/tech-tag.component';
import { projectsData } from '../../../data/projects.data';

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

  // Use toSignal on paramMap (not snapshot) so the component re-resolves
  // correctly if Angular ever reuses the instance across slug navigations.
  private readonly params = toSignal(this.route.paramMap);

  readonly project = computed(() => {
    const slug = this.params()?.get('slug');
    return projectsData.find(p => p.slug === slug) ?? null;
  });
}

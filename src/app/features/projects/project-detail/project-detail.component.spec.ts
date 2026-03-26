import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { ProjectDetailComponent } from './project-detail.component';
import { projectsData } from '../../../data/projects.data';

describe('ProjectDetailComponent', () => {
  function createComponent(slug: string) {
    TestBed.configureTestingModule({
      imports: [ProjectDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ slug })),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(ProjectDetailComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('resolves a known project slug', () => {
    const component = createComponent('pixel-quest');
    const project = component.project();
    expect(project).not.toBeNull();
    expect(project?.slug).toBe('pixel-quest');
    expect(project?.title).toBe(projectsData.find(p => p.slug === 'pixel-quest')?.title);
  });

  it('returns null for an unknown slug', () => {
    const component = createComponent('nonexistent');
    expect(component.project()).toBeNull();
  });
});

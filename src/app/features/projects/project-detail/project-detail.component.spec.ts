import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { Title } from '@angular/platform-browser';
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

  it('returns up to 3 related projects excluding the current one', () => {
    const component = createComponent('pixel-quest');
    const related = component.relatedProjects();
    expect(related.length).toBeLessThanOrEqual(3);
    expect(related.every(p => p.slug !== 'pixel-quest')).toBe(true);
  });

  it('prioritises projects sharing tags with the current one', () => {
    // pixel-quest has tags: TypeScript, Canvas API, Game Dev, Pixel Art
    // starmapper also has TypeScript and Canvas API → should appear in related
    const component = createComponent('pixel-quest');
    const related = component.relatedProjects();
    const slugs = related.map(p => p.slug);
    expect(slugs).toContain('starmapper');
  });

  it('returns empty array for null project', () => {
    const component = createComponent('nonexistent');
    expect(component.relatedProjects()).toEqual([]);
  });

  it('sets document title to project name when project exists', () => {
    const component = createComponent('pixel-quest');
    const title = TestBed.inject(Title);
    expect(title.getTitle()).toBe('Pixel Quest — Calcite');
  });

  it('sets fallback title when project does not exist', () => {
    const component = createComponent('nonexistent');
    const title = TestBed.inject(Title);
    expect(title.getTitle()).toBe('Portfolio — Calcite');
  });
});

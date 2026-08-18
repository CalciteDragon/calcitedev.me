import { ComponentRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Project } from '../../../../models/project.model';
import { ProjectsSectionComponent } from './projects-section.component';

const mockProjects: readonly Project[] = [
  {
    slug: 'alpha',
    title: 'Alpha',
    eyebrow: 'Personal · Web',
    status: 'SHIPPED',
    description: 'Alpha summary',
    longDescription: 'Alpha detail copy.',
    tags: ['Angular', 'TypeScript'],
    imageUrl: 'alpha.svg',
    imageAlt: 'Alpha preview',
    githubUrl: 'https://example.com/alpha',
    glowColor: 'cyan',
  },
  {
    slug: 'beta',
    title: 'Beta',
    eyebrow: 'Team · Game',
    status: 'IN DEVELOPMENT',
    description: 'Beta summary',
    longDescription: 'Beta detail copy.',
    tags: ['Java', 'Robotics'],
    imageUrl: 'beta.svg',
    imageAlt: 'Beta preview',
    glowColor: 'pink',
  },
];

describe('ProjectsSectionComponent', () => {
  let ref: ComponentRef<ProjectsSectionComponent>;
  let element: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ProjectsSectionComponent] });
    const fixture = TestBed.createComponent(ProjectsSectionComponent);
    ref = fixture.componentRef;
    ref.setInput('projects', mockProjects);
    fixture.detectChanges();
    element = fixture.nativeElement;
  });

  it('selects the first project by data order initially', () => {
    expect(ref.instance.selectedProject()?.slug).toBe('alpha');
    expect(element.querySelector('[aria-pressed="true"]')?.textContent).toContain('Alpha');
  });

  it('updates the focus project without reordering selector buttons', () => {
    const orderBefore = [...element.querySelectorAll<HTMLButtonElement>('app-project-selector button')]
      .map(button => button.getAttribute('aria-label'));

    ref.instance.selectProject({ slug: 'beta', focusDetails: false });
    ref.changeDetectorRef.detectChanges();

    const orderAfter = [...element.querySelectorAll<HTMLButtonElement>('app-project-selector button')]
      .map(button => button.getAttribute('aria-label'));
    expect(ref.instance.selectedProject()?.slug).toBe('beta');
    expect(orderAfter).toEqual(orderBefore);
    expect(element.querySelector('[aria-pressed="true"]')?.textContent).toContain('Beta');
  });

  it('falls back to the first project when a selected slug disappears', () => {
    ref.instance.selectProject({ slug: 'beta', focusDetails: false });
    ref.setInput('projects', [mockProjects[0]]);
    ref.changeDetectorRef.detectChanges();
    expect(ref.instance.selectedProject()?.slug).toBe('alpha');
  });

  it('renders a graceful empty state', () => {
    ref.setInput('projects', []);
    ref.changeDetectorRef.detectChanges();
    expect(ref.instance.selectedProject()).toBeNull();
    expect(element.querySelector('.projects-section__empty')?.textContent).toContain('compiling');
  });
});

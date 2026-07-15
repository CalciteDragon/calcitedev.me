import { TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ProjectsSectionComponent } from './projects-section.component';
import { Project } from '../../../../models/project.model';

const mockProjects: Project[] = [
  { slug: 'a', title: 'A', description: '', longDescription: '', tags: ['Angular', 'TypeScript'], imageUrl: '', featured: false, category: 'tool', glowColor: 'cyan' },
  { slug: 'b', title: 'B', description: '', longDescription: '', tags: ['React', 'TypeScript'], imageUrl: '', featured: false, category: 'web-app', glowColor: 'blue' },
  { slug: 'c', title: 'C', description: '', longDescription: '', tags: ['Angular', 'Node.js'], imageUrl: '', featured: false, category: 'api', glowColor: 'purple' },
];

describe('ProjectsSectionComponent', () => {
  let ref: ComponentRef<ProjectsSectionComponent>;

  beforeEach(() => {
    // Project cards render routerLink anchors, so a router must be provided.
    TestBed.configureTestingModule({
      imports: [ProjectsSectionComponent],
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(ProjectsSectionComponent);
    ref = fixture.componentRef;
    ref.setInput('projects', mockProjects);
    fixture.detectChanges();
  });

  it('shows all projects when no filter is active', () => {
    expect(ref.instance.filteredProjects()).toHaveLength(3);
  });

  it('filters to projects matching the active tag', () => {
    ref.instance.setFilter('Angular');
    expect(ref.instance.filteredProjects()).toHaveLength(2);
    expect(ref.instance.filteredProjects().map(p => p.slug)).toEqual(['a', 'c']);
  });

  it('resets to all projects when filter is cleared', () => {
    ref.instance.setFilter('React');
    ref.instance.setFilter(null);
    expect(ref.instance.filteredProjects()).toHaveLength(3);
  });

  it('returns only tags appearing in 2 or more projects', () => {
    // mockProjects: a=['Angular','TypeScript'], b=['React','TypeScript'], c=['Angular','Node.js']
    // Angular: a,c → 2 ✓   TypeScript: a,b → 2 ✓
    // React: b → 1 ✗        Node.js: c → 1 ✗
    const tags = ref.instance.popularTags();
    expect(tags).toContain('Angular');
    expect(tags).toContain('TypeScript');
    expect(tags).not.toContain('React');
    expect(tags).not.toContain('Node.js');
  });
});

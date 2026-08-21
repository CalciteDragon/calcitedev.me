import { ComponentRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Project } from '../../../../../models/project.model';
import { ProjectFocusStageComponent } from './project-focus-stage.component';

const projects: readonly Project[] = [
  {
    slug: 'one', title: 'One', eyebrow: 'First', status: 'SHIPPED', description: 'One',
    longDescription: 'First project details.', tags: ['Angular'], imageUrl: 'one.svg',
    imageAlt: 'One preview', githubUrl: 'https://example.com/one', glowColor: 'cyan',
  },
  {
    slug: 'two', title: 'Two', eyebrow: 'Second', status: 'PRIVATE', description: 'Two',
    longDescription: 'Second project details.', tags: ['Java'], imageUrl: 'two.svg',
    imageAlt: 'Two preview', glowColor: 'gold',
  },
];

describe('ProjectFocusStageComponent', () => {
  let fixture: ComponentFixture<ProjectFocusStageComponent>;
  let ref: ComponentRef<ProjectFocusStageComponent>;
  let element: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ProjectFocusStageComponent] });
    fixture = TestBed.createComponent(ProjectFocusStageComponent);
    ref = fixture.componentRef;
    ref.setInput('projects', projects);
    ref.setInput('selectedSlug', 'one');
    fixture.detectChanges();
    element = fixture.nativeElement;
  });

  it('keeps every focus card mounted while exposing only the selected card', () => {
    const cards = element.querySelectorAll<HTMLElement>('.project-focus');
    expect(cards).toHaveLength(2);
    expect(cards[0].classList).toContain('project-focus--active');
    expect(cards[0].hasAttribute('aria-hidden')).toBe(false);
    expect(cards[1].getAttribute('aria-hidden')).toBe('true');
    expect(cards[1].hasAttribute('inert')).toBe(true);
  });

  it('wraps the carousel around the project list in both directions', () => {
    const stepped: string[] = [];
    ref.instance.projectStepped.subscribe(slug => stepped.push(slug));

    const buttons = element.querySelectorAll<HTMLButtonElement>('.project-focus-stage__nav button');
    expect(buttons).toHaveLength(2);
    expect(element.querySelector('.project-focus .carousel-nav')).toBeNull();
    expect(buttons[0].getAttribute('aria-label')).toBe('Show previous project, Two');
    expect(buttons[1].getAttribute('aria-label')).toBe('Show next project, Two');

    buttons[0].click();
    buttons[1].click();
    expect(stepped).toEqual(['two', 'two']);
  });

  it('hides the carousel when there is only one project', () => {
    ref.setInput('projects', [projects[0]]);
    ref.setInput('selectedSlug', 'one');
    fixture.detectChanges();

    expect(element.querySelector('.project-focus-stage__nav')).toBeNull();
    expect(element.querySelector('.project-focus-stage--carousel')).toBeNull();
  });

  it('renders repository actions only when a project provides them', () => {
    expect(element.querySelector('#project-focus-one a')?.textContent).toContain('View repository');
    expect(element.querySelector('#project-focus-two a')).toBeNull();
    expect(element.querySelector('#project-focus-two')?.textContent).toContain('Building in private');
  });
});

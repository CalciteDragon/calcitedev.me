import { ComponentRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Project } from '../../../../../models/project.model';
import { ProjectSelectorComponent } from './project-selector.component';

const projects: readonly Project[] = [
  {
    slug: 'one', title: 'One', eyebrow: 'First', status: 'SHIPPED', description: 'One',
    longDescription: 'First project details.', tags: ['Angular', 'TypeScript', 'SCSS', 'Extra'],
    imageUrl: 'one.svg', imageAlt: 'One preview', glowColor: 'cyan',
  },
  {
    slug: 'two', title: 'Two', eyebrow: 'Second', status: 'WIP', description: 'Two',
    longDescription: 'Second project details.', tags: ['Java'], imageUrl: 'two.svg',
    imageAlt: 'Two preview', glowColor: 'pink',
  },
];

describe('ProjectSelectorComponent', () => {
  let ref: ComponentRef<ProjectSelectorComponent>;
  let element: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ProjectSelectorComponent] });
    const fixture = TestBed.createComponent(ProjectSelectorComponent);
    ref = fixture.componentRef;
    ref.setInput('projects', projects);
    ref.setInput('selectedSlug', 'one');
    fixture.detectChanges();
    element = fixture.nativeElement;
  });

  it('renders accessible pressed-state buttons for every project', () => {
    const buttons = element.querySelectorAll<HTMLButtonElement>('button');
    expect(buttons).toHaveLength(2);
    expect(element.querySelectorAll('.project-selector__reveal.scroll-reveal')).toHaveLength(2);
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[0].getAttribute('aria-controls')).toBe('project-focus-one');
    expect(buttons[1].getAttribute('aria-label')).toBe('Show Two project');
  });

  it('emits a selection when a preview is clicked', () => {
    const emitted: unknown[] = [];
    ref.instance.projectSelected.subscribe(selection => emitted.push(selection));
    element.querySelectorAll<HTMLButtonElement>('button')[1].click();
    expect(emitted).toEqual([{ slug: 'two', focusDetails: true }]);
  });

  it('limits preview keywords to three', () => {
    expect(element.querySelectorAll('button')[0].querySelectorAll('.project-selector__tags span'))
      .toHaveLength(3);
  });
});

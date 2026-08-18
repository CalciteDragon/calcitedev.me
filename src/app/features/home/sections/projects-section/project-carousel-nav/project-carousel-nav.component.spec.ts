import { ComponentRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ProjectCarouselNavComponent } from './project-carousel-nav.component';

describe('ProjectCarouselNavComponent', () => {
  let ref: ComponentRef<ProjectCarouselNavComponent>;
  let button: HTMLButtonElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ProjectCarouselNavComponent] });
    const fixture = TestBed.createComponent(ProjectCarouselNavComponent);
    ref = fixture.componentRef;
    ref.setInput('direction', 'next');
    ref.setInput('label', 'Show next project, Two');
    ref.setInput('accent', 'gold');
    fixture.detectChanges();
    button = fixture.nativeElement.querySelector('button');
  });

  it('carries the accent class and the supplied accessible label', () => {
    expect(button.className).toBe('carousel-nav carousel-nav--gold');
    expect(button.getAttribute('aria-label')).toBe('Show next project, Two');
    expect(button.textContent?.trim()).toBe('\u203A');
  });

  it('emits on activation', () => {
    let stepped = 0;
    ref.instance.stepped.subscribe(() => (stepped += 1));

    button.click();
    expect(stepped).toBe(1);
  });
});

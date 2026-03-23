import { Component, PLATFORM_ID } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ScrollRevealDirective } from './scroll-reveal.directive';

@Component({
  template: `<div appScrollReveal>Content</div>`,
  standalone: true,
  imports: [ScrollRevealDirective],
})
class TestHostComponent {}

describe('ScrollRevealDirective (browser)', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let div: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    div = fixture.nativeElement.querySelector('div');
  });

  it('should add scroll-reveal class on init', () => {
    expect(div.classList.contains('scroll-reveal')).toBe(true);
  });
});

describe('ScrollRevealDirective (SSR)', () => {
  it('should not add scroll-reveal class during SSR (non-browser platform)', async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    }).compileComponents();

    const ssrFixture = TestBed.createComponent(TestHostComponent);
    ssrFixture.detectChanges();
    const ssrDiv = ssrFixture.nativeElement.querySelector('div');
    expect(ssrDiv.classList.contains('scroll-reveal')).toBe(false);
  });
});

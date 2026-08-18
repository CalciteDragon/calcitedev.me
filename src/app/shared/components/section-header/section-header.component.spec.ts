import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SectionHeaderComponent } from './section-header.component';

@Component({
  standalone: true,
  imports: [SectionHeaderComponent],
  template: '<app-section-header title="Extras" subtitle="Three side quests." />',
})
class HostComponent {}

describe('SectionHeaderComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    compiled = fixture.nativeElement;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('renders the title and subtitle', () => {
    expect(compiled.querySelector('.section-header__title')?.textContent?.trim()).toBe('Extras');
    expect(compiled.querySelector('.section-header__subtitle')?.textContent?.trim()).toBe('Three side quests.');
  });

  it('strips the host title attribute so no native tooltip appears on hover', () => {
    // Static `title="..."` in a parent template feeds the signal input and *also* lands on the
    // host element, where the browser would render it as a tooltip over the whole header.
    expect(compiled.querySelector('app-section-header')?.hasAttribute('title')).toBe(false);
  });
});

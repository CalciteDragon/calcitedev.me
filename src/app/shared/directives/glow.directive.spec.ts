import { Component } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { GlowDirective } from './glow.directive';

@Component({
  template: `<div appGlow="blue">Content</div>`,
  standalone: true,
  imports: [GlowDirective],
})
class TestHostComponent {}

@Component({
  template: `<div appGlow="unknown">Unknown color</div>`,
  standalone: true,
  imports: [GlowDirective],
})
class DefaultColorHostComponent {}

describe('GlowDirective', () => {
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

  it('should have no glow initially', () => {
    expect(div.style.boxShadow).toBe('none');
  });

  it('should apply blue glow on mouseenter', () => {
    div.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(div.style.boxShadow).toContain('var(--glow-blue)');
  });

  it('should remove glow on mouseleave', () => {
    div.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    div.dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();
    expect(div.style.boxShadow).toBe('none');
  });

  it('should set transition on host element', () => {
    expect(div.style.transition).toContain('box-shadow');
  });

  it('should fall back to cyan for unknown color', () => {
    // Default host uses appGlow="" (empty string) — falls back to cyan
    const defaultFixture = TestBed.createComponent(DefaultColorHostComponent);
    defaultFixture.detectChanges();
    const defaultDiv = defaultFixture.nativeElement.querySelector('div');
    defaultDiv.dispatchEvent(new MouseEvent('mouseenter'));
    defaultFixture.detectChanges();
    expect(defaultDiv.style.boxShadow).toContain('var(--glow-cyan)');
  });
});

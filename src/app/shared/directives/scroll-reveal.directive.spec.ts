import { Component, PLATFORM_ID } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ScrollRevealDirective } from './scroll-reveal.directive';

@Component({
  template: `<div appScrollReveal>Content</div>`,
  standalone: true,
  imports: [ScrollRevealDirective],
})
class TestHostComponent {}

@Component({
  template: `<div appScrollReveal [revealOnce]="false">Content</div>`,
  standalone: true,
  imports: [ScrollRevealDirective],
})
class RepeatRevealHostComponent {}

describe('ScrollRevealDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let div: HTMLElement;
  let observeCallback: (entries: Partial<IntersectionObserverEntry>[]) => void;
  let mockObserve: ReturnType<typeof vi.fn>;
  let mockUnobserve: ReturnType<typeof vi.fn>;
  let mockDisconnect: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    mockObserve = vi.fn();
    mockUnobserve = vi.fn();
    mockDisconnect = vi.fn();

    vi.stubGlobal(
      'IntersectionObserver',
      vi.fn(function (callback: any) {
        observeCallback = callback;
        return {
          observe: mockObserve,
          unobserve: mockUnobserve,
          disconnect: mockDisconnect,
        };
      })
    );

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    div = fixture.nativeElement.querySelector('div');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should add scroll-reveal class on init', () => {
    expect(div.classList.contains('scroll-reveal')).toBe(true);
  });

  it('should observe the host element', () => {
    expect(mockObserve).toHaveBeenCalledWith(div);
  });

  it('should add scroll-reveal--visible class when intersecting', () => {
    observeCallback([{ isIntersecting: true, target: div }]);
    expect(div.classList.contains('scroll-reveal--visible')).toBe(true);
  });

  it('should unobserve after reveal when revealOnce is true (default)', () => {
    observeCallback([{ isIntersecting: true, target: div }]);
    expect(mockUnobserve).toHaveBeenCalled();
  });

  it('should disconnect observer on destroy', () => {
    fixture.destroy();
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('should remove scroll-reveal--visible class when not intersecting and revealOnce is false', () => {
    const repeatFixture = TestBed.createComponent(RepeatRevealHostComponent);
    repeatFixture.detectChanges();
    const repeatDiv = repeatFixture.nativeElement.querySelector('div');

    // IntersectionObserver was called again for this fixture — get the latest callback
    const lastCall = (IntersectionObserver as ReturnType<typeof vi.fn>).mock.calls.at(-1)!;
    const repeatCallback = lastCall[0] as (entries: Partial<IntersectionObserverEntry>[]) => void;

    repeatCallback([{ isIntersecting: true, target: repeatDiv }]);
    expect(repeatDiv.classList.contains('scroll-reveal--visible')).toBe(true);

    repeatCallback([{ isIntersecting: false, target: repeatDiv }]);
    expect(repeatDiv.classList.contains('scroll-reveal--visible')).toBe(false);
  });
});

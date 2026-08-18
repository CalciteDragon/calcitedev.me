import { ComponentFixture, TestBed } from '@angular/core/testing';
import { bioData } from '../../../../data/bio.data';
import {
  AboutSectionComponent,
  aboutRailProgressForGeometry,
  aboutScrollDebugEnabled,
  closestTimelineNodeIndex,
} from './about-section.component';

describe('AboutSectionComponent', () => {
  let fixture: ComponentFixture<AboutSectionComponent>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    window.history.replaceState({}, '', '/');
    await TestBed.configureTestingModule({
      imports: [AboutSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AboutSectionComponent);
    fixture.componentRef.setInput('bio', bioData);
    fixture.detectChanges();
    compiled = fixture.nativeElement;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState({}, '', '/');
  });

  it('renders the intro, build command, and four compiler stages', () => {
    expect(compiled.querySelector('h2')?.textContent).toContain('About Me');
    expect(compiled.querySelector('.about-section__intro-copy')?.textContent).toContain(
      "Hey there! My name is Tyler",
    );
    expect(compiled.querySelector('.about-section__command code')?.textContent).toBe(
      'npm run build -- Tyler-Hawthorn --configuration production',
    );

    const stages = Array.from(compiled.querySelectorAll('.about-section__chapter-title'));
    expect(stages).toHaveLength(4);
    expect(stages.map((stage) => stage.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      '//01 — SOURCE PARSING',
      '//02 — AST CONSTRUCTION',
      '//03 — BYTECODE GENERATION',
      '//04 — JIT OPTIMIZATION',
    ]);
  });

  it('renders the Scratch and Projects links plus the FIRST side note', () => {
    const scratchLink = compiled.querySelector(
      'a[href="https://scratch.mit.edu/users/calcitedragon/"]',
    ) as HTMLAnchorElement;
    expect(scratchLink.target).toBe('_blank');
    expect(scratchLink.rel).toBe('noopener noreferrer');

    expect(compiled.querySelectorAll('a[href="#projects"]')).toHaveLength(3);
    expect(compiled.querySelector('.about-section__side-note')?.textContent).toContain(
      "we didn't place first, unfortunately, haha",
    );
  });

  it('keeps reveal animation on the intro only and always marks one history entry active', () => {
    expect(
      compiled.querySelector('.about-section__intro')?.classList.contains('scroll-reveal'),
    ).toBe(true);
    expect(
      compiled.querySelector('.about-section__history-heading')?.classList.contains(
        'scroll-reveal',
      ),
    ).toBe(false);
    expect(compiled.querySelectorAll('.about-section__entry.scroll-reveal')).toHaveLength(0);

    const activeEntries = compiled.querySelectorAll('.about-section__entry--active');
    expect(activeEntries).toHaveLength(1);
    expect(activeEntries[0].id).toBe('about-source-parsing');
    expect(activeEntries[0].getAttribute('aria-current')).toBe('step');
  });

  it('starts the rail at the viewport line and ends it at 46% page scroll', () => {
    const vh = 1000;
    const maxScroll = 5000;
    const endScroll = 0.46 * maxScroll;
    // Fill opens the moment node 01's center reaches 60% of the viewport.
    expect(aboutRailProgressForGeometry(600, vh, 1200, maxScroll)).toBeCloseTo(0);
    // Fill completes at 46% page scroll no matter where the section sits.
    expect(aboutRailProgressForGeometry(400, vh, endScroll, maxScroll)).toBeCloseTo(1);
    expect(aboutRailProgressForGeometry(-800, vh, endScroll, maxScroll)).toBeCloseTo(1);
  });

  it('ends the rail at 46% page scroll on both 1080p and 1440p viewports', () => {
    const maxScroll = 5280;
    const endScroll = 0.46 * maxScroll;
    const nodeOnePageOffset = 1725;

    for (const vh of [985, 1345]) {
      // node 01's viewport position at the moment page scroll hits 46%.
      const firstNodeCenter = nodeOnePageOffset - endScroll;
      expect(
        aboutRailProgressForGeometry(firstNodeCenter, vh, endScroll, maxScroll),
      ).toBeCloseTo(1);
    }
  });

  it('reports no rail progress when the page cannot scroll', () => {
    expect(aboutRailProgressForGeometry(0, 768, 0, 0)).toBe(0);
  });

  it('selects the number closest to the smoothed rail head', () => {
    const nodeProgresses = [0, 0.28, 0.66, 1];

    expect(closestTimelineNodeIndex(0, nodeProgresses)).toBe(0);
    expect(closestTimelineNodeIndex(0.3, nodeProgresses)).toBe(1);
    expect(closestTimelineNodeIndex(0.7, nodeProgresses)).toBe(2);
    expect(closestTimelineNodeIndex(0.96, nodeProgresses)).toBe(3);
  });

  it('enables scroll debugging only for the matching URL tag', () => {
    expect(aboutScrollDebugEnabled('?aboutDebug=scroll')).toBe(true);
    expect(aboutScrollDebugEnabled('', '#aboutDebug=scroll')).toBe(true);
    expect(aboutScrollDebugEnabled('?aboutDebug=timeline')).toBe(false);
    expect(aboutScrollDebugEnabled('', '#about')).toBe(false);
  });

  it('hides the tuning overlay by default and renders it for the debug URL', () => {
    expect(compiled.querySelector('.about-section__scroll-debug')).toBeNull();

    window.history.replaceState({}, '', '/?aboutDebug=scroll');
    const debugFixture = TestBed.createComponent(AboutSectionComponent);
    debugFixture.componentRef.setInput('bio', bioData);
    debugFixture.detectChanges();
    const debugOverlay = debugFixture.nativeElement.querySelector(
      '.about-section__scroll-debug',
    );

    expect(debugOverlay?.textContent).toContain('Scroll Debug · Dev Only');
    expect(debugOverlay?.textContent).toContain('Page');
    expect(debugOverlay?.textContent).toContain('About');
    expect(debugOverlay?.textContent).toContain('Rail cursor');
    expect(debugOverlay?.textContent).toContain('Rail target');
    expect(debugOverlay?.textContent).toContain('Rail glow');
    expect(debugOverlay?.textContent).toContain('Chapter');
    expect(debugOverlay?.textContent).toContain('60% vh');
    expect(debugOverlay?.textContent).toContain('page 46%');
    debugFixture.destroy();
  });

  it('coalesces scroll updates and keeps number activation on the smoothed rail head', () => {
    const frameCallbacks: FrameRequestCallback[] = [];
    const requestFrame = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback: FrameRequestCallback) => {
        frameCallbacks.push(callback);
        return frameCallbacks.length;
      });
    const entries = Array.from(
      compiled.querySelectorAll<HTMLElement>('.about-section__entry'),
    );
    entries.forEach((entry, index) => {
      vi.spyOn(entry, 'getBoundingClientRect').mockReturnValue({
        top: 700 + index * 400,
        height: 200,
      } as DOMRect);
    });
    const nodes = Array.from(
      compiled.querySelectorAll<HTMLElement>('.about-section__node'),
    );
    nodes.forEach((node, index) => {
      vi.spyOn(node, 'getBoundingClientRect').mockReturnValue({
        top: 100 + index * 300,
        height: 40,
      } as DOMRect);
    });
    vi.spyOn(
      compiled.querySelector<HTMLElement>('.about-section__timeline')!,
      'getBoundingClientRect',
    ).mockReturnValue({ top: 100 } as DOMRect);
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(400);
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(
      window.innerHeight + 1000,
    );
    vi.spyOn(fixture.nativeElement, 'getBoundingClientRect').mockReturnValue({
      top: -400,
      height: 1000,
    } as DOMRect);
    const readProgress = (): number =>
      (
        fixture.componentInstance as unknown as {
          timelineProgress: () => number;
        }
      ).timelineProgress();
    const readTargetProgress = (): number =>
      (
        fixture.componentInstance as unknown as {
          timelineTargetProgress: () => number;
        }
      ).timelineTargetProgress();
    const readActiveIndex = (): number =>
      (
        fixture.componentInstance as unknown as {
          activeEntryIndex: () => number;
        }
      ).activeEntryIndex();
    const initialProgress = readProgress();

    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('scroll'));

    expect(requestFrame).toHaveBeenCalledTimes(1);
    const timelineFrame = frameCallbacks.shift();
    timelineFrame?.(16);

    const firstEasedProgress = readProgress();
    expect(firstEasedProgress).toBeGreaterThan(initialProgress);
    expect(firstEasedProgress).toBeLessThan(readTargetProgress());
    expect(readActiveIndex()).toBe(
      closestTimelineNodeIndex(firstEasedProgress, [0, 1 / 3, 2 / 3, 1]),
    );

    const nextTimelineFrame = frameCallbacks.find((callback) => callback === timelineFrame);
    expect(nextTimelineFrame).toBeDefined();
    nextTimelineFrame?.(116);

    const secondEasedProgress = readProgress();
    expect(secondEasedProgress).toBeGreaterThan(firstEasedProgress);

    const thirdTimelineFrame = frameCallbacks.find((callback) => callback === timelineFrame);
    expect(thirdTimelineFrame).toBeDefined();
    thirdTimelineFrame?.(216);
    expect(readActiveIndex()).toBe(
      closestTimelineNodeIndex(readProgress(), [0, 1 / 3, 2 / 3, 1]),
    );
  });
});

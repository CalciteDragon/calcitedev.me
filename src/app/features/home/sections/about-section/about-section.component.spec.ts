import { ComponentFixture, TestBed } from '@angular/core/testing';
import { bioData } from '../../../../data/bio.data';
import { AboutSectionComponent } from './about-section.component';

describe('AboutSectionComponent', () => {
  let fixture: ComponentFixture<AboutSectionComponent>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AboutSectionComponent);
    fixture.componentRef.setInput('bio', bioData);
    fixture.detectChanges();
    compiled = fixture.nativeElement;
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

    expect(compiled.querySelectorAll('a[href="#projects"]')).toHaveLength(2);
    expect(compiled.querySelector('.about-section__side-note')?.textContent).toContain(
      "we didn't place first unfortunately haha",
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
});

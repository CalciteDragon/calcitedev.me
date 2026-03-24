import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScrollService } from '../../../core/services/scroll.service';
import { FeatureCardsComponent } from './feature-cards.component';

describe('FeatureCardsComponent', () => {
  let fixture: ComponentFixture<FeatureCardsComponent>;
  let compiled: HTMLElement;
  let scrollService: { scrollToSection: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    scrollService = { scrollToSection: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [FeatureCardsComponent],
      providers: [{ provide: ScrollService, useValue: scrollService }],
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureCardsComponent);
    fixture.detectChanges();
    compiled = fixture.nativeElement;
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render exactly 3 feature cards', () => {
    expect(compiled.querySelectorAll('app-card').length).toBe(3);
  });

  it('should render About Me as the first card title', () => {
    const titles = compiled.querySelectorAll('.feature-card__title');
    expect(titles[0]?.textContent?.trim()).toBe('About Me');
  });

  it('should render Latest Projects as the second card title', () => {
    const titles = compiled.querySelectorAll('.feature-card__title');
    expect(titles[1]?.textContent?.trim()).toBe('Latest Projects');
  });

  it('should render My Skills as the third card title', () => {
    const titles = compiled.querySelectorAll('.feature-card__title');
    expect(titles[2]?.textContent?.trim()).toBe('My Skills');
  });

  it('should render a CTA button for each card', () => {
    expect(compiled.querySelectorAll('app-cta-button').length).toBe(3);
  });

  it('should render a pixel icon image for each card', () => {
    expect(compiled.querySelectorAll('.feature-card__icon').length).toBe(3);
  });

  it('should scroll to about section when About Me CTA is clicked', () => {
    const buttons = compiled.querySelectorAll('button');
    (buttons[0] as HTMLButtonElement).click();

    expect(scrollService.scrollToSection).toHaveBeenCalledWith('about');
  });

  it('should scroll to projects section when Latest Projects CTA is clicked', () => {
    const buttons = compiled.querySelectorAll('button');
    (buttons[1] as HTMLButtonElement).click();

    expect(scrollService.scrollToSection).toHaveBeenCalledWith('projects');
  });

  it('should scroll to skills section when My Skills CTA is clicked', () => {
    const buttons = compiled.querySelectorAll('button');
    (buttons[2] as HTMLButtonElement).click();

    expect(scrollService.scrollToSection).toHaveBeenCalledWith('skills');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});

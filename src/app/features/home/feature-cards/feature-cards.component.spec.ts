import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { FeatureCardsComponent } from './feature-cards.component';

describe('FeatureCardsComponent', () => {
  let fixture: ComponentFixture<FeatureCardsComponent>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureCardsComponent],
      providers: [provideRouter([])],
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

  it('should navigate to /about when About Me CTA is clicked', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    const buttons = compiled.querySelectorAll('button');
    (buttons[0] as HTMLButtonElement).click();

    expect(navigateSpy).toHaveBeenCalledWith(['/about']);
  });

  it('should navigate to /projects when Latest Projects CTA is clicked', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    const buttons = compiled.querySelectorAll('button');
    (buttons[1] as HTMLButtonElement).click();

    expect(navigateSpy).toHaveBeenCalledWith(['/projects']);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});

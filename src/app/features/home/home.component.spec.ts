import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './home.component';
import { ScrollService } from '../../core/services/scroll.service';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let compiled: HTMLElement;
  let mockScrollService: {
    initSectionObserver: ReturnType<typeof vi.fn>;
    destroySectionObserver: ReturnType<typeof vi.fn>;
    scrollToSection: ReturnType<typeof vi.fn>;
    activeSection: ReturnType<typeof signal<string>>;
  };

  beforeEach(async () => {
    mockScrollService = {
      initSectionObserver: vi.fn(),
      destroySectionObserver: vi.fn(),
      scrollToSection: vi.fn(),
      activeSection: signal('home'),
    };

    // ScrollRevealDirective uses IntersectionObserver — stub it for the test env
    vi.stubGlobal(
      'IntersectionObserver',
      vi.fn(function () {
        return {
          observe: vi.fn(),
          unobserve: vi.fn(),
          disconnect: vi.fn(),
        };
      }),
    );

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        { provide: ScrollService, useValue: mockScrollService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    compiled = fixture.nativeElement;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the hero section', () => {
    expect(compiled.querySelector('app-hero')).toBeTruthy();
  });

  it('should render the feature cards section', () => {
    expect(compiled.querySelector('app-feature-cards')).toBeTruthy();
  });

  it('should pass bioData name to the hero', () => {
    const h1 = compiled.querySelector('.hero__name');
    expect(h1?.textContent).toContain('TYLER HAWTHORN');
  });

  it('should render five sections with correct ids', () => {
    const sections = compiled.querySelectorAll('.main-page > section');
    const ids = Array.from(sections).map((s) => s.id);
    expect(ids).toEqual(['home', 'projects', 'about', 'skills', 'contact']);
  });

  it('should call ScrollService.initSectionObserver with all section ids in ngAfterViewInit', () => {
    expect(mockScrollService.initSectionObserver).toHaveBeenCalledWith([
      'home',
      'projects',
      'about',
      'skills',
      'contact',
    ]);
  });

  it('should call ScrollService.destroySectionObserver in ngOnDestroy', () => {
    fixture.destroy();
    expect(mockScrollService.destroySectionObserver).toHaveBeenCalled();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let compiled: HTMLElement;

  beforeEach(async () => {
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
      providers: [provideRouter([])],
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
});

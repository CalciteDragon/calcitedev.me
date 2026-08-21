import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { NavbarComponent } from './navbar.component';
import { ScrollService } from '../../core/services/scroll.service';

describe('NavbarComponent', () => {
  let fixture: ComponentFixture<NavbarComponent>;
  let component: NavbarComponent;
  let compiled: HTMLElement;
  let mockScrollService: { activeSection: ReturnType<typeof signal<string>>; scrollToSection: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockScrollService = {
      activeSection: signal('home'),
      scrollToSection: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([]),
        { provide: ScrollService, useValue: mockScrollService },
      ],
    }).compileComponents();

    // Override Router.url to return '/' so navigateToSection treats it as home
    const router = TestBed.inject(Router);
    Object.defineProperty(router, 'url', { get: () => '/', configurable: true });

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    compiled = fixture.nativeElement;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render brand link to /', () => {
    const brand = compiled.querySelector('a.navbar__brand') as HTMLAnchorElement;
    expect(brand).toBeTruthy();
    expect(brand.getAttribute('href')).toBe('/');

    const logo = brand.querySelector('img.navbar__brand-image') as HTMLImageElement;
    expect(logo.getAttribute('src')).toBe('/assets/images/navbar-logo.png');
    expect(logo.getAttribute('alt')).toBe('');
    expect(brand.querySelector('.navbar__brand-text')?.textContent?.trim()).toBe('ALCITEdev.me');
  });

  it('should render 4 nav buttons in order: About, Projects, Extras, Contact', () => {
    const buttons = Array.from(
      compiled.querySelectorAll('.navbar__links .navbar__link'),
    ) as HTMLButtonElement[];
    expect(buttons).toHaveLength(4);
    expect(buttons[0].textContent?.trim()).toBe('About');
    expect(buttons[1].textContent?.trim()).toBe('Projects');
    expect(buttons[2].textContent?.trim()).toBe('Extras');
    expect(buttons[3].textContent?.trim()).toBe('Contact');
  });

  it('should scroll to section when a nav button is clicked on home page', () => {
    const buttons = Array.from(
      compiled.querySelectorAll('.navbar__links .navbar__link'),
    ) as HTMLButtonElement[];

    buttons[0].click();
    fixture.detectChanges();

    expect(mockScrollService.scrollToSection).toHaveBeenCalledWith('about');
  });

  it('should apply --active class to the button matching scrollService.activeSection()', () => {
    mockScrollService.activeSection.set('about');
    fixture.detectChanges();

    const buttons = Array.from(
      compiled.querySelectorAll('.navbar__links .navbar__link'),
    ) as HTMLButtonElement[];

    const aboutButton = buttons.find(b => b.textContent?.trim() === 'About');
    const projectsButton = buttons.find(b => b.textContent?.trim() === 'Projects');

    expect(aboutButton?.classList.contains('navbar__link--active')).toBe(true);
    expect(projectsButton?.classList.contains('navbar__link--active')).toBe(false);
  });

  it('should open/close menu on hamburger click', () => {
    const hamburger = compiled.querySelector('.navbar__hamburger') as HTMLButtonElement;

    expect(component.isMenuOpen()).toBe(false);

    hamburger.click();
    fixture.detectChanges();
    expect(component.isMenuOpen()).toBe(true);

    hamburger.click();
    fixture.detectChanges();
    expect(component.isMenuOpen()).toBe(false);
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { HeroComponent } from './hero.component';
import { Bio } from '../../../models/bio.model';

const mockBio: Bio = {
  name: 'Tyler Hawthorn',
  alias: 'Calcite',
  title: 'Full-Stack & Game Developer',
  email: 'calcitedragon@gmail.com',
  about: {
    intro: [{ text: 'Short bio.' }],
    history: [],
  },
};

describe('HeroComponent', () => {
  let fixture: ComponentFixture<HeroComponent>;
  let component: HeroComponent;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('bio', mockBio);
    fixture.detectChanges();
    compiled = fixture.nativeElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the name as the neon title image with the name as alt text', () => {
    const img = compiled.querySelector('h1.hero__name .hero__name-img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.src).toContain('hero-title.webp');
    expect(img.alt).toBe('Tyler Hawthorn');
  });

  it('should render the alias uppercased', () => {
    const alias = compiled.querySelector('.hero__alias');
    expect(alias?.textContent).toContain('AKA CALCITE');
  });

  it('should render the title as subtitle', () => {
    expect(compiled.querySelector('.hero__subtitle')?.textContent).toContain(
      'Full-Stack & Game Developer',
    );
  });

  it('should render the avatar image', () => {
    const img = compiled.querySelector('.hero__avatar-img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.src).toContain('avatar-placeholder.svg');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});

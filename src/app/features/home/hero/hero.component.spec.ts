import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { HeroComponent } from './hero.component';
import { Bio } from '../../../models/bio.model';

const mockBio: Bio = {
  name: 'Tyler Hawthorn',
  alias: 'Calcite',
  title: 'Full Stack Developer & Game Enthusiast',
  tagline: 'Code · Create · Innovate',
  email: 'tyler@calcitedev.me',
  shortBio: 'Short bio.',
  extendedBio: 'Extended bio.',
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

  it('should render the name uppercased in the h1', () => {
    const h1 = compiled.querySelector('.hero__name');
    expect(h1?.textContent).toContain('TYLER HAWTHORN');
  });

  it('should render the alias uppercased', () => {
    const alias = compiled.querySelector('.hero__alias');
    expect(alias?.textContent).toContain('AKA CALCITE');
  });

  it('should render the title as subtitle', () => {
    expect(compiled.querySelector('.hero__subtitle')?.textContent).toContain(
      'Full Stack Developer',
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

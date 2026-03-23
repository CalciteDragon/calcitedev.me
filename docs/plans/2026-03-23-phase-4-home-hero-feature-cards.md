# Phase 4: Home Page — Hero + Feature Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `HeroComponent` and `FeatureCardsComponent`, wire them into `HomeComponent`, and deliver a fully styled landing page (solid dark background — canvas background is Phase 5).

**Architecture:** `HomeComponent` is the smart container — it reads `bioData` and passes a `Bio` object down to `HeroComponent` as a required signal input. `FeatureCardsComponent` owns its static card configuration as a private `readonly` array (not a data file — these are UI navigation shortcuts, not user-authored content). Both child components are presentational. The `ScrollRevealDirective` (already built in Phase 2) is applied to the feature cards section from `HomeComponent`'s template.

**Tech Stack:** Angular 21 standalone components, signal inputs (`input()`/`input.required()`), OnPush change detection, `inject()`, `Router`, `DOCUMENT`/`PLATFORM_ID` for SSR-safe scroll, SCSS with global partials, Vitest via `@angular/build:unit-test`

---

## Questions & Decisions

Resolved before writing the plan:

### Q1: Should `HeroComponent` be smart (reads `bioData` directly) or presentational (receives inputs)?

`HomeComponent` is the designated smart container for the home feature (see `architecture.md`). Sub-components within a feature can read domain data, but the architecture's smart/presentational split says smart components own data access and pass down to presentational children.

**Decision:** `HeroComponent` is presentational — it takes `bio = input.required<Bio>()`. `HomeComponent` reads `bioData` and passes it in. This makes `HeroComponent` easier to test and consistent with the established pattern.

### Q2: "View My Work" CTA — smooth scroll or route navigation?

The feature cards section is directly below the hero on the same page. Navigating to `/` again just re-renders the same route. Smooth-scrolling to `#feature-cards` is the correct UX.

**Decision:** `HeroComponent` injects `DOCUMENT` and calls `getElementById('feature-cards')?.scrollIntoView({ behavior: 'smooth' })`. Guarded by `isPlatformBrowser` for SSR/prerender compatibility. `CtaButtonComponent`'s `(ctaClick)` output triggers this method.

### Q3: Feature card data — where does it live?

Three options: hardcoded template, readonly array in the component class, or a new data file. The cards are fixed UI navigation (not user-authored content, not configurable per-user). No future phase requires reading or modifying this from outside the component.

**Decision:** Defined as a `readonly` typed array in `FeatureCardsComponent` class. Adding a data file for three static UI shortcuts would be premature.

### Q4: "My Skills" card destination — `/about` or `/about#skills`?

The `/skills` route doesn't exist (the nav link was removed in a prior commit). The Skills section will live inside `AboutComponent` as `SkillsGridComponent` in Phase 6.

**Decision:** Route to `/about`. Update to `/about#skills` fragment in Phase 6 once `SkillsGridComponent` has a stable element `id`.

### Q5: How do feature card CTAs handle navigation?

`CtaButtonComponent` renders a `<button>` and emits `(ctaClick)`. Wrapping `<button>` in `<a routerLink>` is invalid HTML. The `[routerLink]` directive can be applied to any element but looks odd on a non-anchor.

**Decision:** `FeatureCardsComponent` injects `Router` and calls `this.router.navigate([route])` on each card's `(ctaClick)` emission. Phase 7 accessibility polish can revisit link vs. button semantics.

### Q6: What is the hero minimum height?

The navbar is `position: fixed` at approximately `64px`. Setting a min-height ensures the hero section fills the first viewport and the feature cards appear below the fold (creating natural scroll incentive).

**Decision:** `min-height: calc(100svh - 64px)` — documented as a magic number to tune in Phase 9 responsive pass. Use `100svh` (small viewport height) rather than `100vh` to handle mobile browser chrome.

### Q7: Where does `appScrollReveal` get applied — `HomeComponent` template or `FeatureCardsComponent`'s host?

`appScrollReveal` should animate the entire feature cards section sliding in. Applying it in `HomeComponent`'s template (`<app-feature-cards appScrollReveal />`) keeps the animation concern in the parent orchestrator, which is the right layer of responsibility.

**Decision:** Applied in `HomeComponent` template. `HomeComponent` imports `ScrollRevealDirective`. The directive targets the `<app-feature-cards>` host element, which has `display: block` — the global `.scroll-reveal` and `.scroll-reveal--visible` CSS classes work correctly on host elements.

---

## File Structure

### Created by this plan

```
src/app/features/home/
├── hero/
│   ├── hero.component.ts          # Presentational — bio input, scroll method
│   ├── hero.component.html        # Avatar, pre-heading, name, alias, tagline, CTA
│   ├── hero.component.scss        # Flex layout, gradient text, pixel fonts
│   └── hero.component.spec.ts     # Render tests + scroll behavior
├── feature-cards/
│   ├── feature-cards.component.ts     # Static card config array, Router.navigate
│   ├── feature-cards.component.html   # @for over cards, CardComponent, CtaButtonComponent
│   ├── feature-cards.component.scss   # 3-col grid → 1-col mobile, feature-card inner layout
│   └── feature-cards.component.spec.ts # Card count, titles, navigation
├── home.component.spec.ts         # NEW — child component presence, creation
```

### Modified by this plan

```
src/app/features/home/
├── home.component.ts              # Stub → smart container (imports, bioData)
├── home.component.html            # Stub → <app-hero> + <app-feature-cards appScrollReveal>
└── home.component.scss            # Stub → solid background
docs/development.md                # Mark Phase 4 tasks complete
```

### Dependencies (already exist — do not create)

```
src/app/shared/components/card/card.component.ts       # glowColor input, ng-content
src/app/shared/components/cta-button/cta-button.component.ts  # glowColor, ctaClick output
src/app/shared/directives/scroll-reveal.directive.ts   # appScrollReveal
src/app/shared/types/glow-color.type.ts                # GlowColor = 'cyan'|'blue'|...
src/app/models/bio.model.ts                            # Bio interface
src/app/data/bio.data.ts                               # bioData constant
src/assets/pixel-art/avatar-placeholder.svg
src/assets/pixel-art/icon-about.svg
src/assets/pixel-art/icon-projects.svg
src/assets/pixel-art/icon-skills.svg
src/styles/_glow.scss                                  # @mixin gradient-text (use in hero)
src/styles/_mixins.scss                                # content-container, section-spacing, lg
src/styles/_variables.scss                             # spacing vars, breakpoints
src/styles/_animations.scss                            # .scroll-reveal / .scroll-reveal--visible
```

---

## Task 1: HeroComponent

**Files:**
- Create: `src/app/features/home/hero/hero.component.spec.ts`
- Create: `src/app/features/home/hero/hero.component.ts`
- Create: `src/app/features/home/hero/hero.component.html`
- Create: `src/app/features/home/hero/hero.component.scss`

- [ ] **Step 1.1: Write the failing spec**

Create `src/app/features/home/hero/hero.component.spec.ts`:

```typescript
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

  it('should render the tagline', () => {
    expect(compiled.querySelector('.hero__tagline')?.textContent).toContain(
      'Code · Create · Innovate',
    );
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

  it('should scroll to feature-cards when CTA is clicked', () => {
    const doc = TestBed.inject(DOCUMENT);
    const mockElement = { scrollIntoView: vi.fn() };
    vi.spyOn(doc, 'getElementById').mockReturnValue(
      mockElement as unknown as HTMLElement,
    );

    const button = compiled.querySelector('button') as HTMLButtonElement;
    button.click();

    expect(doc.getElementById).toHaveBeenCalledWith('feature-cards');
    expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});
```

- [ ] **Step 1.2: Run test — verify it fails**

```bash
npm test
```

Expected: FAIL — `Cannot find module './hero.component'`

- [ ] **Step 1.3: Create `hero.component.ts`**

Create `src/app/features/home/hero/hero.component.ts`:

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  inject,
  input,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { CtaButtonComponent } from '../../../shared/components/cta-button/cta-button.component';
import { Bio } from '../../../models/bio.model';

@Component({
  selector: 'app-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CtaButtonComponent],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
})
export class HeroComponent {
  readonly bio = input.required<Bio>();

  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  scrollToFeatureCards(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.document
      .getElementById('feature-cards')
      ?.scrollIntoView({ behavior: 'smooth' });
  }
}
```

- [ ] **Step 1.4: Create `hero.component.html`**

Create `src/app/features/home/hero/hero.component.html`:

```html
<section class="hero" aria-label="Hero introduction">
  <div class="hero__container">
    <div class="hero__avatar">
      <img
        src="assets/pixel-art/avatar-placeholder.svg"
        alt="Pixel art avatar of Tyler Hawthorn"
        class="hero__avatar-img"
        width="220"
        height="220"
      />
    </div>

    <div class="hero__content">
      <p class="hero__pre-heading">HEY, I'M</p>
      <h1 class="hero__name">{{ bio().name.toUpperCase() }}</h1>
      <p class="hero__alias">AKA {{ bio().alias.toUpperCase() }}</p>
      <p class="hero__tagline">{{ bio().tagline }}</p>
      <p class="hero__subtitle">{{ bio().title }}</p>
      <app-cta-button glowColor="cyan" (ctaClick)="scrollToFeatureCards()">
        View My Work
      </app-cta-button>
    </div>
  </div>
</section>
```

- [ ] **Step 1.5: Create `hero.component.scss`**

Create `src/app/features/home/hero/hero.component.scss`:

```scss
@use 'variables' as *;
@use 'mixins' as *;
@use 'glow' as *;

:host {
  display: block;
}

.hero {
  @include content-container;
  // 64px is approximate navbar height — tune in Phase 9 responsive pass
  min-height: calc(100svh - 64px);
  display: flex;
  align-items: center;
  padding-block: $space-8;

  &__container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-6;
    width: 100%;

    @include lg {
      flex-direction: row;
      align-items: center;
      gap: $space-8;
    }
  }

  &__avatar {
    flex-shrink: 0;
  }

  &__avatar-img {
    width: 160px;
    height: 160px;
    image-rendering: pixelated;

    @include lg {
      width: 220px;
      height: 220px;
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: $space-2;

    @include lg {
      align-items: flex-start;
      text-align: left;
    }
  }

  &__pre-heading {
    font-family: 'Press Start 2P', monospace;
    font-size: 0.75rem;
    letter-spacing: 0.3em;
    color: var(--text-secondary);
    margin: 0;
  }

  &__name {
    font-size: clamp(2.5rem, 6vw, 5rem);
    font-weight: 700;
    line-height: 1.1;
    margin: 0;
    @include gradient-text;
  }

  &__alias {
    font-family: 'Press Start 2P', monospace;
    font-size: clamp(0.5rem, 1.5vw, 0.75rem);
    color: var(--accent-gold);
    letter-spacing: 0.1em;
    margin: 0;
  }

  &__tagline {
    font-size: 1.125rem;
    color: var(--text-secondary);
    letter-spacing: 0.05em;
    margin: $space-2 0 0;
  }

  &__subtitle {
    font-size: 1rem;
    color: var(--text-secondary);
    margin: 0 0 $space-4;
  }
}
```

- [ ] **Step 1.6: Run tests — verify they pass**

```bash
npm test
```

Expected: All 7 `HeroComponent` tests PASS.

- [ ] **Step 1.7: Commit**

```bash
git add src/app/features/home/hero/
git commit -m "feat: add HeroComponent with bio inputs and scroll-to-feature-cards CTA"
```

---

## Task 2: FeatureCardsComponent

**Files:**
- Create: `src/app/features/home/feature-cards/feature-cards.component.spec.ts`
- Create: `src/app/features/home/feature-cards/feature-cards.component.ts`
- Create: `src/app/features/home/feature-cards/feature-cards.component.html`
- Create: `src/app/features/home/feature-cards/feature-cards.component.scss`

- [ ] **Step 2.1: Write the failing spec**

Create `src/app/features/home/feature-cards/feature-cards.component.spec.ts`:

```typescript
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
});
```

- [ ] **Step 2.2: Run test — verify it fails**

```bash
npm test
```

Expected: FAIL — `Cannot find module './feature-cards.component'`

- [ ] **Step 2.3: Create `feature-cards.component.ts`**

Create `src/app/features/home/feature-cards/feature-cards.component.ts`:

```typescript
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CardComponent } from '../../../shared/components/card/card.component';
import { CtaButtonComponent } from '../../../shared/components/cta-button/cta-button.component';
import { GlowColor } from '../../../shared/types/glow-color.type';

interface FeatureCard {
  icon: string;
  iconAlt: string;
  title: string;
  description: string;
  ctaLabel: string;
  route: string;
  glowColor: GlowColor;
}

@Component({
  selector: 'app-feature-cards',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardComponent, CtaButtonComponent],
  templateUrl: './feature-cards.component.html',
  styleUrl: './feature-cards.component.scss',
})
export class FeatureCardsComponent {
  private readonly router = inject(Router);

  readonly cards: FeatureCard[] = [
    {
      icon: 'assets/pixel-art/icon-about.svg',
      iconAlt: 'Pixel art "About Me" icon',
      title: 'About Me',
      description:
        'Full stack developer who builds fast, well-tested web apps and the occasional game. Learn about my journey and what drives me.',
      ctaLabel: 'Learn More',
      route: '/about',
      glowColor: 'cyan',
    },
    {
      icon: 'assets/pixel-art/icon-projects.svg',
      iconAlt: 'Pixel art "Projects" icon',
      title: 'Latest Projects',
      description:
        "From Angular apps to game experiments — explore the things I've built and the problems they solve.",
      ctaLabel: 'See Projects',
      route: '/projects',
      glowColor: 'blue',
    },
    {
      icon: 'assets/pixel-art/icon-skills.svg',
      iconAlt: 'Pixel art "Skills" icon',
      title: 'My Skills',
      description:
        'TypeScript, Angular, Node.js, PostgreSQL, Docker, and more — a full-stack toolkit built for real-world projects.',
      ctaLabel: 'View Skills',
      // Routes to /about — update to /about#skills fragment in Phase 6
      route: '/about',
      glowColor: 'purple',
    },
  ];

  navigate(route: string): void {
    this.router.navigate([route]);
  }
}
```

- [ ] **Step 2.4: Create `feature-cards.component.html`**

Create `src/app/features/home/feature-cards/feature-cards.component.html`:

```html
<section class="feature-cards" id="feature-cards" aria-label="Site sections">
  <div class="feature-cards__grid">
    @for (card of cards; track card.title) {
      <app-card [glowColor]="card.glowColor">
        <div class="feature-card">
          <img
            [src]="card.icon"
            [alt]="card.iconAlt"
            class="feature-card__icon"
            width="64"
            height="64"
          />
          <h3 class="feature-card__title">{{ card.title }}</h3>
          <p class="feature-card__desc">{{ card.description }}</p>
          <app-cta-button
            [glowColor]="card.glowColor"
            (ctaClick)="navigate(card.route)"
          >
            {{ card.ctaLabel }}
          </app-cta-button>
        </div>
      </app-card>
    }
  </div>
</section>
```

- [ ] **Step 2.5: Create `feature-cards.component.scss`**

Create `src/app/features/home/feature-cards/feature-cards.component.scss`:

```scss
@use 'variables' as *;
@use 'mixins' as *;

:host {
  display: block;
}

.feature-cards {
  @include content-container;
  padding-block: $space-8;

  &__grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: $space-4;

    @include md {
      grid-template-columns: repeat(3, 1fr);
    }
  }
}

.feature-card {
  padding: $space-4;
  display: flex;
  flex-direction: column;
  gap: $space-3;
  height: 100%;

  &__icon {
    width: 64px;
    height: 64px;
    image-rendering: pixelated;
  }

  &__title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  &__desc {
    font-size: 0.9375rem;
    color: var(--text-secondary);
    line-height: 1.6;
    flex: 1;
    margin: 0;
  }
}
```

- [ ] **Step 2.6: Run tests — verify they pass**

```bash
npm test
```

Expected: All 9 `FeatureCardsComponent` tests PASS.

- [ ] **Step 2.7: Commit**

```bash
git add src/app/features/home/feature-cards/
git commit -m "feat: add FeatureCardsComponent with 3 navigation cards (About, Projects, Skills)"
```

---

## Task 3: HomeComponent — wire up + spec

**Files:**
- Create: `src/app/features/home/home.component.spec.ts`
- Modify: `src/app/features/home/home.component.ts`
- Modify: `src/app/features/home/home.component.html`
- Modify: `src/app/features/home/home.component.scss`

- [ ] **Step 3.1: Write the failing spec**

Create `src/app/features/home/home.component.spec.ts`:

```typescript
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
      vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      })),
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
```

- [ ] **Step 3.2: Run test — verify it fails**

```bash
npm test
```

Expected: FAIL — `HomeComponent` exists but `app-hero` is not found in the template.

- [ ] **Step 3.3: Update `home.component.ts`**

Replace the stub contents of `src/app/features/home/home.component.ts`:

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeroComponent } from './hero/hero.component';
import { FeatureCardsComponent } from './feature-cards/feature-cards.component';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';
import { bioData } from '../../data/bio.data';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HeroComponent, FeatureCardsComponent, ScrollRevealDirective],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  readonly bio = bioData;
}
```

- [ ] **Step 3.4: Update `home.component.html`**

Replace the stub contents of `src/app/features/home/home.component.html`:

```html
<main class="home" aria-label="Home page">
  <app-hero [bio]="bio" />
  <app-feature-cards appScrollReveal />
</main>
```

- [ ] **Step 3.5: Update `home.component.scss`**

Replace the stub contents of `src/app/features/home/home.component.scss`:

```scss
:host {
  display: block;
}

// Solid dark background for Phase 4.
// BackgroundSceneComponent (Phase 5) will be layered behind this content.
.home {
  background-color: var(--bg-primary);
}
```

- [ ] **Step 3.6: Run tests — verify they pass**

```bash
npm test
```

Expected: All 4 `HomeComponent` tests PASS. All prior `HeroComponent` and `FeatureCardsComponent` tests continue to PASS. Full test suite green.

- [ ] **Step 3.7: Commit**

```bash
git add src/app/features/home/home.component.ts \
        src/app/features/home/home.component.html \
        src/app/features/home/home.component.scss \
        src/app/features/home/home.component.spec.ts
git commit -m "feat: wire HomeComponent — hero + feature cards with scroll-reveal"
```

---

## Task 4: Update Living Docs

**Files:**
- Modify: `docs/development.md`

- [ ] **Step 4.1: Mark Phase 4 tasks complete in `docs/development.md`**

In the Phase 4 section, change all `- [ ]` to `- [x]`:

```markdown
- [x] `HeroComponent`
- [x] `FeatureCardsComponent`
- [x] `HomeComponent` — orchestrates Hero + FeatureCards, solid dark background
- [x] Scroll-reveal animation on the feature cards section
```

Also add a note below the Phase 4 deliverable confirming what was built:

```markdown
**Built:** `HeroComponent` (presentational, `bio` signal input), `FeatureCardsComponent` (static card config, `Router.navigate`), `HomeComponent` updated (smart container, reads `bioData`). `appScrollReveal` applied to feature cards section from HomeComponent template. Canvas background deferred to Phase 5.
```

- [ ] **Step 4.2: Run full test suite one final time**

```bash
npm test
```

Expected: All tests PASS. No regressions.

- [ ] **Step 4.3: Commit**

```bash
git add docs/development.md
git commit -m "docs: mark Phase 4 tasks complete in development.md"
```

---

## Verification Checklist

Before declaring Phase 4 done, confirm all of the following in the browser (`npm start`):

- [ ] Navigating to `http://localhost:4200` shows the hero section
- [ ] Hero displays "TYLER HAWTHORN" in gradient text, "AKA CALCITE" in gold, tagline and subtitle
- [ ] Pixel-art avatar placeholder renders on the left (desktop) / top (mobile)
- [ ] "View My Work" button scrolls smoothly to the feature cards section
- [ ] Feature cards section shows 3 cards: About Me (cyan), Latest Projects (blue), My Skills (purple)
- [ ] Each card has its pixel icon, title, description, and CTA button
- [ ] "Learn More" navigates to `/about`
- [ ] "See Projects" navigates to `/projects`
- [ ] "View Skills" navigates to `/about`
- [ ] Feature cards section slides in via scroll-reveal animation when page loads
- [ ] Mobile layout: avatar stacks above text; cards stack in a single column
- [ ] No console errors

---

## What Phase 5 Builds On

Phase 5 (`BackgroundSceneComponent`) adds a full-viewport `<canvas>` element **behind** the hero content. The `HomeComponent` template will be updated to include `<app-background-scene>` rendered with `position: absolute; z-index: 0`, and the hero section will gain `position: relative; z-index: 1`. No changes to `HeroComponent` or `FeatureCardsComponent` are needed.

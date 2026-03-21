# Phase 2: Shared Components & Directives — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the reusable, stateless, input-driven component library — cards, buttons, chips, tags, social links, and two attribute directives — that all feature pages compose in later phases.

**Architecture:** All shared components live in `src/app/shared/components/`, directives in `src/app/shared/directives/`. Every component is standalone, uses `ChangeDetectionStrategy.OnPush`, signal-based `input()`/`output()`, and CSS custom properties for theming. Components are purely presentational — no service injection, no side effects. Directives use Angular `host` metadata for DOM interaction. The existing SCSS glow mixins (`_glow.scss`) and animation utilities (`_animations.scss`) are composed, not duplicated.

**Tech Stack:** Angular 21, TypeScript (strict), SCSS with CSS custom properties, Vitest (via `@angular/build:unit-test`)

**Notes:**
- TDD applies to the two directives (they have behavioral logic). Components are purely visual/template-driven — verified via `ng build` and visual inspection.
- Phase 2 runs **in parallel with Phase 3** (data layer). Components use primitive inputs (`string`, `string[]`), NOT domain model interfaces. Smart components in Phase 4/6 will map model objects to these inputs.
- The project uses Vitest with jsdom (not Karma/Jest). Test command: `npx ng test --watch=false`.

---

## Questions

### 1. SocialLinksComponent vs. existing footer social links

The footer already has hard-coded inline SVG social links with per-platform glow colors. Phase 2 adds a reusable `SocialLinksComponent` that does the same thing data-driven.

**Decision:** Build `SocialLinksComponent` as a new standalone component. Do NOT refactor the footer in Phase 2 — that happens when Phase 3 data or Phase 6 (Contact page) needs it. This avoids scope creep and keeps the footer stable.

### 2. Model interfaces — create now or defer to Phase 3?

`ProjectCardComponent` and `SocialLinksComponent` need structured input data. Phase 3 creates `Project`, `Skill`, and `SocialLink` model interfaces.

**Decision:** Use primitive inputs on all components (`string`, `string[]`, local interfaces). This keeps Phase 2 fully independent of Phase 3. The `SocialLinksComponent` defines a local `SocialLinkItem` interface for its array input. When Phase 3 creates domain models, smart components map model objects to component inputs — the shared components never import domain models.

### 3. CardComponent padding strategy

The card is a generic container. `ProjectCardComponent` needs a full-bleed thumbnail at the top, which conflicts with uniform padding.

**Decision:** CardComponent has NO default padding — it provides border, background, glow, overflow, and hover lift. Consumers control their own internal padding. This makes the card truly generic: feature cards add `padding: 1.5rem` to their content wrapper, while `ProjectCardComponent` has zero-padding thumbnail + padded body section.

### 4. CtaButtonComponent element type

CTA buttons are used for both navigation ("View My Work" → route) and actions. A `<button>` inside an `<a>` is semantically invalid.

**Decision:** Render a `<button type="button">` element with `<ng-content>` for the label. Emit a `ctaClick` output. The consuming smart component handles navigation (via `Router.navigate()`) or any other action in the click handler. This keeps the component purely presentational.

### 5. GlowDirective vs. CardComponent glow

Both provide glow effects. How do they differ?

**Decision:** They're complementary. `CardComponent` uses SCSS glow mixins (compiled, includes border + inset shadow + outer glow). `GlowDirective` applies outer `box-shadow` only via inline styles on hover — lighter-touch, for adding glow to arbitrary elements (images, sections, custom elements) without writing SCSS.

### 6. ScrollRevealDirective animation approach

The development plan says "adds a CSS class when element enters viewport, triggers fade/slide animation."

**Decision:** CSS-class approach. The directive adds `scroll-reveal` (hidden state) on init and `scroll-reveal--visible` (revealed state) on intersection. Animation styles live in `_animations.scss` — including a `@media (prefers-reduced-motion: reduce)` override that disables animation. The directive has zero knowledge of animation — it just toggles classes.

### 7. Testing strategy

**Decision:** TDD for the two directives (they have real behavioral logic: IntersectionObserver, mouse events, signal state). Components are purely visual — verified via `ng build` (compilation) and `ng serve` (visual inspection). No unit tests for components in Phase 2; they're thin wrappers around templates and SCSS.

### 8. SectionHeaderComponent heading level

Should the `<h2>` be configurable?

**Decision:** Hard-code `<h2>`. This component is specifically for section headings (design spec says H2 = 2rem–2.5rem, weight 700). If an `<h3>` variant is needed later, it can be added. YAGNI.

---

## File Structure

### Created by this plan

```
src/app/shared/
├── components/
│   ├── card/
│   │   ├── card.component.ts
│   │   ├── card.component.html
│   │   └── card.component.scss
│   ├── cta-button/
│   │   ├── cta-button.component.ts
│   │   ├── cta-button.component.html
│   │   └── cta-button.component.scss
│   ├── section-header/
│   │   ├── section-header.component.ts
│   │   ├── section-header.component.html
│   │   └── section-header.component.scss
│   ├── skill-chip/
│   │   ├── skill-chip.component.ts       (inline template)
│   │   └── skill-chip.component.scss
│   ├── tech-tag/
│   │   ├── tech-tag.component.ts         (inline template)
│   │   └── tech-tag.component.scss
│   ├── social-links/
│   │   ├── social-links.component.ts
│   │   ├── social-links.component.html
│   │   └── social-links.component.scss
│   └── project-card/
│       ├── project-card.component.ts
│       ├── project-card.component.html
│       └── project-card.component.scss
├── directives/
│   ├── glow.directive.ts
│   ├── glow.directive.spec.ts
│   ├── scroll-reveal.directive.ts
│   └── scroll-reveal.directive.spec.ts
```

### Modified by this plan

```
src/styles/_animations.scss              — Add scroll-reveal CSS classes
```

---

## Dependency Graph

```
Task 1: scroll-reveal CSS ──────────────────────────────────┐
                                                             │
Task 2: GlowDirective (TDD) ─── independent                 │
                                                             │
Task 3: ScrollRevealDirective (TDD) ◄───────────────────────┘

Tasks 4–9: Components ─── all independent of each other ─┐
  Task 4: CardComponent                                   │
  Task 5: CtaButtonComponent                              │
  Task 6: SectionHeaderComponent                          │
  Task 7: SkillChipComponent                              │
  Task 8: TechTagComponent ──────────────────────────┐    │
  Task 9: SocialLinksComponent                       │    │
                                                     │    │
Task 10: ProjectCardComponent ◄─── depends on 4 + 8 ┘    │
                                                          │
Task 11: Build verification ◄─────────────────────────────┘
```

Tasks 4–9 can be parallelized by subagents.

---

## Task 1: Add scroll-reveal CSS classes

**Files:**
- Modify: `src/styles/_animations.scss`

- [ ] **Step 1: Add scroll-reveal classes to `_animations.scss`**

Append after the existing `@media (prefers-reduced-motion: reduce)` block:

```scss
// Scroll-reveal (toggled by ScrollRevealDirective)
.scroll-reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 500ms $ease-entrance, transform 500ms $ease-entrance;
}

.scroll-reveal--visible {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .scroll-reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npx ng build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/styles/_animations.scss
git commit -m "style: add scroll-reveal animation classes"
```

---

## Task 2: GlowDirective (TDD)

**Files:**
- Create: `src/app/shared/directives/glow.directive.ts`
- Create: `src/app/shared/directives/glow.directive.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/shared/directives/glow.directive.spec.ts`:

```typescript
import { Component } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { GlowDirective } from './glow.directive';

@Component({
  template: `<div appGlow="blue">Content</div>`,
  standalone: true,
  imports: [GlowDirective],
})
class TestHostComponent {}

@Component({
  template: `<div appGlow>Default color</div>`,
  standalone: true,
  imports: [GlowDirective],
})
class DefaultColorHostComponent {}

describe('GlowDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let div: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    div = fixture.nativeElement.querySelector('div');
  });

  it('should have no glow initially', () => {
    expect(div.style.boxShadow).toBe('none');
  });

  it('should apply blue glow on mouseenter', () => {
    div.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(div.style.boxShadow).toContain('59, 130, 246');
  });

  it('should remove glow on mouseleave', () => {
    div.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    div.dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();
    expect(div.style.boxShadow).toBe('none');
  });

  it('should set transition on host element', () => {
    expect(div.style.transition).toContain('box-shadow');
  });

  it('should fall back to cyan for unknown color', () => {
    // Default host uses appGlow="" (empty string) — falls back to cyan
    const defaultFixture = TestBed.createComponent(DefaultColorHostComponent);
    defaultFixture.detectChanges();
    const defaultDiv = defaultFixture.nativeElement.querySelector('div');
    defaultDiv.dispatchEvent(new MouseEvent('mouseenter'));
    defaultFixture.detectChanges();
    expect(defaultDiv.style.boxShadow).toContain('34, 211, 238');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test --watch=false`
Expected: FAIL — `GlowDirective` not found.

- [ ] **Step 3: Write the implementation**

Create `src/app/shared/directives/glow.directive.ts`:

```typescript
import { computed, Directive, input, signal } from '@angular/core';

@Directive({
  selector: '[appGlow]',
  standalone: true,
  host: {
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
    '[style.box-shadow]': 'currentGlow()',
    '[style.transition]': '"box-shadow 300ms ease-out"',
  },
})
export class GlowDirective {
  readonly appGlow = input<string>('cyan');

  private readonly isHovered = signal(false);

  private readonly glowMap: Record<string, string> = {
    cyan: '0 0 20px rgba(34, 211, 238, 0.5), 0 0 40px rgba(34, 211, 238, 0.15)',
    blue: '0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.15)',
    purple: '0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.15)',
    pink: '0 0 20px rgba(236, 72, 153, 0.5), 0 0 40px rgba(236, 72, 153, 0.15)',
    gold: '0 0 20px rgba(245, 158, 11, 0.5), 0 0 40px rgba(245, 158, 11, 0.15)',
  };

  protected readonly currentGlow = computed(() => {
    if (!this.isHovered()) return 'none';
    return this.glowMap[this.appGlow()] ?? this.glowMap['cyan'];
  });

  protected onMouseEnter(): void {
    this.isHovered.set(true);
  }

  protected onMouseLeave(): void {
    this.isHovered.set(false);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx ng test --watch=false`
Expected: All 5 GlowDirective tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/shared/directives/glow.directive.ts src/app/shared/directives/glow.directive.spec.ts
git commit -m "feat: add glow directive with tests"
```

---

## Task 3: ScrollRevealDirective (TDD)

**Files:**
- Create: `src/app/shared/directives/scroll-reveal.directive.ts`
- Create: `src/app/shared/directives/scroll-reveal.directive.spec.ts`

**Depends on:** Task 1 (scroll-reveal CSS classes)

- [ ] **Step 1: Write the failing test**

Create `src/app/shared/directives/scroll-reveal.directive.spec.ts`:

```typescript
import { Component, PLATFORM_ID } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ScrollRevealDirective } from './scroll-reveal.directive';

@Component({
  template: `<div appScrollReveal>Content</div>`,
  standalone: true,
  imports: [ScrollRevealDirective],
})
class TestHostComponent {}

describe('ScrollRevealDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let div: HTMLElement;
  let observeCallback: (entries: Partial<IntersectionObserverEntry>[]) => void;
  let mockObserve: ReturnType<typeof vi.fn>;
  let mockUnobserve: ReturnType<typeof vi.fn>;
  let mockDisconnect: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    mockObserve = vi.fn();
    mockUnobserve = vi.fn();
    mockDisconnect = vi.fn();

    vi.stubGlobal(
      'IntersectionObserver',
      vi.fn((callback: any) => {
        observeCallback = callback;
        return {
          observe: mockObserve,
          unobserve: mockUnobserve,
          disconnect: mockDisconnect,
        };
      })
    );

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    div = fixture.nativeElement.querySelector('div');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should add scroll-reveal class on init', () => {
    expect(div.classList.contains('scroll-reveal')).toBe(true);
  });

  it('should observe the host element', () => {
    expect(mockObserve).toHaveBeenCalled();
  });

  it('should add scroll-reveal--visible class when intersecting', () => {
    observeCallback([{ isIntersecting: true, target: div }]);
    expect(div.classList.contains('scroll-reveal--visible')).toBe(true);
  });

  it('should unobserve after reveal when revealOnce is true (default)', () => {
    observeCallback([{ isIntersecting: true, target: div }]);
    expect(mockUnobserve).toHaveBeenCalled();
  });

  it('should disconnect observer on destroy', () => {
    fixture.destroy();
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test --watch=false`
Expected: FAIL — `ScrollRevealDirective` not found.

- [ ] **Step 3: Write the implementation**

Create `src/app/shared/directives/scroll-reveal.directive.ts`:

```typescript
import {
  Directive,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  Renderer2,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  readonly revealThreshold = input<number>(0.1);
  readonly revealOnce = input<boolean>(true);

  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.renderer.addClass(this.el.nativeElement, 'scroll-reveal');

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.renderer.addClass(entry.target, 'scroll-reveal--visible');

            if (this.revealOnce()) {
              this.observer?.unobserve(entry.target);
            }
          } else if (!this.revealOnce()) {
            this.renderer.removeClass(entry.target, 'scroll-reveal--visible');
          }
        }
      },
      { threshold: this.revealThreshold() }
    );

    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx ng test --watch=false`
Expected: All 5 ScrollRevealDirective tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/shared/directives/scroll-reveal.directive.ts src/app/shared/directives/scroll-reveal.directive.spec.ts
git commit -m "feat: add scroll-reveal directive with tests"
```

---

## Task 4: CardComponent

**Files:**
- Create: `src/app/shared/components/card/card.component.ts`
- Create: `src/app/shared/components/card/card.component.html`
- Create: `src/app/shared/components/card/card.component.scss`

- [ ] **Step 1: Create the component**

Create `src/app/shared/components/card/card.component.ts`:

```typescript
import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
})
export class CardComponent {
  readonly glowColor = input<string>('cyan');
}
```

Create `src/app/shared/components/card/card.component.html`:

```html
<div [class]="'card card--' + glowColor()">
  <ng-content />
</div>
```

Create `src/app/shared/components/card/card.component.scss`:

```scss
@use 'variables' as *;
@use 'mixins' as *;
@use 'glow' as *;

:host {
  display: block;
}

.card {
  background-color: var(--bg-surface);
  border-radius: $radius-md;
  overflow: hidden;
  transition: box-shadow $transition-base, border-color $transition-base;

  @include motion-safe {
    transition: transform $transition-base, box-shadow $transition-base, border-color $transition-base;

    &:hover {
      transform: translateY(-4px);
    }
  }

  &--cyan {
    @include glow-cyan;
    &:hover { @include glow-cyan($hover: true); }
  }

  &--blue {
    @include glow-blue;
    &:hover { @include glow-blue($hover: true); }
  }

  &--purple {
    @include glow-purple;
    &:hover { @include glow-purple($hover: true); }
  }

  &--pink {
    @include glow-pink;
    &:hover { @include glow-pink($hover: true); }
  }

  &--gold {
    @include glow-gold;
    &:hover { @include glow-gold($hover: true); }
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npx ng build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/shared/components/card/
git commit -m "feat: add card component"
```

---

## Task 5: CtaButtonComponent

**Files:**
- Create: `src/app/shared/components/cta-button/cta-button.component.ts`
- Create: `src/app/shared/components/cta-button/cta-button.component.html`
- Create: `src/app/shared/components/cta-button/cta-button.component.scss`

- [ ] **Step 1: Create the component**

Create `src/app/shared/components/cta-button/cta-button.component.ts`:

```typescript
import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'app-cta-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cta-button.component.html',
  styleUrl: './cta-button.component.scss',
})
export class CtaButtonComponent {
  readonly glowColor = input<string>('cyan');
  readonly ctaClick = output<void>();
}
```

Create `src/app/shared/components/cta-button/cta-button.component.html`:

```html
<button
  type="button"
  [class]="'cta-button cta-button--' + glowColor()"
  (click)="ctaClick.emit()"
>
  <ng-content />
</button>
```

Create `src/app/shared/components/cta-button/cta-button.component.scss`:

```scss
@use 'variables' as *;
@use 'mixins' as *;
@use 'glow' as *;
@use 'typography' as *;

:host {
  display: inline-block;
}

.cta-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $space-1;
  padding: 0.75rem $space-4;
  border-radius: $radius-md;
  background: transparent;
  color: var(--text-primary);
  font-family: $font-heading;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: box-shadow $transition-base, border-color $transition-base;

  @include motion-safe {
    transition: transform $transition-fast, box-shadow $transition-base, border-color $transition-base;

    &:hover {
      transform: scale(1.02);
    }

    &:active {
      transform: scale(0.98);
    }
  }

  &:focus-visible {
    outline: 2px solid var(--accent-cyan);
    outline-offset: 2px;
  }

  &--cyan {
    @include glow-cyan;
    &:hover { @include glow-cyan($hover: true); }
  }

  &--blue {
    @include glow-blue;
    &:hover { @include glow-blue($hover: true); }
  }

  &--purple {
    @include glow-purple;
    &:hover { @include glow-purple($hover: true); }
  }

  &--pink {
    @include glow-pink;
    &:hover { @include glow-pink($hover: true); }
  }

  &--gold {
    @include glow-gold;
    &:hover { @include glow-gold($hover: true); }
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npx ng build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/shared/components/cta-button/
git commit -m "feat: add cta-button component"
```

---

## Task 6: SectionHeaderComponent

**Files:**
- Create: `src/app/shared/components/section-header/section-header.component.ts`
- Create: `src/app/shared/components/section-header/section-header.component.html`
- Create: `src/app/shared/components/section-header/section-header.component.scss`

- [ ] **Step 1: Create the component**

Create `src/app/shared/components/section-header/section-header.component.ts`:

```typescript
import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-section-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './section-header.component.html',
  styleUrl: './section-header.component.scss',
})
export class SectionHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}
```

Create `src/app/shared/components/section-header/section-header.component.html`:

```html
<div class="section-header">
  <h2 class="section-header__title">{{ title() }}</h2>
  @if (subtitle()) {
    <p class="section-header__subtitle">{{ subtitle() }}</p>
  }
</div>
```

Create `src/app/shared/components/section-header/section-header.component.scss`:

```scss
@use 'variables' as *;
@use 'glow' as *;

:host {
  display: block;
}

.section-header {
  text-align: center;
  margin-bottom: $space-6;
}

.section-header__title {
  @include gradient-text;
  margin-bottom: $space-1;
}

.section-header__subtitle {
  color: var(--text-secondary);
  font-size: 1.125rem;
  max-width: 600px;
  margin-inline: auto;
}
```

- [ ] **Step 2: Verify build**

Run: `npx ng build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/shared/components/section-header/
git commit -m "feat: add section-header component"
```

---

## Task 7: SkillChipComponent

**Files:**
- Create: `src/app/shared/components/skill-chip/skill-chip.component.ts` (inline template)
- Create: `src/app/shared/components/skill-chip/skill-chip.component.scss`

- [ ] **Step 1: Create the component**

Create `src/app/shared/components/skill-chip/skill-chip.component.ts`:

```typescript
import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-skill-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span [class]="'skill-chip skill-chip--' + color()">{{ name() }}</span>`,
  styleUrl: './skill-chip.component.scss',
})
export class SkillChipComponent {
  readonly name = input.required<string>();
  readonly color = input<string>('cyan');
}
```

Create `src/app/shared/components/skill-chip/skill-chip.component.scss`:

```scss
@use 'variables' as *;

$chip-colors: (
  'cyan': $accent-cyan,
  'blue': $accent-blue,
  'purple': $accent-purple,
  'pink': $accent-pink,
  'gold': $accent-gold,
);

:host {
  display: inline-block;
}

.skill-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: $radius-full;
  font-size: 0.875rem;
  font-weight: 500;
  background-color: rgba($bg-border, 0.5);
  border: 1px solid transparent;
  transition: border-color 200ms ease-out, box-shadow 200ms ease-out;

  @each $name, $color in $chip-colors {
    &--#{$name} {
      color: $color;
      border-color: rgba($color, 0.3);

      &:hover {
        box-shadow: 0 0 10px rgba($color, 0.2);
      }
    }
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npx ng build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/shared/components/skill-chip/
git commit -m "feat: add skill-chip component"
```

---

## Task 8: TechTagComponent

**Files:**
- Create: `src/app/shared/components/tech-tag/tech-tag.component.ts` (inline template)
- Create: `src/app/shared/components/tech-tag/tech-tag.component.scss`

- [ ] **Step 1: Create the component**

Create `src/app/shared/components/tech-tag/tech-tag.component.ts`:

```typescript
import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-tech-tag',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="tech-tag">{{ name() }}</span>`,
  styleUrl: './tech-tag.component.scss',
})
export class TechTagComponent {
  readonly name = input.required<string>();
}
```

Create `src/app/shared/components/tech-tag/tech-tag.component.scss`:

```scss
@use 'variables' as *;
@use 'typography' as *;

:host {
  display: inline-block;
}

.tech-tag {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  border-radius: $radius-sm;
  font-family: $font-code;
  font-size: 0.75rem;
  color: var(--text-secondary);
  background-color: rgba($bg-border, 0.6);
  border: 1px solid rgba($bg-border, 0.8);
}
```

- [ ] **Step 2: Verify build**

Run: `npx ng build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/shared/components/tech-tag/
git commit -m "feat: add tech-tag component"
```

---

## Task 9: SocialLinksComponent

**Files:**
- Create: `src/app/shared/components/social-links/social-links.component.ts`
- Create: `src/app/shared/components/social-links/social-links.component.html`
- Create: `src/app/shared/components/social-links/social-links.component.scss`

- [ ] **Step 1: Create the component**

Create `src/app/shared/components/social-links/social-links.component.ts`:

```typescript
import { Component, ChangeDetectionStrategy, input } from '@angular/core';

export interface SocialLinkItem {
  platform: string;
  url: string;
  label: string;
}

@Component({
  selector: 'app-social-links',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './social-links.component.html',
  styleUrl: './social-links.component.scss',
})
export class SocialLinksComponent {
  readonly links = input.required<SocialLinkItem[]>();

  protected readonly iconPaths: Record<string, string> = {
    github:
      'M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z',
    discord:
      'M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z',
    linkedin:
      'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
    twitter:
      'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  };
}
```

Create `src/app/shared/components/social-links/social-links.component.html`:

```html
<div class="social-links">
  @for (link of links(); track link.platform) {
    <a
      [class]="'social-links__link social-links__link--' + link.platform"
      [href]="link.url"
      target="_blank"
      rel="noopener noreferrer"
      [attr.aria-label]="link.label"
    >
      @if (iconPaths[link.platform]) {
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path [attr.d]="iconPaths[link.platform]" />
        </svg>
      } @else {
        <span class="social-links__label">{{ link.label }}</span>
      }
    </a>
  }
</div>
```

Create `src/app/shared/components/social-links/social-links.component.scss`:

```scss
@use 'variables' as *;

$link-colors: (
  'github': $accent-cyan,
  'discord': $accent-blue,
  'linkedin': $accent-purple,
  'twitter': $accent-blue,
);

:host {
  display: block;
}

.social-links {
  display: flex;
  align-items: center;
  gap: $space-4;
}

.social-links__link {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: color 300ms ease-out, filter 300ms ease-out;

  svg {
    width: 24px;
    height: 24px;
    fill: currentColor;
  }

  &:focus-visible {
    outline: 2px solid var(--accent-cyan);
    outline-offset: 4px;
    border-radius: 2px;
  }

  @each $platform, $color in $link-colors {
    &--#{$platform}:hover {
      color: $color;
      filter: drop-shadow(0 0 8px rgba($color, 0.4));
    }
  }
}

.social-links__label {
  font-size: 0.875rem;
  font-weight: 500;
}
```

- [ ] **Step 2: Verify build**

Run: `npx ng build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/shared/components/social-links/
git commit -m "feat: add social-links component"
```

---

## Task 10: ProjectCardComponent

**Files:**
- Create: `src/app/shared/components/project-card/project-card.component.ts`
- Create: `src/app/shared/components/project-card/project-card.component.html`
- Create: `src/app/shared/components/project-card/project-card.component.scss`

**Depends on:** Task 4 (CardComponent), Task 8 (TechTagComponent)

- [ ] **Step 1: Create the component**

Create `src/app/shared/components/project-card/project-card.component.ts`:

```typescript
import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CardComponent } from '../card/card.component';
import { TechTagComponent } from '../tech-tag/tech-tag.component';

@Component({
  selector: 'app-project-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardComponent, TechTagComponent],
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.scss',
  host: {
    '(click)': 'cardClick.emit()',
  },
})
export class ProjectCardComponent {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly imageUrl = input<string>('');
  readonly tags = input<string[]>([]);
  readonly glowColor = input<string>('cyan');
  readonly cardClick = output<void>();
}
```

Create `src/app/shared/components/project-card/project-card.component.html`:

```html
<app-card [glowColor]="glowColor()">
  @if (imageUrl()) {
    <div class="project-card__thumbnail">
      <img [src]="imageUrl()" [alt]="title()" loading="lazy" />
    </div>
  }
  <div class="project-card__body">
    <h3 class="project-card__title">{{ title() }}</h3>
    <p class="project-card__description">{{ description() }}</p>
    @if (tags().length > 0) {
      <div class="project-card__tags">
        @for (tag of tags(); track tag) {
          <app-tech-tag [name]="tag" />
        }
      </div>
    }
  </div>
</app-card>
```

Create `src/app/shared/components/project-card/project-card.component.scss`:

```scss
@use 'variables' as *;

:host {
  display: block;
  cursor: pointer;
}

.project-card__thumbnail {
  img {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }
}

.project-card__body {
  padding: $space-3;
}

.project-card__title {
  color: var(--text-primary);
  margin-bottom: $space-1;
}

.project-card__description {
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.6;
  margin-bottom: $space-2;
}

.project-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
```

- [ ] **Step 2: Verify build**

Run: `npx ng build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/shared/components/project-card/
git commit -m "feat: add project-card component"
```

---

## Task 11: Build verification

**Files:** None modified — verification only.

- [ ] **Step 1: Run full build**

Run: `npx ng build`
Expected: Build succeeds with zero errors. All new components compile cleanly.

- [ ] **Step 2: Run all tests**

Run: `npx ng test --watch=false`
Expected: All directive tests pass (10 total: 5 GlowDirective + 5 ScrollRevealDirective).

- [ ] **Step 3: Visual spot-check (manual)**

Run: `npx ng serve`

To visually verify components, temporarily edit a feature page (e.g., `home.component.html`) to render the components with sample data. **Do not commit these changes** — they exist only for manual inspection. Phase 4 will properly compose these components.

Example test markup for `home.component.html`:

```html
<section class="page">
  <app-section-header title="Component Preview" subtitle="Phase 2 shared components" />

  <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 2rem;">
    <app-card glowColor="cyan"><div style="padding: 1.5rem;">Cyan card</div></app-card>
    <app-card glowColor="blue"><div style="padding: 1.5rem;">Blue card</div></app-card>
    <app-card glowColor="purple"><div style="padding: 1.5rem;">Purple card</div></app-card>
  </div>

  <div style="display: flex; gap: 1rem; margin-bottom: 2rem;">
    <app-cta-button glowColor="cyan">View My Work</app-cta-button>
    <app-cta-button glowColor="pink">Contact Me</app-cta-button>
  </div>

  <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 2rem;">
    <app-skill-chip name="TypeScript" color="cyan" />
    <app-skill-chip name="Angular" color="blue" />
    <app-skill-chip name="Node.js" color="purple" />
    <app-tech-tag name="Angular" />
    <app-tech-tag name="TypeScript" />
  </div>

  <app-project-card
    title="Sample Project"
    description="A description of the project goes here."
    glowColor="blue"
    [tags]="['Angular', 'TypeScript', 'SCSS']"
  />
</section>
```

Requires adding imports to `home.component.ts`:

```typescript
imports: [
  SectionHeaderComponent,
  CardComponent,
  CtaButtonComponent,
  SkillChipComponent,
  TechTagComponent,
  ProjectCardComponent,
],
```

**After visual inspection, discard all uncommitted changes.** Warning: this destroys any uncommitted edits in the home feature directory. Only run this after you are done inspecting.

```bash
git checkout -- src/app/features/home/
```

- [ ] **Step 4: Confirm clean state**

Run: `git status`
Expected: Working tree clean — only committed Phase 2 files present.

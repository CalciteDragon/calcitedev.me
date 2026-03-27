# Pre-Phase 7 UX Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all layout, spacing, content, and functional issues surfaced in the post-Phase-6 visual audit so the site is production-quality before Phase 7 interactivity is layered on.

**Architecture:** Eight sequential tasks across four phases. Phases 1–2 fix regressions and bugs (section heights, footer links, project grid, filter bar). Phase 3 adds structural visual improvements (About card, project detail redesign, dynamic titles). Phase 4 is a cleanup pass over the spacing system. Every task produces a working, committed state; no task leaves the site broken.

**Tech Stack:** Angular 21, TypeScript strict, SCSS with CSS custom properties, `@angular/platform-browser` `Title` service for dynamic `<title>`, Vitest via `npm test`.

---

## Questions & Key Decisions

**Q1: Should the `#home` section keep `min-height: 100svh`?**
Yes. The home section holds the full-screen hero and the feature cards below it. It correctly fills the viewport. Only the downstream content sections (projects, about, skills, contact) should drop the blanket min-height.

**Q2: About section — card wrapper only, or two-column layout with avatar?**
Card wrapper only. The pixel-art avatar is a placeholder image (currently broken). A two-column layout with a broken image would look worse than a well-structured single-column card. Revisit when real avatar assets exist.

**Q3: Filter bar — show tags with count ≥ 2, or top-N by count?**
Count ≥ 2 threshold, computed dynamically. At 5 projects this yields 7 tags vs. 14 now. The threshold is a named constant so it's trivial to change as the project list grows. Do NOT hardcode a list — derive it from data.

**Q4: Footer — reuse `SocialLinksComponent` or just fix the URLs?**
Reuse `SocialLinksComponent`. The footer's custom `footer__social-link` HTML duplicates the same SVG paths already in `SocialLinksComponent.iconPaths`. DRY wins. Remove the custom footer social SCSS after migrating; `SocialLinksComponent` owns that styling.

**Q5: Project detail "Related Projects" — how selected?**
Show up to 3 projects. Priority: projects sharing ≥ 1 tag with the current project first, then any remaining projects to fill up to 3. Rendered as simple name+link cards in the detail component — do NOT import `ProjectCardComponent` here (overkill, same-file complexity).

**Q6: Dynamic page titles — per-section on scroll, or per-route only?**
Per-route only. The project detail page gets `{Project Title} — Calcite`. The home page gets `Tyler Hawthorn — Calcite`. Updating the `<title>` tag as users scroll through sections would be nonstandard UX.

**Q7: Mobile nav overlay — is there a bug to fix?**
No code fix needed. The overlay is fully implemented: `[class.navbar__overlay--visible]="isMenuOpen()"` in `navbar.component.html:43`, CSS in `navbar.component.scss:153–170`. The visual issue seen during the audit was a screenshot captured mid-transition (300ms ease-out). Mark as verified and skip.

**Q8: `--section-padding-h` fallback values — safe to remove?**
Yes. `--section-padding-h: 1.5rem` is defined in `:root` in `styles.scss:66`. The fallback values in about/contact/skills component SCSS are redundant. Remove in the cleanup pass.

---

## File Map

| File | Change |
|------|--------|
| `src/app/features/home/home.component.html` | Add `--full` modifier class to `#home` section only |
| `src/app/features/home/home.component.scss` | `min-height: 100svh` → `--full` modifier only; add `padding-block` fallback for content sections |
| `src/app/features/home/home.component.ts` | Inject `Title` service; set home page title on init |
| `src/app/layout/footer/footer.component.ts` | Expose `socialLinksData`; import `SocialLinksComponent` |
| `src/app/layout/footer/footer.component.html` | Replace hardcoded SVG links with `<app-social-links>` |
| `src/app/layout/footer/footer.component.scss` | Remove `.footer__social-link*` rules (owned by `SocialLinksComponent` now) |
| `src/app/features/home/sections/projects-section/projects-section.component.ts` | Add `popularTags` computed (tags with count ≥ 2) |
| `src/app/features/home/sections/projects-section/projects-section.component.html` | Add content wrapper div; use `popularTags()` in filter bar |
| `src/app/features/home/sections/projects-section/projects-section.component.spec.ts` | Add `popularTags` test |
| `src/app/features/home/sections/projects-section/project-list/project-list.component.scss` | Constrain grid to 3-column max; add `@use 'variables'` |
| `src/app/features/home/sections/about-section/about-section.component.html` | Add `.about-section__card` wrapper div with divider |
| `src/app/features/home/sections/about-section/about-section.component.scss` | Add card, divider, and `@use 'variables'` styles; remove redundant fallback |
| `src/app/features/projects/project-detail/project-detail.component.ts` | Add `relatedProjects` computed; inject `Title`; set title via `effect()` |
| `src/app/features/projects/project-detail/project-detail.component.html` | Add card wrapper; styled back button; Related Projects section |
| `src/app/features/projects/project-detail/project-detail.component.scss` | Style card wrapper, styled back button, related projects grid |
| `src/app/features/projects/project-detail/project-detail.component.spec.ts` | Add `relatedProjects` tests |
| `src/app/features/home/sections/contact-section/contact-section.component.scss` | Remove redundant fallback on `--section-padding-h` |
| `src/app/features/home/sections/skills-section/skills-section.component.scss` | Remove redundant fallback on `--section-padding-h` |

---

## Task 1: Fix Section Min-Heights

**Root cause:** `home.component.scss:12` applies `min-height: 100svh` to every `.main-page__section`. Content sections (projects, about, skills, contact) get full viewport height even when content is sparse, creating huge empty zones.

**Fix:** Gate `min-height: 100svh` behind a `--full` modifier class; add it only to `#home`.

**Files:**
- Modify: `src/app/features/home/home.component.html`
- Modify: `src/app/features/home/home.component.scss`

- [ ] **Step 1.1: Update `home.component.html` — add `--full` modifier to `#home` section only**

Replace the entire file content with:

```html
<div class="main-page">
  <section id="home" class="main-page__section main-page__section--full" aria-label="Home">
    <app-hero [bio]="bio" />
    <app-feature-cards appScrollReveal />
  </section>

  <section id="projects" class="main-page__section" aria-label="Projects">
    <app-projects-section [projects]="projects" />
  </section>

  <section id="about" class="main-page__section" aria-label="About">
    <app-about-section [bio]="bio" />
  </section>

  <section id="skills" class="main-page__section" aria-label="Skills">
    <app-skills-section [skillGroups]="skills" />
  </section>

  <section id="contact" class="main-page__section" aria-label="Contact">
    <app-contact-section [email]="bio.email" [socialLinks]="socialLinks" />
  </section>
</div>
```

- [ ] **Step 1.2: Update `home.component.scss` — gate `min-height` behind `--full`**

Replace the entire file content with:

```scss
:host {
  display: block;
}

.main-page {
  background-color: transparent;

  &__section {
    scroll-margin-top: var(--navbar-height);
    // Content sections size to their content + internal padding.
    // No min-height — avoids empty-space voids when content is sparse.

    &--full {
      // Hero section fills the viewport so the canvas background scene shows fully.
      min-height: 100svh;
    }
  }
}
```

- [ ] **Step 1.3: Run the dev server and visually verify**

Run `npm start` (if not already running). Navigate to `http://localhost:4200`.

- Scroll through About, Skills, and Contact.
- Each should now size naturally to its content — no more 500px voids.
- The Home hero should still fill the viewport on load.

- [ ] **Step 1.4: Commit**

```bash
git add src/app/features/home/home.component.html src/app/features/home/home.component.scss
git commit -m "fix: remove blanket 100svh min-height from content sections"
```

---

## Task 2: Fix Footer Social Links

**Root cause:** `footer.component.html` renders `href="#"` for all three social links. The correct URLs already exist in `socialLinksData`. `SocialLinksComponent` already renders the identical SVG paths; reuse it for DRY code.

**Files:**
- Modify: `src/app/layout/footer/footer.component.ts`
- Modify: `src/app/layout/footer/footer.component.html`
- Modify: `src/app/layout/footer/footer.component.scss`

- [ ] **Step 2.1: Update `footer.component.ts` — inject data and import `SocialLinksComponent`**

Replace the entire file content with:

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SocialLinksComponent } from '../../shared/components/social-links/social-links.component';
import { socialLinksData } from '../../data/social-links.data';

@Component({
  selector: 'app-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SocialLinksComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  protected readonly socialLinks = socialLinksData;
}
```

- [ ] **Step 2.2: Update `footer.component.html` — replace hardcoded SVG block**

Replace the entire file content with:

```html
<footer class="footer">
  <div class="footer__inner">
    <app-social-links [links]="socialLinks" />
    <p class="footer__copyright">&copy; 2026 Tyler Hawthorn. Built with Angular.</p>
  </div>
</footer>
```

- [ ] **Step 2.3: Update `footer.component.scss` — remove custom social link rules**

Read the current file first to identify only the social-link rules to remove. Replace the entire file content with (keeping only layout and copyright rules):

```scss
@use 'variables' as *;
@use 'mixins' as *;

:host {
  display: block;
}

.footer {
  border-top: 1px solid rgba($bg-border, 0.4);
  padding: $space-6 0;
}

.footer__inner {
  @include content-container;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-3;
}

.footer__copyright {
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-align: center;
}
```

- [ ] **Step 2.4: Run tests**

```bash
npm test
```

Expected: All existing tests pass. (FooterComponent has no unit tests — visual verification suffices.)

- [ ] **Step 2.5: Visually verify footer links work**

In the browser, click each footer social icon and confirm it navigates to the correct URL (GitHub, Discord, LinkedIn) rather than `#`.

- [ ] **Step 2.6: Commit**

```bash
git add src/app/layout/footer/footer.component.ts src/app/layout/footer/footer.component.html src/app/layout/footer/footer.component.scss
git commit -m "fix: wire footer social links to real URLs via SocialLinksComponent"
```

---

## Task 3: Project Grid Layout + Filter Bar Pruning

**Root cause (grid):** `project-list.component.scss` uses unbounded `repeat(auto-fill, minmax(320px, 1fr))`. At 1280px, all 5 cards fit in a single cramped row. No `max-width` wrapper exists in the projects section.

**Root cause (filter):** `ProjectsSectionComponent.allTags()` returns all 14 unique tags across 5 projects. Most tags appear only once, making the filter bar noisy. Tags appearing in ≥ 2 projects are meaningful filters.

**Files:**
- Modify: `src/app/features/home/sections/projects-section/projects-section.component.ts`
- Modify: `src/app/features/home/sections/projects-section/projects-section.component.html`
- Modify: `src/app/features/home/sections/projects-section/projects-section.component.spec.ts`
- Modify: `src/app/features/home/sections/projects-section/project-list/project-list.component.scss`

- [ ] **Step 3.1: Write the failing test for `popularTags`**

Open `src/app/features/home/sections/projects-section/projects-section.component.spec.ts`.

Add the following test to the existing `describe` block (after the `'derives unique tags from all projects'` test):

```typescript
it('returns only tags appearing in 2 or more projects', () => {
  // mockProjects: a=['Angular','TypeScript'], b=['React','TypeScript'], c=['Angular','Node.js']
  // Angular: a,c → 2 ✓   TypeScript: a,b → 2 ✓
  // React: b → 1 ✗        Node.js: c → 1 ✗
  const tags = ref.instance.popularTags();
  expect(tags).toContain('Angular');
  expect(tags).toContain('TypeScript');
  expect(tags).not.toContain('React');
  expect(tags).not.toContain('Node.js');
});
```

- [ ] **Step 3.2: Run the test to verify it fails**

```bash
npm test
```

Expected: FAIL with `ref.instance.popularTags is not a function` or similar.

- [ ] **Step 3.3: Add `popularTags` computed to `projects-section.component.ts`**

Replace the entire file content with:

```typescript
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { Project } from '../../../../models/project.model';
import { SectionHeaderComponent } from '../../../../shared/components/section-header/section-header.component';
import { ScrollRevealDirective } from '../../../../shared/directives/scroll-reveal.directive';
import { ProjectListComponent } from './project-list/project-list.component';

const POPULAR_TAG_MIN_COUNT = 2;

@Component({
  selector: 'app-projects-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionHeaderComponent, ScrollRevealDirective, ProjectListComponent],
  templateUrl: './projects-section.component.html',
  styleUrl: './projects-section.component.scss',
})
export class ProjectsSectionComponent {
  readonly projects = input.required<readonly Project[]>();

  readonly activeFilter = signal<string | null>(null);

  readonly allTags = computed(() =>
    [...new Set(this.projects().flatMap(p => p.tags))]
  );

  readonly popularTags = computed(() => {
    const counts = new Map<string, number>();
    for (const project of this.projects()) {
      for (const tag of project.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .filter(([, count]) => count >= POPULAR_TAG_MIN_COUNT)
      .map(([tag]) => tag);
  });

  readonly filteredProjects = computed(() => {
    const filter = this.activeFilter();
    if (!filter) return this.projects();
    return this.projects().filter(p => p.tags.includes(filter));
  });

  setFilter(tag: string | null): void {
    this.activeFilter.set(tag);
  }
}
```

- [ ] **Step 3.4: Run tests to verify `popularTags` passes**

```bash
npm test
```

Expected: All tests pass, including the new `popularTags` test.

- [ ] **Step 3.5: Update `projects-section.component.html` — add content wrapper and use `popularTags()`**

Replace the entire file content with:

```html
<section class="projects-section">
  <app-section-header title="Projects" />

  <div class="projects-section__content">
    <div class="projects-section__filter-bar" appScrollReveal>
      <button
        class="filter-pill"
        [class.filter-pill--active]="activeFilter() === null"
        (click)="setFilter(null)"
      >All</button>
      @for (tag of popularTags(); track tag) {
        <button
          class="filter-pill"
          [class.filter-pill--active]="activeFilter() === tag"
          (click)="setFilter(tag)"
        >{{ tag }}</button>
      }
    </div>

    <app-project-list [projects]="filteredProjects()" appScrollReveal />
  </div>
</section>
```

- [ ] **Step 3.6: Update `projects-section.component.scss` — add content wrapper with max-width**

Replace the entire file content with:

```scss
@use 'variables' as *;

:host {
  display: block;
}

.projects-section {
  padding: var(--section-padding-v) var(--section-padding-h);
}

.projects-section__content {
  max-width: var(--max-content-width);
  margin: 0 auto;
}

.projects-section__filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: $space-1;
  margin-bottom: $space-4;
}

.filter-pill {
  padding: 6px 16px;
  border-radius: 999px;
  border: 1px solid var(--bg-border);
  background: var(--bg-surface);
  color: var(--text-secondary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 200ms ease-out;

  &--active,
  &:hover {
    border-color: rgba(var(--accent-cyan-rgb), 0.5);
    color: var(--accent-cyan);
    box-shadow: var(--glow-cyan);
  }
}
```

- [ ] **Step 3.7: Update `project-list.component.scss` — constrain to 3-column max**

Replace the entire file content with:

```scss
@use 'variables' as *;
@use 'mixins' as *;

:host {
  display: block;
}

.project-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr));
  gap: $space-3;

  @include lg {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

- [ ] **Step 3.8: Run tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 3.9: Visually verify project grid**

In the browser, verify:
- At 1280px: projects render in a 3-column grid, not a single row
- At ≤1024px: grid auto-fills based on 300px min
- At ≤480px (mobile): single column
- Filter bar shows 7 tags (All + 6 popular tags for the current 5 projects), not 14

- [ ] **Step 3.10: Commit**

```bash
git add \
  src/app/features/home/sections/projects-section/projects-section.component.ts \
  src/app/features/home/sections/projects-section/projects-section.component.html \
  src/app/features/home/sections/projects-section/projects-section.component.scss \
  src/app/features/home/sections/projects-section/projects-section.component.spec.ts \
  src/app/features/home/sections/projects-section/project-list/project-list.component.scss
git commit -m "fix: constrain project grid to 3-column max; prune filter bar to popular tags"
```

---

## Task 4: About Section — Add Card Visual Structure

**Problem:** The About section is two bare paragraphs floating in empty space with no visual container. Every other section has card/chip/grid structure. The About section lacks personality and looks unfinished.

**Fix:** Wrap the bio content in a styled card panel with neon border and a visual divider between the short bio and extended bio.

**Files:**
- Modify: `src/app/features/home/sections/about-section/about-section.component.html`
- Modify: `src/app/features/home/sections/about-section/about-section.component.scss`

- [ ] **Step 4.1: Update `about-section.component.html` — wrap bio in a card**

Replace the entire file content with:

```html
<section class="about-section">
  <app-section-header title="About Me" />
  <div class="about-section__content" appScrollReveal>
    <div class="about-section__card">
      <p class="about-section__bio">{{ bio().shortBio }}</p>
      <hr class="about-section__divider" aria-hidden="true" />
      <p class="about-section__extended">{{ bio().extendedBio }}</p>
    </div>
  </div>
</section>
```

- [ ] **Step 4.2: Update `about-section.component.scss` — add card styles**

Replace the entire file content with:

```scss
@use 'variables' as *;

:host {
  display: block;
}

.about-section {
  padding: var(--section-padding-v) var(--section-padding-h);

  &__content {
    max-width: 800px;
    margin: 0 auto;
  }

  &__card {
    background: var(--bg-surface);
    border: 1px solid rgba(var(--accent-cyan-rgb), 0.2);
    border-radius: $radius-lg;
    box-shadow: var(--glow-cyan);
    padding: $space-6;
  }

  &__bio {
    font-family: 'Inter', sans-serif;
    font-size: 1.125rem;
    line-height: 1.6;
    color: var(--text-primary);
  }

  &__divider {
    border: none;
    border-top: 1px solid var(--bg-border);
    margin: $space-4 0;
  }

  &__extended {
    font-family: 'Inter', sans-serif;
    font-size: 1rem;
    line-height: 1.6;
    color: var(--text-secondary);
    white-space: pre-line;
  }
}
```

- [ ] **Step 4.3: Visually verify About section**

In the browser, scroll to About. Verify:
- Bio text sits inside a dark surface card with a subtle cyan border glow
- A horizontal divider separates the short bio from the extended bio
- Card is max 800px wide and centered

- [ ] **Step 4.4: Commit**

```bash
git add src/app/features/home/sections/about-section/about-section.component.html src/app/features/home/sections/about-section/about-section.component.scss
git commit -m "style: add card panel to About section for visual structure"
```

---

## Task 5: Project Detail Page — Redesign Layout

**Problems:**
1. Content is unstyled text on a transparent background — no card/panel treatment
2. The back link is a tiny unstyled `←` text link
3. No navigation to other projects — dead end once on a detail page

**Fix:**
1. Wrap the detail content in a surface card with neon border
2. Style the back link as a pill-shaped button
3. Add a "More Projects" row showing up to 3 related projects (shared tags first)

**Files:**
- Modify: `src/app/features/projects/project-detail/project-detail.component.ts`
- Modify: `src/app/features/projects/project-detail/project-detail.component.html`
- Modify: `src/app/features/projects/project-detail/project-detail.component.scss`
- Modify: `src/app/features/projects/project-detail/project-detail.component.spec.ts`

- [ ] **Step 5.1: Write failing tests for `relatedProjects`**

Add to `src/app/features/projects/project-detail/project-detail.component.spec.ts`, inside the existing `describe` block:

```typescript
it('returns up to 3 related projects excluding the current one', () => {
  const component = createComponent('pixel-quest');
  const related = component.relatedProjects();
  expect(related.length).toBeLessThanOrEqual(3);
  expect(related.every(p => p.slug !== 'pixel-quest')).toBe(true);
});

it('prioritises projects sharing tags with the current one', () => {
  // pixel-quest has tags: TypeScript, Canvas API, Game Dev, Pixel Art
  // starmapper also has TypeScript and Canvas API → should appear in related
  const component = createComponent('pixel-quest');
  const related = component.relatedProjects();
  const slugs = related.map(p => p.slug);
  expect(slugs).toContain('starmapper');
});

it('returns empty array for null project', () => {
  const component = createComponent('nonexistent');
  expect(component.relatedProjects()).toEqual([]);
});
```

- [ ] **Step 5.2: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL — `relatedProjects is not a function` or similar.

- [ ] **Step 5.3: Update `project-detail.component.ts` — add `relatedProjects`**

Replace the entire file content with:

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TechTagComponent } from '../../../shared/components/tech-tag/tech-tag.component';
import { projectsData } from '../../../data/projects.data';
import { Project } from '../../../models/project.model';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TechTagComponent, RouterLink],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss',
})
export class ProjectDetailComponent {
  private readonly route = inject(ActivatedRoute);

  private readonly params = toSignal(this.route.paramMap);

  readonly project = computed(() => {
    const slug = this.params()?.get('slug');
    return projectsData.find(p => p.slug === slug) ?? null;
  });

  readonly relatedProjects = computed((): readonly Project[] => {
    const current = this.project();
    if (!current) return [];
    const currentTags = new Set(current.tags);
    const others = projectsData.filter(p => p.slug !== current.slug);
    const withSharedTags = others.filter(p => p.tags.some(t => currentTags.has(t)));
    const withoutSharedTags = others.filter(p => !p.tags.some(t => currentTags.has(t)));
    return [...withSharedTags, ...withoutSharedTags].slice(0, 3);
  });
}
```

- [ ] **Step 5.4: Run tests to verify they pass**

```bash
npm test
```

Expected: All tests pass, including the three new `relatedProjects` tests.

- [ ] **Step 5.5: Update `project-detail.component.html` — card wrapper, styled back link, related projects**

Replace the entire file content with:

```html
<div class="project-detail">
  <a routerLink="/" fragment="projects" class="project-detail__back">
    ← Back to Projects
  </a>

  @if (project(); as p) {
    <div class="project-detail__card">
      <img [src]="p.imageUrl" [alt]="p.title" class="project-detail__image" />
      <h1 class="project-detail__title">{{ p.title }}</h1>
      <div class="project-detail__tags">
        @for (tag of p.tags; track tag) {
          <app-tech-tag [name]="tag" />
        }
      </div>
      <p class="project-detail__description">{{ p.longDescription }}</p>
      <div class="project-detail__links">
        @if (p.liveUrl) {
          <a [href]="p.liveUrl" target="_blank" rel="noopener noreferrer" class="project-detail__link project-detail__link--live">
            Live Demo
          </a>
        }
        @if (p.githubUrl) {
          <a [href]="p.githubUrl" target="_blank" rel="noopener noreferrer" class="project-detail__link project-detail__link--github">
            GitHub
          </a>
        }
      </div>
    </div>

    @if (relatedProjects().length > 0) {
      <div class="project-detail__related">
        <h2 class="project-detail__related-heading">More Projects</h2>
        <div class="project-detail__related-grid">
          @for (related of relatedProjects(); track related.slug) {
            <a
              [routerLink]="['/projects', related.slug]"
              class="project-detail__related-card"
            >
              <span class="project-detail__related-title">{{ related.title }}</span>
              <span class="project-detail__related-desc">{{ related.description }}</span>
            </a>
          }
        </div>
      </div>
    }
  } @else {
    <p class="project-detail__not-found">Project not found.</p>
  }
</div>
```

- [ ] **Step 5.6: Update `project-detail.component.scss` — card, styled back, related projects**

Replace the entire file content with:

```scss
@use 'variables' as *;
@use 'glow' as *;

// ======================
// Page Wrapper
// ======================

.project-detail {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--section-padding-v) var(--section-padding-h);
  display: flex;
  flex-direction: column;
  gap: $space-8;
}

// ======================
// Back Link (pill button)
// ======================

.project-detail__back {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  padding: 8px 20px;
  border-radius: $radius-full;
  border: 1px solid var(--bg-border);
  background: var(--bg-surface);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  align-self: flex-start;
  transition: color $transition-fast, border-color $transition-fast, box-shadow $transition-fast;

  &:hover {
    color: var(--accent-cyan);
    border-color: rgba(var(--accent-cyan-rgb), 0.4);
    box-shadow: var(--glow-cyan);
  }
}

// ======================
// Main Content Card
// ======================

.project-detail__card {
  background: var(--bg-surface);
  border: 1px solid var(--bg-border);
  border-radius: $radius-lg;
  padding: $space-6;
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

// ======================
// Hero Image
// ======================

.project-detail__image {
  width: 100%;
  border-radius: $radius-md;
  border: 1px solid var(--bg-border);
  box-shadow: var(--glow-cyan);
  display: block;
}

// ======================
// Title
// ======================

.project-detail__title {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  line-height: 1.1;
  @include gradient-text;
}

// ======================
// Tags
// ======================

.project-detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: $space-1;
}

// ======================
// Description
// ======================

.project-detail__description {
  color: var(--text-secondary);
  font-size: 1.05rem;
  line-height: 1.75;
  max-width: 72ch;
}

// ======================
// Links
// ======================

.project-detail__links {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.project-detail__link {
  display: inline-block;
  padding: 0.625rem 1.5rem;
  border-radius: $radius-full;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  letter-spacing: 0.02em;
  transition:
    box-shadow $transition-fast,
    border-color $transition-fast,
    color $transition-fast;

  &--live {
    color: var(--accent-cyan);
    border: 1px solid rgba(var(--accent-cyan-rgb), 0.4);
    box-shadow: var(--glow-cyan);

    &:hover {
      border-color: var(--accent-cyan);
      box-shadow:
        0 0 20px rgba(var(--accent-cyan-rgb), 0.5),
        0 0 40px rgba(var(--accent-cyan-rgb), 0.2);
    }
  }

  &--github {
    color: var(--text-primary);
    border: 1px solid var(--bg-border);

    &:hover {
      color: var(--accent-cyan);
      border-color: rgba(var(--accent-cyan-rgb), 0.4);
      box-shadow: var(--glow-cyan);
    }
  }
}

// ======================
// Related Projects
// ======================

.project-detail__related {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.project-detail__related-heading {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.project-detail__related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(240px, 100%), 1fr));
  gap: $space-3;
}

.project-detail__related-card {
  display: flex;
  flex-direction: column;
  gap: $space-1;
  padding: $space-3;
  border-radius: $radius-md;
  border: 1px solid var(--bg-border);
  background: var(--bg-surface);
  text-decoration: none;
  transition:
    border-color $transition-fast,
    box-shadow $transition-fast;

  &:hover {
    border-color: rgba(var(--accent-cyan-rgb), 0.4);
    box-shadow: var(--glow-cyan);
  }
}

.project-detail__related-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.project-detail__related-desc {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

// ======================
// Not Found
// ======================

.project-detail__not-found {
  color: var(--text-secondary);
  font-size: 1.1rem;
}
```

- [ ] **Step 5.7: Run all tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 5.8: Visually verify project detail page**

Navigate to `http://localhost:4200/projects/pixel-quest`. Verify:
- A styled back button (pill-shaped, cyan glow on hover)
- Project content wrapped in a dark surface card with border
- "More Projects" section below with up to 3 related project cards
- Hovering a related card shows cyan border glow

- [ ] **Step 5.9: Commit**

```bash
git add \
  src/app/features/projects/project-detail/project-detail.component.ts \
  src/app/features/projects/project-detail/project-detail.component.html \
  src/app/features/projects/project-detail/project-detail.component.scss \
  src/app/features/projects/project-detail/project-detail.component.spec.ts
git commit -m "feat: redesign project detail page with card layout and related projects"
```

---

## Task 6: Dynamic Page Titles

**Problem:** `<title>` is static "Portfolio" on every route. The project detail page should show the project name. The home page should identify Tyler.

**Fix:** Inject Angular's `Title` service. Update in `ProjectDetailComponent` via `effect()` (reacts to signal changes). Update in `HomeComponent` once on `AfterViewInit`.

**Files:**
- Modify: `src/app/features/projects/project-detail/project-detail.component.ts`
- Modify: `src/app/features/home/home.component.ts`

- [ ] **Step 6.1: Write failing test for title update in `ProjectDetailComponent`**

Add to `src/app/features/projects/project-detail/project-detail.component.spec.ts`, inside the existing `describe` block.

First add the import at the top of the file:

```typescript
import { Title } from '@angular/platform-browser';
```

Then add the test:

```typescript
it('sets document title to project name when project exists', () => {
  const component = createComponent('pixel-quest');
  const title = TestBed.inject(Title);
  expect(title.getTitle()).toBe('Pixel Quest — Calcite');
});

it('sets fallback title when project does not exist', () => {
  const component = createComponent('nonexistent');
  const title = TestBed.inject(Title);
  expect(title.getTitle()).toBe('Portfolio — Calcite');
});
```

- [ ] **Step 6.2: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL — title is still "Portfolio" (the default from `index.html`).

- [ ] **Step 6.3: Update `project-detail.component.ts` — inject `Title` and update via `effect()`**

Replace the entire file content with:

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
} from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { TechTagComponent } from '../../../shared/components/tech-tag/tech-tag.component';
import { projectsData } from '../../../data/projects.data';
import { Project } from '../../../models/project.model';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TechTagComponent, RouterLink],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss',
})
export class ProjectDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly titleService = inject(Title);

  private readonly params = toSignal(this.route.paramMap);

  readonly project = computed(() => {
    const slug = this.params()?.get('slug');
    return projectsData.find(p => p.slug === slug) ?? null;
  });

  readonly relatedProjects = computed((): readonly Project[] => {
    const current = this.project();
    if (!current) return [];
    const currentTags = new Set(current.tags);
    const others = projectsData.filter(p => p.slug !== current.slug);
    const withSharedTags = others.filter(p => p.tags.some(t => currentTags.has(t)));
    const withoutSharedTags = others.filter(p => !p.tags.some(t => currentTags.has(t)));
    return [...withSharedTags, ...withoutSharedTags].slice(0, 3);
  });

  constructor() {
    effect(() => {
      const p = this.project();
      this.titleService.setTitle(p ? `${p.title} — Calcite` : 'Portfolio — Calcite');
    });
  }
}
```

- [ ] **Step 6.4: Run tests to verify title tests pass**

```bash
npm test
```

Expected: All tests pass, including the two new title tests.

- [ ] **Step 6.5: Update `home.component.ts` — set home page title on init**

Add the `Title` import and injection. Replace the entire file content with:

```typescript
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { HeroComponent } from './hero/hero.component';
import { FeatureCardsComponent } from './feature-cards/feature-cards.component';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';
import { ProjectsSectionComponent } from './sections/projects-section/projects-section.component';
import { AboutSectionComponent } from './sections/about-section/about-section.component';
import { SkillsSectionComponent } from './sections/skills-section/skills-section.component';
import { ContactSectionComponent } from './sections/contact-section/contact-section.component';
import { ScrollService } from '../../core/services/scroll.service';
import { bioData } from '../../data/bio.data';
import { projectsData } from '../../data/projects.data';
import { skillsData } from '../../data/skills.data';
import { socialLinksData } from '../../data/social-links.data';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HeroComponent,
    FeatureCardsComponent,
    ScrollRevealDirective,
    ProjectsSectionComponent,
    AboutSectionComponent,
    SkillsSectionComponent,
    ContactSectionComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  readonly bio = bioData;
  readonly projects = projectsData;
  readonly skills = skillsData;
  readonly socialLinks = socialLinksData;
  private readonly scrollService = inject(ScrollService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly titleService = inject(Title);

  ngAfterViewInit(): void {
    this.titleService.setTitle('Tyler Hawthorn — Calcite | Full Stack Developer');
    this.scrollService.initSectionObserver(['home', 'projects', 'about', 'skills', 'contact']);
    if (isPlatformBrowser(this.platformId)) {
      const hash = window.location.hash.replace('#', '');
      if (hash) this.scrollService.scrollToSection(hash);
    }
  }

  ngOnDestroy(): void {
    this.scrollService.destroySectionObserver();
  }
}
```

- [ ] **Step 6.6: Run all tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 6.7: Visually verify titles in browser**

- Navigate to `http://localhost:4200` → browser tab should read `Tyler Hawthorn — Calcite | Full Stack Developer`
- Navigate to `http://localhost:4200/projects/pixel-quest` → tab should read `Pixel Quest — Calcite`
- Navigate to `http://localhost:4200/projects/starmapper` → tab should read `StarMapper — Calcite`

- [ ] **Step 6.8: Commit**

```bash
git add \
  src/app/features/projects/project-detail/project-detail.component.ts \
  src/app/features/projects/project-detail/project-detail.component.spec.ts \
  src/app/features/home/home.component.ts
git commit -m "feat: add dynamic page titles via Title service"
```

---

## Task 7: Build Verification

Before the cleanup pass, confirm the full build succeeds and all pre-render routes are still valid.

**Files:** None modified.

- [ ] **Step 7.1: Run production build**

```bash
npm run build
```

Expected output (key lines):
```
✔ Browser application bundle generation complete.
✔ Prerendering 8 route(s)...
Build at: ...
```

All 8 pre-rendered routes should succeed: `/`, `/projects/pixel-quest`, `/projects/devboard`, `/projects/neonchat`, `/projects/codecraft-api`, `/projects/starmapper`.

If the build fails, diagnose before proceeding to Task 8.

- [ ] **Step 7.2: Run all unit tests one final time**

```bash
npm test
```

Expected: All tests pass with no failures or skips.

---

## Task 8: Spacing Architecture Cleanup

**Problem:** Three component SCSS files use `var(--section-padding-h, 1.5rem)` — the fallback is redundant because `--section-padding-h: 1.5rem` is already defined in `:root` (`styles.scss:66`). The redundant fallbacks add noise and imply the custom property might not always be defined.

**Files:**
- Modify: `src/app/features/home/sections/about-section/about-section.component.scss` (already updated in Task 4, verify it has no fallback)
- Modify: `src/app/features/home/sections/contact-section/contact-section.component.scss`
- Modify: `src/app/features/home/sections/skills-section/skills-section.component.scss`

- [ ] **Step 8.1: Update `contact-section.component.scss` — remove fallback**

Replace `var(--section-padding-h, 1.5rem)` with `var(--section-padding-h)` on line 8. Full file after change:

```scss
@use 'variables';

:host {
  display: block;
}

.contact-section {
  padding: var(--section-padding-v) var(--section-padding-h);
  text-align: center;

  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
  }

  &__email-cta {
    display: inline-block;
    border: 1px solid rgba(var(--accent-cyan-rgb), 0.4);
    box-shadow: var(--glow-cyan);
    padding: 12px 32px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 1rem;
    color: var(--accent-cyan);
    text-decoration: none;
    border-radius: 4px;
    transition:
      box-shadow 0.2s ease,
      transform 0.2s ease,
      border-color 0.2s ease;

    &:hover {
      box-shadow: var(--glow-cyan), 0 0 24px rgba(var(--accent-cyan-rgb), 0.5);
      border-color: rgba(var(--accent-cyan-rgb), 0.8);
      transform: translateY(-2px);
    }
  }
}
```

- [ ] **Step 8.2: Update `skills-section.component.scss` — remove fallback**

Replace the entire file content with:

```scss
@use 'variables';

:host {
  display: block;
}

.skills-section {
  padding: var(--section-padding-v) var(--section-padding-h);

  &__content {
    max-width: 800px;
    margin: 0 auto;
  }
}
```

- [ ] **Step 8.3: Verify `about-section.component.scss` has no fallback**

The about-section SCSS was rewritten in Task 4. Confirm it uses `var(--section-padding-h)` (no fallback). If the Task 4 SCSS still has a fallback, remove it now.

- [ ] **Step 8.4: Run all tests**

```bash
npm test
```

Expected: All tests pass. (SCSS changes have no TS-level test coverage — the next step is visual.)

- [ ] **Step 8.5: Run production build to confirm no SCSS compilation errors**

```bash
npm run build
```

Expected: Clean build, no SCSS warnings or errors.

- [ ] **Step 8.6: Commit**

```bash
git add \
  src/app/features/home/sections/contact-section/contact-section.component.scss \
  src/app/features/home/sections/skills-section/skills-section.component.scss
git commit -m "chore: remove redundant CSS custom property fallback values from section components"
```

---

## Final Checklist

After all 8 tasks are committed, run a final visual pass:

- [ ] Home hero fills viewport; About/Skills/Contact sections size to content — no empty voids
- [ ] Footer GitHub/Discord/LinkedIn links navigate to real URLs
- [ ] Projects section shows 3-column grid on desktop (not a single row)
- [ ] Filter bar shows only popular tags (≈7 for current 5 projects, not 14)
- [ ] About section shows bio text inside a neon-bordered card with divider
- [ ] Project detail back button is a styled pill (not a bare `←` text link)
- [ ] Project detail shows a "More Projects" section with up to 3 related cards
- [ ] Browser tab reads `Tyler Hawthorn — Calcite | Full Stack Developer` on home
- [ ] Browser tab reads `{Project Name} — Calcite` on each project detail page
- [ ] `npm test` passes with 0 failures
- [ ] `npm run build` succeeds with 8 pre-rendered routes

## Known Non-Issues (Verified During Audit)

- **Mobile nav overlay:** Already correctly implemented in `navbar.component.html:41-45`. The `[class.navbar__overlay--visible]="isMenuOpen()"` binding is present. Visual audit screenshot was captured mid-transition (300ms); no code change needed.
- **`--section-padding-h` in `about-section`:** Redundant fallback is removed as part of Task 4's SCSS rewrite, not a separate step.

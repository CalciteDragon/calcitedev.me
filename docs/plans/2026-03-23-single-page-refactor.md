# Single-Page Scroll Refactor

> **Historical plan notice (August 13, 2026):** References below to project filters, shared project cards, `/projects/:slug`, or `ProjectDetailComponent` describe the architecture at the time this phase was implemented. The current Projects experience is the single-page focus stage and selector documented in `docs/architecture.md`; those routes/components no longer exist.

> **Status:** Planning — not yet started
> **Goal:** Convert the multi-route portfolio into a single scrollable page. Sections: Home → Projects → About → Skills → Contact. Navbar links quick-scroll to sections and highlight based on viewport. Angular routing preserved for future detail pages.

---

## Questions & Decisions

Resolved before writing the plan. Answers represent the recommended implementation.

### Q1: Should section navigation update the URL?

Navigating to `#projects` while scrolling would enable bookmarking and sharing direct section links (e.g., `calcitedev.me/#contact`). The question is how to implement this without triggering Angular router navigation on every scroll tick.

**Decision:** YES — update `location.hash` when IntersectionObserver detects a section change, using `history.replaceState(null, '', '/#' + sectionId)` directly (bypasses Angular router to avoid navigation events). On main page init, read `location.hash` and scroll to that section if present. Angular `anchorScrolling: 'enabled'` handles scroll after router navigations (e.g., from `/projects/slug → /#projects`).

---

### Q2: What happens to old URLs `/about`, `/projects`, `/contact`?

These may be bookmarked or linked externally. After the refactor they no longer represent independent pages.

**Decision:** Add explicit `redirectTo: ''` entries for all three in `app.routes.ts`. Old links land on the home page (all content is there) rather than 404ing. Deep-linking to a specific section (e.g., `/about → /#about`) is not implemented in v1 — the redirect just drops users at the top of the page.

---

### Q3: Where do the new section components live?

Two options: keep in `features/about/`, `features/projects/`, etc. (domain-organized), or move to `features/home/sections/` (home-page-organized).

**Decision:** `features/home/sections/` for all sections. About, Skills, and Contact will never be standalone pages. Projects content (the grid) lives at `features/home/sections/projects-section/`. The `features/projects/` folder is **kept** for the future `ProjectDetailComponent` at `/projects/:slug`. The current stubs in `features/about/`, `features/projects/`, `features/contact/` are replaced.

---

### Q4: What does the "View My Work" CTA scroll to?

Currently scrolls to `#feature-cards`. Feature cards are immediately below the hero and visible on most viewports without scrolling. "View My Work" implies showing actual work.

**Decision:** Change CTA target to `#projects` — the first substantive content section. Feature cards remain in the hero/home section and serve as quick-nav shortcuts. Users who want to understand the site structure read the feature cards; users who click "View My Work" jump straight to the projects grid.

---

### Q5: How does IntersectionObserver determine the active section?

With a simple threshold, sections at the top or bottom of the page can behave unexpectedly (e.g., the contact section may never be "50% visible" on a large monitor).

**Decision (as implemented):** `rootMargin: '0px 0px -50% 0px'` — the observer fires when a section enters or exits the top 50% of the viewport. The callback ignores the `entries` parameter entirely and instead calls `updateActiveSection()`, which reads `getBoundingClientRect()` on all observed sections and activates whichever section's top is closest to (but above) the viewport midpoint.

The original `-10% 0px -85% 0px` approach was superseded because a narrow trigger zone causes a stale-state bug: tall sections (100svh) can be *continuously intersecting* the zone, so they never transition to `isIntersecting: false` and back to `true` when the user scrolls upward past them. The re-evaluation algorithm fixes this — any intersection change triggers a full positional re-check of all sections.

---

### Q6: How does the navbar handle navigation when on a detail page (e.g., `/projects/my-project`)?

The section scroll approach only works when already on the main page (`/`). On a detail page, clicking "Projects" in the navbar should navigate back and scroll to the projects section.

**Decision:** Nav section links call `navigateToSection(id)` on `NavbarComponent`, which checks `router.url`. If already at `/`, call `scrollService.scrollToSection(id)`. If elsewhere, call `router.navigate([''], { fragment: id })` — Angular's `anchorScrolling: 'enabled'` handles the scroll after navigation completes. On the main page, `ngAfterViewInit` reads the initial fragment and scrolls if present.

---

### Q7: Should feature cards still exist?

After the refactor, users can scroll through all sections. Feature cards become partially redundant as navigation.

**Decision:** Keep feature cards. They are a visual "site map" — they help first-time visitors understand the page structure quickly without scrolling. Their CTAs change from `Router.navigate()` to `scrollService.scrollToSection()`.

---

### Q8: Should the old `features/about/`, `features/projects/`, `features/contact/` stubs be deleted?

These are pure stubs with no implementation. Leaving them creates confusion about whether they're the canonical section components.

**Decision:** Delete `about/about.component.*` and `contact/contact.component.*` entirely. Keep the `features/projects/` folder (empty minus the stub) as a home for the future `ProjectDetailComponent`. The `projects.component.ts` stub is deleted; a new `ProjectsSectionComponent` lives at `features/home/sections/projects-section/`.

---

### Q9: Pre-rendering strategy after the refactor?

Before: four routes pre-rendered (`/`, `/about`, `/projects`, `/contact`). After: only `/` needs pre-rendering since it contains all section content.

**Decision:** `app.routes.server.ts` already uses `path: '**'` with `RenderMode.Prerender`, which covers all defined routes. After removing the section routes, only `''` (and future `projects/:slug`) remain. The single pre-rendered `/index.html` will contain all section content — this is actually **better for SEO** since all content is in one HTML file that crawlers see on the first request.

---

### Q10: Skills section — standalone section vs. part of About?

Current architecture has Skills nested inside About (`SkillsGridComponent` inside `AboutComponent`). The desired scroll order explicitly separates them: `… → About → Skills → Contact`.

**Decision:** Skills is its own first-class section with its own `id="skills"` and its own `SkillsSectionComponent`. The About section becomes purely a bio section. This changes planned Phase 6 content: `AboutSectionComponent` = bio only; `SkillsSectionComponent` = skills grid (formerly `SkillsGridComponent` inside About).

---

## Dependency Graph

```
Step 1: ScrollService (new service — no deps)
    │
    ├──→ Step 2: Router config (anchorScrolling)
    │
    ├──→ Step 3: app.routes.ts (remove section routes, add redirects, add projects/:slug stub)
    │       │
    │       └──→ Step 4: app.routes.server.ts (verify — no change likely needed)
    │
    ├──→ Step 5: Section components (new stubs under features/home/sections/)
    │       │
    │       ├──→ Step 6: HomeComponent update (import sections, init observer)
    │       │
    │       └──→ Step 7: Section SCSS (scroll-margin-top on section wrappers)
    │
    ├──→ Step 8: NavbarComponent refactor (scroll-based nav, IntersectionObserver active state)
    │
    ├──→ Step 9: FeatureCardsComponent refactor (ScrollService, updated targets)
    │
    ├──→ Step 10: HeroComponent CTA target update (#projects)
    │
    ├──→ Step 11: Delete old stubs (features/about, features/contact, features/projects stub)
    │
    └──→ Step 12: Documentation updates (architecture, development, overview, design)
```

---

## File Inventory

### Created

```
src/app/core/services/scroll.service.ts
src/app/features/home/sections/projects-section/
│   projects-section.component.ts
│   projects-section.component.html
│   projects-section.component.scss
src/app/features/home/sections/about-section/
│   about-section.component.ts
│   about-section.component.html
│   about-section.component.scss
src/app/features/home/sections/skills-section/
│   skills-section.component.ts
│   skills-section.component.html
│   skills-section.component.scss
src/app/features/home/sections/contact-section/
│   contact-section.component.ts
│   contact-section.component.html
│   contact-section.component.scss
```

### Modified

```
src/app/app.config.ts                           — add withInMemoryScrolling
src/app/app.routes.ts                           — remove section routes, add redirects + projects/:slug
src/app/features/home/home.component.ts         — import sections, inject ScrollService
src/app/features/home/home.component.html       — add <section> blocks for each section
src/app/features/home/home.component.scss       — add section spacing
src/app/features/home/hero/hero.component.ts    — scrollToSection('projects') instead of #feature-cards
src/app/features/home/feature-cards/feature-cards.component.ts  — use ScrollService, update routes
src/app/layout/navbar/navbar.component.ts       — ScrollService, scroll-based nav
src/app/layout/navbar/navbar.component.html     — reorder links, active class binding
src/styles/_variables.scss                      — add --scroll-section-offset var (if not already present)
docs/architecture.md
docs/development.md
docs/overview.md
docs/design.md
```

### Deleted

```
src/app/features/about/about.component.ts
src/app/features/about/about.component.html
src/app/features/about/about.component.scss
src/app/features/projects/projects.component.ts
src/app/features/projects/projects.component.html
src/app/features/projects/projects.component.scss
src/app/features/contact/contact.component.ts
src/app/features/contact/contact.component.html
src/app/features/contact/contact.component.scss
```

> The `features/about/`, `features/contact/`, and `features/projects/` **folders** are removed. `features/projects/` can be recreated when `ProjectDetailComponent` is scaffolded in Phase 6.

---

## Implementation Steps

---

### Step 1: Create `ScrollService`

**File:** `src/app/core/services/scroll.service.ts`

**Responsibility:**
- Track which section is currently active in the viewport (signal)
- Provide a `scrollToSection(id)` method — smooth, SSR-safe
- Manage an `IntersectionObserver` that updates the active section and the URL hash

**Design notes:**
- `activeSection` defaults to `'home'`
- `scrollToSection` uses `getElementById(id)?.scrollIntoView({ behavior: 'smooth' })` — CSS `scroll-margin-top` on each section handles the navbar offset
- `initSectionObserver(ids: string[])` creates an `IntersectionObserver` with `rootMargin: '0px 0px -50% 0px'`. On any intersection change it calls `updateActiveSection()`, which reads `getBoundingClientRect()` on all sections and sets the one closest to (but above) the viewport midpoint as active. URL is updated via `history.replaceState`
- `destroySectionObserver()` disconnects the observer — called from `HomeComponent`'s `ngOnDestroy`
- Entire service is SSR-safe via `isPlatformBrowser`

```typescript
// Skeleton — implement in full
@Injectable({ providedIn: 'root' })
export class ScrollService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private observer: IntersectionObserver | null = null;

  readonly activeSection = signal<string>('home');

  scrollToSection(id: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  initSectionObserver(sectionIds: string[]): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            this.activeSection.set(id);
            history.replaceState(null, '', id === 'home' ? '/' : `/#${id}`);
          }
        }
      },
      { rootMargin: '-10% 0px -85% 0px' }
    );
    for (const id of sectionIds) {
      const el = this.document.getElementById(id);
      if (el) this.observer.observe(el);
    }
  }

  destroySectionObserver(): void {
    this.observer?.disconnect();
    this.observer = null;
  }
}
```

**Tests to write:** `scroll.service.spec.ts`
- `scrollToSection` calls `getElementById` + `scrollIntoView` in browser
- `scrollToSection` is a no-op on SSR platform
- `activeSection` defaults to `'home'`
- `initSectionObserver` creates an IntersectionObserver (mock it) and observes each section element
- `destroySectionObserver` disconnects the observer

---

### Step 2: Enable `anchorScrolling` in router config

**File:** `src/app/app.config.ts`

Add `withInMemoryScrolling` to the `provideRouter(...)` call:

```typescript
provideRouter(
  routes,
  withInMemoryScrolling({
    anchorScrolling: 'enabled',
    scrollPositionRestoration: 'enabled',
  })
),
```

**Why:** This makes `router.navigate([''], { fragment: 'projects' })` automatically scroll to `id="projects"` after navigation completes. Needed for the case where a user is on `/projects/my-project` and clicks a navbar section link.

**Note:** `scrollPositionRestoration: 'enabled'` restores scroll position when using browser back/forward. This is desirable for the main page but may occasionally fight with the fragment scroll. Monitor in Phase 9 and tune if needed.

---

### Step 3: Refactor `app.routes.ts`

**File:** `src/app/app.routes.ts`

Changes:
- Remove: children for `about`, `projects`, `contact` (these are no longer routes)
- Add: redirects for those paths (graceful handling of old bookmarks)
- Add: `projects/:slug` stub route (no component yet — will be added when `ProjectDetailComponent` is built in Phase 6)
- Keep: `''` → `HomeComponent`, `'**' → ''`

```typescript
export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/home/home.component').then(m => m.HomeComponent),
      },
      // Section paths redirect to home — all content is on the single page
      { path: 'about', redirectTo: '' },
      { path: 'projects', redirectTo: '' },
      { path: 'contact', redirectTo: '' },
      // Future detail page — scaffolded in Phase 6
      // { path: 'projects/:slug', loadComponent: () => import(...) },
      { path: '**', redirectTo: '' },
    ],
  },
];
```

---

### Step 4: Verify `app.routes.server.ts`

**File:** `src/app/app.routes.server.ts`

Current content uses `path: '**'` with `RenderMode.Prerender`. After removing the section routes, only `''` remains as a real route. The `**` pattern in server routes pre-renders all routes that the Angular router can resolve — with only `''` defined, just `/index.html` is generated.

**Action:** No change needed. But verify after build that `dist/browser/` only contains `index.html` (plus the `projects/` placeholder if the slug route is added). Document this in the file comment.

---

### Step 5: Create section components

**Path:** `src/app/features/home/sections/`

Create four components — these are stubs for now (Phase 6 fills them with real content). Each needs an outer wrapper element but the template content is a placeholder. Section IDs live on the `<section>` in `HomeComponent`'s template, not on the component hosts.

#### 5a. `ProjectsSectionComponent`

```
features/home/sections/projects-section/
├── projects-section.component.ts
├── projects-section.component.html
└── projects-section.component.scss
```

- Selector: `app-projects-section`
- Template stub: `<p class="section-stub">Projects — coming in Phase 6</p>`
- SCSS: `:host { display: block; }`

#### 5b. `AboutSectionComponent`

```
features/home/sections/about-section/
├── about-section.component.ts
├── about-section.component.html
└── about-section.component.scss
```

- Selector: `app-about-section`
- Template stub: bio text placeholder (can read `bioData` directly or receive as input — follow smart/presentational pattern from Phase 4: `HomeComponent` is the smart container, so `AboutSectionComponent` could receive `bio` as input)
- Keep as a placeholder for now; Phase 6 fills in the real layout

#### 5c. `SkillsSectionComponent`

```
features/home/sections/skills-section/
├── skills-section.component.ts
├── skills-section.component.html
└── skills-section.component.scss
```

- Selector: `app-skills-section`
- Template stub: `<p class="section-stub">Skills — coming in Phase 6</p>`
- Phase 6 integrates `SkillsGridComponent`

#### 5d. `ContactSectionComponent`

```
features/home/sections/contact-section/
├── contact-section.component.ts
├── contact-section.component.html
└── contact-section.component.scss
```

- Selector: `app-contact-section`
- Template stub: placeholder email link + `SocialLinksComponent` can be integrated here early since it already exists
- Phase 6 finalizes the layout

**All four components:**
- Standalone, `ChangeDetectionStrategy.OnPush`
- No inputs needed for the stubs (inputs added in Phase 6 when smart/presentational pattern is finalized)

---

### Step 6: Update `HomeComponent`

**Files:** `home.component.ts`, `home.component.html`, `home.component.scss`

**Changes to `.ts`:**
- Import the four section components
- Import `ScrollService`, `AfterViewInit`, `OnDestroy`
- Inject `ScrollService`
- Implement `AfterViewInit`: call `scrollService.initSectionObserver(['home', 'projects', 'about', 'skills', 'contact'])` and handle initial hash scroll
- Implement `OnDestroy`: call `scrollService.destroySectionObserver()`

```typescript
// HomeComponent skeleton
export class HomeComponent implements AfterViewInit, OnDestroy {
  readonly bio = bioData;
  private readonly scrollService = inject(ScrollService);
  private readonly platformId = inject(PLATFORM_ID);

  ngAfterViewInit(): void {
    this.scrollService.initSectionObserver(['home', 'projects', 'about', 'skills', 'contact']);
    // Scroll to hash on initial load (e.g., user visits /#skills)
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

**Changes to `.html`:**

```html
<div class="main-page">
  <section id="home" class="main-page__section" aria-label="Home">
    <app-hero [bio]="bio" />
    <app-feature-cards appScrollReveal />
  </section>

  <section id="projects" class="main-page__section" aria-label="Projects">
    <app-projects-section />
  </section>

  <section id="about" class="main-page__section" aria-label="About">
    <app-about-section />
  </section>

  <section id="skills" class="main-page__section" aria-label="Skills">
    <app-skills-section />
  </section>

  <section id="contact" class="main-page__section" aria-label="Contact">
    <app-contact-section />
  </section>
</div>
```

**Changes to `.scss`:**

```scss
.main-page {
  &__section {
    scroll-margin-top: var(--navbar-height);
    // Minimum height ensures each section fills the viewport for clean scroll snapping
    // Tune in Phase 9 — some sections (contact) will naturally be shorter
    min-height: 100svh;
  }
}
```

> Note: `min-height: 100svh` on every section is intentional for now — it ensures scroll snapping works reliably during development. In Phase 7/9, sections will have content-driven heights and this constraint can be relaxed or made per-section.

---

### Step 7: Add section scroll offset CSS

**File:** `src/styles/_variables.scss` (or `styles.scss`)

Ensure `--navbar-height` is defined as a CSS custom property (it is referenced in `layout.component.ts` already). If not explicitly declared, add:

```scss
:root {
  --navbar-height: 64px; // Tune in Phase 9
}
```

The `scroll-margin-top: var(--navbar-height)` on `.main-page__section` handles the fixed navbar offset automatically — no JavaScript offset calculation needed.

---

### Step 8: Refactor `NavbarComponent`

**Files:** `navbar.component.ts`, `navbar.component.html`

**Changes to `.ts`:**
- Remove `RouterLink`, `RouterLinkActive` from imports (keep `RouterLink` for the brand/logo link)
- Add `Router` and `ScrollService` injections
- Add `navigateToSection(id: string)` method:

```typescript
protected navigateToSection(id: string): void {
  // If on main page, just scroll. If on a detail page, navigate then scroll.
  if (this.router.url === '/' || this.router.url.startsWith('/#')) {
    this.scrollService.scrollToSection(id);
  } else {
    this.router.navigate([''], { fragment: id });
  }
  this.closeMenu(); // Close mobile drawer if open
}
```

- Keep `isMenuOpen`, `toggleMenu()`, `closeMenu()` as-is
- Expose `scrollService.activeSection` for template binding via a getter or direct binding

**Changes to `.html`:**

Desktop links — **reordered** to: Projects | About | Skills | Contact:

```html
<ul class="navbar__links">
  <li>
    <button class="navbar__link" [class.navbar__link--active]="scrollService.activeSection() === 'projects'" (click)="navigateToSection('projects')">Projects</button>
  </li>
  <li>
    <button class="navbar__link" [class.navbar__link--active]="scrollService.activeSection() === 'about'" (click)="navigateToSection('about')">About</button>
  </li>
  <li>
    <button class="navbar__link" [class.navbar__link--active]="scrollService.activeSection() === 'skills'" (click)="navigateToSection('skills')">Skills</button>
  </li>
  <li>
    <button class="navbar__link" [class.navbar__link--active]="scrollService.activeSection() === 'contact'" (click)="navigateToSection('contact')">Contact</button>
  </li>
</ul>
```

Mobile drawer — same reorder + use `navigateToSection()`:

```html
<ul class="navbar__drawer-links">
  <li><button class="navbar__drawer-link" [class.navbar__drawer-link--active]="scrollService.activeSection() === 'projects'" (click)="navigateToSection('projects')">Projects</button></li>
  <li><button class="navbar__drawer-link" [class.navbar__drawer-link--active]="scrollService.activeSection() === 'about'" (click)="navigateToSection('about')">About</button></li>
  <li><button class="navbar__drawer-link" [class.navbar__drawer-link--active]="scrollService.activeSection() === 'skills'" (click)="navigateToSection('skills')">Skills</button></li>
  <li><button class="navbar__drawer-link" [class.navbar__drawer-link--active]="scrollService.activeSection() === 'contact'" (click)="navigateToSection('contact')">Contact</button></li>
</ul>
```

**SCSS note:** `.navbar__link` currently has `cursor: pointer` (links default). After switching to `<button>`, reset button styles in the SCSS:

```scss
.navbar__link {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  cursor: pointer;
  // ... existing styles
}
```

---

### Step 9: Refactor `FeatureCardsComponent`

**File:** `feature-cards.component.ts`

- Remove `Router` import and injection
- Add `ScrollService` injection
- Change `navigate(route: string)` → `scrollToSection(id: string)` that calls `scrollService.scrollToSection(id)`
- Update card config: replace `route` field with `sectionId: string`
- Update card destinations:
  - About Me card: `sectionId: 'about'`
  - Latest Projects card: `sectionId: 'projects'`
  - My Skills card: `sectionId: 'skills'` (previously `'/about'` — now its own section)
- Update template: `(ctaClick)="scrollToSection(card.sectionId)"`
- Update spec: replace `Router` mock with `ScrollService` mock, update assertions

**Interface update:**
```typescript
interface FeatureCard {
  icon: string;
  iconAlt: string;
  title: string;
  description: string;
  ctaLabel: string;
  sectionId: string;  // was: route: string
  glowColor: GlowColor;
}
```

---

### Step 10: Update `HeroComponent` CTA target

**File:** `hero.component.ts`

- Rename `scrollToFeatureCards()` → `scrollToWork()`
- Change target from `'feature-cards'` to `'projects'`
- Update spec test assertion accordingly

```typescript
scrollToWork(): void {
  if (!isPlatformBrowser(this.platformId)) return;
  this.document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
}
```

> Rationale: "View My Work" navigates to the Projects section, not an in-page navigation shortcut block.

---

### Step 11: Delete old stub components

Remove these files:

```
src/app/features/about/about.component.ts
src/app/features/about/about.component.html
src/app/features/about/about.component.scss
src/app/features/projects/projects.component.ts
src/app/features/projects/projects.component.html
src/app/features/projects/projects.component.scss
src/app/features/contact/contact.component.ts
src/app/features/contact/contact.component.html
src/app/features/contact/contact.component.scss
```

> Keep: `features/about/`, `features/projects/`, `features/contact/` **folder paths** may have leftover `.spec.ts` or empty folders — remove those too. The folder `features/projects/` can be left as an empty directory or removed; it will be recreated when Phase 6 scaffolds `ProjectDetailComponent`.

---

### Step 12: Update living documentation

All of the following docs need updates to reflect the new single-page architecture.

#### `docs/architecture.md`

- **Routing section:** Update routes table/code block. Remove `about`, `projects`, `contact` routes. Add redirect entries. Show `projects/:slug` as a future planned route with a comment.
- **Component tree:** Update the key component map. `HomeComponent` now has five `<section>` children instead of being a sibling to `AboutComponent` etc.
- **New service:** Add `ScrollService` to the folder structure and describe its responsibility.
- **Folder structure:** Update to show `features/home/sections/` with the four section components. Remove `features/about/`, `features/projects/`, `features/contact/` (note `features/projects/` returns in Phase 6).
- **Data flow:** Note that section components are children of `HomeComponent` (smart container), not standalone route-level components.

#### `docs/development.md`

- **Phase 1 tasks:** Update `NavbarComponent` description — nav links now scroll to sections, not routes. Remove the sentence about links navigating to pages.
- **Phase 6 tasks:** Update to reflect the new component locations. `AboutComponent` → `AboutSectionComponent` at `features/home/sections/about-section/`. Projects section similarly. `ProjectDetailComponent` stays at `features/projects/project-detail/`. Remove "Contact Page" as a separate section — it's part of Step 5 above. Skills section is now standalone.
- **Dependency graph:** Add a note or new node for "Single-Page Refactor" between Phase 4 and Phase 5 (this is the work being planned now).
- **Scope notes:** Update "4 pages" → "1 scrollable page with 5 sections".

#### `docs/overview.md`

- **Core Pages section:** Rename/reframe to "Core Sections". Update the four page descriptions to reflect they're sections on one page.
- **Skills:** Promote Skills from a subsection of About to its own section entry.
- **Tech stack:** No change needed.

#### `docs/design.md`

- **Navbar spec:** Update link order from `About | Projects | Contact` to `Projects | About | Skills | Contact`.
- **Scroll reveal:** Note that scroll reveals apply to each section as it enters the viewport.
- **Hero section:** Update "View My Work" CTA description — scrolls to Projects section, not feature cards.
- **Layout section:** Note the single-page structure — section order is Home → Projects → About → Skills → Contact.

---

## Verification Checklist

Run `npm start` and confirm:

- [ ] `http://localhost:4200` loads the full page with all 5 sections visible when scrolling
- [ ] Scrolling through sections updates URL hash: `/#projects`, `/#about`, `/#skills`, `/#contact`, `/` (home)
- [ ] Navbar highlights the correct link as each section scrolls into view
- [ ] Clicking each navbar link smooth-scrolls to the correct section
- [ ] Mobile hamburger menu opens, links scroll to correct sections, drawer closes on click
- [ ] "View My Work" CTA scrolls to the Projects section
- [ ] Feature card CTAs scroll to their respective sections (Projects, About, Skills)
- [ ] Navigating to `/about` redirects to `/` (no 404)
- [ ] Navigating to `/projects` redirects to `/` (no 404)
- [ ] Navigating to `/contact` redirects to `/` (no 404)
- [ ] Section tops are not obscured by the fixed navbar (scroll-margin-top working)
- [ ] No console errors
- [ ] `npm test` — all tests pass

---

## What Phase 6 Builds On

Phase 6 fills in the section content:

- `ProjectsSectionComponent` → full `ProjectListComponent` with filter bar
- `AboutSectionComponent` → bio layout with `bioData`
- `SkillsSectionComponent` → `SkillsGridComponent` with categories and `SkillChipComponent`
- `ContactSectionComponent` → email CTA + `SocialLinksComponent`
- `ProjectDetailComponent` → new route at `features/projects/project-detail/`, routed at `/projects/:slug`

The `ScrollService`, `HomeComponent` section structure, and navbar are all Phase 6-ready after this refactor. Phase 6 is purely content/layout work within each section component — no architecture changes needed.

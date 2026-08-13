# Phase 6: Content Sections — Implementation Plan

> **Historical plan notice (August 13, 2026):** References below to project filters, shared project cards, `/projects/:slug`, or `ProjectDetailComponent` describe the architecture at the time this phase was implemented. The current Projects experience is the single-page focus stage and selector documented in `docs/architecture.md`; those routes/components no longer exist.

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all four content sections (About, Projects, Skills, Contact) and the `ProjectDetailComponent` detail route so the site is content-complete and fully navigable end-to-end.

**Architecture:** `HomeComponent` is the smart container — it reads all static data and passes it down via signal inputs to presentational section components. Each section is an independent `OnPush` standalone component; no section holds its own data. `ProjectDetailComponent` is a separate lazy-loaded route that reads its slug from `ActivatedRoute` and resolves the project from the static data array.

**Tech Stack:** Angular 21 (standalone, signals, OnPush), TypeScript strict, SCSS + CSS custom properties, vitest for unit tests, Playwright for visual validation.

---

## Pre-Conditions: What's Already Built

Everything Phase 6 depends on is ready:

| Dependency | Status |
|---|---|
| All 4 section shells (`AboutSectionComponent`, `ProjectsSectionComponent`, `SkillsSectionComponent`, `ContactSectionComponent`) | Empty shells exist at `features/home/sections/` |
| `ProjectCardComponent` | Built in `shared/components/project-card/` — needs `liveUrl`/`githubUrl` inputs added |
| `SkillChipComponent` | Built in `shared/components/skill-chip/` |
| `SocialLinksComponent` | Built in `shared/components/social-links/` |
| `SectionHeaderComponent` | Built in `shared/components/section-header/` |
| `ScrollRevealDirective` | Built in `shared/directives/` |
| `TechTagComponent` | Built in `shared/components/tech-tag/` |
| `projectsData`, `skillsData`, `bioData`, `socialLinksData` | All populated in `data/` |
| `Project` model with `slug`, `category`, `featured`, `glowColor` | In `models/project.model.ts` |
| `SkillGroup[]` data structure | `skillsData` is already grouped by category with `color` |

`HomeComponent` is already the smart container — it currently reads `bioData` and hosts all section components. The sections just need inputs wired and content implemented.

---

## Implementation Steps

### Step 1: Move BackgroundSceneComponent to LayoutComponent

**Why first:** Adding `/projects/:slug` as a real route means the canvas background (currently inside `HomeComponent`) would disappear when navigating to a project detail. Moving it to `LayoutComponent` makes it persist across all routes.

**Files changed:**
- `layout/layout.component.ts` — import and render `BackgroundSceneComponent`
- `features/home/home.component.ts` — remove `BackgroundSceneComponent` import
- `features/home/home.component.html` — remove `<app-background-scene />`

**Implementation note:** `BackgroundSceneComponent` is already `position: fixed; z-index: -1` — it renders behind everything. Moving it to `LayoutComponent`'s template works without any style changes. The SSR `isPlatformBrowser` guard in `BackgroundSceneComponent` is already in place.

```html
<!-- layout.component.html — add before router-outlet -->
<app-background-scene />
<router-outlet />
```

**Commit checkpoint:**
```bash
git add src/app/layout/ src/app/features/home/home.component.*
git commit -m "refactor: move BackgroundSceneComponent to LayoutComponent for route persistence"
```

---

### Step 2: Wire HomeComponent to pass data to all sections

`HomeComponent` is the smart container. Currently it only reads `bioData`. Expand it to read all data and pass it down via signal inputs.

**`home.component.ts` additions:**
```typescript
import { projectsData } from '../../data/projects.data';
import { skillsData } from '../../data/skills.data';
import { socialLinksData } from '../../data/social-links.data';

// In class body:
readonly projects = projectsData;
readonly skills = skillsData;
readonly socialLinks = socialLinksData;
// bio is already: readonly bio = bioData;
```

**`home.component.html` section bindings:**
```html
<app-projects-section [projects]="projects" />
<app-about-section [bio]="bio" />
<app-skills-section [skillGroups]="skills" />
<app-contact-section [email]="bio.email" [socialLinks]="socialLinks" />
```

This is the only change to `HomeComponent` for data flow — all rendering logic lives in the sections.

**Commit checkpoint:**
```bash
git add src/app/features/home/home.component.*
git commit -m "feat: wire HomeComponent data bindings to all section inputs"
```

---

### Step 3: Implement AboutSectionComponent

**Files:** `features/home/sections/about-section/`

**Component:**
```typescript
// about-section.component.ts
readonly bio = input.required<Bio>();
```

**Template structure:**
```
<section class="about-section">
  <app-section-header title="About Me" />
  <div class="about-section__content" appScrollReveal>
    <p class="about-section__bio">{{ bio().shortBio }}</p>
    <p class="about-section__extended">{{ bio().extendedBio }}</p>
  </div>
</section>
```

**SCSS:**
- `max-width: 800px`, centered
- Section padding: `var(--section-padding-v)` vertical, standard horizontal
- `p` line-height: 1.6, font: Inter, color: `var(--text-primary)` / `var(--text-secondary)`
- `extendedBio` paragraph uses `white-space: pre-line` to respect the `\n\n` line breaks in the data

---

### Step 4: Implement ContactSectionComponent

**Files:** `features/home/sections/contact-section/`

**Component inputs:**
```typescript
readonly email = input.required<string>();
readonly socialLinks = input.required<SocialLink[]>();
```

**Template structure:**
```
<section class="contact-section">
  <app-section-header title="Get In Touch" subtitle="Want to collaborate? Let's talk." />
  <div class="contact-section__content" appScrollReveal>
    <a [href]="'mailto:' + email()" class="contact-section__email-cta">
      {{ email() }}
    </a>
    <app-social-links [links]="socialLinks()" />
  </div>
</section>
```

**SCSS:**
- Centered, minimal layout
- `.contact-section__email-cta` — styled as a neon-bordered pill/card:
  ```scss
  border: 1px solid rgba(var(--accent-cyan-rgb), 0.4);
  box-shadow: var(--glow-cyan);
  padding: 12px 32px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--accent-cyan);
  ```
- Hover: glow intensifies, slight `translateY(-2px)`

**Commit checkpoint (after Steps 3 + 4):**
```bash
git add src/app/features/home/sections/about-section/ src/app/features/home/sections/contact-section/
git commit -m "feat: implement AboutSection and ContactSection with bio/social data"
```

---

### Step 5: Implement SkillsSectionComponent + SkillsGridComponent

**New sub-component:** `features/home/sections/skills-section/skills-grid/`

#### SkillsGridComponent

```typescript
// skills-grid.component.ts
readonly skillGroups = input.required<SkillGroup[]>();
```

**Template:**
```html
<div class="skills-grid">
  @for (group of skillGroups(); track group.category) {
    <div class="skills-grid__group" appScrollReveal>
      <h3 class="skills-grid__category">{{ group.category }}</h3>
      <div class="skills-grid__chips">
        @for (skill of group.skills; track skill.name) {
          <app-skill-chip [name]="skill.name" [color]="group.color" />
        }
      </div>
    </div>
  }
</div>
```

**SCSS:**
- Outer grid: `display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 32px`
- `.skills-grid__category` — small uppercase label, color matches the group's accent, `Press Start 2P` or Space Grotesk 600
- `.skills-grid__chips` — `display: flex; flex-wrap: wrap; gap: 8px`
- Each `appScrollReveal` on the group creates a staggered entrance as the user scrolls through

#### SkillsSectionComponent

**Component inputs:**
```typescript
readonly skillGroups = input.required<SkillGroup[]>();
```

**Template:**
```html
<section class="skills-section">
  <app-section-header title="Skills" />
  <app-skills-grid [skillGroups]="skillGroups()" />
</section>
```

**Commit checkpoint:**
```bash
git add src/app/features/home/sections/skills-section/
git commit -m "feat: implement SkillsSection with SkillsGridComponent and category chips"
```

---

### Step 6: Implement ProjectsSectionComponent + ProjectListComponent + filter bar

**New sub-component:** `features/home/sections/projects-section/project-list/`

#### Extend ProjectCardComponent with link inputs

`ProjectCardComponent` currently has `title`, `description`, `imageUrl`, `tags`, `glowColor`, `cardClick`. Add:

```typescript
// project-card.component.ts
readonly liveUrl = input<string>();
readonly githubUrl = input<string>();
```

Update the template to render small icon-link buttons (GitHub icon, external link icon) when these inputs are present:
```html
@if (liveUrl()) {
  <a [href]="liveUrl()" target="_blank" rel="noopener noreferrer" class="project-card__link">
    Live Demo
  </a>
}
@if (githubUrl()) {
  <a [href]="githubUrl()" target="_blank" rel="noopener noreferrer" class="project-card__link">
    GitHub
  </a>
}
```

#### ProjectListComponent

```typescript
// project-list.component.ts
readonly projects = input.required<Project[]>();
```

**Template:** CSS Grid of `ProjectCardComponent` items.

```html
<div class="project-list">
  @for (project of projects(); track project.slug) {
    <app-project-card
      [title]="project.title"
      [description]="project.description"
      [imageUrl]="project.imageUrl"
      [tags]="project.tags"
      [glowColor]="project.glowColor"
      [liveUrl]="project.liveUrl"
      [githubUrl]="project.githubUrl"
    />
  }
</div>
```

**SCSS:** `display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px`

#### Unit Tests for ProjectsSectionComponent filter logic

The filter state (`activeFilter`, `allTags`, `filteredProjects`) is pure computed signal logic — write the spec before implementing:

**File:** `features/home/sections/projects-section/projects-section.component.spec.ts`

```typescript
import { TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { ProjectsSectionComponent } from './projects-section.component';
import { Project } from '../../../../models/project.model';

const mockProjects: Project[] = [
  { slug: 'a', title: 'A', description: '', longDescription: '', tags: ['Angular', 'TypeScript'], imageUrl: '', featured: false, category: 'tool', glowColor: 'cyan' },
  { slug: 'b', title: 'B', description: '', longDescription: '', tags: ['React', 'TypeScript'], imageUrl: '', featured: false, category: 'web-app', glowColor: 'blue' },
  { slug: 'c', title: 'C', description: '', longDescription: '', tags: ['Angular', 'Node.js'], imageUrl: '', featured: false, category: 'api', glowColor: 'purple' },
];

describe('ProjectsSectionComponent', () => {
  let ref: ComponentRef<ProjectsSectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ProjectsSectionComponent] });
    const fixture = TestBed.createComponent(ProjectsSectionComponent);
    ref = fixture.componentRef;
    ref.setInput('projects', mockProjects);
    fixture.detectChanges();
  });

  it('shows all projects when no filter is active', () => {
    expect(ref.instance.filteredProjects()).toHaveLength(3);
  });

  it('filters to projects matching the active tag', () => {
    ref.instance.setFilter('Angular');
    expect(ref.instance.filteredProjects()).toHaveLength(2);
    expect(ref.instance.filteredProjects().map(p => p.slug)).toEqual(['a', 'c']);
  });

  it('resets to all projects when filter is cleared', () => {
    ref.instance.setFilter('React');
    ref.instance.setFilter(null);
    expect(ref.instance.filteredProjects()).toHaveLength(3);
  });

  it('derives unique tags from all projects', () => {
    const tags = ref.instance.allTags();
    expect(tags).toContain('Angular');
    expect(tags).toContain('React');
    expect(tags).toContain('TypeScript');
    expect(tags).toContain('Node.js');
    // No duplicates
    expect(tags.length).toBe(new Set(tags).size);
  });
});
```

Run: `npm test -- --reporter=verbose`

#### ProjectsSectionComponent (filter bar + smart state)

**Component:**
```typescript
readonly projects = input.required<Project[]>();

// Internal filter state
readonly activeFilter = signal<string | null>(null);

// All unique tags across all projects
readonly allTags = computed(() =>
  [...new Set(this.projects().flatMap(p => p.tags))]
);

// Filtered project list
readonly filteredProjects = computed(() => {
  const filter = this.activeFilter();
  if (!filter) return this.projects();
  return this.projects().filter(p => p.tags.includes(filter));
});

setFilter(tag: string | null): void {
  this.activeFilter.set(tag);
}
```

**Template:**
```html
<section class="projects-section">
  <app-section-header title="Projects" />

  <div class="projects-section__filter-bar" appScrollReveal>
    <button
      class="filter-pill"
      [class.filter-pill--active]="activeFilter() === null"
      (click)="setFilter(null)"
    >All</button>
    @for (tag of allTags(); track tag) {
      <button
        class="filter-pill"
        [class.filter-pill--active]="activeFilter() === tag"
        (click)="setFilter(tag)"
      >{{ tag }}</button>
    }
  </div>

  <app-project-list [projects]="filteredProjects()" appScrollReveal />
</section>
```

**SCSS — filter bar:**
```scss
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

**Commit checkpoint:**
```bash
git add src/app/features/home/sections/projects-section/ src/app/shared/components/project-card/
git commit -m "feat: implement ProjectsSection with filter bar and ProjectListComponent"
```

---

### Step 7: ProjectDetailComponent + Routing

**New component:** `features/projects/project-detail/project-detail.component.{ts,html,scss}`

**Component:**
```typescript
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

  // Use toSignal on paramMap (not snapshot) so the component re-resolves
  // correctly if Angular ever reuses the instance across slug navigations.
  private readonly params = toSignal(this.route.paramMap);

  readonly project = computed(() => {
    const slug = this.params()?.get('slug');
    return projectsData.find(p => p.slug === slug) ?? null;
  });
}
```

**Template:**
```html
<div class="project-detail">
  <a routerLink="/" fragment="projects" class="project-detail__back">
    ← Back to Projects
  </a>

  @if (project(); as p) {
    <img [src]="p.imageUrl" [alt]="p.title" class="project-detail__image" />
    <h1 class="project-detail__title">{{ p.title }}</h1>
    <div class="project-detail__tags">
      @for (tag of p.tags; track tag) {
        <app-tech-tag [label]="tag" />
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
  } @else {
    <p class="project-detail__not-found">Project not found.</p>
  }
</div>
```

**SCSS:**
- `.project-detail` — `max-width: 900px`, centered, section padding
- `.project-detail__title` — gradient text (matches hero name style)
- `.project-detail__image` — full width, `border-radius: 12px`, `border: 1px solid var(--bg-border)`, subtle glow
- `.project-detail__link` — neon pill buttons (same style as CTA buttons)

**Routing — `app.routes.ts`:**

> **Critical — route order matters.** Angular matches routes top-to-bottom. The wildcard `{ path: '**', redirectTo: '' }` is currently the last entry. The `/projects/:slug` route **must be placed before the wildcard**, or Angular will redirect all detail page requests to home silently. Also delete the `{ path: 'projects', redirectTo: '' }` entry — it conflicts with the new parameterized route.

The final children array order must be:
```typescript
children: [
  { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
  { path: 'about', redirectTo: '' },
  // NOTE: 'projects' redirect is REMOVED — conflicts with projects/:slug
  { path: 'contact', redirectTo: '' },
  {
    path: 'projects/:slug',   // <-- BEFORE the wildcard
    loadComponent: () =>
      import('./features/projects/project-detail/project-detail.component')
        .then(m => m.ProjectDetailComponent),
  },
  { path: '**', redirectTo: '' },  // <-- wildcard stays LAST
]
```

**Pre-render — `app.routes.server.ts`:**

Add explicit pre-render entries for each project slug so the static build generates individual HTML files:
```typescript
{ path: 'projects/pixel-quest' },
{ path: 'projects/devboard' },
{ path: 'projects/neonchat' },
{ path: 'projects/codecraft-api' },
{ path: 'projects/starmapper' },
```

**Commit checkpoint:**
```bash
git add src/app/features/projects/ src/app/app.routes.ts src/app/app.routes.server.ts
git commit -m "feat: add ProjectDetailComponent and enable /projects/:slug route"
```

---

### Step 8: Visual Validation with Playwright

After each section is implemented (or at the end), use Playwright to:

1. Navigate to `http://localhost:4200` — screenshot full page
2. Scroll to each section and screenshot:
   - Projects section with filter bar visible
   - Click a filter tag — verify cards update reactively
   - About section — verify bio text renders with correct whitespace
   - Skills section — verify grid layout and chip colors per category
   - Contact section — verify email CTA glow and social links
3. Navigate to `/projects/pixel-quest` — screenshot detail page
4. Navigate to `/projects/nonexistent` — verify "not found" fallback renders

---

## New Files Created

| File | Purpose |
|---|---|
| `features/home/sections/skills-section/skills-grid/skills-grid.component.ts` | Sub-component: renders skill categories + chips |
| `features/home/sections/skills-section/skills-grid/skills-grid.component.html` | Template |
| `features/home/sections/skills-section/skills-grid/skills-grid.component.scss` | Styles |
| `features/home/sections/projects-section/project-list/project-list.component.ts` | Sub-component: grid of project cards |
| `features/home/sections/projects-section/project-list/project-list.component.html` | Template |
| `features/home/sections/projects-section/project-list/project-list.component.scss` | Styles |
| `features/projects/project-detail/project-detail.component.ts` | Detail view for a single project |
| `features/projects/project-detail/project-detail.component.html` | Template |
| `features/projects/project-detail/project-detail.component.scss` | Styles |

---

## Files Modified

| File | Change |
|---|---|
| `layout/layout.component.ts` | Import + render `BackgroundSceneComponent` |
| `features/home/home.component.ts` | Add `projects`, `skills`, `socialLinks` data fields; remove BackgroundScene import |
| `features/home/home.component.html` | Remove `<app-background-scene />`; bind data to section inputs |
| `features/home/sections/about-section/*` | Full implementation |
| `features/home/sections/contact-section/*` | Full implementation |
| `features/home/sections/skills-section/*` | Full implementation; import SkillsGridComponent |
| `features/home/sections/projects-section/*` | Full implementation; import ProjectListComponent; add filter state |
| `shared/components/project-card/project-card.component.ts` | Add `liveUrl`, `githubUrl` inputs |
| `shared/components/project-card/project-card.component.html` | Render link buttons conditionally |
| `app.routes.ts` | Enable `/projects/:slug`; remove `/projects` redirect |
| `app.routes.server.ts` | Add project slug pre-render entries |

---

## Testing Checklist

- [ ] All four sections render with correct placeholder data from the data layer
- [ ] About section: `extendedBio` renders with correct line breaks
- [ ] Projects section: filter bar renders all unique tags; filtering updates card list reactively; "All" resets
- [ ] Skills section: all 8 category groups render; chips use the correct glow color per group
- [ ] Contact section: email link opens `mailto:` correctly; `SocialLinksComponent` renders
- [ ] `ProjectDetailComponent` loads at `/projects/pixel-quest` with full content
- [ ] Unknown slug (`/projects/xyz`) shows "not found" fallback (no crash)
- [ ] Background canvas persists when navigating between `/` and `/projects/:slug`
- [ ] `appScrollReveal` fires on all sections as user scrolls
- [ ] `npm run build` completes without error — all project slug routes pre-render to static HTML
- [ ] No SSR errors in the build output (`isPlatformBrowser` guards still in place on BackgroundScene)

---

## Scope Notes

**Not in this phase:**
- Hover lift / 3D tilt effects on project cards — deferred to Phase 7
- `RouterLink` navigation from feature cards (they currently scroll; no change needed)
- Responsive breakpoint polish — deferred to Phase 9
- `GlowDirective` on hover interactions — deferred to Phase 7

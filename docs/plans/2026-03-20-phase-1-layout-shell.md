# Phase 1: Layout Shell — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the persistent app shell — navbar, footer, and routed content area — so every page is reachable and the site has consistent navigation.

**Architecture:** LayoutComponent wraps NavbarComponent + `<router-outlet>` + FooterComponent. Routes are defined with lazy-loaded `loadComponent` as children of LayoutComponent. Four stub feature components (Home, About, Projects, Contact) serve as route targets. AppComponent becomes a minimal router outlet.

**Tech Stack:** Angular 21, TypeScript (strict), SCSS with CSS custom properties, Angular Router (lazy loading), Vitest

**Notes:**
- TDD does not apply to this phase — it's structural/visual with minimal testable logic. Verification uses `ng build` and `ng serve`.
- The temporary design system verification page (from Phase 0) will be replaced by the layout shell.
- The project uses Vitest (not Karma) for testing.

---

## Questions

1. **"Skills" nav link has no route.** The architecture defines routes for `/`, `/about`, `/projects`, `/contact` — no `/skills` route exists. The Skills grid lives on the About page (Phase 6). **Decision:** Include the Skills link pointing to `/about` as a placeholder. Omit `routerLinkActive` for it to avoid duplicate active state with the About link. Update to fragment scroll (`/about#skills`) in Phase 6/7.

2. **Navbar brand text.** Design says "Logo/brand text on the left (placeholder pixel icon)." **Decision:** Use "C" in pixel font as the icon + "CALCITE" as brand text, matching the established identity.

3. **Social link URLs.** The data layer (Phase 3) will define actual profile URLs. **Decision:** Use `#` placeholder hrefs in the footer. Replace when FooterComponent consumes `social-links.data.ts` in Phase 3.

4. **No `stylePreprocessorOptions` in angular.json.** Component SCSS can't currently `@use 'variables'` without deep relative paths. **Decision:** Add `stylePreprocessorOptions.includePaths: ["src/styles"]` in Task 1 so all component SCSS can use `@use 'variables' as *` directly.

5. **Typography size variables live in `_typography.scss`.** Importing that file into component SCSS would also emit its CSS rules (body styles, heading styles) scoped to the component — undesirable bloat. **Decision:** Use raw rem values with comments in component SCSS (e.g., `font-size: 0.875rem; // text-sm`). A dedicated `_type-scale.scss` partial can be extracted in a future refactor.

6. **`projects/:slug` route from architecture.md.** The architecture doc includes `{ path: 'projects/:slug', loadComponent: ... }` but `ProjectDetailComponent` doesn't exist until Phase 6. **Decision:** Omit this route in Phase 1. Add a comment in `app.routes.ts` noting it will be added in Phase 6 when `ProjectDetailComponent` is created. This avoids creating a component stub that has no meaningful purpose at this stage.

---

## File Structure

### Created by this plan

```
src/app/layout/
├── layout.component.ts          — Structural shell (inline template/styles, < 15 lines)
├── navbar/
│   ├── navbar.component.ts      — Fixed navbar with hamburger toggle signal
│   ├── navbar.component.html    — Desktop links + mobile drawer
│   └── navbar.component.scss    — Glassmorphism, hover glow, responsive drawer
└── footer/
    ├── footer.component.ts      — Static footer
    ├── footer.component.html    — Inline SVG social icons + copyright
    └── footer.component.scss    — Glow hover effects per icon

src/app/features/home/
├── home.component.ts            — Stub (expanded in Phase 4)
├── home.component.html
└── home.component.scss

src/app/features/about/
├── about.component.ts           — Stub (expanded in Phase 6)
├── about.component.html
└── about.component.scss

src/app/features/projects/
├── projects.component.ts        — Stub (expanded in Phase 6)
├── projects.component.html
└── projects.component.scss

src/app/features/contact/
├── contact.component.ts         — Stub (expanded in Phase 6)
├── contact.component.html
└── contact.component.scss
```

### Modified by this plan

```
angular.json                      — Add stylePreprocessorOptions.includePaths
src/styles.scss                   — Add --navbar-height CSS custom property
src/app/app.routes.ts             — Define routes with lazy loading
src/app/app.component.html        — Replace verification page with <router-outlet />
src/app/app.component.scss        — Remove verification styles
src/app/app.component.spec.ts     — Update tests for simplified component
```

---

## Task 1: Configure SCSS include paths and add navbar height token

**Files:**
- Modify: `angular.json` (add `stylePreprocessorOptions`)
- Modify: `src/styles.scss` (add `--navbar-height`)

- [ ] **Step 1: Add `stylePreprocessorOptions` to `angular.json`**

In `angular.json`, under `projects > portfolio > architect > build > options`, add:

```json
"stylePreprocessorOptions": {
  "includePaths": ["src/styles"]
}
```

Add it after the `"styles"` array. This lets all component SCSS files use `@use 'variables' as *` instead of deep relative paths.

- [ ] **Step 2: Add `--navbar-height` to `src/styles.scss`**

In the `:root` block of `src/styles.scss`, add under the `// Layout` comment (after `--max-content-width`):

```scss
  // Layout components
  --navbar-height: 4rem;
```

- [ ] **Step 3: Verify SCSS compilation**

```bash
npx ng build 2>&1 | tail -5
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add angular.json src/styles.scss
git commit -m "chore: add SCSS include paths and navbar height token"
```

---

## Task 2: Create stub feature page components

**Files:**
- Create: `src/app/features/home/home.component.ts`
- Create: `src/app/features/home/home.component.html`
- Create: `src/app/features/home/home.component.scss`
- Create: `src/app/features/about/about.component.ts`
- Create: `src/app/features/about/about.component.html`
- Create: `src/app/features/about/about.component.scss`
- Create: `src/app/features/projects/projects.component.ts`
- Create: `src/app/features/projects/projects.component.html`
- Create: `src/app/features/projects/projects.component.scss`
- Create: `src/app/features/contact/contact.component.ts`
- Create: `src/app/features/contact/contact.component.html`
- Create: `src/app/features/contact/contact.component.scss`

- [ ] **Step 1: Create HomeComponent**

Create `src/app/features/home/home.component.ts`:

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {}
```

Create `src/app/features/home/home.component.html`:

```html
<section class="page">
  <h1>Home</h1>
  <p>Welcome to Calcite's portfolio. Coming soon...</p>
</section>
```

Create `src/app/features/home/home.component.scss`:

```scss
@use 'mixins' as *;

:host {
  display: block;
}

.page {
  @include content-container;
  @include section-spacing;
}
```

- [ ] **Step 2: Create AboutComponent**

Create `src/app/features/about/about.component.ts`:

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-about',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent {}
```

Create `src/app/features/about/about.component.html`:

```html
<section class="page">
  <h1>About</h1>
  <p>About Tyler Hawthorn. Coming soon...</p>
</section>
```

Create `src/app/features/about/about.component.scss`:

```scss
@use 'mixins' as *;

:host {
  display: block;
}

.page {
  @include content-container;
  @include section-spacing;
}
```

- [ ] **Step 3: Create ProjectsComponent**

Create `src/app/features/projects/projects.component.ts`:

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-projects',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss',
})
export class ProjectsComponent {}
```

Create `src/app/features/projects/projects.component.html`:

```html
<section class="page">
  <h1>Projects</h1>
  <p>Featured projects. Coming soon...</p>
</section>
```

Create `src/app/features/projects/projects.component.scss`:

```scss
@use 'mixins' as *;

:host {
  display: block;
}

.page {
  @include content-container;
  @include section-spacing;
}
```

- [ ] **Step 4: Create ContactComponent**

Create `src/app/features/contact/contact.component.ts`:

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-contact',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent {}
```

Create `src/app/features/contact/contact.component.html`:

```html
<section class="page">
  <h1>Contact</h1>
  <p>Get in touch. Coming soon...</p>
</section>
```

Create `src/app/features/contact/contact.component.scss`:

```scss
@use 'mixins' as *;

:host {
  display: block;
}

.page {
  @include content-container;
  @include section-spacing;
}
```

- [ ] **Step 5: Verify all stubs compile**

```bash
npx ng build 2>&1 | tail -5
```

Expected: Build succeeds. (Components aren't routed yet but must compile.)

- [ ] **Step 6: Commit**

```bash
git add src/app/features/
git commit -m "feat: add stub feature page components for routing"
```

---

## Task 3: Implement NavbarComponent

**Files:**
- Create: `src/app/layout/navbar/navbar.component.ts`
- Create: `src/app/layout/navbar/navbar.component.html`
- Create: `src/app/layout/navbar/navbar.component.scss`

- [ ] **Step 1: Create `navbar.component.ts`**

Create `src/app/layout/navbar/navbar.component.ts`:

```typescript
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  isMenuOpen = signal(false);

  toggleMenu(): void {
    this.isMenuOpen.update(open => !open);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }
}
```

- [ ] **Step 2: Create `navbar.component.html`**

Create `src/app/layout/navbar/navbar.component.html`:

```html
<header class="navbar">
  <nav class="navbar__inner" aria-label="Main navigation">
    <a class="navbar__brand" routerLink="/">
      <span class="navbar__brand-icon pixel-text">C</span>
      <span class="navbar__brand-text">CALCITE</span>
    </a>

    <!-- Desktop links (hidden on mobile) -->
    <ul class="navbar__links">
      <li>
        <a class="navbar__link" routerLink="/about" routerLinkActive="navbar__link--active">About</a>
      </li>
      <li>
        <a class="navbar__link" routerLink="/projects" routerLinkActive="navbar__link--active">Projects</a>
      </li>
      <li>
        <a class="navbar__link" routerLink="/about">Skills</a>
      </li>
      <li>
        <a class="navbar__link" routerLink="/contact" routerLinkActive="navbar__link--active">Contact</a>
      </li>
    </ul>

    <!-- Hamburger toggle (mobile only) -->
    <button
      class="navbar__hamburger"
      [class.navbar__hamburger--open]="isMenuOpen()"
      (click)="toggleMenu()"
      [attr.aria-expanded]="isMenuOpen()"
      aria-label="Toggle navigation menu"
    >
      <span class="navbar__hamburger-line"></span>
      <span class="navbar__hamburger-line"></span>
      <span class="navbar__hamburger-line"></span>
    </button>
  </nav>
</header>

<!-- Mobile overlay -->
<div
  class="navbar__overlay"
  [class.navbar__overlay--visible]="isMenuOpen()"
  (click)="closeMenu()"
></div>

<!-- Mobile drawer -->
<div class="navbar__drawer" [class.navbar__drawer--open]="isMenuOpen()">
  <ul class="navbar__drawer-links">
    <li>
      <a class="navbar__drawer-link" routerLink="/about" routerLinkActive="navbar__drawer-link--active" (click)="closeMenu()">About</a>
    </li>
    <li>
      <a class="navbar__drawer-link" routerLink="/projects" routerLinkActive="navbar__drawer-link--active" (click)="closeMenu()">Projects</a>
    </li>
    <li>
      <a class="navbar__drawer-link" routerLink="/about" (click)="closeMenu()">Skills</a>
    </li>
    <li>
      <a class="navbar__drawer-link" routerLink="/contact" routerLinkActive="navbar__drawer-link--active" (click)="closeMenu()">Contact</a>
    </li>
  </ul>
</div>
```

- [ ] **Step 3: Create `navbar.component.scss`**

Create `src/app/layout/navbar/navbar.component.scss`:

```scss
@use 'variables' as *;
@use 'mixins' as *;

// ============================
// Navbar header bar
// ============================

.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 102;
  height: var(--navbar-height);
  background-color: rgba($bg-primary, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba($bg-border, 0.5);
}

.navbar__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  @include content-container;
}

// ============================
// Brand / Logo
// ============================

.navbar__brand {
  display: flex;
  align-items: center;
  gap: $space-1;
  text-decoration: none;
  transition: opacity $transition-fast;

  &:hover {
    opacity: 0.8;
  }
}

.navbar__brand-icon {
  color: var(--accent-cyan);
}

.navbar__brand-text {
  font-family: 'Space Grotesk', system-ui, sans-serif;
  font-size: 1.25rem; // text-lg
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.05em;
}

// ============================
// Desktop nav links
// ============================

.navbar__links {
  display: none;
  align-items: center;
  gap: $space-4;

  @include md {
    display: flex;
  }
}

.navbar__link {
  font-family: 'Space Grotesk', system-ui, sans-serif;
  font-size: 0.875rem; // text-sm
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: $space-1 0;
  position: relative;
  transition: color $transition-base, text-shadow $transition-base;

  &:hover {
    color: var(--accent-cyan);
    text-shadow: 0 0 10px rgba($accent-cyan, 0.3);
  }

  &--active {
    color: var(--accent-cyan);

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, var(--accent-cyan), var(--accent-blue));
      border-radius: 1px;
    }
  }
}

// ============================
// Hamburger toggle (mobile)
// ============================

.navbar__hamburger {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  padding: $space-1;

  @include md {
    display: none;
  }
}

.navbar__hamburger-line {
  display: block;
  width: 24px;
  height: 2px;
  background-color: var(--text-primary);
  border-radius: 1px;
  transition: transform $transition-base, opacity $transition-base;
}

.navbar__hamburger--open {
  .navbar__hamburger-line:nth-child(1) {
    transform: translateY(8px) rotate(45deg);
  }

  .navbar__hamburger-line:nth-child(2) {
    opacity: 0;
  }

  .navbar__hamburger-line:nth-child(3) {
    transform: translateY(-8px) rotate(-45deg);
  }
}

// ============================
// Mobile overlay
// ============================

.navbar__overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 100;
  opacity: 0;
  pointer-events: none;
  transition: opacity $transition-base;

  &--visible {
    opacity: 1;
    pointer-events: auto;
  }

  @include md {
    display: none;
  }
}

// ============================
// Mobile drawer
// ============================

.navbar__drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 280px;
  height: 100vh;
  height: 100dvh;
  background-color: var(--bg-surface);
  border-left: 1px solid var(--bg-border);
  z-index: 101;
  transform: translateX(100%);
  transition: transform $transition-base;
  padding-top: calc(var(--navbar-height) + #{$space-4});

  &--open {
    transform: translateX(0);
  }

  @include md {
    display: none;
  }
}

.navbar__drawer-links {
  display: flex;
  flex-direction: column;
  padding: 0 $space-3;
}

.navbar__drawer-link {
  display: block;
  font-family: 'Space Grotesk', system-ui, sans-serif;
  font-size: 1.25rem; // text-lg
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  padding: $space-2 0;
  border-bottom: 1px solid rgba($bg-border, 0.5);
  transition: color $transition-base, text-shadow $transition-base;

  &:hover {
    color: var(--accent-cyan);
    text-shadow: 0 0 10px rgba($accent-cyan, 0.3);
  }

  &--active {
    color: var(--accent-cyan);
  }
}
```

- [ ] **Step 4: Verify navbar compiles**

```bash
npx ng build 2>&1 | tail -5
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout/navbar/
git commit -m "feat: add navbar component with glassmorphism and mobile drawer"
```

---

## Task 4: Implement FooterComponent

**Files:**
- Create: `src/app/layout/footer/footer.component.ts`
- Create: `src/app/layout/footer/footer.component.html`
- Create: `src/app/layout/footer/footer.component.scss`

- [ ] **Step 1: Create `footer.component.ts`**

Create `src/app/layout/footer/footer.component.ts`:

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {}
```

- [ ] **Step 2: Create `footer.component.html`**

Create `src/app/layout/footer/footer.component.html`:

```html
<footer class="footer">
  <div class="footer__inner">
    <div class="footer__social">
      <a
        class="footer__social-link footer__social-link--github"
        href="#"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
        </svg>
      </a>
      <a
        class="footer__social-link footer__social-link--twitter"
        href="#"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Twitter / X"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </a>
      <a
        class="footer__social-link footer__social-link--linkedin"
        href="#"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="LinkedIn"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      </a>
    </div>
    <p class="footer__copyright">&copy; 2026 Tyler Hawthorn. Built with Angular.</p>
  </div>
</footer>
```

- [ ] **Step 3: Create `footer.component.scss`**

Create `src/app/layout/footer/footer.component.scss`:

```scss
@use 'variables' as *;
@use 'mixins' as *;

.footer {
  border-top: 1px solid rgba($bg-border, 0.5);
  padding: $space-6 0;
}

.footer__inner {
  @include content-container;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-3;
}

.footer__social {
  display: flex;
  align-items: center;
  gap: $space-4;
}

.footer__social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: color $transition-base, filter $transition-base;

  svg {
    width: 24px;
    height: 24px;
    fill: currentColor;
  }

  &--github:hover {
    color: var(--accent-cyan);
    filter: drop-shadow(0 0 8px rgba($accent-cyan, 0.4));
  }

  &--twitter:hover {
    color: var(--accent-blue);
    filter: drop-shadow(0 0 8px rgba($accent-blue, 0.4));
  }

  &--linkedin:hover {
    color: var(--accent-purple);
    filter: drop-shadow(0 0 8px rgba($accent-purple, 0.4));
  }
}

.footer__copyright {
  font-size: 0.875rem; // text-sm
  color: var(--text-secondary);
  text-align: center;
}
```

- [ ] **Step 4: Verify footer compiles**

```bash
npx ng build 2>&1 | tail -5
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout/footer/
git commit -m "feat: add footer component with social icons and glow hover"
```

---

## Task 5: Create LayoutComponent, configure routing, update AppComponent

**Files:**
- Create: `src/app/layout/layout.component.ts`
- Modify: `src/app/app.routes.ts`
- Modify: `src/app/app.component.html`
- Modify: `src/app/app.component.scss`
- Modify: `src/app/app.component.spec.ts`

- [ ] **Step 1: Create `layout.component.ts`**

Create `src/app/layout/layout.component.ts`:

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  template: `
    <app-navbar />
    <main class="layout__content">
      <router-outlet />
    </main>
    <app-footer />
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .layout__content {
      flex: 1;
      padding-top: var(--navbar-height);
    }
  `],
})
export class LayoutComponent {}
```

Inline template/styles are used because the component is < 15 lines of template (per conventions).

- [ ] **Step 2: Update `app.routes.ts`**

Replace the contents of `src/app/app.routes.ts` with:

```typescript
import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';

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
      {
        path: 'about',
        loadComponent: () =>
          import('./features/about/about.component').then(m => m.AboutComponent),
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./features/projects/projects.component').then(m => m.ProjectsComponent),
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('./features/contact/contact.component').then(m => m.ContactComponent),
      },
      // { path: 'projects/:slug', loadComponent: ... } — added in Phase 6 with ProjectDetailComponent
      { path: '**', redirectTo: '' },
    ],
  },
];
```

LayoutComponent is eagerly loaded (always visible). Feature components are lazy-loaded via `loadComponent`.

- [ ] **Step 3: Simplify `app.component.html`**

Replace the contents of `src/app/app.component.html` with:

```html
<router-outlet />
```

This removes the Phase 0 verification page. The LayoutComponent (loaded by the router) now provides all structure.

- [ ] **Step 4: Clear `app.component.scss`**

Replace the contents of `src/app/app.component.scss` with an empty file (or remove all content). The verification styles are no longer needed.

- [ ] **Step 5: Update `app.component.spec.ts`**

Read the current `src/app/app.component.spec.ts` and update it to work with the simplified component. The test should provide the router since AppComponent uses `RouterOutlet`:

```typescript
import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { provideRouter } from '@angular/router';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
```

- [ ] **Step 6: Verify build succeeds**

```bash
npx ng build 2>&1 | tail -10
```

Expected: Build succeeds with pre-rendered routes. The output should show routes being discovered and rendered.

- [ ] **Step 7: Commit**

```bash
git add src/app/layout/layout.component.ts src/app/app.routes.ts src/app/app.component.html src/app/app.component.scss src/app/app.component.spec.ts
git commit -m "feat: add layout shell with routing and lazy-loaded pages"
```

---

## Task 6: Build verification and navigation testing

- [ ] **Step 1: Run full production build**

```bash
npx ng build 2>&1 | tail -15
```

Expected: Build succeeds. Pre-rendered HTML files generated for all routes.

- [ ] **Step 2: Verify pre-rendered routes exist**

```bash
ls dist/portfolio/browser/index.html dist/portfolio/browser/about/index.html dist/portfolio/browser/projects/index.html dist/portfolio/browser/contact/index.html
```

Expected: All four HTML files exist.

- [ ] **Step 3: Run tests**

```bash
npx ng test 2>&1 | tail -10
```

Expected: Tests pass (AppComponent spec and any existing tests).

- [ ] **Step 4: Serve and visually verify**

```bash
npx ng serve
```

Open `http://localhost:4200` and verify:

- [ ] Navbar renders at top with glassmorphism effect (semi-transparent, blurred background)
- [ ] Brand "C CALCITE" visible on left
- [ ] Desktop nav links visible on right (About, Projects, Skills, Contact)
- [ ] Clicking each link navigates to the correct stub page
- [ ] Active link shows cyan color with gradient underline
- [ ] Link hover shows cyan glow
- [ ] Footer renders at bottom with 3 social icon placeholders
- [ ] Social icons glow on hover (GitHub=cyan, Twitter=blue, LinkedIn=purple)
- [ ] Copyright line visible
- [ ] Resize to mobile width (< 768px):
  - Desktop links hidden, hamburger visible
  - Hamburger click opens drawer from right with overlay
  - Drawer links navigate and close drawer
  - Hamburger animates to X when open
  - Clicking overlay closes drawer
- [ ] URL bar shows correct path for each page (`/`, `/about`, `/projects`, `/contact`)
- [ ] Unknown route (e.g., `/foo`) redirects to home

Stop the dev server after verification (`Ctrl+C`).

- [ ] **Step 5: Update docs**

Update `docs/development.md` to mark Phase 1 tasks as complete:

```markdown
- [x] `LayoutComponent` — wraps `<app-navbar>` + `<router-outlet>` + `<app-footer>`
- [x] `NavbarComponent`: ...
- [x] `FooterComponent`: ...
- [x] `app.routes.ts` — all routes defined with lazy-loaded `loadComponent`, wildcard redirect
- [x] Stub feature components (empty shell for Home, About, Projects, Contact) so routing works
```

- [ ] **Step 6: Commit docs update**

```bash
git add docs/development.md
git commit -m "docs: mark phase 1 layout shell tasks complete"
```

---

## Summary Checklist

After all tasks, verify these Phase 1 deliverables:

- [ ] Navbar: fixed, glassmorphism, desktop links, mobile hamburger/drawer
- [ ] Footer: social icons with per-icon glow, copyright
- [ ] LayoutComponent wraps navbar + router-outlet + footer
- [ ] All routes work: `/`, `/about`, `/projects`, `/contact`
- [ ] Lazy loading: feature components loaded on demand
- [ ] Wildcard route redirects to home
- [ ] Pre-rendering: all routes generate static HTML
- [ ] Active route indicator on navbar links
- [ ] Mobile drawer opens/closes with animation
- [ ] Clean git history with conventional commits

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Overlay/drawer as siblings of `<header>`, not children | Avoids z-index stacking context issues from `backdrop-filter` |
| z-index: navbar=102, drawer=101, overlay=100 | Clean layering: header bar always on top |
| `height: 100dvh` fallback after `100vh` on drawer | Handles mobile browser chrome correctly |
| Skills link → `/about` without `routerLinkActive` | No Skills route exists; avoids duplicate active state |
| Inline SVGs for social icons | No icon library dependency; trivially swappable |
| `pointer-events: none/auto` on overlay | Enables fade animation (element always in DOM) |
| Inline template for LayoutComponent | < 15 lines, per conventions |
| `stylePreprocessorOptions.includePaths` | Enables clean `@use 'variables'` from any component |

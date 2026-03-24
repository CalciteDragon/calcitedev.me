# Architecture

## Folder Structure

```
src/
├── app/
│   ├── core/                    # Singleton services
│   │   ├── services/
│   │   │   ├── theme.service.ts         # Dark/light toggle (future)
│   │   │   ├── meta.service.ts          # SEO/meta tag management
│   │   │   └── scroll.service.ts        # Active section tracking via IntersectionObserver
│   │   └── guards/
│   │
│   ├── layout/                  # App shell — always visible
│   │   ├── navbar/
│   │   │   ├── navbar.component.ts
│   │   │   ├── navbar.component.html
│   │   │   └── navbar.component.scss
│   │   ├── footer/
│   │   │   ├── footer.component.ts
│   │   │   ├── footer.component.html
│   │   │   └── footer.component.scss
│   │   └── layout.component.ts          # Wraps <navbar> + <router-outlet> + <footer>
│   │
│   ├── shared/                  # Reusable, stateless (presentational) components
│   │   ├── components/
│   │   │   ├── card/                    # Generic neon-bordered card
│   │   │   ├── project-card/
│   │   │   ├── skill-chip/
│   │   │   ├── section-header/
│   │   │   ├── social-links/
│   │   │   ├── tech-tag/
│   │   │   └── cta-button/              # Neon glow CTA button
│   │   ├── directives/
│   │   │   ├── scroll-reveal.directive.ts   # Animate elements on scroll into view
│   │   │   └── glow.directive.ts            # Neon glow effect on hover
│   │   ├── pipes/
│   │   └── animations/
│   │       └── shared-animations.ts     # Reusable Angular animation triggers
│   │
│   ├── features/                # Route-level feature components (lazy-loaded)
│   │   ├── home/
│   │   │   ├── home.component.ts
│   │   │   ├── home.component.html
│   │   │   ├── home.component.scss
│   │   │   ├── hero/                    # Hero section (avatar, heading, CTA)
│   │   │   ├── background-scene/        # Canvas — stars, mountains, UFO, rocket
│   │   │   ├── feature-cards/           # Three intro cards (About, Projects, Skills)
│   │   │   └── sections/                # Full-page scroll sections inside HomeComponent
│   │   │       ├── projects-section/    # Projects scroll section
│   │   │       ├── about-section/       # About scroll section
│   │   │       ├── skills-section/      # Skills scroll section
│   │   │       └── contact-section/     # Contact scroll section
│   │   └── projects/
│   │       └── project-detail/          # Phase 6: /projects/:slug detail view
│   │
│   ├── models/                  # TypeScript interfaces & types
│   │   ├── project.model.ts
│   │   ├── skill.model.ts
│   │   └── social-link.model.ts
│   │
│   ├── data/                    # Static content as TS constants
│   │   ├── projects.data.ts
│   │   ├── skills.data.ts
│   │   ├── bio.data.ts
│   │   └── social-links.data.ts
│   │
│   ├── app.component.ts
│   ├── app.config.ts
│   └── app.routes.ts
│
├── assets/
│   ├── images/                  # Project screenshots, profile photo
│   ├── pixel-art/               # Pixel-art sprites (avatar, UFO, rocket, icons)
│   ├── icons/                   # SVG icons or icon sprite
│   └── fonts/                   # Self-hosted web fonts
│
├── styles/                      # Global SCSS partials
│   ├── _variables.scss          # Colors, spacing, breakpoints, glow presets
│   ├── _mixins.scss             # Reusable SCSS mixins
│   ├── _typography.scss         # Font faces, type scale
│   ├── _animations.scss         # Keyframes, transition utilities
│   ├── _glow.scss               # Neon glow box-shadow presets
│   ├── _reset.scss              # CSS reset / normalize
│   └── styles.scss              # Main entry — imports all partials
│
└── environments/
    ├── environment.ts
    └── environment.prod.ts
```

## Routing

The app is a single-page scroll site. All content lives on the home route; old routes redirect to `/`.

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', loadComponent: () => import('./features/home/home.component') },
      // Old routes redirect to home — sections are scrolled to, not routed
      { path: 'about', redirectTo: '', pathMatch: 'full' },
      { path: 'projects', redirectTo: '', pathMatch: 'full' },
      { path: 'contact', redirectTo: '', pathMatch: 'full' },
      // { path: 'projects/:slug', loadComponent: () => import('./features/projects/project-detail/project-detail.component') }, // Phase 6
      { path: '**', redirectTo: '' }
    ]
  }
];
```

`HomeComponent` is the only lazy-loaded route. The section components (`ProjectsSectionComponent`, `AboutSectionComponent`, `SkillsSectionComponent`, `ContactSectionComponent`) are direct children of `HomeComponent`, not routes.

## Component Architecture

### Smart vs. Presentational

| Type            | Location     | Responsibility                                  |
| --------------- | ------------ | ------------------------------------------------ |
| Smart (Container) | `features/`  | Owns data, calls services, passes data down      |
| Presentational  | `shared/`    | Pure display — receives `@Input`, emits `@Output` |
| Layout          | `layout/`    | Structural shell — navbar, footer, router outlet  |
| Scene           | `features/home/background-scene/` | Canvas rendering — stars, mountains, UFO, rocket |

### Key Component Map

```
LayoutComponent
├── NavbarComponent                    (fixed, glassmorphism, pixel icons; scroll buttons for section nav)
├── <router-outlet>
│   └── HomeComponent                  (smart container — owns all scroll sections)
│       ├── BackgroundSceneComponent   (canvas — star field, mountains, UFO, rocket)
│       ├── HeroComponent              (avatar, heading, tagline, CTA)
│       ├── FeatureCardsComponent      (3 intro cards → uses CardComponent)
│       ├── ProjectsSectionComponent   (#projects scroll section)
│       ├── AboutSectionComponent      (#about scroll section)
│       ├── SkillsSectionComponent     (#skills scroll section)
│       └── ContactSectionComponent    (#contact scroll section)
└── FooterComponent                    (social icons, copyright)
```

### Signals & Reactivity

Use Angular **signals** for component state and **computed signals** for derived values. Reserve RxJS for async streams (scroll events, canvas animation loops, etc.).

### Data Flow

```
Static data files (data/)
        ↓
HomeComponent (smart container) reads data
        ↓
Passes to section components and shared components via @Input
        ↓
Section/shared components render UI
```

Section components (`ProjectsSectionComponent`, `AboutSectionComponent`, etc.) are presentational — they receive data from `HomeComponent` and render their slice of the page. No backend. No API calls for content. Everything compiled into the bundle from static TS files.

### Services

| Service | Location | Responsibility |
| --- | --- | --- |
| `ScrollService` | `core/services/scroll.service.ts` | Tracks active scroll section via `IntersectionObserver`; exposes `activeSection` as a signal; SSR-safe (guards browser APIs with `isPlatformBrowser`) |
| `MetaService` | `core/services/meta.service.ts` | SEO/meta tag management |
| `ThemeService` | `core/services/theme.service.ts` | Dark/light toggle (future) |

## SSR Strategy

Angular SSR (`@angular/ssr`) for:
- Faster first contentful paint
- SEO (crawlers get fully rendered HTML)
- Open Graph preview support

The `BackgroundSceneComponent` (canvas) must check for `isPlatformBrowser` before rendering — canvas APIs are browser-only.

Render deployment: **pre-rendered static site** (simpler, free-tier friendly). Angular's build-time prerendering generates static HTML for each route.

## Build & Deploy

```
Angular CLI build (with prerendering) → dist/browser/
        ↓
Push to GitHub → Render auto-deploys
        ↓
Render serves static files at calcitedev.me
```

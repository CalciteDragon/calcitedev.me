# Architecture

## Folder Structure

```
src/
├── app/
│   ├── core/                    # Singleton services
│   │   ├── services/
│   │   │   ├── theme.service.ts         # Dark/light toggle (future)
│   │   │   ├── meta.service.ts          # SEO/meta tag management
│   │   │   └── scroll.service.ts        # Scroll tracking & smooth scroll
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
│   │   │   └── feature-cards/           # Three intro cards (About, Projects, Skills)
│   │   ├── about/
│   │   │   ├── about.component.ts
│   │   │   ├── about.component.html
│   │   │   ├── about.component.scss
│   │   │   ├── skills-grid/
│   │   │   └── timeline/                # Optional experience timeline
│   │   ├── projects/
│   │   │   ├── projects.component.ts
│   │   │   ├── projects.component.html
│   │   │   ├── projects.component.scss
│   │   │   ├── project-list/
│   │   │   └── project-detail/
│   │   └── contact/
│   │       ├── contact.component.ts
│   │       ├── contact.component.html
│   │       └── contact.component.scss
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

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', loadComponent: () => import('./features/home/home.component') },
      { path: 'about', loadComponent: () => import('./features/about/about.component') },
      { path: 'projects', loadComponent: () => import('./features/projects/projects.component') },
      { path: 'projects/:slug', loadComponent: () => import('./features/projects/project-detail/project-detail.component') },
      { path: 'contact', loadComponent: () => import('./features/contact/contact.component') },
      { path: '**', redirectTo: '' }
    ]
  }
];
```

All feature routes are **lazy-loaded** via `loadComponent` for optimal bundle splitting.

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
├── NavbarComponent                  (fixed, glassmorphism, pixel icons)
├── <router-outlet>
│   └── HomeComponent                (smart — orchestrates hero section)
│       ├── BackgroundSceneComponent  (canvas — star field, mountains, UFO, rocket)
│       ├── HeroComponent             (avatar, heading, tagline, CTA)
│       └── FeatureCardsComponent     (3 intro cards → uses CardComponent)
│   └── AboutComponent
│       ├── SkillsGridComponent
│       └── TimelineComponent
│   └── ProjectsComponent
│       ├── ProjectListComponent      (uses ProjectCardComponent)
│       └── ProjectDetailComponent
│   └── ContactComponent
│       └── SocialLinksComponent
└── FooterComponent                  (social icons, copyright)
```

### Signals & Reactivity

Use Angular **signals** for component state and **computed signals** for derived values. Reserve RxJS for async streams (scroll events, canvas animation loops, etc.).

### Data Flow

```
Static data files (data/)
        ↓
Feature component (smart) reads data
        ↓
Passes to shared components via @Input
        ↓
Shared components render UI
```

No backend. No API calls for content. Everything compiled into the bundle from static TS files.

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

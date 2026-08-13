# Architecture

## Current Folder Structure

```text
src/
├── app/
│   ├── core/
│   │   └── services/
│   │       └── scroll.service.ts       # Active-section tracking, fragments, smooth scroll
│   ├── layout/
│   │   ├── navbar/                     # Fixed desktop nav + mobile drawer
│   │   ├── footer/                     # Minimal copyright-only footer
│   │   └── layout.component.ts         # Navbar + background + router outlet + footer
│   ├── shared/
│   │   ├── components/
│   │   │   ├── section-header/
│   │   │   ├── skill-chip/
│   │   │   ├── social-links/
│   │   │   └── tech-tag/
│   │   ├── directives/
│   │   │   ├── glow.directive.ts
│   │   │   └── scroll-reveal.directive.ts
│   │   └── types/
│   │       └── glow-color.type.ts
│   ├── features/
│   │   └── home/
│   │       ├── background-scene/       # Scene renderer, mountain renderer, worker bridge
│   │       ├── hero/                   # Avatar, platform, gradient type, CSS/HTML UFO
│   │       ├── sections/
│   │       │   ├── about-section/
│   │       │   ├── projects-section/
│   │       │   │   ├── project-focus-stage/ # Stable stacked detail panels
│   │       │   │   └── project-selector/    # Compact button-based project index
│   │       │   ├── skills-section/
│   │       │   └── contact-section/
│   │       └── home.component.*        # Smart single-page container
│   ├── data/                            # Static portfolio content
│   ├── models/                          # Project, skill, bio, and social interfaces
│   ├── app.config.ts                    # Router, hydration, scrolling configuration
│   ├── app.config.server.ts             # Server-rendering providers
│   ├── app.routes.ts                    # Browser route tree
│   └── app.routes.server.ts             # Wildcard static-prerender rule
├── styles/                              # Global SCSS partials
├── test-setup/                          # Canvas mocks for Vitest
├── main.ts
├── main.server.ts
├── server.ts
└── styles.scss

public/
├── favicon.svg                          # Pixel-C SVG favicon
└── assets/
    ├── images/                          # Seven project preview SVGs
    └── pixel-art/                       # Current avatar and UFO placeholders
```

Assets are served from `public/`, not `src/assets/`. Project visuals referenced by `projects.data.ts` live under `public/assets/images/`: the original Pixel Quest preview plus six project-specific SVGs for Live Bingo, Pineapple Expense, Calcite Portfolio, Mochi 2026, Minecraft Hide & Seek, and the work-in-progress Roblox world. The recursive portfolio art is a finite SVG composition rather than an iframe or runtime recursion.

## Routing

All application routes are children of `LayoutComponent`.

| Path | Behavior |
| --- | --- |
| `/` | Lazy-loads `HomeComponent`, containing all five scroll sections |
| `/about`, `/projects`, `/contact` | Redirect to `/` |
| Unknown paths | Redirect to `/` |

Project selection is intentionally not routed. Clicking a project preview only updates local signal state, which avoids a page transition and means adding, removing, or reordering a project requires no route or prerender change. `app.routes.server.ts` uses one wildcard prerender rule; the August 13 production build emits four static routes including redirects.

## Component Architecture

```text
LayoutComponent
├── NavbarComponent
├── BackgroundSceneComponent
│   ├── SceneRenderer (main thread: atmosphere, horizon glow, stars, particles)
│   └── MountainWorkerBridge
│       └── mountain.worker.ts
│           └── MountainRenderer (OffscreenCanvas procedural terrain)
├── RouterOutlet
│   └── HomeComponent
│       ├── HeroComponent
│       ├── AboutSectionComponent
│       ├── ProjectsSectionComponent
│       │   ├── ProjectFocusStageComponent → TechTagComponent
│       │   └── ProjectSelectorComponent
│       ├── SkillsSectionComponent
│       │   └── SkillsGridComponent → SkillChipComponent
│       └── ContactSectionComponent → SocialLinksComponent
└── FooterComponent
```

`HomeComponent` is the primary smart container. It imports static data and passes typed values into presentational sections using signal inputs. Shared components are reusable display primitives; the project showcase components are feature-local because no other route consumes them.

`ProjectsSectionComponent` owns `selectedSlug`, resolves `selectedProject` with a safe first-entry fallback, and announces selection changes. It guards viewport and focus behavior with `isPlatformBrowser()`. `ProjectFocusStageComponent` renders all projects into the same CSS grid cell; inactive articles remain in sizing calculations but are `visibility: hidden`, `aria-hidden`, `inert`, and non-interactive. This makes the focus stage as tall as its largest record and prevents swaps from moving later content. `ProjectSelectorComponent` renders the unchanged data order as real buttons with `aria-pressed` and `aria-controls`. External links live only in the active focus article, so selector buttons never contain nested interactive elements.

`bioData.about` stores the About introduction and four history entries as typed text segments. Intro segments can select cyan or pink; history segments carry semantic emphasis while their parent entry supplies the single stage color. `AboutSectionComponent` coalesces passive scroll measurements into animation frames and applies frame-rate-independent damping to card tilt and continuous rail progress. The rail is measured from the first number's center to the last number's center; the active chapter follows the closest numbered stop. In development, `?aboutDebug=scroll` exposes a read-only tuning HUD.

`FooterComponent` is a presentation-only shell with no inputs or data dependencies. `ContactSectionComponent` is the single consumer of `SocialLinksComponent` and `socialLinksData`, avoiding duplicate social rows at scroll-bottom. `LayoutComponent` owns the skip-to-content link and manually focuses `<main id="main-content">` so it behaves consistently after redirects.

The fixed background belongs to `LayoutComponent`. `BackgroundSceneComponent` owns the motion policy: under `prefers-reduced-motion` it draws a still frame and redraws only on scroll, and it pauses its animation loop while `document.hidden`. The UFO is an HTML/CSS element in `HeroComponent`; the controllable rocket remains future Phase 8 work.

## Data Flow

```text
src/app/data/*.data.ts
          ↓
HomeComponent
          ↓
section components
          ↓
feature-local/shared display components
```

All portfolio content is compiled from static TypeScript. There is no backend, CMS, database, or runtime content API. `Project` contains display copy, status, ordered tags, stable preview path/alt text, optional external URLs, and a `GlowColor`. It has no route, category-filter, or featured-card state.

## State and Services

Angular signals hold component state and computed values. RxJS is reserved for genuinely asynchronous streams.

`ScrollService`:

- Smooth-scrolls to homepage sections.
- Tracks the active section with `IntersectionObserver`.
- Exposes the current section as a signal for navbar styling.
- Updates the URL fragment with `history.replaceState`.
- Guards browser APIs for static rendering.

Project selection is feature-local state and deliberately is not stored in a service or URL. SEO/meta and theme services are not currently implemented; light mode remains deferred.

## Rendering Strategy

The project uses Angular SSR tooling in `outputMode: "static"`. `ng build` renders configured routes at build time and writes the deployable browser output to `dist/portfolio/browser/`; no Node server is required at runtime.

Hydration uses event replay. Browser-only behavior must be guarded with `isPlatformBrowser()`, including Canvas, OffscreenCanvas workers, observers, animation frames, scrolling, focus, and direct `window` access.

## Background Rendering

`BackgroundSceneComponent` coordinates two fixed canvases:

1. The mountain canvas is transferred to a dedicated worker. `MountainWorkerBridge` posts resize and camera updates; `MountainRenderer` draws perspective-projected FBM terrain. Static fog is precomposed into cached face colors.
2. The transparent scene canvas remains on the main thread and draws atmosphere, horizon glow, stars, and particles with `SceneRenderer`.

The component runs its animation loop outside Angular's zone and reduces scene entity counts below 768px. `scroll-perf-metrics.ts` provides opt-in production-path measurements through `?canvasPerf=scroll`. High-DPR mountain rendering remains a Phase 9 task.

## Build and Deployment

```text
npm run build
      ↓
Angular browser/server bundles + four static routes
      ↓
dist/portfolio/browser/
      ↓
Render static-site publish directory (planned/externally configured)
```

The August 13 verification passes 122 tests and completes the production build. Current component-style warnings are documented in `docs/development.md`; none exceed the 8 kB error budget. Render service settings, DNS, HTTPS, and the external deployment state must still be verified outside the repository.

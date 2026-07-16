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
│   │   ├── footer/                     # Minimal footer shell (copyright only)
│   │   └── layout.component.ts         # Navbar + background + router outlet + footer
│   ├── shared/
│   │   ├── components/
│   │   │   ├── card/
│   │   │   ├── project-card/
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
│   │   ├── home/
│   │   │   ├── background-scene/       # Scene renderer, mountain renderer, worker bridge
│   │   │   ├── hero/                   # Avatar, platform, gradient type, CSS/HTML UFO
│   │   │   ├── sections/               # Projects, About, Skills, Contact
│   │   │   └── home.component.*        # Smart single-page container
│   │   └── projects/
│   │       └── project-detail/         # /projects/:slug detail route
│   ├── data/                            # Static portfolio content
│   ├── models/                          # Project, skill, bio, and social interfaces
│   ├── app.config.ts                    # Router, hydration, scrolling configuration
│   ├── app.config.server.ts             # Server-rendering providers
│   ├── app.routes.ts                    # Browser route tree
│   └── app.routes.server.ts             # Static prerender routes and project params
├── styles/                              # Global SCSS partials
├── test-setup/                          # Canvas mocks for Vitest
├── main.ts
├── main.server.ts
├── server.ts
└── styles.scss

public/
├── favicon.svg                          # Pixel-C SVG favicon (favicon.ico kept as fallback)
└── assets/
    ├── images/                          # Per-project thumbnail placeholder SVGs (5)
    └── pixel-art/                       # Current avatar and UFO placeholders
```

Assets are served from `public/`, not `src/assets/`. The five project thumbnails referenced by `projects.data.ts` live under `public/assets/images/` as themed placeholder SVGs (one per project, in the project's glow color); swapping in real screenshots is a file drop at the same paths.

## Routing

All application routes are children of `LayoutComponent`.

| Path | Behavior |
| --- | --- |
| `/` | Lazy-loads `HomeComponent`, containing all five scroll sections |
| `/projects/:slug` | Lazy-loads `ProjectDetailComponent` |
| `/about`, `/contact` | Redirect to `/` |
| Unknown paths | Redirect to `/` |

There is no explicit `/projects` redirect because it would conflict with `/projects/:slug`. Homepage project navigation uses the `projects` fragment instead.

`app.routes.server.ts` prerenders the wildcard route plus five explicit project slugs: `pixel-quest`, `devboard`, `neonchat`, `codecraft-api`, and `starmapper`. A production build currently emits eight static routes in total.

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
│   ├── HomeComponent
│   │   ├── HeroComponent
│   │   ├── ProjectsSectionComponent
│   │   │   └── ProjectListComponent → ProjectCardComponent
│   │   ├── AboutSectionComponent
│   │   ├── SkillsSectionComponent
│   │   │   └── SkillsGridComponent → SkillChipComponent
│   │   └── ContactSectionComponent
│   └── ProjectDetailComponent
└── FooterComponent
```

`HomeComponent` is the primary smart container. It imports static data and passes typed values into presentational sections using signal inputs. Shared components are reusable display primitives. `ProjectDetailComponent` resolves its slug reactively from `ActivatedRoute.paramMap`.

`ProjectCardComponent` navigates to `/projects/:slug` through a stretched title `routerLink` (an `::after` overlay covering the card); the external Live Demo/GitHub anchors sit above the overlay. `FooterComponent` is a presentation-only shell with no inputs or data dependencies: it renders just the copyright line, because `ContactSectionComponent` is the single consumer of `SocialLinksComponent`/`socialLinksData` and the two would otherwise stack duplicate icon rows at scroll-bottom. `LayoutComponent` also owns the skip-to-content link, which jumps focus to `<main id="main-content">` manually because plain fragment hrefs resolve against `<base href="/">` and would re-route from detail pages.

The fixed background belongs to `LayoutComponent`, so it remains behind both the homepage and project-detail route. `BackgroundSceneComponent` owns the motion policy: under `prefers-reduced-motion` it draws a still frame and redraws only on scroll, and it pauses its rAF loop while `document.hidden`. The UFO is an HTML/CSS element in `HeroComponent`; it is not drawn by `SceneRenderer`. The controllable rocket remains future Phase 8 work.

## Data Flow

```text
src/app/data/*.data.ts
          ↓
HomeComponent / ProjectDetailComponent
          ↓
section components
          ↓
shared display components
```

All portfolio content is compiled from static TypeScript. There is no backend, CMS, database, or runtime content API.

## State and Services

Angular signals hold component state and computed values. RxJS is used where Angular route streams require it.

The only current singleton application service is `ScrollService`. It:

- Smooth-scrolls to homepage sections.
- Tracks the active section with `IntersectionObserver`.
- Exposes the current section as a signal for navbar styling.
- Updates the URL fragment with `history.replaceState`.
- Guards browser APIs for SSR.

SEO/meta and theme services are not currently implemented. SEO metadata remains planned deployment work; light mode is explicitly deferred.

## Rendering Strategy

The project uses Angular SSR tooling in `outputMode: "static"`. `ng build` renders configured routes at build time and writes the deployable browser output to `dist/portfolio/browser/`; no Node server is required at runtime.

Hydration uses event replay. Browser-only behavior must be guarded with `isPlatformBrowser()`, including Canvas, OffscreenCanvas workers, `IntersectionObserver`, `ResizeObserver`, animation frames, and direct `window` access.

## Background Rendering

`BackgroundSceneComponent` coordinates two fixed canvases:

1. The mountain canvas is transferred to a dedicated worker. `MountainWorkerBridge` posts resize and camera updates; `MountainRenderer` draws perspective-projected FBM terrain on an `OffscreenCanvas`. Passive scroll events forward camera state before the main-thread animation callback. Camera updates use a coalesced zero-delay worker task rather than worker `requestAnimationFrame`, avoiding measured worker-vsync scheduling stalls while retaining latest-state coalescing. The initial paint still uses worker rAF so the transferred canvas joins the browser's rendering lifecycle before presentation.
2. The transparent scene canvas remains on the main thread and draws atmosphere, horizon glow, stars, and particles using `SceneRenderer`.

Mountain painting is batched into one compound face path and two wire paths per visible terrain row. Cached sampled gradients preserve the left/right, height, and fog color variation without issuing paint commands per grid cell; behind-camera rows are skipped during projection and drawing. The component runs its animation loop outside Angular’s zone, reduces scene entity counts below 768px, and suspends the animation loop while the tab is hidden. High-DPR mountain rendering remains deferred because increasing the worker canvas pixel count would work against the current latency target.

Canvas performance diagnostics are opt-in. `?canvasPerf=benchmark` runs 120 measured mountain and scene frames on isolated canvases and logs median/p95/max timing plus missed-frame counts. `?canvasPerf=live` records scroll-sample-to-worker-start, worker draw, end-to-end, and coalesced-update metrics in ten-frame windows. Normal visits do not create metric timestamps or worker responses.

## Build and Deployment

```text
npm run build
      ↓
Angular browser/server bundles + static prerender
      ↓
dist/portfolio/browser/
      ↓
Render static-site publish directory (planned/externally configured)
```

The repository is configured to produce static output successfully. Render service settings, DNS, HTTPS, and the current external deployment state must be verified outside the repository before marking deployment complete.

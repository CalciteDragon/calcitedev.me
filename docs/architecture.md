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
│   │       │   ├── extras-section/
│   │       │   │   ├── extras-level-editor/ # Development toolbar, drafts, validation, export
│   │       │   │   ├── extras-platformer/   # Data-driven physics, rendering, editor integration
│   │       │   │   └── extra-media-screen/  # Video/gallery monitor presentation
│   │       │   └── contact-section/
│   │       └── home.component.*        # Smart single-page container
│   ├── data/                            # Static portfolio content
│   ├── models/                          # Project, Extras, bio, and social interfaces
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
    └── pixel-art/                       # Extras explorer strip plus avatar/UFO placeholders
```

Assets are served from `public/`, not `src/assets/`. All seven project visuals referenced by `projects.data.ts` are project-specific SVGs under `public/assets/images/`: Live Bingo, Pineapple Expense, Calcite Portfolio, Mochi 2026, Pixel Quest, Minecraft Hide & Seek, and the work-in-progress Roblox world. The recursive portfolio art is a finite SVG composition rather than an iframe or runtime recursion. Four web-sized Mochi competition JPEGs and five web-sized Pineapple Expense capstone JPEGs live under `public/assets/images/extras/`; the third Pineapple asset is a rendered image of the supplied project-poster PDF. `public/assets/pixel-art/extras-explorer.svg` is a 228×48 strip of six 38×48 hero-inspired player poses used by the Extras platformer.

The Extras feature also contains `extras-level-editor/` for its standalone development toolbar,
draft validation/persistence helpers, and editor tests. Canonical geometry lives in
`src/app/data/extras-level.data.ts`, with its schema in `src/app/models/extra-level.model.ts`.

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
│       ├── ExtrasSectionComponent
│       │   └── ExtrasPlatformerComponent
│       │       ├── ExtrasLevelEditorComponent (development-only)
│       │       └── ExtraMediaScreenComponent
│       └── ContactSectionComponent → SocialLinksComponent
└── FooterComponent
```

`HomeComponent` is the primary smart container. It imports static data and passes typed values into presentational sections using signal inputs. Shared components are reusable display primitives; the project showcase components are feature-local because no other route consumes them.

`ProjectsSectionComponent` owns `selectedSlug`, resolves `selectedProject` with a safe first-entry fallback, and announces selection changes. It guards viewport and focus behavior with `isPlatformBrowser()`. `ProjectFocusStageComponent` renders all projects into the same CSS grid cell; inactive articles remain in sizing calculations but are `visibility: hidden`, `aria-hidden`, `inert`, and non-interactive. This makes the focus stage as tall as its largest record and prevents swaps from moving later content. `ProjectSelectorComponent` renders the unchanged data order as real buttons with `aria-pressed` and `aria-controls`. External links live only in the active focus article, so selector buttons never contain nested interactive elements.

`ExtrasPlatformerComponent` owns a fixed 1880×820 desktop physics space, signal-backed player and responsive-layout state, requestAnimationFrame physics, platform collision, active-island state, gallery indices, current video-playing state, and reduced-motion-aware auto-advance. The player keeps a fixed 38×48 physics box while a six-frame SVG strip supplies hero-inspired idle, walk, crouch, and airborne artwork; facing mirrors only the inner sprite so the transform used for world position remains stable. The complete world scales uniformly into the available desktop width, keeping the Capstone, Keyboard, and Robotics screen-islands visible without a camera or horizontal crop. The explorer begins 58px inside the left edge of the middle Keyboard island with `activeTopicId` unset. Page-level WASD/arrow listeners move the explorer even after teleporting or clicking elsewhere on the page; editable controls are excluded, and the former pointer direction/jump controls have been removed. Arrow input alone leaves every island in standby. The first W/A/S/D press performs the keyboard-derived activation for the supporting island and dismisses the hint; subsequent landings activate normally. Clicking an inactive screen immediately teleports and activates without changing focus or dismissing that WASD hint. Active screens, collision geometry, and their visible copy rise together by 8px and deactivate only after a one-second airborne grace period. Gallery arrows sit above the inactive pane overlay; manually browsing an inactive island also teleports and activates it. Each topic's media array is its shared manual/automatic carousel order; Pineapple Expense uses the supplied IMG_1 → IMG_2 → rendered IMG_3 → IMG_4 → IMG_5 sequence, while Mochi's canonical source order is IMG_2, IMG_1, competition video, IMG_4, then IMG_3. Below a 1080px component width, the template switches to three static stacked media panes and replaces game semantics with the explorer's desktop-or-wider-window prompt. `ExtraMediaScreenComponent` supports this static presentation while continuing to create privacy-enhanced YouTube embeds only for the active topic. YouTube records may define an initial start time; the Robotics Outpost competition video begins at 3:03:36. The component records YouTube `infoDelivery` timestamps and playing state, destroys the iframe when inactive, and prefers saved progress over the initial time when reactivated. A playing video suspends the owning gallery's 5.2-second timer until playback pauses or ends. Image assets load lazily with asynchronous decoding, while records without final assets render labeled slots from `extrasData`.

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

All portfolio content is compiled from static TypeScript. There is no backend, CMS, database, or runtime content API. `Project` contains display copy, status, ordered tags, stable preview path/alt text, optional external URLs, and a `GlowColor`. `ExtraTopic` contains island labels, display copy, accent, and ordered image/YouTube media records. Neither model carries route state.

`ExtrasLevelConfig` separates level geometry from `ExtraTopic` media content. It contains the schema
version, source revision, world bounds, spawn anchor, and protected-island/supplemental-platform
element union. Rendering, teleporting, respawn, and collision consume that one canonical model.

## State and Services

Angular signals hold component state and computed values. RxJS is reserved for genuinely asynchronous streams.

`ScrollService`:

- Smooth-scrolls to homepage sections.
- Tracks the active section with `IntersectionObserver`.
- Exposes the current section as a signal for navbar styling.
- Updates the URL fragment with `history.replaceState`.
- Guards browser APIs for static rendering.

Project selection and Extras platformer/media state are feature-local and deliberately are not stored in a service or URL. SEO/meta and theme services are not currently implemented; light mode remains deferred.

The development-only level editor is the one exception to ordinary Extras state being absent from
the URL and browser storage. Angular must be in development mode and the local URL must be
`http://localhost:4200/?extrasDebug=level#extras`. Valid drafts recover from a revision-keyed
`localStorage` envelope and are ignored outside editor mode. Copy and Download serialize a complete
`extras-level.data.ts`; replacing and committing that source file is the permanent publish step.

In Edit mode, physics and pane interaction pause while the editor provides selection, scaled
dragging, 10px snapping, numeric geometry fields, keyboard nudging, undo/redo, and supplemental
platform add/duplicate/delete controls. Islands may move but retain protected identities and
dimensions; supplemental platforms may move and resize. Playtest resets the explorer to the draft
spawn and runs normal physics against draft geometry. Supplemental platforms support the explorer
without activating media, and support-aware deactivation clears the previous island after its
one-second grace period even when the explorer lands on a neutral platform. Below 1080px, the normal
stacked fallback remains active and an editor notice asks the developer to widen the section before
dragging or playtesting while preserving the draft.

## Rendering Strategy

The project uses Angular SSR tooling in `outputMode: "static"`. `ng build` renders configured routes at build time and writes the deployable browser output to `dist/portfolio/browser/`; no Node server is required at runtime.

Hydration uses event replay. Browser-only behavior must be guarded with `isPlatformBrowser()`, including Canvas, OffscreenCanvas workers, observers, animation frames, scrolling, focus, and direct `window` access.

## Background Rendering

`BackgroundSceneComponent` coordinates two fixed canvases:

1. The mountain canvas is transferred to a dedicated worker. `MountainWorkerBridge` posts resize and camera updates; `MountainRenderer` draws perspective-projected FBM terrain. Static fog is precomposed into cached face colors.
2. The transparent scene canvas remains on the main thread and draws atmosphere, horizon glow, stars, and particles with `SceneRenderer`.

The component runs its animation loop outside Angular's zone and reduces scene entity counts below 768px. `scroll-perf-metrics.ts` provides opt-in production-path measurements through `?canvasPerf=scroll`. High-DPR mountain rendering remains a Phase 9 task.

The Extras parent also tracks a manual-gallery pause signal and a pop-out topic signal. Manual previous/next navigation pauses the active 5.2-second timer until the next W/A/S/D press or an actual island-activation change; pointer arrow clicks clear their native focus highlight while keyboard activation retains focus. Each island's expand trigger activates/teleports before opening a large viewport-centered modal that reuses `ExtraMediaScreenComponent` with its carousel arrows and a close control; the global pop-out rules contain-fit 4:3 poster sources inside the stable 16:9 frame so they override the media component's default cover treatment. The page-wide scrim is released from the scroll-reveal containing block and the active Extras section is raised above later sections, while the open modal applies an overflow-only document scroll lock that preserves the existing scroll position, pauses auto-advance, and prevents a duplicate active video behind it.

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

The August 14 verification passes 164 tests and completes the production build. Current component-style warnings are documented in `docs/development.md`; none exceed the 8 kB error budget. Render service settings, DNS, HTTPS, and the external deployment state must still be verified outside the repository.

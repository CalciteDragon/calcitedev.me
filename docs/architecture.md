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
│   │   └── layout.component.ts         # Navbar + background + router outlet + page-end dissolve + footer
│   ├── shared/
│   │   ├── components/
│   │   │   ├── pixel-dissolve/         # Blue-noise block dissolve that ends the page in black
│   │   │   │                            #   dissolve-pattern.ts = noise, dissolve-field.ts = coverage + path
│   │   │   ├── section-header/
│   │   │   ├── social-links/           # Icon row, or icon + handle contact list
│   │   │   └── tech-tag/
│   │   ├── directives/
│   │   │   ├── glow.directive.ts
│   │   │   └── scroll-reveal.directive.ts
│   │   ├── types/
│   │   │   └── glow-color.type.ts
│   │   └── utils/
│   │       └── pointer-focus.ts        # Drops focus after a pointer click so no stale focus ring
│   │                                    #   lights up when the next key press flips :focus-visible on
│   ├── features/
│   │   └── home/
│   │       ├── background-scene/       # Scene renderer, mountain renderer, worker bridge,
│   │       │                            #   seeded-random.ts for a fixed star/particle layout
│   │       ├── hero/                   # Avatar, platform, gradient type, CSS/HTML UFO
│   │       ├── sections/
│   │       │   ├── about-section/
│   │       │   ├── projects-section/
│   │       │   │   ├── project-carousel-nav/ # One accent-aware carousel arrow
│   │       │   │   ├── project-focus-stage/ # Stable stacked detail panels
│   │       │   │   └── project-selector/    # Compact button-based project index
│   │       │   ├── extras-section/
│   │       │   │   ├── extras-level-editor/ # Development toolbar, drafts, validation, export
│   │       │   │   ├── extras-platformer/   # Data-driven physics, rendering, editor integration
│   │       │   │   ├── extra-media-pad/     # Analog slide-pad housing, cap, and press states
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
    ├── images/                          # Hero neon title plus seven project previews — six real captures, one SVG
    └── pixel-art/                       # Extras explorer strip plus avatar/UFO placeholders
```

Assets are served from `public/`, not `src/assets/`. `public/assets/images/hero-title.webp` is the hero headline — a 1400×467 neon-sign render of TYLER HAWTHORN with a transparent background, downscaled from the 2172×724 source and encoded to WebP at q0.92 (298 KB) because the original PNG was 2 MB and this is the LCP element. The seven project visuals referenced by `projects.data.ts` live under `public/assets/images/`. Only Calcite Portfolio remains project-specific SVG art. Six are real captures that have replaced their placeholders:

- `project-live-bingo.png` — 1368×720, an in-progress match composited on the app's own `#F8FAFC` background.
- `project-pineapple-expense.png` — 1949×1026, the capstone AWS architecture diagram lifted off its presentation slide (slide header and footer chrome cropped away) on white.
- `project-mochi-2026.jpg` — 2004×1055, a shop-floor build photo of the robot. JPEG rather than PNG because it is photographic.
- `project-roblox-pvp-world.jpg` — 1640×866, the Studio viewport of the in-progress obstacle course with the editor toolbar, tab strip, right dock, and output bar cropped away. JPEG because the render's sky gradient dithers badly in PNG (124 KB versus 827 KB for the same crop). The scene is inherently ~1.9:1 wide, so no padding recipe can satisfy both the 2.149:1 and 1.327:1 frames at once; the subject is centred and the desktop stage trims a little off each end rather than letterboxing the whole capture.
- `project-black-and-white.png` — 1924×1039, an in-game capture of It's Never Just Black and White (level `FIRST STEPS`) kept exactly as the game rendered it. PNG because the art is flat monochrome geometry with hard chromatic-aberration edges, which JPEG smears. Like the Roblox capture it is ~1.85:1 rather than a padded 1.9:1: the frame is edge-to-edge gameplay with no background margin to pad, so the 1.327:1 desktop stage trims each end and the top-left `FIRST STEPS / 0:13.01` HUD is visible only in the wider selector and stacked frames. The near-black ground blends into `--bg-primary`, so the trim is not noticeable.
- `project-hide-and-seek.jpg` — 1448×1086, a rendered library scene of a hider and two seekers. JPEG for the same reason as the Mochi photo: the render's lantern glow, vignette, and soft shadows are continuous-tone, and PNG could not get the same pixels under 1.6 MB (306 KB at quality 90). The source was a 16:9 render letterboxed into a 4:3 canvas with hard 135 px black bars; those bars were replaced with `--bg-primary` (`#0b0f1a`) rather than cropped away, which turns baked letterboxing into the padding the crop recipe below wants. The 1448×816 content region is 1.775:1 and the padded canvas is 1.333:1, which is close to an exact fit for every frame the asset lands in: the desktop stage image measures 698×523 (1.333:1) so it shows the render whole with the padding filling the gap invisibly, the stacked stage at 390 wide measures 340×190 (1.787:1) so it crops to almost exactly the content region, and the 2.133:1 desktop thumbnail crops the padding away entirely. Only the square 112×112 mobile thumbnail keeps the padding in frame, which is the case the `--bg-primary` fill exists for.

All six are close to **1.9:1** or padded toward it, and that ratio is deliberate. Each asset is `object-fit: cover`-ed into three differently shaped frames — a 2.149:1 selector thumbnail, a 1.327:1 desktop focus stage (the `lg` rule drops `aspect-ratio` to `auto` so the pane matches the text column), and a 16:9 stacked stage. A 1.9:1 canvas sits between those extremes, and the subject is inset to the intersection of all three crop windows, so every breakpoint trims padding rather than content. Canvas size is chosen so the subject draws at roughly 2× the largest rendered size, keeping it sharp on HiDPI screens.

Two padding strategies are in use, depending on the source:

- **Flat-background sources** (Live Bingo, Pineapple Expense) pad with the source's own background colour, so the padding is invisible in every frame.
- **Photographic sources** (Mochi 2026) pad with `--bg-primary` (`#0b0f1a`), the colour the focus stage already paints behind images. The photo band is cut to exactly 1.327:1 so the desktop stage renders it edge to edge with no padding visible; the narrower frames reveal side padding that blends into the card surface. This is what lets a portrait phone photo keep useful height instead of being reduced to a thin strip.

Future screenshots replacing the remaining placeholders should follow whichever recipe matches the source. The recursive portfolio art is a real 1912×945 screenshot of this Projects section captured while the Calcite Portfolio tile was selected, so the nesting is three levels of genuine page — not an iframe or runtime recursion. Four web-sized Mochi competition JPEGs and five web-sized Pineapple Expense capstone JPEGs live under `public/assets/images/extras/`; the third Pineapple asset is a rendered image of the supplied project-poster PDF. `public/assets/pixel-art/extras-explorer.svg` is a 228×48 strip of six 38×48 hero-inspired player poses used by the Extras platformer.

The Extras feature also contains `extras-level-editor/` for its standalone development toolbar,
draft validation/persistence helpers, and editor tests. Canonical geometry lives in
`src/app/data/extras-level.data.ts`, with its schema in `src/app/models/extra-level.model.ts`.

`extra-media-pad/` is a presentation-only leaf split out of the platformer so that stylesheet
stays clear of the 8 kB `anyComponentStyle` error budget. The platformer still derives pad
geometry from island layout in its `mediaPads()` computed and keeps `position`/`z-index` on the
pad host; the child owns the housing, cap, `--pad-lift`/`--pad-travel`/`--pad-stem` custom
properties, accent cascade, and its own reduced-motion rules. Clicks route back out through a
`pressRequested` output, and the child's `--pad-travel` must stay in sync with
`MEDIA_PAD_PRESS_DEPTH` in the platformer, which sinks the explorer by the same amount.

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
│       │   ├── ProjectFocusStageComponent → TechTagComponent, ProjectCarouselNavComponent
│       │   └── ProjectSelectorComponent
│       ├── ExtrasSectionComponent
│       │   └── ExtrasPlatformerComponent
│       │       ├── ExtrasLevelEditorComponent (development-only)
│       │       └── ExtraMediaScreenComponent
│       └── ContactSectionComponent → SocialLinksComponent (list layout)
├── PixelDissolveComponent
└── FooterComponent
```

`HomeComponent` is the primary smart container. It imports static data and passes typed values into presentational sections using signal inputs. Shared components are reusable display primitives; the project showcase components are feature-local because no other route consumes them.

`ProjectsSectionComponent` owns `selectedSlug`, resolves `selectedProject` with a safe first-entry fallback, and announces selection changes. It guards viewport and focus behavior with `isPlatformBrowser()`. `ProjectFocusStageComponent` renders all projects into the same CSS grid cell; inactive articles remain in sizing calculations but are `visibility: hidden`, `aria-hidden`, `inert`, and non-interactive. This makes the focus stage as tall as its largest record and prevents swaps from moving later content. The stage wraps those articles in a `__panes` grid cell and places two `ProjectCarouselNavComponent` instances outside it through named grid areas, so the arrows are siblings of the pane rather than children of any article. Because a sibling cannot inherit the `--project-accent` custom property declared on `.project-focus--{color}`, the stage passes the selected project's `glowColor` down as an `accent` input and the nav re-declares the accent itself. The stage derives the wrapping previous/next targets with computed signals and emits the chosen slug through a `projectStepped` output; `ProjectsSectionComponent.stepProject()` forwards it into the same `selectProject()` path with `focusDetails: false`, so state stays in one place and arrows do not steal focus from themselves. `ProjectSelectorComponent` renders the unchanged data order as real buttons with `aria-pressed` and `aria-controls`. External links live only in the active focus article, so selector buttons never contain nested interactive elements.

`ExtrasPlatformerComponent` owns a fixed 1880×820 desktop physics space, signal-backed player and responsive-layout state, requestAnimationFrame physics, platform collision, active-island state, gallery indices, and slide-pad press state. Galleries never advance on their own: every slide change comes from a cursor arrow, a pop-out arrow, or the explorer landing on a slide pad. The player keeps a fixed 38×48 physics box while a six-frame SVG strip supplies hero-inspired idle, walk, crouch, and airborne artwork; facing mirrors only the inner sprite so the transform used for world position remains stable. The complete world scales uniformly into the available desktop width, keeping the Capstone, Keyboard, and Robotics screen-islands visible without a camera or horizontal crop. The explorer begins 58px inside the left edge of the middle Keyboard island with `activeTopicId` unset. Page-level WASD/arrow listeners move the explorer even after teleporting or clicking elsewhere on the page; editable controls are excluded, and the former pointer direction/jump controls have been removed. Arrow input alone leaves every island in standby. The first W/A/S/D press performs the keyboard-derived activation for the supporting island and dismisses the hint; subsequent landings activate normally. Clicking an inactive screen immediately teleports and activates without changing focus or dismissing that WASD hint. Active screens, collision geometry, and their visible copy rise together by 8px and deactivate only after a one-second airborne grace period. Gallery arrows sit above the inactive pane overlay; manually browsing an inactive island also teleports and activates it.

Islands whose topic holds more than one slide also carry a pair of analog previous/next pushbuttons, derived by `mediaPads()` from island geometry rather than stored in `extras-level.data.ts`, so the level editor never manages them. Each 76×26 pad is centred over its island with a 48px gap between the pair, and its base sits flush on the island's top collision edge. `collisionTargets()` concatenates the level elements with the pads, so pads are ordinary one-way top-collision surfaces: the explorer walks through them horizontally and can only land from above. Landing is edge-triggered against `supportingElementId`, so a pad advances exactly one slide per landing and never repeats while the explorer rests on it. A rested-on pad reports a 7px deeper `platformTop()`, which sinks the explorer with the cap; the deactivation guard resolves support through `collisionTargets()` so a pad counts as its own island's support. Pointer clicks reuse the gallery-arrow path and depress the cap for 180ms. Each topic's media array is its shared carousel order; Pineapple Expense uses the supplied IMG_1 → IMG_2 → rendered IMG_3 → IMG_4 → IMG_5 sequence, while Mochi's canonical source order is IMG_2, IMG_1, competition video, IMG_4, then IMG_3. Below a 1080px component width, the template switches to three static stacked media panes and replaces game semantics with the explorer's desktop-or-wider-window prompt. `ExtraMediaScreenComponent` supports this static presentation while continuing to create privacy-enhanced YouTube embeds only for the active topic. YouTube records may define an initial start time; the Robotics Outpost competition video begins at 3:03:36. The component records YouTube `infoDelivery` timestamps, destroys the iframe when inactive, and prefers saved progress over the initial time when reactivated. Image assets load lazily with asynchronous decoding, while records without final assets render labeled slots from `extrasData`.

`bioData.about` stores the About introduction and four history entries as typed text segments. Intro segments can select cyan or pink; history segments carry semantic emphasis while their parent entry supplies the single stage color. `AboutSectionComponent` coalesces passive scroll measurements into animation frames and applies frame-rate-independent damping to card tilt and continuous rail progress. The rail is measured from the first number's center to the last number's center; the active chapter follows the closest numbered stop. In development, `?aboutDebug=scroll` exposes a read-only tuning HUD.

`FooterComponent` is a presentation-only shell with no inputs or data dependencies. `ContactSectionComponent` is the single consumer of `SocialLinksComponent` and `socialLinksData`, avoiding duplicate social rows at scroll-bottom. It prepends a synthetic `email` channel (a `mailto:` `SocialLink` built from `bioData.email`) to `socialLinksData` and renders the combined list through `SocialLinksComponent` in `list` layout, so email and the socials read as one set of handles rather than a CTA plus an icon row. `LayoutComponent` owns the skip-to-content link and manually focuses `<main id="main-content">` so it behaves consistently after redirects.

`PixelDissolveComponent` sits between `<main>` and `FooterComponent`, pulled up over the end of the content with a negative margin so the disintegration starts just above the last contact card. `FooterComponent` follows it on a solid black ground, which is where the copyright now lives.

The dissolve splits into two modules. `dissolve-pattern.ts` builds the blue-noise threshold tile once at module load — a 32x6 void-and-cluster ordering, toroidal so it tiles seamlessly at any width. `dissolve-field.ts` owns the coverage field, `dissolveCoverage(tx, ty)`, which accelerates non-linearly downward and runs ahead of itself toward the page edges, plus `buildDissolvePath()`, which walks the block grid and emits one SVG path.

Coverage varying in two dimensions is why the component measures the viewport rather than staying purely declarative: an SVG `<pattern>` tiles uniformly and can only shade by row, and the alternatives that keep a fluid width — percentage-width columns, or an `objectBoundingBox` clip-path along the iso-coverage curve — both cut blocks mid-edge and lose the square-pixel look. The grid is therefore laid out against the measured pixel width, via `afterNextRender` plus a debounced `ResizeObserver` writing a signal (the app is zoneless, so the signal write drives change detection on its own). Runs of adjacent black blocks merge into single rectangles, which roughly halves both the path string and the rasteriser's work.

The SVG carries no `viewBox`, so one user unit stays one CSS pixel and blocks keep a constant 10px size at every viewport width. Before the width is known — which is exactly the server-side render's state — the path is empty, so the prerendered markup carries no grid and the effect draws on hydration. It is `aria-hidden` and `pointer-events: none`, so the content it overlaps stays readable to assistive tech and clickable with a mouse. Nothing animates, so `prefers-reduced-motion` needs no special case.

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

The Extras parent also tracks a pop-out topic signal. Pointer arrow clicks clear their native focus highlight while keyboard activation retains focus. Each island's expand trigger activates/teleports before opening a large viewport-centered modal that reuses `ExtraMediaScreenComponent` with its carousel arrows and a close control; the global pop-out rules contain-fit 4:3 poster sources inside the stable 16:9 frame so they override the media component's default cover treatment. The page-wide scrim is released from the scroll-reveal containing block and the active Extras section is raised above later sections, while the open modal applies an overflow-only document scroll lock that preserves the existing scroll position and prevents a duplicate active video behind it.

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

The August 18 verification passes 192 tests and completes the production build. Current component-style warnings are documented in `docs/development.md`; none exceed the 8 kB error budget, and the Extras platformer stylesheet regained roughly 1.4 kB of headroom once the slide pad moved into `extra-media-pad/`. Render service settings, DNS, HTTPS, and the external deployment state must still be verified outside the repository.

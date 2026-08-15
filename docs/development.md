# Development Plan

## Principles

- **Dependency-aware ordering.** Each phase builds on the last — no phase starts until its dependencies are solid.
- **Vertical slices when possible.** Get something visible and working early, then layer in complexity.
- **Placeholder-first for assets.** All pixel art, images, and project screenshots use styled placeholders. Tyler creates art in parallel; swapping in is a file drop, not a code change.
- **Easter eggs are last.** The core site works cleanly without them — they're layered on top, never load-bearing.

## Current Status Audit — August 13, 2026

- Phases 0–6 are functionally implemented. Projects now use a single-page focus stage and selector; the former project-detail routes were removed.
- The August 13 Projects overhaul replaced four filler records with six real/current entries alongside Pixel Quest: Live Bingo, Pineapple Expense, Calcite Portfolio, Mochi 2026, Minecraft Hide & Seek, and an in-progress Roblox PvP world. Primary-source repository research informed the copy and original themed SVG previews. Pixel Quest and Hide & Seek later received denser scene-driven redraws: a co-op neon dungeon run and an isometric voxel hunt with role, cover, and power-up storytelling. A stable stacked focus stage, compact button index, accessible selection announcement, responsive viewport return, and reduced-motion behavior were visually validated at 1440×1000 and 390×844.
- The project display order now leads with Live Bingo, Pineapple Expense, Calcite Portfolio, and Mochi 2026; Pixel Quest and the remaining builds follow. Each project-index card owns an individual scroll reveal while retaining its independent hover/press transform.
- The former Skills grid has been replaced by an open Extras platformer covering the Pineapple Expense capstone presentation, custom keyboard build, and Mochi 2026 robotics competition in that order. Three broad scanline monitors live directly over the site background and double as collision islands. The full 1880×820 level scales into the available desktop width with no camera, horizontal cutoff, or side scrolling; smaller widths switch to readable vertically stacked panes and an explorer prompt to try desktop or widen the window. The explorer starts near the left edge of the middle Keyboard island while every screen remains in standby; arrows can move immediately, while the first W/A/S/D press activates the supporting island and removes the hint. Pointer teleport activates an island even before that first keypress while preserving the `try WASD` prompt. Page-level input, focus-independent click-to-teleport screens, synchronized 8px monitor/copy/collision lift, one-second deactivation grace period, timestamp-resuming YouTube playback, always-hoverable gallery arrows that browse and teleport inactive islands, playing-video-aware automatic galleries, and reduced-motion behavior are implemented. Pineapple Expense follows the supplied IMG_1 → IMG_2 → rendered IMG_3 → IMG_4 → IMG_5 image order, while Robotics Outpost follows IMG_2 → IMG_1 → competition video → IMG_4 → IMG_3; the video begins at 3:03:36 on its first play. The former on-screen direction/jump controls have been removed.
- Manual gallery navigation now pauses auto-advance until the next W/A/S/D press or island activation change. Each island also has an expand control that activates/teleports and opens a large viewport-centered pop-out with a stable 16:9 media frame and contain-fitting so every carousel image remains visible without resizing the window; the page-wide scrim dims the rest of the site, an overflow-only document lock keeps page scrolling disabled without changing the current scroll position, the pop-out keeps a softened scanline texture, the cyan outline and close control use a lower-opacity treatment, pointer arrow clicks release focus without affecting keyboard focus, and the open pop-out pauses auto-advance.
- The About section now follows the hero and presents Tyler's supplied copy as a compiler-themed origin story: a larger intro card, production-command heading, and four-stage cyan → blue → violet → pink timeline. Passive rAF-coalesced scroll measurement keeps exactly one chapter active while frame-rate-independent damping smooths card tilt and rail progress; the rail glow runs from -6.8% to 64.9% through the About section, independent of total page length and the section's document position. Its endpoints and color stops align to the numbered nodes, and number activation follows the same smoothed rail head. A development-only `?aboutDebug=scroll` HUD exposes live tuning values, and only the intro card uses scroll reveal. The content remains typed static data, and desktop/tablet/mobile renders were visually checked against the running site.
- The `visual-and-ux-improvements` branch was reviewed and its eight commits cherry-picked into `layout-and-design-tweaks`: content-section min-height removal (hero-only `--full` modifier), footer `SocialLinksComponent` reuse, 3-column grid cap + popular-tag filter pruning, About card panel, project-detail card redesign with related projects, dynamic page titles via the Title service, and two cleanup commits. Its 1,343-line plan document was intentionally not ported — the work it planned is complete and recorded here.
- The July 2026 polish pass added the original project-thumbnail treatment, hero UFO repositioning, mobile-local hero gradients, a global `:focus-visible` ring, skip-to-content link, drawer body-scroll lock with md auto-close, press-state compression, canvas reduced-motion still-frame + hidden-tab rAF pause, static head metadata, and a pixel-C SVG favicon. Its card routing/filter UI was superseded by the August 13 project showcase.
- Phase 7 is now mostly complete: project focus/selector transitions, section scroll reveals, active navbar state, smooth scrolling, CSS reduced-motion fallbacks, button micro-interactions, gradient rendering across breakpoints, and a canvas reduced-motion policy. Optional pointer-following card tilt remains open.
- Phase 9 has partial foundations: lazy routes, lazy project images, semantic section structure, reduced mobile scene entity counts, skip link, hidden-tab canvas suspension, and baseline SEO metadata.
- Static output is configured and verified: 163 tests pass and a production build prerenders four routes. The Extras gallery pause/resume and pop-out flows were also checked in the running desktop and narrow responsive layouts.
- The Angular development server uses one-second file polling with full-page live reload, avoiding stale Windows watcher sessions and unreliable component-style HMR updates during `npm start`.
- The July 16 mountain-performance audit restored the original worker-rAF renderer, added opt-in real-scroll metrics (`?canvasPerf=scroll`), and tested scheduling, path reuse, projection-loop, and fog candidates independently. Only static fog precomposition was retained: three standard scroll traces reduced worker-draw cadence p95 from roughly 30–33 ms to 22–25 ms, end-to-end p95 from 19.8–21.4 ms to 18.1–19.8 ms, and draw median from 5.5–5.7 ms to 5.2–5.4 ms. Immediate worker tasks, repeated-path reuse, and projection-loop changes were discarded because they did not improve real scroll cadence consistently.
- Known repository gaps: the hero (7.39 kB), About (7.75 kB), project focus (6.59 kB), project selector (4.88 kB), and Extras platformer (7.65 kB) stylesheets exceed the 4 kB warning budget but remain below the 8 kB error limit; the simplified Extras media-screen and separate level-editor stylesheets remain below the warning budget. Mountain DPR scaling, the broader responsive/accessibility audits, an og:image asset, and external deployment verification remain open.

- A development-only Extras level editor now opens at `http://localhost:4200/?extrasDebug=level#extras`. The committed `extras-level.data.ts` is the single geometry source; revision-keyed `localStorage` recovers drafts, while Copy/Download produces the source file that must be committed to publish. Edit mode moves protected islands and adds/moves/resizes/duplicates/deletes supplemental ledges with numeric controls, snapping, and history. Playtest runs the draft through normal physics. Neutral ledges do not activate media and no longer keep a previous island active after its grace period. Narrow widths retain the stacked fallback and show an editor-specific widening notice.

---

## Dependency Graph

```
Phase 0: Scaffold & Global Styles
    │
    ├──→ Phase 1: Layout Shell (navbar, footer, routing)
    │        │
    │        ├──→ Phase 2: Shared Components (cards, buttons, chips, directives)
    │        │        │
    │        │        │    Phase 3: Data Layer (models, static data, placeholders)
    │        │        │        │        ← can run in parallel with Phase 2
    │        │        │        │
    │        │        ├────────┤
    │        │        ↓        ↓
    │        │   Phase 4: Home Page — Hero + Single-Page Layout
    │        │        │
    │        │        ├──→ Phase 5: Home Page — Background Scene (canvas)
    │        │        │
    │        ├──→ Phase 6: Content Pages (About, Projects, Contact)
    │        │                    ← can run in parallel with Phase 5
    │        │
    │        ↓
    │   Phase 7: Interactivity & Polish
    │        │
    │        ├──→ Phase 8: Easter Eggs & Sound
    │        │
    │        ↓
    │   Phase 9: Responsive, A11y & Performance
    │        │
    │        ↓
    │   Phase 10: Deployment (Render + calcitedev.me)
    │        │
    │        ↓
    │   Phase 11: Asset Swap & Final QA
```

---

## Phase 0: Project Scaffold & Global Styles

**Goal:** Angular project initialized with the full global style foundation. Everything downstream imports from here.

**Dependencies:** None

**Tasks:**
- [x] Angular scaffold upgraded to Angular 21, standalone, SCSS, SSR tooling, routing
- [x] Configure `tsconfig.json` strict mode
- [x] Set up global SCSS partials:
  - `_variables.scss` — full color palette, spacing scale (8px), breakpoints, glow presets
  - `_reset.scss` — CSS reset/normalize
  - `_typography.scss` — font stacks for Space Grotesk, Inter, JetBrains Mono, and Press Start 2P; final font loading/self-hosting remains Phase 9 work
  - `_mixins.scss` — responsive breakpoint mixins, glow mixin
  - `_glow.scss` — neon box-shadow presets per accent color
  - `_animations.scss` — shared keyframes (fadeIn, slideUp, glow pulse)
  - `styles.scss` — imports all partials, sets `:root` CSS custom properties
- [x] Create folder skeleton: `core/`, `layout/`, `shared/`, `features/`, `models/`, `data/`, `assets/pixel-art/`, `assets/images/`, `assets/icons/`
- [x] Verify `ng serve` runs clean

**Deliverable:** App compiles and shows a blank page with correct fonts and CSS variables applied.

---

## Phase 1: Layout Shell

**Goal:** The persistent app shell — navbar, footer, and routed content area. Every page is reachable.

**Dependencies:** Phase 0

**Tasks:**
- [x] `LayoutComponent` — wraps `<app-navbar>` + `<router-outlet>` + `<app-footer>`
- [x] `NavbarComponent`:
  - Fixed position, semi-transparent `#0B0F1A` background, `backdrop-filter: blur(12px)`
  - Logo/brand text on the left (placeholder pixel icon)
  - Nav links: About, Projects, Extras, Contact — rendered as `<button>` elements that scroll to the matching section (not `<a>` router links); active state driven by `ScrollService.activeSection` signal
  - Hover state: glow + color shift
  - Mobile: hamburger toggle → slide-in drawer
- [x] `FooterComponent`:
  - Copyright line, centered — the footer's only content
  - [x] Social icons removed from the footer: it renders directly under the Contact section at scroll-bottom, so both rendering `SocialLinksComponent` showed two duplicate icon rows on one screen. `ContactSectionComponent` is now the sole consumer of `socialLinksData`, and `FooterComponent` is a data-free shell. (Supersedes the earlier port of `SocialLinksComponent` into the footer from `visual-and-ux-improvements`.)
- [x] `app.routes.ts` — Home lazy-loads; `/about`, `/projects`, and `/contact` redirect to `/`; wildcard redirects to `/`
- [x] Stub feature components (empty shell for Home, About, Projects, Contact) so routing works — stubs for About, Projects, Contact later removed in single-page refactor

**Deliverable:** App shell renders. Navbar and footer appear on every route.

---

## Phase 2: Shared Components & Directives ✅ COMPLETE

**Goal:** The reusable building blocks. These are stateless, input-driven, and visually polished.

**Dependencies:** Phase 0 (global styles)

**Parallel with:** Phase 3

**Tasks:**
- [x] `SectionHeaderComponent` — gradient text heading with optional subtitle
- [x] `ExtraMediaScreenComponent` — feature-local rounded monitor for privacy-enhanced, timestamp-resuming video and image gallery records
- [x] `TechTagComponent` — compact project technology tag
- [x] `SocialLinksComponent` — typed social-link row with platform-specific presentation
- [x] `ProjectFocusStageComponent` and `ProjectSelectorComponent` — feature-local project focus/index presentation; supersede and remove the former shared `CardComponent`/`ProjectCardComponent`
- [x] `ScrollRevealDirective` — CSS scroll-driven animation via `animation-timeline: view()`, adds `.scroll-reveal` class when on a browser platform; the CSS handles all animation logic, including the `min()` caps that keep tall subjects from stretching the reveal (see `docs/design.md` → Scroll Reveal Range)
- [x] `GlowDirective` — configurable neon glow behavior

**Deliverable:** A mini component library. Can be visually tested in isolation on a scratch route or via `ng serve` on the home page.

---

## Phase 3: Data Layer

**Goal:** All content defined as typed, static TypeScript. Placeholder images created.

**Dependencies:** Phase 0

**Parallel with:** Phase 2

**Tasks:**
- [x] `project.model.ts` — readonly `Project` display contract (title, slug, eyebrow, status, descriptions, tags, image/alt, optional links, glow color); route/filter fields removed
- [x] `extra.model.ts` — typed Extras topic and mixed image/YouTube media records
- [x] `social-link.model.ts` — `SocialLink` interface (platform, url, icon, glowColor)
- [x] `projects.data.ts` — seven ordered real/current projects with researched descriptions, truthful team/contribution language, links, keywords, and stable preview paths
- [x] `extras.data.ts` — capstone, keyboard, and robotics topics; Capstone exposes the five supplied images in numeric filename order with the PDF rendered to an image, keyboard and robotics use supplied YouTube videos, including the robotics video's 3:03:36 initial timestamp, and Robotics exposes the four supplied competition photos in their requested order
- [x] `bio.data.ts` — typed identity fields plus structured About intro/history copy with emphasis, links, and side-note metadata
- [x] `social-links.data.ts` — GitHub, Discord, and LinkedIn entries
- [x] Seven original themed SVG previews under `public/assets/images/`, including polished scene-driven redraws for Pixel Quest and Minecraft Hide & Seek
- [x] Current pixel-art placeholders for the avatar and UFO live under `public/assets/pixel-art/`; the rocket and card-icon assets were removed with their corresponding UI

**Deliverable:** `import { projectsData } from './data/projects.data'` works everywhere. Placeholder visuals exist for every slot.

---

## Phase 4: Home Page — Hero + Single-Page Layout ✅ COMPLETE

**Goal:** Build the landing hero and establish the full single-page section layout before adding the canvas background.

**Dependencies:** Phase 1 (layout/routing), Phase 2 (shared UI), Phase 3 (data)

**Tasks:**
- [x] `HeroComponent`:
  - Pixel-art avatar placeholder (left side desktop, top on mobile), floating `avatar-float` animation
  - Sci-fi glowing platform below avatar (CSS `::before`/`::after` 3D depth effect)
  - "TYLER HAWTHORN" / "AKA CALCITE" / subtitle — all use cyan→pink `background-attachment: fixed` gradient via `background-clip: text`
  - HTML/CSS UFO (`hero__ufo`) with `ufo-float` keyframe + scroll-driven parallax (drifts 140vh over 200vh scroll)
  - CSS tractor beam (`hero__ufo-beam`) — gradient cone beneath the disc
  - Scroll indicator — 3 staggered pink chevrons that fade out at 150px scroll
  - ~~"HEY, I'M" pre-heading~~ — removed in layout-and-design-tweaks
  - ~~"Code · Create · Innovate" tagline~~ — removed in layout-and-design-tweaks
  - ~~"View My Work" CTA button~~ — removed in layout-and-design-tweaks
- [x] `HomeComponent` — smart container; orchestrates Hero + all scroll sections; solid dark background (canvas comes next)
- [x] Single-page refactor: `ProjectsSectionComponent`, `AboutSectionComponent`, `ExtrasSectionComponent`, and `ContactSectionComponent` live at `features/home/sections/`; old route stubs and the superseded Skills section were removed; `ScrollService` tracks the current section and the navbar uses scroll buttons

**Built:** `HeroComponent` (presentational, `bio` signal input), `HomeComponent` (smart container, reads `bioData`, hosts all sections). Canvas background deferred to Phase 5. `FeatureCardsComponent` was built then removed — it duplicated the navbar and added no value.

**Updated in layout-and-design-tweaks:** `HeroComponent` redesigned — removed pre-heading, tagline, CTA; added platform, CSS UFO + beam, scroll indicator; all text switched to fixed-attachment cyan→pink gradient.

**Deliverable:** Full single-page scroll layout with the redesigned hero and all five sections present and scrollable. The former feature-card strip is intentionally absent.

---

## Phase 5: Home Page — Background Scene (Canvas)

**Goal:** The animated, interactive canvas behind the hero section.

**Dependencies:** Phase 4 (home page structure to layer behind)

**Tasks:**
- [x] `BackgroundSceneComponent` — full-viewport `<canvas>` element positioned behind hero content
- [x] `isPlatformBrowser` guard — skip canvas init during SSR/prerender
- [x] **Star field:** sparse pixel-style stars, subtle twinkle animation, random placement
- [x] **Cyber mountains:** perspective-projected FBM terrain with filled faces, wire passes, fog, and scroll-driven camera movement
- [x] **Parallax:** mountains and elements shift based on scroll position
- [x] **UFO:** implemented as an HTML/CSS hero element with floating motion, parallax, and a tractor beam; removed from the canvas renderer
- [ ] **Rocket:** removed from the initial scene renderer and deferred to Phase 8 as a controllable Easter egg
- [x] **Floating particles:** minimal pixel particles drifting (very subtle)
- [x] **Faint scanline/grid overlay:** CSS pseudo-element on the page background (very low opacity)
- [x] Performance: use `requestAnimationFrame`, reduce on mobile
- [x] Performance: the scene rAF loop pauses on `visibilitychange` while the tab is hidden and resumes on return

**Built:** Two-canvas architecture inside `BackgroundSceneComponent` — **mountain canvas** (DOM-order first, bottom layer) transferred to `MountainRenderer` inside `mountain.worker.ts` through `MountainWorkerBridge`; **scene canvas** (DOM-order second, top layer, transparent background) owned by `SceneRenderer` on the main thread. Both canvases fill the fixed host. `body { background-color: transparent }` lets the canvases show through all sections. A CSS `::after` scanline overlay covers both canvases.

**MountainRenderer** (`mountain-renderer.ts`, `mountain.config.ts`): 3D perspective-projected FBM terrain. It draws the terrain grid back-to-front with face and wire passes; the static fog blend is precomposed into cached face colors, eliminating a second face fill on every scrolling frame. `setConfig()` rebuilds the terrain only when structural parameters change. `camY = scrollY / 1200 - camYOffset` drives scroll parallax. `BackgroundSceneComponent` sends fire-and-forget camera and resize messages through `MountainWorkerBridge`; the worker retains its original rAF loop and only redraws when dirty, leaving the main thread with minimal mountain work.

**SceneRenderer** (`scene-renderer.ts`): draws on transparent canvas. Render order each frame: `drawAtmosphere` (linear gradient haze) → `drawHorizonGlow` (neon bloom band) → `drawStars` → `drawParticles`. `drawFrame(timestamp, scrollY)` — no `heroHeight` param.

**Stars** concentrated in upper 85% of canvas; radius 0.4–2.5px; opacity 0.2–0.8; large stars (radius > 1.8) rendered with cross-sparkle arms. Star count: 130 full / 65 reduced.

**Updated in layout-and-design-tweaks:** UFO and Rocket removed from `SceneRenderer` entirely — `UFO`/`Rocket` interfaces, `createUFO()`/`createRocket()` factories, `drawUFO()`/`drawRocket()` methods, and the `heroHeight` hero-visibility gate all deleted. The UFO moved to `HeroComponent` as a CSS/HTML element. The rocket is deferred to Phase 8 (Easter Eggs).

Note: DPR scaling not applied to `MountainRenderer.resize()` — deferred to Phase 9 performance work.

**Deliverable:** Hero section has a fully animated cyberpunk background. Looks alive and layered.

---

## Phase 6: Content Sections ✅ COMPLETE

**Goal:** About, Projects, Extras, and Contact sections — fully functional with real content structure. All sections live inside `HomeComponent` at `features/home/sections/`.

**Dependencies:** Phase 1 (layout), Phase 2 (shared components), Phase 3 (data)

**Parallel with:** Phase 5

**Tasks:**

### About Section (`features/home/sections/about-section/`)
- [x] Full five-paragraph bio stored as typed text segments in `bioData`
- [x] Larger intro card followed by a compiler-themed four-stage history timeline
- [x] Single-accent cyan → blue → violet → pink chapters with contextual links and inline FIRST side note
- [x] Continuous scroll-driven active chapter, damped card tilt and rail fill/head mapped to the -6.8%–64.9% About-section window, number-aligned rail geometry/color stops, an intentional clean stop at node 04 with no lower tail, and a URL-gated development tuning HUD
- [x] Scroll reveal retained on the intro card and removed from the history heading/chapters
- [x] Responsive terminal command and readable desktop/tablet/mobile chapter layouts

### Extras Section (`features/home/sections/extras-section/`)
- [x] Replaced the grouped Skills grid, data, model, and chip components; project tags/descriptions now carry the résumé-style skills signal
- [x] `ExtrasPlatformerComponent` — open 1880×820 DOM/CSS desktop world with three broad screen-islands, collision physics, respawn, uniform fit-to-width scaling, and no horizontal camera/crop
- [x] Page-level WASD/arrow controls that remain active after teleporting or clicking elsewhere, plus focus-independent full-island click-to-teleport activation that preserves the onboarding hint until WASD is used; no on-screen direction/jump controls or destination navigation bar
- [x] Active screens and their label/title/description copy rise 8px with matching collision surfaces and wait one second after the explorer leaves before deactivating
- [x] Start the explorer near the left edge of the middle Keyboard island with all screens in standby; the first WASD keypress removes the subtle `try WASD` bubble and activates the supporting platform, while arrow-only movement does not perform this keyboard-derived activation
- [x] Below 1080px component width, replace platformer semantics and controls with three vertically stacked media panes plus the explorer prompt `Try this on desktop — or make your window wider.`
- [x] `ExtraMediaScreenComponent` — rounded scanline monitors with visual active/standby states, privacy-enhanced muted YouTube playback that resumes from its last reported timestamp, image states, lazy asynchronous image loading, and arrow-only overlay controls that keep their hover state and browse/teleport behavior above inactive pane overlays; Pineapple follows IMG_1 → IMG_2 → rendered IMG_3 → IMG_4 → IMG_5, Mochi follows IMG_2 → IMG_1 → video → IMG_4 → IMG_3; redundant header/status and footer caption/counter chrome is removed
- [x] 5.2-second gallery advance only while the topic is active and its current YouTube video is not playing; auto-advance and decorative loops stop under reduced motion
- [x] Manual gallery navigation pauses auto-advance until the next W/A/S/D press or island activation change; island expand controls open centered media pop-outs with carousel arrows and a top-right close button, pausing auto-advance while open
- [x] Replace the Robotics Outpost video slot with the supplied YouTube competition video and start its first autoplay at 3:03:36
- [x] Replace the Robotics Outpost photo slots with the four supplied competition photos in their requested order, including a pane-ratio crop of the portrait image
- [x] Replace labeled Capstone Summit photo slots with the supplied Pineapple Expense presentation photos, rendering the supplied PDF to the third carousel image

- [x] Canonical `ExtrasLevelConfig` in `extras-level.data.ts` drives world bounds, spawn, island rendering, supplemental ledges, teleporting, respawn, and collision without duplicated geometry
- [x] Development-only `?extrasDebug=level#extras` editor with Edit/Playtest modes, accessible selection and numeric inspection, scaled dragging, 10px snapping, keyboard nudging, undo/redo, and protected island identity/dimensions
- [x] Supplemental jump-platform creation, movement, resizing, duplication, deletion, and one-way collision; neutral support allows the previously active island to deactivate after its one-second grace period
- [x] Revision-keyed local draft recovery, reset-to-committed behavior, and copy/download publishing of a complete `extras-level.data.ts` source file
- [x] Below 1080px, preserve the normal stacked panes and draft while showing that dragging and Playtest require a wider section
- [x] Geometry-resilient editor/platformer tests derive element counts, generated IDs, spawn positions, and teleport positions from the canonical config; collision coverage uses an isolated fixture so ordinary platform additions, removals, and repositioning do not require test rewrites

### Projects Section (`features/home/sections/projects-section/`)
- [x] `ProjectFocusStageComponent` — all focus panels share one grid cell; inactive content remains in sizing but is inert/hidden, preventing layout shift
- [x] `ProjectSelectorComponent` — 4-column desktop, 2-column tablet, compact horizontal mobile buttons with pressed/active state and preview keywords
- [x] Selection remains local to the section, crossfades the active focus panel, announces the change, and returns an offscreen stage beneath the navbar
- [x] Former filter bar, shared project cards, `/projects/:slug` detail component, parameterized routes, and prerender slug list removed

### Contact Section (`features/home/sections/contact-section/`)
- [x] Email link (styled as a prominent CTA or card)
- [x] `SocialLinksComponent` reuse — GitHub, Discord, and LinkedIn with glow hover
- [x] Clean, minimal layout — no form

**Built:** `BackgroundSceneComponent` lives in `LayoutComponent`. `HomeComponent` reads `projectsData`, `extrasData`, `socialLinksData`, and `bioData` and passes them through signal inputs. The homepage order is Hero → About → Projects → Extras → Contact. Projects use `ProjectsSectionComponent` selection state, an overlapping `ProjectFocusStageComponent`, and `ProjectSelectorComponent`; Extras owns local player, responsive mode, delayed active-island, speech-prompt, saved-video-time/play-state, gallery state, and its development-only level editor; there is no project or Extras route. The August 14 verification passes 163 tests and prerenders four routes.

**Deliverable:** All five scroll sections are content-complete. The Projects section contains seven real/current entries in one accessible, responsive, in-page showcase.

---

## Phase 7: Interactivity & Polish

**Goal:** Layer in the micro-interactions and visual polish that make the site feel alive.

**Dependencies:** Phases 4–6 (all pages built)

**Tasks:**
- [x] **Project hover/selection effects:** selector previews lift subtly; active state uses accent glow plus an explicit marker; focus panels crossfade/rise without reflow
- [ ] **Card tilt:** subtle 3D tilt following mouse position on project cards (vanilla-tilt style via directive)
- [x] **Button micro-interactions:** motion-safe press compression on selector buttons, project links, and the email CTA
- [x] **Scroll reveals:** applied to the About intro card and the major Projects, Extras, and Contact content groups; About history intentionally renders without reveal animation
  - [x] Reveal range capped to an absolute scroll distance. Tall groups such as the Projects showcase use `min()` caps from `_variables.scss`; short subjects retain their original timing.
- [x] **Navbar active link indicator:** `ScrollService.activeSection` drives desktop and drawer active states
- [x] **Smooth scroll:** `ScrollService.scrollToSection()` and router anchor scrolling are configured
- [x] **Gradient text polish:** viewport-fixed gradient ≥ lg; per-element local gradients below lg (fixes muddy mobile blend and iOS Safari's missing fixed-attachment support)
- [x] **Project transitions:** 240ms opacity/rise/image-scale treatment replaces project route transitions and becomes immediate under reduced motion
- [x] **`prefers-reduced-motion`:** CSS fallbacks disable shared/hero animations, and the canvas renders a still frame that redraws only on scroll

**Deliverable:** The site feels polished and responsive to interaction. Every hover, scroll, and click has intentional feedback.

---

## Phase 8: Easter Eggs & Sound

**Goal:** The playful hidden features that reward exploration.

**Dependencies:** Phase 5 (background scene for star/UFO/rocket interaction), Phase 7 (interactivity foundation)

**Tasks:**

### Hover Interactivity
- [ ] **UFO spin:** UFO sprite rotates when cursor hovers over it
- [ ] **Star cursor pulse:** stars near the cursor pulse/brighten in response to mouse proximity
- [ ] **Card glow tracking:** card glow follows mouse position within the card (not just on/off)

### Physics Interactions
- [ ] **Movable elements:** stars, text fragments, and icons become draggable on click/touch
- [ ] Implement lightweight 2D physics: gravity pulls them down, collision with viewport edges
- [ ] Elements settle at the bottom or drift off-screen, then reset after a delay
- [ ] Keep physics scoped — only affects decorative elements, never breaks layout or readability

### Controllable Rocket
- [ ] Arrow keys control the rocket sprite with simple physics (thrust, gravity, momentum)
- [ ] Rocket wraps or bounces at viewport edges
- [ ] Visual feedback: thrust particles when accelerating

### Peelable Corner
- [ ] Small triangle indicator in a corner (e.g., bottom-right)
- [ ] On drag/hover, "peels back" to reveal a clean, minimal "professional" version of the page underneath
- [ ] Implementation: CSS clip-path or canvas overlay that follows cursor during peel
- [ ] The "professional" version is a simplified layout (white background, no effects, just text and links)

### Sound Effects
- [ ] Subtle audio cues for: rocket thrust, UFO hover, element collision, peel interaction
- [ ] All sounds off by default — enabled via a small toggle or triggered only by explicit interaction
- [ ] Use Web Audio API for low-latency playback, preload small audio buffers
- [ ] Respect system volume / mute preferences

**Deliverable:** The site has a layer of hidden delight. Visitors who explore are rewarded. Nothing interferes with core usability.

---

## Phase 9: Responsive, Accessibility & Performance

**Goal:** Production-grade quality across all devices.

**Dependencies:** All previous phases

**Tasks:**

### Responsive
- [ ] Test and fix all layouts at each breakpoint (xs, sm, md, lg, xl)
- [ ] Hero: avatar stacks above text on mobile
- [x] Project showcase: stacked focus plus horizontal selector cards on mobile; 2-column index from sm; 4-column index from lg
- [ ] Navbar: hamburger menu works correctly, drawer closes on navigation
- [ ] Complete mobile canvas policy: reduced star/particle counts already exist, but parallax and terrain complexity still need profiling
- [ ] Reduce glow intensity on small/OLED screens

### Accessibility
- [ ] Semantic HTML throughout (`<nav>`, `<main>`, `<section>`, `<footer>`, `<h1>`–`<h3>`)
- [ ] ARIA labels on interactive elements (nav links, social links, filters, buttons)
- [x] Keyboard navigation: selector buttons expose `aria-pressed`/`aria-controls`, keyboard activation focuses the active article, external actions announce new tabs, and the selected state is not color-only (full-site audit still pending)
- [x] Skip-to-content link (manual focus jump in `LayoutComponent` — fragment hrefs would re-route against `<base href>`)
- [ ] Color contrast: verify all text meets WCAG AA (4.5:1 for body, 3:1 for large text)
- [ ] Easter egg interactions don't trap focus or break tab order

### Performance
- [ ] Lighthouse audit: target 90+ on Performance, Accessibility, Best Practices, SEO
- [x] Lazy-load the Home route chunk via `loadComponent`; no detail chunk exists
- [x] Lazy-load selector preview images while the active focus art remains eager
- [ ] Optimize font loading: `font-display: swap`, preload critical fonts
- [x] Canvas: rendering pauses while the tab is hidden (`visibilitychange` cancels/restarts the rAF loop)
- [ ] Tree-shake unused code, verify bundle size

**Deliverable:** Site scores 90+ on Lighthouse, works on all screen sizes, and is keyboard/screen-reader navigable.

---

## Phase 10: Deployment

**Goal:** Site is live at calcitedev.me.

**Dependencies:** Phase 9

**Tasks:**
- [x] Configure Angular static output and prerendering through `outputMode: "static"` and `app.routes.server.ts`
- [x] Verify the production build prerenders four routes into `dist/portfolio/browser/`
- [ ] Set up Render:
  - Static site service
  - Build command: `npm run build`
  - Publish directory: `dist/portfolio/browser`
- [ ] Connect custom domain `calcitedev.me` in Render dashboard
- [ ] Configure DNS records (CNAME or A record pointing to Render)
- [ ] Enable HTTPS (Render provides free TLS via Let's Encrypt)
- [x] Page titles (Title service per route), meta description, theme-color, and Open Graph/Twitter tags in `index.html`; an `og:image` PNG asset remains open (crawlers don't render SVG)
- [ ] Verify social sharing previews (Twitter Card, LinkedIn, etc.)
- [ ] Add `robots.txt` and `sitemap.xml`

**Deliverable:** calcitedev.me is live, HTTPS-secured, and shows correct previews when shared on social media.

---

## Phase 11: Asset Swap & Final QA

**Goal:** Replace all placeholders with Tyler's real content and do a final pass.

**Dependencies:** Phase 10 (site is deployed), Tyler's pixel art and project screenshots are ready

**Tasks:**
- [ ] Swap placeholder pixel-art sprites (avatar, UFO, rocket, card icons) with Tyler's custom art
- [x] Replace filler thumbnails with six project-specific original SVG previews; real screenshots can still replace stable paths later
- [x] Fine-tune the supplied About copy after the timeline structure is approved
- [x] Update project data with seven real/current descriptions, URLs, statuses, and tech tags
- [ ] Full cross-browser test (Chrome, Firefox, Safari, Edge)
- [ ] Full mobile test (iOS Safari, Android Chrome)
- [ ] Final Lighthouse audit
- [ ] Verify all links work (live demos, GitHub repos, social profiles)
- [ ] Redeploy to Render

**Deliverable:** The site is fully personalized, tested, and production-ready.

---

## Parallel Work Opportunities

These phases can be worked on simultaneously:

| Track A (UI)                  | Track B (Content/Data)      | Track C (Tyler — Art)        |
| ----------------------------- | --------------------------- | ----------------------------- |
| Phase 2: Shared components    | Phase 3: Data layer         | Begin pixel-art creation      |
| Phase 5: Background scene     | Phase 6: Content pages      | Avatar, UFO, rocket sprites   |
| Phase 7: Interactivity        | —                           | Card icons, project thumbnails|
| Phase 8: Easter eggs          | —                           | Finalize all assets           |

---

## Scope Notes

**In scope for v1:**
- 1 scrollable page with 5 sections (Home hero, About, Projects, Extras, Contact)
- Animated canvas background on hero
- Neon glow design system
- Placeholder-driven development (easy asset swap)
- Easter eggs (physics, controllable rocket, peelable corner, sounds)
- Static site deployment on Render at calcitedev.me

**Explicitly deferred:**
- Blog section
- Downloadable resume PDF
- GitHub API integration
- Analytics
- Light mode theme toggle
- Contact form

These can be layered in as future phases without architectural changes.

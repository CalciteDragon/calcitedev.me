# Development Plan

## Principles

- **Dependency-aware ordering.** Each phase builds on the last — no phase starts until its dependencies are solid.
- **Vertical slices when possible.** Get something visible and working early, then layer in complexity.
- **Placeholder-first for assets.** All pixel art, images, and project screenshots use styled placeholders. Tyler creates art in parallel; swapping in is a file drop, not a code change.
- **Easter eggs are last.** The core site works cleanly without them — they're layered on top, never load-bearing.

## Current Status Audit — July 15, 2026

- Phases 0–6 are functionally implemented, including five prerendered project-detail routes.
- The `visual-and-ux-improvements` branch was reviewed and its eight commits cherry-picked into `layout-and-design-tweaks`: content-section min-height removal (hero-only `--full` modifier), footer `SocialLinksComponent` reuse, 3-column grid cap + popular-tag filter pruning, About card panel, project-detail card redesign with related projects, dynamic page titles via the Title service, and two cleanup commits. Its 1,343-line plan document was intentionally not ported — the work it planned is complete and recorded here.
- The July 2026 polish pass added: five themed project-thumbnail placeholder SVGs (with layout guards so missing images can't collapse cards), hero UFO repositioned clear of the headline, stretched-link card navigation to `/projects/:slug`, mobile-local hero gradients, a global `:focus-visible` ring, skip-to-content link, drawer body-scroll lock with md auto-close, a one-row scrollable mobile filter bar, press-state compression on pill controls, canvas reduced-motion still-frame + hidden-tab rAF pause, static head metadata (title/description/theme-color/OG/Twitter), and a pixel-C SVG favicon.
- Phase 7 is now mostly complete: card hover lift/glow, section scroll reveals, active navbar state, smooth scrolling, CSS reduced-motion fallbacks, button micro-interactions, gradient rendering across breakpoints, and a canvas reduced-motion policy. Card tilt and route transitions remain open.
- Phase 9 has partial foundations: lazy routes, lazy project images, semantic section structure, reduced mobile scene entity counts, skip link, hidden-tab canvas suspension, and baseline SEO metadata.
- Static output is configured and verified: 116 tests pass and a production build prerenders eight routes.
- The Angular development server uses one-second file polling with full-page live reload, avoiding stale Windows watcher sessions and unreliable component-style HMR updates during `npm start`.
- Known repository gaps: the hero stylesheet exceeds the 4 kB warning budget (7.4 kB); mountain DPR scaling, full responsive/accessibility audits, an og:image asset, and external deployment verification remain open.

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
  - Nav links: Projects, About, Skills, Contact — rendered as `<button>` elements that scroll to the matching section (not `<a>` router links); active state driven by `ScrollService.activeSection` signal
  - Hover state: glow + color shift
  - Mobile: hamburger toggle → slide-in drawer
- [x] `FooterComponent`:
  - Copyright line, centered — the footer's only content
  - [x] Social icons removed from the footer: it renders directly under the Contact section at scroll-bottom, so both rendering `SocialLinksComponent` showed two duplicate icon rows on one screen. `ContactSectionComponent` is now the sole consumer of `socialLinksData`, and `FooterComponent` is a data-free shell. (Supersedes the earlier port of `SocialLinksComponent` into the footer from `visual-and-ux-improvements`.)
- [x] `app.routes.ts` — home and `projects/:slug` lazy-load their components; `/about` and `/contact` redirect to `/`; wildcard redirects to `/`
- [x] Stub feature components (empty shell for Home, About, Projects, Contact) so routing works — stubs for About, Projects, Contact later removed in single-page refactor

**Deliverable:** App shell renders. Navbar and footer appear on every route.

---

## Phase 2: Shared Components & Directives ✅ COMPLETE

**Goal:** The reusable building blocks. These are stateless, input-driven, and visually polished.

**Dependencies:** Phase 0 (global styles)

**Parallel with:** Phase 3

**Tasks:**
- [x] `CardComponent` — generic neon-bordered card with configurable glow color, hover lift, and stronger glow
- [x] `SectionHeaderComponent` — gradient text heading with optional subtitle
- [x] `SkillChipComponent` — category-colored skill pill
- [x] `TechTagComponent` — compact project technology tag
- [x] `SocialLinksComponent` — typed social-link row with platform-specific presentation
- [x] `ProjectCardComponent` — project thumbnail, title, description, tags, links, and detail navigation
- [x] `ScrollRevealDirective` — CSS scroll-driven animation via `animation-timeline: view()`, adds `.scroll-reveal` class when on a browser platform; the CSS handles all animation logic, including the `min()` caps that keep tall subjects from stretching the reveal (see `docs/design.md` → Scroll Reveal Range)
- [x] `GlowDirective` — configurable neon glow behavior

**Deliverable:** A mini component library. Can be visually tested in isolation on a scratch route or via `ng serve` on the home page.

---

## Phase 3: Data Layer

**Goal:** All content defined as typed, static TypeScript. Placeholder images created.

**Dependencies:** Phase 0

**Parallel with:** Phase 2

**Tasks:**
- [x] `project.model.ts` — `Project` interface (title, slug, description, longDescription, tags, imageUrl, liveUrl?, githubUrl?, featured)
- [x] `skill.model.ts` — `Skill` interface (name, category, icon?)
- [x] `social-link.model.ts` — `SocialLink` interface (platform, url, icon, glowColor)
- [x] `projects.data.ts` — 4–6 placeholder projects with realistic titles/descriptions and placeholder image paths
- [x] `skills.data.ts` — full skills list organized by the 8 categories Tyler provided
- [x] `bio.data.ts` — placeholder bio text (Tyler fills in real copy later)
- [x] `social-links.data.ts` — GitHub, Discord, and LinkedIn entries
- [x] Five themed placeholder SVGs restored under `public/assets/images/` (per-project motif in the project's glow color); swapping in real screenshots stays a file drop at the same paths
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
- [x] Single-page refactor: `ProjectsSectionComponent`, `AboutSectionComponent`, `SkillsSectionComponent`, `ContactSectionComponent` created at `features/home/sections/`; old route stubs removed; `ScrollService` added for active section tracking; navbar updated to scroll buttons

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
- [x] Performance: passive scroll sampling, duplicate camera-message suppression, and demand-driven worker invalidation remove avoidable frame delay and idle worker callbacks
- [x] Performance: row-batched terrain faces/wires reduce the default redraw budget from thousands of per-cell paints to at most 84 fills, 168 strokes, and 126 path starts; command-budget coverage guards the batching
- [x] Performance: cache the main-thread atmosphere and horizon gradients until resize

**Built:** Two-canvas architecture inside `BackgroundSceneComponent` — **mountain canvas** (DOM-order first, bottom layer) transferred to `MountainRenderer` inside `mountain.worker.ts` through `MountainWorkerBridge`; **scene canvas** (DOM-order second, top layer, transparent background) owned by `SceneRenderer` on the main thread. Both canvases fill the fixed host. `body { background-color: transparent }` lets the canvases show through all sections. A CSS `::after` scanline overlay covers both canvases.

**MountainRenderer** (`mountain-renderer.ts`, `mountain.config.ts`): 3D perspective-projected FBM terrain. It draws the terrain grid back-to-front with row-batched fill, wire, and fog passes using cached sampled gradients; behind-camera rows are skipped, and the scroll-dependent projection update reuses one scale calculation per row. `setConfig()` rebuilds the terrain only when structural parameters change. `camY = scrollY / 1200 - camYOffset` drives scroll parallax. `BackgroundSceneComponent` forwards camera changes from a passive scroll listener through `MountainWorkerBridge`; duplicate camera values are suppressed, and the worker coalesces all pending invalidations into one demand-driven animation frame using the latest state.

**SceneRenderer** (`scene-renderer.ts`): draws on transparent canvas. Render order each frame: `drawAtmosphere` (linear gradient haze) → `drawHorizonGlow` (neon bloom band) → `drawStars` → `drawParticles`. The two viewport-sized gradients are cached and rebuilt only when the renderer is initialized/resized. `drawFrame(timestamp, scrollY)` — no `heroHeight` param.

**Stars** concentrated in upper 85% of canvas; radius 0.4–2.5px; opacity 0.2–0.8; large stars (radius > 1.8) rendered with cross-sparkle arms. Star count: 130 full / 65 reduced.

**Updated in layout-and-design-tweaks:** UFO and Rocket removed from `SceneRenderer` entirely — `UFO`/`Rocket` interfaces, `createUFO()`/`createRocket()` factories, `drawUFO()`/`drawRocket()` methods, and the `heroHeight` hero-visibility gate all deleted. The UFO moved to `HeroComponent` as a CSS/HTML element. The rocket is deferred to Phase 8 (Easter Eggs).

Note: DPR scaling not applied to `MountainRenderer.resize()` — deferred to Phase 9 performance work.

**Deliverable:** Hero section has a fully animated cyberpunk background. Looks alive and layered.

---

## Phase 6: Content Sections ✅ COMPLETE

**Goal:** About, Projects, Skills, and Contact sections — fully functional with real content structure. All sections live inside `HomeComponent` at `features/home/sections/`.

**Dependencies:** Phase 1 (layout), Phase 2 (shared components), Phase 3 (data)

**Parallel with:** Phase 5

**Tasks:**

### About Section (`features/home/sections/about-section/`)
- [x] Short bio section (placeholder text, Tyler fills in later)
- [x] Scroll-reveal animation

### Skills Section (`features/home/sections/skills-section/`)
- [x] `SkillsGridComponent` — skills grouped by the 8 categories, displayed as a grid of `SkillChipComponent` groups
- [x] Each category has a heading and a cluster of chips
- [x] Scroll-reveal animation on skill groups

### Projects Section (`features/home/sections/projects-section/`)
- [x] `ProjectListComponent` — responsive grid of `ProjectCardComponent`
- [x] Filter bar: filter by tech tag or category (signals-based, no RxJS needed)
- [x] Easy-swap project thumbnails exist at the `imageUrl` paths (themed placeholder SVGs); card thumbnails and the detail hero image carry layout guards so a missing file can't collapse the layout
- [x] `ProjectDetailComponent` — route `/projects/:slug` at `features/projects/project-detail/`, displays full project info (long description, tech tags, links, larger image placeholder)

### Contact Section (`features/home/sections/contact-section/`)
- [x] Email link (styled as a prominent CTA or card)
- [x] `SocialLinksComponent` reuse — GitHub, Discord, and LinkedIn with glow hover
- [x] Clean, minimal layout — no form

**Built:** `BackgroundSceneComponent` moved to `LayoutComponent` so it persists across routes. `HomeComponent` reads `projectsData`, `skillsData`, `socialLinksData`, and `bioData` and passes them through signal inputs. About, Contact, Skills/SkillsGrid, and Projects/ProjectList components implement the five-section content experience. `ProjectDetailComponent` uses `toSignal(route.paramMap)` plus `computed()` for slug resolution. `app.routes.ts` places `projects/:slug` before the wildcard, and `app.routes.server.ts` enumerates all five slugs. The July 2026 verification run passes 106 tests and prerenders eight routes.

**Deliverable:** All five scroll sections are content-complete with placeholder data. Full in-page navigation works end to end. `/projects/:slug` route live with 5 pre-rendered project detail pages.

---

## Phase 7: Interactivity & Polish

**Goal:** Layer in the micro-interactions and visual polish that make the site feel alive.

**Dependencies:** Phases 4–6 (all pages built)

**Tasks:**
- [x] **Card hover effects:** shared `CardComponent` intensifies its glow and lifts by `translateY(-4px)`
- [ ] **Card tilt:** subtle 3D tilt following mouse position on project cards (vanilla-tilt style via directive)
- [x] **Button micro-interactions:** motion-safe press compression on filter pills, card/detail links, and the email CTA; glow hover states already existed
- [x] **Scroll reveals:** applied to the major About, Projects, Skills, and Contact content groups
  - [x] Reveal range capped to an absolute scroll distance. `view()` measures its `entry` range as the subject's own height, so the ~970px (desktop) / ~2280px (mobile) project grid needed roughly 1200–1800px of scrolling to finish fading and could only complete once its top had left the screen. `min()` caps in `_variables.scss` bound the reveal; every short subject on the page keeps its original timing, and only the grid and About content are clamped. See `docs/design.md` → Scroll Reveal Range.
- [x] **Navbar active link indicator:** `ScrollService.activeSection` drives desktop and drawer active states
- [x] **Smooth scroll:** `ScrollService.scrollToSection()` and router anchor scrolling are configured
- [x] **Gradient text polish:** viewport-fixed gradient ≥ lg; per-element local gradients below lg (fixes muddy mobile blend and iOS Safari's missing fixed-attachment support)
- [ ] **Page transitions:** subtle fade between routes (Angular router animations)
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
- [ ] Project grid: 1 → 2 → 3 columns as viewport widens
- [ ] Navbar: hamburger menu works correctly, drawer closes on navigation
- [ ] Complete mobile canvas policy: reduced star/particle counts already exist, but parallax and terrain complexity still need profiling
- [ ] Reduce glow intensity on small/OLED screens

### Accessibility
- [ ] Semantic HTML throughout (`<nav>`, `<main>`, `<section>`, `<footer>`, `<h1>`–`<h3>`)
- [ ] ARIA labels on interactive elements (nav links, social links, filters, buttons)
- [x] Keyboard navigation: interactive elements are focusable with a global cyan `:focus-visible` ring; project cards expose a stretched title link with a card-wide focus ring (full audit still pending below)
- [x] Skip-to-content link (manual focus jump in `LayoutComponent` — fragment hrefs would re-route against `<base href>`)
- [ ] Color contrast: verify all text meets WCAG AA (4.5:1 for body, 3:1 for large text)
- [ ] Easter egg interactions don't trap focus or break tab order

### Performance
- [ ] Lighthouse audit: target 90+ on Performance, Accessibility, Best Practices, SEO
- [x] Lazy-load the Home and Project Detail route chunks via `loadComponent`
- [x] Lazy-load project-card images with `loading="lazy"`
- [ ] Optimize font loading: `font-display: swap`, preload critical fonts
- [x] Canvas: rendering pauses while the tab is hidden (`visibilitychange` cancels/restarts the rAF loop)
- [x] Canvas: mountain scroll redraws use passive camera sampling, demand-driven worker scheduling, and row-batched Canvas2D paths with command-budget tests
- [x] Canvas: cache main-thread scene gradients outside the frame loop
- [ ] Tree-shake unused code, verify bundle size

**Deliverable:** Site scores 90+ on Lighthouse, works on all screen sizes, and is keyboard/screen-reader navigable.

---

## Phase 10: Deployment

**Goal:** Site is live at calcitedev.me.

**Dependencies:** Phase 9

**Tasks:**
- [x] Configure Angular static output and prerendering through `outputMode: "static"` and `app.routes.server.ts`
- [x] Verify the production build prerenders eight routes into `dist/portfolio/browser/`
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
- [ ] Swap placeholder project thumbnails with real screenshots
- [ ] Replace placeholder bio text with real copy
- [ ] Update project data with real descriptions, URLs, and tech tags
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
- 1 scrollable page with 5 sections (Home hero, Projects, About, Skills, Contact)
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
- Timeline/experience section on About page
- Contact form

These can be layered in as future phases without architectural changes.

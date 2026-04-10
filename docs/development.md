# Development Plan

## Principles

- **Dependency-aware ordering.** Each phase builds on the last — no phase starts until its dependencies are solid.
- **Vertical slices when possible.** Get something visible and working early, then layer in complexity.
- **Placeholder-first for assets.** All pixel art, images, and project screenshots use styled placeholders. Tyler creates art in parallel; swapping in is a file drop, not a code change.
- **Easter eggs are last.** The core site works cleanly without them — they're layered on top, never load-bearing.

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
    │        │   Phase 4: Home Page — Hero + Feature Cards
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
- [x] `ng new` with Angular 19, standalone, SCSS, SSR enabled, routing
- [x] Configure `tsconfig.json` strict mode
- [x] Set up global SCSS partials:
  - `_variables.scss` — full color palette, spacing scale (8px), breakpoints, glow presets
  - `_reset.scss` — CSS reset/normalize
  - `_typography.scss` — `@font-face` for Space Grotesk, Inter, JetBrains Mono (+ Press Start 2P for pixel text)
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
  - Centered social icon links (GitHub, Discord, LinkedIn) — inline SVGs
  - Copyright line
  - Icons glow on hover (GitHub=cyan, Twitter=blue, LinkedIn=purple)
- [x] `app.routes.ts` — home route lazy-loads `HomeComponent`; old `/about`, `/projects`, `/contact` paths redirect to `/`; wildcard redirect to `/`
- [x] Stub feature components (empty shell for Home, About, Projects, Contact) so routing works — stubs for About, Projects, Contact later removed in single-page refactor

**Deliverable:** App shell renders. Navbar and footer appear on every route.

---

## Phase 2: Shared Components & Directives

**Goal:** The reusable building blocks. These are stateless, input-driven, and visually polished.

**Dependencies:** Phase 0 (global styles)

**Parallel with:** Phase 3

**Tasks:**
- [ ] `CardComponent` — generic neon-bordered card with configurable glow color (cyan/blue/purple/pink). Dark surface background, rounded corners, hover lift + glow intensify
- [ ] `CtaButtonComponent` — rounded rectangle, neon border glow, hover scale(1.02), click scale(0.98)
- [ ] `SectionHeaderComponent` — gradient text heading, optional subtitle
- [ ] `SkillChipComponent` — small pill/badge displaying a skill name, optionally color-coded by category
- [ ] `TechTagComponent` — tag for project tech stack (could use pixel-style font variant)
- [ ] `SocialLinksComponent` — row of social icon links with individual glow colors on hover
- [ ] `ProjectCardComponent` — card variant: thumbnail placeholder at top, title, description, tech tags, hover glow
- [x] `ScrollRevealDirective` — CSS scroll-driven animation via `animation-timeline: view()`, adds `.scroll-reveal` class when on a browser platform; the CSS handles all animation logic
- [ ] `GlowDirective` — applies neon glow box-shadow on hover with configurable color

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
- [x] `social-links.data.ts` — GitHub, Twitter/X, LinkedIn entries
- [x] Create placeholder images in `assets/images/` — styled dark rectangles with project name text, matching the color palette
- [x] Create placeholder pixel-art sprites in `assets/pixel-art/` — simple colored rectangles or silhouettes for avatar, UFO, rocket, card icons

**Deliverable:** `import { projectsData } from './data/projects.data'` works everywhere. Placeholder visuals exist for every slot.

---

## Phase 4: Home Page — Hero + Feature Cards

**Goal:** The landing page hero section and feature cards strip, fully styled, no canvas background yet.

**Dependencies:** Phase 1 (layout/routing), Phase 2 (card, CTA button), Phase 3 (data)

**Tasks:**
- [x] `HeroComponent`:
  - Pixel-art avatar placeholder (left side desktop, top on mobile)
  - "HEY, I'M" pre-heading (spaced out, small)
  - "TYLER HAWTHORN" (large, gradient text via `background-clip: text`)
  - "AKA CALCITE" (gold/orange styled)
  - "Code · Create · Innovate" tagline
  - "Full Stack Developer & Game Enthusiast" subtitle
  - "View My Work" CTA button (scrolls to the Projects section)
- [x] `FeatureCardsComponent`:
  - Three `CardComponent` instances: About Me (cyan glow), Latest Projects (blue glow), My Skills (purple glow)
  - Each has a placeholder pixel icon, short text, and a CTA ("Learn More", "See Projects", "View Skills")
  - Cards scroll to their respective sections (not router links)
- [x] `HomeComponent` — smart container; orchestrates Hero + FeatureCards + all scroll sections; solid dark background (canvas comes next)
- [x] Scroll-reveal animation on the feature cards section
- [x] Single-page refactor: `ProjectsSectionComponent`, `AboutSectionComponent`, `SkillsSectionComponent`, `ContactSectionComponent` created at `features/home/sections/`; old route stubs removed; `ScrollService` added for active section tracking; navbar updated to scroll buttons

**Built:** `HeroComponent` (presentational, `bio` signal input), `FeatureCardsComponent` (static card config, smooth scroll), `HomeComponent` (smart container, reads `bioData`, hosts all sections). `appScrollReveal` applied to feature cards section from HomeComponent template. Canvas background deferred to Phase 5.

**Deliverable:** Full single-page scroll layout. Hero and feature cards visible; all five sections present and scrollable.

---

## Phase 5: Home Page — Background Scene (Canvas)

**Goal:** The animated, interactive canvas behind the hero section.

**Dependencies:** Phase 4 (home page structure to layer behind)

**Tasks:**
- [x] `BackgroundSceneComponent` — full-viewport `<canvas>` element positioned behind hero content
- [x] `isPlatformBrowser` guard — skip canvas init during SSR/prerender
- [x] **Star field:** sparse pixel-style stars, subtle twinkle animation, random placement
- [x] **Cyber mountains:** low-poly wireframe silhouettes along the horizon, faint neon outlines (blue/purple)
- [x] **Parallax:** mountains and elements shift based on scroll position
- [x] **UFO sprite:** placeholder graphic, slow floating bob animation, soft glow beam downward
- [x] **Rocket sprite:** placeholder graphic, launch animation with stylized smoke particles
- [x] **Floating particles:** minimal pixel particles drifting (very subtle)
- [x] **Faint scanline/grid overlay:** CSS pseudo-element on the page background (very low opacity)
- [x] Performance: use `requestAnimationFrame`, reduce on mobile
- [ ] Performance: throttle on hidden tab (deferred to Phase 9 — canvas: skip rendering when `document.hidden`)

**Built:** Two-canvas architecture inside `BackgroundSceneComponent` — **mountain canvas** (DOM-order first, bottom layer) owned by `MountainRenderer`; **scene canvas** (DOM-order second, top layer, transparent background) owned by `SceneRenderer`. Both canvases are `position: absolute; inset: 0` within the `position: fixed` host. `body { background-color: transparent }` lets canvases show through all sections. CSS `::after` scanline overlay covers both canvases as a viewport-wide CRT effect.

**MountainRenderer** (`mountain-renderer.ts`, `mountain.config.ts`): 3D perspective-projected FBM terrain. Draws dark background fill, radial horizon glow, terrain grid (back-to-front with fill + wire passes + per-face fog), depth fog overlay, and in-canvas scanlines. `setConfig()` rebuilds the terrain grid only when structural params change (not on camY-only updates). `camY = scrollY / 1200` drives scroll parallax — camera pans through the valley over a 1200px scroll range.

**SceneRenderer** (`scene-renderer.ts`): draws on transparent canvas. Render order each frame: `drawAtmosphere` (linear gradient haze) → `drawHorizonGlow` (neon bloom band) → `drawStars` → `drawParticles` → UFO/rocket (hero-only).

**Stars** concentrated in upper 85% of canvas; radius 0.4–2.5px; opacity 0.2–0.8; large stars (radius > 1.8) rendered with cross-sparkle arms. Star count: 130 full / 65 reduced. UFO and rocket remain hero-only (`scrollY < heroHeight`).

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
- [x] Placeholder project thumbnails are easy-swap (just change `imageUrl` in data file)
- [x] `ProjectDetailComponent` — route `/projects/:slug` at `features/projects/project-detail/`, displays full project info (long description, tech tags, links, larger image placeholder)

### Contact Section (`features/home/sections/contact-section/`)
- [x] Email link (styled as a prominent CTA or card)
- [x] `SocialLinksComponent` reuse — GitHub, Twitter/X, LinkedIn with glow hover
- [x] Clean, minimal layout — no form

**Built:** `BackgroundSceneComponent` moved to `LayoutComponent` (persists across all routes). `HomeComponent` wired as smart container — reads `projectsData`, `skillsData`, `socialLinksData`, `bioData` and passes down via signal inputs. `AboutSectionComponent` (shortBio + extendedBio with `white-space: pre-line`). `ContactSectionComponent` (email CTA with neon-bordered pill, `SocialLinksComponent`). `SkillsSectionComponent` + `SkillsGridComponent` sub-component (auto-fill grid, accent-colored category labels). `ProjectsSectionComponent` + `ProjectListComponent` sub-component (signal-based filter: `activeFilter`, `allTags`, `filteredProjects` computed, filter pill bar). `ProjectCardComponent` extended with optional `liveUrl`/`githubUrl` inputs. `ProjectDetailComponent` at `features/projects/project-detail/` using `toSignal(route.paramMap)` + `computed()` for slug resolution. `app.routes.ts` updated with `projects/:slug` lazy route (before wildcard). `app.routes.server.ts` uses `getPrerenderParams` to enumerate all 5 project slugs. Global CSS: added `--section-padding-v`, `--section-padding-h`, and `--accent-*-rgb` tokens to `:root`. `SocialLinksComponent` unified to use canonical `SocialLink` type. Production build pre-renders 8 static routes. 99/99 unit tests passing.

**Deliverable:** All five scroll sections are content-complete with placeholder data. Full in-page navigation works end to end. `/projects/:slug` route live with 5 pre-rendered project detail pages.

---

## Phase 7: Interactivity & Polish

**Goal:** Layer in the micro-interactions and visual polish that make the site feel alive.

**Dependencies:** Phases 4–6 (all pages built)

**Tasks:**
- [ ] **Card hover effects:** glow intensify + `translateY(-4px)` lift on all cards site-wide
- [ ] **Card tilt:** subtle 3D tilt following mouse position on project cards (vanilla-tilt style via directive)
- [ ] **Button micro-interactions:** glow pulse on hover, slight compression on click
- [ ] **Scroll reveals:** apply `ScrollRevealDirective` to all major sections across pages
- [ ] **Navbar active link indicator:** underline or accent glow on current route
- [ ] **Smooth scroll:** smooth anchor scrolling for in-page navigation
- [ ] **Gradient text polish:** ensure hero gradient renders well across browsers
- [ ] **Page transitions:** subtle fade between routes (Angular router animations)
- [ ] **`prefers-reduced-motion`:** disable non-essential animations globally via media query

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
- [ ] Feature cards: single column on mobile
- [ ] Project grid: 1 → 2 → 3 columns as viewport widens
- [ ] Navbar: hamburger menu works correctly, drawer closes on navigation
- [ ] Reduce canvas scene complexity on mobile (fewer stars, skip parallax, simpler mountains)
- [ ] Reduce glow intensity on small/OLED screens

### Accessibility
- [ ] Semantic HTML throughout (`<nav>`, `<main>`, `<section>`, `<footer>`, `<h1>`–`<h3>`)
- [ ] ARIA labels on interactive elements (nav links, social links, filters, buttons)
- [ ] Keyboard navigation: all interactive elements focusable and operable
- [ ] Skip-to-content link
- [ ] Color contrast: verify all text meets WCAG AA (4.5:1 for body, 3:1 for large text)
- [ ] Easter egg interactions don't trap focus or break tab order

### Performance
- [ ] Lighthouse audit: target 90+ on Performance, Accessibility, Best Practices, SEO
- [ ] Lazy-load route chunks (already configured via `loadComponent`)
- [ ] Lazy-load images (`loading="lazy"`)
- [ ] Optimize font loading: `font-display: swap`, preload critical fonts
- [ ] Canvas: skip rendering when tab is hidden (`document.hidden`)
- [ ] Tree-shake unused code, verify bundle size

**Deliverable:** Site scores 90+ on Lighthouse, works on all screen sizes, and is keyboard/screen-reader navigable.

---

## Phase 10: Deployment

**Goal:** Site is live at calcitedev.me.

**Dependencies:** Phase 9

**Tasks:**
- [ ] Configure Angular pre-rendering (`ng build` with `prerender: true` in `angular.json`)
- [ ] Verify all routes pre-render correctly (check `dist/browser/` for HTML files)
- [ ] Set up Render:
  - Static site service
  - Build command: `ng build`
  - Publish directory: `dist/<project-name>/browser`
- [ ] Connect custom domain `calcitedev.me` in Render dashboard
- [ ] Configure DNS records (CNAME or A record pointing to Render)
- [ ] Enable HTTPS (Render provides free TLS via Let's Encrypt)
- [ ] Add meta tags and Open Graph data via `MetaService` (title, description, image per page)
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

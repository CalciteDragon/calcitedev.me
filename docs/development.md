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
  - Nav links: About, Projects, Contact
  - Hover state: glow + color shift
  - Mobile: hamburger toggle → slide-in drawer
- [x] `FooterComponent`:
  - Centered social icon links (GitHub, Discord, LinkedIn) — inline SVGs
  - Copyright line
  - Icons glow on hover (GitHub=cyan, Twitter=blue, LinkedIn=purple)
- [x] `app.routes.ts` — all routes defined with lazy-loaded `loadComponent`, wildcard redirect
- [x] Stub feature components (empty shell for Home, About, Projects, Contact) so routing works

**Deliverable:** Can navigate between all pages. Navbar and footer render on every route.

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
- [ ] `ScrollRevealDirective` — IntersectionObserver-based, adds a CSS class when element enters viewport, triggers fade/slide animation
- [ ] `GlowDirective` — applies neon glow box-shadow on hover with configurable color

**Deliverable:** A mini component library. Can be visually tested in isolation on a scratch route or via `ng serve` on the home page.

---

## Phase 3: Data Layer

**Goal:** All content defined as typed, static TypeScript. Placeholder images created.

**Dependencies:** Phase 0

**Parallel with:** Phase 2

**Tasks:**
- [ ] `project.model.ts` — `Project` interface (title, slug, description, longDescription, tags, imageUrl, liveUrl?, githubUrl?, featured)
- [ ] `skill.model.ts` — `Skill` interface (name, category, icon?)
- [ ] `social-link.model.ts` — `SocialLink` interface (platform, url, icon, glowColor)
- [ ] `projects.data.ts` — 4–6 placeholder projects with realistic titles/descriptions and placeholder image paths
- [ ] `skills.data.ts` — full skills list organized by the 8 categories Tyler provided
- [ ] `bio.data.ts` — placeholder bio text (Tyler fills in real copy later)
- [ ] `social-links.data.ts` — GitHub, Twitter/X, LinkedIn entries
- [ ] Create placeholder images in `assets/images/` — styled dark rectangles with project name text, matching the color palette
- [ ] Create placeholder pixel-art sprites in `assets/pixel-art/` — simple colored rectangles or silhouettes for avatar, UFO, rocket, card icons

**Deliverable:** `import { projectsData } from './data/projects.data'` works everywhere. Placeholder visuals exist for every slot.

---

## Phase 4: Home Page — Hero + Feature Cards

**Goal:** The landing page hero section and feature cards strip, fully styled, no canvas background yet.

**Dependencies:** Phase 1 (layout/routing), Phase 2 (card, CTA button), Phase 3 (data)

**Tasks:**
- [ ] `HeroComponent`:
  - Pixel-art avatar placeholder (left side desktop, top on mobile)
  - "HEY, I'M" pre-heading (spaced out, small)
  - "TYLER HAWTHORN" (large, gradient text via `background-clip: text`)
  - "AKA CALCITE" (gold/orange styled)
  - "Code · Create · Innovate" tagline
  - "Full Stack Developer & Game Enthusiast" subtitle
  - "View My Work" CTA button (scrolls to feature cards or navigates to projects)
- [ ] `FeatureCardsComponent`:
  - Three `CardComponent` instances: About Me (cyan glow), Latest Projects (blue glow), My Skills (purple glow)
  - Each has a placeholder pixel icon, short text, and a CTA ("Learn More", "See Projects", "View Skills")
  - Cards link to their respective routes
- [ ] `HomeComponent` — orchestrates Hero + FeatureCards, solid dark background (canvas comes next)
- [ ] Scroll-reveal animation on the feature cards section

**Deliverable:** Landing page looks close to the design mockup (minus the animated background). Feature cards navigate to the correct routes.

---

## Phase 5: Home Page — Background Scene (Canvas)

**Goal:** The animated, interactive canvas behind the hero section.

**Dependencies:** Phase 4 (home page structure to layer behind)

**Tasks:**
- [ ] `BackgroundSceneComponent` — full-viewport `<canvas>` element positioned behind hero content
- [ ] `isPlatformBrowser` guard — skip canvas init during SSR/prerender
- [ ] **Star field:** sparse pixel-style stars, subtle twinkle animation, random placement
- [ ] **Cyber mountains:** low-poly wireframe silhouettes along the horizon, faint neon outlines (blue/purple)
- [ ] **Parallax:** mountains and elements shift based on scroll position
- [ ] **UFO sprite:** placeholder graphic, slow floating bob animation, soft glow beam downward
- [ ] **Rocket sprite:** placeholder graphic, launch animation with stylized smoke particles
- [ ] **Floating particles:** minimal pixel particles drifting (very subtle)
- [ ] **Faint scanline/grid overlay:** CSS pseudo-element on the page background (very low opacity)
- [ ] Performance: use `requestAnimationFrame`, throttle on hidden tab, reduce on mobile

**Deliverable:** Hero section has a fully animated cyberpunk background. Looks alive and layered.

---

## Phase 6: Content Pages

**Goal:** About, Projects, and Contact pages — fully functional with real content structure.

**Dependencies:** Phase 1 (layout), Phase 2 (shared components), Phase 3 (data)

**Parallel with:** Phase 5

**Tasks:**

### About Page
- [ ] Short bio section (placeholder text, Tyler fills in later)
- [ ] `SkillsGridComponent` — skills grouped by the 8 categories, displayed as a grid of `SkillChipComponent` groups
- [ ] Each category has a heading and a cluster of chips
- [ ] Scroll-reveal animation on skill groups

### Projects Page
- [ ] `ProjectListComponent` — responsive grid of `ProjectCardComponent`
- [ ] Filter bar: filter by tech tag or category (signals-based, no RxJS needed)
- [ ] `ProjectDetailComponent` — route `/projects/:slug`, displays full project info (long description, tech tags, links, larger image placeholder)
- [ ] Placeholder project thumbnails are easy-swap (just change `imageUrl` in data file)

### Contact Page
- [ ] Email link (styled as a prominent CTA or card)
- [ ] `SocialLinksComponent` reuse — GitHub, Twitter/X, LinkedIn with glow hover
- [ ] Clean, minimal layout — no form

**Deliverable:** All four pages are content-complete with placeholder data. Full navigation works end to end.

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
- 4 pages (Home, About, Projects, Contact)
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

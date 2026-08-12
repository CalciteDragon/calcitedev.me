# Design System

## Design Philosophy

- **Dark-first, cyberpunk-inspired.** Near-black backgrounds with neon glow accents. Futuristic but readable.
- **Pixel-art as personality.** 8-bit elements (avatar, icons, sprites) are decorative accents — they add charm without hurting usability.
- **Clean modern UI underneath.** Good spacing, strong hierarchy, not cluttered. The cyberpunk theme is a skin over solid UX.
- **Readability over aesthetics.** If a glow or effect hurts legibility, dial it back.

## Color Palette

### Backgrounds

| Role        | Hex       | Usage                              |
| ----------- | --------- | ---------------------------------- |
| Primary BG  | `#0B0F1A` | Page background                    |
| Surface     | `#111827` | Cards, panels, elevated surfaces   |
| Border      | `#1E2A45` | Subtle borders, dividers           |

### Accent Gradient (Primary)

```
Cyan → Blue → Purple
#22D3EE → #3B82F6 → #8B5CF6
```

Used for: heading gradients, active states, card border glows, CTA accents.

### Secondary Accents

| Role          | Hex       | Usage                                 |
| ------------- | --------- | ------------------------------------- |
| Pink          | `#EC4899` | Highlights, hover flares, variety     |
| Gold / Orange | `#F59E0B` | "Calcite" branding, special callouts  |

### Text

| Role      | Hex       | Usage                      |
| --------- | --------- | -------------------------- |
| Primary   | `#E5E7EB` | Body text, headings        |
| Secondary | `#9CA3AF` | Captions, muted labels     |

### CSS Custom Properties

```scss
:root {
  --bg-primary: #0B0F1A;
  --bg-surface: #111827;
  --bg-border: #1E2A45;

  --accent-cyan: #22D3EE;
  --accent-blue: #3B82F6;
  --accent-purple: #8B5CF6;
  --accent-pink: #EC4899;
  --accent-gold: #F59E0B;

  --text-primary: #E5E7EB;
  --text-secondary: #9CA3AF;

  --gradient-accent: linear-gradient(135deg, var(--accent-cyan), var(--accent-blue), var(--accent-purple));

  --glow-cyan: 0 0 15px rgba(34, 211, 238, 0.3);
  --glow-blue: 0 0 15px rgba(59, 130, 246, 0.3);
  --glow-purple: 0 0 15px rgba(139, 92, 246, 0.3);
  --glow-pink: 0 0 15px rgba(236, 72, 153, 0.3);
  --glow-gold: 0 0 15px rgba(245, 158, 11, 0.3);
}
```

## Typography

### Font Pairing

- **Headings:** `Space Grotesk` — geometric, modern, techy feel
- **Body:** `Inter` — clean, highly legible at all sizes
- **Code / Pixel accents:** `Press Start 2P` or `JetBrains Mono` — for 8-bit styled text, tech tags, or code snippets

### Type Scale

| Element         | Size (desktop)           | Weight | Notes                                              |
| --------------- | ------------------------ | ------ | -------------------------------------------------- |
| Hero name       | `clamp(3rem, 8vw, 7rem)` | 700    | Cyan→pink gradient via `background-clip: text` — viewport-fixed attachment ≥ lg; per-element (vertical) below lg |
| Hero alias      | `clamp(1rem, 2.5vw, 1.75rem)` | 600 | Same gradient — per-element horizontal below lg  |
| Hero subtitle   | `clamp(1rem, 2vw, 1.375rem)` | 400  | Same gradient — per-element horizontal below lg  |
| H2 (Section)    | 2rem–2.5rem              | 700    | Section headings                                   |
| H3 (Card title) | 1.25rem                  | 600    | Card headings                                      |
| Body            | 1rem                     | 400    | Line height 1.6                                    |
| Small / Label   | 0.875rem                 | 500    | Tags, captions                                     |
| Pixel text      | 0.75rem–1rem             | 400    | `Press Start 2P`, used sparingly                   |

Use `clamp()` for fluid typography on mobile.

## Layout

### Grid System

- **Max content width:** 1200px, centered
- **Section padding:** 80–120px vertical, 24px horizontal (mobile: 48–64px vertical, 16px)
- **Card grid:** CSS Grid, responsive (`repeat(auto-fill, minmax(320px, 1fr))`)
- **Spacing scale:** 8px base — 8, 16, 24, 32, 48, 64, 96

### Breakpoints

| Name   | Min Width | Target              |
| ------ | --------- | ------------------- |
| xs     | 0         | Small phones        |
| sm     | 480px     | Large phones        |
| md     | 768px     | Tablets             |
| lg     | 1024px    | Small laptops       |
| xl     | 1280px    | Desktops            |

Mobile-first: base styles target `xs`, then layer up with `min-width` queries.

## Lighting & Effects

### Neon Glow

Soft glow around buttons, icons, headings, and card borders. Implemented via `box-shadow` with accent color at low opacity. Each card can have a different accent glow color for variety.

```scss
// Example: cyan glow card
.card--cyan {
  box-shadow: 0 0 15px rgba(34, 211, 238, 0.2),
              inset 0 0 15px rgba(34, 211, 238, 0.05);
  border: 1px solid rgba(34, 211, 238, 0.3);
}
```

### Background Textures

- **Faint scanlines or grid overlay** on the page background (CSS pseudo-element, very low opacity)
- Adds a subtle CRT / cyberpunk texture without hurting readability

### Gradient Text

Hero name uses the accent gradient as `background-clip: text`:

```scss
.hero__name {
  background: var(--gradient-accent);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

## Hero Section Design

### Layout (Desktop)

```
┌─────────────────────────────────────────────────┐
│  [Background: star field + mountains + parallax] │
│                                                   │
│   🧑‍💻                                       🛸   │
│  (pixel avatar)   TYLER HAWTHORN         (UFO — │
│  [=== platform]   AKA CALCITE             HTML) │
│                   Full Stack Developer            │
│                                                   │
│                     ↓  ↓  ↓  (scroll indicator)  │
└─────────────────────────────────────────────────┘
```

**Current hero elements:**
- Avatar (left, floating animation) on a glowing sci-fi platform (CSS pseudo-element depth effect)
- Name, alias, and title — cyan→pink gradients applied via `background-clip: text`. From the lg breakpoint up the gradient uses `background-attachment: fixed`, so color shifts subtly with scroll; below lg each element carries its own local gradient (vertical on the two-line name, horizontal on alias/subtitle) because fixed attachment muddies mobile text and iOS Safari ignores it
- UFO — HTML `<img>` parked high in the upper-right sky (`top: 4%` at lg, right-edge bleed capped by `max(calc(760px - 50vw), -60px)`), clear of the headline at scroll 0; CSS float + tilt keyframe plus scroll-driven parallax (drifts down 140vh over 200vh scroll); homepage sections establish DOM-order stacking contexts so all later content, including project cards, renders above it
- UFO tractor beam — CSS gradient cone beneath the disc
- Scroll indicator — 3 cascading pink chevrons, fades to `opacity: 0` at 150px scroll via `animation-timeline: scroll(root)`

**Removed in layout-and-design-tweaks:** "HEY, I'M" pre-heading, "Code · Create · Innovate" tagline, "View My Work" CTA button, and the three-card hero navigation strip. The feature cards duplicated the fixed navbar and were intentionally deleted.

### Layout Note

The page is a single-page scroll: Home hero → Projects → About → Skills → Contact. Sections stack vertically; scroll-driven animations apply as each section enters the viewport. Only the hero section is full-viewport (`min-height: 100svh` via the `--full` modifier); content sections size to their content plus section padding so sparse sections don't leave dead voids and the Contact section composes with the footer at scroll-bottom.

### Background Scene (Canvas)

| Element           | Description                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| Star field        | 130 stars (65 reduced), radius 0.4–2.5px, opacity 0.2–0.8, concentrated in upper 85% of canvas. Large stars get cross-sparkle arms. Per-star parallax (0.01–0.04). |
| Cyber mountains   | Perspective-projected FBM terrain with filled faces, wire passes, per-face fog, and a scroll-driven camera. The static fog blend is cached in each face color so the visual treatment needs one face fill instead of two. The mountain canvas is transferred to `MountainRenderer` in a dedicated worker through `MountainWorkerBridge`. It renders site-wide, not only behind the hero. |
| Atmosphere        | Subtle cyan-to-indigo linear gradient haze toward the lower canvas — simulates light scatter.        |
| Horizon glow      | Neon bloom band (cyan → purple) drawn above mountains to simulate atmospheric ridge scatter.         |
| Parallax          | Mountains shift on scroll via `camY = scrollY / 1200` panning.                                      |
| Particles         | Minimal upward-drifting pixel particles (very subtle, 20 default / 8 reduced).                      |

> **Note:** The UFO and Rocket were removed from the canvas in the layout-and-design-tweaks pass. The UFO is now an HTML/CSS element inside `HeroComponent` (see Hero Section Design below). The rocket is planned for Phase 8 (Easter Eggs) as a controllable element.

### Pixel-Art Avatar

- Tyler sitting with a laptop
- Optional idle animation (typing, blinking)
- Positioned left of the hero text on desktop, above on mobile

## Component Visual Specs

### Navbar

- Fixed to top, semi-transparent `#0B0F1A` with `backdrop-filter: blur(12px)`
- Small pixel-style icons on the left (branding)
- Nav links (left-to-right): Projects, About, Skills, Contact — rendered as `<button>` elements (not `<a>` tags); clicking scrolls to the matching section; active state highlights the button for the section currently in view
- Hover: glow + color shift, underline animation or pixel highlight
- Mobile: hamburger → slide-in drawer

### Removed Hero Feature Cards

The earlier **About Me**, **Latest Projects**, and **My Skills** hero cards were removed in the layout-and-design-tweaks pass. Do not reintroduce them without a new product decision; fixed navigation and the natural section order now provide that function.

### Project Cards

- Dark surface background, rounded corners (12px)
- Thumbnail/preview at top — fixed 200px-high wrapper with a dark fallback background so a missing asset never collapses the card; current art is per-project placeholder SVGs in each project's glow color under `public/assets/images/`
- Title, description, tech tags below
- The title is a stretched `routerLink` anchor (an `::after` overlay covers the card), so clicking anywhere on the card opens `/projects/:slug`; Live Demo / GitHub pills sit above the overlay on their own z-index and keep working independently
- Keyboard: the stretched link shows a cyan focus-visible ring around the whole card
- Hover: lift + neon border glow

### Buttons and Link CTAs

- Filter pills, project links, and the contact email CTA use compact rounded neon treatments.
- Hover states should intensify borders/glow without overwhelming adjacent text.
- Pressed state: motion-safe `scale(0.96–0.98)` compression on filter pills, card links, detail links, and the email CTA.
- Keyboard focus: a global cyan `:focus-visible` outline covers every focusable control; components with bespoke treatments (social icons, stretched card links) override locally.
- The filter bar collapses to one horizontally scrollable row with a trailing-edge fade mask below the md breakpoint; from md up it wraps normally.

### Footer

- Minimal by design: a centered copyright line with the "Built with Angular" note, and nothing else
- Deliberately carries **no** social icons. The footer sits directly beneath the Contact section at scroll-bottom, so rendering `SocialLinksComponent` in both produced two near-identical icon rows within one screen. The Contact section owns the social row because email + social links are its defined purpose; the footer stays a thin closing rule.
- Trade-off: `/projects/:slug` therefore shows no social links. Detail pages keep their own project Live Demo/GitHub anchors, and the navbar Contact link returns to the row on `/`.
- Not fixed — sits at bottom of content

## Animation Guidelines

### Durations

- Micro-interactions (hover, click): 150–300ms
- Scroll reveals: scroll-position-linked (not time-based) — animation progress maps directly to scroll position via `animation-timeline: view()`, bounded to a maximum scroll distance (see [Scroll Reveal Range](#scroll-reveal-range))
- Background elements (star twinkle, avatar float): continuous, slow (2–5s loops)

### Hero CSS Animations

| Animation            | Duration | Notes                                                                         |
| -------------------- | -------- | ----------------------------------------------------------------------------- |
| `avatar-float`       | 3s       | 8px vertical bob, `ease-in-out infinite`                                      |
| `ufo-float`          | 7s       | ±14px vertical + ±2° tilt, `ease-in-out infinite`                            |
| `ufo-parallax`       | scroll   | `animation-timeline: scroll(root)`, range 0–200vh; translates UFO 140vh down |
| `scroll-pulse`       | 2.5s     | 3 staggered chevrons (0s / 0.35s / 0.7s delay); neon pink glow at 50%        |
| `scroll-indicator-fade` | scroll | `animation-timeline: scroll(root)`, range 0–150px; fades indicator opacity 1→0 |

### Scroll Reveal Range

`.scroll-reveal` (applied by `ScrollRevealDirective`) runs `scroll-reveal-slide` on a `view()` timeline. A `view()` timeline defines its `entry` range as **exactly the subject's own height**, so percentage-only offsets stretch the reveal in proportion to the element — and for any subject taller than the viewport, `entry 100%` (the subject's bottom edge reaching the viewport bottom) can only occur after its top has already scrolled off screen. The project grid is ~970px at desktop and ~2280px at mobile widths, so it never finished revealing while still in view.

The range is therefore capped in absolute scroll distance, using tokens in `_variables.scss`:

```scss
animation-range: entry min(20%, $scroll-reveal-max-delay) entry min(100%, $scroll-reveal-max-distance);
```

| Token | Value | Role |
| --- | --- | --- |
| `$scroll-reveal-max-delay` | `40px` | Caps the dead zone before the fade starts (otherwise 20% of the subject's height) |
| `$scroll-reveal-max-distance` | `400px` | The reveal is always complete by this far into `entry` |

The two caps engage at different heights: `min(100%, 400px)` is a no-op below 400px, while `min(20%, 40px)` is a no-op below 200px (under which 20% of the height is already less than 40px). Every subject on the page sits outside that 200–400px band — the filter bar, skills groups, and contact block are all under 150px; the project grid and About content are both over 400px — so **short subjects keep their original height-proportional timing**, which already completed as they became fully visible, and only the grid and About content are clamped. A subject landing between 200px and 400px would simply begin its fade slightly earlier than before, which is harmless.

Note that `min()` must be written with Sass interpolation (`#{$token}`) so it compiles to a CSS `min()` rather than Sass's own, which rejects mixed `%`/`px` units.

### Easing

- Entrances: `cubic-bezier(0.16, 1, 0.3, 1)` (smooth deceleration)
- Hovers: `ease-out`
- Background: `ease-in-out` for looping floats

### Motion Principles

- Smooth, not overwhelming — prioritize clarity
- Respect `prefers-reduced-motion` — CSS animations are disabled by media-query fallbacks, and the canvas scene renders a still frame (frozen twinkle/particles) that redraws only on scroll so parallax still tracks the user's own gesture
- The canvas rAF loop pauses on `visibilitychange` while the tab is hidden and resumes on return
- Use `transform` and `opacity` only (GPU-composited)
- Reduce background complexity on small screens and low-power devices
- Scroll reveal animations use CSS `animation-timeline: view()` — they are scroll-position-linked and naturally reverse on scroll-up. A `@supports` fallback ensures content is always visible in older browsers. Their range is capped so a subject's reveal pace does not scale with its height; see [Scroll Reveal Range](#scroll-reveal-range).

## Responsive Strategy

### Mobile Adjustments

- Hero: stack avatar above text, full-width
- Background scene: simplify or disable heavy canvas elements
- Navbar: hamburger menu with slide-in drawer
- Reduce glow intensity to save battery on OLED screens

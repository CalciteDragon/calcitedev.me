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
| Hero name       | `clamp(3rem, 8vw, 7rem)` | 700    | Cyan→pink fixed-bg gradient, `background-clip: text` |
| Hero alias      | `clamp(1rem, 2.5vw, 1.75rem)` | 600 | Same gradient as name                            |
| Hero subtitle   | `clamp(1rem, 2vw, 1.375rem)` | 400  | Same gradient as name                            |
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
- Name, alias, and title — all use a cyan→pink `background-attachment: fixed` gradient applied via `background-clip: text`
- UFO — HTML `<img>` with CSS float + tilt keyframe + scroll-driven parallax (drifts down 140vh over 200vh scroll)
- UFO tractor beam — CSS gradient cone beneath the disc
- Scroll indicator — 3 cascading pink chevrons, fades to `opacity: 0` at 150px scroll via `animation-timeline: scroll(root)`

**Removed in layout-and-design-tweaks:** "HEY, I'M" pre-heading, "Code · Create · Innovate" tagline, "View My Work" CTA button, and the three-card hero navigation strip. The feature cards duplicated the fixed navbar and were intentionally deleted.

### Layout Note

The page is a single-page scroll: Home hero → Projects → About → Skills → Contact. Sections stack vertically; scroll-driven animations apply as each section enters the viewport.

### Background Scene (Canvas)

| Element           | Description                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| Star field        | 130 stars (65 reduced), radius 0.4–2.5px, opacity 0.2–0.8, concentrated in upper 85% of canvas. Large stars get cross-sparkle arms. Per-star parallax (0.01–0.04). |
| Cyber mountains   | Perspective-projected FBM terrain with filled faces, wire passes, per-face fog, and a scroll-driven camera. The mountain canvas is transferred to `MountainRenderer` in a dedicated worker through `MountainWorkerBridge`. It renders site-wide, not only behind the hero. |
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
- Thumbnail/preview at top
- Title, description, tech tags below
- Hover: lift + neon border glow
- Links to live demo and GitHub

### Buttons and Link CTAs

- Filter pills, project links, and the contact email CTA use compact rounded neon treatments.
- Hover states should intensify borders/glow without overwhelming adjacent text.
- Pressed-state compression and a unified button interaction system remain Phase 7 work.

### Footer

- Centered social icons: GitHub, Discord, LinkedIn
- Icons glow on hover (each with its own accent color)
- Minimal: copyright line, "Built with Angular" note
- Not fixed — sits at bottom of content
- Current footer anchors still use placeholder `href="#"` values and must be wired before launch.

## Animation Guidelines

### Durations

- Micro-interactions (hover, click): 150–300ms
- Scroll reveals: scroll-position-linked (not time-based) — animation progress maps directly to scroll position via `animation-timeline: view()`
- Background elements (star twinkle, avatar float): continuous, slow (2–5s loops)

### Hero CSS Animations

| Animation            | Duration | Notes                                                                         |
| -------------------- | -------- | ----------------------------------------------------------------------------- |
| `avatar-float`       | 3s       | 8px vertical bob, `ease-in-out infinite`                                      |
| `ufo-float`          | 7s       | ±14px vertical + ±2° tilt, `ease-in-out infinite`                            |
| `ufo-parallax`       | scroll   | `animation-timeline: scroll(root)`, range 0–200vh; translates UFO 140vh down |
| `scroll-pulse`       | 2.5s     | 3 staggered chevrons (0s / 0.35s / 0.7s delay); neon pink glow at 50%        |
| `scroll-indicator-fade` | scroll | `animation-timeline: scroll(root)`, range 0–150px; fades indicator opacity 1→0 |

### Easing

- Entrances: `cubic-bezier(0.16, 1, 0.3, 1)` (smooth deceleration)
- Hovers: `ease-out`
- Background: `ease-in-out` for looping floats

### Motion Principles

- Smooth, not overwhelming — prioritize clarity
- Respect `prefers-reduced-motion` — disable non-essential animations
- Use `transform` and `opacity` only (GPU-composited)
- Reduce background complexity on small screens and low-power devices
- Scroll reveal animations use CSS `animation-timeline: view()` — they are scroll-position-linked and naturally reverse on scroll-up. A `@supports` fallback ensures content is always visible in older browsers.

## Responsive Strategy

### Mobile Adjustments

- Hero: stack avatar above text, full-width
- Background scene: simplify or disable heavy canvas elements
- Navbar: hamburger menu with slide-in drawer
- Reduce glow intensity to save battery on OLED screens

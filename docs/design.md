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
| Hero name       | — (raster art)           | —      | Not type: the `hero-title.webp` neon-sign image inside the `h1`. `width: min(100%, 560px)`, `min(100%, clamp(560px, 60vw, 930px))` ≥ lg |
| Hero alias      | `clamp(1rem, 2.5vw, 1.75rem)` | 600 | Solid `$accent-cyan` with a low two-stop halo; `letter-spacing: 0.08em`. Sits in the `.hero__tagline` panel |
| Hero subtitle   | `clamp(1rem, 2vw, 1.375rem)` | 400  | Solid `$accent-cyan` with the same halo (9.5:1 on the page background). Sits in the `.hero__tagline` panel |
| H2 (Section)    | 2rem–2.5rem              | 700    | Section headings                                   |
| H3 (Card title) | 1.25rem                  | 600    | Card headings                                      |
| Body            | 1rem                     | 400    | Line height 1.6                                    |
| Small / Label   | 0.875rem                 | 500    | Tags, captions                                     |
| Pixel text      | 0.75rem–1rem             | 400    | `Press Start 2P`, used sparingly                   |

Use `clamp()` for fluid typography on mobile.

## Layout

### Grid System

- **Max content width:** 1200px, centered. The hero is the one exception: from xl up it widens to 1400px so the neon sign has room beside the avatar
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

The hero no longer uses gradient text anywhere. The name is the neon-sign raster, and the alias and subtitle are lit tubes (see Hero Section Design) — `-webkit-text-fill-color: transparent` and `text-shadow` are mutually exclusive, since a transparent glyph has nothing to bloom off, so a glow that matches the sign requires solid color:

```scss
@mixin hero-neon-text($color) {
  color: $color;
  text-shadow:
    0 0 8px rgba($color, 0.32),   // tight bloom
    0 0 22px rgba($color, 0.12);  // faint spill
}
```

The halo is deliberately weak. The sign is the only element in the hero that should read as actually emitting light; the subtext only needs to look lit by the same room. It resolves to `none` under `prefers-reduced-motion: reduce`.

Gradient text via `background-clip: text` remains available as the `gradient-text` mixin in `_glow.scss` for other sections.

## Hero Section Design

### Layout (Desktop)

```
┌─────────────────────────────────────────────────┐
│  [Background: star field + mountains + parallax] │
│                                                   │
│   🧑‍💻                                       🛸   │
│  (pixel avatar)  [TYLER HAWTHORN sign]   (UFO — │
│  [=== platform]    │ AKA CALCITE          HTML) │
│                    │ Full Stack Developer        │
│                                                   │
│                       ↓  (scroll indicator)      │
└─────────────────────────────────────────────────┘
```

**Current hero elements:**
- Avatar (left, floating animation) on a glowing sci-fi platform (CSS pseudo-element depth effect)
- Name — `public/assets/images/hero-title.webp`, a 1400×467 photographic neon sign reading TYLER HAWTHORN (cyan top line, pink bottom line) on a transparent background. It sits as an `<img>` inside the `h1`, with `alt` bound to `bio().name` so the accessible name still comes from the data layer, and `fetchpriority="high"` because it is the hero LCP element. The art carries its own glow, so `.hero__name` applies no gradient or text fill — it is only a flex box that centers below lg and left-aligns from lg up. Negative block margins pull the tagline panel back toward the visible tubing, since the source art bleeds glow to its own edges. Sizing is wrapped in `min(100%, …)` so the sign can ask for more width than the flex column has and simply take whatever is available — that guard is what keeps it from overflowing at lg, where the column is narrowest relative to the request
- Alias and title — cyan→pink gradients applied via `background-clip: text`. From the lg breakpoint up the gradient uses `background-attachment: fixed`, so color shifts subtly with scroll; below lg each element carries its own local horizontal gradient because fixed attachment muddies mobile text and iOS Safari ignores it
- Tagline (`.hero__tagline`) — alias and subtitle share a wrapper that carries no plate at all: no background, border, backdrop filter, or shadow. From lg up it is indented `$space-6` from the column edge and marked by a single 2px hairline rule on its left, fading to transparent at both ends so it reads as an edge the copy hangs off rather than as a drawn graphic. Below lg the copy is centered and the rule is not generated — the `content` property lives inside the `lg` query, so there is no pseudo-element on mobile rather than a hidden one. The wrapper's remaining jobs are the flex `gap` between the two lines and the indent itself
- Subtext color — both lines are `$accent-cyan`. The earlier cyan/pink split echoed the sign's two-line colouring but read as two unrelated captions; a single tube colour lets the alias and subtitle read as one block of secondary copy hanging off the hairline rule, and leaves pink to the sign itself. Both carry the `hero-neon-text` halo, which collapses to a single soft stop under `prefers-reduced-motion: reduce`
- UFO — HTML `<img>` parked high in the upper-right sky (`top: 4%` at lg, right-edge bleed capped by `max(calc(760px - 50vw), -60px)`), clear of the headline at scroll 0; CSS float + tilt keyframe plus scroll-driven parallax; homepage sections establish DOM-order stacking contexts so all later content, including project cards, renders above it
- UFO depth treatment — the craft sits on a distant plane, sold by four cues used together: reduced size (170px, 215px at lg, down from 250/325), atmospheric perspective on the whole element (`filter: blur(0.55px) saturate(0.84) contrast(0.86)` at `opacity: 0.88` — the sub-pixel blur matters most, since crisp pixel edges always read as near), a two-part fog overlay, and near-viewport-locked parallax (see the animation table). `contrast()` is used deliberately in place of `brightness()`: haze *lifts* blacks toward the sky colour, whereas dimming crushes them and reads as a turned-down lamp. Note the `filter` makes `.hero__ufo` a stacking context; it still sits below later sections by DOM order
- UFO fog overlay — two pseudo-elements, both radial in paint *and* mask so neither has an edge of its own. `::after` is the disc-only vignette in background navy (`rgba(11, 15, 26, 0.13)` → `0.46`). `::before` is the distance fog across disc *and* beam — a pale sky-blue (`rgba(146, 178, 216, ~0.13)` → `0.05`), not the background navy, because aerial perspective washes distant objects *toward* the sky rather than darkening them; without it the beam would stay foreground-bright while the disc receded. Both layers mask with `radial-gradient(ellipse 50% 50% at 50% 50%, black N%, transparent 100%)`. The explicit `50% 50%` radii are load-bearing: a radial-gradient defaults to `farthest-corner` sizing, so the ellipse extends past the box, the fade never finishes inside it, and the layer terminates mid-ramp along all four edges as a visible rectangle. Only the fog's *paint* is biased upward toward the disc — an off-centre mask cannot reach zero on its near side without collapsing on the far one
- UFO tractor beam — CSS gradient cone beneath the disc, sized to match the disc (170×280, 215×370 at lg) at `opacity: 34%`
- Scroll indicator — a single 28×28px `$accent-cyan` chevron at 3px stroke. The previous three-chevron cascade was the loudest thing in the lower half of the hero and competed with the sign; one mark at the same size still reads as a pointer, and cyan keeps pink reserved for the sign. Fades to `opacity: 0` at 150px scroll via `animation-timeline: scroll(root)`

**Removed in layout-and-design-tweaks:** "HEY, I'M" pre-heading, "Code · Create · Innovate" tagline, "View My Work" CTA button, and the three-card hero navigation strip. The feature cards duplicated the fixed navbar and were intentionally deleted.

### Layout Note

The page is a single-page scroll: Home hero → About → Projects → Extras → Contact. Sections stack vertically; scroll-driven animations apply as each section enters the viewport. Only the hero section is full-viewport (`min-height: 100svh` via the `--full` modifier); content sections size to their content plus section padding so sparse sections don't leave dead voids and the Contact section composes with the footer at scroll-bottom. The page-end pixel dissolve overlaps the end of the Contact section and runs into the footer, adding roughly 210px of net closing scroll (see [Page-End Pixel Dissolve](#page-end-pixel-dissolve)).

### Background Scene (Canvas)

| Element           | Description                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| Star field        | 130 stars (65 reduced), radius 0.4–2.5px, opacity 0.2–0.8, concentrated in upper 85% of canvas. Large stars get cross-sparkle arms. Per-star parallax (0.01–0.04). Positions come from a seeded PRNG (`seeded-random.ts`), so the same sky is drawn on every page load and after every resize re-seed. Star coordinates are normalized to the viewport, so they scale with width rather than cropping. |
| Cyber mountains   | Perspective-projected FBM terrain with filled faces, wire passes, per-face fog, and a scroll-driven camera. The static fog blend is cached in each face color so the visual treatment needs one face fill instead of two. The mountain canvas is transferred to `MountainRenderer` in a dedicated worker through `MountainWorkerBridge`. It renders site-wide, not only behind the hero. |
| Atmosphere        | Subtle cyan-to-indigo linear gradient haze toward the lower canvas — simulates light scatter.        |
| Horizon glow      | Neon bloom band (cyan → purple) drawn above mountains to simulate atmospheric ridge scatter.         |
| Terrain seed      | `MountainConfig.terrainSeed` offsets the hash-noise phase and pins one specific mountain range. `0` is the shipped range; changing it rerolls the terrain and forces a full grid rebuild. |
| Narrow viewports  | The horizontal projection scale is locked to `PROJECTION_REFERENCE_WIDTH` (1920 CSS px). Below that width the range keeps its 1080p pixels-per-world-unit and is cropped symmetrically at the left and right edges instead of being compressed into a narrower box; above it the projection widens with the viewport as before. Vertical scale still follows viewport height. |
| Parallax          | Mountains shift on scroll via `camY = scrollY / 1200` panning.                                      |
| Particles         | Minimal upward-drifting pixel particles (very subtle, 20 default / 8 reduced). Starting positions are seeded from a distinct seed; off-screen respawns stay random. |

> **Note:** The UFO and Rocket were removed from the canvas in the layout-and-design-tweaks pass. The UFO is now an HTML/CSS element inside `HeroComponent` (see Hero Section Design below). The rocket is planned for Phase 8 (Easter Eggs) as a controllable element.

### Pixel-Art Avatar

- Tyler sitting with a laptop
- Optional idle animation (typing, blinking)
- Positioned left of the hero text on desktop, above on mobile

## Component Visual Specs

### Navbar

- Fixed to top, semi-transparent `#0B0F1A` with `backdrop-filter: blur(12px)`
- Brand lockup on the left — the supplied transparent faceted-C PNG rendered in a 38px square directly against the `ALCITEdev.me` text, so the mark reads as the first letter of `calcitedev.me`. The artwork carries the site's cyan, deep-blue, and pink palette in its own crystalline facets. `ALCITE` is Space Grotesk 700 at `1.375rem` with `0.16em` tracking so its cap height stays proportionate to the mark; the full `dev.me` suffix is JetBrains Mono at `0.7em` in `--text-secondary`
- Brand hover — the lockup *brightens* with stronger cyan/blue drop-shadows and the `.dev` suffix turns cyan rather than fading; the old `opacity: 0.8` hover made the logo read as disabled. Focus-visible gets the same treatment
- Nav links (left-to-right): About, Projects, Extras, Contact — rendered as `<button>` elements (not `<a>` tags); clicking scrolls to the matching section; active state highlights the button for the section currently in view
- Hover: glow + color shift, underline animation or pixel highlight
- Mobile: hamburger → slide-in drawer

### Removed Hero Feature Cards

The earlier **About Me**, **Latest Projects**, and **My Skills** hero cards were removed in the layout-and-design-tweaks pass. Do not reintroduce them without a new product decision; fixed navigation and the natural section order now provide that function.

### About Story Timeline

- The About section immediately follows the hero and begins with one prominent intro card. Its copy is slightly larger than the history copy and limits emphasis to the site's cyan/pink identity colors.
- `// My history` introduces a terminal-style production command, followed by four compiler stages: Source Parsing, AST Construction, Bytecode Generation, and JIT Optimization.
- The history palette follows one intentional cold-to-warm progression: cyan → blue → violet → pink. Every chapter owns one accent; its heading, emphasized phrases, links, edge, and node all use that color rather than mixing accents inside a card.
- The component measures each chapter during passive, animation-frame-coalesced scroll updates. Card perspective tilt follows chapter position against a fixed activation line 40% up from the viewport bottom (60% from the top).
- The rail's glowing fill/head starts when node 01's center crosses 60% of the viewport height, so it opens at the same on-screen point on a 1080p and a 1440p display. It finishes at a fixed 46% of total page scroll, independent of the About section's own progress. Because the page's full-height sections make document height grow with the viewport, maximum page scroll is effectively viewport-invariant, so both displays saturate at the same scroll offset. The consequence of mixing a viewport-relative start with a document-relative end is that the fill rate between those two points differs slightly by display height. The target follows frame-rate-independent exponential damping with a 90ms time constant. The rail's physical endpoints and gradient color stops are measured from the numbered nodes, and the single active chapter follows the node closest to the same smoothed rail head. This keeps the head, color, and number glow synchronized without stacking CSS transitions. Hover does not change card tilt, borders, nodes, or timeline glow.
- In development mode, `?aboutDebug=scroll` (or `#aboutDebug=scroll`) shows a compact fixed scroll-tuning HUD with page pixels/percentage, About-section progress, unclamped rail-cursor percentage, clamped target, smoothed glow progress, active chapter, and configured bounds. Normal development URLs hide it, and it is always absent from production builds.
- A faint rail gradient keeps later-stage colors visible ahead of the active fill. The rail intentionally stops cleanly at the center of node 04, with no decorative tail or fade below the final number; this approved treatment keeps the timeline visually contained by its numbered endpoints.
- Scroll reveal applies only to the prominent intro card. The history heading and all four chapters render immediately without reveal animation.
- History text remains visible in full. There are no accordions, carousels, tabs, or hidden-content controls. Only contextual text links and the inline FIRST clarification are interactive/content accents.
- Desktop uses wide readable chapter panels. Mobile moves the rail toward the left edge, allows the terminal command and long URLs to wrap, and gives the chapter copy the remaining width.
- `prefers-reduced-motion` disables the terminal cursor blink and card tilt, hides the moving rail head, renders the rail fully filled, and bypasses JavaScript damping so timeline state snaps directly to its target.

### Project Showcase

- The section uses one **focus stage** followed by a `// PROJECT INDEX`; there are no filters or detail-page transitions.
- Every focus article occupies the same CSS grid cell. Inactive articles stay in grid sizing but are hidden, inert, and removed from the accessibility tree. The stage therefore reserves its tallest content height and selection never shifts the index or later sections.
- Desktop focus layout is a 7/5 media-detail split with a stable 30rem minimum height and 16px radius. Below the lg breakpoint it stacks; media is reserved at 16:9 so artwork never collapses or crops into an arbitrary tall box.
- The active project controls its existing cyan/blue/purple/pink/gold accent through CSS custom properties. Accent affects corner brackets, border, status dot, metadata, and CTAs while the body remains an opaque readable surface over the mountain canvas.
- Detail hierarchy: project number, status, eyebrow, title, researched long description, technology tags, then available repository/live actions. Projects without public links show a quiet `Building in private` state.
- The focus image has meaningful alt text. Repository/live actions explicitly announce that they open a new tab and retain 44px touch targets.
- Circular previous/next **carousel arrows** sit outside the pane, not over its media, so they read as movement between projects rather than a control belonging to the project on screen. They are 2.75rem accent-bordered discs on a near-opaque dark surface with a soft drop shadow, filling with the project accent on hover/focus. From `md` they flank the stage in the gutters, vertically centred; below `md` they become a pager row above the stage, aligned to the card's outer edges so they stay visible when the section is first reached instead of sitting past a tall card. They wrap in both directions, take the selected project's accent, name their destination project in the accessible label, and step selection without moving focus, so repeated presses keep working and the live region still announces each change.
- Every project except Calcite Portfolio now uses a real capture rather than SVG art — a live match board on `#F8FAFC`, the capstone AWS architecture diagram on white, a shop-floor robot build photo, a Studio viewport of the obstacle course, an in-game platformer frame, and a rendered Minecraft library scene. They read as genuine product and engineering artifacts against the dark stage. The two light ones sit noticeably brighter than the surrounding cards; the Mochi photo, padded with `--bg-primary`, sits comfortably in the dark grid. The Black and White capture is the darkest asset in the grid — its near-black background merges with the stage, so the white platforms and the small cyan particle burst carry the whole composition and the cyan accent reads as part of the game rather than as chrome. The Hide & Seek render is the warmest and most saturated asset, and its letterbox padding is `--bg-primary` so the render appears to float in the stage rather than sit in a black box; the diamond armour and goggle lenses happen to land near the project's own blue accent, while its torch and lantern light are the warmest note in the section. The one remaining piece of original 640×360 SVG art is the finite recursive portfolio window.
- The recursive portfolio preview is intentionally finite SVG artwork, not an iframe: browser windows nest a few levels and end in a `YOU ARE HERE` label.

### Project Selector

- Preview tiles are real `<button type="button">` controls with `aria-pressed`, `aria-controls`, and a project-specific accessible name. External links never nest inside them.
- Each preview has its own `ScrollRevealDirective` wrapper, so cards reveal as their row enters without the scroll animation overriding the button's hover/press transforms.
- The selected state adds an `ACTIVE` marker plus accent border/inset glow, so it is not communicated by color alone. Border width does not change and the data order never changes.
- At 1024px and above, previews form four equal columns; from 480–1023px they use two columns. Below 480px they become compact horizontal cards with a 7rem visual and title/status body, avoiding a second long wall of full-size cards.
- Desktop/tablet previews include three curated keywords. The smallest layout suppresses them to protect title readability.
- Selecting a preview updates the focus stage with no route change. If the updated stage is outside the viewport it scrolls beneath the fixed navbar; keyboard activation focuses the active article, and a polite live region announces the change.
- Preview thumbnails carry a **CRT scanline overlay** — a 4px `repeating-linear-gradient` at 0.3 black, layered above the image and below the number/`ACTIVE` badges. It is deliberately scoped to the index tiles: they read as small standby monitors while the focus stage stays a clean, full-fidelity view of the selected work. Hover, focus, and the active state ease the overlay from 0.85 to 0.5 opacity alongside the existing saturation/brightness lift, so the tile appears to sharpen as it powers up.

### Extras Platformer

- The former Skills grid is intentionally removed. Project tags/descriptions retain the professional capability signal; Extras uses that space for personal, tactile evidence of making things.
- An open 1880×820 DOM/CSS world places three broad monitors directly over the site's existing mountain-and-stars background: gold Capstone Summit, cyan Keyboard Cove, and pink Robotics Outpost. There is no enclosing game window, HUD bar, local sky, destination navigation, horizontal crop, or side-scrolling camera. The monitor top edges are the island collision surfaces, and a 38×48 hero-inspired pixel explorer stands and jumps directly on the screens. Its six-pose SVG strip keeps the hero's swept brown hair, square glasses, blue headphones, dark hoodie, and cyan-blue shoes readable at the level's scaled desktop size; idle, four-frame walking, crouch, and airborne poses share the same unchanged collision box.
- Every monitor has rounded corners, a dark bezel, and a non-interactive scanline overlay. Redundant topic/status text above the media, caption/counter text below it, and the visible teleport prompt are omitted because the island copy and click behavior already identify the content. Multi-item galleries expose only circular previous/next arrows over the media. Those arrows remain above the inactive pane's teleport overlay so their accent hover state and direct controls always work; using one on an inactive island both changes the record and teleports to activate that island. Mochi uses the canonical source sequence IMG_2 → IMG_1 → competition video → IMG_4 → IMG_3 for all forward movement. The active island intensifies its accent border/glow without adding more pane chrome; the rest of an inactive pane remains a full-surface teleport button with an accessible label.
- Each monitor also has a small bottom-right expand control; it activates/teleports to that island and opens the same media in a large, viewport-centered pop-out with a stable 16:9 media frame, pop-out-specific contain-fitting (including letterboxed 4:3 sources) so every carousel image remains fully visible, its carousel arrows, and a top-right close button. The pop-out uses a page-wide dark scrim, locks page scrolling with an overflow-only document lock that leaves the current scroll position unchanged, keeps a subdued scanline texture, uses a low-opacity cyan outline, and uses a matching low-opacity cyan close control. Pointer clicks on any Extras control release focus so game keypresses do not leave a button highlighted, while keyboard focus remains visible for keyboard activation.
- The explorer starts 58px inside the left edge of the middle Keyboard island while all three monitors remain in `STANDBY`. Arrow input can move the explorer without beginning media playback. The first W, A, S, or D press activates whichever platform currently supports the explorer and dismisses the onboarding hint; afterward, ordinary landings activate islands normally. Pointer activation is independent of that keyboard onboarding state.
- Galleries never advance on a timer. Slides move only when the visitor moves them, through one of three deliberate controls: the circular cursor arrows on the monitor, the pop-out arrows, or the explorer landing on a slide pad. Nothing changes while the visitor reads.
- Every island with more than one slide wears a pair of analog previous/next pushbuttons on its monitor. Each is a dark housing seated flush on the monitor's top edge with an accent-tinted cap that carries the island's own colour — gold on Capstone Summit, pink on Robotics Outpost. Keyboard Cove holds one video, so it wears none. The pair is centred over the monitor with a 48px gap, wide enough for the explorer to drop cleanly between them onto the screen below.
- The pads are real platforms: one-way top collision like the neutral ledges, so the explorer passes through them while walking and can only land on one from above. Landing pushes the cap 7px down into its housing, easing it down over 220ms rather than snapping, so the explorer is seen pressing the button rather than teleporting it to the bottom; that is exactly one slide per landing. Holding still on a pressed pad neither repeats the slide nor lets the island time out, because a pad counts as its own island's support. Jumping off springs the cap back over 220ms; the next landing advances again. A cursor click on a pad does the same thing and depresses the cap for 180ms.
- Activating an island lifts the monitor, collision surface, its slide pads, and its visible label/title/description together by 8px. Activation persists for one second after the explorer leaves, so normal jumps do not flicker the island state. A real YouTube video is inserted only while its video record is active and starts muted through the privacy-enhanced embed; leaving long enough to deactivate destroys the iframe and stops playback. A media record may provide an initial timestamp, with saved whole-second playback progress taking priority on later activations. The Robotics Outpost video starts at 3:03:36.
- The four Mochi competition photos and five Pineapple Expense capstone photos are optimized JPEG assets; the portrait Mochi source is cropped to the pane's landscape ratio while preserving the three foreground teammates, and the supplied Pineapple PDF is rendered as the third carousel image.
- The game is enhancement, not a content gate. At desktop widths, page-level WASD/arrow listeners keep movement working after teleporting or clicking elsewhere on the page; editable fields are left alone. There are no visible direction or jump buttons. Users can click anywhere outside the gallery arrows on an inactive monitor to teleport directly onto and activate it without moving focus. This pointer activation deliberately leaves the `try WASD` speech bubble visible; the hint disappears permanently for the component session only after the first W, A, S, or D press.
- All three island labels, titles, and descriptions remain visible above their monitors so the full horizontal composition reads at a glance. The active topic lifts that copy with its monitor and increases its opacity and glow without hiding the other destinations.
- The complete desktop level scales uniformly to the available content width, preserving the 1880px physics coordinate space while keeping every island visible at once. Falling below the world respawns at the last active island.
- Below the 1080px component-width threshold, the game is replaced by three vertically stacked media panes in Capstone, Keyboard, Robotics order. The explorer remains above the stack with the speech bubble `Try this on desktop — or make your window wider.`; the fallback exposes normal media/gallery controls but no application role, movement controls, camera, or horizontal scrolling.
- `prefers-reduced-motion` holds the explorer on a still sprite frame and disables the speech-bubble entrance, copy emphasis, and slide-pad travel transitions. User-driven desktop movement, facing, crouch/jump pose changes, click-to-teleport, slide pads, gallery arrows, and video controls remain available; because nothing advances on a timer, there is no automatic motion left to suppress.

- Supplemental jump platforms use compact neon ledges and one-way top collision. They support normal movement without activating a topic. If the explorer leaves an island and lands on a neutral ledge during the one-second grace period, the previous island still deactivates because activation follows the actual supporting island rather than grounded state alone.
- The level editor is a development tool, not public page chrome. It appears only in an Angular development build at `http://localhost:4200/?extrasDebug=level#extras`. Its compact dark terminal panel uses normal buttons, a labeled element selector, numeric geometry fields, clear selected-element outlines, and a polite status region rather than relying on drag interaction or accent color alone.
- Edit mode pauses player physics and media-pane interaction. The three media islands may be selected, dragged, or nudged but cannot be deleted, duplicated, or resized. Supplemental platforms may be added, dragged, resized through numeric fields, duplicated, or deleted. Ten-pixel snapping is enabled by default, with undo/redo and reset controls for safe iteration.
- Playtest mode hides editing handles, resets the explorer to the draft spawn, and runs the same movement, collision, activation, and respawn behavior used by the ordinary platformer. Returning to Edit preserves draft geometry.
- Editor changes recover from versioned browser `localStorage`; this recovery state never changes the ordinary site. **Copy config** and **Download** emit the complete TypeScript source for `extras-level.data.ts`, which must replace the canonical file and be committed to publish the layout permanently.
- Below the 1080px component threshold, the standard stacked media fallback remains intact. The debug panel adds a notice that dragging and Playtest require a wider section, while preserving the current draft across the breakpoint.

### Buttons and Link CTAs

- Project links, project selector buttons, Extras gallery/teleport controls, and the contact channel rows use compact neon treatments.
- Hover states should intensify borders/glow without overwhelming adjacent text.
- Pressed state: motion-safe `scale(0.96–0.985)` compression on selector buttons, project links, and contact channel rows.
- Keyboard focus: a global cyan `:focus-visible` outline covers every focusable control; selector buttons use their project accent and social icons keep their bespoke treatment.
- Pointer focus release: every Extras platformer control (gallery arrows, analog pads, teleport overlay, expand) blurs itself on a pointer click via `shared/utils/pointer-focus.ts`. Without it the browser keeps the clicked button focused and the next WASD press flips its `:focus-visible` heuristic on, ringing a button the player is no longer using. Keyboard activation (`detail === 0`) keeps focus so tab order is unaffected.
- No native tooltips on section headings: `app-section-header` strips the stray `title` attribute that static template binding leaves on its host, so hovering a section title shows nothing.

### Contact Channel List

The Contact section renders one list, not an email CTA plus a separate icon row. The standalone bordered email button and the bare social-icon row were both replaced because they read as two unrelated controls stacked on one screen.

- One row per channel, in order: Email, GitHub, Discord, LinkedIn. Email is a `mailto:` row built from `bioData.email`; the rest come from `socialLinksData`.
- Row grid is `icon | platform label | handle`. The label track is a fixed `5rem`, so every handle starts at the same x — a ragged handle column reads as four unrelated links rather than one list.
- Platform label: 0.7rem, uppercase, `0.12em` tracking, `--text-secondary`. Handle: JetBrains Mono 0.9rem, `--text-primary`.
- Each row carries its platform accent as `--link-color` / `--link-color-rgb` design tokens: Email → gold, GitHub → cyan, Discord → blue, LinkedIn → purple. Hover tints the icon and handle to that accent, lifts the row 2px, and adds a matching border and 18px glow.
- List width is `min(100%, 30rem)`, centered. Below 480px the uppercase label is dropped so the monospace handle keeps one line.
- `SocialLinksComponent` still supports the original bare-icon `row` layout; the list is the `list` layout. `mailto:` rows deliberately omit `target="_blank"`, and rows with a visible name omit the redundant `aria-label`.
- Handles and URLs are the confirmed live profiles: `calcitedragon@gmail.com`, GitHub `@CalciteDragon`, Discord `@calcitedragon`, LinkedIn `in/tyler-hawthorn-58259a355` (displayed as `in/tyler-hawthorn` for readability).

### Page-End Pixel Dissolve

The bottom of the page disintegrates into black rather than simply ending, and the copyright rides out the far end of it.

- Sits between `<main>` and the footer as the second-to-last element of `LayoutComponent`, so it closes every route.
- 220px tall (22 blocks), pulled up over the end of the content with `margin-top: calc(-1 * (var(--section-padding-v) + var(--dissolve-lead-in)))`. The last contact card's bottom edge sits exactly one `--section-padding-v` above the end of `<main>`, so the lead-in is measured from there and the disintegration starts **on the last contact card**, not below the footer.
- The ramp's bottom edge is pinned to the top of the footer. Trimming rows off the bottom and shrinking the pull-up by the same amount is what slides the whole effect further down the page without moving the footer or changing the document height.
- The footer follows directly beneath on a solid `#000` ground and carries the copyright, so the black the ramp resolves into is where the copyright sits. There is no top rule on the footer: the dissolve is the separator, and a hairline would cut straight through it.
- **Vertical intensity is non-linear** (`coverage = progress^3.2`): 1% at a quarter down, 12% at halfway, 56% at four-fifths, solid at the bottom. The page frays gently, then collapses.
- **Horizontal intensity follows a curve toward the sides.** Edge columns get both a head start (`EDGE_OFFSET`) and faster progress (`EDGE_LEAD`), weighted by `|2·tx − 1|^1.9` so the middle — where the content sits — stays clear longest. The sides cross 1% coverage at 10% down versus 23% for the middle, and go solid at 55% down versus 96%. The result reads as a shallow concave valley eating in from both edges; `EDGE_CURVE` closer to 1 flattens that valley, further above 1 deepens it.
- **Blue noise, not ordered dither.** A Bayer matrix was tried first and looked wrong: at low coverage every tile lights the same cell, so sparse regions read as a precise lattice of dots instead of something coming apart. Void-and-cluster placement puts each new block in the largest remaining gap — evenly spread, no visible grid.
- Blocks are a constant 10px at every viewport width, always whole and on-grid.
- Static by construction: no canvas, no timers, no animation. `prefers-reduced-motion` needs no special case; the only runtime work is re-measuring the width on resize.
- The fixed background scene is `position: fixed; inset: 0`, so it repaints the full viewport at every scroll position — the extra page height can never expose a region outside the mountain render.
- The ramp is `pointer-events: none` and `aria-hidden`, so the last contact card stays clickable and unchanged for assistive tech even where blocks land on it.

### Footer

- Minimal by design: a centered copyright line with the "Built with Angular" note, and nothing else
- Sits **below** the page-end pixel dissolve on a solid `#000` ground, so the copyright reads as the last thing left after the page disintegrates. No top rule — see [Page-End Pixel Dissolve](#page-end-pixel-dissolve).
- Deliberately carries **no** social icons. The Contact section owns the channel list because email + social links are its defined purpose; rendering `SocialLinksComponent` in both produced two near-identical rows within one screen.
- Not fixed — sits at the very bottom of the content

## Animation Guidelines

### Durations

- Micro-interactions (hover, click): 150–300ms. Project focus swaps use a 240ms opacity/8px-rise transition with the existing entrance easing.
- Scroll reveals: scroll-position-linked (not time-based) — animation progress maps directly to scroll position via `animation-timeline: view()`, bounded to a maximum scroll distance (see [Scroll Reveal Range](#scroll-reveal-range))
- Background elements (star twinkle, avatar float): continuous, slow (2–5s loops)

### Hero CSS Animations

| Animation            | Duration | Notes                                                                         |
| -------------------- | -------- | ----------------------------------------------------------------------------- |
| `avatar-float`       | 3s       | 8px vertical bob, `ease-in-out infinite`                                      |
| `ufo-float`          | 7s       | ±14px vertical + ±2° tilt, `ease-in-out infinite`                            |
| `ufo-parallax`       | scroll   | `animation-timeline: scroll(root)`, range 0–200vh; translates UFO 165vh down. The craft therefore gives back ~83% of the page's scroll and drifts up only a sliver — depth is about how little it moves *relative to the viewport*, not how far it travels |
| `scroll-pulse`       | 2.5s     | Single chevron; `opacity` 0.1 → 0.55 with a 2px down-right drift and a cyan glow at 50%; disabled under reduced motion |
| `scroll-indicator-fade` | scroll | `animation-timeline: scroll(root)`, range 0–150px; fades indicator opacity 1→0 |

### Scroll Reveal Range

`.scroll-reveal` (applied by `ScrollRevealDirective`) runs `scroll-reveal-slide` on a `view()` timeline. A `view()` timeline defines its `entry` range as **exactly the subject's own height**, so percentage-only offsets stretch the reveal in proportion to the element — and for any tall subject, `entry 100%` can occur only after its top has already scrolled off screen. The Projects showcase and other large groups therefore rely on an absolute cap.

The range is therefore capped in absolute scroll distance, using tokens in `_variables.scss`:

```scss
animation-range: entry min(20%, $scroll-reveal-max-delay) entry min(100%, $scroll-reveal-max-distance);
```

| Token | Value | Role |
| --- | --- | --- |
| `$scroll-reveal-max-delay` | `40px` | Caps the dead zone before the fade starts (otherwise 20% of the subject's height) |
| `$scroll-reveal-max-distance` | `400px` | The reveal is always complete by this far into `entry` |

The two caps engage at different heights: `min(100%, 400px)` is a no-op below 400px, while `min(20%, 40px)` is a no-op below 200px. The contact block and About intro retain height-proportional timing; the full Projects and Extras showcases use the cap. About history chapters do not use `ScrollRevealDirective`.

Note that `min()` must be written with Sass interpolation (`#{$token}`) so it compiles to a CSS `min()` rather than Sass's own, which rejects mixed `%`/`px` units.

### Easing

- Entrances: `cubic-bezier(0.16, 1, 0.3, 1)` (smooth deceleration)
- Hovers: `ease-out`
- Background: `ease-in-out` for looping floats

### Motion Principles

- Smooth, not overwhelming — prioritize clarity
- Respect `prefers-reduced-motion` — CSS animations are disabled by media-query fallbacks, and the canvas scene renders a still frame (frozen twinkle/particles) that redraws only on scroll so parallax still tracks the user's own gesture
- Project focus swaps become immediate under `prefers-reduced-motion`: no rise, image scale, or corner sweep. Viewport correction uses instant scrolling.
- Extras keeps user-driven desktop platformer movement but removes decorative loops, copy emphasis transitions, and slide-pad travel animation under `prefers-reduced-motion`. Galleries have no automatic advance to suppress.
- The canvas rAF loop pauses on `visibilitychange` while the tab is hidden and resumes on return
- Use `transform` and `opacity` only (GPU-composited)
- Reduce background complexity on small screens and low-power devices
- Scroll reveal animations use CSS `animation-timeline: view()` — they are scroll-position-linked and naturally reverse on scroll-up. A `@supports` fallback ensures content is always visible in older browsers. Their range is capped so a subject's reveal pace does not scale with its height; see [Scroll Reveal Range](#scroll-reveal-range).

## Responsive Strategy

### Mobile Adjustments

- Hero: stack avatar above text, full-width
- Background scene: simplify or disable heavy canvas elements
- Navbar: hamburger menu with slide-in drawer
- Projects: stacked 16:9 focus stage plus compact horizontal selector cards below 480px; two preview columns from 480px
- Extras: the full three-island level scales into view without horizontal clipping at desktop widths; smaller widths use vertically stacked, readable media panes plus the explorer's desktop/wider-window prompt
- Reduce glow intensity to save battery on OLED screens

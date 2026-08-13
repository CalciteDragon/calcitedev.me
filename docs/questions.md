# Product Decisions and Open Questions

This document began as the project’s clarification questionnaire. Resolved answers are now recorded as decisions; only genuinely unresolved choices remain under **Open**.

## Resolved Decisions

### Identity and design

- Name: Tyler Hawthorn.
- Brand/alias: Calcite.
- Title: Full Stack Developer & Game Enthusiast.
- Visual direction: dark cyberpunk, pixel-art accents, cyan/blue/purple/pink neon, with gold for Calcite branding.
- Dark-first only for v1; light mode is deferred.
- Decorative interactions must never compromise the core portfolio.

### Content

- Projects use one stable focus stage plus a compact selector index; there are no filters or project-detail routes.
- The current display order is Live Bingo, Pineapple Expense, Calcite Portfolio, Mochi 2026, Pixel Quest, Minecraft Hide & Seek, and an in-progress Roblox PvP world.
- Keep replacement simple through ordered typed data and stable asset paths. The six new preview SVGs are project-specific original art and may be replaced with real screenshots later without structural changes.
- Skills are grouped into languages, frontend, backend, databases, DevOps, testing/quality, Git/version control, and architecture/concepts.
- About is bio plus skills for v1; an experience timeline is deferred.
- Tyler will create final pixel artwork; development uses placeholders.
- Contact uses direct email and social links, not a form.
- Current social platforms are GitHub, Discord, and LinkedIn.
- Resume, blog, GitHub API integration, and analytics are deferred.

### Architecture and deployment

- Deploy as a prerendered static site rather than a runtime Node SSR service.
- Hosting target is Render.
- Custom domain is `calcitedev.me`.
- Content remains local TypeScript; there is no backend or CMS.

### Optional interactions

The planned non-load-bearing Easter-egg layer may include:

- UFO hover motion and cursor-reactive stars.
- Mouse-tracking card glow/tilt.
- Draggable decorative elements with lightweight gravity/collision physics.
- A keyboard-controlled rocket.
- A peelable corner revealing a restrained “professional” presentation.
- Subtle, opt-in sound effects triggered only after user interaction.

## Open

1. Are the current bio, email address, Discord URL, LinkedIn URL, and GitHub URL final?
2. Which final avatar and UFO artwork should replace the current large SVG placeholders?
3. Is the existing Render service/domain configuration currently live and correct, or does deployment still need to be completed?
4. Which ideas from the optional Easter-egg list should ship in v1 after responsive, accessibility, and performance work is complete?

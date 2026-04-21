# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# CLAUDE.md — Personal Portfolio (calcitedev.me)

## Project

Personal developer portfolio for **Tyler Hawthorn (AKA Calcite)** — Angular 21, TypeScript, SCSS, deployed as a static site on Render at **calcitedev.me**. Dark cyberpunk aesthetic with pixel-art accents and neon glow effects.

## Dev Commands

```bash
npm start           # Dev server at localhost:4200
npm run build       # Production static build (pre-renders all routes)
npm test            # Run unit tests (vitest, no watch)
ng generate component features/foo  # Scaffold a feature component
```

Tests use **vitest** via `@angular/build:unit-test`. No `karma.config.js` — configure test behavior in `angular.json`.

## Documentation (LIVING DOCS — KEEP UPDATED)

All planning and design docs live in `/docs`. **These are living documents.** Update them whenever the project changes — new components, revised architecture, design tweaks, completed phases, changed decisions. If you build it, document it. If you change it, update the doc. Stale docs are worse than no docs.

| Doc | Purpose |
|-----|---------|
| [docs/overview.md](docs/overview.md) | Vision, identity, tech stack, core pages, non-functional goals, content strategy |
| [docs/architecture.md](docs/architecture.md) | Folder structure, routing, component tree, data flow, SSR strategy, deploy pipeline |
| [docs/design.md](docs/design.md) | Color palette, typography, layout grid, glow/lighting effects, hero section spec, component visual specs, animation guidelines, responsive strategy |
| [docs/conventions.md](docs/conventions.md) | Naming, file organization, component patterns (smart/presentational/canvas), SCSS conventions, code quality, git workflow |
| [docs/development.md](docs/development.md) | Phased development plan (0–11), dependency graph, task checklists, parallel work tracks, scope notes |
| [docs/questions.md](docs/questions.md) | Clarifying questions — answered and remaining open items |

**Read the relevant docs before starting work on any phase or feature.** Check `docs/development.md` to understand what phase we're in and what's next.

## Key Decisions

- **Static site deployment** (pre-rendered, no Node SSR at runtime)
- **No backend / no CMS** — all content is static TypeScript data files in `src/app/data/`
- **Placeholder-first development** — pixel art assets and project screenshots use placeholders; Tyler creates real art in parallel. Placeholders must be trivially swappable (just change a file path or drop in a new image).
- **Easter eggs are non-load-bearing** — the site works cleanly without them. Physics, controllable rocket, peelable corner, and sound effects are layered on top in Phase 8.
- **Deferred for future versions:** blog, resume PDF, GitHub API, analytics, light mode toggle, experience timeline, contact form.

## Skills

- **UI Implementer** (`.claude/skills/ui-implementer/SKILL.md`): Use when Tyler provides a design reference (Figma link, screenshot, mockup) and wants pixel-perfect implementation. Triggers on design URLs, screenshot paths, or "implement this UI" intent. Handles validation loops with design fidelity scoring. Note: the skill's default references React/Tailwind — adapt prompts to Angular/SCSS for this project.

## Playwright (Visual Validation)

A Playwright MCP plugin is available for visually building and validating UI features. Use it proactively when working on UI:

- **Navigate** to `http://localhost:4200` (requires `npm start` to be running)
- **Take screenshots** to visually verify layout, styling, and canvas rendering after changes
- **Use snapshots** to inspect the accessibility tree and get element refs for interaction
- **Interact** — click buttons, scroll, fill forms, resize viewport to test responsive behavior

Workflow: make a code change → hot reload → screenshot → verify visually. This catches issues (broken layout, missing glow, canvas not rendering) that unit tests can't see. Use it especially for canvas-based components like `BackgroundSceneComponent` where visual output can't be asserted programmatically.

## Tech Stack Quick Reference

- Angular 21 (standalone components, signals, OnPush change detection)
- TypeScript (strict mode)
- SCSS + CSS custom properties (see design.md for full token list)
- Fonts: Space Grotesk (headings), Inter (body), JetBrains Mono (code), Press Start 2P (pixel accents)
- Canvas API for background scene (stars, mountains, particles) — UFO is a CSS/HTML element in HeroComponent
- Pre-rendered static build on Render

## Conventions (Quick)

- Standalone components only — no NgModules
- Signal-based inputs (`input()` / `input.required()`) and outputs (`output()`)
- OnPush change detection everywhere
- `inject()` function, not constructor injection
- Guard canvas/browser APIs with `isPlatformBrowser()` for SSR compatibility
- CSS custom properties for all colors/glows — never hard-code hex in component SCSS
- Mobile-first responsive (base → `min-width` queries)
- Conventional commits: `feat:`, `fix:`, `style:`, `refactor:`, `docs:`, `chore:`

## Routing Architecture

All routes are children of `LayoutComponent` (navbar + footer shell). The app is a single-page scroll — old sub-paths redirect to `/`:

```
/               → HomeComponent (all sections live here)
/projects/:slug → ProjectDetailComponent (pre-rendered per slug)
/about, /projects, /contact → redirect to /
```

`app.routes.server.ts` contains SSR-specific route config (pre-render triggers, enumerates all project slugs).

## SCSS Architecture

Global partials live in `src/styles/` and are available project-wide via `@use` without path prefix (configured via `stylePreprocessorOptions.includePaths`):

- `_variables.scss` — CSS custom property declarations and SCSS variables
- `_mixins.scss` — Reusable layout/effect mixins
- `_glow.scss` — Neon glow effect utilities
- `_typography.scss` — Font declarations and text styles
- `_animations.scss` — Keyframe animations
- `_reset.scss` — Base reset

Component SCSS uses `@use 'variables'` (not a relative path). Never hard-code hex values — always reference CSS custom properties.

## When Starting a Session

1. Check `docs/development.md` for current progress and next phase
2. Read the relevant docs for context before writing code
3. After completing work, update docs to reflect changes (mark tasks complete, note new components, revise architecture if needed)

## Doc Update Rules (MANDATORY)

After **any** code change — no matter how small — update the relevant docs before closing the task. This is not optional.

| What changed | Which docs to update |
|---|---|
| Component added, removed, or restructured | `architecture.md` (component map, folder structure) |
| Component visual design changed | `design.md` (hero spec, animation guidelines, type scale, background scene table) |
| New animation or interaction added | `design.md` (Animation Guidelines section) |
| Phase tasks completed | `development.md` (check off tasks, add "Built:" summary) |
| Architecture decision changed | `architecture.md` + `overview.md` if user-facing |
| Asset paths or asset types changed | `architecture.md` (folder structure) |
| Tech stack or Angular version changed | `overview.md` + `CLAUDE.md` Tech Stack section |

**Specifically:** if you remove a feature from one place and move it to another (e.g., UFO from canvas to CSS), update every doc that mentioned the old location — don't leave ghost references. Search for the affected term across `/docs` before marking docs done.

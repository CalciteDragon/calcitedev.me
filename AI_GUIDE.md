# AI Guide — Personal Portfolio (calcitedev.me)

This is the canonical repository guidance for all AI coding assistants, including Codex and Claude Code. Tool-specific entry files such as `AGENTS.md` and `Claude.md` intentionally contain only a pointer here so the project rules do not drift between assistants.

## Project

Personal developer portfolio for **Tyler Hawthorn (AKA Calcite)** built with Angular 21, TypeScript, and SCSS. It targets static deployment on Render at **calcitedev.me** and uses a dark cyberpunk aesthetic with pixel-art accents and neon glow effects.

## Dev Commands

```bash
npm start           # Dev server at localhost:4200
npm run build       # Production static build; prerenders configured routes
npm test            # Run unit tests with Vitest, without watch mode
ng generate component features/foo  # Scaffold a feature component
```

Tests use **Vitest** through `@angular/build:unit-test`. There is no `karma.config.js`; configure test behavior in `angular.json`.

On Windows systems where PowerShell blocks `npm.ps1`, use `npm.cmd` in place of `npm`.

## Documentation — Living Docs, Keep Updated

All planning and design docs live in `/docs`. They are living documents. Update them whenever the project changes: new components, revised architecture, design tweaks, completed phases, changed decisions, or asset moves. If you build it, document it. If you change it, update the docs. Stale docs are worse than no docs.

| Doc | Purpose |
| --- | --- |
| [docs/overview.md](docs/overview.md) | Vision, identity, tech stack, core sections, non-functional goals, content strategy |
| [docs/architecture.md](docs/architecture.md) | Current folder structure, routing, component tree, data flow, rendering strategy, deploy pipeline |
| [docs/design.md](docs/design.md) | Color palette, typography, layout grid, glow/lighting effects, hero and component visual specs, animation and responsive guidance |
| [docs/conventions.md](docs/conventions.md) | Naming, file organization, component patterns, SCSS conventions, code quality, git workflow |
| [docs/development.md](docs/development.md) | Phased development plan, completed work, current priorities, task checklists, and scope notes |
| [docs/questions.md](docs/questions.md) | Original clarifying questions and recorded product decisions |

Before starting any phase or feature:

1. Check `docs/development.md` for current progress and likely next work.
2. Read the relevant product, architecture, design, and convention docs.
3. Inspect the current code before trusting older planned structure verbatim.
4. After implementation, update every affected doc before closing the task.

## Key Decisions

- **Static deployment:** prerendered output; no Node SSR process at runtime.
- **No backend or CMS:** content is static TypeScript data in `src/app/data/`.
- **Single-page core experience:** Hero, Projects, About, Skills, and Contact live on `/`; project details use `/projects/:slug`.
- **Placeholder-first assets:** art and screenshots must be easy to replace through stable file paths or a data-file change.
- **Easter eggs are non-load-bearing:** physics, a controllable rocket, a peelable corner, and sound effects layer on top of a complete, usable portfolio.
- **Deferred:** blog, resume PDF, GitHub API, analytics, light mode, experience timeline, and contact form.

## Current Tech Stack

- Angular 21 standalone components
- Signals and computed signals for state; RxJS for asynchronous streams where appropriate
- `ChangeDetectionStrategy.OnPush`
- TypeScript strict mode and strict Angular templates
- SCSS plus CSS custom properties
- Angular SSR build tooling with static output and route prerendering
- Vitest through `@angular/build:unit-test`
- Canvas API for stars, atmosphere, and particles
- OffscreenCanvas web worker for procedural mountain rendering
- Fonts: Space Grotesk, Inter, JetBrains Mono, and Press Start 2P, with final self-hosting work still planned

## Angular and TypeScript Conventions

- Standalone components only; do not introduce NgModules.
- Use signal-based inputs (`input()` / `input.required()`) and outputs (`output()`).
- Use `OnPush` change detection on components.
- Prefer `inject()` over constructor injection.
- Use signals for component state and computed values. Reserve RxJS for genuinely asynchronous streams.
- Guard DOM, Canvas, worker, `window`, and other browser-only APIs with `isPlatformBrowser()` for SSR compatibility.
- Keep canvas rendering logic in dedicated renderer classes rather than component bodies.
- Clean up animation frames, observers, workers, and event listeners during component destruction.
- Avoid `any`, unused symbols, deep nesting, and complex template expressions.

## Routing Architecture

All routes are children of `LayoutComponent`, which owns the navbar, fixed background scene, routed content, and footer.

```text
/               → HomeComponent (all five scroll sections)
/projects/:slug → ProjectDetailComponent (five slugs currently prerendered)
/about, /contact → redirect to /
unknown paths   → redirect to /
```

There is intentionally no `/projects` redirect because it would conflict with `/projects/:slug`. Homepage section navigation uses `/#projects`. `app.routes.server.ts` enumerates the project slugs used for prerendering.

## Component and Data Architecture

- `HomeComponent` is the smart container for the single-page sections.
- Section and shared components receive typed data through signal inputs.
- Static content comes from `src/app/data/` and models from `src/app/models/`.
- `ScrollService` owns smooth section navigation, active-section tracking, and URL fragment updates.
- `BackgroundSceneComponent` coordinates two fixed canvases: the transparent scene renderer and the worker-owned mountain renderer.
- The UFO is an HTML/CSS element inside `HeroComponent`, not a canvas entity.
- The rocket is deferred to the optional Easter-egg phase.

## SCSS Architecture

Global partials live in `src/styles/` and are available through the include path configured in `angular.json`:

- `_variables.scss` — SCSS tokens and CSS custom-property sources
- `_mixins.scss` — reusable layout/effect mixins
- `_glow.scss` — neon glow utilities
- `_typography.scss` — type declarations and styles
- `_animations.scss` — shared keyframes and scroll-reveal behavior
- `_reset.scss` — base reset

Component SCSS uses imports such as `@use 'variables' as *`. Use CSS custom properties for runtime colors and glows; do not hard-code component color hex values. Build mobile-first, prefer Grid/Flexbox, keep nesting shallow, and use BEM-lite class naming.

## Visual Validation

For UI work, run the site at `http://localhost:4200` and use the browser automation available to the active assistant when possible:

- Capture screenshots at relevant desktop and mobile widths.
- Inspect the accessibility tree and interactive states.
- Exercise navigation, filters, drawers, scrolling, and route transitions.
- Pay particular attention to `BackgroundSceneComponent`, since unit tests cannot prove visual canvas correctness.

Recommended loop: make a focused change → allow the dev server to reload → inspect and interact → capture screenshots → correct visual regressions → run tests/build.

## Tool-Specific Integrations

- When a supplied Figma link, screenshot, mockup, or explicit “implement this UI” request triggers a UI implementation skill, use the skill available to the active assistant. Codex currently exposes it under `.agents/skills/ui-implementer/`; Claude installations may expose the equivalent under `.claude/skills/ui-implementer/`. Adapt any React/Tailwind-oriented defaults to this project’s Angular/SCSS conventions.
- Browser or Playwright tooling differs by assistant and installation. Use the available equivalent rather than encoding a dependency on one vendor-specific tool name.

## Git Workflow

- Use conventional commits: `feat:`, `fix:`, `style:`, `refactor:`, `docs:`, `chore:`.
- Write imperative, lowercase commit subjects without a trailing period.
- Use focused feature branches off the appropriate integration branch.
- Do not discard unrelated local changes. Treat an existing dirty worktree as user-owned unless proven otherwise.
- Before starting significant work, inspect the current branch and relevant unmerged branches; this repository has historically carried parallel UI and rendering work.

## Mandatory Documentation Update Rules

After **any code change**, update the relevant docs before closing the task.

| What changed | Docs to update |
| --- | --- |
| Component added, removed, or restructured | `docs/architecture.md` component map/folder structure |
| Component visual design changed | `docs/design.md` relevant visual spec |
| Animation or interaction added/changed | `docs/design.md` animation guidelines and `docs/development.md` phase status |
| Phase task completed or partially completed | `docs/development.md` checklist and built/current-status summary |
| Architecture decision changed | `docs/architecture.md`, plus `docs/overview.md` when user-facing |
| Asset path or asset type changed | `docs/architecture.md` and any affected phase/task notes |
| Tech stack or Angular version changed | `docs/overview.md`, `README.md`, and this file |
| AI workflow guidance changed | `AI_GUIDE.md`; keep `AGENTS.md` and `Claude.md` as pointers unless discovery requirements change |

When moving or removing a feature, search the repository docs for the affected term and update every stale reference. Do not leave ghost references to old routes, canvas entities, assets, or components.

## Definition of Done

For normal code changes, completion means:

1. The requested behavior is implemented.
2. Relevant unit tests pass and new behavior is covered where practical.
3. The production build succeeds.
4. UI work is visually checked at appropriate viewports when browser tooling is available.
5. Relevant living docs match the resulting code.
6. The final handoff mentions meaningful warnings, deferred work, or unverified external state.

# calcitedev.me — Personal Portfolio

Personal developer portfolio for **Tyler Hawthorn (AKA Calcite)**. Dark cyberpunk aesthetic with pixel-art accents and neon glow effects.

**Live site:** [calcitedev.me](https://calcitedev.me)

## Tech Stack

| | |
|---|---|
| Framework | Angular 21 (standalone components, signals, OnPush) |
| Language | TypeScript (strict mode) |
| Styling | SCSS + CSS custom properties |
| SSR | Angular SSR — pre-rendered static output |
| Hosting | Render (static site) |
| Fonts | Space Grotesk, Inter, JetBrains Mono, Press Start 2P |

## Development

```bash
npm install
ng serve          # dev server at localhost:4200
ng build          # production build + pre-rendering → dist/
```

## Project Structure

```
src/
├── styles/           # Global SCSS partials (variables, reset, typography, mixins, glow, animations)
├── app/
│   ├── core/         # Services, guards
│   ├── layout/       # Navbar, footer shell
│   ├── shared/       # Reusable components, directives, pipes
│   ├── features/     # Page components (home, about, projects, contact)
│   ├── models/       # TypeScript interfaces
│   └── data/         # Static content (no CMS)
└── assets/
    ├── images/
    ├── pixel-art/
    ├── icons/
    └── fonts/        # Self-hosted fonts (Phase 9)
```

## Design System

CSS custom properties on `:root` expose all design tokens at runtime. SCSS variables and mixins in `src/styles/` are available per-component via `@use`:

```scss
@use 'styles/variables' as *;   // colors, spacing, breakpoints
@use 'styles/mixins' as *;      // responsive breakpoints, layout
@use 'styles/glow' as *;        // neon glow effects
```

**Color palette:** `#0B0F1A` background · cyan `#22D3EE` · blue `#3B82F6` · purple `#8B5CF6` · pink `#EC4899` · gold `#F59E0B`

## Docs

Planning and design docs live in [`/docs`](./docs):

| Doc | Purpose |
|-----|---------|
| [overview.md](docs/overview.md) | Vision, identity, pages, goals |
| [architecture.md](docs/architecture.md) | Folder structure, routing, data flow |
| [design.md](docs/design.md) | Color palette, typography, glow effects, animations |
| [conventions.md](docs/conventions.md) | Naming, SCSS conventions, component patterns |
| [development.md](docs/development.md) | Phased development plan (Phases 0–11) |

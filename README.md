# calcitedev.me — Personal Portfolio

Personal developer portfolio for **Tyler Hawthorn (AKA Calcite)**. It combines a dark cyberpunk design, pixel-art accents, neon UI, and an animated Canvas/OffscreenCanvas background.

**Target site:** [calcitedev.me](https://calcitedev.me)

## Tech Stack

| | |
| --- | --- |
| Framework | Angular 21 standalone components, signals, OnPush |
| Language | TypeScript 5.9, strict mode |
| Styling | SCSS and CSS custom properties |
| Rendering | Angular SSR tooling with prerendered static output |
| Testing | Vitest through Angular’s unit-test builder |
| Background | Canvas API and an OffscreenCanvas mountain worker |
| Hosting target | Render static site |

## Development

```bash
npm install
npm start       # development server at http://localhost:4200
npm test        # 106 tests at the latest documentation audit
npm run build   # production bundles + static prerender → dist/portfolio/browser/
```

On Windows systems that block PowerShell’s `npm.ps1`, use `npm.cmd` instead.

## Routes

```text
/               Home page: Hero, About, Projects, Skills, Contact
/projects/:slug Prerendered project detail page
/about           Redirects to /
/contact         Redirects to /
```

## Project Structure

```text
src/
├── app/
│   ├── core/             Singleton services
│   ├── layout/           Navbar, fixed background, footer shell
│   ├── shared/           Reusable components, directives, and types
│   ├── features/         Homepage sections and project detail route
│   ├── models/           TypeScript interfaces
│   └── data/             Static portfolio content
├── styles/               Global SCSS partials
└── test-setup/           Canvas test mocks

public/assets/            Public artwork, screenshots, icons, and fonts
```

## Design System

CSS custom properties on `:root` expose runtime design tokens. Component SCSS can import the global partials through the configured include path:

```scss
@use 'variables' as *;
@use 'mixins' as *;
@use 'glow' as *;
```

The primary palette is deep navy with cyan, blue, purple, pink, and gold accents. See [docs/design.md](docs/design.md) for the full visual specification.

## Documentation and AI Assistants

- [AI_GUIDE.md](AI_GUIDE.md) is the canonical working agreement for Codex, Claude Code, and other AI assistants.
- [AGENTS.md](AGENTS.md) and [Claude.md](Claude.md) are tool-discovery pointers to that shared guide.
- [docs/overview.md](docs/overview.md) covers product goals and scope.
- [docs/architecture.md](docs/architecture.md) describes the current implementation.
- [docs/design.md](docs/design.md) defines the visual language.
- [docs/conventions.md](docs/conventions.md) defines code and git conventions.
- [docs/development.md](docs/development.md) tracks completed phases and remaining work.

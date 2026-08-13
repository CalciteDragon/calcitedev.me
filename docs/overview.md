# Project Overview

## Vision

A personal developer portfolio for **Tyler Hawthorn (AKA Calcite)** with a dark cyberpunk identity, pixel-art accents, neon lighting, and a polished modern UI. It should feel professional, playful, and memorable without sacrificing readability, accessibility, or performance.

## Identity

| Field | Value |
| --- | --- |
| Name | Tyler Hawthorn |
| Alias | Calcite |
| Title | Full Stack Developer & Game Enthusiast |
| Domain | calcitedev.me |

## Current Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Angular 21 standalone components, signals, OnPush |
| Language | TypeScript 5.9 in strict mode |
| Styling | SCSS plus CSS custom properties |
| Build | Angular CLI / esbuild |
| Rendering | Angular SSR tooling with static prerender output |
| Testing | Vitest through `@angular/build:unit-test` |
| Background and play | Canvas API plus an OffscreenCanvas mountain worker; DOM/CSS Extras platformer |
| Hosting target | Render static site |
| Content | Typed static TypeScript data; no CMS or backend |

## Core Experience

The homepage is one scrolling route with five sections. Project selection stays inside the page and never interrupts the scroll experience.

### 1. Hero

- Pixel-art avatar placeholder floating above a CSS sci-fi platform.
- Large fixed-background cyan-to-pink gradient name, alias, and title.
- HTML/CSS UFO with floating motion, scroll parallax, and a tractor beam.
- Three-chevron scroll indicator.
- Fixed canvas background with stars, particles, atmosphere, horizon glow, and procedural wireframe terrain.

The earlier hero feature-card strip and CTA were intentionally removed because they duplicated the navbar and section navigation.

### 2. About

An origin-story section led by a larger introductory card and followed by a four-stage, compiler-themed history timeline. Scroll progress advances the single active chapter and rail through cyan, blue, violet, and pink while tilting the cards; each stage uses one consistent accent for highlighted phrases and contextual links.

### 3. Projects

A data-driven showcase of seven real projects. One stable focus stage presents the selected project's art, detailed researched description, status, tags, and available repository/live actions. A compact index of smaller preview buttons sits below it; selecting a preview crossfades the corresponding project into the stage without navigation, reordering, or layout shift.

All seven projects use original themed SVG previews under `public/assets/images/`. Pixel Quest is presented as a layered co-op dungeon run, while Minecraft Hide & Seek uses an isometric voxel arena with visible roles, cover, and a wormhole power-up. Content order and membership are controlled entirely by `projects.data.ts`.

### 4. Extras

A playful three-island platformer replaces the former résumé-style skills grid. Three broad rounded scanline media screens live directly over the site's mountain scene and double as the platforms for Keyboard Cove, Capstone Summit, and Robotics Outpost. The complete desktop level scales into view without a horizontal crop or side-scrolling camera; a pixel explorer moves between islands with WASD/arrow keys or holdable pointer/touch controls, and clicking an inactive screen teleports the character onto it. Smaller screens receive readable vertically stacked media panes and an explorer prompt to try the platformer on desktop or widen the window. The keyboard build starts as a muted YouTube embed, while galleries advance through capstone and robotics media. The latter two currently use labeled media slots until the final photos and competition clips are supplied.

### 5. Contact

A direct email link and social links. There is deliberately no contact form or backend.

## Non-Functional Goals

- **Performance:** 90+ Lighthouse targets, small bundles, efficient animation, reduced mobile scene complexity, and no runtime server requirement.
- **Mobile-first:** usable from 320px upward, with stacked layouts and a drawer navigation.
- **Accessibility:** semantic HTML, keyboard support, clear focus states, sufficient contrast, reduced-motion behavior, and non-load-bearing decorative interactions.
- **SEO:** prerendered HTML, page titles and metadata, Open Graph support, `robots.txt`, and a sitemap.
- **Maintainability:** typed static data, reusable standalone components, strict compilation, and synchronized living documentation.
- **Readability:** effects support the hierarchy instead of competing with it.

## Product Boundaries

In scope for the first complete version:

- Single-page portfolio with an in-page, swappable project showcase.
- Neon design system and animated background.
- Responsive, accessible core content.
- Replaceable artwork and project screenshots.
- Optional Easter eggs layered on after production quality is established.
- Static deployment at calcitedev.me.

Deferred for future versions:

- Blog.
- Downloadable resume.
- GitHub API integration.
- Analytics.
- Light mode.
- Experience timeline.
- Contact form.

## Content Strategy

Portfolio copy, projects, Extras topics/media, and social links live in `src/app/data/`. Updating the project or Extras lists requires only editing typed data and adding or replacing assets at stable public paths; no route or prerender configuration changes are needed. There is no database, backend, CMS, or runtime API dependency.

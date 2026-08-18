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
- Single cyan chevron scroll indicator.
- Fixed canvas background with stars, particles, atmosphere, horizon glow, and procedural wireframe terrain.

The earlier hero feature-card strip and CTA were intentionally removed because they duplicated the navbar and section navigation.

### 2. About

An origin-story section led by a larger introductory card and followed by a four-stage, compiler-themed history timeline. Scroll progress advances the single active chapter and rail through cyan, blue, violet, and pink while tilting the cards; each stage uses one consistent accent for highlighted phrases and contextual links.

### 3. Projects

A data-driven showcase of seven real projects. One stable focus stage presents the selected project's art, detailed researched description, status, tags, and available repository/live actions. Wrapping carousel arrows sit outside the stage and step through the projects in order. A compact index of smaller scanline preview buttons sits below it; selecting a preview crossfades the corresponding project into the stage without navigation, reordering, or layout shift.

All seven project previews live under `public/assets/images/`. Six are real captures — Live Bingo, Pineapple Expense, Mochi 2026, the Roblox PvP world, It's Never Just Black and White, and Minecraft Hide & Seek. Only Calcite Portfolio remains original themed SVG art, a finite recursive browser window. Content order and membership are controlled entirely by `projects.data.ts`.

### 4. Extras

A playful three-island platformer replaces the former résumé-style skills grid. Three broad rounded scanline media screens live directly over the site's mountain scene and double as the platforms for Capstone Summit, Keyboard Cove, and Robotics Outpost. The complete desktop level scales into view without a horizontal crop or side-scrolling camera; the pixel explorer begins near the left edge of the middle Keyboard island while every screen remains in standby. Page-level WASD/arrow input moves the explorer, while the first W/A/S/D press activates the supporting island and dismisses the movement hint. Clicking an inactive screen activates it and teleports the character without changing keyboard focus or prematurely removing that hint. Active islands and their headings rise together and remain active for one second after the explorer leaves. Gallery arrows remain directly interactive even over inactive panes and both browse and teleport when used there. Smaller screens receive readable vertically stacked media panes and an explorer prompt to try the platformer on desktop or widen the window. Keyboard Cove and Robotics Outpost use muted YouTube embeds that resume from saved progress after inactivity; Pineapple Expense uses the supplied IMG_1 → IMG_2 → rendered IMG_3 → IMG_4 → IMG_5 image sequence, while Mochi follows IMG_2 → IMG_1 → competition video → IMG_4 → IMG_3, with the video beginning at 3:03:36 on its first play. Galleries advance through capstone and robotics media but pause while their current video is actively playing.

The level geometry is typed, source-controlled data in `extras-level.data.ts`. A development-only editor at `?extrasDebug=level#extras` provides separate Edit and Playtest modes: islands can be repositioned but remain protected, while supplemental platforms can be added, moved, resized, duplicated, and deleted. Browser `localStorage` recovers draft edits; copying or downloading the generated TypeScript and replacing the canonical data file is the deliberate permanent-publish workflow for this static site. Supplemental platforms support the explorer without activating media, and the previously active island still deactivates after its grace period when the explorer lands on one.

### 5. Contact

One list of contact handles — email, GitHub, Discord, LinkedIn — each shown as `icon | platform | handle` beside the icon for its platform. There is deliberately no contact form or backend. The page then disintegrates into black through a blocky pixel dissolve that begins over the end of the section, with the copyright left sitting in the black at the very bottom.

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

Portfolio copy, projects, Extras topics/media, Extras level geometry, and social links live in `src/app/data/`. `extras.data.ts` owns the media topics while `extras-level.data.ts` owns the versioned world, spawn, island, and supplemental-platform geometry. Updating those records and adding or replacing assets requires no route or prerender configuration change. There is no database, backend, CMS, or runtime API dependency; the level editor's local draft is only a development recovery aid until its exported source is committed.

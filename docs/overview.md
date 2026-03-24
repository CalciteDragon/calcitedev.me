# Project Overview

## Vision

A personal developer portfolio for **Tyler Hawthorn (AKA Calcite)** — a dark, cyberpunk-inspired site with pixel-art accents, neon glow effects, and a polished modern UI. The site should feel **modern and professional, playful and unique, visually engaging without being overwhelming** — a balance between clean UI and creative personality.

## Identity

| Field     | Value                                  |
| --------- | -------------------------------------- |
| Name      | Tyler Hawthorn                         |
| Alias     | Calcite (brand element, gold/orange)   |
| Title     | Full Stack Developer & Game Enthusiast |
| Tagline   | Code · Create · Innovate               |

## Tech Stack

| Layer          | Technology                        |
| -------------- | --------------------------------- |
| Framework      | Angular 19 (standalone components) |
| Language       | TypeScript (strict mode)          |
| Styling        | SCSS + CSS custom properties      |
| Build          | Angular CLI / esbuild             |
| SSR            | Angular SSR (`@angular/ssr`)      |
| Hosting        | Render (static site, pre-rendered) |
| Domain         | calcitedev.me                      |
| Interactivity  | Canvas for background scenes      |

## Core Sections

The site is a single-page scroll layout. All content lives on one route (`/`), divided into five sections.

### 1. Home (Hero)

The hero experience. Features:
- **Pixel-art avatar** of Tyler sitting with a laptop (optional idle animation — typing, blinking)
- **Large gradient heading:** "HEY, I'M" → "TYLER HAWTHORN" with "AKA CALCITE" subheading
- **CTA button:** "View My Work" with neon border glow (scrolls to Projects section)
- **Animated background scene:** star field, cyber wireframe mountains with parallax, floating UFO with glow beam, pixel rocket launch with smoke particles
- **Three feature cards** below the hero: About Me, Latest Projects, My Skills — each with neon-accented borders and pixel-style icons

**Purpose:** Hook the visitor instantly with personality, visual flair, and clear navigation.

### 2. Projects

A showcase of work. Each project gets a card with thumbnail/preview, title, short description, tech tags, and links (live demo, GitHub). Filterable by technology or category. Cards use the neon-glow hover style consistent with the rest of the site.

**Purpose:** Demonstrate what Tyler has built and his technical range.

### 3. About

Background, story, and interests. A short bio that conveys personality. The pixel-art and cyberpunk accents carry through subtly. No timeline for now (can be added later).

**Purpose:** Give context on who Tyler is beyond the code.

### 4. Skills

A skills grid organized by category. No timeline for now (can be added later).

**Skills Categories:**
- Languages: TypeScript, JavaScript, Java
- Frontend: Angular, React, RxJS, SCSS
- Backend: Node.js, Express.js, REST APIs, WebSockets, Authentication
- Databases: PostgreSQL
- DevOps: Docker, CI/CD Pipelines, Cloud Deployment (Render, AWS)
- Testing & Quality: TDD, Unit Testing, Integration Testing
- Git & Version Control: Git, GitHub, Branching Strategies, Code Reviews
- Architecture & Concepts: Full-Stack Development, RESTful APIs, Client-Server Architecture, Responsive Design

**Purpose:** Show technical breadth at a glance.

### 5. Contact

A clean way to reach out. Email link and social links (GitHub, Twitter/X, LinkedIn) with glowing icon hover effects. No contact form — just direct links. Minimal and focused.

**Purpose:** Make it easy for anyone to get in touch.

## Key Non-Functional Goals

- **Performance:** Lighthouse 90+ across all categories. Lazy-load routes and images. Minimal bundle size. Reduce background complexity on small screens.
- **Mobile-first:** Fully responsive from 320px up. Stack layout vertically on mobile.
- **Accessibility:** Semantic HTML, ARIA labels, keyboard navigation, sufficient contrast ratios.
- **SEO:** Server-side rendering for crawlability. Meta tags, Open Graph, structured data.
- **Readability:** Prioritize readability over aesthetics. Pixel art is decorative, not distracting. Strong visual hierarchy: Name → Role → CTA → Sections.

## Content Strategy

All content (project data, skills, bio text) stored as **static TypeScript data files** — no CMS or database. Simple to update, fast to serve.

# Phase 3: Data Layer — Implementation Plan

> **Historical plan notice (August 13, 2026):** References below to project filters, shared project cards, `/projects/:slug`, or `ProjectDetailComponent` describe the architecture at the time this phase was implemented. The current Projects experience is the single-page focus stage and selector documented in `docs/architecture.md`; those routes/components no longer exist.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Define all TypeScript models and static data constants for the portfolio content, and create placeholder visual assets, so Phases 4–6 can import and render real content without touching the data layer again.

**Architecture:** All content lives as typed TypeScript constants in `src/app/data/`. Interfaces live in `src/app/models/`. Feature (smart) components import from data files and pass primitive-shaped values down to shared components — shared components never import domain models (established in Phase 2). Placeholder images and sprites are SVG files in `src/assets/` that can be swapped by dropping in a replacement file at the same path — no code changes required.

**Tech Stack:** TypeScript (strict), Angular standalone signals, Vitest (`@angular/build:unit-test`), SVG (placeholder assets)

---

## Questions & Decisions

These ambiguities were resolved before writing the plan:

### Q1: SocialLink model vs. existing SocialLinkItem in SocialLinksComponent

The Phase 2 plan explicitly decided that "smart components map model objects to component inputs — the shared components never import domain models." `SocialLinksComponent` defines a local `SocialLinkItem { platform, url, label }` and this stays untouched.

**Decision:** `social-link.model.ts` defines `SocialLink { platform, url, label }` — same shape as `SocialLinkItem` by design. Smart components (Phase 4 footer, Phase 6 contact page) use `socialLinksData` directly and pass values to `SocialLinksComponent` without any conversion needed. **Do not modify `SocialLinksComponent`.**

The spec lists `icon` and `glowColor` as `SocialLink` fields — these are **intentionally omitted** from this model. The `SocialLinksComponent` already handles icon SVG paths internally via its `iconPaths` record (keyed by `platform` string), and per-platform glow colors are a CSS concern handled by class selectors. Neither field needs to travel through the data layer.

### Q2: Flat Skill[] vs. SkillGroup[] in skills data

`SkillsGridComponent` (Phase 6) will render skills grouped by category. Grouping logic in the component is avoidable if data is pre-grouped.

**Decision:** `skills.data.ts` exports `SkillGroup[]` where each group has `{ category, color, skills }`. This is how the data is consumed — export it that way. The `Skill` interface describes individual skills (name + optional icon path for Phase 11 asset swap).

### Q3: GlowColor in Project model

`ProjectCardComponent` already has a `glowColor` input. Should it come from data or be computed (e.g., cyclically assigned)?

**Decision:** Include `glowColor: GlowColor` in the `Project` model. Explicit color assignment in data is intentional: it survives refactors of component logic and makes design intent reviewable in the data file.

### Q4: Placeholder asset format

The dev plan says "styled dark rectangles with project name text." Options: CSS-only backgrounds, data URIs, or SVG files.

**Decision:** SVG files in `src/assets/images/` and `src/assets/pixel-art/`. Actual files are trivially swappable (drop in a PNG at the same path and update `imageUrl` in the data file — one line change). No tooling required to create SVGs. Colors match the design palette.

### Q5: Testing strategy for data files

TypeScript strict mode provides compile-time type safety for interface compliance. Runtime tests only add value for invariants TypeScript cannot enforce (uniqueness, completeness, formatting).

**Decision:** Write data integrity tests for `projects.data.ts` (unique slugs, no empty required fields) and `skills.data.ts` (all 8 categories present, no duplicate skill names). Skip tests for `bio.data.ts` and `social-links.data.ts` — TypeScript strict mode is sufficient there.

### Q6: Bio data shape

Should bio content be a plain string or a structured typed object?

**Decision:** `Bio` interface with named fields (`name`, `alias`, `title`, `tagline`, `email`, `shortBio`, `extendedBio`). A typed object is self-describing, prevents silent field omissions in Phase 4/6 when components consume specific fields, and makes Tyler's future content swap obvious.

### Q7: ProjectCategory type

Should project category be a string or a union type?

**Decision:** `ProjectCategory = 'game' | 'web-app' | 'api' | 'tool' | 'other'` union type. TypeScript enforces valid values at compile time. Phase 6 project filter UI will use these values.

---

## File Map

### Create

| File | Responsibility |
|------|----------------|
| `src/app/models/project.model.ts` | `Project` interface, `ProjectCategory` type |
| `src/app/models/skill.model.ts` | `Skill` interface, `SkillCategory` type, `SkillGroup` interface |
| `src/app/models/social-link.model.ts` | `SocialLink` interface |
| `src/app/models/bio.model.ts` | `Bio` interface |
| `src/app/data/projects.data.ts` | 5 placeholder projects as `readonly Project[]` |
| `src/app/data/projects.data.spec.ts` | Data integrity tests (slug uniqueness, non-empty fields) |
| `src/app/data/skills.data.ts` | All 8 skill groups as `readonly SkillGroup[]` |
| `src/app/data/skills.data.spec.ts` | Data integrity tests (all categories present, no dupes) |
| `src/app/data/bio.data.ts` | Placeholder bio as typed `Bio` constant |
| `src/app/data/social-links.data.ts` | GitHub, Discord, LinkedIn as `readonly SocialLink[]` |
| `src/assets/images/project-pixel-quest.svg` | Thumbnail placeholder — Pixel Quest (cyan) |
| `src/assets/images/project-devboard.svg` | Thumbnail placeholder — DevBoard (blue) |
| `src/assets/images/project-neonchat.svg` | Thumbnail placeholder — NeonChat (purple) |
| `src/assets/images/project-codecraft.svg` | Thumbnail placeholder — CodeCraft API (pink) |
| `src/assets/images/project-starmapper.svg` | Thumbnail placeholder — StarMapper (gold) |
| `src/assets/pixel-art/avatar-placeholder.svg` | Avatar sprite placeholder |
| `src/assets/pixel-art/ufo-placeholder.svg` | UFO sprite placeholder |
| `src/assets/pixel-art/rocket-placeholder.svg` | Rocket sprite placeholder |
| `src/assets/pixel-art/icon-about.svg` | Feature card icon — About |
| `src/assets/pixel-art/icon-projects.svg` | Feature card icon — Projects |
| `src/assets/pixel-art/icon-skills.svg` | Feature card icon — Skills |

### Modify (none — Phase 2 boundary is preserved)

No existing files are modified. The `SocialLinksComponent` keeps its local `SocialLinkItem` type per the Phase 2 architectural decision.

---

## Task 1: Project Model

**Files:**
- Create: `src/app/models/project.model.ts`

- [ ] **Step 1: Create the Project model**

```typescript
// src/app/models/project.model.ts
import { GlowColor } from '../shared/types/glow-color.type';

export type ProjectCategory = 'game' | 'web-app' | 'api' | 'tool' | 'other';

export interface Project {
  title: string;
  slug: string;
  description: string;
  longDescription: string;
  tags: string[];
  imageUrl: string;
  liveUrl?: string;
  githubUrl?: string;
  featured: boolean;
  category: ProjectCategory;
  glowColor: GlowColor;
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `ng build --configuration development 2>&1 | head -30`

Expected: Build succeeds, 0 TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/models/project.model.ts
git commit -m "feat: add Project model"
```

---

## Task 2: Skill Model

**Files:**
- Create: `src/app/models/skill.model.ts`

- [ ] **Step 1: Create the Skill, SkillCategory, and SkillGroup types**

```typescript
// src/app/models/skill.model.ts
import { GlowColor } from '../shared/types/glow-color.type';

export type SkillCategory =
  | 'Languages'
  | 'Frontend'
  | 'Backend'
  | 'Databases'
  | 'DevOps'
  | 'Testing & Quality'
  | 'Git & Version Control'
  | 'Architecture & Concepts';

export interface Skill {
  name: string;
  icon?: string; // asset path — populated in Phase 11 asset swap
}

export interface SkillGroup {
  category: SkillCategory;
  color: GlowColor;
  skills: Skill[];
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `ng build --configuration development 2>&1 | head -30`

Expected: Build succeeds, 0 TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/models/skill.model.ts
git commit -m "feat: add Skill, SkillCategory, and SkillGroup models"
```

---

## Task 3: SocialLink Model

**Files:**
- Create: `src/app/models/social-link.model.ts`

Note: `SocialLinksComponent` is intentionally NOT updated. Its local `SocialLinkItem` type matches this interface by design — smart components use `SocialLink[]` from data and pass the values directly to the component.

- [ ] **Step 1: Create the SocialLink model**

```typescript
// src/app/models/social-link.model.ts

export interface SocialLink {
  /** Matches the platform keys in SocialLinksComponent.iconPaths (e.g. 'github', 'discord', 'linkedin') */
  platform: string;
  url: string;
  label: string;
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `ng build --configuration development 2>&1 | head -30`

Expected: Build succeeds, 0 TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/models/social-link.model.ts
git commit -m "feat: add SocialLink model"
```

---

## Task 4: Projects Data

**Files:**
- Create: `src/app/data/projects.data.spec.ts`
- Create: `src/app/data/projects.data.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/app/data/projects.data.spec.ts
import { projectsData } from './projects.data';

describe('projectsData', () => {
  it('should have at least 4 projects', () => {
    expect(projectsData.length).toBeGreaterThanOrEqual(4);
  });

  it('should have unique slugs', () => {
    const slugs = projectsData.map(p => p.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it('should have no empty required string fields', () => {
    for (const project of projectsData) {
      expect(project.title.trim()).not.toBe('');
      expect(project.slug.trim()).not.toBe('');
      expect(project.description.trim()).not.toBe('');
      expect(project.longDescription.trim()).not.toBe('');
      expect(project.imageUrl.trim()).not.toBe('');
    }
  });

  it('should have valid slugs (lowercase kebab-case only)', () => {
    for (const project of projectsData) {
      expect(project.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('should have at least one featured project', () => {
    const featured = projectsData.filter(p => p.featured);
    expect(featured.length).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `npx ng test --watch=false`

Expected: FAIL — `Cannot find module './projects.data'` (or similar import error).

- [ ] **Step 3: Create the projects data file**

```typescript
// src/app/data/projects.data.ts
import { Project } from '../models/project.model';

export const projectsData: readonly Project[] = [
  {
    title: 'Pixel Quest',
    slug: 'pixel-quest',
    description:
      'A retro-style 2D platformer with hand-crafted pixel art, procedural level generation, and local co-op support.',
    longDescription:
      'Pixel Quest is a passion project combining a love of classic platformers with modern game development techniques. Built with TypeScript and the Canvas API, it features a custom physics engine, procedurally generated dungeons, and a pixel-art rendering pipeline. Supports local two-player co-op and a daily challenge mode.',
    tags: ['TypeScript', 'Canvas API', 'Game Dev', 'Pixel Art'],
    imageUrl: 'assets/images/project-pixel-quest.svg',
    githubUrl: 'https://github.com/CalciteDragon/pixel-quest',
    featured: true,
    category: 'game',
    glowColor: 'cyan',
  },
  {
    title: 'DevBoard',
    slug: 'devboard',
    description:
      'A full-stack developer productivity dashboard — task tracking, GitHub activity, and live metrics in one place.',
    longDescription:
      'DevBoard is a unified workspace for developers who want to stay in flow. It aggregates GitHub activity, tracks personal tasks, and surfaces key project metrics. Built with Angular on the frontend and Node.js/Express on the backend, with a PostgreSQL database and real-time WebSocket updates.',
    tags: ['Angular', 'Node.js', 'PostgreSQL', 'WebSockets', 'REST API'],
    imageUrl: 'assets/images/project-devboard.svg',
    liveUrl: 'https://devboard.calcitedev.me',
    githubUrl: 'https://github.com/CalciteDragon/devboard',
    featured: true,
    category: 'web-app',
    glowColor: 'blue',
  },
  {
    title: 'NeonChat',
    slug: 'neonchat',
    description:
      'A real-time group chat app with room-based messaging, presence indicators, and a cyberpunk UI theme.',
    longDescription:
      'NeonChat delivers real-time messaging via WebSockets with a latency-first architecture. Features include room creation, user presence indicators, message history persistence in PostgreSQL, and JWT-based authentication. The UI is built in React with a neon cyberpunk aesthetic.',
    tags: ['React', 'Node.js', 'WebSockets', 'PostgreSQL', 'Authentication'],
    imageUrl: 'assets/images/project-neonchat.svg',
    githubUrl: 'https://github.com/CalciteDragon/neonchat',
    featured: false,
    category: 'web-app',
    glowColor: 'purple',
  },
  {
    title: 'CodeCraft API',
    slug: 'codecraft-api',
    description:
      'A RESTful API platform for managing code snippets — tagging, search, versioning, and team sharing.',
    longDescription:
      'CodeCraft API is a developer utility for organizing reusable code snippets across projects and teams. It provides full CRUD operations, tag-based search, snippet versioning, and team workspaces. Built as a containerized Node.js/Express service with Docker, PostgreSQL, and JWT authentication.',
    tags: ['Node.js', 'Express.js', 'REST API', 'Docker', 'PostgreSQL'],
    imageUrl: 'assets/images/project-codecraft.svg',
    githubUrl: 'https://github.com/CalciteDragon/codecraft-api',
    featured: false,
    category: 'api',
    glowColor: 'pink',
  },
  {
    title: 'StarMapper',
    slug: 'starmapper',
    description:
      'An interactive star map visualization — browse the night sky, search constellations, and save personal observations.',
    longDescription:
      'StarMapper renders a real-time interactive star map in the browser using the Canvas API and real astronomical data. Users can rotate the view, search for constellations, and log personal sky observations with timestamps and notes. A clean, minimal Angular UI keeps the focus on the stars.',
    tags: ['TypeScript', 'Canvas API', 'Angular', 'SCSS'],
    imageUrl: 'assets/images/project-starmapper.svg',
    liveUrl: 'https://starmapper.calcitedev.me',
    githubUrl: 'https://github.com/CalciteDragon/starmapper',
    featured: true,
    category: 'tool',
    glowColor: 'gold',
  },
];
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npx ng test --watch=false`

Expected: PASS — all 5 `projectsData` tests pass (other test suites should also still pass).

- [ ] **Step 5: Commit**

```bash
git add src/app/data/projects.data.ts src/app/data/projects.data.spec.ts
git commit -m "feat: add placeholder projects data with integrity tests"
```

---

## Task 5: Skills Data

**Files:**
- Create: `src/app/data/skills.data.spec.ts`
- Create: `src/app/data/skills.data.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/app/data/skills.data.spec.ts
import { skillsData } from './skills.data';
import { SkillCategory } from '../models/skill.model';

const EXPECTED_CATEGORIES: SkillCategory[] = [
  'Languages',
  'Frontend',
  'Backend',
  'Databases',
  'DevOps',
  'Testing & Quality',
  'Git & Version Control',
  'Architecture & Concepts',
];

describe('skillsData', () => {
  it('should contain exactly 8 groups', () => {
    expect(skillsData.length).toBe(8);
  });

  it('should contain all required categories', () => {
    const categories = skillsData.map(g => g.category);
    for (const expected of EXPECTED_CATEGORIES) {
      expect(categories).toContain(expected);
    }
  });

  it('should have no duplicate category entries', () => {
    const categories = skillsData.map(g => g.category);
    const unique = new Set(categories);
    expect(unique.size).toBe(categories.length);
  });

  it('should have no empty skill groups', () => {
    for (const group of skillsData) {
      expect(group.skills.length).toBeGreaterThan(0);
    }
  });

  it('should have no duplicate skill names across all groups', () => {
    const allNames = skillsData.flatMap(g => g.skills.map(s => s.name.toLowerCase()));
    const unique = new Set(allNames);
    expect(unique.size).toBe(allNames.length);
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `npx ng test --watch=false`

Expected: FAIL — `Cannot find module './skills.data'`.

- [ ] **Step 3: Create the skills data file**

```typescript
// src/app/data/skills.data.ts
import { SkillGroup } from '../models/skill.model';

export const skillsData: readonly SkillGroup[] = [
  {
    category: 'Languages',
    color: 'cyan',
    skills: [
      { name: 'TypeScript' },
      { name: 'JavaScript' },
      { name: 'Java' },
    ],
  },
  {
    category: 'Frontend',
    color: 'blue',
    skills: [
      { name: 'Angular' },
      { name: 'React' },
      { name: 'RxJS' },
      { name: 'SCSS' },
    ],
  },
  {
    category: 'Backend',
    color: 'purple',
    skills: [
      { name: 'Node.js' },
      { name: 'Express.js' },
      { name: 'REST APIs' },
      { name: 'WebSockets' },
      { name: 'Authentication' },
    ],
  },
  {
    category: 'Databases',
    color: 'pink',
    skills: [
      { name: 'PostgreSQL' },
    ],
  },
  {
    category: 'DevOps',
    color: 'gold',
    skills: [
      { name: 'Docker' },
      { name: 'CI/CD Pipelines' },
      { name: 'Render' },
      { name: 'AWS' },
    ],
  },
  {
    category: 'Testing & Quality',
    color: 'cyan',
    skills: [
      { name: 'TDD' },
      { name: 'Unit Testing' },
      { name: 'Integration Testing' },
    ],
  },
  {
    category: 'Git & Version Control',
    color: 'blue',
    skills: [
      { name: 'Git' },
      { name: 'GitHub' },
      { name: 'Branching Strategies' },
      { name: 'Code Reviews' },
    ],
  },
  {
    category: 'Architecture & Concepts',
    color: 'purple',
    skills: [
      { name: 'Full-Stack Development' },
      { name: 'RESTful APIs' },
      { name: 'Client-Server Architecture' },
      { name: 'Responsive Design' },
    ],
  },
];
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npx ng test --watch=false`

Expected: PASS — all 5 `skillsData` tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/data/skills.data.ts src/app/data/skills.data.spec.ts
git commit -m "feat: add skills data for all 8 categories with integrity tests"
```

---

## Task 6: Bio Model + Bio Data

**Files:**
- Create: `src/app/models/bio.model.ts`
- Create: `src/app/data/bio.data.ts`

No spec test needed — TypeScript strict mode enforces `Bio` field completeness at compile time. Placeholder prose text has no runtime invariants worth testing. The `Bio` interface lives in `models/` (consistent with all other interfaces) so feature components can type-check against it without importing from the data layer.

- [ ] **Step 1: Create the bio model**

```typescript
// src/app/models/bio.model.ts

export interface Bio {
  name: string;
  alias: string;
  title: string;
  tagline: string;
  email: string;
  shortBio: string;
  extendedBio: string;
}
```

- [ ] **Step 2: Create the bio data file**

```typescript
// src/app/data/bio.data.ts
import { Bio } from '../models/bio.model';

export const bioData: Bio = {
  name: 'Tyler Hawthorn',
  alias: 'Calcite',
  title: 'Full Stack Developer & Game Enthusiast',
  tagline: 'Code · Create · Innovate',
  email: 'tyler@calcitedev.me',
  shortBio:
    'Full stack developer building fast, well-tested web apps and the occasional game. Passionate about clean architecture, pixel art, and systems that are a joy to work in.',
  extendedBio:
    "I'm Tyler Hawthorn — developer, builder, and occasional pixel artist. I specialize in TypeScript-heavy full stack development with Angular and Node.js, with a soft spot for game development on the side.\n\nI care deeply about code quality, developer experience, and building things that are genuinely useful. When I'm not writing code, I'm likely designing pixel art, playing indie games, or deep-diving into something I probably shouldn't have started at 11pm.",
};
```

- [ ] **Step 3: Verify both files compile**

Run: `ng build --configuration development 2>&1 | head -30`

Expected: Build succeeds, 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/models/bio.model.ts src/app/data/bio.data.ts
git commit -m "feat: add Bio model and placeholder bio data"
```

---

## Task 7: Social Links Data

**Files:**
- Create: `src/app/data/social-links.data.ts`

The `platform` string values must match the keys in `SocialLinksComponent.iconPaths` (`'github'`, `'discord'`, `'linkedin'`, `'twitter'`). The component uses these strings to look up SVG paths.

- [ ] **Step 1: Create the social links data file**

```typescript
// src/app/data/social-links.data.ts
import { SocialLink } from '../models/social-link.model';

export const socialLinksData: readonly SocialLink[] = [
  {
    platform: 'github',
    url: 'https://github.com/CalciteDragon',
    label: 'GitHub',
  },
  {
    platform: 'discord',
    url: 'https://discord.com/users/calcite',
    label: 'Discord',
  },
  {
    platform: 'linkedin',
    url: 'https://linkedin.com/in/tyler-hawthorn',
    label: 'LinkedIn',
  },
];
```

- [ ] **Step 2: Verify the file compiles**

Run: `ng build --configuration development 2>&1 | head -30`

Expected: Build succeeds, 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/data/social-links.data.ts
git commit -m "feat: add social links data"
```

---

## Task 8: Placeholder Project Thumbnail SVGs

**Files:**
- Create: `src/assets/images/project-pixel-quest.svg`
- Create: `src/assets/images/project-devboard.svg`
- Create: `src/assets/images/project-neonchat.svg`
- Create: `src/assets/images/project-codecraft.svg`
- Create: `src/assets/images/project-starmapper.svg`

Each file is an 800×450 SVG (16:9) using the project's accent color. `imageUrl` in `projects.data.ts` already points to these paths. To swap in a real screenshot: save it at the same path and update `imageUrl` in the data file — that's it.

- [ ] **Step 1: Create `project-pixel-quest.svg` (accent: cyan `#22D3EE`)**

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
  <rect width="800" height="450" fill="#111827"/>
  <rect x="0" y="0" width="800" height="450" fill="none" stroke="#22D3EE" stroke-width="2" stroke-opacity="0.3"/>
  <!-- pixel corner brackets -->
  <rect x="16" y="16" width="8" height="8" fill="#22D3EE" fill-opacity="0.7"/>
  <rect x="26" y="16" width="4" height="4" fill="#22D3EE" fill-opacity="0.3"/>
  <rect x="16" y="26" width="4" height="4" fill="#22D3EE" fill-opacity="0.3"/>
  <rect x="776" y="16" width="8" height="8" fill="#22D3EE" fill-opacity="0.7"/>
  <rect x="770" y="16" width="4" height="4" fill="#22D3EE" fill-opacity="0.3"/>
  <rect x="776" y="26" width="4" height="4" fill="#22D3EE" fill-opacity="0.3"/>
  <rect x="16" y="426" width="8" height="8" fill="#22D3EE" fill-opacity="0.7"/>
  <rect x="26" y="426" width="4" height="4" fill="#22D3EE" fill-opacity="0.3"/>
  <rect x="16" y="420" width="4" height="4" fill="#22D3EE" fill-opacity="0.3"/>
  <rect x="776" y="426" width="8" height="8" fill="#22D3EE" fill-opacity="0.7"/>
  <rect x="770" y="426" width="4" height="4" fill="#22D3EE" fill-opacity="0.3"/>
  <rect x="776" y="420" width="4" height="4" fill="#22D3EE" fill-opacity="0.3"/>
  <!-- label -->
  <text x="400" y="210" font-family="monospace" font-size="28" font-weight="bold"
        fill="#22D3EE" fill-opacity="0.7" text-anchor="middle">PIXEL QUEST</text>
  <text x="400" y="250" font-family="monospace" font-size="13"
        fill="#9CA3AF" text-anchor="middle">[ project thumbnail placeholder ]</text>
</svg>
```

- [ ] **Step 2: Create `project-devboard.svg` (accent: blue `#3B82F6`)**

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
  <rect width="800" height="450" fill="#111827"/>
  <rect x="0" y="0" width="800" height="450" fill="none" stroke="#3B82F6" stroke-width="2" stroke-opacity="0.3"/>
  <rect x="16" y="16" width="8" height="8" fill="#3B82F6" fill-opacity="0.7"/>
  <rect x="26" y="16" width="4" height="4" fill="#3B82F6" fill-opacity="0.3"/>
  <rect x="16" y="26" width="4" height="4" fill="#3B82F6" fill-opacity="0.3"/>
  <rect x="776" y="16" width="8" height="8" fill="#3B82F6" fill-opacity="0.7"/>
  <rect x="770" y="16" width="4" height="4" fill="#3B82F6" fill-opacity="0.3"/>
  <rect x="776" y="26" width="4" height="4" fill="#3B82F6" fill-opacity="0.3"/>
  <rect x="16" y="426" width="8" height="8" fill="#3B82F6" fill-opacity="0.7"/>
  <rect x="26" y="426" width="4" height="4" fill="#3B82F6" fill-opacity="0.3"/>
  <rect x="16" y="420" width="4" height="4" fill="#3B82F6" fill-opacity="0.3"/>
  <rect x="776" y="426" width="8" height="8" fill="#3B82F6" fill-opacity="0.7"/>
  <rect x="770" y="426" width="4" height="4" fill="#3B82F6" fill-opacity="0.3"/>
  <rect x="776" y="420" width="4" height="4" fill="#3B82F6" fill-opacity="0.3"/>
  <text x="400" y="210" font-family="monospace" font-size="28" font-weight="bold"
        fill="#3B82F6" fill-opacity="0.7" text-anchor="middle">DEVBOARD</text>
  <text x="400" y="250" font-family="monospace" font-size="13"
        fill="#9CA3AF" text-anchor="middle">[ project thumbnail placeholder ]</text>
</svg>
```

- [ ] **Step 3: Create `project-neonchat.svg` (accent: purple `#8B5CF6`)**

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
  <rect width="800" height="450" fill="#111827"/>
  <rect x="0" y="0" width="800" height="450" fill="none" stroke="#8B5CF6" stroke-width="2" stroke-opacity="0.3"/>
  <rect x="16" y="16" width="8" height="8" fill="#8B5CF6" fill-opacity="0.7"/>
  <rect x="26" y="16" width="4" height="4" fill="#8B5CF6" fill-opacity="0.3"/>
  <rect x="16" y="26" width="4" height="4" fill="#8B5CF6" fill-opacity="0.3"/>
  <rect x="776" y="16" width="8" height="8" fill="#8B5CF6" fill-opacity="0.7"/>
  <rect x="770" y="16" width="4" height="4" fill="#8B5CF6" fill-opacity="0.3"/>
  <rect x="776" y="26" width="4" height="4" fill="#8B5CF6" fill-opacity="0.3"/>
  <rect x="16" y="426" width="8" height="8" fill="#8B5CF6" fill-opacity="0.7"/>
  <rect x="26" y="426" width="4" height="4" fill="#8B5CF6" fill-opacity="0.3"/>
  <rect x="16" y="420" width="4" height="4" fill="#8B5CF6" fill-opacity="0.3"/>
  <rect x="776" y="426" width="8" height="8" fill="#8B5CF6" fill-opacity="0.7"/>
  <rect x="770" y="426" width="4" height="4" fill="#8B5CF6" fill-opacity="0.3"/>
  <rect x="776" y="420" width="4" height="4" fill="#8B5CF6" fill-opacity="0.3"/>
  <text x="400" y="210" font-family="monospace" font-size="28" font-weight="bold"
        fill="#8B5CF6" fill-opacity="0.7" text-anchor="middle">NEONCHAT</text>
  <text x="400" y="250" font-family="monospace" font-size="13"
        fill="#9CA3AF" text-anchor="middle">[ project thumbnail placeholder ]</text>
</svg>
```

- [ ] **Step 4: Create `project-codecraft.svg` (accent: pink `#EC4899`)**

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
  <rect width="800" height="450" fill="#111827"/>
  <rect x="0" y="0" width="800" height="450" fill="none" stroke="#EC4899" stroke-width="2" stroke-opacity="0.3"/>
  <rect x="16" y="16" width="8" height="8" fill="#EC4899" fill-opacity="0.7"/>
  <rect x="26" y="16" width="4" height="4" fill="#EC4899" fill-opacity="0.3"/>
  <rect x="16" y="26" width="4" height="4" fill="#EC4899" fill-opacity="0.3"/>
  <rect x="776" y="16" width="8" height="8" fill="#EC4899" fill-opacity="0.7"/>
  <rect x="770" y="16" width="4" height="4" fill="#EC4899" fill-opacity="0.3"/>
  <rect x="776" y="26" width="4" height="4" fill="#EC4899" fill-opacity="0.3"/>
  <rect x="16" y="426" width="8" height="8" fill="#EC4899" fill-opacity="0.7"/>
  <rect x="26" y="426" width="4" height="4" fill="#EC4899" fill-opacity="0.3"/>
  <rect x="16" y="420" width="4" height="4" fill="#EC4899" fill-opacity="0.3"/>
  <rect x="776" y="426" width="8" height="8" fill="#EC4899" fill-opacity="0.7"/>
  <rect x="770" y="426" width="4" height="4" fill="#EC4899" fill-opacity="0.3"/>
  <rect x="776" y="420" width="4" height="4" fill="#EC4899" fill-opacity="0.3"/>
  <text x="400" y="210" font-family="monospace" font-size="28" font-weight="bold"
        fill="#EC4899" fill-opacity="0.7" text-anchor="middle">CODECRAFT API</text>
  <text x="400" y="250" font-family="monospace" font-size="13"
        fill="#9CA3AF" text-anchor="middle">[ project thumbnail placeholder ]</text>
</svg>
```

- [ ] **Step 5: Create `project-starmapper.svg` (accent: gold `#F59E0B`)**

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
  <rect width="800" height="450" fill="#111827"/>
  <rect x="0" y="0" width="800" height="450" fill="none" stroke="#F59E0B" stroke-width="2" stroke-opacity="0.3"/>
  <rect x="16" y="16" width="8" height="8" fill="#F59E0B" fill-opacity="0.7"/>
  <rect x="26" y="16" width="4" height="4" fill="#F59E0B" fill-opacity="0.3"/>
  <rect x="16" y="26" width="4" height="4" fill="#F59E0B" fill-opacity="0.3"/>
  <rect x="776" y="16" width="8" height="8" fill="#F59E0B" fill-opacity="0.7"/>
  <rect x="770" y="16" width="4" height="4" fill="#F59E0B" fill-opacity="0.3"/>
  <rect x="776" y="26" width="4" height="4" fill="#F59E0B" fill-opacity="0.3"/>
  <rect x="16" y="426" width="8" height="8" fill="#F59E0B" fill-opacity="0.7"/>
  <rect x="26" y="426" width="4" height="4" fill="#F59E0B" fill-opacity="0.3"/>
  <rect x="16" y="420" width="4" height="4" fill="#F59E0B" fill-opacity="0.3"/>
  <rect x="776" y="426" width="8" height="8" fill="#F59E0B" fill-opacity="0.7"/>
  <rect x="770" y="426" width="4" height="4" fill="#F59E0B" fill-opacity="0.3"/>
  <rect x="776" y="420" width="4" height="4" fill="#F59E0B" fill-opacity="0.3"/>
  <text x="400" y="210" font-family="monospace" font-size="28" font-weight="bold"
        fill="#F59E0B" fill-opacity="0.7" text-anchor="middle">STARMAPPER</text>
  <text x="400" y="250" font-family="monospace" font-size="13"
        fill="#9CA3AF" text-anchor="middle">[ project thumbnail placeholder ]</text>
</svg>
```

- [ ] **Step 6: Commit**

```bash
git add src/assets/images/project-pixel-quest.svg src/assets/images/project-devboard.svg \
        src/assets/images/project-neonchat.svg src/assets/images/project-codecraft.svg \
        src/assets/images/project-starmapper.svg
git commit -m "chore: add placeholder project thumbnail SVGs"
```

---

## Task 9: Placeholder Pixel-Art Sprite SVGs

**Files:**
- Create: `src/assets/pixel-art/avatar-placeholder.svg`
- Create: `src/assets/pixel-art/ufo-placeholder.svg`
- Create: `src/assets/pixel-art/rocket-placeholder.svg`
- Create: `src/assets/pixel-art/icon-about.svg`
- Create: `src/assets/pixel-art/icon-projects.svg`
- Create: `src/assets/pixel-art/icon-skills.svg`

All sprites use simple pixel-grid SVG geometry — clearly identifiable as placeholders, correct colors, trivially swappable in Phase 11.

- [ ] **Step 1: Create `avatar-placeholder.svg`**

Pixel humanoid with laptop. 64×64 viewBox, cyan accent.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <!-- head -->
  <rect x="22" y="10" width="20" height="18" fill="#22D3EE" fill-opacity="0.85"/>
  <!-- eyes -->
  <rect x="26" y="16" width="4" height="4" fill="#0B0F1A"/>
  <rect x="34" y="16" width="4" height="4" fill="#0B0F1A"/>
  <!-- body -->
  <rect x="18" y="30" width="28" height="18" fill="#22D3EE" fill-opacity="0.6"/>
  <!-- laptop screen -->
  <rect x="14" y="38" width="36" height="8" fill="#111827" stroke="#22D3EE" stroke-width="1" stroke-opacity="0.5"/>
  <!-- laptop base -->
  <rect x="12" y="46" width="40" height="4" fill="#1E2A45"/>
</svg>
```

- [ ] **Step 2: Create `ufo-placeholder.svg`**

Flying saucer with glow beam. 80×60 viewBox, purple accent.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 60" width="80" height="60">
  <!-- glow beam (rendered behind saucer) -->
  <polygon points="28,34 52,34 48,58 32,58" fill="#8B5CF6" fill-opacity="0.15"/>
  <!-- saucer body -->
  <ellipse cx="40" cy="30" rx="30" ry="9" fill="#8B5CF6" fill-opacity="0.55"/>
  <!-- dome -->
  <ellipse cx="40" cy="24" rx="14" ry="9" fill="#8B5CF6" fill-opacity="0.8"/>
  <!-- dome window -->
  <ellipse cx="40" cy="24" rx="7" ry="5" fill="#22D3EE" fill-opacity="0.45"/>
  <!-- underside light strip -->
  <ellipse cx="40" cy="36" rx="14" ry="3" fill="#8B5CF6" fill-opacity="0.9"/>
</svg>
```

- [ ] **Step 3: Create `rocket-placeholder.svg`**

Pixel rocket with fins and exhaust. 40×80 viewBox, gold accent.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 80" width="40" height="80">
  <!-- nose cone -->
  <polygon points="20,2 10,24 30,24" fill="#F59E0B" fill-opacity="0.9"/>
  <!-- body -->
  <rect x="10" y="22" width="20" height="34" fill="#F59E0B" fill-opacity="0.65"/>
  <!-- window -->
  <rect x="14" y="28" width="12" height="10" rx="2" fill="#22D3EE" fill-opacity="0.6"/>
  <!-- left fin -->
  <polygon points="10,50 2,68 10,68" fill="#F59E0B" fill-opacity="0.5"/>
  <!-- right fin -->
  <polygon points="30,50 38,68 30,68" fill="#F59E0B" fill-opacity="0.5"/>
  <!-- exhaust flame -->
  <rect x="12" y="56" width="16" height="8" fill="#EC4899" fill-opacity="0.7"/>
  <rect x="15" y="64" width="10" height="6" fill="#F59E0B" fill-opacity="0.5"/>
</svg>
```

- [ ] **Step 4: Create `icon-about.svg`**

Person silhouette (feature card icon). 32×32 viewBox, cyan accent.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <!-- head -->
  <rect x="10" y="2" width="12" height="12" fill="#22D3EE" fill-opacity="0.85"/>
  <!-- eyes -->
  <rect x="12" y="6" width="3" height="3" fill="#0B0F1A"/>
  <rect x="17" y="6" width="3" height="3" fill="#0B0F1A"/>
  <!-- body -->
  <rect x="6" y="16" width="20" height="14" fill="#22D3EE" fill-opacity="0.5"/>
  <!-- collar detail -->
  <rect x="13" y="16" width="6" height="4" fill="#22D3EE" fill-opacity="0.9"/>
</svg>
```

- [ ] **Step 5: Create `icon-projects.svg`**

Folder with code brackets (feature card icon). 32×32 viewBox, blue accent.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <!-- folder tab -->
  <rect x="2" y="6" width="12" height="5" fill="#3B82F6" fill-opacity="0.9"/>
  <!-- folder body -->
  <rect x="2" y="10" width="28" height="20" fill="#3B82F6" fill-opacity="0.45"/>
  <!-- left bracket -->
  <rect x="6" y="15" width="3" height="10" fill="#22D3EE" fill-opacity="0.85"/>
  <rect x="6" y="15" width="5" height="3" fill="#22D3EE" fill-opacity="0.85"/>
  <rect x="6" y="22" width="5" height="3" fill="#22D3EE" fill-opacity="0.85"/>
  <!-- right bracket -->
  <rect x="23" y="15" width="3" height="10" fill="#22D3EE" fill-opacity="0.85"/>
  <rect x="21" y="15" width="5" height="3" fill="#22D3EE" fill-opacity="0.85"/>
  <rect x="21" y="22" width="5" height="3" fill="#22D3EE" fill-opacity="0.85"/>
  <!-- center slash -->
  <rect x="14" y="13" width="4" height="16" fill="#3B82F6" fill-opacity="0.7" transform="rotate(-15 16 21)"/>
</svg>
```

- [ ] **Step 6: Create `icon-skills.svg`**

Lightning bolt (feature card icon). 32×32 viewBox, purple accent.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <polygon points="20,2 8,18 15,18 12,30 24,14 17,14"
           fill="#8B5CF6" fill-opacity="0.9"/>
</svg>
```

- [ ] **Step 7: Commit**

```bash
git add src/assets/pixel-art/avatar-placeholder.svg src/assets/pixel-art/ufo-placeholder.svg \
        src/assets/pixel-art/rocket-placeholder.svg src/assets/pixel-art/icon-about.svg \
        src/assets/pixel-art/icon-projects.svg src/assets/pixel-art/icon-skills.svg
git commit -m "chore: add placeholder pixel-art sprite SVGs"
```

---

## Task 10: Final Verification

- [ ] **Step 1: Full build — verify zero TypeScript errors**

Run: `ng build --configuration development`

Expected: Build completes with 0 errors. The bundle size should be negligible — data files are tiny strings.

- [ ] **Step 2: Run full test suite**

Run: `npx ng test --watch=false`

Expected: All tests pass, including the Phase 2 directive tests and the new Phase 3 data integrity tests.

- [ ] **Step 3: Verify import paths from a feature component perspective**

Add these imports temporarily to `src/app/features/home/home.component.ts` and verify no TypeScript errors in the editor or build:

```typescript
import { projectsData } from '../../data/projects.data';
import { skillsData } from '../../data/skills.data';
import { bioData } from '../../data/bio.data';
import { socialLinksData } from '../../data/social-links.data';
```

Remove after verification. This confirms import paths are correct from the `features/` depth.

- [ ] **Step 4: Update `docs/development.md` — mark Phase 3 tasks complete**

In `docs/development.md`, update the Phase 3 task list:

```markdown
- [x] `project.model.ts` — `Project` interface (title, slug, description, longDescription, tags, imageUrl, liveUrl?, githubUrl?, featured, category, glowColor)
- [x] `skill.model.ts` — `Skill` interface, `SkillCategory` type, `SkillGroup` interface
- [x] `social-link.model.ts` — `SocialLink` interface (platform, url, label)
- [x] `projects.data.ts` — 5 placeholder projects with realistic titles/descriptions and placeholder image paths
- [x] `skills.data.ts` — full skills list as `SkillGroup[]` organized by the 8 categories Tyler provided
- [x] `bio.data.ts` — placeholder bio text (Tyler fills in real copy later)
- [x] `social-links.data.ts` — GitHub, Discord, LinkedIn entries
- [x] Create placeholder images in `assets/images/` — styled dark SVGs with project name, matching the color palette
- [x] Create placeholder pixel-art sprites in `assets/pixel-art/` — simple geometric SVGs for avatar, UFO, rocket, card icons
```

- [ ] **Step 5: Commit docs update**

```bash
git add docs/development.md
git commit -m "docs: mark Phase 3 data layer tasks complete"
```

---

## Done

Phase 3 is complete when:
- `import { projectsData } from '../../data/projects.data'` resolves with full type safety in any feature component
- `import { skillsData } from '../../data/skills.data'` resolves and returns a typed `SkillGroup[]`
- `import { bioData } from '../../data/bio.data'` resolves with all `Bio` fields populated
- `import { socialLinksData } from '../../data/social-links.data'` resolves with 3 `SocialLink` entries
- All 5 project thumbnail SVGs exist in `src/assets/images/`
- All 6 pixel-art sprite SVGs exist in `src/assets/pixel-art/`
- All tests pass (`npx ng test --watch=false`)
- Phase 3 tasks are checked off in `docs/development.md`

**Phase 4 (Home Page Hero + Feature Cards) is now unblocked.**

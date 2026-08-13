# Project Showcase Overhaul — Phase Record

## Goal

Replace filler projects and route-based detail pages with a flexible single-page showcase: one stable, swappable focus stage and a compact preview index underneath it.

## Phase 1 — Audit and Research ✅

- Audited the clean `replace-filler` branch, current Projects grid/filter implementation, data model, shared cards, detail route, prerender configuration, tests, assets, and living docs.
- Researched Live Bingo, Pineapple Expense, Mochi 2026, and Minecraft Hide & Seek from their repository READMEs, source, build files, and architecture notes.
- Corrected portfolio claims to match the code: Live Bingo is currently a private-lobby 1v1 Minecraft-goal race; Hide & Seek targets Paper API 1.21; Mochi copy says “contributed” rather than implying sole authorship; Pineapple is presented as a capstone rather than a guaranteed live service.
- Defined responsive, accessible, reduced-motion, and layout-stability requirements before implementation.

## Phase 2 — Data, UI, Routes, and Assets ✅

- Replaced DevBoard, NeonChat, CodeCraft API, and StarMapper with six real/current entries alongside Pixel Quest.
- Simplified `Project` to readonly display fields; removed `featured` and `category` route/filter assumptions.
- Implemented `ProjectFocusStageComponent`: all articles overlap in one grid cell, making the stage height stable across swaps.
- Implemented `ProjectSelectorComponent`: real buttons, unchanged list order, explicit active marker, `aria-pressed`, `aria-controls`, compact responsive layouts, and no nested links.
- Follow-up: reordered the index to lead with Live Bingo, Pineapple Expense, Calcite Portfolio, and Mochi 2026, and added individual scroll-reveal wrappers to every preview card.
- Added local signal selection, polite announcements, keyboard focus handling, and viewport return beneath the fixed navbar.
- Added project-accent crossfade/rise/image/corner motion with a no-motion fallback.
- Removed the old filter UI, `ProjectListComponent`, shared `ProjectCardComponent`/`CardComponent`, `ProjectDetailComponent`, parameterized route, and prerender slug enumeration.
- Retained Pixel Quest art and created six original 640×360 SVG previews derived from verified project behavior. The portfolio art uses a finite recursive window composition.

## Phase 3 — Visual Iteration ✅

- Compared the baseline 3-column filler grid against the running redesign.
- Validated desktop at 1440×1000: stable 7/5 focus split, readable surface, two-row four-column project index, accent switching, and recursive art.
- Validated mobile at 390×844: 16:9 focus art, compact horizontal selector cards, readable long descriptions/tags, mobile drawer navigation, selection state, and automatic return to the updated focus article.
- Corrected the first iteration's mobile focus art from a tall cropped box to a true 16:9 frame.
- Confirmed the DOM exposes one active project article and seven labeled project buttons; inactive focus articles are inert and hidden from the accessibility tree.

## Phase 4 — Verification and Documentation ✅

- `npm test`: 19 files, 122 tests passing.
- `npm run build`: succeeds, 4 static routes prerendered.
- Build warnings remain below the 8 kB error threshold: hero 7.39 kB, About 7.75 kB, project focus 6.59 kB, project selector 4.82 kB.
- Updated `AI_GUIDE.md`, `README.md`, and the overview, architecture, design, conventions, development, and questions docs.
- Marked older implementation plans as historical where their project filter/detail-route instructions were superseded.

## Deferred / Replaceable

- The six new previews are original themed illustrations because the researched repositories generally do not contain polished application screenshots. Each remains replaceable at its stable `public/assets/images/` path.
- The Roblox project intentionally has no external action while it is private/in development; its focus panel shows `Building in private`.
- Full-site Lighthouse, cross-browser, device, and contrast audits remain Phase 9 work.

# Handoff: Extras Platformer

## Start here

- Read `AGENTS.md` and `AI_GUIDE.md` in full before making changes.
- Current branch: `replace-filler`.
- Last commit: `73660fb feat: replace skills with extras platformer`.
- The baseline Skills-to-Extras replacement is committed in `73660fb`.
- The refinements documented below are implemented and verified but are **not committed**. Preserve the current working tree.
- `handoff.md` and `extra-media-screen.component.spec.ts` are currently untracked.

## Current status

The Extras section is a small DOM/CSS platformer placed directly over the site's existing mountain-and-stars background. The three large media panes are both content screens and collision platforms. The latest interaction, playback, ordering, and pane-cleanup requests are complete in the working tree.

The current left-to-right order is:

1. **Capstone Summit** - gallery placeholders for the senior capstone presentation.
2. **Keyboard Cove** - the custom-keyboard YouTube video.
3. **Robotics Outpost** - competition photo/video placeholders for Ramen Robotics 9036 / Mochi 2026.

The main remaining content task is replacing the Capstone and Robotics placeholders when final assets are available.

## Current behavior

- A transparent 1800x700 desktop world scales uniformly to the available width, keeping all three islands visible at once.
- The explorer starts at world position `x: 680, y: 187`, near the left edge of the middle Keyboard island.
- No island is active initially. The first WASD keypress hides the `try WASD` hint and activates the platform beneath the explorer. Arrow keys can move the explorer but do not perform this initial activation.
- WASD and arrow-key input is listened for at the document level, so teleport focus and clicks elsewhere on the page do not stop character control. Editable fields are excluded, and held input is cleared if the window loses focus.
- `W`/Arrow Up jumps, `A`/Arrow Left and `D`/Arrow Right move, and `S`/Arrow Down crouches. The visible arrow, movement, and jump buttons have been removed.
- Clicking an inactive pane still teleports the explorer through an invisible full-pane button with an accessible label. After the first WASD activation, teleporting also activates the destination.
- An active platform rises 8px; its collision surface rises with it so the explorer remains aligned.
- After the explorer leaves an active platform, it stays active for one second. Landing again during that grace period cancels deactivation.
- Falling out of the world respawns the explorer on the last visited island.
- Galleries advance every 5.2 seconds only while their island is active, pause while the document is hidden, and respect reduced-motion preferences.
- Multi-item galleries retain only their previous/next arrow controls inside the pane. The redundant pane header/status, footer caption/counter/link, and visible `CLICK TO TELEPORT` label are removed.
- The island title and description above each pane remain unchanged.
- The Keyboard YouTube iframe uses `youtube-nocookie.com`, autoplay is muted, and YouTube's player messages are used to retain the latest playback time in memory. When playback stops because the island deactivates, the next iframe starts at the saved whole-second timestamp.
- Below 1080px component width, the platformer is replaced by vertically stacked media panes with no game semantics or movement controls. Gallery arrows remain available.

## Current world geometry

| Surface | Position | Size |
| --- | --- | --- |
| Capstone Summit | x 30, y 300 | 556x350 |
| Keyboard Cove | x 622, y 235 | 556x365 |
| Robotics Outpost | x 1214, y 300 | 556x350 |

The explorer is 38x48, starts 58px from Keyboard Cove's left edge, and uses a jump velocity of -620. Teleporting places it at the horizontal center/top of the selected pane.

## Content status

- Keyboard Cove uses <https://www.youtube.com/watch?v=xph8DTsWbxM>.
- Capstone Summit contains three labeled image placeholders.
- Robotics Outpost contains two image placeholders and one video placeholder.
- Replace placeholder records in `src/app/data/extras.data.ts` once the final media files or video IDs are available.
- The keyboard caption is stored correctly as UTF-8: `Made a keyboard :) · 4:28`. Some PowerShell output may display the middle dot incorrectly; do not change the source solely because of terminal rendering.

## Important files

- `src/app/data/extras.data.ts` - island order, copy, and media records.
- `src/app/data/extras.data.spec.ts` - content and ordering coverage.
- `src/app/models/extra.model.ts` - Extras topic/media types.
- `src/app/features/home/sections/extras-section/extras-section.component.*` - section shell and heading.
- `src/app/features/home/sections/extras-section/extras-platformer/extras-platformer.component.ts` - geometry, physics, global keyboard input, delayed activation/deactivation, teleporting, responsive mode, and gallery timer.
- `src/app/features/home/sections/extras-section/extras-platformer/extras-platformer.component.html` - desktop world, stacked fallback, island copy, and explorer.
- `src/app/features/home/sections/extras-section/extras-platformer/extras-platformer.component.scss` - island, explorer, activation-rise, and responsive styling.
- `src/app/features/home/sections/extras-section/extras-platformer/extras-platformer.component.spec.ts` - gameplay and interaction coverage.
- `src/app/features/home/sections/extras-section/extra-media-screen/extra-media-screen.component.ts` - YouTube URL/player messaging, timestamp retention, and media events.
- `src/app/features/home/sections/extras-section/extra-media-screen/extra-media-screen.component.html` - full-height media viewport, gallery arrows, and accessible teleport overlay.
- `src/app/features/home/sections/extras-section/extra-media-screen/extra-media-screen.component.scss` - pane, media, scanline, and arrow-overlay styling.
- `src/app/features/home/sections/extras-section/extra-media-screen/extra-media-screen.component.spec.ts` - timestamp-resume and pane-chrome coverage; currently untracked.
- `README.md` and `docs/` - updated behavior, architecture, validation, and test counts.

## Validation completed

- `npm.cmd test` passes: **21 test files, 129 tests**.
- `npm.cmd run build` passes and prerenders four routes.
- `git diff --check` passes; only line-ending normalization warnings are reported.
- Desktop visual validation completed at 1440x1000.
- Mobile visual validation completed at 390x844.
- Browser checks confirmed zero pane headers/footers, two previous and two next gallery buttons, no visible teleport label, and no console warnings/errors.
- The simplified media-screen stylesheet is now below the 4kB warning budget.
- Existing component-style warnings remain for project selector (4.88kB), hero (7.39kB), About (7.75kB), Extras platformer (6.15kB), and project focus (6.59kB). All remain below the 8kB error budget.

On this machine, Angular test/build commands may need permission outside the restricted sandbox because the compiler can be blocked from spawning child processes.

## Working-tree summary

All current refinements are uncommitted. `git status --short` reports modifications to:

- `README.md`
- `docs/architecture.md`
- `docs/design.md`
- `docs/development.md`
- `docs/overview.md`
- `src/app/data/extras.data.ts`
- `src/app/data/extras.data.spec.ts`
- `src/app/features/home/sections/extras-section/extra-media-screen/extra-media-screen.component.{html,scss,ts}`
- `src/app/features/home/sections/extras-section/extras-platformer/extras-platformer.component.{html,scss,spec.ts,ts}`

Untracked files:

- `handoff.md`
- `src/app/features/home/sections/extras-section/extra-media-screen/extra-media-screen.component.spec.ts`

Do not discard or overwrite these changes. The diff contains the requested focus/input fix, playback timestamp retention, delayed and raised platform activation, control removal, island reorder/start state, first-WASD activation, pane chrome cleanup, tests, and documentation.

## Suggested next steps

1. Review the complete uncommitted diff and commit it when approved.
2. Add the final Capstone and Robotics media, replacing placeholder records and alt text.
3. Re-run tests, production build, and desktop/mobile visual checks after any content or interaction changes.

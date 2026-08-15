# Handoff: Extras Platformer

## Start here

- Read `AGENTS.md` and `AI_GUIDE.md` in full before making changes.
- Current branch: `replace-filler`.
- Last commit: `1bb194c feat: complete extras media and level editor`.
- The baseline Skills-to-Extras replacement, media assets, level editor, and current eight-platform layout are committed in `1bb194c`.
- The manual-gallery pause/pop-out interaction pass and its documentation/tests are currently uncommitted. Preserve the current working tree.

## Current status

The Extras section is a small DOM/CSS platformer placed directly over the site's existing mountain-and-stars background. The three large media panes are both content screens and collision platforms. The debug level editor, current eight-platform layout, Ramen Robotics video and four-photo carousel, interaction refinements, pane cleanup, world-size work, manual-gallery pause behavior, and pop-out modal are complete in the current working tree.

The canonical level is now revision 3 in an 1880x820 world. It contains three protected media islands and eight editable supplemental platforms. The current layout is intentionally source-controlled output from the editor; platform count and positions may continue changing without requiring test rewrites.

The current left-to-right order is:

1. **Capstone Summit** - five supplied Pineapple Expense presentation images in numeric filename order.
2. **Keyboard Cove** - the custom-keyboard YouTube video.
3. **Robotics Outpost** - four supplied competition photos and the Ramen Robotics video in the requested carousel order.

The Capstone photo placeholders have been replaced with the supplied carousel assets; the PDF was rendered to the third image.

## Development level editor

- Start the local development server with `npm.cmd start` (or `ng serve --configuration development`) and open `http://localhost:4200/?extrasDebug=level#extras`.
- The query gate is honored only in Angular development mode; production builds and ordinary URLs render no editor UI and always use the committed layout.
- `src/app/data/extras-level.data.ts` is the canonical typed level source for the 1880x820 world, spawn anchor, islands, and supplemental platforms. Visual placement and collision consume the same element records.
- Edit mode pauses physics and pane interaction. It offers an accessible element selector, numeric geometry inspector, direct scaled dragging, 10px snapping, keyboard nudging, undo/redo, reset, and platform add/duplicate/delete actions.
- The three media islands can move, but their identities, sizes, duplication, and deletion are protected. Supplemental jump platforms can be added, moved, resized, duplicated, and deleted.
- Playtest mode resets the explorer to the draft spawn and runs normal movement, collision, island activation, and respawn against the current draft.
- Supplemental platforms are neutral collision surfaces: they never activate media. Landing on one does not defeat the one-second island grace timer; the previous topic deactivates once it is no longer the actual supporting island.
- Valid drafts automatically recover from revision-keyed browser `localStorage`. The current key uses canonical revision 3, so older drafts are ignored rather than overriding the latest exported layout. **Reset draft** clears the current recovery state and restores the committed layout.
- **Copy config** and **Download** serialize a complete `extras-level.data.ts`. Replace the canonical source with that output and commit it to publish a layout permanently; local storage alone never changes the public site.
- Below 1080px component width, the existing stacked media fallback remains active. The editor displays a widening notice, prevents Playtest/dragging, and preserves the draft across the breakpoint.

## Current behavior

- A transparent 1880x820 desktop world scales uniformly to the available width, keeping all three islands visible at once.
- The explorer starts at world position `x: 718, y: 312`, 58px from the left edge of the middle Keyboard island. Its standing position rises to `y: 304` when Keyboard Cove activates.
- No island is active initially. The first WASD keypress hides the `try WASD` hint and activates the platform beneath the explorer. Arrow keys can move the explorer but do not perform this keyboard-derived activation. Pointer activation can activate an island earlier without dismissing the hint.
- WASD and arrow-key input is listened for at the document level, so teleport focus and clicks elsewhere on the page do not stop character control. Editable fields are excluded, and held input is cleared if the window loses focus.
- `W`/Arrow Up jumps, `A`/Arrow Left and `D`/Arrow Right move, and `S`/Arrow Down crouches. The visible arrow, movement, and jump buttons have been removed.
- Clicking an inactive pane teleports the explorer through an invisible full-pane button with an accessible label and immediately activates the destination, including before WASD has been used. The `try WASD` prompt remains until the first actual WASD press.
- An active platform rises 8px; its collision surface and visible island label/title/description rise with it so the explorer and copy remain aligned.
- After the explorer leaves an active platform, it stays active for one second. Landing again during that grace period cancels deactivation.
- Falling out of the world respawns the explorer on the last visited island.
- Galleries advance every 5.2 seconds only while their island is active, pause while the document is hidden or the current YouTube video is playing, and respect reduced-motion preferences. Manual previous/next navigation pauses auto-advance until the next W/A/S/D keypress or an actual island-activation change.
- Multi-item galleries retain only their previous/next arrow controls inside the pane. The arrows always receive their accent hover state, including over inactive panes; clicking one browses and teleports to activate an inactive island. The redundant pane header/status, footer caption/counter/link, and visible `CLICK TO TELEPORT` label are removed.
- Every island also has a small bottom-right expand button. It activates/teleports to that island and opens a large centered media pop-out with the island title/description, a stable 16:9 media frame that contain-fits every carousel image, the same carousel arrows, and a top-right X close button. The pop-out pauses auto-advance and uses an overflow-only document lock so site scrolling stays disabled while the current page position remains untouched; it keeps a softened scanline texture and sits above later page sections. Clicking the backdrop, the X, or pressing Escape closes it. The original island does not keep a duplicate active video behind the modal.
- Mochi uses IMG_2 → IMG_1 → competition video → IMG_4 → IMG_3 as the canonical order for both manual and automatic forward movement.
- The island title and description above each pane remain unchanged apart from rising with the active pane.
- Keyboard Cove and Robotics Outpost use `youtube-nocookie.com` embeds with muted autoplay. The Robotics video has a configured initial time of 3:03:36 (`11016` seconds). YouTube player messages retain the latest playback time in memory, and saved progress takes priority over the initial timestamp on later activations.
- Below 1080px component width, the platformer is replaced by vertically stacked media panes with no game semantics or movement controls. Gallery arrows and the expand button remain available, and the same responsive pop-out modal is used.

## Current world geometry

| Surface | Position | Size |
| --- | --- | --- |
| Capstone Summit | x 0, y 180 | 556x350 |
| Keyboard Cove | x 660, y 360 | 556x365 |
| Robotics Outpost | x 1320, y 170 | 556x350 |
| platform-1 | x 850, y 110 | 180x20 |
| platform-2 | x 590, y 250 | 60x20 |
| platform-3 | x 1230, y 250 | 60x20 |
| platform-4 | x 650, y 80 | 30x20 |
| platform-5 | x 1200, y 80 | 30x20 |
| platform-6 | x 850, y 770 | 180x20 |
| platform-7 | x 690, y 790 | 30x20 |
| platform-8 | x 1150, y 790 | 30x20 |

The explorer is 38x48, starts 58px from Keyboard Cove's left edge, and uses a jump velocity of -620. Teleporting places it at the horizontal center/top of the selected pane.

## Content status

- Keyboard Cove uses <https://www.youtube.com/watch?v=xph8DTsWbxM>.
- Robotics Outpost uses <https://www.youtube.com/watch?v=XcQ8EndxcuM> and starts its first autoplay at 3:03:36.
- Capstone Summit contains the supplied five-image Pineapple Expense carousel in IMG_1 → IMG_2 → rendered IMG_3 → IMG_4 → IMG_5 order.
- The supplied-photo asset mapping is IMG_1 → `mochi-competition-01.jpg`, IMG_4 → `mochi-competition-02.jpg`, IMG_3 → `mochi-competition-03.jpg`, and IMG_2 → `mochi-competition-04.jpg`. IMG_1 is cropped to a landscape pane ratio while preserving the three foreground teammates; the other three retain their original composition after web resizing.
- Robotics Outpost uses those four JPEGs and the live video record in the final order IMG_2 → IMG_1 → video → IMG_4 → IMG_3. In asset paths, that is `04.jpg` → `01.jpg` → video → `02.jpg` → `03.jpg`.
- The Capstone image records in `src/app/data/extras.data.ts` now point to the five supplied presentation assets.
- The keyboard caption is stored correctly as UTF-8: `Made a keyboard :) · 4:28`. Some PowerShell output may display the middle dot incorrectly; do not change the source solely because of terminal rendering.

## Important files

- `src/app/data/extras.data.ts` - island order, copy, and media records.
- `src/app/data/extras.data.spec.ts` - content and ordering coverage.
- `src/app/data/extras-level.data.ts` - canonical versioned world, spawn, island, and supplemental-platform geometry.
- `src/app/models/extra.model.ts` - Extras topic/media types.
- `src/app/models/extra-level.model.ts` - level configuration and discriminated element types.
- `src/app/features/home/sections/extras-section/extras-section.component.*` - section shell and heading.
- `src/app/features/home/sections/extras-section/extras-level-editor/*` - editor toolbar, inspector, draft validation/persistence, source serialization, and focused tests.
- `src/app/features/home/sections/extras-section/extras-platformer/extras-platformer.component.ts` - data-driven physics, global input, support-aware activation, teleporting, responsive mode, editor integration, gallery timer, manual-gallery pause state, and pop-out activation/close state.
- `src/app/features/home/sections/extras-section/extras-platformer/extras-platformer.component.html` - desktop world, stacked fallback, island copy, explorer, and centered pop-out dialog.
- `src/app/features/home/sections/extras-section/extras-platformer/extras-platformer.component.scss` - island, explorer, activation-rise, and responsive styling.
- `src/app/features/home/sections/extras-section/extras-platformer/extras-platformer.component.spec.ts` - gameplay, manual-gallery pause/resume, pop-out activation/close, and responsive interaction coverage; counts, IDs, spawn/teleport positions, and collision fixtures are geometry-resilient so ordinary level edits do not require assertion updates.
- `src/app/features/home/sections/extras-section/extra-media-screen/extra-media-screen.component.ts` - YouTube URL/player messaging, configured initial timestamps, timestamp retention, and media events.
- `src/app/features/home/sections/extras-section/extra-media-screen/extra-media-screen.component.html` - full-height media viewport, gallery arrows, accessible teleport overlay, and bottom-right expand control.
- `src/app/features/home/sections/extras-section/extra-media-screen/extra-media-screen.component.scss` - pane, media, scanline, arrow-overlay, and expand-button styling.
- `src/app/features/home/sections/extras-section/extra-media-screen/extra-media-screen.component.spec.ts` - timestamp-resume, pane-chrome, and expand-control coverage.
- `src/styles/extras-popout.scss` and `src/styles.scss` - globally scoped responsive pop-out overlay styling; kept outside the platformer component stylesheet so the existing 8 kB component-style error budget remains satisfied.
- `README.md` and `docs/` - updated behavior, architecture, validation, and test counts.

## Validation completed

- `npm.cmd test` passes: **23 test files, 163 tests**.
- `npm.cmd run build` passes and prerenders four routes.
- `git diff --check` passes; only line-ending normalization warnings are reported.
- Debug-editor browser validation completed at 1280x720 before the final revision-3 layout: toolbar gating, platform creation, exact geometry editing, Playtest mode, draft recovery, Reset, and ordinary-URL isolation all behaved correctly. The current 1880x820 geometry is covered by the passing data, editor-state, and platformer tests.
- The live Robotics Outpost tile was browser-checked with video `XcQ8EndxcuM`; its fresh embed included muted autoplay and `start=11016`, rendered successfully, and later activation resumed from saved progress.
- The August 14 interaction pass was browser-checked at 1280×720: pointer teleport activated an island while retaining `try WASD`, island copy and pane transforms both reached `translateY(-8px)`, an inactive Robotics gallery arrow received its pink hover state above the teleport layer and browsed/activated the island, and the playing video remained selected beyond the 5.2-second gallery interval. No console warnings or errors appeared.
- The manual-gallery pause/pop-out pass was browser-checked at the default desktop viewport and a temporary 720×900 viewport: manual Capstone navigation stayed on the selected image beyond 5.2 seconds, a simulated `D` key resumed auto-advance, the Capstone pop-out activated/teleported correctly, modal arrows changed its image while keeping the same 16:9 frame and full-image fit, and the X close control remained visible above the fixed navbar. The overflow-only lock kept the page position unchanged while open and on close. The narrow stacked layout also exposed the expand button and responsive pop-out without console errors.
- The final Mochi order was browser-checked directly in the running carousel: `mochi-competition-04.jpg` → `mochi-competition-01.jpg` → video `XcQ8EndxcuM` with `start=11016` → `mochi-competition-02.jpg` → `mochi-competition-03.jpg`. The IMG_1 pane-ratio crop renders at `object-fit: cover` without additional composition loss, and its accessible alt text identifies the three foreground teammates.
- Editor/platformer tests no longer snapshot supplemental-platform geometry. They derive current counts and generated IDs from `extras-level.data.ts`, derive spawn/teleport positions from the config, and isolate collision geometry inside the behavior test. Adding, removing, or repositioning platforms should not make the suite stale.
- Existing mobile behavior remains covered by the stacked-layout component test; the prior 390x844 visual validation remains valid because the editor preserves that fallback. The new pop-out was additionally checked at 720x900.
- Browser checks found no console warnings or errors on either the debug or ordinary URL.
- The simplified media-screen stylesheet is now below the 4kB warning budget.
- Existing component-style warnings remain for project selector (4.88kB), hero (7.39kB), About (7.75kB), Extras platformer (7.65kB), and project focus (6.59kB). All remain below the 8kB error budget; the separate editor stylesheet stays below the warning budget. The pop-out rules live in the global stylesheet bundle and do not add a component-style error.

On this machine, Angular test/build commands may need permission outside the restricted sandbox because the compiler can be blocked from spawning child processes.

## Working-tree summary

The manual-gallery pause/pop-out implementation, its documentation, and `handoff.md` are uncommitted. `git status --short` reports modifications to:

- `docs/architecture.md`
- `docs/design.md`
- `docs/development.md`
- `src/app/features/home/sections/extras-section/extra-media-screen/extra-media-screen.component.{html,scss,spec.ts,ts}`
- `src/app/features/home/sections/extras-section/extras-platformer/extras-platformer.component.{html,spec.ts,ts}`
- `src/styles.scss`
- `handoff.md`

Untracked files:

- `src/styles/extras-popout.scss`

Do not discard or overwrite these changes. The committed baseline already contains the canonical level model, debug editor, supplemental-platform physics, persistence/export helpers, Ramen Robotics media, geometry-resilient tests, and the earlier documentation. The current diff adds only the manual-gallery pause semantics, reusable expand trigger, responsive pop-out modal styling/wiring, focused tests, and documentation updates.

## Suggested next steps

1. Review the current desktop and narrow pop-out behavior at `http://localhost:4200/#extras` if further visual refinements are desired.
2. Run `npm.cmd test` and `npm.cmd run build` after any follow-up changes.
3. Review and commit the current feature/documentation diff when approved; preserve `handoff.md` according to the desired commit scope.

# Scroll Reveal — CSS Scroll-Driven Animation Implementation Plan

> **For agentic workers:** Use the checkbox (`- [ ]`) steps below to track progress. Work through steps sequentially — each step has a narrow scope. Run `npm test` after Step 4 to verify tests pass. Do not move to docs updates until all code changes are complete.

**Goal:** Replace the `IntersectionObserver`-based `ScrollRevealDirective` with CSS Scroll-Driven Animations (`animation-timeline: view()`). Elements will slide in from below as they enter the viewport on scroll-down, and slide back down as the user scrolls back up — linked directly to scroll position with no JavaScript involvement.

**Scope:** `_animations.scss`, `scroll-reveal.directive.ts`, `scroll-reveal.directive.spec.ts`, `home.component.html`, and two docs updates.

---

## Questions & Decisions

### Q1: What happens to the `revealOnce` and `revealThreshold` inputs?

`revealOnce` existed to choose between "play once" and "play every time the element enters the viewport." CSS scroll-driven animations are inherently scroll-position-linked — the animation always reflects the current scroll state. There is no "play once" equivalent; the animation always reverses. `revealThreshold` mapped to an `IntersectionObserver` threshold (0–1). `animation-range` is the rough CSS equivalent, but it's not a direct threshold value and is better expressed as a fixed range that feels right visually.

**Decision:** Remove both inputs — they have no meaningful mapping in the new model. The only current usage is `<app-feature-cards appScrollReveal [revealOnce]="false" />` in `home.component.html`. Remove the `[revealOnce]="false"` binding from that template (it becomes the default behavior anyway).

---

### Q2: What `animation-range` values should be used?

`animation-range: entry 0% entry 30%` means: begin the animation at the moment the element's leading edge enters the viewport's bottom edge, and complete it when 30% of the element's height is visible. This gives a fast, decisive reveal without requiring the user to scroll deep into the element.

**Decision:** Use `entry 0% entry 30%`. This matches the snappy "slides into view quickly" feel of the current 500ms transition. Document the value in `_animations.scss` so it's easy to tune.

---

### Q3: Fallback for browsers without scroll-driven animation support?

`@supports (animation-timeline: view())` gates the new CSS. Without it, elements would remain permanently hidden (opacity: 0) in unsupported browsers, which is unacceptable.

Browser support as of 2026: Chrome 115+, Edge 115+, Firefox 115+, Safari 18+. Approximately 93%+ global coverage. For a developer portfolio, the audience skews heavily toward modern browsers.

**Decision:** Inside `@supports (animation-timeline: view())`, apply the scroll-driven CSS. Outside (the fallback), apply `opacity: 1; transform: none` so elements are immediately visible. No IntersectionObserver fallback — the effect is purely cosmetic and the content must always be accessible.

---

### Q4: Does the directive still need to exist?

Without an `IntersectionObserver`, the directive's only job is to add `.scroll-reveal` to the host element. This is still valuable: it provides a declarative opt-in from templates (`appScrollReveal`), keeps the `isPlatformBrowser` guard centralized, and makes the animation intent readable in HTML. The alternative — adding the CSS class manually in every template — is messier and harder to refactor later.

**Decision:** Keep the directive as a thin class-applier. Remove `IntersectionObserver`, both inputs, `OnDestroy`, `Renderer2`, `mockUnobserve`, and `mockDisconnect`.

---

### Q5: Does `isPlatformBrowser` still matter without an observer?

The directive now only adds a CSS class. During Angular pre-rendering (SSR), `ngOnInit` runs on the server. If the class is added server-side, the pre-rendered HTML ships with `class="scroll-reveal"`. In an unsupporting browser, this renders as `opacity: 1; transform: none` (the fallback) — fine. In a supporting browser, the scroll-driven CSS kicks in client-side — also fine. The class in the pre-rendered HTML does no harm.

However, there is one edge case: if a user with JavaScript disabled visits the site, the class is present but CSS animations require scroll interaction. The `@supports` fallback ensures opacity is 1 regardless.

**Decision:** Keep `isPlatformBrowser` as a guard — it is a project-wide convention (see `CLAUDE.md`) and prevents any unintended DOM access if behavior changes in future. Remove it and it's a silent regression footgun.

---

### Q6: Should the `translateY` offset stay at `150px`?

With `IntersectionObserver`, the element jumped to its start state instantly, then transitioned to visible over 500ms — the `150px` offset was fine because the user never saw the element mid-scroll. With scroll-driven animations, the element's position is live-linked to scroll: if the user scrolls very slowly, they'll see the element at exactly `translateY(N px)`. A large offset (150px) can feel like a parallax shift rather than a reveal. A smaller value (24–40px) is more natural for a scroll-driven context.

**Decision:** Reduce the offset to `32px`. This is consistent with the `slideUp` keyframe's existing `20px` offset (which was designed for time-based animation) while giving enough motion to feel intentional at scroll speed. Document the value so it's easy to adjust.

---

### Q7: How does `prefers-reduced-motion` work with scroll-driven animations?

`animation: none` on a scroll-driven animation removes the entire animation, including the initial hidden state. Setting `animation: none` inside `@media (prefers-reduced-motion: reduce)` and explicitly setting `opacity: 1; transform: none` on `.scroll-reveal` is the correct pattern.

**Decision:** Update the existing `prefers-reduced-motion` block to target `.scroll-reveal` and override with visible state. No change to intent — the existing block already does this; it just needs to be updated to match the new property names.

---

### Q8: Does `OnDestroy` still need to be implemented?

`OnDestroy` was needed to call `this.observer?.disconnect()`. With no observer, there is nothing to tear down. The directive can remove `OnDestroy` entirely.

**Decision:** Remove `OnDestroy` and the `ngOnDestroy` method. The directive implements `OnInit` only.

---

## Files Changed

| File | Change Type | Summary |
|------|-------------|---------|
| `src/styles/_animations.scss` | Modify | Replace `.scroll-reveal` / `.scroll-reveal--visible` with scroll-driven `animation-timeline: view()`, add `@supports` fallback, update `prefers-reduced-motion` block |
| `src/app/shared/directives/scroll-reveal.directive.ts` | Modify | Remove `IntersectionObserver`, both inputs, `OnDestroy`, `Renderer2`; keep `ngOnInit` + `isPlatformBrowser` + `ElementRef` for class application |
| `src/app/shared/directives/scroll-reveal.directive.spec.ts` | Modify | Rewrite tests — remove all `IntersectionObserver` mocking, test class-application behavior and SSR guard |
| `src/app/features/home/home.component.html` | Modify | Remove `[revealOnce]="false"` binding (input no longer exists) |
| `docs/design.md` | Modify | Update Animation Guidelines section to describe scroll-driven approach |
| `docs/development.md` | Modify | Update Phase 2 `ScrollRevealDirective` task description to reflect new implementation |

---

## Implementation Steps

### Step 1 — Update `_animations.scss`

- [ ] Remove the `.scroll-reveal` rule (opacity 0, translateY 150px, transition)
- [ ] Remove the `.scroll-reveal--visible` rule
- [ ] Add a new `@keyframes scroll-reveal-slide` animation:
  ```scss
  @keyframes scroll-reveal-slide {
    from {
      opacity: 0;
      transform: translateY(32px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  ```
- [ ] Add the new `.scroll-reveal` rule inside `@supports (animation-timeline: view())`:
  ```scss
  @supports (animation-timeline: view()) {
    .scroll-reveal {
      animation: scroll-reveal-slide linear both;
      animation-timeline: view();
      animation-range: entry 0% entry 30%;
    }
  }
  ```
- [ ] Add the non-supporting fallback outside of `@supports` (elements are immediately visible):
  ```scss
  // Fallback for browsers without scroll-driven animation support
  @supports not (animation-timeline: view()) {
    .scroll-reveal {
      opacity: 1;
      transform: none;
    }
  }
  ```
- [ ] Update the `prefers-reduced-motion` block to disable the new animation and force visible state:
  ```scss
  @media (prefers-reduced-motion: reduce) {
    .scroll-reveal {
      animation: none;
      opacity: 1;
      transform: none;
    }
  }
  ```
- [ ] Remove the `.scroll-reveal--visible` entry from the `prefers-reduced-motion` block (class no longer exists)

---

### Step 2 — Refactor `scroll-reveal.directive.ts`

- [ ] Remove imports: `OnDestroy`, `Renderer2`
- [ ] Remove imports: `input` (no longer needed)
- [ ] Remove the `revealOnce` signal input
- [ ] Remove the `revealThreshold` signal input
- [ ] Remove the `private readonly renderer = inject(Renderer2)` injection
- [ ] Remove the `private observer?: IntersectionObserver` field
- [ ] Remove `OnDestroy` from the `implements` clause; keep only `OnInit`
- [ ] Replace the entire `ngOnInit` body with a single `isPlatformBrowser` guard that adds the class directly via `this.el.nativeElement.classList.add('scroll-reveal')`
- [ ] Remove the `ngOnDestroy` method entirely
- [ ] Verify the directive still imports and injects: `ElementRef`, `PLATFORM_ID`, `isPlatformBrowser`, `OnInit`, `inject`

The resulting directive should be approximately 20 lines.

---

### Step 3 — Update `home.component.html`

- [ ] Remove the `[revealOnce]="false"` binding from `<app-feature-cards appScrollReveal [revealOnce]="false" />`
- [ ] Result: `<app-feature-cards appScrollReveal />`

---

### Step 4 — Rewrite `scroll-reveal.directive.spec.ts`

Remove all `IntersectionObserver` mocking infrastructure. The new tests are simpler — they only verify class application behavior.

- [ ] Remove the `RepeatRevealHostComponent` test host (was for `revealOnce: false`)
- [ ] Remove `mockObserve`, `mockUnobserve`, `mockDisconnect`, `observeCallback` variables
- [ ] Remove the `vi.stubGlobal('IntersectionObserver', ...)` setup block
- [ ] Remove the `afterEach(() => vi.restoreAllMocks())` block (no longer needed)
- [ ] Keep/update: `'should add scroll-reveal class on init'` — verifies class is present after `fixture.detectChanges()`
- [ ] Remove: `'should observe the host element'` — no observer
- [ ] Remove: `'should add scroll-reveal--visible class when intersecting'` — class no longer exists
- [ ] Remove: `'should unobserve after reveal when revealOnce is true (default)'` — no observer
- [ ] Remove: `'should disconnect observer on destroy'` — no observer
- [ ] Remove: `'should remove scroll-reveal--visible class when not intersecting and revealOnce is false'` — class/input no longer exist
- [ ] Add: `'should not add scroll-reveal class during SSR (non-browser platform)'` — configure `TestBed` with `{ provide: PLATFORM_ID, useValue: 'server' }` and assert the class is absent
- [ ] Run `npm test` to confirm all tests pass

---

### Step 5 — Update `docs/design.md`

- [ ] In the **Animation Guidelines → Durations** section, update the scroll reveals entry to note they are now scroll-position-linked (not time-based)
- [ ] In the **Motion Principles** section, add a note: "Scroll reveal animations use CSS `animation-timeline: view()` — they are scroll-position-linked and naturally reverse on scroll-up. A `@supports` fallback ensures content is always visible in older browsers."

---

### Step 6 — Update `docs/development.md`

- [ ] In **Phase 2** task list, update the `ScrollRevealDirective` bullet to: "`ScrollRevealDirective` — CSS scroll-driven animation via `animation-timeline: view()`, adds `.scroll-reveal` class when on a browser platform; the CSS handles all animation logic"

---

## Test Coverage Summary

| Old Test | New Test | Reason |
|----------|----------|--------|
| `should add scroll-reveal class on init` | Keep (unchanged) | Core directive behavior |
| `should observe the host element` | Remove | No observer |
| `should add scroll-reveal--visible class when intersecting` | Remove | Class no longer exists |
| `should unobserve after reveal when revealOnce is true` | Remove | No observer, input removed |
| `should disconnect observer on destroy` | Remove | No `OnDestroy` |
| `should remove scroll-reveal--visible when not intersecting` | Remove | Class/input removed |
| *(new)* `should not add scroll-reveal class during SSR` | Add | SSR guard is the only remaining logic worth testing |

---

## Verification Checklist

After all steps are complete:

- [ ] `npm test` passes with no failures
- [ ] `npm start` — scroll down to feature cards: cards slide up from below
- [ ] Scroll back up — feature cards slide back down
- [ ] No console errors or warnings
- [ ] No `[revealOnce]` or `[revealThreshold]` bindings remain in any template (`grep -r "revealOnce\|revealThreshold" src/`)
- [ ] `scroll-reveal--visible` class is gone from CSS and all `.spec.ts` files

/**
 * Drop focus from a control the pointer just activated.
 *
 * Browsers leave a clicked button focused, and the first key press afterwards flips their
 * `:focus-visible` heuristic on for the already-focused element. In the extras platformer that
 * lights a stale cyan focus ring around whichever button was last clicked the moment the player
 * touches WASD. Keyboard activations (`detail === 0`) keep their focus so tab order stays intact.
 */
export function clearPointerFocus(event: Event): void {
  if (!(event instanceof MouseEvent) || event.detail === 0) return;
  if (event.currentTarget instanceof HTMLElement) event.currentTarget.blur();
}

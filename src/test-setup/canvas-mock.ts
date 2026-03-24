/**
 * Global jsdom canvas mock.
 *
 * jsdom does not implement HTMLCanvasElement.getContext(). This setup file
 * installs a minimal CanvasRenderingContext2D stub so that canvas-based tests
 * work without requiring the `canvas` npm package.
 *
 * Must be listed in angular.json → architect.test.options.setupFiles.
 */

function makeCtx(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const gradientStub = {
    addColorStop: () => {},
  } as unknown as CanvasGradient;

  const ctx: Partial<CanvasRenderingContext2D> = {
    canvas,
    clearRect: () => {},
    beginPath: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    ellipse: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    setTransform: () => {},
    createLinearGradient: () => gradientStub,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
  };

  return ctx as CanvasRenderingContext2D;
}

// Install mock on prototype before any test file is loaded.
// Individual tests can override via vi.spyOn(canvas, 'getContext').mockReturnValue(null).
const originalGetContext = HTMLCanvasElement.prototype.getContext;

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  writable: true,
  value(
    this: HTMLCanvasElement,
    contextId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ): RenderingContext | null {
    if (contextId === '2d') {
      return makeCtx(this);
    }
    // Fall through to original for any other context type (webgl, etc.)
    return originalGetContext.call(this, contextId, ...args) as RenderingContext | null;
  },
});

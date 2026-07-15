import { SceneRenderer } from './scene-renderer';
import { defaultConfig } from './scene-entities';

describe('SceneRenderer', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
  });

  it('constructs without error given a valid canvas', () => {
    expect(() => new SceneRenderer(canvas, defaultConfig(false))).not.toThrow();
  });

  it('throws when canvas.getContext("2d") returns null', () => {
    vi.spyOn(canvas, 'getContext').mockReturnValue(null);
    expect(() => new SceneRenderer(canvas, defaultConfig(false))).toThrow(
      'Could not get 2D context',
    );
  });

  describe('after construction', () => {
    let renderer: SceneRenderer;

    beforeEach(() => {
      renderer = new SceneRenderer(canvas, defaultConfig(false));
    });

    afterEach(() => renderer.destroy());

    it('init() does not throw', () => {
      expect(() => renderer.init(800, 600)).not.toThrow();
    });

    it('drawFrame() does not throw after init()', () => {
      renderer.init(800, 600);
      expect(() => renderer.drawFrame(0, 0)).not.toThrow();
      expect(() => renderer.drawFrame(16, 100)).not.toThrow();
    });

    it('drawFrame() does not throw when scrolled past the hero', () => {
      renderer.init(800, 600);
      expect(() => renderer.drawFrame(16, 1000)).not.toThrow();
      expect(() => renderer.drawFrame(32, 2000)).not.toThrow();
    });

    it('resize() re-seeds entities by calling init() with the new CSS dimensions', () => {
      renderer.init(800, 600);
      const initSpy = vi.spyOn(renderer, 'init');
      renderer.resize(1600, 900);
      expect(initSpy).toHaveBeenCalledWith(1600, 900);
      // Smoke test: drawFrame still works after resize
      expect(() => renderer.drawFrame(16, 0)).not.toThrow();
    });

    it('caches size-dependent gradients instead of recreating them per frame', () => {
      const ctx = (renderer as unknown as { ctx: CanvasRenderingContext2D }).ctx;
      const gradientSpy = vi.spyOn(ctx, 'createLinearGradient');

      renderer.init(800, 600);
      expect(gradientSpy).toHaveBeenCalledTimes(2);

      renderer.drawFrame(0, 0);
      renderer.drawFrame(16, 100);
      expect(gradientSpy).toHaveBeenCalledTimes(2);
    });

    it('destroy() does not throw', () => {
      renderer.init(800, 600);
      expect(() => renderer.destroy()).not.toThrow();
    });

    it('drawFrame() is a no-op after destroy() — does not throw', () => {
      renderer.init(800, 600);
      renderer.destroy();
      expect(() => renderer.drawFrame(32, 0)).not.toThrow();
    });
  });

  describe('with reducedComplexity config', () => {
    it('init() does not throw', () => {
      const r = new SceneRenderer(canvas, defaultConfig(true));
      expect(() => r.init(800, 600)).not.toThrow();
      r.destroy();
    });

    it('drawFrame() does not throw after init()', () => {
      const r = new SceneRenderer(canvas, defaultConfig(true));
      r.init(800, 600);
      expect(() => r.drawFrame(16, 0)).not.toThrow();
      r.destroy();
    });
  });
});

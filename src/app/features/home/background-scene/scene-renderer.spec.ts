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

    it('drawFrame() does not throw after init() — hero visible (scrollY < heroHeight)', () => {
      renderer.init(800, 600);
      expect(() => renderer.drawFrame(0, 0, 900)).not.toThrow();
      expect(() => renderer.drawFrame(16, 100, 900)).not.toThrow();
    });

    it('drawFrame() does not throw when hero is not visible (scrollY >= heroHeight)', () => {
      renderer.init(800, 600);
      // scrollY=1000, heroHeight=900 — mountains/UFO/rocket should be skipped
      expect(() => renderer.drawFrame(16, 1000, 900)).not.toThrow();
      expect(() => renderer.drawFrame(32, 2000, 900)).not.toThrow();
    });

    it('resize() re-seeds entities by calling init() with the new CSS dimensions', () => {
      renderer.init(800, 600);
      const initSpy = vi.spyOn(renderer, 'init');
      renderer.resize(1600, 900);
      expect(initSpy).toHaveBeenCalledWith(1600, 900);
      // Smoke test: drawFrame still works after resize
      expect(() => renderer.drawFrame(16, 0, 900)).not.toThrow();
    });

    it('destroy() does not throw', () => {
      renderer.init(800, 600);
      expect(() => renderer.destroy()).not.toThrow();
    });

    it('drawFrame() is a no-op after destroy() — does not throw', () => {
      renderer.init(800, 600);
      renderer.destroy();
      expect(() => renderer.drawFrame(32, 0, 900)).not.toThrow();
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
      expect(() => r.drawFrame(16, 0, 900)).not.toThrow();
      r.destroy();
    });
  });
});

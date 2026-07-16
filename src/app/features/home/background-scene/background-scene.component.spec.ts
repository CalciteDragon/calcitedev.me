import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { BackgroundSceneComponent } from './background-scene.component';

describe('BackgroundSceneComponent', () => {
  function stubBrowserAPIs(): void {
    vi.stubGlobal(
      'ResizeObserver',
      vi.fn(function () { return { observe: vi.fn(), disconnect: vi.fn() }; }),
    );
    vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    // MountainWorkerBridge creates a Worker — stub it so tests don't need a real worker bundle
    vi.stubGlobal('Worker', vi.fn(function () {
      return { postMessage: vi.fn(), terminate: vi.fn() };
    }));
  }

  afterEach(() => vi.restoreAllMocks());

  describe('browser environment', () => {
    let fixture: ComponentFixture<BackgroundSceneComponent>;

    beforeEach(async () => {
      stubBrowserAPIs();
      await TestBed.configureTestingModule({
        imports: [BackgroundSceneComponent],
      }).compileComponents();
      fixture = TestBed.createComponent(BackgroundSceneComponent);
      fixture.detectChanges();
    });

    it('creates without error', () => {
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('renders a canvas element', () => {
      expect(fixture.nativeElement.querySelector('canvas')).toBeTruthy();
    });

    it('canvas has aria-hidden="true"', () => {
      const canvas = fixture.nativeElement.querySelector('canvas');
      expect(canvas?.getAttribute('aria-hidden')).toBe('true');
    });

    it('calls cancelAnimationFrame on destroy', () => {
      fixture.destroy();
      expect(cancelAnimationFrame).toHaveBeenCalled();
    });

    it('calls renderer.destroy() on destroy', async () => {
      const { SceneRenderer } = await import('./scene-renderer');
      const destroySpy = vi.spyOn(SceneRenderer.prototype, 'destroy');
      const f = TestBed.createComponent(BackgroundSceneComponent);
      f.detectChanges();
      f.destroy();
      expect(destroySpy).toHaveBeenCalled();
    });

    it('calls mountainWorker.destroy() on destroy', async () => {
      const { MountainWorkerBridge } = await import('./mountain-worker-bridge');
      const destroySpy = vi.spyOn(MountainWorkerBridge.prototype, 'destroy').mockImplementation(() => {});
      const f = TestBed.createComponent(BackgroundSceneComponent);
      f.detectChanges();
      f.destroy();
      expect(destroySpy).toHaveBeenCalled();
    });

    it('disconnects the ResizeObserver on destroy', () => {
      const disconnectSpy = vi.fn();
      vi.stubGlobal(
        'ResizeObserver',
        vi.fn(function () { return { observe: vi.fn(), disconnect: disconnectSpy }; }),
      );
      const cleanupFixture = TestBed.createComponent(BackgroundSceneComponent);
      cleanupFixture.detectChanges();
      cleanupFixture.destroy();
      expect(disconnectSpy).toHaveBeenCalled();
    });
  });

  describe('SSR (server) environment', () => {
    it('creates without error when PLATFORM_ID is server', async () => {
      await TestBed.configureTestingModule({
        imports: [BackgroundSceneComponent],
        providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
      }).compileComponents();
      const fixture = TestBed.createComponent(BackgroundSceneComponent);
      expect(() => fixture.detectChanges()).not.toThrow();
    });
  });

  describe('scroll path optimization', () => {
    afterEach(() => vi.restoreAllMocks());

    it('calls MountainWorkerBridge.setCamY() when scrollY changes', async () => {
      let rafCallback: ((ts: number) => void) | null = null;
      vi.stubGlobal('ResizeObserver', vi.fn(function () { return { observe: vi.fn(), disconnect: vi.fn() }; }));
      vi.stubGlobal('requestAnimationFrame', vi.fn((cb: (ts: number) => void) => {
        rafCallback = cb;
        return 1;
      }));
      vi.stubGlobal('cancelAnimationFrame', vi.fn());
      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
      vi.stubGlobal('Worker', vi.fn(function () { return { postMessage: vi.fn(), terminate: vi.fn() }; }));

      const { MountainWorkerBridge } = await import('./mountain-worker-bridge');
      const setCamYSpy = vi.spyOn(MountainWorkerBridge.prototype, 'setCamY').mockImplementation(() => {});

      Object.defineProperty(window, 'scrollY', { value: 100, writable: true, configurable: true });

      await TestBed.configureTestingModule({
        imports: [BackgroundSceneComponent],
      }).compileComponents();
      const f = TestBed.createComponent(BackgroundSceneComponent);
      f.detectChanges();

      // First frame: scrollY=100, lastScrollY=-1 → setCamY called
      rafCallback!(0);
      expect(setCamYSpy).toHaveBeenCalledTimes(1);

      // Second frame: scrollY unchanged → setCamY NOT called again
      rafCallback!(16);
      expect(setCamYSpy).toHaveBeenCalledTimes(1);

      // Third frame: scrollY changes → setCamY called again
      Object.defineProperty(window, 'scrollY', { value: 300, writable: true, configurable: true });
      rafCallback!(32);
      expect(setCamYSpy).toHaveBeenCalledTimes(2);
    });

    it('does NOT call MountainWorkerBridge.setCamY() when scrollY is unchanged', async () => {
      let rafCallback: ((ts: number) => void) | null = null;
      vi.stubGlobal('ResizeObserver', vi.fn(function () { return { observe: vi.fn(), disconnect: vi.fn() }; }));
      vi.stubGlobal('requestAnimationFrame', vi.fn((cb: (ts: number) => void) => {
        rafCallback = cb;
        return 1;
      }));
      vi.stubGlobal('cancelAnimationFrame', vi.fn());
      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
      vi.stubGlobal('Worker', vi.fn(function () { return { postMessage: vi.fn(), terminate: vi.fn() }; }));

      const { MountainWorkerBridge } = await import('./mountain-worker-bridge');
      const setCamYSpy = vi.spyOn(MountainWorkerBridge.prototype, 'setCamY').mockImplementation(() => {});

      Object.defineProperty(window, 'scrollY', { value: 50, writable: true, configurable: true });

      await TestBed.configureTestingModule({
        imports: [BackgroundSceneComponent],
      }).compileComponents();
      const f = TestBed.createComponent(BackgroundSceneComponent);
      f.detectChanges();

      // Two frames at the same scrollY — setCamY should only be called once (first frame)
      rafCallback!(0);
      rafCallback!(16);
      expect(setCamYSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('mobile (reduced complexity) environment', () => {
    let fixture: ComponentFixture<BackgroundSceneComponent>;
    let rendererResizeSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(async () => {
      vi.stubGlobal(
        'ResizeObserver',
        vi.fn(function () { return { observe: vi.fn(), disconnect: vi.fn() }; }),
      );
      vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(1));
      vi.stubGlobal('cancelAnimationFrame', vi.fn());
      // matchMedia returns true → reducedComplexity: true path
      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
      vi.stubGlobal('Worker', vi.fn(function () { return { postMessage: vi.fn(), terminate: vi.fn() }; }));

      const { SceneRenderer } = await import('./scene-renderer');
      rendererResizeSpy = vi
        .spyOn(SceneRenderer.prototype, 'resize')
        .mockImplementation(() => {});

      await TestBed.configureTestingModule({
        imports: [BackgroundSceneComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(BackgroundSceneComponent);
      fixture.detectChanges();
    });

    afterEach(() => vi.restoreAllMocks());

    it('creates without error in mobile mode', () => {
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('renderer.resize() is called — canvas initializes in mobile mode', () => {
      expect(rendererResizeSpy).toHaveBeenCalled();
    });
  });
});

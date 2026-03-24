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

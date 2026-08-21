import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, vi } from 'vitest';
import { DISSOLVE_RAMP_HEIGHT } from './dissolve-field';
import { PixelDissolveComponent } from './pixel-dissolve.component';

describe('PixelDissolveComponent', () => {
  let disconnect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    disconnect = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      vi.fn(function (this: unknown) {
        return { observe: vi.fn(), disconnect, unobserve: vi.fn() };
      }),
    );
    TestBed.configureTestingModule({ imports: [PixelDissolveComponent] });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('renders one decorative ramp, hidden from assistive tech', () => {
    const fixture = TestBed.createComponent(PixelDissolveComponent);
    fixture.detectChanges();
    const svg = (fixture.nativeElement as HTMLElement).querySelector('svg');

    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('height')).toBe(String(DISSOLVE_RAMP_HEIGHT));
    expect(svg?.querySelectorAll('path')).toHaveLength(1);
  });

  it('draws nothing while the width is unmeasured, so SSR stays empty', () => {
    // jsdom reports clientWidth 0, which is also the server-side render's state.
    const fixture = TestBed.createComponent(PixelDissolveComponent);
    fixture.detectChanges();
    const path = (fixture.nativeElement as HTMLElement).querySelector('path');

    expect(path?.getAttribute('d') ?? '').toBe('');
  });

  it('disconnects its ResizeObserver on destroy', () => {
    const fixture = TestBed.createComponent(PixelDissolveComponent);
    fixture.detectChanges();
    fixture.destroy();

    expect(disconnect).toHaveBeenCalled();
  });
});

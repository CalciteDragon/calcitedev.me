import { ComponentFixture, TestBed } from '@angular/core/testing';
import { extrasData } from '../../../../../data/extras.data';
import { ExtrasPlatformerComponent } from './extras-platformer.component';

describe('ExtrasPlatformerComponent', () => {
  let fixture: ComponentFixture<ExtrasPlatformerComponent>;
  let compiled: HTMLElement;
  let resizeCallback: ResizeObserverCallback;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.stubGlobal('ResizeObserver', vi.fn(function (callback: ResizeObserverCallback) {
      resizeCallback = callback;
      return { observe: vi.fn(), disconnect: vi.fn() };
    }));
    vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    await TestBed.configureTestingModule({
      imports: [ExtrasPlatformerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ExtrasPlatformerComponent);
    fixture.componentRef.setInput('topics', extrasData);
    fixture.detectChanges();
    compiled = fixture.nativeElement;
  });

  afterEach(() => {
    fixture.destroy();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders three screen islands in capstone, keyboard, robotics order without pointer controls', () => {
    expect(compiled.querySelectorAll('app-extra-media-screen')).toHaveLength(3);
    expect(compiled.querySelector('.extra-game__controls')).toBeNull();
    expect(compiled.querySelector('.extra-game__destinations')).toBeNull();
    expect(compiled.textContent).not.toContain('CLICK TO TELEPORT');
    expect(
      Array.from(compiled.querySelectorAll('.extra-game__island-copy h3')).map(heading => heading.textContent?.trim()),
    ).toEqual(['Pineapple Expense in Seattle', 'A Custom Keyboard Build', 'Mochi at Competition']);
    expect(compiled.querySelector('[role="application"]')?.getAttribute('aria-label')).toContain('anywhere on the page');
  });

  it('starts inactive near the left edge of Keyboard Cove', () => {
    expect(compiled.querySelector('iframe')).toBeNull();
    expect(compiled.querySelector('.extra-game__island-copy--active')).toBeNull();
    expect(compiled.querySelector('.extra-game__screen--active')).toBeNull();
    expect(compiled.querySelector<HTMLElement>('.extra-game__player')?.style.transform).toContain('680px, 187px');
  });

  it('allows mouse users to teleport without requiring focus after movement starts', () => {
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'a', bubbles: true }));
    fixture.detectChanges();

    const capstoneIsland = compiled.querySelector(
      '[aria-label="Teleport to Capstone Summit"]',
    ) as HTMLButtonElement;

    capstoneIsland.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.extra-game__island-copy--active')?.textContent).toContain('Pineapple Expense in Seattle');
    expect(compiled.querySelector<HTMLElement>('.extra-game__player')?.style.transform).toContain('289px, 244px');
    expect(compiled.querySelector('iframe')).toBeNull();
  });

  it('handles arrow input dispatched outside the platformer', () => {
    const component = fixture.componentInstance as unknown as { updatePhysics(deltaSeconds: number): void };
    const keyDown = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    });

    document.body.dispatchEvent(keyDown);
    component.updatePhysics(0.032);
    fixture.detectChanges();

    expect(keyDown.defaultPrevented).toBe(true);
    expect(compiled.querySelector<HTMLElement>('.extra-game__player')?.style.transform).not.toContain('680px,');
    expect(compiled.querySelector('.extra-game__screen--active')).toBeNull();

    document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight', bubbles: true }));
  });

  it('keeps a platform active for one second after the player leaves it', () => {
    const component = fixture.componentInstance as unknown as { updatePhysics(deltaSeconds: number): void };

    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', bubbles: true }));
    document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'd', bubbles: true }));
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    component.updatePhysics(0.032);
    fixture.detectChanges();

    expect(compiled.querySelector('.extra-game__screen--active')).not.toBeNull();

    vi.advanceTimersByTime(999);
    fixture.detectChanges();
    expect(compiled.querySelector('.extra-game__screen--active')).not.toBeNull();

    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(compiled.querySelector('.extra-game__screen--active')).toBeNull();

    document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp', bubbles: true }));
  });

  it('replaces the horizontal game with stacked media panes at smaller widths', () => {
    const game = compiled.querySelector('.extra-game') as HTMLElement;
    Object.defineProperty(game, 'clientWidth', { configurable: true, value: 720 });

    resizeCallback([], {} as ResizeObserver);
    fixture.detectChanges();

    expect(compiled.querySelector('[role="application"]')).toBeNull();
    expect(compiled.querySelector('.extra-game__controls')).toBeNull();
    expect(compiled.querySelectorAll('.extra-game__stack-pane')).toHaveLength(3);
    expect(compiled.querySelector('.extra-game__desktop-hint')?.textContent).toContain('make your window wider');
  });

  it('activates Keyboard Cove and dismisses the hint on the first WASD key press', () => {
    expect(compiled.querySelector('.extra-game__wasd-hint')?.textContent).toContain('WASD');

    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    fixture.detectChanges();

    expect(compiled.querySelector('.extra-game__wasd-hint')).toBeNull();
    expect(compiled.querySelector('.extra-game__island-copy--active')?.textContent).toContain('A Custom Keyboard Build');
    expect(compiled.querySelector<HTMLElement>('.extra-game__player')?.style.transform).toContain('680px, 179px');
    expect(compiled.querySelector('iframe')?.getAttribute('src')).toContain('youtube-nocookie.com/embed/xph8DTsWbxM');
    document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'a', bubbles: true }));
  });
});

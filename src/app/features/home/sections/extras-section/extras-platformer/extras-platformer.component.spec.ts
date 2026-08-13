import { ComponentFixture, TestBed } from '@angular/core/testing';
import { extrasData } from '../../../../../data/extras.data';
import { ExtrasPlatformerComponent } from './extras-platformer.component';

describe('ExtrasPlatformerComponent', () => {
  let fixture: ComponentFixture<ExtrasPlatformerComponent>;
  let compiled: HTMLElement;
  let resizeCallback: ResizeObserverCallback;

  beforeEach(async () => {
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
    vi.restoreAllMocks();
  });

  it('renders three screen islands and pointer controls', () => {
    expect(compiled.querySelectorAll('app-extra-media-screen')).toHaveLength(3);
    expect(compiled.querySelectorAll('.extra-game__controls button')).toHaveLength(4);
    expect(compiled.querySelector('.extra-game__destinations')).toBeNull();
    expect(compiled.querySelector('[role="application"]')?.getAttribute('aria-label')).toContain('Use A and D');
  });

  it('starts the keyboard video while the player is on Keyboard Cove', () => {
    const frame = compiled.querySelector('iframe');
    expect(frame?.getAttribute('src')).toContain('youtube-nocookie.com/embed/xph8DTsWbxM');
    expect(compiled.querySelector('.extra-game__island-copy--active')?.textContent).toContain('A Custom Keyboard Build');
  });

  it('allows mouse users to teleport by clicking an island', () => {
    const capstoneIsland = compiled.querySelector(
      '[aria-label="Teleport to Capstone Summit"]',
    ) as HTMLButtonElement;

    capstoneIsland.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.extra-game__island-copy--active')?.textContent).toContain('Pineapple Expense in Seattle');
    expect(compiled.querySelector<HTMLElement>('.extra-game__player')?.style.transform).toContain('881px, 187px');
    expect(compiled.querySelector('iframe')).toBeNull();
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

  it('dismisses the character speech bubble after the first WASD key press', () => {
    const game = compiled.querySelector('[role="application"]') as HTMLElement;
    expect(compiled.querySelector('.extra-game__wasd-hint')?.textContent).toContain('WASD');

    game.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    fixture.detectChanges();

    expect(compiled.querySelector('.extra-game__wasd-hint')).toBeNull();
  });
});

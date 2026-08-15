import { ComponentFixture, TestBed } from '@angular/core/testing';
import { extrasLevelData } from '../../../../../data/extras-level.data';
import { extrasData } from '../../../../../data/extras.data';
import { ExtrasLevelConfig } from '../../../../../models/extra-level.model';
import {
  extrasLevelDraftStorageKey,
  nextPlatformId,
} from '../extras-level-editor/extras-level-editor-state';
import { ExtrasPlatformerComponent } from './extras-platformer.component';

const initialElementCount = extrasLevelData.elements.length;
const initialPlatformCount = extrasLevelData.elements.filter(element => element.kind === 'platform').length;
const addedPlatformId = nextPlatformId(extrasLevelData.elements);

describe('ExtrasPlatformerComponent', () => {
  let fixture: ComponentFixture<ExtrasPlatformerComponent>;
  let compiled: HTMLElement;
  let resizeCallback: ResizeObserverCallback;

  beforeEach(async () => {
    vi.useFakeTimers();
    window.history.replaceState({}, '', '/');
    window.localStorage.clear();
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
    window.history.replaceState({}, '', '/');
    window.localStorage.clear();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('keeps the level editor hidden on an ordinary URL', () => {
    expect(compiled.querySelector('app-extras-level-editor')).toBeNull();
    expect(compiled.querySelector('.extra-game__editor-target')).toBeNull();
  });

  it('shows the level editor only when the debug query flag is present', () => {
    recreateAt('/?extrasDebug=level');

    expect(compiled.querySelector('app-extras-level-editor')).not.toBeNull();
    expect(compiled.querySelector('[aria-label="Extras level editor"]')).not.toBeNull();
    expect(compiled.querySelectorAll('.extra-game__editor-target')).toHaveLength(initialElementCount);
    expect(compiled.querySelector('.extra-game__viewport')?.getAttribute('role')).toBe('region');
  });

  it('adds a jump platform to the world and persists the draft locally', () => {
    recreateAt('/?extrasDebug=level');

    editorButton('Add platform').click();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('.extra-game__jump-platform')).toHaveLength(initialPlatformCount + 1);
    expect(compiled.querySelectorAll('.extra-game__editor-target')).toHaveLength(initialElementCount + 1);
    const serializedDraft = window.localStorage.getItem(
      extrasLevelDraftStorageKey(extrasLevelData.revision),
    );
    expect(serializedDraft).not.toBeNull();
    const draft = JSON.parse(serializedDraft!) as {
      level: { elements: Array<{ id: string; kind: string }> };
    };
    expect(draft.level.elements).toHaveLength(initialElementCount + 1);
    expect(draft.level.elements.at(-1)).toMatchObject({ id: addedPlatformId, kind: 'platform' });
  });

  it('updates rendered island geometry from the editor inspector', () => {
    recreateAt('/?extrasDebug=level');

    const selector = compiled.querySelector<HTMLSelectElement>('#level-editor-element')!;
    selector.value = 'capstone-island';
    selector.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      updateEditorProperty(change: { id: string; property: 'x' | 'y'; value: number }): void;
    };
    component.updateEditorProperty({ id: 'capstone-island', property: 'x', value: 90 });
    component.updateEditorProperty({ id: 'capstone-island', property: 'y', value: 260 });
    fixture.detectChanges();

    const capstoneScreen = compiled.querySelectorAll<HTMLElement>('.extra-game__screen')[0]!;
    const capstoneCopy = compiled.querySelectorAll<HTMLElement>('.extra-game__island-copy')[0]!;
    const capstoneTarget = compiled.querySelector<HTMLElement>(
      '[aria-label="Select and move capstone-island"]',
    )!;
    expect(capstoneScreen.style.left).toBe('90px');
    expect(capstoneScreen.style.top).toBe('260px');
    expect(capstoneCopy.style.left).toBe('90px');
    expect(capstoneCopy.style.top).toBe('60px');
    expect(capstoneTarget.style.left).toBe('90px');
    expect(capstoneTarget.style.top).toBe('260px');
  });

  it('suppresses platformer movement while the editor is in edit mode', () => {
    recreateAt('/?extrasDebug=level');
    const component = fixture.componentInstance as unknown as {
      updatePhysics(deltaSeconds: number): void;
    };
    const player = compiled.querySelector<HTMLElement>('.extra-game__player')!;
    const startingTransform = player.style.transform;

    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', bubbles: true }));
    component.updatePhysics(0.032);
    fixture.detectChanges();

    expect(player.style.transform).toBe(startingTransform);
    expect(compiled.querySelector('.extra-game__screen--active')).toBeNull();
    document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'd', bubbles: true }));
  });

  it('uses an added platform for playtest collision and deactivates the previous island on landing', () => {
    recreateAt('/?extrasDebug=level');
    editorButton('Add platform').click();
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      editorMode(): string;
      grounded: boolean;
      jump(): void;
      level: {
        (): ExtrasLevelConfig;
        set(level: ExtrasLevelConfig): void;
      };
      playerHeight: number;
      playerPosition(): { x: number; y: number };
      playerWidth: number;
      supportingElementId: string | null;
      updateEditorProperty(change: { id: string; property: 'x' | 'y'; value: number }): void;
      updatePhysics(deltaSeconds: number): void;
      verticalVelocity: number;
    };
    const currentLevel = component.level();
    const spawnIsland = currentLevel.elements.find(
      element => element.kind === 'island' && element.id === currentLevel.spawn.elementId,
    );
    const newPlatform = currentLevel.elements.find(
      element => element.kind === 'platform' && element.id === addedPlatformId,
    );
    if (!spawnIsland || !newPlatform) throw new Error('Missing deterministic playtest elements');

    const spawnX = 200;
    const spawnY = 400;
    const expectedPlayerX = spawnX + Math.min(
      currentLevel.spawn.offsetX,
      spawnIsland.width - component.playerWidth,
    );
    const platformX = expectedPlayerX - 20;
    const platformY = 280;
    component.updateEditorProperty({ id: addedPlatformId, property: 'x', value: platformX });
    component.updateEditorProperty({ id: addedPlatformId, property: 'y', value: platformY });
    const editedLevel = component.level();
    const editedPlatform = editedLevel.elements.find(
      element => element.kind === 'platform' && element.id === addedPlatformId,
    )!;
    component.level.set({
      ...editedLevel,
      elements: [
        { ...spawnIsland, x: spawnX, y: spawnY },
        editedPlatform,
      ],
    });
    fixture.detectChanges();
    const jumpPlatforms = compiled.querySelectorAll<HTMLElement>('.extra-game__jump-platform');
    const addedPlatform = jumpPlatforms[jumpPlatforms.length - 1]!;
    expect(addedPlatform.style.left).toBe(`${platformX}px`);
    expect(addedPlatform.style.top).toBe(`${platformY}px`);
    editorButton('Playtest').click();
    fixture.detectChanges();

    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', bubbles: true }));
    document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'd', bubbles: true }));

    expect(component.editorMode()).toBe('playtest');
    expect(component.grounded).toBe(true);
    component.jump();
    expect(component.verticalVelocity).toBe(-620);
    for (let frame = 0; frame < 24; frame += 1) component.updatePhysics(0.032);
    expect(component.playerPosition()).toEqual({
      x: expectedPlayerX,
      y: platformY - component.playerHeight,
    });
    expect(component.supportingElementId).toBe(addedPlatformId);
    for (let frame = 24; frame < 32; frame += 1) component.updatePhysics(0.032);
    fixture.detectChanges();

    expect(component.playerPosition()).toEqual({
      x: expectedPlayerX,
      y: platformY - component.playerHeight,
    });
    expect(compiled.querySelector('.extra-game__screen--active')).not.toBeNull();

    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    expect(compiled.querySelector('.extra-game__screen--active')).toBeNull();
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
    const component = fixture.componentInstance as unknown as {
      playerHeight: number;
      playerPosition(): { x: number; y: number };
    };
    const spawn = extrasLevelData.elements.find(element => element.id === extrasLevelData.spawn.elementId)!;

    expect(compiled.querySelector('iframe')).toBeNull();
    expect(compiled.querySelector('.extra-game__island-copy--active')).toBeNull();
    expect(compiled.querySelector('.extra-game__screen--active')).toBeNull();
    expect(component.playerPosition()).toEqual({
      x: spawn.x + extrasLevelData.spawn.offsetX,
      y: spawn.y - component.playerHeight,
    });
  });

  it('activates a clicked island before WASD without dismissing the movement hint', () => {
    const component = fixture.componentInstance as unknown as {
      playerHeight: number;
      playerPosition(): { x: number; y: number };
      playerWidth: number;
    };
    const capstoneIsland = compiled.querySelector(
      '[aria-label="Teleport to Capstone Summit"]',
    ) as HTMLButtonElement;

    capstoneIsland.click();
    fixture.detectChanges();

    const capstone = extrasLevelData.elements.find(
      element => element.kind === 'island' && element.topicId === 'capstone',
    )!;
    expect(compiled.querySelector('.extra-game__island-copy--active')?.textContent).toContain('Pineapple Expense in Seattle');
    expect(compiled.querySelector('.extra-game__wasd-hint')?.textContent).toContain('WASD');
    expect(component.playerPosition()).toEqual({
      x: capstone.x + capstone.width / 2 - component.playerWidth / 2,
      y: capstone.y - component.playerHeight - 8,
    });
    expect(compiled.querySelector('iframe')).toBeNull();
  });

  it('changes media and teleports when an inactive island gallery arrow is clicked', () => {
    const component = fixture.componentInstance as unknown as {
      mediaIndex(topicId: string): number;
      playerHeight: number;
      playerPosition(): { x: number; y: number };
      playerWidth: number;
    };
    const capstoneNext = compiled.querySelectorAll<HTMLButtonElement>('.extra-screen__gallery-controls button')[1]!;
    capstoneNext.click();
    fixture.detectChanges();

    const capstone = extrasLevelData.elements.find(
      element => element.kind === 'island' && element.topicId === 'capstone',
    )!;
    expect(component.mediaIndex('capstone')).toBe(1);
    expect(compiled.querySelector('.extra-game__island-copy--active')?.textContent).toContain('Pineapple Expense in Seattle');
    expect(compiled.querySelector('.extra-game__wasd-hint')?.textContent).toContain('WASD');
    expect(component.playerPosition()).toEqual({
      x: capstone.x + capstone.width / 2 - component.playerWidth / 2,
      y: capstone.y - component.playerHeight - 8,
    });
  });

  it('orders the Mochi carousel as IMG 2, IMG 1, video, IMG 4, then IMG 3', () => {
    const component = fixture.componentInstance as unknown as {
      mediaIndex(topicId: string): number;
    };
    const galleryButtons = compiled.querySelectorAll<HTMLButtonElement>(
      '.extra-screen__gallery-controls button',
    );
    const roboticsScreen = compiled.querySelectorAll<HTMLElement>('.extra-game__screen')[2]!;

    expect(component.mediaIndex('robotics')).toBe(0);
    expect(roboticsScreen.querySelector('img')?.getAttribute('src')).toContain('mochi-competition-04.jpg');
    galleryButtons[1]!.click();
    galleryButtons[3]!.click();
    fixture.detectChanges();

    expect(component.mediaIndex('capstone')).toBe(1);
    expect(component.mediaIndex('robotics')).toBe(1);
    expect(roboticsScreen.querySelector('img')?.getAttribute('src')).toContain('mochi-competition-01.jpg');

    galleryButtons[3]!.click();
    fixture.detectChanges();
    expect(component.mediaIndex('robotics')).toBe(2);
    expect(roboticsScreen.querySelector('iframe')?.getAttribute('src')).toContain('XcQ8EndxcuM');

    for (const [index, assetNumber] of [[3, 2], [4, 3]]) {
      galleryButtons[3]!.click();
      fixture.detectChanges();
      expect(component.mediaIndex('robotics')).toBe(index);
      expect(roboticsScreen.querySelector('img')?.getAttribute('src')).toContain(
        `mochi-competition-0${assetNumber}.jpg`,
      );
    }
  });

  it('pauses gallery auto-advance while the active YouTube video is playing', () => {
    const component = fixture.componentInstance as unknown as {
      mediaIndex(topicId: string): number;
      playingVideoTopicId(): string | null;
    };
    const roboticsPane = compiled.querySelector(
      '[aria-label="Teleport to Robotics Outpost"]',
    ) as HTMLButtonElement;
    const roboticsNext = compiled.querySelectorAll<HTMLButtonElement>(
      '.extra-screen__gallery-controls button',
    )[3]!;

    roboticsPane.click();
    roboticsNext.click();
    roboticsNext.click();
    fixture.detectChanges();

    const frame = compiled.querySelector('iframe') as HTMLIFrameElement;
    frame.dispatchEvent(new Event('load'));
    window.dispatchEvent(new MessageEvent('message', {
      origin: 'https://www.youtube-nocookie.com',
      source: frame.contentWindow,
      data: JSON.stringify({ event: 'infoDelivery', info: { currentTime: 11018, playerState: 1 } }),
    }));

    expect(component.mediaIndex('robotics')).toBe(2);
    expect(component.playingVideoTopicId()).toBe('robotics');
    vi.advanceTimersByTime(5200);
    expect(component.mediaIndex('robotics')).toBe(2);

    window.dispatchEvent(new MessageEvent('message', {
      origin: 'https://www.youtube-nocookie.com',
      source: frame.contentWindow,
      data: JSON.stringify({ event: 'infoDelivery', info: { currentTime: 11020, playerState: 2 } }),
    }));
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', bubbles: true }));
    vi.advanceTimersByTime(5200);

    expect(component.playingVideoTopicId()).toBeNull();
    expect(component.mediaIndex('robotics')).toBe(3);
    document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'd', bubbles: true }));
  });

  it('pauses manual gallery navigation until WASD or a new island activation', () => {
    const component = fixture.componentInstance as unknown as {
      activeTopicId(): string | null;
      changeMedia(topicId: string, direction: number): void;
      galleryAutoAdvancePaused(): boolean;
      mediaIndex(topicId: string): number;
      visitTopic(topicId: string): void;
    };

    component.visitTopic('capstone');
    fixture.detectChanges();
    component.changeMedia('capstone', 1);
    fixture.detectChanges();
    expect(component.galleryAutoAdvancePaused()).toBe(true);
    expect(component.mediaIndex('capstone')).toBe(1);

    vi.advanceTimersByTime(5200);
    expect(component.mediaIndex('capstone')).toBe(1);

    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', bubbles: true }));
    fixture.detectChanges();
    expect(component.galleryAutoAdvancePaused()).toBe(false);
    vi.advanceTimersByTime(5200);
    expect(component.mediaIndex('capstone')).toBe(2);
    document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'd', bubbles: true }));

    component.changeMedia('capstone', 1);
    fixture.detectChanges();
    expect(component.galleryAutoAdvancePaused()).toBe(true);
    component.visitTopic('robotics');
    fixture.detectChanges();
    expect(component.activeTopicId()).toBe('robotics');
    expect(component.galleryAutoAdvancePaused()).toBe(false);
  });

  it('opens an activated topic in a centered pop-out and closes it', () => {
    const component = fixture.componentInstance as unknown as {
      activeTopicId(): string | null;
      closePopout(): void;
      openPopout(topicId: string): void;
      popoutTopicId(): string | null;
    };

    component.openPopout('capstone');
    fixture.detectChanges();

    expect(component.activeTopicId()).toBe('capstone');
    expect(component.popoutTopicId()).toBe('capstone');
    expect(compiled.querySelector('[role="dialog"]')).not.toBeNull();
    expect(compiled.querySelector('#extras-popout-title')?.textContent).toContain('Pineapple Expense');
    expect(compiled.querySelectorAll('[role="dialog"] .extra-screen__gallery-controls button')).toHaveLength(2);
    expect(compiled.querySelector('[aria-label="Close pop-out"]')).not.toBeNull();
    expect(compiled.querySelector('.extra-game__screen--active')).toBeNull();
    expect(document.documentElement.classList.contains('extra-game--popout-open')).toBe(true);
    expect(document.body.style.position).toBe('');
    expect(document.documentElement.style.getPropertyValue('--extra-game-scroll-lock-top')).toBe('');

    (compiled.querySelector('[aria-label="Close pop-out"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(component.popoutTopicId()).toBeNull();
    expect(compiled.querySelector('[role="dialog"]')).toBeNull();
    expect(document.documentElement.classList.contains('extra-game--popout-open')).toBe(false);
  });

  it('renders the pop-out above stacked media panes too', () => {
    recreateAt('/');
    const game = compiled.querySelector('.extra-game') as HTMLElement;
    Object.defineProperty(game, 'clientWidth', { configurable: true, value: 720 });
    resizeCallback([], {} as ResizeObserver);
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      activeTopicId(): string | null;
      openPopout(topicId: string): void;
      popoutTopicId(): string | null;
    };
    component.openPopout('robotics');
    fixture.detectChanges();

    expect(component.activeTopicId()).toBe('robotics');
    expect(component.popoutTopicId()).toBe('robotics');
    expect(compiled.querySelector('[role="dialog"]')).not.toBeNull();
    expect(compiled.querySelector('#extras-popout-title')?.textContent).toContain('Mochi at Competition');
  });

  it('handles arrow input dispatched outside the platformer', () => {
    const component = fixture.componentInstance as unknown as {
      horizontalVelocity: number;
      playerPosition(): { x: number; y: number };
      updatePhysics(deltaSeconds: number): void;
    };
    const keyDown = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    });

    document.body.dispatchEvent(keyDown);
    component.updatePhysics(0.032);
    fixture.detectChanges();

    expect(keyDown.defaultPrevented).toBe(true);
    expect(component.horizontalVelocity).toBeGreaterThan(0);
    expect(compiled.querySelector('.extra-game__screen--active')).toBeNull();

    document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight', bubbles: true }));
  });

  it('renders and poses the hero-inspired explorer sprite without changing its collision box', () => {
    const component = fixture.componentInstance as unknown as {
      updatePhysics(deltaSeconds: number): void;
    };
    const player = compiled.querySelector<HTMLElement>('.extra-game__player')!;

    expect(player.style.width).toBe('38px');
    expect(player.style.height).toBe('48px');
    expect(player.getAttribute('aria-label')).toBe('8-bit pixel art avatar of Tyler Hawthorn');
    expect(player.querySelector('.extra-game__player-sprite')).not.toBeNull();
    expect(player.querySelector('.extra-game__player-head')).toBeNull();

    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    component.updatePhysics(0.032);
    fixture.detectChanges();

    expect(player.classList.contains('extra-game__player--left')).toBe(true);
    expect(player.classList.contains('extra-game__player--moving')).toBe(true);

    document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'a', bubbles: true }));
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    fixture.detectChanges();

    expect(player.classList.contains('extra-game__player--airborne')).toBe(true);
    document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp', bubbles: true }));
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
    const component = fixture.componentInstance as unknown as {
      playerHeight: number;
      playerPosition(): { x: number; y: number };
    };
    const spawn = extrasLevelData.elements.find(element => element.id === extrasLevelData.spawn.elementId)!;
    expect(compiled.querySelector('.extra-game__wasd-hint')?.textContent).toContain('WASD');

    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    fixture.detectChanges();

    expect(compiled.querySelector('.extra-game__wasd-hint')).toBeNull();
    expect(compiled.querySelector('.extra-game__island-copy--active')?.textContent).toContain('A Custom Keyboard Build');
    expect(component.playerPosition()).toEqual({
      x: spawn.x + extrasLevelData.spawn.offsetX,
      y: spawn.y - component.playerHeight - 8,
    });
    expect(compiled.querySelector('iframe')?.getAttribute('src')).toContain('youtube-nocookie.com/embed/xph8DTsWbxM');
    document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'a', bubbles: true }));
  });

  function recreateAt(url: string): void {
    fixture.destroy();
    window.history.replaceState({}, '', url);
    fixture = TestBed.createComponent(ExtrasPlatformerComponent);
    fixture.componentRef.setInput('topics', extrasData);
    fixture.detectChanges();
    fixture.detectChanges();
    compiled = fixture.nativeElement;
  }

  function editorButton(label: string): HTMLButtonElement {
    const match = Array.from(compiled.querySelectorAll<HTMLButtonElement>('button')).find(
      button => button.textContent?.trim() === label,
    );
    if (!match) throw new Error(`Missing editor button: ${label}`);
    return match;
  }
});

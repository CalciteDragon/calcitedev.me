import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  computed,
  inject,
  input,
  isDevMode,
  signal,
  viewChild,
} from '@angular/core';
import { extrasLevelData } from '../../../../../data/extras-level.data';
import {
  ExtraLevelElement,
  ExtraLevelIsland,
  ExtraLevelPlatform,
  ExtrasLevelConfig,
} from '../../../../../models/extra-level.model';
import { ExtraTopic } from '../../../../../models/extra.model';
import { ExtraMediaPadComponent } from '../extra-media-pad/extra-media-pad.component';
import { ExtraMediaScreenComponent } from '../extra-media-screen/extra-media-screen.component';
import {
  ExtrasLevelEditorComponent,
  ExtrasLevelEditorMode,
  ExtrasLevelPropertyChange,
} from '../extras-level-editor/extras-level-editor.component';
import {
  clampElementToWorld,
  clearExtrasLevelDraft,
  cloneExtrasLevel,
  extrasLevelEditorEnabled,
  loadExtrasLevelDraft,
  nextPlatformId,
  saveExtrasLevelDraft,
  serializeExtrasLevelSource,
  snapCoordinate,
} from '../extras-level-editor/extras-level-editor-state';

interface PlayerPosition {
  readonly x: number;
  readonly y: number;
}

const MIN_PLATFORMER_WIDTH = 1080;
const PLAYER_WIDTH = 38;
const PLAYER_HEIGHT = 48;
const ACTIVE_PLATFORM_RISE = 8;
const PLATFORM_DEACTIVATION_DELAY = 1000;
const DEFAULT_PLATFORM_WIDTH = 180;
const DEFAULT_PLATFORM_HEIGHT = 20;
const EDITOR_GRID_SIZE = 10;
const MEDIA_PAD_WIDTH = 76;
const MEDIA_PAD_HEIGHT = 26;
const MEDIA_PAD_SPLIT = 48;
// Must stay in sync with --pad-travel in extra-media-pad.component.scss, which sinks the
// cap by the same amount so the explorer rides it down.
const MEDIA_PAD_PRESS_DEPTH = 7;
const MEDIA_PAD_CLICK_PRESS = 180;
const MOVEMENT_KEYS = ['a', 'd', 's', 'w', 'arrowleft', 'arrowright', 'arrowdown', 'arrowup'] as const;

/**
 * A prev/next slide pad floating above a multi-slide island. Pads are derived from island
 * geometry rather than stored in the level data, so the editor never has to manage them.
 */
interface ExtraMediaPad {
  readonly kind: 'media-pad';
  readonly id: string;
  readonly topicId: string;
  readonly accent: string;
  readonly direction: 1 | -1;
  readonly glyph: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

type ExtraCollisionTarget = ExtraLevelElement | ExtraMediaPad;

interface EditorDragState {
  readonly pointerId: number;
  readonly elementId: string;
  readonly startClientX: number;
  readonly startClientY: number;
  readonly originX: number;
  readonly originY: number;
  readonly startingLevel: ExtrasLevelConfig;
  moved: boolean;
}

function findElement(level: ExtrasLevelConfig, elementId: string): ExtraLevelElement | undefined {
  return level.elements.find(element => element.id === elementId);
}

function findIslandByTopic(level: ExtrasLevelConfig, topicId: string): ExtraLevelIsland | undefined {
  return level.elements.find(
    (element): element is ExtraLevelIsland => element.kind === 'island' && element.topicId === topicId,
  );
}

function spawnPosition(level: ExtrasLevelConfig): PlayerPosition {
  const spawn = findElement(level, level.spawn.elementId) ?? level.elements[0];
  if (!spawn) return { x: 0, y: 0 };

  const inset = Math.max(0, Math.min(level.spawn.offsetX, spawn.width - PLAYER_WIDTH));
  return { x: spawn.x + inset, y: spawn.y - PLAYER_HEIGHT };
}

function spawnTopicId(level: ExtrasLevelConfig): string {
  const spawn = findElement(level, level.spawn.elementId);
  return spawn?.kind === 'island' ? spawn.topicId : 'keyboard';
}

@Component({
  selector: 'app-extras-platformer',
  standalone: true,
  imports: [ExtraMediaPadComponent, ExtraMediaScreenComponent, ExtrasLevelEditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './extras-platformer.component.html',
  styleUrl: './extras-platformer.component.scss',
})
export class ExtrasPlatformerComponent implements AfterViewInit, OnDestroy {
  readonly topics = input.required<readonly ExtraTopic[]>();

  protected readonly level = signal<ExtrasLevelConfig>(cloneExtrasLevel(extrasLevelData));
  protected readonly worldWidth = computed(() => this.level().world.width);
  protected readonly worldHeight = computed(() => this.level().world.height);
  protected readonly playerWidth = PLAYER_WIDTH;
  protected readonly playerHeight = PLAYER_HEIGHT;
  protected readonly playerPosition = signal<PlayerPosition>(spawnPosition(extrasLevelData));
  protected readonly activeTopicId = signal<string | null>(null);
  protected readonly lastVisitedTopicId = signal(spawnTopicId(extrasLevelData));
  protected readonly facing = signal<'left' | 'right'>('right');
  protected readonly moving = signal(false);
  protected readonly crouching = signal(false);
  protected readonly airborne = signal(false);
  protected readonly showWasdHint = signal(true);
  protected readonly viewportWidth = signal<number>(extrasLevelData.world.width);
  protected readonly stackedLayout = signal(false);
  protected readonly mediaIndexes = signal<Record<string, number>>({ keyboard: 0, capstone: 0, robotics: 0 });
  protected readonly restingPadId = signal<string | null>(null);
  protected readonly clickedPadId = signal<string | null>(null);
  protected readonly popoutTopicId = signal<string | null>(null);
  protected readonly reducedMotion = signal(false);
  protected readonly editorEnabled = signal(false);
  protected readonly editorMode = signal<ExtrasLevelEditorMode>('edit');
  protected readonly selectedElementId = signal<string | null>(null);
  protected readonly snapEnabled = signal(true);
  protected readonly editorStatus = signal('Committed layout loaded');
  protected readonly canUndo = signal(false);
  protected readonly canRedo = signal(false);

  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');
  private readonly pressedKeys = new Set<string>();
  private horizontalVelocity = 0;
  private verticalVelocity = 0;
  private grounded = true;
  private animationFrameId: number | null = null;
  private clickedPadTimerId: number | null = null;
  private deactivationTimerId: number | null = null;
  private lastFrameTime = 0;
  private resizeObserver: ResizeObserver | null = null;
  private motionQuery: MediaQueryList | null = null;
  private hasUsedWasd = false;
  private supportingElementId: string | null = extrasLevelData.spawn.elementId;
  private editorDragState: EditorDragState | null = null;
  private popoutScrollTop: number | null = null;
  private readonly undoStack: ExtrasLevelConfig[] = [];
  private readonly redoStack: ExtrasLevelConfig[] = [];

  protected readonly islands = computed(() => this.level().elements.flatMap(element => {
    if (element.kind !== 'island') return [];
    const topic = this.topics().find(candidate => candidate.id === element.topicId);
    return topic ? [{ ...element, topic }] : [];
  }));
  protected readonly popoutTopic = computed(() => {
    const topicId = this.popoutTopicId();
    return topicId ? this.topics().find(topic => topic.id === topicId) ?? null : null;
  });
  protected readonly jumpPlatforms = computed(() => this.level().elements.filter(
    (element): element is ExtraLevelPlatform => element.kind === 'platform',
  ));
  protected readonly mediaPads = computed<readonly ExtraMediaPad[]>(() => this.islands().flatMap(island => {
    if (island.topic.media.length < 2) return [];

    const centerX = island.x + island.width / 2;
    // Pads rest flush on the island's top edge, so their base sits exactly on the collision surface.
    const top = island.y - MEDIA_PAD_HEIGHT;
    const base = {
      kind: 'media-pad',
      topicId: island.topicId,
      accent: island.topic.accent,
      y: top,
      width: MEDIA_PAD_WIDTH,
      height: MEDIA_PAD_HEIGHT,
    } as const;
    return [
      {
        ...base,
        id: `${island.topicId}-pad-previous`,
        direction: -1,
        glyph: '‹',
        x: Math.round(centerX - MEDIA_PAD_SPLIT / 2 - MEDIA_PAD_WIDTH),
      },
      {
        ...base,
        id: `${island.topicId}-pad-next`,
        direction: 1,
        glyph: '›',
        x: Math.round(centerX + MEDIA_PAD_SPLIT / 2),
      },
    ] satisfies readonly ExtraMediaPad[];
  }));
  private readonly collisionTargets = computed<readonly ExtraCollisionTarget[]>(
    () => [...this.level().elements, ...this.mediaPads()],
  );

  protected readonly worldScale = computed(() => Math.min(1, this.viewportWidth() / this.worldWidth()));
  protected readonly desktopViewportHeight = computed(() => this.worldHeight() * this.worldScale());

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const enableEditor = isDevMode() && extrasLevelEditorEnabled(window.location.search);
    this.editorEnabled.set(enableEditor);
    if (enableEditor) {
      const draft = loadExtrasLevelDraft(
        window.localStorage,
        extrasLevelData.revision,
        this.topics().map(topic => topic.id),
      );
      if (draft) {
        this.level.set(draft.level);
        this.editorStatus.set(`Draft restored from ${new Date(draft.savedAt).toLocaleString()}`);
      } else {
        this.editorStatus.set('Edit mode · committed layout loaded');
      }
      this.resetPlayerToSpawn();
    }

    this.updateViewportWidth();
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.updateViewportWidth());
      this.resizeObserver.observe(this.viewport().nativeElement);
    }

    this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotion.set(this.motionQuery.matches);
    this.motionQuery.addEventListener?.('change', this.handleMotionPreference);

    this.document.addEventListener('keydown', this.handleGlobalKeyDown);
    this.document.addEventListener('keyup', this.handleGlobalKeyUp);
    this.document.addEventListener('wheel', this.handlePopoutWheel, { passive: false });
    this.document.addEventListener('touchmove', this.handlePopoutTouchMove, { passive: false });
    this.document.defaultView?.addEventListener('scroll', this.handlePopoutScroll, { passive: true });
    this.document.defaultView?.addEventListener('blur', this.handleWindowBlur);

    this.animationFrameId = window.requestAnimationFrame(this.tick);
  }

  ngOnDestroy(): void {
    this.setPopoutPageState(false);
    if (this.animationFrameId !== null) window.cancelAnimationFrame(this.animationFrameId);
    if (this.clickedPadTimerId !== null) window.clearTimeout(this.clickedPadTimerId);
    if (this.deactivationTimerId !== null) window.clearTimeout(this.deactivationTimerId);
    this.resizeObserver?.disconnect();
    this.motionQuery?.removeEventListener?.('change', this.handleMotionPreference);
    this.document.removeEventListener('keydown', this.handleGlobalKeyDown);
    this.document.removeEventListener('keyup', this.handleGlobalKeyUp);
    this.document.removeEventListener('wheel', this.handlePopoutWheel);
    this.document.removeEventListener('touchmove', this.handlePopoutTouchMove);
    this.document.defaultView?.removeEventListener('scroll', this.handlePopoutScroll);
    this.document.defaultView?.removeEventListener('blur', this.handleWindowBlur);
  }

  protected mediaIndex(topicId: string): number {
    return this.mediaIndexes()[topicId] ?? 0;
  }

  protected visitTopic(topicId: string): void {
    if (this.editorEnabled() && this.editorMode() === 'edit') return;
    const platform = findIslandByTopic(this.level(), topicId);
    if (!platform) return;

    this.horizontalVelocity = 0;
    this.verticalVelocity = 0;
    this.grounded = true;
    this.airborne.set(false);
    this.restingPadId.set(null);
    this.supportingElementId = platform.id;
    this.activateTopic(topicId);
    this.playerPosition.set({
      x: platform.x + platform.width / 2 - PLAYER_WIDTH / 2,
      y: this.platformTop(platform) - PLAYER_HEIGHT,
    });
  }

  protected changeMedia(topicId: string, direction: number): void {
    if (this.editorEnabled() && this.editorMode() === 'edit') return;
    const topic = this.topics().find(candidate => candidate.id === topicId);
    if (!topic || topic.media.length < 2) return;

    this.mediaIndexes.update(indexes => ({
      ...indexes,
      [topicId]: (this.mediaIndex(topicId) + direction + topic.media.length) % topic.media.length,
    }));
  }

  protected padPressed(padId: string): boolean {
    return this.restingPadId() === padId || this.clickedPadId() === padId;
  }

  protected pressMediaPad(pad: ExtraMediaPad): void {
    if (this.editorEnabled() && this.editorMode() === 'edit') return;

    this.clickedPadId.set(pad.id);
    if (this.clickedPadTimerId !== null) window.clearTimeout(this.clickedPadTimerId);
    this.clickedPadTimerId = window.setTimeout(() => {
      this.clickedPadTimerId = null;
      this.clickedPadId.set(null);
    }, MEDIA_PAD_CLICK_PRESS);
    this.navigateMedia(pad.topicId, pad.direction);
  }

  protected openPopout(topicId: string): void {
    if (this.editorEnabled() && this.editorMode() === 'edit') return;

    if (this.stackedLayout()) {
      this.activateStackedTopic(topicId);
    } else {
      this.visitTopic(topicId);
    }
    this.popoutTopicId.set(topicId);
    this.setPopoutPageState(true);
  }

  protected closePopout(): void {
    this.popoutTopicId.set(null);
    this.setPopoutPageState(false);
  }

  protected navigateMedia(topicId: string, direction: number): void {
    if (this.editorEnabled() && this.editorMode() === 'edit') return;
    const shouldVisit = this.activeTopicId() !== topicId;
    this.changeMedia(topicId, direction);

    if (!shouldVisit) return;
    if (this.stackedLayout()) {
      this.activateTopic(topicId);
    } else {
      this.visitTopic(topicId);
    }
  }

  protected handleKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    if (!this.isMovementKey(key)) return;

    event.preventDefault();
    if (['a', 'd', 's', 'w'].includes(key)) {
      this.showWasdHint.set(false);
      if (!this.hasUsedWasd) {
        this.hasUsedWasd = true;
        this.activateStandingPlatform();
      }
    }
    this.pressedKeys.add(key);
    this.crouching.set(key === 's' || key === 'arrowdown' || this.crouching());
    if ((key === 'w' || key === 'arrowup') && !event.repeat) this.jump();
  }

  protected handleKeyUp(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    this.pressedKeys.delete(key);
    if (key === 's' || key === 'arrowdown') this.crouching.set(false);
  }

  protected clearInput(): void {
    this.pressedKeys.clear();
    this.moving.set(false);
    this.crouching.set(false);
  }

  protected activateStackedTopic(topicId: string): void {
    if (this.editorEnabled() && this.editorMode() === 'edit') return;
    this.activateTopic(topicId);
  }

  protected selectEditorElement(elementId: string): void {
    if (!findElement(this.level(), elementId)) return;
    this.selectedElementId.set(elementId);
    this.editorStatus.set(`${elementId} selected`);
  }

  protected changeEditorMode(mode: ExtrasLevelEditorMode): void {
    if (mode === this.editorMode()) return;
    if (mode === 'playtest' && this.stackedLayout()) {
      this.editorStatus.set('Widen the viewport to at least 1080px before playtesting');
      return;
    }

    this.editorMode.set(mode);
    this.clearInput();
    this.horizontalVelocity = 0;
    this.verticalVelocity = 0;
    this.setActiveTopic(null);
    this.resetPlayerToSpawn();
    this.editorStatus.set(mode === 'edit' ? 'Edit mode · physics paused' : 'Playtest mode · draft geometry active');
  }

  protected addEditorPlatform(): void {
    if (!this.editorCanMutate()) return;
    const current = this.playerPosition();
    const platform: ExtraLevelPlatform = {
      kind: 'platform',
      id: nextPlatformId(this.level().elements),
      x: Math.round(current.x + PLAYER_WIDTH + 80),
      y: Math.round(Math.max(20, current.y - 70)),
      width: DEFAULT_PLATFORM_WIDTH,
      height: DEFAULT_PLATFORM_HEIGHT,
    };
    const clamped = clampElementToWorld(platform, this.level().world, this.snapEnabled() ? EDITOR_GRID_SIZE : 1);
    this.commitEditorLevel(
      { ...this.level(), elements: [...this.level().elements, clamped] },
      `Added ${platform.id}`,
    );
    this.selectedElementId.set(platform.id);
  }

  protected deleteSelectedElement(): void {
    if (!this.editorCanMutate()) return;
    const selected = this.selectedEditorElement();
    if (!selected || selected.kind === 'island') return;

    this.commitEditorLevel(
      { ...this.level(), elements: this.level().elements.filter(element => element.id !== selected.id) },
      `Deleted ${selected.id}`,
    );
    this.selectedElementId.set(null);
  }

  protected duplicateSelectedElement(): void {
    if (!this.editorCanMutate()) return;
    const selected = this.selectedEditorElement();
    if (!selected || selected.kind !== 'platform') return;

    const duplicate = clampElementToWorld(
      {
        ...selected,
        id: nextPlatformId(this.level().elements),
        x: selected.x + 20,
        y: selected.y + 20,
      },
      this.level().world,
      this.snapEnabled() ? EDITOR_GRID_SIZE : 1,
    ) as ExtraLevelPlatform;
    this.commitEditorLevel(
      { ...this.level(), elements: [...this.level().elements, duplicate] },
      `Duplicated ${selected.id} as ${duplicate.id}`,
    );
    this.selectedElementId.set(duplicate.id);
  }

  protected updateEditorProperty(change: ExtrasLevelPropertyChange): void {
    if (!this.editorCanMutate()) return;
    const selected = findElement(this.level(), change.id);
    if (!selected || (selected.kind === 'island' && ['width', 'height'].includes(change.property))) return;

    const changed = { ...selected, [change.property]: Math.round(change.value) } as ExtraLevelElement;
    const clamped = clampElementToWorld(changed, this.level().world);
    this.commitEditorLevel(
      this.replaceLevelElement(this.level(), clamped),
      `Updated ${change.id} ${change.property} to ${clamped[change.property]}`,
    );
  }

  protected undoEditorChange(): void {
    if (!this.editorCanMutate()) return;
    const previous = this.undoStack.pop();
    if (!previous) return;

    this.redoStack.push(cloneExtrasLevel(this.level()));
    this.level.set(previous);
    this.finishHistoryChange('Undid last level change');
  }

  protected redoEditorChange(): void {
    if (!this.editorCanMutate()) return;
    const next = this.redoStack.pop();
    if (!next) return;

    this.undoStack.push(cloneExtrasLevel(this.level()));
    this.level.set(next);
    this.finishHistoryChange('Redid level change');
  }

  protected resetEditorLevel(): void {
    if (!this.editorCanMutate()) return;
    this.level.set(cloneExtrasLevel(extrasLevelData));
    this.undoStack.length = 0;
    this.redoStack.length = 0;
    this.selectedElementId.set(null);
    clearExtrasLevelDraft(window.localStorage, extrasLevelData.revision);
    this.updateHistoryAvailability();
    this.resetPlayerToSpawn();
    this.editorStatus.set('Draft reset to the committed layout');
  }

  protected async copyEditorSource(): Promise<void> {
    const source = this.publishableEditorSource();
    try {
      await navigator.clipboard.writeText(source);
      this.editorStatus.set('Publish config copied · replace extras-level.data.ts and commit it');
    } catch {
      this.editorStatus.set('Clipboard unavailable · use Download instead');
    }
  }

  protected downloadEditorSource(): void {
    const blob = new Blob([this.publishableEditorSource()], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = this.document.createElement('a');
    link.href = url;
    link.download = 'extras-level.data.ts';
    link.click();
    URL.revokeObjectURL(url);
    this.editorStatus.set('Downloaded extras-level.data.ts for source-controlled publishing');
  }

  protected startEditorDrag(event: PointerEvent, elementId: string): void {
    if (!this.editorCanMutate()) return;
    const element = findElement(this.level(), elementId);
    if (!element) return;

    event.preventDefault();
    event.stopPropagation();
    this.selectedElementId.set(elementId);
    if (event.currentTarget instanceof HTMLElement) event.currentTarget.setPointerCapture(event.pointerId);
    this.editorDragState = {
      pointerId: event.pointerId,
      elementId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: element.x,
      originY: element.y,
      startingLevel: cloneExtrasLevel(this.level()),
      moved: false,
    };
  }

  protected moveEditorDrag(event: PointerEvent): void {
    const drag = this.editorDragState;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const element = findElement(drag.startingLevel, drag.elementId);
    if (!element) return;

    const scale = Math.max(this.worldScale(), 0.001);
    const grid = this.snapEnabled() && !event.altKey ? EDITOR_GRID_SIZE : 1;
    const x = snapCoordinate(drag.originX + (event.clientX - drag.startClientX) / scale, grid);
    const y = snapCoordinate(drag.originY + (event.clientY - drag.startClientY) / scale, grid);
    const clamped = clampElementToWorld({ ...element, x, y }, drag.startingLevel.world);
    if (clamped.x === element.x && clamped.y === element.y) return;

    drag.moved = true;
    this.level.set(this.replaceLevelElement(drag.startingLevel, clamped));
    this.editorStatus.set(`Moving ${drag.elementId} · ${clamped.x}, ${clamped.y}`);
  }

  protected finishEditorDrag(event: PointerEvent): void {
    const drag = this.editorDragState;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget instanceof HTMLElement && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    this.editorDragState = null;
    if (!drag.moved) return;

    this.undoStack.push(drag.startingLevel);
    this.redoStack.length = 0;
    this.finishHistoryChange(`Moved ${drag.elementId}`);
  }

  protected cancelEditorDrag(event: PointerEvent): void {
    const drag = this.editorDragState;
    if (!drag || drag.pointerId !== event.pointerId) return;
    this.editorDragState = null;
    if (drag.moved) this.level.set(drag.startingLevel);
    this.editorStatus.set(`Cancelled moving ${drag.elementId}`);
  }

  private handleEditorKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && key === 'z') {
      event.preventDefault();
      if (event.shiftKey) this.redoEditorChange(); else this.undoEditorChange();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && key === 'd') {
      event.preventDefault();
      this.duplicateSelectedElement();
      return;
    }
    if (key === 'insert') {
      event.preventDefault();
      this.addEditorPlatform();
      return;
    }
    if (key === 'delete' || key === 'backspace') {
      event.preventDefault();
      this.deleteSelectedElement();
      return;
    }
    if (!['arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(key)) return;

    event.preventDefault();
    const distance = event.shiftKey ? 10 : 1;
    const deltaX = key === 'arrowleft' ? -distance : key === 'arrowright' ? distance : 0;
    const deltaY = key === 'arrowup' ? -distance : key === 'arrowdown' ? distance : 0;
    this.nudgeSelectedElement(deltaX, deltaY);
  }

  private nudgeSelectedElement(deltaX: number, deltaY: number): void {
    const selected = this.selectedEditorElement();
    if (!selected) return;
    const changed = clampElementToWorld(
      { ...selected, x: selected.x + deltaX, y: selected.y + deltaY },
      this.level().world,
    );
    this.commitEditorLevel(
      this.replaceLevelElement(this.level(), changed),
      `Moved ${selected.id} to ${changed.x}, ${changed.y}`,
    );
  }

  private editorCanMutate(): boolean {
    return this.editorEnabled() && this.editorMode() === 'edit';
  }

  private selectedEditorElement(): ExtraLevelElement | undefined {
    const selectedId = this.selectedElementId();
    return selectedId ? findElement(this.level(), selectedId) : undefined;
  }

  private replaceLevelElement(
    level: ExtrasLevelConfig,
    replacement: ExtraLevelElement,
  ): ExtrasLevelConfig {
    return {
      ...level,
      elements: level.elements.map(element => element.id === replacement.id ? replacement : element),
    };
  }

  private commitEditorLevel(nextLevel: ExtrasLevelConfig, status: string): void {
    this.undoStack.push(cloneExtrasLevel(this.level()));
    if (this.undoStack.length > 50) this.undoStack.shift();
    this.redoStack.length = 0;
    this.level.set(nextLevel);
    this.finishHistoryChange(status);
  }

  private finishHistoryChange(status: string): void {
    this.updateHistoryAvailability();
    const saved = saveExtrasLevelDraft(window.localStorage, this.level(), extrasLevelData.revision);
    this.editorStatus.set(saved ? `${status} · draft saved locally` : `${status} · local draft unavailable`);
  }

  private updateHistoryAvailability(): void {
    this.canUndo.set(this.undoStack.length > 0);
    this.canRedo.set(this.redoStack.length > 0);
  }

  private resetPlayerToSpawn(): void {
    this.playerPosition.set(spawnPosition(this.level()));
    this.lastVisitedTopicId.set(spawnTopicId(this.level()));
    this.supportingElementId = this.level().spawn.elementId;
    this.horizontalVelocity = 0;
    this.verticalVelocity = 0;
    this.grounded = true;
    this.airborne.set(false);
    this.restingPadId.set(null);
    this.hasUsedWasd = false;
    this.showWasdHint.set(!this.editorEnabled() || this.editorMode() === 'playtest');
  }

  private publishableEditorSource(): string {
    return serializeExtrasLevelSource({
      ...this.level(),
      revision: Math.max(extrasLevelData.revision + 1, this.level().revision),
    });
  }

  private readonly handleMotionPreference = (event: MediaQueryListEvent): void => {
    this.reducedMotion.set(event.matches);
  };

  private readonly handleGlobalKeyDown = (event: KeyboardEvent): void => {
    if (this.isEditableTarget(event.target)) return;
    if (event.key === 'Escape' && this.popoutTopicId() !== null) {
      event.preventDefault();
      this.closePopout();
      return;
    }
    if (
      this.popoutTopicId() !== null
      && [' ', 'ArrowDown', 'ArrowUp', 'End', 'Home', 'PageDown', 'PageUp'].includes(event.key)
      && !this.isPopoutDialogEvent(event)
    ) {
      event.preventDefault();
      return;
    }
    if (this.editorEnabled() && event.key.toLowerCase() === 'p') {
      event.preventDefault();
      this.changeEditorMode(this.editorMode() === 'edit' ? 'playtest' : 'edit');
      return;
    }
    if (this.editorEnabled() && this.editorMode() === 'edit') {
      this.handleEditorKeyDown(event);
      return;
    }
    if (this.stackedLayout()) return;
    this.handleKeyDown(event);
  };

  private readonly handleGlobalKeyUp = (event: KeyboardEvent): void => {
    if (this.stackedLayout()) return;
    this.handleKeyUp(event);
  };

  private readonly handleWindowBlur = (): void => {
    this.clearInput();
  };

  private readonly handlePopoutWheel = (event: WheelEvent): void => {
    if (this.popoutTopicId() !== null && !this.isPopoutDialogEvent(event)) event.preventDefault();
  };

  private readonly handlePopoutTouchMove = (event: TouchEvent): void => {
    if (this.popoutTopicId() !== null && !this.isPopoutDialogEvent(event)) event.preventDefault();
  };

  private readonly handlePopoutScroll = (): void => {
    const view = this.document.defaultView;
    if (this.popoutTopicId() === null || this.popoutScrollTop === null || !view) return;
    if (view.scrollY === this.popoutScrollTop) return;

    const root = this.document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    view.scrollTo(0, this.popoutScrollTop);
    root.style.scrollBehavior = previousScrollBehavior;
  };

  private isPopoutDialogEvent(event: Event): boolean {
    return event.target instanceof Element && event.target.closest('.extra-game__popout-dialog') !== null;
  }

  private readonly tick = (time: number): void => {
    const deltaSeconds = this.lastFrameTime === 0 ? 0 : Math.min((time - this.lastFrameTime) / 1000, 0.032);
    this.lastFrameTime = time;
    const physicsEnabled = !this.editorEnabled() || this.editorMode() === 'playtest';
    if (deltaSeconds > 0 && !this.stackedLayout() && physicsEnabled) this.updatePhysics(deltaSeconds);
    this.animationFrameId = window.requestAnimationFrame(this.tick);
  };

  private updatePhysics(deltaSeconds: number): void {
    const keyboardDirection =
      (this.pressedKeys.has('d') || this.pressedKeys.has('arrowright') ? 1 : 0) -
      (this.pressedKeys.has('a') || this.pressedKeys.has('arrowleft') ? 1 : 0);
    const direction = keyboardDirection;
    const targetVelocity = direction * (this.crouching() ? 95 : 250);
    const acceleration = this.grounded ? 1850 : 1050;
    const velocityDifference = targetVelocity - this.horizontalVelocity;
    const velocityStep = Math.sign(velocityDifference) * Math.min(Math.abs(velocityDifference), acceleration * deltaSeconds);
    this.horizontalVelocity += velocityStep;

    if (direction !== 0) this.facing.set(direction < 0 ? 'left' : 'right');
    this.moving.set(direction !== 0 && !this.crouching());

    const current = this.playerPosition();
    const nextX = Math.max(
      0,
      Math.min(this.worldWidth() - PLAYER_WIDTH, current.x + this.horizontalVelocity * deltaSeconds),
    );
    this.verticalVelocity += 1500 * deltaSeconds;
    let nextY = current.y + this.verticalVelocity * deltaSeconds;
    let landedPlatform: ExtraCollisionTarget | null = null;
    let landedPlatformTop = 0;

    if (this.verticalVelocity >= 0) {
      const previousBottom = current.y + PLAYER_HEIGHT;
      const nextBottom = nextY + PLAYER_HEIGHT;
      for (const platform of this.collisionTargets()) {
        const platformTop = this.platformTop(platform);
        const overlaps = nextX + PLAYER_WIDTH > platform.x + 5 && nextX < platform.x + platform.width - 5;
        const crossesTop = previousBottom <= platformTop + 1 && nextBottom >= platformTop;
        if (overlaps && crossesTop && (!landedPlatform || platformTop < landedPlatformTop)) {
          landedPlatform = platform;
          landedPlatformTop = platformTop;
        }
      }
    }

    if (landedPlatform) {
      // A pad only fires on the landing frame; resting on it must not advance the gallery again.
      const isNewSupport = this.supportingElementId !== landedPlatform.id;
      this.verticalVelocity = 0;
      this.grounded = true;
      this.airborne.set(false);
      this.supportingElementId = landedPlatform.id;
      this.restingPadId.set(landedPlatform.kind === 'media-pad' ? landedPlatform.id : null);

      if (landedPlatform.kind !== 'platform' && this.hasUsedWasd) {
        this.activateTopic(landedPlatform.topicId);
      } else {
        this.scheduleActiveTopicDeactivation();
      }
      if (landedPlatform.kind === 'media-pad' && isNewSupport) {
        this.changeMedia(landedPlatform.topicId, landedPlatform.direction);
      }
      // Re-read the top so the active-island rise and the pad's press depth both move the player.
      nextY = this.platformTop(landedPlatform) - PLAYER_HEIGHT;
    } else {
      this.grounded = false;
      this.airborne.set(true);
      this.restingPadId.set(null);
      this.supportingElementId = null;
      this.scheduleActiveTopicDeactivation();
    }

    if (nextY > this.worldHeight() + PLAYER_HEIGHT) {
      this.respawn();
      return;
    }

    this.playerPosition.set({ x: nextX, y: nextY });
  }

  private jump(): void {
    if (!this.grounded || this.crouching()) return;
    this.verticalVelocity = -620;
    this.grounded = false;
    this.airborne.set(true);
    this.supportingElementId = null;
  }

  private respawn(): void {
    this.visitTopic(this.lastVisitedTopicId());
  }

  private activateStandingPlatform(): void {
    if (!this.grounded) return;

    const current = this.playerPosition();
    const currentBottom = current.y + PLAYER_HEIGHT;
    const platform = this.collisionTargets().find(candidate => {
      const overlaps = current.x + PLAYER_WIDTH > candidate.x + 5 && current.x < candidate.x + candidate.width - 5;
      return candidate.kind !== 'platform' && overlaps && Math.abs(currentBottom - this.platformTop(candidate)) <= 1;
    });
    if (!platform || platform.kind === 'platform') return;

    this.activateTopic(platform.topicId);
    this.supportingElementId = platform.id;
    this.playerPosition.set({ x: current.x, y: this.platformTop(platform) - PLAYER_HEIGHT });
  }

  private activateTopic(topicId: string): void {
    this.cancelActiveTopicDeactivation();
    this.setActiveTopic(topicId);
  }

  private scheduleActiveTopicDeactivation(): void {
    if (this.activeTopicId() === null || this.deactivationTimerId !== null) return;

    this.deactivationTimerId = window.setTimeout(() => {
      this.deactivationTimerId = null;
      const supportId = this.supportingElementId;
      // A topic's own slide pads count as support, so resting on one keeps its island active.
      const support = supportId
        ? this.collisionTargets().find(target => target.id === supportId)
        : undefined;
      if (!support || support.kind === 'platform' || support.topicId !== this.activeTopicId()) {
        this.setActiveTopic(null);
      }
    }, PLATFORM_DEACTIVATION_DELAY);
  }

  private cancelActiveTopicDeactivation(): void {
    if (this.deactivationTimerId === null) return;
    window.clearTimeout(this.deactivationTimerId);
    this.deactivationTimerId = null;
  }

  private setActiveTopic(topicId: string | null): void {
    if (this.activeTopicId() === topicId) return;
    this.activeTopicId.set(topicId);
    if (topicId) this.lastVisitedTopicId.set(topicId);
  }

  private updateViewportWidth(): void {
    const width = this.viewport().nativeElement.clientWidth || this.worldWidth();
    const useStackedLayout = width < MIN_PLATFORMER_WIDTH;

    this.viewportWidth.set(width);
    if (this.stackedLayout() !== useStackedLayout) {
      this.stackedLayout.set(useStackedLayout);
      this.clearInput();
      this.horizontalVelocity = 0;
      this.verticalVelocity = 0;
      if (useStackedLayout && this.editorEnabled() && this.editorMode() === 'playtest') {
        this.editorMode.set('edit');
        this.setActiveTopic(null);
        this.resetPlayerToSpawn();
        this.editorStatus.set('Edit mode restored · widen to at least 1080px for playtesting');
      }
    }
  }

  private platformTop(platform: ExtraCollisionTarget): number {
    if (platform.kind === 'platform') return platform.y;

    const rise = platform.topicId === this.activeTopicId() ? ACTIVE_PLATFORM_RISE : 0;
    const press = platform.kind === 'media-pad' && this.restingPadId() === platform.id
      ? MEDIA_PAD_PRESS_DEPTH
      : 0;
    return platform.y - rise + press;
  }

  private isMovementKey(key: string): key is typeof MOVEMENT_KEYS[number] {
    return MOVEMENT_KEYS.includes(key as typeof MOVEMENT_KEYS[number]);
  }

  private isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
  }

  private setPopoutPageState(open: boolean): void {
    const root = this.document.documentElement;
    const view = this.document.defaultView;
    if (!root) return;

    if (open) {
      this.popoutScrollTop = view?.scrollY ?? 0;
      root.classList.add('extra-game--popout-open');
      return;
    }

    this.popoutScrollTop = null;
    root.classList.remove('extra-game--popout-open');
  }
}

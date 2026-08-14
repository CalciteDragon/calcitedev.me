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
  signal,
  viewChild,
} from '@angular/core';
import { ExtraTopic } from '../../../../../models/extra.model';
import { ExtraMediaScreenComponent } from '../extra-media-screen/extra-media-screen.component';

interface Platform {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly topicId?: string;
}

interface IslandGeometry {
  readonly topicId: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

interface PlayerPosition {
  readonly x: number;
  readonly y: number;
}

const WORLD_WIDTH = 1800;
const WORLD_HEIGHT = 700;
const MIN_PLATFORMER_WIDTH = 1080;
const PLAYER_WIDTH = 38;
const PLAYER_HEIGHT = 48;
const ACTIVE_PLATFORM_RISE = 8;
const PLATFORM_DEACTIVATION_DELAY = 1000;
const MOVEMENT_KEYS = ['a', 'd', 's', 'w', 'arrowleft', 'arrowright', 'arrowdown', 'arrowup'] as const;

const PLATFORMS: readonly Platform[] = [
  { id: 'capstone-island', x: 30, y: 300, width: 556, height: 350, topicId: 'capstone' },
  { id: 'keyboard-island', x: 622, y: 235, width: 556, height: 365, topicId: 'keyboard' },
  { id: 'robotics-island', x: 1214, y: 300, width: 556, height: 350, topicId: 'robotics' },
];

const ISLAND_GEOMETRY: readonly IslandGeometry[] = [
  { topicId: 'capstone', x: 30, y: 300, width: 556, height: 350 },
  { topicId: 'keyboard', x: 622, y: 235, width: 556, height: 365 },
  { topicId: 'robotics', x: 1214, y: 300, width: 556, height: 350 },
];

const STARTING_TOPIC_ID = 'keyboard';
const STARTING_PLATFORM = PLATFORMS.find(platform => platform.topicId === STARTING_TOPIC_ID)!;
const STARTING_PLATFORM_INSET = 58;

@Component({
  selector: 'app-extras-platformer',
  standalone: true,
  imports: [ExtraMediaScreenComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './extras-platformer.component.html',
  styleUrl: './extras-platformer.component.scss',
})
export class ExtrasPlatformerComponent implements AfterViewInit, OnDestroy {
  readonly topics = input.required<readonly ExtraTopic[]>();

  protected readonly worldWidth = WORLD_WIDTH;
  protected readonly worldHeight = WORLD_HEIGHT;
  protected readonly playerWidth = PLAYER_WIDTH;
  protected readonly playerHeight = PLAYER_HEIGHT;
  protected readonly playerPosition = signal<PlayerPosition>({
    x: STARTING_PLATFORM.x + STARTING_PLATFORM_INSET,
    y: STARTING_PLATFORM.y - PLAYER_HEIGHT,
  });
  protected readonly activeTopicId = signal<string | null>(null);
  protected readonly lastVisitedTopicId = signal(STARTING_TOPIC_ID);
  protected readonly facing = signal<'left' | 'right'>('right');
  protected readonly moving = signal(false);
  protected readonly crouching = signal(false);
  protected readonly showWasdHint = signal(true);
  protected readonly viewportWidth = signal(WORLD_WIDTH);
  protected readonly stackedLayout = signal(false);
  protected readonly mediaIndexes = signal<Record<string, number>>({ keyboard: 0, capstone: 0, robotics: 0 });
  protected readonly reducedMotion = signal(false);

  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');
  private readonly pressedKeys = new Set<string>();
  private horizontalVelocity = 0;
  private verticalVelocity = 0;
  private grounded = true;
  private animationFrameId: number | null = null;
  private galleryTimerId: number | null = null;
  private deactivationTimerId: number | null = null;
  private lastFrameTime = 0;
  private resizeObserver: ResizeObserver | null = null;
  private motionQuery: MediaQueryList | null = null;
  private hasUsedWasd = false;

  protected readonly islands = computed(() => ISLAND_GEOMETRY.flatMap(geometry => {
    const topic = this.topics().find(candidate => candidate.id === geometry.topicId);
    return topic ? [{ ...geometry, topic }] : [];
  }));

  protected readonly worldScale = computed(() => Math.min(1, this.viewportWidth() / WORLD_WIDTH));
  protected readonly desktopViewportHeight = computed(() => WORLD_HEIGHT * this.worldScale());

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

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
    this.document.defaultView?.addEventListener('blur', this.handleWindowBlur);

    this.animationFrameId = window.requestAnimationFrame(this.tick);
    this.restartGalleryTimer();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) window.cancelAnimationFrame(this.animationFrameId);
    if (this.galleryTimerId !== null) window.clearInterval(this.galleryTimerId);
    if (this.deactivationTimerId !== null) window.clearTimeout(this.deactivationTimerId);
    this.resizeObserver?.disconnect();
    this.motionQuery?.removeEventListener?.('change', this.handleMotionPreference);
    this.document.removeEventListener('keydown', this.handleGlobalKeyDown);
    this.document.removeEventListener('keyup', this.handleGlobalKeyUp);
    this.document.defaultView?.removeEventListener('blur', this.handleWindowBlur);
  }

  protected mediaIndex(topicId: string): number {
    return this.mediaIndexes()[topicId] ?? 0;
  }

  protected visitTopic(topicId: string): void {
    const platform = PLATFORMS.find(candidate => candidate.topicId === topicId);
    if (!platform) return;

    this.horizontalVelocity = 0;
    this.verticalVelocity = 0;
    this.grounded = true;
    if (this.hasUsedWasd) {
      this.activateTopic(topicId);
    } else {
      this.lastVisitedTopicId.set(topicId);
    }
    this.playerPosition.set({
      x: platform.x + platform.width / 2 - PLAYER_WIDTH / 2,
      y: this.platformTop(platform) - PLAYER_HEIGHT,
    });
  }

  protected changeMedia(topicId: string, direction: number): void {
    const topic = this.topics().find(candidate => candidate.id === topicId);
    if (!topic || topic.media.length < 2) return;

    this.mediaIndexes.update(indexes => ({
      ...indexes,
      [topicId]: (this.mediaIndex(topicId) + direction + topic.media.length) % topic.media.length,
    }));
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
    this.activateTopic(topicId);
  }

  private readonly handleMotionPreference = (event: MediaQueryListEvent): void => {
    this.reducedMotion.set(event.matches);
  };

  private readonly handleGlobalKeyDown = (event: KeyboardEvent): void => {
    if (this.stackedLayout() || this.isEditableTarget(event.target)) return;
    this.handleKeyDown(event);
  };

  private readonly handleGlobalKeyUp = (event: KeyboardEvent): void => {
    if (this.stackedLayout()) return;
    this.handleKeyUp(event);
  };

  private readonly handleWindowBlur = (): void => {
    this.clearInput();
  };

  private readonly tick = (time: number): void => {
    const deltaSeconds = this.lastFrameTime === 0 ? 0 : Math.min((time - this.lastFrameTime) / 1000, 0.032);
    this.lastFrameTime = time;
    if (deltaSeconds > 0 && !this.stackedLayout()) this.updatePhysics(deltaSeconds);
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
    const nextX = Math.max(0, Math.min(WORLD_WIDTH - PLAYER_WIDTH, current.x + this.horizontalVelocity * deltaSeconds));
    this.verticalVelocity += 1500 * deltaSeconds;
    let nextY = current.y + this.verticalVelocity * deltaSeconds;
    let landedPlatform: Platform | null = null;
    let landedPlatformTop = 0;

    if (this.verticalVelocity >= 0) {
      const previousBottom = current.y + PLAYER_HEIGHT;
      const nextBottom = nextY + PLAYER_HEIGHT;
      for (const platform of PLATFORMS) {
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
      this.verticalVelocity = 0;
      this.grounded = true;
      if (this.hasUsedWasd && landedPlatform.topicId) this.activateTopic(landedPlatform.topicId);
      nextY = this.platformTop(landedPlatform) - PLAYER_HEIGHT;
    } else {
      this.grounded = false;
      this.scheduleActiveTopicDeactivation();
    }

    if (nextY > WORLD_HEIGHT + PLAYER_HEIGHT) {
      this.respawn();
      return;
    }

    this.playerPosition.set({ x: nextX, y: nextY });
  }

  private jump(): void {
    if (!this.grounded || this.crouching()) return;
    this.verticalVelocity = -620;
    this.grounded = false;
  }

  private respawn(): void {
    this.visitTopic(this.lastVisitedTopicId());
  }

  private activateStandingPlatform(): void {
    if (!this.grounded) return;

    const current = this.playerPosition();
    const currentBottom = current.y + PLAYER_HEIGHT;
    const platform = PLATFORMS.find(candidate => {
      const overlaps = current.x + PLAYER_WIDTH > candidate.x + 5 && current.x < candidate.x + candidate.width - 5;
      return candidate.topicId && overlaps && Math.abs(currentBottom - this.platformTop(candidate)) <= 1;
    });
    if (!platform?.topicId) return;

    this.activateTopic(platform.topicId);
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
      if (!this.grounded) this.setActiveTopic(null);
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
    this.restartGalleryTimer();
  }

  private advanceActiveGallery(): void {
    if (this.reducedMotion() || this.document.hidden) return;
    const topicId = this.activeTopicId();
    if (topicId) this.changeMedia(topicId, 1);
  }

  private updateViewportWidth(): void {
    const width = this.viewport().nativeElement.clientWidth || WORLD_WIDTH;
    const useStackedLayout = width < MIN_PLATFORMER_WIDTH;

    this.viewportWidth.set(width);
    if (this.stackedLayout() !== useStackedLayout) {
      this.stackedLayout.set(useStackedLayout);
      this.clearInput();
      this.horizontalVelocity = 0;
      this.verticalVelocity = 0;
    }
  }

  private platformTop(platform: Platform): number {
    return platform.y - (platform.topicId === this.activeTopicId() ? ACTIVE_PLATFORM_RISE : 0);
  }

  private isMovementKey(key: string): key is typeof MOVEMENT_KEYS[number] {
    return MOVEMENT_KEYS.includes(key as typeof MOVEMENT_KEYS[number]);
  }

  private isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
  }

  private restartGalleryTimer(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.galleryTimerId !== null) window.clearInterval(this.galleryTimerId);
    this.galleryTimerId = window.setInterval(() => this.advanceActiveGallery(), 5200);
  }
}

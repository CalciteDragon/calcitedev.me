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

const PLATFORMS: readonly Platform[] = [
  { id: 'keyboard-island', x: 30, y: 300, width: 556, height: 350, topicId: 'keyboard' },
  { id: 'capstone-island', x: 622, y: 235, width: 556, height: 365, topicId: 'capstone' },
  { id: 'robotics-island', x: 1214, y: 300, width: 556, height: 350, topicId: 'robotics' },
];

const ISLAND_GEOMETRY: readonly IslandGeometry[] = [
  { topicId: 'keyboard', x: 30, y: 300, width: 556, height: 350 },
  { topicId: 'capstone', x: 622, y: 235, width: 556, height: 365 },
  { topicId: 'robotics', x: 1214, y: 300, width: 556, height: 350 },
];

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
  protected readonly playerPosition = signal<PlayerPosition>({ x: 88, y: 300 - PLAYER_HEIGHT });
  protected readonly activeTopicId = signal<string | null>('keyboard');
  protected readonly lastVisitedTopicId = signal('keyboard');
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
  private pointerDirection = 0;
  private horizontalVelocity = 0;
  private verticalVelocity = 0;
  private grounded = true;
  private animationFrameId: number | null = null;
  private galleryTimerId: number | null = null;
  private lastFrameTime = 0;
  private resizeObserver: ResizeObserver | null = null;
  private motionQuery: MediaQueryList | null = null;

  protected readonly islands = computed(() => ISLAND_GEOMETRY.flatMap(geometry => {
    const topic = this.topics().find(candidate => candidate.id === geometry.topicId);
    return topic ? [{ ...geometry, topic }] : [];
  }));

  protected readonly worldScale = computed(() => Math.min(1, this.viewportWidth() / WORLD_WIDTH));
  protected readonly desktopViewportHeight = computed(() => WORLD_HEIGHT * this.worldScale() + 56);

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

    this.animationFrameId = window.requestAnimationFrame(this.tick);
    this.restartGalleryTimer();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) window.cancelAnimationFrame(this.animationFrameId);
    if (this.galleryTimerId !== null) window.clearInterval(this.galleryTimerId);
    this.resizeObserver?.disconnect();
    this.motionQuery?.removeEventListener?.('change', this.handleMotionPreference);
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
    this.playerPosition.set({
      x: platform.x + platform.width / 2 - PLAYER_WIDTH / 2,
      y: platform.y - PLAYER_HEIGHT,
    });
    this.setActiveTopic(topicId);
    this.viewport().nativeElement.focus({ preventScroll: true });
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
    if (!['a', 'd', 's', 'w', 'arrowleft', 'arrowright', 'arrowdown', 'arrowup'].includes(key)) return;

    event.preventDefault();
    if (['a', 'd', 's', 'w'].includes(key)) this.showWasdHint.set(false);
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
    this.pointerDirection = 0;
    this.moving.set(false);
    this.crouching.set(false);
  }

  protected pressDirection(direction: -1 | 1, event: PointerEvent): void {
    event.preventDefault();
    this.pointerDirection = direction;
    this.facing.set(direction < 0 ? 'left' : 'right');
    this.viewport().nativeElement.focus({ preventScroll: true });
    (event.currentTarget as HTMLElement | null)?.setPointerCapture?.(event.pointerId);
  }

  protected releaseDirection(event: PointerEvent): void {
    this.pointerDirection = 0;
    (event.currentTarget as HTMLElement | null)?.releasePointerCapture?.(event.pointerId);
  }

  protected pressCrouch(event: PointerEvent): void {
    event.preventDefault();
    this.crouching.set(true);
    this.viewport().nativeElement.focus({ preventScroll: true });
  }

  protected releaseCrouch(): void {
    this.crouching.set(false);
  }

  protected pressJump(event: PointerEvent): void {
    event.preventDefault();
    this.viewport().nativeElement.focus({ preventScroll: true });
    this.jump();
  }

  protected activateStackedTopic(topicId: string): void {
    this.setActiveTopic(topicId);
  }

  private readonly handleMotionPreference = (event: MediaQueryListEvent): void => {
    this.reducedMotion.set(event.matches);
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
    const direction = this.pointerDirection || keyboardDirection;
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

    if (this.verticalVelocity >= 0) {
      const previousBottom = current.y + PLAYER_HEIGHT;
      const nextBottom = nextY + PLAYER_HEIGHT;
      for (const platform of PLATFORMS) {
        const overlaps = nextX + PLAYER_WIDTH > platform.x + 5 && nextX < platform.x + platform.width - 5;
        const crossesTop = previousBottom <= platform.y + 1 && nextBottom >= platform.y;
        if (overlaps && crossesTop && (!landedPlatform || platform.y < landedPlatform.y)) {
          landedPlatform = platform;
        }
      }
    }

    if (landedPlatform) {
      nextY = landedPlatform.y - PLAYER_HEIGHT;
      this.verticalVelocity = 0;
      this.grounded = true;
      this.setActiveTopic(landedPlatform.topicId ?? null);
    } else {
      this.grounded = false;
      this.setActiveTopic(null);
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

  private restartGalleryTimer(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.galleryTimerId !== null) window.clearInterval(this.galleryTimerId);
    this.galleryTimerId = window.setInterval(() => this.advanceActiveGallery(), 5200);
  }
}

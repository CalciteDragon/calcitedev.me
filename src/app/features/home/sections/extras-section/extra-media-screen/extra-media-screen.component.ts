import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ExtraMediaItem, ExtraTopic } from '../../../../../models/extra.model';

@Component({
  selector: 'app-extra-media-screen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './extra-media-screen.component.html',
  styleUrl: './extra-media-screen.component.scss',
})
export class ExtraMediaScreenComponent implements OnInit, OnDestroy {
  readonly topic = input.required<ExtraTopic>();
  readonly active = input(false);
  readonly staticLayout = input(false);
  readonly mediaIndex = input(0);

  readonly visitRequested = output<void>();
  readonly previousRequested = output<void>();
  readonly nextRequested = output<void>();
  readonly videoPlaybackChanged = output<boolean>();

  private readonly sanitizer = inject(DomSanitizer);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly savedPlaybackSeconds = new Map<string, number>();
  private activePlayerWindow: Window | null = null;
  private activeYoutubeId: string | null = null;
  private videoPlaying = false;

  protected readonly currentMedia = computed<ExtraMediaItem>(() => {
    const media = this.topic().media;
    return media[this.mediaIndex() % media.length];
  });

  protected readonly currentMediaList = computed<readonly ExtraMediaItem[]>(() => [this.currentMedia()]);

  protected readonly videoUrl = computed<SafeResourceUrl | null>(() => {
    const item = this.currentMedia();
    if (!this.active() || item.type !== 'youtube' || !item.youtubeId) return null;

    const resumeAt = Math.max(
      0,
      Math.floor(this.savedPlaybackSeconds.get(item.youtubeId) ?? item.youtubeStartSeconds ?? 0),
    );
    const startParameter = resumeAt > 0 ? `&start=${resumeAt}` : '';
    const pageOrigin = this.document.location?.origin;
    const originParameter = pageOrigin && pageOrigin !== 'null' ? `&origin=${encodeURIComponent(pageOrigin)}` : '';

    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube-nocookie.com/embed/${item.youtubeId}?autoplay=1&mute=1&playsinline=1&rel=0&enablejsapi=1${startParameter}${originParameter}`,
    );
  });

  protected readonly thumbnailUrl = computed<string | null>(() => {
    const item = this.currentMedia();
    return item.youtubeId ? `https://i.ytimg.com/vi/${item.youtubeId}/maxresdefault.jpg` : null;
  });

  protected readonly hasMultipleMedia = computed(() => this.topic().media.length > 1);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.document.defaultView?.addEventListener('message', this.handlePlayerMessage);
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.document.defaultView?.removeEventListener('message', this.handlePlayerMessage);
  }

  protected connectVideoPlayer(event: Event): void {
    const frame = event.currentTarget;
    const item = this.currentMedia();
    if (!(frame instanceof HTMLIFrameElement) || item.type !== 'youtube' || !item.youtubeId) return;

    this.activePlayerWindow = frame.contentWindow;
    this.activeYoutubeId = item.youtubeId;
    this.activePlayerWindow?.postMessage(
      JSON.stringify({ event: 'listening', id: `extras-${this.topic().id}` }),
      'https://www.youtube-nocookie.com',
    );
  }

  protected requestVisit(): void {
    this.visitRequested.emit();
  }

  protected requestPrevious(event: Event): void {
    event.stopPropagation();
    this.previousRequested.emit();
  }

  protected requestNext(event: Event): void {
    event.stopPropagation();
    this.nextRequested.emit();
  }

  private readonly handlePlayerMessage = (event: MessageEvent<unknown>): void => {
    if (event.origin !== 'https://www.youtube-nocookie.com' || event.source !== this.activePlayerWindow) return;

    const payload = this.parsePlayerMessage(event.data);
    if (!payload || payload.event !== 'infoDelivery' || !payload.info || !this.activeYoutubeId) return;

    const currentTime = payload.info.currentTime;
    if (typeof currentTime === 'number' && Number.isFinite(currentTime) && currentTime >= 0) {
      this.savedPlaybackSeconds.set(this.activeYoutubeId, currentTime);
    }

    const playerState = payload.info.playerState;
    if (typeof playerState === 'number') this.setVideoPlaying(playerState === 1);
  };

  private setVideoPlaying(playing: boolean): void {
    if (this.videoPlaying === playing) return;
    this.videoPlaying = playing;
    this.videoPlaybackChanged.emit(playing);
  }

  private parsePlayerMessage(data: unknown): YouTubePlayerMessage | null {
    let parsed: unknown = data;
    if (typeof data === 'string') {
      try {
        parsed = JSON.parse(data) as unknown;
      } catch {
        return null;
      }
    }

    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed as YouTubePlayerMessage;
  }
}

interface YouTubePlayerMessage {
  readonly event?: unknown;
  readonly info?: {
    readonly currentTime?: unknown;
    readonly playerState?: unknown;
  };
}

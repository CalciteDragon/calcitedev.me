import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ExtraMediaItem, ExtraTopic } from '../../../../../models/extra.model';

@Component({
  selector: 'app-extra-media-screen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './extra-media-screen.component.html',
  styleUrl: './extra-media-screen.component.scss',
})
export class ExtraMediaScreenComponent {
  readonly topic = input.required<ExtraTopic>();
  readonly active = input(false);
  readonly staticLayout = input(false);
  readonly mediaIndex = input(0);

  readonly visitRequested = output<void>();
  readonly previousRequested = output<void>();
  readonly nextRequested = output<void>();

  private readonly sanitizer = inject(DomSanitizer);

  protected readonly currentMedia = computed<ExtraMediaItem>(() => {
    const media = this.topic().media;
    return media[this.mediaIndex() % media.length];
  });

  protected readonly currentMediaList = computed<readonly ExtraMediaItem[]>(() => [this.currentMedia()]);

  protected readonly videoUrl = computed<SafeResourceUrl | null>(() => {
    const item = this.currentMedia();
    if (!this.active() || item.type !== 'youtube' || !item.youtubeId) return null;

    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube-nocookie.com/embed/${item.youtubeId}?autoplay=1&mute=1&playsinline=1&rel=0`,
    );
  });

  protected readonly thumbnailUrl = computed<string | null>(() => {
    const item = this.currentMedia();
    return item.youtubeId ? `https://i.ytimg.com/vi/${item.youtubeId}/maxresdefault.jpg` : null;
  });

  protected readonly hasMultipleMedia = computed(() => this.topic().media.length > 1);

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
}

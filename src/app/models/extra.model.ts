import { GlowColor } from '../shared/types/glow-color.type';

export type ExtraMediaType = 'image' | 'youtube';

export interface ExtraMediaItem {
  readonly type: ExtraMediaType;
  readonly alt: string;
  readonly caption: string;
  readonly imageUrl?: string;
  readonly youtubeId?: string;
  readonly youtubeStartSeconds?: number;
  readonly placeholderLabel?: string;
}

export interface ExtraTopic {
  readonly id: string;
  readonly shortLabel: string;
  readonly islandLabel: string;
  readonly title: string;
  readonly description: string;
  readonly accent: GlowColor;
  readonly media: readonly ExtraMediaItem[];
  readonly externalUrl?: string;
  readonly externalLabel?: string;
}

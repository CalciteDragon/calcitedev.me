import { GlowColor } from '../shared/types/glow-color.type';

export interface Project {
  readonly title: string;
  readonly slug: string;
  readonly eyebrow: string;
  readonly status: string;
  readonly description: string;
  readonly longDescription: string;
  readonly tags: readonly string[];
  readonly imageUrl: string;
  readonly imageAlt: string;
  readonly liveUrl?: string;
  readonly githubUrl?: string;
  readonly glowColor: GlowColor;
}

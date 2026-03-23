import { GlowColor } from '../shared/types/glow-color.type';

export type ProjectCategory = 'game' | 'web-app' | 'api' | 'tool' | 'other';

export interface Project {
  title: string;
  slug: string;
  description: string;
  longDescription: string;
  tags: string[];
  imageUrl: string;
  liveUrl?: string;
  githubUrl?: string;
  featured: boolean;
  category: ProjectCategory;
  glowColor: GlowColor;
}

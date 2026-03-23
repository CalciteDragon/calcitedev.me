import { GlowColor } from '../shared/types/glow-color.type';

export type SkillCategory =
  | 'Languages'
  | 'Frontend'
  | 'Backend'
  | 'Databases'
  | 'DevOps'
  | 'Testing & Quality'
  | 'Git & Version Control'
  | 'Architecture & Concepts';

export interface Skill {
  name: string;
  icon?: string; // asset path — populated in Phase 11 asset swap
}

export interface SkillGroup {
  category: SkillCategory;
  color: GlowColor;
  skills: Skill[];
}

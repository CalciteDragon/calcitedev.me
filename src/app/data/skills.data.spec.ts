import { skillsData } from './skills.data';
import { SkillCategory } from '../models/skill.model';

const EXPECTED_CATEGORIES: SkillCategory[] = [
  'Languages',
  'Frontend',
  'Backend',
  'Databases',
  'DevOps',
  'Testing & Quality',
  'Git & Version Control',
  'Architecture & Concepts',
];

describe('skillsData', () => {
  it('should contain exactly 8 groups', () => {
    expect(skillsData.length).toBe(8);
  });

  it('should contain all required categories', () => {
    const categories = skillsData.map(g => g.category);
    for (const expected of EXPECTED_CATEGORIES) {
      expect(categories).toContain(expected);
    }
  });

  it('should have no duplicate category entries', () => {
    const categories = skillsData.map(g => g.category);
    const unique = new Set(categories);
    expect(unique.size).toBe(categories.length);
  });

  it('should have no empty skill groups', () => {
    for (const group of skillsData) {
      expect(group.skills.length).toBeGreaterThan(0);
    }
  });

  it('should have no duplicate skill names across all groups', () => {
    const allNames = skillsData.flatMap(g => g.skills.map(s => s.name.toLowerCase()));
    const unique = new Set(allNames);
    expect(unique.size).toBe(allNames.length);
  });
});

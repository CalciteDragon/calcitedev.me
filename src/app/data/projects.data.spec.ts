import { projectsData } from './projects.data';

describe('projectsData', () => {
  it('contains the seven current portfolio projects in display order', () => {
    expect(projectsData.map(project => project.slug)).toEqual([
      'live-bingo',
      'pineapple-expense',
      'calcite-portfolio',
      'mochi-2026',
      'black-and-white',
      'minecraft-hide-and-seek',
      'roblox-pvp-world',
    ]);
  });

  it('has unique slugs', () => {
    const slugs = projectsData.map(project => project.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('has complete display content for every project', () => {
    for (const project of projectsData) {
      expect(project.title.trim()).not.toBe('');
      expect(project.slug).toMatch(/^[a-z0-9-]+$/);
      expect(project.eyebrow.trim()).not.toBe('');
      expect(project.status.trim()).not.toBe('');
      expect(project.description.trim()).not.toBe('');
      expect(project.longDescription.trim()).not.toBe('');
      expect(project.imageUrl.trim()).not.toBe('');
      expect(project.imageAlt.trim()).not.toBe('');
      expect(project.tags.length).toBeGreaterThan(0);
    }
  });

  it('uses secure URLs for every external project link', () => {
    for (const project of projectsData) {
      if (project.liveUrl) expect(project.liveUrl).toMatch(/^https:\/\//);
      if (project.githubUrl) expect(project.githubUrl).toMatch(/^https:\/\//);
    }
  });
});

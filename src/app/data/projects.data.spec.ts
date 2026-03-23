import { projectsData } from './projects.data';

describe('projectsData', () => {
  it('should have at least 4 projects', () => {
    expect(projectsData.length).toBeGreaterThanOrEqual(4);
  });

  it('should have unique slugs', () => {
    const slugs = projectsData.map(p => p.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it('should have no empty required string fields', () => {
    for (const project of projectsData) {
      expect(project.title.trim()).not.toBe('');
      expect(project.slug.trim()).not.toBe('');
      expect(project.description.trim()).not.toBe('');
      expect(project.longDescription.trim()).not.toBe('');
      expect(project.imageUrl.trim()).not.toBe('');
    }
  });

  it('should have valid slugs (lowercase kebab-case only)', () => {
    for (const project of projectsData) {
      expect(project.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('should have at least one featured project', () => {
    const featured = projectsData.filter(p => p.featured);
    expect(featured.length).toBeGreaterThanOrEqual(1);
  });
});

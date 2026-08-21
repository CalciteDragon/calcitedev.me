import {
  createStars,
  createParticles,
  defaultConfig,
} from './scene-entities';

describe('defaultConfig', () => {
  it('returns fewer stars and particles when reducedComplexity is true', () => {
    const full = defaultConfig(false);
    const reduced = defaultConfig(true);
    expect(reduced.starCount).toBeLessThan(full.starCount);
    expect(reduced.particleCount).toBeLessThan(full.particleCount);
    expect(reduced.reducedComplexity).toBe(true);
  });
});

describe('createStars', () => {
  it('returns exactly the requested count', () => {
    expect(createStars(10, 800, 600)).toHaveLength(10);
  });

  it('places every star within canvas bounds', () => {
    for (const star of createStars(50, 800, 600)) {
      expect(star.x).toBeGreaterThanOrEqual(0);
      expect(star.x).toBeLessThanOrEqual(800);
      expect(star.y).toBeGreaterThanOrEqual(0);
      expect(star.y).toBeLessThanOrEqual(600);
    }
  });

  it('assigns each star a radius between 0.4 and 2.5', () => {
    for (const star of createStars(30, 100, 100)) {
      expect(star.radius).toBeGreaterThanOrEqual(0.4);
      expect(star.radius).toBeLessThanOrEqual(2.5);
    }
  });

  it('assigns each star an initial opacity between 0.2 and 0.8', () => {
    for (const star of createStars(30, 100, 100)) {
      expect(star.opacity).toBeGreaterThanOrEqual(0.2);
      expect(star.opacity).toBeLessThanOrEqual(0.8);
    }
  });

  it('assigns each star a parallaxFactor between 0.01 and 0.04', () => {
    for (const star of createStars(30, 100, 100)) {
      expect(star.parallaxFactor).toBeGreaterThanOrEqual(0.01);
      expect(star.parallaxFactor).toBeLessThanOrEqual(0.04);
    }
  });
});

describe('createStars — determinism', () => {
  it('produces an identical field on every call with the default seed', () => {
    expect(createStars(40, 1920, 1080)).toEqual(createStars(40, 1920, 1080));
  });

  it('produces a different field for a different seed', () => {
    const a = createStars(40, 1920, 1080, 1);
    const b = createStars(40, 1920, 1080, 2);
    expect(a).not.toEqual(b);
  });

  it('keeps each star at the same relative position across viewport sizes', () => {
    const wide = createStars(20, 1920, 1080);
    const narrow = createStars(20, 960, 1080);
    wide.forEach((star, i) => {
      expect(narrow[i].x).toBeCloseTo(star.x / 2, 5);
      expect(narrow[i].y).toBeCloseTo(star.y, 5);
    });
  });
});

describe('createParticles', () => {
  it('produces an identical field on every call with the default seed', () => {
    expect(createParticles(20, 800, 600)).toEqual(createParticles(20, 800, 600));
  });

  it('does not mirror the star field layout', () => {
    const stars = createStars(20, 800, 600);
    const particles = createParticles(20, 800, 600);
    expect(particles.map(p => p.x)).not.toEqual(stars.map(s => s.x));
  });

  it('returns the requested count', () => {
    expect(createParticles(15, 800, 600)).toHaveLength(15);
  });

  it('all particles drift upward (negative vy)', () => {
    for (const p of createParticles(20, 800, 600)) {
      expect(p.vy).toBeLessThan(0);
    }
  });

  it('places particles within canvas x bounds', () => {
    for (const p of createParticles(20, 800, 600)) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(800);
    }
  });

  it('places particles within canvas y bounds', () => {
    for (const p of createParticles(20, 800, 600)) {
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(600);
    }
  });
});


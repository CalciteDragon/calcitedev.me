import {
  createStars,
  createMountainLayers,
  createUFO,
  createRocket,
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

  it('assigns each star a radius between 0.5 and 2', () => {
    for (const star of createStars(30, 100, 100)) {
      expect(star.radius).toBeGreaterThanOrEqual(0.5);
      expect(star.radius).toBeLessThanOrEqual(2);
    }
  });

  it('assigns each star an initial opacity between 0.15 and 0.40', () => {
    for (const star of createStars(30, 100, 100)) {
      expect(star.opacity).toBeGreaterThanOrEqual(0.15);
      expect(star.opacity).toBeLessThanOrEqual(0.40);
    }
  });

  it('assigns each star a parallaxFactor between 0.01 and 0.04', () => {
    for (const star of createStars(30, 100, 100)) {
      expect(star.parallaxFactor).toBeGreaterThanOrEqual(0.01);
      expect(star.parallaxFactor).toBeLessThanOrEqual(0.04);
    }
  });
});

describe('createMountainLayers', () => {
  it('returns exactly 2 layers', () => {
    expect(createMountainLayers()).toHaveLength(2);
  });

  it('back layer has a smaller parallaxFactor than the front layer', () => {
    const [back, front] = createMountainLayers();
    expect(back.parallaxFactor).toBeLessThan(front.parallaxFactor);
  });

  it('each layer starts at the left edge and ends at the right edge at the bottom', () => {
    for (const layer of createMountainLayers()) {
      const first = layer.vertices.at(0)!;
      const last = layer.vertices.at(-1)!;
      expect(first.nx).toBe(0);
      expect(first.ny).toBe(1);
      expect(last.nx).toBe(1);
      expect(last.ny).toBe(1);
    }
  });

  it('each layer has at least 4 vertices (left-edge, peaks, right-edge)', () => {
    for (const layer of createMountainLayers()) {
      expect(layer.vertices.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('interior peak vertices have ny between 0 and 1 exclusive', () => {
    for (const layer of createMountainLayers()) {
      const peaks = layer.vertices.slice(1, -1);
      for (const v of peaks) {
        expect(v.ny).toBeGreaterThan(0);
        expect(v.ny).toBeLessThan(1);
      }
    }
  });

  it('interior peak vertices have nx between 0 and 1 exclusive', () => {
    for (const layer of createMountainLayers()) {
      const peaks = layer.vertices.slice(1, -1);
      for (const v of peaks) {
        expect(v.nx).toBeGreaterThan(0);
        expect(v.nx).toBeLessThan(1);
      }
    }
  });
});

describe('createParticles', () => {
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

describe('createUFO', () => {
  it('returns a UFO with normalized position in 0..1', () => {
    const ufo = createUFO();
    expect(ufo.nx).toBeGreaterThanOrEqual(0);
    expect(ufo.nx).toBeLessThanOrEqual(1);
    expect(ufo.baseNy).toBeGreaterThanOrEqual(0);
    expect(ufo.baseNy).toBeLessThanOrEqual(1);
  });

  it('returns a UFO with a positive bob amplitude', () => {
    expect(createUFO().bobAmplitude).toBeGreaterThan(0);
  });
});

describe('createRocket', () => {
  it('returns a Rocket with normalized position in 0..1', () => {
    const rocket = createRocket();
    expect(rocket.nx).toBeGreaterThanOrEqual(0);
    expect(rocket.nx).toBeLessThanOrEqual(1);
    expect(rocket.ny).toBeGreaterThanOrEqual(0);
    expect(rocket.ny).toBeLessThanOrEqual(1);
  });
});

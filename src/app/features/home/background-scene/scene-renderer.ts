import {
  Star,
  MountainLayer,
  UFO,
  Rocket,
  SceneParticle,
  SceneConfig,
  createStars,
  createMountainLayers,
  createUFO,
  createRocket,
  createParticles,
} from './scene-entities';

export class SceneRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly config: SceneConfig;

  private cssWidth = 0;
  private cssHeight = 0;
  private stars: Star[] = [];
  private mountains: MountainLayer[] = [];
  private ufo: UFO | null = null;
  private rocket: Rocket | null = null;
  private particles: SceneParticle[] = [];
  private lastTimestamp = 0;
  private destroyed = false;

  constructor(canvas: HTMLCanvasElement, config: SceneConfig) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context from canvas element');
    this.ctx = ctx;
    this.config = config;
  }

  /**
   * Seed all scene entities for the given CSS dimensions.
   * Called directly and also internally by resize().
   */
  init(cssWidth: number, cssHeight: number): void {
    this.cssWidth = cssWidth;
    this.cssHeight = cssHeight;
    this.stars = createStars(this.config.starCount, cssWidth, cssHeight);
    this.mountains = createMountainLayers();
    this.particles = createParticles(this.config.particleCount, cssWidth, cssHeight);
    if (!this.config.reducedComplexity) {
      this.ufo = createUFO();
      this.rocket = createRocket();
    } else {
      this.ufo = null;
      this.rocket = null;
    }
    this.lastTimestamp = 0;
  }

  /**
   * Set canvas physical dimensions (accounting for DPR) and re-seed all entities.
   * Setting canvas.width/height resets context state — re-apply DPR scale after.
   */
  resize(cssWidth: number, cssHeight: number): void {
    const dpr = window.devicePixelRatio || 1;
    const canvas = this.ctx.canvas;
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.init(cssWidth, cssHeight);
  }

  /**
   * Draw one animation frame.
   * @param timestamp  — rAF timestamp in ms
   * @param scrollY    — window.scrollY in CSS px
   * @param heroHeight — offsetHeight of the #home section; gates hero-only elements
   */
  drawFrame(timestamp: number, scrollY: number, heroHeight: number): void {
    if (this.destroyed || this.cssWidth === 0) return;

    const deltaTime = this.lastTimestamp === 0 ? 16 : timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    this.ctx.clearRect(0, 0, this.cssWidth, this.cssHeight);

    // Stars and particles render on every section
    this.drawStars(timestamp, scrollY);
    this.drawParticles(deltaTime);

    // Hero-specific elements only while the hero section is in view
    const heroVisible = scrollY < heroHeight;
    if (heroVisible) {
      this.drawMountains(scrollY);
      if (!this.config.reducedComplexity) {
        if (this.ufo) this.drawUFO(deltaTime);
        if (this.rocket) this.drawRocket(deltaTime);
      }
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.stars = [];
    this.mountains = [];
    this.particles = [];
    this.ufo = null;
    this.rocket = null;
  }

  // ─── Private Draw Methods ──────────────────────────────────────────────────

  private drawStars(timestamp: number, scrollY: number): void {
    for (const star of this.stars) {
      // Apply per-star parallax — deeper stars (smaller factor) drift less
      const drawnY = star.y - scrollY * star.parallaxFactor;
      // Skip stars that have drifted entirely off-screen
      if (drawnY < -star.radius || drawnY > this.cssHeight + star.radius) continue;

      const twinkle = 0.4 + 0.6 * Math.sin(star.twinklePhase + timestamp * star.twinkleSpeed);
      this.ctx.beginPath();
      this.ctx.arc(star.x, drawnY, star.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(229, 231, 235, ${(twinkle * star.opacity).toFixed(3)})`;
      this.ctx.fill();
    }
  }

  private drawMountains(scrollY: number): void {
    for (const layer of this.mountains) {
      const offsetY = scrollY * layer.parallaxFactor;
      const w = this.cssWidth;
      const h = this.cssHeight;

      this.ctx.beginPath();
      const first = layer.vertices[0];
      this.ctx.moveTo(first.nx * w, first.ny * h + offsetY);
      for (let i = 1; i < layer.vertices.length; i++) {
        const v = layer.vertices[i];
        this.ctx.lineTo(v.nx * w, v.ny * h + offsetY);
      }
      this.ctx.closePath();

      this.ctx.strokeStyle = layer.strokeColor;
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
      this.ctx.fillStyle = layer.fillColor;
      this.ctx.fill();
    }
  }

  private drawParticles(deltaTime: number): void {
    for (const p of this.particles) {
      p.y += p.vy * deltaTime;
      if (p.y < -2) {
        p.y = this.cssHeight + 2;
        p.x = Math.random() * this.cssWidth;
      }
      this.ctx.fillStyle = `rgba(139, 92, 246, ${p.opacity.toFixed(3)})`;
      this.ctx.fillRect(p.x, p.y, p.size, p.size);
    }
  }

  private drawUFO(deltaTime: number): void {
    const ufo = this.ufo!;
    ufo.bobPhase += ufo.bobSpeed * deltaTime;

    const x = ufo.nx * this.cssWidth;
    const y = ufo.baseNy * this.cssHeight + Math.sin(ufo.bobPhase) * ufo.bobAmplitude;

    // Saucer body
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, 28, 10, 0, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(34, 211, 238, 0.7)';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();
    this.ctx.fillStyle = 'rgba(34, 211, 238, 0.08)';
    this.ctx.fill();

    // Dome
    this.ctx.beginPath();
    this.ctx.ellipse(x, y - 4, 14, 10, 0, Math.PI, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(34, 211, 238, 0.5)';
    this.ctx.stroke();
    this.ctx.fillStyle = 'rgba(34, 211, 238, 0.06)';
    this.ctx.fill();

    // Tractor beam
    const beam = this.ctx.createLinearGradient(x, y + 10, x, y + 60);
    beam.addColorStop(0, 'rgba(34, 211, 238, 0.1)');
    beam.addColorStop(1, 'rgba(34, 211, 238, 0)');
    this.ctx.beginPath();
    this.ctx.moveTo(x - 12, y + 10);
    this.ctx.lineTo(x + 12, y + 10);
    this.ctx.lineTo(x + 20, y + 60);
    this.ctx.lineTo(x - 20, y + 60);
    this.ctx.closePath();
    this.ctx.fillStyle = beam;
    this.ctx.fill();
  }

  private drawRocket(deltaTime: number): void {
    const rocket = this.rocket!;
    rocket.flamePhase += rocket.flameSpeed * deltaTime;

    const x = rocket.nx * this.cssWidth;
    const y = rocket.ny * this.cssHeight;
    const flicker = 0.7 + 0.3 * Math.sin(rocket.flamePhase);

    this.ctx.save();
    this.ctx.translate(x, y);

    // Nose cone
    this.ctx.beginPath();
    this.ctx.moveTo(0, -22);
    this.ctx.lineTo(-7, 0);
    this.ctx.lineTo(7, 0);
    this.ctx.closePath();
    this.ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();
    this.ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
    this.ctx.fill();

    // Fuselage
    this.ctx.strokeRect(-7, 0, 14, 14);

    // Left fin
    this.ctx.beginPath();
    this.ctx.moveTo(-7, 8);
    this.ctx.lineTo(-13, 18);
    this.ctx.lineTo(-7, 14);
    this.ctx.closePath();
    this.ctx.stroke();

    // Right fin
    this.ctx.beginPath();
    this.ctx.moveTo(7, 8);
    this.ctx.lineTo(13, 18);
    this.ctx.lineTo(7, 14);
    this.ctx.closePath();
    this.ctx.stroke();

    // Animated flame
    const flameHeight = 16 * flicker;
    const flame = this.ctx.createLinearGradient(0, 14, 0, 14 + flameHeight);
    flame.addColorStop(0, `rgba(245, 158, 11, ${(0.8 * flicker).toFixed(2)})`);
    flame.addColorStop(0.5, `rgba(236, 72, 153, ${(0.5 * flicker).toFixed(2)})`);
    flame.addColorStop(1, 'rgba(139, 92, 246, 0)');
    this.ctx.beginPath();
    this.ctx.moveTo(-5, 14);
    this.ctx.lineTo(5, 14);
    this.ctx.lineTo(0, 14 + flameHeight);
    this.ctx.closePath();
    this.ctx.fillStyle = flame;
    this.ctx.fill();

    this.ctx.restore();
  }
}

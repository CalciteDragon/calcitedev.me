import {
  Star,
  SceneParticle,
  SceneConfig,
  createStars,
  createParticles,
} from './scene-entities';

export class SceneRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly config: SceneConfig;

  private cssWidth = 0;
  private cssHeight = 0;
  private stars: Star[] = [];
  private particles: SceneParticle[] = [];
  private atmosphereGradient: CanvasGradient | null = null;
  private horizonGradient: CanvasGradient | null = null;
  private lastTimestamp = -1;
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
    this.particles = createParticles(this.config.particleCount, cssWidth, cssHeight);
    this.buildGradients();
    this.lastTimestamp = -1;
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
   * @param timestamp — rAF timestamp in ms
   * @param scrollY   — window.scrollY in CSS px
   */
  drawFrame(timestamp: number, scrollY: number): void {
    if (this.destroyed || this.cssWidth === 0) return;

    const deltaTime = this.lastTimestamp === -1 ? 16 : timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    this.ctx.clearRect(0, 0, this.cssWidth, this.cssHeight);

    // Atmospheric depth behind all elements
    this.drawAtmosphere();

    // Subtle neon bloom along the mountain ridge
    this.drawHorizonGlow();

    this.drawStars(timestamp, scrollY);
    this.drawParticles(deltaTime);
  }

  destroy(): void {
    this.destroyed = true;
    this.stars = [];
    this.particles = [];
  }

  // ─── Private Draw Methods ──────────────────────────────────────────────────

  /**
   * Subtle atmospheric depth gradient — warm cyan-to-indigo haze builds toward
   * the horizon, giving the sky a sense of light scatter before the mountains.
   */
  private drawAtmosphere(): void {
    if (!this.atmosphereGradient) return;
    this.ctx.fillStyle = this.atmosphereGradient;
    this.ctx.fillRect(0, this.cssHeight * 0.42, this.cssWidth, this.cssHeight * 0.58);
  }

  private drawStars(timestamp: number, scrollY: number): void {
    for (const star of this.stars) {
      // Apply per-star parallax — deeper stars (smaller factor) drift less
      const drawnY = star.y - scrollY * star.parallaxFactor;
      // Skip stars that have drifted entirely off-screen
      if (drawnY < -star.radius || drawnY > this.cssHeight + star.radius) continue;

      // Stronger base brightness (0.5–1.0 range vs previous 0.4–1.0)
      const twinkle = 0.5 + 0.5 * Math.sin(star.twinklePhase + timestamp * star.twinkleSpeed);
      const alpha = twinkle * star.opacity;

      // Draw the star circle
      this.ctx.beginPath();
      this.ctx.arc(star.x, drawnY, star.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(220, 235, 255, ${alpha.toFixed(3)})`;
      this.ctx.fill();

      // Larger stars get subtle cross-sparkle arms for that pixel-art celestial look
      if (star.radius > 1.8) {
        const arm = star.radius * 2.5;
        this.ctx.strokeStyle = `rgba(185, 220, 255, ${(alpha * 0.4).toFixed(3)})`;
        this.ctx.lineWidth = 0.5;
        this.ctx.beginPath();
        this.ctx.moveTo(star.x - arm, drawnY);
        this.ctx.lineTo(star.x + arm, drawnY);
        this.ctx.moveTo(star.x, drawnY - arm);
        this.ctx.lineTo(star.x, drawnY + arm);
        this.ctx.stroke();
      }
    }
  }

  /**
   * Subtle horizontal neon bloom drawn atop the mountain silhouettes to
   * simulate atmospheric light scatter along the ridge line.
   */
  private drawHorizonGlow(): void {
    if (!this.horizonGradient) return;
    const bandTop = this.cssHeight * 0.2;
    const bandBot = this.cssHeight * 1.0;
    this.ctx.fillStyle = this.horizonGradient;
    this.ctx.fillRect(0, bandTop, this.cssWidth, bandBot - bandTop);
  }

  /** Build size-dependent gradients once instead of allocating them every frame. */
  private buildGradients(): void {
    if (this.cssWidth === 0 || this.cssHeight === 0) return;

    const atmosphere = this.ctx.createLinearGradient(
      0,
      this.cssHeight * 0.42,
      0,
      this.cssHeight,
    );
    atmosphere.addColorStop(0, 'rgba(56, 189, 248, 0)');
    atmosphere.addColorStop(0.35, 'rgba(56, 189, 248, 0.04)');
    atmosphere.addColorStop(0.65, 'rgba(99, 102, 241, 0.035)');
    atmosphere.addColorStop(1, 'rgba(99, 102, 241, 0)');
    this.atmosphereGradient = atmosphere;

    const bandTop = this.cssHeight * 0.2;
    const bandBot = this.cssHeight;
    const horizon = this.ctx.createLinearGradient(0, bandTop, 0, bandBot);
    horizon.addColorStop(0, 'rgba(56, 189, 248, 0.00)');
    horizon.addColorStop(0.35, 'rgba(56, 189, 248, 0.1)');
    horizon.addColorStop(0.65, 'rgba(168, 85, 247, 0.075)');
    horizon.addColorStop(1, 'rgba(168, 85, 247, 0.01)');
    this.horizonGradient = horizon;
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
}

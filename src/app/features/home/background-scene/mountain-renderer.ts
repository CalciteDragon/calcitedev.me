import { MountainConfig } from './mountain.config';

export class MountainRenderer {
  private ctx: CanvasRenderingContext2D;
  private W = 0;
  private H = 0;
  private config!: MountainConfig;

  private COLS = 0;
  private ROWS = 0;
  private grid: number[][] = [];
  private rawH: number[][] = [];

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  setConfig(config: MountainConfig): void {
    const needsRebuild =
      !this.config ||
      config.peakSeparation !== this.config.peakSeparation ||
      config.terrainNoise !== this.config.terrainNoise ||
      config.gridResolution !== this.config.gridResolution ||
      config.horizontalWidth !== this.config.horizontalWidth;

    this.config = { ...config };

    if (needsRebuild) {
      this.buildGrid();
    }
  }

  resize(width: number, height: number): void {
    this.W = this.canvas.width = width;
    this.H = this.canvas.height = height;
  }

  draw(): void {
    if (!this.config || this.W === 0) return;
    const { ctx, W, H } = this;

    ctx.clearRect(0, 0, W, H);

    // Project grid points
    const xHalf = this.config.horizontalWidth;
    const pts: ({ x: number; y: number; d: number } | null)[][] = [];
    for (let r = 0; r <= this.ROWS; r++) {
      pts[r] = [];
      for (let c = 0; c <= this.COLS; c++) {
        const wx = (c / this.COLS) * xHalf * 2 - xHalf;
        const wy = this.grid[r][c];
        const wz = (r / this.ROWS) * 6.5 + 0.1;
        pts[r][c] = this.project(wx, wy, wz);
      }
    }

    // Draw back to front
    for (let r = this.ROWS - 1; r >= 0; r--) {
      const depth = (r / this.ROWS) * 6.5 + 0.1;
      const depthT = this.clamp(depth / 6.5, 0, 1);
      const fogA = this.clamp((depthT - 0.3) / 0.7 * this.config.fogIntensity, 0, 0.98);

      // Fill pass
      for (let c = 0; c < this.COLS; c++) {
        const p00 = pts[r][c], p01 = pts[r][c + 1];
        const p10 = pts[r + 1][c], p11 = pts[r + 1][c + 1];
        if (!p00 || !p01 || !p10 || !p11) continue;

        const cx01 = c / this.COLS;
        const avgH = (this.grid[r][c] + this.grid[r][c + 1] + this.grid[r + 1][c] + this.grid[r + 1][c + 1]) * 0.25;

        ctx.beginPath();
        ctx.moveTo(p00.x, p00.y); ctx.lineTo(p01.x, p01.y);
        ctx.lineTo(p11.x, p11.y); ctx.lineTo(p10.x, p10.y);
        ctx.closePath();
        ctx.fillStyle = this.faceColor(depth, avgH, cx01);
        ctx.globalAlpha = 1;
        ctx.fill();

        if (fogA > 0.01) {
          ctx.beginPath();
          ctx.moveTo(p00.x, p00.y); ctx.lineTo(p01.x, p01.y);
          ctx.lineTo(p11.x, p11.y); ctx.lineTo(p10.x, p10.y);
          ctx.closePath();
          ctx.fillStyle = 'rgba(4,6,16,1)';
          ctx.globalAlpha = fogA * 0.88;
          ctx.fill();
        }
      }

      // Wire pass — horizontal
      for (let c = 0; c < this.COLS; c++) {
        const p0 = pts[r][c], p1 = pts[r][c + 1];
        if (!p0 || !p1) continue;
        const h = (this.grid[r][c] + this.grid[r][c + 1]) * 0.5;
        const hf = this.clamp(h / 2.5, 0, 1);
        const cx01 = (c + 0.5) / this.COLS;
        const alpha = this.clamp((0.7 + hf * 0.3) * (1 - fogA * 0.9), 0, 1);
        this.glowLine(p0.x, p0.y, p1.x, p1.y,
          this.wireColor(depth, h, cx01, alpha),
          `rgba(0,255,190,${((0.04 + hf * 0.05) * (1 - fogA)).toFixed(3)})`,
          0.6 + hf * 0.6);
      }

      // Wire pass — vertical
      for (let c = 0; c <= this.COLS; c++) {
        const p0 = pts[r][c], p1 = pts[r + 1][c];
        if (!p0 || !p1) continue;
        const h = (this.grid[r][c] + this.grid[r + 1][c]) * 0.5;
        const hf = this.clamp(h / 2.5, 0, 1);
        const cx01 = c / this.COLS;
        const alpha = this.clamp((0.45 + hf * 0.3) * (1 - fogA * 0.9), 0, 1);
        this.glowLine(p0.x, p0.y, p1.x, p1.y,
          this.wireColor(depth, h, cx01, alpha),
          `rgba(0,255,190,${((0.02 + hf * 0.03) * (1 - fogA)).toFixed(3)})`,
          0.45);
      }
    }

    // Foreground atmosphere — rendered in front of all mountain geometry
    this.drawForegroundAtmosphere();

    // Scanlines
    for (let y = 0; y < H; y += 4) {
      ctx.fillStyle = 'rgba(0,0,0,0.03)';
      ctx.globalAlpha = 1;
      ctx.fillRect(0, y, W, 1);
    }
    ctx.globalAlpha = 1;
  }

  // ─── Grid ──────────────────────────────────────────────────────────────────

  private buildGrid(): void {
    this.COLS = Math.round(this.config.gridResolution * 1.3);
    this.ROWS = Math.round(this.config.gridResolution);
    const xHalf = this.config.horizontalWidth;

    // Raw heights (no valley mask) for valley center calculation
    this.rawH = [];
    for (let r = 0; r <= this.ROWS; r++) {
      this.rawH[r] = [];
      for (let c = 0; c <= this.COLS; c++) {
        const wx = (c / this.COLS) * xHalf * 2 - xHalf;
        const wz = (r / this.ROWS) * 6;
        let h = this.fbm(wx + 3.7, wz + 1.2, 5);
        h = Math.pow(Math.max(0, h - 0.14), 1.15) * 3.2;
        this.rawH[r][c] = h;
      }
    }

    this.grid = [];
    for (let r = 0; r <= this.ROWS; r++) {
      this.grid[r] = [];
      const rn = r / this.ROWS;
      const vc = this.valleyCenter(rn, r);

      for (let c = 0; c <= this.COLS; c++) {
        const t = c / this.COLS;
        const wx = t * xHalf * 2 - xHalf;
        const wz = rn * 6;

        const nx01 = t * 2 - 1;
        const nxCentered = nx01 - vc;
        const distFromMid = Math.abs(nxCentered) / Math.max(this.config.peakSeparation, 0.05);
        const rawValleyDip = Math.pow(Math.min(distFromMid, 1.5), 0.7);
        const absNx = Math.abs(nxCentered);
        const outerEdge = this.config.peakSeparation + 0.5;
        const wallBoost = absNx > outerEdge
          ? 1.0 + Math.pow((absNx - outerEdge) / 0.5, 1.3) * 0.7
          : 1.0;
        const wallNoise = 0.12 * this.smoothNoise(c * 0.3 + rn * 4, r * 0.25 + 2.2);
        const mask = rawValleyDip * wallBoost + wallNoise * Math.min(absNx, 1.0);

        let h = this.fbm(wx + 3.7, wz + 1.2, 5);
        h = Math.pow(Math.max(0, h - 0.14), 1.15) * 3.2;
        this.grid[r][c] = Math.max(0, h * mask);
      }
    }
  }

  private valleyCenter(rn: number, r: number): number {
    let sumL = 0, sumR = 0;
    const n = Math.round(this.COLS / 2);
    for (let c = 0; c < n; c++) sumL += this.rawH[Math.min(r, this.ROWS)][c];
    for (let c = n; c <= this.COLS; c++) sumR += this.rawH[Math.min(r, this.ROWS)][c];
    const imbalance = (sumR - sumL) / (sumL + sumR + 0.001);
    return imbalance * 0.55 * rn + 0.18 * Math.sin(rn * Math.PI * 1.7 + 1.1) * rn;
  }

  // ─── Projection ────────────────────────────────────────────────────────────

  private project(wx: number, wy: number, wz: number) {
    const { zoom, verticalStretch, tilt, camY } = this.config;
    const eyeY = 1.1 - camY * 0.42;
    const eyeZ = 0.8;
    const dz = wz - eyeZ;
    if (dz <= 0.02) return null;
    const scale = zoom / dz;
    const tiltShift = tilt * dz;
    const sx = this.W / 2 + wx * scale * this.W * 0.56;
    const sy = this.H / 2 - (wy * verticalStretch - eyeY + tiltShift) * scale * this.H * 0.56;
    return { x: sx, y: sy, d: dz };
  }

  // ─── Colors ────────────────────────────────────────────────────────────────

  private wireColor(depth: number, height: number, cx01: number, alpha: number): string {
    const depthT = this.clamp(depth / 6.5, 0, 1);
    const heightT = this.clamp(height / 2.5, 0, 1) * this.config.colorGradient;
    const sideT = this.clamp(cx01, 0, 1) * this.config.colorGradient;
    const r = this.clamp(Math.round(this.lerp(this.lerp(0, 120, sideT * 0.6), this.lerp(60, 160, sideT), depthT) * this.lerp(1, 1.4, heightT)), 0, 255);
    const g = this.clamp(Math.round(this.lerp(this.lerp(215, 180, sideT * 0.4), this.lerp(50, 80, sideT * 0.5), depthT) * this.lerp(1, 1.15, heightT)), 0, 255);
    const b = this.clamp(Math.round(this.lerp(this.lerp(175, 220, this.clamp(heightT * 0.5 + sideT * 0.3, 0, 1)), this.lerp(200, 230, this.clamp(heightT, 0, 1)), depthT)), 0, 255);
    const a = alpha * this.clamp(1 - depthT * 0.78, 0, 1);
    return `rgba(${r},${g},${b},${a.toFixed(2)})`;
  }

  private faceColor(depth: number, height: number, cx01: number): string {
    const depthT = this.clamp(depth / 6.5, 0, 1);
    const heightT = this.clamp(height / 2.5, 0, 1);
    const sideT = this.clamp(cx01, 0, 1);
    const r = Math.round(this.lerp(4 + heightT * 6 + sideT * 8, 12, depthT));
    const g = Math.round(this.lerp(10 + heightT * 8, 14, depthT));
    const b = Math.round(this.lerp(18 + heightT * 10 + sideT * 5, 24, depthT));
    return `rgb(${r},${g},${b})`;
  }

  // ─── Atmosphere ────────────────────────────────────────────────────────────

  /**
   * Foreground haze pooling at ground level — a rising mist plus a centered
   * radial bloom, matching the horizon palette (cyan → indigo → purple).
   */
  private drawForegroundAtmosphere(): void {
    const { ctx, W, H } = this;
    ctx.globalAlpha = 1;

    // Rising ground mist — pools at the bottom, fades up toward mid-screen
    const mist = ctx.createLinearGradient(0, H * 0.5, 0, H);
    mist.addColorStop(0,    'rgba(56, 189, 248, 0)');
    mist.addColorStop(0.45, 'rgba(99, 102, 241, 0.06)');
    mist.addColorStop(0.8,  'rgba(168, 85, 247, 0.10)');
    mist.addColorStop(1,    'rgba(168, 85, 247, 0.15)');
    ctx.fillStyle = mist;
    ctx.fillRect(0, 0, W, H);

    // Centered radial bloom anchored just below the canvas bottom
    const bloom = ctx.createRadialGradient(W * 0.5, H * 1.1, 0, W * 0.5, H * 1.1, W * 0.55);
    bloom.addColorStop(0,   'rgba(56, 189, 248, 0.10)');
    bloom.addColorStop(0.4, 'rgba(99, 102, 241, 0.07)');
    bloom.addColorStop(1,   'rgba(99, 102, 241, 0)');
    ctx.fillStyle = bloom;
    ctx.fillRect(0, 0, W, H);
  }

  // ─── Drawing ───────────────────────────────────────────────────────────────

  private glowLine(x0: number, y0: number, x1: number, y1: number, color: string, gcolor: string, w: number): void {
    const { ctx } = this;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
    ctx.strokeStyle = gcolor; ctx.lineWidth = w + 2.5; ctx.globalAlpha = 0.07; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.globalAlpha = 1; ctx.stroke();
  }

  // ─── Noise ─────────────────────────────────────────────────────────────────

  private smoothNoise(x: number, z: number): number {
    const ix = Math.floor(x), iz = Math.floor(z);
    const fx = x - ix, fz = z - iz;
    const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
    const rnd = (a: number, b: number) => ((Math.sin(a * 127.1 + b * 311.7) * 43758.5453) % 1 + 1) % 1;
    const v00 = rnd(ix, iz), v10 = rnd(ix + 1, iz), v01 = rnd(ix, iz + 1), v11 = rnd(ix + 1, iz + 1);
    return v00 * (1 - ux) * (1 - uz) + v10 * ux * (1 - uz) + v01 * (1 - ux) * uz + v11 * ux * uz;
  }

  private fbm(x: number, z: number, oct: number): number {
    let v = 0, max = 0;
    const amps = [0.55, 0.28, 0.13, 0.06, 0.03];
    const freqs = [1, 2.1, 4.3, 8.7, 17.4];
    for (let i = 0; i < oct; i++) {
      v += this.smoothNoise(x * freqs[i] * this.config.terrainNoise, z * freqs[i] * this.config.terrainNoise) * amps[i];
      max += amps[i];
    }
    return v / max;
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private lerp(a: number, b: number, t: number): number { return a + t * (b - a); }
  private clamp(v: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, v)); }
}

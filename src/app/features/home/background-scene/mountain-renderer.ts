import { MountainConfig } from './mountain.config';

export class MountainRenderer {
  private ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  private W = 0;
  private H = 0;
  private config!: MountainConfig;

  private COLS = 0;
  private ROWS = 0;
  private grid: number[][] = [];
  private rawH: number[][] = [];

  // ─── Phase 1: Static color + fog caches ────────────────────────────────────
  private fogAlphas!:   Float32Array;   // ROWS — depth fog alpha per row
  private faceColors!:  string[][];     // [ROWS][COLS]
  private wireColorsH!: string[][];     // [ROWS][COLS]   — horizontal wire primary color
  private wireColorsV!: string[][];     // [ROWS][COLS+1] — vertical wire primary color
  private glowColorsH!: string[][];     // [ROWS][COLS]   — horizontal wire glow color
  private glowColorsV!: string[][];     // [ROWS][COLS+1] — vertical wire glow color
  private lineWidthsH!: Float32Array;   // ROWS × COLS

  // ─── Phase 1: Gradient cache ────────────────────────────────────────────────
  private mistGradient:  CanvasGradient | null = null;
  private bloomGradient: CanvasGradient | null = null;

  // ─── Phase 2: Projection caches ─────────────────────────────────────────────
  private ptsX!:     Float32Array;  // (ROWS+1)×(COLS+1) — screen X, static
  private ptsY!:     Float32Array;  // (ROWS+1)×(COLS+1) — screen Y, updated per frame
  private ptsYBase!: Float32Array;  // (ROWS+1)×(COLS+1) — Y without eyeY contribution
  private ptsScale!: Float32Array;  // (ROWS+1)×(COLS+1) — eyeY scale factor per point
  private ptsNull!:  Uint8Array;    // (ROWS+1)×(COLS+1) — 1 = behind camera
  private ptsDirty = true;

  constructor(private canvas: HTMLCanvasElement | OffscreenCanvas) {
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /** Direct camY setter — skips grid/color/projection rebuilds (camY is pure view state). */
  setCamY(v: number): void {
    this.config.camY = v;
  }

  setConfig(config: MountainConfig): void {
    const needsRebuild =
      !this.config ||
      config.peakSeparation  !== this.config.peakSeparation ||
      config.terrainNoise    !== this.config.terrainNoise ||
      config.gridResolution  !== this.config.gridResolution ||
      config.horizontalWidth !== this.config.horizontalWidth;

    const needsColorRebuild =
      needsRebuild ||
      !this.config ||
      config.fogIntensity  !== this.config.fogIntensity ||
      config.colorGradient !== this.config.colorGradient;

    const needsProjectionRebuild =
      needsRebuild ||
      !this.config ||
      config.zoom            !== this.config.zoom ||
      config.tilt            !== this.config.tilt ||
      config.verticalStretch !== this.config.verticalStretch;

    this.config = { ...config };

    if (needsRebuild) {
      this.buildGrid(); // calls buildColorCaches + buildProjectionCache internally
    } else {
      if (needsColorRebuild) {
        this.buildColorCaches();
      }
      if (needsProjectionRebuild) {
        this.buildProjectionCache();
      }
    }
  }

  resize(width: number, height: number): void {
    this.W = this.canvas.width = width;
    this.H = this.canvas.height = height;
    this.buildGradients();
    this.buildProjectionCache();
  }

  draw(): void {
    if (!this.config || this.W === 0 || this.ptsDirty) return;
    const { ctx, W, H } = this;

    // One scalar per frame — the only camY-dependent computation
    const eyeY = 1.1 - this.config.camY * 0.42;

    // Update all screen Y coords: ~3k multiply-adds on pre-cached Float32Arrays (no divisions)
    const total = (this.ROWS + 1) * (this.COLS + 1);
    for (let i = 0; i < total; i++) {
      if (!this.ptsNull[i]) {
        this.ptsY[i] = this.ptsYBase[i] + eyeY * this.ptsScale[i];
      }
    }

    ctx.clearRect(0, 0, W, H);

    // Draw back to front
    for (let r = this.ROWS - 1; r >= 0; r--) {
      // Fill pass
      for (let c = 0; c < this.COLS; c++) {
        const i00 =  r      * (this.COLS + 1) + c;
        const i01 =  r      * (this.COLS + 1) + c + 1;
        const i10 = (r + 1) * (this.COLS + 1) + c;
        const i11 = (r + 1) * (this.COLS + 1) + c + 1;
        if (this.ptsNull[i00] || this.ptsNull[i01] || this.ptsNull[i10] || this.ptsNull[i11]) continue;

        const x00 = this.ptsX[i00], y00 = this.ptsY[i00];
        const x01 = this.ptsX[i01], y01 = this.ptsY[i01];
        const x10 = this.ptsX[i10], y10 = this.ptsY[i10];
        const x11 = this.ptsX[i11], y11 = this.ptsY[i11];

        ctx.beginPath();
        ctx.moveTo(x00, y00); ctx.lineTo(x01, y01);
        ctx.lineTo(x11, y11); ctx.lineTo(x10, y10);
        ctx.closePath();
        ctx.fillStyle = this.faceColors[r][c];
        ctx.globalAlpha = 1;
        ctx.fill();
      }

      // Wire pass — horizontal
      for (let c = 0; c < this.COLS; c++) {
        const i0 = r * (this.COLS + 1) + c;
        const i1 = r * (this.COLS + 1) + c + 1;
        if (this.ptsNull[i0] || this.ptsNull[i1]) continue;
        this.glowLine(
          this.ptsX[i0], this.ptsY[i0],
          this.ptsX[i1], this.ptsY[i1],
          this.wireColorsH[r][c],
          this.glowColorsH[r][c],
          this.lineWidthsH[r * this.COLS + c],
        );
      }

      // Wire pass — vertical
      for (let c = 0; c <= this.COLS; c++) {
        const i0 =  r      * (this.COLS + 1) + c;
        const i1 = (r + 1) * (this.COLS + 1) + c;
        if (this.ptsNull[i0] || this.ptsNull[i1]) continue;
        this.glowLine(
          this.ptsX[i0], this.ptsY[i0],
          this.ptsX[i1], this.ptsY[i1],
          this.wireColorsV[r][c],
          this.glowColorsV[r][c],
          0.45,
        );
      }
    }

    this.drawForegroundAtmosphere();
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

    this.buildColorCaches();
    this.buildProjectionCache();
  }

  private valleyCenter(rn: number, r: number): number {
    let sumL = 0, sumR = 0;
    const n = Math.round(this.COLS / 2);
    for (let c = 0; c < n; c++) sumL += this.rawH[Math.min(r, this.ROWS)][c];
    for (let c = n; c <= this.COLS; c++) sumR += this.rawH[Math.min(r, this.ROWS)][c];
    const imbalance = (sumR - sumL) / (sumL + sumR + 0.001);
    return imbalance * 0.55 * rn + 0.18 * Math.sin(rn * Math.PI * 1.7 + 1.1) * rn;
  }

  // ─── Cache builders ─────────────────────────────────────────────────────────

  private buildColorCaches(): void {
    const { ROWS, COLS } = this;

    this.fogAlphas   = new Float32Array(ROWS);
    this.faceColors  = Array.from({ length: ROWS }, () => new Array<string>(COLS));
    this.wireColorsH = Array.from({ length: ROWS }, () => new Array<string>(COLS));
    this.wireColorsV = Array.from({ length: ROWS }, () => new Array<string>(COLS + 1));
    this.glowColorsH = Array.from({ length: ROWS }, () => new Array<string>(COLS));
    this.glowColorsV = Array.from({ length: ROWS }, () => new Array<string>(COLS + 1));
    this.lineWidthsH = new Float32Array(ROWS * COLS);

    for (let r = 0; r < ROWS; r++) {
      const depth  = (r / ROWS) * 6.5 + 0.1;
      const depthT = this.clamp(depth / 6.5, 0, 1);
      const fogA   = this.clamp((depthT - 0.3) / 0.7 * this.config.fogIntensity, 0, 0.98);
      this.fogAlphas[r] = fogA;

      // Face colors (one per quad)
      for (let c = 0; c < COLS; c++) {
        const avgH = (
          this.grid[r][c] + this.grid[r][c + 1] +
          this.grid[r + 1][c] + this.grid[r + 1][c + 1]
        ) * 0.25;
        this.faceColors[r][c] = this.faceColor(depth, avgH, c / COLS, fogA);
      }

      // Horizontal wire colors (front edge of each row quad)
      for (let c = 0; c < COLS; c++) {
        const h    = (this.grid[r][c] + this.grid[r][c + 1]) * 0.5;
        const hf   = this.clamp(h / 2.5, 0, 1);
        const cx01 = (c + 0.5) / COLS;
        const alpha = this.clamp((0.7 + hf * 0.3) * (1 - fogA * 0.9), 0, 1);
        this.wireColorsH[r][c] = this.wireColor(depth, h, cx01, alpha);
        this.glowColorsH[r][c] = `rgba(0,255,190,${((0.04 + hf * 0.05) * (1 - fogA)).toFixed(3)})`;
        this.lineWidthsH[r * COLS + c] = 0.6 + hf * 0.6;
      }

      // Vertical wire colors (left/right edges of each quad column)
      for (let c = 0; c <= COLS; c++) {
        const h    = (this.grid[r][c] + this.grid[r + 1][c]) * 0.5;
        const hf   = this.clamp(h / 2.5, 0, 1);
        const alpha = this.clamp((0.45 + hf * 0.3) * (1 - fogA * 0.9), 0, 1);
        this.wireColorsV[r][c] = this.wireColor(depth, h, c / COLS, alpha);
        this.glowColorsV[r][c] = `rgba(0,255,190,${((0.02 + hf * 0.03) * (1 - fogA)).toFixed(3)})`;
        // V-wire lineWidth is constant 0.45 — no array needed; written as literal in draw()
      }
    }
  }

  private buildGradients(): void {
    const { ctx, W, H } = this;
    if (W === 0 || H === 0) return;

    const mist = ctx.createLinearGradient(0, H * 0.5, 0, H);
    mist.addColorStop(0,    'rgba(56, 189, 248, 0)');
    mist.addColorStop(0.45, 'rgba(99, 102, 241, 0.06)');
    mist.addColorStop(0.8,  'rgba(168, 85, 247, 0.10)');
    mist.addColorStop(1,    'rgba(168, 85, 247, 0.15)');
    this.mistGradient = mist;

    const bloom = ctx.createRadialGradient(W * 0.5, H * 1.1, 0, W * 0.5, H * 1.1, W * 0.55);
    bloom.addColorStop(0,   'rgba(56, 189, 248, 0.10)');
    bloom.addColorStop(0.4, 'rgba(99, 102, 241, 0.07)');
    bloom.addColorStop(1,   'rgba(99, 102, 241, 0)');
    this.bloomGradient = bloom;
  }

  private buildProjectionCache(): void {
    if (this.W === 0 || this.H === 0 || !this.config || this.ROWS === 0) return;

    const total = (this.ROWS + 1) * (this.COLS + 1);
    if (!this.ptsX || this.ptsX.length !== total) {
      this.ptsX     = new Float32Array(total);
      this.ptsYBase = new Float32Array(total);
      this.ptsScale = new Float32Array(total);
      this.ptsY     = new Float32Array(total);
      this.ptsNull  = new Uint8Array(total);
    }

    const { zoom, verticalStretch: vs, tilt, horizontalWidth: xHalf } = this.config;
    const eyeZ = 0.8;
    const W056 = this.W * 0.56;
    const H056 = this.H * 0.56;

    for (let r = 0; r <= this.ROWS; r++) {
      for (let c = 0; c <= this.COLS; c++) {
        const i  = r * (this.COLS + 1) + c;
        const wx = (c / this.COLS) * xHalf * 2 - xHalf;
        const wy = this.grid[r][c];
        const wz = (r / this.ROWS) * 6.5 + 0.1;
        const dz = wz - eyeZ;

        if (dz <= 0.02) {
          this.ptsNull[i] = 1;
          continue;
        }
        this.ptsNull[i]  = 0;
        const scale      = zoom / dz;
        this.ptsX[i]     = this.W / 2 + wx * scale * W056;
        // sy = H/2 - (wy*vs - eyeY + tilt*dz) * scale * H056
        //    = (H/2 - (wy*vs + tilt*dz) * scale * H056) + eyeY * (scale * H056)
        this.ptsYBase[i] = this.H / 2 - (wy * vs + tilt * dz) * scale * H056;
        this.ptsScale[i] = scale * H056;
      }
    }

    this.ptsDirty = false;
  }

  // ─── Colors ────────────────────────────────────────────────────────────────

  private wireColor(depth: number, height: number, cx01: number, alpha: number): string {
    const depthT  = this.clamp(depth / 6.5, 0, 1);
    const heightT = this.clamp(height / 2.5, 0, 1) * this.config.colorGradient;
    const sideT   = this.clamp(cx01, 0, 1) * this.config.colorGradient;
    const r = this.clamp(Math.round(this.lerp(this.lerp(0, 120, sideT * 0.6), this.lerp(60, 160, sideT), depthT) * this.lerp(1, 1.4, heightT)), 0, 255);
    const g = this.clamp(Math.round(this.lerp(this.lerp(215, 180, sideT * 0.4), this.lerp(50, 80, sideT * 0.5), depthT) * this.lerp(1, 1.15, heightT)), 0, 255);
    const b = this.clamp(Math.round(this.lerp(this.lerp(175, 220, this.clamp(heightT * 0.5 + sideT * 0.3, 0, 1)), this.lerp(200, 230, this.clamp(heightT, 0, 1)), depthT)), 0, 255);
    const a = alpha * this.clamp(1 - depthT * 0.78, 0, 1);
    return `rgba(${r},${g},${b},${a.toFixed(2)})`;
  }

  private faceColor(depth: number, height: number, cx01: number, fogAlpha: number): string {
    const depthT  = this.clamp(depth / 6.5, 0, 1);
    const heightT = this.clamp(height / 2.5, 0, 1);
    const sideT   = this.clamp(cx01, 0, 1);
    const r = this.lerp(4 + heightT * 6 + sideT * 8, 12, depthT);
    const g = this.lerp(10 + heightT * 8, 14, depthT);
    const b = this.lerp(18 + heightT * 10 + sideT * 5, 24, depthT);
    const fog = fogAlpha > 0.01 ? fogAlpha * 0.88 : 0;
    const foggedR = Math.round(this.lerp(r, 4, fog));
    const foggedG = Math.round(this.lerp(g, 6, fog));
    const foggedB = Math.round(this.lerp(b, 16, fog));
    return `rgb(${foggedR},${foggedG},${foggedB})`;
  }

  // ─── Atmosphere ────────────────────────────────────────────────────────────

  private drawForegroundAtmosphere(): void {
    if (!this.mistGradient || !this.bloomGradient) return;
    const { ctx, W, H } = this;
    ctx.globalAlpha = 1;
    ctx.fillStyle = this.mistGradient;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = this.bloomGradient;
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
    const amps  = [0.55, 0.28, 0.13, 0.06, 0.03];
    const freqs = [1, 2.1, 4.3, 8.7, 17.4];
    for (let i = 0; i < oct; i++) {
      v   += this.smoothNoise(x * freqs[i] * this.config.terrainNoise, z * freqs[i] * this.config.terrainNoise) * amps[i];
      max += amps[i];
    }
    return v / max;
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private lerp(a: number, b: number, t: number): number { return a + t * (b - a); }
  private clamp(v: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, v)); }
}

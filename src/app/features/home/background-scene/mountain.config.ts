export interface MountainConfig {
  /** Perspective FOV multiplier. Higher = more zoomed in. Default: 1.40 */
  zoom: number;
  /** Camera angle tilt. Positive = nose down into valley, negative = nose up. Default: 0.25 */
  tilt: number;
  /** Horizontal distance between the two peak attractors in normalized space. Default: 0.50 */
  peakSeparation: number;
  /** Vertical scale multiplier applied to terrain height during projection. Default: 1.40 */
  verticalStretch: number;
  /** Frequency multiplier for fbm noise. Higher = more chaotic detail. Default: 1.00 */
  terrainNoise: number;
  /** Depth fog strength, 0 = no fog, 1 = heavy fog. Default: 0.12 */
  fogIntensity: number;
  /** Color gradient intensity for height and left/right hue shift. Default: 2.00 */
  colorGradient: number;
  /** Half-width of the terrain in world space. Higher = mountains extend further left/right. Default: 4.00 */
  horizontalWidth: number;
  /** Number of grid rows. Cols are derived as rows * 1.3. Higher = smoother, more expensive. Default: 48 */
  gridResolution: number;
  /** Vertical offset applied to camera position. Default: 3 */
  camYOffset: number;
  /** Camera vertical position offset driven by scroll. You set this externally. Default: 0 */
  camY: number;
}

export const DEFAULT_MOUNTAIN_CONFIG: MountainConfig = {
  zoom: 1.00,
  tilt: 0.25,
  peakSeparation: 0.50,
  verticalStretch: 1.40,
  terrainNoise: 1.00,
  fogIntensity: 0.12,
  colorGradient: 2.00,
  horizontalWidth: 4.00,
  gridResolution: 48,
  camYOffset: 3,
  camY: 0,
};

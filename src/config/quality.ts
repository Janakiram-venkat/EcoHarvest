export type QualityLevel = 'High' | 'Medium' | 'Low';

export interface QualitySettings {
  pixelRatioCap: number;
  shadowMapSize: number;
  ao: boolean;
  bloom: boolean;
  smaa: boolean;
  msaa: number;
  particleScale: number;
  granules: number;
}

export const QUALITY: Record<QualityLevel, QualitySettings> = {
  High: { pixelRatioCap: 2, shadowMapSize: 2048, ao: true, bloom: true, smaa: true, msaa: 4, particleScale: 1, granules: 1800 },
  Medium: { pixelRatioCap: 1.5, shadowMapSize: 1024, ao: false, bloom: true, smaa: true, msaa: 4, particleScale: 0.6, granules: 1100 },
  Low: { pixelRatioCap: 1, shadowMapSize: 512, ao: false, bloom: false, smaa: false, msaa: 0, particleScale: 0.3, granules: 600 },
};

export const MAX_GRANULES = QUALITY.High.granules;

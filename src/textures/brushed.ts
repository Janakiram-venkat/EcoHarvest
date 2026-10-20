import type * as THREE from 'three';
import { ValueNoise, fillPixels, heightField, heightToNormal, toTexture } from './noise';

/** Brushed stainless: streaks run along texture V (= vertical on every shell part). */
export function createBrushed(size = 512): { normal: THREE.CanvasTexture; roughness: THREE.CanvasTexture } {
  const n = new ValueNoise(11);
  const h = heightField(size, (u, v) => {
    const fine = n.noise(u * 512, v * 3, 512, 3);
    const mid = n.noise(u * 160, v * 2, 160, 2);
    const coarse = n.noise(u * 40, v * 1, 40, 1);
    return 0.5 * fine + 0.32 * mid + 0.18 * coarse;
  });
  const normal = toTexture(heightToNormal(h, size, 2.2), false);
  const rough = toTexture(
    fillPixels(size, (_u, _v, x, y) => {
      const r = 0.82 + 0.3 * h[y * size + x];
      return [r, Math.min(1, r), r];
    }),
    false,
  );
  return { normal, roughness: rough };
}

/** Low-frequency roughness variation ("edge wear") for satin stainless parts. */
export function createSatinWear(size = 256): THREE.CanvasTexture {
  const n = new ValueNoise(23);
  return toTexture(
    fillPixels(size, (u, v) => {
      const r = 0.78 + 0.35 * n.fbm(u, v, 6, 6, 5);
      return [r, Math.min(1, r), r];
    }),
    false,
  );
}

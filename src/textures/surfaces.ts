import type * as THREE from 'three';
import { mulberry32 } from '../utils/rand';
import { ValueNoise, fillPixels, heightField, heightToNormal, makeCanvas, toTexture } from './noise';

export interface SurfaceMaps {
  map: THREE.CanvasTexture;
  normal: THREE.CanvasTexture;
  roughness: THREE.CanvasTexture;
}

const mix = (a: number[], b: number[], t: number): [number, number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

/** Polished concrete / stone floor. Tile ≈ 1.2 m. */
export function createConcrete(size = 1024): SurfaceMaps {
  const n = new ValueNoise(5);
  const n2 = new ValueNoise(77);
  const h = heightField(size, (u, v) => n.fbm(u, v, 8, 8, 6) * 0.7 + n2.noise(u * 300, v * 300, 300, 300) * 0.3);
  const dark = [0.27, 0.25, 0.235];
  const light = [0.43, 0.41, 0.39];
  const map = fillPixels(size, (u, v, x, y) => {
    const base = n.fbm(u, v, 4, 4, 6);
    const cloud = n2.fbm(u + 0.3, v, 3, 3, 4);
    const speck = n2.noise(u * 512, v * 512, 512, 512);
    let c = mix(dark, light, base * 0.8 + cloud * 0.4 - 0.15);
    if (speck > 0.93) c = mix(c, [0.55, 0.53, 0.5], 0.6);
    if (speck < 0.05) c = mix(c, [0.16, 0.15, 0.14], 0.5);
    const hv = h[y * size + x];
    return [c[0] * (0.92 + hv * 0.12), c[1] * (0.92 + hv * 0.12), c[2] * (0.92 + hv * 0.12)];
  });
  const rough = fillPixels(size, (u, v) => {
    const r = 0.62 + 0.3 * n2.fbm(u, v, 5, 5, 4);
    return [r, r, r];
  });
  return { map: toTexture(map, true), normal: toTexture(heightToNormal(h, size, 3), false), roughness: toTexture(rough, false) };
}

/** Soft grey plaster wall. */
export function createPlaster(size = 512): SurfaceMaps {
  const n = new ValueNoise(91);
  const h = heightField(size, (u, v) => n.fbm(u, v, 16, 16, 5));
  const map = fillPixels(size, (u, v) => {
    const t = n.fbm(u, v, 3, 3, 5);
    return mix([0.46, 0.46, 0.45], [0.58, 0.58, 0.57], t);
  });
  const rough = fillPixels(size, () => [0.9, 0.9, 0.9]);
  return { map: toTexture(map, true), normal: toTexture(heightToNormal(h, size, 4), false), roughness: toTexture(rough, false) };
}

/** Dry, fine, dark-brown biomass powder. Tile ≈ 6 cm. */
export function createBiomass(size = 512): SurfaceMaps {
  const n = new ValueNoise(303);
  const rnd = mulberry32(9);
  const h = heightField(size, (u, v) => {
    const crumbs = n.noise(u * 96, v * 96, 96, 96);
    const fine = n.noise(u * 256, v * 256, 256, 256);
    return Math.pow(crumbs, 1.6) * 0.75 + fine * 0.25;
  });
  const { canvas, ctx } = makeCanvas(size);
  const img = ctx.createImageData(size, size);
  const dark = [0.13, 0.072, 0.035];
  const mid = [0.29, 0.18, 0.1];
  const fib = [0.48, 0.33, 0.2];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const hv = h[i];
      let c = mix(dark, mid, hv * 1.2);
      const s = n.noise((x / size) * 400, (y / size) * 400, 400, 400);
      if (s > 0.86) c = mix(c, fib, 0.7);
      img.data[i * 4] = c[0] * 255;
      img.data[i * 4 + 1] = c[1] * 255;
      img.data[i * 4 + 2] = c[2] * 255;
      img.data[i * 4 + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  // Fibrous flecks (dried peel / stems)
  for (let k = 0; k < 260; k++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const a = rnd() * Math.PI;
    const l = 3 + rnd() * 9;
    ctx.strokeStyle = `rgba(${130 + rnd() * 60},${85 + rnd() * 40},${45 + rnd() * 25},0.75)`;
    ctx.lineWidth = 0.8 + rnd();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    ctx.stroke();
  }
  const rough = fillPixels(size, () => [0.95, 0.95, 0.95]);
  return { map: toTexture(canvas, true), normal: toTexture(heightToNormal(h, size, 6), false), roughness: toTexture(rough, false) };
}

/** Potting soil for the plant prop. */
export function createSoil(size = 256): THREE.CanvasTexture {
  const n = new ValueNoise(404);
  return toTexture(
    fillPixels(size, (u, v) => {
      const t = n.noise(u * 64, v * 64, 64, 64) * 0.7 + n.noise(u * 200, v * 200, 200, 200) * 0.3;
      return mix([0.09, 0.06, 0.04], [0.22, 0.15, 0.1], t);
    }),
    true,
  );
}

/** Pleated activated-carbon filter media. */
export function createCarbon(size = 256): THREE.CanvasTexture {
  const n = new ValueNoise(505);
  return toTexture(
    fillPixels(size, (u, v) => {
      const t = n.noise(u * 128, v * 128, 128, 128);
      const g = 0.05 + t * 0.06;
      return [g, g, g * 1.05];
    }),
    true,
  );
}

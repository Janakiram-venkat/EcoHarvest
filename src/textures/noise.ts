import * as THREE from 'three';
import { mulberry32 } from '../utils/rand';

const mod = (a: number, n: number): number => ((a % n) + n) % n;
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Periodic 2D value noise (tileable when x/y span whole periods). */
export class ValueNoise {
  private readonly perm: Uint16Array;

  constructor(seed = 1) {
    const rnd = mulberry32(seed);
    const base = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [base[i], base[j]] = [base[j], base[i]];
    }
    this.perm = new Uint16Array(512);
    for (let i = 0; i < 512; i++) this.perm[i] = base[i & 255];
  }

  private lattice(ix: number, iy: number): number {
    return this.perm[this.perm[ix & 255] + (iy & 255)] / 255;
  }

  noise(x: number, y: number, px = 256, py = 256): number {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const xa = mod(x0, px);
    const xb = mod(x0 + 1, px);
    const ya = mod(y0, py);
    const yb = mod(y0 + 1, py);
    return lerp(
      lerp(this.lattice(xa, ya), this.lattice(xb, ya), sx),
      lerp(this.lattice(xa, yb), this.lattice(xb, yb), sx),
      sy,
    );
  }

  /** Fractal sum; u, v in [0,1) tile seamlessly with base periods px, py. */
  fbm(u: number, v: number, px: number, py: number, octaves = 5, gain = 0.5): number {
    let amp = 0.5;
    let f = 1;
    let sum = 0;
    let norm = 0;
    for (let o = 0; o < octaves; o++) {
      sum += amp * this.noise(u * px * f, v * py * f, px * f, py * f);
      norm += amp;
      amp *= gain;
      f *= 2;
    }
    return sum / norm;
  }
}

export function makeCanvas(w: number, h = w): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  return { canvas, ctx };
}

export function toTexture(canvas: HTMLCanvasElement, srgb: boolean, tile = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  if (tile) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

/** Fills a canvas from a per-pixel function returning [r,g,b] in 0..1. */
export function fillPixels(
  size: number,
  fn: (u: number, v: number, x: number, y: number) => [number, number, number],
): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(size);
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b] = fn(x / size, y / size, x, y);
      const i = (y * size + x) * 4;
      img.data[i] = r * 255;
      img.data[i + 1] = g * 255;
      img.data[i + 2] = b * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** Converts a tileable height field into a tangent-space normal map canvas. */
export function heightToNormal(h: Float32Array, size: number, strength: number): HTMLCanvasElement {
  const at = (x: number, y: number): number => h[mod(y, size) * size + mod(x, size)];
  return fillPixels(size, (_u, _v, x, y) => {
    const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
    const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
    const len = Math.hypot(dx, dy, 1);
    return [(-dx / len) * 0.5 + 0.5, (dy / len) * 0.5 + 0.5, (1 / len) * 0.5 + 0.5];
  });
}

export function heightField(size: number, fn: (u: number, v: number) => number): Float32Array {
  const h = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) h[y * size + x] = fn(x / size, y / size);
  return h;
}

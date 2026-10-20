import type * as THREE from 'three';
import { makeCanvas, toTexture } from './noise';

/**
 * Tileable alpha map of a staggered round-hole perforation (white = metal, black = hole).
 * One texture tile spans `cols` × `rows` hole pitches; `rows` must be even for staggering.
 * Returns the texture plus its physical tile size so callers can set repeat = 1 / tile (metric UVs).
 */
export function createPerforation(
  holeDiameter: number,
  pitch: number,
  cols = 4,
  rows = 4,
  px = 256,
): { texture: THREE.CanvasTexture; tileW: number; tileH: number } {
  const tileW = cols * pitch;
  const rowPitch = pitch * 0.866;
  const tileH = rows * rowPitch;
  const w = px;
  const h = Math.round((px * tileH) / tileW);
  const { canvas, ctx } = makeCanvas(w, h);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#000';
  const sx = w / tileW;
  const sy = h / tileH;
  const r = (holeDiameter / 2) * sx;
  for (let j = -1; j <= rows; j++) {
    for (let i = -1; i <= cols; i++) {
      const cx = (i + 0.5 + (j % 2 !== 0 ? 0.5 : 0)) * pitch * sx;
      const cy = (j + 0.5) * rowPitch * sy;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const texture = toTexture(canvas, false);
  texture.repeat.set(1 / tileW, 1 / tileH);
  return { texture, tileW, tileH };
}

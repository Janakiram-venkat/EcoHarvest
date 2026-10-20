import * as THREE from 'three';
import { FRONT, fracY } from '../config/dimensions';
import { mulberry32 } from '../utils/rand';
import { makeCanvas, toTexture } from './noise';

const FONT = '"Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif';

/** Text whose cap height and overall width are fitted to physical sizes. */
function fittedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  baseline: number,
  capPx: number,
  widthPx: number,
  weight: number,
  color: string,
  tracking = 0,
): void {
  const size = capPx / 0.7;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'alphabetic';
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const natural = widths.reduce((a, b) => a + b, 0) + tracking * size * (chars.length - 1);
  const sx = widthPx / natural;
  ctx.save();
  ctx.translate(cx - widthPx / 2, baseline);
  ctx.scale(sx, 1);
  let x = 0;
  chars.forEach((c, i) => {
    ctx.fillText(c, x, 0);
    x += widths[i] + tracking * size;
  });
  ctx.restore();
}

function leaf(ctx: CanvasRenderingContext2D, x: number, y: number, len: number, wid: number, angle: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const g = ctx.createLinearGradient(-wid, 0, wid, -len);
  g.addColorStop(0, '#24572a');
  g.addColorStop(1, '#3d8a3a');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(wid * 1.15, -len * 0.25, wid * 0.85, -len * 0.8, 0, -len);
  ctx.bezierCurveTo(-wid * 0.85, -len * 0.8, -wid * 1.15, -len * 0.25, 0, 0);
  ctx.fill();
  ctx.strokeStyle = 'rgba(190,230,170,0.55)';
  ctx.lineWidth = len * 0.035;
  ctx.beginPath();
  ctx.moveTo(0, -len * 0.05);
  ctx.quadraticCurveTo(wid * 0.08, -len * 0.5, 0, -len * 0.9);
  ctx.stroke();
  ctx.restore();
}

/** Front-panel branding: two-leaf logo, "EcoHarvest" wordmark, tracked tagline. */
export function createBranding(): { texture: THREE.CanvasTexture; width: number; height: number; centerY: number } {
  const top = fracY(FRONT.decalTopFrac);
  const bottom = fracY(FRONT.decalBottomFrac);
  const width = FRONT.decalWidth;
  const height = top - bottom;
  const pxPerM = 10240;
  const W = Math.round(width * pxPerM);
  const H = Math.round(height * pxPerM);
  const { canvas, ctx } = makeCanvas(W, H);
  const y = (worldY: number): number => (top - worldY) * pxPerM;

  const logoY = y(fracY(FRONT.logoFrac));
  const s = FRONT.logoSize * pxPerM;
  leaf(ctx, W / 2 - s * 0.02, logoY + s * 0.48, s * 0.95, s * 0.36, 0.5);
  leaf(ctx, W / 2 - s * 0.06, logoY + s * 0.5, s * 0.7, s * 0.27, -0.62);
  ctx.strokeStyle = '#24572a';
  ctx.lineWidth = s * 0.06;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(W / 2 - s * 0.04, logoY + s * 0.5);
  ctx.quadraticCurveTo(W / 2 - s * 0.05, logoY + s * 0.58, W / 2 - s * 0.12, logoY + s * 0.62);
  ctx.stroke();

  fittedText(
    ctx,
    'EcoHarvest',
    W / 2,
    y(fracY(FRONT.wordmarkFrac)),
    FRONT.wordmarkCap * pxPerM,
    FRONT.wordmarkWidth * pxPerM,
    500,
    '#2b2e31',
    0.005,
  );
  fittedText(
    ctx,
    'INTELLIGENT BIO-WASTE PROCESSING',
    W / 2,
    y(fracY(FRONT.taglineFrac)),
    FRONT.taglineCap * pxPerM,
    FRONT.taglineWidth * pxPerM,
    500,
    '#55595d',
    0.12,
  );
  const texture = toTexture(canvas, true, false);
  return { texture, width, height, centerY: (top + bottom) / 2 };
}

export type IconKind = 'power' | 'wifi' | 'gear';

export function createButtonIcon(kind: IconKind): THREE.CanvasTexture {
  const S = 256;
  const { canvas, ctx } = makeCanvas(S);
  ctx.strokeStyle = '#f4f6f5';
  ctx.fillStyle = '#f4f6f5';
  ctx.lineWidth = 17;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const c = S / 2;
  if (kind === 'power') {
    ctx.beginPath();
    ctx.arc(c, c + 8, 72, -Math.PI / 2 + 0.75, -Math.PI / 2 - 0.75 + Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(c, 30);
    ctx.lineTo(c, 120);
    ctx.stroke();
  } else if (kind === 'wifi') {
    const cy = 200;
    for (const r of [44, 92, 140]) {
      ctx.beginPath();
      ctx.arc(c, cy, r, Math.PI * 1.25, Math.PI * 1.75);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(c, cy, 13, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const teeth = 8;
    ctx.lineWidth = 13;
    ctx.beginPath();
    for (let i = 0; i < teeth * 4; i++) {
      const a = (i / (teeth * 4)) * Math.PI * 2;
      const r = i % 4 === 0 || i % 4 === 1 ? 96 : 74;
      const x = c + Math.cos(a) * r;
      const y = c + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(c, c, 30, 0, Math.PI * 2);
    ctx.stroke();
  }
  return toTexture(canvas, true, false);
}

export function createRatingLabel(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(640, 376);
  const g = ctx.createLinearGradient(0, 0, 640, 376);
  g.addColorStop(0, '#e4e6e7');
  g.addColorStop(1, '#c9cccd');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 640, 376);
  ctx.strokeStyle = '#3a3d40';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 620, 356);
  ctx.fillStyle = '#1d1f21';
  ctx.font = `700 46px ${FONT}`;
  ctx.fillText('EcoHarvest', 34, 70);
  ctx.font = `500 26px ${FONT}`;
  const lines = [
    'Bio-Waste Processing System',
    'Model: EH-1   Capacity: 2 kg',
    '220–240 V ~ 50/60 Hz   500 W',
    'Wi-Fi 2.4 GHz   IP20',
  ];
  lines.forEach((l, i) => ctx.fillText(l, 34, 118 + i * 40));
  const rnd = mulberry32(3);
  let x = 34;
  while (x < 330) {
    const w = 2 + Math.floor(rnd() * 5);
    ctx.fillRect(x, 290, w, 54);
    x += w + 2 + Math.floor(rnd() * 4);
  }
  ctx.font = `500 20px ${FONT}`;
  ctx.fillText('S/N EH1-2611-000428', 360, 335);
  return toTexture(canvas, true, false);
}

export function createSoftShadow(): THREE.CanvasTexture {
  const S = 256;
  const { canvas, ctx } = makeCanvas(S);
  ctx.filter = 'blur(22px)';
  ctx.fillStyle = 'rgba(0,0,0,1)';
  const m = 52;
  ctx.beginPath();
  ctx.roundRect(m, m, S - 2 * m, S - 2 * m, 30);
  ctx.fill();
  return toTexture(canvas, false, false);
}

export function createSprite(): THREE.CanvasTexture {
  const S = 128;
  const { canvas, ctx } = makeCanvas(S);
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.7, 'rgba(255,255,255,0.15)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return toTexture(canvas, false, false);
}

/** Radial coverage profile of a spinning star blade (motion-blur disc). */
export function createBladeBlur(): THREE.CanvasTexture {
  const S = 256;
  const { canvas, ctx } = makeCanvas(S);
  const c = S / 2;
  const g = ctx.createRadialGradient(c, c, 0, c, c, c);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.42, 'rgba(255,255,255,0.8)');
  g.addColorStop(0.75, 'rgba(255,255,255,0.4)');
  g.addColorStop(0.95, 'rgba(255,255,255,0.12)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const rnd = mulberry32(17);
  for (let i = 0; i < 40; i++) {
    ctx.strokeStyle = `rgba(${rnd() > 0.5 ? 255 : 80},${rnd() > 0.5 ? 255 : 80},255,${rnd() * 0.12})`;
    ctx.lineWidth = 1 + rnd() * 2;
    ctx.beginPath();
    ctx.arc(c, c, c * (0.3 + rnd() * 0.68), 0, Math.PI * 2);
    ctx.stroke();
  }
  return toTexture(canvas, false, false);
}

export function createPcb(): THREE.CanvasTexture {
  const W = 600;
  const H = 500;
  const { canvas, ctx } = makeCanvas(W, H);
  ctx.fillStyle = '#17553a';
  ctx.fillRect(0, 0, W, H);
  const rnd = mulberry32(42);
  ctx.strokeStyle = 'rgba(120,200,140,0.45)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 70; i++) {
    let x = rnd() * W;
    let y = rnd() * H;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let k = 0; k < 3; k++) {
      const horiz = rnd() > 0.5;
      const d = (rnd() - 0.5) * 220;
      x += horiz ? d : d * 0.3;
      y += horiz ? d * 0.3 : d;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.fillStyle = '#c9a65a';
  for (let i = 0; i < 160; i++) {
    ctx.beginPath();
    ctx.arc(rnd() * W, rnd() * H, 3 + rnd() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#e8efe9';
  ctx.font = `600 22px ${FONT}`;
  ctx.fillText('EH-CTRL v1.2', 20, H - 22);
  ctx.fillText('IoT / DISPLAY', W - 190, 34);
  return toTexture(canvas, true, false);
}

export function createGraduations(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(128, 512);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `600 22px ${FONT}`;
  for (let i = 1; i <= 9; i++) {
    const y = 512 - i * 50;
    const major = i % 2 === 0;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(8, y);
    ctx.lineTo(major ? 52 : 32, y);
    ctx.stroke();
    if (major) ctx.fillText(`${i * 50}`, 60, y + 8);
  }
  ctx.fillText('ml', 60, 40);
  return toTexture(canvas, true, false);
}

import * as THREE from 'three';
import { DISPLAY } from '../config/dimensions';

const FONT = '"Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif';
const GREEN = '#43c463';

export interface ScreenState {
  stage: -1 | 0 | 1 | 2;
  temp: number;
  progress: number;
  bar1: number;
  bar2: number;
  wifi: boolean;
}

/** Live touch-display UI rendered into a CanvasTexture (used as the screen's emissiveMap). */
export class ScreenUI {
  readonly texture: THREE.CanvasTexture;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly W = DISPLAY.canvasWidth;
  private readonly H = DISPLAY.canvasHeight;
  private key = '';

  constructor() {
    const c = document.createElement('canvas');
    c.width = this.W;
    c.height = this.H;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('2D canvas unavailable');
    this.ctx = ctx;
    this.texture = new THREE.CanvasTexture(c);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 8;
  }

  update(s: ScreenState): void {
    const key = `${s.stage}|${Math.round(s.temp)}|${Math.round(s.progress * 100)}|${s.bar1.toFixed(2)}|${s.bar2.toFixed(2)}|${s.wifi}`;
    if (key === this.key) return;
    this.key = key;
    this.draw(s);
    this.texture.needsUpdate = true;
  }

  private draw(s: ScreenState): void {
    const { ctx, W, H } = this;
    const bg = ctx.createLinearGradient(0, 0, W * 0.8, H);
    bg.addColorStop(0, '#1a5a63');
    bg.addColorStop(0.45, '#0f3c47');
    bg.addColorStop(1, '#082630');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W * 0.25, H * 0.15, 10, W * 0.25, H * 0.15, W * 0.7);
    glow.addColorStop(0, 'rgba(120,220,220,0.16)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Status dot + Wi-Fi glyph (top-right)
    ctx.fillStyle = s.wifi ? GREEN : '#8a9aa0';
    ctx.beginPath();
    ctx.arc(W - 52, 48, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (const r of [10, 20]) {
      ctx.beginPath();
      ctx.arc(W - 90, 60, r, Math.PI * 1.25, Math.PI * 1.75);
      ctx.stroke();
    }

    const xs = [W * 0.19, W * 0.5, W * 0.81];
    const iconY = H * 0.29;
    const labels = ['Grinding', 'Drying', 'Complete'];
    labels.forEach((label, i) => {
      const active = s.stage === i;
      const done = s.stage > i;
      const alpha = active || done || s.stage === -1 ? 1 : 0.62;
      ctx.globalAlpha = alpha;
      if (active) {
        const g = ctx.createRadialGradient(xs[i], iconY, 10, xs[i], iconY, 120);
        g.addColorStop(0, 'rgba(67,196,99,0.28)');
        g.addColorStop(1, 'rgba(67,196,99,0)');
        ctx.fillStyle = g;
        ctx.fillRect(xs[i] - 130, iconY - 130, 260, 260);
      }
      if (i === 0) this.iconBlades(xs[i], iconY);
      else if (i === 1) this.iconDrops(xs[i], iconY);
      else this.iconCheck(xs[i], iconY);
      ctx.fillStyle = '#ffffff';
      ctx.font = `${active ? 700 : 600} 50px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(label, xs[i], H * 0.47);
      ctx.globalAlpha = 1;
    });
    // Arrows
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 6;
    for (const ax of [W * 0.345, W * 0.655]) {
      ctx.beginPath();
      ctx.moveTo(ax - 18, iconY);
      ctx.lineTo(ax + 14, iconY);
      ctx.moveTo(ax + 2, iconY - 12);
      ctx.lineTo(ax + 16, iconY);
      ctx.lineTo(ax + 2, iconY + 12);
      ctx.stroke();
    }

    // Temperature + progress row
    const rowY = H * 0.7;
    this.thermometer(W * 0.085, rowY - 16);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.font = `500 44px ${FONT}`;
    ctx.fillText(`Temp: ${Math.round(s.temp)}°C`, W * 0.125, rowY);
    ctx.textAlign = 'right';
    ctx.fillText(`Progress: ${Math.round(s.progress * 100)}%`, W * 0.93, rowY);

    // Progress bars
    const barY = H * 0.82;
    ctx.fillStyle = GREEN;
    ctx.beginPath();
    ctx.arc(W * 0.075, barY, 11, 0, Math.PI * 2);
    ctx.fill();
    this.bar(W * 0.115, barY, W * 0.355, s.bar1);
    this.bar(W * 0.53, barY, W * 0.4, s.bar2);
    ctx.textAlign = 'left';
  }

  private bar(x: number, y: number, w: number, f: number): void {
    const { ctx } = this;
    const h = 20;
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.beginPath();
    ctx.roundRect(x, y - h / 2, w, h, h / 2);
    ctx.fill();
    if (f > 0.005) {
      const g = ctx.createLinearGradient(x, 0, x + w, 0);
      g.addColorStop(0, '#36b257');
      g.addColorStop(1, '#5ad67a');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(x, y - h / 2, Math.max(h, w * f), h, h / 2);
      ctx.fill();
    }
  }

  private iconBlades(x: number, y: number): void {
    const { ctx } = this;
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    for (const a of [-0.6, 0.6]) {
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0, -18, 15, 40, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(-26, 40, 13, 0, Math.PI * 2);
    ctx.arc(26, 40, 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private drop(x: number, y: number, s: number): void {
    const { ctx } = this;
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.bezierCurveTo(x + s * 0.65, y - s * 0.15, x + s * 0.7, y + s * 0.65, x, y + s * 0.7);
    ctx.bezierCurveTo(x - s * 0.7, y + s * 0.65, x - s * 0.65, y - s * 0.15, x, y - s);
    ctx.stroke();
  }

  private iconDrops(x: number, y: number): void {
    const { ctx } = this;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 7;
    this.drop(x, y - 4, 48);
    this.drop(x - 50, y + 14, 26);
    this.drop(x + 50, y + 14, 26);
    ctx.beginPath();
    ctx.arc(x, y + 14, 16, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  }

  private iconCheck(x: number, y: number): void {
    const { ctx } = this;
    ctx.fillStyle = GREEN;
    ctx.beginPath();
    ctx.arc(x, y, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 11;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 24, y + 2);
    ctx.lineTo(x - 6, y + 20);
    ctx.lineTo(x + 26, y - 16);
    ctx.stroke();
  }

  private thermometer(x: number, y: number): void {
    const { ctx } = this;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(x - 7, y - 30, 14, 40, 7);
    ctx.stroke();
    ctx.fillStyle = '#e8473a';
    ctx.beginPath();
    ctx.arc(x, y + 16, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - 3, y - 20, 6, 34);
  }
}

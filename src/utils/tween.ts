export type EaseFn = (t: number) => number;

export const ease = {
  linear: (t: number): number => t,
  inOutCubic: (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outCubic: (t: number): number => 1 - Math.pow(1 - t, 3),
  inOutSine: (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2,
};

export const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

export const smoothstep = (e0: number, e1: number, x: number): number => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

/** Fraction of [a, b] covered by x, eased. */
export const window01 = (x: number, a: number, b: number, fn: EaseFn = ease.inOutCubic): number =>
  fn(clamp01((x - a) / (b - a)));

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Frame-rate independent exponential smoothing. */
export const damp = (current: number, target: number, lambda: number, dt: number): number =>
  lerp(current, target, 1 - Math.exp(-lambda * dt));

interface Tween {
  elapsed: number;
  duration: number;
  fn: EaseFn;
  onUpdate: (t: number) => void;
  onDone?: () => void;
}

export class Tweens {
  private items: Tween[] = [];

  add(duration: number, onUpdate: (t: number) => void, fn: EaseFn = ease.inOutCubic, onDone?: () => void): void {
    this.items.push({ elapsed: 0, duration, fn, onUpdate, onDone });
  }

  clear(): void {
    this.items = [];
  }

  update(dt: number): void {
    for (const tw of this.items) {
      tw.elapsed += dt;
      tw.onUpdate(tw.fn(clamp01(tw.elapsed / tw.duration)));
    }
    const done = this.items.filter((t) => t.elapsed >= t.duration);
    this.items = this.items.filter((t) => t.elapsed < t.duration);
    done.forEach((t) => t.onDone?.());
  }
}

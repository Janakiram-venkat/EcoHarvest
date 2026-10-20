import type { ViewMode } from '../scene/camera-presets';
import { REAL_CYCLE_LABEL, type SimState } from '../sim/cycle';

const VIEWS: Array<[ViewMode, string]> = [
  ['exterior', 'Exterior'],
  ['lid', 'Lid open'],
  ['cutaway', 'Cutaway'],
  ['xray', 'X-ray'],
  ['exploded', 'Exploded'],
];

const FEATURES = [
  'Grinds organic waste',
  'Separates liquid waste',
  'Thermal drying with hot air + IR lamps',
  'Odor control with exhaust filtration',
  'IoT monitoring (Wi-Fi enabled)',
  'Touch display for easy operation',
  'Compact design for home use',
  'Produces dry biomass for use as fertilizer',
];

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text = ''): HTMLElementTagNameMap[K] => {
  const e = document.createElement(tag);
  e.className = cls;
  if (text) e.textContent = text;
  return e;
};

/** Top toolbar (view modes, play, stage) + bottom info strip mirroring the reference. */
export class Overlay {
  private readonly buttons = new Map<ViewMode, HTMLButtonElement>();
  private readonly play: HTMLButtonElement;
  private readonly stage: HTMLElement;
  private readonly bar: HTMLElement;
  private readonly temp: HTMLElement;

  constructor(handlers: { onView: (m: ViewMode) => void; onPlay: () => void; onRestart: () => void }) {
    const bar = el('header', 'toolbar');
    const brand = el('div', 'brand');
    brand.append(el('span', 'leaf'), el('b', '', 'EcoHarvest'), el('small', '', 'Intelligent Bio-Waste Processing · 3D'));
    const views = el('nav', 'views');
    for (const [m, label] of VIEWS) {
      const b = el('button', 'view', label);
      b.addEventListener('click', () => handlers.onView(m));
      this.buttons.set(m, b);
      views.appendChild(b);
    }
    const sim = el('div', 'sim');
    this.play = el('button', 'play', '▶ Run cycle');
    this.play.addEventListener('click', handlers.onPlay);
    const restart = el('button', 'restart', '↺');
    restart.title = 'Restart cycle';
    restart.addEventListener('click', handlers.onRestart);
    const status = el('div', 'status');
    this.stage = el('div', 'stage', '');
    this.temp = el('div', 'temp', '');
    const track = el('div', 'track');
    this.bar = el('div', 'fill');
    track.appendChild(this.bar);
    status.append(this.stage, this.temp, track);
    sim.append(this.play, restart, status);
    bar.append(brand, views, sim);
    document.body.appendChild(bar);

    const strip = el('footer', 'strip');
    const flow = el('div', 'flow');
    const step = (a: string, b: string): HTMLElement => {
      const s = el('div', 'step');
      s.append(el('b', '', a), el('span', '', b));
      return s;
    };
    flow.append(
      step('Input: 1–2 kg', 'Food waste'),
      el('span', 'arrow', '➜'),
      step('Processing', `(${REAL_CYCLE_LABEL})`),
      el('span', 'arrow', '➜'),
      step(`Output: 190 – 200 g`, `(Dry powder ≈ 90% reduction)`),
    );
    const feats = el('ul', 'features');
    FEATURES.forEach((f) => feats.appendChild(el('li', '', f)));
    const toggle = el('button', 'strip-toggle', 'Final Product Features');
    toggle.addEventListener('click', () => strip.classList.toggle('collapsed'));
    strip.append(toggle, flow, feats);
    strip.classList.add('collapsed');
    document.body.appendChild(strip);
  }

  setView(m: ViewMode): void {
    for (const [k, b] of this.buttons) b.classList.toggle('on', k === m);
  }

  setPlaying(p: boolean): void {
    this.play.textContent = p ? '❚❚ Pause' : '▶ Run cycle';
    this.play.classList.toggle('on', p);
  }

  setState(s: SimState): void {
    this.stage.textContent = s.stageLabel;
    this.temp.textContent = `${Math.round(s.temp)}°C · ${Math.round(s.progress * 100)}%`;
    this.bar.style.width = `${(s.progress * 100).toFixed(1)}%`;
  }
}

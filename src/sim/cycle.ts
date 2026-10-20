import { EXHAUST, GRINDER, PADDLE } from '../config/dimensions';
import { clamp01, ease, smoothstep, window01 } from '../utils/tween';

/**
 * Process cycle state machine (CLAUDE.md §8). The real 5–8 h cycle is compressed to ~62 s.
 * `evaluate(t)` is a pure function of cycle time, so the GUI stage scrubber can jump anywhere.
 */
export type StageId =
  | 'IDLE'
  | 'LID_OPEN'
  | 'LID_CLOSED'
  | 'GRINDING'
  | 'SEPARATING'
  | 'DRYING'
  | 'IR_FINISH'
  | 'DISCHARGE'
  | 'COMPLETE';

export interface StageDef {
  id: StageId;
  duration: number;
  label: string;
}

export const STAGES: StageDef[] = [
  { id: 'IDLE', duration: 2, label: 'Ready' },
  { id: 'LID_OPEN', duration: 4, label: 'Loading 1–2 kg food waste' },
  { id: 'LID_CLOSED', duration: 2, label: 'Lid closed — Start pressed' },
  { id: 'GRINDING', duration: 10, label: 'B · Grinding' },
  { id: 'SEPARATING', duration: 8, label: 'C/D · Liquid separation' },
  { id: 'DRYING', duration: 16, label: 'E · Drying (hot air + stirring)' },
  { id: 'IR_FINISH', duration: 8, label: 'F1/F2 · IR finishing' },
  { id: 'DISCHARGE', duration: 6, label: 'H · Discharge to tray' },
  { id: 'COMPLETE', duration: 6, label: 'Complete' },
];

const START: Record<StageId, number> = {} as Record<StageId, number>;
let acc = 0;
for (const s of STAGES) {
  START[s.id] = acc;
  acc += s.duration;
}
export const CYCLE_LENGTH = acc;
const DUR = Object.fromEntries(STAGES.map((s) => [s.id, s.duration])) as Record<StageId, number>;
export const PROCESS_START = START.GRINDING;
export const PROCESS_LENGTH = START.COMPLETE - START.GRINDING;
/** Matches the reference screen: Progress 65 %, Temp 72 °C. */
export const DEFAULT_TIME = PROCESS_START + 0.65 * PROCESS_LENGTH;
export const OUTPUT_GRAMS = 195;
export const REAL_CYCLE_LABEL = '5–8 h';

export interface SimState {
  t: number;
  stage: StageId;
  stageLabel: string;
  stageT: number;
  progress: number;
  temp: number;
  lid: number;
  foodLoad: number;
  foodPhase: 'loading' | 'grinding';
  bladeRpm: number;
  basketLoad: number;
  louvre: number;
  liquidLevel: number;
  dripRate: number;
  bowlLoad: number;
  dryness: number;
  paddleRpm: number;
  heater: number;
  ir: number;
  fanRpm: number;
  steam: number;
  hotAir: number;
  trayLoad: number;
  trayExt: number;
  fallGrind: number;
  fallTransfer: number;
  fallDischarge: number;
  screenStage: -1 | 0 | 1 | 2;
  bar1: number;
  bar2: number;
}

const local = (t: number, id: StageId): number => clamp01((t - START[id]) / DUR[id]);
const within = (t: number, id: StageId): boolean => t >= START[id] && t < START[id] + DUR[id];
const band = (x: number, a: number, b: number): number => smoothstep(a, a + 0.03, x) * (1 - smoothstep(b - 0.03, b, x));

export function evaluate(time: number): SimState {
  const t = Math.min(Math.max(time, 0), CYCLE_LENGTH - 1e-6);
  const stage = STAGES.find((s) => within(t, s.id)) ?? STAGES[STAGES.length - 1];
  const L = {
    LO: local(t, 'LID_OPEN'),
    LC: local(t, 'LID_CLOSED'),
    G: local(t, 'GRINDING'),
    S: local(t, 'SEPARATING'),
    D: local(t, 'DRYING'),
    I: local(t, 'IR_FINISH'),
    X: local(t, 'DISCHARGE'),
    C: local(t, 'COMPLETE'),
  };
  const inG = within(t, 'GRINDING');
  const inS = within(t, 'SEPARATING');
  const inD = within(t, 'DRYING');
  const inI = within(t, 'IR_FINISH');
  const inX = within(t, 'DISCHARGE');

  const lid = window01(L.LO, 0, 0.3) * (1 - window01(L.LC, 0, 0.6));
  const foodLoad = window01(L.LO, 0.35, 0.85, ease.linear) * (1 - window01(L.G, 0.1, 0.9, ease.linear));
  const bladeRpm = inG ? GRINDER.rpm * (window01(L.G, 0, 0.08) - window01(L.G, 0.92, 1)) : 0;

  const basketLoad =
    window01(L.G, 0.12, 1, ease.linear) * (1 - 0.15 * window01(L.S, 0.05, 0.7)) * (1 - window01(L.S, 0.78, 1, ease.linear));
  const louvre = clamp01(window01(L.S, 0.74, 0.8) - window01(L.S, 0.95, 1));
  const liquidLevel = 0.12 * window01(L.G, 0.3, 1, ease.linear) + 0.88 * window01(L.S, 0.05, 0.75, ease.inOutSine);
  const dripRate = inG ? 0.35 * band(L.G, 0.3, 1) : inS ? band(L.S, 0.05, 0.75) : 0;

  const inflow = window01(L.S, 0.8, 1, ease.linear);
  const shrink = 0.38 * window01(L.D, 0, 1, ease.linear) + 0.14 * window01(L.I, 0, 1, ease.linear);
  const bowlLoad = inflow * (1 - shrink) * (1 - window01(L.X, 0.08, 0.92, ease.linear));
  const dryness = 0.72 * window01(L.D, 0, 1, ease.inOutSine) + 0.28 * window01(L.I, 0, 1, ease.inOutSine);

  let temp = 25;
  if (t >= START.GRINDING) temp = 25 + 3 * L.G;
  if (t >= START.DRYING) temp = 28 + 45.4 * (1 - (1 - L.D) ** 2);
  if (t >= START.IR_FINISH) temp = 73.4 + 4.6 * window01(L.I, 0, 0.5);
  if (t >= START.DISCHARGE) temp = 78 - 16 * L.X;
  if (t >= START.COMPLETE) temp = 62 - 17 * L.C;

  const heater = inD ? smoothstep(0, 0.05, L.D) : inI ? 0.6 : 0;
  const ir = inD ? 0.65 * window01(L.D, 0.5, 0.6) : inI ? 0.65 + 0.35 * window01(L.I, 0, 0.15) : inX ? 1 - window01(L.X, 0, 0.3) : 0;
  const steam = inD ? smoothstep(38, 70, temp) * (1 - dryness * 0.5) : inI ? (1 - L.I) * 0.7 : inX ? 0.12 * (1 - L.X) : 0;
  const fanRpm = EXHAUST.fan.rpm * (inD || inI ? 1 : inX ? 0.5 : inG || inS ? 0.3 : 0);
  const paddleRpm = t >= START.DRYING && t < START.COMPLETE ? PADDLE.rpm * (inX ? 1.8 : 1) : 0;

  const screenStage: SimState['screenStage'] =
    t < START.GRINDING ? -1 : t < START.DRYING ? 0 : t < START.COMPLETE ? 1 : 2;

  return {
    t,
    stage: stage.id,
    stageLabel: stage.label,
    stageT: local(t, stage.id),
    progress: clamp01((t - PROCESS_START) / PROCESS_LENGTH),
    temp,
    lid,
    foodLoad,
    foodPhase: t < START.GRINDING ? 'loading' : 'grinding',
    bladeRpm,
    basketLoad,
    louvre,
    liquidLevel,
    dripRate,
    bowlLoad,
    dryness,
    paddleRpm,
    heater,
    ir,
    fanRpm,
    steam,
    hotAir: inD ? 1 : inI ? 0.6 : 0,
    trayLoad: window01(L.X, 0.1, 0.95, ease.linear),
    trayExt: window01(L.C, 0.05, 0.45),
    fallGrind: inG ? band(L.G, 0.1, 0.95) : 0,
    fallTransfer: inS ? band(L.S, 0.76, 1.0) : 0,
    fallDischarge: inX ? band(L.X, 0.08, 0.92) : 0,
    screenStage,
    bar1: clamp01((t - START.GRINDING) / (DUR.GRINDING + DUR.SEPARATING)),
    bar2: clamp01((t - START.DRYING) / (DUR.DRYING + DUR.IR_FINISH + DUR.DISCHARGE)),
  };
}

/**
 * "Showcase" pose (A10): the reference cutaway is a composite marketing image showing every stage populated at once.
 * While paused in showcase mode, content levels are raised to that composite so the cutaway matches the render.
 */
export function withShowcase(s: SimState): SimState {
  return {
    ...s,
    foodLoad: Math.max(s.foodLoad, 1),
    foodPhase: 'grinding',
    basketLoad: Math.max(s.basketLoad, 0.85),
    liquidLevel: Math.max(s.liquidLevel, 0.75),
    bowlLoad: Math.max(s.bowlLoad, 0.75),
    dryness: Math.max(s.dryness, 0.5),
    ir: Math.max(s.ir, 1),
    trayLoad: Math.max(s.trayLoad, 1),
  };
}

export function stageStart(id: StageId): number {
  return START[id];
}

export class Cycle {
  time = DEFAULT_TIME;
  playing = false;
  timeScale = 1;
  loop = true;
  private cached: SimState = evaluate(DEFAULT_TIME);

  update(dt: number): SimState {
    if (this.playing) {
      this.time += dt * this.timeScale;
      if (this.time >= CYCLE_LENGTH) {
        if (this.loop) this.time = 0;
        else {
          this.time = CYCLE_LENGTH - 1e-6;
          this.playing = false;
        }
      }
    }
    this.cached = evaluate(this.time);
    return this.cached;
  }

  get state(): SimState {
    return this.cached;
  }
}

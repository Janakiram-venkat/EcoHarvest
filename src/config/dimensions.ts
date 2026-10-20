/**
 * Single source of truth for every measurement of the EcoHarvest model.
 *
 * Units: metres (1 three.js unit = 1 m).
 * Origin: floor level, centre of the footprint.
 * Axes: +X = right (seen from the front), +Y = up, +Z = towards the viewer (front face).
 *
 * Values marked (A#) are assumptions — see docs/ASSUMPTIONS.md.
 */

export const BODY = { width: 0.3, depth: 0.32 } as const;

export const FEET = { height: 0.005, radius: 0.009, inset: 0.034 } as const;

export const BASE = { y: FEET.height, height: 0.025, inset: 0.004, cornerRadius: 0.027, bevel: 0.004 } as const;

export const SHELL = {
  y: BASE.y + BASE.height,
  height: 0.36,
  cornerRadius: 0.03,
  thickness: 0.0018,
  seamGap: 0.00035,
  edgeBevel: 0.0006,
} as const;
export const SHELL_TOP = SHELL.y + SHELL.height;

export const BAND = { y: SHELL_TOP, height: 0.006, proud: 0.0008 } as const;

export const CAP = {
  y: SHELL_TOP + BAND.height,
  height: 0.045,
  overhang: 0.003,
  cornerRadius: 0.033,
  edgeRadius: 0.009,
  indicator: { width: 0.04, depth: 0.004, height: 0.0012, z: 0.133 },
} as const;
export const CAP_TOP = CAP.y + CAP.height;

export const LID = {
  width: 0.215,
  depth: 0.17,
  height: 0.035,
  cornerRadius: 0.022,
  centerZ: 0.012, // (A1) lid offset forward so the chimney fits behind it
  recessDepth: 0.022,
  clearance: 0.003,
  panelInset: 0.014,
  panelStep: 0.0035,
  linerInset: 0.012,
  gasketInset: 0.007,
  hinge: { radius: 0.0045, capKnuckle: 0.03, lidKnuckle: 0.05, knuckleGap: 0.002 },
  maxAngleDeg: 105,
} as const;
export const RECESS_FLOOR_Y = CAP_TOP - LID.recessDepth;

export const HOPPER = {
  width: 0.19,
  depth: 0.145,
  cornerRadius: 0.015,
  bottomY: 0.375,
  wall: 0.0025,
  rimTube: 0.0016,
  floorThickness: 0.003,
} as const;

/** Front-panel layout: vertical positions as fractions of shell height measured from the shell top. (A2) */
export const FRONT = {
  logoFrac: 0.14,
  logoSize: 0.032,
  wordmarkFrac: 0.226,
  wordmarkCap: 0.0175,
  wordmarkWidth: 0.104,
  taglineFrac: 0.262,
  taglineCap: 0.0049,
  taglineWidth: 0.133,
  bezelTopFrac: 0.3,
  decalWidth: 0.2,
  decalTopFrac: 0.085,
  decalBottomFrac: 0.28,
} as const;
export const fracY = (f: number): number => SHELL_TOP - f * SHELL.height;

export const DISPLAY = {
  bezelWidth: 0.165,
  bezelHeight: 0.13, // (A3) reference render proportion (spec 0.120)
  bezelRadius: 0.01,
  bezelDepth: 0.006,
  bezelBevel: 0.0022,
  screenWidth: 0.147,
  screenHeight: 0.11,
  canvasWidth: 1024,
  canvasHeight: 766,
} as const;

export const BUTTONS = {
  diameter: 0.027,
  spacing: 0.042,
  belowBezel: 0.027, // (A2) centre distance below bezel bottom — matches render
  height: 0.0042,
  ringWidth: 0.0014,
  iconSize: 0.0125,
} as const;

export const HANDLE = { width: 0.08, height: 0.03, radius: 0.009, depth: 0.012, y: 0.352, z: 0.0, trim: 0.004 } as const;

export const VENT = { cols: 12, rows: 30, holeDiameter: 0.002, pitch: 0.0045, centerY: 0.13, centerZ: 0.075 } as const;

export const REAR = {
  inlet: { width: 0.03, height: 0.022, depth: 0.008, x: 0.078, y: 0.075 },
  label: { width: 0.068, height: 0.04, x: -0.04, y: 0.085 },
} as const;

/* ---------------------------------------------------------------- internals */

export const INNER = { halfX: BODY.width / 2 - SHELL.thickness, halfZ: BODY.depth / 2 - SHELL.thickness } as const;

export const FRAME = {
  angle: 0.014,
  thickness: 0.0016,
  postX: 0.128,
  postZ: 0.131,
  bottomY: 0.032,
  topY: 0.389,
  railYs: [0.031, 0.1, 0.262, 0.389],
  boltRadius: 0.0034,
  boltHeight: 0.0026,
} as const;

export const LINER = { bottomY: 0.1, topY: 0.262, sideX: 0.1395, backZ: -0.1395, thickness: 0.0012, halfSpanZ: 0.13, halfSpanX: 0.127 } as const;

export const GRINDER = {
  chamber: { bottomY: 0.318, topY: HOPPER.bottomY, halfX: 0.098, backZ: -0.0605, frontZ: 0.0845, wall: 0.0015 },
  shaft: { y: 0.345, z: 0.012, radius: 0.006, halfLength: 0.112 },
  blade: { count: 7, radius: 0.026, hubRadius: 0.0105, thickness: 0.0022, points: 4, spacing: 0.024, staggerRad: 0.45 },
  collar: { radius: 0.0088, length: 0.0095 },
  bearing: { x: 0.103, width: 0.01, height: 0.03, depth: 0.03 },
  motor: { x0: 0.108, length: 0.024, radius: 0.019 },
  rpm: 3000,
  roller: { radius: 0.0165, teeth: 14, length: 0.19 },
} as const;

export const BASKET = {
  width: 0.2,
  depth: 0.16,
  height: 0.046,
  topY: 0.312,
  centerZ: 0.012,
  rimRadius: 0.0028,
  cornerRadius: 0.006,
  hole: { diameter: 0.0017, pitch: 0.0029 },
  slats: 5,
  slatOpenDeg: 80,
} as const;

export const PAN = { outerW: 0.228, outerD: 0.188, holeW: 0.204, holeD: 0.164, y: 0.262, thickness: 0.0015, lip: 0.012, innerLip: 0.005, radius: 0.01 } as const;

export const FUNNEL = { topY: 0.258, bottomY: 0.226, topRadius: 0.132, bottomRadius: 0.04, collar: 0.006, centerZ: 0.012 } as const;

export const DRYER = { centerZ: 0.012, dishRadius: 0.115, discY: 0.118, dishHeight: 0.03, topY: 0.226, lipRadius: 0.0028 } as const;

export const DISC = { thickness: 0.0016, hole: { diameter: 0.003, pitch: 0.0052 }, supportY: 0.112 } as const;

export const COIL = { y: 0.107, innerRadius: 0.02, outerRadius: 0.1, turns: 3.5, wireRadius: 0.0024 } as const;

export const PADDLE = {
  shaftRadius: 0.0045,
  topY: 0.218,
  armY: 0.1245,
  arms: 3,
  armLength: 0.104,
  armWidth: 0.014,
  armThickness: 0.0035,
  pitchDeg: 32,
  midArmY: 0.162,
  midArmLength: 0.07,
  rpm: 10,
} as const;

export const PADDLE_MOTOR = { radius: 0.019, bottomY: 0.218, topY: 0.256 } as const;

export const IR = {
  y: 0.19,
  x: 0.124,
  z: 0.012,
  length: 0.13,
  tubeRadius: 0.0055,
  reflectorRadius: 0.0155,
  color: 0xff6a1a,
  maxEmissive: 22,
  maxLight: 38,
} as const;

export const EXHAUST = {
  port: { x: -0.131, y: 0.222, z: -0.098 },
  x: -0.122,
  z: -0.118,
  ductRadius: 0.0075,
  housing: { bottomY: 0.302, topY: 0.372, radius: 0.02 },
  cartridge: { outer: 0.0165, inner: 0.0125, pleats: 30 },
  fan: { bottomY: 0.372, topY: 0.388, blades: 5, rpm: 1800 },
  chimney: { radius: 0.0125, topY: 0.505, flangeRadius: 0.019 },
} as const;

export const TRAY = {
  width: 0.25,
  depth: 0.286,
  height: 0.045,
  wall: 0.003,
  cornerRadius: 0.012,
  bottomY: 0.04,
  centerZ: -0.008,
  front: { width: 0.256, height: 0.052, thickness: 0.006, slotWidth: 0.07, slotHeight: 0.016 },
  maxExtension: 0.18,
  railX: 0.1265,
} as const;

export const OUTLET = {
  y: 0.266,
  z: 0.04,
  innerX: 0.108,
  bendX: 0.19,
  tipY: 0.236,
  radius: 0.0055,
  holeRadius: 0.0075,
} as const;

export const CONTAINER = { x: 0.205, z: 0.04, baseY: 0.13, width: 0.07, depth: 0.08, height: 0.1, wall: 0.0018, radius: 0.011, maxFill: 0.62 } as const;

export const SHELF = { y: 0.128, thickness: 0.002, width: 0.084, depth: 0.094, plateHeight: 0.05 } as const;

export const PCB = { width: 0.12, height: 0.1, z: 0.1495, centerY: 0.205, thickness: 0.0016 } as const;

export const SECOND_MILL = { y: 0.093, radius: 0.0075, gap: 0.0006, length: 0.2 } as const;

/** Exploded-view offsets (m) applied to named top-level parts. */
export const EXPLODE: Record<string, [number, number, number]> = {
  A_Lid: [0, 0.27, -0.02],
  TopCap: [0, 0.19, 0],
  GreenBand: [0, 0.165, 0],
  FoodWaste: [0, 0.125, 0],
  B_Grinder: [0, 0.125, 0],
  C_FilterBasket: [0, 0.075, 0],
  D_LiquidOutlet: [0.15, 0.075, 0],
  Container: [0.15, 0.075, 0],
  Funnel: [0, 0.035, 0],
  PaddleMotor: [0, 0.035, 0],
  F1_IRLamp: [0.11, 0, 0],
  F2_IRLamp: [-0.11, 0, 0],
  BaseDisc: [0, -0.035, 0],
  HeatingCoil: [0, -0.06, 0],
  H_Tray: [0, -0.085, 0.12],
  Base: [0, -0.13, 0],
  FrontPanel: [0, 0, 0.3],
  RightPanel: [0.25, 0, 0],
  ShellBody: [-0.12, 0, -0.22],
  Rear: [-0.12, 0, -0.22],
  G_Exhaust: [-0.15, 0.06, -0.04],
  G_Chimney: [-0.15, 0.06, -0.04],
  Electronics: [0, 0, 0.2],
  Wiring: [-0.06, 0, 0.06],
};

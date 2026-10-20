import * as THREE from 'three';
import type { ComponentId } from '../config/components';
import { BASKET, DRYER, EXPLODE, FUNNEL, GRINDER, LID, TRAY } from '../config/dimensions';
import { FLAGS } from '../config/flags';
import { createXrayMaterial } from '../config/materials';
import type { QualitySettings } from '../config/quality';
import type { ViewMode } from '../scene/camera-presets';
import type { SimState } from '../sim/cycle';
import { FallingBits, SoftParticles } from '../sim/particles';
import { ScreenUI } from '../ui/screen-ui';
import { tags } from '../utils/tags';
import { damp } from '../utils/tween';
import { Biomass } from './contents/Biomass';
import { FoodWaste } from './contents/FoodWaste';
import { Granules } from './contents/Granules';
import { WetSolids } from './contents/WetSolids';
import type { PartContext } from './context';
import { createBase } from './exterior/Base';
import { createBrandingDecal } from './exterior/Branding';
import { createButtons } from './exterior/Buttons';
import { createDisplay } from './exterior/Display';
import { Lid } from './exterior/Lid';
import { createRear } from './exterior/Rear';
import { Shell } from './exterior/Shell';
import { createBand, createTopCap } from './exterior/TopCap';
import { createBaseDisc } from './internal/BaseDisc';
import { Container } from './internal/Container';
import { createDryingChamber } from './internal/DryingChamber';
import { createElectronics } from './internal/Electronics';
import { Exhaust } from './internal/Exhaust';
import { FilterBasket } from './internal/FilterBasket';
import { createFrame } from './internal/Frame';
import { createFunnel, createPaddleMotor } from './internal/Funnel';
import { Grinder } from './internal/Grinder';
import { HeatingCoil } from './internal/HeatingCoil';
import { IRLamp } from './internal/IRLamp';
import { LiquidOutlet } from './internal/LiquidOutlet';
import { Paddle } from './internal/Paddle';
import { SecondMill } from './internal/SecondMill';
import { Tray } from './internal/Tray';
import { createWiring } from './internal/Wiring';

export interface UpdateOptions {
  irSetting: number;
  lidOverride: number | null;
  trayOverride: number | null;
}

const VIEW_TARGETS: Record<ViewMode, { lid: number; tray: number; explode: number }> = {
  exterior: { lid: 0, tray: 0, explode: 0 },
  lid: { lid: 1, tray: 0, explode: 0 },
  cutaway: { lid: 0.2, tray: 1, explode: 0 },
  xray: { lid: 0, tray: 0, explode: 0 },
  exploded: { lid: 0.35, tray: 0.4, explode: 1 },
};

/** Assembles every part of the EcoHarvest unit into one named, explodable group and drives it from the sim. */
export class EcoHarvest extends THREE.Group {
  readonly exterior = new THREE.Group();
  readonly internal = new THREE.Group();
  readonly contents = new THREE.Group();
  readonly screen = new ScreenUI();
  readonly anchors: Record<ComponentId, THREE.Object3D>;

  private readonly shell: Shell;
  private readonly lid: Lid;
  private readonly grinder: Grinder;
  private readonly basket: FilterBasket;
  private readonly paddle: Paddle;
  private readonly irLamps: IRLamp[];
  private readonly coil: HeatingCoil;
  private readonly exhaust: Exhaust;
  private readonly tray: Tray;
  private readonly container: Container;
  private readonly outlet: LiquidOutlet;
  private readonly secondMill: SecondMill | null;
  private readonly food: FoodWaste;
  private readonly wet: WetSolids;
  private readonly granules: Granules;
  private readonly biomass: Biomass;

  private readonly steam: SoftParticles;
  private readonly hotAir: SoftParticles;
  private readonly falls: { grind: FallingBits; transfer: FallingBits; discharge: FallingBits; drips: FallingBits };
  private readonly stream: THREE.Mesh;

  private readonly explodeParts: Array<{ obj: THREE.Object3D; base: THREE.Vector3; offset: THREE.Vector3 }> = [];
  private readonly tagged: Array<{ obj: THREE.Object3D; internalTop: boolean }> = [];
  private readonly ghostMeshes: Array<{ mesh: THREE.Mesh; material: THREE.Material | THREE.Material[]; cast: boolean }> = [];
  private readonly xrayMaterial = createXrayMaterial();

  private mode: ViewMode = 'exterior';
  private explode = 0;
  private lidView = 0;
  private trayView = 0;

  constructor(ctx: PartContext) {
    super();
    this.name = 'EcoHarvest';
    this.exterior.name = 'Exterior';
    this.internal.name = 'Internal';
    this.contents.name = 'Contents';
    this.add(this.exterior, this.internal, this.contents);

    /* ---------------- exterior */
    this.shell = new Shell(ctx);
    this.shell.frontPanel.add(createBrandingDecal(), createDisplay(ctx, this.screen.texture), createButtons(ctx));
    const cap = createTopCap(ctx);
    this.lid = new Lid(ctx, cap.userData.hinge as THREE.Vector3);
    this.exterior.add(this.shell, createBand(ctx), cap, this.lid, createBase(ctx), createRear(ctx));

    /* ---------------- internal */
    this.grinder = new Grinder(ctx);
    this.basket = new FilterBasket(ctx);
    this.paddle = new Paddle(ctx);
    this.irLamps = [new IRLamp(ctx, 1), new IRLamp(ctx, -1)];
    this.coil = new HeatingCoil(ctx);
    this.exhaust = new Exhaust(ctx);
    this.tray = new Tray(ctx);
    this.outlet = new LiquidOutlet(ctx);
    this.container = new Container(ctx);
    const dryer = createDryingChamber(ctx);
    this.secondMill = FLAGS.SECOND_MILL ? new SecondMill(ctx) : null;
    this.internal.add(
      createFrame(ctx),
      this.grinder,
      this.basket,
      createFunnel(ctx),
      createPaddleMotor(ctx),
      this.paddle,
      dryer,
      createBaseDisc(ctx),
      this.coil,
      ...this.irLamps,
      this.exhaust,
      this.exhaust.chimney,
      this.tray,
      this.outlet,
      this.container,
      createElectronics(ctx),
      createWiring(ctx),
    );
    if (this.secondMill) this.internal.add(this.secondMill);

    /* ---------------- contents */
    this.food = new FoodWaste(ctx);
    this.contents.add(this.food);
    this.wet = new WetSolids(ctx);
    this.basket.add(this.wet);
    this.granules = new Granules(ctx);
    dryer.add(this.granules);
    this.biomass = new Biomass(ctx);
    this.tray.content.add(this.biomass);

    /* ---------------- effects */
    const sprite = ctx.tex.sprite;
    const so = this.exhaust.steamOrigin;
    this.steam = new SoftParticles(sprite, {
      max: 160,
      color: 0xf1f3f5,
      alpha: 0.3,
      life: [2.4, 4.2],
      size: [0.014, 0.12],
      buoyancy: 0.025,
      drag: 0.35,
      turbulence: 0.02,
      spawn: (p, v) => {
        p.set(so.x + (Math.random() - 0.5) * 0.012, so.y, so.z + (Math.random() - 0.5) * 0.012);
        v.set(0.006 + (Math.random() - 0.5) * 0.02, 0.07 + Math.random() * 0.04, (Math.random() - 0.5) * 0.02);
      },
    });
    this.steam.name = 'Steam';
    this.exhaust.chimney.add(this.steam);

    this.hotAir = new SoftParticles(sprite, {
      max: 90,
      color: 0xffc48a,
      alpha: 0.07,
      life: [0.9, 1.6],
      size: [0.01, 0.035],
      buoyancy: 0.03,
      drag: 0.6,
      turbulence: 0.015,
      additive: true,
      spawn: (p, v) => {
        const r = Math.sqrt(Math.random()) * 0.095;
        const a = Math.random() * Math.PI * 2;
        p.set(Math.cos(a) * r, DRYER.discY + 0.012 + Math.random() * 0.02, DRYER.centerZ + Math.sin(a) * r);
        v.set(0, 0.03, 0);
      },
    });
    this.hotAir.name = 'HotAir';
    dryer.add(this.hotAir);

    const veg = [0x5c8f2b, 0xd9792b, 0xc9a23a, 0x8c5a2b, 0xa83a22, 0x7aa83a];
    const chunk = new THREE.IcosahedronGeometry(0.0024, 0);
    const grind = new FallingBits(chunk, ctx.mats.wetFood, {
      max: 90,
      gravity: 2.5,
      colors: veg,
      scale: [0.6, 1.3],
      floorY: () => BASKET.topY - BASKET.height + 0.006,
      spawn: (p, v) => {
        p.set((Math.random() - 0.5) * 0.17, GRINDER.shaft.y - 0.02, GRINDER.shaft.z + (Math.random() - 0.5) * 0.11);
        v.set((Math.random() - 0.5) * 0.08, -0.15 - Math.random() * 0.1, (Math.random() - 0.5) * 0.08);
      },
    });
    const transfer = new FallingBits(chunk, ctx.mats.wetFood, {
      max: 110,
      gravity: 2.5,
      colors: veg,
      scale: [0.7, 1.4],
      floorY: () => DRYER.discY + 0.008,
      spawn: (p, v) => {
        const r = 0.022 + Math.random() * 0.016;
        const a = Math.random() * Math.PI * 2;
        p.set(Math.cos(a) * r, FUNNEL.bottomY - 0.006, FUNNEL.centerZ + Math.sin(a) * r);
        v.set(Math.cos(a) * 0.15, -0.05, Math.sin(a) * 0.15);
      },
    });
    const discharge = new FallingBits(new THREE.DodecahedronGeometry(0.0016, 0), ctx.mats.crumbs, {
      max: 160,
      gravity: 2.5,
      colors: [0x5a3a22, 0x4a2e1a, 0x6b4a2f],
      scale: [0.6, 1.3],
      floorY: () => TRAY.bottomY + 0.008 + 0.024 * this.biomass.scale.y,
      spawn: (p, v) => {
        const r = Math.sqrt(Math.random()) * 0.1;
        const a = Math.random() * Math.PI * 2;
        p.set(Math.cos(a) * r, DRYER.discY - 0.004, DRYER.centerZ + Math.sin(a) * r);
        v.set(0, -0.05, 0);
      },
    });
    const dripMat = new THREE.MeshPhysicalMaterial({ color: 0x8a5a1e, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.85 });
    const tip = this.outlet.tip;
    const drips = new FallingBits(new THREE.SphereGeometry(0.0017, 10, 8), dripMat, {
      max: 30,
      gravity: 9.81,
      colors: [0xffffff],
      scale: [0.8, 1.1],
      stretch: 1.7,
      floorY: () => this.container.liquidSurfaceY(),
      spawn: (p, v) => {
        p.copy(tip);
        v.set(0, -0.05, 0);
      },
    });
    this.falls = { grind, transfer, discharge, drips };
    this.internal.add(grind, transfer, discharge);
    this.container.add(drips);
    this.stream = new THREE.Mesh(new THREE.CylinderGeometry(0.0011, 0.0016, 1, 10, 1, true), dripMat);
    this.stream.name = 'DripStream';
    this.container.add(this.stream);

    /* ---------------- anchors */
    const foodAnchor = new THREE.Object3D();
    foodAnchor.position.set(0.0, 0.402, LID.centerZ + 0.02);
    this.food.add(foodAnchor);
    this.anchors = {
      A: foodAnchor,
      B: this.grinder.anchor,
      C: this.basket.anchor,
      D: this.outlet.anchor,
      E: dryer.userData.anchor as THREE.Object3D,
      F: this.irLamps[0].anchor,
      G: this.exhaust.anchor,
      H: this.tray.anchor,
    };

    this.collect();
    this.setViewMode('exterior');
  }

  private collect(): void {
    const internalTops = new Set(this.internal.children);
    this.traverse((o) => {
      const t = tags(o);
      if (internalTops.has(o) || t.cutaway || t.exterior) this.tagged.push({ obj: o, internalTop: internalTops.has(o) });
      const offset = EXPLODE[o.name];
      if (offset && !this.explodeParts.some((p) => p.obj === o))
        this.explodeParts.push({ obj: o, base: o.position.clone(), offset: new THREE.Vector3(...offset) });
    });
    const isGhost = (o: THREE.Object3D | null): boolean => {
      for (let p = o; p; p = p.parent) if (tags(p).xray === 'ghost') return true;
      return false;
    };
    this.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && !(o as THREE.InstancedMesh).isInstancedMesh && isGhost(o))
        this.ghostMeshes.push({ mesh: m, material: m.material, cast: m.castShadow });
    });
  }

  get viewMode(): ViewMode {
    return this.mode;
  }

  setViewMode(mode: ViewMode): void {
    this.mode = mode;
    const showInternal = mode === 'cutaway' || mode === 'xray' || mode === 'exploded';
    for (const { obj, internalTop } of this.tagged) {
      const t = tags(obj);
      let v = true;
      if (internalTop) v = showInternal || !!t.alwaysVisible;
      if (t.cutaway === 'hide' && mode === 'cutaway') v = false;
      if (t.exterior === 'hide' && !showInternal) v = false;
      if (t.exterior === 'only' && showInternal) v = false;
      obj.visible = v;
    }
    const xray = mode === 'xray';
    for (const g of this.ghostMeshes) {
      g.mesh.material = xray ? this.xrayMaterial : g.material;
      g.mesh.castShadow = xray ? false : g.cast;
      g.mesh.renderOrder = xray ? 10 : 0;
    }
  }

  setQuality(q: QualitySettings): void {
    this.granules.setQuality(q.granules);
    [this.steam, this.hotAir].forEach((p) => (p.budget = q.particleScale));
    Object.values(this.falls).forEach((f) => (f.budget = Math.max(0.4, q.particleScale)));
  }

  setViewport(heightPx: number, fov: number): void {
    this.steam.setViewport(heightPx, fov);
    this.hotAir.setViewport(heightPx, fov);
  }

  /** Object ids that a picked mesh belongs to (walks up to the first A–H tag). */
  componentOf(o: THREE.Object3D | null): ComponentId | null {
    for (let p = o; p; p = p.parent) {
      const c = tags(p).component;
      if (c) return c;
    }
    return null;
  }

  update(s: SimState, dt: number, o: UpdateOptions): void {
    const target = VIEW_TARGETS[this.mode];
    this.lidView = damp(this.lidView, target.lid, 4, dt);
    this.trayView = damp(this.trayView, target.tray, 3.5, dt);
    this.explode = damp(this.explode, target.explode, 3.2, dt);

    const lid = o.lidOverride ?? Math.max(s.lid, this.lidView);
    this.lid.setAngle(lid * LID.maxAngleDeg);
    const tray = o.trayOverride ?? Math.max(s.trayExt, this.trayView);
    this.tray.setExtension(tray * TRAY.maxExtension);

    this.grinder.update(dt, s.bladeRpm);
    this.basket.setState(s.louvre, s.dripRate);
    this.wet.setAmount(s.basketLoad);
    this.paddle.update(dt, s.paddleRpm);
    this.granules.set(s.bowlLoad, s.dryness, this.paddle.angle * 0.35);
    const ir = s.ir * o.irSetting;
    this.irLamps.forEach((l) => l.setLevel(ir));
    this.coil.setLevel(s.heater);
    this.exhaust.update(dt, s.fanRpm);
    this.food.setAmount(s.foodLoad, s.foodPhase);
    this.biomass.setLoad(s.trayLoad);
    this.container.setLevel(s.liquidLevel);
    this.secondMill?.update(dt, s.fallDischarge > 0 ? 240 : 0);

    this.steam.update(dt, 42 * s.steam);
    this.hotAir.update(dt, 55 * s.hotAir);
    this.falls.grind.update(dt, 60 * s.fallGrind);
    this.falls.transfer.update(dt, 90 * s.fallTransfer);
    this.falls.discharge.update(dt, 110 * s.fallDischarge);
    this.falls.drips.update(dt, 10 * s.dripRate);
    const surf = this.container.liquidSurfaceY();
    const len = Math.max(0.001, this.outlet.tip.y - surf);
    this.stream.visible = s.dripRate > 0.6;
    this.stream.scale.y = len;
    this.stream.position.set(this.outlet.tip.x, surf + len / 2, this.outlet.tip.z);

    this.screen.update({ stage: s.screenStage, temp: s.temp, progress: s.progress, bar1: s.bar1, bar2: s.bar2, wifi: true });

    for (const p of this.explodeParts) p.obj.position.copy(p.base).addScaledVector(p.offset, this.explode);
  }
}

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { GRINDER } from '../../config/dimensions';
import { FLAGS } from '../../config/flags';
import { circlePath, extrudeX, extrudeZ, mesh } from '../../utils/geometry';
import { smoothstep } from '../../utils/tween';
import { tag } from '../../utils/tags';
import type { PartContext } from '../context';
import { boltGeometry } from './Frame';
import { createMotor } from './Motors';

/** Star blade with hooked tips, in the XY plane (thickness along Z, centred). */
function starBladeGeometry(): THREE.BufferGeometry {
  const { radius: R, hubRadius: rh, points: P, thickness } = GRINDER.blade;
  const p = (r: number, a: number): THREE.Vector2 => new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r);
  const s = new THREE.Shape();
  for (let k = 0; k < P; k++) {
    const th = (k / P) * Math.PI * 2;
    const h0 = p(rh, th - 0.35);
    if (k === 0) s.moveTo(h0.x, h0.y);
    else s.absarc(0, 0, rh, th - (Math.PI * 2) / P + 0.9, th - 0.35, false);
    const c1 = p(R * 0.78, th - 0.08);
    const tip = p(R, th + 0.2);
    s.quadraticCurveTo(c1.x, c1.y, tip.x, tip.y);
    const tip2 = p(R * 0.9, th + 0.34);
    s.lineTo(tip2.x, tip2.y);
    const c2 = p(R * 0.52, th + 0.36);
    const h1 = p(rh, th + 0.9);
    s.quadraticCurveTo(c2.x, c2.y, h1.x, h1.y);
  }
  s.absarc(0, 0, rh, Math.PI * 2 - (Math.PI * 2) / P + 0.9, Math.PI * 2 - 0.35, false);
  s.holes.push(circlePath(GRINDER.shaft.radius + 0.0002));
  const geo = extrudeZ(s, thickness, { bevel: 0.0004, bevelSegments: 2, curveSegments: 10 });
  geo.translate(0, 0, -thickness / 2);
  geo.rotateY(Math.PI / 2);
  return geo;
}

function gearRollerGeometry(): THREE.BufferGeometry {
  const { radius: R, teeth, length } = GRINDER.roller;
  const s = new THREE.Shape();
  const n = teeth * 4;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = i % 4 < 2 ? R : R * 0.82;
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const geo = extrudeX(s, length, { bevel: 0.0006, bevelSegments: 2 });
  geo.translate(-length / 2, 0, 0);
  return geo;
}

/** B — horizontal shaft with staggered stainless star blades, bearing blocks, drive motor and chamber walls. */
export class Grinder extends THREE.Group {
  readonly rotors: Array<{ obj: THREE.Object3D; dir: number }> = [];
  readonly anchor = new THREE.Object3D();
  private angle = 0;
  private readonly bladeMat: THREE.MeshPhysicalMaterial;
  private readonly blurMat: THREE.MeshPhysicalMaterial;

  constructor(ctx: PartContext) {
    super();
    this.name = 'B_Grinder';
    tag(this, { component: 'B' });
    const { shaft, chamber, blade, collar, bearing, motor } = GRINDER;
    const sy = shaft.y;
    const sz = shaft.z;

    this.bladeMat = ctx.mats.polished.clone();
    this.bladeMat.transparent = true;
    this.blurMat = new THREE.MeshPhysicalMaterial({
      color: 0xd6d9dc,
      metalness: 1,
      roughness: 0.35,
      map: ctx.tex.bladeBlur,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    // Chamber walls
    const ch = chamber.topY - chamber.bottomY;
    const cy = (chamber.topY + chamber.bottomY) / 2;
    const cd = chamber.frontZ - chamber.backZ;
    const cz = (chamber.frontZ + chamber.backZ) / 2;
    for (const sx of [-1, 1]) {
      const w = mesh(new RoundedBoxGeometry(chamber.wall, ch, cd, 2, 0.0005), ctx.mats.satin, 'ChamberSide');
      w.position.set(sx * chamber.halfX, cy, cz);
      this.add(w);
    }
    const backWall = mesh(new RoundedBoxGeometry(2 * chamber.halfX, ch, chamber.wall, 2, 0.0005), ctx.mats.satin, 'ChamberBack');
    backWall.position.set(0, cy, chamber.backZ);
    const frontWall = mesh(new RoundedBoxGeometry(2 * chamber.halfX, ch, chamber.wall, 2, 0.0005), ctx.mats.satin, 'ChamberFront');
    frontWall.position.set(0, cy, chamber.frontZ);
    this.add(backWall, tag(frontWall, { cutaway: 'hide' }));

    if (FLAGS.GRINDER_STYLE === 'blades') this.buildBladeRotor(sy, sz);
    else this.buildRollers(sy, sz);

    // Bearing blocks with bolts
    const bolt = boltGeometry();
    const bearingGeo = new RoundedBoxGeometry(bearing.width, bearing.height, bearing.depth, 3, 0.002);
    for (const sx of [-1, 1]) {
      const b = mesh(bearingGeo, ctx.mats.satin, 'BearingBlock');
      b.position.set(sx * bearing.x, sy, sz);
      const race = mesh(new THREE.TorusGeometry(shaft.radius + 0.002, 0.0014, 8, 24), ctx.mats.polished, 'BearingRace');
      race.rotation.y = Math.PI / 2;
      race.position.set(sx * (bearing.x + (sx * bearing.width) / 2), sy, sz);
      this.add(b, race);
      for (const dy of [-1, 1]) {
        const bm = mesh(bolt, ctx.mats.polished, 'BearingBolt');
        bm.rotation.z = -sx * (Math.PI / 2);
        bm.position.set(sx * (bearing.x + bearing.width / 2), sy + dy * bearing.height * 0.34, sz + dy * 0.009);
        this.add(bm);
      }
    }
    // Shaft (shared by both styles)
    const shaftMesh = mesh(new THREE.CylinderGeometry(shaft.radius, shaft.radius, 2 * shaft.halfLength, 24), ctx.mats.polished, 'Shaft');
    shaftMesh.rotation.z = Math.PI / 2;
    const shaftHolder = new THREE.Group();
    shaftHolder.position.set(0, sy, sz);
    shaftHolder.add(shaftMesh);
    this.add(shaftHolder);
    this.rotors.push({ obj: shaftHolder, dir: 1 });

    const m = createMotor(ctx, motor.radius, motor.length, 'GrinderMotor');
    m.position.set(motor.x0, sy, sz);
    this.add(m);

    // Collars for blade style
    if (FLAGS.GRINDER_STYLE === 'blades') {
      const n = blade.count;
      const collarGeo = new THREE.CylinderGeometry(collar.radius, collar.radius, collar.length, 24);
      collarGeo.rotateZ(Math.PI / 2);
      const collars = new THREE.InstancedMesh(collarGeo, ctx.mats.polished, n + 1);
      collars.name = 'Collars';
      const mtx = new THREE.Matrix4();
      for (let i = 0; i <= n; i++) {
        mtx.makeTranslation((i - n / 2) * blade.spacing, 0, 0);
        collars.setMatrixAt(i, mtx);
      }
      collars.castShadow = true;
      this.rotors[0].obj.add(collars);
    }

    this.anchor.position.set(0.07, sy, sz + 0.02);
    this.add(this.anchor);
  }

  private buildBladeRotor(sy: number, sz: number): void {
    const { count, spacing, staggerRad, radius } = GRINDER.blade;
    const rotor = new THREE.Group();
    rotor.name = 'BladeRotor';
    rotor.position.set(0, sy, sz);
    const blades = new THREE.InstancedMesh(starBladeGeometry(), this.bladeMat, count);
    blades.name = 'StarBlades';
    const blurGeo = new THREE.CircleGeometry(radius * 1.02, 48);
    blurGeo.rotateY(Math.PI / 2);
    const blurs = new THREE.InstancedMesh(blurGeo, this.blurMat, count);
    blurs.name = 'BladeBlur';
    const q = new THREE.Quaternion();
    const one = new THREE.Vector3(1, 1, 1);
    for (let i = 0; i < count; i++) {
      const x = (i - (count - 1) / 2) * spacing;
      q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), i * staggerRad);
      blades.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(x, 0, 0), q, one));
      blurs.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x, 0, 0));
    }
    blades.castShadow = true;
    blades.receiveShadow = true;
    rotor.add(blades, blurs);
    this.add(rotor);
    this.rotors.push({ obj: rotor, dir: 1 });
  }

  private buildRollers(sy: number, sz: number): void {
    const geo = gearRollerGeometry();
    const d = GRINDER.roller.radius * 1.03;
    const spots: Array<[number, number, number]> = [
      [-d, 0.008, 1],
      [d, 0.008, -1],
      [0, -0.022, 1],
    ];
    for (const [dz, dy, dir] of spots) {
      const r = new THREE.Group();
      r.name = 'Roller';
      r.position.set(0, sy + dy, sz + dz);
      r.add(mesh(geo, this.bladeMat, 'GearRoller'));
      this.add(r);
      this.rotors.push({ obj: r, dir });
    }
  }

  update(dt: number, rpm: number): void {
    const visualRpm = FLAGS.GRINDER_STYLE === 'blades' ? rpm : rpm * 0.05;
    this.angle += (visualRpm / 60) * Math.PI * 2 * dt;
    for (const r of this.rotors) r.obj.rotation.x = this.angle * r.dir;
    const blur = smoothstep(250, 1400, rpm);
    this.blurMat.opacity = blur * 0.85;
    this.bladeMat.opacity = 1 - blur * 0.72;
    this.bladeMat.depthWrite = blur < 0.5;
  }
}

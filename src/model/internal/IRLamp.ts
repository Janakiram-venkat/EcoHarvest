import * as THREE from 'three';
import { DRYER, IR } from '../../config/dimensions';
import { mesh } from '../../utils/geometry';
import { tag } from '../../utils/tags';
import type { PartContext } from '../context';

/**
 * F1 (right wall, side = +1) / F2 (left wall, side = −1): horizontal quartz IR tube with coiled filament,
 * ceramic end caps and a polished half-cylinder reflector. Casts warm light with a RectAreaLight.
 */
export class IRLamp extends THREE.Group {
  readonly light: THREE.RectAreaLight;
  readonly bounce: THREE.PointLight;
  readonly anchor = new THREE.Object3D();
  private readonly filamentMat: THREE.MeshStandardMaterial;
  private readonly quartzMat: THREE.MeshPhysicalMaterial;

  constructor(ctx: PartContext, side: 1 | -1) {
    super();
    this.name = side > 0 ? 'F1_IRLamp' : 'F2_IRLamp';
    tag(this, { component: 'F' });
    const x = side * IR.x;
    const L = IR.length;

    this.filamentMat = ctx.mats.filament.clone();
    this.quartzMat = ctx.mats.quartz.clone();

    const tubeGeo = new THREE.CylinderGeometry(IR.tubeRadius, IR.tubeRadius, L, 28, 1, true);
    tubeGeo.rotateX(Math.PI / 2);
    const tube = mesh(tubeGeo, this.quartzMat, 'QuartzTube', false, false);
    tube.position.set(x, IR.y, IR.z);

    const helix: THREE.Vector3[] = [];
    const turns = 70;
    for (let i = 0; i <= turns * 10; i++) {
      const t = i / (turns * 10);
      const a = t * turns * Math.PI * 2;
      helix.push(new THREE.Vector3(Math.cos(a) * 0.0013, Math.sin(a) * 0.0013, (t - 0.5) * (L - 0.012)));
    }
    const filament = mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helix), turns * 10, 0.00035, 5, false),
      this.filamentMat,
      'Filament',
      false,
      false,
    );
    filament.position.set(x, IR.y, IR.z);

    const capGeo = new THREE.CylinderGeometry(IR.tubeRadius * 1.25, IR.tubeRadius * 1.25, 0.012, 20);
    capGeo.rotateX(Math.PI / 2);
    const clipGeo = new THREE.BoxGeometry(0.004, 0.003, 0.016);
    for (const sz of [-1, 1]) {
      const cap = mesh(capGeo, ctx.mats.ceramic, 'CeramicCap');
      cap.position.set(x, IR.y, IR.z + sz * (L / 2 + 0.004));
      const clip = mesh(clipGeo, ctx.mats.polished, 'LampClip');
      clip.position.set(x + side * 0.008, IR.y, IR.z + sz * (L / 2 + 0.004));
      clip.rotation.y = Math.PI / 2;
      this.add(cap, clip);
    }

    // Half-cylinder reflector opening toward the chamber centre.
    const refGeo = new THREE.CylinderGeometry(IR.reflectorRadius, IR.reflectorRadius, L + 0.02, 40, 1, true, 0, Math.PI);
    refGeo.rotateX(Math.PI / 2);
    const reflector = mesh(refGeo, ctx.mats.reflector, 'Reflector');
    reflector.position.set(x + side * 0.004, IR.y, IR.z);
    reflector.rotation.z = side > 0 ? 0 : Math.PI; // half-shell sits on the wall side
    this.add(tube, filament, reflector);

    this.light = new THREE.RectAreaLight(IR.color, 0, L, 0.014);
    this.light.position.set(x - side * 0.008, IR.y, IR.z);
    this.light.lookAt(0, DRYER.discY, DRYER.centerZ);
    this.bounce = new THREE.PointLight(0xff7a30, 0, 0.35, 2);
    this.bounce.position.set(x - side * 0.04, IR.y - 0.02, IR.z + 0.03);
    this.add(this.light, this.bounce);

    this.anchor.position.set(x - side * 0.004, IR.y, IR.z + 0.035);
    this.add(this.anchor);
  }

  /** level ∈ [0,1] → filament glow, quartz glow and emitted light. */
  setLevel(level: number): void {
    const l = Math.max(0, level);
    this.filamentMat.emissiveIntensity = IR.maxEmissive * l;
    this.quartzMat.emissiveIntensity = 0.9 * l;
    this.light.intensity = IR.maxLight * l;
    this.bounce.intensity = 0.06 * l;
    this.light.visible = l > 0.001;
    this.bounce.visible = l > 0.001;
  }
}

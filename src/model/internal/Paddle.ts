import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { DRYER, PADDLE } from '../../config/dimensions';
import { mesh } from '../../utils/geometry';
import type { PartContext } from '../context';

/** Motor-driven central stirring paddle: vertical shaft with angled flat arms + upper T-arms. Pivot = shaft axis. */
export class Paddle extends THREE.Group {
  readonly rotor = new THREE.Group();
  angle = 0;

  constructor(ctx: PartContext) {
    super();
    this.name = 'Paddle';
    this.rotor.name = 'PaddleRotor';
    this.rotor.position.set(0, 0, DRYER.centerZ);
    this.add(this.rotor);
    const p = PADDLE;
    const len = p.topY - p.armY + 0.004;
    const shaft = mesh(new THREE.CylinderGeometry(p.shaftRadius, p.shaftRadius, len, 20), ctx.mats.polished, 'PaddleShaft');
    shaft.position.y = p.armY + len / 2 - 0.004;
    const hub = mesh(new THREE.CylinderGeometry(0.0095, 0.0095, 0.012, 24), ctx.mats.satin, 'PaddleHub');
    hub.position.y = p.armY + 0.002;
    const nut = mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.004, 6), ctx.mats.polished, 'HubNut');
    nut.position.y = p.armY + 0.01;
    this.rotor.add(shaft, hub, nut);

    const pitch = THREE.MathUtils.degToRad(p.pitchDeg);
    const armGeo = new RoundedBoxGeometry(p.armLength, p.armThickness, p.armWidth, 2, 0.0012);
    armGeo.translate(p.armLength / 2 + 0.006, 0, 0);
    const tipGeo = new RoundedBoxGeometry(0.004, 0.016, 0.012, 2, 0.0012);
    for (let i = 0; i < p.arms; i++) {
      const holder = new THREE.Group();
      holder.rotation.y = (i / p.arms) * Math.PI * 2;
      holder.position.y = p.armY;
      const arm = mesh(armGeo, ctx.mats.satin, 'PaddleArm');
      arm.rotation.x = pitch;
      const tip = mesh(tipGeo, ctx.mats.satin, 'PaddleScraper');
      tip.position.set(p.armLength + 0.004, 0.005, 0);
      holder.add(arm, tip);
      this.rotor.add(holder);
    }
    const midGeo = new RoundedBoxGeometry(2 * p.midArmLength, 0.003, 0.009, 2, 0.001);
    const mid = mesh(midGeo, ctx.mats.satin, 'PaddleMidArm');
    mid.position.y = p.midArmY;
    mid.rotation.y = Math.PI / p.arms;
    mid.rotation.x = pitch * 0.6;
    this.rotor.add(mid);
  }

  update(dt: number, rpm: number): void {
    this.angle += (rpm / 60) * Math.PI * 2 * dt;
    this.rotor.rotation.y = this.angle;
  }
}

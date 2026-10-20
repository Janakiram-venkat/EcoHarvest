import * as THREE from 'three';
import { DRYER, SECOND_MILL } from '../../config/dimensions';
import { mesh } from '../../utils/geometry';
import type { PartContext } from '../context';

/** Optional fine mill (PDF Fig.2 second milling stage): two counter-rotating knurled rollers under the base disc. */
export class SecondMill extends THREE.Group {
  private readonly rollers: THREE.Mesh[] = [];
  private angle = 0;

  constructor(ctx: PartContext) {
    super();
    this.name = 'SecondMill';
    const geo = new THREE.CylinderGeometry(SECOND_MILL.radius, SECOND_MILL.radius, SECOND_MILL.length, 24, 1);
    geo.rotateZ(Math.PI / 2);
    for (const s of [-1, 1]) {
      const r = mesh(geo, ctx.mats.polished, 'FineMillRoller');
      r.position.set(0, SECOND_MILL.y, DRYER.centerZ + s * (SECOND_MILL.radius + SECOND_MILL.gap / 2));
      this.rollers.push(r);
      this.add(r);
    }
  }

  update(dt: number, rpm: number): void {
    this.angle += (rpm / 60) * Math.PI * 2 * dt;
    this.rollers.forEach((r, i) => (r.rotation.x = i === 0 ? this.angle : -this.angle));
  }
}

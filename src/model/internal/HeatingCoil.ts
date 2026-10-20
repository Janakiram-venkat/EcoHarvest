import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { COIL, DRYER } from '../../config/dimensions';
import { mesh } from '../../utils/geometry';
import type { PartContext } from '../context';

/** Spiral resistive heating element under the perforated base disc (visible in X-ray). */
export class HeatingCoil extends THREE.Group {
  private readonly mat: THREE.MeshStandardMaterial;

  constructor(ctx: PartContext) {
    super();
    this.name = 'HeatingCoil';
    this.mat = ctx.mats.coil.clone();
    const pts: THREE.Vector3[] = [];
    const n = 420;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const a = t * COIL.turns * Math.PI * 2;
      const r = COIL.innerRadius + (COIL.outerRadius - COIL.innerRadius) * t;
      pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
    }
    const last = pts[pts.length - 1];
    const lead = [
      new THREE.Vector3(pts[0].x, -0.004, pts[0].z),
      new THREE.Vector3(pts[0].x, -0.012, pts[0].z - 0.01),
    ];
    const spiral = mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3([...lead.reverse(), ...pts, new THREE.Vector3(last.x, -0.01, last.z)]), 700, COIL.wireRadius, 8),
      this.mat,
      'CoilElement',
    );
    spiral.position.set(0, COIL.y, DRYER.centerZ);
    this.add(spiral);

    const barGeo = new RoundedBoxGeometry(2 * COIL.outerRadius + 0.01, 0.003, 0.008, 2, 0.001);
    for (let i = 0; i < 3; i++) {
      const bar = mesh(barGeo, ctx.mats.ceramic, 'MicaSupport');
      bar.position.set(0, COIL.y - COIL.wireRadius - 0.0015, DRYER.centerZ);
      bar.rotation.y = (i / 3) * Math.PI + Math.PI / 6;
      this.add(bar);
    }
  }

  setLevel(level: number): void {
    this.mat.emissiveIntensity = 2.2 * Math.max(0, level);
  }
}

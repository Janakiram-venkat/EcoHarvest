import * as THREE from 'three';
import { EXHAUST, GRINDER, PCB } from '../../config/dimensions';
import { mesh } from '../../utils/geometry';
import type { PartContext } from '../context';

type WireColor = 'red' | 'black' | 'blue' | 'white';

/** Wiring harness running down the left inner wall: PCB → heater/paddle motor, fan and grinder motor, with cable ties. */
export function createWiring(ctx: PartContext): THREE.Group {
  const g = new THREE.Group();
  g.name = 'Wiring';
  const v = (x: number, y: number, z: number): THREE.Vector3 => new THREE.Vector3(x, y, z);
  const x0 = -0.137;
  const runs: Array<{ pts: THREE.Vector3[]; colors: WireColor[] }> = [
    {
      // PCB → down the front-left corner → heater terminals under the disc
      pts: [v(-0.055, PCB.centerY - 0.04, PCB.z - 0.004), v(-0.11, PCB.centerY - 0.03, 0.135), v(x0, 0.17, 0.118), v(x0, 0.12, 0.1), v(x0 + 0.004, 0.098, 0.04), v(-0.06, 0.096, -0.02), v(-0.012, 0.099, 0.0)],
      colors: ['red', 'black', 'blue', 'white'],
    },
    {
      // PCB → up the left wall → exhaust fan
      pts: [v(-0.05, PCB.centerY + 0.045, PCB.z - 0.004), v(-0.11, 0.27, 0.13), v(x0, 0.31, 0.09), v(x0, 0.36, 0.0), v(x0 + 0.006, 0.38, EXHAUST.z + 0.025), v(EXHAUST.x - 0.012, EXHAUST.fan.bottomY + 0.004, EXHAUST.z + 0.012)],
      colors: ['red', 'black'],
    },
    {
      // PCB → over the top front rail → grinder motor on the right
      pts: [v(0.05, PCB.centerY + 0.05, PCB.z - 0.004), v(0.118, PCB.centerY + 0.06, 0.141), v(0.137, 0.3, 0.125), v(0.138, 0.33, 0.08), v(0.128, 0.37, 0.035), v(GRINDER.motor.x0 + 0.012, GRINDER.shaft.y + GRINDER.motor.radius + 0.006, GRINDER.shaft.z)],
      colors: ['red', 'black', 'white'],
    },
    {
      // Heater lead → paddle gear-motor up the back
      pts: [v(-0.06, 0.096, -0.02), v(-0.1, 0.11, -0.12), v(-0.06, 0.24, -0.135), v(-0.02, 0.255, -0.03), v(0, 0.252, 0.0)],
      colors: ['blue', 'white'],
    },
  ];
  const r = 0.0011;
  const tieGeo = new THREE.TorusGeometry(0.0034, 0.0007, 6, 16);
  const ties: THREE.Matrix4[] = [];
  const z = new THREE.Vector3(0, 0, 1);
  for (const run of runs) {
    const base = new THREE.CatmullRomCurve3(run.pts, false, 'centripetal');
    const frames = base.computeFrenetFrames(80, false);
    run.colors.forEach((c, k) => {
      const ang = (k / run.colors.length) * Math.PI * 2;
      const off = run.colors.length > 1 ? 0.0016 : 0;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 80; i++) {
        const p = base.getPointAt(i / 80);
        const n = frames.normals[i].clone().multiplyScalar(Math.cos(ang) * off);
        const b = frames.binormals[i].clone().multiplyScalar(Math.sin(ang) * off);
        pts.push(p.add(n).add(b));
      }
      g.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, r, 6), ctx.mats.wires[c], `Wire_${c}`));
    });
    const len = base.getLength();
    const nTies = Math.max(2, Math.floor(len / 0.045));
    for (let i = 1; i < nTies; i++) {
      const t = i / nTies;
      const p = base.getPointAt(t);
      const q = new THREE.Quaternion().setFromUnitVectors(z, base.getTangentAt(t));
      ties.push(new THREE.Matrix4().compose(p, q, new THREE.Vector3(1, 1, 1)));
    }
  }
  const tieMesh = new THREE.InstancedMesh(tieGeo, ctx.mats.tie, ties.length);
  tieMesh.name = 'CableTies';
  ties.forEach((m, i) => tieMesh.setMatrixAt(i, m));
  g.add(tieMesh);
  return g;
}

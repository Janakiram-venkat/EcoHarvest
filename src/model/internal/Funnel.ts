import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { FUNNEL, PADDLE_MOTOR } from '../../config/dimensions';
import { arcPoints, lathe, mesh } from '../../utils/geometry';
import type { PartContext } from '../context';
import { createGearMotor } from './Motors';

export function funnelRadiusAt(y: number): number {
  const t = (y - FUNNEL.bottomY) / (FUNNEL.topY - FUNNEL.bottomY);
  return FUNNEL.bottomRadius + (FUNNEL.topRadius - FUNNEL.bottomRadius) * t;
}

/** Stainless conical transition from the separation stage into the drying chamber. */
export function createFunnel(ctx: PartContext): THREE.Group {
  const g = new THREE.Group();
  g.name = 'Funnel';
  const f = FUNNEL;
  const cone = mesh(
    lathe(
      [
        [f.bottomRadius, f.bottomY - f.collar],
        [f.bottomRadius, f.bottomY],
        ...arcPoints(f.topRadius + 0.0022, f.topY, 0.0022, Math.PI, 0, 6),
      ],
      96,
    ),
    ctx.mats.satinDouble,
    'FunnelCone',
  );
  cone.position.z = f.centerZ;
  g.add(cone);

  // Spider struts holding the paddle gear-motor in the funnel throat (annular gap lets solids pass).
  const y = 0.24;
  const r0 = PADDLE_MOTOR.radius;
  const r1 = funnelRadiusAt(y);
  const strutGeo = new RoundedBoxGeometry(r1 - r0, 0.0025, 0.004, 2, 0.0006);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
    const s = mesh(strutGeo, ctx.mats.satin, 'SpiderStrut');
    const rm = (r0 + r1) / 2;
    s.position.set(Math.cos(a) * rm, y, f.centerZ + Math.sin(a) * rm);
    s.rotation.y = -a;
    g.add(s);
  }
  return g;
}

export function createPaddleMotor(ctx: PartContext): THREE.Group {
  const m = createGearMotor(ctx, PADDLE_MOTOR.radius, PADDLE_MOTOR.topY - PADDLE_MOTOR.bottomY, 'PaddleMotor');
  m.position.set(0, PADDLE_MOTOR.bottomY, FUNNEL.centerZ);
  return m;
}

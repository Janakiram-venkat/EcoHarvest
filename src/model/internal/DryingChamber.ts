import * as THREE from 'three';
import { DRYER } from '../../config/dimensions';
import { arcPoints, lathe, mesh } from '../../utils/geometry';
import { tag } from '../../utils/tags';
import type { PartContext } from '../context';

/** E — round stainless drying dish (on the perforated base disc) inside the lamp-lit drying chamber. */
export function createDryingChamber(ctx: PartContext): THREE.Group {
  const g = new THREE.Group();
  g.name = 'E_DryingChamber';
  tag(g, { component: 'E' });
  const r = DRYER.dishRadius;
  const y0 = DRYER.discY - 0.004;
  const y1 = DRYER.discY + DRYER.dishHeight;
  const wall = mesh(
    lathe(
      [
        [r + 0.004, y0],
        [r, y0 + 0.002],
        ...arcPoints(r + DRYER.lipRadius, y1, DRYER.lipRadius, Math.PI, 0, 8),
        [r + DRYER.lipRadius * 2, y1 - 0.006],
      ],
      128,
    ),
    ctx.mats.satinDouble,
    'DishWall',
  );
  wall.position.z = DRYER.centerZ;
  g.add(wall);

  const anchor = new THREE.Object3D();
  anchor.name = 'E_anchor';
  anchor.position.set(-0.07, DRYER.discY + 0.012, DRYER.centerZ + 0.06);
  g.add(anchor);
  g.userData.anchor = anchor;
  return g;
}

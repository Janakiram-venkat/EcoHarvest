import * as THREE from 'three';
import { BASE, BODY, FEET } from '../../config/dimensions';
import { arcPoints, extrudeUp, lathe, mesh, roundedRectShape } from '../../utils/geometry';
import { tag } from '../../utils/tags';
import type { PartContext } from '../context';

/** Black plinth with four rubber feet. */
export function createBase(ctx: PartContext): THREE.Group {
  const g = new THREE.Group();
  g.name = 'Base';
  const plinth = mesh(
    extrudeUp(
      roundedRectShape(BODY.width - 2 * BASE.inset, BODY.depth - 2 * BASE.inset, BASE.cornerRadius),
      BASE.height,
      { bevel: BASE.bevel, bevelSegments: 4, curveSegments: 28 },
    ),
    ctx.mats.blackPlastic,
    'Plinth',
  );
  plinth.position.y = BASE.y;
  g.add(tag(plinth, { xray: 'ghost' }));

  const fr = FEET.radius;
  const footGeo = lathe([[0, 0], ...arcPoints(fr - 0.0015, 0.0015, 0.0015, -Math.PI / 2, 0, 4), [fr * 0.92, FEET.height], [0, FEET.height]], 32);
  const fx = BODY.width / 2 - FEET.inset;
  const fz = BODY.depth / 2 - FEET.inset;
  for (const [x, z] of [
    [-fx, -fz],
    [fx, -fz],
    [-fx, fz],
    [fx, fz],
  ]) {
    const foot = mesh(footGeo, ctx.mats.rubber, 'RubberFoot');
    foot.position.set(x, 0, z);
    g.add(foot);
  }
  return g;
}

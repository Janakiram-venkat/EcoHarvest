import * as THREE from 'three';
import { BODY, HANDLE, SHELL } from '../../config/dimensions';
import { extrudeX, mesh, roundedRectPath, roundedRectShape, roundedRingShape } from '../../utils/geometry';
import type { PartContext } from '../context';

/** Hole path for the recessed grab handle in right-panel shape space. */
export function handleHolePath(): THREE.Path {
  return roundedRectPath(HANDLE.width, HANDLE.height, HANDLE.radius, HANDLE.z, HANDLE.y - SHELL.y);
}

/** Recessed grab handle: moulded pocket behind the panel opening plus a thin trim frame. */
export function createSideHandle(ctx: PartContext): THREE.Group {
  const g = new THREE.Group();
  g.name = 'SideHandle';
  const outerX = BODY.width / 2;
  const innerX = outerX - SHELL.thickness;

  // Pocket walls (ring) + back plate, all extruded inward along −X.
  const ring = roundedRingShape(HANDLE.width, HANDLE.height, HANDLE.radius, 0.0018, HANDLE.z, HANDLE.y);
  const walls = mesh(extrudeX(ring, HANDLE.depth, { curveSegments: 10 }), ctx.mats.blackPlastic, 'HandlePocket');
  walls.position.x = innerX - HANDLE.depth + 0.0003;
  const back = mesh(
    extrudeX(roundedRectShape(HANDLE.width, HANDLE.height, HANDLE.radius, HANDLE.z, HANDLE.y), 0.0015, {
      curveSegments: 10,
    }),
    ctx.mats.blackPlastic,
    'HandleBack',
  );
  back.position.x = innerX - HANDLE.depth;

  const trimShape = roundedRingShape(
    HANDLE.width + 2 * HANDLE.trim,
    HANDLE.height + 2 * HANDLE.trim,
    HANDLE.radius + HANDLE.trim,
    HANDLE.trim,
    HANDLE.z,
    HANDLE.y,
  );
  const trim = mesh(extrudeX(trimShape, 0.0016, { bevel: 0.0005, curveSegments: 12 }), ctx.mats.blackPlastic, 'HandleTrim');
  trim.position.x = outerX - 0.0002;
  g.add(walls, back, trim);
  return g;
}

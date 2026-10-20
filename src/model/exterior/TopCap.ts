import * as THREE from 'three';
import { BAND, BODY, CAP, CAP_TOP, HOPPER, LID, RECESS_FLOOR_Y, SHELL } from '../../config/dimensions';
import { extrudeUp, mesh, roundedRectPath, roundedRectShape, roundedRectTube } from '../../utils/geometry';
import { tag } from '../../utils/tags';
import type { PartContext } from '../context';

/** Recess outline that the lid drops into (plan view). */
export function recessSize(): { w: number; d: number; r: number } {
  return {
    w: LID.width + 2 * LID.clearance,
    d: LID.depth + 2 * LID.clearance,
    r: LID.cornerRadius + LID.clearance,
  };
}

/** Lime accent band between shell and top cap, wrapping all four sides. */
export function createBand(ctx: PartContext): THREE.Mesh {
  const W = BODY.width + 2 * BAND.proud;
  const D = BODY.depth + 2 * BAND.proud;
  const s = roundedRectShape(W, D, SHELL.cornerRadius + BAND.proud);
  s.holes.push(roundedRectPath(BODY.width - 0.006, BODY.depth - 0.006, SHELL.cornerRadius - 0.003));
  const m = mesh(extrudeUp(s, BAND.height, { bevel: 0.0008, bevelSegments: 2, curveSegments: 28 }), ctx.mats.lime, 'GreenBand');
  m.position.y = BAND.y;
  return tag(m, { xray: 'ghost' });
}

/** Glossy-satin black top cap with lid recess, hopper opening, green hopper rim and indicator strip. */
export function createTopCap(ctx: PartContext): THREE.Group {
  const g = new THREE.Group();
  g.name = 'TopCap';
  const rec = recessSize();
  const W = BODY.width + 2 * CAP.overhang;
  const D = BODY.depth + 2 * CAP.overhang;

  const body = roundedRectShape(W, D, CAP.cornerRadius);
  body.holes.push(roundedRectPath(rec.w, rec.d, rec.r, 0, LID.centerZ));
  const cap = mesh(
    extrudeUp(body, CAP.height, { bevel: CAP.edgeRadius, bevelSegments: 6, curveSegments: 28, creaseAngle: Math.PI / 4 }),
    ctx.mats.blackPlastic,
    'TopCapBody',
  );
  cap.position.y = CAP.y;

  const floor = roundedRectShape(rec.w + 0.004, rec.d + 0.004, rec.r + 0.002, 0, LID.centerZ);
  floor.holes.push(roundedRectPath(HOPPER.width, HOPPER.depth, HOPPER.cornerRadius, 0, LID.centerZ));
  const recessFloor = mesh(
    extrudeUp(floor, HOPPER.floorThickness, { bevel: 0.0006, bevelSegments: 2, curveSegments: 20 }),
    ctx.mats.blackPlastic,
    'RecessFloor',
  );
  recessFloor.position.y = RECESS_FLOOR_Y - HOPPER.floorThickness;

  const rim = mesh(
    roundedRectTube(HOPPER.width + 0.002, HOPPER.depth + 0.002, HOPPER.cornerRadius + 0.001, HOPPER.rimTube, 0, LID.centerZ, 240, 10),
    ctx.mats.lime,
    'HopperRim',
  );
  rim.position.y = RECESS_FLOOR_Y + HOPPER.rimTube * 0.4;

  const ind = CAP.indicator;
  const indicator = mesh(
    extrudeUp(roundedRectShape(ind.width, ind.depth, ind.depth / 2, 0, ind.z), ind.height, { bevel: 0.0004, bevelSegments: 2 }),
    ctx.mats.limeGlow,
    'FrontIndicator',
  );
  indicator.position.y = CAP_TOP - 0.0002;

  // Hopper tub: black moulded walls from the recess floor down to the grinding chamber.
  const tubShape = roundedRectShape(HOPPER.width + 2 * HOPPER.wall, HOPPER.depth + 2 * HOPPER.wall, HOPPER.cornerRadius + HOPPER.wall, 0, LID.centerZ);
  tubShape.holes.push(roundedRectPath(HOPPER.width, HOPPER.depth, HOPPER.cornerRadius, 0, LID.centerZ));
  const tubH = RECESS_FLOOR_Y - HOPPER.floorThickness - HOPPER.bottomY;
  const tub = mesh(extrudeUp(tubShape, tubH, { curveSegments: 20 }), ctx.mats.hopperPlastic, 'HopperTub');
  tub.position.y = HOPPER.bottomY;
  tag(tub, { cutaway: 'hide' });

  // Fixed hinge knuckles at the rear edge of the recess.
  const h = LID.hinge;
  const knuckleGeo = new THREE.CylinderGeometry(h.radius, h.radius, h.capKnuckle, 20);
  knuckleGeo.rotateZ(Math.PI / 2);
  const hingeZ = LID.centerZ - LID.depth / 2 - LID.clearance - h.radius * 0.4;
  const hingeY = CAP_TOP + h.radius * 0.35;
  for (const sx of [-1, 1]) {
    const k = mesh(knuckleGeo, ctx.mats.blackPlastic, 'HingeKnuckle');
    k.position.set(sx * (h.lidKnuckle / 2 + h.knuckleGap + h.capKnuckle / 2), hingeY, hingeZ);
    g.add(tag(k, { xray: 'ghost' }));
  }
  const pin = mesh(new THREE.CylinderGeometry(h.radius * 0.35, h.radius * 0.35, h.lidKnuckle + 2 * h.capKnuckle + 0.006, 12), ctx.mats.polished, 'HingePin');
  pin.rotation.z = Math.PI / 2;
  pin.position.set(0, hingeY, hingeZ);

  g.add(tag(cap, { xray: 'ghost' }), tag(recessFloor, { xray: 'ghost' }), rim, indicator, tub, pin);
  g.userData.hinge = new THREE.Vector3(0, hingeY, hingeZ);
  return g;
}

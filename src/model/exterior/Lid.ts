import * as THREE from 'three';
import { LID, RECESS_FLOOR_Y } from '../../config/dimensions';
import { extrudeUp, mesh, roundedRectShape, roundedRectTube, roundedRingShape } from '../../utils/geometry';
import { tag } from '../../utils/tags';
import type { PartContext } from '../context';

/** A — smoked lid with recessed top panel, lighter liner, gasket and barrel hinge. Pivot = hinge axis. */
export class Lid extends THREE.Group {
  readonly pivot = new THREE.Group();
  readonly anchor = new THREE.Object3D();

  constructor(ctx: PartContext, hinge: THREE.Vector3) {
    super();
    this.name = 'A_Lid';
    tag(this, { component: 'A' });
    this.pivot.name = 'LidPivot';
    this.pivot.position.copy(hinge);
    this.add(this.pivot);

    const parts = new THREE.Group();
    parts.position.copy(hinge).multiplyScalar(-1);
    this.pivot.add(parts);

    const yb = RECESS_FLOOR_Y + 0.0025;
    const yt = RECESS_FLOOR_Y + LID.height - LID.panelStep;
    const z = LID.centerZ;

    const body = mesh(
      extrudeUp(roundedRectShape(LID.width, LID.depth, LID.cornerRadius, 0, z), yt - yb, { bevel: 0.004, bevelSegments: 4, curveSegments: 24 }),
      ctx.mats.smokedLid,
      'LidBody',
    );
    body.position.y = yb;

    const frame = mesh(
      extrudeUp(roundedRingShape(LID.width, LID.depth, LID.cornerRadius, LID.panelInset, 0, z), LID.panelStep + 0.002, {
        bevel: 0.0014,
        bevelSegments: 3,
        curveSegments: 24,
      }),
      ctx.mats.smokedLid,
      'LidFrame',
    );
    frame.position.y = yt - 0.002;

    const liner = mesh(
      extrudeUp(
        roundedRectShape(LID.width - 2 * LID.linerInset, LID.depth - 2 * LID.linerInset, LID.cornerRadius - LID.linerInset * 0.6, 0, z),
        0.003,
        { bevel: 0.0008, bevelSegments: 2 },
      ),
      ctx.mats.lidLiner,
      'LidLiner',
    );
    liner.position.y = yb - 0.0022;

    const gasket = mesh(
      roundedRectTube(
        LID.width - 2 * LID.gasketInset,
        LID.depth - 2 * LID.gasketInset,
        LID.cornerRadius - LID.gasketInset * 0.5,
        0.0017,
        0,
        z,
        220,
        8,
      ),
      ctx.mats.rubber,
      'LidGasket',
    );
    gasket.position.y = yb - 0.0006;

    const h = LID.hinge;
    const knuckle = mesh(new THREE.CylinderGeometry(h.radius, h.radius, h.lidKnuckle, 20), ctx.mats.smokedLid, 'LidKnuckle');
    knuckle.rotation.z = Math.PI / 2;
    knuckle.position.copy(hinge);
    const webLen = z - LID.depth / 2 + 0.006 - hinge.z;
    const web = mesh(new THREE.BoxGeometry(h.lidKnuckle, h.radius * 1.2, Math.max(0.004, webLen)), ctx.mats.smokedLid, 'LidHingeWeb');
    web.position.set(0, hinge.y - h.radius * 0.2, hinge.z + webLen / 2);

    parts.add(...[body, frame, liner, gasket, knuckle, web].map((m) => tag(m, { xray: 'ghost' })));

    this.anchor.position.set(0, RECESS_FLOOR_Y + LID.height, z + LID.depth * 0.28);
    parts.add(this.anchor);
  }

  setAngle(deg: number): void {
    this.pivot.rotation.x = -THREE.MathUtils.degToRad(deg);
  }
}

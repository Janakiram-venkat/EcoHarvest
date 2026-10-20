import * as THREE from 'three';
import { BODY, OUTLET } from '../../config/dimensions';
import { lathe, mesh } from '../../utils/geometry';
import { tag } from '../../utils/tags';
import type { PartContext } from '../context';

/** D — bent stainless drain pipe from the drip pan out through the right panel to a down-turned spout. */
export class LiquidOutlet extends THREE.Group {
  readonly tip = new THREE.Vector3(OUTLET.bendX, OUTLET.tipY - 0.002, OUTLET.z);
  readonly anchor = new THREE.Object3D();

  constructor(ctx: PartContext) {
    super();
    this.name = 'D_LiquidOutlet';
    tag(this, { component: 'D', alwaysVisible: true });
    const O = OUTLET;
    const wallX = BODY.width / 2;
    const r = O.radius;

    // Internal run (pan → wall) and external spout are separate so the spout can detach in exterior views (A8).
    const inner = new THREE.LineCurve3(new THREE.Vector3(O.innerX, O.y, O.z), new THREE.Vector3(wallX + 0.004, O.y, O.z));
    const innerPipe = mesh(new THREE.TubeGeometry(inner, 4, r, 20), ctx.mats.polished, 'OutletPipeInner');

    const path = new THREE.CurvePath<THREE.Vector3>();
    const p0 = new THREE.Vector3(wallX + 0.004, O.y, O.z);
    const p1 = new THREE.Vector3(O.bendX - 0.016, O.y, O.z);
    const p2 = new THREE.Vector3(O.bendX, O.y - 0.016, O.z);
    path.add(new THREE.LineCurve3(p0, p1));
    path.add(new THREE.QuadraticBezierCurve3(p1, new THREE.Vector3(O.bendX, O.y, O.z), p2));
    path.add(new THREE.LineCurve3(p2, new THREE.Vector3(O.bendX, O.tipY, O.z)));
    const spout = mesh(new THREE.TubeGeometry(path, 48, r, 20), ctx.mats.polished, 'OutletSpout');
    const nozzle = mesh(lathe([[r * 0.7, -0.004], [r * 1.12, -0.003], [r * 1.12, 0.002], [r * 0.7, 0.003]], 24), ctx.mats.polished, 'Nozzle');
    nozzle.position.set(O.bendX, O.tipY - 0.001, O.z);
    const union = mesh(new THREE.CylinderGeometry(r * 1.35, r * 1.35, 0.006, 6), ctx.mats.polished, 'UnionNut');
    union.rotation.z = Math.PI / 2;
    union.position.set(wallX + 0.007, O.y, O.z);
    const external = new THREE.Group();
    external.name = 'OutletSpoutExternal';
    external.add(spout, nozzle, union);
    tag(external, { exterior: 'hide' });

    const grommet = mesh(new THREE.TorusGeometry(O.holeRadius, 0.0016, 10, 32), ctx.mats.rubber, 'OutletGrommet');
    grommet.rotation.y = Math.PI / 2;
    grommet.position.set(wallX + 0.0004, O.y, O.z);
    const plug = mesh(new THREE.CylinderGeometry(O.holeRadius * 1.1, O.holeRadius * 1.1, 0.003, 32), ctx.mats.rubber, 'OutletPlug');
    plug.rotation.z = Math.PI / 2;
    plug.position.set(wallX + 0.0015, O.y, O.z);
    tag(plug, { exterior: 'only' });

    const elbow = mesh(new THREE.CylinderGeometry(r * 1.4, r * 1.4, 0.008, 20), ctx.mats.satin, 'PanFitting');
    elbow.rotation.z = Math.PI / 2;
    elbow.position.set(O.innerX, O.y, O.z);

    this.add(innerPipe, external, grommet, plug, elbow);
    this.anchor.position.set(O.bendX + r, O.y - 0.01, O.z);
    external.add(this.anchor);
  }
}

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { TRAY } from '../../config/dimensions';
import { extrudeUp, extrudeZ, mesh, roundedRectPath, roundedRectShape, roundedRingShape } from '../../utils/geometry';
import { tag } from '../../utils/tags';
import type { PartContext } from '../context';

/** H — dark-grey pull-out drawer on rails with a front cut-out handle. Pivot = drawer rail origin. */
export class Tray extends THREE.Group {
  readonly slide = new THREE.Group();
  readonly content = new THREE.Group();
  readonly anchor = new THREE.Object3D();

  constructor(ctx: PartContext) {
    super();
    this.name = 'H_Tray';
    tag(this, { component: 'H' });
    this.slide.name = 'TraySlide';
    this.add(this.slide);
    const T = TRAY;
    const zc = T.centerZ;
    const walls = mesh(
      extrudeUp(roundedRingShape(T.width, T.depth, T.cornerRadius, T.wall, 0, zc), T.height, { bevel: 0.0008, bevelSegments: 2, curveSegments: 16 }),
      ctx.mats.tray,
      'TrayWalls',
    );
    walls.position.y = T.bottomY;
    const floor = mesh(
      extrudeUp(roundedRectShape(T.width - 0.001, T.depth - 0.001, T.cornerRadius, 0, zc), 0.003, { bevel: 0.0006, bevelSegments: 1 }),
      ctx.mats.tray,
      'TrayFloor',
    );
    floor.position.y = T.bottomY;

    const F = T.front;
    const front = roundedRectShape(F.width, F.height, 0.006, 0, F.height / 2);
    front.holes.push(roundedRectPath(F.slotWidth, F.slotHeight, F.slotHeight / 2, 0, F.height * 0.5));
    const face = mesh(extrudeZ(front, F.thickness, { bevel: 0.0012, bevelSegments: 3, curveSegments: 16 }), ctx.mats.tray, 'TrayFront');
    face.position.set(0, T.bottomY - 0.002, zc + T.depth / 2 - 0.002);

    const runnerGeo = new RoundedBoxGeometry(0.0016, 0.012, T.depth - 0.02, 2, 0.0005);
    for (const sx of [-1, 1]) {
      const r = mesh(runnerGeo, ctx.mats.polished, 'DrawerSlide');
      r.position.set(sx * (T.width / 2 + 0.0008), T.bottomY + 0.018, zc);
      this.slide.add(r);
    }
    this.slide.add(walls, floor, face, this.content);
    this.anchor.position.set(T.width * 0.42, T.bottomY + T.height, zc + T.depth / 2);
    this.slide.add(this.anchor);
  }

  setExtension(m: number): void {
    this.slide.position.z = m;
  }
}

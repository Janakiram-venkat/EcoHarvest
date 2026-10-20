import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { BODY, CONTAINER, SHELF } from '../../config/dimensions';
import { extrudeUp, mesh, roundedRectShape, roundedRectTube, roundedRingShape } from '../../utils/geometry';
import { tag } from '../../utils/tags';
import type { PartContext } from '../context';

/** Removable clear container (on a side bracket) collecting amber waste liquid from outlet D. */
export class Container extends THREE.Group {
  private readonly liquid: THREE.Mesh;
  private readonly meniscus: THREE.Mesh;
  private readonly innerW = CONTAINER.width - 2 * CONTAINER.wall - 0.0006;
  private readonly innerD = CONTAINER.depth - 2 * CONTAINER.wall - 0.0006;
  level = 0;

  constructor(ctx: PartContext) {
    super();
    this.name = 'Container';
    tag(this, { exterior: 'hide', component: 'D', alwaysVisible: true });
    const C = CONTAINER;
    const x = C.x;
    const z = C.z;

    const walls = mesh(
      extrudeUp(roundedRingShape(C.width, C.depth, C.radius, C.wall, x, z), C.height, { bevel: 0.0005, bevelSegments: 1, curveSegments: 16 }),
      ctx.mats.clear,
      'ContainerWalls',
      false,
      false,
    );
    walls.position.y = C.baseY + 0.002;
    const bottom = mesh(
      extrudeUp(roundedRectShape(C.width, C.depth, C.radius, x, z), 0.0025, { bevel: 0.0006, bevelSegments: 1 }),
      ctx.mats.clear,
      'ContainerBottom',
      false,
      false,
    );
    bottom.position.y = C.baseY;
    const lip = mesh(roundedRectTube(C.width - C.wall, C.depth - C.wall, C.radius, C.wall * 0.8, x, z, 160, 8), ctx.mats.clear, 'ContainerLip', false, false);
    lip.position.y = C.baseY + C.height + 0.002;
    [walls, bottom, lip].forEach((m) => (m.renderOrder = 3));

    const grad = mesh(
      new THREE.PlaneGeometry(0.014, 0.075),
      new THREE.MeshBasicMaterial({ map: ctx.tex.graduations, transparent: true, opacity: 0.7, depthWrite: false }),
      'Graduations',
      false,
      false,
    );
    grad.position.set(x - C.width / 2 + 0.012, C.baseY + 0.045, z + C.depth / 2 + 0.0004);
    grad.renderOrder = 4;

    this.liquid = mesh(
      extrudeUp(roundedRectShape(this.innerW, this.innerD, C.radius - C.wall, x, z), 1, { curveSegments: 12 }),
      ctx.mats.liquid,
      'WasteLiquid',
      false,
      true,
    );
    this.liquid.position.y = C.baseY + 0.0025;
    this.meniscus = mesh(
      roundedRectTube(this.innerW - 0.0012, this.innerD - 0.0012, C.radius - C.wall - 0.0006, 0.0012, x, z, 160, 8),
      ctx.mats.liquid,
      'Meniscus',
      false,
      false,
    );

    // Stainless bracket shelf hooked onto the right panel.
    const shelf = new THREE.Group();
    shelf.name = 'ContainerShelf';
    const wallX = BODY.width / 2;
    const plate = mesh(new RoundedBoxGeometry(SHELF.thickness, SHELF.plateHeight, SHELF.depth * 0.7, 2, 0.0008), ctx.mats.satin, 'ShelfPlate');
    plate.position.set(wallX + SHELF.thickness / 2 + 0.0003, SHELF.y + SHELF.plateHeight / 2 - 0.004, z);
    const tray = mesh(new RoundedBoxGeometry(SHELF.width, SHELF.thickness, SHELF.depth, 2, 0.0008), ctx.mats.satin, 'ShelfTray');
    tray.position.set(wallX + SHELF.width / 2, SHELF.y, z);
    const rimGeo = new RoundedBoxGeometry(SHELF.width, 0.008, SHELF.thickness, 2, 0.0008);
    for (const s of [-1, 1]) {
      const rim = mesh(rimGeo, ctx.mats.satin, 'ShelfRim');
      rim.position.set(wallX + SHELF.width / 2, SHELF.y + 0.004, z + (s * SHELF.depth) / 2);
      shelf.add(rim);
    }
    const gusset = mesh(new RoundedBoxGeometry(0.03, 0.03, SHELF.thickness, 2, 0.0008), ctx.mats.satin, 'ShelfGusset');
    gusset.position.set(wallX + 0.012, SHELF.y - 0.01, z);
    gusset.rotation.z = Math.PI / 4;
    shelf.add(plate, tray, gusset);

    this.add(walls, bottom, lip, grad, this.liquid, this.meniscus, shelf);
    this.setLevel(0);
  }

  /** level ∈ [0,1] of the usable container height. */
  setLevel(level: number): void {
    this.level = level;
    const h = Math.max(0.0005, level * CONTAINER.maxFill * CONTAINER.height);
    this.liquid.scale.y = h;
    this.liquid.visible = level > 0.005;
    this.meniscus.visible = this.liquid.visible;
    this.meniscus.position.y = CONTAINER.baseY + 0.0025 + h - 0.0004;
  }

  liquidSurfaceY(): number {
    return CONTAINER.baseY + 0.0025 + Math.max(0.0005, this.level * CONTAINER.maxFill * CONTAINER.height);
  }
}

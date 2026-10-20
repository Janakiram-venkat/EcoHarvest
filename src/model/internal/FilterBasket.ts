import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { BASKET, PAN } from '../../config/dimensions';
import { extrudeUp, mesh, metricPlane, roundedRectPath, roundedRectShape, roundedRectTube, roundedRingShape } from '../../utils/geometry';
import { tag } from '../../utils/tags';
import type { PartContext } from '../context';

/**
 * C — rectangular perforated stainless basket with rolled rim.
 * Perforations are a tiled alphaMap (alphaToCoverage), not geometry.
 * The floor is a row of louvre slats that rotate open to drop the de-watered solids into the funnel (A6).
 * Below sits a drip pan that collects the filtrate and feeds outlet D.
 */
export class FilterBasket extends THREE.Group {
  readonly slats: THREE.Group[] = [];
  readonly anchor = new THREE.Object3D();
  private readonly film: THREE.Mesh;

  constructor(ctx: PartContext) {
    super();
    this.name = 'C_FilterBasket';
    tag(this, { component: 'C' });
    const { width: W, depth: D, height: H, topY, centerZ: z } = BASKET;
    const bottomY = topY - H;
    const midY = topY - H / 2;
    const mat = ctx.mats.basketMesh;

    const walls: Array<[number, number, number, number]> = [
      // [width, x, z, rotY]
      [W, 0, z + D / 2, 0],
      [W, 0, z - D / 2, Math.PI],
      [D, W / 2, z, Math.PI / 2],
      [D, -W / 2, z, -Math.PI / 2],
    ];
    for (const [w, x, zz, ry] of walls) {
      const wall = mesh(metricPlane(w, H), mat, 'BasketMeshWall', true, true);
      wall.position.set(x, midY, zz);
      wall.rotation.y = ry;
      this.add(wall);
    }
    const postGeo = new THREE.CylinderGeometry(0.0022, 0.0022, H, 10);
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) {
        const p = mesh(postGeo, ctx.mats.polished, 'BasketCorner');
        p.position.set((sx * W) / 2, midY, z + (sz * D) / 2);
        this.add(p);
      }
    const rim = mesh(roundedRectTube(W + 0.002, D + 0.002, BASKET.cornerRadius, BASKET.rimRadius, 0, z, 240, 12), ctx.mats.polished, 'RolledRim');
    rim.position.y = topY;
    const foot = mesh(roundedRectTube(W, D, BASKET.cornerRadius, 0.0018, 0, z, 240, 8), ctx.mats.polished, 'BottomRim');
    foot.position.y = bottomY;
    this.add(rim, foot);

    // Louvre floor
    const n = BASKET.slats;
    const sw = D / n;
    const slatGeo = new RoundedBoxGeometry(W - 0.006, 0.0014, sw * 1.12, 2, 0.0005);
    const pinGeo = new THREE.CylinderGeometry(0.0016, 0.0016, W + 0.004, 10);
    pinGeo.rotateZ(Math.PI / 2);
    for (let i = 0; i < n; i++) {
      const pivot = new THREE.Group();
      pivot.name = 'LouvreSlat';
      pivot.position.set(0, bottomY + 0.0012, z - D / 2 + sw * (i + 0.5));
      pivot.add(mesh(slatGeo, ctx.mats.satin, 'Slat'), mesh(pinGeo, ctx.mats.polished, 'SlatPin'));
      this.add(pivot);
      this.slats.push(pivot);
    }

    // Drip pan with outer and inner lips
    const panShape = roundedRingShape(PAN.outerW, PAN.outerD, PAN.radius, (PAN.outerW - PAN.holeW) / 2, 0, z);
    const pan = mesh(extrudeUp(panShape, PAN.thickness, { curveSegments: 12 }), ctx.mats.satinDouble, 'DripPan');
    pan.position.y = PAN.y;
    const outerLip = mesh(
      extrudeUp(roundedRingShape(PAN.outerW, PAN.outerD, PAN.radius, 0.0012, 0, z), PAN.lip, { curveSegments: 12 }),
      ctx.mats.satinDouble,
      'PanOuterLip',
    );
    outerLip.position.y = PAN.y;
    const innerLip = mesh(
      extrudeUp(roundedRingShape(PAN.holeW + 0.0024, PAN.holeD + 0.0024, 0.005, 0.0012, 0, z), PAN.innerLip, { curveSegments: 10 }),
      ctx.mats.satinDouble,
      'PanInnerLip',
    );
    innerLip.position.y = PAN.y;
    const rimTube = mesh(roundedRectTube(PAN.outerW, PAN.outerD, PAN.radius, 0.0014, 0, z, 200, 8), ctx.mats.satin, 'PanRim');
    rimTube.position.y = PAN.y + PAN.lip;
    this.add(pan, outerLip, innerLip, rimTube);

    // Thin filtrate film in the pan channel (visible while separating).
    // ShapeGeometry is laid flat with rotateX(−π/2), which maps shape.y → −Z, hence the negated centre.
    const filmShape = roundedRectShape(PAN.outerW - 0.003, PAN.outerD - 0.003, PAN.radius, 0, -z);
    filmShape.holes.push(roundedRectPath(PAN.holeW + 0.003, PAN.holeD + 0.003, 0.005, 0, -z));
    this.film = mesh(new THREE.ShapeGeometry(filmShape, 10), ctx.mats.liquid, 'FiltrateFilm', false, true);
    this.film.geometry.rotateX(-Math.PI / 2);
    this.film.position.y = PAN.y + PAN.thickness + 0.0012;
    this.film.visible = false;
    this.add(this.film);

    this.anchor.position.set(W * 0.38, midY - 0.004, z + D / 2);
    this.add(this.anchor);
  }

  /** open ∈ [0,1] rotates the louvres; liquid ∈ [0,1] shows the filtrate film in the pan. */
  setState(open: number, liquid: number): void {
    const a = THREE.MathUtils.degToRad(BASKET.slatOpenDeg) * open;
    this.slats.forEach((s) => (s.rotation.x = a));
    this.film.visible = liquid > 0.02;
  }
}

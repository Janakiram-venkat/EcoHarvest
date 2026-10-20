import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { FRAME, LINER, TRAY } from '../../config/dimensions';
import { extrudeUp, mesh } from '../../utils/geometry';
import { tag } from '../../utils/tags';
import type { PartContext } from '../context';

const rbox = (w: number, h: number, d: number, r = 0.0005): THREE.BufferGeometry => new RoundedBoxGeometry(w, h, d, 2, r);

/** Hex-head M4 bolt with washer, axis along +Y. */
export function boltGeometry(): THREE.BufferGeometry {
  const head = new THREE.CylinderGeometry(FRAME.boltRadius, FRAME.boltRadius, FRAME.boltHeight, 6);
  head.translate(0, FRAME.boltHeight / 2 + 0.0006, 0);
  const washer = new THREE.CylinderGeometry(FRAME.boltRadius * 1.45, FRAME.boltRadius * 1.45, 0.0006, 20);
  washer.translate(0, 0.0003, 0);
  return mergeGeometries([head, washer]);
}

/** Stainless sheet-metal chassis: L-angle corner posts, rails, liners, tray runners and hex bolts. */
export function createFrame(ctx: PartContext): THREE.Group {
  const g = new THREE.Group();
  g.name = 'Frame';
  const a = FRAME.angle;
  const t = FRAME.thickness;
  const ox = FRAME.postX + a;
  const oz = FRAME.postZ + a;
  const satin = ctx.mats.satin;

  // L-angle cross-section with its outer corner at the origin, legs pointing inward (−X, −Z).
  const L = new THREE.Shape();
  L.moveTo(0, 0);
  L.lineTo(0, -a);
  L.lineTo(-t, -a);
  L.lineTo(-t, -t);
  L.lineTo(-a, -t);
  L.lineTo(-a, 0);
  const postGeo = extrudeUp(L, FRAME.topY - FRAME.bottomY, { bevel: 0.0003, bevelSegments: 1 });
  const bolts: THREE.Matrix4[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  const addBolt = (p: THREE.Vector3, dir: THREE.Vector3): void => {
    const q = new THREE.Quaternion().setFromUnitVectors(up, dir);
    bolts.push(new THREE.Matrix4().compose(p, q, new THREE.Vector3(1, 1, 1)));
  };

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const post = mesh(postGeo, satin, 'CornerPost');
      post.position.set(sx * ox, FRAME.bottomY, sz * oz);
      post.scale.set(sx, 1, sz);
      g.add(post);
    }
  }

  // Rails: vertical web against the wall + inward flange (two rounded strips).
  const railYs = FRAME.railYs;
  const addRail = (axis: 'x' | 'z', side: number, y: number): void => {
    const len = axis === 'x' ? 2 * FRAME.postX : 2 * FRAME.postZ;
    const web = mesh(axis === 'x' ? rbox(len, a, t) : rbox(t, a, len), satin, 'RailWeb');
    const flange = mesh(axis === 'x' ? rbox(len, t, a) : rbox(a, t, len), satin, 'RailFlange');
    if (axis === 'x') {
      web.position.set(0, y, side * (oz - t / 2));
      flange.position.set(0, y - a / 2 + t / 2, side * (oz - a / 2));
      for (const ex of [-1, 1]) addBolt(new THREE.Vector3(ex * (FRAME.postX - 0.006), y, side * (oz - t)), new THREE.Vector3(0, 0, -side));
    } else {
      web.position.set(side * (ox - t / 2), y, 0);
      flange.position.set(side * (ox - a / 2), y - a / 2 + t / 2, 0);
      for (const ez of [-1, 1]) addBolt(new THREE.Vector3(side * (ox - t), y, ez * (FRAME.postZ - 0.006)), new THREE.Vector3(-side, 0, 0));
    }
    g.add(web, flange);
  };
  railYs.forEach((y, i) => {
    addRail('z', -1, y);
    addRail('z', 1, y);
    addRail('x', -1, y);
    if (i === 0 || i === railYs.length - 1) addRail('x', 1, y);
  });

  // Inner liners around the drying chamber (reflect IR, carry the lamps).
  const lh = LINER.topY - LINER.bottomY;
  const ly = (LINER.topY + LINER.bottomY) / 2;
  for (const sx of [-1, 1]) {
    const liner = mesh(rbox(LINER.thickness, lh, 2 * LINER.halfSpanZ, 0.0004), ctx.mats.satin, 'SideLiner');
    liner.position.set(sx * LINER.sideX, ly, 0);
    g.add(tag(liner, { xray: 'ghost' }));
    for (const yy of [LINER.bottomY + 0.012, LINER.topY - 0.012])
      for (const zz of [-LINER.halfSpanZ + 0.012, LINER.halfSpanZ - 0.012])
        addBolt(new THREE.Vector3(sx * (LINER.sideX - LINER.thickness / 2), yy, zz), new THREE.Vector3(-sx, 0, 0));
  }
  const back = mesh(rbox(2 * LINER.halfSpanX, lh, LINER.thickness, 0.0004), ctx.mats.satin, 'BackLiner');
  back.position.set(0, ly, LINER.backZ);
  g.add(tag(back, { xray: 'ghost' }));

  // Hot-air blower grille on the back liner (PDF: hot air circulated by the internal heating coil).
  const grille = mesh(new THREE.CircleGeometry(0.03, 48), ctx.mats.discMesh, 'BlowerGrille');
  const uv = grille.geometry.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.06, uv.getY(i) * 0.06);
  grille.position.set(0, 0.195, LINER.backZ + LINER.thickness / 2 + 0.0004);
  const bezel = mesh(new THREE.TorusGeometry(0.031, 0.0022, 10, 64), ctx.mats.polished, 'BlowerBezel');
  bezel.position.copy(grille.position);
  const blower = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.012, 40, 1, true), ctx.mats.painted, 'BlowerHousing');
  blower.rotation.x = Math.PI / 2;
  blower.position.set(0, 0.195, LINER.backZ - 0.006);
  g.add(grille, bezel, blower);

  // Tray runners (L-rails) on the frame bottom.
  for (const sx of [-1, 1]) {
    const runner = mesh(rbox(0.008, 0.0016, 0.29), ctx.mats.polished, 'TrayRunner');
    runner.position.set(sx * (TRAY.railX + 0.003), TRAY.bottomY + 0.012, -0.005);
    const runnerWeb = mesh(rbox(0.0016, 0.014, 0.29), ctx.mats.polished, 'TrayRunnerWeb');
    runnerWeb.position.set(sx * (TRAY.railX + 0.0068), TRAY.bottomY + 0.018, -0.005);
    g.add(runner, runnerWeb);
  }

  const boltMesh = new THREE.InstancedMesh(boltGeometry(), ctx.mats.polished, bolts.length);
  boltMesh.name = 'FrameBolts';
  bolts.forEach((m, i) => boltMesh.setMatrixAt(i, m));
  boltMesh.castShadow = true;
  g.add(boltMesh);
  return g;
}

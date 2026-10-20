import * as THREE from 'three';
import { arcPoints, lathe } from '../../utils/geometry';
import { mulberry32, range } from '../../utils/rand';
import type { PartContext } from '../context';

/** Potted leafy plant to the left of the unit (hero scene prop). */
export function createPlant(ctx: PartContext): THREE.Group {
  const g = new THREE.Group();
  g.name = 'Plant';
  const potMat = new THREE.MeshPhysicalMaterial({ color: 0x3a3c3e, roughness: 0.55, clearcoat: 0.3 });
  const pot = new THREE.Mesh(
    lathe([[0, 0], [0.085, 0], ...arcPoints(0.105, 0.2, 0.008, -Math.PI / 2, Math.PI / 2, 5).map(([r, y]) => [r, y] as [number, number]), [0.1, 0.21], [0.095, 0.19]], 64),
    potMat,
  );
  pot.castShadow = true;
  pot.receiveShadow = true;
  const soil = new THREE.Mesh(new THREE.CircleGeometry(0.096, 40), new THREE.MeshStandardMaterial({ map: ctx.tex.soil, roughness: 1 }));
  soil.rotation.x = -Math.PI / 2;
  soil.position.y = 0.19;
  g.add(pot, soil);

  // Leaf: tapered shape, curved along its length.
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.04, 0.03, 0.05, 0.13, 0, 0.19);
  s.bezierCurveTo(-0.05, 0.13, -0.04, 0.03, 0, 0);
  const leafGeo = new THREE.ShapeGeometry(s, 12);
  const pos = leafGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const x = pos.getX(i);
    pos.setZ(i, -1.6 * y * y + 3 * x * x);
  }
  leafGeo.computeVertexNormals();
  const leafMat = new THREE.MeshPhysicalMaterial({ color: 0x3f7a2a, roughness: 0.5, side: THREE.DoubleSide, sheen: 0.4, sheenColor: new THREE.Color(0x9fd27a), clearcoat: 0.25 });
  const rnd = mulberry32(12);
  const count = 34;
  const leaves = new THREE.InstancedMesh(leafGeo, leafMat, count);
  const stems: THREE.Vector3[][] = [];
  const m = new THREE.Matrix4();
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const a = rnd() * Math.PI * 2;
    const h = range(rnd, 0.22, 0.48);
    const r = range(rnd, 0.02, 0.12);
    const base = new THREE.Vector3(Math.cos(a) * 0.02, 0.19, Math.sin(a) * 0.02);
    const tip = new THREE.Vector3(Math.cos(a) * r, h, Math.sin(a) * r);
    stems.push([base, base.clone().lerp(tip, 0.5).add(new THREE.Vector3(0, 0.03, 0)), tip]);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(range(rnd, -1.1, -0.4), -a + Math.PI / 2, 0, 'YXZ'));
    const sc = range(rnd, 0.7, 1.2);
    m.compose(tip, q, new THREE.Vector3(sc, sc, sc));
    leaves.setMatrixAt(i, m);
    leaves.setColorAt(i, c.setHSL(range(rnd, 0.25, 0.31), range(rnd, 0.45, 0.6), range(rnd, 0.22, 0.34)));
  }
  leaves.castShadow = true;
  leaves.receiveShadow = true;
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x4d6b2a, roughness: 0.7 });
  for (const st of stems) {
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(st), 12, 0.0025, 5), stemMat);
    tube.castShadow = true;
    g.add(tube);
  }
  g.add(leaves);
  g.position.set(-0.46, 0, -0.22);
  g.scale.setScalar(1.25);
  return g;
}

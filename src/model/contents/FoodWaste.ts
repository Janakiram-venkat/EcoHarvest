import * as THREE from 'three';
import { GRINDER, HOPPER, LID } from '../../config/dimensions';
import { mulberry32, pick, range } from '../../utils/rand';
import { smoothstep } from '../../utils/tween';
import type { PartContext } from '../context';

interface Piece {
  pos: THREE.Vector3;
  quat: THREE.Quaternion;
  scale: THREE.Vector3;
  u: number;
}

interface PieceKind {
  geo: THREE.BufferGeometry;
  colors: number[];
  weight: number;
}

/** Bends a flat XY geometry into a curled organic shape (leaf / peel). */
function curl(geo: THREE.BufferGeometry, k: number, twist: number): THREE.BufferGeometry {
  const p = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    p.setZ(i, k * x * x + twist * x * y + 0.6 * k * y * y);
  }
  geo.computeVertexNormals();
  return geo;
}

function leafGeometry(): THREE.BufferGeometry {
  const s = new THREE.Shape();
  const L = 0.036;
  const W = 0.013;
  s.moveTo(-L / 2, 0);
  s.bezierCurveTo(-L / 4, W, L / 4, W * 1.1, L / 2, 0);
  s.bezierCurveTo(L / 4, -W * 1.1, -L / 4, -W, -L / 2, 0);
  return curl(new THREE.ShapeGeometry(s, 10), 14, 9);
}

/** Wet, chopped kitchen waste heaped in the hopper (reference: carrot, greens, peppers, peels). */
export class FoodWaste extends THREE.Group {
  private readonly meshes: Array<{ mesh: THREE.InstancedMesh; pieces: Piece[] }> = [];
  private last = '';

  constructor(ctx: PartContext) {
    super();
    this.name = 'FoodWaste';
    const rnd = mulberry32(2024);
    const kinds: PieceKind[] = [
      { geo: new THREE.CylinderGeometry(0.0085, 0.0085, 0.0042, 18), colors: [0xe8742a, 0xf08a30, 0xd9631f], weight: 16 },
      { geo: new THREE.CylinderGeometry(0.0034, 0.0046, 0.03, 10), colors: [0xe87a2c, 0xf29a3c], weight: 9 },
      { geo: leafGeometry(), colors: [0x4f9a2f, 0x3d7f25, 0x6db33f, 0x2f6b22], weight: 22 },
      { geo: curl(new THREE.PlaneGeometry(0.032, 0.012, 8, 3), 22, 4), colors: [0xd8b65a, 0xc49a45, 0xe3d08a], weight: 10 },
      { geo: new THREE.SphereGeometry(0.0095, 14, 8, 0, Math.PI * 0.9), colors: [0xc8321e, 0xb52a18, 0xe0452a], weight: 8 },
      { geo: curl(new THREE.PlaneGeometry(0.03, 0.009, 8, 2), 30, 0), colors: [0xd23a1e, 0xf2b630, 0x5f9e2e], weight: 10 },
      { geo: new THREE.BoxGeometry(0.011, 0.009, 0.01, 2, 2, 2), colors: [0xe8d6a8, 0xf0e2bc], weight: 7 },
    ];
    const hw = HOPPER.width / 2 - 0.008;
    const hd = HOPPER.depth / 2 - 0.008;
    const yMin = GRINDER.shaft.y + 0.012;
    const top = (x: number, dz: number): number =>
      0.396 + 0.022 * Math.max(0, 1 - (x / hw) ** 2) * Math.max(0, 1 - (dz / hd) ** 2);
    const yMax = top(0, 0);

    for (const kind of kinds) {
      const pieces: Piece[] = [];
      for (let i = 0; i < kind.weight; i++) {
        const x = range(rnd, -hw, hw);
        const dz = range(rnd, -hd, hd);
        const y = range(rnd, yMin, top(x, dz));
        const e = new THREE.Euler(range(rnd, 0, Math.PI * 2), range(rnd, 0, Math.PI * 2), range(rnd, 0, Math.PI * 2));
        const s = range(rnd, 0.8, 1.2);
        pieces.push({
          pos: new THREE.Vector3(x, y, LID.centerZ + dz),
          quat: new THREE.Quaternion().setFromEuler(e),
          scale: new THREE.Vector3(s, s, s),
          u: 0.06 + 0.88 * THREE.MathUtils.clamp((y - yMin) / (yMax - yMin) * 0.8 + rnd() * 0.2, 0, 1),
        });
      }
      const m = new THREE.InstancedMesh(kind.geo, ctx.mats.wetFood, pieces.length);
      m.name = 'FoodPieces';
      m.castShadow = true;
      m.receiveShadow = true;
      const c = new THREE.Color();
      pieces.forEach((_, i) => m.setColorAt(i, c.set(pick(rnd, kind.colors)).offsetHSL(0, 0, range(rnd, -0.05, 0.04))));
      this.meshes.push({ mesh: m, pieces });
      this.add(m);
    }
    (ctx.mats.wetFood as THREE.MeshPhysicalMaterial).side = THREE.DoubleSide;
    this.setAmount(1, 'grinding');
  }

  /** amount ∈ [0,1]; 'loading' drops pieces in from above, 'grinding' shrinks them into the blades. */
  setAmount(amount: number, phase: 'loading' | 'grinding'): void {
    const key = `${amount.toFixed(3)}${phase}`;
    if (key === this.last) return;
    this.last = key;
    const m4 = new THREE.Matrix4();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    for (const { mesh, pieces } of this.meshes) {
      pieces.forEach((pc, i) => {
        const f = smoothstep(pc.u - 0.06, pc.u + 0.06, amount);
        p.copy(pc.pos);
        s.copy(pc.scale);
        if (phase === 'loading') {
          p.y += (1 - f) * 0.22;
          s.multiplyScalar(f > 0.001 ? 1 : 0);
        } else {
          p.y -= (1 - f) * 0.02;
          s.multiplyScalar(f);
        }
        mesh.setMatrixAt(i, m4.compose(p, pc.quat, s));
      });
      mesh.instanceMatrix.needsUpdate = true;
    }
  }
}

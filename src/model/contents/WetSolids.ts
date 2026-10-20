import * as THREE from 'three';
import { BASKET } from '../../config/dimensions';
import { mulberry32, pick, range } from '../../utils/rand';
import { smoothstep } from '../../utils/tween';
import type { PartContext } from '../context';

/** Ground, still-wet solids sitting on the louvre floor of basket C. */
export class WetSolids extends THREE.Group {
  private readonly mesh: THREE.InstancedMesh;
  private readonly base: Array<{ m: THREE.Matrix4; u: number; pos: THREE.Vector3; q: THREE.Quaternion; s: THREE.Vector3 }> = [];
  private last = -1;

  constructor(ctx: PartContext, count = 280) {
    super();
    this.name = 'WetSolids';
    const rnd = mulberry32(77);
    const geo = new THREE.IcosahedronGeometry(0.0032, 0);
    this.mesh = new THREE.InstancedMesh(geo, ctx.mats.wetFood, count);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    const colors = [0x5c8f2b, 0x7aa83a, 0xd9792b, 0xc9a23a, 0x8c5a2b, 0xa83a22, 0xd8c089];
    const bottom = BASKET.topY - BASKET.height + 0.003;
    const hw = BASKET.width / 2 - 0.006;
    const hd = BASKET.depth / 2 - 0.006;
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const x = range(rnd, -hw, hw);
      const dz = range(rnd, -hd, hd);
      const heap = 0.018 * (1 - (x / hw) ** 2 * 0.6) * (1 - (dz / hd) ** 2 * 0.6);
      const y = bottom + rnd() * heap;
      const pos = new THREE.Vector3(x, y, BASKET.centerZ + dz);
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd() * 6.3, rnd() * 6.3, rnd() * 6.3));
      const s = new THREE.Vector3(range(rnd, 0.6, 1.5), range(rnd, 0.5, 1.1), range(rnd, 0.6, 1.4));
      this.base.push({ m: new THREE.Matrix4(), u: (y - bottom) / 0.018, pos, q, s });
      this.mesh.setColorAt(i, c.set(pick(rnd, colors)).offsetHSL(0, -0.1, range(rnd, -0.12, 0)));
    }
    this.base.sort((a, b) => a.u - b.u);
    this.add(this.mesh);
    this.setAmount(0);
  }

  setAmount(a: number): void {
    if (Math.abs(a - this.last) < 0.002) return;
    this.last = a;
    const s = new THREE.Vector3();
    this.base.forEach((b, i) => {
      const f = smoothstep(b.u * 0.9, b.u * 0.9 + 0.1, a);
      s.copy(b.s).multiplyScalar(f);
      this.mesh.setMatrixAt(i, b.m.compose(b.pos, b.q, s));
    });
    this.mesh.instanceMatrix.needsUpdate = true;
    this.visible = a > 0.005;
  }
}

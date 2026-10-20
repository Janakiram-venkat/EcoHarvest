import * as THREE from 'three';
import { DRYER } from '../../config/dimensions';
import { MAX_GRANULES } from '../../config/quality';
import { mulberry32, range } from '../../utils/rand';
import type { PartContext } from '../context';

const MOIST = [0x6f9a2c, 0x8fae3a, 0xd08a2e, 0xc9a83c, 0xb8762a, 0x9a8a3a, 0xd9b45a];
const DRY = [0x5a3a22, 0x4a2e1a, 0x6b4a2f, 0x3e2615, 0x7a5636];

/** Instanced granular bed in the drying dish; colour lerps moist → dry, volume shrinks with load. */
export class Granules extends THREE.Group {
  readonly bed = new THREE.Group();
  private readonly mesh: THREE.InstancedMesh;
  private readonly items: Array<{ pos: THREE.Vector3; q: THREE.Quaternion; s: number; moist: THREE.Color; dry: THREE.Color }> = [];
  private maxActive = MAX_GRANULES;
  private lastDry = -1;
  private lastScale = -1;

  constructor(ctx: PartContext) {
    super();
    this.name = 'Granules';
    this.bed.position.set(0, 0, DRYER.centerZ);
    this.add(this.bed);
    const rnd = mulberry32(555);
    const geo = new THREE.DodecahedronGeometry(0.0029, 0);
    this.mesh = new THREE.InstancedMesh(geo, ctx.mats.granules, MAX_GRANULES);
    this.mesh.name = 'GranuleBed';
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    const R = DRYER.dishRadius - 0.006;
    for (let i = 0; i < MAX_GRANULES; i++) {
      const r = Math.sqrt(range(rnd, 0.01, 1)) * R;
      const a = rnd() * Math.PI * 2;
      const layer = 0.004 + 0.02 * (1 - (r / R) ** 3);
      const y = DRYER.discY + 0.002 + rnd() * layer;
      this.items.push({
        pos: new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r),
        q: new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd() * 6.3, rnd() * 6.3, rnd() * 6.3)),
        s: range(rnd, 0.7, 1.35),
        moist: new THREE.Color(MOIST[Math.floor(rnd() * MOIST.length)]).offsetHSL(0, 0, range(rnd, -0.08, 0.05)),
        dry: new THREE.Color(DRY[Math.floor(rnd() * DRY.length)]).offsetHSL(0, 0, range(rnd, -0.04, 0.04)),
      });
    }
    // Lowest first, so reducing the instance count removes material from the top of the heap.
    this.items.sort((p, q) => p.pos.y - q.pos.y);
    this.bed.add(this.mesh);
    this.set(0, 0, 0);
  }

  setQuality(maxActive: number): void {
    this.maxActive = Math.min(MAX_GRANULES, maxActive);
    this.lastScale = -1;
  }

  /** load ∈ [0,1] (bed volume), dryness ∈ [0,1], angle = bed rotation (stirring). */
  set(load: number, dryness: number, angle: number): void {
    this.bed.rotation.y = angle;
    const count = Math.round(this.maxActive * Math.min(1, load));
    this.mesh.count = count;
    this.visible = count > 0;
    const scale = 1 - 0.28 * dryness;
    if (Math.abs(scale - this.lastScale) > 0.004) {
      this.lastScale = scale;
      const m = new THREE.Matrix4();
      const v = new THREE.Vector3();
      // Spread the reduced-quality subset evenly across the heap.
      const step = MAX_GRANULES / this.maxActive;
      for (let i = 0; i < this.maxActive; i++) {
        const it = this.items[Math.min(MAX_GRANULES - 1, Math.floor(i * step))];
        v.setScalar(it.s * scale);
        this.mesh.setMatrixAt(i, m.compose(it.pos, it.q, v));
      }
      this.mesh.instanceMatrix.needsUpdate = true;
      this.lastDry = -1;
    }
    if (Math.abs(dryness - this.lastDry) > 0.006) {
      this.lastDry = dryness;
      const c = new THREE.Color();
      const step = MAX_GRANULES / this.maxActive;
      for (let i = 0; i < this.maxActive; i++) {
        const it = this.items[Math.min(MAX_GRANULES - 1, Math.floor(i * step))];
        this.mesh.setColorAt(i, c.copy(it.moist).lerp(it.dry, THREE.MathUtils.smoothstep(dryness, 0.05, 0.95)));
      }
      if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
      (this.mesh.material as THREE.MeshPhysicalMaterial).clearcoat = 0.6 * (1 - dryness);
      (this.mesh.material as THREE.MeshPhysicalMaterial).roughness = 0.45 + 0.5 * dryness;
    }
  }
}

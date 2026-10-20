import * as THREE from 'three';
import { TRAY } from '../../config/dimensions';
import { ValueNoise } from '../../textures/noise';
import { mulberry32, range } from '../../utils/rand';
import { metricPlane } from '../../utils/geometry';
import type { PartContext } from '../context';

/** Dry, fine dark-brown biomass in tray H: noise-displaced heightfield + instanced crumbs. Scales with load. */
export class Biomass extends THREE.Group {
  private readonly surface: THREE.Mesh;
  private readonly crumbs: THREE.InstancedMesh;
  private readonly crumbData: Array<{ x: number; z: number; h: number; q: THREE.Quaternion; s: number }> = [];
  private readonly heightAt: (x: number, z: number) => number;
  private last = -1;

  constructor(ctx: PartContext) {
    super();
    this.name = 'Biomass';
    const w = TRAY.width - 2 * TRAY.wall - 0.002;
    const d = TRAY.depth - 2 * TRAY.wall - 0.002;
    const n = new ValueNoise(808);
    this.heightAt = (x: number, z: number): number => {
      const ex = Math.max(0, 1 - Math.pow(Math.abs(x) / (w / 2), 4));
      const ez = Math.max(0, 1 - Math.pow(Math.abs(z) / (d / 2), 4));
      const mound = 0.006 + 0.026 * Math.pow(ex * ez, 0.6);
      const u = x / w + 0.5;
      const v = z / d + 0.5;
      const lumps = (n.fbm(u, v, 6, 7, 4) - 0.5) * 0.007 + (n.noise(u * 60, v * 70, 60, 70) - 0.5) * 0.0018;
      return Math.max(0.001, (mound + lumps) * Math.pow(ex * ez, 0.15));
    };
    const geo = metricPlane(w, d, 72, 84);
    geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) p.setY(i, this.heightAt(p.getX(i), p.getZ(i)));
    geo.computeVertexNormals();
    this.surface = new THREE.Mesh(geo, ctx.mats.biomass);
    this.surface.name = 'BiomassSurface';
    this.surface.receiveShadow = true;
    this.surface.castShadow = true;

    const rnd = mulberry32(31);
    const count = 900;
    this.crumbs = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.0018, 0), ctx.mats.crumbs, count);
    this.crumbs.name = 'BiomassCrumbs';
    this.crumbs.castShadow = true;
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const x = range(rnd, -w / 2 + 0.006, w / 2 - 0.006);
      const z = range(rnd, -d / 2 + 0.006, d / 2 - 0.006);
      this.crumbData.push({ x, z, h: this.heightAt(x, z), q: new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd() * 6, rnd() * 6, rnd() * 6)), s: range(rnd, 0.5, 1.8) });
      this.crumbs.setColorAt(i, c.set(rnd() > 0.85 ? 0x7a5636 : rnd() > 0.5 ? 0x3e2615 : 0x553521));
    }
    this.add(this.surface, this.crumbs);
    this.position.set(0, TRAY.bottomY + 0.003, TRAY.centerZ);
    this.setLoad(0);
  }

  setLoad(load: number): void {
    if (Math.abs(load - this.last) < 0.003) return;
    this.last = load;
    const l = Math.max(0.02, load);
    this.surface.scale.y = l;
    const m = new THREE.Matrix4();
    const v = new THREE.Vector3();
    const s = new THREE.Vector3();
    this.crumbData.forEach((cd, i) => {
      v.set(cd.x, cd.h * l + 0.0004, cd.z);
      s.setScalar(cd.s * Math.min(1, load * 3));
      this.crumbs.setMatrixAt(i, m.compose(v, cd.q, s));
    });
    this.crumbs.instanceMatrix.needsUpdate = true;
    this.visible = load > 0.01;
  }
}

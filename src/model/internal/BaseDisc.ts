import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { DISC, DRYER } from '../../config/dimensions';
import { mesh } from '../../utils/geometry';
import type { PartContext } from '../context';

/** Perforated stainless base disc separating E from the tray H, on a ring + spoke support. */
export function createBaseDisc(ctx: PartContext): THREE.Group {
  const g = new THREE.Group();
  g.name = 'BaseDisc';
  const r = DRYER.dishRadius;
  const geo = new THREE.CircleGeometry(r, 96);
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2 * r, uv.getY(i) * 2 * r);
  geo.rotateX(-Math.PI / 2);
  const disc = mesh(geo, ctx.mats.discMesh, 'PerforatedDisc');
  disc.position.set(0, DRYER.discY, DRYER.centerZ);

  const ring = mesh(new THREE.TorusGeometry(r - 0.002, 0.0022, 10, 96), ctx.mats.satin, 'DiscSupportRing');
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, DRYER.discY - 0.0025, DRYER.centerZ);

  const spokeGeo = new RoundedBoxGeometry(2 * r - 0.006, 0.003, 0.004, 2, 0.0008);
  for (let i = 0; i < 3; i++) {
    const s = mesh(spokeGeo, ctx.mats.satin, 'DiscSpoke');
    s.position.set(0, DISC.supportY + 0.003, DRYER.centerZ);
    s.rotation.y = (i / 3) * Math.PI;
    g.add(s);
  }
  const hub = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.005, 24), ctx.mats.satin, 'DiscHub');
  hub.position.set(0, DRYER.discY - 0.0025, DRYER.centerZ);
  g.add(disc, ring, hub);
  return g;
}

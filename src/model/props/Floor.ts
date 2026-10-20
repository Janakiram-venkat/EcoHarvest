import * as THREE from 'three';
import { BODY } from '../../config/dimensions';
import { metricPlane } from '../../utils/geometry';
import type { PartContext } from '../context';

/** Matte concrete floor, soft grey wall and a contact-shadow blob under the unit. */
export function createFloor(ctx: PartContext): { floor: THREE.Group; contactShadow: THREE.Mesh } {
  const g = new THREE.Group();
  g.name = 'Floor';
  const c = ctx.tex.concrete;
  const floorMat = new THREE.MeshStandardMaterial({
    map: c.map,
    normalMap: c.normal,
    normalScale: new THREE.Vector2(0.35, 0.35),
    roughnessMap: c.roughness,
    roughness: 1,
    envMapIntensity: 0.6,
  });
  const floor = new THREE.Mesh(metricPlane(8, 8), floorMat);
  floor.name = 'ConcreteFloor';
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;

  const p = ctx.tex.plaster;
  const wallMat = new THREE.MeshStandardMaterial({
    map: p.map,
    normalMap: p.normal,
    normalScale: new THREE.Vector2(0.5, 0.5),
    roughness: 0.92,
    envMapIntensity: 0.5,
  });
  const wall = new THREE.Mesh(metricPlane(8, 3.2), wallMat);
  wall.name = 'Wall';
  wall.position.set(0, 1.6, -0.75);
  wall.receiveShadow = true;
  g.add(floor, wall);

  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(BODY.width * 1.9, BODY.depth * 1.9),
    new THREE.MeshBasicMaterial({ map: ctx.tex.softShadow, transparent: true, opacity: 0.55, depthWrite: false, color: 0x000000 }),
  );
  contactShadow.name = 'ContactShadow';
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.0006;
  contactShadow.renderOrder = 1;
  return { floor: g, contactShadow };
}

import * as THREE from 'three';
import { BODY } from '../../config/dimensions';
import { createBranding } from '../../textures/decals';
import { mesh } from '../../utils/geometry';

/** Printed logo + wordmark + tagline decal on a slightly offset plane (polygonOffset avoids z-fighting). */
export function createBrandingDecal(): THREE.Mesh {
  const b = createBranding();
  const mat = new THREE.MeshPhysicalMaterial({
    name: 'BrandingInk',
    map: b.texture,
    transparent: true,
    roughness: 0.42,
    metalness: 0,
    clearcoat: 0.3,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
    depthWrite: false,
  });
  const m = mesh(new THREE.PlaneGeometry(b.width, b.height), mat, 'Branding', false, false);
  m.position.set(0, b.centerY, BODY.depth / 2 + 0.00008);
  return m;
}

import type * as THREE from 'three';
import type { ComponentId } from '../config/components';

/**
 * View-mode behaviour flags stored in Object3D.userData.
 * - cutaway: 'hide'  → removed in Cutaway view (front panels, chamber front walls …)
 * - exterior: 'hide' → hidden in Exterior / Lid-open views (detachable outlet spout & container)
 * - exterior: 'only' → visible only in Exterior / Lid-open views (outlet blanking plug)
 * - xray: 'ghost'    → becomes a Fresnel ghost in X-ray view
 * - alwaysVisible    → internal part that stays visible in exterior views (chimney)
 * - component        → A–H id for labels / picking
 */
export interface PartTags {
  cutaway?: 'hide';
  exterior?: 'hide' | 'only';
  xray?: 'ghost';
  alwaysVisible?: boolean;
  component?: ComponentId;
}

export function tag<T extends THREE.Object3D>(o: T, t: PartTags): T {
  Object.assign(o.userData, t);
  return o;
}

export function tags(o: THREE.Object3D): PartTags {
  return o.userData as PartTags;
}

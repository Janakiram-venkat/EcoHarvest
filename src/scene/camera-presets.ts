import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ease, type Tweens } from '../utils/tween';

export type ViewMode = 'exterior' | 'lid' | 'cutaway' | 'xray' | 'exploded';

export interface CameraPreset {
  position: [number, number, number];
  target: [number, number, number];
}

/** Camera presets; `exterior` and `cutaway` reproduce the left and right halves of the reference render. */
export const PRESETS: Record<ViewMode, CameraPreset> = {
  exterior: { position: [0.52, 0.47, 1.08], target: [0.02, 0.225, 0] },
  lid: { position: [0.5, 0.8, 1.02], target: [0.01, 0.27, 0] },
  cutaway: { position: [0.17, 0.44, 1.28], target: [0.06, 0.245, 0.03] },
  xray: { position: [-0.62, 0.52, 0.92], target: [0, 0.23, 0] },
  exploded: { position: [0.95, 0.72, 1.3], target: [0.02, 0.27, 0] },
};

export function flyTo(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  tweens: Tweens,
  to: CameraPreset,
  duration = 1.3,
): void {
  const p0 = camera.position.clone();
  const t0 = controls.target.clone();
  const p1 = new THREE.Vector3(...to.position);
  const t1 = new THREE.Vector3(...to.target);
  tweens.add(
    duration,
    (k) => {
      camera.position.lerpVectors(p0, p1, k);
      controls.target.lerpVectors(t0, t1, k);
      controls.update();
    },
    ease.inOutCubic,
  );
}

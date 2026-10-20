import * as THREE from 'three';

export interface LightRig {
  key: THREE.DirectionalLight;
  fill: THREE.DirectionalLight;
  rim: THREE.DirectionalLight;
  setShadowMapSize(size: number): void;
}

/** Warm 4500 K key from front-left (only shadow caster), cool fill from right, rim from rear. */
export function createLights(scene: THREE.Scene): LightRig {
  const key = new THREE.DirectionalLight(0xffdbba, 1.7);
  key.name = 'KeyLight4500K';
  key.position.set(-1.1, 1.7, 1.35);
  key.target.position.set(0, 0.2, 0);
  key.castShadow = true;
  const cam = key.shadow.camera;
  cam.left = -0.75;
  cam.right = 0.75;
  cam.top = 0.75;
  cam.bottom = -0.75;
  cam.near = 0.5;
  cam.far = 4.5;
  key.shadow.bias = -0.00025;
  key.shadow.normalBias = 0.0025;
  key.shadow.radius = 4;
  key.shadow.mapSize.set(2048, 2048);

  const fill = new THREE.DirectionalLight(0xcfe0ff, 0.9);
  fill.name = 'FillLight';
  fill.position.set(1.6, 0.8, 0.7);
  const rim = new THREE.DirectionalLight(0xffffff, 1.5);
  rim.name = 'RimLight';
  rim.position.set(0.35, 1.3, -1.7);
  const hemi = new THREE.HemisphereLight(0xf2f4f7, 0x2d2a26, 0.18);

  scene.add(key, key.target, fill, rim, hemi);
  return {
    key,
    fill,
    rim,
    setShadowMapSize(size: number) {
      key.shadow.mapSize.set(size, size);
      key.shadow.map?.dispose();
      key.shadow.map = null;
    },
  };
}

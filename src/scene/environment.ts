import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

/** CC0 studio HDRI from Poly Haven (see docs/ASSETS.md). Optional; RoomEnvironment is the default. */
export const STUDIO_HDRI_URL = 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr';

export class Environment {
  private readonly pmrem: THREE.PMREMGenerator;
  private readonly room: THREE.Texture;
  private hdri: THREE.Texture | null = null;
  private readonly backdrop: THREE.Texture;

  constructor(
    renderer: THREE.WebGLRenderer,
    private readonly scene: THREE.Scene,
  ) {
    this.pmrem = new THREE.PMREMGenerator(renderer);
    this.room = this.pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = this.room;
    scene.environmentIntensity = 1.0;
    const c = document.createElement('canvas');
    c.width = 4;
    c.height = 256;
    const ctx = c.getContext('2d') as CanvasRenderingContext2D;
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#5d6064');
    g.addColorStop(0.6, '#3b3d40');
    g.addColorStop(1, '#232426');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
    this.backdrop = new THREE.CanvasTexture(c);
    this.backdrop.colorSpace = THREE.SRGBColorSpace;
    scene.background = this.backdrop;
  }

  async useHdri(on: boolean): Promise<void> {
    if (!on) {
      this.scene.environment = this.room;
      return;
    }
    if (!this.hdri) {
      try {
        const tex = await new RGBELoader().loadAsync(STUDIO_HDRI_URL);
        this.hdri = this.pmrem.fromEquirectangular(tex).texture;
        tex.dispose();
      } catch (err) {
        console.warn('[EcoHarvest] HDRI unavailable, keeping RoomEnvironment', err);
        return;
      }
    }
    this.scene.environment = this.hdri;
  }

  dispose(): void {
    this.room.dispose();
    this.hdri?.dispose();
    this.backdrop.dispose();
    this.pmrem.dispose();
  }
}

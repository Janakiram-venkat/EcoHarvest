import type { Materials } from '../config/materials';
import type { TextureSet } from '../textures';

export interface PartContext {
  mats: Materials;
  tex: TextureSet;
}

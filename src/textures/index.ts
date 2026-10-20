import type * as THREE from 'three';
import { BASKET, DISC } from '../config/dimensions';
import { createBrushed, createSatinWear } from './brushed';
import {
  createBladeBlur,
  createGraduations,
  createPcb,
  createRatingLabel,
  createSoftShadow,
  createSprite,
} from './decals';
import { createPerforation } from './perforation';
import { createBiomass, createCarbon, createConcrete, createPlaster, createSoil, type SurfaceMaps } from './surfaces';

export interface TextureSet {
  brushedNormal: THREE.CanvasTexture;
  brushedRoughness: THREE.CanvasTexture;
  satinWear: THREE.CanvasTexture;
  basketPerforation: THREE.CanvasTexture;
  discPerforation: THREE.CanvasTexture;
  biomass: SurfaceMaps;
  concrete: SurfaceMaps;
  plaster: SurfaceMaps;
  soil: THREE.CanvasTexture;
  carbon: THREE.CanvasTexture;
  softShadow: THREE.CanvasTexture;
  sprite: THREE.CanvasTexture;
  bladeBlur: THREE.CanvasTexture;
  pcb: THREE.CanvasTexture;
  rating: THREE.CanvasTexture;
  graduations: THREE.CanvasTexture;
}

export function createTextures(maxAnisotropy: number): TextureSet {
  const brushed = createBrushed();
  // Metric UVs: brushed tile = 0.25 m.
  brushed.normal.repeat.set(4, 4);
  brushed.roughness.repeat.set(4, 4);
  const satinWear = createSatinWear();
  satinWear.repeat.set(5, 5);

  const basket = createPerforation(BASKET.hole.diameter, BASKET.hole.pitch, 4, 4, 128).texture;
  const disc = createPerforation(DISC.hole.diameter, DISC.hole.pitch, 4, 4, 128).texture;

  const biomass = createBiomass();
  [biomass.map, biomass.normal, biomass.roughness].forEach((t) => t.repeat.set(1 / 0.07, 1 / 0.07));
  const concrete = createConcrete();
  [concrete.map, concrete.normal, concrete.roughness].forEach((t) => t.repeat.set(1 / 1.3, 1 / 1.3));
  const plaster = createPlaster();
  [plaster.map, plaster.normal, plaster.roughness].forEach((t) => t.repeat.set(1 / 0.9, 1 / 0.9));
  const soil = createSoil();
  soil.repeat.set(1 / 0.08, 1 / 0.08);
  const carbon = createCarbon();

  const set: TextureSet = {
    brushedNormal: brushed.normal,
    brushedRoughness: brushed.roughness,
    satinWear,
    basketPerforation: basket,
    discPerforation: disc,
    biomass,
    concrete,
    plaster,
    soil,
    carbon,
    softShadow: createSoftShadow(),
    sprite: createSprite(),
    bladeBlur: createBladeBlur(),
    pcb: createPcb(),
    rating: createRatingLabel(),
    graduations: createGraduations(),
  };
  for (const v of Object.values(set)) {
    const list = 'map' in v ? [v.map, v.normal, v.roughness] : [v];
    list.forEach((t: THREE.Texture) => (t.anisotropy = maxAnisotropy));
  }
  return set;
}

import * as THREE from 'three';
import type { TextureSet } from '../textures';

/** Palette from CLAUDE.md §6 (plus a few supporting colours). */
export const PALETTE = {
  brushed: 0xc9cccf,
  polished: 0xd6d9dc,
  satin: 0xb8bcc0,
  blackPlastic: 0x141516,
  smokedLid: 0x2a2c2e,
  lidLiner: 0x6e7175,
  lime: 0x7cc242,
  logoGreen: 0x2e6b2f,
  displayGlass: 0x050708,
  rubber: 0x1a1a1a,
  tray: 0x3b3d40,
  clear: 0xffffff,
  liquid: 0x8a5a1e,
  liquidAttenuation: 0x6b3a0f,
  biomass: 0x4a2e1a,
  quartz: 0xffffff,
  filament: 0xff6a1a,
  uiGreen: 0x43c463,
  ceramic: 0xefebe4,
  coil: 0x4d3f38,
  coilGlow: 0xff3d12,
  painted: 0x2c2f33,
  copper: 0xb87333,
  pcb: 0x1d5c3a,
  chip: 0x111214,
  carbon: 0x1b1c1d,
} as const;

export interface Materials {
  brushed: THREE.MeshPhysicalMaterial;
  polished: THREE.MeshPhysicalMaterial;
  satin: THREE.MeshPhysicalMaterial;
  satinDouble: THREE.MeshPhysicalMaterial;
  blackPlastic: THREE.MeshPhysicalMaterial;
  hopperPlastic: THREE.MeshPhysicalMaterial;
  smokedLid: THREE.MeshPhysicalMaterial;
  lidLiner: THREE.MeshPhysicalMaterial;
  lime: THREE.MeshPhysicalMaterial;
  limeGlow: THREE.MeshStandardMaterial;
  displayBezel: THREE.MeshPhysicalMaterial;
  glassOverlay: THREE.MeshPhysicalMaterial;
  rubber: THREE.MeshStandardMaterial;
  buttonCap: THREE.MeshPhysicalMaterial;
  tray: THREE.MeshPhysicalMaterial;
  clear: THREE.MeshPhysicalMaterial;
  liquid: THREE.MeshPhysicalMaterial;
  biomass: THREE.MeshStandardMaterial;
  crumbs: THREE.MeshStandardMaterial;
  quartz: THREE.MeshPhysicalMaterial;
  filament: THREE.MeshStandardMaterial;
  ceramic: THREE.MeshStandardMaterial;
  reflector: THREE.MeshPhysicalMaterial;
  coil: THREE.MeshStandardMaterial;
  painted: THREE.MeshPhysicalMaterial;
  copper: THREE.MeshStandardMaterial;
  pcb: THREE.MeshStandardMaterial;
  chip: THREE.MeshStandardMaterial;
  carbon: THREE.MeshStandardMaterial;
  basketMesh: THREE.MeshPhysicalMaterial;
  discMesh: THREE.MeshPhysicalMaterial;
  granules: THREE.MeshPhysicalMaterial;
  wetFood: THREE.MeshPhysicalMaterial;
  wires: Record<'red' | 'black' | 'blue' | 'white', THREE.MeshPhysicalMaterial>;
  tie: THREE.MeshStandardMaterial;
  label: THREE.MeshStandardMaterial;
}

export function createMaterials(tex: TextureSet): Materials {
  const phys = (p: THREE.MeshPhysicalMaterialParameters): THREE.MeshPhysicalMaterial => new THREE.MeshPhysicalMaterial(p);
  const std = (p: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial => new THREE.MeshStandardMaterial(p);

  const brushed = phys({
    name: 'BrushedStainless',
    color: PALETTE.brushed,
    metalness: 1,
    roughness: 0.32,
    anisotropy: 0.8,
    anisotropyRotation: Math.PI / 2,
    normalMap: tex.brushedNormal,
    normalScale: new THREE.Vector2(0.18, 0.18),
    roughnessMap: tex.brushedRoughness,
  });

  const satin = phys({
    name: 'SatinStainless',
    color: PALETTE.satin,
    metalness: 1,
    roughness: 0.28,
    roughnessMap: tex.satinWear,
    anisotropy: 0.3,
  });
  const satinDouble = satin.clone();
  satinDouble.side = THREE.DoubleSide;

  const perforated = (alpha: THREE.Texture, color: number, rough: number): THREE.MeshPhysicalMaterial =>
    phys({
      color,
      metalness: 1,
      roughness: rough,
      alphaMap: alpha,
      alphaTest: 0.5,
      alphaToCoverage: true,
      side: THREE.DoubleSide,
    });

  const wire = (c: number): THREE.MeshPhysicalMaterial =>
    phys({ color: c, roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.3 });

  return {
    brushed,
    polished: phys({ name: 'PolishedStainless', color: PALETTE.polished, metalness: 1, roughness: 0.12 }),
    satin,
    satinDouble,
    blackPlastic: phys({
      name: 'BlackPlastic',
      color: PALETTE.blackPlastic,
      metalness: 0,
      roughness: 0.35,
      clearcoat: 0.3,
      clearcoatRoughness: 0.25,
    }),
    hopperPlastic: phys({ color: 0x18191a, roughness: 0.55, side: THREE.DoubleSide }),
    smokedLid: phys({
      name: 'SmokedLid',
      color: PALETTE.smokedLid,
      metalness: 0,
      roughness: 0.18,
      clearcoat: 0.8,
      clearcoatRoughness: 0.08,
    }),
    lidLiner: phys({ color: PALETTE.lidLiner, roughness: 0.5, metalness: 0.1 }),
    lime: phys({ name: 'LimeAccent', color: PALETTE.lime, roughness: 0.4, clearcoat: 0.2 }),
    limeGlow: std({ color: PALETTE.lime, emissive: PALETTE.lime, emissiveIntensity: 0.9, roughness: 0.3 }),
    displayBezel: phys({
      name: 'DisplayGlass',
      color: PALETTE.displayGlass,
      roughness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
    }),
    // Additive black glass: contributes only its specular reflection on top of the emissive screen.
    glassOverlay: phys({
      color: 0x000000,
      roughness: 0.02,
      metalness: 0,
      clearcoat: 1,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
    rubber: std({ name: 'Rubber', color: PALETTE.rubber, roughness: 0.7 }),
    buttonCap: phys({ color: 0x101112, roughness: 0.22, clearcoat: 0.9, clearcoatRoughness: 0.12 }),
    tray: phys({ name: 'DrawerTray', color: PALETTE.tray, metalness: 0.2, roughness: 0.45, clearcoat: 0.15 }),
    // Rendering note (A9): container uses specular-only transparency so the transmissive liquid behind it stays visible.
    clear: phys({
      name: 'ClearContainer',
      color: PALETTE.clear,
      roughness: 0.05,
      metalness: 0,
      ior: 1.49,
      transparent: true,
      opacity: 0.07,
      clearcoat: 1,
      specularIntensity: 0.6,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    liquid: phys({
      name: 'WasteLiquid',
      color: PALETTE.liquidAttenuation,
      roughness: 0.05,
      // (A9) opaque-ish translucent amber instead of transmission: reliable inside the transparent container.
      transparent: true,
      opacity: 0.88,
      clearcoat: 1,
      sheen: 0.3,
      sheenColor: new THREE.Color(PALETTE.liquidAttenuation),
    }),
    biomass: std({
      name: 'DryBiomass',
      color: 0xffffff,
      map: tex.biomass.map,
      normalMap: tex.biomass.normal,
      normalScale: new THREE.Vector2(1.4, 1.4),
      roughness: 0.95,
    }),
    crumbs: std({ color: PALETTE.biomass, roughness: 0.95 }),
    quartz: phys({
      name: 'IRQuartz',
      color: PALETTE.quartz,
      roughness: 0.1,
      transmission: 0.9,
      thickness: 0.001,
      ior: 1.46,
      emissive: PALETTE.filament,
      emissiveIntensity: 0,
    }),
    filament: std({ color: 0x3a2a22, emissive: PALETTE.filament, emissiveIntensity: 0, roughness: 0.5 }),
    ceramic: std({ color: PALETTE.ceramic, roughness: 0.55 }),
    reflector: phys({ color: 0xe8e2d8, metalness: 1, roughness: 0.06, side: THREE.DoubleSide }),
    coil: std({ color: PALETTE.coil, metalness: 0.7, roughness: 0.5, emissive: PALETTE.coilGlow, emissiveIntensity: 0 }),
    painted: phys({ color: PALETTE.painted, metalness: 0.3, roughness: 0.45, clearcoat: 0.3 }),
    copper: std({ color: PALETTE.copper, metalness: 1, roughness: 0.3 }),
    pcb: std({ map: tex.pcb, roughness: 0.55 }),
    chip: std({ color: PALETTE.chip, roughness: 0.4 }),
    carbon: std({ color: 0xffffff, map: tex.carbon, roughness: 0.95 }),
    basketMesh: perforated(tex.basketPerforation, PALETTE.polished, 0.18),
    discMesh: perforated(tex.discPerforation, PALETTE.satin, 0.3),
    granules: phys({ color: 0xffffff, roughness: 0.65, clearcoat: 0, clearcoatRoughness: 0.4 }),
    wetFood: phys({ color: 0xffffff, roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.15 }),
    wires: { red: wire(0xb3261e), black: wire(0x1c1c1e), blue: wire(0x1f4fa8), white: wire(0xe8e8e2) },
    tie: std({ color: 0x1a1a1a, roughness: 0.6 }),
    label: std({ map: tex.rating, roughness: 0.45, metalness: 0.2 }),
  };
}

/** Fresnel "ghost" material used by the X-ray view. */
export function createXrayMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(0x9fd8ff) }, uOpacity: { value: 0.15 } },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uOpacity;
      varying vec3 vN; varying vec3 vV;
      void main() {
        float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
        gl_FragColor = vec4(uColor * (0.6 + f), clamp(uOpacity + f * 0.55, 0.0, 1.0));
      }`,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

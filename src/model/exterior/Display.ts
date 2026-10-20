import * as THREE from 'three';
import { BODY, DISPLAY, FRONT, fracY } from '../../config/dimensions';
import { extrudeZ, mesh, roundedRectShape } from '../../utils/geometry';
import type { PartContext } from '../context';

export function displayCenterY(): number {
  return fracY(FRONT.bezelTopFrac) - DISPLAY.bezelHeight / 2;
}

/** Glossy black glass bezel + emissive UI screen (CanvasTexture) + additive reflection overlay. */
export function createDisplay(ctx: PartContext, screenTexture: THREE.Texture): THREE.Group {
  const g = new THREE.Group();
  g.name = 'Display';
  const cy = displayCenterY();
  const z0 = BODY.depth / 2;

  const bezel = mesh(
    extrudeZ(roundedRectShape(DISPLAY.bezelWidth, DISPLAY.bezelHeight, DISPLAY.bezelRadius, 0, cy), DISPLAY.bezelDepth, {
      bevel: DISPLAY.bezelBevel,
      bevelSegments: 5,
      curveSegments: 20,
      creaseAngle: Math.PI / 4,
    }),
    ctx.mats.displayBezel,
    'DisplayBezel',
  );
  bezel.position.z = z0 - 0.001;

  const screenMat = new THREE.MeshStandardMaterial({
    name: 'ScreenUI',
    color: 0x000000,
    emissive: 0xffffff,
    emissiveMap: screenTexture,
    emissiveIntensity: 1.35,
    roughness: 0.3,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const front = z0 - 0.001 + DISPLAY.bezelDepth;
  const screen = mesh(new THREE.PlaneGeometry(DISPLAY.screenWidth, DISPLAY.screenHeight), screenMat, 'Screen', false, false);
  screen.position.set(0, cy, front + 0.00005);

  const glassW = DISPLAY.bezelWidth - 2 * DISPLAY.bezelBevel;
  const glassH = DISPLAY.bezelHeight - 2 * DISPLAY.bezelBevel;
  const glass = mesh(
    new THREE.ShapeGeometry(roundedRectShape(glassW, glassH, DISPLAY.bezelRadius - DISPLAY.bezelBevel, 0, cy), 12),
    ctx.mats.glassOverlay,
    'CoverGlass',
    false,
    false,
  );
  glass.position.z = front + 0.0002;
  glass.renderOrder = 2;

  g.add(bezel, screen, glass);
  return g;
}

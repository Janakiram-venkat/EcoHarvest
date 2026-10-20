import * as THREE from 'three';
import { BODY, BUTTONS, DISPLAY } from '../../config/dimensions';
import { createButtonIcon, type IconKind } from '../../textures/decals';
import { arcPoints, lathe, mesh } from '../../utils/geometry';
import type { PartContext } from '../context';
import { displayCenterY } from './Display';

/** Three slightly domed black buttons with thin chrome rings and white line icons: power, Wi-Fi, gear. */
export function createButtons(ctx: PartContext): THREE.Group {
  const g = new THREE.Group();
  g.name = 'Buttons';
  const R = BUTTONS.diameter / 2;
  const ringIn = R - BUTTONS.ringWidth;
  const capR = ringIn - 0.0004;
  const h = BUTTONS.height;

  // Profiles are [radius, height-out-of-panel], ordered outside-bottom → top so lathe normals face outward;
  // lathe around Y then tip forward so Y → +Z.
  const ringGeo = lathe(
    [
      [R, 0],
      ...arcPoints(R - BUTTONS.ringWidth / 2, h * 0.55, BUTTONS.ringWidth / 2, 0, Math.PI, 6),
      [ringIn, 0],
    ],
    64,
  );
  const capGeo = lathe(
    [
      [capR, 0],
      ...arcPoints(capR - 0.002, h - 0.002, 0.002, 0, Math.PI / 2 - 0.05, 6),
      [capR * 0.55, h * 0.985],
      [0, h],
    ],
    64,
  );
  [ringGeo, capGeo].forEach((geo) => geo.rotateX(Math.PI / 2));

  const y = displayCenterY() - DISPLAY.bezelHeight / 2 - BUTTONS.belowBezel;
  const z0 = BODY.depth / 2;
  const kinds: IconKind[] = ['power', 'wifi', 'gear'];
  kinds.forEach((kind, i) => {
    const x = (i - 1) * BUTTONS.spacing;
    const ring = mesh(ringGeo, ctx.mats.polished, `ButtonRing_${kind}`);
    const cap = mesh(capGeo, ctx.mats.buttonCap, `Button_${kind}`);
    const iconMat = new THREE.MeshStandardMaterial({
      map: createButtonIcon(kind),
      transparent: true,
      roughness: 0.3,
      emissive: 0xffffff,
      emissiveIntensity: 0.15,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      depthWrite: false,
    });
    const icon = mesh(new THREE.PlaneGeometry(BUTTONS.iconSize, BUTTONS.iconSize), iconMat, `Icon_${kind}`, false, false);
    icon.position.set(x, y, z0 + h + 0.00012);
    ring.position.set(x, y, z0);
    cap.position.set(x, y, z0);
    g.add(ring, cap, icon);
  });
  return g;
}

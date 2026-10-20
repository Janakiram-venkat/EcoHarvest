import * as THREE from 'three';
import { BODY, REAR } from '../../config/dimensions';
import { extrudeZ, mesh, roundedRectShape } from '../../utils/geometry';
import type { PartContext } from '../context';

/** Rear details: IEC C14-style power inlet and rating label. */
export function createRear(ctx: PartContext): THREE.Group {
  const g = new THREE.Group();
  g.name = 'Rear';
  const zBack = -BODY.depth / 2;
  const I = REAR.inlet;

  // Inlet housing, built facing +Z then turned to face the rear.
  const inlet = new THREE.Group();
  inlet.name = 'PowerInlet';
  const housing = mesh(
    extrudeZ(roundedRectShape(I.width, I.height, 0.003), I.depth, { bevel: 0.001, bevelSegments: 2 }),
    ctx.mats.blackPlastic,
    'InletHousing',
  );
  const socketShape = new THREE.Shape();
  const sw = I.width * 0.62;
  const sh = I.height * 0.58;
  socketShape.moveTo(-sw / 2, -sh / 2);
  socketShape.lineTo(sw / 2, -sh / 2);
  socketShape.lineTo(sw / 2, sh * 0.22);
  socketShape.lineTo(sw * 0.3, sh / 2);
  socketShape.lineTo(-sw * 0.3, sh / 2);
  socketShape.lineTo(-sw / 2, sh * 0.22);
  const socket = mesh(new THREE.ShapeGeometry(socketShape), new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9 }), 'InletSocket');
  socket.position.z = I.depth + 0.0002;
  const pinGeo = new THREE.BoxGeometry(0.0012, 0.0035, 0.004);
  for (const [px, py] of [
    [-0.004, -0.001],
    [0.004, -0.001],
    [0, 0.0035],
  ]) {
    const pin = mesh(pinGeo, ctx.mats.polished, 'InletPin');
    pin.position.set(px, py, I.depth - 0.001);
    inlet.add(pin);
  }
  inlet.add(housing, socket);
  inlet.rotation.y = Math.PI;
  inlet.position.set(I.x, I.y, zBack + 0.0005);

  const L = REAR.label;
  const label = mesh(new THREE.PlaneGeometry(L.width, L.height), ctx.mats.label, 'RatingLabel', false, true);
  label.rotation.y = Math.PI;
  label.position.set(L.x, L.y, zBack - 0.0002);
  (label.material as THREE.MeshStandardMaterial).polygonOffset = true;
  (label.material as THREE.MeshStandardMaterial).polygonOffsetFactor = -1;

  g.add(inlet, label);
  return g;
}

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { arcPoints, lathe, mesh } from '../../utils/geometry';
import type { PartContext } from '../context';

/** Small DC motor, axis along +X starting at x = 0 (mounting flange) and ending at x = length. */
export function createMotor(ctx: PartContext, radius: number, length: number, name: string): THREE.Group {
  const g = new THREE.Group();
  g.name = name;
  const can = lathe(
    [
      [0, 0],
      ...arcPoints(radius - 0.0015, 0.0015, 0.0015, -Math.PI / 2, 0, 3),
      ...arcPoints(radius - 0.002, length - 0.002, 0.002, 0, Math.PI / 2, 4),
      [radius * 0.35, length],
      [radius * 0.32, length + 0.002],
      [0, length + 0.002],
    ],
    48,
  );
  can.rotateZ(-Math.PI / 2);
  g.add(mesh(can, ctx.mats.satin, `${name}_Can`));

  const ribGeo = new THREE.TorusGeometry(radius + 0.0004, 0.0006, 6, 48);
  ribGeo.rotateY(Math.PI / 2);
  for (let i = 1; i <= 5; i++) {
    const rib = mesh(ribGeo, ctx.mats.satin, 'CoolingRib');
    rib.position.x = (length * i) / 6;
    g.add(rib);
  }
  const band = mesh(new THREE.CylinderGeometry(radius + 0.0003, radius + 0.0003, length * 0.28, 48, 1, true), ctx.mats.painted, 'MotorBand');
  band.rotation.z = Math.PI / 2;
  band.position.x = length * 0.5;
  g.add(band);

  const flange = mesh(new RoundedBoxGeometry(0.003, radius * 2.3, radius * 2.3, 2, 0.001), ctx.mats.satin, 'MotorFlange');
  flange.position.x = 0.0015;
  const box = mesh(new RoundedBoxGeometry(length * 0.5, radius * 0.5, radius * 0.8, 2, 0.001), ctx.mats.blackPlastic, 'TerminalBox');
  box.position.set(length * 0.55, radius + radius * 0.2, 0);
  g.add(flange, box);
  return g;
}

/** Vertical gear-motor (paddle drive): output shaft points down; spans y ∈ [0, height]. */
export function createGearMotor(ctx: PartContext, radius: number, height: number, name: string): THREE.Group {
  const g = new THREE.Group();
  g.name = name;
  const gear = height * 0.32;
  const body = lathe(
    [
      [0, 0],
      [radius * 1.05, 0],
      [radius * 1.08, 0.001],
      [radius * 1.08, gear],
      [radius, gear + 0.001],
      ...arcPoints(radius - 0.003, height - 0.003, 0.003, 0, Math.PI / 2, 4),
      [0, height],
    ],
    48,
  );
  const gearbox = mesh(body, ctx.mats.satin, `${name}_Body`);
  const collar = mesh(new THREE.CylinderGeometry(radius * 1.1, radius * 1.1, 0.002, 48), ctx.mats.painted, 'GearboxSeam');
  collar.position.y = gear;
  g.add(gearbox, collar);
  return g;
}

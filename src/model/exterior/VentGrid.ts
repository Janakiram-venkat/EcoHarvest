import * as THREE from 'three';
import { SHELL, VENT } from '../../config/dimensions';
import { circlePath } from '../../utils/geometry';

/**
 * Staggered Ø2 mm vent perforation on the lower-front of the right panel.
 * Returned as hole paths in right-panel shape space (shape.x = world Z, shape.y = world Y − SHELL.y).
 */
export function ventHolePaths(): THREE.Path[] {
  const holes: THREE.Path[] = [];
  const r = VENT.holeDiameter / 2;
  const w = (VENT.cols - 1) * VENT.pitch;
  const h = (VENT.rows - 1) * VENT.pitch;
  for (let j = 0; j < VENT.rows; j++) {
    const stagger = j % 2 === 0 ? 0 : VENT.pitch / 2;
    const cols = j % 2 === 0 ? VENT.cols : VENT.cols - 1;
    for (let i = 0; i < cols; i++) {
      const z = VENT.centerZ - w / 2 + i * VENT.pitch + stagger;
      const y = VENT.centerY - h / 2 + j * VENT.pitch - SHELL.y;
      holes.push(circlePath(r, z, y));
    }
  }
  return holes;
}

/** Dark backing behind the vent holes so the grid reads as perforation, not as see-through. */
export function createVentBacking(material: THREE.Material): THREE.Mesh {
  const w = VENT.cols * VENT.pitch + 0.006;
  const h = VENT.rows * VENT.pitch + 0.006;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  m.name = 'VentBacking';
  m.rotation.y = Math.PI / 2;
  m.position.set(0, VENT.centerY, VENT.centerZ);
  return m;
}

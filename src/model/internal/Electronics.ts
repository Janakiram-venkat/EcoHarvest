import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { PCB } from '../../config/dimensions';
import { mesh } from '../../utils/geometry';
import { mulberry32 } from '../../utils/rand';
import { tag } from '../../utils/tags';
import type { PartContext } from '../context';

/** Control PCB with Wi-Fi module behind the display (removed with the front panel in Cutaway; shown in X-ray). */
export function createElectronics(ctx: PartContext): THREE.Group {
  const g = new THREE.Group();
  g.name = 'Electronics';
  tag(g, { cutaway: 'hide' });
  const zb = PCB.z;
  const board = mesh(new RoundedBoxGeometry(PCB.width, PCB.height, PCB.thickness, 2, 0.0005), ctx.mats.pcb, 'ControlPCB');
  board.position.set(0, PCB.centerY, zb);
  board.rotation.y = Math.PI; // components face the interior (−Z)
  g.add(board);

  const back = zb - PCB.thickness / 2;
  const rnd = mulberry32(8);
  const chips: Array<[number, number, number, number, number]> = [
    [0.022, 0.022, 0.0025, -0.02, 0.01],
    [0.012, 0.008, 0.0016, 0.022, 0.026],
    [0.01, 0.01, 0.0018, 0.03, -0.015],
    [0.014, 0.006, 0.0016, -0.035, -0.03],
  ];
  for (const [w, h, d, x, y] of chips) {
    const c = mesh(new RoundedBoxGeometry(w, h, d, 1, 0.0003), ctx.mats.chip, 'IC');
    c.position.set(x, PCB.centerY + y, back - d / 2);
    g.add(c);
  }
  // Wi-Fi module: shielded can on a carrier board with PCB antenna.
  const carrier = mesh(new RoundedBoxGeometry(0.018, 0.026, 0.001, 1, 0.0002), ctx.mats.pcb, 'WiFiCarrier');
  carrier.position.set(0.035, PCB.centerY + 0.02, back - 0.0005);
  const can = mesh(new RoundedBoxGeometry(0.016, 0.017, 0.0026, 2, 0.0004), ctx.mats.polished, 'WiFiShield');
  can.position.set(0.035, PCB.centerY + 0.016, back - 0.0023);
  const ant = mesh(new THREE.BoxGeometry(0.014, 0.004, 0.0003), ctx.mats.copper, 'WiFiAntenna');
  ant.position.set(0.035, PCB.centerY + 0.03, back - 0.0011);
  g.add(carrier, can, ant);

  const capGeo = new THREE.CylinderGeometry(0.0035, 0.0035, 0.009, 16);
  capGeo.rotateX(Math.PI / 2);
  for (let i = 0; i < 5; i++) {
    const c = mesh(capGeo, ctx.mats.painted, 'Capacitor');
    c.position.set(-0.05 + rnd() * 0.04, PCB.centerY - 0.035 + rnd() * 0.02, back - 0.0045);
    g.add(c);
  }
  const hdr = mesh(new RoundedBoxGeometry(0.03, 0.006, 0.007, 1, 0.0005), ctx.mats.ceramic, 'Connector');
  hdr.position.set(-0.03, PCB.centerY - 0.042, back - 0.0035);
  const ribbon = mesh(new THREE.BoxGeometry(0.04, 0.03, 0.0004), ctx.mats.copper, 'DisplayRibbon');
  ribbon.position.set(0, PCB.centerY + PCB.height / 2 + 0.008, zb + 0.003);
  ribbon.rotation.x = 0.4;
  g.add(hdr, ribbon);
  return g;
}

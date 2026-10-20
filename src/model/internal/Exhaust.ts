import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { CAP_TOP, EXHAUST } from '../../config/dimensions';
import { extrudeUp, mesh } from '../../utils/geometry';
import { tag } from '../../utils/tags';
import type { PartContext } from '../context';

/**
 * G — exhaust: hood on the drying chamber top-left-rear → duct → carbon filter cartridge → axial fan → chimney.
 * The chimney is a separate group (`chimney`) because it stays visible in exterior views.
 */
export class Exhaust extends THREE.Group {
  readonly chimney = new THREE.Group();
  readonly fanRotor = new THREE.Group();
  readonly steamOrigin = new THREE.Vector3(EXHAUST.x, EXHAUST.chimney.topY + 0.002, EXHAUST.z);
  readonly anchor = new THREE.Object3D();
  private angle = 0;

  constructor(ctx: PartContext) {
    super();
    this.name = 'G_Exhaust';
    tag(this, { component: 'G' });
    const E = EXHAUST;
    const hx = E.housing;

    const hood = mesh(new RoundedBoxGeometry(0.022, 0.016, 0.03, 3, 0.004), ctx.mats.satin, 'ExhaustHood');
    hood.position.set(E.port.x + 0.002, E.port.y, E.port.z);
    const duct = mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(E.port.x, E.port.y + 0.006, E.port.z),
          new THREE.Vector3(E.port.x - 0.002, E.port.y + 0.04, E.port.z - 0.008),
          new THREE.Vector3(E.x - 0.004, hx.bottomY - 0.02, E.z + 0.004),
          new THREE.Vector3(E.x, hx.bottomY + 0.002, E.z),
        ]),
        48,
        E.ductRadius,
        16,
      ),
      ctx.mats.satin,
      'ExhaustDuct',
    );
    this.add(hood, duct);

    // Filter housing: open cage so the pleated carbon cartridge is visible.
    const ringGeo = new THREE.CylinderGeometry(hx.radius, hx.radius, 0.006, 40);
    for (const y of [hx.bottomY + 0.003, hx.topY - 0.003]) {
      const r = mesh(ringGeo, ctx.mats.satin, 'HousingRing');
      r.position.set(E.x, y, E.z);
      this.add(r);
    }
    const rodGeo = new THREE.CylinderGeometry(0.0012, 0.0012, hx.topY - hx.bottomY, 8);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const rod = mesh(rodGeo, ctx.mats.polished, 'HousingRod');
      rod.position.set(E.x + Math.cos(a) * (hx.radius - 0.0012), (hx.topY + hx.bottomY) / 2, E.z + Math.sin(a) * (hx.radius - 0.0012));
      this.add(rod);
    }
    const c = E.cartridge;
    const star = new THREE.Shape();
    const n = c.pleats * 2;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = i % 2 === 0 ? c.outer : c.inner;
      if (i === 0) star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else star.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    const cartridgeH = hx.topY - hx.bottomY - 0.012;
    const cartridge = mesh(extrudeUp(star, cartridgeH, { creaseAngle: Math.PI / 2.2 }), ctx.mats.carbon, 'CarbonCartridge');
    cartridge.position.set(E.x, hx.bottomY + 0.006, E.z);
    this.add(cartridge);

    // Axial fan
    const fan = E.fan;
    const fanH = fan.topY - fan.bottomY;
    const shroud = mesh(new THREE.CylinderGeometry(hx.radius, hx.radius, fanH, 40, 1, true), ctx.mats.painted, 'FanShroud');
    shroud.material = ctx.mats.painted.clone();
    (shroud.material as THREE.MeshPhysicalMaterial).side = THREE.DoubleSide;
    shroud.position.set(E.x, fan.bottomY + fanH / 2, E.z);
    this.fanRotor.position.set(E.x, fan.bottomY + fanH / 2, E.z);
    const bladeGeo = new RoundedBoxGeometry(hx.radius - 0.005, 0.0012, 0.008, 1, 0.0005);
    bladeGeo.translate((hx.radius - 0.005) / 2 + 0.004, 0, 0);
    for (let i = 0; i < fan.blades; i++) {
      const h = new THREE.Group();
      h.rotation.y = (i / fan.blades) * Math.PI * 2;
      const b = mesh(bladeGeo, ctx.mats.blackPlastic, 'FanBlade');
      b.rotation.x = 0.55;
      h.add(b);
      this.fanRotor.add(h);
    }
    this.fanRotor.add(mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.008, 20), ctx.mats.blackPlastic, 'FanHub'));
    this.add(shroud, this.fanRotor);

    // Chimney through the top cap
    this.chimney.name = 'G_Chimney';
    tag(this.chimney, { component: 'G', alwaysVisible: true });
    const ch = E.chimney;
    const pipeH = ch.topY - fan.topY;
    const pipe = mesh(new THREE.CylinderGeometry(ch.radius, ch.radius, pipeH, 40, 1, true), ctx.mats.polished.clone(), 'ChimneyPipe');
    (pipe.material as THREE.MeshPhysicalMaterial).side = THREE.DoubleSide;
    pipe.position.set(E.x, fan.topY + pipeH / 2, E.z);
    const lip = mesh(new THREE.TorusGeometry(ch.radius, 0.0009, 8, 40), ctx.mats.polished, 'ChimneyLip');
    lip.rotation.x = Math.PI / 2;
    lip.position.set(E.x, ch.topY, E.z);
    const flange = mesh(new THREE.CylinderGeometry(ch.flangeRadius, ch.flangeRadius + 0.001, 0.003, 40), ctx.mats.blackPlastic, 'ChimneyFlange');
    flange.position.set(E.x, CAP_TOP + 0.0012, E.z);
    const soot = mesh(new THREE.CircleGeometry(ch.radius * 0.98, 32), new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 1 }), 'ChimneyThroat');
    soot.rotation.x = -Math.PI / 2;
    soot.position.set(E.x, ch.topY - 0.025, E.z);
    this.chimney.add(pipe, lip, flange, soot);

    this.anchor.position.set(E.x, ch.topY - 0.02, E.z + ch.radius);
    this.chimney.add(this.anchor);
  }

  update(dt: number, rpm: number): void {
    this.angle += (rpm / 60) * Math.PI * 2 * dt;
    this.fanRotor.rotation.y = this.angle;
  }
}

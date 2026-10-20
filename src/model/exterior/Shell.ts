import * as THREE from 'three';
import { BODY, OUTLET, SHELL } from '../../config/dimensions';
import { circlePath, extrudeUp, extrudeX, extrudeZ, mesh } from '../../utils/geometry';
import { tag } from '../../utils/tags';
import type { PartContext } from '../context';
import { createSideHandle, handleHolePath } from './SideHandle';
import { createVentBacking, ventHolePaths } from './VentGrid';

/**
 * Brushed stainless main shell, split along real panel seams:
 *  - ShellBody  : one folded sheet (front-left corner → left → back → rear-right corner)
 *  - RightPanel : flat side panel with the grab-handle opening, vent perforation and outlet port, + front-right corner
 *  - FrontPanel : flat front panel carrying branding, display and buttons (removed in Cutaway view)
 */
export class Shell extends THREE.Group {
  readonly body = new THREE.Group();
  readonly rightPanel = new THREE.Group();
  readonly frontPanel = new THREE.Group();

  constructor(ctx: PartContext) {
    super();
    this.name = 'Shell';
    const W2 = BODY.width / 2;
    const D2 = BODY.depth / 2;
    const R = SHELL.cornerRadius;
    const T = SHELL.thickness;
    const Ri = R - T;
    const H = SHELL.height;
    const gap = SHELL.seamGap;
    const mat = ctx.mats.brushed;
    const bevel = { bevel: SHELL.edgeBevel, bevelSegments: 2, curveSegments: 28 };

    // --- ShellBody (plan-view C outline, extruded up)
    const c = new THREE.Shape();
    c.moveTo(-(W2 - R), D2);
    c.absarc(-(W2 - R), D2 - R, R, Math.PI / 2, Math.PI, false);
    c.lineTo(-W2, -(D2 - R));
    c.absarc(-(W2 - R), -(D2 - R), R, Math.PI, Math.PI * 1.5, false);
    c.lineTo(W2 - R, -D2);
    c.absarc(W2 - R, -(D2 - R), R, Math.PI * 1.5, Math.PI * 2 - gap / R, false);
    c.lineTo((W2 - R) + Ri * Math.cos(-gap / R), -(D2 - R) + Ri * Math.sin(-gap / R));
    c.absarc(W2 - R, -(D2 - R), Ri, Math.PI * 2 - gap / R, Math.PI * 1.5, true);
    c.lineTo(-(W2 - R), -D2 + T);
    c.absarc(-(W2 - R), -(D2 - R), Ri, Math.PI * 1.5, Math.PI, true);
    c.lineTo(-W2 + T, D2 - R);
    c.absarc(-(W2 - R), D2 - R, Ri, Math.PI, Math.PI / 2, true);
    const body = mesh(extrudeUp(c, H, bevel), mat, 'ShellBodySheet');
    body.position.y = SHELL.y;
    this.body.name = 'ShellBody';
    this.body.add(tag(body, { xray: 'ghost' }));

    // --- RightPanel (side elevation: shape.x = Z, shape.y = local Y)
    const zr = D2 - R - gap;
    const side = new THREE.Shape();
    side.moveTo(-zr, 0);
    side.lineTo(zr, 0);
    side.lineTo(zr, H);
    side.lineTo(-zr, H);
    side.holes.push(handleHolePath(), circlePath(OUTLET.holeRadius, OUTLET.z, OUTLET.y - SHELL.y), ...ventHolePaths());
    const panel = mesh(extrudeX(side, T, { bevel: 0.0003, bevelSegments: 1, curveSegments: 4 }), mat, 'RightPanelSheet');
    panel.position.set(W2 - T, SHELL.y, 0);

    const fr = new THREE.Shape();
    const a0 = gap / R;
    const a1 = Math.PI / 2 - gap / R;
    fr.moveTo(W2 - R + R * Math.cos(a0), D2 - R + R * Math.sin(a0));
    fr.absarc(W2 - R, D2 - R, R, a0, a1, false);
    fr.lineTo(W2 - R + Ri * Math.cos(a1), D2 - R + Ri * Math.sin(a1));
    fr.absarc(W2 - R, D2 - R, Ri, a1, a0, true);
    const corner = mesh(extrudeUp(fr, H, bevel), mat, 'FrontRightCorner');
    corner.position.y = SHELL.y;

    const backing = createVentBacking(new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.8 }));
    backing.position.x = W2 - T - 0.004;

    this.rightPanel.name = 'RightPanel';
    this.rightPanel.add(
      tag(panel, { xray: 'ghost' }),
      tag(corner, { xray: 'ghost' }),
      tag(backing, { xray: 'ghost' }),
      tag(createSideHandle(ctx), { xray: 'ghost' }),
    );

    // --- FrontPanel (elevation, extruded toward +Z)
    const xf = W2 - R - gap;
    const front = new THREE.Shape();
    front.moveTo(-xf, 0);
    front.lineTo(xf, 0);
    front.lineTo(xf, H);
    front.lineTo(-xf, H);
    const fp = mesh(extrudeZ(front, T, { bevel: 0.0003, bevelSegments: 1 }), mat, 'FrontPanelSheet');
    fp.position.set(0, SHELL.y, D2 - T);
    this.frontPanel.name = 'FrontPanel';
    this.frontPanel.add(tag(fp, { xray: 'ghost' }));
    tag(this.frontPanel, { cutaway: 'hide', xray: 'ghost' });

    this.add(this.body, this.rightPanel, this.frontPanel);
  }
}

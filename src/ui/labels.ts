import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { COMPONENTS, COMPONENT_IDS, type ComponentId } from '../config/components';

/** Callout offsets (px) from the green anchor dot to the label box — mirrors the reference composition. */
const OFFSETS: Record<ComponentId, [number, number]> = {
  A: [-170, -80],
  B: [150, -6],
  C: [150, -24],
  D: [120, -46],
  E: [100, 92],
  F: [150, 40],
  G: [-150, -60],
  H: [130, 14],
};

interface Callout {
  obj: CSS2DObject;
  root: HTMLDivElement;
  box: HTMLDivElement;
  path: SVGPathElement;
}

/** Reference-style callouts A–H: translucent rounded box, bold title, sub-text, curved leader ending in a green dot. */
export class Labels {
  private readonly callouts = new Map<ComponentId, Callout>();
  private scale = 1;

  constructor(anchors: Record<ComponentId, THREE.Object3D>, onPick: (id: ComponentId) => void) {
    for (const id of COMPONENT_IDS) {
      const info = COMPONENTS[id];
      const root = document.createElement('div');
      root.className = 'callout';
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'leader');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      svg.appendChild(path);
      const dot = document.createElement('span');
      dot.className = 'dot';
      const box = document.createElement('div');
      box.className = 'box';
      const title = document.createElement('b');
      title.textContent = info.title;
      const sub = document.createElement('span');
      sub.textContent = info.sub;
      box.append(title, sub);
      box.addEventListener('pointerdown', (e) => e.stopPropagation());
      box.addEventListener('click', (e) => {
        e.stopPropagation();
        onPick(id);
      });
      root.append(svg, dot, box);
      const obj = new CSS2DObject(root);
      obj.name = `Label_${id}`;
      anchors[id].add(obj);
      this.callouts.set(id, { obj, root, box, path });
    }
    this.layout(window.innerWidth);
  }

  layout(viewportWidth: number): void {
    this.scale = THREE.MathUtils.clamp(viewportWidth / 1500, 0.55, 1);
    for (const [id, c] of this.callouts) {
      const [ox, oy] = OFFSETS[id];
      const dx = ox * this.scale;
      const dy = oy * this.scale;
      c.box.style.left = `${dx}px`;
      c.box.style.top = `${dy}px`;
      c.box.style.transform = `translate(${dx < 0 ? '-100%' : '0'}, -50%) scale(${Math.max(0.8, this.scale)})`;
      c.box.style.transformOrigin = dx < 0 ? 'right center' : 'left center';
      c.path.setAttribute('d', `M0 0 C ${dx * 0.35} ${dy * 0.05}, ${dx * 0.6} ${dy}, ${dx} ${dy}`);
    }
  }

  setVisible(ids: ComponentId[] | 'all' | 'none'): void {
    for (const [id, c] of this.callouts) {
      const on = ids === 'all' || (Array.isArray(ids) && ids.includes(id));
      c.obj.visible = on;
      c.root.style.display = on ? '' : 'none';
    }
  }

  highlight(id: ComponentId | null): void {
    for (const [cid, c] of this.callouts) c.root.classList.toggle('active', cid === id);
  }
}

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import type { ComponentId } from './config/components';
import { LID, TRAY } from './config/dimensions';
import { createMaterials } from './config/materials';
import { QUALITY, type QualityLevel } from './config/quality';
import { EcoHarvest } from './model/EcoHarvest';
import { createFloor } from './model/props/Floor';
import { createPlant } from './model/props/Plant';
import { flyTo, PRESETS, type ViewMode } from './scene/camera-presets';
import { Environment } from './scene/environment';
import { createLights } from './scene/lights';
import { PostFX } from './scene/postfx';
import { createRenderer } from './scene/renderer';
import { Cycle, DEFAULT_TIME, withShowcase } from './sim/cycle';
import { createTextures } from './textures';
import { createGui, type GuiParams } from './ui/gui';
import { Labels } from './ui/labels';
import { Overlay } from './ui/overlay';
import { InfoPanel } from './ui/panel';
import './style.css';
import { Tweens } from './utils/tween';

const LABELS_FOR: Record<ViewMode, ComponentId[] | 'all' | 'none'> = {
  exterior: 'none',
  lid: ['A'],
  cutaway: 'all',
  xray: 'all',
  exploded: 'all',
};

const app = document.getElementById('app') as HTMLElement;
const { renderer, labels: labelRenderer } = createRenderer(app);
RectAreaLightUniformsLib.init();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, app.clientWidth / app.clientHeight, 0.02, 30);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 0.25;
controls.maxDistance = 3.2;
controls.maxPolarAngle = Math.PI * 0.495;
camera.position.set(...PRESETS.exterior.position);
controls.target.set(...PRESETS.exterior.target);
controls.update();

const environment = new Environment(renderer, scene);
const lights = createLights(scene);
const tex = createTextures(renderer.capabilities.getMaxAnisotropy());
const ctx = { mats: createMaterials(tex), tex };

const model = new EcoHarvest(ctx);
scene.add(model);
const { floor, contactShadow } = createFloor(ctx);
const plant = createPlant(ctx);
const props = new THREE.Group();
props.name = 'Props';
props.add(floor, plant);
scene.add(props, contactShadow);

const post = new PostFX(renderer, scene, camera, app.clientWidth, app.clientHeight);
const tweens = new Tweens();
const cycle = new Cycle();
const panel = new InfoPanel(() => labels.highlight(null));
const labels = new Labels(model.anchors, (id) => focus(id));

const params: GuiParams = {
  playing: false,
  time: DEFAULT_TIME,
  timeScale: 1,
  jumpTo: 'DRYING',
  showcase: true,
  irIntensity: 0.9,
  manualLid: false,
  lidAngle: 0,
  manualTray: false,
  trayExtension: 0,
  view: 'exterior',
  quality: 'High',
  labels: true,
  props: true,
  turntable: false,
  hdri: false,
  exposure: 1,
};

function setView(m: ViewMode, fly = true): void {
  params.view = m;
  model.setViewMode(m);
  labels.setVisible(params.labels ? LABELS_FOR[m] : 'none');
  overlay.setView(m);
  if (fly) flyTo(camera, controls, tweens, PRESETS[m]);
}

function setPlaying(p: boolean): void {
  params.playing = p;
  cycle.playing = p;
  if (p) params.showcase = false;
  overlay.setPlaying(p);
  refresh();
}

function setQuality(q: QualityLevel): void {
  const s = QUALITY[q];
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, s.pixelRatioCap));
  lights.setShadowMapSize(s.shadowMapSize);
  post.setQuality(s);
  model.setQuality(s);
  resize();
}

function focus(id: ComponentId): void {
  const anchor = model.anchors[id];
  const target = anchor.getWorldPosition(new THREE.Vector3());
  const dir = camera.position.clone().sub(controls.target).normalize();
  flyTo(camera, controls, tweens, { position: target.clone().addScaledVector(dir, 0.48).toArray(), target: target.toArray() }, 1.1);
  panel.show(id);
  labels.highlight(id);
}

const overlay = new Overlay({
  onView: (m) => setView(m),
  onPlay: () => setPlaying(!params.playing),
  onRestart: () => {
    params.time = 0;
    setPlaying(true);
  },
});

const { refresh } = createGui(params, {
  onView: (m) => setView(m),
  onQuality: setQuality,
  onProps: (on) => (props.visible = on),
  onLabels: () => setView(params.view, false),
  onHdri: (on) => void environment.useHdri(on),
  onExposure: (v) => (renderer.toneMappingExposure = v),
  onPlay: setPlaying,
  onExport: exportGlb,
  onScreenshot: screenshot,
});

function exportGlb(): void {
  new GLTFExporter().parse(
    model,
    (result) => {
      const blob = new Blob([result as ArrayBuffer], { type: 'model/gltf-binary' });
      download(blob, 'EcoHarvest.glb');
    },
    (err) => console.error('[EcoHarvest] GLB export failed', err),
    { binary: true, onlyVisible: false },
  );
}

function screenshot(): void {
  post.render();
  renderer.domElement.toBlob((b) => b && download(b, `EcoHarvest_${params.view}.png`));
}

function download(blob: Blob, name: string): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* ---------------- picking */
const raycaster = new THREE.Raycaster();
const down = new THREE.Vector2();
renderer.domElement.addEventListener('pointerdown', (e) => down.set(e.clientX, e.clientY));
renderer.domElement.addEventListener('pointerup', (e) => {
  if (down.distanceTo(new THREE.Vector2(e.clientX, e.clientY)) > 5) return;
  const r = renderer.domElement.getBoundingClientRect();
  raycaster.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
  const visible = (o: THREE.Object3D): boolean => {
    for (let p: THREE.Object3D | null = o; p; p = p.parent) if (!p.visible) return false;
    return true;
  };
  const hit = raycaster.intersectObject(model, true).find((h) => visible(h.object) && !(h.object instanceof THREE.Points));
  const id = hit ? model.componentOf(hit.object) : null;
  if (id) focus(id);
});

/* ---------------- resize */
function resize(): void {
  const w = app.clientWidth;
  const h = app.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  labelRenderer.setSize(w, h);
  post.setSize(w, h, renderer.getPixelRatio());
  model.setViewport(h * renderer.getPixelRatio(), camera.fov);
  labels.layout(w);
}
window.addEventListener('resize', resize);

/* ---------------- loop */
const clock = new THREE.Clock();
let frames = 0;
let fpsTime = 0;
function frame(): void {
  const dt = Math.min(clock.getDelta(), 1 / 20);
  tweens.update(dt);
  controls.update();

  cycle.time = params.time;
  cycle.timeScale = params.timeScale;
  const raw = cycle.update(dt);
  params.time = cycle.time;
  if (params.playing !== cycle.playing) setPlaying(cycle.playing);
  const s = params.showcase && !params.playing ? withShowcase(raw) : raw;
  model.update(s, dt, {
    irSetting: params.irIntensity,
    lidOverride: params.manualLid ? params.lidAngle / LID.maxAngleDeg : null,
    trayOverride: params.manualTray ? params.trayExtension / TRAY.maxExtension : null,
  });
  if (params.turntable) model.rotation.y += dt * 0.25;
  overlay.setState(raw);

  post.render();
  labelRenderer.render(scene, camera);

  frames++;
  fpsTime += dt;
  if (fpsTime > 1) {
    (window as unknown as { __ecoFps: number }).__ecoFps = frames / fpsTime;
    frames = 0;
    fpsTime = 0;
  }
  requestAnimationFrame(frame);
}

setQuality(params.quality);
setView((new URLSearchParams(location.search).get('view') as ViewMode | null) ?? 'exterior');
overlay.setPlaying(false);
refresh();
requestAnimationFrame(frame);
(window as unknown as { __eco: unknown }).__eco = { model, scene, camera, controls, params, renderer, setView };

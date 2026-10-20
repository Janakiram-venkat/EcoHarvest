import GUI from 'lil-gui';
import { LID, TRAY } from '../config/dimensions';
import type { QualityLevel } from '../config/quality';
import type { ViewMode } from '../scene/camera-presets';
import { CYCLE_LENGTH, STAGES, stageStart, type StageId } from '../sim/cycle';

export interface GuiParams {
  playing: boolean;
  time: number;
  timeScale: number;
  jumpTo: StageId;
  showcase: boolean;
  irIntensity: number;
  manualLid: boolean;
  lidAngle: number;
  manualTray: boolean;
  trayExtension: number;
  view: ViewMode;
  quality: QualityLevel;
  labels: boolean;
  props: boolean;
  turntable: boolean;
  hdri: boolean;
  exposure: number;
}

export interface GuiHandlers {
  onView: (m: ViewMode) => void;
  onQuality: (q: QualityLevel) => void;
  onProps: (on: boolean) => void;
  onLabels: (on: boolean) => void;
  onHdri: (on: boolean) => void;
  onExposure: (v: number) => void;
  onPlay: (p: boolean) => void;
  onExport: () => void;
  onScreenshot: () => void;
}

export function createGui(p: GuiParams, h: GuiHandlers): { gui: GUI; refresh: () => void } {
  const gui = new GUI({ title: 'EcoHarvest controls', width: 290 });
  const sim = gui.addFolder('Process cycle');
  sim.add(p, 'playing').name('Play').onChange(h.onPlay);
  sim.add(p, 'time', 0, CYCLE_LENGTH, 0.01).name('Stage scrubber (s)').listen();
  sim
    .add(p, 'jumpTo', STAGES.map((s) => s.id))
    .name('Jump to stage')
    .onChange((id: StageId) => (p.time = stageStart(id) + 0.01));
  sim.add(p, 'timeScale', 0.1, 6, 0.05).name('Time scale ×');
  sim.add(p, 'showcase').name('Showcase pose (paused)');
  sim.add(p, 'irIntensity', 0, 1, 0.01).name('IR lamp intensity');

  const mech = gui.addFolder('Mechanisms');
  mech.add(p, 'manualLid').name('Manual lid');
  mech.add(p, 'lidAngle', 0, LID.maxAngleDeg, 1).name('Lid angle (°)');
  mech.add(p, 'manualTray').name('Manual tray');
  mech.add(p, 'trayExtension', 0, TRAY.maxExtension, 0.001).name('Tray extension (m)');

  const view = gui.addFolder('View');
  view
    .add(p, 'view', { Exterior: 'exterior', 'Lid open': 'lid', Cutaway: 'cutaway', 'X-ray': 'xray', Exploded: 'exploded' })
    .name('View mode')
    .onChange(h.onView)
    .listen();
  view.add(p, 'labels').name('Labels A–H').onChange(h.onLabels);
  view.add(p, 'props').name('Context props').onChange(h.onProps);
  view.add(p, 'turntable').name('Turntable');
  view.add(p, 'hdri').name('Studio HDRI (CC0)').onChange(h.onHdri);
  view.add(p, 'exposure', 0.4, 2, 0.01).name('Exposure').onChange(h.onExposure);
  view.add(p, 'quality', ['High', 'Medium', 'Low']).name('Quality').onChange(h.onQuality);

  const out = gui.addFolder('Export');
  out.add({ glb: h.onExport }, 'glb').name('Export model (GLB)');
  out.add({ png: h.onScreenshot }, 'png').name('Screenshot (PNG)');
  mech.close();
  out.close();

  return {
    gui,
    refresh: () => gui.controllersRecursive().forEach((c) => c.updateDisplay()),
  };
}

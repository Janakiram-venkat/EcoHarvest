# EcoHarvest 3D

Photorealistic, interactive, fully procedural Three.js model of the **EcoHarvest – Intelligent Bio-Waste Processing System**. It is built from `reference/` following `CLAUDE.md`.

```bash
npm install
npm run dev      # http://localhost:5173  (add ?view=cutaway | lid | xray | exploded)
npm run build    # type-check + production bundle in dist/
npm run lint
```

## What's inside

- **Views:** Exterior, Lid open, Cutaway (matches the reference right half), X-ray (Fresnel ghost shell that shows the coil, PCB, wiring and motors), Exploded.
- **Labels A–H:** reference-style callouts. Click a label or a part to focus the camera and read the PDF description.
- **Process cycle:** IDLE → loading → grinding → liquid separation → drying → IR finish → discharge → complete, compressed to 62 s. The blades, paddle, fan, louvres, drips, liquid level, granule colour, steam, tray slide and the live touch-screen UI are all driven from `src/sim/cycle.ts`.
- **Controls:** the toolbar at the top switches views and plays the cycle. The `lil-gui` panel (top-right) has the stage scrubber, time scale, IR intensity, manual lid/tray, quality (High/Medium/Low), HDRI, GLB export and screenshot.
- **Configuration:** every dimension is in `src/config/dimensions.ts`, materials are in `src/config/materials.ts`, and the PNG/PDF discrepancy flags are in `src/config/flags.ts`. Assumptions are listed in `docs/ASSUMPTIONS.md`.

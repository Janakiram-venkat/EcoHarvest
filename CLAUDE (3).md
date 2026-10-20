# CLAUDE.md — EcoHarvest 3D Model (Three.js)

## 1. Mission

Build a **photorealistic, interactive, engineering-accurate 3D model** of the
**EcoHarvest – Intelligent Bio-Waste Processing System with Thermal Optimization
and IoT Monitoring** in Three.js.

The model must faithfully reproduce **every visible detail** of the reference
material and must be usable for:

1. Product presentation (realistic exterior render, turntable).
2. Technical explanation (cutaway / X-ray / exploded views with labels A–H).
3. Process demonstration (animated grinding → liquid separation → drying → collection cycle).

Accuracy beats creativity. If something is not specified in the references,
**choose the most physically plausible option, document the assumption in
`docs/ASSUMPTIONS.md`, and keep it easy to change** (a constant in
`src/config/dimensions.ts` or `src/config/materials.ts`).

---

## 2. Source-of-truth references

Keep these in `/reference` and re-check them before marking any component done.

| File | Content | Authority |
|---|---|---|
| `reference/EcoHarvest_Smart_Bio-Waste_Processing_System.png` | Marketing render: exterior (left), cutaway with callouts A–H (right), process strip + feature list (bottom) | **Primary for appearance**, materials, colours, proportions, UI |
| `reference/MSME_block_diagram.pdf` | Fig.1 workflow, Fig.2 functional block diagram, Fig.3 schematic A–H, textual description of each unit | **Primary for function**, internal order of stages, component logic |

### Known discrepancies between references (do NOT silently pick one)

| Topic | PNG render | PDF | Default in model |
|---|---|---|---|
| Cycle time | 5–8 hours | 3–6 hours (Fig.1) | Configurable; UI default "5–8 h" |
| Output mass | 190–200 g | 100–200 g | Configurable; label uses PNG |
| Reduction | ≈ 90 % | "up to 90 %" / "99 % dry powder" | 90 % volume/mass reduction |
| Grinder (B) | Horizontal shaft with multiple stainless star-blades | 3 interlocking gear/rollers icon | Horizontal blade shaft (PNG) + option flag `GRINDER_STYLE = 'blades' | 'triple-roller'` |
| Drying heat source | Hot air + stirring, IR lamps | Internal heating coil + hot air + IR lamps | Include **hidden heating coil** under the drying bowl + visible IR tubes |
| Fig.2 stages | — | Deposit → Milling → Filter → Decomposition & treatment → **Milling (2nd)** → Collection | Optional second (fine) mill flag `SECOND_MILL = false` |
| IR lamp sides | Both side walls glowing | F₁ right, F₂ left | F₁ = right wall, F₂ = left wall |
| Exhaust (G) position | Chimney at **top-left-rear** with steam | Side port left, at level between C and E | Internal duct from E-chamber top (left) routed up to rear-left chimney — satisfies both |

---

## 3. Component inventory (labels must match exactly)

| ID | Name (exact label text) | Sub-text | Function (from PDF) |
|---|---|---|---|
| **A** | Lid | (Waste disposal area) | Hinged lid over the deposit hopper |
| **B** | Grinding area | (Stainless steel blades) | Crushes bulk waste into small uniform particles |
| **C** | Liquid separation | (Filtered solid moves down) | Mesh filter; liquid removed, solids drop to E |
| **D** | Liquid outlet | (To collect waste liquid) | Spout draining into removable clear container |
| **E** | Drying area | (Hot air + stirring) | Hot-air drying with motor-driven central paddle |
| **F1 & F2** | IR Lamps | (Dehydrates remaining moisture) | Adjustable-intensity IR tubes |
| **G** | Exhaust | (Removes odour and vapour) | Vents hot moist air through odour/particulate filter |
| **H** | Biomass collection tray | (Collects dry, odorless output) | Pull-out drawer with dry biomass |

Keep the British spelling "odour" in G and the American "odorless" in H —
they are spelled that way in the reference.

---

## 4. Dimensions & proportions

Units: **1 Three.js unit = 1 metre**. Real-world scale is mandatory
(physically-correct lighting depends on it).

Assumed overall size (typical countertop food recycler; confirm with team):

```
Overall body (excluding lid when open, chimney):
  Width  (X)  0.300 m
  Depth  (Z)  0.320 m
  Height (Y)  0.450 m   (body ≈ 1.45 × width, matches render)

Base plinth (black)        h 0.025 m, inset 0.004 m all sides
Main shell (silver)        h 0.360 m, vertical corner radius 0.030 m
Top cap (black)            h 0.045 m, slight overhang 0.003 m, top edge radius 0.010 m
Green accent band          h 0.006 m, between shell and top cap (wraps all 4 sides)
Lid                        0.215 × 0.170 × 0.035 m, hinge on rear edge, open angle 0–105°
Hopper opening             0.190 × 0.145 m, corner radius 0.015 m, depth 0.060 m
Front green indicator      0.040 × 0.004 m strip on top cap, centred in front of hopper
```

Front panel (measured as fractions of shell height from top of shell):

```
Logo leaf                  centre at 0.17, size 0.035 m
"EcoHarvest" wordmark      baseline at 0.26, cap height 0.022 m
Tagline                    baseline at 0.30, cap height 0.006 m, letter-spaced
Display bezel              0.165 × 0.120 m, top at 0.36, radius 0.010 m, bezel 0.008 m
Screen (active area)       0.145 × 0.100 m
Buttons (×3)               Ø 0.026 m, 0.040 m spacing, centred 0.068 m below bezel bottom
```

Right side panel:
- Recessed **grab handle** near the top, 0.080 × 0.030 m, recess depth 0.012 m.
- **Perforated vent grid** on the lower-front area of the right side
  (≈ 12 columns × 30 rows of Ø 2 mm holes, 4.5 mm pitch, staggered).

Internal stack (cutaway, top → bottom, heights approximate):

```
Hopper + grinding chamber (B)     0.085 m
Filter basket (C)                 0.050 m
Funnel to drying chamber          0.035 m
Drying chamber (E) bowl Ø 0.230   0.110 m
Perforated base disc + heater     0.015 m
Tray (H) drawer                   0.045 m
```

All values live in `src/config/dimensions.ts`. **Never hard-code a dimension
inside a component file.**

---

## 5. Detailed component spec

### Exterior

- **Shell**: brushed stainless / satin silver-grey. Brush direction vertical.
  Rounded vertical corners; very subtle panel seam where the right side panel meets front.
- **Top cap**: glossy-satin black plastic, slightly soft-edged. Lid sits in a recess.
- **Lid (A)**: smoked dark-grey/black, outer surface has a shallow recessed
  rectangular panel; underside shows a lighter grey inner liner and a gasket
  ring. Visible piano/barrel hinge at rear. Animate open/close with ease-in-out.
- **Green accents**: thin lime band at shell/top-cap junction; also a green rim
  around the hopper opening; tiny green indicator strip front-centre.
- **Hopper**: black rounded-rectangle tub with visible food waste inside when open.
- **Branding**:
  - Two-leaf dark-green logo above wordmark.
  - "EcoHarvest" — dark charcoal, clean geometric sans, medium weight.
  - "INTELLIGENT BIO-WASTE PROCESSING" — small, tracked caps, grey.
  - Implement as a decal (CanvasTexture or SVG → texture) on a slightly offset plane, `polygonOffset` to avoid z-fighting.
- **Display**: black glass bezel with rounded corners, glossy (clearcoat 1.0).
  Screen is a **CanvasTexture** rendered at ≥ 1024×700 with `emissiveMap`.
- **Buttons**: three black round buttons, slightly domed, thin chrome/grey ring,
  white line icons: **power**, **Wi-Fi**, **settings (gear)**.
- **Base**: black plinth, 4 small rubber feet underneath.
- **Rear**: power inlet (IEC C13 style), small rating label decal, exhaust chimney root.

### Display UI (must match the render exactly)

Dark teal/blue-green gradient background.

```
Row 1 (icons + labels):  [blades icon] Grinding  →  [water-drops icon] Drying  →  [green ✓ circle] Complete
Row 2:                   🌡 Temp: 72°C                         Progress: 65%
Row 3:                   ● [progress bar segment 1 — full green]   [segment 2 — partially filled green]
Top-right:               tiny status dot / Wi-Fi indicator
```

The UI must be **live**: temperature, stage highlight and progress update from
the simulation state (Section 8). Use white text, green `#43C463`-ish accents.

### Cutaway internals (right half of reference)

- **Internal frame**: stainless sheet-metal chassis with flanges, visible
  bolts/rivets (hex-head, ≈ M4) at frame corners, cable ties and a wiring harness
  running down the left inner wall.
- **G – Exhaust**: stainless chimney pipe Ø 0.025 m, rising ~0.06 m above the
  top cap at rear-left. Inside: duct from the top of E with a cylindrical
  **carbon filter cartridge** and a small axial fan. Animated steam particles
  leaving the chimney.
- **B – Grinding area**: horizontal stainless shaft across the chamber, carrying
  **6–8 star-shaped blades** (4–5 points, hooked tips) staggered in rotation
  angle, plus 2 bearing blocks with bolts at each end and a drive motor + belt/gear
  housing on one side. Food scraps (carrot, leaves, peels) above, falling through.
- **C – Liquid separation**: rectangular stainless **perforated mesh basket**
  with a rolled rim and diamond/round micro-perforations. Implement holes with a
  procedural `alphaMap` (tiled) + `alphaTest`, NOT real geometry. Wet solids sit
  in it.
- **Funnel**: stainless conical/rectangular transition below C leading into E.
- **D – Liquid outlet**: stainless pipe with bend exiting the right side,
  terminating in a down-turned spout over a **clear plastic container**
  (transmission material) holding **amber/brown liquid** with a visible meniscus.
  Animated drip stream when the cycle is in the separation stage.
- **E – Drying area**: round stainless bowl; **central vertical shaft** with
  **3–4 stirring paddle arms** (angled flat blades) rotating slowly; bed of
  **granular moist→dry material** (instanced granules, colour lerps from
  green/orange/yellow to brown as dryness increases). Shimmering heat haze
  (optional post-process).
- **F1 & F2 – IR lamps**: horizontal quartz tubes mounted on both side walls
  (F₁ right, F₂ left), each with a polished reflector behind it. Emissive
  orange-red (`#FF6A1A`, intensity tied to lamp setting) plus a `RectAreaLight`
  or `SpotLight` each casting warm light onto the material. Intensity
  adjustable (PDF: "IR lamp is adjustable").
- **Heating coil**: spiral resistive element under the perforated base disc
  (mostly hidden; visible in X-ray mode).
- **Perforated base disc**: stainless, round holes, separates E from H.
- **H – Biomass collection tray**: dark-grey drawer that **slides out** on
  rails, with a front **cut-out handle**. Filled with dry, fine **dark-brown
  biomass** (heightfield mesh + noise displacement + small instanced crumbs).
- **Motors**: one grinder motor, one paddle gear-motor under/behind E.
- **Electronics**: small PCB with Wi-Fi module behind the display (X-ray view).

### Context props (for hero scene only)

- Matte concrete/stone floor, soft grey wall, potted green plant left of unit
  (low-poly ok, but nice materials). Keep props optional via a toggle.

---

## 6. Materials (PBR) — `src/config/materials.ts`

Use `MeshPhysicalMaterial` everywhere realism matters. Colour space: sRGB for
albedo/emissive textures, linear for roughness/normal.

| Material | color | metalness | roughness | extras |
|---|---|---|---|---|
| Brushed stainless shell | `#C9CCCF` | 1.0 | 0.32 | `anisotropy 0.8`, anisotropyRotation vertical, subtle brushed normal map |
| Polished stainless (blades, pipe, chimney) | `#D6D9DC` | 1.0 | 0.12 | clearcoat 0 |
| Satin stainless (frame, bowl) | `#B8BCC0` | 1.0 | 0.28 | edge wear via roughness noise |
| Black plastic (top cap, base) | `#141516` | 0.0 | 0.35 | clearcoat 0.3 |
| Smoked lid | `#2A2C2E` | 0.0 | 0.18 | clearcoat 0.8 |
| Lime accent | `#7CC242` | 0.0 | 0.4 | — |
| Logo green | `#2E6B2F` | 0.0 | 0.5 | — |
| Display glass | `#050708` | 0.0 | 0.05 | clearcoat 1, emissiveMap = UI canvas |
| Rubber buttons/feet | `#1A1A1A` | 0.0 | 0.7 | — |
| Drawer tray | `#3B3D40` | 0.2 | 0.45 | — |
| Clear container | `#FFFFFF` | 0.0 | 0.05 | `transmission 1`, `thickness 0.003`, `ior 1.49` |
| Waste liquid | `#8A5A1E` | 0.0 | 0.05 | `transmission 0.6`, `attenuationColor #6B3A0F` |
| Dry biomass | `#4A2E1A` | 0.0 | 0.95 | displacement + normal noise |
| IR quartz tube | `#FFFFFF` | 0.0 | 0.1 | transmission 0.9, inner emissive filament `#FF6A1A` |

Textures: generate procedurally (canvas / noise) where possible so the repo has
no licensing issues. Any external texture must be CC0 (e.g. Poly Haven,
ambientCG) and its source recorded in `docs/ASSETS.md`.

---

## 7. Rendering & lighting

- `WebGLRenderer({ antialias: true })`, `outputColorSpace = SRGBColorSpace`,
  `toneMapping = ACESFilmicToneMapping`, `toneMappingExposure ≈ 1.0`.
- `shadowMap.enabled = true`, `PCFSoftShadowMap`; shadow-casting key light only.
- Environment: `PMREMGenerator` + `RoomEnvironment` by default; optional CC0
  studio HDRI (`.hdr` via `RGBELoader`) toggle.
- Lighting rig: warm key (4500 K) from front-left, cool fill from right,
  rim light from rear to separate the silhouette; plus the IR lamp lights
  inside the cutaway.
- Post-processing (`EffectComposer`): SSAO/GTAO, subtle bloom (only IR lamps,
  screen and steam should bloom — use selective bloom or threshold), SMAA.
- Contact shadow under the unit.
- Target **60 fps on a mid-range laptop**; provide a "Quality: High / Medium / Low"
  switch (shadow map size, SSAO, particle counts, pixel ratio cap).

---

## 8. Interaction & simulation

### View modes (UI toggle)
1. **Exterior** – closed unit, turntable optional.
2. **Lid open** – shows food waste in hopper (reference left image).
3. **Cutaway** – front-right panels removed, matches the reference right image
   (camera preset reproducing that angle).
4. **X-ray** – shell becomes 15 % opacity Fresnel, reveals coil, PCB, wiring, motors.
5. **Exploded** – components separate vertically along Y with animated tween.

### Labels
- `CSS2DRenderer` callouts A–H in the reference style: pale translucent
  rounded box, bold title, sub-text in parentheses, thin leader line ending in
  a **green dot** on the component.
- Clicking a label/component focuses the camera and shows the PDF description
  for that unit in a side panel.

### Process cycle simulation (`src/sim/cycle.ts`)
State machine with time-scaling (real 5–8 h compressed to ~60 s demo):

```
IDLE → LID_OPEN (load 1–2 kg) → LID_CLOSED → GRINDING (B blades spin, ~3000 rpm visual)
     → SEPARATING (C, liquid drips through D into container, level rises)
     → DRYING (E paddle rotates ~10 rpm, hot air particles, temp ramps to 72°C+)
     → IR_FINISH (F1/F2 glow up, moisture → 0, granule colour → brown)
     → DISCHARGE (material falls through base disc into H)
     → COMPLETE (✓ on screen, tray slides out 0.18 m, output 190–200 g)
```

- Exhaust steam emission rate ∝ evaporation rate (peaks in DRYING).
- Screen UI reflects: active stage, `Temp: XX°C`, `Progress: XX%`.
- Expose a `lil-gui` panel: stage scrubber, time scale, IR intensity, lid angle,
  tray extension, view mode, quality.

### Bottom info overlay (optional, matches reference)
"Input: 1–2 kg Food waste" → "Processing (5–8 hours)" → "Output: 190–200 g
(Dry powder ≈ 90% reduction)", plus the 8 features:
Grinds organic waste · Separates liquid waste · Thermal drying with hot air +
IR lamps · Odor control with exhaust filtration · IoT monitoring (Wi-Fi
enabled) · Touch display for easy operation · Compact design for home use ·
Produces dry biomass for use as fertilizer.

---

## 9. Tech stack & structure

- **Vite + TypeScript + three (pin an exact version, ≥ r163 for anisotropy)**.
- Addons from `three/examples/jsm/*`: OrbitControls, RoomEnvironment,
  RGBELoader, CSS2DRenderer, EffectComposer passes, RoundedBoxGeometry,
  mergeGeometries.
- `lil-gui` for controls, `gsap` (or hand-rolled tweens) for animations.
- No React unless asked. No external models — **everything is procedural**
  so every dimension stays editable. Optional: export final model to GLB via
  `GLTFExporter` (button in UI).

```
/reference                 source images & PDF (read-only)
/docs
  ASSUMPTIONS.md           every guessed dimension/material with reasoning
  ASSETS.md                texture/HDRI sources & licences
/src
  main.ts                  bootstraps renderer, scene, loop
  config/
    dimensions.ts          ALL measurements (single source of truth)
    materials.ts           material factory + palette
    quality.ts
  scene/
    renderer.ts  lights.ts  environment.ts  postfx.ts  camera-presets.ts
  model/
    EcoHarvest.ts          assembles all parts into a Group, named nodes
    exterior/  Shell.ts TopCap.ts Lid.ts Display.ts Buttons.ts Base.ts Branding.ts SideHandle.ts VentGrid.ts Rear.ts
    internal/  Frame.ts Grinder.ts FilterBasket.ts Funnel.ts LiquidOutlet.ts Container.ts DryingChamber.ts Paddle.ts IRLamp.ts HeatingCoil.ts BaseDisc.ts Exhaust.ts Tray.ts Motors.ts Electronics.ts Wiring.ts
    contents/  FoodWaste.ts Granules.ts Biomass.ts Liquid.ts
    props/     Floor.ts Plant.ts
  textures/                procedural generators (brushed, perforation, noise, ui-canvas)
  ui/                      labels.ts, panel.ts, gui.ts, screen-ui.ts
  sim/                     cycle.ts, particles.ts (steam, drips, falling bits)
  utils/
```

---

## 10. Coding rules

1. Every part is a function/class returning a named `THREE.Group`
   (`name = 'B_Grinder'`, etc.) so it can be selected, labelled, exploded.
2. Pivot points placed where they physically rotate (lid hinge, blade shaft
   axis, paddle shaft, drawer rail) — never rotate around the bounding-box centre.
3. Reuse geometries/materials; use `InstancedMesh` for blades, bolts, holes-as-
   geometry (if any), granules, crumbs, food pieces.
4. Bevel/round every visible hard edge (`RoundedBoxGeometry`, `ExtrudeGeometry`
   with bevel, `LatheGeometry` for round parts). Sharp 90° CG edges are not allowed.
5. Use `polygonOffset` or small offsets for decals; zero z-fighting.
6. Dispose geometries/materials/textures on teardown.
7. No magic numbers — import from `config/`.
8. Strict TypeScript, ESLint + Prettier, no `any`.

---

## 11. Workflow for Claude

1. Before coding a component, **re-read its row in Sections 3–5 and view the
   reference image region**.
2. Build in this order: dimensions/config → exterior shell → top cap & lid →
   front panel (branding, display, buttons) → side/rear details → internal frame
   → B → C → D → E/F → G → H → contents → labels → simulation → post-FX → props.
3. After each milestone, take a screenshot (Playwright or `renderer.domElement.toDataURL`)
   from the matching camera preset and **compare side-by-side with the reference**.
   List differences and fix them before moving on.
4. Record every assumption in `docs/ASSUMPTIONS.md`.
5. Run `npm run build` and `npm run lint` with zero errors before declaring done.

---

## 12. Accuracy checklist (all must be ✅)

**Exterior**
- [ ] Proportions match render (height ≈ 1.45× width)
- [ ] Silver brushed shell, black top cap, black base, lime accent band
- [ ] Lid hinged at rear, smoked finish, recessed panel, green hopper rim
- [ ] Leaf logo + "EcoHarvest" + "INTELLIGENT BIO-WASTE PROCESSING"
- [ ] Display with Grinding → Drying → Complete, Temp 72°C, Progress 65%, two bars
- [ ] Three round buttons: power, Wi-Fi, gear
- [ ] Right-side recessed handle + perforated vent grid
- [ ] Rear power inlet; rubber feet

**Internals**
- [ ] G exhaust chimney top-rear-left, filter cartridge, steam
- [ ] B horizontal shaft with staggered stainless star blades, bearings, motor
- [ ] C perforated stainless basket with rolled rim
- [ ] D bent pipe to right, clear container with amber liquid
- [ ] E round bowl, central shaft, rotating paddles, granular material
- [ ] F1 (right) & F2 (left) IR tubes glowing orange with reflectors
- [ ] Heating coil under perforated base disc
- [ ] H pull-out drawer with handle cut-out, dark-brown dry biomass
- [ ] Frame bolts, wiring harness, PCB/Wi-Fi module

**Presentation**
- [ ] Labels A–H with exact text, green dot leaders
- [ ] Cutaway camera preset reproduces reference composition
- [ ] Full cycle animation, live screen UI, liquid level, colour change
- [ ] Exploded & X-ray modes
- [ ] ≥ 60 fps on "High" on mid-range hardware; quality switch works
- [ ] All assumptions and discrepancies documented

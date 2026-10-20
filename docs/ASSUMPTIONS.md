# Assumptions & resolved discrepancies

Every value here is a constant in `src/config/dimensions.ts`, `src/config/materials.ts` or `src/config/flags.ts`, so it can be changed in one place.

## Reference discrepancies (CLAUDE.md §2)

| Topic | Decision | Where |
|---|---|---|
| Cycle time | UI shows "5–8 h" (PNG); demo compresses the cycle to 62 s | `sim/cycle.ts` `REAL_CYCLE_LABEL`, `STAGES` |
| Output mass | Bottom strip shows "190 – 200 g" (PNG) | `ui/overlay.ts` |
| Reduction | "≈ 90 % reduction" | `ui/overlay.ts` |
| Grinder | Horizontal shaft with 7 hooked 4-point star blades (PNG). `FLAGS.GRINDER_STYLE = 'triple-roller'` switches to the PDF's three gear rollers | `config/flags.ts` |
| Drying heat | Hidden spiral heating coil under the perforated disc **and** visible IR tubes; plus a hot-air blower grille on the back liner | `HeatingCoil.ts`, `Frame.ts` |
| Second mill | `FLAGS.SECOND_MILL = false`; when true two knurled rollers sit under the base disc | `SecondMill.ts` |
| IR lamp sides | F1 = right wall, F2 = left wall | `IRLamp.ts` |
| Exhaust | Hood on the drying chamber top-left-rear → duct → carbon cartridge → axial fan → chimney at rear-left of the top cap | `Exhaust.ts` |

## Assumptions

- **A1 – Lid offset.** The lid/hopper are centred 12 mm forward of the body centre so the Ø25 mm chimney fits behind the lid at the rear-left.
- **A2 – Front-panel layout.** Vertical positions were re-measured from the reference render (logo 0.14, wordmark 0.226, tagline 0.262, bezel top 0.30 of shell height; buttons 27 mm below the bezel). The spec's fractions put the buttons much lower than the render shows.
- **A3 – Display bezel.** 0.165 × 0.130 m (spec 0.120) to match the render's aspect; active screen 0.147 × 0.110 m, canvas 1024 × 766.
- **A4 – Heights.** Total height is 0.441 m to the cap top, plus 13 mm of lid proud of the cap (≈ 0.454 m), with 5 mm rubber feet. Internal stack: hopper 0.419→0.375, grinding chamber 0.375→0.318, basket 0.312→0.266, drip pan 0.262, funnel 0.258→0.226, drying chamber 0.226→0.118, coil 0.107, tray 0.040→0.085.
- **A5 – Drying dish.** The spec's 0.110 m "bowl height" is used as the drying **chamber** height. The round dish wall is only 30 mm tall so the IR tubes on the side walls can actually reach the material, as in the render.
- **A6 – Solids transfer C → E.** The basket walls are perforated (liquid drains to a surrounding drip pan feeding D). Its floor is five louvre slats that rotate 80° to drop the de-watered solids into the funnel. Flaps were rejected because they would collide with the funnel.
- **A7 – Paddle drive.** The paddle gear-motor hangs in the funnel throat on three spider struts. The annular gap (19–40 mm radius) lets solids pass, and the shaft comes down the funnel axis as in the render.
- **A8 – Outlet D / container.** The render's exterior view shows nothing on the right side, so the external spout and the clear container (on a stainless bracket) are treated as detachable. In Exterior / Lid views they are hidden and a rubber blanking plug fills the port.
- **A9 – Liquid rendering.** three.js does not show transmissive objects through other transmissive objects. The container therefore uses specular-only transparency (opacity 0.07) instead of `transmission: 1`, and the waste liquid uses translucent amber instead of `transmission: 0.6`.
- **A10 – Showcase pose.** The reference cutaway is a composite image (food on the blades, solids in the basket, liquid in the container, granules drying, IR on, tray full, all at once). While the sim is paused with "Showcase pose" enabled, content levels are raised to that composite. Pressing Play turns it off and shows the true state for each stage.
- **A11 – Default sim time.** The app opens at 65 % progress, which the cycle maths makes 72 °C, so the screen matches the render exactly.
- **A12 – Grinder speed.** 3000 rpm is simulated. Above ~250 rpm a radial motion-blur disc fades in and the blades fade out, which avoids strobing.
- **A13 – Frame.** 14 mm L-angle corner posts, rails at y = 0.031 / 0.100 / 0.262 / 0.389 m, M4 hex bolts. The tray is 0.250 m wide so it clears the front posts.
- **A14 – Rear.** IEC C14-style inlet and a generic rating label ("Model EH-1, 220–240 V, 500 W"). These values are placeholders until the team confirms them.

import * as THREE from 'three';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const DEFAULT_CREASE = Math.PI / 5;

/** Traces a rounded rectangle into a path. Starts mid-bottom so the closing edge is never degenerate. */
export function traceRoundedRect(path: THREE.Path, w: number, h: number, r: number, cx = 0, cy = 0): void {
  const rr = Math.max(1e-4, Math.min(r, w / 2 - 1e-5, h / 2 - 1e-5));
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const y0 = cy - h / 2;
  const y1 = cy + h / 2;
  path.moveTo(cx, y0);
  path.lineTo(x1 - rr, y0);
  path.absarc(x1 - rr, y0 + rr, rr, -Math.PI / 2, 0, false);
  path.lineTo(x1, y1 - rr);
  path.absarc(x1 - rr, y1 - rr, rr, 0, Math.PI / 2, false);
  path.lineTo(x0 + rr, y1);
  path.absarc(x0 + rr, y1 - rr, rr, Math.PI / 2, Math.PI, false);
  path.lineTo(x0, y0 + rr);
  path.absarc(x0 + rr, y0 + rr, rr, Math.PI, Math.PI * 1.5, false);
}

export function roundedRectShape(w: number, h: number, r: number, cx = 0, cy = 0): THREE.Shape {
  const s = new THREE.Shape();
  traceRoundedRect(s, w, h, r, cx, cy);
  return s;
}

export function roundedRectPath(w: number, h: number, r: number, cx = 0, cy = 0): THREE.Path {
  const p = new THREE.Path();
  traceRoundedRect(p, w, h, r, cx, cy);
  return p;
}

export function circlePath(r: number, cx = 0, cy = 0): THREE.Path {
  const p = new THREE.Path();
  p.absarc(cx, cy, r, 0, Math.PI * 2, false);
  return p;
}

/** Rounded-rect ring (outer minus inner offset by `wall`). */
export function roundedRingShape(w: number, h: number, r: number, wall: number, cx = 0, cy = 0): THREE.Shape {
  const s = roundedRectShape(w, h, r, cx, cy);
  s.holes.push(roundedRectPath(w - 2 * wall, h - 2 * wall, Math.max(0.0005, r - wall), cx, cy));
  return s;
}

export interface ExtrudeOpts {
  bevel?: number;
  bevelSegments?: number;
  curveSegments?: number;
  creaseAngle?: number;
}

function build(shape: THREE.Shape | THREE.Shape[], depth: number, o: ExtrudeOpts): THREE.ExtrudeGeometry {
  const bevel = o.bevel ?? 0;
  return new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(1e-5, depth - 2 * bevel),
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: o.bevelSegments ?? 3,
    curveSegments: o.curveSegments ?? 16,
  });
}

function finish(geo: THREE.BufferGeometry, crease: number | undefined): THREE.BufferGeometry {
  const out = toCreasedNormals(geo, crease ?? DEFAULT_CREASE);
  out.computeBoundingBox();
  out.computeBoundingSphere();
  return out;
}

/** Shape drawn in plan (shape.x = world X, shape.y = world Z), extruded upward from y = 0 to y = height. */
export function extrudeUp(shape: THREE.Shape | THREE.Shape[], height: number, o: ExtrudeOpts = {}): THREE.BufferGeometry {
  const bevel = o.bevel ?? 0;
  const geo = build(shape, height, o);
  geo.rotateX(Math.PI / 2);
  geo.translate(0, height - bevel, 0);
  return finish(geo, o.creaseAngle);
}

/** Shape drawn in elevation (shape.x = world X, shape.y = world Y), extruded toward +Z from z = 0 to z = depth. */
export function extrudeZ(shape: THREE.Shape | THREE.Shape[], depth: number, o: ExtrudeOpts = {}): THREE.BufferGeometry {
  const bevel = o.bevel ?? 0;
  const geo = build(shape, depth, o);
  geo.translate(0, 0, bevel);
  return finish(geo, o.creaseAngle);
}

/** Shape drawn in side elevation (shape.x = world Z, shape.y = world Y), extruded toward +X from x = 0 to x = depth. */
export function extrudeX(shape: THREE.Shape | THREE.Shape[], depth: number, o: ExtrudeOpts = {}): THREE.BufferGeometry {
  const bevel = o.bevel ?? 0;
  const geo = build(shape, depth, o);
  geo.translate(0, 0, bevel);
  geo.rotateY(-Math.PI / 2);
  geo.translate(depth, 0, 0);
  return finish(geo, o.creaseAngle);
}

/** PlaneGeometry whose UVs are expressed in metres so tiled textures keep a constant physical scale. */
export function metricPlane(w: number, h: number, segX = 1, segY = 1): THREE.PlaneGeometry {
  const g = new THREE.PlaneGeometry(w, h, segX, segY);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * h);
  return g;
}

/** Closed tube following a rounded rectangle lying in the XZ plane at y = 0. */
export function roundedRectTube(
  w: number,
  d: number,
  r: number,
  tubeRadius: number,
  cx = 0,
  cz = 0,
  segments = 200,
  radial = 8,
): THREE.TubeGeometry {
  const s = roundedRectShape(w, d, r, cx, cz);
  s.closePath();
  const pts = s.getSpacedPoints(segments);
  pts.pop();
  const curve = new THREE.CatmullRomCurve3(
    pts.map((p) => new THREE.Vector3(p.x, 0, p.y)),
    true,
    'centripetal',
  );
  return new THREE.TubeGeometry(curve, segments, tubeRadius, radial, true);
}

/** Lathe from [radius, y] pairs around the Y axis. */
export function lathe(
  profile: Array<[number, number]>,
  segments = 64,
  phiStart = 0,
  phiLength = Math.PI * 2,
): THREE.LatheGeometry {
  return new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(r, y)),
    segments,
    phiStart,
    phiLength,
  );
}

/** Rounded-edge profile helper for lathe parts: returns points of a quarter circle. */
export function arcPoints(cx: number, cy: number, r: number, a0: number, a1: number, n = 6): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return out;
}

export function mesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  name = '',
  cast = true,
  receive = true,
): THREE.Mesh {
  const m = new THREE.Mesh(geometry, material);
  m.name = name;
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

/** Quaternion that rotates +Y onto `dir`. */
export function quatFromY(dir: THREE.Vector3): THREE.Quaternion {
  return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
}

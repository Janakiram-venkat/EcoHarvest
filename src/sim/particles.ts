import * as THREE from 'three';

/* ------------------------------------------------------------------ soft billboard particles (steam, hot air) */

export interface SoftOptions {
  max: number;
  color: number;
  alpha: number;
  life: [number, number];
  size: [number, number];
  spawn: (p: THREE.Vector3, v: THREE.Vector3) => void;
  buoyancy: number;
  drag: number;
  turbulence: number;
  additive?: boolean;
}

/** CPU-simulated point sprites with per-particle size/alpha, sized in metres (perspective-correct). */
export class SoftParticles extends THREE.Points {
  private readonly opts: SoftOptions;
  private readonly pos: Float32Array;
  private readonly vel: Float32Array;
  private readonly age: Float32Array;
  private readonly life: Float32Array;
  private readonly size: Float32Array;
  private readonly alpha: Float32Array;
  private readonly seed: Float32Array;
  private accum = 0;
  private time = 0;
  budget = 1;
  readonly uniforms: { uScale: { value: number }; uMap: { value: THREE.Texture }; uColor: { value: THREE.Color } };

  constructor(sprite: THREE.Texture, opts: SoftOptions) {
    const geo = new THREE.BufferGeometry();
    const n = opts.max;
    const pos = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const alpha = new Float32Array(n);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1).setUsage(THREE.DynamicDrawUsage));
    const uniforms = { uScale: { value: 800 }, uMap: { value: sprite }, uColor: { value: new THREE.Color(opts.color) } };
    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: /* glsl */ `
        attribute float aSize; attribute float aAlpha;
        uniform float uScale; varying float vAlpha;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * uScale / max(0.001, -mv.z);
          vAlpha = aAlpha;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap; uniform vec3 uColor; varying float vAlpha;
        void main() {
          float a = texture2D(uMap, gl_PointCoord).a * vAlpha;
          if (a < 0.003) discard;
          gl_FragColor = vec4(uColor, a);
        }`,
      transparent: true,
      depthWrite: false,
      blending: opts.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    super(geo, mat);
    this.uniforms = uniforms;
    this.opts = opts;
    this.pos = pos;
    this.size = size;
    this.alpha = alpha;
    this.vel = new Float32Array(n * 3);
    this.age = new Float32Array(n).fill(1);
    this.life = new Float32Array(n).fill(1);
    this.seed = new Float32Array(n).map(() => Math.random() * 100);
    this.frustumCulled = false;
    this.renderOrder = 5;
  }

  setViewport(heightPx: number, fovDeg: number): void {
    this.uniforms.uScale.value = heightPx / (2 * Math.tan(THREE.MathUtils.degToRad(fovDeg) / 2));
  }

  update(dt: number, ratePerSecond: number): void {
    const o = this.opts;
    const n = o.max;
    this.time += dt;
    this.accum += ratePerSecond * this.budget * dt;
    const p = new THREE.Vector3();
    const v = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      if (this.age[i] >= this.life[i]) {
        if (this.accum >= 1) {
          this.accum -= 1;
          o.spawn(p, v);
          this.pos.set([p.x, p.y, p.z], i * 3);
          this.vel.set([v.x, v.y, v.z], i * 3);
          this.age[i] = 0;
          this.life[i] = o.life[0] + Math.random() * (o.life[1] - o.life[0]);
        } else {
          this.alpha[i] = 0;
          continue;
        }
      }
      this.age[i] += dt;
      const k = i * 3;
      const s = this.seed[i];
      const tt = this.time;
      this.vel[k] += (Math.sin(tt * 1.7 + s) * o.turbulence - this.vel[k] * o.drag) * dt;
      this.vel[k + 1] += (o.buoyancy - this.vel[k + 1] * o.drag) * dt;
      this.vel[k + 2] += (Math.cos(tt * 1.3 + s * 1.7) * o.turbulence - this.vel[k + 2] * o.drag) * dt;
      this.pos[k] += this.vel[k] * dt;
      this.pos[k + 1] += this.vel[k + 1] * dt;
      this.pos[k + 2] += this.vel[k + 2] * dt;
      const f = this.age[i] / this.life[i];
      this.size[i] = o.size[0] + (o.size[1] - o.size[0]) * Math.sqrt(f);
      this.alpha[i] = o.alpha * Math.min(1, f * 6) * (1 - f) * (1 - f);
    }
    if (this.accum > 1) this.accum = 1;
    const g = this.geometry;
    g.attributes.position.needsUpdate = true;
    g.attributes.aSize.needsUpdate = true;
    g.attributes.aAlpha.needsUpdate = true;
  }
}

/* ------------------------------------------------------------------ instanced falling chunks */

export interface FallOptions {
  max: number;
  spawn: (p: THREE.Vector3, v: THREE.Vector3) => void;
  floorY: () => number;
  gravity: number;
  colors: number[];
  scale: [number, number];
  stretch?: number;
}

/** Instanced bits that fall under gravity until they reach a (possibly moving) floor. */
export class FallingBits extends THREE.InstancedMesh {
  private readonly o: FallOptions;
  private readonly p: Float32Array;
  private readonly v: Float32Array;
  private readonly s: Float32Array;
  private readonly alive: Uint8Array;
  private readonly rot: THREE.Quaternion[];
  private accum = 0;
  budget = 1;

  constructor(geo: THREE.BufferGeometry, mat: THREE.Material, o: FallOptions) {
    super(geo, mat, o.max);
    this.o = o;
    this.p = new Float32Array(o.max * 3);
    this.v = new Float32Array(o.max * 3);
    this.s = new Float32Array(o.max);
    this.alive = new Uint8Array(o.max);
    this.rot = Array.from({ length: o.max }, () => new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random() * 6, Math.random() * 6, 0)));
    const c = new THREE.Color();
    for (let i = 0; i < o.max; i++) this.setColorAt(i, c.set(o.colors[i % o.colors.length]));
    this.count = 0;
    this.castShadow = true;
    this.frustumCulled = false;
  }

  update(dt: number, ratePerSecond: number): void {
    const o = this.o;
    this.accum = Math.min(4, this.accum + ratePerSecond * this.budget * dt);
    const pp = new THREE.Vector3();
    const vv = new THREE.Vector3();
    const floor = o.floorY();
    let n = 0;
    const m = new THREE.Matrix4();
    const sc = new THREE.Vector3();
    for (let i = 0; i < o.max; i++) {
      const k = i * 3;
      if (!this.alive[i] && this.accum >= 1) {
        this.accum -= 1;
        o.spawn(pp, vv);
        this.p.set([pp.x, pp.y, pp.z], k);
        this.v.set([vv.x, vv.y, vv.z], k);
        this.s[i] = o.scale[0] + Math.random() * (o.scale[1] - o.scale[0]);
        this.alive[i] = 1;
      }
      if (!this.alive[i]) continue;
      this.v[k + 1] -= o.gravity * dt;
      this.p[k] += this.v[k] * dt;
      this.p[k + 1] += this.v[k + 1] * dt;
      this.p[k + 2] += this.v[k + 2] * dt;
      if (this.p[k + 1] < floor) {
        this.alive[i] = 0;
        continue;
      }
      pp.set(this.p[k], this.p[k + 1], this.p[k + 2]);
      sc.set(this.s[i], this.s[i] * (o.stretch ?? 1), this.s[i]);
      m.compose(pp, o.stretch ? new THREE.Quaternion() : this.rot[i], sc);
      this.setMatrixAt(n, m);
      if (this.instanceColor) {
        const c = new THREE.Color();
        this.getColorAt(i, c);
        this.setColorAt(n, c);
      }
      n++;
    }
    this.count = n;
    this.instanceMatrix.needsUpdate = true;
  }
}

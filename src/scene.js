import * as THREE from 'three';

const vert = /* glsl */ `
  uniform float uTime, uAmp, uFreq, uPress;
  uniform vec3 uMouse;
  varying vec3 vNormal, vView;
  varying float vNoise;

  // Ashima 3D simplex noise
  vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
  vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
  vec4 perm(vec4 x){return mod289(((x*34.)+1.)*x);}
  vec4 tis(vec4 r){return 1.79284291400159-.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1./6.,1./3.); const vec4 D=vec4(0.,.5,1.,2.);
    vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=perm(perm(perm(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
    float n_=.142857142857; vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.*x_);
    vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.+1.; vec4 s1=floor(b1)*2.+1.; vec4 sh=-step(h,vec4(0.));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=tis(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
    vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.); m=m*m;
    return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  void main(){
    vec3 p = position;
    float n = snoise(p * uFreq + vec3(0., uTime * .25, uTime * .15));
    float n2 = snoise(p * uFreq * 2.3 - uTime * .2) * .25;
    float d = n + n2;
    // cursor pushes the surface outward where it is closest
    float near = smoothstep(1.6, 0., distance(normalize(p) * 1.4, uMouse));
    d += near * (.55 + uPress * .6);
    vec3 displaced = p + normal * d * uAmp;
    vNoise = d;
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(displaced, 1.);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const frag = /* glsl */ `
  uniform vec3 uA, uB;
  uniform float uLines, uAlpha;
  varying vec3 vNormal, vView;
  varying float vNoise;
  void main(){
    float fres = pow(1. - max(dot(normalize(vNormal), normalize(vView)), 0.), 2.2);
    vec3 col = mix(uA * .35, uB, smoothstep(-.4, .9, vNoise) * .6 + fres * .7);
    // topographic contour lines driven by the surface displacement
    float band = abs(fract(vNoise * uLines) - .5);
    float line = 1. - smoothstep(.0, .06, band);
    col += line * .22 * mix(vec3(1.), uB, .5);
    col += fres * uB * .5;
    gl_FragColor = vec4(col, uAlpha);
  }
`;

// One pose per [data-pose] section. x/y are fractions of the visible half-width/height.
const POSES = [
  { x: 0.52, y: 0.05, s: 1.15, amp: 0.34, freq: 0.9, lines: 7,  a: '#2a0c04', b: '#ff4d1c', alpha: 1,   spin: 0.10 },
  { x: 0.62, y: 0.12,  s: 0.85, amp: 0.22, freq: 1.3, lines: 12, a: '#0b1a22', b: '#7ad7ff', alpha: 0.9, spin: 0.16 },
  { x: 0.0,  y: 0.0,   s: 1.55, amp: 0.18, freq: 0.7, lines: 18, a: '#10140a', b: '#d9ff3f', alpha: 0.28, spin: 0.05 },
  { x: 0.6,  y: -0.1,  s: 0.8,  amp: 0.5,  freq: 1.1, lines: 5,  a: '#1c0a1f', b: '#f2b8ff', alpha: 0.9,  spin: 0.22 },
  { x: 0.0,  y: -0.08, s: 1.35, amp: 0.4,  freq: 0.8, lines: 9,  a: '#2a0c04', b: '#ff4d1c', alpha: 0.38, spin: 0.08 },
];

const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);
// frame-rate independent smoothing: same feel at 60 / 120 / 144 Hz
const damp = (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt));
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
  camera.position.z = 6;

  const uniforms = {
    uTime: { value: 0 }, uAmp: { value: 0 }, uFreq: { value: 1 }, uPress: { value: 0 },
    uMouse: { value: new THREE.Vector3(9, 9, 9) },
    uA: { value: new THREE.Color(POSES[0].a) }, uB: { value: new THREE.Color(POSES[0].b) },
    uLines: { value: 7 }, uAlpha: { value: 1 },
  };
  const blob = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.4, 48),
    new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms, transparent: true })
  );
  scene.add(blob);

  // dust
  const N = 900;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const r = 3 + Math.random() * 6, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    pos.set([r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph) - 2], i * 3);
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ size: 0.018, color: '#ece7dc', transparent: true, opacity: 0.45, depthWrite: false }));
  scene.add(dust);
  scene.fog = new THREE.Fog(0x0e0d0b, 9, 26); // fades into the page background

  // ── cyberpunk extras: orbit rings, drifting wireframe shards, perspective grid floor ──
  const neon = new THREE.Color(POSES[0].b);
  const circle = (r, n = 160) => {
    const pts = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0)); }
    return new THREE.BufferGeometry().setFromPoints(pts);
  };
  const rings = new THREE.Group();
  [[2.05, 1.1, 0.2], [2.45, -0.6, 0.9], [2.9, 0.3, -0.5]].forEach(([r, rx, ry], i) => {
    const ring = new THREE.LineLoop(circle(r), new THREE.LineBasicMaterial({ color: neon, transparent: true, opacity: 0.35 - i * 0.07, depthWrite: false }));
    ring.rotation.set(rx, ry, 0);
    rings.add(ring);
  });
  scene.add(rings);

  const shards = new THREE.Group();
  const shardGeos = [new THREE.OctahedronGeometry(0.18), new THREE.IcosahedronGeometry(0.16), new THREE.TetrahedronGeometry(0.2)];
  for (let i = 0; i < 9; i++) {
    const m = new THREE.Mesh(shardGeos[i % 3], new THREE.MeshBasicMaterial({ color: neon, wireframe: true, transparent: true, opacity: 0.5, depthWrite: false }));
    const r = 2.6 + Math.random() * 2.2, th = Math.random() * Math.PI * 2;
    m.position.set(Math.cos(th) * r, (Math.random() - 0.5) * 3.4, Math.sin(th) * r * 0.6 - 1);
    m.userData = { sp: 0.15 + Math.random() * 0.35, ph: Math.random() * 6.28, base: m.position.y };
    shards.add(m);
  }
  scene.add(shards);

  const CELL = 0.8, SPAN = 36;
  const gridPts = [];
  for (let i = -SPAN / 2; i <= SPAN / 2; i++) {
    gridPts.push(new THREE.Vector3(i * CELL, 0, -SPAN * CELL), new THREE.Vector3(i * CELL, 0, 4));
  }
  for (let i = 0; i <= SPAN; i++) {
    gridPts.push(new THREE.Vector3(-SPAN * CELL * 0.5, 0, 4 - i * CELL), new THREE.Vector3(SPAN * CELL * 0.5, 0, 4 - i * CELL));
  }
  const grid = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(gridPts), new THREE.LineBasicMaterial({ color: neon, transparent: true, opacity: 0.2, depthWrite: false }));
  scene.add(grid);

  let sections = [], tops = [], halfW = 1, halfH = 1;
  const cur = { x: 0, y: 0, s: 1, amp: 0, freq: 1, lines: 7, alpha: 1, spin: 0.1, a: new THREE.Color(), b: new THREE.Color() };
  cur.a.set(POSES[0].a); cur.b.set(POSES[0].b);
  const pa = POSES.map((p) => new THREE.Color(p.a)), pb = POSES.map((p) => new THREE.Color(p.b));
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let press = 0, pressT = 0, intro = 0, paused = false;
  let animT = 0, spinT = 0, gridT = 0, sy = window.scrollY, lastY = window.scrollY, vel = 0, lastNow = performance.now();

  function measure() {
    sections = [...document.querySelectorAll('[data-pose]')];
    tops = sections.map((s) => s.getBoundingClientRect().top + window.scrollY);
  }
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    halfH = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    halfW = halfH * camera.aspect;
    measure();
  }
  resize();
  window.addEventListener('resize', resize);
  new ResizeObserver(measure).observe(document.body);

  window.addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = -((e.clientY / window.innerHeight) * 2 - 1);
  });
  window.addEventListener('pointerdown', () => (pressT = 1));
  window.addEventListener('pointerup', () => (pressT = 0));

  const ray = new THREE.Raycaster(), hit = new THREE.Vector3(), plane = new THREE.Sphere(new THREE.Vector3(), 1.4);
  const inv = new THREE.Matrix4();

  function frame(now) {
    const dt = Math.min((now - lastNow) / 1000, 0.05); // clamp so a tab-switch doesn't leap
    lastNow = now;
    const live = paused ? 0 : dt; // ambient motion stops while paused; scroll poses keep easing

    // smoothed scroll position + velocity (what everything scroll-driven reads from)
    const rawY = window.scrollY;
    sy = damp(sy, rawY, 6, dt);
    vel = damp(vel, dt > 0 ? (rawY - lastY) / dt : 0, 5, dt);
    lastY = rawY;
    const v = clamp(vel / 2400, -1, 1); // −1…1, gentle

    animT += live;
    const y = sy + window.innerHeight * 0.5;

    // which two poses are we between?
    let i = 0;
    for (let k = 0; k < tops.length; k++) if (y >= tops[k]) i = k;
    const j = Math.min(i + 1, POSES.length - 1);
    const span = (tops[j] ?? tops[i] + 1) - tops[i] || 1;
    const f = i === j ? 0 : ease(clamp((y - tops[i]) / span, 0, 1));
    const A = POSES[i], B = POSES[j];

    const L = 3.2; // lower = slower, floatier
    const tgt = (key) => lerp(A[key], B[key], f);
    const mobile = window.innerWidth < 800;
    cur.x = damp(cur.x, tgt('x') * halfW * (mobile ? 0.35 : 1), L, dt);
    cur.y = damp(cur.y, tgt('y') * halfH, L, dt);
    cur.s = damp(cur.s, tgt('s') * (mobile ? 0.7 : 1) * (0.25 + 0.75 * intro), L, dt);
    cur.amp = damp(cur.amp, tgt('amp'), L, dt);
    cur.freq = damp(cur.freq, tgt('freq'), L, dt);
    cur.lines = damp(cur.lines, tgt('lines'), L, dt);
    cur.alpha = damp(cur.alpha, tgt('alpha') * (mobile ? 0.6 : 1) * intro, L, dt);
    cur.spin = damp(cur.spin, tgt('spin'), L, dt);
    const colK = 1 - Math.exp(-L * dt);
    cur.a.lerp(pa[i].clone().lerp(pa[j], f), colK);
    cur.b.lerp(pb[i].clone().lerp(pb[j], f), colK);

    if (!paused) {
      mouse.x = damp(mouse.x, mouse.tx, 4, dt);
      mouse.y = damp(mouse.y, mouse.ty, 4, dt);
    }
    press = damp(press, paused ? 0 : pressT, 7, dt);

    // integrate spin (t * spin made the angle jump whenever spin changed)
    spinT += live * cur.spin;
    blob.position.set(cur.x + mouse.x * 0.12, cur.y + mouse.y * 0.08, 0);
    blob.scale.setScalar(cur.s);
    blob.rotation.y = spinT + mouse.x * 0.2;
    blob.rotation.x = spinT * 0.6 - mouse.y * 0.14 + sy * 0.00006;

    // cursor → local-space point on the blob for the shader
    blob.updateMatrixWorld();
    ray.setFromCamera(new THREE.Vector2(mouse.x, mouse.y), camera);
    plane.center.copy(blob.position); plane.radius = 1.4 * cur.s;
    if (!paused && ray.ray.intersectSphere(plane, hit)) {
      inv.copy(blob.matrixWorld).invert();
      uniforms.uMouse.value.copy(hit).applyMatrix4(inv);
    } else uniforms.uMouse.value.set(9, 9, 9);

    uniforms.uTime.value = animT;
    uniforms.uAmp.value = cur.amp + Math.abs(v) * 0.05; uniforms.uFreq.value = cur.freq; uniforms.uLines.value = cur.lines;
    uniforms.uAlpha.value = cur.alpha; uniforms.uPress.value = press;
    uniforms.uA.value.copy(cur.a); uniforms.uB.value.copy(cur.b);

    // extras follow the blob and take its accent colour
    neon.copy(cur.b);
    rings.position.copy(blob.position);
    rings.scale.setScalar(cur.s * 0.95);
    rings.children.forEach((r, n) => {
      r.rotation.z += live * (0.12 + n * 0.07) * (n % 2 ? -1 : 1);
      r.material.color.copy(neon);
      r.material.opacity = (0.34 - n * 0.07) * Math.min(cur.alpha * 1.6, 1);
    });
    shards.rotation.y = spinT * 0.5 + mouse.x * 0.08;
    shards.children.forEach((m) => {
      m.rotation.x += live * m.userData.sp; m.rotation.y += live * m.userData.sp * 0.7;
      m.position.y = m.userData.base + Math.sin(animT * 0.4 + m.userData.ph) * 0.18;
      m.material.color.copy(neon); m.material.opacity = 0.45 * intro;
    });
    gridT += live * (0.3 + Math.abs(v) * 2.2);
    grid.position.set(0, -halfH * 0.92, -2 + (gridT % CELL));
    grid.material.color.copy(neon);
    grid.material.opacity = 0.2 * intro;

    dust.rotation.y = animT * 0.012 + mouse.x * 0.03;
    dust.rotation.x = mouse.y * 0.025 + sy * 0.00004;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);


  // gsap tweens `intro` 0 → 1 once the loader is done
  return {
    get intro() { return intro; }, set intro(v) { intro = v; }, measure,
    get paused() { return paused; }, set paused(v) { paused = !!v; },
  };
}

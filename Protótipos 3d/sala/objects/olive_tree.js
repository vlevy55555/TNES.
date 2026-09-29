import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Potted indoor olive tree, ≈ 2.9 m total. Origin = planter footprint centre on
// the floor. Canopy leans slightly toward -x like the reference.
// Draw calls: planter, soil, bark (one merged mesh), pale twigs, leaves (instanced).

// ponytail: mulberry32 so the tree is identical on every load (no seed knob needed)
let seed = 7;
const rnd = () => { seed |= 0; seed = seed + 0x6d2b79f5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const rr = (a, b) => a + (b - a) * rnd();

const POT_R_TOP = 0.28, POT_R_BOT = 0.26, POT_H = 0.60, LIP = 0.03, SOIL_Y = POT_H - 0.05;
const UP = new THREE.Vector3(0, 1, 0);
// canopy envelope: ellipsoid, leaves outside it are culled and twigs are pulled back in
const ENV_C = new THREE.Vector3(-0.25, 2.25, 0), ENV_R = new THREE.Vector3(1.0, 0.85, 0.8);
const envDist = (p) => Math.hypot((p.x - ENV_C.x) / ENV_R.x, (p.y - ENV_C.y) / ENV_R.y, (p.z - ENV_C.z) / ENV_R.z);

// Tube along a CatmullRom path whose radius tapers linearly r0 -> r1.
function taperedTube(pts, r0, r1, tub = 20, rad = 12) {
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const geo = new THREE.TubeGeometry(curve, tub, 1, rad, false);
  const pos = geo.attributes.position, c = new THREE.Vector3(), p = new THREE.Vector3();
  for (let i = 0; i <= tub; i++) {
    const t = i / tub, r = r0 + (r1 - r0) * t;
    curve.getPointAt(t, c);
    for (let j = 0; j <= rad; j++) {
      const k = i * (rad + 1) + j;
      p.fromBufferAttribute(pos, k).sub(c).multiplyScalar(r).add(c);
      pos.setXYZ(k, p.x, p.y, p.z);
    }
  }
  geo.computeVertexNormals();
  return { geo, curve };
}

// Walk from `start` along `dir` for `len` metres with gnarled wobble; `bias`
// pulls the direction (e.g. toward -x / up / down) so the silhouette is shaped.
function walk(start, dir, len, wobble, bias, n = 6, pull = 0) {
  const pts = [start.clone()], d = dir.clone().normalize(), p = start.clone();
  for (let i = 0; i < n; i++) {
    d.add(new THREE.Vector3(rr(-1, 1), rr(-1, 1), rr(-1, 1)).multiplyScalar(wobble)).add(bias);
    if (pull && envDist(p) > 1) d.addScaledVector(ENV_C.clone().sub(p).normalize(), pull * (envDist(p) - 1));
    d.normalize();
    p.addScaledVector(d, len / n);
    pts.push(p.clone());
  }
  return pts;
}

export async function create() {
  const g = new THREE.Group();

  // ---------- planter (closed lathe: outside, rounded rim, inner lip, cavity floor) ----------
  const prof = [];
  prof.push([0, 0], [POT_R_BOT - 0.01, 0], [POT_R_BOT, 0.01]);
  for (let i = 1; i <= 8; i++) { const t = i / 8; prof.push([POT_R_BOT + (POT_R_TOP - POT_R_BOT) * t, 0.01 + (POT_H - 0.02) * t]); }
  for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI; prof.push([POT_R_TOP - 0.01 + 0.01 * Math.cos(a), POT_H - 0.01 + 0.01 * Math.sin(a)]); } // rounded rim, 1 cm
  prof.push([POT_R_TOP - LIP, POT_H - 0.005], [POT_R_TOP - LIP, SOIL_Y - 0.02], [0, SOIL_Y - 0.02]);
  const potGeo = new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 96);
  const pot = new THREE.Mesh(potGeo, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.92, metalness: 0, map: speckle() }));
  g.add(pot);

  const soil = new THREE.Mesh(new THREE.CircleGeometry(POT_R_TOP - LIP + 0.002, 64), new THREE.MeshStandardMaterial({ color: '#1b1815', roughness: 1 }));
  soil.rotation.x = -Math.PI / 2; soil.position.y = SOIL_Y;
  g.add(soil);

  // ---------- trunk + branches ----------
  const bark = [], pale = [], leafSites = [];
  const sphere = (p, r) => { const s = new THREE.SphereGeometry(r, 10, 8); s.translate(p.x, p.y, p.z); return s; };
  const tube = (pts, r0, r1, into = bark) => {
    const { geo, curve } = taperedTube(pts, r0, r1);
    into.push(geo, sphere(pts[0], r0), sphere(pts[pts.length - 1], r1));
    return curve;
  };

  // trunk: 1.3 m above soil, twisting, slight lean to -x
  const trunkPts = walk(new THREE.Vector3(0.02, SOIL_Y - 0.03, 0), new THREE.Vector3(-0.05, 1, 0.02), 1.3, 0.3, new THREE.Vector3(-0.02, 0.28, 0), 12);
  const trunk = tube(trunkPts, 0.04, 0.022);
  const top = trunkPts[trunkPts.length - 1];

  // 4 main branches spreading around, lower ones flatter; a canopy 1.9 wide, y 1.4 -> 3.0
  const mains = [];
  const az0 = rr(0, Math.PI * 2);
  for (let i = 0; i < 4; i++) {
    const az = az0 + i * Math.PI / 2 + rr(-0.4, 0.4);
    const el = i === 0 ? rr(0.0, 0.2) : rr(0.55, 1.0); // one low, spreading branch
    const dir = new THREE.Vector3(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el));
    const start = trunk.getPointAt(rr(0.82, 1));
    const pts = walk(start, dir, i === 0 ? 0.8 : rr(0.9, 1.1), 0.15, new THREE.Vector3(-0.04, i === 0 ? -0.03 : 0.03, 0), 6, 2);
    mains.push(tube(pts, 0.022, 0.011));
  }
  // one extra low branch leaving the trunk lower down (the reference has a side stem)
  {
    const start = trunk.getPointAt(0.62);
    const pts = walk(start, new THREE.Vector3(-0.9, 0.3, 0.25), 0.7, 0.15, new THREE.Vector3(-0.03, -0.01, 0), 6, 2);
    mains.push(tube(pts, 0.014, 0.008));
  }

  // Space-filling twigs: sample a target inside the canopy ellipsoid, grow a twig
  // toward it from the nearest point on the parent level. Fills the volume evenly
  // instead of clumping at the tips.
  const inEnv = (maxR) => {
    for (;;) {
      const p = new THREE.Vector3(rr(-1, 1), rr(-1, 1), rr(-1, 1));
      if (p.length() <= maxR) return p.multiply(ENV_R).add(ENV_C);
    }
  };
  const nearest = (curves, target, tmin) => {
    let best = null, bd = Infinity, pt = new THREE.Vector3();
    for (const c of curves) for (let i = 0; i <= 10; i++) {
      const t = tmin + (1 - tmin) * i / 10;
      c.getPointAt(t, pt);
      const d = pt.distanceToSquared(target);
      if (d < bd) { bd = d; best = { p: pt.clone(), c, t }; }
    }
    return best;
  };
  const growTo = (parents, tmin, target, maxLen, wobble, n, r0, r1) => {
    const { p } = nearest(parents, target, tmin);
    const dir = target.clone().sub(p), len = Math.min(dir.length(), maxLen);
    return tube(walk(p, dir, len, wobble, new THREE.Vector3(0, -0.02, 0), n), r0, r1);
  };
  const secs = [], tert = [], quat = [];
  for (let i = 0; i < 24; i++) secs.push(growTo(mains, 0.3, inEnv(0.95), 0.6, 0.15, 5, 0.011, 0.005));
  for (let i = 0; i < 130; i++) tert.push(growTo(secs, 0.1, inEnv(0.97), 0.4, 0.2, 4, 0.005, 0.002));
  for (let i = 0; i < 220; i++) quat.push(growTo(tert, 0.1, inEnv(1.0), 0.2, 0.3, 3, 0.002, 0.001));
  // ~6 tiny pale twigs at the very tips
  for (let i = 0; i < 6; i++) {
    const s = tert[Math.floor(rnd() * tert.length)];
    const start = s.getPointAt(1);
    const pts = walk(start, s.getTangentAt(1), rr(0.06, 0.12), 0.3, new THREE.Vector3(0, -0.05, 0), 3);
    tube(pts, 0.002, 0.001, pale);
  }

  const barkMat = new THREE.MeshStandardMaterial({ color: '#5b5650', roughness: 1, metalness: 0 });
  g.add(new THREE.Mesh(mergeGeometries(bark), barkMat));
  g.add(new THREE.Mesh(mergeGeometries(pale), new THREE.MeshStandardMaterial({ color: '#a8a296', roughness: 1 })));

  // ---------- leaves (one InstancedMesh) ----------
  // narrow, pointed, slightly curled plane; base at the origin, grows along +y
  const leafGeo = new THREE.PlaneGeometry(0.018, 0.07, 1, 3);
  {
    const p = leafGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i), u = y / 0.035; // -1 .. 1
      const w = Math.abs(u) > 0.99 ? 0.08 : 1 - 0.35 * Math.abs(u);
      p.setXYZ(i, p.getX(i) * w, y + 0.035, 0.007 * u * u + 0.004 * u);
    }
    leafGeo.computeVertexNormals();
  }
  for (const c of mains) leafSites.push({ c, t0: 0.5, n: 10 });
  for (const c of secs) leafSites.push({ c, t0: 0.2, n: 20 });
  for (const c of tert) leafSites.push({ c, t0: 0.05, n: 22 });
  for (const c of quat) leafSites.push({ c, t0: 0.05, n: 16 });
  const count = leafSites.reduce((a, s) => a + s.n, 0);
  const leaves = new THREE.InstancedMesh(leafGeo, new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0, side: THREE.DoubleSide }), count);
  const cols = ['#45443a', '#575549', '#74746a'].map((c) => new THREE.Color(c));
  const pick = () => { const r = rnd(); return cols[r < 0.5 ? 0 : r < 0.8 ? 1 : 2]; };
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), roll = new THREE.Quaternion(), pos = new THREE.Vector3(), d = new THREE.Vector3(), tan = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  let k = 0;
  for (const { c, t0, n } of leafSites) {
    const puffs = [rr(t0, 1), rr(t0, 1), rr(t0, 1)];
    for (let i = 0; i < n; i++) {
      const t = THREE.MathUtils.clamp(puffs[i % 3] + rr(-0.12, 0.12), t0, 1); // loose puffs along the twig
      c.getPointAt(t, pos);
      c.getTangentAt(t, tan);
      // leaf direction: outward along the twig, biased down, randomised; sit just off the twig
      d.set(rr(-1, 1), rr(-1.2, 0.4), rr(-1, 1)).multiplyScalar(1.2).add(tan).normalize();
      pos.addScaledVector(d, rr(0.004, 0.035)).add(new THREE.Vector3(rr(-1, 1), rr(-1, 1), rr(-1, 1)).multiplyScalar(0.02));
      if (envDist(pos) > 1 && rnd() < 0.85) continue; // outside the canopy envelope: rare
      q.setFromUnitVectors(UP, d);
      roll.setFromAxisAngle(d, rr(0, Math.PI * 2));
      q.premultiply(roll);
      m.compose(pos, q, one.setScalar(rr(1.0, 1.5)));
      leaves.setMatrixAt(k, m);
      leaves.setColorAt(k, pick());
      k++;
    }
  }
  leaves.count = k;
  leaves.instanceMatrix.needsUpdate = true;
  leaves.instanceColor.needsUpdate = true;
  g.add(leaves);

  g.userData.leafCount = k;
  console.log('olive_tree leaves', k);
  return g;
}

// Subtle light speckle over the dark fibreclay — canvas texture, no file.
function speckle() {
  const s = 512, cv = document.createElement('canvas'); cv.width = cv.height = s;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#2a2929'; ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 6000; i++) {
    ctx.fillStyle = `rgba(${rnd() < 0.7 ? '255,255,255' : '0,0,0'},${rr(0.04, 0.2)})`;
    const r = rr(0.4, 1.4);
    ctx.beginPath(); ctx.arc(rnd() * s, rnd() * s, r, 0, 7); ctx.fill();
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 2); t.anisotropy = 8;
  return t;
}

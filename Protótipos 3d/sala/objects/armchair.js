import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { pbr } from '../lib/pbr.js';

// Lounge armchair. Bucket shell = horseshoe plan (thick-stroked centreline, bowed back,
// wall 0.12 at the arms / 0.11 at the back) extruded + fully bevelled, then displaced so the
// top edge is one continuous curve from 0.74 at the centre back down into concave arms
// ending at 0.58; walls flare outward and lean back. A rounded "belly" (closed outline,
// big bevel) fills the bottom, plus two puffed cushions and four splayed steel legs.
// Origin: footprint centre, y = 0 on the floor, front toward +Z.

const XC = 0.32, HD = 0.31, BOW = 0.04;      // centreline half-width / half-depth / back bow
const T_ARM = 0.12, T_BACK = 0.11;
const BELLY_Y = 0.28, SHELL_Y = 0.29;         // bottoms (shell bottom hides inside the belly)
const TOP_BACK = 0.74, TOP_FRONT = 0.58;
const FLARE = 0.15, LEAN = 0.06;

// U-shaped centreline in plan (shape coords: +y = back), uniformly sampled
function centreline() {
  const P = (x, y) => new THREE.Vector3(x, y, 0);
  const left = [P(-XC, -HD), P(-XC, -0.05), P(-XC, HD - 0.22), P(-XC + 0.05, HD - 0.06), P(-XC + 0.18, HD + 0.005)];
  const pts = [...left, P(0, HD + BOW), ...left.slice().reverse().map((p) => P(-p.x, p.y))];
  return new THREE.CatmullRomCurve3(pts, false, 'centripetal').getSpacedPoints(240);
}

function thickness(y) {
  return T_ARM + (T_BACK - T_ARM) * THREE.MathUtils.smoothstep(y, HD - 0.3, HD - 0.1);
}

// outer/inner offsets of the centreline
function offsets(cl) {
  const outer = [], inner = [];
  for (let i = 0; i < cl.length; i++) {
    const a = cl[Math.max(i - 1, 0)], b = cl[Math.min(i + 1, cl.length - 1)];
    const n = new THREE.Vector2(-(b.y - a.y), b.x - a.x).normalize();   // outward
    const h = thickness(cl[i].y) / 2;
    outer.push(new THREE.Vector2(cl[i].x + n.x * h, cl[i].y + n.y * h));
    inner.push(new THREE.Vector2(cl[i].x - n.x * h, cl[i].y - n.y * h));
  }
  return { outer, inner };
}

function cap(cx, cy, r, from, to, n = 16) {
  const out = [];
  for (let i = 1; i < n; i++) { const t = from + (to - from) * (i / n); out.push(new THREE.Vector2(cx + r * Math.cos(t), cy + r * Math.sin(t))); }
  return out;
}

function horseshoe(cl) {
  const { outer, inner } = offsets(cl);
  const r = T_ARM / 2, last = cl.length - 1;
  return new THREE.Shape([
    ...outer,
    ...cap(cl[last].x, cl[last].y, r, 0, -Math.PI),
    ...inner.reverse(),
    ...cap(cl[0].x, cl[0].y, r, 0, -Math.PI),
  ]);
}

function bellyOutline(cl) {
  return new THREE.Shape(offsets(cl).outer);   // closed by a straight line across the front
}

function extrude(shape, height, b, segs = 10) {
  let geo = new THREE.ExtrudeGeometry(shape, {
    depth: height - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelOffset: -b, bevelSegments: segs,
  });
  geo.deleteAttribute('normal'); geo.deleteAttribute('uv');
  geo = mergeVertices(geo, 1e-4);
  geo.rotateX(-Math.PI / 2);                   // shape y -> -z (back at -z), extrude -> +y
  geo.translate(0, b, 0);
  return geo;
}

// planar projection picked per vertex by dominant normal axis (call after computeVertexNormals)
function smoothUv(geo, scale = 9) {
  const p = geo.attributes.position, n = geo.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    const [u, v] = ay >= ax && ay >= az ? [x, z] : ax >= az ? [z, y] : [x, y];
    uv[2 * i] = u * scale; uv[2 * i + 1] = v * scale;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

// top-edge height along the shell, a = 0 centre back .. 1 arm front (one continuous curve,
// steepest through the corner, slightly concave along the arm)
function topHeight(a) {
  const drop = THREE.MathUtils.smoothstep(a, 0.05, 0.9);
  const sag = 0.02 * Math.sin(Math.PI * THREE.MathUtils.clamp((a - 0.5) / 0.5, 0, 1));
  return TOP_FRONT + (TOP_BACK - TOP_FRONT) * (1 - drop) - sag;
}

function shellGeometry(cl) {
  const H = 0.40, b = 0.04;
  const geo = extrude(horseshoe(cl), H, b, 12);
  const p = geo.attributes.position, last = cl.length - 1;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    let best = 0, bd = Infinity;                              // nearest centreline sample
    for (let j = 0; j <= last; j++) { const d = (cl[j].x - x) ** 2 + (cl[j].y + z) ** 2; if (d < bd) { bd = d; best = j; } }
    const a = Math.abs(best / last - 0.5) * 2;
    const y2 = SHELL_Y + y * ((topHeight(a) - SHELL_Y) / H);
    const k = (y2 - BELLY_Y) / (TOP_BACK - BELLY_Y);
    p.setXYZ(i, x * (1 + FLARE * k), y2, z - LEAN * k);
  }
  geo.computeVertexNormals();
  smoothUv(geo);
  return geo;
}

function bellyGeometry(cl) {
  const geo = extrude(bellyOutline(cl), 0.14, 0.06, 12);
  geo.scale(1 - 0.002 / XC, 1, 1);             // hair inside the shell wall: no z-fighting
  geo.translate(0, BELLY_Y, 0);
  geo.computeVertexNormals();
  smoothUv(geo);
  return geo;
}

function cushion(w, h, d, r, puff) {
  const geo = new RoundedBoxGeometry(w, h, d, 6, r);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const f = (1 - (2 * x / w) ** 2) * (1 - (2 * z / d) ** 2);
    p.setY(i, y + Math.sign(y) * puff * Math.max(0, f));
  }
  geo.computeVertexNormals();
  smoothUv(geo);
  return geo;
}

function leg(mat, foot, top) {
  const dir = new THREE.Vector3().subVectors(top, foot);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, dir.length(), 24), mat);
  m.position.copy(foot).lerp(top, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return m;
}

export async function create() {
  const g = new THREE.Group();
  // diff.jpg is already the target charcoal (~#2e2e2e), so the tint is white; if the map is
  // missing, fall back to the flat charcoal instead.
  const fabric = pbr('boucle_fabric', {
    repeat: [1, 1], color: '#ffffff', roughness: 0.95, normalScale: new THREE.Vector2(0.15, 0.15),
  });
  new THREE.TextureLoader().load('textures/boucle_fabric/diff.jpg', undefined, undefined, () => fabric.color.set('#2d2d2e'));
  const steel = new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.4, metalness: 0.8 });

  const cl = centreline();
  g.add(new THREE.Mesh(shellGeometry(cl), fabric));
  g.add(new THREE.Mesh(bellyGeometry(cl), fabric));

  const seat = new THREE.Mesh(cushion(0.72, 0.14, 0.62, 0.06, 0.02), fabric);
  seat.position.set(0, 0.35, HD + T_ARM / 2 + 0.02 - 0.31);   // front edge 2 cm past the arm fronts
  g.add(seat);

  const back = new THREE.Mesh(cushion(0.60, 0.42, 0.16, 0.07, 0.04), fabric);
  back.position.set(0, 0.53, -HD + 0.11);
  back.rotation.x = -0.16;
  g.add(back);

  const ox = XC + T_ARM / 2, ozF = HD + T_ARM / 2, ozB = HD + BOW + T_BACK / 2;
  for (const sx of [-1, 1]) for (const [oz, sz] of [[ozF, 1], [ozB, -1]]) {
    g.add(leg(steel, new THREE.Vector3(sx * (ox - 0.02), 0, sz * (oz - 0.02)),
      new THREE.Vector3(sx * (ox - 0.08), BELLY_Y + 0.04, sz * (oz - 0.08))));
  }

  // recentre the footprint on the origin (the lean pushes the back past its plan outline)
  const box = new THREE.Box3().setFromObject(g);
  const dz = -(box.min.z + box.max.z) / 2;
  for (const c of g.children) c.position.z += dz;
  return g;
}

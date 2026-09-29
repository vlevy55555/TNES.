import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { pbr } from '../lib/pbr.js';

// Black-stained oak credenza: 1.62 w × 0.45 d × 0.50 h body on 0.12 m steel legs.
// Body y 0.12 → 0.62; top surface at y = 0.62.
const W = 1.62, D = 0.45, H = 0.50, LEG = 0.12, LID = 0.025;
const GAP = 0.004, RECESS = 0.006, R = 0.003;

const box = (w, h, d, mat, x, y, z, r = R) => {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, r), mat);
  m.position.set(x, y, z);
  return m;
};

export async function create() {
  const g = new THREE.Group();
  const wood = (rotation) => pbr('wood_dark_oak', {
    repeat: [2, 1], rotation, color: '#6a6b70', roughness: 0.55, metalness: 0, envMapIntensity: 0.3,
  });
  // source texture grain runs along u (horizontal); box UVs put u along x on front/top faces
  const doorMat = wood(0);             // horizontal grain on the fronts
  const lidMat = wood(0);              // grain along the length of the top
  const dark = new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.8 });
  const steel = new THREE.MeshStandardMaterial({ color: '#151515', roughness: 0.4, metalness: 0.85 });

  const yBody = LEG, yLid = LEG + H - LID;               // 0.12, 0.595
  // carcass (front 6 mm recessed) + lid
  g.add(box(W, yLid - yBody, D - RECESS, doorMat, 0, (yBody + yLid) / 2, -RECESS / 2));
  g.add(box(W, LID, D, lidMat, 0, yLid + LID / 2, 0));
  // near-black recessed front face seen through the gaps / bottom reveal
  g.add(box(W - 0.004, yLid - yBody - 0.004, 0.002, dark, 0, (yBody + yLid) / 2, D / 2 - RECESS + 0.001, 0.001));

  // three flush fronts, 4 mm gaps, 3 mm side reveal, 2 cm bottom reveal, 3 mm under the lid
  const y0 = yBody + 0.02, y1 = yLid - 0.003;
  const side = 0.003, dw = (W - 2 * side - 2 * GAP) / 3, dh = y1 - y0, dz = D / 2 - RECESS + RECESS / 2;
  const x0 = -W / 2 + side + dw / 2;
  g.add(box(dw, dh, RECESS, doorMat, x0, (y0 + y1) / 2, dz, 0.0025));
  g.add(box(dw, dh, RECESS, doorMat, x0 + 2 * (dw + GAP), (y0 + y1) / 2, dz, 0.0025));
  // middle bay is two drawers (as in the reference)
  const dh2 = (dh - GAP) / 2;
  g.add(box(dw, dh2, RECESS, doorMat, 0, y0 + dh2 / 2, dz, 0.0025));
  g.add(box(dw, dh2, RECESS, doorMat, 0, y1 - dh2 / 2, dz, 0.0025));

  // legs: round 14 mm steel, 0.10 m in from the corners
  const legGeo = new THREE.CylinderGeometry(0.007, 0.007, LEG + 0.01, 24);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const l = new THREE.Mesh(legGeo, steel);
    l.position.set(sx * (W / 2 - 0.10), (LEG + 0.01) / 2, sz * (D / 2 - 0.10));
    g.add(l);
  }
  return g;
}

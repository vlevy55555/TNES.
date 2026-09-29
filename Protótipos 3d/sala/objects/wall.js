import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { pbr } from '../lib/pbr.js';

// Cast-in-place concrete wall: 12 x 4 x 0.3 m, front face at z = 0 (toward +Z),
// bottom at y = 0, x centred. Built as bevelled formwork panels (ExtrudeGeometry
// with real tie holes) in front of a solid backing box, plus a pilaster on the left.

const W = 12, H = 4, T = 0.3;
const SEAMS_X = [-4.31, -2.84, -1.37, 0.10, 1.57, 3.04, 4.51]; // vertical seams (1.47 m pitch, medido na referência)
const SEAMS_Y = [0.93, 1.95];                                // horizontal seams (px 505 / 300 da referência)
const HOLE_ROWS = [0.45, 1.38, 2.48];                         // one row per panel row (px 600 / 415 / 195)
const GAP = 0.004, BEVEL = 0.002, PANEL_T = 0.03, HOLE_R = 0.022;
// The concrete_wall texture is itself a photo of 4 formwork panels with painted seams
// and tie holes (~6.2 m per tile at real scale). Each geometry panel is mapped onto one
// of 8 seam/hole-free crops of it, so only the modelled seams and holes show.
const CROPS_U = [[0.02, 0.24], [0.28, 0.49], [0.53, 0.74], [0.78, 0.99]];
const CROPS_V = [[0.48, 0.64], [0.80, 0.96]];

// Map every vertex of a panel (local coords, size pw x ph) onto texture crop k.
const TILE_W = 4 * 1.47, TILE_H = 2 * 1.02, TILE_X0 = -4.31, TILE_Y0 = 0.93;
function worldUV(geom, cx, cy) {
  const p = geom.attributes.position, uv = geom.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (cx + p.getX(i) - TILE_X0) / TILE_W, (cy + p.getY(i) - TILE_Y0) / TILE_H);
  uv.needsUpdate = true;
}
// ponytail: kept for the seam-baked concrete_wall_008 set; unused with concrete_smooth
function cropUV(geom, pw, ph, k) {
  const [u0, u1] = CROPS_U[k % 4], [v0, v1] = CROPS_V[Math.floor(k / 4) % 2];
  const p = geom.attributes.position, uv = geom.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    uv.setXY(i, u0 + (p.getX(i) / pw + 0.5) * (u1 - u0), v0 + (p.getY(i) / ph + 0.5) * (v1 - v0));
  }
  uv.needsUpdate = true;
}

// Box-project UVs (world coords, 6.2 m per tile) with a uv offset/scale so the
// sampled band avoids the texture's painted seams and holes (used for column/backing).
function projectUV(geom, off, uOff = 0, vOff = 0, vScale = 1) {
  const p = geom.attributes.position, n = geom.attributes.normal, uv = geom.attributes.uv, s = 1 / TILE_W;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + off.x, y = p.getY(i) + off.y, z = p.getZ(i) + off.z;
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    if (az >= ax && az >= ay) uv.setXY(i, x * s + uOff, y * s * vScale + vOff);
    else if (ax >= ay) uv.setXY(i, (z + 1.5) * s + uOff, y * s * vScale + vOff); // +1.5: keeps the column's side faces in the same clean u band
    else uv.setXY(i, x * s + uOff, z * s + vOff);
  }
  uv.needsUpdate = true;
}

export async function create() {
  const g = new THREE.Group();
  const concrete = pbr('concrete_site', { maps: ['diff'], color: '#d0d0d0', roughness: 0.88, metalness: 0 });
  const seam = pbr('concrete_site', { maps: ['diff'], color: '#6a6a6a', roughness: 1, metalness: 0 });
  const holeMat = new THREE.MeshStandardMaterial({ color: '#5a5651', roughness: 1, metalness: 0, side: THREE.DoubleSide });

  // solid backing (also the seam floor, 3 mm behind the panel faces)
  const back = new THREE.Mesh(new THREE.BoxGeometry(W, H, T - 0.003), seam);
  back.position.set(0, H / 2, -(T + 0.003) / 2);
  projectUV(back.geometry, back.position, 0.1, 0, TILE_W / TILE_H); // u band clear of painted holes on the end faces
  g.add(back);

  // formwork tie hole: shallow cone sunk into the panel, 0.2 mm lip in front of the face
  const cone = new THREE.LatheGeometry(
    [new THREE.Vector2(0, -0.010), new THREE.Vector2(0.003, -0.010), new THREE.Vector2(HOLE_R - BEVEL + 0.0005, -BEVEL), new THREE.Vector2(HOLE_R + 0.0015, 0.0002)],
    24);
  cone.rotateX(Math.PI / 2); // lathe axis y -> z

  const xs = [-W / 2, ...SEAMS_X, W / 2];
  const ys = [0, ...SEAMS_Y, H];
  for (let r = 0; r < ys.length - 1; r++) {
    for (let c = 0; c < xs.length - 1; c++) {
      const pw = xs[c + 1] - xs[c], ph = ys[r + 1] - ys[r];
      const cx = (xs[c] + xs[c + 1]) / 2, cy = (ys[r] + ys[r + 1]) / 2;
      const hw = pw / 2 - GAP / 2 - BEVEL, hh = ph / 2 - GAP / 2 - BEVEL;
      const shape = new THREE.Shape([new THREE.Vector2(-hw, -hh), new THREE.Vector2(hw, -hh), new THREE.Vector2(hw, hh), new THREE.Vector2(-hw, hh)]);
      const holes = [-pw / 4, pw / 4].map((hx) => [hx, HOLE_ROWS[r] - cy]);
      for (const [hx, hy] of holes) {
        const h = new THREE.Path(); h.absarc(hx, hy, HOLE_R, 0, Math.PI * 2, true); shape.holes.push(h);
      }
      const geom = new THREE.ExtrudeGeometry(shape, { depth: PANEL_T, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: BEVEL, bevelSegments: 3, curveSegments: 24 });
      const panel = new THREE.Mesh(geom, concrete);
      panel.position.set(cx, cy, -(PANEL_T + BEVEL)); // back cap of the extrusion is the front face at z = 0
      worldUV(geom, cx, cy);
      g.add(panel);
      for (const [hx, hy] of holes) {
        const m = new THREE.Mesh(cone, holeMat);
        m.position.set(cx + hx, cy + hy, 0);
        g.add(m);
      }
    }
  }

  // protruding pilaster on the far left
  const col = new THREE.Mesh(new RoundedBoxGeometry(0.45, H, 0.65, 3, 0.006), concrete);
  col.name = 'pilaster';
  col.position.set(-4.15, H / 2, 0.275); // z de -0.05 a +0.60: a face lateral direita é a coluna clara da borda esquerda da referência // z from -0.05 to +0.35
  projectUV(col.geometry, col.position, 0.37, 0, TILE_W / TILE_H); // u in [0.27,0.35], v in [0.44,0.70]: clean band
  g.add(col);

  g.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = false; });
  return g;
}

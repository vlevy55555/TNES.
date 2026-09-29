import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { pbr } from '../lib/pbr.js';

// Marble plinth coffee table: 1.75 (x) × 1.20 (z) × 0.32 (y) monolith on a
// recessed dark base 0.03 high, so the block floats ~3 cm above the rug.
const W = 1.75, D = 1.2, H = 0.32, BASE_H = 0.03, TILE = 1.8; // metres

// Box-projected UVs from vertex position: each face is mapped by its two
// in-plane axes at 1 tile per TILE metres, so veins run continuously over the
// eased edges (mitred look) and the sides are not a squashed copy of the top.
function boxProjectUVs(geo) {
  const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)), nz = Math.abs(n.getZ(i));
    if (ny >= nx && ny >= nz) uv.setXY(i, x / TILE, z / TILE);
    else if (nx >= nz) uv.setXY(i, z / TILE, y / TILE);
    else uv.setXY(i, x / TILE, y / TILE);
  }
  uv.needsUpdate = true;
}

export async function create() {
  const g = new THREE.Group();

  // ponytail: rough.jpg of this set is near-black (mean 17/255) and would turn the
  // stone into a mirror, so it is skipped; a flat 0.3 gives the soft polished sheen.
  const marble = pbr('marble_light', { repeat: [1, 1], color: '#a09f9d', roughness: 0.3, metalness: 0, envMapIntensity: 0.9, maps: ['diff', 'nor'] });
  const blockGeo = new RoundedBoxGeometry(W, H, D, 4, 0.004);
  boxProjectUVs(blockGeo);
  const block = new THREE.Mesh(blockGeo, marble);
  block.position.y = BASE_H + H / 2;
  g.add(block);

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(W - 0.2, BASE_H, D - 0.15),
    new THREE.MeshStandardMaterial({ color: '#2a2928', roughness: 0.9, metalness: 0 }),
  );
  base.position.y = BASE_H / 2;
  g.add(base);

  return g;
}

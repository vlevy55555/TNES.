import * as THREE from 'three';
import { pbr } from '../lib/pbr.js';

// Contract for every object module in this folder:
//   export async function create() -> THREE.Group
//   - units: metres; origin = centre of the object's footprint, y = 0 on the floor
//   - "front" faces +Z (toward the camera); index.html positions/rotates the group
//   - closed, smooth geometry only (no exposed open faces / hollow shells seen from
//     the camera); high segment counts; cast/receive shadows off
export async function create() {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.3, 48, 32), pbr('concrete_smooth', { color: '#909090' }));
  m.position.y = 0.3;
  g.add(m);
  return g;
}

import * as THREE from 'three';
import { pbr } from '../lib/pbr.js';

// Polished concrete floor: 16 x 14 m plane at y = 0, centred at z = +4
// (spans z = -3 behind the wall to z = +11 toward the camera).
export async function create() {
  const g = new THREE.Group();
  const geom = new THREE.PlaneGeometry(16, 14, 1, 28);
  // darkening toward the wall (z = 0): vertex colour 0.85 at the wall -> 1.0 at z >= 6
  const p = geom.attributes.position, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const z = 4 - p.getY(i); // plane local y -> world z after the -90deg rotation
    const k = 0.85 + 0.15 * THREE.MathUtils.clamp(z / 6, 0, 1);
    col.set([k, k, k], i * 3);
  }
  geom.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = pbr('concrete_floor', {
    repeat: [5, 4.4], color: '#bfbdbb', roughness: 0.38, metalness: 0.02, envMapIntensity: 0.8, vertexColors: true,
    polygonOffset: true, polygonOffsetFactor: -1, // wins the depth test over any coplanar helper ground
  });
  const m = new THREE.Mesh(geom, mat);
  m.rotation.x = -Math.PI / 2;
  m.position.z = 4;
  m.castShadow = m.receiveShadow = false;
  g.add(m);
  return g;
}

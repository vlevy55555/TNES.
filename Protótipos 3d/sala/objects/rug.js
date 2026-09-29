import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Large grey flatweave rug: 6.0 (x) × 3.6 (z) × 0.012 (y) slab with softly
// eased edges, so the edge reads as a thin lit lip against the floor.
const W = 6.0, D = 3.6, T = 0.012, TILE = 0.65; // metres
const REPEAT = [W / TILE, D / TILE];            // ≈ [9.2, 5.5]

// Same silent-fail loading as lib/pbr.js (a missing map is detached), but on a
// MeshPhysicalMaterial so the fabric gets sheen. ponytail: duplicated rather than
// generalising pbr() over material classes; fold back in if a third user appears.
const loader = new THREE.TextureLoader();
function tex(mat, key, url, srgb, fallback = null) {
  const t = loader.load(url, undefined, undefined, () => { mat[key] = fallback; mat.needsUpdate = true; });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...REPEAT);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  mat[key] = t;
}

// Procedural weave fallback: weft lines (3-px light/dark rows) + grain + mottle,
// centred at 0.5 so it darkens like the real diff map. Used as bumpMap always and
// as the colour map while textures/rug/diff.jpg is missing.
function weave() {
  const S = 512, c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(S, S), d = img.data;
  for (let y = 0; y < S; y++) {
    const row = (((y / 3) | 0) & 1) ? 140 : 116;           // weft line pairs, ~7.6 mm apart at TILE
    const warp = Math.sin(y * 0.9) * 8;                     // faint warp modulation
    for (let x = 0; x < S; x++) {
      const v = row + warp + (Math.random() - 0.5) * 24 + Math.sin(x * 0.11 + y * 0.03) * 5 + Math.sin(x * 0.023 - y * 0.017) * 7; // grain + mottle
      const i = (y * S + x) * 4;
      d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...REPEAT);
  t.anisotropy = 8;
  return t;
}

export async function create() {
  const g = new THREE.Group();

  const w = weave();
  const mat = new THREE.MeshPhysicalMaterial({
    color: '#a3a19f', roughness: 1.0, metalness: 0,
    normalScale: new THREE.Vector2(1.2, 1.2),
    map: w, bumpMap: w, bumpScale: 0.5,
    sheen: 0.4, sheenRoughness: 0.9, sheenColor: new THREE.Color('#bdbbb8'),
  });
  tex(mat, 'map', 'textures/rug/diff.jpg', true, w);
  tex(mat, 'normalMap', 'textures/rug/nor.jpg', false);
  tex(mat, 'roughnessMap', 'textures/rug/rough.jpg', false);
  tex(mat, 'aoMap', 'textures/rug/ao.jpg', false);

  const slab = new THREE.Mesh(new RoundedBoxGeometry(W, T, D, 3, 0.005), mat);
  slab.position.y = T / 2;
  g.add(slab);
  return g;
}

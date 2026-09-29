import * as THREE from 'three';

// Loads a PBR set from textures/<name>/{diff,nor,rough,ao}.jpg (any missing map is
// skipped silently, so an object renders with its fallback colour while textures
// are still being fetched/downloaded). Returns a MeshStandardMaterial.
const loader = new THREE.TextureLoader();
const cache = new Map();

function tex(url, opts) {
  const key = url + JSON.stringify(opts);
  if (cache.has(key)) return cache.get(key);
  const t = loader.load(url, undefined, undefined, () => {
    // missing map: detach it so the material falls back to its plain params
    for (const m of opts.owners) {
      for (const k of Object.keys(m)) if (m[k] === t) m[k] = null;
      m.needsUpdate = true;
    }
  });
  t.wrapS = t.wrapT = opts.mirror ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping;
  t.repeat.set(opts.repeat[0], opts.repeat[1]);
  if (opts.offset) t.offset.set(opts.offset[0], opts.offset[1]);
  if (opts.rotation) t.rotation = opts.rotation;
  t.anisotropy = 8;
  if (opts.srgb) t.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, t);
  return t;
}

/**
 * pbr('concrete_wall', { repeat: [3, 1], color: '#909090', roughness: 0.9 })
 * Maps: diff (sRGB), nor, rough, ao. Base URL is relative to the html page.
 */
export function pbr(name, { repeat = [1, 1], offset, rotation, mirror = false, maps = ['diff', 'nor', 'rough', 'ao'], base = 'textures', ...matProps } = {}) {
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...matProps });
  const owners = [mat];
  const o = (srgb) => ({ repeat, offset, rotation, mirror, srgb, owners });
  if (maps.includes('diff')) mat.map = tex(`${base}/${name}/diff.jpg`, o(true));
  if (maps.includes('nor')) mat.normalMap = tex(`${base}/${name}/nor.jpg`, o(false));
  if (maps.includes('rough')) mat.roughnessMap = tex(`${base}/${name}/rough.jpg`, o(false));
  if (maps.includes('ao')) mat.aoMap = tex(`${base}/${name}/ao.jpg`, o(false));
  return mat;
}

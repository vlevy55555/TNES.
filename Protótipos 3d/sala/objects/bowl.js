import * as THREE from 'three';

// Hand-thrown shallow stone bowl. Origin = centre of the foot ring at y = 0.
// Big (table): diameter 0.42, height 0.10. Small (sideboard): 0.20 × 0.07.

// 256² mottled speckle: used as colour, roughness and bump so the stone reads
// mottled even with no texture files at all (ponytail: procedural, no pbr()).
function speckle() {
  const canvas = (fill) => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, 256, 256);
    return ctx;
  };
  const col = canvas('#433f3a'), rough = canvas('#d0d0d0');
  const dot = (ctx, x, y, r, style, a) => { // drawn 9× so the tile wraps seamlessly
    ctx.fillStyle = style; ctx.globalAlpha = a;
    ctx.beginPath();
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { ctx.moveTo(x + i * 256 + r, y + j * 256); ctx.arc(x + i * 256, y + j * 256, r, 0, Math.PI * 2); }
    ctx.fill();
  };
  for (let i = 0; i < 140; i++) { // soft mottling blotches
    const x = Math.random() * 256, y = Math.random() * 256, r = 8 + Math.random() * 22, light = Math.random() < 0.5;
    dot(col, x, y, r, light ? '#605b54' : '#2a2724', 0.18);
    dot(rough, x, y, r, light ? '#9a9a9a' : '#ffffff', 0.25);
  }
  for (let i = 0; i < 14000; i++) { // fine speckle
    const x = Math.random() * 256, y = Math.random() * 256, r = 0.4 + Math.random() * 1.3, light = Math.random() < 0.45;
    const l = light ? 34 + Math.random() * 14 : 16 + Math.random() * 8;
    dot(col, x, y, r, `hsl(32, 9%, ${l}%)`, 0.3 + Math.random() * 0.4);
    dot(rough, x, y, r, light ? '#8c8c8c' : '#ffffff', 0.5);
  }
  const t = (ctx, srgb) => {
    const tx = new THREE.CanvasTexture(ctx.canvas);
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
    if (srgb) tx.colorSpace = THREE.SRGBColorSpace;
    tx.anisotropy = 8;
    return tx;
  };
  return { map: t(col, true), rough: t(rough, false) };
}

// Per-face projected UVs (top-down on the floor/rim, cylindrical on the walls)
// so the speckle keeps one scale instead of stretching radially at the centre.
// Per face (non-indexed) so no triangle straddles the two projections.
function projectUVs(geo, R) {
  const TILE = 0.12, nT = Math.round((2 * Math.PI * R) / TILE);
  const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
  for (let f = 0; f < p.count; f += 3) {
    const ny = (n.getY(f) + n.getY(f + 1) + n.getY(f + 2)) / 3;
    for (let i = f; i < f + 3; i++) {
      if (Math.abs(ny) > 0.6) uv.setXY(i, p.getX(i) / TILE, p.getZ(i) / TILE);
      else uv.setXY(i, uv.getX(i) * nT, p.getY(i) / TILE);
    }
  }
  uv.needsUpdate = true;
  return geo;
}

// Closed lathe profile (radius, y): foot centre → foot ring → outer wall (S-curve)
// → rounded in-turned rim → inner wall → inner floor centre.
function profile(D, H) {
  const R = D / 2, T = 0.009, footR = 0.225 * D, floor = 0.012;
  const outer = new THREE.SplineCurve([
    new THREE.Vector2(footR, 0),
    new THREE.Vector2(footR + (R - footR) * 0.5, H * 0.14),
    new THREE.Vector2(R - 0.006, H * 0.5),
    new THREE.Vector2(R, H * 0.8),
    new THREE.Vector2(R - 0.004, H - 0.004),
  ]).getPoints(24);
  const inner = new THREE.SplineCurve([
    new THREE.Vector2(R - 0.004 - T, H - 0.004),
    new THREE.Vector2(R - T, H * 0.78),
    new THREE.Vector2(R - 0.008 - T, H * 0.45),
    new THREE.Vector2(footR * 0.95, floor + H * 0.12),
    new THREE.Vector2(footR * 0.45, floor + 0.002),
    new THREE.Vector2(0, floor),
  ]).getPoints(24);
  const pts = [new THREE.Vector2(0, 0), new THREE.Vector2(footR * 0.6, 0), ...outer];
  const cx = R - 0.004 - T / 2; // rim arc centre
  for (let i = 1; i < 8; i++) {
    const a = (i / 8) * Math.PI;
    pts.push(new THREE.Vector2(cx + (T / 2) * Math.cos(a), H - 0.004 + (T / 2) * Math.sin(a)));
  }
  return pts.concat(inner);
}

export async function create({ diameter = 0.42, height = 0.10 } = {}) {
  const g = new THREE.Group();
  const tex = speckle();
  const mat = new THREE.MeshStandardMaterial({
    color: '#ffffff', map: tex.map, roughnessMap: tex.rough, roughness: 0.72, metalness: 0,
    bumpMap: tex.rough, bumpScale: 0.0008, side: THREE.FrontSide,
  });
  const geo = projectUVs(new THREE.LatheGeometry(profile(diameter, height), 128).toNonIndexed(), diameter / 2);
  g.add(new THREE.Mesh(geo, mat));
  return g;
}

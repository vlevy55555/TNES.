import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Hardcover books lying flat. Origin = centre of the bottom book's footprint,
// y = 0 on the table. Spine on the -X side, fore-edge toward +X, a page side
// faces +Z.

// Fine horizontal lines so the page block's open sides read as stacked pages.
function pageLines() {
  const c = document.createElement('canvas');
  c.width = 8; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 8, 256);
  for (let y = 0; y < 256; y += 2) {
    ctx.fillStyle = Math.random() < 0.5 ? '#5a5a5a' : '#a8a8a8';
    ctx.fillRect(0, y, 8, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
let lines;

// w × d footprint, h thick; boards overhang the pages by 3 mm on the open sides.
function book(w, d, h, cover, pages = '#c5c6c9') {
  const g = new THREE.Group();
  const bT = 0.003, r = h / 2; // board thickness, spine radius
  const coverMat = new THREE.MeshStandardMaterial({ color: cover, roughness: 0.7, metalness: 0 });
  lines ??= pageLines();
  const pageMat = new THREE.MeshStandardMaterial({ color: pages, roughness: 1, metalness: 0, bumpMap: lines, bumpScale: 0.0015 });

  const board = new RoundedBoxGeometry(w - r, bT, d, 2, 0.002);
  for (const y of [bT / 2, h - bT / 2]) {
    const m = new THREE.Mesh(board, coverMat);
    m.position.set(r / 2, y, 0);
    g.add(m);
  }
  // spine: half-cylinder along z, bulging toward -X, tangent to both boards
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d, 32, 1, false, Math.PI, Math.PI), coverMat);
  spine.rotation.x = Math.PI / 2;
  spine.position.set(-w / 2 + r, r, 0);
  g.add(spine);

  const pw = w - r - 0.003, pd = d - 0.006;
  const block = new THREE.Mesh(new THREE.BoxGeometry(pw, h - 2 * bT, pd), pageMat);
  block.position.set(-w / 2 + r + pw / 2, h / 2, 0);
  g.add(block);
  return g;
}

export async function create() {
  const g = new THREE.Group();
  g.add(book(0.34, 0.26, 0.035, '#3a3734'));
  // top book lies with its spine toward the front (+Z), as in the reference
  const top = book(0.23, 0.31, 0.03, '#3e3b38');
  top.position.set(0.015, 0.035, 0.005);
  top.rotation.y = Math.PI / 2 + THREE.MathUtils.degToRad(6);
  g.add(top);
  return g;
}

export async function createSingle() {
  const g = new THREE.Group();
  g.add(book(0.30, 0.22, 0.03, '#c5c6c9', '#d6d6d4'));
  return g;
}

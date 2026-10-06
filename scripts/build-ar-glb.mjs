// Gera o GLB do quadro da POC de AR (public/prototype-3d).
// O Scene Viewer do Android baixa o modelo por conta própria, então ele tem que ser um arquivo
// estático em HTTPS — um GLB montado no navegador (blob:) não chega até ele.
// glTF em metros, +Y para cima, costas em z=0 (o lado que encosta na parede), frente em +Z.
// usage: node scripts/build-ar-glb.mjs
import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(import.meta.dirname, '..')
const IN = 0.0254
const PRINT = { w: 36 * IN, h: 24 * IN, src: 'public/artworks/rio-runner.jpg' }
const MOULDING = 0.03 // face da moldura regular, igual a src/lib/wall.ts
const DEPTH = 0.03 // quanto a moldura sai da parede
const RECESS = 0.008 // a foto fica um pouco para dentro da face da moldura
const OUT = 'public/prototype-3d/rio-runner-36x24.glb'
const W = PRINT.w + 2 * MOULDING
const H = PRINT.h + 2 * MOULDING

const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const newMesh = () => ({ pos: [], nor: [], uv: [], idx: [] })

// Um retângulo: centro `o`, meios-lados `u` e `v`. A frente é o lado para onde aponta u × v,
// e a textura fica de pé com `u` para a direita e `v` para cima.
function quad(mesh, o, u, v) {
  const n = cross(u, v)
  const len = Math.hypot(...n)
  const base = mesh.pos.length / 3
  for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    mesh.pos.push(o[0] + a * u[0] + b * v[0], o[1] + a * u[1] + b * v[1], o[2] + a * u[2] + b * v[2])
    mesh.nor.push(n[0] / len, n[1] / len, n[2] / len)
    mesh.uv.push((a + 1) / 2, (1 - b) / 2) // glTF: v=0 é o topo da imagem
  }
  mesh.idx.push(base, base + 1, base + 2, base, base + 2, base + 3)
}

function box(mesh, [w, h, d], [x, y, z]) {
  const [hx, hy, hz] = [w / 2, h / 2, d / 2]
  quad(mesh, [x, y, z + hz], [hx, 0, 0], [0, hy, 0])
  quad(mesh, [x, y, z - hz], [-hx, 0, 0], [0, hy, 0])
  quad(mesh, [x + hx, y, z], [0, 0, -hz], [0, hy, 0])
  quad(mesh, [x - hx, y, z], [0, 0, hz], [0, hy, 0])
  quad(mesh, [x, y + hy, z], [hx, 0, 0], [0, 0, -hz])
  quad(mesh, [x, y - hy, z], [hx, 0, 0], [0, 0, hz])
}

const bars = newMesh()
box(bars, [W, MOULDING, DEPTH], [0, (H - MOULDING) / 2, DEPTH / 2])
box(bars, [W, MOULDING, DEPTH], [0, -(H - MOULDING) / 2, DEPTH / 2])
box(bars, [MOULDING, PRINT.h, DEPTH], [-(W - MOULDING) / 2, 0, DEPTH / 2])
box(bars, [MOULDING, PRINT.h, DEPTH], [(W - MOULDING) / 2, 0, DEPTH / 2])
const print = newMesh()
quad(print, [0, 0, DEPTH - RECESS], [PRINT.w / 2, 0, 0], [0, PRINT.h / 2, 0])

// Buffer binário: cada bufferView alinhado em 4 bytes, como o glTF exige.
const chunks = []
const bufferViews = []
const accessors = []
function view(data, target) {
  const byteOffset = chunks.reduce((n, c) => n + c.length, 0)
  bufferViews.push({ buffer: 0, byteOffset, byteLength: data.length, ...(target && { target }) })
  chunks.push(data, Buffer.alloc((4 - (data.length % 4)) % 4))
  return bufferViews.length - 1
}
function accessor(values, type) {
  const size = { SCALAR: 1, VEC2: 2, VEC3: 3 }[type]
  const index = type === 'SCALAR'
  const typed = index ? new Uint16Array(values) : new Float32Array(values)
  const acc = {
    bufferView: view(Buffer.from(typed.buffer), index ? 34963 : 34962),
    componentType: index ? 5123 : 5126,
    count: typed.length / size,
    type,
  }
  if (type === 'VEC3') { // min/max são obrigatórios em POSITION
    const axis = (k) => Array.from(typed).filter((_, i) => i % 3 === k)
    acc.min = [0, 1, 2].map((k) => Math.min(...axis(k)))
    acc.max = [0, 1, 2].map((k) => Math.max(...axis(k)))
  }
  accessors.push(acc)
  return accessors.length - 1
}
const primitive = (mesh, material) => ({
  attributes: { POSITION: accessor(mesh.pos, 'VEC3'), NORMAL: accessor(mesh.nor, 'VEC3'), TEXCOORD_0: accessor(mesh.uv, 'VEC2') },
  indices: accessor(mesh.idx, 'SCALAR'),
  material,
})
const primitives = [primitive(bars, 0), primitive(print, 1)]
// JPEG baseline: o original é progressivo, e quem decodifica aqui é o app de AR, não o navegador.
const jpeg = await sharp(path.join(root, PRINT.src)).jpeg({ quality: 90, progressive: false }).toBuffer()
const image = view(jpeg)
const bin = Buffer.concat(chunks)

const gltf = {
  asset: { version: '2.0', generator: 'tnes scripts/build-ar-glb.mjs' },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ name: 'frame', mesh: 0 }],
  meshes: [{ primitives }],
  materials: [
    { name: 'moulding', pbrMetallicRoughness: { baseColorFactor: [0.003, 0.003, 0.003, 1], metallicFactor: 0, roughnessFactor: 0.55 } },
    { name: 'print', pbrMetallicRoughness: { baseColorTexture: { index: 0 }, metallicFactor: 0, roughnessFactor: 0.85 } },
  ],
  textures: [{ sampler: 0, source: 0 }],
  samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 33071, wrapT: 33071 }],
  images: [{ bufferView: image, mimeType: 'image/jpeg' }],
  accessors,
  bufferViews,
  buffers: [{ byteLength: bin.length }],
}

const json = Buffer.from(JSON.stringify(gltf))
const jsonChunk = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 0x20)])
const u32 = (...values) => Buffer.from(new Uint32Array(values).buffer)
const glb = Buffer.concat([
  u32(0x46546c67, 2, 12 + 8 + jsonChunk.length + 8 + bin.length), // 'glTF', versão, tamanho total
  u32(jsonChunk.length, 0x4e4f534a), jsonChunk, // chunk JSON
  u32(bin.length, 0x004e4942), bin, // chunk BIN
])

// O tamanho real é o motivo da POC: a caixa do modelo tem que bater com o quadro em metros.
const [min, max] = [accessors[primitives[0].attributes.POSITION].min, accessors[primitives[0].attributes.POSITION].max]
const size = max.map((v, k) => v - min[k])
;[W, H, DEPTH].forEach((expected, k) => assert(Math.abs(size[k] - expected) < 1e-6, `eixo ${k}: ${size[k]} m, esperado ${expected} m`))
assert(glb.length < 15e6, 'O Scene Viewer recusa modelos acima de 15 MB')

await writeFile(path.join(root, OUT), glb)
console.log(`${OUT}: ${(glb.length / 1024).toFixed(0)} kB, ${(W * 100).toFixed(1)} x ${(H * 100).toFixed(1)} x ${(DEPTH * 100).toFixed(1)} cm`)

// Builds the framed print of the AR prototype (public/prototype-3d) as two static files:
//   .glb   Android — Scene Viewer downloads the model itself, so a GLB assembled in the
//          browser (a blob: URL) never reaches it; WebXR in Chrome reads the same file
//   .usdz  iPhone — AR Quick Look, anchored to a vertical plane
// Both are in metres, at the print's real size, which is the point of the prototype.
// The geometry and the .usdz writer live in public/prototype-3d/lab/models.js, shared with the
// true-size page, which builds any work's model in the browser.
// usage: node scripts/build-ar-models.mjs
import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { bounds, buildUsdz, frameMeshes, groups, toUsd } from '../public/prototype-3d/lab/models.js'

const root = path.resolve(import.meta.dirname, '..')
const IN = 0.0254
const PRINT = { w: 36 * IN, h: 24 * IN, src: 'public/artworks/rio-runner.jpg' }
const MOULDING = 0.03 // the regular frame's face, as in src/lib/wall.ts
const DEPTH = 0.03 // how far the frame stands off the wall
const RECESS = 0.008 // the print sits a little behind the frame's face
const OUT = 'public/prototype-3d/rio-runner-36x24'
const W = PRINT.w + 2 * MOULDING
const H = PRINT.h + 2 * MOULDING
const MOULDING_COLOR = [0.003, 0.003, 0.003] // #0a0a0a in linear light
const ROUGHNESS = { moulding: 0.55, print: 0.85 }

const { body: bars, print } = frameMeshes({ w: PRINT.w, h: PRINT.h, moulding: MOULDING, depth: DEPTH, recess: RECESS })

// Baseline JPEG: the source is progressive, and the decoder here is the phone's AR viewer,
// not a browser.
const jpeg = await sharp(path.join(root, PRINT.src)).jpeg({ quality: 90, progressive: false }).toBuffer()

// ---- GLB ------------------------------------------------------------------------------------

function buildGlb() {
  // One binary buffer; glTF wants every bufferView on a 4-byte boundary.
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
    // POSITION must carry min/max, and they have to match the float32 values exactly.
    if (type === 'VEC3') [acc.min, acc.max] = bounds(groups(Array.from(typed), 3))
    accessors.push(acc)
    return accessors.length - 1
  }
  const primitive = (mesh, material) => ({
    attributes: { POSITION: accessor(mesh.pos, 'VEC3'), NORMAL: accessor(mesh.nor, 'VEC3'), TEXCOORD_0: accessor(mesh.uv, 'VEC2') },
    indices: accessor(mesh.idx, 'SCALAR'),
    material,
  })
  const primitives = [primitive(bars, 0), primitive(print, 1)]
  const image = view(jpeg)
  const bin = Buffer.concat(chunks)

  const gltf = {
    asset: { version: '2.0', generator: 'tnes scripts/build-ar-models.mjs' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: 'frame', mesh: 0 }],
    meshes: [{ primitives }],
    materials: [
      { name: 'moulding', pbrMetallicRoughness: { baseColorFactor: [...MOULDING_COLOR, 1], metallicFactor: 0, roughnessFactor: ROUGHNESS.moulding } },
      { name: 'print', pbrMetallicRoughness: { baseColorTexture: { index: 0 }, metallicFactor: 0, roughnessFactor: ROUGHNESS.print } },
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
  const u32 = (...values) => {
    const b = Buffer.alloc(values.length * 4)
    values.forEach((v, i) => b.writeUInt32LE(v, i * 4))
    return b
  }
  return Buffer.concat([
    u32(0x46546c67, 2, 12 + 8 + jsonChunk.length + 8 + bin.length), // 'glTF', version, total length
    u32(jsonChunk.length, 0x4e4f534a), jsonChunk, // JSON chunk
    u32(bin.length, 0x004e4942), bin, // BIN chunk
  ])
}

// ---- check and write ------------------------------------------------------------------------

// True size is the whole point: the model's box has to be the frame, in metres, in both files.
const size = (points) => { const [min, max] = bounds(points); return max.map((v, k) => v - min[k]) }
const close = (a, b) => a.every((v, k) => Math.abs(v - b[k]) < 1e-6)
const frame = [...groups(bars.pos, 3), ...groups(print.pos, 3)]
assert(close(size(frame), [W, H, DEPTH]), `glb box ${size(frame)}`)
assert(close(size(frame.map(toUsd)), [W, DEPTH, H]), `usdz box ${size(frame.map(toUsd))}`)

const glb = buildGlb()
const usdz = buildUsdz({ body: bars, print }, jpeg, { bodyColor: MOULDING_COLOR, bodyRoughness: ROUGHNESS.moulding, printRoughness: ROUGHNESS.print })
assert(glb.length < 15e6, 'Scene Viewer refuses models over 15 MB')
await writeFile(path.join(root, `${OUT}.glb`), glb)
await writeFile(path.join(root, `${OUT}.usdz`), usdz)
const kB = (buffer) => `${(buffer.length / 1024).toFixed(0)} kB`
console.log(`${OUT}: glb ${kB(glb)}, usdz ${kB(usdz)}, ${(W * 100).toFixed(1)} x ${(H * 100).toFixed(1)} x ${(DEPTH * 100).toFixed(1)} cm`)

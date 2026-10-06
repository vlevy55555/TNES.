// Builds the framed print of the AR prototype (public/prototype-3d) as two static files:
//   .glb   Android — Scene Viewer downloads the model itself, so a GLB assembled in the
//          browser (a blob: URL) never reaches it; WebXR in Chrome reads the same file
//   .usdz  iPhone — AR Quick Look, anchored to a vertical plane
// Both are in metres, at the print's real size, which is the point of the prototype.
// usage: node scripts/build-ar-models.mjs
import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { crc32 } from 'node:zlib'
import sharp from 'sharp'

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

// Geometry in glTF axes: +Y up, back at z=0 (the side against the wall), front facing +Z.
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const newMesh = () => ({ pos: [], nor: [], uv: [], idx: [] })

// One rectangle: centre `o`, half-sides `u` and `v`. It faces along u x v, and its texture
// stands upright with `u` to the right and `v` up.
function quad(mesh, o, u, v) {
  const n = cross(u, v)
  const len = Math.hypot(...n)
  const base = mesh.pos.length / 3
  for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    mesh.pos.push(o[0] + a * u[0] + b * v[0], o[1] + a * u[1] + b * v[1], o[2] + a * u[2] + b * v[2])
    mesh.nor.push(n[0] / len, n[1] / len, n[2] / len)
    mesh.uv.push((a + 1) / 2, (1 - b) / 2) // glTF: v=0 is the top of the image
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

// Baseline JPEG: the source is progressive, and the decoder here is the phone's AR viewer,
// not a browser.
const jpeg = await sharp(path.join(root, PRINT.src)).jpeg({ quality: 90, progressive: false }).toBuffer()

const groups = (flat, size) => Array.from({ length: flat.length / size }, (_, i) => flat.slice(i * size, (i + 1) * size))
const bounds = (points) => [Math.min, Math.max].map((pick) => [0, 1, 2].map((k) => pick(...points.map((p) => p[k]))))

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

// ---- USDZ -----------------------------------------------------------------------------------

// Quick Look hangs a vertically anchored model by its own XZ plane: +Y is the wall's normal
// and -Z is up. Left in glTF axes the frame comes out perpendicular to the wall, so it is laid
// on its back here: (x, y, z) -> (x, z, -y).
const toUsd = ([x, y, z]) => [x, z, -y]
const tuple = (values) => `(${values.map((n) => +n.toFixed(6)).join(', ')})`

function usdMesh(name, mesh, material) {
  const points = groups(mesh.pos, 3).map(toUsd)
  const normals = groups(mesh.nor, 3).map(toUsd)
  const st = groups(mesh.uv, 2).map(([u, v]) => [u, 1 - v]) // USD: v=0 is the bottom of the image
  return `    def Mesh "${name}" (
        prepend apiSchemas = ["MaterialBindingAPI"]
    )
    {
        uniform token subdivisionScheme = "none"
        float3[] extent = [${bounds(points).map(tuple).join(', ')}]
        int[] faceVertexCounts = [${points.map((_, i) => i).filter((i) => i % 4 === 0).map(() => 4).join(', ')}]
        int[] faceVertexIndices = [${points.map((_, i) => i).join(', ')}]
        point3f[] points = [${points.map(tuple).join(', ')}]
        normal3f[] normals = [${normals.map(tuple).join(', ')}] (
            interpolation = "vertex"
        )
        texCoord2f[] primvars:st = [${st.map(tuple).join(', ')}] (
            interpolation = "vertex"
        )
        rel material:binding = </Artwork/Looks/${material}>
    }`
}

function usdMaterial(name, color, roughness, texture) {
  const at = `</Artwork/Looks/${name}`
  return `        def Material "${name}"
        {
            token outputs:surface.connect = ${at}/Surface.outputs:surface>

            def Shader "Surface"
            {
                uniform token info:id = "UsdPreviewSurface"
                color3f inputs:diffuseColor${texture ? `.connect = ${at}/Texture.outputs:rgb>` : ` = ${tuple(color)}`}
                float inputs:roughness = ${roughness}
                float inputs:metallic = 0
                token outputs:surface
            }${texture ? `

            def Shader "UV"
            {
                uniform token info:id = "UsdPrimvarReader_float2"
                token inputs:varname = "st"
                float2 outputs:result
            }

            def Shader "Texture"
            {
                uniform token info:id = "UsdUVTexture"
                asset inputs:file = @${texture}@
                token inputs:sourceColorSpace = "sRGB"
                token inputs:wrapS = "clamp"
                token inputs:wrapT = "clamp"
                float2 inputs:st.connect = ${at}/UV.outputs:result>
                float3 outputs:rgb
            }` : ''}
        }`
}

// A .usdz is a ZIP with nothing compressed and every file's bytes on a 64-byte boundary,
// the USD layer first.
function usdzip(entries) {
  const chunks = []
  const central = []
  let offset = 0
  for (const [name, data] of entries) {
    const file = Buffer.from(name)
    const crc = crc32(data)
    let padding = (64 - ((offset + 30 + file.length) % 64)) % 64
    if (padding > 0 && padding < 4) padding += 64 // the padding is an extra field, and that needs a 4-byte header
    const local = Buffer.alloc(30 + file.length + padding)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(data.length, 18)
    local.writeUInt32LE(data.length, 22)
    local.writeUInt16LE(file.length, 26)
    local.writeUInt16LE(padding, 28)
    file.copy(local, 30)
    if (padding) {
      local.writeUInt16LE(0x1986, 30 + file.length)
      local.writeUInt16LE(padding - 4, 32 + file.length)
    }
    assert((offset + local.length) % 64 === 0, `${name} is not on a 64-byte boundary`)
    const entry = Buffer.alloc(46 + file.length)
    entry.writeUInt32LE(0x02014b50, 0)
    entry.writeUInt16LE(20, 4)
    entry.writeUInt16LE(20, 6)
    entry.writeUInt32LE(crc, 16)
    entry.writeUInt32LE(data.length, 20)
    entry.writeUInt32LE(data.length, 24)
    entry.writeUInt16LE(file.length, 28)
    entry.writeUInt32LE(offset, 42)
    file.copy(entry, 46)
    chunks.push(local, data)
    central.push(entry)
    offset += local.length + data.length
  }
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(entries.length, 8)
  end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(central.reduce((n, c) => n + c.length, 0), 12)
  end.writeUInt32LE(offset, 16)
  return Buffer.concat([...chunks, ...central, end])
}

function buildUsdz() {
  const usda = `#usda 1.0
(
    defaultPrim = "Artwork"
    metersPerUnit = 1
    upAxis = "Y"
)

def Xform "Artwork" (
    kind = "component"
    prepend apiSchemas = ["Preliminary_AnchoringAPI"]
)
{
    uniform token preliminary:anchoring:type = "plane"
    uniform token preliminary:planeAnchoring:alignment = "vertical"

${usdMesh('Moulding', bars, 'Moulding')}

${usdMesh('Print', print, 'Print')}

    def Scope "Looks"
    {
${usdMaterial('Moulding', MOULDING_COLOR, ROUGHNESS.moulding)}

${usdMaterial('Print', [1, 1, 1], ROUGHNESS.print, 'print.jpg')}
    }
}
`
  return usdzip([['model.usda', Buffer.from(usda)], ['print.jpg', jpeg]])
}

// ---- check and write ------------------------------------------------------------------------

// True size is the whole point: the model's box has to be the frame, in metres, in both files.
const size = (points) => { const [min, max] = bounds(points); return max.map((v, k) => v - min[k]) }
const close = (a, b) => a.every((v, k) => Math.abs(v - b[k]) < 1e-6)
const frame = [...groups(bars.pos, 3), ...groups(print.pos, 3)]
assert(close(size(frame), [W, H, DEPTH]), `glb box ${size(frame)}`)
assert(close(size(frame.map(toUsd)), [W, DEPTH, H]), `usdz box ${size(frame.map(toUsd))}`)

const glb = buildGlb()
const usdz = buildUsdz()
assert(glb.length < 15e6, 'Scene Viewer refuses models over 15 MB')
await writeFile(path.join(root, `${OUT}.glb`), glb)
await writeFile(path.join(root, `${OUT}.usdz`), usdz)
const kB = (buffer) => `${(buffer.length / 1024).toFixed(0)} kB`
console.log(`${OUT}: glb ${kB(glb)}, usdz ${kB(usdz)}, ${(W * 100).toFixed(1)} x ${(H * 100).toFixed(1)} x ${(DEPTH * 100).toFixed(1)} cm`)

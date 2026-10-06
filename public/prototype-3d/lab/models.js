// The framed print as numbers, and as a .usdz file. Plain typed arrays and no platform APIs
// beyond TextEncoder, so the same code runs in the browser (the true-size page builds a work's
// model on the spot) and in node (scripts/build-ar-models.mjs writes the prototype's files).
// Metres throughout, +Y up, back at z=0 against the wall, front facing +Z.

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

/**
 * The two meshes of a hung work: `body` is what holds the print (four bars of moulding, or,
 * with no moulding, the slab the print is mounted on) and `print` is the picture's face.
 * `w` and `h` are the print's own size; `depth` is how far the body stands off the wall;
 * `recess` is how far the print sits behind a moulding's face.
 */
export function frameMeshes({ w, h, moulding, depth, recess = 0 }) {
  const body = newMesh()
  const print = newMesh()
  const [W, H] = [w + 2 * moulding, h + 2 * moulding]
  if (moulding > 0) {
    box(body, [W, moulding, depth], [0, (H - moulding) / 2, depth / 2])
    box(body, [W, moulding, depth], [0, -(H - moulding) / 2, depth / 2])
    box(body, [moulding, h, depth], [-(W - moulding) / 2, 0, depth / 2])
    box(body, [moulding, h, depth], [(W - moulding) / 2, 0, depth / 2])
    quad(print, [0, 0, depth - recess], [w / 2, 0, 0], [0, h / 2, 0])
  } else {
    box(body, [w, h, depth], [0, 0, depth / 2])
    quad(print, [0, 0, depth + 0.0005], [w / 2, 0, 0], [0, h / 2, 0]) // just proud of the slab, so the two never fight
  }
  return { body, print, size: [W, H, depth] }
}

export const groups = (flat, size) => Array.from({ length: flat.length / size }, (_, i) => flat.slice(i * size, (i + 1) * size))
export const bounds = (points) => [Math.min, Math.max].map((pick) => [0, 1, 2].map((k) => pick(...points.map((p) => p[k]))))

// ---- USDZ -----------------------------------------------------------------------------------

// Quick Look hangs a vertically anchored model by its own XZ plane: +Y is the wall's normal
// and -Z is up. Left in glTF axes the frame comes out perpendicular to the wall, so it is laid
// on its back here: (x, y, z) -> (x, z, -y).
export const toUsd = ([x, y, z]) => [x, z, -y]
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

const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0)
  return c >>> 0
})
export function crc32(bytes) {
  let c = 0xffffffff
  for (const b of bytes) c = (c >>> 8) ^ CRC_TABLE[(c ^ b) & 255]
  return (c ^ 0xffffffff) >>> 0
}

const concat = (parts) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let at = 0
  for (const part of parts) { out.set(part, at); at += part.length }
  return out
}

// A .usdz is a ZIP with nothing compressed and every file's bytes on a 64-byte boundary,
// the USD layer first.
function usdzip(entries) {
  const chunks = []
  const central = []
  let offset = 0
  for (const [name, data] of entries) {
    const file = new TextEncoder().encode(name)
    const crc = crc32(data)
    let padding = (64 - ((offset + 30 + file.length) % 64)) % 64
    if (padding > 0 && padding < 4) padding += 64 // the padding is an extra field, and that needs a 4-byte header
    const local = new Uint8Array(30 + file.length + padding)
    const lv = new DataView(local.buffer)
    lv.setUint32(0, 0x04034b50, true)
    lv.setUint16(4, 20, true)
    lv.setUint32(14, crc, true)
    lv.setUint32(18, data.length, true)
    lv.setUint32(22, data.length, true)
    lv.setUint16(26, file.length, true)
    lv.setUint16(28, padding, true)
    local.set(file, 30)
    if (padding) {
      lv.setUint16(30 + file.length, 0x1986, true)
      lv.setUint16(32 + file.length, padding - 4, true)
    }
    if ((offset + local.length) % 64 !== 0) throw new Error(`${name} is not on a 64-byte boundary`)
    const entry = new Uint8Array(46 + file.length)
    const ev = new DataView(entry.buffer)
    ev.setUint32(0, 0x02014b50, true)
    ev.setUint16(4, 20, true)
    ev.setUint16(6, 20, true)
    ev.setUint32(16, crc, true)
    ev.setUint32(20, data.length, true)
    ev.setUint32(24, data.length, true)
    ev.setUint16(28, file.length, true)
    ev.setUint32(42, offset, true)
    entry.set(file, 46)
    chunks.push(local, data)
    central.push(entry)
    offset += local.length + data.length
  }
  const end = new Uint8Array(22)
  const dv = new DataView(end.buffer)
  dv.setUint32(0, 0x06054b50, true)
  dv.setUint16(8, entries.length, true)
  dv.setUint16(10, entries.length, true)
  dv.setUint32(12, central.reduce((n, c) => n + c.length, 0), true)
  dv.setUint32(16, offset, true)
  return concat([...chunks, ...central, end])
}

/**
 * The .usdz of a hung work, anchored to a vertical plane. `jpeg` is the picture as JPEG bytes,
 * `bodyColor` the body's colour in linear light.
 */
export function buildUsdz({ body, print }, jpeg, { bodyColor, bodyRoughness = 0.55, printRoughness = 0.85 }) {
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

${usdMesh('Moulding', body, 'Moulding')}

${usdMesh('Print', print, 'Print')}

    def Scope "Looks"
    {
${usdMaterial('Moulding', bodyColor, bodyRoughness)}

${usdMaterial('Print', [1, 1, 1], printRoughness, 'print.jpg')}
    }
}
`
  return usdzip([['model.usda', new TextEncoder().encode(usda)], ['print.jpg', jpeg]])
}

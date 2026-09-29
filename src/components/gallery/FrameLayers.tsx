import { useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { CanvasTexture, Color, EdgesGeometry, BoxGeometry, ExtrudeGeometry, Matrix4, Path, Vector3, PMREMGenerator, Shape, type Texture, type WebGLRenderer } from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { type FrameStyle } from '../../data/artworks'

// ponytail: radial-gradient canvas as fake soft shadow — no shadow maps needed
function makeShadowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(64, 64, 24, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(31, 27, 21, 0.46)')
  gradient.addColorStop(0.52, 'rgba(31, 27, 21, 0.16)')
  gradient.addColorStop(1, 'rgba(40,30,15,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 128, 128)
  return new CanvasTexture(canvas)
}

function makeBackMarkTexture(color: string) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 512
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, 512, 512)
  ctx.fillStyle = color
  ctx.font = '400 230px Helvetica, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('[O]', 256, 266)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = 'srgb'
  return texture
}
/** shared by anything that needs to sit proud of a wall — frames, the Countdown plate */
export const shadowTexture = makeShadowTexture()

/**
 * A flat gain on the print material. The photographs are unlit and exempt from
 * tone mapping — deliberately, so a print keeps its true colour under the warm
 * lamps — which means neither the lights nor the exposure curve can lift them.
 * A >1 colour multiply is the only lever there is. Kept modest: this clips
 * highlights, and the whole point of `toneMapped={false}` is fidelity.
 */
const PRINT_GAIN = new Color(1.16, 1.16, 1.16)

type FrameSpec = {
  outerBorder: number
  mat: number
  imageScale: number
  frameColor: string
  matColor: string
  roughness: number
  metalness: number
  clearcoat: number
  emissive: string
  emissiveIntensity: number
  depth: number
  bevelSize: number
  bevelThickness: number
}

function frameSpec(style: FrameStyle): FrameSpec {
  // glass (plexiglass) and aluminium are the same borderless mount
  if (style === 'unframed' || style === 'glass' || style === 'aluminium') {
    return {
      outerBorder: 0,
      mat: 0,
      imageScale: 1,
      frameColor: '#f4f0e8',
      matColor: '#f4f0e8',
      roughness: 0.9,
      metalness: 0,
      clearcoat: 0,
      emissive: '#000000',
      emissiveIntensity: 0,
      depth: 0.018,
      bevelSize: 0,
      bevelThickness: 0,
    }
  }
  if (style === 'white') {
    return {
      outerBorder: 0.22,
      mat: 0.035,
      imageScale: 1.2,
      // warm white, not the grey-beige it used to be: under the warm spots and
      // ACES tone mapping the old #bdb8ae read as plain grey
      frameColor: '#e6dfd1',
      matColor: '#faf7f0',
      roughness: 0.72,
      metalness: 0,
      clearcoat: 0,
      emissive: '#000000',
      emissiveIntensity: 0,
      depth: 0.042,
      bevelSize: 0.004,
      bevelThickness: 0.004,
    }
  }
  if (style === 'black') {
    return {
      outerBorder: 0.21,
      mat: 0.016,
      imageScale: 1.15,
      frameColor: '#262522',
      matColor: '#171614',
      roughness: 0.52,
      metalness: 0.02,
      clearcoat: 0.02,
      emissive: '#000000',
      emissiveIntensity: 0,
      depth: 0.045,
      bevelSize: 0.003,
      bevelThickness: 0.003,
    }
  }
  return {
    outerBorder: 0.21,
    mat: 0.016,
    imageScale: 1.15,
    frameColor: '#262522',
    matColor: '#171614',
    roughness: 0.52,
    metalness: 0.02,
    clearcoat: 0.02,
    emissive: '#000000',
    emissiveIntensity: 0,
    depth: 0.045,
    bevelSize: 0.003,
    bevelThickness: 0.003,
  }
}

export function frameOuterDimensions(w: number, h: number, style: FrameStyle) {
  const { outerBorder, mat, imageScale } = frameSpec(style)
  // Uniform moulding on all four sides. With imageScale > 1 the photo grows
  // proportionally to w/h while outerBorder is fixed, so the long axis used
  // to end up with a thinner band than the short one — standardize every
  // side on that thin value instead of letting each axis differ.
  const band = outerBorder - mat - (Math.max(w, h) * (imageScale - 1)) / 2
  const frameW = w * imageScale + 2 * (mat + band)
  const frameH = h * imageScale + 2 * (mat + band)
  return [frameW, frameH] as const
}

export function framePhotoDimensions(w: number, h: number, style: FrameStyle) {
  const scale = frameSpec(style).imageScale
  return [w * scale, h * scale] as const
}

function mouldingShape(outerW: number, outerH: number, innerW: number, innerH: number) {
  const shape = new Shape()
  shape.moveTo(-outerW / 2, -outerH / 2)
  shape.lineTo(outerW / 2, -outerH / 2)
  shape.lineTo(outerW / 2, outerH / 2)
  shape.lineTo(-outerW / 2, outerH / 2)
  shape.closePath()

  const opening = new Path()
  opening.moveTo(-innerW / 2, -innerH / 2)
  opening.lineTo(-innerW / 2, innerH / 2)
  opening.lineTo(innerW / 2, innerH / 2)
  opening.lineTo(innerW / 2, -innerH / 2)
  opening.closePath()
  shape.holes.push(opening)
  return shape
}

function Moulding({
  outerW,
  outerH,
  innerW,
  innerH,
  color,
  roughness,
  metalness,
  clearcoat,
  emissive,
  emissiveIntensity,
  depth = 0.12,
  z = 0,
  bevelSize = 0.01,
  bevelThickness = 0.01,
}: {
  outerW: number
  outerH: number
  innerW: number
  innerH: number
  color: string
  roughness: number
  metalness: number
  clearcoat: number
  emissive: string
  emissiveIntensity: number
  depth?: number
  z?: number
  bevelSize?: number
  bevelThickness?: number
}) {
  const shape = useMemo(
    () => mouldingShape(outerW, outerH, innerW, innerH),
    [outerW, outerH, innerW, innerH],
  )

  return (
    <mesh position={[0, 0, z]} castShadow receiveShadow>
      <extrudeGeometry args={[shape, { depth, bevelEnabled: true, bevelSize, bevelThickness, bevelSegments: 2 }]} />
      <meshPhysicalMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        clearcoat={clearcoat}
        clearcoatRoughness={0.18}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
      />
    </mesh>
  )
}

// One prefiltered room per renderer, so the glass has something to reflect
// without changing how the frames (which have no env map) are lit.
const roomEnvs = new WeakMap<WebGLRenderer, Texture>()
function roomEnv(gl: WebGLRenderer) {
  let env = roomEnvs.get(gl)
  if (!env) {
    const pmrem = new PMREMGenerator(gl)
    env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    pmrem.dispose()
    roomEnvs.set(gl, env)
  }
  return env
}

// C-channel aluminium profile, as in a strut rail: a square tube whose back face
// is open along its length, the slot edges turned inward as lips.
const RAIL = 0.045 // outer section, ~1" at print scale
const RAIL_WALL = 0.004
const RAIL_LIP = 0.012
const RAIL_SLOT = RAIL * 0.5

function railProfile() {
  const s = RAIL / 2
  const t = RAIL_WALL
  const g = RAIL_SLOT / 2
  // x across the rail, y depth: 0 = open back (wall side), RAIL = against the panel
  const pts: [number, number][] = [
    [-s, 0], [-g, 0], [-g, RAIL_LIP], [-g - t, RAIL_LIP], [-g - t, t], [-s + t, t],
    [-s + t, RAIL - t], [s - t, RAIL - t], [s - t, t], [g + t, t], [g + t, RAIL_LIP],
    [g, RAIL_LIP], [g, 0], [s, 0], [s, RAIL], [-s, RAIL],
  ]
  const shape = new Shape()
  shape.moveTo(...pts[0])
  pts.slice(1).forEach((p) => shape.lineTo(...p))
  shape.closePath()
  return shape
}

/** One rail `length` long, centred, running along world X or Y, open side to -Z. */
function railGeometry(length: number, along: 'x' | 'y') {
  const geo = new ExtrudeGeometry(railProfile(), { depth: length, bevelEnabled: false })
  geo.translate(0, 0, -length / 2)
  // local x = across, local y = depth (-> world z), local z = length
  const basis = along === 'x'
    ? new Matrix4().makeBasis(new Vector3(0, 1, 0), new Vector3(0, 0, 1), new Vector3(1, 0, 0))
    : new Matrix4().makeBasis(new Vector3(1, 0, 0), new Vector3(0, 0, 1), new Vector3(0, -1, 0))
  geo.applyMatrix4(basis)
  return geo
}

/**
 * The print mounted on a thin panel with a white back, held off the wall by a
 * subframe of C-channel aluminium rails joined at the corners by L-brackets
 * bolted through the slot. From the front only the photo shows.
 */
function AluminiumSupport({
  texture,
  w,
  h,
  backdrop,
  backMark,
  glazed = false,
}: {
  texture: Texture
  w: number
  h: number
  backdrop: boolean
  backMark: Texture | null
  /** Plexiglass: the same mount with a thin reflective acrylic sheet over the print. */
  glazed?: boolean
}) {
  const gl = useThree((s) => s.gl)
  const env = useMemo(() => roomEnv(gl), [gl])
  // a thin composite sheet (~3 mm at print scale), not a board
  const panel = 0.008
  // the rails are the standoff: panel sits right on their closed face
  const standoff = RAIL
  // subframe close to the edge, as on the real mount, but inset enough that
  // the panel still reads as floating from the side
  const sw = w * 0.86
  const sh = h * 0.8
  const panelZ = standoff + panel / 2
  const x = sw / 2 - RAIL / 2
  const y = sh / 2 - RAIL / 2
  const rails = useMemo(() => {
    const across = railGeometry(sw, 'x')
    const up = railGeometry(sh - RAIL * 2, 'y')
    const at = (geo: ExtrudeGeometry, px: number, py: number) => ({ geo, pos: [px, py, 0] as [number, number, number] })
    return [at(across, 0, y), at(across, 0, -y), at(up, -x, 0), at(up, x, 0)]
  }, [sw, sh, x, y])
  // an L-bracket leg sits inside each rail end, one bolt head on it in the slot
  const leg = RAIL * 1.6
  const corners = [[-1, 1], [1, 1], [-1, -1], [1, -1]] as const

  const metal = <meshStandardMaterial color="#c3c7cb" metalness={0.8} roughness={0.38} envMap={env} envMapIntensity={1.2} side={2} />
  const steel = <meshStandardMaterial color="#8d9296" metalness={0.9} roughness={0.3} envMap={env} envMapIntensity={1.4} />

  return (
    <>
      {backdrop && (
        <mesh position={[0.07, -0.1, -0.022]}>
          <planeGeometry args={[w + 0.3, h + 0.3]} />
          <meshBasicMaterial map={shadowTexture} transparent depthWrite={false} />
        </mesh>
      )}
      {rails.map((r, i) => (
        <mesh key={i} geometry={r.geo} position={r.pos} castShadow>
          {metal}
        </mesh>
      ))}
      {/* the channel's shadowed floor, so the slot reads as an opening */}
      {([[0, y, sw, RAIL], [0, -y, sw, RAIL], [-x, 0, RAIL, sh - RAIL * 2], [x, 0, RAIL, sh - RAIL * 2]] as const).map(
        ([px, py, pw, ph], i) => (
          <mesh key={i} position={[px, py, RAIL - RAIL_WALL - 0.0005]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[pw === RAIL ? RAIL - RAIL_WALL * 2 : pw, ph === RAIL ? RAIL - RAIL_WALL * 2 : ph]} />
            <meshStandardMaterial color="#80868b" metalness={0.5} roughness={0.6} />
          </mesh>
        ),
      )}
      {corners.map(([cx, cy], i) => (
        <group key={i}>
          {/* bracket legs, seen through the slot */}
          <mesh position={[cx * (x - leg / 2 + RAIL / 2), cy * y, RAIL_LIP + 0.004]}>
            <boxGeometry args={[leg, RAIL - RAIL_WALL * 3, 0.006]} />
            {steel}
          </mesh>
          <mesh position={[cx * x, cy * (y - leg / 2 + RAIL / 2), RAIL_LIP + 0.004]}>
            <boxGeometry args={[RAIL - RAIL_WALL * 3, leg, 0.006]} />
            {steel}
          </mesh>
          {/* hex bolt heads across the slot, one per leg */}
          {[
            [cx * (x - leg * 0.55), cy * y],
            [cx * x, cy * (y - leg * 0.55)],
          ].map(([bx, by], j) => (
            <mesh key={j} position={[bx, by, -0.003]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[RAIL_SLOT * 0.62, RAIL_SLOT * 0.62, 0.006, 6]} />
              {steel}
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 0, panelZ]} castShadow>
        <boxGeometry args={[w, h, panel]} />
        <meshStandardMaterial color="#f4f2ee" roughness={0.6} />
      </mesh>
      {backMark && (
        <mesh position={[0, 0, standoff - 0.001]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[Math.min(sw, sh) * 0.3, Math.min(sw, sh) * 0.3]} />
          <meshBasicMaterial map={backMark} transparent toneMapped={false} />
        </mesh>
      )}
      <mesh position={[0, 0, standoff + panel + 0.001]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture} color={PRINT_GAIN} toneMapped={false} />
      </mesh>
      {glazed && <AcrylicSheet w={w} h={h} z={standoff + panel + 0.002} env={env} />}
    </>
  )
}

// ~5 mm at print scale: thin, but thick enough that the edge catches light
const SHEET = 0.016

// A soft diagonal band of window light, the glare that makes glazing read as
// glass in a photo. Painted, not lit, so it shows under any scene lighting.
const glareTexture = (() => {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')!
  const grad = g.createLinearGradient(0, 0, 256, 256)
  grad.addColorStop(0, 'rgba(255,255,255,0.22)')
  grad.addColorStop(0.3, 'rgba(255,255,255,0.08)')
  grad.addColorStop(0.42, 'rgba(255,255,255,0.45)')
  grad.addColorStop(0.5, 'rgba(255,255,255,0.1)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 256, 256)
  return new CanvasTexture(c)
})()

/** The plexiglass face: a clear slab laid on the print, reflecting the room. */
function AcrylicSheet({ w, h, z, env }: { w: number; h: number; z: number; env: Texture }) {
  const box = useMemo(() => new BoxGeometry(w, h, SHEET), [w, h])
  const edges = useMemo(() => new EdgesGeometry(box), [box])
  return (
    <group position={[0, 0, z + SHEET / 2]}>
      <mesh geometry={box}>
        <meshPhysicalMaterial
          // opacity scales the env reflection too: halve one, double the other
          // to thin the sheet without losing the sheen
          transparent
          opacity={0.14}
          color="#eef5f7"
          roughness={0.03}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.02}
          specularIntensity={1}
          envMap={env}
          envMapIntensity={7.2}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 0, SHEET / 2 + 0.0005]}>
        <planeGeometry args={[w, h]} />
        {/* raise the gradient stops in glareTexture for a stronger reflection */}
        <meshBasicMaterial map={glareTexture} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#9aa5ad" transparent opacity={0.7} />
      </lineSegments>
    </group>
  )
}

/** Shared physical construction for every finish the shop sells. */
export function FrameLayers({
  texture,
  w,
  h,
  style,
  /** The painted-on wall shadow. Off for anything free-standing, which casts a
   *  real one and would otherwise show this plane edge-on when turned. */
  backdrop = true,
  flushPhoto = false,
  brandedBack = false,
}: {
  texture: Texture
  w: number
  h: number
  style: FrameStyle
  backdrop?: boolean
  /** Product previews omit the paper mat so the print reaches the moulding. */
  flushPhoto?: boolean
  /** Product previews carry the TNES. [O] mark on the reverse. */
  brandedBack?: boolean
}) {
  const spec = frameSpec(style)
  const backMark = useMemo(
    () => makeBackMarkTexture(style === 'black' ? '#ffffff' : '#111111'),
    [style],
  )
  if (style === 'aluminium' || style === 'glass') {
    return (
      <AluminiumSupport
        texture={texture}
        w={w}
        h={h}
        backdrop={backdrop}
        backMark={brandedBack ? backMark : null}
        glazed={style === 'glass'}
      />
    )
  }
  const [frameW, frameH] = frameOuterDimensions(w, h, style)
  const [photoW, photoH] = framePhotoDimensions(w, h, style)
  const innerW = photoW + (flushPhoto ? 0 : spec.mat * 2)
  const innerH = photoH + (flushPhoto ? 0 : spec.mat * 2)
  const matZ = Math.max(0.018, spec.depth - 0.024)
  const photoZ = Math.max(0.028, spec.depth - 0.006)
  const backColor = style === 'black' ? '#171614' : '#e6dfd1'

  // A bare print is not a zero-width moulding: it is a thin sheet with only a
  // close wall shadow, so the selected option visibly changes the 3D object.
  if (style === 'unframed') {
    return (
      <>
        {backdrop && (
          <mesh position={[0.04, -0.06, -0.018]}>
            <planeGeometry args={[frameW + 0.18, frameH + 0.18]} />
            <meshBasicMaterial map={shadowTexture} transparent depthWrite={false} />
          </mesh>
        )}
        {brandedBack && (
          <>
            <mesh position={[0, 0, -0.012]} castShadow>
              <boxGeometry args={[frameW, frameH, 0.02]} />
              <meshStandardMaterial color={spec.frameColor} roughness={0.9} />
            </mesh>
            <mesh position={[0, 0, -0.024]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[Math.min(frameW, frameH) * 0.5, Math.min(frameW, frameH) * 0.5]} />
              <meshBasicMaterial map={backMark} transparent toneMapped={false} />
            </mesh>
          </>
        )}
        <mesh position={[0, 0, 0.014]} castShadow>
          <planeGeometry args={[photoW, photoH]} />
          <meshBasicMaterial map={texture} color={PRINT_GAIN} toneMapped={false} />
        </mesh>
      </>
    )
  }

  return (
    <>
      {/* The soft contact shadow keeps the frame grounded even before inspection. */}
      {backdrop && (
        <mesh position={[0.07, -0.1, -0.022]}>
          <planeGeometry args={[frameW + 0.42, frameH + 0.42]} />
          <meshBasicMaterial map={shadowTexture} transparent depthWrite={false} />
        </mesh>
      )}

      <Moulding
        outerW={frameW}
        outerH={frameH}
        innerW={innerW}
        innerH={innerH}
        color={spec.frameColor}
        roughness={spec.roughness}
        metalness={spec.metalness}
        clearcoat={spec.clearcoat}
        emissive={spec.emissive}
        emissiveIntensity={spec.emissiveIntensity}
        depth={spec.depth}
        bevelSize={spec.bevelSize}
        bevelThickness={spec.bevelThickness}
      />

      {!flushPhoto && (
        <mesh position={[0, 0, matZ]} castShadow>
          <boxGeometry args={[innerW, innerH, 0.03]} />
          <meshStandardMaterial color={spec.matColor} roughness={0.8} />
        </mesh>
      )}

      {brandedBack && (
        <>
          <mesh position={[0, 0, -0.013]} castShadow>
            <boxGeometry args={[frameW - 0.035, frameH - 0.035, 0.024]} />
            <meshStandardMaterial color={backColor} roughness={0.72} />
          </mesh>
          <mesh position={[0, 0, -0.026]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[Math.min(frameW, frameH) * 0.5, Math.min(frameW, frameH) * 0.5]} />
            <meshBasicMaterial map={backMark} transparent toneMapped={false} />
          </mesh>
        </>
      )}

      <mesh position={[0, 0, photoZ]} castShadow>
        <planeGeometry args={[photoW, photoH]} />
        <meshBasicMaterial map={texture} color={PRINT_GAIN} toneMapped={false} />
      </mesh>
    </>
  )
}

import { useMemo } from 'react'
import { CanvasTexture, Color, Path, Shape, type Texture } from 'three'
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
    outerBorder: 0.11,
    mat: 0.06,
    imageScale: 1,
    // A true polished gilt rather than muted brass: this is shared by the
    // signature hero and the archive's unified frame finish.
    frameColor: '#c89532',
    matColor: '#f4f0e7',
    roughness: 0.3,
    metalness: 0.42,
    clearcoat: 0.42,
    // Keeps gilt luminous in portions of the archive that sit outside a direct
    // spotlight, without flattening the polished highlights under it.
    emissive: '#b67a19',
    emissiveIntensity: 0.58,
    depth: 0.055,
    bevelSize: 0.005,
    bevelThickness: 0.005,
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

/** Shared physical construction for gold, white and black exhibition frames. */
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
  const [frameW, frameH] = frameOuterDimensions(w, h, style)
  const [photoW, photoH] = framePhotoDimensions(w, h, style)
  const innerW = photoW + (flushPhoto ? 0 : spec.mat * 2)
  const innerH = photoH + (flushPhoto ? 0 : spec.mat * 2)
  const matZ = Math.max(0.018, spec.depth - 0.024)
  const photoZ = Math.max(0.028, spec.depth - 0.006)
  const backColor = style === 'black' ? '#171614' : style === 'gold' ? '#c89532' : '#e6dfd1'

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

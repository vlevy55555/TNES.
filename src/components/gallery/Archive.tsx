import { Suspense, useEffect, useRef } from 'react'
import { Text } from '@react-three/drei'
import {
  CanvasTexture,
  SRGBColorSpace,
  type Object3D,
  type SpotLight,
} from 'three'
import { artworks, FONT_SANS, type Artwork } from '../../data/artworks'
import { ArtworkFrame } from './ArtworkFrame'

// dashed guide-grid baked once onto a canvas — one mesh, no per-line meshes.
function makeGridTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1000
  canvas.height = 360
  const ctx = canvas.getContext('2d')!
  ctx.strokeStyle = 'rgba(201, 189, 166, 0.25)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([10, 9])
  const step = 100
  for (let x = step; x < canvas.width; x += step) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, canvas.height)
    ctx.stroke()
  }
  for (let y = step; y < canvas.height; y += step) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(canvas.width, y)
    ctx.stroke()
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}
const gridTexture = makeGridTexture()

// GENERAL archive lighting — a broad, soft ceiling wash, NOT one lamp per frame.
// A few overlap into an even glow across the whole wall.
function WallWash({ x }: { x: number }) {
  const spot = useRef<SpotLight>(null)
  const target = useRef<Object3D>(null)
  useEffect(() => {
    if (spot.current && target.current) spot.current.target = target.current
  }, [])
  return (
    <>
      <spotLight
        ref={spot}
        position={[x, 2.55, 1.5]}
        color="#fff3e0"
        intensity={14}
        angle={0.95}
        penumbra={0.8}
        decay={1.3}
        distance={11}
      />
      <object3D ref={target} position={[x, 0.2, 0.05]} />
    </>
  )
}

// Hand-authored salon hang: 12 slots over 3 offset rows, a dense cluster
// (x ∈ [-4.5, 4.5]), varied scale, mix landscape/portrait. Each of the 6 works
// appears twice — laid out so no work sits next to (or above/below) a copy.
type Slot = { id: string; x: number; y: number; s: number }
const SLOTS: Slot[] = [
  // top row
  { id: 'wied-il-ghasri', x: -4.4, y: 2.0, s: 0.62 },
  { id: 'playa-roja', x: -1.5, y: 2.12, s: 0.58 },
  { id: 'runner', x: 1.5, y: 2.0, s: 0.64 },
  { id: 'the-pool', x: 4.4, y: 1.9, s: 0.56 },
  // middle row
  { id: 'praia-da-baleia', x: -4.5, y: 0.5, s: 0.72 },
  { id: 'lauterbrunnen', x: -1.6, y: 0.45, s: 0.62 },
  { id: 'wied-il-ghasri', x: 1.6, y: 0.55, s: 0.68 },
  { id: 'playa-roja', x: 4.5, y: 0.4, s: 0.72 },
  // bottom row
  { id: 'runner', x: -4.3, y: -1.2, s: 0.68 },
  { id: 'the-pool', x: -1.4, y: -1.35, s: 0.58 },
  { id: 'praia-da-baleia', x: 1.5, y: -1.15, s: 0.7 },
  { id: 'lauterbrunnen', x: 4.4, y: -1.3, s: 0.62 },
]

const byId = new Map<string, Artwork>(artworks.map((a) => [a.id, a]))

export function Archive() {
  return (
    <group>
      {/* backing plaster wall — floor-to-ceiling and 18 wide so it overflows the
          view (no side edges). Seated like Wall.tsx's box: bottom flush at local
          y -2.2, centre 0.265, front face at z 0 */}
      <mesh position={[0, 0.265, -0.1]}>
        <boxGeometry args={[18, 4.93, 0.2]} />
        <meshStandardMaterial color="#e8dfd2" />
      </mesh>

      {/* faint dashed grid over the frame field, just proud of the wall */}
      <mesh position={[0, 0.35, 0.02]}>
        <planeGeometry args={[10, 3.6]} />
        <meshBasicMaterial map={gridTexture} transparent depthWrite={false} toneMapped={false} />
      </mesh>

      {/* section label, top-left — Manrope tracked caps, wall-title style */}
      <Text
        font={FONT_SANS}
        fontSize={0.072}
        letterSpacing={0.34}
        color="#a99d8a"
        anchorX="left"
        anchorY="middle"
        position={[-4.8, 2.55, 0.06]}
      >
        ARCHIVE — VI
      </Text>

      {/* general wall wash (not per-frame) */}
      {[-5, 0, 5].map((x) => (
        <WallWash key={x} x={x} />
      ))}

      {/* the works — reuse ArtworkFrame (frame + mat + photo + [O] + plaque +
          click-to-zoom + hover) inside a scaled group at each slot */}
      {SLOTS.map((slot, i) => {
        const artwork = byId.get(slot.id)
        if (!artwork) return null
        return (
          <Suspense key={`frame-${i}`} fallback={null}>
            <group position={[slot.x, slot.y, 0]} scale={slot.s}>
              {/* zoom into the slot itself — never fly off to the Moments wall */}
              <ArtworkFrame artwork={artwork} position={[0, 0, 0.07]} zoomInPlace />
            </group>
          </Suspense>
        )
      })}
    </group>
  )
}

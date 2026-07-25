import { Suspense, useEffect, useRef } from 'react'
import { Text } from '@react-three/drei'
import { type Object3D, type SpotLight } from 'three'
import {
  artworks,
  FONT_SANS,
  WALL_CENTER_Y,
  WALL_HEIGHT,
  WALL_WIDTH,
  type Artwork,
} from '../../data/artworks'
import { ArtworkFrame } from './ArtworkFrame'
import { MarbleWallSurface } from './MarbleWallSurface'

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
        intensity={7}
        angle={0.82}
        penumbra={0.8}
        decay={1.3}
        distance={11}
      />
      <object3D ref={target} position={[x, 0.2, 0.05]} />
    </>
  )
}

// Hand-authored salon hang: one slot for each V1 product, across three rows.
type Slot = { id: string; x: number; y: number; s: number }
const SLOTS: Slot[] = [
  // top row
  { id: 'calpe-muralla-roja', x: -3.8, y: 2.0, s: 0.62 },
  { id: 'the-pool', x: -1.25, y: 2.12, s: 0.58 },
  { id: 'playa-roja', x: 1.25, y: 2.0, s: 0.64 },
  { id: 'runner', x: 3.8, y: 1.9, s: 0.56 },
  // middle row
  { id: 'wied-il-ghasri', x: -3.8, y: 0.5, s: 0.72 },
  { id: 'moreira-crowded-beach', x: -1.25, y: 0.45, s: 0.62 },
  { id: 'florence-dogman', x: 1.25, y: 0.55, s: 0.68 },
  { id: 'ischia-mezzatorre', x: 3.8, y: 0.4, s: 0.72 },
  // bottom row
  { id: 'ditch-plains-far', x: -3.8, y: -1.2, s: 0.68 },
  { id: 'praia-da-baleia', x: -1.25, y: -1.35, s: 0.58 },
  { id: 'lauterbrunnen', x: 1.25, y: -1.15, s: 0.7 },
  { id: 'appenzell-alpine-lake', x: 3.8, y: -1.3, s: 0.62 },
]

const byId = new Map<string, Artwork>(artworks.map((a) => [a.id, a]))

export function Archive({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Archive is a section in the room: the backing panel matches each wall. */}
      <MarbleWallSurface
        width={WALL_WIDTH}
        height={WALL_HEIGHT}
        position={[0, WALL_CENTER_Y, -0.1]}
        depth={0.2}
      />

      {/* section label, top-left — Manrope tracked caps, wall-title style */}
      <Text
        font={FONT_SANS}
        fontSize={0.072}
        letterSpacing={0.34}
        color="#6b6151"
        anchorX="left"
        anchorY="middle"
        position={[-4.2, 2.55, 0.06]}
      >
        ARCHIVE — II
      </Text>

      {/* general wall wash (not per-frame) */}
      {[-3, 0, 3].map((x) => (
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
              {/* zoom into the slot itself, never its source-data placement */}
              <ArtworkFrame
                artwork={artwork}
                position={[0, 0, 0.07]}
                frameStyle="white"
                zoomInPlace
              />
            </group>
          </Suspense>
        )
      })}
    </group>
  )
}

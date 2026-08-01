import { Suspense, useEffect, useRef } from 'react'
import { Text } from '@react-three/drei'
import { AdditiveBlending, CanvasTexture, type Object3D, type SpotLight } from 'three'
import {
  artworks,
  FONT_SANS,
  FONT_SERIF,
  WALL_CENTER_Y,
  WALL_HEIGHT,
  type Artwork,
} from '../../data/artworks'
import { ArtworkFrame } from './ArtworkFrame'
import { MarbleWallSurface } from './MarbleWallSurface'
import { useGalleryStore } from '../../store/useGalleryStore'

// slightly wider backdrop than the single-artwork walls, but capped under
// WALL_SPACING (10) so it never bleeds into the neighboring wall's space —
// the resting camera framing (fitW, CameraController) is tuned to WALL_WIDTH
// and isn't wall-aware, so the artwork grid itself keeps the standard spread
const ARCHIVE_WALL_WIDTH = 9.8

// GENERAL archive lighting — a broad, soft ceiling wash, NOT one lamp per frame.
// Pulled closer to the wall/frames so the pools of light read tight, like the
// reference, instead of a flat even glow.
function WallWash({ x }: { x: number }) {
  const spot = useRef<SpotLight>(null)
  const target = useRef<Object3D>(null)
  useEffect(() => {
    if (spot.current && target.current) spot.current.target = target.current
  }, [])
  return (
    <>
      {/* visible track-spot housing, matching the reference ceiling fixtures —
          pulled off the wall so the wash lands frontally and evenly */}
      <mesh position={[x, 3.68, 2.4]} rotation={[-0.75, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.2, 16]} />
        <meshStandardMaterial color="#181512" roughness={0.6} metalness={0.4} />
      </mesh>
      <spotLight
        ref={spot}
        position={[x, 3.6, 2.35]}
        color="#fff3e0"
        intensity={13}
        angle={0.7}
        penumbra={0.85}
        decay={1.5}
        distance={11}
      />
      <object3D ref={target} position={[x, 0.3, 0.05]} />
    </>
  )
}

/**
 * The pool of light under the header.
 *
 * ponytail: a painted gradient, not a spotLight. A real cone wide enough to
 * cover a 3.9-wide line of type spills the same 1.9 upward — that is what put
 * light on the ceiling. A quad can be an ellipse: wide, short, and bounded
 * exactly where the header ends. Ceiling: it doesn't respond to the wall's
 * normal map, so keep it soft; a spot is the upgrade if it ever needs to.
 */
function makeGlowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(255, 243, 224, 0.42)')
  gradient.addColorStop(0.42, 'rgba(255, 238, 212, 0.19)')
  gradient.addColorStop(1, 'rgba(255, 234, 198, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 128, 128)
  return new CanvasTexture(canvas)
}
const headerGlow = makeGlowTexture()

// Hand-authored salon hang: one slot for each V1 product, across three rows.
// x spread matches the standard wall framing (unchanged from before the
// backdrop widened) so the whole grid still fits the resting camera zoom.
//
// Portraits are the tall slots (frame 1.86 vs 1.30 for a landscape), so no
// column stacks two of them in ADJACENT rows — a column reads P / L / P at
// worst. That is what lets the whole hang sit ~0.25 lower than it used to and
// hand the freed headroom to the instruction above it.
type Slot = { id: string; x: number; y: number; s: number }
const SLOTS: Slot[] = [
  // top row — portrait, landscape, landscape, portrait
  { id: 'calpe-muralla-roja', x: -3.7, y: 1.78, s: 0.58 },
  { id: 'the-pool', x: -1.25, y: 1.84, s: 0.62 },
  { id: 'playa-roja', x: 1.25, y: 1.8, s: 0.66 },
  { id: 'ischia-mezzatorre', x: 3.7, y: 1.74, s: 0.6 },
  // middle row — the short row: only one portrait, and its column is landscape
  // above and below
  { id: 'wied-il-ghasri', x: -3.7, y: 0.3, s: 0.7 },
  { id: 'florence-dogman', x: -1.25, y: 0.24, s: 0.56 },
  { id: 'appenzell-alpine-lake', x: 1.25, y: 0.3, s: 0.66 },
  { id: 'runner', x: 3.7, y: 0.26, s: 0.6 },
  // bottom row
  { id: 'ditch-plains-far', x: -3.7, y: -1.2, s: 0.58 },
  { id: 'praia-da-baleia', x: -1.25, y: -1.28, s: 0.6 },
  { id: 'moreira-crowded-beach', x: 1.25, y: -1.22, s: 0.62 },
  { id: 'lauterbrunnen', x: 3.7, y: -1.24, s: 0.6 },
]

/**
 * The same twelve works on a phone: two screens of six, 2 columns × 3 rows,
 * in the desktop hang's reading order. A portrait viewport is framed by its
 * WIDTH, so a four-column grid can only be fitted by pushing the camera three
 * times further back than any other wall — the works end up unreadable. Two
 * columns is what a phone can actually hold at a size worth looking at.
 *
 * Same rule as the desktop hang: no column stacks two portraits in adjacent
 * rows, which is what keeps the three rows inside one screen.
 */
const MOBILE_COL = 0.63
const MOBILE_ROW_Y = [1.58, 0.2, -1.2]
const m = (id: string, col: 0 | 1, row: 0 | 1 | 2, s: number): Slot => ({
  id,
  x: col ? MOBILE_COL : -MOBILE_COL,
  y: MOBILE_ROW_Y[row],
  s,
})
const MOBILE_PAGES: Slot[][] = [
  [
    m('calpe-muralla-roja', 0, 0, 0.56),
    m('the-pool', 1, 0, 0.6),
    m('wied-il-ghasri', 0, 1, 0.6),
    m('ischia-mezzatorre', 1, 1, 0.56),
    m('florence-dogman', 0, 2, 0.56),
    m('playa-roja', 1, 2, 0.6),
  ],
  [
    m('ditch-plains-far', 0, 0, 0.56),
    m('appenzell-alpine-lake', 1, 0, 0.6),
    m('praia-da-baleia', 0, 1, 0.6),
    m('lauterbrunnen', 1, 1, 0.56),
    m('moreira-crowded-beach', 0, 2, 0.56),
    m('runner', 1, 2, 0.6),
  ],
]

/**
 * The header, per viewport. On a phone the whole wall is framed to ~2.7 wide,
 * so the desktop line is wider than the screen — smaller type, and a caption
 * short enough to hold one line ("tap", not "click", while we're here).
 */
const DESKTOP_HEAD = {
  titleSize: 0.2,
  titleY: 2.92,
  captionSize: 0.098,
  captionY: 2.62,
  caption: 'CLICK A WORK TO CHOOSE ITS SIZE, FRAME AND PRICE',
  glow: [6.6, 1.5] as [number, number],
  glowY: 2.76,
}
const MOBILE_HEAD = {
  titleSize: 0.13,
  titleY: 2.6,
  captionSize: 0.062,
  captionY: 2.42,
  caption: 'TAP A WORK TO CHOOSE SIZE AND FRAME',
  glow: [2.9, 1.0] as [number, number],
  glowY: 2.52,
}

const byId = new Map<string, Artwork>(artworks.map((a) => [a.id, a]))

export function Archive({ position }: { position: [number, number, number] }) {
  const isMobile = useGalleryStore((s) => s.isMobile)
  const printsPage = useGalleryStore((s) => s.printsPage)
  // the header is part of each SCREEN, not of the section: a phone visitor who
  // lands on the second six still has to be told the works are made to order
  const slots = isMobile ? MOBILE_PAGES[printsPage] : SLOTS
  const head = isMobile ? MOBILE_HEAD : DESKTOP_HEAD

  return (
    <group position={position}>
      {/* Archive is a section in the room: the backing panel matches each wall. */}
      <MarbleWallSurface
        width={ARCHIVE_WALL_WIDTH}
        height={WALL_HEIGHT}
        position={[0, WALL_CENTER_Y, -0.1]}
        depth={0.2}
      />

      {/* how to buy, over the whole hang — this is the only wall where every
          piece is purchasable, and nothing else on it says how. Replaces the
          old "ARCHIVE — II" marker: the header and the wall indicator both
          already name the section, and two labels at this height fought. */}
      <Text
        font={FONT_SERIF}
        fontSize={head.titleSize}
        color="#3b332a"
        anchorX="center"
        anchorY="middle"
        position={[0, head.titleY, 0.06]}
      >
        Every print is made to order.
      </Text>
      <Text
        font={FONT_SANS}
        fontSize={head.captionSize}
        letterSpacing={0.3}
        // was #6b6151 — the usual caption grey, but tracked-out caps at this
        // size carry far less ink than the serif line above, so the same value
        // that reads on a label disappeared here. Matches the line above.
        color="#3b332a"
        anchorX="center"
        anchorY="middle"
        position={[0, head.captionY, 0.06]}
      >
        {head.caption}
      </Text>

      {/* general wall wash (not per-frame) — one per column, tight and close */}
      {(isMobile ? [-MOBILE_COL, MOBILE_COL] : [-3.7, -1.25, 1.25, 3.7]).map((x) => (
        <WallWash key={x} x={x} />
      ))}
      {/* the header's own pool of light. The type is troika text —
          MeshBasicMaterial, so no light can touch it; what this brightens is the
          concrete BEHIND it, and the dark lettering gains its contrast from the
          pool it sits in. Wide and short, so it hugs the two lines and dies well
          before the ceiling. Sits between the wall face (z 0) and the type (0.06). */}
      <mesh position={[0, head.glowY, 0.04]}>
        <planeGeometry args={head.glow} />
        <meshBasicMaterial
          map={headerGlow}
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* the works — reuse ArtworkFrame (frame + mat + photo + [O] + plaque +
          click-to-zoom + hover) inside a scaled group at each slot */}
      {slots.map((slot) => {
        const artwork = byId.get(slot.id)
        if (!artwork) return null
        return (
          <Suspense key={slot.id} fallback={null}>
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

import { Text, useCursor, useTexture } from '@react-three/drei'
import { useEffect, useRef, useState } from 'react'
import { SRGBColorSpace, type Object3D, type SpotLight } from 'three'
import {
  ARCHIVE_WALL,
  artworks,
  BRAND_STATEMENT,
  FONT_BRAND_ITALIC,
  FONT_SANS,
  FONT_SANS_MEDIUM,
  FONT_SERIF,
  HERO_ID,
  WALL_BOTTOM_Y,
  WALL_CENTER_Y,
  WALL_HEIGHT,
} from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'
import { FrameLayers } from './ArtworkFrame'
import { dragState } from './CameraController'
import { INTERACTIVE_CURSOR } from './interactiveCursor'
import { MarbleWallSurface } from './MarbleWallSurface'
import { StoneMaterial, useStoneMap } from './stone'

// ---------------------------------------------------------------------------
// Layout knobs. Every position on this wall is derived from these, so the
// composition can be nudged without hunting through the JSX. World units; the
// wall face sits at z 0.05, the raised panel's face at PANEL_FACE_Z.
// ---------------------------------------------------------------------------

/** the central bay: raised off the base wall so its step casts the dividing shadow */
const PANEL_W = 5.2
const PANEL_DEPTH = 0.2
const PANEL_FACE_Z = 0.05 + PANEL_DEPTH / 2
/** thin vertical reveals down each edge of the panel */
const REVEAL_X = PANEL_W / 2 - 0.16
const REVEAL_W = 0.022

const STATEMENT_Y = 1.9

/**
 * The one work on this wall. It is **shown, not sold**: no hover, no click, no
 * zoom — the wall text beside it is its label and the console sends you to the
 * Archive to buy. Hung on the panel, so no plaque either.
 */
const HERO_Y = 0.3
const HERO_Z = PANEL_FACE_Z + 0.02
/** scales the standard 3:2 frame (1.86 wide) up to the reference's ~3.5 */
const HERO_SCALE = 1.9

/** [O], on the base wall left of the panel */
const MARK_X = -3.5
const MARK_Y = 0.3

/** the work's wall text, on the base wall right of the panel */
const INFO_X = 2.85

/** the console: copy, the primary CTA, the secondary link */
const COUNTER_W = 6.3
const COUNTER_D = 0.8
const COUNTER_Z = 0.55
const PLINTH_H = 0.12
const BODY_H = 0.83
const TOP_H = 0.1
const BODY_Y = WALL_BOTTOM_Y + PLINTH_H + BODY_H / 2
const TOP_Y = WALL_BOTTOM_Y + PLINTH_H + BODY_H + TOP_H / 2
const FACE_Z = COUNTER_Z + COUNTER_D / 2 + 0.01

const hero = artworks.find((a) => a.id === HERO_ID)!

// ---------------------------------------------------------------------------

/** A spot plus the visible track housing it appears to come from. */
function Spot({
  position,
  target,
  intensity,
  angle,
  color = '#ffeccd',
  housing = true,
}: {
  position: [number, number, number]
  target: [number, number, number]
  intensity: number
  angle: number
  color?: string
  housing?: boolean
}) {
  const spot = useRef<SpotLight>(null)
  const aim = useRef<Object3D>(null)
  useEffect(() => {
    if (spot.current && aim.current) spot.current.target = aim.current
  }, [])
  return (
    <>
      {housing && (
        <mesh position={[position[0], position[1] - 0.06, position[2] + 0.05]} rotation={[-0.75, 0, 0]}>
          <cylinderGeometry args={[0.055, 0.055, 0.2, 16]} />
          <meshStandardMaterial color="#181512" roughness={0.6} metalness={0.4} />
        </mesh>
      )}
      <spotLight
        ref={spot}
        position={position}
        color={color}
        intensity={intensity}
        angle={angle}
        penumbra={0.88}
        decay={1.5}
        distance={14}
      />
      <object3D ref={aim} position={target} />
    </>
  )
}

/**
 * The [O] brand mark as wall sculpture: two brackets and a ring, brushed
 * bronze, standing proud of the concrete.
 */
function Bracket({ x, flip }: { x: number; flip: boolean }) {
  const s = flip ? -1 : 1
  return (
    <group position={[x, 0, 0]}>
      <mesh>
        <boxGeometry args={[0.028, 0.44, 0.05]} />
        <meshStandardMaterial color="#8c7a5f" metalness={0.85} roughness={0.42} />
      </mesh>
      {[0.206, -0.206].map((y) => (
        <mesh key={y} position={[s * 0.045, y, 0]}>
          <boxGeometry args={[0.09, 0.028, 0.05]} />
          <meshStandardMaterial color="#8c7a5f" metalness={0.85} roughness={0.42} />
        </mesh>
      ))}
    </group>
  )
}

function BrandMark() {
  return (
    <>
      <group position={[MARK_X, MARK_Y, 0.08]}>
        <Bracket x={-0.3} flip={false} />
        <Bracket x={0.3} flip />
        <mesh>
          <torusGeometry args={[0.15, 0.026, 12, 40]} />
          <meshStandardMaterial color="#8c7a5f" metalness={0.85} roughness={0.42} />
        </mesh>
      </group>
      <RoomLink
        label="←  READ THE MANIFESTO"
        position={[MARK_X, MARK_Y - 0.48, 0.062]}
        fontSize={0.082}
        anchorX="center"
      />
    </>
  )
}

/** The hung print itself — frame, mat and photograph, and nothing interactive. */
function HeroPrint() {
  const texture = useTexture(hero.image, (t) => {
    t.colorSpace = SRGBColorSpace
  })
  return (
    <group scale={HERO_SCALE} position={[0, HERO_Y, HERO_Z]}>
      <FrameLayers texture={texture} w={hero.size[0]} h={hero.size[1]} style="white" />
    </group>
  )
}

/** Title, place and finishing note — the reference's right-hand wall text. */
function WallText() {
  return (
    <group position={[INFO_X, 0, 0.062]}>
      <Text
        font={FONT_BRAND_ITALIC}
        fontSize={0.155}
        color="#3b332a"
        anchorX="left"
        anchorY="middle"
        position={[0, 0.5, 0]}
      >
        {hero.title}
      </Text>
      <Text
        font={FONT_SANS}
        fontSize={0.062}
        letterSpacing={0.24}
        color="#3b332a"
        anchorX="left"
        anchorY="middle"
        position={[0, 0.33, 0]}
      >
        {hero.subtitle.split('·')[0].trim().toUpperCase()}, {hero.subtitle.split('·')[1]?.trim()}
      </Text>
      <mesh position={[0.21, 0.13, 0]}>
        <planeGeometry args={[0.42, 0.006]} />
        <meshBasicMaterial color="#6b6151" />
      </mesh>
      <Text
        font={FONT_SANS}
        fontSize={0.048}
        letterSpacing={0.06}
        color="#7d7263"
        anchorX="left"
        anchorY="middle"
        position={[0, -0.03, 0]}
      >
        available framed or unframed
      </Text>
    </group>
  )
}

/** Primary CTA — into the Archive, where the works are actually purchasable. */
function ShopButton() {
  const goToWall = useGalleryStore((s) => s.goToWall)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered, INTERACTIVE_CURSOR)
  return (
    <group
      position={[-0.575, BODY_Y, FACE_Z]}
      onClick={(e) => {
        e.stopPropagation()
        if (useGalleryStore.getState().inquiryOpen || dragState.moved) return
        goToWall(ARCHIVE_WALL)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      <mesh>
        <planeGeometry args={[2.5, 0.58]} />
        <meshBasicMaterial color={hovered ? '#2c2620' : '#1a1714'} />
      </mesh>
      <Text
        font={FONT_SANS_MEDIUM}
        fontSize={0.108}
        letterSpacing={0.24}
        color="#f4efe4"
        anchorX="center"
        anchorY="middle"
        position={[0.01, 0, 0.002]}
      >
        SHOP PRINTS
      </Text>
    </group>
  )
}

/** A text link into the adjacent Manifesto room — on the console and under the [O]. */
function RoomLink({
  label,
  position,
  fontSize,
  anchorX = 'left',
}: {
  label: string
  position: [number, number, number]
  fontSize: number
  anchorX?: 'left' | 'center'
}) {
  const openManifestoRoom = useGalleryStore((s) => s.openManifestoRoom)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered, INTERACTIVE_CURSOR)
  return (
    <Text
      font={FONT_SANS_MEDIUM}
      fontSize={fontSize}
      letterSpacing={0.24}
      color={hovered ? '#1a1714' : '#3f3830'}
      anchorX={anchorX}
      anchorY="middle"
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        if (useGalleryStore.getState().inquiryOpen || dragState.moved) return
        openManifestoRoom()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      {label}
    </Text>
  )
}

function Counter({ compact }: { compact: boolean }) {
  const plinthMap = useStoneMap(COUNTER_W - 0.2, PLINTH_H)
  const bodyMap = useStoneMap(COUNTER_W, BODY_H)
  const topMap = useStoneMap(COUNTER_W + 0.2, TOP_H)

  return (
    <group>
      {/* recessed plinth — makes the mass read as slightly lifted off the floor */}
      <mesh position={[0, WALL_BOTTOM_Y + PLINTH_H / 2, COUNTER_Z]} receiveShadow>
        <boxGeometry args={[COUNTER_W - 0.2, PLINTH_H, COUNTER_D - 0.08]} />
        <StoneMaterial map={plinthMap} lift={0.18} />
      </mesh>
      <mesh position={[0, BODY_Y, COUNTER_Z]} castShadow receiveShadow>
        <boxGeometry args={[COUNTER_W, BODY_H, COUNTER_D]} />
        <StoneMaterial map={bodyMap} lift={0.48} />
      </mesh>
      {/* top slab: overhangs slightly and reads a shade darker than the body */}
      <mesh position={[0, TOP_Y, COUNTER_Z]} castShadow receiveShadow>
        <boxGeometry args={[COUNTER_W + 0.2, TOP_H, COUNTER_D + 0.1]} />
        <StoneMaterial map={topMap} lift={0.4} />
      </mesh>

      {!compact && (
        <Text
          font={FONT_SERIF}
          fontSize={0.088}
          lineHeight={1.5}
          color="#332c24"
          anchorX="left"
          anchorY="middle"
          position={[-2.65, BODY_Y, FACE_Z]}
        >
          {'fine art photography\nby Victor Safdie Levy,\narchival prints made\nto order.'}
        </Text>
      )}

      <ShopButton />

      <mesh position={[0.78, BODY_Y, FACE_Z]}>
        <planeGeometry args={[0.012, 0.38]} />
        <meshBasicMaterial color="#6b6151" />
      </mesh>

      <RoomLink label="ENTER STUDIO  →" position={[1.02, BODY_Y, FACE_Z]} fontSize={0.104} />
    </group>
  )
}

/**
 * The opening wall: one hero print on a raised concrete bay, the statement cut
 * into the wall above it, the work's text to the right, the [O] to the left,
 * and the console carrying the commerce.
 */
export function HomeWall() {
  const isMobile = useGalleryStore((s) => s.isMobile)

  return (
    <group>
      {/* the raised central bay, plus a reveal down each of its edges */}
      <MarbleWallSurface
        width={PANEL_W}
        height={WALL_HEIGHT}
        position={[0, WALL_CENTER_Y, 0.05]}
        depth={PANEL_DEPTH}
      />
      {[-REVEAL_X, REVEAL_X].map((x) => (
        <mesh key={x} position={[x, WALL_CENTER_Y, PANEL_FACE_Z + 0.005]}>
          <planeGeometry args={[REVEAL_W, WALL_HEIGHT]} />
          <meshBasicMaterial color="#4c4339" />
        </mesh>
      ))}

      {/* the statement, cut into the panel: a light copy sits a hair above the
          dark one, so the pair reads as an incised edge catching the wash */}
      <Text
        font={FONT_SERIF}
        fontSize={0.185}
        letterSpacing={0.01}
        color="#c9bda8"
        anchorX="center"
        anchorY="middle"
        position={[0, STATEMENT_Y + 0.008, PANEL_FACE_Z + 0.006]}
      >
        {BRAND_STATEMENT}
      </Text>
      <Text
        font={FONT_SERIF}
        fontSize={0.185}
        letterSpacing={0.01}
        color="#5a4f42"
        anchorX="center"
        anchorY="middle"
        position={[0, STATEMENT_Y, PANEL_FACE_Z + 0.01]}
      >
        {BRAND_STATEMENT}
      </Text>

      <HeroPrint />

      {!isMobile && <BrandMark />}
      {!isMobile && <WallText />}

      <Counter compact={isMobile} />

      {/* key wash: high and pulled back, so its cone blooms a halo on the panel
          above the print before falling onto it */}
      <Spot position={[0, 3.5, 2.6]} target={[0, 0.55, 0.15]} intensity={44} angle={0.5} />
      {/* narrow accents on the [O] and on the wall text */}
      <Spot
        position={[MARK_X, 3.1, 1.5]}
        target={[MARK_X, 0.15, 0.1]}
        intensity={9}
        angle={0.26}
        housing={false}
      />
      <Spot
        position={[INFO_X + 0.2, 3.1, 1.5]}
        target={[INFO_X + 0.2, 0.15, 0.1]}
        intensity={8}
        angle={0.28}
        housing={false}
      />
      {/* near-horizontal graze so the console's stone shows its texture */}
      <Spot
        position={[0, -0.5, 3.4]}
        target={[0, -1.75, COUNTER_Z + COUNTER_D / 2]}
        intensity={7}
        angle={0.8}
        color="#ffe9c8"
        housing={false}
      />
    </group>
  )
}

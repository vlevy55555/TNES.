import { Html, Text, useCursor, useTexture } from '@react-three/drei'
import { useMemo, useState } from 'react'
import { Path, RepeatWrapping, Shape, SRGBColorSpace } from 'three'
import {
  ABOUT,
  ABOUT_DOOR_H,
  ABOUT_DOOR_W,
  ABOUT_DOOR_X,
  FONT_BRAND_ITALIC,
  FONT_HELVETICA,
  FONT_SANS,
  FONT_SERIF_ITALIC,
  FRAME_BORDER,
  MAT_BORDER,
  WALL_CENTER_Y,
  WALL_HEIGHT,
  WALL_WIDTH,
} from '../../data/artworks'
import { INTERACTIVE_CURSOR } from './interactiveCursor'
import { useGalleryStore } from '../../store/useGalleryStore'

const INK = '#2f2a24'
const MUTED = '#6b6151'
const GOLD = '#8f7c4e'

// wall texture pixel aspect — /materials/concrete.png is 7680x2970
const CONCRETE_ASPECT = 7680 / 2970

// ---- doorway / corridor geometry (wall-local coords, y=0 at content level) --
const DOOR_W = ABOUT_DOOR_W
const DOOR_H = ABOUT_DOOR_H
const DOOR_X = ABOUT_DOOR_X
// wall spans WALL_CENTER_Y ± WALL_HEIGHT/2; the floor line in content coords
const FLOOR_Y = WALL_CENTER_Y - WALL_HEIGHT / 2
const CORRIDOR_DEPTH = 7
// the hall behind is wider than the opening, so the oblique resting camera
// sees real depth through the door instead of a flat side wall
const CORRIDOR_W = 3.1

// Victor's portrait, framed like the artworks on the other walls (gold + mat)
function PortraitFrame() {
  const texture = useTexture(ABOUT.portrait, (t) => {
    t.colorSpace = SRGBColorSpace
  })
  const [w, h] = ABOUT.portraitSize

  return (
    <group position={[-2.15, 0.05, 0.06]}>
      <mesh>
        <boxGeometry args={[w + FRAME_BORDER * 2, h + FRAME_BORDER * 2, 0.1]} />
        <meshStandardMaterial color={GOLD} metalness={0.35} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.055]}>
        <boxGeometry args={[w + MAT_BORDER * 2, h + MAT_BORDER * 2, 0.03]} />
        <meshStandardMaterial color="#e7dfd0" />
      </mesh>
      <mesh position={[0, 0, 0.072]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** The About wall slab itself, extruded with a real doorway hole on the right. */
function DoorwayWall() {
  const texture = useTexture('/materials/concrete.png', (t) => {
    t.colorSpace = SRGBColorSpace
  })
  // ExtrudeGeometry uses shape-space XY as UVs, so scale the map to world
  // units with the same centered horizontal crop the other walls get.
  const map = useMemo(() => {
    const next = texture.clone()
    const crop = WALL_WIDTH / WALL_HEIGHT / CONCRETE_ASPECT
    next.colorSpace = SRGBColorSpace
    next.wrapS = next.wrapT = RepeatWrapping
    next.repeat.set(crop / WALL_WIDTH, 1 / WALL_HEIGHT)
    next.offset.set(0.5, 0.5)
    next.needsUpdate = true
    return next
  }, [texture])

  const shape = useMemo(() => {
    const s = new Shape()
    s.moveTo(-WALL_WIDTH / 2, -WALL_HEIGHT / 2)
    s.lineTo(WALL_WIDTH / 2, -WALL_HEIGHT / 2)
    s.lineTo(WALL_WIDTH / 2, WALL_HEIGHT / 2)
    s.lineTo(-WALL_WIDTH / 2, WALL_HEIGHT / 2)
    s.closePath()
    // door opening, sitting on the floor line (shape space is wall-centered)
    const doorBottom = -WALL_HEIGHT / 2
    const hole = new Path()
    hole.moveTo(DOOR_X - DOOR_W / 2, doorBottom)
    hole.lineTo(DOOR_X - DOOR_W / 2, doorBottom + DOOR_H)
    hole.lineTo(DOOR_X + DOOR_W / 2, doorBottom + DOOR_H)
    hole.lineTo(DOOR_X + DOOR_W / 2, doorBottom)
    hole.closePath()
    s.holes.push(hole)
    return s
  }, [])

  return (
    <mesh position={[0, WALL_CENTER_Y, -0.05]} receiveShadow>
      <extrudeGeometry args={[shape, { depth: 0.1, bevelEnabled: false }]} />
      <meshStandardMaterial map={map} roughness={0.88} metalness={0} />
    </mesh>
  )
}

/** The corridor behind the doorway — the physical "enter the artist's mind". */
function Corridor() {
  const portrait = useTexture(ABOUT.portrait, (t) => {
    t.colorSpace = SRGBColorSpace
  })
  const floorTexture = useTexture('/materials/floor.png', (t) => {
    t.colorSpace = SRGBColorSpace
  })
  const floorMap = useMemo(() => {
    const next = floorTexture.clone()
    next.colorSpace = SRGBColorSpace
    next.wrapS = next.wrapT = RepeatWrapping
    next.repeat.set(1, CORRIDOR_DEPTH / CORRIDOR_W)
    next.needsUpdate = true
    return next
  }, [floorTexture])
  const [hovered, setHovered] = useState(false)
  useCursor(hovered, INTERACTIVE_CURSOR)
  const startVslExit = useGalleryStore((s) => s.startVslExit)

  const doorCenterY = FLOOR_Y + DOOR_H / 2
  const lightZs = [-1.1, -2.6, -4.1, -5.6]

  return (
    <group position={[DOOR_X, 0, 0]}>
      {/* timber jamb lining the opening */}
      <mesh position={[0, FLOOR_Y + DOOR_H + 0.05, 0]}>
        <boxGeometry args={[DOOR_W + 0.24, 0.12, 0.22]} />
        <meshStandardMaterial color="#a89a82" roughness={0.75} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (DOOR_W / 2 + 0.06), doorCenterY, 0]}>
          <boxGeometry args={[0.12, DOOR_H + 0.1, 0.22]} />
          <meshStandardMaterial color="#a89a82" roughness={0.75} />
        </mesh>
      ))}

      {/* corridor shell (interior faces) — muted gray-beige, dimmer than the
          gallery so the downlight pools carry the depth like the reference.
          Wider than the door; the extra width hides behind the wall slab. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y + 0.001, -CORRIDOR_DEPTH / 2]}>
        <planeGeometry args={[CORRIDOR_W, CORRIDOR_DEPTH]} />
        <meshStandardMaterial map={floorMap} color="#cbbfa9" roughness={0.45} metalness={0.1} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, FLOOR_Y + DOOR_H, -CORRIDOR_DEPTH / 2]}>
        <planeGeometry args={[CORRIDOR_W, CORRIDOR_DEPTH]} />
        <meshStandardMaterial color="#6f675a" roughness={0.95} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          rotation={[0, -side * (Math.PI / 2), 0]}
          position={[side * (CORRIDOR_W / 2), doorCenterY, -CORRIDOR_DEPTH / 2]}
        >
          <planeGeometry args={[CORRIDOR_DEPTH, DOOR_H]} />
          <meshStandardMaterial color="#8f8674" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, doorCenterY, -CORRIDOR_DEPTH]}>
        <planeGeometry args={[CORRIDOR_W, DOOR_H]} />
        <meshStandardMaterial color="#7c7464" roughness={0.9} />
      </mesh>

      {/* open door leaves folded nearly flush against the corridor walls, so
          they read as thin edges instead of blocking the view */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * (DOOR_W / 2 - 0.04), doorCenterY, -0.46]}
          rotation={[0, side * 0.05, 0]}
        >
          <boxGeometry args={[0.04, DOOR_H - 0.04, 0.82]} />
          <meshStandardMaterial color="#a3977f" roughness={0.62} />
        </mesh>
      ))}

      {/* ceiling downlights: emissive fixtures on both sides, light pools
          biased to the left wall — the one the resting camera looks down */}
      {lightZs.map((z) => (
        <group key={z}>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * (CORRIDOR_W / 2 - 0.3), FLOOR_Y + DOOR_H - 0.015, z]}>
              <boxGeometry args={[0.14, 0.03, 0.14]} />
              <meshStandardMaterial
                color="#dcd2bd"
                emissive="#ffe9c4"
                emissiveIntensity={2.2}
              />
            </mesh>
          ))}
          <pointLight
            position={[0, FLOOR_Y + DOOR_H - 0.35, z]}
            color="#ffeed6"
            intensity={1.6}
            distance={3.6}
            decay={2}
          />
        </group>
      ))}

      {/* the artist waiting at the very end: a small lit portrait */}
      <group position={[0, FLOOR_Y + 1.75, -CORRIDOR_DEPTH + 0.02]}>
        <mesh>
          <boxGeometry args={[0.46, 0.64, 0.03]} />
          <meshStandardMaterial color={GOLD} metalness={0.35} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[0.38, 0.56]} />
          <meshBasicMaterial map={portrait} toneMapped={false} />
        </mesh>
        <pointLight position={[0, 0.5, 0.55]} color="#ffeccc" intensity={1.6} distance={2.4} decay={2} />
      </group>

      {/* gold "O" room plaque beside the door, engraved in the mark's Helvetica.
          kept tight to the jamb — the resting camera crops around x ≈ 4.4 */}
      <group position={[DOOR_W / 2 + 0.26, doorCenterY + 1.0, 0.07]}>
        <mesh>
          <boxGeometry args={[0.26, 0.32, 0.035]} />
          <meshStandardMaterial color="#c1a35a" metalness={0.55} roughness={0.35} />
        </mesh>
        <Text
          font={FONT_HELVETICA}
          fontSize={0.17}
          color="#6b5320"
          anchorX="center"
          anchorY="middle"
          position={[0, 0, 0.02]}
        >
          O
        </Text>
      </group>

      {/* invisible full-opening click target — the corridor IS the CTA */}
      <mesh
        position={[0, doorCenterY, 0.02]}
        onClick={(e) => {
          e.stopPropagation()
          startVslExit()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
      >
        <planeGeometry args={[DOOR_W, DOOR_H]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

/** Tracked-caps text link with hairlines, a signplate centered over the door. */
function EnterLink() {
  const [hovered, setHovered] = useState(false)
  useCursor(hovered, INTERACTIVE_CURSOR)
  const startVslExit = useGalleryStore((s) => s.startVslExit)
  const color = hovered ? INK : '#57503f'

  return (
    <group
      position={[DOOR_X, FLOOR_Y + DOOR_H + 0.38, 0.06]}
      onClick={(e) => {
        e.stopPropagation()
        startVslExit()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      <mesh position={[0, 0.13, 0]}>
        <planeGeometry args={[2.1, 0.005]} />
        <meshBasicMaterial color="#a4977c" />
      </mesh>
      <Text
        font={FONT_SANS}
        fontSize={0.082}
        letterSpacing={0.26}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {`${ABOUT.cta.toUpperCase()} →`}
      </Text>
      <mesh position={[0, -0.13, 0]}>
        <planeGeometry args={[2.1, 0.005]} />
        <meshBasicMaterial color="#a4977c" />
      </mesh>
    </group>
  )
}

// ponytail: all positions eyeballed against the resting wall framing — nudge the
// x/y literals if the composition drifts; nothing downstream depends on them.
export function AboutWall() {
  return (
    <group>
      <DoorwayWall />
      <Corridor />
      <PortraitFrame />

      {/* name — brand serif italic, like the reference */}
      <Text
        font={FONT_BRAND_ITALIC}
        fontSize={0.24}
        color={INK}
        anchorX="left"
        anchorY="middle"
        position={[-0.6, 1.15, 0.06]}
      >
        {ABOUT.name}
      </Text>

      <Text
        font={FONT_SANS}
        fontSize={0.066}
        letterSpacing={0.22}
        color={MUTED}
        anchorX="left"
        anchorY="middle"
        position={[-0.58, 0.82, 0.06]}
      >
        {ABOUT.role}
      </Text>

      {/* gold accent bar standing in for a CSS left-border on the pull-quote */}
      <mesh position={[-0.59, 0.36, 0.06]}>
        <planeGeometry args={[0.012, 0.34]} />
        <meshBasicMaterial color="#c9a24b" />
      </mesh>

      <Text
        font={FONT_SERIF_ITALIC}
        fontSize={0.108}
        lineHeight={1.45}
        color={INK}
        anchorX="left"
        anchorY="top"
        maxWidth={2.15}
        position={[-0.51, 0.5, 0.06]}
      >
        {ABOUT.quote}
      </Text>

      <Text
        font={FONT_SANS}
        fontSize={0.068}
        lineHeight={1.6}
        color={MUTED}
        anchorX="left"
        anchorY="top"
        maxWidth={2.2}
        position={[-0.59, 0.02, 0.06]}
      >
        {ABOUT.body}
      </Text>

      <EnterLink />

      {/* Victor's direct contacts — icon row, clickable, tucked under the portrait */}
      <Html transform position={[-2.15, -1.55, 0.14]} scale={0.2} zIndexRange={[10, 0]} occlude={false}>
        <div className="about-contact">
          <a href={`mailto:${ABOUT.contact.email}`} title={ABOUT.contact.email} aria-label="Email">
            ✉
          </a>
          <a
            href={`tel:${ABOUT.contact.phone.replace(/[^+\d]/g, '')}`}
            title={ABOUT.contact.phone}
            aria-label="Phone"
          >
            ✆
          </a>
          <a
            href={ABOUT.contact.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`Instagram ${ABOUT.contact.instagram}`}
            aria-label="Instagram"
          >
            ◎
          </a>
        </div>
      </Html>
    </group>
  )
}

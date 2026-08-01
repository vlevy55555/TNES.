import { Text, useCursor, useTexture } from '@react-three/drei'
import { useMemo, useState } from 'react'
import { Path, RepeatWrapping, Shape, SRGBColorSpace } from 'three'
import { shadowTexture } from './ArtworkFrame'
import {
  ABOUT,
  ABOUT_DOOR_H,
  ABOUT_DOOR_W,
  ABOUT_DOOR_X,
  FONT_BRAND,
  FONT_HELVETICA,
  FONT_SANS,
  FONT_SERIF,
  WALL_CENTER_Y,
  WALL_HEIGHT,
  WALL_WIDTH,
} from '../../data/artworks'
import { INTERACTIVE_CURSOR } from './interactiveCursor'
import { useGalleryStore } from '../../store/useGalleryStore'

/**
 * The About wall runs darker than the rest of the gallery — it is the closer,
 * not another exhibition wall. The concrete is the SAME material as everywhere
 * else; the darkness comes from its three ceiling lamps being turned down (see
 * ABOUT_LAMP_INTENSITY in Wall.tsx), not from tinting the surface. That still
 * inverts the type: everything here is LIGHT on dark, because the text is
 * unlit basic material and holds its value while the wall behind it drops.
 */
const INK = '#ece5d8' // name, role, link — the light that reads as "ink" on this wall
const STATEMENT = '#ffffff' // his own words, the brightest thing on the wall

/**
 * Keeps the print off pure black where the dimmed lamps barely reach, without
 * taking it back out of the lighting the way an unlit material would. Same lever
 * the floor and the freestanding stone use.
 */
const PORTRAIT_LIFT = 0.34

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

// ---- layout ---------------------------------------------------------------
// Portrait on the left, one column of type on the right, all of it clear of the
// doorway (which starts at x 2.0). Proportions traced off the reference: the
// portrait runs most of the wall's height, and the type hangs from ~30% down
// its side rather than centring against it.
const MAT = 0.24
const BAND = 0.06
const PORTRAIT_X = -2.55
const PORTRAIT_Y = 0.05
const PORTRAIT_TOP = PORTRAIT_Y + (ABOUT.portraitSize[1] + (MAT + BAND) * 2) / 2
const PORTRAIT_BOTTOM = PORTRAIT_Y - (ABOUT.portraitSize[1] + (MAT + BAND) * 2) / 2
const PORTRAIT_H = PORTRAIT_TOP - PORTRAIT_BOTTOM

const TEXT_X = -0.75
// narrower than the name line on purpose — the reference breaks the statement
// into five short lines, which is what gives the column its editorial rhythm
const TEXT_W = 1.95
/** fraction of the way down the portrait that each line sits */
const at = (fraction: number) => PORTRAIT_TOP - fraction * PORTRAIT_H

/**
 * Victor's portrait. Not the gallery's gold moulding: the reference hangs him in
 * a THIN near-black frame around a WIDE cream mat, which is what makes the print
 * read as a portrait rather than another work in the show.
 */
function PortraitFrame() {
  const texture = useTexture(ABOUT.portrait, (t) => {
    t.colorSpace = SRGBColorSpace
  })
  const [w, h] = ABOUT.portraitSize

  return (
    <group position={[PORTRAIT_X, PORTRAIT_Y, 0.06]}>
      {/* the real radial falloff every frame in the gallery uses — this was a
          flat 16% rectangle, which reads as a grey box taped behind the frame */}
      <mesh position={[0.09, -0.12, -0.02]}>
        <planeGeometry args={[w + MAT * 2 + 0.8, h + MAT * 2 + 0.8]} />
        <meshBasicMaterial map={shadowTexture} transparent depthWrite={false} />
      </mesh>
      {/* dark stained timber, not black plastic: rough enough to hold the lamps'
          falloff across its width instead of reading as one flat silhouette */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w + (MAT + BAND) * 2, h + (MAT + BAND) * 2, 0.07]} />
        <meshStandardMaterial color="#3a322a" roughness={0.72} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0, 0.042]} receiveShadow>
        <boxGeometry args={[w + MAT * 2, h + MAT * 2, 0.03]} />
        <meshStandardMaterial color="#ded6c6" roughness={0.92} />
      </mesh>
      {/* LIT, and tone-mapped like everything else in the room. The gallery's
          prints are deliberately exempt from both so a work keeps its true
          colour — but that is exactly what made this one float: it ignored the
          dimmed lamps and the exposure curve, so it never shared the wall's
          falloff. Here fidelity matters less than belonging to the room. */}
      <mesh position={[0, 0, 0.06]} receiveShadow>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.94}
          metalness={0}
          emissiveMap={texture}
          emissive="#ffffff"
          emissiveIntensity={PORTRAIT_LIFT}
        />
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
  const floorTexture = useTexture('/materials/floor.png', (t) => {
    t.colorSpace = SRGBColorSpace
  })
  const concreteTexture = useTexture('/materials/concrete.png', (t) => {
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
  // The corridor shell used to be flat untextured colour: under this little
  // light it collapsed to dead 100% black — a hole in the image rather than a
  // dark room. Same concrete as everywhere else, tiled to each face's own
  // proportions and tinted down, so the darkness still carries grain and the
  // ambient has something to catch.
  const shellMap = (repeatX: number, repeatY: number) => {
    const next = concreteTexture.clone()
    next.colorSpace = SRGBColorSpace
    next.wrapS = next.wrapT = RepeatWrapping
    next.repeat.set(repeatX, repeatY)
    next.needsUpdate = true
    return next
  }
  const sideMap = useMemo(() => shellMap(CORRIDOR_DEPTH / DOOR_H / CONCRETE_ASPECT, 1), [concreteTexture])
  const ceilMap = useMemo(() => shellMap(CORRIDOR_W / CORRIDOR_DEPTH / CONCRETE_ASPECT, 1), [concreteTexture])
  const [hovered, setHovered] = useState(false)
  useCursor(hovered, INTERACTIVE_CURSOR)
  const startVslExit = useGalleryStore((s) => s.startVslExit)

  const doorCenterY = FLOOR_Y + DOOR_H / 2
  const lightZs = [-1.1, -2.6, -4.1, -5.6]

  return (
    <group position={[DOOR_X, 0, 0]}>
      {/* timber jamb lining the opening — kept lighter than the hall behind it,
          so the frame of the opening still catches the gallery's light */}
      <mesh position={[0, FLOOR_Y + DOOR_H + 0.05, 0]}>
        <boxGeometry args={[DOOR_W + 0.24, 0.12, 0.22]} />
        <meshStandardMaterial color="#8b7f6b" roughness={0.78} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (DOOR_W / 2 + 0.06), doorCenterY, 0]}>
          <boxGeometry args={[0.12, DOOR_H + 0.1, 0.22]} />
          <meshStandardMaterial color="#8b7f6b" roughness={0.78} />
        </mesh>
      ))}

      {/* corridor shell (interior faces). Deliberately much darker than the
          gallery — a lit hallway competes with the wall for attention, while a
          dark one reads as somewhere else, and lets the downlight pools alone
          carry the depth. Wider than the door; the extra hides behind the slab. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y + 0.001, -CORRIDOR_DEPTH / 2]}>
        <planeGeometry args={[CORRIDOR_W, CORRIDOR_DEPTH]} />
        <meshStandardMaterial map={floorMap} color="#584f42" roughness={0.5} metalness={0.08} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, FLOOR_Y + DOOR_H, -CORRIDOR_DEPTH / 2]} receiveShadow>
        <planeGeometry args={[CORRIDOR_W, CORRIDOR_DEPTH]} />
        <meshStandardMaterial map={ceilMap} color="#4a4238" roughness={0.95} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          rotation={[0, -side * (Math.PI / 2), 0]}
          position={[side * (CORRIDOR_W / 2), doorCenterY, -CORRIDOR_DEPTH / 2]}
          receiveShadow
        >
          <planeGeometry args={[CORRIDOR_DEPTH, DOOR_H]} />
          <meshStandardMaterial map={sideMap} color="#6a6053" roughness={0.92} />
        </mesh>
      ))}
      {/* the far end is NOT a wall: dead black, unlit, so the corridor reads as
          running on into nothing rather than stopping at a surface seven metres
          in. Basic (not standard) material — the downlights must not be able to
          lift it off black. Still a plane, not an opening: the room's backdrop
          splits around this doorway, so removing it would punch a hole straight
          through to the page background. */}
      <mesh position={[0, doorCenterY, -CORRIDOR_DEPTH]}>
        <planeGeometry args={[CORRIDOR_W, DOOR_H]} />
        <meshBasicMaterial color="#000000" />
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

/**
 * The way out to VSL: left-aligned at the foot of the column with a single rule
 * under it, as in the reference — not the centred two-rule signplate that used
 * to float over the doorway.
 */
function EnterLink() {
  const [hovered, setHovered] = useState(false)
  useCursor(hovered, INTERACTIVE_CURSOR)
  const startVslExit = useGalleryStore((s) => s.startVslExit)
  const label = `${ABOUT.cta.toUpperCase()}   →`
  // the rule tracks the label's own width instead of a fixed slab
  const width = label.length * 0.082 * 0.82

  return (
    <group
      position={[TEXT_X, at(0.96), 0.06]}
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
      <Text
        font={FONT_SANS}
        fontSize={0.082}
        letterSpacing={0.26}
        color={hovered ? '#ffffff' : INK}
        anchorX="left"
        anchorY="middle"
      >
        {label}
      </Text>
      <mesh position={[width / 2, -0.11, 0]}>
        <planeGeometry args={[width, 0.005]} />
        <meshBasicMaterial color={hovered ? '#ffffff' : '#9d907a'} />
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

      {/* name — upright brand serif, large and quiet, as in the reference */}
      <Text
        font={FONT_BRAND}
        fontSize={0.3}
        color={INK}
        anchorX="left"
        anchorY="middle"
        position={[TEXT_X, at(0.31), 0.06]}
      >
        {ABOUT.name}
      </Text>

      <Text
        font={FONT_SANS}
        fontSize={0.086}
        letterSpacing={0.24}
        // The Countdown's plate runs its pair of lines on ONE value (object 01
        // and the title under it are both INK). This line used to sit a step
        // below the name on a muted brown; now it shares the name's value.
        color={INK}
        anchorX="left"
        anchorY="middle"
        position={[TEXT_X, at(0.41), 0.06]}
      >
        {ABOUT.role}
      </Text>

      {/* one block, first person — no pull-quote / bio split */}
      <Text
        font={FONT_SERIF}
        fontSize={0.105}
        lineHeight={1.75}
        color={STATEMENT}
        anchorX="left"
        anchorY="top"
        maxWidth={TEXT_W}
        position={[TEXT_X, at(0.54), 0.06]}
      >
        {ABOUT.statement}
      </Text>

      <EnterLink />

    </group>
  )
}

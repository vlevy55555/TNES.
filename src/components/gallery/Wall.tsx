import { useEffect, useRef } from 'react'
import { Text } from '@react-three/drei'
import type { Object3D, SpotLight } from 'three'
import {
  ABOUT_WALL,
  COMING_SOON_WALL,
  FONT_SANS,
  SIGNATURE_WALL,
  WALL_CENTER_Y,
  WALL_HEIGHT,
  WALL_SPACING,
  WALL_WIDTH,
  type Wall as WallType,
} from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'
import { HomeWall } from './HomeWall'
import { ComingSoonWall } from './ComingSoonWall'
import { AboutWall } from './AboutWall'
import { dragState } from './CameraController'
import { MarbleWallSurface } from './MarbleWallSurface'

// one ceiling lamp: a downward wash that scallops the top of the wall,
// matching the TNES reference (three per wall). The fixture itself is a small
// black track-spot cylinder tilted at the wall, like the reference ceiling.
/** the standard exhibition lamp; the About wall runs its three turned down */
const LAMP_INTENSITY = 30
const ABOUT_LAMP_INTENSITY = 14

export function WallLamp({ x, intensity = LAMP_INTENSITY }: { x: number; intensity?: number }) {
  const spot = useRef<SpotLight>(null)
  const target = useRef<Object3D>(null)

  useEffect(() => {
    if (spot.current && target.current) spot.current.target = target.current
  }, [])

  return (
    <>
      {/* visible track-spot housing the light appears to come from — hung away
          from the wall so the beam hits it frontally, washing it evenly like
          the reference instead of raking down and scalloping the top */}
      <mesh position={[x, 3.15, 2.25]} rotation={[-0.75, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.2, 16]} />
        <meshStandardMaterial color="#181512" roughness={0.6} metalness={0.4} />
      </mesh>
      <spotLight
        ref={spot}
        position={[x, 3.05, 2.2]}
        color="#fff1d6"
        intensity={intensity}
        angle={0.62}
        penumbra={0.7}
        decay={1.6}
        distance={10}
      />
      <object3D ref={target} position={[x, 0.6, 0.05]} />
    </>
  )
}

export function Wall({ wall, bare = false }: { wall: WallType; bare?: boolean }) {
  const closeArtwork = useGalleryStore((s) => s.closeArtwork)
  const zoomed = useGalleryStore((s) => s.selectedArtworkId !== null)
  const lampX = [-3.13, 0, 3.13]

  return (
    <group
      position={[wall.index * WALL_SPACING, 0, 0]}
      rotation={[0, wall.angle, 0]}
    >
      {/* bottom stays on the floor (-2.2); top is set just past the resting
          camera's frustum (CAMERA_Z * tan(17.5°) ≈ 2.49) plus a 1/20 margin,
          so the wall fills the screen at rest but the raised ceiling still
          peeks in once the camera dollies back for a wall-to-wall transition */}
      <group
        onClick={() => {
          if (useGalleryStore.getState().inquiryOpen || dragState.moved) return
          closeArtwork()
        }}
      >
        {/* About and Countdown render their own slabs — both need a real hole
            cut in them (a doorway, and the countdown's recessed niche) */}
        {wall.index !== ABOUT_WALL && wall.index !== COMING_SOON_WALL && (
          <MarbleWallSurface
            width={WALL_WIDTH}
            height={WALL_HEIGHT}
            position={[0, WALL_CENTER_Y, 0]}
            depth={0.1}
          />
        )}
      </group>

      {/* Home and Countdown light themselves — a key wash with narrow accents,
          and four vertical cones respectively — not this even three-lamp band */}
      {wall.index !== SIGNATURE_WALL &&
        wall.index !== COMING_SOON_WALL &&
        lampX.map((x) => (
          <WallLamp
            key={x}
            x={x}
            intensity={wall.index === ABOUT_WALL ? ABOUT_LAMP_INTENSITY : LAMP_INTENSITY}
          />
        ))}

      {/* no section label on Home (the statement is the title) or About (it
          landed directly over Victor's portrait) */}
      {wall.index !== SIGNATURE_WALL && wall.index !== ABOUT_WALL && (
        <Text
          font={FONT_SANS}
          fontSize={0.072}
          letterSpacing={0.34}
          // was #6b6151 — measured at ~1.2:1 against the lit concrete, invisible
          color="#413a30"
          anchorX="left"
          anchorY="middle"
          position={[-2.95, 1.72, 0.06]}
          fillOpacity={zoomed ? 0 : 1}
        >
          {`${wall.name.toUpperCase()} — ${wall.roman}`}
        </Text>
      )}

      {wall.index === SIGNATURE_WALL && <HomeWall bare={bare} />}
      {wall.index === COMING_SOON_WALL && <ComingSoonWall />}
      {wall.index === ABOUT_WALL && <AboutWall />}
    </group>
  )
}

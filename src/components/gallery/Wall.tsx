import { Suspense, useEffect, useRef } from 'react'
import { Text } from '@react-three/drei'
import type { Object3D, SpotLight } from 'three'
import {
  artworks,
  COMING_SOON_WALL,
  FONT_SANS,
  SIGNATURE_WALL,
  WALL_SPACING,
  type Wall as WallType,
} from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'
import { ArtworkFrame } from './ArtworkFrame'
import { HeroFrame } from './HeroFrame'
import { ComingSoonWall } from './ComingSoonWall'
import { dragState } from './CameraController'

// one ceiling lamp: a downward wash that scallops the top of the wall,
// matching the TNES reference (three per wall)
function WallLamp({ x }: { x: number }) {
  const spot = useRef<SpotLight>(null)
  const target = useRef<Object3D>(null)

  useEffect(() => {
    if (spot.current && target.current) spot.current.target = target.current
  }, [])

  return (
    <>
      <spotLight
        ref={spot}
        position={[x, 2.55, 1.05]}
        color="#fff1d6"
        intensity={26}
        angle={0.6}
        penumbra={0.55}
        decay={1.6}
        distance={9}
      />
      <object3D ref={target} position={[x, 0.4, 0.05]} />
    </>
  )
}

export function Wall({ wall }: { wall: WallType }) {
  const closeArtwork = useGalleryStore((s) => s.closeArtwork)
  const zoomed = useGalleryStore((s) => s.selectedArtworkId !== null)
  const wallArtworks = artworks.filter((a) => a.wallIndex === wall.index)
  // one lamp per frame, centered directly over it — not an even generic spread
  const lampX =
    wallArtworks.length > 0 ? wallArtworks.map((a) => a.position[0]) : [-3.13, 0, 3.13]

  return (
    <group
      position={[wall.index * WALL_SPACING, 0, 0]}
      rotation={[0, wall.angle, 0]}
    >
      {/* bottom stays on the floor (-2.2); top is set just past the resting
          camera's frustum (CAMERA_Z * tan(17.5°) ≈ 2.49) plus a 1/20 margin,
          so the wall fills the screen at rest but the raised ceiling still
          peeks in once the camera dollies back for a wall-to-wall transition */}
      <mesh
        position={[0, 0.265, 0]}
        onClick={() => {
          if (useGalleryStore.getState().inquiryOpen || dragState.moved) return
          closeArtwork()
        }}
      >
        <boxGeometry args={[9.4, 4.93, 0.1]} />
        <meshStandardMaterial color="#e8dfd2" />
      </mesh>

      {lampX.map((x) => (
        <WallLamp key={x} x={x} />
      ))}

      {/* the signature IS the title on the hero wall — no text label there */}
      {wall.index !== SIGNATURE_WALL && (
        <Text
          font={FONT_SANS}
          fontSize={0.072}
          letterSpacing={0.34}
          color="#a99d8a"
          anchorX="left"
          anchorY="middle"
          position={[-2.95, 1.72, 0.06]}
          fillOpacity={zoomed ? 0 : 1}
        >
          {`${wall.name.toUpperCase()} — ${wall.roman}`}
        </Text>
      )}

      {wall.index === SIGNATURE_WALL && <HeroFrame />}
      {wall.index === COMING_SOON_WALL && <ComingSoonWall />}

      {wallArtworks.map((artwork) => (
        // per-frame Suspense: one slow image never blanks the whole gallery
        <Suspense key={artwork.id} fallback={null}>
          <ArtworkFrame artwork={artwork} />
        </Suspense>
      ))}
    </group>
  )
}

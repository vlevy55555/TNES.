import { Suspense, useEffect, useRef } from 'react'
import { Text } from '@react-three/drei'
import type { Object3D, SpotLight } from 'three'
import {
  ABOUT_WALL,
  artworks,
  COMING_SOON_WALL,
  FONT_BRAND,
  FONT_SANS,
  SIGNATURE_WALL,
  WALL_HEIGHT,
  WALL_SPACING,
  WALL_WIDTH,
  type Wall as WallType,
} from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'
import { ArtworkFrame } from './ArtworkFrame'
import { SignatureExhibition } from './SignatureExhibition'
import { ComingSoonWall } from './ComingSoonWall'
import { AboutWall } from './AboutWall'
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
        <boxGeometry args={[WALL_WIDTH, WALL_HEIGHT, 0.1]} />
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
          color="#6b6151"
          anchorX="left"
          anchorY="middle"
          position={[-2.95, 1.72, 0.06]}
          fillOpacity={zoomed ? 0 : 1}
        >
          {`${wall.name.toUpperCase()} — ${wall.roman}`}
        </Text>
      )}

      {/* Moments walls only (the two with a real hang) — a wall-level heading
          sitting in the gap the salon composition leaves above the frames */}
      {wallArtworks.length > 0 && (
        <>
          <Text
            font={FONT_BRAND}
            fontSize={0.32}
            color="#2f2a24"
            anchorX="center"
            anchorY="middle"
            position={[0, 1.64, 0.06]}
            fillOpacity={zoomed ? 0 : 1}
          >
            Event title
          </Text>
          <Text
            font={FONT_SANS}
            fontSize={0.12}
            letterSpacing={0.02}
            color="#6b6151"
            anchorX="center"
            anchorY="middle"
            position={[0, 1.32, 0.06]}
            fillOpacity={zoomed ? 0 : 1}
          >
            One sentence of context
          </Text>
        </>
      )}

      {wall.index === SIGNATURE_WALL && <SignatureExhibition />}
      {wall.index === COMING_SOON_WALL && <ComingSoonWall />}
      {wall.index === ABOUT_WALL && <AboutWall />}

      {wallArtworks.map((artwork) => (
        // per-frame Suspense: one slow image never blanks the whole gallery
        <Suspense key={artwork.id} fallback={null}>
          <ArtworkFrame artwork={artwork} />
        </Suspense>
      ))}
    </group>
  )
}

import { Suspense, useEffect, useRef } from 'react'
import { Text } from '@react-three/drei'
import type { Object3D, SpotLight } from 'three'
import {
  artworks,
  SERIF,
  WALL_SPACING,
  type Wall as WallType,
} from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'
import { ArtworkFrame } from './ArtworkFrame'
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
        position={[x, 3.4, 1.05]}
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

  return (
    <group
      position={[wall.index * WALL_SPACING, 0, 0]}
      rotation={[0, wall.angle, 0]}
    >
      <mesh onClick={() => !dragState.moved && closeArtwork()}>
        <boxGeometry args={[9.4, 4.4, 0.1]} />
        <meshStandardMaterial color="#e8dfd2" />
      </mesh>

      {[-3.13, 0, 3.13].map((x) => (
        <WallLamp key={x} x={x} />
      ))}

      <Text
        font={SERIF}
        fontSize={0.075}
        letterSpacing={0.35}
        color="#a99d8a"
        anchorX="left"
        anchorY="middle"
        position={[-2.95, 1.72, 0.06]}
        fillOpacity={zoomed ? 0 : 1}
      >
        {`${wall.name.toUpperCase()} — ${wall.roman}`}
      </Text>

      {wallArtworks.map((artwork) => (
        // per-frame Suspense: one slow image never blanks the whole gallery
        <Suspense key={artwork.id} fallback={null}>
          <ArtworkFrame artwork={artwork} />
        </Suspense>
      ))}
    </group>
  )
}

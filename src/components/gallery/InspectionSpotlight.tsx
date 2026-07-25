import { useEffect, useRef } from 'react'
import type { Object3D, SpotLight } from 'three'
import { WALL_SPACING, artworks, walls } from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'

/** A focused pool of light for the work currently being inspected. */
export function InspectionSpotlight() {
  const selectedArtworkId = useGalleryStore((s) => s.selectedArtworkId)
  const zoomAt = useGalleryStore((s) => s.zoomAt)
  const spotlight = useRef<SpotLight>(null)
  const target = useRef<Object3D>(null)
  const artwork = artworks.find((item) => item.id === selectedArtworkId)

  useEffect(() => {
    if (spotlight.current && target.current) spotlight.current.target = target.current
  }, [selectedArtworkId])

  if (!artwork) return null

  const wall = walls[artwork.wallIndex]
  const sin = Math.sin(wall.angle)
  const cos = Math.cos(wall.angle)
  const frame = zoomAt ?? {
    x: artwork.wallIndex * WALL_SPACING + artwork.position[0] * cos + 0.07 * sin,
    y: artwork.position[1],
    z: -artwork.position[0] * sin + 0.07 * cos,
    scale: 1,
  }
  // The Archive is flat and provides its own world position through `zoomAt`.
  const normalX = zoomAt ? 0 : sin
  const normalZ = zoomAt ? 1 : cos

  return (
    <>
      <spotLight
        ref={spotlight}
        position={[frame.x + normalX * 2.1, frame.y + 1.5, frame.z + normalZ * 2.1]}
        color="#fff3d8"
        intensity={42}
        angle={0.28}
        penumbra={0.62}
        decay={1.4}
        distance={5.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0002}
      />
      <object3D ref={target} position={[frame.x, frame.y, frame.z]} />
    </>
  )
}

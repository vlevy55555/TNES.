import { useTexture } from '@react-three/drei'
import { useMemo } from 'react'
import { RepeatWrapping, SRGBColorSpace } from 'three'
import marbleWall from '../../../ChatGPT Image Jul 24, 2026, 11_01_07 AM.png'

const MARBLE_ASPECT = 1720 / 914

/** The shared marble finish used by every exhibition wall. */
export function MarbleWallSurface({
  width,
  height,
  position,
  depth = 0,
}: {
  width: number
  height: number
  position: [number, number, number]
  /** Gives a wall slab the same marble finish on its visible edges. */
  depth?: number
}) {
  const texture = useTexture(marbleWall, (image) => {
    image.colorSpace = SRGBColorSpace
  })
  // A wall panel and the long room backdrop have different proportions. Clone
  // the cached map so each surface can crop or repeat it independently instead
  // of stretching the marble veins.
  const map = useMemo(() => {
    const next = texture.clone()
    const repeatX = width / height / MARBLE_ASPECT
    next.colorSpace = SRGBColorSpace
    next.wrapS = RepeatWrapping
    next.repeat.set(repeatX, 1)
    next.offset.x = repeatX < 1 ? (1 - repeatX) / 2 : 0
    next.needsUpdate = true
    return next
  }, [texture, width, height])

  return (
    <mesh position={position} receiveShadow>
      {depth > 0 ? (
        <boxGeometry args={[width, height, depth]} />
      ) : (
        <planeGeometry args={[width, height]} />
      )}
      <meshStandardMaterial map={map} roughness={0.88} metalness={0} />
    </mesh>
  )
}

import { useTexture } from '@react-three/drei'
import { useMemo } from 'react'
import { RepeatWrapping, SRGBColorSpace } from 'three'

const CONCRETE_ASPECT = 7680 / 2970

/** The shared concrete finish used by every exhibition wall (and ceiling, its upper crop). */
export function MarbleWallSurface({
  width,
  height,
  position,
  depth = 0,
  unlit = false,
}: {
  width: number
  height: number
  position: [number, number, number]
  /** Gives a wall slab the same marble finish on its visible edges. */
  depth?: number
  /** Skip scene lighting entirely — the texture renders flat and literal, no sheen/shadow. */
  unlit?: boolean
}) {
  const texture = useTexture('/materials/concrete.png', (image) => {
    image.colorSpace = SRGBColorSpace
  })
  // A wall panel and the long room backdrop have different proportions. Clone
  // the cached map so each surface can crop or repeat it independently instead
  // of stretching the concrete grain.
  const map = useMemo(() => {
    const next = texture.clone()
    const repeatX = width / height / CONCRETE_ASPECT
    next.colorSpace = SRGBColorSpace
    next.wrapS = RepeatWrapping
    next.repeat.set(repeatX, 1)
    next.offset.x = repeatX < 1 ? (1 - repeatX) / 2 : 0
    next.needsUpdate = true
    return next
  }, [texture, width, height])

  return (
    <mesh position={position} receiveShadow={!unlit}>
      {depth > 0 ? (
        <boxGeometry args={[width, height, depth]} />
      ) : (
        <planeGeometry args={[width, height]} />
      )}
      {unlit ? (
        <meshBasicMaterial map={map} />
      ) : (
        <meshStandardMaterial map={map} roughness={0.88} metalness={0} />
      )}
    </mesh>
  )
}

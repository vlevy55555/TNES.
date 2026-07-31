import { useTexture } from '@react-three/drei'
import { useMemo } from 'react'
import { RepeatWrapping, SRGBColorSpace } from 'three'
import { WALL_BOTTOM_Y, WALL_HEIGHT, WALL_WIDTH } from '../../data/artworks'

const CONCRETE_ASPECT = 7680 / 2970

// The whole concrete image, laid out at the scale a full wall slab shows it:
// a wall crops the middle WALL_WIDTH of a MAP_W-wide image, full height.
const MAP_W = WALL_HEIGHT * CONCRETE_ASPECT
const MAP_H = WALL_HEIGHT
const MAP_U0 = 0.5 - WALL_WIDTH / MAP_W / 2

/**
 * A concrete map cropped to one rectangle of a wall, addressed in WALL-LOCAL
 * coordinates. Because every piece samples the region of the image that its own
 * position calls for, a wall split into several meshes — around a niche, say —
 * keeps ONE continuous grain across the seams, at one consistent scale.
 * `MarbleWallSurface` can't do this: it fits the image to each mesh's own
 * proportions, so a wide short piece would show grain several times finer than
 * a tall narrow one beside it.
 */
export function useWallPieceMap(x1: number, x2: number, y1: number, y2: number) {
  const texture = useTexture('/materials/concrete.png', (image) => {
    image.colorSpace = SRGBColorSpace
  })
  return useMemo(() => {
    const map = texture.clone()
    map.colorSpace = SRGBColorSpace
    map.wrapS = map.wrapT = RepeatWrapping
    map.repeat.set((x2 - x1) / MAP_W, (y2 - y1) / MAP_H)
    map.offset.set(MAP_U0 + (x1 + WALL_WIDTH / 2) / MAP_W, (y1 - WALL_BOTTOM_Y) / MAP_H)
    map.needsUpdate = true
    return map
  }, [texture, x1, x2, y1, y2])
}

/**
 * Concrete for an ExtrudeGeometry whose Shape is authored directly in wall-local
 * XY. Extrusion's default UV generator hands the shape's own coordinates through
 * as UVs, so instead of cropping per mesh this scales the map to world units —
 * which keeps an extruded piece's grain identical to the `WallPiece` slabs it
 * sits among, however oddly shaped its outline is.
 */
export function useWallShapeMap() {
  const texture = useTexture('/materials/concrete.png', (image) => {
    image.colorSpace = SRGBColorSpace
  })
  return useMemo(() => {
    const map = texture.clone()
    map.colorSpace = SRGBColorSpace
    map.wrapS = map.wrapT = RepeatWrapping
    map.repeat.set(1 / MAP_W, 1 / MAP_H)
    map.offset.set(MAP_U0 + WALL_WIDTH / 2 / MAP_W, -WALL_BOTTOM_Y / MAP_H)
    map.needsUpdate = true
    return map
  }, [texture])
}

/**
 * One rectangle of a wall, as a real slab. Its side faces are what become the
 * reveals of whatever opening the surrounding pieces leave — and since the top
 * piece's underside points away from the ceiling cones, it darkens on its own,
 * with no shadow map.
 */
export function WallPiece({
  x1,
  x2,
  y1,
  y2,
  z = 0,
  depth = 0.1,
  color = '#ffffff',
}: {
  x1: number
  x2: number
  y1: number
  y2: number
  z?: number
  depth?: number
  /** multiplies the map — used to sink a niche floor a shade deeper */
  color?: string
}) {
  const map = useWallPieceMap(x1, x2, y1, y2)
  return (
    <mesh position={[(x1 + x2) / 2, (y1 + y2) / 2, z]} receiveShadow>
      <boxGeometry args={[x2 - x1, y2 - y1, depth]} />
      <meshStandardMaterial map={map} color={color} roughness={0.88} metalness={0} />
    </mesh>
  )
}

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

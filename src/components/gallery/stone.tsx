import { useTexture } from '@react-three/drei'
import { useMemo } from 'react'
import { MirroredRepeatWrapping, SRGBColorSpace, type Texture } from 'three'

/**
 * The gallery's freestanding stone — consoles, benches, plinths — is cut from
 * the same map as the floor, at the same physical grain scale. One
 * /materials/floor.png tile spans this much world (see Room's FLOOR_TILE_*).
 */
const STONE_TILE_W = 9.36
const STONE_TILE_H = 5.27

/** A floor-stone map cropped to one surface's real dimensions, so it never stretches. */
export function useStoneMap(w: number, h: number) {
  const texture = useTexture('/materials/floor.png', (t) => {
    t.colorSpace = SRGBColorSpace
  })
  // clone per surface so each can crop the shared cached map independently
  return useMemo(() => {
    const map = texture.clone()
    map.colorSpace = SRGBColorSpace
    map.wrapS = map.wrapT = MirroredRepeatWrapping
    map.repeat.set(w / STONE_TILE_W, h / STONE_TILE_H)
    map.anisotropy = 8
    map.needsUpdate = true
    return map
  }, [texture, w, h])
}

/**
 * Matte stone. These faces point away from the ceiling spots — under the room's
 * low ambient (0.2) a lit-only material crushes them to near-black, exactly what
 * the floor plane solves with its own emissive lift. Same trick here: the map
 * doubles as the emissive map, so `lift` raises the stone's self-luminance
 * without touching its grain. It is also what separates stacked pieces, since
 * none of them is tinted darker. The floor itself runs at 0.42.
 */
export function StoneMaterial({ map, lift }: { map: Texture; lift: number }) {
  return (
    <meshStandardMaterial
      map={map}
      roughness={1}
      metalness={0}
      emissiveMap={map}
      emissive="#ffffff"
      emissiveIntensity={lift}
    />
  )
}

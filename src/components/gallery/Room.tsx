import { MeshReflectorMaterial, useTexture } from '@react-three/drei'
import { MirroredRepeatWrapping, SRGBColorSpace } from 'three'
import {
  walls,
  WALL_BOTTOM_Y,
  WALL_CENTER_Y,
  WALL_HEIGHT,
  MANIFESTO_ROOM_X,
  WALL_SPACING,
  CAMERA_Z,
  ARCHIVE_WALL,
  ABOUT_WALL,
  ABOUT_DOOR_X,
  ABOUT_DOOR_W,
} from '../../data/artworks'
import { MarbleWallSurface } from './MarbleWallSurface'

// Includes the side Manifesto room as well as the four visible navigation walls.
const minRoomX = MANIFESTO_ROOM_X
const maxRoomX = (walls.length - 1) * WALL_SPACING
const centerX = (minRoomX + maxRoomX) / 2
const WIDTH = maxRoomX - minRoomX + 18
const DEPTH = 20

// the source file's real pixel aspect — /materials/floor.png is 1672x941
const FLOOR_ASPECT = 1672 / 941
// tile depth sized so it repeats exactly 1.5x within CAMERA_Z (the
// camera-to-wall distance), width follows to keep the image un-stretched
const FLOOR_TILE_DEPTH = CAMERA_Z / 1.5
const FLOOR_TILE_WIDTH = FLOOR_TILE_DEPTH * FLOOR_ASPECT

// shift the tiling pattern so a tile is centered exactly on the Archive
// wall's x position, instead of on the room's overall midpoint
const archiveX = ARCHIVE_WALL * WALL_SPACING
const floorLeftEdge = centerX - WIDTH / 2
const distFromLeft = archiveX - floorLeftEdge
const FLOOR_OFFSET_X =
  0.5 - (((distFromLeft / FLOOR_TILE_WIDTH) % 1) + 1) % 1

// the backdrop panel splits around the About wall's doorway so the corridor
// behind it stays visible (the panel sits at z -0.55, inside the corridor)
const aboutDoorWorldX = ABOUT_WALL * WALL_SPACING + ABOUT_DOOR_X
const gapL = aboutDoorWorldX - ABOUT_DOOR_W / 2 - 0.4 - centerX // room-local
const gapR = aboutDoorWorldX + ABOUT_DOOR_W / 2 + 0.4 - centerX
const BACKDROP_LEFT_W = gapL + WIDTH / 2
const BACKDROP_RIGHT_W = WIDTH / 2 - gapR

// dark concrete ceiling closing the room overhead, like the reference
const CEILING_Y = WALL_BOTTOM_Y + WALL_HEIGHT + 0.05
const BEAM_SPACING = 5
const beamXs = Array.from(
  { length: Math.floor(WIDTH / BEAM_SPACING) },
  (_, i) => -WIDTH / 2 + BEAM_SPACING * (i + 0.5),
)

export function Room() {
  const floorTexture = useTexture('/materials/floor.png', (image) => {
    image.colorSpace = SRGBColorSpace
    // mirrored wrap: adjacent tiles share edge pixels, so no visible seam
    // can land mid-wall regardless of where the tile boundaries fall
    image.wrapS = image.wrapT = MirroredRepeatWrapping
    image.repeat.set(WIDTH / FLOOR_TILE_WIDTH, DEPTH / FLOOR_TILE_DEPTH)
    image.offset.x = FLOOR_OFFSET_X
    // floors are seen at grazing angles — without anisotropy the mipmaps smear
    image.anisotropy = 16
  })

  return (
    <group position={[centerX, 0, 0]}>
      {/* polished concrete floor — a real planar reflector: the walls, frames
          and spotlights mirror softly in it like the reference. roughnessMap
          (the floor texture itself) breaks the reflection up per-pixel so it
          reads as polished concrete, not glass; emissive keeps a floor-borne
          base brightness so the low ambient doesn't crush it to black */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, WALL_BOTTOM_Y, DEPTH / 2 - 1]}>
        <planeGeometry args={[WIDTH, DEPTH]} />
        {/* low mirror + heavy blur: the frames only ghost faintly in the floor,
            while the low roughness makes the spotlights themselves bloom into
            bright specular pools of light on the polished surface */}
        <MeshReflectorMaterial
          map={floorTexture}
          resolution={1024}
          mirror={0.22}
          mixStrength={2.2}
          mixBlur={1}
          blur={[680, 240]}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          depthScale={1}
          roughness={0.32}
          roughnessMap={floorTexture}
          metalness={0.05}
          emissiveMap={floorTexture}
          emissive="#ffffff"
          emissiveIntensity={0.42}
        />
      </mesh>
      {/* dark concrete ceiling + cross beams, the reference's black top band */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, CEILING_Y, DEPTH / 2 - 1]}>
        <planeGeometry args={[WIDTH, DEPTH]} />
        <meshStandardMaterial color="#1c1915" roughness={0.95} metalness={0} />
      </mesh>
      {beamXs.map((x) => (
        <mesh key={x} position={[x, CEILING_Y - 0.2, DEPTH / 2 - 1]}>
          <boxGeometry args={[0.45, 0.4, DEPTH]} />
          <meshStandardMaterial color="#211d18" roughness={0.95} metalness={0} />
        </mesh>
      ))}
      {/* backdrop closing the gap behind/between the angled walls — split in
          two so it doesn't cut across the About wall's corridor doorway */}
      <MarbleWallSurface
        width={BACKDROP_LEFT_W}
        height={WALL_HEIGHT}
        position={[-WIDTH / 2 + BACKDROP_LEFT_W / 2, WALL_CENTER_Y, -0.55]}
      />
      <MarbleWallSurface
        width={BACKDROP_RIGHT_W}
        height={WALL_HEIGHT}
        position={[WIDTH / 2 - BACKDROP_RIGHT_W / 2, WALL_CENTER_Y, -0.55]}
      />
    </group>
  )
}

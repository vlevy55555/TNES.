import { ARCHIVE_WALL, MANIFESTO_ROOM_X, WALL_SPACING, walls } from '../../data/artworks'
import { Wall } from './Wall'
import { Archive } from './Archive'
import { Room } from './Room'
import { GalleryLights } from './GalleryLights'
import { CameraController } from './CameraController'
import { ManifestoRoom } from './ManifestoRoom'

export function GalleryScene() {
  return (
    <>
      <color attach="background" args={['#ddd2c0']} />
      <GalleryLights />
      <CameraController />
      <Room />
      <ManifestoRoom position={[MANIFESTO_ROOM_X, 0, 0]} />

      {walls.map((wall) => (
        wall.index === ARCHIVE_WALL ? (
          <Archive key={wall.index} position={[wall.index * WALL_SPACING, 0, 0]} />
        ) : (
          <Wall key={wall.index} wall={wall} />
        )
      ))}

    </>
  )
}

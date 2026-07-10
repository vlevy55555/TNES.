import { TNES, walls } from '../../data/artworks'
import { Wall } from './Wall'
import { Room } from './Room'
import { GalleryLights } from './GalleryLights'
import { CameraController } from './CameraController'

export function GalleryScene() {
  return (
    <>
      <color attach="background" args={[TNES.white]} />
      <GalleryLights />
      <CameraController />
      <Room />

      {walls.map((wall) => (
        <Wall key={wall.index} wall={wall} />
      ))}
    </>
  )
}

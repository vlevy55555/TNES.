import { walls } from '../../data/artworks'
import { Wall } from './Wall'
import { GalleryLights } from './GalleryLights'
import { CameraController } from './CameraController'

export function GalleryScene() {
  return (
    <>
      <color attach="background" args={['#ddd2c0']} />
      <GalleryLights />
      <CameraController />

      {walls.map((wall) => (
        <Wall key={wall.index} wall={wall} />
      ))}
    </>
  )
}

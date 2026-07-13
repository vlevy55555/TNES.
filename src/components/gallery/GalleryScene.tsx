import { walls } from '../../data/artworks'
import { Wall } from './Wall'
import { Room } from './Room'
import { GalleryLights } from './GalleryLights'
import { CameraController } from './CameraController'
import { InquiryLetter } from '../ui/InquiryOverlay'

export function GalleryScene() {
  return (
    <>
      <color attach="background" args={['#ddd2c0']} />
      <GalleryLights />
      <CameraController />
      <Room />

      {walls.map((wall) => (
        <Wall key={wall.index} wall={wall} />
      ))}

      {/* the inquiry letter renders as an overlay scene in this same canvas */}
      <InquiryLetter />
    </>
  )
}

import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
import { GalleryLights } from '../components/gallery/GalleryLights'
import { Room } from '../components/gallery/Room'
import { Wall } from '../components/gallery/Wall'
import { CAMERA_Z, walls } from '../data/artworks'
import { useGalleryStore } from '../store/useGalleryStore'

/**
 * The exhibition's opening wall, embedded in the home page as an environment.
 *
 * No CameraController: the camera sits at the wall's resting framing and stays
 * there, so the section never steals the page's scroll. `bare` strips the
 * console's commerce — the room, the print and the work's own text remain.
 */
export default function Studio() {
  // the 3D wall lays itself out from this flag and nothing else sets it here
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 700px), (orientation: portrait)')
    const apply = () => useGalleryStore.getState().setIsMobile(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  return (
    <Canvas camera={{ position: [0, 0, CAMERA_Z], fov: 35 }} dpr={[1, 1.5]} shadows>
      <Suspense fallback={null}>
        <color attach="background" args={['#ddd2c0']} />
        <GalleryLights />
        <Room />
        <Wall wall={walls[0]} bare />
      </Suspense>
    </Canvas>
  )
}

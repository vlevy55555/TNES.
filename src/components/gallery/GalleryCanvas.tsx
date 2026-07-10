import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { Loader } from '@react-three/drei'
import { GalleryScene } from './GalleryScene'
import {
  CAMERA_Z,
  HERO,
  HERO_ZOOM_Z,
  SIGNATURE_WALL,
  WALL_SPACING,
  walls,
} from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'

const startWall = useGalleryStore.getState().currentWall
// first load on the signature wall opens zoomed into the hero (matches the scrub
// default); the very first painted frame must already be zoomed in
const startPos: [number, number, number] =
  startWall === SIGNATURE_WALL
    ? [startWall * WALL_SPACING, HERO.position[1], HERO_ZOOM_Z]
    : [
        startWall * WALL_SPACING + Math.sin(walls[startWall].angle) * CAMERA_Z,
        0,
        Math.cos(walls[startWall].angle) * CAMERA_Z,
      ]

export function GalleryCanvas() {
  return (
    <div className="gallery-canvas">
      <Canvas camera={{ position: startPos, fov: 35 }} dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          <GalleryScene />
        </Suspense>
      </Canvas>
      <Loader
        containerStyles={{ background: '#ece5d8' }}
        barStyles={{ background: '#2f2a24' }}
        dataStyles={{ color: '#8a7f6d' }}
      />
    </div>
  )
}

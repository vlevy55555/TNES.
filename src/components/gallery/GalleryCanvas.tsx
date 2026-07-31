import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { Loader } from '@react-three/drei'
import { GalleryScene } from './GalleryScene'
import { CAMERA_Z, WALL_SPACING, walls } from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'

const startWall = useGalleryStore.getState().currentWall
// every wall opens at its resting straight-on framing
const startPos: [number, number, number] = [
  startWall * WALL_SPACING + Math.sin(walls[startWall].angle) * CAMERA_Z,
  0,
  Math.cos(walls[startWall].angle) * CAMERA_Z,
]

export function GalleryCanvas() {
  return (
    <div className="gallery-canvas">
      <Canvas camera={{ position: startPos, fov: 35 }} dpr={[1, 1.5]} shadows>
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

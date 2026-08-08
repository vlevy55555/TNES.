import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'
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

const LOADING_MESSAGES = [
  'preparing the room',
  'hanging the prints',
  'adjusting the light',
  'framing the exhibition',
] as const

function GalleryLoader() {
  const { active, progress } = useProgress()
  const [minimumElapsed, setMinimumElapsed] = useState(false)
  const [visible, setVisible] = useState(true)
  const [messageIndex, setMessageIndex] = useState(0)
  const ready = minimumElapsed && !active

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 700px), (orientation: portrait)').matches
    const timer = window.setTimeout(() => setMinimumElapsed(true), mobile ? 3000 : 2400)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (ready) return
    const timer = window.setInterval(() => {
      setMessageIndex((index) => (index + 1) % LOADING_MESSAGES.length)
    }, 750)
    return () => window.clearInterval(timer)
  }, [ready])

  useEffect(() => {
    if (!ready) return
    const timer = window.setTimeout(() => setVisible(false), 700)
    return () => window.clearTimeout(timer)
  }, [ready])

  if (!visible) return null

  return (
    <div className={`gallery-loader ${ready ? 'gallery-loader--leaving' : ''}`} role="status" aria-live="polite">
      <span className="gallery-loader__brand">TNES.</span>
      <div className="gallery-loader__track" aria-hidden="true">
        <span style={{ width: `${Math.max(4, progress)}%` }} />
      </div>
      <span className="gallery-loader__status">
        {ready ? 'opening gallery' : LOADING_MESSAGES[messageIndex]}
      </span>
    </div>
  )
}

export function GalleryCanvas() {
  const isMobile = useGalleryStore((state) => state.isMobile)

  return (
    <div className="gallery-canvas">
      <Canvas camera={{ position: startPos, fov: 35 }} dpr={[1, isMobile ? 1.5 : 2]} shadows>
        <Suspense fallback={null}>
          <GalleryScene />
        </Suspense>
      </Canvas>
      <GalleryLoader />
    </div>
  )
}

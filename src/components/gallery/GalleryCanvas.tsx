import { Canvas } from '@react-three/fiber'
import { useThree } from '@react-three/fiber'
import { Suspense, useEffect, useState } from 'react'
import { Preload, useProgress } from '@react-three/drei'
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

function GalleryLoader({ sceneReady }: { sceneReady: boolean }) {
  const { active, progress } = useProgress()
  const [minimumElapsed, setMinimumElapsed] = useState(false)
  const [visible, setVisible] = useState(true)
  const [messageIndex, setMessageIndex] = useState(0)
  const ready = minimumElapsed && !active && sceneReady

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

function GalleryWarmup({ onReady }: { onReady: () => void }) {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const camera = useThree((state) => state.camera)

  useEffect(() => {
    let cancelled = false
    let frame = 0

    const warm = async () => {
      await gl.compileAsync(scene, camera)
      // Let uploaded textures and generated text settle through two complete
      // browser paints before revealing the room.
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          if (!cancelled) onReady()
        })
      })
    }

    void warm()
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [camera, gl, onReady, scene])

  return null
}

export function GalleryCanvas() {
  const isMobile = useGalleryStore((state) => state.isMobile)
  const [sceneReady, setSceneReady] = useState(false)

  return (
    <div className="gallery-canvas">
      <Canvas
        camera={{ position: startPos, fov: 35 }}
        dpr={isMobile ? [1.25, 1.5] : [1, 1.25]}
        shadows={false}
        performance={{ min: 0.65 }}
        gl={{ powerPreference: 'high-performance', antialias: isMobile }}
      >
        <Suspense fallback={null}>
          <GalleryScene />
          {/* Compile every wall while the loading veil is still visible. Without
              this, the first camera move to Prints pays the shader cost mid-glide. */}
          <Preload all />
          <GalleryWarmup onReady={() => setSceneReady(true)} />
        </Suspense>
      </Canvas>
      <GalleryLoader sceneReady={sceneReady} />
    </div>
  )
}

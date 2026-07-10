import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { SRGBColorSpace, type MeshBasicMaterial } from 'three'
import { useTexture } from '@react-three/drei'
import { FRAME_BORDER, HERO, MAT_BORDER } from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'
import { introScrub } from './introScrub'

// the painting the signature is written over: it opens at full brightness
// (the opening is zoomed into it) then sinks to a dim secondary backdrop as the
// scroll pulls the camera back and the VSL signature takes over
const DIM = 0.5

export function HeroFrame() {
  const texture = useTexture(HERO.image, (t) => {
    t.colorSpace = SRGBColorSpace
  })
  const photo = useRef<MeshBasicMaterial>(null)

  // opening consumed / later visit: settle at the dimmed backdrop level
  useEffect(() => {
    const mat = photo.current
    if (mat && !useGalleryStore.getState().introPlaying) mat.color.setScalar(DIM)
  }, [])

  // while the opening is armed, brightness follows the scroll scrub (reversible)
  useFrame(() => {
    const mat = photo.current
    if (mat && useGalleryStore.getState().introPlaying) {
      mat.color.setScalar(1 + (DIM - 1) * introScrub.progress)
    }
  })

  const [w, h] = HERO.size
  const frameW = w + FRAME_BORDER * 2
  const frameH = h + FRAME_BORDER * 2

  return (
    <group position={HERO.position}>
      <mesh>
        <boxGeometry args={[frameW, frameH, 0.1]} />
        <meshStandardMaterial color="#8f7c4e" metalness={0.35} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.055]}>
        <boxGeometry args={[w + MAT_BORDER * 2, h + MAT_BORDER * 2, 0.03]} />
        <meshStandardMaterial color="#e7dfd0" />
      </mesh>
      <mesh position={[0, 0, 0.072]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial ref={photo} map={texture} toneMapped={false} />
      </mesh>
    </group>
  )
}

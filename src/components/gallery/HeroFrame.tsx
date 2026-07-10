import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { SRGBColorSpace, type MeshBasicMaterial } from 'three'
import { useTexture } from '@react-three/drei'
import { FRAME_BORDER, HERO, MAT_BORDER } from '../../data/artworks'
import { introScrub } from './introScrub'

// the painting the signature is written over: full brightness when the visitor
// zooms into it (signature gone), dimmed to a backdrop at rest (signature formed)
const DIM = 0.5

export function HeroFrame() {
  const texture = useTexture(HERO.image, (t) => {
    t.colorSpace = SRGBColorSpace
  })
  const photo = useRef<MeshBasicMaterial>(null)

  // brightness follows the scroll scrub: full when zoomed into the painting
  // (progress 0), dimmed to a backdrop when formed/at rest (progress 1)
  useFrame(() => {
    const mat = photo.current
    if (mat) mat.color.setScalar(1 + (DIM - 1) * introScrub.progress)
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

import { useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Object3D, RepeatWrapping, SRGBColorSpace, type SpotLight } from 'three'
import { WALL_CENTER_Y, WALL_HEIGHT, WALL_WIDTH } from '../../data/artworks'

/** The manifesto is a room, not a page: concrete, an aluminium slab and daylight. */
export function ManifestoRoom({ position }: { position: [number, number, number] }) {
  const concreteTexture = useTexture('/materials/manifesto-concrete.png', (texture) => {
    texture.colorSpace = SRGBColorSpace
    texture.wrapS = texture.wrapT = RepeatWrapping
    texture.repeat.set(1.5, 1)
  })
  const panelTexture = useTexture('/materials/manifesto-panel.webp', (texture) => {
    texture.colorSpace = SRGBColorSpace
  })
  const light = useRef<SpotLight>(null)
  const target = useRef<Object3D>(null)

  useEffect(() => {
    if (light.current && target.current) light.current.target = target.current
  }, [])

  useFrame(({ clock }) => {
    if (!light.current || !target.current) return
    const t = clock.elapsedTime
    light.current.position.x = Math.sin(t * 0.11) * 2.3
    light.current.position.y = 2.7 + Math.cos(t * 0.09) * 0.12
    light.current.intensity = 10.8 + Math.sin(t * 0.14) * 0.65
    target.current.position.x = Math.cos(t * 0.08) * 0.35
  })

  return (
    <group position={position}>
      <mesh position={[0, WALL_CENTER_Y, -0.08]} receiveShadow>
        {/* Wider than the normal gallery slab so no marble edge leaks into this
            isolated concrete chamber at the sides of the camera framing. */}
        <boxGeometry args={[WALL_WIDTH + 4, WALL_HEIGHT, 0.12]} />
        <meshStandardMaterial map={concreteTexture} color="#ffffff" roughness={0.93} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.194, 3.2]} receiveShadow>
        <planeGeometry args={[WALL_WIDTH + 4, 7]} />
        <meshStandardMaterial map={concreteTexture} color="#e0ddd3" roughness={0.96} />
      </mesh>

      <mesh position={[0.09, 0.22, 0.008]}>
        <planeGeometry args={[5.46, 3.96]} />
        <meshBasicMaterial color="#31312e" transparent opacity={0.18} depthWrite={false} />
      </mesh>
      {/* A machined aluminium plaque: dark backing, thin silver lip, then the
          brushed face and four visible screw heads from the supplied reference. */}
      <mesh position={[0, 0.28, 0.058]} castShadow receiveShadow>
        <boxGeometry args={[5.3, 3.84, 0.12]} />
        <meshPhysicalMaterial color="#595a57" metalness={0.38} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.28, 0.132]} castShadow receiveShadow>
        <boxGeometry args={[5.2, 3.74, 0.035]} />
        <meshStandardMaterial map={panelTexture} color="#ffffff" metalness={0.18} roughness={0.48} />
      </mesh>

      <spotLight
        ref={light}
        position={[0, 2.7, 2.4]}
        color="#fff4df"
        intensity={11}
        angle={0.94}
        penumbra={0.86}
        decay={1.5}
        distance={10}
        castShadow
      />
      <object3D ref={target} position={[0, 0.1, 0]} />
      <ambientLight intensity={0.34} color="#ede9de" />
    </group>
  )
}

import { useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { MirroredRepeatWrapping, Object3D, SRGBColorSpace, type SpotLight } from 'three'
import { WALL_CENTER_Y, WALL_HEIGHT, WALL_WIDTH } from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'

/** The manifesto is a room, not a page: concrete, a warm brushed-metal slab and daylight. */
export function ManifestoRoom({ position }: { position: [number, number, number] }) {
  const isMobile = useGalleryStore((state) => state.isMobile)
  const concreteTexture = useTexture('/materials/concrete.png', (texture) => {
    texture.colorSpace = SRGBColorSpace
  })
  const floorTexture = useTexture('/materials/floor.png', (texture) => {
    texture.colorSpace = SRGBColorSpace
    texture.wrapS = texture.wrapT = MirroredRepeatWrapping
    texture.repeat.set(2, 1)
    texture.anisotropy = 16
  })
  const panelTexture = useTexture('/materials/manifesto-panel-silver-desktop-bright.png', (texture) => {
    texture.colorSpace = SRGBColorSpace
    texture.anisotropy = 16
  })
  const mobilePanelTexture = useTexture('/materials/manifesto-panel-silver-mobile.png', (texture) => {
    texture.colorSpace = SRGBColorSpace
    texture.anisotropy = 16
  })
  const panelWidth = isMobile ? 3.4 : 5.3
  const panelHeight = isMobile ? 4.25 : 3.84
  const faceWidth = panelWidth - 0.1
  const faceHeight = panelHeight - 0.1
  const panelY = isMobile ? 0.18 : 0.28
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
        <meshStandardMaterial map={floorTexture} color="#e0ddd3" roughness={0.96} />
      </mesh>

      <mesh position={[0.09, panelY - 0.06, 0.008]}>
        <planeGeometry args={[panelWidth + 0.16, panelHeight + 0.12]} />
        <meshBasicMaterial color="#31312e" transparent opacity={0.18} depthWrite={false} />
      </mesh>
      {/* Neutral brushed silver as in the supplied reference. The subtle warmth
          comes from the room light, not from a bronze tint in the material. */}
      <mesh position={[0, panelY, 0.058]} castShadow receiveShadow>
        <boxGeometry args={[panelWidth, panelHeight, 0.12]} />
        <meshPhysicalMaterial color="#8b8d8c" metalness={0.78} roughness={0.31} />
      </mesh>
      <mesh position={[0, panelY, 0.132]} castShadow receiveShadow>
        <boxGeometry args={[faceWidth, faceHeight, 0.035]} />
        <meshStandardMaterial
          map={isMobile ? mobilePanelTexture : panelTexture}
          color="#ffffff"
          metalness={0.48}
          roughness={0.34}
        />
      </mesh>

      <spotLight
        ref={light}
        position={[0, 2.7, 2.4]}
        color="#fffdf8"
        intensity={12.5}
        angle={0.94}
        penumbra={0.86}
        decay={1.5}
        distance={10}
        castShadow
      />
      <object3D ref={target} position={[0, 0.1, 0]} />
      <ambientLight intensity={0.56} color="#f4f5f4" />
    </group>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Text, useCursor } from '@react-three/drei'
import gsap from 'gsap'
import type { Group } from 'three'
import { FONT_SANS, FONT_SERIF_ITALIC } from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'
import { dragState } from './CameraController'

// a rolled scroll resting below the hero on the signature wall — click it to
// unroll the manifesto (the DOM overlay in Manifesto.tsx handles the reveal)
export function ManifestoScroll() {
  const openManifesto = useGalleryStore((s) => s.openManifesto)
  const zoomed = useGalleryStore((s) => s.selectedArtworkId !== null)
  const group = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)

  useEffect(() => {
    if (!group.current) return
    gsap.to(group.current.scale, {
      x: hovered ? 1.06 : 1,
      y: hovered ? 1.06 : 1,
      z: 1,
      duration: 0.35,
      ease: 'power2.out',
    })
  }, [hovered])

  const LEN = 1.15
  const R = 0.085

  return (
    <group
      ref={group}
      position={[0, -0.86, 0.22]}
      onClick={(e) => {
        e.stopPropagation()
        if (dragState.moved) return
        openManifesto()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* the rolled paper body, laid horizontally */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[R, R, LEN, 40]} />
        <meshStandardMaterial color="#e9e1d1" roughness={0.85} metalness={0} />
      </mesh>
      {/* the loose outer edge of the roll, a touch darker for the spiral read */}
      <mesh position={[0, R * 0.9, 0.02]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[R * 0.55, R * 0.55, LEN + 0.006, 32]} />
        <meshStandardMaterial color="#d8cdb6" roughness={0.9} metalness={0} />
      </mesh>
      {/* darker rolled ends (the visible spiral at each side) */}
      {[-LEN / 2, LEN / 2].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[R + 0.001, R + 0.001, 0.01, 40]} />
          <meshStandardMaterial color="#c9bda3" roughness={0.9} metalness={0} />
        </mesh>
      ))}

      {/* label above the roll — Manrope, tracked (fades out when zoomed in) */}
      <Text
        font={FONT_SANS}
        fontSize={0.062}
        letterSpacing={0.3}
        color={hovered ? '#6f6455' : '#6b6151'}
        anchorX="center"
        anchorY="bottom"
        position={[0, R + 0.13, 0]}
        fillOpacity={zoomed ? 0 : 1}
      >
        MANIFESTO
      </Text>
      {/* a line of context under the roll — editorial serif */}
      <Text
        font={FONT_SERIF_ITALIC}
        fontSize={0.062}
        color="#6b6151"
        anchorX="center"
        anchorY="top"
        maxWidth={1.6}
        textAlign="center"
        position={[0, -R - 0.11, 0]}
        fillOpacity={zoomed ? 0 : 0.9}
      >
        {hovered
          ? 'unroll to read the story behind the name'
          : 'the story behind TNES.'}
      </Text>
    </group>
  )
}

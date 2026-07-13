import { Text, useCursor, useTexture } from '@react-three/drei'
import { useEffect, useRef, useState } from 'react'
import { CanvasTexture, SRGBColorSpace, type Group } from 'three'
import gsap from 'gsap'
import {
  artworks,
  FONT_BRAND,
  FONT_SANS,
  FRAME_BORDER,
  MAT_BORDER,
  type Artwork,
} from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'
import { dragState } from './CameraController'

// ponytail: radial-gradient canvas as fake soft shadow — no shadow maps needed
function makeShadowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(64, 64, 24, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(40,30,15,0.26)')
  gradient.addColorStop(1, 'rgba(40,30,15,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 128, 128)
  return new CanvasTexture(canvas)
}
const shadowTexture = makeShadowTexture()

artworks.forEach((a) => useTexture.preload(a.image))

export function ArtworkFrame({ artwork }: { artwork: Artwork }) {
  const texture = useTexture(artwork.image, (t) => {
    t.colorSpace = SRGBColorSpace
  })
  const selectArtwork = useGalleryStore((s) => s.selectArtwork)
  const group = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)

  useEffect(() => {
    if (!group.current) return
    gsap.to(group.current.scale, {
      x: hovered ? 1.02 : 1,
      y: hovered ? 1.02 : 1,
      z: 1,
      duration: 0.35,
      ease: 'power2.out',
    })
  }, [hovered])

  const [w, h] = artwork.size
  const frameW = w + FRAME_BORDER * 2
  const frameH = h + FRAME_BORDER * 2

  return (
    <group
      ref={group}
      position={[artwork.position[0], artwork.position[1], 0.07]}
      onClick={(e) => {
        e.stopPropagation()
        // the inquiry letter overlays the gallery — don't react to clicks behind it
        if (useGalleryStore.getState().inquiryOpen || dragState.moved) return
        selectArtwork(artwork.id)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        if (useGalleryStore.getState().inquiryOpen) return
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* fake soft shadow against the wall */}
      <mesh position={[0.05, -0.08, -0.015]}>
        <planeGeometry args={[frameW + 0.35, frameH + 0.35]} />
        <meshBasicMaterial
          map={shadowTexture}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* gold frame */}
      <mesh>
        <boxGeometry args={[frameW, frameH, 0.1]} />
        <meshStandardMaterial color="#b69b5e" metalness={0.35} roughness={0.45} />
      </mesh>

      {/* passe-partout layered over the frame face (frontal camera never sees the seam) */}
      <mesh position={[0, 0, 0.055]}>
        <boxGeometry args={[w + MAT_BORDER * 2, h + MAT_BORDER * 2, 0.03]} />
        <meshStandardMaterial color="#f6f1e7" />
      </mesh>

      {/* photograph */}
      <mesh position={[0, 0, 0.072]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>

      {/* label plaque under the frame */}
      {/* work title — Playfair (gallery identification) */}
      <Text
        font={FONT_BRAND}
        fontSize={0.115}
        color="#2f2a24"
        anchorX="left"
        anchorY="top"
        position={[-frameW / 2, -frameH / 2 - 0.18, 0]}
      >
        {artwork.title}
      </Text>
      {/* caption — Manrope, tracked */}
      <Text
        font={FONT_SANS}
        fontSize={0.058}
        letterSpacing={0.22}
        color="#9a8f7f"
        anchorX="left"
        anchorY="top"
        position={[-frameW / 2, -frameH / 2 - 0.36, 0]}
      >
        {artwork.subtitle.toUpperCase()}
      </Text>
    </group>
  )
}

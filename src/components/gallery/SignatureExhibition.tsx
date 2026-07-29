import { Text, useCursor, useTexture } from '@react-three/drei'
import { useState } from 'react'
import { SRGBColorSpace } from 'three'
import {
  BRAND_STATEMENT,
  FONT_SANS,
  FONT_SERIF,
  type FrameStyle,
} from '../../data/artworks'
import { FrameLayers } from './ArtworkFrame'
import { useGalleryStore } from '../../store/useGalleryStore'
import { dragState } from './CameraController'
import { INTERACTIVE_CURSOR } from './interactiveCursor'

// a framed print on the opening wall (decorative — the browsable copies live on
// the Exhibition/Archive walls and in the scroll-down Archive)
function DecoFrame({
  image,
  size,
  position,
  style,
}: {
  image: string
  size: [number, number]
  position: [number, number, number]
  style: FrameStyle
}) {
  const tex = useTexture(image, (t) => {
    t.colorSpace = SRGBColorSpace
  })
  const [w, h] = size
  return (
    <group position={position}>
      <FrameLayers texture={tex} w={w} h={h} style={style} />
    </group>
  )
}

// the central print, signed by V Levy — same frame, plus the hand-drawn mark
// composited onto the photograph itself (the signature-ink PNG as an alpha mask)
function SignedCentral({ position }: { position: [number, number, number] }) {
  const tex = useTexture('/artworks/v1/ipanema_riorunner_2025_v1.webp', (t) => {
    t.colorSpace = SRGBColorSpace
  })
  const w = 1.5
  const h = 1.0
  return (
    <group position={position}>
      <FrameLayers texture={tex} w={w} h={h} style="white" />
    </group>
  )
}

function ManifestoLink() {
  const openManifestoRoom = useGalleryStore((s) => s.openManifestoRoom)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered, INTERACTIVE_CURSOR)

  return (
    <Text
      font={FONT_SANS}
      fontSize={0.07}
      letterSpacing={0.11}
      color={hovered ? '#ffffff' : '#f2efe8'}
      anchorX="center"
      anchorY="middle"
      position={[0, -0.58, 0.14]}
      onClick={(event) => {
        event.stopPropagation()
        if (!dragState.moved) openManifestoRoom()
      }}
      onPointerOver={(event) => {
        event.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      read the manifesto →
    </Text>
  )
}

// the opening (Signature) wall, re-cast as an exhibition: a central signed print
// flanked by two works and the brand statement.
export function SignatureExhibition() {
  return (
    <group>
      {/* one-line brand statement, above the hang */}
      <Text
        font={FONT_SERIF}
        fontSize={0.16}
        color="#392f27"
        anchorX="center"
        anchorY="middle"
        maxWidth={6}
        textAlign="center"
        position={[0, 1.8, 0.08]}
      >
        {BRAND_STATEMENT}
      </Text>

      <SignedCentral position={[0, 0.3, 0.07]} />
      <DecoFrame
        image="/artworks/v1/ischia_mezzatorre_2025_v1.webp"
        size={[0.78, 1.16]}
        position={[-2.78, 0.32, 0.07]}
        style="white"
      />
      <DecoFrame
        image="/artworks/v1/stpeterspool_hero_2025_v1.webp"
        size={[1.16, 0.78]}
        position={[2.78, 0.32, 0.07]}
        style="white"
      />
      <ManifestoLink />
    </group>
  )
}

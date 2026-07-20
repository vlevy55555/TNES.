import { Text, useTexture } from '@react-three/drei'
import { SRGBColorSpace } from 'three'
import {
  ARCHIVE_POS,
  BRAND_STATEMENT,
  FONT_BRAND,
  FONT_SANS,
  FONT_SERIF_ITALIC,
  FRAME_BORDER,
  MAT_BORDER,
} from '../../data/artworks'
import { ManifestoScroll } from './ManifestoScroll'
import { Archive } from './Archive'

const GOLD = '#b69b5e'
const MAT = '#f6f1e7'

// the quiet [O] brand mark stamped in a print's corner (matches ArtworkFrame)
function OMark({ w, h }: { w: number; h: number }) {
  return (
    <Text
      font={FONT_BRAND}
      fontSize={0.1}
      color="#f2ead9"
      fillOpacity={0.4}
      anchorX="right"
      anchorY="bottom"
      position={[w / 2 - 0.09, -h / 2 + 0.09, 0.075]}
    >
      [O]
    </Text>
  )
}

// a framed print on the opening wall (decorative — the browsable copies live on
// the Exhibition/Archive walls and in the scroll-down Archive)
function DecoFrame({
  image,
  size,
  position,
}: {
  image: string
  size: [number, number]
  position: [number, number, number]
}) {
  const tex = useTexture(image, (t) => {
    t.colorSpace = SRGBColorSpace
  })
  const [w, h] = size
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[w + FRAME_BORDER * 2, h + FRAME_BORDER * 2, 0.1]} />
        <meshStandardMaterial color={GOLD} metalness={0.35} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0, 0.055]}>
        <boxGeometry args={[w + MAT_BORDER * 2, h + MAT_BORDER * 2, 0.03]} />
        <meshStandardMaterial color={MAT} />
      </mesh>
      <mesh position={[0, 0, 0.072]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <OMark w={w} h={h} />
    </group>
  )
}

// the central print, signed by V Levy — same frame, plus the hand-drawn mark
// composited onto the photograph itself (the signature-ink PNG as an alpha mask)
function SignedCentral({ position }: { position: [number, number, number] }) {
  const tex = useTexture('/artworks/rio-runner.jpg', (t) => {
    t.colorSpace = SRGBColorSpace
  })
  const w = 1.5
  const h = 1.0
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[w + FRAME_BORDER * 2, h + FRAME_BORDER * 2, 0.11]} />
        <meshStandardMaterial color={GOLD} metalness={0.4} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0, 0.06]}>
        <boxGeometry args={[w + MAT_BORDER * 2, h + MAT_BORDER * 2, 0.03]} />
        <meshStandardMaterial color={MAT} />
      </mesh>
      <mesh position={[0, 0, 0.078]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <OMark w={w} h={h} />
    </group>
  )
}

// the opening (Signature) wall, re-cast as an exhibition: a central signed print
// flanked by two works, the brand statement, and — reached by scrolling down —
// the 3D Archive of every work, seated below.
export function SignatureExhibition() {
  return (
    <group>
      {/* one-line brand statement, above the hang */}
      <Text
        font={FONT_SERIF_ITALIC}
        fontSize={0.135}
        color="#6f6455"
        anchorX="center"
        anchorY="middle"
        maxWidth={6}
        textAlign="center"
        position={[0, 1.78, 0.06]}
      >
        {BRAND_STATEMENT}
      </Text>

      <SignedCentral position={[0, 0.3, 0.07]} />
      <DecoFrame image="/artworks/wied-il-ghasri.jpg" size={[1.16, 0.78]} position={[-2.78, 0.32, 0.07]} />
      <DecoFrame image="/artworks/praia-da-baleia.jpg" size={[1.16, 0.78]} position={[2.78, 0.32, 0.07]} />

      {/* scroll cue toward the archive below */}
      <Text
        font={FONT_SANS}
        fontSize={0.058}
        letterSpacing={0.34}
        color="#a99d8a"
        anchorX="center"
        anchorY="middle"
        position={[0, -1.62, 0.06]}
      >
        SCROLL DOWN — THE ARCHIVE ↓
      </Text>

      <ManifestoScroll />

      {/* the archive, seated to the left of the opening wall (scroll pans here) */}
      <group position={ARCHIVE_POS}>
        <Archive />
      </group>
    </group>
  )
}

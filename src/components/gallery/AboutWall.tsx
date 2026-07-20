import { Html, Text, useTexture } from '@react-three/drei'
import { SRGBColorSpace } from 'three'
import {
  ABOUT,
  FONT_BRAND,
  FONT_SANS,
  FONT_SERIF_ITALIC,
  FRAME_BORDER,
  MAT_BORDER,
  VSL_URL,
} from '../../data/artworks'

const INK = '#2f2a24'
const MUTED = '#8a7f6d'
const GOLD = '#8f7c4e'

// Victor's portrait, framed like the artworks on the other walls (gold + mat)
function PortraitFrame() {
  const texture = useTexture(ABOUT.portrait, (t) => {
    t.colorSpace = SRGBColorSpace
  })
  const [w, h] = ABOUT.portraitSize

  return (
    <group position={[-2.15, 0.05, 0.06]}>
      <mesh>
        <boxGeometry args={[w + FRAME_BORDER * 2, h + FRAME_BORDER * 2, 0.1]} />
        <meshStandardMaterial color={GOLD} metalness={0.35} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.055]}>
        <boxGeometry args={[w + MAT_BORDER * 2, h + MAT_BORDER * 2, 0.03]} />
        <meshStandardMaterial color="#e7dfd0" />
      </mesh>
      <mesh position={[0, 0, 0.072]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  )
}

// ponytail: all positions eyeballed against the resting wall framing — nudge the
// x/y literals if the composition drifts; nothing downstream depends on them.
export function AboutWall() {
  return (
    <group>
      <PortraitFrame />

      {/* name — the brand serif, same voice as the manifesto authorship */}
      <Text
        font={FONT_BRAND}
        fontSize={0.24}
        color={INK}
        anchorX="left"
        anchorY="middle"
        position={[-0.35, 1.15, 0.06]}
      >
        {ABOUT.name}
      </Text>

      <Text
        font={FONT_SANS}
        fontSize={0.066}
        letterSpacing={0.22}
        color={MUTED}
        anchorX="left"
        anchorY="middle"
        position={[-0.33, 0.82, 0.06]}
      >
        {ABOUT.role}
      </Text>

      {/* thin rule under the heading */}
      <mesh position={[0.63, 0.66, 0.06]}>
        <planeGeometry args={[2.95, 0.006]} />
        <meshBasicMaterial color="#c9bda6" />
      </mesh>

      {/* gold accent bar standing in for a CSS left-border on the pull-quote */}
      <mesh position={[-0.34, 0.36, 0.06]}>
        <planeGeometry args={[0.012, 0.34]} />
        <meshBasicMaterial color="#c9a24b" />
      </mesh>

      <Text
        font={FONT_SERIF_ITALIC}
        fontSize={0.118}
        lineHeight={1.45}
        color={INK}
        anchorX="left"
        anchorY="top"
        maxWidth={2.85}
        position={[-0.26, 0.5, 0.06]}
      >
        {ABOUT.quote}
      </Text>

      <Text
        font={FONT_SANS}
        fontSize={0.068}
        lineHeight={1.6}
        color={MUTED}
        anchorX="left"
        anchorY="top"
        maxWidth={3.05}
        position={[-0.34, 0.08, 0.06]}
      >
        {ABOUT.body}
      </Text>

      {/* Victor's direct contacts — icon row, clickable, tucked under the portrait */}
      <Html transform position={[-2.15, -1.55, 0.14]} scale={0.2} zIndexRange={[10, 0]} occlude={false}>
        <div className="about-contact">
          <a href={`mailto:${ABOUT.contact.email}`} title={ABOUT.contact.email} aria-label="Email">
            ✉
          </a>
          <a
            href={`tel:${ABOUT.contact.phone.replace(/[^+\d]/g, '')}`}
            title={ABOUT.contact.phone}
            aria-label="Phone"
          >
            ✆
          </a>
          <a
            href={ABOUT.contact.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`Instagram ${ABOUT.contact.instagram}`}
            aria-label="Instagram"
          >
            ◎
          </a>
        </div>
      </Html>

      {/* the doorway into VSL — a real outbound link, opens in a new tab */}
      <Html transform position={[0.62, -0.7, 0.14]} scale={0.24} zIndexRange={[10, 0]} occlude={false}>
        <a className="about-cta" href={VSL_URL} target="_blank" rel="noopener noreferrer">
          <span className="about-cta-btn">
            {ABOUT.cta} <span className="about-cta-arrow">↗</span>
          </span>
          <span className="about-cta-sub">{ABOUT.ctaSub}</span>
        </a>
      </Html>
    </group>
  )
}

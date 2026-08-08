import { Canvas } from '@react-three/fiber'
import { Bounds, ContactShadows, Float, PresentationControls, useTexture } from '@react-three/drei'
import { Suspense } from 'react'
import { SRGBColorSpace } from 'three'
import { FrameLayers, frameOuterDimensions } from '../components/gallery/FrameLayers'
import type { Artwork, FrameStyle } from '../data/artworks'

function Print({ artwork, style }: { artwork: Artwork; style: FrameStyle }) {
  const texture = useTexture(artwork.image, (t) => {
    t.colorSpace = SRGBColorSpace
  })
  const [w, h] = artwork.size
  return (
    <FrameLayers
      texture={texture}
      w={w}
      h={h}
      style={style}
      backdrop={false}
      flushPhoto
      brandedBack
    />
  )
}

/**
 * The framed print as a real object — the same three-layer moulding the gallery
 * builds, lit on its own, turnable, standing on a contact shadow.
 *
 * ponytail: no Environment map (every drei preset fetches an HDRI from a CDN).
 * The gilt gets its highlights from two hard point lights instead; swap in
 * <Environment> with local Lightformers if the gold ever needs true reflections.
 */
export default function ProductFrame({
  artwork,
  style,
}: {
  artwork: Artwork
  style: FrameStyle
}) {
  const [frameW, frameH] = frameOuterDimensions(artwork.size[0], artwork.size[1], style)
  // The print hangs at eye level in the room; here it stands on a surface, so
  // the shadow sits just under its bottom edge rather than at the origin.
  // hangs clear of the shadow instead of standing on it — the gap is the tell
  // that this is an object, not the photo
  const floor = -frameH / 2 - 0.34
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 34 }}
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true }}
      style={{ touchAction: 'pan-y' }}
    >
      <ambientLight intensity={1.5} color="#fff6e8" />
      <directionalLight position={[2.4, 3.2, 4]} intensity={2.2} color="#fff1d6" />
      <directionalLight position={[-3, 1.4, 2]} intensity={0.7} color="#e8eef6" />
      {/* the two speculars that make the gilt read as metal without an env map */}
      <pointLight position={[-1.6, 1.8, 2.2]} intensity={7} color="#fff3dd" />
      <pointLight position={[1.9, -1.2, 2.4]} intensity={4} color="#ffe9c4" />

      <Suspense fallback={null}>
        {/* Bounds frames the print to the canvas, whatever its aspect and
            whatever shape the column is — no per-orientation fit maths. */}
        <Bounds fit observe margin={1.1}>
          {/* Grab it and it turns freely sideways and stays where you leave it —
              no snap-back. Tilt is kept short: a print is turned, not tumbled.
              `damping` is a smoothing time, so small reads as light. */}
          <PresentationControls
            global={false}
            cursor
            speed={2.2}
            damping={0.1}
            rotation={[0.06, -0.34, 0]}
            polar={[-0.18, 0.18]}
            azimuth={[-Infinity, Infinity]}
          >
            {/* resting three-quarter angle above, and a slow drift here: the
                moulding's depth stays visible even before you touch it */}
            <Float
              speed={still ? 0 : 1.5}
              rotationIntensity={still ? 0 : 0.32}
              floatIntensity={still ? 0 : 0.5}
              floatingRange={[-0.045, 0.045]}
            >
              <Print artwork={artwork} style={style} />
            </Float>
          </PresentationControls>
        </Bounds>
      </Suspense>

      {/* the shadow underneath — real, not the painted-on plane the wall uses */}
      <ContactShadows
        position={[0, floor, 0]}
        opacity={0.3}
        scale={frameW * 3.4}
        blur={3.2}
        far={2.2}
        resolution={512}
        color="#1f1b15"
      />
    </Canvas>
  )
}

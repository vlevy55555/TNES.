import { Text, useCursor, useTexture } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { LinearFilter, LinearMipmapLinearFilter, SRGBColorSpace, Vector3, type Group } from 'three'
import gsap from 'gsap'
import { FONT_BRAND, type FrameStyle, type Artwork } from '../../data/artworks'
import { FrameLayers, frameOuterDimensions } from './FrameLayers'

// reused by the click handler — world transform reads need a target vector
const _worldPos = new Vector3()
const _worldScale = new Vector3()

import { useGalleryStore } from '../../store/useGalleryStore'
import { dragState } from './CameraController'
import { INTERACTIVE_CURSOR } from './interactiveCursor'

export function ArtworkFrame({
  artwork,
  position,
  zoomInPlace = false,
  frameStyle,
}: {
  artwork: Artwork
  // override the on-wall placement (used by the archive grid); defaults to the
  // artwork's own wall position
  position?: [number, number, number]
  /**
   * Zoom to where this frame actually hangs instead of to the work's place on
   * its wall. Set by the archive, which hangs the same work at several slots and
   * scales — the artwork id alone can't say which copy was clicked.
   */
  zoomInPlace?: boolean
  /** Lets a wall set one coherent curatorial frame finish without changing the work data. */
  frameStyle?: FrameStyle
}) {
  const texture = useTexture(artwork.image, (t) => {
    t.colorSpace = SRGBColorSpace
  })
  const maxAnisotropy = useThree((state) => state.gl.capabilities.getMaxAnisotropy())
  const isMobile = useGalleryStore((s) => s.isMobile)

  useEffect(() => {
    texture.anisotropy = Math.min(isMobile ? 4 : 8, maxAnisotropy)
    texture.minFilter = LinearMipmapLinearFilter
    texture.magFilter = LinearFilter
    texture.generateMipmaps = true
    texture.needsUpdate = true
  }, [isMobile, maxAnisotropy, texture])
  const selectArtwork = useGalleryStore((s) => s.selectArtwork)
  const selectedArtworkId = useGalleryStore((s) => s.selectedArtworkId)
  const selectedFrameStyle = useGalleryStore((s) => s.selectedFrameStyle)
  const previewScale = useGalleryStore((s) => s.previewScale)
  const printsIntroPhase = useGalleryStore((s) => s.printsIntroPhase)
  const selectArtworkFromPrintsIntro = useGalleryStore((s) => s.selectArtworkFromPrintsIntro)
  const group = useRef<Group>(null)
  const sizeGroup = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered, INTERACTIVE_CURSOR)

  const selected = selectedArtworkId === artwork.id

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

  // the chosen print size, made physical — on its own group so it can't fight
  // the hover tween above, which owns the outer group's scale
  useEffect(() => {
    if (!sizeGroup.current) return
    const to = selected ? previewScale : 1
    gsap.to(sizeGroup.current.scale, { x: to, y: to, z: 1, duration: 0.5, ease: 'power2.out' })
  }, [selected, previewScale])

  const [w, h] = artwork.size
  // Archive works keep their curated wall finish until they are inspected. The
  // selected work then becomes a live black/white framing preview.
  const resolvedFrameStyle = selected ? selectedFrameStyle : frameStyle ?? artwork.frameStyle
  const [frameW, frameH] = frameOuterDimensions(w, h, resolvedFrameStyle)

  return (
    <group
      ref={group}
      position={position ?? [artwork.position[0], artwork.position[1], 0.07]}
      onClick={(e) => {
        e.stopPropagation()
        // the inquiry letter overlays the gallery — don't react to clicks behind it
        if (useGalleryStore.getState().inquiryOpen || dragState.moved) return
        if (zoomInPlace && group.current) {
          group.current.getWorldPosition(_worldPos)
          // divide out this group's own hover scale (1 or 1.02) so the framing
          // doesn't shift by 2% depending on whether the pointer was over it
          const scale = group.current.getWorldScale(_worldScale).x / group.current.scale.x
          if (printsIntroPhase !== 'hidden') {
            selectArtworkFromPrintsIntro(artwork.id, {
              x: _worldPos.x,
              y: _worldPos.y,
              z: _worldPos.z,
              scale,
            })
            return
          }
          selectArtwork(artwork.id, {
            x: _worldPos.x,
            y: _worldPos.y,
            z: _worldPos.z,
            scale,
          })
          return
        }
        if (printsIntroPhase !== 'hidden') {
          selectArtworkFromPrintsIntro(artwork.id)
          return
        }
        selectArtwork(artwork.id)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        if (useGalleryStore.getState().inquiryOpen) return
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      <group ref={sizeGroup}>
        <FrameLayers texture={texture} w={w} h={h} style={resolvedFrameStyle} />
      </group>

      {/* label plaque under the frame */}
      {/* work title — larger for the Prints wall's full-grid camera framing */}
      <Text
        font={FONT_BRAND}
        fontSize={0.14}
        color="#2f2a24"
        anchorX="left"
        anchorY="top"
        position={[-frameW / 2, -frameH / 2 - 0.18, 0]}
      >
        {artwork.title}
      </Text>
      {/* Keep the subtitle in the title's face and contrast: in the Prints grid
          the former small, spaced sans text faded into the marble wall. */}
      <Text
        font={FONT_BRAND}
        fontSize={0.095}
        color="#2f2a24"
        anchorX="left"
        anchorY="top"
        position={[-frameW / 2, -frameH / 2 - 0.36, 0]}
      >
        {artwork.subtitle.toUpperCase()}
      </Text>
    </group>
  )
}

import { Text, useCursor, useTexture } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CanvasTexture, Path, Shape, SRGBColorSpace, Vector3, type Group, type Texture } from 'three'
import gsap from 'gsap'
import {
  artworks,
  FONT_BRAND,
  FONT_SANS,
  type FrameStyle,
  type Artwork,
} from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'
import { dragState } from './CameraController'
import { INTERACTIVE_CURSOR } from './interactiveCursor'

// ponytail: radial-gradient canvas as fake soft shadow — no shadow maps needed
function makeShadowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(64, 64, 24, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(31, 27, 21, 0.46)')
  gradient.addColorStop(0.52, 'rgba(31, 27, 21, 0.16)')
  gradient.addColorStop(1, 'rgba(40,30,15,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 128, 128)
  return new CanvasTexture(canvas)
}
const shadowTexture = makeShadowTexture()

artworks.forEach((a) => useTexture.preload(a.image))

// reused by the click handler — world transform reads need a target vector
const _worldPos = new Vector3()
const _worldScale = new Vector3()

type FrameSpec = {
  outerBorder: number
  mat: number
  imageScale: number
  frameColor: string
  matColor: string
  roughness: number
  metalness: number
  clearcoat: number
  emissive: string
  emissiveIntensity: number
  depth: number
  bevelSize: number
  bevelThickness: number
}

function frameSpec(style: FrameStyle): FrameSpec {
  if (style === 'white') {
    return {
      outerBorder: 0.22,
      mat: 0.035,
      imageScale: 1.2,
      frameColor: '#bdb8ae',
      matColor: '#f7f4ed',
      roughness: 0.58,
      metalness: 0,
      clearcoat: 0,
      emissive: '#000000',
      emissiveIntensity: 0,
      depth: 0.042,
      bevelSize: 0.004,
      bevelThickness: 0.004,
    }
  }
  if (style === 'black') {
    return {
      outerBorder: 0.21,
      mat: 0.016,
      imageScale: 1.15,
      frameColor: '#262522',
      matColor: '#171614',
      roughness: 0.52,
      metalness: 0.02,
      clearcoat: 0.02,
      emissive: '#000000',
      emissiveIntensity: 0,
      depth: 0.045,
      bevelSize: 0.003,
      bevelThickness: 0.003,
    }
  }
  return {
    outerBorder: 0.11,
    mat: 0.06,
    imageScale: 1,
    // A true polished gilt rather than muted brass: this is shared by the
    // signature hero and the archive's unified frame finish.
    frameColor: '#c89532',
    matColor: '#f4f0e7',
    roughness: 0.3,
    metalness: 0.42,
    clearcoat: 0.42,
    // Keeps gilt luminous in portions of the archive that sit outside a direct
    // spotlight, without flattening the polished highlights under it.
    emissive: '#b67a19',
    emissiveIntensity: 0.58,
    depth: 0.055,
    bevelSize: 0.005,
    bevelThickness: 0.005,
  }
}

export function frameOuterDimensions(w: number, h: number, style: FrameStyle) {
  const { outerBorder, mat, imageScale } = frameSpec(style)
  // Uniform moulding on all four sides. With imageScale > 1 the photo grows
  // proportionally to w/h while outerBorder is fixed, so the long axis used
  // to end up with a thinner band than the short one — standardize every
  // side on that thin value instead of letting each axis differ.
  const band = outerBorder - mat - (Math.max(w, h) * (imageScale - 1)) / 2
  const frameW = w * imageScale + 2 * (mat + band)
  const frameH = h * imageScale + 2 * (mat + band)
  return [frameW, frameH] as const
}

export function framePhotoDimensions(w: number, h: number, style: FrameStyle) {
  const scale = frameSpec(style).imageScale
  return [w * scale, h * scale] as const
}

function mouldingShape(outerW: number, outerH: number, innerW: number, innerH: number) {
  const shape = new Shape()
  shape.moveTo(-outerW / 2, -outerH / 2)
  shape.lineTo(outerW / 2, -outerH / 2)
  shape.lineTo(outerW / 2, outerH / 2)
  shape.lineTo(-outerW / 2, outerH / 2)
  shape.closePath()

  const opening = new Path()
  opening.moveTo(-innerW / 2, -innerH / 2)
  opening.lineTo(-innerW / 2, innerH / 2)
  opening.lineTo(innerW / 2, innerH / 2)
  opening.lineTo(innerW / 2, -innerH / 2)
  opening.closePath()
  shape.holes.push(opening)
  return shape
}

function Moulding({
  outerW,
  outerH,
  innerW,
  innerH,
  color,
  roughness,
  metalness,
  clearcoat,
  emissive,
  emissiveIntensity,
  depth = 0.12,
  z = 0,
  bevelSize = 0.01,
  bevelThickness = 0.01,
}: {
  outerW: number
  outerH: number
  innerW: number
  innerH: number
  color: string
  roughness: number
  metalness: number
  clearcoat: number
  emissive: string
  emissiveIntensity: number
  depth?: number
  z?: number
  bevelSize?: number
  bevelThickness?: number
}) {
  const shape = useMemo(
    () => mouldingShape(outerW, outerH, innerW, innerH),
    [outerW, outerH, innerW, innerH],
  )

  return (
    <mesh position={[0, 0, z]} castShadow receiveShadow>
      <extrudeGeometry args={[shape, { depth, bevelEnabled: true, bevelSize, bevelThickness, bevelSegments: 2 }]} />
      <meshPhysicalMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        clearcoat={clearcoat}
        clearcoatRoughness={0.18}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
      />
    </mesh>
  )
}

/** Shared physical construction for gold, white and black exhibition frames. */
export function FrameLayers({
  texture,
  w,
  h,
  style,
}: {
  texture: Texture
  w: number
  h: number
  style: FrameStyle
}) {
  const spec = frameSpec(style)
  const [frameW, frameH] = frameOuterDimensions(w, h, style)
  const [photoW, photoH] = framePhotoDimensions(w, h, style)
  const innerW = photoW + spec.mat * 2
  const innerH = photoH + spec.mat * 2
  const matZ = Math.max(0.018, spec.depth - 0.024)
  const photoZ = Math.max(0.028, spec.depth - 0.006)

  return (
    <>
      {/* The soft contact shadow keeps the frame grounded even before inspection. */}
      <mesh position={[0.07, -0.1, -0.022]}>
        <planeGeometry args={[frameW + 0.42, frameH + 0.42]} />
        <meshBasicMaterial map={shadowTexture} transparent depthWrite={false} />
      </mesh>

      <Moulding
        outerW={frameW}
        outerH={frameH}
        innerW={innerW}
        innerH={innerH}
        color={spec.frameColor}
        roughness={spec.roughness}
        metalness={spec.metalness}
        clearcoat={spec.clearcoat}
        emissive={spec.emissive}
        emissiveIntensity={spec.emissiveIntensity}
        depth={spec.depth}
        bevelSize={spec.bevelSize}
        bevelThickness={spec.bevelThickness}
      />

      <mesh position={[0, 0, matZ]} castShadow>
        <boxGeometry args={[innerW, innerH, 0.03]} />
        <meshStandardMaterial color={spec.matColor} roughness={0.8} />
      </mesh>

      <mesh position={[0, 0, photoZ]} castShadow>
        <planeGeometry args={[photoW, photoH]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </>
  )
}

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
  const selectArtwork = useGalleryStore((s) => s.selectArtwork)
  const selectedArtworkId = useGalleryStore((s) => s.selectedArtworkId)
  const selectedFrameStyle = useGalleryStore((s) => s.selectedFrameStyle)
  const group = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered, INTERACTIVE_CURSOR)

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
  // Archive works keep their curated wall finish until they are inspected. The
  // selected work then becomes a live black/white framing preview.
  const resolvedFrameStyle =
    selectedArtworkId === artwork.id ? selectedFrameStyle : frameStyle ?? artwork.frameStyle
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
          selectArtwork(artwork.id, {
            x: _worldPos.x,
            y: _worldPos.y,
            z: _worldPos.z,
            scale,
          })
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
      <FrameLayers texture={texture} w={w} h={h} style={resolvedFrameStyle} />

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
        color="#6b6151"
        anchorX="left"
        anchorY="top"
        position={[-frameW / 2, -frameH / 2 - 0.36, 0]}
      >
        {artwork.subtitle.toUpperCase()}
      </Text>
    </group>
  )
}

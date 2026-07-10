import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Vector3, type PerspectiveCamera } from 'three'
import gsap from 'gsap'
import {
  artworks,
  CAMERA_Z,
  FRAME_BORDER,
  HERO,
  HERO_ZOOM_Z,
  SIGNATURE_WALL,
  WALL_SPACING,
  walls,
} from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'
import { introScrub } from './introScrub'

// set while the pointer is dragging so frame/wall clicks can ignore the release
export const dragState = { moved: false }

const MAX_YAW = 0.22 // ~12.5° side peek
const MAX_PITCH = 0.15 // ~8.5° up/down peek
const DOLLY_RANGE: [number, number] = [-3.2, 4.5] // scroll dolly, world units
const MIN_DIST = 0.9 // never cross the wall plane

export function CameraController() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const gl = useThree((s) => s.gl)
  const size = useThree((s) => s.size)
  const currentWall = useGalleryStore((s) => s.currentWall)
  const selectedArtworkId = useGalleryStore((s) => s.selectedArtworkId)

  // true only for the one-time opening sequence: start framed inside the hero
  const introActive = useRef(useGalleryStore.getState().introPlaying)
  const cx0 = useGalleryStore.getState().currentWall * WALL_SPACING

  // GSAP drives base + look; useFrame composes orbit/pitch/dolly on top each frame
  const base = useRef(
    introActive.current
      ? new Vector3(cx0, HERO.position[1], HERO_ZOOM_Z)
      : new Vector3(cx0, 0, CAMERA_Z),
  )
  const look = useRef(
    introActive.current
      ? new Vector3(cx0, HERO.position[1], 0)
      : new Vector3(cx0, 0, 0),
  )
  const yaw = useRef(0)
  const yawTarget = useRef(0)
  const pitch = useRef(0)
  const pitchTarget = useRef(0)
  const dolly = useRef(0)
  const dollyTarget = useRef(0)
  const prevWall = useRef(useGalleryStore.getState().currentWall)

  // portrait screens: keep a 35° HORIZONTAL fov so the wall never overflows
  useEffect(() => {
    const aspect = size.width / size.height
    camera.fov =
      aspect < 1
        ? (2 * Math.atan(Math.tan((35 * Math.PI) / 360) / aspect) * 180) /
          Math.PI
        : 35
    camera.updateProjectionMatrix()
  }, [size, camera])

  // drag to angle the view around the wall (both axes) + wheel to dolly in/out
  useEffect(() => {
    const el = gl.domElement
    let startX = 0
    let startY = 0
    let down = false

    let lastY = 0
    const onDown = (e: PointerEvent) => {
      down = true
      startX = e.clientX
      startY = e.clientY
      lastY = e.clientY
      dragState.moved = false
      document.body.style.cursor = 'grabbing'
    }
    const onMove = (e: PointerEvent) => {
      if (!down) return
      // during the opening, a vertical drag scrubs it (touch + trackpad) instead
      // of orbiting the wall
      if (useGalleryStore.getState().introPlaying) {
        introScrub.target = Math.max(
          0,
          Math.min(1, introScrub.target + (lastY - e.clientY) * 0.004),
        )
        lastY = e.clientY
        dragState.moved = true
        return
      }
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      if (Math.abs(dx) + Math.abs(dy) > 6) dragState.moved = true
      // dragging pulls the wall: right -> wall swings right, down -> wall tips down
      yawTarget.current = Math.max(
        -MAX_YAW,
        Math.min(MAX_YAW, -(dx / window.innerWidth) * 0.9),
      )
      pitchTarget.current = Math.max(
        -MAX_PITCH,
        Math.min(MAX_PITCH, (dy / window.innerHeight) * 0.9),
      )
    }
    const onUp = () => {
      down = false
      yawTarget.current = 0 // spring back to the frontal, directed view
      pitchTarget.current = 0
      document.body.style.cursor = ''
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      // the opening is scrubbed by scroll: reveal on the way down, reverse on the
      // way up, until it locks fully open and the wheel returns to dolly
      if (useGalleryStore.getState().introPlaying) {
        introScrub.target = Math.max(
          0,
          Math.min(1, introScrub.target + e.deltaY * 0.0009),
        )
        return
      }
      dollyTarget.current = Math.max(
        DOLLY_RANGE[0],
        Math.min(DOLLY_RANGE[1], dollyTarget.current + e.deltaY * 0.0045),
      )
    }

    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      el.removeEventListener('wheel', onWheel)
    }
  }, [gl])

  useFrame((_, delta) => {
    // scroll-scrubbed opening: derive base/look from the scroll progress, easing
    // toward the wheel/drag target so discrete scroll steps read as a fluid move
    if (introActive.current) {
      const d = Math.min(1, delta * 8)
      introScrub.progress += (introScrub.target - introScrub.progress) * d
      const t = introScrub.progress
      const aspect = size.width / size.height
      const tanH = Math.tan((35 * Math.PI) / 360)
      const wallZ =
        aspect >= 1
          ? Math.min(Math.max(CAMERA_Z, 6.9 / (2 * tanH * aspect)), 9.2 / (2 * tanH * aspect))
          : CAMERA_Z
      const y = HERO.position[1] * (1 - t)
      base.current.set(cx0, y, HERO_ZOOM_Z + (wallZ - HERO_ZOOM_Z) * t)
      look.current.set(cx0, y, 0)
      // no auto-complete: the opening stays fully scrubbable both ways until the
      // visitor navigates off the signature wall (handled in the effect below)
    }

    const damp = Math.min(1, delta * 6)
    yaw.current += (yawTarget.current - yaw.current) * damp
    pitch.current += (pitchTarget.current - pitch.current) * damp
    dolly.current += (dollyTarget.current - dolly.current) * damp

    const b = base.current
    const l = look.current
    // offset from the look point: dolly along it, then pitch (X) and yaw (Y)
    const ox = b.x - l.x
    const oz = Math.max(MIN_DIST, b.z - l.z + dolly.current)
    const z1 = oz * Math.cos(pitch.current)
    const y1 = oz * Math.sin(pitch.current)
    const cos = Math.cos(yaw.current)
    const sin = Math.sin(yaw.current)
    camera.position.set(l.x + ox * cos + z1 * sin, b.y + y1, l.z - ox * sin + z1 * cos)
    camera.lookAt(l)
  })

  useEffect(() => {
    if (introActive.current) {
      // still on the signature wall: the scroll scrub owns the camera
      if (currentWall === SIGNATURE_WALL) {
        prevWall.current = currentWall
        return
      }
      // navigated away mid-opening: consume it (snap it fully open) and let the
      // normal wall-change tween take over from here
      introActive.current = false
      introScrub.progress = 1
      introScrub.target = 1
      useGalleryStore.getState().endIntro()
    }
    const artwork = artworks.find((a) => a.id === selectedArtworkId)
    const aspect = size.width / size.height
    // must match the CSS bottom-sheet breakpoint: narrow OR portrait
    const mobile = size.width <= 700 || aspect < 1
    // landscape: stand far enough to fit the frames (±3.45), close enough
    // to never expose the wall edges (9.2 of 9.4 units)
    const tanH = Math.tan((35 * Math.PI) / 360)
    const wallZ =
      aspect >= 1
        ? Math.min(
            Math.max(CAMERA_Z, 6.9 / (2 * tanH * aspect)),
            9.2 / (2 * tanH * aspect),
          )
        : CAMERA_Z
    const wallChanged = prevWall.current !== currentWall
    prevWall.current = currentWall

    gsap.killTweensOf(base.current)
    gsap.killTweensOf(look.current)
    dollyTarget.current = 0 // each scene starts freshly framed

    if (artwork) {
      // fit the frame to the strip NOT covered by the panel (side panel on
      // desktop, none horizontally on mobile) and center the artwork in it
      const frameW = artwork.size[0] + FRAME_BORDER * 2
      const frameH = artwork.size[1] + FRAME_BORDER * 2
      const fovRad = (camera.fov * Math.PI) / 180
      const tanH = Math.tan(fovRad / 2)
      const panelPx = mobile ? 0 : Math.min(400, size.width * 0.92)
      const stripAspect = (size.width - panelPx) / size.height
      const fitH = frameH / 2 / tanH
      const fitW = frameW / 2 / (tanH * stripAspect)
      const z = Math.max(fitH, fitW) * 1.28 + 0.15
      const shift = (panelPx / 2) * ((2 * z * tanH) / size.height)

      // artwork's world position on its (rotated) wall + panel shift along
      // the wall tangent; camera sits along the wall normal through it
      const aw = walls[artwork.wallIndex]
      const sinA = Math.sin(aw.angle)
      const cosA = Math.cos(aw.angle)
      const ax = artwork.position[0]
      const lx =
        artwork.wallIndex * WALL_SPACING + ax * cosA + 0.07 * sinA + cosA * shift
      const lz = -ax * sinA + 0.07 * cosA - sinA * shift
      const ly = artwork.position[1] - (mobile ? 0.7 : 0)

      // the look point arrives before the camera: the approach banks into
      // the artwork instead of flying in flat
      gsap.to(look.current, { x: lx, y: ly, z: lz, duration: 0.8, ease: 'power2.inOut' })
      gsap.to(base.current, {
        x: lx + sinA * z,
        y: ly,
        z: lz + cosA * z,
        duration: 1.25,
        ease: 'power3.inOut',
      })
      return
    }

    const wall = walls[currentWall]
    const sinW = Math.sin(wall.angle)
    const cosW = Math.cos(wall.angle)
    const cx = currentWall * WALL_SPACING

    if (!wallChanged) {
      // closing a zoom (or first mount): pull back along the wall's normal,
      // the look point leading again for a touch of sway
      gsap.to(look.current, { x: cx, y: 0, z: 0, duration: 0.85, ease: 'power2.inOut' })
      gsap.to(base.current, {
        x: cx + sinW * wallZ,
        y: 0,
        z: cosW * wallZ,
        duration: 1.25,
        ease: 'power3.inOut',
      })
      return
    }

    // wall change: the camera physically rides through the room — dolly OUT,
    // travel sideways, dolly back IN. The look point LEADS the camera, so the
    // view banks into the direction of travel instead of staying at 90°.
    const tl = gsap.timeline()
    tl.to(base.current, { z: wallZ + 4.2, y: 0, duration: 0.62, ease: 'power2.out' }, 0)
      .to(look.current, { x: cx, y: 0, z: 0, duration: 1.05, ease: 'power2.inOut' }, 0.14)
      .to(base.current, { x: cx + sinW * wallZ, duration: 1.42, ease: 'power2.inOut' }, 0.14)
      .to(base.current, { z: cosW * wallZ, duration: 0.68, ease: 'power2.inOut' }, 1.1)
  }, [currentWall, selectedArtworkId, camera, size])

  return null
}

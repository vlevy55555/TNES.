import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Vector3, type PerspectiveCamera } from 'three'
import gsap from 'gsap'
import {
  ABOUT_WALL,
  ARCHIVE_WALL,
  artworks,
  CAMERA_Z,
  COMING_SOON_WALL,
  FRAME_BORDER,
  MANIFESTO_ROOM_X,
  SIGNATURE_WALL,
  WALL_VIEW_HEIGHT,
  WALL_SPACING,
  WALL_WIDTH,
  walls,
} from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'

// set while the pointer is dragging so frame/wall clicks can ignore the release
export const dragState = { moved: false }

const MAX_YAW = 0.22 // ~12.5° side peek
const MAX_PITCH = 0.15 // ~8.5° up/down peek
const DOLLY_RANGE: [number, number] = [-3.2, 4.5] // scroll dolly, world units
const MIN_DIST = 0.9 // never cross the wall plane

// Inspecting a work: ONE duration and ONE ease for both the look point and the
// camera body. Tweening them over different times (0.8 vs 1.25) is what made
// the approach swing — the aim arrived while the body was still travelling, so
// the frame slid sideways before settling. Moving together reads as a direct
// push in. ZOOM_FIT is how much room is left around the frame: higher = further
// back, so the print doesn't fill the screen edge to edge.
const ZOOM_MS = 0.95
const ZOOM_EASE = 'power2.inOut'
const ZOOM_FIT = 1.75
const ZOOM_PAD = 0.4

// Moving between scenes (wall to wall, in and out of the Manifesto room): the
// same single glide everywhere — aim and body on one duration and one ease, no
// dolly-out-travel-in detour.
const WALL_MS = 1.1

// resting camera distance for the viewport: the given field (both edges) fills
// 90% of the frame on whichever axis is tighter, at every aspect ratio —
// desktop, tablet, or phone, portrait or landscape
const WALL_FILL = 0.9
function restingZ(
  size: { width: number; height: number },
  fieldW = WALL_WIDTH,
  fieldH = WALL_VIEW_HEIGHT,
) {
  const aspect = size.width / size.height
  const tanH = Math.tan((35 * Math.PI) / 360)
  const fitH = fieldH / 2 / tanH
  const fitW = fieldW / 2 / (tanH * aspect)
  return Math.max(fitH, fitW) / WALL_FILL
}

// The Home wall carries small type — the console copy and the work's wall text —
// so it is framed tighter than the full 9.4 slab. Its composition spans roughly
// 7.7 wide (pedestal to the end of the wall text) by 4.2 tall (floor to the
// statement), which is what these fields hold.
const HOME_FIELD: [number, number] = [8.2, 4.4]
// on a portrait phone even that shrinks past legibility: frame the print +
// console pair instead, and aim between them
const HOME_MOBILE_FIELD: [number, number] = [4.4, 3.9]
const HOME_MOBILE_Y = -0.35

// the Countdown stacks its four units two-up on a phone; frame that block plus
// the title above it and the email capture below
const COUNTDOWN_MOBILE_FIELD: [number, number] = [3.4, 3.9]
const COUNTDOWN_MOBILE_Y = -0.1

// Prints is one five-work composition on a single wall.
const PRINTS_FIELD: [number, number] = [9.8, 5.7]
// A portrait viewport is framed by its WIDTH, so the desktop field would put
// the camera ~36 units back — the whole room, works the size of stamps. Mobile
// hangs six at a time in two columns instead, and this frames that block.
const PRINTS_MOBILE_FIELD: [number, number] = [2.35, 4.75]
const PRINTS_MOBILE_Y = 0.18

// About, on a phone: same problem, and here the fix is to CROP. The doorway
// (wall-local x ≈ 2.0–3.9) falls outside this field on purpose — the portrait,
// the type column and Enter VSL are what have to survive, and shifting the aim
// left is what buys them a frame worth reading.
// Give the About portrait and its type column more breathing room on a phone.
const ABOUT_MOBILE_FIELD: [number, number] = [5.8, 5.8]
const ABOUT_MOBILE_X = -1.2

// How far an inspected print rides UP the screen to clear the mobile sheet.
// Was 0.7, sized for a sheet that took 62% of the viewport; the sheet now opens
// collapsed at roughly a fifth of that, so the work sits nearer the middle and
// stays worth looking at while the shop is shut.
const MOBILE_SHEET_LIFT = 0.28

export function CameraController() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const gl = useThree((s) => s.gl)
  const size = useThree((s) => s.size)
  const currentWall = useGalleryStore((s) => s.currentWall)
  const selectedArtworkId = useGalleryStore((s) => s.selectedArtworkId)
  const isMobile = useGalleryStore((s) => s.isMobile)
  const zoomAt = useGalleryStore((s) => s.zoomAt)
  const manifestoRoomOpen = useGalleryStore((s) => s.manifestoRoomOpen)

  const startWall = useGalleryStore.getState().currentWall
  const startAngle = walls[startWall].angle

  // GSAP drives base + look; useFrame composes orbit/pitch/dolly on top each frame
  const base = useRef(
    new Vector3(
      startWall * WALL_SPACING + Math.sin(startAngle) * CAMERA_Z,
      0,
      Math.cos(startAngle) * CAMERA_Z,
    ),
  )
  const look = useRef(new Vector3(startWall * WALL_SPACING, 0, 0))
  const yaw = useRef(0)
  const yawTarget = useRef(0)
  const pitch = useRef(0)
  const pitchTarget = useRef(0)
  const dolly = useRef(0)
  const dollyTarget = useRef(0)

  // drag to angle the view around the wall (both axes) + wheel to dolly in/out —
  // except on the signature wall, where both scrub the signature zoom
  useEffect(() => {
    const el = gl.domElement
    let startX = 0
    let startY = 0
    let down = false
    let lastY = 0

    const onDown = (e: PointerEvent) => {
      // the inquiry letter owns the screen — freeze gallery orbit/dolly under it
      if (useGalleryStore.getState().inquiryOpen) return
      down = true
      startX = e.clientX
      startY = e.clientY
      lastY = e.clientY
      dragState.moved = false
      document.body.style.cursor = 'grabbing'
    }
    const onMove = (e: PointerEvent) => {
      if (!down) return
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      if (Math.abs(dx) + Math.abs(dy) > 6) dragState.moved = true
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
      yawTarget.current = 0
      pitchTarget.current = 0
      document.body.style.cursor = ''
    }
    const onWheel = (e: WheelEvent) => {
      if (useGalleryStore.getState().inquiryOpen) return
      e.preventDefault()
      if (useGalleryStore.getState().manifestoRoomOpen) return
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

  useFrame((state, delta) => {
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
    // Once inside the manifesto room, the camera breathes almost imperceptibly
    // with the light — enough to keep the material reflections alive.
    const roomDrift = manifestoRoomOpen ? Math.sin(state.clock.elapsedTime * 0.12) * 0.035 : 0
    camera.position.set(l.x + ox * cos + z1 * sin + roomDrift, b.y + y1, l.z - ox * sin + z1 * cos)
    camera.lookAt(l.x + roomDrift * 0.3, l.y, l.z)
  })

  useEffect(() => {
    const artwork = artworks.find((a) => a.id === selectedArtworkId)
    const aspect = size.width / size.height
    // must match the CSS bottom-sheet breakpoint: narrow OR portrait
    const mobile = size.width <= 700 || aspect < 1
    // Each wall's own field, and a phone gets a different one wherever its
    // layout differs — null falls back to the bare wall.
    const field =
      currentWall === SIGNATURE_WALL
        ? mobile
          ? HOME_MOBILE_FIELD
          : HOME_FIELD
        : currentWall === ARCHIVE_WALL
          ? mobile
            ? PRINTS_MOBILE_FIELD
            : PRINTS_FIELD
          : currentWall === COMING_SOON_WALL
            ? mobile
              ? COUNTDOWN_MOBILE_FIELD
              : null
            : currentWall === ABOUT_WALL && mobile
              ? ABOUT_MOBILE_FIELD
              : null
    const wallZ = field ? restingZ(size, ...field) : restingZ(size)

    gsap.killTweensOf(base.current)
    gsap.killTweensOf(look.current)
    dollyTarget.current = 0 // each scene starts freshly framed

    if (manifestoRoomOpen) {
      gsap.to(look.current, {
        x: MANIFESTO_ROOM_X,
        y: 0.05,
        z: 0,
        duration: WALL_MS,
        ease: ZOOM_EASE,
      })
      gsap.to(base.current, {
        x: MANIFESTO_ROOM_X,
        y: 0.05,
        z: wallZ,
        duration: WALL_MS,
        ease: ZOOM_EASE,
      })
      return
    }

    // a frame clicked in the archive zooms WHERE IT HANGS. It reported its own
    // world transform, so we frame that point instead of the work's on-wall
    // placement — the Archive has multiple copies of each work at distinct slots.
    if (artwork && zoomAt) {
      const frameW = (artwork.size[0] + FRAME_BORDER * 2) * zoomAt.scale
      const frameH = (artwork.size[1] + FRAME_BORDER * 2) * zoomAt.scale
      const tanH = Math.tan((camera.fov * Math.PI) / 360)
      const panelPx = mobile ? 0 : Math.min(400, size.width * 0.92)
      const stripAspect = (size.width - panelPx) / size.height
      const z =
        Math.max(frameH / 2 / tanH, frameW / 2 / (tanH * stripAspect)) * ZOOM_FIT + ZOOM_PAD
      const shift = (panelPx / 2) * ((2 * z * tanH) / size.height)
      const lx = zoomAt.x + shift
      const ly = zoomAt.y - (mobile ? MOBILE_SHEET_LIFT : 0)

      gsap.to(look.current, { x: lx, y: ly, z: zoomAt.z, duration: ZOOM_MS, ease: ZOOM_EASE })
      gsap.to(base.current, {
        x: lx,
        y: ly,
        z: zoomAt.z + z,
        duration: ZOOM_MS,
        ease: ZOOM_EASE,
      })
      return
    }

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
      const z = Math.max(fitH, fitW) * ZOOM_FIT + ZOOM_PAD
      const shift = (panelPx / 2) * ((2 * z * tanH) / size.height)

      const aw = walls[artwork.wallIndex]
      const sinA = Math.sin(aw.angle)
      const cosA = Math.cos(aw.angle)
      const ax = artwork.position[0]
      const lx =
        artwork.wallIndex * WALL_SPACING + ax * cosA + 0.07 * sinA + cosA * shift
      const lz = -ax * sinA + 0.07 * cosA - sinA * shift
      const ly = artwork.position[1] - (mobile ? MOBILE_SHEET_LIFT : 0)

      gsap.to(look.current, { x: lx, y: ly, z: lz, duration: ZOOM_MS, ease: ZOOM_EASE })
      gsap.to(base.current, {
        x: lx + sinA * z,
        y: ly,
        z: lz + cosA * z,
        duration: ZOOM_MS,
        ease: ZOOM_EASE,
      })
      return
    }

    const wall = walls[currentWall]
    const sinW = Math.sin(wall.angle)
    const cosW = Math.cos(wall.angle)
    const cx = currentWall * WALL_SPACING
    // mobile Home: aim between the print and the console, its two live parts.
    // mobile Countdown: aim at the middle of title / units / email capture.
    // mobile Prints: aim at the middle of the header + six works.
    const restY = !mobile
      ? 0
      : currentWall === COMING_SOON_WALL
        ? COUNTDOWN_MOBILE_Y
        : currentWall === SIGNATURE_WALL
          ? HOME_MOBILE_Y
          : currentWall === ARCHIVE_WALL
            ? PRINTS_MOBILE_Y
            : 0
    // ...and mobile About aims LEFT of centre, off the doorway and onto the
    // portrait + type column. Wall-local, so it follows the wall's own angle.
    const restX = mobile && currentWall === ABOUT_WALL ? ABOUT_MOBILE_X : 0
    const lx = cx + restX * cosW
    const lz = -restX * sinW

    // Every arrival at a wall — wall change, closing a zoom, first mount, or
    // stepping out of the Manifesto room — is the same single move: aim and body
    // travel together, no dolly-out. Same tempo as the Manifesto glide.
    gsap.to(look.current, { x: lx, y: restY, z: lz, duration: WALL_MS, ease: ZOOM_EASE })
    gsap.to(base.current, {
      x: lx + sinW * wallZ,
      y: restY,
      z: lz + cosW * wallZ,
      duration: WALL_MS,
      ease: ZOOM_EASE,
    })
  }, [currentWall, selectedArtworkId, zoomAt, isMobile, manifestoRoomOpen, camera, size])

  return null
}

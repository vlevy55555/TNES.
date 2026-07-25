import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Vector3, type PerspectiveCamera } from 'three'
import gsap from 'gsap'
import {
  artworks,
  CAMERA_Z,
  COMING_SOON_WALL,
  FRAME_BORDER,
  MANIFESTO_ROOM_X,
  SIGNATURE_WALL,
  SIGNATURE_ZOOM,
  WALL_VIEW_HEIGHT,
  WALL_SPACING,
  WALL_WIDTH,
  walls,
} from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'
import { archiveScrub, SCRUB_FORMED, SCRUB_SHRUNK } from './archiveScrub'

// set while the pointer is dragging so frame/wall clicks can ignore the release
export const dragState = { moved: false }

const MAX_YAW = 0.22 // ~12.5° side peek
const MAX_PITCH = 0.15 // ~8.5° up/down peek
const DOLLY_RANGE: [number, number] = [-3.2, 4.5] // scroll dolly, world units
const MIN_DIST = 0.9 // never cross the wall plane
const SIG_X = SIGNATURE_WALL * WALL_SPACING
// the intro zoom target: the central signed print
const CENTRAL_Y = SIGNATURE_ZOOM[1]
const ZOOM_Z = SIGNATURE_ZOOM[2]
// Reused each frame so the signature-intro framing does not allocate vectors.
const _archBase = new Vector3()
const _archLook = new Vector3()

// the opening-wall scroll framing at scrub progress p (base target [x,y,z]; the
// look point is the same x,y at z 0). It reveals the signature, then rests.
function scrubFraming(p: number, wallZ: number): [number, number, number] {
  if (p <= SCRUB_FORMED) {
    const f = p / SCRUB_FORMED
    return [SIG_X, CENTRAL_Y * (1 - f), ZOOM_Z + (wallZ - ZOOM_Z) * f]
  }
  return [SIG_X, 0, wallZ]
}

// resting camera distance for the viewport: the wall (both edges) fills 90% of
// the frame on whichever axis is tighter, at every aspect ratio — desktop,
// tablet, or phone, portrait or landscape — so every frame on it stays in view
const WALL_FILL = 0.9
function restingZ(size: { width: number; height: number }) {
  const aspect = size.width / size.height
  const tanH = Math.tan((35 * Math.PI) / 360)
  const fitH = WALL_VIEW_HEIGHT / 2 / tanH
  const fitW = WALL_WIDTH / 2 / (tanH * aspect)
  return Math.max(fitH, fitW) / WALL_FILL
}

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
  // the opening wall loads zoomed into its central signed print (the intro)
  const startZoomedIn = startWall === SIGNATURE_WALL

  // GSAP drives base + look; useFrame composes orbit/pitch/dolly on top each frame
  const base = useRef(
    startZoomedIn
      ? new Vector3(SIGNATURE_ZOOM[0], SIGNATURE_ZOOM[1], SIGNATURE_ZOOM[2])
      : new Vector3(
          startWall * WALL_SPACING + Math.sin(startAngle) * CAMERA_Z,
          0,
          Math.cos(startAngle) * CAMERA_Z,
        ),
  )
  const look = useRef(
    startZoomedIn
      ? new Vector3(SIGNATURE_ZOOM[0], SIGNATURE_ZOOM[1], 0)
      : new Vector3(startWall * WALL_SPACING, 0, 0),
  )
  // on the opening wall the scroll scrub owns the camera only once it has settled
  // there, so an arriving wall-change transition isn't snapped over
  const scrubReady = useRef(startWall === SIGNATURE_WALL)
  const yaw = useRef(0)
  const yawTarget = useRef(0)
  const pitch = useRef(0)
  const pitchTarget = useRef(0)
  const dolly = useRef(0)
  const dollyTarget = useRef(0)
  const prevWall = useRef(useGalleryStore.getState().currentWall)
  const prevSelected = useRef<string | null>(useGalleryStore.getState().selectedArtworkId)
  const prevManifestoRoom = useRef(useGalleryStore.getState().manifestoRoomOpen)

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
      // opening wall: scroll drives the signature intro, without changing sections
      if (useGalleryStore.getState().currentWall === SIGNATURE_WALL) {
        archiveScrub.target = Math.max(
          0,
          Math.min(SCRUB_SHRUNK, archiveScrub.target + e.deltaY * 0.0009),
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

  useFrame((state, delta) => {
    // opening wall (settled): the scroll scrub owns base/look in two phases —
    //   [0, SCRUB_FORMED] zoom out of the central print (the signature writes on)
    //   [SCRUB_FORMED, SCRUB_SHRUNK] hold at the wall rest (the signature shrinks away)
    if (!manifestoRoomOpen && currentWall === SIGNATURE_WALL && scrubReady.current) {
      const d = Math.min(1, delta * 8)
      archiveScrub.progress += (archiveScrub.target - archiveScrub.progress) * d
      const p = archiveScrub.progress
      const [tx, ty, tz] = scrubFraming(p, restingZ(size))
      base.current.lerp(_archBase.set(tx, ty, tz), d)
      look.current.lerp(_archLook.set(tx, ty, 0), d)

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
    // Once inside the manifesto room, the camera breathes almost imperceptibly
    // with the light — enough to keep the material reflections alive.
    const roomDrift = manifestoRoomOpen ? Math.sin(state.clock.elapsedTime * 0.12) * 0.035 : 0
    camera.position.set(l.x + ox * cos + z1 * sin + roomDrift, b.y + y1, l.z - ox * sin + z1 * cos)
    camera.lookAt(l.x + roomDrift * 0.3, l.y, l.z)
  })

  useEffect(() => {
    const wallChanged = prevWall.current !== currentWall
    prevWall.current = currentWall
    const leftManifestoRoom = prevManifestoRoom.current && !manifestoRoomOpen
    prevManifestoRoom.current = manifestoRoomOpen
    // closing an Archive-frame zoom: selectedArtworkId went from set -> null
    const closingZoom = prevSelected.current !== null && selectedArtworkId === null
    prevSelected.current = selectedArtworkId
    // arriving at the opening wall from elsewhere lands at the formed state
    // (zoomed out, signature shown) — the zoom-in intro only plays on first load
    if (wallChanged && currentWall === SIGNATURE_WALL) {
      archiveScrub.progress = SCRUB_FORMED
      archiveScrub.target = SCRUB_FORMED
    }

    const artwork = artworks.find((a) => a.id === selectedArtworkId)
    const aspect = size.width / size.height
    // must match the CSS bottom-sheet breakpoint: narrow OR portrait
    const mobile = size.width <= 700 || aspect < 1
    const wallZ = restingZ(size)

    gsap.killTweensOf(base.current)
    gsap.killTweensOf(look.current)
    dollyTarget.current = 0 // each scene starts freshly framed

    if (manifestoRoomOpen) {
      scrubReady.current = false
      gsap.to(look.current, {
        x: MANIFESTO_ROOM_X,
        y: 0.05,
        z: 0,
        duration: 1.1,
        ease: 'power2.inOut',
      })
      gsap.to(base.current, {
        x: MANIFESTO_ROOM_X,
        y: 0.05,
        z: wallZ,
        duration: 1.5,
        ease: 'power3.inOut',
      })
      return
    }

    // a frame clicked in the archive zooms WHERE IT HANGS. It reported its own
    // world transform, so we frame that point instead of the work's on-wall
    // placement — the Archive has multiple copies of each work at distinct slots.
    if (artwork && zoomAt) {
      scrubReady.current = false
      const frameW = (artwork.size[0] + FRAME_BORDER * 2) * zoomAt.scale
      const frameH = (artwork.size[1] + FRAME_BORDER * 2) * zoomAt.scale
      const tanH = Math.tan((camera.fov * Math.PI) / 360)
      const panelPx = mobile ? 0 : Math.min(400, size.width * 0.92)
      const stripAspect = (size.width - panelPx) / size.height
      const z = Math.max(frameH / 2 / tanH, frameW / 2 / (tanH * stripAspect)) * 1.4 + 0.25
      const shift = (panelPx / 2) * ((2 * z * tanH) / size.height)
      const lx = zoomAt.x + shift
      const ly = zoomAt.y - (mobile ? 0.7 : 0)

      gsap.to(look.current, { x: lx, y: ly, z: zoomAt.z, duration: 0.8, ease: 'power2.inOut' })
      gsap.to(base.current, {
        x: lx,
        y: ly,
        z: zoomAt.z + z,
        duration: 1.25,
        ease: 'power3.inOut',
      })
      return
    }

    if (artwork) {
      scrubReady.current = false
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
      const z = Math.max(fitH, fitW) * 1.4 + 0.25
      const shift = (panelPx / 2) * ((2 * z * tanH) / size.height)

      const aw = walls[artwork.wallIndex]
      const sinA = Math.sin(aw.angle)
      const cosA = Math.cos(aw.angle)
      const ax = artwork.position[0]
      const lx =
        artwork.wallIndex * WALL_SPACING + ax * cosA + 0.07 * sinA + cosA * shift
      const lz = -ax * sinA + 0.07 * cosA - sinA * shift
      const ly = artwork.position[1] - (mobile ? 0.7 : 0)

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
    // mobile Coming Soon: drop the aim between the countdown card and the "Notify
    // me" button so both centre in the portrait viewport (the side signage the
    // ComingSoonWall drops on mobile already falls outside this framing)
    const restY = isMobile && currentWall === COMING_SOON_WALL ? -0.42 : 0

    // signature wall: hand the camera to the scroll scrub. On a fresh mount it's
    // ready immediately; on a wall change let the room-travel transition play
    // first, then enable the scrub at the formed (resting) view.
    if (currentWall === SIGNATURE_WALL) {
      if (leftManifestoRoom) {
        scrubReady.current = false
        archiveScrub.progress = SCRUB_FORMED
        archiveScrub.target = SCRUB_FORMED
        const [tx, ty, tz] = scrubFraming(SCRUB_FORMED, wallZ)
        gsap
          .timeline({ onComplete: () => (scrubReady.current = true) })
          .to(look.current, { x: tx, y: ty, z: 0, duration: 0.95, ease: 'power2.inOut' }, 0)
          .to(base.current, { x: tx, y: ty, z: tz, duration: 1.35, ease: 'power3.inOut' }, 0)
        return
      }
      if (!wallChanged) {
        // returning from a zoom: ease back to the scrub framing
        // the same way the other frames do, then hand control to the scroll scrub
        if (closingZoom) {
          scrubReady.current = false
          const [tx, ty, tz] = scrubFraming(archiveScrub.progress, wallZ)
          gsap
            .timeline({ onComplete: () => (scrubReady.current = true) })
            .to(look.current, { x: tx, y: ty, z: 0, duration: 0.85, ease: 'power2.inOut' }, 0)
            .to(base.current, { x: tx, y: ty, z: tz, duration: 1.25, ease: 'power3.inOut' }, 0)
        } else {
          scrubReady.current = true
        }
        return
      }
      scrubReady.current = false
      const tl = gsap.timeline({ onComplete: () => (scrubReady.current = true) })
      tl.to(base.current, { z: wallZ + 4.2, y: 0, duration: 0.62, ease: 'power2.out' }, 0)
        .to(look.current, { x: cx, y: 0, z: 0, duration: 1.05, ease: 'power2.inOut' }, 0.14)
        .to(base.current, { x: cx + sinW * wallZ, duration: 1.42, ease: 'power2.inOut' }, 0.14)
        .to(base.current, { z: cosW * wallZ, duration: 0.68, ease: 'power2.inOut' }, 1.1)
      return
    }

    scrubReady.current = false
    if (!wallChanged) {
      // closing a zoom (or first mount): pull back along the wall's normal
      gsap.to(look.current, { x: cx, y: restY, z: 0, duration: 0.85, ease: 'power2.inOut' })
      gsap.to(base.current, {
        x: cx + sinW * wallZ,
        y: restY,
        z: cosW * wallZ,
        duration: 1.25,
        ease: 'power3.inOut',
      })
      return
    }

    // wall change: the camera physically rides through the room — dolly OUT,
    // travel sideways, dolly back IN, the look point leading the direction of travel
    const tl = gsap.timeline()
    tl.to(base.current, { z: wallZ + 4.2, y: restY, duration: 0.62, ease: 'power2.out' }, 0)
      .to(look.current, { x: cx, y: restY, z: 0, duration: 1.05, ease: 'power2.inOut' }, 0.14)
      .to(base.current, { x: cx + sinW * wallZ, duration: 1.42, ease: 'power2.inOut' }, 0.14)
      .to(base.current, { z: cosW * wallZ, duration: 0.68, ease: 'power2.inOut' }, 1.1)
  }, [currentWall, selectedArtworkId, zoomAt, isMobile, manifestoRoomOpen, camera, size])

  return null
}

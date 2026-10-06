// AR lab: three ways to hang the print on a wall that vertical-plane detection cannot see.
// Plain walls give ARCore too few feature points to grow a vertical plane, which is why
// model-viewer and Scene Viewer never fix the print there. The apps that do work on plain
// walls start from the floor, and that is what methods 1 and 2 do; method 3 reads the wall
// itself, from a detected plane where there is one and from the depth map where there is not.
//
// The placement logic below runs on plain numbers (see geometry.js) and is fed by a `source`:
// the WebXR session on a phone, or a simulated room (?sim=1) that lets the same logic and the
// same drawing be exercised on a desktop, where no AR session exists.
import * as THREE from 'three'
import * as G from './geometry.js'
import { frameMeshes } from './models.js'

const REACH = 6 // metres: farthest the floor marker or the print may be from the phone
const FEET = 0.5 // a floor point closer than this, measured along the floor, is the user's own feet
const SAME_FLOOR = 0.15 // floor hits within this height of each other are the same floor
const NUDGE = 0.02 // one press of closer/farther
const WALL_CALM = 0.2 // how fast method 3 follows a new wall reading; lower is steadier

export const METHODS = {
  1: {
    key: 'seam',
    name: 'One tap at the foot of the wall',
    how: 'Stand facing the wall, about three steps back. Aim at the floor, put the line where the floor meets the wall, and tap. The wall is taken to face you.',
  },
  2: {
    key: 'corners',
    name: 'Two taps along the foot of the wall',
    how: 'Aim at the floor and tap twice where it meets the wall, once towards each end. The wall runs through both points, so it does not matter where you stand.',
  },
  3: {
    key: 'auto',
    name: 'Automatic, from the wall itself',
    how: 'Aim at the wall. The phone reads it from a detected surface or from its depth map, with no taps on the floor. Needs a phone that gives depth to the browser.',
  },
}

/** The placement logic. Feed it one `input` per frame and call `tap()` on a screen tap. */
export function createPlacement(method) {
  const s = { method: method.key, phase: 'floor', floorY: null, marker: null, pin: null, candidate: null, wall: null, centre: null, placed: false, depth: 'unknown', hint: '', debug: '' }
  if (s.method === 'auto') s.phase = 'wall'

  function readFloor(hits) {
    for (const hit of hits) {
      if (G.surfaceKind(G.axis(hit, 1)) !== 'floor') continue
      const y = hit[13]
      // A table top is horizontal too. The floor is the lowest level seen; readings near it refine it.
      if (s.floorY === null || y < s.floorY - SAME_FLOOR) s.floorY = y
      else if (Math.abs(y - s.floorY) <= SAME_FLOOR) s.floorY += (y - s.floorY) * 0.2
    }
  }

  function step(input) {
    if (!input.cam) {
      s.hint = 'Finding the room. Move the phone slowly.'
      return s
    }
    const eye = G.position(input.cam)
    const look = G.forward(input.cam)
    readFloor(input.hits)

    // Where the phone aims on the floor, on the infinite plane at floor height: the detected
    // floor polygon rarely reaches the wall, and the foot of the wall is exactly where we aim.
    s.marker = null
    if (s.floorY !== null) {
      const aim = G.rayPlane(eye, look, [0, s.floorY, 0], [0, 1, 0], REACH)
      if (aim && Math.hypot(aim[0] - eye[0], aim[2] - eye[2]) >= FEET) s.marker = aim
    }

    if (s.phase === 'floor') {
      if (s.floorY !== null) s.phase = 'seam'
      else s.hint = 'Aim at the floor and move the phone slowly in a circle.'
    }
    if (s.phase === 'seam') {
      s.candidate = null
      if (s.method === 'seam') {
        // Artsy's and ArtPlacer's method: the wall stands at the marker and faces the user.
        if (s.marker) s.candidate = G.wall(s.marker, G.sub(eye, s.marker), eye)
        s.hint = 'Put the line where the floor meets the wall, standing square to it. Tap to set.'
      } else if (!s.pin) {
        s.hint = 'Put the dot where the floor meets the wall, towards one end. Tap.'
      } else {
        if (s.marker) s.candidate = G.wallFromSeam(s.pin, s.marker, eye)
        s.hint = s.marker && !s.candidate ? 'Move the dot farther along the wall.' : 'Now the other end, along the same wall. Tap.'
      }
      if (!s.marker) s.hint = 'Aim lower, at the floor near the wall.'
    }
    if (s.phase === 'wall') readWall(input, eye)
    if (s.phase === 'hang' || s.phase === 'wall') {
      const wall = s.wall ?? s.candidate
      const aim = wall && !s.placed ? G.rayPlane(eye, look, wall.point, wall.normal, REACH) : null
      if (aim) s.centre = aim
      if (s.phase === 'hang') s.hint = s.placed ? 'Placed at true size. Walk up to it. Tap to move it.' : 'Aim where the print should hang. Tap to place.'
    }
    const metres = (v) => (v === null || v === undefined ? '–' : v.toFixed(2))
    s.debug = `${s.method} · ${s.phase} · floor ${metres(s.floorY === null ? null : eye[1] - s.floorY)} m below · hits ${input.hits.length} · depth ${s.depth}${s.wall || s.candidate ? ` · wall ${metres(G.dot(G.sub(eye, (s.wall ?? s.candidate).point), (s.wall ?? s.candidate).normal))} m` : ''}`
    return s
  }

  // Method 3: a detected vertical plane under the aim point if there is one, else the depth map.
  function readWall(input, eye) {
    const plane = input.hits.map((hit) => G.wallFromHit(hit, eye)).find(Boolean)
    let reading = plane
    if (!input.depth) s.depth = input.depthGranted === false ? 'not given' : 'waiting'
    else {
      const d = 0.06
      const sample = (u, v) => {
        const metres = input.depth(u, v)
        return metres ? G.unproject(u, v, metres, input.projection, input.viewToWorld) : null
      }
      const centre = sample(0.5, 0.5)
      s.depth = centre ? `${G.length(G.sub(centre, eye)).toFixed(2)} m` : 'no reading'
      reading ??= G.wallFromDepth({ centre, left: sample(0.5 - d, 0.5), right: sample(0.5 + d, 0.5), above: sample(0.5, 0.5 - d), below: sample(0.5, 0.5 + d) }, eye)
    }
    if (reading) s.candidate = G.blendWalls(s.candidate, reading, WALL_CALM)
    s.hint = s.candidate ? 'Aim where the print should hang. Tap to place.'
      : input.depthGranted === false ? 'This phone gives the browser no depth, and no surface was found on this wall. Methods 1 and 2 work here.'
      : 'Aim at the wall from about three steps back and move the phone slowly. An edge, a socket or a frame helps.'
  }

  function tap() {
    if (s.phase === 'seam') {
      if (s.method === 'corners' && !s.pin) {
        if (s.marker) s.pin = s.marker
        return
      }
      if (!s.candidate) return
      s.wall = s.candidate
      s.phase = 'hang'
      s.centre = null
    } else if (s.phase === 'wall') {
      if (!s.candidate || !s.centre) return
      s.wall = s.candidate
      s.phase = 'hang'
      s.placed = true
    } else if (s.phase === 'hang' && s.centre) {
      s.placed = !s.placed
    }
  }

  function restart() {
    Object.assign(s, { phase: s.method === 'auto' ? 'wall' : s.floorY === null ? 'floor' : 'seam', pin: null, candidate: null, wall: null, centre: null, placed: false })
  }

  // Skirting boards, furniture against the wall and a noisy depth reading all leave the wall a
  // few centimetres off; this is the knob for it.
  function nudge(steps) {
    if (!s.wall) return
    s.wall = G.nudgeWall(s.wall, steps * NUDGE)
    if (s.centre) s.centre = G.add(s.centre, G.scale(s.wall.normal, steps * NUDGE))
  }

  return { state: s, step, tap, restart, nudge }
}

// ---- drawing --------------------------------------------------------------------------------

// The shadow a frame casts on the wall it hangs on: its own rectangle, blurred, a touch lower.
// Drawn once on a canvas; real shadow maps would cost a phone far more for the same effect.
const SHADOW_MARGIN = 0.18 // of the canvas, left around the rectangle for the blur to fade into
function softShadow(width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = Math.round((512 * height) / width)
  const ctx = canvas.getContext('2d')
  const [mx, my] = [canvas.width * SHADOW_MARGIN, canvas.height * SHADOW_MARGIN]
  // Only the blur is wanted, so the rectangle itself is drawn off-canvas and its shadow shifted back in.
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
  ctx.shadowBlur = canvas.width * 0.07
  ctx.shadowOffsetX = canvas.width * 2
  ctx.fillRect(mx - canvas.width * 2, my, canvas.width - 2 * mx, canvas.height - 2 * my)
  const grow = 1 / (1 - 2 * SHADOW_MARGIN)
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width * grow, height * grow), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false }))
  mesh.position.set(0.006, -0.018, 0.001) // lit from above and a little to the left
  return mesh
}

const geometryOf = (mesh) => {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(mesh.pos, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(mesh.nor, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(mesh.uv, 2))
  geometry.setIndex(mesh.idx)
  return geometry
}

/**
 * `work` is what hangs: `{ image, w, h, moulding, depth, recess, color }`, sizes in metres and
 * `color` the hex colour of the moulding or mount.
 */
export async function createStage(work) {
  const scene = new THREE.Scene()
  // An ambient light of pi returns the print's own colours; the directional one only gives
  // the moulding a little shape.
  scene.add(new THREE.AmbientLight(0xffffff, 2.6))
  const sun = new THREE.DirectionalLight(0xffffff, 0.9)
  sun.position.set(-0.4, 1, 0.8)
  scene.add(sun)

  const meshes = frameMeshes(work)
  const size = new THREE.Vector3(...meshes.size)
  const picture = await new THREE.TextureLoader().setCrossOrigin('anonymous').loadAsync(work.image)
  picture.colorSpace = THREE.SRGBColorSpace
  picture.flipY = false // the meshes carry glTF texture coordinates, v=0 at the top
  const materials = [
    new THREE.MeshStandardMaterial({ color: work.color, roughness: 0.55, transparent: true }),
    new THREE.MeshStandardMaterial({ map: picture, roughness: 0.85, transparent: true }),
  ]
  const print = new THREE.Group()
  print.add(softShadow(size.x, size.y), new THREE.Mesh(geometryOf(meshes.body), materials[0]), new THREE.Mesh(geometryOf(meshes.print), materials[1]))
  print.matrixAutoUpdate = false

  const ink = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthTest: false })
  const marker = new THREE.Mesh(new THREE.RingGeometry(0.035, 0.05, 32).rotateX(-Math.PI / 2), ink)
  const pin = new THREE.Mesh(new THREE.CircleGeometry(0.03, 24).rotateX(-Math.PI / 2), ink)
  // The foot of the wall, as a bar lying on the floor, and the wall it implies, as a faint sheet.
  const foot = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.012).rotateX(-Math.PI / 2), ink)
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false }))
  for (const mesh of [marker, pin, foot, sheet]) { mesh.matrixAutoUpdate = false; mesh.renderOrder = 2 }
  scene.add(print, marker, pin, foot, sheet)

  const at = (mesh, matrix) => { mesh.visible = Boolean(matrix); if (matrix) { mesh.matrix.fromArray(matrix); mesh.matrixWorldNeedsUpdate = true } }
  const flat = (point) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, ...point, 1]
  const scaled = (matrix, x, y) => matrix.map((v, i) => (i < 4 ? v * x : i < 8 ? v * y : v))

  /** `held` is the print's pose from its anchor, when it has one. */
  function draw(s, held) {
    const aiming = s.phase === 'seam'
    at(marker, aiming && s.marker ? flat(s.marker) : null)
    at(pin, aiming && s.pin ? flat(s.pin) : null)
    const guide = aiming ? s.candidate : null
    const span = Math.max(size.x + 0.4, s.pin && s.marker ? G.length(G.sub(s.marker, s.pin)) : 0)
    at(foot, guide ? scaled(G.hangMatrix(guide, guide.point), span, 1) : null)
    const sheetHeight = 2.2
    at(sheet, guide ? scaled(G.hangMatrix(guide, G.add(guide.point, [0, sheetHeight / 2, 0])), span, sheetHeight) : null)
    const wall = s.wall ?? (s.phase === 'wall' ? s.candidate : null)
    at(print, wall && s.centre ? held ?? G.hangMatrix(wall, s.centre) : null)
    for (const material of materials) material.opacity = s.placed ? 1 : 0.6
    print.children[0].visible = s.placed
  }

  return { scene, draw, size }
}

// ---- sources --------------------------------------------------------------------------------

/** The phone's AR session. Resolves once it has ended. */
export async function runXR({ method, work, overlay, onState, onStart }) {
  const init = { requiredFeatures: ['hit-test', 'dom-overlay'], optionalFeatures: ['anchors'], domOverlay: { root: overlay } }
  if (method.key === 'auto') {
    init.optionalFeatures.push('depth-sensing')
    // The only combination Chrome's ARCore backend offers on phones.
    init.depthSensing = { usagePreference: ['cpu-optimized'], dataFormatPreference: ['luminance-alpha'] }
  }
  const session = await navigator.xr.requestSession('immersive-ar', init)
  try {
    await runSession(session, { method, work, onState, onStart })
  } catch (error) {
    // A failure while setting up would otherwise leave the camera open under an empty overlay.
    await session.end().catch(() => {})
    throw error
  }
}

async function runSession(session, { method, work, onState, onStart }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.xr.enabled = true
  renderer.xr.setReferenceSpaceType('local')
  await renderer.xr.setSession(session)
  const camera = new THREE.PerspectiveCamera()
  const stage = await createStage(work)
  const placement = createPlacement(method)
  const viewerSpace = await session.requestReferenceSpace('viewer')
  const hitSource = await session.requestHitTestSource({ space: viewerSpace })
  const depthGranted = method.key === 'auto' ? Boolean(session.enabledFeatures?.includes('depth-sensing')) : false
  // Once placed, the print is handed to an anchor: ARCore keeps correcting its picture of the
  // room, and an anchor moves with those corrections where a pose captured once would slide.
  let anchor = null
  let anchoring = false
  const dropAnchor = () => { anchor?.delete(); anchor = null }
  function hold(frame, space, s) {
    if (!s.placed || !s.wall || !s.centre) return dropAnchor()
    if (!anchor && !anchoring && frame.createAnchor) {
      anchoring = true
      const position = new THREE.Vector3()
      const rotation = new THREE.Quaternion()
      new THREE.Matrix4().fromArray(G.hangMatrix(s.wall, s.centre)).decompose(position, rotation, new THREE.Vector3())
      frame.createAnchor(new XRRigidTransform(position, rotation), space)
        .then((made) => { if (placement.state.placed) anchor = made; else made.delete() })
        .catch(() => { /* no anchor on this phone: the captured pose stays */ })
        .finally(() => { anchoring = false })
    }
    return anchor && frame.trackedAnchors?.has(anchor) ? frame.getPose(anchor.anchorSpace, space)?.transform.matrix : null
  }

  session.addEventListener('select', () => placement.tap())
  onStart({ restart: placement.restart, nudge: placement.nudge, exit: () => session.end() })
  const ended = new Promise((resolve) => session.addEventListener('end', resolve, { once: true }))
  renderer.setAnimationLoop((time, frame) => {
    if (!frame) return
    const space = renderer.xr.getReferenceSpace()
    const pose = frame.getViewerPose(space)
    const view = pose?.views[0]
    let depth = null
    if (view && depthGranted) {
      try {
        const info = frame.getDepthInformation(view)
        if (info) depth = (u, v) => { const metres = info.getDepthInMeters(u, v); return metres > 0 ? metres : null }
      } catch { /* no depth for this frame */ }
    }
    const hits = frame.getHitTestResults(hitSource).map((hit) => hit.getPose(space)?.transform.matrix).filter(Boolean)
    const s = placement.step({ cam: pose ? pose.transform.matrix : null, hits, depth, depthGranted, projection: view?.projectionMatrix, viewToWorld: view?.transform.matrix })
    stage.draw(s, hold(frame, space, s))
    onState(s)
    renderer.render(stage.scene, camera)
  })
  await ended
  renderer.setAnimationLoop(null)
  renderer.dispose()
}

/**
 * A made-up room for desktops: a floor 1.35 m below the eye, detected only near the user, and
 * a plain wall 2.6 m ahead, turned 12 degrees, that gives no plane hits at all. `window.sim`
 * turns the camera and taps.
 */
export async function runSim({ method, work, canvas, onState, onStart }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setClearColor(0x9a9a96)
  const camera = new THREE.PerspectiveCamera(60, 1, 0.05, 50)
  const stage = await createStage(work)
  const placement = createPlacement(method)

  const FLOOR_Y = -1.35
  const turn = (12 * Math.PI) / 180
  const room = { point: [0, 0, -2.6], normal: [Math.sin(turn), 0, Math.cos(turn)] }
  const roomWall = new THREE.Mesh(new THREE.PlaneGeometry(7, 2.8), new THREE.MeshBasicMaterial({ color: 0xe9e7e2 }))
  roomWall.position.set(0, FLOOR_Y + 1.4, -2.6)
  roomWall.rotation.y = turn
  const roomFloor = new THREE.Mesh(new THREE.PlaneGeometry(7, 7).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x8a7458 }))
  roomFloor.position.y = FLOOR_Y
  stage.scene.add(roomWall, roomFloor)

  const aim = { yaw: 0, pitch: -50 }
  const sim = {
    look: (yaw, pitch) => Object.assign(aim, { yaw, pitch }),
    tap: () => placement.tap(),
    state: () => JSON.parse(JSON.stringify(placement.state)),
    room,
    depth: method.key === 'auto',
  }
  window.sim = sim

  const frame = () => {
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    if (canvas.width !== Math.round(width * devicePixelRatio)) renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    camera.rotation.set((aim.pitch * Math.PI) / 180, (aim.yaw * Math.PI) / 180, 0, 'YXZ')
    camera.updateMatrixWorld()
    const cam = camera.matrixWorld.elements
    const eye = G.position(cam)
    const look = G.forward(cam)
    // Hit test as ARCore gives it: only inside the floor patch it has mapped, and nothing on the wall.
    const onFloor = G.rayPlane(eye, look, [0, FLOOR_Y, 0], [0, 1, 0])
    const beforeWall = onFloor && G.dot(G.sub(onFloor, room.point), room.normal) > 0
    const hits = beforeWall && Math.hypot(onFloor[0], onFloor[2] + 0.8) < 1.3 ? [[1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, ...onFloor, 1]] : []
    const depth = sim.depth ? (u, v) => {
      const dir = G.sub(G.unproject(u, v, 1, camera.projectionMatrix.elements, cam), eye)
      const points = [G.rayPlane(eye, dir, room.point, room.normal), G.rayPlane(eye, dir, [0, FLOOR_Y, 0], [0, 1, 0])].filter(Boolean)
      const nearest = points.sort((a, b) => G.length(G.sub(a, eye)) - G.length(G.sub(b, eye)))[0]
      return nearest ? G.dot(G.sub(nearest, eye), look) : null
    } : null
    const s = placement.step({ cam, hits, depth, depthGranted: sim.depth, projection: camera.projectionMatrix.elements, viewToWorld: cam })
    stage.draw(s)
    onState(s)
    renderer.render(stage.scene, camera)
    requestAnimationFrame(frame)
  }
  frame()
  onStart({ restart: placement.restart, nudge: placement.nudge, exit: () => location.reload() })
}

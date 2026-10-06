import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  axis, blendWalls, cross, dot, hangMatrix, nudgeWall, rayPlane, surfaceKind, transformPoint, unproject,
  wallFromDepth, wallFromHit, wallFromSeam,
} from '../public/prototype-3d/lab/geometry.js'

const near = (a, b, eps = 1e-6) => a.every((v, i) => Math.abs(v - b[i]) < eps)
const camera = [0, 1.5, 0]
const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]

test('a ray meets the plane in front of it and nothing behind or beyond reach', () => {
  assert.ok(near(rayPlane(camera, [0, 0, -1], [0, 0, -2], [0, 0, 1]), [0, 1.5, -2]))
  assert.equal(rayPlane(camera, [0, 0, 1], [0, 0, -2], [0, 0, 1]), null) // looking away
  assert.equal(rayPlane(camera, [1, 0, 0], [0, 0, -2], [0, 0, 1]), null) // parallel
  assert.equal(rayPlane(camera, [0, 0, -1], [0, 0, -20], [0, 0, 1], 8), null) // too far
})

test('two floor points along the skirting make a wall that faces the camera, in either order', () => {
  const left = [-1, 0, -2]
  const right = [1, 0.02, -2] // the floor estimate is never perfectly level
  for (const [a, b] of [[left, right], [right, left]]) {
    const w = wallFromSeam(a, b, camera)
    assert.ok(near(w.normal, [0, 0, 1]))
    assert.ok(near(w.point, [0, 0.01, -2]))
  }
  assert.equal(wallFromSeam(left, [-0.9, 0, -2], camera), null) // taps too close to give a direction
})

test('a slanted seam gives a wall square to it', () => {
  const w = wallFromSeam([0, 0, -2], [2, 0, -4], camera)
  assert.ok(Math.abs(dot(w.normal, [2, 0, -2])) < 1e-6)
  assert.ok(dot(w.normal, [0 - 1, 0, 0 - -3]) > 0) // towards the camera from the seam's middle
})

test('hit poses are sorted into floor, wall and neither by their Y axis', () => {
  assert.equal(surfaceKind([0, 1, 0]), 'floor')
  assert.equal(surfaceKind([0.99, 0.1, 0]), 'wall')
  assert.equal(surfaceKind([0.7, 0.7, 0]), 'other')
  // a pose whose Y axis points along -Z, 3 m in front: a wall facing away from the camera
  const hit = [1, 0, 0, 0, 0, 0.1, -0.995, 0, 0, 0.995, 0.1, 0, 0, 1, -3, 1]
  const w = wallFromHit(hit, camera)
  assert.ok(near(w.normal, [0, 0, 1])) // flattened, and turned to face the room
  assert.equal(wallFromHit(IDENTITY, camera), null) // a floor pose is not a wall
})

// A symmetric perspective projection: 60 degrees tall, portrait 9:16.
const f = 1 / Math.tan((60 * Math.PI) / 360)
const PROJECTION = [f / (9 / 16), 0, 0, 0, 0, f, 0, 0, 0, 0, -1.002, -1, 0, 0, -0.2, 0]
const project = ([x, y, z]) => [((PROJECTION[0] * x) / -z + 1) / 2, (1 - (PROJECTION[5] * y) / -z) / 2]

test('a depth sample goes back to the point it was measured from', () => {
  assert.ok(near(unproject(0.5, 0.5, 2, PROJECTION, IDENTITY), [0, 0, -2]))
  const point = [0.4, -0.7, -3]
  const [u, v] = project(point)
  assert.ok(near(unproject(u, v, 3, PROJECTION, IDENTITY), point))
  // and follows the camera when it has moved
  const moved = [...IDENTITY.slice(0, 12), 1, 2, 3, 1]
  assert.ok(near(unproject(u, v, 3, PROJECTION, moved), transformPoint(moved, point)))
})

test('five depth samples of a wall give that wall, and of a floor give nothing', () => {
  const sampleWall = (u, v) => {
    // the wall z = -2.5 turned 20 degrees: n = (sin20, 0, cos20), through (0, 0, -2.5)
    const n = [Math.sin(0.349), 0, Math.cos(0.349)]
    const dir = unproject(u, v, 1, PROJECTION, IDENTITY)
    return rayPlane([0, 0, 0], dir, [0, 0, -2.5], n)
  }
  const s = 0.06
  const w = wallFromDepth({ centre: sampleWall(0.5, 0.5), left: sampleWall(0.5 - s, 0.5), right: sampleWall(0.5 + s, 0.5), above: sampleWall(0.5, 0.5 - s), below: sampleWall(0.5, 0.5 + s) }, [0, 0, 0])
  assert.ok(near(w.normal, [Math.sin(0.349), 0, Math.cos(0.349)], 1e-4))
  const floor = (x, z) => [x, -1.4, z]
  assert.equal(wallFromDepth({ centre: floor(0, -2), left: floor(-0.2, -2), right: floor(0.2, -2), above: floor(0, -2.3), below: floor(0, -1.7) }, [0, 0, 0]), null)
  assert.equal(wallFromDepth({ centre: [0, 0, -2], left: null, right: [0.2, 0, -2], above: [0, 0.2, -2], below: [0, -0.2, -2] }, [0, 0, 0]), null)
})

test('a hung print is upright, right-handed and faces out of the wall', () => {
  const w = wallFromSeam([0, 0, -2], [2, 0, -4], camera)
  const m = hangMatrix(w, [1, 1.45, -3])
  const [x, y, z] = [axis(m, 0), axis(m, 1), axis(m, 2)]
  assert.ok(near(y, [0, 1, 0]))
  assert.ok(near(z, w.normal))
  assert.ok(near(cross(x, y), z))
  assert.ok(near(transformPoint(m, [0, 0, 0]), [1, 1.45, -3]))
})

test('nudging moves the wall along its normal, and blending calms a jumpy estimate', () => {
  const w = { point: [0, 0, -2], normal: [0, 0, 1] }
  assert.ok(near(nudgeWall(w, 0.05).point, [0, 0, -1.95]))
  const jump = { point: [0, 0, -2.2], normal: [0, 0, 1] }
  assert.ok(near(blendWalls(w, jump, 0.25).point, [0, 0, -2.05]))
  assert.deepEqual(blendWalls(null, jump, 0.25), jump)
})

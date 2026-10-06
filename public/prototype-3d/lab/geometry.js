// Geometry behind the wall-placement methods of the AR lab, on plain arrays: points and
// directions are [x, y, z] in metres with +Y up, matrices are the 16 column-major numbers
// WebXR hands out. No three.js and no browser APIs, so node can test it (test/ar-geometry.test.mjs).

export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
export const scale = (a, k) => [a[0] * k, a[1] * k, a[2] * k]
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
export const length = (a) => Math.hypot(a[0], a[1], a[2])
/** Unit vector, or null for a vector too short to have a direction. */
export const normalize = (a) => (length(a) < 1e-6 ? null : scale(a, 1 / length(a)))
export const lerp = (a, b, k) => add(a, scale(sub(b, a), k))

/** Where a pose matrix sits, and one of its axes (0 = X, 1 = Y, 2 = Z). */
export const position = (m) => [m[12], m[13], m[14]]
export const axis = (m, i) => [m[i * 4], m[i * 4 + 1], m[i * 4 + 2]]
/** The direction a viewer pose looks in: its -Z. */
export const forward = (m) => scale(axis(m, 2), -1)
export const transformPoint = (m, [x, y, z]) => [
  m[0] * x + m[4] * y + m[8] * z + m[12],
  m[1] * x + m[5] * y + m[9] * z + m[13],
  m[2] * x + m[6] * y + m[10] * z + m[14],
]

// A hit-test pose has the surface normal on its Y axis. How far that normal leans decides
// what was hit: mostly up is floor, close to horizontal is wall, anything else (a sofa arm,
// a sloped ceiling) is neither.
export const FLOOR_UP = 0.8
export const WALL_UP = 0.3
export function surfaceKind(normal) {
  if (normal[1] > FLOOR_UP) return 'floor'
  return Math.abs(normal[1]) < WALL_UP ? 'wall' : 'other'
}

/** Where a ray meets a plane; null when it runs parallel, points away, or lands beyond `max` metres. */
export function rayPlane(origin, dir, point, normal, max = Infinity) {
  const facing = dot(dir, normal)
  if (Math.abs(facing) < 1e-6) return null
  const t = dot(sub(point, origin), normal) / facing
  return t > 0 && t <= max ? add(origin, scale(dir, t)) : null
}

/**
 * A wall: a point on it and a unit normal. The normal is laid flat, so a print hung on it is
 * truly vertical even when the measurement behind it was a little off, and turned to face
 * `towards` (the camera), so the print's front looks into the room.
 */
export function wall(point, normal, towards) {
  const flat = normalize([normal[0], 0, normal[2]])
  if (!flat) return null
  return { point, normal: dot(sub(towards, point), flat) < 0 ? scale(flat, -1) : flat }
}

/** The wall standing on the line between two points of the floor, where it meets the wall. */
export function wallFromSeam(a, b, camera, minSpan = 0.3) {
  const along = [b[0] - a[0], 0, b[2] - a[2]]
  if (length(along) < minSpan) return null
  return wall(scale(add(a, b), 0.5), cross(along, [0, 1, 0]), camera)
}

/** The wall a hit-test pose lies on, or null if that surface is not a wall. */
export function wallFromHit(matrix, camera) {
  const normal = axis(matrix, 1)
  return surfaceKind(normal) === 'wall' ? wall(position(matrix), normal, camera) : null
}

/**
 * World position of one depth sample. (u, v) are normalized view coordinates with the origin
 * at the top left, `depth` is metres along the view axis, `projection` is the view's
 * projection matrix and `viewToWorld` its transform.
 */
export function unproject(u, v, depth, projection, viewToWorld) {
  const z = -depth
  // ndc = (P0·x + P8·z) / -z, solved for x; the same on y with P5 and P9.
  const x = ((2 * u - 1) * depth - projection[8] * z) / projection[0]
  const y = ((1 - 2 * v) * depth - projection[9] * z) / projection[5]
  return transformPoint(viewToWorld, [x, y, z])
}

/**
 * The wall seen in five depth samples: the centre and its neighbours to the left, right, above
 * and below. Null when a sample is missing or the surface they describe is not a wall.
 */
export function wallFromDepth({ centre, left, right, above, below }, camera) {
  if (![centre, left, right, above, below].every(Boolean)) return null
  const normal = normalize(cross(sub(right, left), sub(above, below)))
  return normal && surfaceKind(normal) === 'wall' ? wall(centre, normal, camera) : null
}

/** A step from one wall estimate towards the next, to calm a noisy measurement. */
export function blendWalls(from, to, k) {
  if (!from || dot(from.normal, to.normal) < 0) return to
  return { point: lerp(from.point, to.point, k), normal: normalize(lerp(from.normal, to.normal, k)) ?? to.normal }
}

/** The same wall moved `metres` along its normal: positive comes into the room. */
export const nudgeWall = (w, metres) => ({ ...w, point: add(w.point, scale(w.normal, metres)) })

/** Pose matrix of something hung on a wall at `centre`: +Z out of the wall, +Y up. */
export function hangMatrix(w, centre) {
  const up = [0, 1, 0]
  const right = cross(up, w.normal)
  return [...right, 0, ...up, 0, ...w.normal, 0, ...centre, 1]
}

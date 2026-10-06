/**
 * The gallery wall's geometry, in centimetres on the wall plane. No DOM here,
 * so the push and the share link can be tested with node alone.
 *
 * Every room is a 1672 x 941 photo, public/wall/<id>.webp, with `pxPerCm`
 * photo pixels on 1 cm of its wall and the wall meeting the floor at `floorY`.
 * The concrete room's camera was calibrated in `Protótipos 3d/sala` — wall at
 * 5.66 m, focal length 1129 px. The other rooms are read off the photo: the
 * floor line measured, the scale taken from the furniture against the wall
 * (a bench seat as 45 cm). Tune them here if works look too big or too small.
 */
export const ROOM = { width: 1672, height: 941 }

export type Room = { id: string; pxPerCm: number; floorY: number }
export const ROOMS: Room[] = [
  { id: 'concrete-room', pxPerCm: 1.995, floorY: 690 },
  { id: 'hotel-lobby', pxPerCm: 2.5, floorY: 760 },
  // the banquette hides the floor line: placed from its depth and back height
  { id: 'restaurant', pxPerCm: 2.4, floorY: 795 },
  { id: 'beach-house', pxPerCm: 2.4, floorY: 783 },
  { id: 'forest-retreat', pxPerCm: 2.8, floorY: 786 },
  { id: 'limestone-coast', pxPerCm: 2.7, floorY: 777 },
  { id: 'desert-residence', pxPerCm: 2.4, floorY: 806 },
  { id: 'alpine-residence', pxPerCm: 2.9, floorY: 802 },
]
/** The room with this id; the first one for an unknown or missing id. */
export const roomOf = (id: string | null | undefined) => ROOMS.find((r) => r.id === id) ?? ROOMS[0]

export type WallMaterial = 'unframed' | 'regular' | 'aluminium' | 'glass'
export type WallFinish = 'black' | 'white' | 'custom'

export type Piece = {
  key: string
  id: string
  /** centre, cm from the wall's middle */
  x: number
  /** centre, cm above the floor */
  y: number
  /** index into SIZES */
  size: number
  material: WallMaterial
  finish: WallFinish
  portrait: boolean
}

export const IN = 2.54
/** The shop's print sizes, short x long side in inches (standardPrintSizes). */
export const SIZES: [number, number][] = [[20, 30], [24, 36], [28, 42]]
export const MOULDING = 3 // cm, the regular frame's face width
export const EYE = 145 // gallery hanging height for the centre of a work
export const GAP = 8 // cm kept between neighbours when one pushes another
export const GRID = 5 // cm: a released work's centre lands on this grid

export const sizeLabel = (size: number, portrait: boolean) => {
  const [s, l] = SIZES[size]
  return portrait ? `${s}x${l}` : `${l}x${s}`
}

/** The SIZES index for a shop size value ('30x20', '24 x 36"', …); 0 if unknown. */
export const sizeIndexOf = (value: string | undefined) => {
  const short = Math.min(...(value?.match(/\d+/g)?.map(Number) ?? [0]))
  return Math.max(0, SIZES.findIndex(([s]) => s === short))
}

/** Outer size in cm: the print plus the moulding, and the moulding width `b`. */
export function dims(p: Pick<Piece, 'size' | 'material' | 'portrait'>) {
  const [s, l] = SIZES[p.size].map((v) => v * IN)
  const [pw, ph] = p.portrait ? [s, l] : [l, s]
  const b = p.material === 'regular' ? MOULDING : 0
  return { w: pw + b * 2, h: ph + b * 2, b }
}

/** Keeps a work inside the photo of `room`: half its width each side, floor to top edge. */
export function clamp(p: Piece, room = ROOMS[0]) {
  const d = dims(p)
  const half = ROOM.width / 2 / room.pxPerCm
  p.x = Math.max(-half + d.w / 2, Math.min(half - d.w / 2, p.x))
  p.y = Math.max(d.h / 2 + 5, Math.min(room.floorY / room.pxPerCm - d.h / 2, p.y))
}

export const snapToGrid = (p: Piece, room = ROOMS[0]) => {
  p.x = Math.round(p.x / GRID) * GRID
  p.y = Math.round(p.y / GRID) * GRID
  clamp(p, room)
}

/**
 * Pushes overlapping works apart, sideways unless stacking is much shorter,
 * keeping GAP cm between them. `fixed` (the one dragged or resized) never
 * moves. Mutates the pieces in place.
 * ponytail: O(n²) relaxation, fine for a wall of a dozen works.
 */
export function settle(pieces: Piece[], fixed?: Piece, room = ROOMS[0]) {
  for (let pass = 0; pass < 40; pass++) {
    let moved = false
    for (let i = 0; i < pieces.length; i++) {
      for (let j = i + 1; j < pieces.length; j++) {
        const a = pieces[i], b = pieces[j]
        const da = dims(a), db = dims(b)
        const dx = b.x - a.x, dy = b.y - a.y
        const ox = (da.w + db.w) / 2 + GAP - Math.abs(dx)
        const oy = (da.h + db.h) / 2 + GAP - Math.abs(dy)
        if (ox <= 0.01 || oy <= 0.01) continue
        const share = a === fixed ? [0, 1] : b === fixed ? [1, 0] : [0.5, 0.5]
        // favour sideways: a gallery wall grows along the wall, not up it
        if (ox < oy * 1.8) {
          const s = dx >= 0 ? 1 : -1
          a.x -= s * ox * share[0]
          b.x += s * ox * share[1]
        } else {
          const s = dy >= 0 ? 1 : -1
          a.y -= s * oy * share[0]
          b.y += s * oy * share[1]
        }
        clamp(a, room)
        clamp(b, room)
        moved = true
      }
    }
    if (!moved) break
  }
  return pieces
}

/** Nearest free distance to a neighbour on each side that shares some height. */
export function gapsOf(p: Piece, pieces: Piece[]) {
  const d = dims(p)
  const out: { from: number; width: number }[] = []
  for (const side of [-1, 1]) {
    let best: number | null = null
    for (const q of pieces) {
      if (q === p) continue
      const e = dims(q)
      if (Math.abs(q.y - p.y) > (d.h + e.h) / 2) continue
      const gap = side * (q.x - p.x) - (d.w + e.w) / 2
      if (gap > 0 && (best === null || gap < best)) best = gap
    }
    if (best === null) continue
    const edge = p.x + (side * d.w) / 2
    out.push({ from: Math.min(edge, edge + side * best), width: best })
  }
  return out
}

const MATERIAL_CODES: WallMaterial[] = ['unframed', 'regular', 'aluminium', 'glass']
const FINISH_CODES: WallFinish[] = ['black', 'white', 'custom']

/** The wall as a short string for a share link: `id.x.y.smf` per work, joined by `~`. */
export const encodeWall = (pieces: Piece[]) =>
  pieces
    .map((p) => `${p.id}.${Math.round(p.x)}.${Math.round(p.y)}.${p.size}${MATERIAL_CODES.indexOf(p.material)}${FINISH_CODES.indexOf(p.finish)}`)
    .join('~')

/**
 * Inverse of encodeWall; drops works `portraitOf` does not know (returns undefined).
 * Positions come back as written: the builder fits them to its room.
 */
export function decodeWall(value: string, portraitOf: (id: string) => boolean | undefined): Piece[] {
  return value.split('~').flatMap((part, i) => {
    const m = part.match(/^([a-z0-9-]+)\.(-?\d+)\.(-?\d+)\.([0-2])([0-3])([0-2])$/)
    const portrait = m ? portraitOf(m[1]) : undefined
    if (!m || portrait === undefined) return []
    return [{
      key: `${m[1]}-${i}`,
      id: m[1],
      x: Number(m[2]),
      y: Number(m[3]),
      size: Number(m[4]),
      material: MATERIAL_CODES[Number(m[5])],
      finish: FINISH_CODES[Number(m[6])],
      portrait,
    }]
  })
}

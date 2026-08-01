import { Html, Text } from '@react-three/drei'
import { useLoader } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  ExtrudeGeometry,
  Path,
  Shape,
  Vector2,
  type Object3D,
  type SpotLight,
} from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import {
  FONT_BRAND,
  FONT_BRAND_ITALIC,
  FONT_DIGITS_TYPEFACE,
  FONT_SANS,
  OPENING_DATE,
  WALL_BOTTOM_Y,
  WALL_HEIGHT,
  WALL_WIDTH,
} from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'
import { shadowTexture } from './ArtworkFrame'
import { WallPiece, useWallPieceMap, useWallShapeMap } from './MarbleWallSurface'
import { StoneMaterial, useStoneMap } from './stone'

// ---------------------------------------------------------------------------
// Layout knobs. Everything on this wall is cut into, screwed onto or stood
// against the concrete — nothing floats as a card. World units; the wall face
// sits at z 0.05.
// ---------------------------------------------------------------------------

/**
 * The countdown does not sit ON the wall — the whole rectangle is CUT INTO it.
 * The slab is built as four pieces around the opening, so their inner side faces
 * become the reveals; the top one points down, away from the cones, and darkens
 * on its own.
 */
const NICHE_DEPTH = 0.24
const NICHE_BACK_Z = 0.05 - NICHE_DEPTH
/** how much further the numerals are sunk INTO that recess, as real cavities */
const CAVITY_DEPTH = 0.12
const CAVITY_FLOOR_Z = NICHE_BACK_Z - CAVITY_DEPTH
/** where the flat type (title, units) sits: just off the niche floor */
const NICHE_FACE_Z = NICHE_BACK_Z + 0.012
/** the four surrounding slabs have to be thick enough to line the whole recess */
const PIECE_BACK_Z = CAVITY_FLOOR_Z - 0.03
const PIECE_DEPTH = 0.05 - PIECE_BACK_Z
const PIECE_Z = (0.05 + PIECE_BACK_Z) / 2

const NICHE = { x1: -1.55, x2: 4.25, y1: -1.15, y2: 1.5 }
const NICHE_MOBILE = { x1: -1.6, x2: 1.6, y1: -1.5, y2: 1.8 }
type Rect = { x1: number; x2: number; y1: number; y2: number }

/**
 * Ink ramp. Measured against a render, the wall lands around luminance 100–135
 * once the cones are tamed; these values keep every tier at 3:1 or better
 * against that, which the previous `#74685a` (1.2:1) never was.
 */
const INK = '#2b2419' // plate titles — the darkest tier
const SECOND = '#3d3428' // units, the countdown title, plate body copy
const RULE = '#5a4f40' // hairlines and dividers
/** the bottom of a carved numeral: same concrete, sunk out of the light */
const CAVITY_FLOOR = '#8b8175'

/** the editorial plate, held off the wall on four screws */
const PLATE_X = -2.56
const PLATE_Y = 0.21
const PLATE_W = 1.78
const PLATE_H = 2.16
const PLATE_Z = 0.13

/** the email capture, directly under the plate */
const FORM_X = -2.24
const FORM_Y = -1.34

/** the countdown, pushed right of centre — the plate is what balances it */
const COUNT_X0 = -0.63
const COUNT_STEP = 1.32
const COUNT_MID = COUNT_X0 + (COUNT_STEP * 3) / 2
const COUNT_Y = 0.12
const TITLE_Y = 0.94
// lining figures stand at CAP height (722/1000 em) where the oldstyle ones sat
// at x-height (529), so the same fontSize now draws ~36% taller — pulled back
// so the countdown grows a little rather than a lot
const NUMBER_SIZE = 0.7

/** the stone volume at the bottom right, cropped by the frame edge */
const BLOCK_X = 4.0
const BLOCK_W = 1.33
const BLOCK_H = 0.62
const BLOCK_D = 0.7
const BLOCK_Z = 0.45
const BLOCK_PLINTH_H = 0.08

/** mobile drops the plate and stacks the four units two-up, centred */
const M_COL = 0.85
const M_ROW_Y = [0.5, -0.55]

const UNITS = ['DAYS', 'HOURS', 'MINUTES', 'SECONDS']

// ---------------------------------------------------------------------------

function useCountdown() {
  const [parts, setParts] = useState(() => split(OPENING_DATE.getTime() - Date.now()))
  useEffect(() => {
    const id = setInterval(
      () => setParts(split(OPENING_DATE.getTime() - Date.now())),
      1000,
    )
    return () => clearInterval(id)
  }, [])
  return parts
}

function split(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const pad = (n: number) => String(n).padStart(2, '0')
  return [
    pad(Math.floor(s / 86400)),
    pad(Math.floor(s / 3600) % 24),
    pad(Math.floor(s / 60) % 60),
    pad(s % 60),
  ]
}

/** cap height of the lining figures, as a fraction of the em (verified: 722/1000) */
const CAP_RATIO = 0.722
/** points per curve when the glyph outlines are flattened for triangulation */
const GLYPH_DIVISIONS = 6

type Group = { x: number; y: number; text: string }

/**
 * The niche floor, with the numerals CARVED OUT of it.
 *
 * Not type drawn on a surface: the plate is one extruded slab whose Shape has
 * each digit's outer contour punched through as a hole, with the counters (the
 * bowl of a 6, both eyes of an 8) put back as separate islands at the same
 * depth. A floor plane sits behind. So a numeral is a real void with real side
 * walls — its upper inner face turns away from the ceiling cones and darkens,
 * its lower face catches them, and the whole thing holds up from any angle
 * instead of only head-on the way stacked text copies do.
 *
 * The digits come from a typeface JSON baked off the lining Playfair, with
 * self-intersecting contours resolved — the shipped outlines rely on non-zero
 * winding, which a rasteriser handles and a triangulator does not.
 */
function CarvedFloor({ rect, groups, size }: { rect: Rect; groups: Group[]; size: number }) {
  const font = useLoader(FontLoader, FONT_DIGITS_TYPEFACE)
  // the extruded plate and islands carry the shape's own XY as UVs; the floor is
  // a plain plane with 0–1 UVs, so it needs the per-piece crop instead
  const shapeMap = useWallShapeMap()
  const floorMap = useWallPieceMap(rect.x1, rect.x2, rect.y1, rect.y2)
  const key = groups.map((g) => g.text).join('|')

  const { plate, islands } = useMemo(() => {
    const outline = new Shape()
    outline.moveTo(rect.x1, rect.y1)
    outline.lineTo(rect.x2, rect.y1)
    outline.lineTo(rect.x2, rect.y2)
    outline.lineTo(rect.x1, rect.y2)
    outline.closePath()

    const counters: Shape[] = []
    for (const group of groups) {
      const shapes = font.generateShapes(group.text, size)
      const xs = shapes.flatMap((s) => s.getPoints().map((p) => p.x))
      // centre horizontally on the run's real width, but vertically on a FIXED
      // cap box — measuring the glyphs would make the row hop by a pixel or two
      // whenever a '1' (which has no overshoot) ticks past
      const dx = group.x - (Math.min(...xs) + Math.max(...xs)) / 2
      const dy = group.y - (CAP_RATIO * size) / 2
      const shift = (points: Vector2[]) => points.map((p) => new Vector2(p.x + dx, p.y + dy))

      for (const shape of shapes) {
        const { shape: contour, holes } = shape.extractPoints(GLYPH_DIVISIONS)
        outline.holes.push(new Path(shift(contour)))
        for (const hole of holes) counters.push(new Shape(shift(hole)))
      }
    }

    const settings = { depth: CAVITY_DEPTH, bevelEnabled: false }
    return {
      plate: new ExtrudeGeometry(outline, settings),
      islands: counters.map((c) => new ExtrudeGeometry(c, settings)),
    }
    // `key` stands in for `groups` — a fresh array every tick, but only its
    // digits change the geometry
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [font, size, rect.x1, rect.x2, rect.y1, rect.y2, key])

  useEffect(
    () => () => {
      plate.dispose()
      islands.forEach((g) => g.dispose())
    },
    [plate, islands],
  )

  return (
    <group position={[0, 0, CAVITY_FLOOR_Z]}>
      {/* the bottom of every cavity, a touch down from the face it is cut into */}
      <mesh position={[(rect.x1 + rect.x2) / 2, (rect.y1 + rect.y2) / 2, -0.002]}>
        <planeGeometry args={[rect.x2 - rect.x1, rect.y2 - rect.y1]} />
        <meshStandardMaterial map={floorMap} color={CAVITY_FLOOR} roughness={0.92} metalness={0} />
      </mesh>
      <mesh geometry={plate} receiveShadow>
        <meshStandardMaterial map={shapeMap} roughness={0.88} metalness={0} />
      </mesh>
      {islands.map((geometry, i) => (
        <mesh key={i} geometry={geometry} receiveShadow>
          <meshStandardMaterial map={shapeMap} roughness={0.88} metalness={0} />
        </mesh>
      ))}
    </group>
  )
}

/** a short horizontal rule — the plate's dividers */
function Rule({ x, y, w }: { x: number; y: number; w: number }) {
  return (
    <mesh position={[x + w / 2, y, 0.026]}>
      <planeGeometry args={[w, 0.005]} />
      <meshBasicMaterial color={RULE} />
    </mesh>
  )
}

/**
 * The editorial plate: a thin stone slab pinned off the wall on four dark
 * screws, its cast shadow proving the standoff.
 */
function EditorialPlate() {
  const map = useStoneMap(PLATE_W, PLATE_H)
  const pad = 0.19
  const left = -PLATE_W / 2 + pad
  const screw = 0.13

  return (
    <group position={[PLATE_X, PLATE_Y, PLATE_Z]}>
      {/* the standoff shadow, thrown down and right onto the wall behind — it
          has to land just PROUD of the wall face (0.05), not at the slab's mid
          plane, or the concrete swallows it */}
      <mesh position={[0.08, -0.11, -PLATE_Z + 0.055]}>
        <planeGeometry args={[PLATE_W + 0.5, PLATE_H + 0.5]} />
        <meshBasicMaterial map={shadowTexture} transparent depthWrite={false} />
      </mesh>

      {/* a step DARKER than the wall, as in the reference — that separation is
          what its own dark type needs to sit against */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[PLATE_W, PLATE_H, 0.045]} />
        <StoneMaterial map={map} lift={0.16} />
      </mesh>

      {[
        [-PLATE_W / 2 + screw, PLATE_H / 2 - screw],
        [PLATE_W / 2 - screw, PLATE_H / 2 - screw],
        [-PLATE_W / 2 + screw, -PLATE_H / 2 + screw],
        [PLATE_W / 2 - screw, -PLATE_H / 2 + screw],
      ].map(([x, y]) => (
        <mesh key={`${x}-${y}`} position={[x, y, 0.024]}>
          <circleGeometry args={[0.019, 14]} />
          <meshStandardMaterial color="#3b352d" metalness={0.7} roughness={0.35} />
        </mesh>
      ))}

      <Text
        font={FONT_BRAND_ITALIC}
        fontSize={0.185}
        color={INK}
        anchorX="left"
        anchorY="middle"
        position={[left, 0.72, 0.026]}
      >
        object 01
      </Text>
      <Text
        font={FONT_BRAND}
        fontSize={0.185}
        color={INK}
        anchorX="left"
        anchorY="middle"
        position={[left, 0.5, 0.026]}
      >
        revealed in
      </Text>

      <Rule x={left} y={0.3} w={0.52} />

      <Text
        font={FONT_SANS}
        fontSize={0.095}
        lineHeight={1.55}
        color={SECOND}
        anchorX="left"
        anchorY="top"
        position={[left, 0.16, 0.026]}
      >
        {'an exclusive TNES\nobject release'}
      </Text>
      <Text
        font={FONT_SANS}
        fontSize={0.095}
        color={SECOND}
        anchorX="left"
        anchorY="middle"
        position={[left, -0.34, 0.026]}
      >
        limited first access
      </Text>

      <Rule x={left} y={-0.58} w={0.52} />
    </group>
  )
}

/**
 * Where a signup goes. This site is a STATIC deploy — no server of ours to post
 * to — so the list lives in a Google Sheet fronted by an Apps Script web app,
 * which is a URL that accepts a POST and appends a row. No key ships in the
 * bundle: the deployment URL is the whole credential, and it is write-only.
 *
 * ponytail: a spreadsheet and 6 lines of Apps Script, not a mailing platform.
 * Ceiling: no double opt-in, no dedupe across visitors, no campaign sending —
 * move to Klaviyo/Shopify marketing when the list is worth mailing.
 *
 * Set VITE_NOTIFY_URL in the Render dashboard to this deployment:
 *
 *   // Extensions ▸ Apps Script on the sheet, then Deploy ▸ New deployment ▸
 *   // Web app, execute as Me, access "Anyone". Paste the /exec URL.
 *   function doPost(e) {
 *     const { email } = JSON.parse(e.postData.contents)
 *     SpreadsheetApp.getActiveSheet().appendRow([new Date(), email])
 *     return ContentService.createTextOutput('ok')
 *   }
 *
 * Unset, the form behaves as it always has: local only, and the address never
 * reaches anyone.
 */
const NOTIFY_URL = import.meta.env.VITE_NOTIFY_URL as string | undefined

async function subscribe(email: string) {
  // keep the local copy either way — it costs nothing and survives a bad POST
  const list = JSON.parse(localStorage.getItem('tnes-subscribers') ?? '[]')
  if (!list.includes(email)) list.push(email)
  localStorage.setItem('tnes-subscribers', JSON.stringify(list))

  if (!NOTIFY_URL) return
  // text/plain keeps this a "simple" request, so the browser sends no CORS
  // preflight — an Apps Script web app cannot answer an OPTIONS
  const response = await fetch(NOTIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ email, at: new Date().toISOString() }),
  })
  if (!response.ok) throw new Error(`notify: ${response.status}`)
}

/**
 * Email capture. A real `<input>`, so it is DOM — but rendered in world space by
 * drei's `Html transform`, which keeps it pinned to the wall through every orbit
 * and dolly instead of floating over the canvas.
 */
function NotifyForm({ position }: { position: [number, number, number] }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (sending) return
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('please enter a valid email')
      return
    }
    setSending(true)
    try {
      await subscribe(email)
      setDone(true)
    } catch {
      // never claim someone is on the list when the row was not written
      setError('couldn’t save that — please try again')
    } finally {
      setSending(false)
    }
  }

  return (
    <Html transform position={position} scale={0.2} zIndexRange={[10, 0]} occlude={false}>
      <div className="wall-notify">
        {done ? (
          <p className="wall-notify-done">you’re on the list — see you at the release.</p>
        ) : (
          <form className="wall-notify-form" onSubmit={submit} noValidate>
            <input
              type="email"
              placeholder="your email address"
              aria-label="Email address"
              aria-invalid={!!error}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              className="wall-notify-input"
            />
            <button type="submit" className="wall-notify-submit" disabled={sending}>
              {sending ? 'sending…' : <>notify me <span aria-hidden="true">→</span></>}
            </button>
          </form>
        )}
        {error && <p className="wall-notify-error">{error}</p>}
      </div>
    </Html>
  )
}

/**
 * One of the four light cones down the top of the wall.
 *
 * `distance` is the important knob, not `intensity`: it hard-stops the falloff,
 * which is what keeps the cone in the upper third instead of washing all the way
 * to the floor. At this position the beam dies around y 0.7 — just above the
 * countdown, so the numbers read against even wall rather than a gradient.
 */
function Cone({ x }: { x: number }) {
  const spot = useRef<SpotLight>(null)
  const aim = useRef<Object3D>(null)
  useEffect(() => {
    if (spot.current && aim.current) spot.current.target = aim.current
  }, [])
  return (
    <>
      <spotLight
        ref={spot}
        position={[x, 3.5, 1.35]}
        color="#ffeccd"
        intensity={11}
        angle={0.5}
        penumbra={1}
        decay={1.8}
        distance={3.6}
      />
      <object3D ref={aim} position={[x, 1.6, 0.05]} />
    </>
  )
}

/**
 * The floor under every value on this wall. Without it the concrete outside the
 * cones drops to the room's 0.2 ambient, and the wall swings ~2x in luminance
 * across the frame — no single ink colour can stay legible across that.
 * Deliberately broad, frontal and weak: it lifts, it does not model.
 */
function Fill() {
  const spot = useRef<SpotLight>(null)
  const aim = useRef<Object3D>(null)
  useEffect(() => {
    if (spot.current && aim.current) spot.current.target = aim.current
  }, [])
  return (
    <>
      <spotLight
        ref={spot}
        position={[0, 1.6, 5]}
        color="#ffeeda"
        intensity={20}
        angle={0.9}
        penumbra={1}
        decay={1}
        distance={14}
      />
      <object3D ref={aim} position={[0, 0.3, 0.05]} />
    </>
  )
}

/** The stone volume standing against the wall at the bottom right. */
function StoneBlock() {
  const map = useStoneMap(BLOCK_W, BLOCK_H)
  const plinthMap = useStoneMap(BLOCK_W - 0.16, BLOCK_PLINTH_H)
  const bodyY = WALL_BOTTOM_Y + BLOCK_PLINTH_H + (BLOCK_H - BLOCK_PLINTH_H) / 2

  return (
    <group position={[BLOCK_X, 0, BLOCK_Z]}>
      {/* recessed plinth, so the mass reads as slightly lifted off the floor */}
      <mesh position={[0, WALL_BOTTOM_Y + BLOCK_PLINTH_H / 2, 0]} receiveShadow>
        <boxGeometry args={[BLOCK_W - 0.16, BLOCK_PLINTH_H, BLOCK_D - 0.08]} />
        <StoneMaterial map={plinthMap} lift={0.18} />
      </mesh>
      <mesh position={[0, bodyY, 0]} castShadow receiveShadow>
        <boxGeometry args={[BLOCK_W, BLOCK_H - BLOCK_PLINTH_H, BLOCK_D]} />
        {/* lower than the Home console's 0.48: that one sits under a key light,
            this one stands in an unlit corner and was glowing on its own */}
        <StoneMaterial map={map} lift={0.26} />
      </mesh>
    </group>
  )
}

/**
 * The wall itself, cut open. Four slabs around the opening plus a floor set back
 * behind them; the gap between the floor and the front faces IS the recess, and
 * the slabs' inner sides are its reveals. The floor is tinted a shade down —
 * without shadow maps nothing else would darken the inside of a hole.
 */
function Niche({ rect, groups, size }: { rect: Rect; groups: Group[]; size: number }) {
  const left = -WALL_WIDTH / 2
  const right = WALL_WIDTH / 2
  const bottom = WALL_BOTTOM_Y
  const top = WALL_BOTTOM_Y + WALL_HEIGHT
  const piece = { z: PIECE_Z, depth: PIECE_DEPTH }
  return (
    <group>
      <WallPiece x1={left} x2={right} y1={rect.y2} y2={top} {...piece} />
      <WallPiece x1={left} x2={right} y1={bottom} y2={rect.y1} {...piece} />
      <WallPiece x1={left} x2={rect.x1} y1={rect.y1} y2={rect.y2} {...piece} />
      <WallPiece x1={rect.x2} x2={right} y1={rect.y1} y2={rect.y2} {...piece} />
      <CarvedFloor rect={rect} groups={groups} size={size} />
    </group>
  )
}

/** The unit label under a carved numeral — flat type on the niche floor. */
function UnitLabel({ x, y, unit }: { x: number; y: number; unit: string }) {
  return (
    <Text
      font={FONT_SANS}
      fontSize={0.078}
      letterSpacing={0.34}
      color={SECOND}
      anchorX="center"
      anchorY="middle"
      position={[x, y - 0.56, NICHE_FACE_Z]}
    >
      {unit}
    </Text>
  )
}

/**
 * The Countdown wall: an editorial plate screwed to the concrete, the release
 * clock cut straight into it, four light cones down the top, and a stone volume
 * closing the right edge. Nothing here is a floating card.
 */
export function ComingSoonWall() {
  const parts = useCountdown()
  const isMobile = useGalleryStore((s) => s.isMobile)

  const slots = parts.map((value, i) => ({
    unit: UNITS[i],
    text: value,
    x: isMobile ? (i % 2 ? M_COL : -M_COL) : COUNT_X0 + i * COUNT_STEP,
    y: isMobile ? M_ROW_Y[Math.floor(i / 2)] : COUNT_Y,
  }))

  if (isMobile) {
    return (
      <group>
        <Niche rect={NICHE_MOBILE} groups={slots} size={NUMBER_SIZE} />
        <Text
          font={FONT_SANS}
          fontSize={0.095}
          letterSpacing={0.3}
          color={SECOND}
          anchorX="center"
          anchorY="middle"
          position={[0, 1.35, NICHE_FACE_Z]}
        >
          THE ARCHIVE OPENS IN
        </Text>
        {slots.map((s) => (
          <UnitLabel key={s.unit} x={s.x} y={s.y} unit={s.unit} />
        ))}
        {/* was -1.5, exactly NICHE_MOBILE.y1 — the input rule landed on the
            recess's bottom edge and the two lines read as one broken frame.
            Clear of it now, and still inside COUNTDOWN_MOBILE_FIELD. */}
        <NotifyForm position={[0, -1.86, 0.22]} />
        {[-1.6, 1.6].map((x) => (
          <Cone key={x} x={x} />
        ))}
        <Fill />
      </group>
    )
  }

  return (
    <group>
      <Niche rect={NICHE} groups={slots} size={NUMBER_SIZE} />
      <EditorialPlate />
      <NotifyForm position={[FORM_X, FORM_Y, 0.22]} />

      {/* wide, but not so wide the letters stop reading as a word — 0.9 broke
          it into loose dots. This is the knob if it needs to span further */}
      <Text
        font={FONT_SANS}
        fontSize={0.125}
        letterSpacing={0.42}
        color={SECOND}
        anchorX="center"
        anchorY="middle"
        position={[COUNT_MID, TITLE_Y, NICHE_FACE_Z]}
      >
        THE ARCHIVE OPENS IN
      </Text>

      {slots.map((s) => (
        <UnitLabel key={s.unit} x={s.x} y={s.y} unit={s.unit} />
      ))}

      {/* three hairlines between the four blocks */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[COUNT_X0 + (i + 0.5) * COUNT_STEP, COUNT_Y - 0.14, NICHE_FACE_Z]}
        >
          <planeGeometry args={[0.007, 1.06]} />
          <meshBasicMaterial color={RULE} />
        </mesh>
      ))}

      <StoneBlock />

      {[-3.5, -1.17, 1.17, 3.5].map((x) => (
        <Cone key={x} x={x} />
      ))}
      <Fill />
    </group>
  )
}

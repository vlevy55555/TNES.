import { Html, RoundedBox, Text } from '@react-three/drei'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { CanvasTexture, RepeatWrapping, Shape } from 'three'
import { FONT_SANS, FONT_SANS_MEDIUM, OPENING_DATE, TNES } from '../../data/artworks'

const FRAME_BORDER = 0.15

const INK = TNES.black
const MUTED = TNES.sand
const PLATE = TNES.beige // sign plates, distinct from the white wall
const RIVET = '#6f6a61' // muted metal
const FLOOR_Y = -2.2

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

// seamless 45° hazard stripe: (x+y) mod period test — tiles perfectly, no rotation seams
function makeCautionTexture() {
  const size = 120
  const period = 20
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(size, size)
  // monochrome hazard stripe: beige + black (no yellow — see 05. Cromática)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const light = (((x + y) % period) + period) % period < period / 2
      const i = (y * size + x) * 4
      img.data[i] = light ? 207 : 18
      img.data[i + 1] = light ? 200 : 18
      img.data[i + 2] = light ? 191 : 18
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const texture = new CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = RepeatWrapping
  return texture
}
const cautionBase = makeCautionTexture()

// a vertical stake planted on the floor, tape tied to it at height — sits past
// the resting camera's framing, so it's only revealed mid-transition
function TapeAnchor({ x, y, depth }: { x: number; y: number; depth: number }) {
  const topY = y + 0.3
  const postHeight = topY - FLOOR_Y
  const postCenterY = (topY + FLOOR_Y) / 2
  return (
    <group position={[x, 0, depth]}>
      <mesh position={[0, postCenterY, 0]}>
        <cylinderGeometry args={[0.026, 0.034, postHeight, 10]} />
        <meshStandardMaterial color="#3a3733" metalness={0.45} roughness={0.4} />
      </mesh>
      <mesh position={[0, y, 0.02]}>
        <circleGeometry args={[0.042, 16]} />
        <meshStandardMaterial color={TNES.black} metalness={0.55} roughness={0.3} />
      </mesh>
    </group>
  )
}

// diagonal hazard tape strung between two wall-mounted stakes — the stakes sit
// beyond the countdown's normal framing and only peek in as the camera widens
// for a wall-to-wall transition
function CautionTape({
  from,
  to,
  variant = 'stripes',
}: {
  from: [number, number, number]
  to: [number, number, number]
  variant?: 'stripes' | 'text'
}) {
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const length = Math.hypot(dx, dy)
  const rotation = Math.atan2(dy, dx)
  const mid: [number, number, number] = [
    (from[0] + to[0]) / 2,
    (from[1] + to[1]) / 2,
    (from[2] + to[2]) / 2,
  ]

  const texture = useMemo(() => {
    if (variant !== 'stripes') return null
    const t = cautionBase.clone()
    t.wrapS = t.wrapT = RepeatWrapping
    t.repeat.set(length * 4.5, 1)
    t.needsUpdate = true
    return t
  }, [length, variant])

  return (
    <>
      <group position={mid} rotation={[0, 0, rotation]}>
        <mesh>
          <planeGeometry args={[length, 0.2]} />
          {variant === 'stripes' ? (
            <meshBasicMaterial map={texture} toneMapped={false} />
          ) : (
            <meshBasicMaterial color={TNES.sand} toneMapped={false} />
          )}
        </mesh>
        {variant === 'text' && (
          <Text
            font={FONT_SANS}
            fontSize={0.078}
            letterSpacing={0.24}
            color={TNES.black}
            anchorX="center"
            anchorY="middle"
            position={[0, 0, 0.004]}
          >
            {'PLEASE STAY AWAY   —   PLEASE STAY AWAY   —   PLEASE STAY AWAY   —   PLEASE STAY AWAY'}
          </Text>
        )}
      </group>
      <TapeAnchor x={from[0]} y={from[1]} depth={from[2]} />
      <TapeAnchor x={to[0]} y={to[1]} depth={to[2]} />
    </>
  )
}

// monochrome warning triangle: black outline ring + plate-colored fill + "!"
function WarningTriangle({ size = 0.13 }: { size?: number }) {
  const outer = useMemo(() => triangleShape(size), [size])
  const inner = useMemo(() => triangleShape(size * 0.76), [size])
  // exclamation as geometry (bar + dot) rather than a serif glyph: it stays
  // dead-centred and its dot keeps clear of the bottom edge at any size
  const cy = -size * 0.11
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <shapeGeometry args={[outer]} />
        <meshBasicMaterial color={INK} />
      </mesh>
      {/* inner plate concentric with the outer triangle -> even black border */}
      <mesh position={[0, -size * 0.035, 0.002]}>
        <shapeGeometry args={[inner]} />
        <meshBasicMaterial color={PLATE} />
      </mesh>
      <mesh position={[0, cy + size * 0.125, 0.004]}>
        <planeGeometry args={[size * 0.11, size * 0.44]} />
        <meshBasicMaterial color={INK} />
      </mesh>
      <mesh position={[0, cy - size * 0.205, 0.004]}>
        <circleGeometry args={[size * 0.058, 20]} />
        <meshBasicMaterial color={INK} />
      </mesh>
    </group>
  )
}

function triangleShape(size: number) {
  const s = new Shape()
  s.moveTo(0, size)
  s.lineTo(-size * 0.95, -size * 0.72)
  s.lineTo(size * 0.95, -size * 0.72)
  s.closePath()
  return s
}

function Rivets({ w, h }: { w: number; h: number }) {
  const inset = 0.075
  const corners: [number, number][] = [
    [-w / 2 + inset, h / 2 - inset],
    [w / 2 - inset, h / 2 - inset],
    [-w / 2 + inset, -h / 2 + inset],
    [w / 2 - inset, -h / 2 + inset],
  ]
  return (
    <>
      {corners.map(([x, y]) => (
        <mesh key={`${x}-${y}`} position={[x, y, 0.019]}>
          <circleGeometry args={[0.016, 12]} />
          <meshStandardMaterial color={RIVET} metalness={0.6} roughness={0.35} />
        </mesh>
      ))}
    </>
  )
}

// a real road-sign plate, pinned flush to the wall — no post, no floor contact
function PostSign({
  x,
  plateY,
  lines,
  z = 0.06,
}: {
  x: number
  plateY: number
  lines: [string, string]
  z?: number
}) {
  const w = 0.92
  const h = 0.64

  return (
    <group position={[x, plateY, z]}>
      <RoundedBox args={[w, h, 0.032]} radius={0.026} smoothness={2}>
        <meshStandardMaterial color={PLATE} metalness={0.25} roughness={0.55} />
      </RoundedBox>
      <Rivets w={w} h={h} />
      <group position={[0, h * 0.19, 0.02]}>
        <WarningTriangle size={h * 0.24} />
      </group>
      <Text
        font={FONT_SANS}
        fontSize={0.074}
        letterSpacing={0.12}
        color={INK}
        anchorX="center"
        anchorY="middle"
        lineHeight={1.3}
        position={[0, -h * 0.2, 0.02]}
      >
        {lines.join('\n')}
      </Text>
    </group>
  )
}

// free-standing sandwich board: two faces hinged at the top, each leaning out in
// depth (rotated on X, not Z) so the pair reads as a true triangle from the side
function AFrameSign({ position }: { position: [number, number, number] }) {
  const w = 0.8
  const h = 1.05
  const tilt = 0.34
  const hingeY = FLOOR_Y + h * Math.cos(tilt) + 0.02

  return (
    <group position={[position[0], hingeY, position[2]]} rotation={[0, 0.22, 0]}>
      {/* front face — leans toward the viewer, carries the signage */}
      <group rotation={[-tilt, 0, 0]}>
        <group position={[0, -h / 2, 0]}>
          <RoundedBox args={[w, h, 0.03]} radius={0.022} smoothness={2}>
            <meshStandardMaterial color={PLATE} metalness={0.22} roughness={0.58} />
          </RoundedBox>
          <Rivets w={w} h={h} />
          <group position={[0, h * 0.24, 0.018]}>
            <WarningTriangle size={0.14} />
          </group>
          <Text
            font={FONT_SANS}
            fontSize={0.076}
            letterSpacing={0.1}
            color={INK}
            anchorX="center"
            anchorY="middle"
            lineHeight={1.35}
            position={[0, -h * 0.16, 0.018]}
          >
            {'EXHIBITION\nIN PREPARATION'}
          </Text>
        </group>
      </group>
      {/* back face — leans away, completing the triangular stance */}
      <group rotation={[tilt, 0, 0]}>
        <mesh position={[0, -h / 2, 0]}>
          <boxGeometry args={[w, h, 0.028]} />
          <meshStandardMaterial color="#bcb5aa" metalness={0.2} roughness={0.65} />
        </mesh>
      </group>
    </group>
  )
}

// email capture embedded in the wall itself — at rest it's just the "Notify me"
// button from the reference; clicking it reveals the email field inline
function WallSubscribe({ position }: { position: [number, number, number] }) {
  const [stage, setStage] = useState<'idle' | 'entering' | 'done'>('idle')
  const [email, setEmail] = useState('')
  const [error, setError] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError(true)
      return
    }
    // ponytail: localStorage only — swap for a POST when a backend/Shopify exists
    const list = JSON.parse(localStorage.getItem('tnes-subscribers') ?? '[]')
    if (!list.includes(email)) list.push(email)
    localStorage.setItem('tnes-subscribers', JSON.stringify(list))
    setStage('done')
  }

  return (
    <Html transform position={position} scale={0.22} zIndexRange={[10, 0]} occlude={false}>
      <div className="wall-notify">
        {stage === 'done' && (
          <p className="wall-notify-done">You’re on the list — see you at the launch.</p>
        )}
        {stage === 'idle' && (
          <button type="button" className="btn btn-ghost" onClick={() => setStage('entering')}>
            Notify me
          </button>
        )}
        {stage === 'entering' && (
          <form className="wall-notify-form" onSubmit={submit} noValidate>
            <input
              type="email"
              autoFocus
              placeholder="Your email address"
              aria-label="Email address"
              aria-invalid={error}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError(false)
              }}
              className="wall-notify-input"
            />
            <button type="submit" className="btn btn-ghost">
              Notify me
            </button>
          </form>
        )}
        {error && <p className="wall-notify-error">Please enter a valid email.</p>}
      </div>
    </Html>
  )
}

const UNITS = ['DAYS', 'HOURS', 'MINUTES', 'SECONDS']
const UNIT_X = [-1.86, -0.62, 0.62, 1.86]

// the countdown lives inside a real frame, like the artworks on the other walls
function CountdownFrame({
  position,
  parts,
}: {
  position: [number, number, number]
  parts: string[]
}) {
  const w = 5.0
  const h = 2.3
  const frameW = w + FRAME_BORDER * 2
  const frameH = h + FRAME_BORDER * 2

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[frameW, frameH, 0.12]} />
        <meshStandardMaterial color={TNES.black} metalness={0} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.065]}>
        <boxGeometry args={[w, h, 0.03]} />
        <meshStandardMaterial color={TNES.white} />
      </mesh>

      <Text
        font={FONT_SANS}
        fontSize={0.15}
        letterSpacing={0.22}
        color={MUTED}
        anchorX="center"
        position={[0, h / 2 - 0.32, 0.085]}
      >
        TNES FULL LAUNCH IN
      </Text>

      {parts.map((value, i) => (
        <group key={UNITS[i]} position={[UNIT_X[i], -0.05, 0.085]}>
          <Text font={FONT_SANS_MEDIUM} fontSize={0.54} color={INK} anchorX="center">
            {value}
          </Text>
          <Text
            font={FONT_SANS}
            fontSize={0.048}
            letterSpacing={0.3}
            color={MUTED}
            anchorX="center"
            position={[0, -0.42, 0]}
          >
            {UNITS[i]}
          </Text>
        </group>
      ))}
      {[-1.24, 0, 1.24].map((x) => (
        <Text
          key={x}
          font={FONT_SANS}
          fontSize={0.34}
          color={MUTED}
          anchorX="center"
          position={[x, -0.04, 0.085]}
        >
          :
        </Text>
      ))}
    </group>
  )
}

export function ComingSoonWall() {
  const parts = useCountdown()

  return (
    <group position={[0, 0, 0.06]}>
      <CountdownFrame position={[0, 0.3, 0]} parts={parts} />

      <PostSign x={-3.35} plateY={1.3} lines={['WORK', 'IN PROGRESS']} />
      <PostSign x={3.35} plateY={0.1} lines={['COMING', 'SOON']} />
      <AFrameSign position={[-3.1, 0, 0.4]} />

      <CautionTape from={[-4.3, -0.392, 0.55]} to={[4.3, -1.168, 0.55]} variant="stripes" />
      <CautionTape from={[-4.3, -1.344, 0.6]} to={[4.3, -0.696, 0.6]} variant="text" />

      <WallSubscribe position={[0, -1.6, 0.22]} />
    </group>
  )
}

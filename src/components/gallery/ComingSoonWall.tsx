import { Html, RoundedBox, Text, useCursor } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { BufferAttribute, BufferGeometry, CanvasTexture, DoubleSide, RepeatWrapping, Shape, SRGBColorSpace } from 'three'
import { FONT_SANS, FONT_SANS_MEDIUM, OPENING_DATE } from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'
import { INTERACTIVE_CURSOR } from './interactiveCursor'

const FRAME_BORDER = 0.15

const INK = '#2f2a24'
const MUTED = '#6b6151'
const GOLD = '#b69b5e'
const PLATE = '#dcd5c3'
const RIVET = '#6b6152'
const FLOOR_Y = -2.2
const TAPE_SEGMENTS = 18

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
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const yellow = (((x + y) % period) + period) % period < period / 2
      const i = (y * size + x) * 4
      img.data[i] = yellow ? 240 : 24
      img.data[i + 1] = yellow ? 192 : 20
      img.data[i + 2] = yellow ? 46 : 16
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = texture.wrapT = RepeatWrapping
  return texture
}
const cautionBase = makeCautionTexture()

// The wording is painted into the tape texture, not laid over it as separate
// type. It therefore bends with every control point of the ribbon.
function makeCautionTextTexture() {
  // Match the ribbon's long, thin proportions. A square-ish canvas would be
  // stretched several times along its length and distort every letter.
  const width = 2400
  const height = 56
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  // Leave the background transparent: this texture is an ink layer painted
  // over the yellow vinyl, so dark lettering can never turn the whole tape dark.
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = '#171310'
  ctx.font = '600 30px Arial, sans-serif'
  ctx.textBaseline = 'middle'
  const label = 'PLEASE STAY AWAY   —   '
  const labelWidth = ctx.measureText(label).width
  for (let x = -labelWidth * 0.25; x < width + labelWidth; x += labelWidth) {
    ctx.fillText(label, x, height / 2)
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = texture.wrapT = RepeatWrapping
  return texture
}
const cautionTextBase = makeCautionTextTexture()

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
        <meshStandardMaterial color="#4a4238" metalness={0.45} roughness={0.4} />
      </mesh>
      <mesh position={[0, y, 0.02]}>
        <circleGeometry args={[0.042, 16]} />
        <meshStandardMaterial color="#2a251e" metalness={0.55} roughness={0.3} />
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
  const dz = to[2] - from[2]
  const sag = 0.15
  const pointAt = (t: number): [number, number, number] => [
    from[0] + dx * t,
    from[1] + dy * t - Math.sin(Math.PI * t) * sag,
    from[2] + dz * t + Math.sin(Math.PI * t * 2) * 0.025,
  ]
  const endpoints = Array.from({ length: TAPE_SEGMENTS + 1 }, (_, index) => pointAt(index / TAPE_SEGMENTS))
  const totalLength = endpoints.slice(1).reduce(
    (sum, point, index) =>
      sum + Math.hypot(point[0] - endpoints[index][0], point[1] - endpoints[index][1], point[2] - endpoints[index][2]),
    0,
  )
  const texture = useMemo(() => {
    if (variant !== 'stripes') return null
    const t = cautionBase.clone()
    t.wrapS = t.wrapT = RepeatWrapping
    t.repeat.set(Math.max(0.18, totalLength / TAPE_SEGMENTS * 0.45), 1)
    t.needsUpdate = true
    return t
  }, [totalLength, variant])
  const textTexture = useMemo(() => {
    if (variant !== 'text') return null
    const t = cautionTextBase.clone()
    t.wrapS = t.wrapT = RepeatWrapping
    t.repeat.set(1, 1)
    t.needsUpdate = true
    return t
  }, [variant])

  const hoverIndex = useRef<number | null>(null)
  const motion = useRef(
    Array.from({ length: TAPE_SEGMENTS + 1 }, () => ({
      y: 0,
      z: 0,
      yVelocity: 0,
      zVelocity: 0,
    })),
  )
  const [hovered, setHovered] = useState(false)
  useCursor(hovered, INTERACTIVE_CURSOR)
  const ribbon = useMemo(() => {
    const geometry = new BufferGeometry()
    const positions = new Float32Array((TAPE_SEGMENTS + 1) * 2 * 3)
    const uvs = new Float32Array((TAPE_SEGMENTS + 1) * 2 * 2)
    const indices: number[] = []

    endpoints.forEach((point, index) => {
      const before = endpoints[Math.max(0, index - 1)]
      const after = endpoints[Math.min(TAPE_SEGMENTS, index + 1)]
      const tangentLength = Math.hypot(after[0] - before[0], after[1] - before[1]) || 1
      const normalX = -(after[1] - before[1]) / tangentLength
      const normalY = (after[0] - before[0]) / tangentLength
      const vertex = index * 2
      positions.set([point[0] + normalX * 0.1, point[1] + normalY * 0.1, point[2]], vertex * 3)
      positions.set([point[0] - normalX * 0.1, point[1] - normalY * 0.1, point[2]], (vertex + 1) * 3)
      uvs.set([index / TAPE_SEGMENTS, 1], vertex * 2)
      uvs.set([index / TAPE_SEGMENTS, 0], (vertex + 1) * 2)
    })

    for (let index = 0; index < TAPE_SEGMENTS; index++) {
      const current = index * 2
      const next = current + 2
      indices.push(current, current + 1, next, current + 1, next + 1, next)
    }

    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    geometry.setAttribute('uv', new BufferAttribute(uvs, 2))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    return geometry
  }, [endpoints])

  useEffect(() => () => ribbon.dispose(), [ribbon])

  // A single ribbon is deformed through its internal control points. This keeps
  // the vinyl visually continuous while preserving fixed tie points and a low
  // per-frame cost.
  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const active = hoverIndex.current
    const positions = ribbon.getAttribute('position') as BufferAttribute

    endpoints.forEach((point, index) => {
      const isTiedEnd = index === 0 || index === TAPE_SEGMENTS
      const distance = active === null ? Infinity : Math.abs(index - active)
      const influence = isTiedEnd ? 0 : Math.exp(-(distance * distance) / 3.2)
      const targetY = -influence * 0.085
      const targetZ = influence * 0.06
      const state = motion.current[index]

      state.yVelocity += (targetY - state.y) * 58 * dt
      state.zVelocity += (targetZ - state.z) * 58 * dt
      const damping = Math.exp(-11 * dt)
      state.yVelocity *= damping
      state.zVelocity *= damping
      state.y += state.yVelocity * dt
      state.z += state.zVelocity * dt

      const before = endpoints[Math.max(0, index - 1)]
      const after = endpoints[Math.min(TAPE_SEGMENTS, index + 1)]
      const tangentLength = Math.hypot(after[0] - before[0], after[1] - before[1]) || 1
      const normalX = -(after[1] - before[1]) / tangentLength
      const normalY = (after[0] - before[0]) / tangentLength
      const vertex = index * 2
      positions.setXYZ(vertex, point[0] + normalX * 0.1, point[1] + normalY * 0.1 + state.y, point[2] + state.z)
      positions.setXYZ(vertex + 1, point[0] - normalX * 0.1, point[1] - normalY * 0.1 + state.y, point[2] + state.z)
    })
    positions.needsUpdate = true
    ribbon.computeVertexNormals()
  })

  return (
    <>
      <mesh
        geometry={ribbon}
        castShadow
        receiveShadow
        onPointerOver={(event) => {
          event.stopPropagation()
          hoverIndex.current = Math.round((event.uv?.x ?? 0.5) * TAPE_SEGMENTS)
          setHovered(true)
        }}
        onPointerMove={(event) => {
          event.stopPropagation()
          hoverIndex.current = Math.round((event.uv?.x ?? 0.5) * TAPE_SEGMENTS)
        }}
        onPointerOut={(event) => {
          event.stopPropagation()
          hoverIndex.current = null
          setHovered(false)
        }}
      >
        {variant === 'stripes' ? (
          <meshStandardMaterial map={texture} metalness={0.28} roughness={0.3} side={DoubleSide} />
        ) : (
          <meshStandardMaterial color="#e5af25" metalness={0.28} roughness={0.3} side={DoubleSide} />
        )}
      </mesh>
      {variant === 'text' && textTexture && (
        <mesh geometry={ribbon} renderOrder={1}>
          <meshBasicMaterial
            map={textTexture}
            transparent
            side={DoubleSide}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </mesh>
      )}
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
          <meshStandardMaterial color="#c7bea9" metalness={0.2} roughness={0.65} />
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

// the countdown lives inside a real gold frame, like the artworks on the other walls
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
      {/* Warm metallic base plus raised highlight rails: a reflective gilt frame. */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[frameW, frameH, 0.14]} />
        <meshPhysicalMaterial
          color="#a97927"
          metalness={0.82}
          roughness={0.2}
          clearcoat={0.72}
          clearcoatRoughness={0.12}
        />
      </mesh>
      <mesh position={[0, 0, 0.078]} receiveShadow>
        <boxGeometry args={[w, h, 0.035]} />
        <meshStandardMaterial color="#f5f0e5" roughness={0.72} />
      </mesh>
      {[
        [0, frameH / 2 - 0.045, frameW - 0.1, 0.045],
        [0, -frameH / 2 + 0.045, frameW - 0.1, 0.045],
        [-frameW / 2 + 0.045, 0, 0.045, frameH - 0.1],
        [frameW / 2 - 0.045, 0, 0.045, frameH - 0.1],
      ].map(([x, y, railW, railH], index) => (
        <mesh key={index} position={[x, y, 0.091]}>
          <boxGeometry args={[railW, railH, 0.028]} />
          <meshPhysicalMaterial
            color="#f0cf78"
            metalness={0.9}
            roughness={0.12}
            clearcoat={0.9}
            clearcoatRoughness={0.08}
          />
        </mesh>
      ))}
      <mesh position={[0, frameH / 2 - 0.082, 0.108]}>
        <planeGeometry args={[frameW - 0.24, 0.026]} />
        <meshBasicMaterial color="#fff3bd" transparent opacity={0.5} depthWrite={false} />
      </mesh>

      <Text
        font={FONT_SANS}
        fontSize={0.15}
        letterSpacing={0.22}
        color={MUTED}
        anchorX="center"
        position={[0, h / 2 - 0.32, 0.115]}
      >
        TNES FULL LAUNCH IN
      </Text>

      {parts.map((value, i) => (
        <group key={UNITS[i]} position={[UNIT_X[i], -0.05, 0.115]}>
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
          position={[x, -0.04, 0.115]}
        >
          :
        </Text>
      ))}
    </group>
  )
}

export function ComingSoonWall() {
  const parts = useCountdown()
  const isMobile = useGalleryStore((s) => s.isMobile)

  return (
    <group position={[0, 0, 0.06]}>
      <CountdownFrame position={[0, 0.3, 0]} parts={parts} />

      {/* mobile centres on just the countdown + notify; the street signage and
          hazard tape live off-screen at the sides, so drop them to keep it clean */}
      {!isMobile && (
        <>
          <PostSign x={-3.35} plateY={1.3} lines={['WORK', 'IN PROGRESS']} />
          <PostSign x={3.35} plateY={0.1} lines={['COMING', 'SOON']} />
          <AFrameSign position={[-3.1, 0, 0.4]} />

          <CautionTape from={[-4.3, -0.392, 0.55]} to={[4.3, -1.168, 0.55]} variant="stripes" />
          <CautionTape from={[-4.3, -1.344, 0.6]} to={[4.3, -0.696, 0.6]} variant="text" />
        </>
      )}

      <WallSubscribe position={[0, isMobile ? -0.4 : -0.48, 0.22]} />
    </group>
  )
}

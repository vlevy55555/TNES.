import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { CanvasTexture, Shape, type Group, type Mesh } from 'three'
import gsap from 'gsap'
import { artworks, INQUIRY_EMAIL, INQUIRY_TYPES } from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'

type Phase = 'idle' | 'sealing' | 'flying'

// ----- geometry (world units) -----
const HALF_W = 2.25
const HALF_H = 1.55
const FLAP_OPEN = Math.PI * 0.92 // hinged back over the top edge = open

// envelope front pocket: side + bottom flaps meeting in an upward V
const frontShape = (() => {
  const s = new Shape()
  s.moveTo(-HALF_W, -HALF_H)
  s.lineTo(HALF_W, -HALF_H)
  s.lineTo(HALF_W, -0.05)
  s.lineTo(0, -0.62)
  s.lineTo(-HALF_W, -0.05)
  s.closePath()
  return s
})()

// top flap: a triangle hinged at the top edge, apex pointing down
const flapShape = (() => {
  const s = new Shape()
  s.moveTo(-HALF_W, 0)
  s.lineTo(HALF_W, 0)
  s.lineTo(0, -1.3)
  s.closePath()
  return s
})()

// a faint "written letter" texture so the folding paper reads as a real letter
function makePaperTexture() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 620
  const ctx = c.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 0, 620)
  g.addColorStop(0, '#f8f3e8')
  g.addColorStop(1, '#efe6d2')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 512, 620)
  ctx.fillStyle = 'rgba(47,42,36,0.5)'
  ctx.font = '600 22px Georgia'
  ctx.fillText('TNES.', 54, 70)
  ctx.strokeStyle = 'rgba(182,155,94,0.6)'
  ctx.beginPath()
  ctx.moveTo(54, 92)
  ctx.lineTo(458, 92)
  ctx.stroke()
  ctx.fillStyle = 'rgba(47,42,36,0.16)'
  for (let i = 0; i < 12; i++) {
    const y = 140 + i * 36
    const w = i % 3 === 2 ? 180 : 404
    ctx.fillRect(54, y, w, 7)
  }
  return new CanvasTexture(c)
}

// the real 3D envelope + letter, animated by phase
function Letter3D({ phase, children }: { phase: Phase; children: React.ReactNode }) {
  const group = useRef<Group>(null)
  const paper = useRef<Mesh>(null)
  const flap = useRef<Group>(null)
  const seal = useRef<Mesh>(null)
  const paperTex = useMemo(makePaperTexture, [])

  // entrance: the whole letter rises up from below the frame into place
  useEffect(() => {
    const g = group.current
    if (!g) return
    g.position.y = -9
    const tw = gsap.to(g.position, { y: 0.05, duration: 0.85, ease: 'power3.out' })
    return () => { tw.kill() }
  }, [])

  useEffect(() => {
    if (phase === 'sealing' && paper.current && flap.current && seal.current) {
      const tl = gsap.timeline()
      // the sheet shrinks and fades down INTO the envelope (it's larger than the
      // envelope, so it can never just translate out of sight — scaling toward
      // the mouth + fading is what makes it vanish cleanly, nothing sticking out)
      tl.to(paper.current.position, { y: 0.05, z: 0.03, duration: 0.55, ease: 'power2.inOut' }, 0)
        .to(paper.current.scale, { x: 0.32, y: 0.32, z: 0.32, duration: 0.55, ease: 'power2.in' }, 0)
        .to(paper.current.rotation, { x: -0.6, duration: 0.55, ease: 'power2.in' }, 0)
        .to(paper.current.material, { opacity: 0, duration: 0.3, ease: 'power2.in' }, 0.28)
        // flap folds down over the top in 3D
        .to(flap.current.rotation, { x: 0, duration: 0.55, ease: 'power3.inOut' }, 0.32)
        // wax seal presses on
        .fromTo(
          seal.current.scale,
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 1, z: 1, duration: 0.32, ease: 'power2.out' },
          0.74,
        )
      return () => { tl.kill() }
    }
    if (phase === 'flying' && group.current) {
      gsap.killTweensOf(group.current.position) // drop any unfinished entrance tween
      const tl = gsap.timeline()
      // lifts toward the viewer, then tumbles away into the distance = sent
      tl.to(group.current.position, { z: 1.1, duration: 0.28, ease: 'power2.out' }, 0)
        .to(group.current.position, { z: -11, y: 3.4, duration: 0.85, ease: 'power2.in' }, 0.28)
        .to(group.current.rotation, { x: -0.6, y: 0.9, z: -0.15, duration: 1.05, ease: 'power2.in' }, 0)
      return () => { tl.kill() }
    }
  }, [phase])

  return (
    // depthTest off + renderOrder → the letter always draws ON TOP of the
    // gallery (never hidden behind a wall when the camera is zoomed in close);
    // renderOrder alone controls the internal back→pocket→flap→seal layering
    <group ref={group} position={[0, 0.05, 0]}>
      {/* envelope back — deep gold so it reads against the light gallery behind */}
      <mesh renderOrder={1}>
        <boxGeometry args={[HALF_W * 2, HALF_H * 2, 0.05]} />
        <meshBasicMaterial color="#9c7d42" depthTest={false} depthWrite={false} />
      </mesh>

      {/* the letter: interactive form at rest, textured paper once sealing */}
      {phase === 'idle' ? (
        children
      ) : (
        <mesh ref={paper} position={[0, 0.5, 0.18]} renderOrder={2}>
          <planeGeometry args={[2.9, 3.5]} />
          <meshBasicMaterial map={paperTex} transparent depthTest={false} depthWrite={false} />
        </mesh>
      )}

      {/* envelope front pocket (in front of the tucked paper) */}
      <mesh position={[0, 0, 0.09]} renderOrder={3}>
        <shapeGeometry args={[frontShape]} />
        <meshBasicMaterial color="#b0904e" depthTest={false} depthWrite={false} />
      </mesh>

      {/* top flap — hinged at the top edge, open at rest (lightest → catches "light") */}
      <group ref={flap} position={[0, HALF_H, 0.11]} rotation={[FLAP_OPEN, 0, 0]}>
        <mesh renderOrder={4}>
          <shapeGeometry args={[flapShape]} />
          <meshBasicMaterial color="#c2a25c" side={2} depthTest={false} depthWrite={false} />
        </mesh>
        {/* wax seal at the flap tip — a flattened gold blob */}
        <mesh ref={seal} position={[0, -0.9, 0.05]} scale={0} renderOrder={5}>
          <sphereGeometry args={[0.16, 24, 24]} />
          <meshBasicMaterial color="#b98d33" depthTest={false} depthWrite={false} />
        </mesh>
      </group>
    </group>
  )
}

// pins the letter a fixed distance in front of the LIVE gallery camera — it lives
// in the gallery's own scene, so the background is never touched or re-rendered
function LetterRig({ children }: { children: React.ReactNode }) {
  const rig = useRef<Group>(null)
  useFrame(({ camera }) => {
    const g = rig.current
    if (!g) return
    g.position.copy(camera.position)
    g.quaternion.copy(camera.quaternion)
    g.translateZ(-6.6)
  })
  return (
    <group ref={rig}>
      {/* invisible catcher: no dimming, just stops clicks from reaching the gallery */}
      <mesh position={[0, 0, 0.3]} onPointerDown={(e) => e.stopPropagation()}>
        <planeGeometry args={[80, 50]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {children}
    </group>
  )
}

// Lives directly in the gallery scene, pinned in front of the live gallery
// camera — one scene, one camera, so the background is never altered.
export function InquiryLetter() {
  const open = useGalleryStore((s) => s.inquiryOpen)
  const workId = useGalleryStore((s) => s.inquiryWorkId)
  const close = useGalleryStore((s) => s.closeInquiry)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [type, setType] = useState<string>(INQUIRY_TYPES[0])
  const [interest, setInterest] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const timers = useRef<number[]>([])

  useEffect(() => {
    if (!open) return
    const work = artworks.find((a) => a.id === workId)
    setName('')
    setEmail('')
    setPhone('')
    setType(INQUIRY_TYPES[0])
    setInterest(work ? `${work.title}. ${work.subtitle}` : '')
    setMessage('')
    setError('')
    setPhase('idle')
  }, [open, workId])

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  if (!open) return null

  const work = artworks.find((a) => a.id === workId)

  const send = () => {
    const lines = [
      `Name: ${name.trim()}`,
      `Email: ${email.trim()}`,
      ...(phone.trim() ? [`Phone: ${phone.trim()}`] : []),
      `Inquiry type: ${type}`,
      ...(interest.trim() ? [`Work of interest: ${interest.trim()}`] : []),
      '',
      message.trim() || '(no message)',
    ]
    const subject = `TNES inquiry — ${type}${work ? ` — ${work.title}` : ''}`
    window.location.href =
      `mailto:${INQUIRY_EMAIL}?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(lines.join('\n'))}`
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (phase !== 'idle') return
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Add your name and a valid email to send.')
      return
    }
    setError('')

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      send()
      timers.current.push(window.setTimeout(close, 200))
      return
    }

    setPhase('sealing')
    timers.current.push(
      window.setTimeout(send, 1000),
      window.setTimeout(() => setPhase('flying'), 1050),
      window.setTimeout(close, 2200),
    )
  }

  const form = (
    <Html transform position={[0, 0.35, 0.2]} scale={0.19} zIndexRange={[20, 0]} pointerEvents="auto">
      <form className="letter3d-form" onSubmit={submit} noValidate>
        <button type="button" className="letter-close" onClick={close} aria-label="Close">
          ✕
        </button>

        <header className="letter-head">
          <span className="letter-mark">TNES.</span>
          <span className="letter-kicker">Private inquiry</span>
        </header>

        <div className="letter-fields">
          <label className="letter-field">
            <span>Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </label>

          <label className="letter-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
            />
          </label>

          <div className="letter-row">
            <label className="letter-field">
              <span>Phone <em>· optional</em></span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 555 5555" />
            </label>

            <label className="letter-field">
              <span>Inquiry</span>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {INQUIRY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="letter-field">
            <span>Work of interest <em>· optional</em></span>
            <input value={interest} onChange={(e) => setInterest(e.target.value)} placeholder="Which piece?" />
          </label>

          <label className="letter-field">
            <span>Message</span>
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what you're considering."
            />
          </label>
        </div>

        {error && <p className="letter-error">{error}</p>}

        <button type="submit" className="letter-send">
          Seal &amp; send
        </button>
      </form>
    </Html>
  )

  return (
    <LetterRig>
      <Letter3D phase={phase}>{form}</Letter3D>
    </LetterRig>
  )
}

import { useEffect, useRef } from 'react'
import {
  SIGNATURE_FILL_D,
  SIGNATURE_REVEAL_LUT,
  SIGNATURE_STROKE_D,
  SIGNATURE_STROKE_WIDTH,
  SIGNATURE_VIEWBOX,
} from '../../data/signaturePath'
import { SIGNATURE_WALL } from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'
import { introScrub } from './introScrub'

// area-linear timing curve: map scroll progress -> fraction of stroke drawn
const N = SIGNATURE_REVEAL_LUT.length
function drawnFraction(t: number) {
  const x = Math.min(1, Math.max(0, t)) * (N - 1)
  const i = Math.floor(x)
  if (i >= N - 1) return SIGNATURE_REVEAL_LUT[N - 1]
  return SIGNATURE_REVEAL_LUT[i] + (SIGNATURE_REVEAL_LUT[i + 1] - SIGNATURE_REVEAL_LUT[i]) * (x - i)
}

export function SignatureOverlay() {
  const currentWall = useGalleryStore((s) => s.currentWall)
  const introPlaying = useGalleryStore((s) => s.introPlaying)
  const brush = useRef<SVGPathElement>(null)
  const hint = useRef<HTMLDivElement>(null)
  const onWall = currentWall === SIGNATURE_WALL

  useEffect(() => {
    const el = brush.current
    if (!el) return
    // while the opening is armed, the signature tracks the scroll scrub every
    // frame — it writes on as you scroll down and un-writes as you scroll up
    if (introPlaying) {
      let raf = 0
      const tick = () => {
        const p = introScrub.progress
        el.style.strokeDashoffset = String(1 - drawnFraction(p))
        if (hint.current) hint.current.style.opacity = String(Math.max(0, 1 - p * 6))
        raf = requestAnimationFrame(tick)
      }
      tick()
      return () => cancelAnimationFrame(raf)
    }
    // opening consumed (or a later visit): show it whole
    el.style.strokeDashoffset = '0'
  }, [introPlaying])

  return (
    <div className={`signature-overlay ${onWall ? 'is-on' : ''}`} aria-hidden="true">
      <svg viewBox={SIGNATURE_VIEWBOX} preserveAspectRatio="xMidYMid meet">
        <defs>
          <mask id="sig-reveal" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse">
            <path
              ref={brush}
              d={SIGNATURE_STROKE_D}
              fill="none"
              stroke="#fff"
              strokeWidth={SIGNATURE_STROKE_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray="1 1"
              style={{ strokeDashoffset: 1 }}
            />
          </mask>
        </defs>
        <path className="sig-ink" d={SIGNATURE_FILL_D} fillRule="evenodd" mask="url(#sig-reveal)" />
      </svg>
      {introPlaying && onWall && (
        <div className="scroll-hint" ref={hint}>
          <span>scroll</span>
          <span className="scroll-hint-arrow">↓</span>
        </div>
      )}
    </div>
  )
}

import { useEffect, useRef } from 'react'
import {
  SIGNATURE_INK_H,
  SIGNATURE_INK_HREF,
  SIGNATURE_INK_TRANSFORM,
  SIGNATURE_INK_W,
  SIGNATURE_REVEAL_LUT,
  SIGNATURE_STROKE_D,
  SIGNATURE_STROKE_WIDTH,
  SIGNATURE_VIEWBOX,
} from '../../data/signaturePath'
import { VSL_URL } from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'

// same area-linear timing curve as the intro (constant ink speed)
const N = SIGNATURE_REVEAL_LUT.length
function drawnFraction(t: number) {
  const x = Math.min(1, Math.max(0, t)) * (N - 1)
  const i = Math.floor(x)
  if (i >= N - 1) return SIGNATURE_REVEAL_LUT[N - 1]
  return SIGNATURE_REVEAL_LUT[i] + (SIGNATURE_REVEAL_LUT[i + 1] - SIGNATURE_REVEAL_LUT[i]) * (x - i)
}

const WRITE_MS = 2400
const HOLD_MS = 650

/** Doorway exit: the signature writes itself (time-driven, no scroll), then
 *  the browser leaves for VSL. */
export function VslExitOverlay() {
  const active = useGalleryStore((s) => s.vslExitActive)
  const brush = useRef<SVGPathElement>(null)

  useEffect(() => {
    if (!active) return
    const el = brush.current
    if (!el) return
    const start = performance.now()
    let raf = 0
    let leave = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / WRITE_MS)
      el.style.strokeDashoffset = String(1 - drawnFraction(t))
      if (t < 1) raf = requestAnimationFrame(tick)
      else leave = window.setTimeout(() => window.location.assign(VSL_URL), HOLD_MS)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(leave)
    }
  }, [active])

  return (
    <div className={`vsl-exit ${active ? 'is-on' : ''}`} aria-hidden="true">
      <svg viewBox={SIGNATURE_VIEWBOX} preserveAspectRatio="xMidYMid meet">
        <defs>
          <mask id="vslx-ink-shape" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse">
            <g transform={SIGNATURE_INK_TRANSFORM}>
              <image
                href={SIGNATURE_INK_HREF}
                width={SIGNATURE_INK_W}
                height={SIGNATURE_INK_H}
                preserveAspectRatio="xMidYMid meet"
              />
            </g>
          </mask>
          <mask id="vslx-reveal" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse">
            <g mask="url(#vslx-ink-shape)">
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
            </g>
          </mask>
        </defs>
        <g className="sig-ink">
          <rect x="0" y="0" width="1110" height="626.25" mask="url(#vslx-reveal)" />
        </g>
      </svg>
    </div>
  )
}

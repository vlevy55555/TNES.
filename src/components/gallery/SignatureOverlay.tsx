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
import { SIGNATURE_WALL } from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'
import { archiveScrub, SCRUB_FORMED, SCRUB_SHRUNK } from './archiveScrub'

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
  const brush = useRef<SVGPathElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const onWall = currentWall === SIGNATURE_WALL

  useEffect(() => {
    const el = brush.current
    const svgEl = svg.current
    if (!el || !svgEl) return
    // on the opening wall the signature tracks the scroll scrub every frame:
    //   phase 1 [0, SCRUB_FORMED] — writes on as the visitor zooms out
    //   phase 2 [SCRUB_FORMED, 1] — shrinks + fades as the camera cranes to the archive
    if (onWall) {
      let raf = 0
      const tick = () => {
        const p = archiveScrub.progress
        el.style.strokeDashoffset = String(1 - drawnFraction(Math.min(1, p / SCRUB_FORMED)))
        const g = Math.max(0, Math.min(1, (p - SCRUB_FORMED) / (SCRUB_SHRUNK - SCRUB_FORMED)))
        svgEl.style.transform = `translateY(-3%) scale(${1 - g * 0.72})`
        svgEl.style.opacity = String(1 - g)
        raf = requestAnimationFrame(tick)
      }
      tick()
      return () => cancelAnimationFrame(raf)
    }
    // off the opening wall: reset (the container fades out via its own opacity)
    el.style.strokeDashoffset = '0'
    svgEl.style.transform = ''
    svgEl.style.opacity = ''
  }, [onWall])

  return (
    <div className={`signature-overlay ${onWall ? 'is-on' : ''}`} aria-hidden="true">
      <svg ref={svg} viewBox={SIGNATURE_VIEWBOX} preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* the ink shape: the original anti-aliased raster as a luminance mask */}
          <mask id="sig-ink-shape" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse">
            <g transform={SIGNATURE_INK_TRANSFORM}>
              <image
                href={SIGNATURE_INK_HREF}
                width={SIGNATURE_INK_W}
                height={SIGNATURE_INK_H}
                preserveAspectRatio="xMidYMid meet"
              />
            </g>
          </mask>
          {/* reveal = swept pen brush, clipped to the ink shape so only the real
              glyph (not the fat brush) is uncovered as it is "written" */}
          <mask id="sig-reveal" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse">
            <g mask="url(#sig-ink-shape)">
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
        {/* solid ink colour, revealed through the reveal mask; the halo filter on
            the group follows the masked glyph alpha (comes from .sig-ink) */}
        <g className="sig-ink">
          <rect x="0" y="0" width="1110" height="626.25" mask="url(#sig-reveal)" />
        </g>
      </svg>
    </div>
  )
}

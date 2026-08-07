import type { RefObject } from 'react'
import {
  SIGNATURE_INK_H,
  SIGNATURE_INK_HREF,
  SIGNATURE_INK_TRANSFORM,
  SIGNATURE_INK_W,
  SIGNATURE_STROKE_D,
  SIGNATURE_STROKE_WIDTH,
  SIGNATURE_VIEWBOX,
} from '../../data/signaturePath'

/**
 * The write-on signature, drawn by whoever holds `brushRef`: set that path's
 * `strokeDashoffset` from 1 (blank) to 0 (fully written). The VSL doorway drives
 * it on a clock, /about drives it on the scroll — the SVG is the same object, so
 * it lives here once.
 *
 * `id` namespaces the two masks: SVG mask ids are document-global, and two
 * instances sharing one id would have the second silently steal the first.
 */
export function SignatureInk({
  id,
  brushRef,
}: {
  id: string
  brushRef: RefObject<SVGPathElement | null>
}) {
  return (
    <svg viewBox={SIGNATURE_VIEWBOX} preserveAspectRatio="xMidYMid meet">
      <defs>
        <mask id={`${id}-ink-shape`} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse">
          <g transform={SIGNATURE_INK_TRANSFORM}>
            <image
              href={SIGNATURE_INK_HREF}
              width={SIGNATURE_INK_W}
              height={SIGNATURE_INK_H}
              preserveAspectRatio="xMidYMid meet"
            />
          </g>
        </mask>
        <mask id={`${id}-reveal`} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse">
          <g mask={`url(#${id}-ink-shape)`}>
            <path
              ref={brushRef}
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
        <rect x="0" y="0" width="1110" height="626.25" mask={`url(#${id}-reveal)`} />
      </g>
    </svg>
  )
}

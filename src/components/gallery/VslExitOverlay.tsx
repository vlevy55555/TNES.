import { useEffect, useRef } from 'react'
import { drawnFraction } from '../../data/signaturePath'
import { VSL_URL } from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'
import { SignatureInk } from '../ui/SignatureInk'

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
      <SignatureInk id="vslx" brushRef={brush} />
    </div>
  )
}

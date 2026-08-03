import { useEffect, useRef, type MouseEvent as ReactMouseEvent } from 'react'
import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import { useGalleryStore } from '../../store/useGalleryStore'

gsap.registerPlugin(CustomEase)
const EASE = CustomEase.create('prints-introduction', 'M0,0 C0.22,1 0.36,1 1,1')

/**
 * A first-arrival veil for Prints. It lives above the live canvas, so the
 * photographs, reflections and gallery chrome remain the real scene beneath it.
 */
export function GalleryInstructionOverlay() {
  const phase = useGalleryStore((s) => s.printsIntroPhase)
  const setPrintsIntroActive = useGalleryStore((s) => s.setPrintsIntroActive)
  const finishPrintsIntro = useGalleryStore((s) => s.finishPrintsIntro)
  const dismissPrintsIntro = useGalleryStore((s) => s.dismissPrintsIntro)
  const overlay = useRef<HTMLDivElement>(null)
  const title = useRef<HTMLHeadingElement>(null)
  const divider = useRef<HTMLDivElement>(null)
  const description = useRef<HTMLParagraphElement>(null)
  const hint = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (phase === 'hidden') return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const mobile = window.matchMedia('(max-width: 700px), (orientation: portrait)').matches
    const content = [title.current, divider.current, description.current, hint.current].filter(Boolean)
    const timing = reduced ? 0.16 : 0.8
    const veilFilter = reduced
      ? 'blur(0px) brightness(1.04)'
      : mobile
        ? 'blur(3px) brightness(1.1)'
        : 'blur(2px) brightness(1.08)'

    if (phase === 'entering') {
      gsap.set(overlay.current, {
        opacity: 0,
        backdropFilter: 'blur(0px) brightness(1)',
        webkitBackdropFilter: 'blur(0px) brightness(1)',
      })
      gsap.set(content, { opacity: 0, y: reduced ? 0 : 14, filter: reduced ? 'blur(0px)' : 'blur(6px)' })
      const enter = gsap.timeline({ defaults: { ease: EASE } })
      enter
        .to(overlay.current, {
          opacity: 1,
          backdropFilter: veilFilter,
          webkitBackdropFilter: veilFilter,
          duration: reduced ? 0.2 : 1.2,
        })
        .to(title.current, { opacity: 1, y: 0, filter: 'blur(0px)', duration: timing }, reduced ? 0 : 0.35)
        .to(divider.current, { opacity: 1, y: 0, filter: 'blur(0px)', duration: timing }, reduced ? '>' : 0.47)
        .to(description.current, { opacity: 1, y: 0, filter: 'blur(0px)', duration: timing }, reduced ? '>' : 0.59)
        .to(hint.current, { opacity: 0.7, y: 0, filter: 'blur(0px)', duration: timing }, reduced ? '>' : 0.73)
        .call(setPrintsIntroActive)
      return () => {
        enter.kill()
      }
    }

    if (phase === 'exiting') {
      const exit = gsap.timeline({ defaults: { ease: EASE } })
      const contentExit = { opacity: 0, y: reduced ? 0 : -10, filter: reduced ? 'blur(0px)' : 'blur(5px)', duration: reduced ? 0.1 : 0.45 }
      exit
        .to(hint.current, contentExit, 0)
        .to(description.current, contentExit, reduced ? 0 : 0.05)
        .to(divider.current, contentExit, reduced ? 0 : 0.1)
        .to(title.current, contentExit, reduced ? 0 : 0.15)
        .to(
          overlay.current,
          {
            opacity: 0,
            backdropFilter: 'blur(0px) brightness(1)',
            webkitBackdropFilter: 'blur(0px) brightness(1)',
            duration: reduced ? 0.2 : 0.9,
          },
          reduced ? 0 : 0.18,
        )
        .call(finishPrintsIntro)
      return () => {
        exit.kill()
      }
    }
  }, [finishPrintsIntro, phase, setPrintsIntroActive])

  useEffect(() => {
    if (phase !== 'active' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const pulse = gsap.to(hint.current, { opacity: 0.45, duration: 1.1, ease: 'sine.inOut', yoyo: true, repeat: -1 })
    return () => {
      pulse.kill()
    }
  }, [phase])

  if (phase === 'hidden') return null

  // The 3D frames are raycast targets rather than DOM nodes. The veil forwards
  // the click first, preserving a selected artwork; every other click simply
  // dismisses the introduction without opening anything.
  const forwardArtworkClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (phase === 'exiting') return
    const canvas = document.querySelector<HTMLCanvasElement>('.gallery-canvas canvas')
    if (canvas) {
      canvas.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: event.clientX,
          clientY: event.clientY,
          button: event.button,
        }),
      )
    }
    dismissPrintsIntro()
  }

  return (
    <div ref={overlay} className="gallery-instruction-overlay" onClick={forwardArtworkClick} role="presentation">
      <section className="gallery-instruction" aria-label="Choose a print to begin">
        <h1 ref={title} className="instruction-title">choose a print to begin.</h1>
        <div ref={divider} className="instruction-divider" aria-hidden="true">
          <span />
          <b>[O]</b>
          <span />
        </div>
        <p ref={description} className="instruction-description">
          each piece holds a story, a moment, a perspective.<br />
          click on any artwork to explore it closer.
        </p>
        <p ref={hint} className="instruction-hint"><i aria-hidden="true" /> click to continue</p>
      </section>
    </div>
  )
}

import { useLayoutEffect } from 'react'
import type { ReactNode, RefObject } from 'react'
import { gsap } from 'gsap'

/** The shared editorial entrance used by every textual group on the flat pages.
 * Each section owns one timeline, preventing the many captions in a long list
 * from creating competing triggers. */
export function useSectionTextReveal(
  sectionRef: RefObject<HTMLElement | null>,
  immediate = false,
  /** how far INTO the viewport the section must come before it plays. The
   *  default catches it at the bottom edge; a section that only appears once the
   *  screen above it has scrolled away needs a later mark, or its lines finish
   *  before anyone is looking at them. */
  rootMargin = '0px 0px -12% 0px',
) {
  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let observer: IntersectionObserver | undefined
    const context = gsap.context(() => {
      const text = gsap.utils.toArray<HTMLElement>('[data-home-text-reveal]', section)
      if (!text.length) return

      gsap.set(text, {
        // The mask has breathing room for glyph ascenders/descenders. Start
        // farther below it so that extra room never exposes text prematurely.
        yPercent: 130,
        rotationX: -28,
        scaleY: 1.08,
        opacity: 0,
        transformOrigin: '50% 100%',
      })

      const reveal = {
        yPercent: 0,
        rotationX: 0,
        scaleY: 1,
        opacity: 1,
        duration: 1.05,
        ease: 'expo.out',
        stagger: 0.07,
      }

      const play = () => gsap.to(text, reveal)
      if (immediate) {
        play()
        return
      }

      // The sections themselves already use IntersectionObserver for their
      // lifecycle. Triggering this timeline from the same viewport signal is
      // reliable even while the page changes its scrollable root.
      const sectionObserver = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return
          sectionObserver.disconnect()
          play()
        },
        { rootMargin },
      )
      observer = sectionObserver
      sectionObserver.observe(section)
    }, section)

    return () => {
      observer?.disconnect()
      context.revert()
    }
  }, [sectionRef, immediate, rootMargin])
}

export function RevealText({ children, block = false }: { children: ReactNode; block?: boolean }) {
  return (
    <span className={`text-reveal ${block ? 'text-reveal--block' : ''}`}>
      <span className="text-reveal__content" data-home-text-reveal>
        {children}
      </span>
    </span>
  )
}

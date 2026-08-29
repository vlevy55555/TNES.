import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ABOUT, VSL_URL } from '../data/artworks'
import { drawnFraction } from '../data/signaturePath'
import { SignatureInk } from '../components/ui/SignatureInk'
import { RevealText, useSectionTextReveal } from './reveal'
import { ShopFooter, ShopHeader } from './ShopChrome'
import './home.css'
import './shop.css'
import './about.css'

gsap.registerPlugin(ScrollTrigger)

// The name is set the way the text reference sets a title: one word per line,
// caps, stacked tight. Written out rather than split at render so the break
// never depends on the column width.
const NAME_LINES = ['victor', 'safdie', 'levy']

// Victor's second passage. The title is hand-broken so the rag never depends on
// the column width — each line is its own §5.1 mask, and a line that re-wrapped
// inside one would slide as a slab and get clipped.
const SPLIT_TITLE = ['the photograph', 'is what is left', 'of the looking.']
const SPLIT_COPY = [
  `no one goes back for a moment. stand in the same place a year later and it
   hands you something else. what is here is one person's record of time and
   space. not a group show, not a marketplace.`,
  `owning a piece is keeping the minute someone stopped, and deciding it was
   worth keeping. good or bad, nothing happens twice.`,
]

/**
 * Wraps a paragraph into lines of at most `max` characters. Every line becomes
 * its own §5.1 mask, which is what the reveal needs: one mask around a whole
 * paragraph would slide it as a slab, and the clip would eat the lines above.
 *
 * ponytail: mechanical rag, not typeset by hand — the landing hand-breaks its
 * four lines because it can. Hand-break these too if the ragging ever matters
 * more than keeping ABOUT.statement the single source of truth.
 */
const lines = (text: string, max: number) =>
  text.split(/\s+/).reduce<string[]>((out, word) => {
    const last = out[out.length - 1]
    if (last && (last + ' ' + word).length <= max) out[out.length - 1] = last + ' ' + word
    else out.push(word)
    return out
  }, [])

/** 0 before `a`, 1 after `b`, linear between — one scroll drives several moves. */
const between = (p: number, a: number, b: number) =>
  Math.min(1, Math.max(0, (p - a) / (b - a)))

/**
 * The opening, in one sticky stage and one scrubbed trigger. Seven states, in
 * the order the storyboard sets them:
 *
 *   1    his name and his sentence alone; the photograph is off frame below
 *   2    it climbs into shot from the bottom
 *   3    the photograph covers the screen; the words have faded out under it
 *   4-5  it pulls back to a small grey plate and his hand writes over it
 *   6-7  the sticky releases and the locked pair rides up, handing the screen
 *        to the next section
 *
 * Nothing is pinned by script and nothing hijacks the wheel: the stage is
 * `position: sticky` and every value below is read off one scroll progress.
 */
const SHRUNK = 0.4
// the photograph starts a full screen below its cover position — off frame,
// so the first thing the page shows is his name and nothing else
const RISE = 100

function Opening() {
  const track = useRef<HTMLDivElement>(null)
  const words = useRef<HTMLElement>(null)
  const brush = useRef<SVGPathElement>(null)

  // his name is the first thing on the page — the §5.1 reveal runs on load
  useSectionTextReveal(words, true)

  useLayoutEffect(() => {
    const root = track.current
    const ink = brush.current
    const lede = words.current
    const media = root?.querySelector<HTMLElement>('.about__hero-media')
    if (!root || !ink || !media || !lede) return

    // reduced motion: the CSS lays the three pieces out as a plain stack, so all
    // the script owes it is a finished signature
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      ink.style.strokeDashoffset = '0'
      return
    }

    const trigger = ScrollTrigger.create({
      trigger: root,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate: (self) => {
        const p = self.progress

        // 1-3 · the photograph climbs into full bleed, and the words go out
        // under it — they must be gone before it pulls back, or they would
        // reappear around the shrinking plate
        const rise = between(p, 0, 0.4)
        const shrink = between(p, 0.48, 0.7)
        lede.style.opacity = String(1 - between(p, 0.16, 0.34))

        // 4-5 · zoom out, colour draining with it
        media.style.transform = `translateY(${RISE * (1 - rise)}%) scale(${1 - (1 - SHRUNK) * shrink})`
        media.style.filter = `grayscale(${shrink}) brightness(${1 - 0.12 * shrink})`

        // His hand, over the plate while it is still shrinking. It lands on the
        // last frame of the track on purpose: any range left after the final
        // stroke is scroll that buys nothing — the picture starts leaving the
        // moment it is signed.
        ink.style.strokeDashoffset = String(1 - drawnFraction(between(p, 0.55, 0.98)))
      },
    })

    return () => trigger.kill()
  }, [])

  return (
    <div className="about__hero" ref={track}>
      <div className="about__hero-stage">
        {/* one left-set column: label, name, the line under it, his sentence —
            every line of it entering through the §5.1 mask */}
        <section className="about__lede" ref={words}>
          <div className="about__who">
            <p className="about__eyebrow"><RevealText>[about]</RevealText></p>

            <h1 className="about__name">
              {NAME_LINES.map((line) => (
                <RevealText block key={line}>{line}</RevealText>
              ))}
            </h1>

            <p className="about__role"><RevealText>{ABOUT.role}</RevealText></p>
            <p className="about__statement">
              {lines(ABOUT.statement, 34).map((line) => (
                <RevealText block key={line}>{line}</RevealText>
              ))}
            </p>
          </div>
        </section>

        <figure className="about__hero-media">
          <img
            src="/about/stamping.webp"
            alt="Victor stamping and signing a print at the studio desk"
            fetchPriority="high"
          />
        </figure>

        <div className="about__hero-sig" aria-label="Victor Safdie Levy">
          <SignatureInk id="about-sig" brushRef={brush} />
        </div>
      </div>
    </div>
  )
}

export default function About() {
  const split = useRef<HTMLElement>(null)
  const closer = useRef<HTMLElement>(null)

  // Both of these arrive right after the opening lets go of the screen, so the
  // default mark would play them while they are still a sliver at the bottom —
  // by the time they are readable the lines have already settled. Hold until
  // each is a third of the way up the screen.
  useSectionTextReveal(split, false, '0px 0px -38% 0px')
  useSectionTextReveal(closer, false, '0px 0px -30% 0px')

  // §5.2, twice: the first plate is above the fold and opens on mount, the
  // subway plate waits for its own section to arrive.
  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const context = gsap.context(() => {
      const curtain = (figure: string, trigger?: Element) => {
        // held to the same later mark as that section's words, so the curtain
        // and the lines arrive as one moment instead of the photo opening first
        const scrollTrigger = trigger && { trigger, start: 'top 64%', once: true }
        gsap.from(figure, {
          clipPath: 'inset(0 0 100% 0)',
          duration: 1.15,
          ease: 'expo.out',
          scrollTrigger,
        })
        gsap.from(`${figure} img`, {
          scale: 1.12,
          yPercent: 7,
          duration: 1.35,
          ease: 'expo.out',
          scrollTrigger,
        })
      }

      if (split.current) curtain('.about__split-figure', split.current)
    })

    return () => context.revert()
  }, [])

  return (
    <main className="shop about">
      <ShopHeader current="about" />

      <Opening />

      {/* The landing's split, mirrored: photo on one side, words on the other. */}
      <section className="about__split" ref={split}>
        <figure className="about__split-figure">
          <img src="/about/subway.webp" alt="Victor on a subway platform, print under his arm" loading="lazy" />
        </figure>

        <div className="about__split-body">
          <h2 className="about__split-title">
            {SPLIT_TITLE.map((line) => (
              <RevealText block key={line}>{line}</RevealText>
            ))}
          </h2>
          {/* one <p> per passage — `lines` collapses whitespace, so a single
              paragraph would swallow the break between them */}
          {SPLIT_COPY.map((passage) => (
            <p className="about__split-copy" key={passage}>
              {lines(passage, 40).map((line) => (
                <RevealText block key={line}>{line}</RevealText>
              ))}
            </p>
          ))}
        </div>
      </section>

      <section className="about__closer" ref={closer}>
        <a className="about__vsl" href={VSL_URL} target="_blank" rel="noopener noreferrer">
          <RevealText>{ABOUT.cta} <span className="shop__arrow" aria-hidden="true">→</span></RevealText>
        </a>
        <p className="shop__meta">
          <RevealText>the mind behind the studio</RevealText>
        </p>
      </section>

      <ShopFooter />
    </main>
  )
}

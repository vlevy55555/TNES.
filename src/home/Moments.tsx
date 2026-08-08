import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { INQUIRY_EMAIL } from '../data/artworks'
import { RevealText, useSectionTextReveal } from './reveal'
import EarlyAccess from './EarlyAccess'
import { ShopFooter, ShopHeader } from './ShopChrome'
import './home.css'
import './shop.css'
import './moments.css'

gsap.registerPlugin(ScrollTrigger, SplitText)

/**
 * /moments — the dated record of where TNES. has been shown.
 *
 * The content comes from the reference boards in `reference-moments/`. The
 * staging is Indigo Laboratory's: every entry is a chapter that opens on a
 * sticky full-bleed cover, hands the screen to an opaque body that slides over
 * it, and dims the chapter behind it as it goes. Typography stays TNES —
 * Helvetica Neue and the mono specimen voice the shop already uses.
 *
 * The four Indigo moves this page borrows, and nothing else:
 *   · reveal  — masked, `expo.out`, its own duration, never scrubbed
 *   · travel  — scrubbed 1–1.5, only ever moves what is already visible
 *   · state   — a bare ScrollTrigger toggling a class or reading progress
 *   · the sticky cover pair, held by CSS, not by `pin`
 */

// ponytail: the real installation photographs do not exist yet. These are the
// v1 prints, cycled — swap the pool for `/moments/<slug>/…` when they land.
const POOL = [
  'appenzell_alpinelake_2025_v1.webp',
  'baleia_biker_2025_v1.webp',
  'calpe_murallaroja_2025_v1.webp',
  'ditchplains_far_2026_v1.webp',
  'florence_dogman_2025_v1.webp',
  'gozo_cavegirl_2025_v1.webp',
  'ipanema_riorunner_2025_v1.webp',
  'ischia_mezzatorre_2025_v1.webp',
  'moreira_crowdedbeach_2025_v1.webp',
  'murren_foggycows_2025_v1.webp',
  'paracas_flatdunes_2025_v1.webp',
  'stpeterspool_hero_2025_v1.webp',
]
const photo = (i: number) => `/artworks/v1/${POOL[((i % POOL.length) + POOL.length) % POOL.length]}`

type Moment = {
  index: string
  place: string
  /** the one word that sets this entry apart in the list — `current`, `next` */
  status?: string
  /** hand-broken, one mask per line — the landing breaks `nothing / happens /
   *  twice` the same way, so the rag never depends on the column width */
  titleLines: string[]
  date: string
  abstract: string
  links: { label: string; href: string }[]
  /** where this chapter starts drawing from the pool */
  seed: number
}

const MOMENT_ENTRIES: Moment[] = [
  {
    index: '01',
    place: 'new york',
    titleLines: ['nyc soft', 'launch.'],
    date: '03/27/26',
    abstract:
      'the first private introduction to the work, shown to a short list of people in one evening.',
    links: [{ label: 'shop the archive', href: '/shop' }],
    seed: 0,
  },
  {
    index: '02',
    place: 'são paulo',
    titleLines: ['encontros.'],
    date: '04/28/26',
    abstract: 'the first room where the TNES. world took physical shape.',
    links: [{ label: 'shop the archive', href: '/shop' }],
    seed: 3,
  },
  {
    index: '03',
    place: 'east hampton, new york',
    status: 'current',
    titleLines: ['4th annual', 'east hampton', 'art affair,', 'herrick park.'],
    date: '06/27–06/28/26',
    abstract:
      'works from the archive on view for a temporary summer presentation — two days, one wall, printed for the room.',
    links: [
      {
        label: 'inquire about works on view',
        href: `mailto:${INQUIRY_EMAIL}?subject=Works on view — east hampton art affair`,
      },
      { label: 'shop the archive', href: '/shop' },
    ],
    seed: 6,
  },
  {
    index: '04',
    place: 'new york',
    status: 'next',
    titleLines: ['seasonal', 'release.'],
    date: 'next',
    abstract:
      'six works from the archive and one exclusive object, released together and never reissued.',
    links: [
      { label: 'count down to the release', href: '#release' },
      { label: 'shop the archive', href: '/shop' },
    ],
    seed: 9,
  },
]

const TILES = 5

/** §reveal — one masked line at a time, once, and never again on the way back. */
function revealLines(scope: Element) {
  gsap.utils.toArray<HTMLElement>('[data-lines]', scope).forEach((element) => {
    SplitText.create(element, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 100,
          duration: 0.7,
          stagger: 0.1,
          ease: 'expo.out',
          scrollTrigger: { trigger: element, start: 'top 85%', once: true },
        }),
    })
  })
}

function Intro() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const section = root.current
    if (!section) return

    const context = gsap.context(() => {
      const inner = section.querySelector<HTMLElement>('.moments__intro-inner')
      const sides = section.querySelectorAll<HTMLElement>('.moments__side')
      revealLines(section)

      // The two plates are the first thing on the page, so they enter on their
      // own clock — there is no scroll above them to drive a scrub.
      gsap.from(sides, {
        yPercent: 60,
        opacity: 0,
        duration: 1.4,
        stagger: 0.15,
        ease: 'expo.out',
      })

      // …and the column travels as the section leaves, which is the only part
      // of Indigo's intro that has scroll to spend.
      if (inner) {
        gsap.to(inner, {
          y: -180,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: 'bottom top',
            scrub: 1.2,
            invalidateOnRefresh: true,
          },
        })
      }
    }, section)

    return () => context.revert()
  }, [])

  return (
    <section className="moments__intro" ref={root}>
      <div className="moments__sides" aria-hidden="true">
        <figure className="moments__side">
          <img src={photo(11)} alt="" loading="lazy" decoding="async" />
        </figure>
        <figure className="moments__side">
          <img src={photo(4)} alt="" loading="lazy" decoding="async" />
        </figure>
      </div>

      <div className="moments__intro-inner">
        <p className="moments__pretitle" data-lines>
          [moments]
        </p>
        <h1 className="moments__display" data-lines>
          moments.
        </h1>
        <p className="moments__abstract" data-lines>
          the work exists first as a room. a dated record of where TNES. has been shown, and where it
          goes next.
        </p>
      </div>
    </section>
  )
}

function Chapter({ moment }: { moment: Moment }) {
  const root = useRef<HTMLElement>(null)
  const head = useRef<HTMLElement>(null)

  // The display uses the landing's own entrance, unchanged: the shared §5.1
  // reveal that carries `nothing / happens / twice`. Held to a later mark than
  // the default because the head arrives right as the cover lets go — at the
  // default the lines would finish while still a sliver at the bottom.
  useSectionTextReveal(head, false, '0px 0px -28% 0px')

  useLayoutEffect(() => {
    const chapter = root.current
    if (!chapter) return

    const context = gsap.context(() => {
      const q = gsap.utils.selector(chapter)
      const mobile = window.matchMedia('(max-width: 63.99em)').matches
      revealLines(chapter)

      // §travel — the cover settles over one whole viewport of scroll. Indigo
      // scales up TO the resting frame; here it has to settle DOWN to it, or
      // the shrinking plate exposes the paper behind a full-bleed photograph.
      gsap.from(q('.moment__cover img'), {
        scale: 1.15,
        ease: 'power1.out',
        scrollTrigger: {
          trigger: chapter,
          start: 'top bottom',
          end: () => 'top+=100% bottom',
          scrub: true,
          invalidateOnRefresh: true,
        },
      })

      gsap.from(q('.moment__cover-line'), {
        yPercent: 110,
        duration: 1,
        stagger: 0.08,
        ease: 'expo.out',
        scrollTrigger: { trigger: chapter, start: 'top top', invalidateOnRefresh: true },
      })

      // §travel — the chapter behind sinks and recedes while this cover
      // arrives. This is what stitches the list into one descent instead of
      // four pages. Indigo drains its dark chapter with `brightness(0.3)`; on
      // white paper that only turns it charcoal, so here it dissolves back into
      // the sheet instead.
      const previous = chapter.previousElementSibling
      if (previous?.classList.contains('moments__chapter')) {
        gsap.set(previous, { opacity: 1 })
        gsap.to(previous, {
          y: '33vh',
          opacity: 0.25,
          scrollTrigger: {
            trigger: chapter,
            start: 'top+=25% bottom',
            end: () => 'top+=150% bottom',
            scrub: true,
            invalidateOnRefresh: true,
          },
        })
      }

      // §reveal — the columns and the plates inside them travel opposite ways,
      // so each photograph slides within its own window as the window moves.
      const [row] = q('.moment__row')
      if (row) {
        const columnMark = mobile ? 'top+=25% center' : 'top center'
        const plateMark = mobile ? 'center center' : 'top center'
        const entrance = { duration: 1, ease: 'expo.out' } as const

        gsap.from(q('.moment__side--a'), {
          ...entrance,
          yPercent: 75,
          scrollTrigger: { trigger: row, start: columnMark, invalidateOnRefresh: true },
        })
        gsap.from(q('.moment__side--a img'), {
          ...entrance,
          yPercent: 102,
          scrollTrigger: { trigger: row, start: plateMark, invalidateOnRefresh: true },
        })
        gsap.from(q('.moment__side--b'), {
          ...entrance,
          yPercent: -75,
          scrollTrigger: { trigger: row, start: columnMark, invalidateOnRefresh: true },
        })
        gsap.from(q('.moment__side--b img'), {
          ...entrance,
          yPercent: -102,
          scrollTrigger: { trigger: row, start: plateMark, invalidateOnRefresh: true },
        })

        // the centre plate never slides — it only breathes, so the eye has one
        // fixed thing to read the two moving columns against
        gsap.from(q('.moment__main img'), {
          scale: 1.14,
          ease: 'none',
          scrollTrigger: {
            trigger: row,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2,
            invalidateOnRefresh: true,
          },
        })
      }

      // §reveal — the five-up row, one plate behind the next
      const [tiles] = q('.moment__tiles')
      if (tiles) {
        gsap.from(q('.moment__tile img'), {
          yPercent: 102,
          duration: 1,
          stagger: 0.08,
          ease: 'expo.out',
          scrollTrigger: { trigger: tiles, start: 'top 85%', once: true },
        })
      }

    }, chapter)

    return () => context.revert()
  }, [])

  return (
    <section className="moments__chapter" ref={root}>
      <div className="moment__cover">
        <img src={photo(moment.seed)} alt="" loading="lazy" decoding="async" />
        <p className="moment__cover-name">
          <span className="moment__cover-mask">
            <span className="moment__cover-line">{moment.place}</span>
          </span>
          <span className="moment__cover-mask">
            <span className="moment__cover-line">{moment.date}</span>
          </span>
        </p>
      </div>

      <div className="moment__body">
        <section className="moment__head" ref={head}>
          <div className="moment__inner">
            {/* place and date carry the entry — no floating status chips, no
                bracketed mark loose in the margin */}
            <p className="moment__pre">
              <span className="moment__place">
                <b>{moment.index}</b>
                {moment.place}
              </span>
              <span className="moment__date">{moment.date}</span>
            </p>

            <h2 className="moment__title" aria-label={moment.titleLines.join(' ')}>
              {moment.titleLines.map((line) => (
                <RevealText block key={line}>
                  {line}
                </RevealText>
              ))}
            </h2>

            <p className="moment__abstract" data-lines>
              {moment.abstract}
            </p>

            <div className="moment__row">
              <div className="moment__side moment__side--a">
                <img src={photo(moment.seed + 1)} alt="" loading="lazy" decoding="async" />
              </div>
              <div className="moment__main">
                <img src={photo(moment.seed + 2)} alt="" loading="lazy" decoding="async" />
              </div>
              <div className="moment__side moment__side--b">
                <img src={photo(moment.seed + 3)} alt="" loading="lazy" decoding="async" />
              </div>
            </div>
          </div>
        </section>

        <section className="moment__gallery">
          <div className="moment__inner">
            <h3 className="moment__gallery-title" data-lines>
              {moment.status === 'next' ? 'what the release will hold' : 'from the room'}
            </h3>

            <ul className="moment__tiles">
              {Array.from({ length: TILES }, (_, i) => (
                <li className="moment__tile" key={i}>
                  <figure>
                    <img
                      src={photo(moment.seed + 4 + i)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  </figure>
                  <figcaption>plate {String(i + 1).padStart(2, '0')}</figcaption>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="moment__outro">
          <div className="moment__inner">
            <p className="moment__links">
              {moment.links.map((link) => (
                <a key={link.label} href={link.href}>
                  {link.label} <span className="shop__arrow" aria-hidden="true">→</span>
                </a>
              ))}
            </p>
          </div>
        </section>
      </div>
    </section>
  )
}

export default function Moments() {
  useLayoutEffect(() => {
    // Indigo's own two lines of scroll hygiene: never catch up after a dropped
    // frame, and never rebuild the page because a mobile URL bar moved.
    gsap.ticker.lagSmoothing(0)
    ScrollTrigger.config({ ignoreMobileResize: true })

    // Reduced motion does not mean no animation — it means all of it, now. Each
    // tween still runs its callbacks and lands on its final state.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.globalTimeline.timeScale(1000)
      ScrollTrigger.defaults({ fastScrollEnd: true })
    }
  }, [])

  return (
    <main className="shop moments">
      <ShopHeader current="moments" />

      <Intro />

      {MOMENT_ENTRIES.map((moment) => (
        <Chapter key={moment.index} moment={moment} />
      ))}

      <section className="moments__release" id="release">
        <EarlyAccess
          showCountdown
          className="moments__signup"
          eyebrow="seasonal release 01"
          title="the archive opens in."
          copy="release announced to the list first."
        />
      </section>

      <ShopFooter />
    </main>
  )
}

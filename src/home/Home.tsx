import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { artworks } from '../data/artworks'
import { cms, linesOf, sized } from '../data/cms'
import { RevealText, useSectionTextReveal } from './reveal'
import { useCartCount } from '../store/useCartStore'
import { SiteNav } from './SiteNav'
import { ShopFooter } from './ShopChrome'
import EarlyAccess from './EarlyAccess'
import './home.css'
import './shop.css'

gsap.registerPlugin(ScrollTrigger)

// The works the hero cycles, in the order the Studio's Home lists them. The
// first one is the signature work and carries the [O] instead of its title —
// it is the brand's own entry in the list, and behaves exactly like the others.
const HERO_AUTOPLAY_MS = 5_000

const projects = cms.home.heroIds.flatMap((id) => {
  const a = artworks.find((w) => w.id === id)
  // a work unpublished in the Studio drops out of the hero instead of breaking it
  if (!a) return []
  return [{
    id: a.id,
    // year comes from the artwork's own subtitle ("Malta · 2025") — one source
    // of truth, no second list to keep in sync
    title: a.title,
    year: a.subtitle.match(/\d{4}/)?.[0] ?? '',
    poster: a.image,
  }]
})

// ponytail: hrefs are placeholders until each destination exists — only cart and
// the gallery are real today.
const NAV = [
  { label: 'works', href: '/works' },
  { label: 'catalogs', href: '/works#catalogs' },
  { label: 'moments', href: '/moments' },
  { label: 'about', href: '/about' },
  { label: 'cart', href: '/cart' },
]

// ponytail: no mobile crops and no loop videos exist yet — one poster per work.
// Add <source media> + <video> back when the assets do.

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mq = window.matchMedia(query)
    const apply = () => setMatches(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [query])

  return matches
}

/**
 * Fires once, when the element first enters the viewport. Drives both the
 * reveal-on-scroll transitions and the deferred mount of the 3D studio, so the
 * heavy scene never loads for someone who does not scroll that far.
 */
function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setSeen(true)
        io.disconnect()
      },
      { rootMargin: '0px 0px -12% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return [ref, seen] as const
}

const STATEMENT_TITLE_LINES = linesOf(cms.home.statementTitle)
const STATEMENT_COPY_LINES = linesOf(cms.home.statementCopy)
const STATEMENT_ARTWORK =
  artworks.find((work) => work.id === cms.home.statementArtworkId) ?? artworks.find((work) => work.id === projects[0]?.id) ?? artworks[0]

function Statement() {
  const ref = useRef<HTMLElement>(null)
  useSectionTextReveal(ref)

  useLayoutEffect(() => {
    const section = ref.current
    if (!section || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const context = gsap.context(() => {
      const titleLines = gsap.utils.toArray<HTMLElement>('.statement__title-reveal')
      const copyLines = gsap.utils.toArray<HTMLElement>('.statement__copy-reveal')
      const media = section.querySelector<HTMLElement>('.statement__media')
      const mediaImage = section.querySelector<HTMLImageElement>('.statement__media img')

      gsap.set(titleLines, {
        yPercent: 112,
        rotationX: -28,
        scaleY: 1.08,
        opacity: 0,
        transformOrigin: '50% 100%',
      })
      gsap.set(copyLines, {
        yPercent: 112,
        rotationX: -28,
        scaleY: 1.08,
        opacity: 0,
        transformOrigin: '50% 100%',
      })
      gsap.set(media, { clipPath: 'inset(0 0 100% 0)' })
      gsap.set(mediaImage, { scale: 1.12, yPercent: 7 })

      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top 72%',
            toggleActions: 'play none none reverse',
          },
        })
        .to(titleLines, {
          yPercent: 0,
          rotationX: 0,
          scaleY: 1,
          opacity: 1,
          duration: 1.05,
          ease: 'expo.out',
          stagger: 0.12,
        })
        .to(
          copyLines,
          {
            yPercent: 0,
            rotationX: 0,
            scaleY: 1,
            opacity: 1,
            duration: 1.05,
            ease: 'expo.out',
            stagger: 0.12,
          },
          '-=0.52',
        )
        .to(media, { clipPath: 'inset(0 0 0% 0)', duration: 1.15, ease: 'expo.out' }, 0.18)
        .to(mediaImage, { scale: 1, yPercent: 0, duration: 1.35, ease: 'expo.out' }, 0.18)
    }, section)

    return () => context.revert()
  }, [])

  return (
    <section className="statement" ref={ref}>
      <h1 className="statement__line" aria-label={STATEMENT_TITLE_LINES.join(' ')}>
        {STATEMENT_TITLE_LINES.map((line) => (
          <span className="statement__line-mask" key={line}>
            <span className="statement__title-reveal">{line}</span>
          </span>
        ))}
      </h1>
      <p className="statement__sub">
        {STATEMENT_COPY_LINES.map((line) => (
          <span className="statement__copy-mask" key={line}>
            <span className="statement__copy-reveal">{line}</span>
          </span>
        ))}
      </p>
      <div className="statement__actions" aria-label="Ações principais">
        <a href="/works"><RevealText>works <span aria-hidden="true">→</span></RevealText></a>
      </div>
      <div className="statement__artwork">
        <figure className="statement__media">
          <img src={STATEMENT_ARTWORK.image} alt={`${STATEMENT_ARTWORK.title}, ${STATEMENT_ARTWORK.subtitle}`} />
        </figure>
        <div className="statement__artwork-caption">
          <RevealText>{STATEMENT_ARTWORK.title}</RevealText>
        </div>
      </div>
    </section>
  )
}

// px per frame at 60fps
const CAROUSEL_SPEED = 0.55

const ratio = (work: (typeof artworks)[number]) => work.size[0] / work.size[1]
const isWide = (work: (typeof artworks)[number]) => ratio(work) >= 1
const workHref = (work: (typeof artworks)[number]) => work.shopifyHandle ? `/works/${work.id}` : '/works'

/**
 * The works are grouped by orientation in `artworks` (they hang that way on the
 * Prints wall). Interleaving them here makes the row alternate tall / wide
 * instead of running in blocks of the same shape.
 */
const CAROUSEL = (() => {
  const wide = artworks.filter(isWide)
  const tall = artworks.filter((w) => !isWide(w))
  const out: typeof artworks = []
  while (wide.length || tall.length) {
    if (wide.length) out.push(wide.shift()!)
    if (tall.length) out.push(tall.shift()!)
  }
  return out
})()

function SelectedWorks() {
  const [ref, seen] = useInView<HTMLElement>()
  useSectionTextReveal(ref)
  const track = useRef<HTMLUListElement>(null)
  const [paused, setPaused] = useState(false)
  const [expandedWorkId, setExpandedWorkId] = useState<string | null>(null)
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const canHover = useMediaQuery('(hover: hover) and (pointer: fine)')

  // ponytail: the track is a plain scroll container — the arrows nudge it and
  // the loop below drifts it, so manual scroll and autoplay share one mechanism
  useEffect(() => {
    const el = track.current
    // rAF is already throttled to zero in a hidden tab, so nothing drifts
    // while the page is in the background
    if (!el || !seen || paused || reduceMotion) return

    let position = el.scrollLeft
    let raf = 0

    const step = () => {
      // the list is rendered twice; wrapping at the halfway mark puts us back
      // on an identical frame, so the loop is invisible
      const half = el.scrollWidth / 2
      // an arrow click or a manual scroll moved it out from under us
      if (Math.abs(el.scrollLeft - position) > 2) position = el.scrollLeft
      position = position + CAROUSEL_SPEED >= half ? 0 : position + CAROUSEL_SPEED
      el.scrollLeft = position
      raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [seen, paused, reduceMotion])

  return (
    <section className={`works reveal ${seen ? 'reveal--in' : ''}`} ref={ref}>
      <header className="works__head">
        <h2>
          <RevealText block>{cms.home.selectedWorksTitle}</RevealText>
        </h2>

      </header>

      <ul
        className="works__track"
        ref={track}
      >
        {[...CAROUSEL, ...CAROUSEL].map((work, i) => {
          const isClone = i >= CAROUSEL.length
          return (
            <li
              key={`${work.id}-${i}`}
              className={`works__item ${expandedWorkId === work.id ? 'works__item--expanded' : ''}`}
              aria-hidden={isClone || undefined}
              style={{
                '--frame-width': `calc(var(--long-edge) * ${Math.min(ratio(work), 1)})`,
                '--frame-height': `calc(var(--long-edge) / ${Math.max(ratio(work), 1)})`,
              } as React.CSSProperties}
              onPointerEnter={() => {
                if (!canHover) return
                // The duplicated half receives the same class, keeping both
                // halves the same width and the infinite-scroll seam intact.
                setExpandedWorkId(work.id)
                setPaused(true)
              }}
              onPointerLeave={() => {
                if (!canHover) return
                setExpandedWorkId(null)
                setPaused(false)
              }}
            >
              {/* Every print's long edge is the same, the way a rack of one
                  paper size hangs — a landscape is wide and short, a portrait
                  tall and narrow, and the row runs ragged.
                  Both axes are computed: leaving one on `auto` makes the item
                  size to max-content, which for an <img> is the file's own
                  pixel width — thousands of px wide. */}
              <a className="works__link" href={workHref(work)} tabIndex={isClone ? -1 : undefined}>
                <div className="works__frame">
                  <img src={sized(work.image, 1200)} alt={isClone ? '' : work.title} loading="lazy" />
                </div>

                <p className="works__title"><RevealText>{work.title}</RevealText></p>
                <p className="works__meta"><RevealText>{work.subtitle}</RevealText></p>
              </a>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

// Kept ready for a future relaunch, but intentionally not rendered on the site.
export function TheStudio() {
  const [ref, seen] = useInView<HTMLElement>()
  useSectionTextReveal(ref)

  return (
    <section className="studio" id="studio" ref={ref}>
      <div className="studio__head">
        <h2 className="studio__title">
          <RevealText block>the</RevealText>
          <RevealText block>studio.</RevealText>
        </h2>
        <div className="studio__visit-wrap">
          <span className="studio__preview">preview</span>
          <a className="studio__visit" href="/gallery">
            <RevealText>visit studio <span aria-hidden="true">→</span></RevealText>
          </a>
        </div>
      </div>
      <div className="studio__stage">
        {seen && (
          <video
            className="studio__video"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            aria-label="A galeria virtual do estúdio TNES."
          >
            <source src="/videos/studio-banner.mp4" type="video/mp4" />
          </video>
        )}
      </div>
      <EarlyAccess />
    </section>
  )
}

export default function Home({ dark = false }: { dark?: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const swipeStartX = useRef<number | null>(null)
  const didSwipe = useRef(false)
  const heroRef = useRef<HTMLElement>(null)
  const canHover = useMediaQuery('(hover: hover) and (pointer: fine)')
  const cartCount = useCartCount()
  useSectionTextReveal(heroRef, true)

  const active = projects[activeIndex]

  const go = (delta: number) =>
    setActiveIndex((i) => (i + delta + projects.length) % projects.length)

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(1)
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') go(-1)
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (e.pointerType === 'mouse') return
    didSwipe.current = false
    swipeStartX.current = e.clientX
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (swipeStartX.current === null) return
    const distance = e.clientX - swipeStartX.current
    swipeStartX.current = null
    if (Math.abs(distance) > 50) didSwipe.current = true
    if (distance < -50) go(1)
    if (distance > 50) go(-1)
  }

  // warm the next poster so hovering down the list never shows a blank frame
  useEffect(() => {
    const next = projects[(activeIndex + 1) % projects.length]
    new Image().src = next.poster
  }, [activeIndex])

  // Reuse the manual navigation state and restart the full ten-second viewing time after
  // every change. Do not consume slides while the browser tab is hidden.
  useEffect(() => {
    let timer: number | undefined

    const schedule = () => {
      window.clearTimeout(timer)
      if (document.hidden) return
      timer = window.setTimeout(() => go(1), HERO_AUTOPLAY_MS)
    }

    schedule()
    document.addEventListener('visibilitychange', schedule)

    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', schedule)
    }
  }, [activeIndex])

  // When arriving from another page (for example, the shop navbar), the Home
  // tree may mount after the browser's native fragment jump has already run.
  useEffect(() => {
    if (window.location.hash !== '#studio') return

    const frame = requestAnimationFrame(() => {
      document.getElementById('studio')?.scrollIntoView({ block: 'start' })
    })

    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <main className={`home ${dark ? 'home--black' : ''}`}>
      <section
        className="hero"
        ref={heroRef}
        tabIndex={0}
        aria-label="Obras em destaque"
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          swipeStartX.current = null
        }}
      >
        <div className="hero__background" aria-hidden="true">
          {projects.map((project, index) => (
            <div
              key={project.id}
              className={`hero__slide hero__slide--${project.id} ${index === activeIndex ? 'hero__slide--active' : ''}`}
            >
              <img
                className="hero__poster"
                src={project.poster}
                alt=""
                draggable="false"
                fetchPriority={index === 0 ? 'high' : 'auto'}
              />
            </div>
          ))}
        </div>

        <div className="hero__overlay" aria-hidden="true" />

        <a
          className="hero__artwork-link"
          href={`/works/${active.id}`}
          aria-label={`View ${active.title} in the shop`}
          onClick={(event) => {
            if (!didSwipe.current) return
            event.preventDefault()
            didSwipe.current = false
          }}
        />

        <header className="hero__header">
          <a className="hero__logo" href="/">
            <RevealText>TNES.</RevealText>
          </a>

          {/* the same nav every other screen renders — cart carries its count
              here too, and on a phone it collapses into the three-line menu */}
          <SiteNav
            items={NAV.map((item) =>
              item.label === 'cart' && cartCount > 0
                ? { ...item, label: `cart (${cartCount})` }
                : item,
            )}
            className="hero__nav"
            reveal
          />
        </header>

        <nav className="hero__list" aria-label="Selecionar obra">
          {projects.map((project, index) => {
            const isMark = index === 0
            return (
              <button
                key={project.id}
                type="button"
                className={`hero__item ${isMark ? 'hero__item--mark' : ''}`}
                aria-pressed={index === activeIndex}
                aria-label={isMark ? project.title : undefined}
                onClick={() => {
                  window.location.href = `/works/${project.id}`
                }}
                onPointerEnter={() => canHover && setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
              >
                <span className="hero__title"><RevealText>{isMark ? '[O]' : project.title}</RevealText></span>
                {!isMark && <span className="hero__year"><RevealText>{project.year}</RevealText></span>}
              </button>
            )
          })}
        </nav>

      </section>

      <Statement />
      <SelectedWorks />
      <EarlyAccess />
      <ShopFooter />
    </main>
  )
}

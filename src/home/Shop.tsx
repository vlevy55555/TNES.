import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { artworks } from '../data/artworks'
import { cms, sized } from '../data/cms'
import { RevealText, useSectionTextReveal } from './reveal'
import { ShopFooter, ShopHeader } from './ShopChrome'
import Catalog, { isCatalogSlug } from './Catalog'
import './home.css'
import './shop.css'
import './works.css'

gsap.registerPlugin(ScrollTrigger)

// Every frame the store sells, one drawn at random each time a work is hovered.
const HOVER_FRAMES = ['black', 'white', 'aluminium', 'glass'] as const

const PLACES = ['all', 'south america', 'europe', 'north america']
const SCENE_FILTERS = ['all', 'beach', 'water', 'desert', 'alpine', 'landscape', 'street', 'architecture', 'people', 'animals', 'objects']

// Region and scenes are set per work in the Studio; the order is the Studio's.
const regionOf = new Map(cms.artworks.map((work) => [work.id, work.region]))
const scenesOf = new Map(cms.artworks.map((work) => [work.id, work.scenes]))

const works = artworks.map((work) => {
  const [where, year] = work.subtitle.split(' · ')
  return {
    ...work,
    place: regionOf.get(work.id) ?? 'elsewhere',
    scenes: scenesOf.get(work.id) ?? [],
    meta: `${where.toLowerCase()} · ${year}`,
    ratio: work.size[0] / work.size[1],
    href: `/works/${work.id}`,
  }
})

// The catalogs the Studio marks "show on /works", each linking to its own page.
const VISIBLE_CATALOGS = cms.catalogs.filter((catalog) => catalog.showOnWorks)

function Filter({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string
  onChange: (next: string) => void
}) {
  return (
    <div className="shop__filter">
      <span className="shop__filter-label"><RevealText>{label}</RevealText></span>
      <div className="shop__pills">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={`shop__pill ${value === option ? 'shop__pill--on' : ''}`}
            aria-pressed={value === option}
            onClick={() => onChange(option)}
          >
            <RevealText>{option}</RevealText>
          </button>
        ))}
      </div>
    </div>
  )
}

function ShopIndex() {
  const head = useRef<HTMLElement>(null)
  const grid = useRef<HTMLDivElement>(null)
  const catalogs = useRef<HTMLElement>(null)
  const [place, setPlace] = useState('all')
  const [scene, setScene] = useState('all')
  useSectionTextReveal(head, true)
  useSectionTextReveal(catalogs)

  useEffect(() => {
    if (window.location.hash !== '#catalogs') return

    const scrollToCatalogs = () => catalogs.current?.scrollIntoView({ block: 'start' })
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(scrollToCatalogs)
    })
    const timer = window.setTimeout(scrollToCatalogs, 350)
    window.addEventListener('load', scrollToCatalogs, { once: true })

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(timer)
      window.removeEventListener('load', scrollToCatalogs)
    }
  }, [])

  const shown = useMemo(
    () =>
      works.filter(
        (work) =>
          (place === 'all' || work.place === place) &&
          (scene === 'all' || work.scenes.includes(scene)),
      ),
    [place, scene],
  )

  // The image curtain of design.md §5.2, fired per batch as the grid scrolls in.
  // Re-runs on filter change: the swapped-in items need their own start state.
  useLayoutEffect(() => {
    const root = grid.current
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const context = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>('.shop__item', root)
      if (!items.length) return

      gsap.set('.shop__figure', { clipPath: 'inset(0 0 100% 0)' })
      gsap.set('.shop__figure img', { scale: 1.08 })
      gsap.set('.shop__caption, .shop__meta', { opacity: 0, y: 12 })

      ScrollTrigger.batch(items, {
        start: 'top 90%',
        once: true,
        onEnter: (batch) => {
          const at = (selector: string) => batch.map((item) => item.querySelector(selector))
          gsap.to(at('.shop__figure'), {
            clipPath: 'inset(0 0 0% 0)',
            duration: 1.15,
            ease: 'expo.out',
            stagger: 0.08,
          })
          gsap.to(at('.shop__figure img'), {
            scale: 1,
            duration: 1.35,
            ease: 'expo.out',
            stagger: 0.08,
          })
          gsap.to([...at('.shop__caption'), ...at('.shop__meta')], {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: 'expo.out',
            stagger: 0.05,
            delay: 0.12,
          })
        },
      })
      // a filter can shorten the page under the scroll position
      ScrollTrigger.refresh()
    }, root)

    return () => context.revert()
  }, [place, scene])

  return (
    <main className="shop works-page">
      <ShopHeader showSpecialPrices />

      <section className="shop__intro" ref={head}>
        <p className="works-page__eyebrow">{cms.works.eyebrow}</p>
        <h1 className="shop__title"><RevealText block>{cms.works.title}</RevealText></h1>
        <p className="works-page__description">{cms.works.description}</p>

        <nav className="shop__tabs" aria-label="Seções da loja">
          <a className="shop__tab shop__tab--on" href="#works"><RevealText>available works</RevealText></a>
          <a className="shop__tab" href="#catalogs"><RevealText>catalogs</RevealText></a>
        </nav>

        <details className="works-page__filters">
          <summary>filter works <span aria-hidden="true">+</span></summary>
          <Filter label="place" options={PLACES} value={place} onChange={setPlace} />
          <Filter label="scene" options={SCENE_FILTERS} value={scene} onChange={setScene} />
        </details>

        <p className="shop__count" aria-live="polite">
          {shown.length} {shown.length === 1 ? 'work' : 'works'}
        </p>
      </section>

      <div className="shop__grid" id="works" ref={grid}>
        {shown.map((work) => {
          return (
            <a
              key={work.id}
              className="shop__item"
              href={work.href}
              style={{ '--ar': String(work.ratio) } as React.CSSProperties}
            >
              <div
                className="works-page__frame-hover"
                onMouseEnter={(event) => {
                  event.currentTarget.dataset.frame = HOVER_FRAMES[Math.floor(Math.random() * HOVER_FRAMES.length)]
                }}
              >
                <figure className="shop__figure">
                  <img
                    src={sized(work.image, 1400)}
                    alt={`${work.title}, ${work.subtitle}`}
                    width={Math.round(work.size[0] * 1000)}
                    height={Math.round(work.size[1] * 1000)}
                    loading="lazy"
                    decoding="async"
                  />
                </figure>
              </div>
              <p className="shop__caption">
                <span>{work.title}</span>
                <span className="works-page__view">view work</span>
              </p>
              {/* the catalogs' own affordance, on every work: the arrow steps
                  right as the photograph pushes in under the cursor */}
              <p className="shop__meta">
                {work.meta}
              </p>
              <p className="works-page__medium">archival pigment print</p>
            </a>
          )
        })}
      </div>

      <section className="shop__catalogs" id="catalogs" ref={catalogs}>
        <h2 className="shop__section-title"><RevealText block>{cms.works.catalogsTitle}</RevealText></h2>
        <p className="shop__section-sub">
          <RevealText>{cms.works.catalogsSubtitle}</RevealText>
        </p>

        <div className="shop__catalog-grid">
          {VISIBLE_CATALOGS.map((catalog) => (
            <a className="shop__catalog" key={catalog.slug} href={`/works/catalogs/${catalog.slug}`}>
              <div className="shop__catalog-media">
                <figure className="shop__figure">
                  {catalog.cardImage && <img src={sized(catalog.cardImage.src, 1400)} alt={catalog.cardImage.alt || catalog.title} loading="lazy" />}
                  {catalog.password && <span className="shop__catalog-private">[O] private</span>}
                </figure>
                {catalog.cardCaption && <p className="shop__catalog-caption">{catalog.cardCaption}</p>}
              </div>
              <div className="shop__catalog-info">
                <p className="shop__catalog-title">{catalog.title}.</p>
                {catalog.description && (
                  <p className="shop__catalog-description">{catalog.description}</p>
                )}
                {catalog.cardDetails && (
                  <p className="shop__catalog-details">{catalog.cardDetails}</p>
                )}
                {catalog.cardNote && (
                  <p className="shop__catalog-note">{catalog.cardNote}</p>
                )}
                <p className="shop__catalog-link">
                  view catalog <span className="shop__arrow" aria-hidden="true">→</span>
                </p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <ShopFooter />
    </main>
  )
}

export default function Shop() {
  const catalog = window.location.pathname.startsWith('/works/catalogs/')
    ? window.location.pathname.split('/')[3]
    : new URLSearchParams(window.location.search).get('catalog')
  return isCatalogSlug(catalog) ? <Catalog slug={catalog} /> : <ShopIndex />
}

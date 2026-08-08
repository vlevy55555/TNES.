import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { artworks } from '../data/artworks'
import { money, type ShopProduct } from '../lib/shopify'
import { useProducts } from '../lib/useProduct'
import { RevealText, useSectionTextReveal } from './reveal'
import { catalogHref, PRICE, ShopFooter, ShopHeader } from './ShopChrome'
import './home.css'
import './shop.css'

gsap.registerPlugin(ScrollTrigger)

// The country is the last segment of each work's own subtitle ("Gozo, Malta ·
// 2025"), so the region below is the only thing this screen has to state.
const REGION: Record<string, string> = {
  Brazil: 'south america',
  Peru: 'south america',
  Malta: 'europe',
  Italy: 'europe',
  Spain: 'europe',
  Portugal: 'europe',
  Switzerland: 'europe',
  'New York': 'north america',
}

// What is in the frame. Shop-only metadata — the 3D room never asks for it.
const SCENES: Record<string, string[]> = {
  'the-pool': ['water', 'landscape'],
  runner: ['beach', 'people'],
  'wied-il-ghasri': ['water', 'people', 'landscape'],
  lauterbrunnen: ['alpine', 'landscape'],
  'praia-da-baleia': ['beach', 'people'],
  'playa-roja': ['landscape', 'water'],
  'calpe-muralla-roja': ['architecture'],
  'moreira-crowded-beach': ['beach', 'people'],
  'florence-dogman': ['street', 'people'],
  'ischia-mezzatorre': ['water', 'landscape'],
  'ditch-plains-far': ['water', 'landscape'],
  'appenzell-alpine-lake': ['alpine', 'water', 'landscape'],
}

const PLACES = ['all', 'south america', 'europe', 'north america']
const SCENE_FILTERS = ['all', 'beach', 'water', 'alpine', 'landscape', 'street', 'architecture', 'people']

const works = artworks.map((work) => {
  const [where, year] = work.subtitle.split(' · ')
  const country = where.split(', ').pop()!
  return {
    ...work,
    place: REGION[country] ?? 'elsewhere',
    scenes: SCENES[work.id] ?? [],
    meta: `${where.toLowerCase()} · ${year}`,
    ratio: work.size[0] / work.size[1],
    href: `/shop/${work.id}`,
  }
})

const HANDLES = works.map((w) => w.shopifyHandle).filter((h): h is string => !!h)

/** The cheapest purchasable size — what "from" means on a grid card. */
const fromPrice = (product?: ShopProduct) => {
  const sellable = product?.variants.filter((v) => v.available) ?? []
  if (!sellable.length) return PRICE
  const cheapest = sellable.reduce((a, b) => (b.price < a.price ? b : a))
  return money(cheapest.price, cheapest.currency)
}

// two large pieces standing in for the wider bodies of work
const CATALOGS = [
  {
    title: 'the hamptons',
    image: works.find((w) => w.id === 'playa-roja')!.image,
    description: 'the body of work shown for the east coast summer — coastline, light, and the hours around it. available as custom prints framed to the room.',
    details: '36 works  ·  seasonal selection',
  },
  { title: 'selected works', image: '/catalogs/product4-cows-tall.webp' },
]

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

export default function Shop() {
  const head = useRef<HTMLElement>(null)
  const grid = useRef<HTMLDivElement>(null)
  const catalogs = useRef<HTMLElement>(null)
  const [place, setPlace] = useState('all')
  const [scene, setScene] = useState('all')
  // every card's price at once: one round-trip per handle, deduped and cached in
  // shopify.ts, so opening a work later is already paid for
  const products = useProducts(HANDLES)

  useSectionTextReveal(head, true)
  useSectionTextReveal(catalogs)

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
      gsap.set('.shop__figure img', { scale: 1.12, yPercent: 7 })
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
            yPercent: 0,
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
    <main className="shop">
      <ShopHeader />

      <section className="shop__intro" ref={head}>
        <h1 className="shop__title"><RevealText block>shop.</RevealText></h1>

        <nav className="shop__tabs" aria-label="Seções da loja">
          <a className="shop__tab shop__tab--on" href="#works"><RevealText>available works</RevealText></a>
          <a className="shop__tab" href="#catalogs"><RevealText>catalogs</RevealText></a>
        </nav>

        <Filter label="place" options={PLACES} value={place} onChange={setPlace} />
        <Filter label="scene" options={SCENE_FILTERS} value={scene} onChange={setScene} />

        <p className="shop__count" aria-live="polite">
          {shown.length} {shown.length === 1 ? 'work' : 'works'}
        </p>
      </section>

      <div className="shop__grid" id="works" ref={grid}>
        {shown.map((work) => (
          <a
            key={work.id}
            className="shop__item"
            href={work.href}
            style={{ '--ar': String(work.ratio) } as React.CSSProperties}
          >
            <figure className="shop__figure">
              <img src={work.image} alt={`${work.title}, ${work.subtitle}`} loading="lazy" />
            </figure>
            <p className="shop__caption">
              <span>{work.title.toLowerCase()}.</span>
              <span className="shop__price">
                from {fromPrice(work.shopifyHandle ? products[work.shopifyHandle] : undefined)}
              </span>
            </p>
            {/* the catalogs' own affordance, on every work: the arrow steps
                right as the photograph pushes in under the cursor */}
            <p className="shop__meta">
              {work.meta} <span className="shop__arrow" aria-hidden="true">→</span>
            </p>
          </a>
        ))}
      </div>

      <section className="shop__catalogs" id="catalogs" ref={catalogs}>
        <h2 className="shop__section-title"><RevealText block>catalogs.</RevealText></h2>
        <p className="shop__section-sub">
          <RevealText>a wider body of work than the shop selection — shown for custom prints, interiors, and collectors working at scale.</RevealText>
        </p>

        <div className="shop__catalog-grid">
          {CATALOGS.map((catalog) => (
            <a className="shop__catalog" key={catalog.title} href={catalogHref(catalog.title)}>
              <figure className="shop__figure">
                <img src={catalog.image} alt={catalog.title} loading="lazy" />
              </figure>
              <div className="shop__catalog-info">
                <p className="shop__catalog-title">{catalog.title}.</p>
                {catalog.description && (
                  <p className="shop__catalog-description">{catalog.description}</p>
                )}
                {catalog.details && (
                  <p className="shop__catalog-details">{catalog.details}</p>
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

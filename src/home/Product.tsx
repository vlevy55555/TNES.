import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { artworks, standardPrintSizes } from '../data/artworks'
import {
  FRAME_FINISHES,
  FRAME_MATERIALS,
  frameLabelFor,
  frameMaterialOf,
  frameStyleFor,
  frameStyleOf,
  type FrameFinish,
  type FrameMaterial,
  type FrameStyle,
} from '../data/artworks'
import { defaultSelection, findVariant } from '../lib/shopify'
import { useProductState } from '../lib/useProduct'
import { useContactStore } from '../store/useContactStore'
import { useFavoritesStore } from '../store/useFavoritesStore'
import { trackAnalyticsEvent } from '../analytics/clarity'
import { RevealText, useSectionTextReveal } from './reveal'
import { ShopFooter, ShopHeader } from './ShopChrome'
import WallBuilder from './WallBuilder'
import { dims, EYE, sizeIndexOf, type Piece } from '../lib/wall'
import './home.css'
import './shop.css'


const ProductFrame = lazy(() => import('./ProductFrame'))

const sizeKey = (value: string) => value.toLowerCase().replace(/×/g, 'x').replace(/[^0-9x]/g, '')

export default function Product({ id }: { id: string }) {
  const work = artworks.find((a) => a.id === id)
  const stage = useRef<HTMLElement>(null)
  const options = useRef<HTMLElement>(null)
  const related = useRef<HTMLElement>(null)
  const mediaPointer = useRef<{ x: number; y: number } | null>(null)
  const { product, loading: productLoading } = useProductState(work?.shopifyHandle)
  const openContact = useContactStore((s) => s.openContact)
  const isFavorite = useFavoritesStore((s) => s.ids.includes(id))
  const toggleFavorite = useFavoritesStore((s) => s.toggle)

  // Live options win over the static cm list: Shopify is what the checkout
  // honours, so a size shown here has to be a size you can actually order.
  const frameOption = product?.options.find((o) => /frame/i.test(o.name))
  const sizeOption = product?.options.find((o) => o !== frameOption)
  const liveSizes = useMemo(() => sizeOption?.values.filter(Boolean) ?? [], [sizeOption])
  const sizes = liveSizes.length > 0
    ? liveSizes
    : !productLoading && work
      ? standardPrintSizes(work)
      : []
  const [size, setSize] = useState('')
  const [frame, setFrame] = useState<FrameStyle>('unframed')
  const [finish, setFinish] = useState<FrameFinish>('black')
  const material = frameMaterialOf(frame)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [show3D, setShow3D] = useState(false)
  const [wallOpen, setWallOpen] = useState(false)
  const isPortrait = !!work && work.size[1] > work.size[0]

  useEffect(() => setLightboxOpen(false), [work?.id])
  useEffect(() => setShow3D(false), [work?.id])

  useEffect(() => {
    if (!lightboxOpen) return
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [lightboxOpen])

  // open on the middle size — the smallest reads as the cheap option
  useEffect(() => {
    if (product && sizeOption && liveSizes.length > 0) {
      const initial = defaultSelection(product)
      const portraitSize = isPortrait
        ? liveSizes.find((value) => sizeKey(value).startsWith('30x20'))
        : undefined
      setSize(portraitSize ?? initial[sizeOption.name] ?? liveSizes[0] ?? '')
      setFrame(frameOption ? frameStyleOf(initial[frameOption.name]) : 'unframed')
    } else if (!productLoading) {
      const staticSizes = work ? standardPrintSizes(work) : []
      const preferredSize = isPortrait ? '30x20' : '20x30'
      setSize(staticSizes.find((value) => sizeKey(value).startsWith(preferredSize)) ?? staticSizes[0] ?? '')
      setFrame('unframed')
    } else {
      // Do not paint static placeholder sizes while the real Shopify options load.
      setSize('')
      setFrame('unframed')
    }
  }, [product, sizeOption, work, isPortrait, productLoading, liveSizes])

  // The room's three mouldings are a preview, not a merchandised option in this
  // store — but if Shopify ever sells the frame, keep the bought variant in sync.
  const frameValue = frameOption?.values.find((v) => frameStyleOf(v) === frame)
  const variantFor = (value: string) =>
    product && sizeOption
      ? findVariant(product, {
          [sizeOption.name]: value,
          ...(frameOption && frameValue ? { [frameOption.name]: frameValue } : {}),
        })
      : null
  const variant = variantFor(size)

  // what is changed on the wall comes back to this page's selector
  const syncFromWall = (pieces: Piece[]) => {
    const hung = pieces.find((p) => p.key === 'this')
    if (!hung) return
    setFinish(hung.finish)
    setFrame(frameStyleFor(hung.material, hung.finish))
    const match = sizes.find((value) => sizeIndexOf(value) === hung.size)
    if (match) setSize(match)
  }

  useSectionTextReveal(stage, true)
  useSectionTextReveal(options, true)

  // A fade, not the §5.2 curtain: a clip-path here would keep masking the frame
  // once it turns. The print rises into place instead.
  useLayoutEffect(() => {
    const section = stage.current
    if (!section || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const context = gsap.context(() => {
      gsap.from('.product__media', { opacity: 0, y: 26, duration: 1.15, ease: 'expo.out' })
    }, section)

    return () => context.revert()
  }, [id])

  useLayoutEffect(() => {
    const section = related.current
    if (!section) return
    const items = section.querySelectorAll('.product__related-work')
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(items, { clearProps: 'all' })
      return
    }

    gsap.set(items, { opacity: 0, y: 16, scale: 0.9 })
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      gsap.to(items, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.65,
        stagger: 0.09,
        ease: 'power3.out',
        clearProps: 'transform',
      })
    }, { threshold: 0.18 })
    observer.observe(section)

    return () => {
      observer.disconnect()
      gsap.killTweensOf(items)
    }
  }, [id])

  if (!work) {
    return (
      <main className="shop product">
        <ShopHeader />
        <section className="product__missing">
          <h1 className="product__title">not here.</h1>
          <p className="shop__meta">
            <a href="/works">back to works <span aria-hidden="true">→</span></a>
          </p>
        </section>
        <ShopFooter />
      </main>
    )
  }

  const [where, year] = work.subtitle.split(' · ')
  // The true-size page is a static file outside the app, so what hangs travels in
  // its address: the picture, the print's size in cm and the chosen finishing.
  const hung = dims({ size: sizeIndexOf(size), material, portrait: isPortrait })
  const trueSizeHref = `/true-size?${new URLSearchParams({
    img: work.image,
    w: (hung.w - 2 * hung.b).toFixed(2),
    h: (hung.h - 2 * hung.b).toFixed(2),
    frame: material,
    finish,
    title: work.title,
    back: `/works/${work.id}`,
  })}`
  const orientation = work.size[1] > work.size[0] ? 'portrait' : 'landscape'
  const workIndex = artworks.findIndex((artwork) => artwork.id === work.id)
  const relatedWorks = Array.from(
    { length: Math.min(9, artworks.length - 1) },
    (_, index) => artworks[(workIndex + index + 1) % artworks.length],
  )

  return (
    <main className={`shop product product--${work.id} ${show3D ? 'product--3d' : 'product--photo'}`}>
      <div className="product__first">
        <ShopHeader />

        <section className="product__stage" ref={stage}>
          <div className="product__lede">
            <div className="product__title-row">
              <h1 className="product__title"><RevealText block>{work.title.toLowerCase()}.</RevealText></h1>
              <div className="product__favorite-actions">
                <button
                  className={`product__favorite ${isFavorite ? 'product__favorite--saved' : ''}`}
                  type="button"
                  aria-label={isFavorite ? `Remove ${work.title} from favorites` : `Add ${work.title} to favorites`}
                  aria-pressed={isFavorite}
                  onClick={() => {
                    if (!isFavorite) trackAnalyticsEvent('favorite_added')
                    toggleFavorite(work.id)
                  }}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M20.2 5.8a4.7 4.7 0 0 0-6.6 0L12 7.4l-1.6-1.6a4.7 4.7 0 0 0-6.6 6.6L12 20.6l8.2-8.2a4.7 4.7 0 0 0 0-6.6Z" />
                  </svg>
                </button>
                <a className="product__favorites-link" href="/favorites">view favorites</a>
              </div>
            </div>
            <p className="shop__meta">{`${where.toLowerCase()} · ${year}`}</p>
          </div>

          <figure
            className={`product__media product__media--${orientation}`}
            aria-label={`${work.title}, ${work.subtitle}`}
            role={show3D ? undefined : 'button'}
            tabIndex={show3D ? undefined : 0}
            aria-haspopup={show3D ? undefined : 'dialog'}
            onKeyDown={(event) => {
              if (event.target !== event.currentTarget) return
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                if (!show3D) setLightboxOpen(true)
              }
            }}
            onPointerDown={(event) => {
              mediaPointer.current = { x: event.clientX, y: event.clientY }
            }}
            onPointerUp={(event) => {
              const start = mediaPointer.current
              mediaPointer.current = null
              if (!start) return
              if (!show3D && Math.hypot(event.clientX - start.x, event.clientY - start.y) <= 6) {
                setLightboxOpen(true)
              }
            }}
            onPointerCancel={() => {
              mediaPointer.current = null
            }}
          >
            {show3D ? <Suspense fallback={<span className="product__loading-3d">loading 3D…</span>}><ProductFrame artwork={work} style={frame} /></Suspense> : (
              <img className="product__photo" src={work.image} alt={`${work.title}, ${work.subtitle}`} />
            )}
              <button
                className="product__view-toggle"
                type="button"
                aria-label={show3D ? 'View photograph' : 'View framed print in 3D'}
                onPointerDown={(event) => event.stopPropagation()}
                onPointerUp={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation()
                  mediaPointer.current = null
                  if (!show3D) trackAnalyticsEvent('work_3d_opened')
                  setShow3D((current) => !current)
                }}
              >
                {!show3D && (
                  <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
                    <path d="M16 3v25M7 11l9-5 9 5v12l-9 5-9-5V11Z" />
                    <path d="m7 11 9 6 9-6M7 23l9-6 9 6" />
                  </svg>
                )}{show3D ? 'PHOTO' : '3D'}
              </button>
              {!show3D && <span className="product__zoom-hint" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <circle cx="10.5" cy="10.5" r="6.25" />
                  <path d="m15.2 15.2 4.3 4.3" />
                  <path d="M10.5 7.5v6M7.5 10.5h6" />
                </svg>
              </span>}
          </figure>
        </section>

        <section className="product__options" ref={options}>
          <div className="product__field">
            <h2 className="product__label"><RevealText>description</RevealText></h2>
            <p className="product__description">{work.description}</p>
            <p className="shop__meta">{work.edition}</p>
          </div>

          <div className="product__field">
            <h2 className="product__label"><RevealText>material</RevealText></h2>
            <div className="product__choices product__choices--frames" role="group" aria-label="Material">
              {(Object.keys(FRAME_MATERIALS) as FrameMaterial[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`product__choice ${material === value ? 'product__choice--on' : ''}`}
                  aria-pressed={material === value}
                  onClick={() => setFrame(frameStyleFor(value, finish))}
                >
                  {FRAME_MATERIALS[value]}
                </button>
              ))}
            </div>

            {/* same column as material: the grid is four fixed columns */}
            {material !== 'unframed' && (
              <>
                <h2 className="product__label product__label--sub"><RevealText>finish</RevealText></h2>
                <div className="product__choices product__choices--frames" role="group" aria-label="Acabamento">
                  {FRAME_FINISHES.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`product__choice ${finish === value ? 'product__choice--on' : ''}`}
                      aria-pressed={finish === value}
                      onClick={() => {
                        setFinish(value)
                        setFrame(frameStyleFor(material, value))
                      }}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="product__field">
            <h2 className="product__label"><RevealText>size</RevealText></h2>
            <div className="product__choices product__choices--sizes" role="group" aria-label="Tamanho">
              {sizes.map((option) => {
                const candidate = variantFor(option)
                return (
                  <button
                    key={option}
                    type="button"
                    className={`product__choice ${size === option ? 'product__choice--on' : ''} ${
                      candidate && !candidate.available ? 'product__choice--out' : ''
                    }`}
                    aria-pressed={size === option}
                    onClick={() => setSize(option)}
                  >
                    <span className="product__size-label-mobile">{option}</span>
                    <span className="product__size-label-desktop">{option.replace(/\s*[x×]\s*/gi, '×').replace(/\s+in\.?$/i, '')}</span>
                  </button>
                )
              })}
              <button
                type="button"
                className="product__choice product__custom-size"
                onClick={() => openContact(`${work.title} — custom size request`)}
              >
                <span className="product__custom-size-full">custom size upon request</span>
                <span className="product__custom-size-short">custom size</span>
              </button>
            </div>
          </div>

          <div className="product__actions">
            <button
              type="button"
              className="product__cart"
              onClick={() => openContact(`${work.title} · ${frameLabelFor(material, finish)} · ${size || 'size upon request'}`)}
            >
              inquire
            </button>
            <button type="button" className="product__cart product__cart--wall" onClick={() => setWallOpen(true)}>
              see on wall
            </button>
            <a className="product__cart product__cart--wall" href={trueSizeHref}>
              see at true size
            </a>
          </div>
        </section>
      </div>

      <section className="product__related" aria-labelledby="product-related-title" ref={related}>
        <header className="product__related-head">
          <h2 id="product-related-title">discover more.</h2>
          <span aria-hidden="true" />
        </header>
        <div className="product__related-grid">
          {relatedWorks.map((related) => (
            <a
              href={related.shopifyHandle ? `/works/${related.id}` : '/works'}
              className="product__related-work"
              key={related.id}
              aria-label={`${related.title}, ${related.subtitle}`}
            >
              <img src={related.image} alt={`${related.title}, ${related.subtitle}`} loading="lazy" />
              <span>{related.title.toLowerCase()}.</span>
            </a>
          ))}
        </div>
      </section>

      {wallOpen && (
        <WallBuilder
          selectFirst
          initial={[{
            key: 'this',
            id: work.id,
            x: 0,
            y: EYE,
            size: sizeIndexOf(size),
            material,
            finish,
            portrait: isPortrait,
          }]}
          onChange={syncFromWall}
          onClose={() => setWallOpen(false)}
        />
      )}

      {lightboxOpen && (
        <div
          className="product__lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${work.title} enlarged photograph`}
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) setLightboxOpen(false)
          }}
        >
          <button
            type="button"
            className="product__lightbox-close"
            aria-label="Close enlarged photograph"
            onClick={() => setLightboxOpen(false)}
          >
            ×
          </button>
          <img src={work.image} alt={`${work.title}, ${work.subtitle}`} />
        </div>
      )}

      <ShopFooter />
    </main>
  )
}

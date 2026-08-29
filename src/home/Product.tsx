import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { artworks, INQUIRY_EMAIL, standardPrintSizes } from '../data/artworks'
import type { FrameStyle } from '../data/artworks'
import { defaultSelection, findVariant, money } from '../lib/shopify'
import { useProductState } from '../lib/useProduct'
import { useCartStore } from '../store/useCartStore'
import { useContactStore } from '../store/useContactStore'
import { RevealText, useSectionTextReveal } from './reveal'
import { PRICE, ShopFooter, ShopHeader } from './ShopChrome'
import ProductFrame from './ProductFrame'
import './home.css'
import './shop.css'

// The mouldings the room already builds in ArtworkFrame — the same three, named
// the way a buyer reads them.
const FRAMES: { value: FrameStyle; label: string }[] = [
  { value: 'unframed', label: 'unframed' },
  { value: 'white', label: 'white' },
  { value: 'black', label: 'black' },
]

const sizeKey = (value: string) => value.toLowerCase().replace(/×/g, 'x').replace(/[^0-9x]/g, '')

export default function Product({ id }: { id: string }) {
  const work = artworks.find((a) => a.id === id)
  const stage = useRef<HTMLElement>(null)
  const options = useRef<HTMLElement>(null)
  const related = useRef<HTMLElement>(null)
  const mediaPointer = useRef<{ x: number; y: number } | null>(null)
  const { product, loading: productLoading } = useProductState(work?.shopifyHandle)
  const addToCart = useCartStore((s) => s.add)
  const openContact = useContactStore((s) => s.openContact)

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
  const [quantity, setQuantity] = useState(1)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const isPortrait = !!work && work.size[1] > work.size[0]

  useEffect(() => setQuantity(1), [work?.id])
  useEffect(() => setLightboxOpen(false), [work?.id])

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
      const initialFrame = frameOption ? initial[frameOption.name]?.toLowerCase() : 'unframed'
      setFrame(initialFrame === 'white' || initialFrame === 'black'
        ? initialFrame
        : 'unframed')
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
  const frameValue = frameOption?.values.find((v) => v.toLowerCase() === frame)
  const variantFor = (value: string) =>
    product && sizeOption
      ? findVariant(product, {
          [sizeOption.name]: value,
          ...(frameOption && frameValue ? { [frameOption.name]: frameValue } : {}),
        })
      : null
  const variant = variantFor(size)

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
            <a href="/shop">back to the shop <span aria-hidden="true">→</span></a>
          </p>
        </section>
        <ShopFooter />
      </main>
    )
  }

  const [where, year] = work.subtitle.split(' · ')
  const orientation = work.size[1] > work.size[0] ? 'portrait' : 'landscape'
  const workIndex = artworks.findIndex((artwork) => artwork.id === work.id)
  const relatedWorks = Array.from(
    { length: Math.min(9, artworks.length - 1) },
    (_, index) => artworks[(workIndex + index + 1) % artworks.length],
  )

  return (
    <main className={`shop product product--${work.id}`}>
      <div className="product__first">
        <ShopHeader />

        <section className="product__stage" ref={stage}>
          <div className="product__lede">
            <h1 className="product__title"><RevealText block>{work.title.toLowerCase()}.</RevealText></h1>
            <p className="product__price">
              <RevealText>{variant ? money(variant.price, variant.currency) : PRICE}</RevealText>
            </p>
            <p className="shop__meta">{`${where.toLowerCase()} · ${year}`}</p>
          </div>

          <figure
            className={`product__media product__media--${orientation}`}
            aria-label={`${work.title}, ${work.subtitle}`}
            role="button"
            tabIndex={0}
            aria-haspopup="dialog"
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                setLightboxOpen(true)
              }
            }}
            onPointerDown={(event) => {
              mediaPointer.current = { x: event.clientX, y: event.clientY }
            }}
            onPointerUp={(event) => {
              const start = mediaPointer.current
              mediaPointer.current = null
              if (!start) return
              if (Math.hypot(event.clientX - start.x, event.clientY - start.y) <= 6) {
                setLightboxOpen(true)
              }
            }}
          >
            <ProductFrame artwork={work} style={frame} />
            <span className="product__zoom-hint" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <circle cx="10.5" cy="10.5" r="6.25" />
                <path d="m15.2 15.2 4.3 4.3" />
                <path d="M10.5 7.5v6M7.5 10.5h6" />
              </svg>
            </span>
            {variant?.available && (
              <div
                className="product__media-quantity product__quantity-controls"
                role="group"
                aria-label="Quantity"
                onPointerDown={(event) => event.stopPropagation()}
                onPointerUp={(event) => event.stopPropagation()}
              >
                {quantity > 1 && (
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  >
                    −
                  </button>
                )}
                <output aria-live="polite">{quantity}</output>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((current) => Math.min(20, current + 1))}
                >
                  +
                </button>
              </div>
            )}
          </figure>
        </section>

        <section className="product__options" ref={options}>
          <div className="product__field">
            <h2 className="product__label"><RevealText>description</RevealText></h2>
            <p className="product__description">{work.description}</p>
            <p className="shop__meta">{work.edition}</p>
          </div>

          <div className="product__field">
            <h2 className="product__label"><RevealText>frame</RevealText></h2>
            <div className="product__choices product__choices--frames" role="group" aria-label="Moldura">
              {FRAMES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`product__choice ${frame === option.value ? 'product__choice--on' : ''}`}
                  aria-pressed={frame === option.value}
                  onClick={() => setFrame(option.value)}
                >
                  {option.label}
                </button>
              ))}
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
                    {option}
                  </button>
                )
              })}
              <button
                type="button"
                className="product__choice product__custom-size product__custom-size--mobile"
                onClick={() => openContact(`${work.title} — custom size request`)}
              >
                custom size
              </button>
            </div>
          </div>

          {/* The cart line is keyed on the live Shopify variant id — the only
              thing the hosted checkout honours. Without a reachable store there
              is no id to key on, so the work stays inquiry-only. */}
          {variant?.available ? (
            <div className="product__purchase">
              <div className="product__quantity" role="group" aria-label="Quantity">
                <div className="product__quantity-controls">
                  {quantity > 1 && (
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    >
                      −
                    </button>
                  )}
                  <output aria-live="polite">{quantity}</output>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQuantity((current) => Math.min(20, current + 1))}
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="product__cart"
                onClick={() => {
                  addToCart({
                    variantId: variant.id,
                    artworkId: work.id,
                    handle: work.shopifyHandle!,
                    label: variant.title,
                  }, quantity)
                  // the cart is a screen now — adding goes there, as a shop does
                  window.location.href = '/cart'
                }}
              >
                add to cart
              </button>
            </div>
          ) : (
            <a
              className="product__cart"
              href={`mailto:${INQUIRY_EMAIL}?subject=${encodeURIComponent(`${work.title} · ${frame} · ${size}`)}`}
            >
              {product && variant ? 'sold out · inquire' : 'inquire'}
            </a>
          )}
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
              href={related.shopifyHandle ? `/shop/${related.id}` : '/shop'}
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

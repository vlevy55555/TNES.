import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { artworks, INQUIRY_EMAIL } from '../data/artworks'
import type { FrameStyle } from '../data/artworks'
import { defaultSelection, findVariant, money } from '../lib/shopify'
import { useProduct } from '../lib/useProduct'
import { useCartStore } from '../store/useCartStore'
import { RevealText, useSectionTextReveal } from './reveal'
import { PRICE, ShopFooter, ShopHeader } from './ShopChrome'
import ProductFrame from './ProductFrame'
import './home.css'
import './shop.css'

// The mouldings the room already builds in ArtworkFrame — the same three, named
// the way a buyer reads them.
const FRAMES: { value: FrameStyle; label: string }[] = [
  { value: 'gold', label: 'gold' },
  { value: 'white', label: 'white' },
  { value: 'black', label: 'black' },
]

/** The made-to-order sizes are the artwork's own `dimensions` string. */
const sizesOf = (dimensions: string) =>
  dimensions
    .split('·')
    .map((size) => `${size.replace(/cm/i, '').trim()} cm`)

export default function Product({ id }: { id: string }) {
  const work = artworks.find((a) => a.id === id)
  const stage = useRef<HTMLElement>(null)
  const options = useRef<HTMLElement>(null)
  const product = useProduct(work?.shopifyHandle)
  const addToCart = useCartStore((s) => s.add)

  // Live options win over the static cm list: Shopify is what the checkout
  // honours, so a size shown here has to be a size you can actually order.
  const frameOption = product?.options.find((o) => /frame/i.test(o.name))
  const sizeOption = product?.options.find((o) => o !== frameOption)
  const sizes = sizeOption?.values ?? (work ? sizesOf(work.dimensions) : [])
  const [size, setSize] = useState('')
  const [frame, setFrame] = useState<FrameStyle>(work?.frameStyle ?? 'white')

  // open on the middle size — the smallest reads as the cheap option
  useEffect(() => {
    if (product && sizeOption) setSize(defaultSelection(product)[sizeOption.name] ?? '')
    else setSize(work ? sizesOf(work.dimensions)[0] ?? '' : '')
  }, [product, sizeOption, work])

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
          >
            <ProductFrame artwork={work} style={frame} />
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
            <div className="product__choices" role="group" aria-label="Moldura">
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
            </div>
          </div>

          <div className="product__field">
            <h2 className="product__label"><RevealText>size</RevealText></h2>
            <div className="product__choices" role="group" aria-label="Tamanho">
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
            </div>
          </div>

          {/* The cart line is keyed on the live Shopify variant id — the only
              thing the hosted checkout honours. Without a reachable store there
              is no id to key on, so the work stays inquiry-only. */}
          {variant?.available ? (
            <button
              type="button"
              className="product__cart"
              onClick={() => {
                addToCart({
                  variantId: variant.id,
                  artworkId: work.id,
                  handle: work.shopifyHandle!,
                  label: variant.title,
                })
                // the cart is a screen now — adding goes there, as a shop does
                window.location.href = '/cart'
              }}
            >
              add to cart
            </button>
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

      <ShopFooter />
    </main>
  )
}

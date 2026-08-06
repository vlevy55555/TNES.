import { useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { artworks, INQUIRY_EMAIL } from '../data/artworks'
import type { FrameStyle } from '../data/artworks'
import { SHOP_DOMAIN } from '../lib/shopify'
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
  const sizes = work ? sizesOf(work.dimensions) : []
  const [size, setSize] = useState(sizes[0] ?? '')
  const [frame, setFrame] = useState<FrameStyle>(work?.frameStyle ?? 'white')

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

  return (
    <main className="shop product">
      <div className="product__first">
        <ShopHeader />

        <section className="product__stage" ref={stage}>
          <div className="product__lede">
            <h1 className="product__title"><RevealText block>{work.title.toLowerCase()}.</RevealText></h1>
            <p className="product__price"><RevealText>{PRICE}</RevealText></p>
            <p className="shop__meta">{`${where.toLowerCase()} · ${year}`}</p>
          </div>

          <figure className="product__media" aria-label={`${work.title}, ${work.subtitle}`}>
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
              {sizes.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`product__choice ${size === option ? 'product__choice--on' : ''}`}
                  aria-pressed={size === option}
                  onClick={() => setSize(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* ponytail: the local cart is keyed on a live Shopify variant id, which
              these static labels can't resolve — hand the chosen combination to
              the store rather than fake a line the checkout can't honour. */}
          <a
            className="product__cart"
            href={
              work.shopifyHandle
                ? `https://${SHOP_DOMAIN}/products/${work.shopifyHandle}`
                : `mailto:${INQUIRY_EMAIL}?subject=${encodeURIComponent(`${work.title} · ${frame} · ${size}`)}`
            }
          >
            add to cart
          </a>
        </section>
      </div>

      <ShopFooter />
    </main>
  )
}

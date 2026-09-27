import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { artworks } from '../data/artworks'
import { useCartStore } from '../store/useCartStore'
import { useContactStore } from '../store/useContactStore'
import { RevealText, useSectionTextReveal } from './reveal'
import { ShopFooter, ShopHeader } from './ShopChrome'
import './home.css'
import './shop.css'

/**
 * `/cart` — the selection as a page, not a panel. Same paper, same two type
 * sizes, same 1px rules as `/shop` and `/shop/<id>`: a cart is another editorial
 * screen of the shop, so it reads as one.
 *
 * Prices are always re-read from Shopify (never the amount captured when the
 * line was added), so a cart left open overnight can't quote a stale number.
 */
export default function Cart() {
  const items = useCartStore((s) => s.items)
  const setQty = useCartStore((s) => s.setQty)
  const remove = useCartStore((s) => s.remove)
  const head = useRef<HTMLElement>(null)
  const foot = useRef<HTMLElement>(null)
  const list = useRef<HTMLDivElement>(null)

  const lines = Object.values(items)
  const openContact = useContactStore((s) => s.openContact)

  useSectionTextReveal(head, true)
  useSectionTextReveal(foot, true)

  // §5.2, straight on mount: the lines are above the fold, nothing to wait for.
  useLayoutEffect(() => {
    const root = list.current
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const context = gsap.context(() => {
      gsap.from('.cart__figure', {
        clipPath: 'inset(0 0 100% 0)',
        duration: 1.15,
        ease: 'expo.out',
        stagger: 0.08,
      })
      gsap.from('.cart__figure img', {
        scale: 1.12,
        yPercent: 7,
        duration: 1.35,
        ease: 'expo.out',
        stagger: 0.08,
      })
    }, root)

    return () => context.revert()
  }, [])

  const selected = lines.map((line) => ({
    line,
    artwork: artworks.find((a) => a.id === line.artworkId),
  }))

  const inquire = () => {
    const subject = selected
      .map(({ line, artwork }) => `${artwork?.title ?? line.artworkId} (${line.label}, qty ${line.qty})`)
      .join(' | ')
    openContact(`print inquiry · ${subject}`)
  }

  return (
    <main className="shop cart">
      <ShopHeader current="cart" />

      <section className="shop__intro" ref={head}>
        <h1 className="shop__title"><RevealText block>cart.</RevealText></h1>
        <p className="shop__count" aria-live="polite">
          {lines.length ? `${lines.length} ${lines.length === 1 ? 'work' : 'works'}` : 'empty'}
        </p>
      </section>

      {lines.length === 0 ? (
        <section className="cart__empty">
          <p className="cart__empty-line">nothing selected yet.</p>
          <p className="shop__meta">
            <a href="/works">browse works <span aria-hidden="true">→</span></a>
          </p>
        </section>
      ) : (
        <>
          <div className="cart__lines" ref={list}>
            {selected.map(({ line, artwork }) => (
              <article className="cart__line" key={line.variantId}>
                <a className="cart__figure" href={`/works/${line.artworkId}`}>
                  {artwork && <img src={artwork.image} alt={artwork.title} />}
                </a>

                <div className="cart__line-body">
                  <h2 className="cart__line-title">
                    <a href={`/works/${line.artworkId}`}>
                      {(artwork?.title ?? line.artworkId).toLowerCase()}.
                    </a>
                  </h2>
                  <p className="shop__meta">{line.label}</p>
                  <button className="cart__remove" onClick={() => remove(line.variantId)}>
                    remove
                  </button>
                </div>

                {/* the A24 quantity strip of §9.3: typography, not a stepper box */}
                <div className="cart__qty" role="group" aria-label="Quantidade">
                  <button onClick={() => setQty(line.variantId, line.qty - 1)} aria-label="Menos um">
                    –
                  </button>
                  <span>{line.qty}</span>
                  <button onClick={() => setQty(line.variantId, line.qty + 1)} aria-label="Mais um">
                    +
                  </button>
                </div>

              </article>
            ))}
          </div>

          <section className="cart__foot" ref={foot}>
            <p className="shop__meta cart__note">
              checkout is temporarily paused. inquire for availability and ordering.
            </p>

            <button
              type="button"
              className="product__cart"
              onClick={inquire}
            >
              inquire <span className="shop__arrow" aria-hidden="true">→</span>
            </button>
          </section>
        </>
      )}

      <ShopFooter />
    </main>
  )
}

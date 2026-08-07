import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { artworks } from '../data/artworks'
import { checkoutUrl, money } from '../lib/shopify'
import { useProducts } from '../lib/useProduct'
import { useCartStore } from '../store/useCartStore'
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
  const products = useProducts(lines.map((l) => l.handle))

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

  const priced = lines.map((line) => ({
    line,
    variant: products[line.handle]?.variants.find((v) => v.id === line.variantId),
    artwork: artworks.find((a) => a.id === line.artworkId),
  }))

  // a line whose variant no longer exists (deleted or renamed in Shopify) can't
  // be priced or checked out — say so instead of silently dropping it
  const sellable = priced.filter((p) => p.variant?.available)
  const currency = sellable[0]?.variant?.currency ?? 'USD'
  const subtotal = sellable.reduce((sum, p) => sum + p.variant!.price * p.line.qty, 0)
  const loading = lines.length > 0 && !Object.keys(products).length

  const checkout = () => {
    if (!sellable.length) return
    window.location.href = checkoutUrl(
      sellable.map((p) => ({ variantId: p.line.variantId, qty: p.line.qty })),
    )
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
            <a href="/shop">browse the shop <span aria-hidden="true">→</span></a>
          </p>
        </section>
      ) : (
        <>
          <div className="cart__lines" ref={list}>
            {priced.map(({ line, variant, artwork }) => (
              <article className="cart__line" key={line.variantId}>
                <a className="cart__figure" href={`/shop/${line.artworkId}`}>
                  {artwork && <img src={artwork.image} alt={artwork.title} />}
                </a>

                <div className="cart__line-body">
                  <h2 className="cart__line-title">
                    <a href={`/shop/${line.artworkId}`}>
                      {(artwork?.title ?? line.artworkId).toLowerCase()}.
                    </a>
                  </h2>
                  <p className="shop__meta">{variant?.title ?? line.label}</p>
                  {!variant && !loading && (
                    <p className="cart__warn">no longer available</p>
                  )}
                  {variant && !variant.available && <p className="cart__warn">sold out</p>}
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

                <p className="cart__line-price">
                  {variant ? money(variant.price * line.qty, variant.currency) : '—'}
                </p>
              </article>
            ))}
          </div>

          <section className="cart__foot" ref={foot}>
            <div className="cart__total">
              <span className="cart__total-label"><RevealText>subtotal</RevealText></span>
              <span className="cart__total-value">
                {loading ? '—' : money(subtotal, currency)}
              </span>
            </div>

            <p className="shop__meta cart__note">
              shipping and taxes are calculated at checkout, on shopify.
            </p>

            <button
              type="button"
              className="product__cart"
              onClick={checkout}
              disabled={!sellable.length || loading}
            >
              checkout <span className="shop__arrow" aria-hidden="true">→</span>
            </button>
          </section>
        </>
      )}

      <ShopFooter />
    </main>
  )
}

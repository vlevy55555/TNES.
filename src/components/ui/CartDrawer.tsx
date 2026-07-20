import { artworks } from '../../data/artworks'
import { useCartStore } from '../../store/useCartStore'
import { useProducts } from '../../lib/useProduct'
import { checkoutUrl, money } from '../../lib/shopify'

export function CartDrawer() {
  const open = useCartStore((s) => s.open)
  const setOpen = useCartStore((s) => s.setOpen)
  const items = useCartStore((s) => s.items)
  const setQty = useCartStore((s) => s.setQty)
  const remove = useCartStore((s) => s.remove)

  const lines = Object.values(items)
  // prices are always re-read from Shopify, never from what was stored at add
  // time, so a cart left open overnight can't quote a stale amount
  const products = useProducts(lines.map((l) => l.handle))

  if (!open) return null

  const priced = lines.map((line) => {
    const variant = products[line.handle]?.variants.find((v) => v.id === line.variantId)
    const artwork = artworks.find((a) => a.id === line.artworkId)
    return { line, variant, artwork }
  })

  // a line whose variant no longer exists (deleted/renamed in Shopify) can't be
  // priced or checked out — surface it instead of silently dropping it
  const sellable = priced.filter((p) => p.variant?.available)
  const currency = sellable[0]?.variant?.currency ?? 'USD'
  const subtotal = sellable.reduce((sum, p) => sum + p.variant!.price * p.line.qty, 0)
  const loading = lines.length > 0 && Object.keys(products).length === 0

  const checkout = () => {
    if (!sellable.length) return
    window.open(
      checkoutUrl(sellable.map((p) => ({ variantId: p.line.variantId, qty: p.line.qty }))),
      '_blank',
      'noopener',
    )
  }

  return (
    <>
      <div className="cart-scrim" onClick={() => setOpen(false)} />
      <aside className="cart-drawer" aria-label="Cart">
        <button className="panel-close" onClick={() => setOpen(false)} aria-label="Close cart">
          ✕ Close
        </button>

        <p className="eyebrow">Your selection</p>

        {lines.length === 0 ? (
          <p className="cart-empty">Nothing selected yet.</p>
        ) : (
          <>
            <div className="cart-lines">
              {priced.map(({ line, variant, artwork }) => (
                <div className="cart-line" key={line.variantId}>
                  {artwork && <img className="cart-thumb" src={artwork.image} alt="" />}
                  <div className="cart-line-main">
                    <div className="cart-line-title">{artwork?.title ?? line.artworkId}</div>
                    <div className="cart-line-sub">{variant?.title ?? line.label}</div>
                    {!variant && !loading && (
                      <div className="cart-line-warn">No longer available</div>
                    )}
                    {variant && !variant.available && (
                      <div className="cart-line-warn">Sold out</div>
                    )}
                    <button className="cart-remove" onClick={() => remove(line.variantId)}>
                      Remove
                    </button>
                  </div>
                  <div className="cart-qty">
                    <button
                      onClick={() => setQty(line.variantId, line.qty - 1)}
                      aria-label="Decrease quantity"
                    >
                      –
                    </button>
                    <span>{line.qty}</span>
                    <button
                      onClick={() => setQty(line.variantId, line.qty + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <div className="cart-line-price">
                    {variant ? money(variant.price * line.qty, variant.currency) : '—'}
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-foot">
              <div className="cart-subtotal">
                <span>Subtotal</span>
                <strong>{loading ? '—' : money(subtotal, currency)}</strong>
              </div>
              <p className="cart-note">
                Shipping and taxes are calculated at checkout, on Shopify.
              </p>
              <button
                className="btn btn-primary"
                onClick={checkout}
                disabled={!sellable.length || loading}
              >
                Checkout
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}

import { useEffect, useState } from 'react'
import { artworks } from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'
import { useCartStore } from '../../store/useCartStore'
import { useProduct } from '../../lib/useProduct'
import { checkoutUrl, defaultSelection, findVariant, money } from '../../lib/shopify'

export function ArtworkPanel() {
  const selectedArtworkId = useGalleryStore((s) => s.selectedArtworkId)
  const closeArtwork = useGalleryStore((s) => s.closeArtwork)
  const openInquiry = useGalleryStore((s) => s.openInquiry)
  const inquiryOpen = useGalleryStore((s) => s.inquiryOpen)
  const addToCart = useCartStore((s) => s.add)
  const openCart = useCartStore((s) => s.setOpen)

  const artwork = artworks.find((a) => a.id === selectedArtworkId)
  const product = useProduct(artwork?.shopifyHandle)

  const [selection, setSelection] = useState<Record<string, string>>({})
  const [added, setAdded] = useState(false)

  // open on the first in-stock combination whenever a new product loads
  useEffect(() => {
    setSelection(product ? defaultSelection(product) : {})
    setAdded(false)
  }, [product])

  // the letter overlays the same view — hide the panel behind it, but keep the
  // artwork selected so the 3D camera framing never moves
  if (!artwork || inquiryOpen) return null

  const variant = product ? findVariant(product, selection) : null
  const buyable = !!variant?.available

  const buy = () => {
    if (!variant) return
    // new tab: the 3D exhibition stays open behind the checkout
    window.open(checkoutUrl([{ variantId: variant.id, qty: 1 }]), '_blank', 'noopener')
  }

  const add = () => {
    if (!variant || !artwork.shopifyHandle) return
    addToCart({
      variantId: variant.id,
      artworkId: artwork.id,
      handle: artwork.shopifyHandle,
      label: variant.title,
    })
    setAdded(true)
    openCart(true)
  }

  return (
    <aside className="artwork-panel">
      <button className="panel-close" onClick={closeArtwork} aria-label="Close">
        ✕ Close
      </button>

      <p className="eyebrow">Selected work</p>
      <h2 className="panel-title">{artwork.title}</h2>
      <p className="panel-subtitle">{artwork.subtitle}</p>

      <p className="panel-description">{artwork.description}</p>

      {/* Shopify drives the options when the work is purchasable. Option names
          differ per product in this store (Size / Frame / Frame Color / Framing),
          so render whatever the API reports rather than assuming a schema. */}
      {product?.options.map((option) => (
        <div className="panel-option" key={option.name}>
          <p className="panel-option-name">{option.name}</p>
          <div className="panel-option-values">
            {option.values.map((value) => {
              const candidate = findVariant(product, { ...selection, [option.name]: value })
              return (
                <button
                  key={value}
                  className={`opt ${selection[option.name] === value ? 'opt-on' : ''} ${
                    candidate && !candidate.available ? 'opt-out' : ''
                  }`}
                  aria-pressed={selection[option.name] === value}
                  onClick={() => {
                    setSelection((s) => ({ ...s, [option.name]: value }))
                    setAdded(false)
                  }}
                >
                  {value}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <dl className="panel-specs">
        <div>
          <dt>Edition</dt>
          <dd>{artwork.edition}</dd>
        </div>
        {/* the static cm list only means anything without live Shopify sizes */}
        {!product && (
          <div>
            <dt>Dimensions</dt>
            <dd>{artwork.dimensions}</dd>
          </div>
        )}
        <div>
          <dt>Price</dt>
          <dd className="panel-price">
            {variant ? money(variant.price, variant.currency) : artwork.price}
          </dd>
        </div>
      </dl>

      {product && !buyable && (
        <p className="panel-note">
          {variant ? 'This combination is sold out.' : 'That combination isn’t available.'}
        </p>
      )}

      <div className="panel-actions">
        {buyable && (
          <>
            <button className="btn btn-primary" onClick={buy}>
              Buy now
            </button>
            <button className="btn btn-ghost" onClick={add}>
              {added ? 'Added ✓' : 'Add to cart'}
            </button>
          </>
        )}
        <button
          className={`btn ${buyable ? 'btn-quiet' : 'btn-primary'}`}
          onClick={() => openInquiry(artwork.id)}
        >
          Inquire
        </button>
      </div>
    </aside>
  )
}

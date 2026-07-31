import { useEffect, useState } from 'react'
import { artworks } from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'
import { useCartStore } from '../../store/useCartStore'
import { useProduct } from '../../lib/useProduct'
import { checkoutUrl, defaultSelection, findVariant, money } from '../../lib/shopify'

/** how much the hung print grows or shrinks per step away from the middle size */
const PREVIEW_STEP = 0.16

export function ArtworkPanel() {
  const selectedArtworkId = useGalleryStore((s) => s.selectedArtworkId)
  const selectedFrameStyle = useGalleryStore((s) => s.selectedFrameStyle)
  const setSelectedFrameStyle = useGalleryStore((s) => s.setSelectedFrameStyle)
  const closeArtwork = useGalleryStore((s) => s.closeArtwork)
  const openInquiry = useGalleryStore((s) => s.openInquiry)
  const inquiryOpen = useGalleryStore((s) => s.inquiryOpen)
  const addToCart = useCartStore((s) => s.add)
  const openCart = useCartStore((s) => s.setOpen)

  const setPreviewScale = useGalleryStore((s) => s.setPreviewScale)

  const artwork = artworks.find((a) => a.id === selectedArtworkId)
  const product = useProduct(artwork?.shopifyHandle)

  const [selection, setSelection] = useState<Record<string, string>>({})
  const [added, setAdded] = useState(false)

  // open on the middle size whenever a new product loads
  useEffect(() => {
    setSelection(product ? defaultSelection(product) : {})
    setAdded(false)
  }, [product])

  const frameOption = product?.options.find((option) => /^(frame|frame color|framing)$/i.test(option.name))
  const nonFrameOptions = product?.options.filter((option) => option !== frameOption)
  // whichever option isn't the frame is the size axis — that's the one the
  // print's physical scale should follow
  const sizeOption = nonFrameOptions?.[0]
  const sizeName = sizeOption?.name
  const sizeValues = sizeOption?.values
  const chosenSize = sizeName ? selection[sizeName] : undefined

  // the chosen size, made physical: one step either side of the middle
  useEffect(() => {
    const index = sizeValues?.indexOf(chosenSize ?? '') ?? -1
    if (!sizeValues || index < 0 || sizeValues.length < 2) return setPreviewScale(1)
    setPreviewScale(1 + (index - Math.floor((sizeValues.length - 1) / 2)) * PREVIEW_STEP)
  }, [sizeValues, chosenSize, setPreviewScale])

  // the letter overlays the same view — hide the panel behind it, but keep the
  // artwork selected so the 3D camera framing never moves
  if (!artwork || inquiryOpen) return null

  const variant = product ? findVariant(product, selection) : null
  const buyable = !!variant?.available

  const selectFrame = (style: 'black' | 'white') => {
    setSelectedFrameStyle(style)
    setAdded(false)
    // If the Shopify catalogue later exposes a Black/White frame option, keep
    // its real purchasable variant in sync with the live gallery preview.
    const value = frameOption?.values.find((item) => item.toLowerCase() === style)
    if (frameOption && value) {
      setSelection((current) => ({ ...current, [frameOption.name]: value }))
    }
  }

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
      <div className="panel-option">
        <p className="panel-option-name">Frame</p>
        <div className="panel-option-values">
          {(['black', 'white'] as const).map((style) => (
            <button
              type="button"
              key={style}
              className={`opt ${selectedFrameStyle === style ? 'opt-on' : ''}`}
              aria-pressed={selectedFrameStyle === style}
              onClick={() => selectFrame(style)}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {product && nonFrameOptions?.map((option) => (
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

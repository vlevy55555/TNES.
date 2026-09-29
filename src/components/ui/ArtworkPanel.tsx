import { useEffect, useState } from 'react'
import {
  artworks,
  FRAME_FINISHES,
  FRAME_MATERIALS,
  frameMaterialOf,
  frameStyleFor,
  frameStyleOf,
  standardPrintSizes,
  type FrameFinish,
  type FrameMaterial,
  type FrameStyle,
} from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'
import { useProduct } from '../../lib/useProduct'
import { defaultSelection, findVariant, money } from '../../lib/shopify'

/** how much the hung print grows or shrinks per step away from the middle size */
const PREVIEW_STEP = 0.16

export function ArtworkPanel() {
  const selectedArtworkId = useGalleryStore((s) => s.selectedArtworkId)
  const selectedFrameStyle = useGalleryStore((s) => s.selectedFrameStyle)
  const setSelectedFrameStyle = useGalleryStore((s) => s.setSelectedFrameStyle)
  const closeArtwork = useGalleryStore((s) => s.closeArtwork)
  const openInquiry = useGalleryStore((s) => s.openInquiry)
  const inquiryOpen = useGalleryStore((s) => s.inquiryOpen)
  const isMobile = useGalleryStore((s) => s.isMobile)
  const setPreviewScale = useGalleryStore((s) => s.setPreviewScale)

  const artwork = artworks.find((a) => a.id === selectedArtworkId)
  const product = useProduct(artwork?.shopifyHandle)

  const [selection, setSelection] = useState<Record<string, string>>({})
  const [finish, setFinish] = useState<FrameFinish>(selectedFrameStyle === 'black' ? 'black' : 'white')
  const material = frameMaterialOf(selectedFrameStyle)

  // open on the middle size whenever a new product loads
  useEffect(() => {
    setSelection(product ? defaultSelection(product) : {})
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

  const selectFrame = (style: FrameStyle) => {
    setSelectedFrameStyle(style)
    // keep the real purchasable variant in sync with the live gallery preview
    const value = frameOption?.values.find((item) => frameStyleOf(item) === style)
    if (frameOption && value) {
      setSelection((current) => ({ ...current, [frameOption.name]: value }))
    }
  }

  /**
   * Everything a visitor reads or picks before paying. On a phone this is put
   * behind a native <details> so the sheet opens as a caption strip and the
   * work stays visible while you decide you want it; the disclosure toggle,
   * its keyboard handling and its a11y state all come free. Desktop renders
   * the same nodes bare — the side panel has the room, and wrapping it there
   * would change how `.panel-actions` finds the bottom of the column.
   */
  const shop = (
    <>
      <p className="panel-description">{artwork.description}</p>

      {/* Shopify drives the options when the work is purchasable. Option names
          differ per product in this store (Size / Frame / Frame Color / Framing),
          so render whatever the API reports rather than assuming a schema. */}
      <div className="panel-option">
        <p className="panel-option-name">Material</p>
        <div className="panel-option-values">
          {(Object.keys(FRAME_MATERIALS) as FrameMaterial[]).map((value) => (
            <button
              type="button"
              key={value}
              className={`opt ${material === value ? 'opt-on' : ''}`}
              aria-pressed={material === value}
              onClick={() => selectFrame(frameStyleFor(value, finish))}
            >
              {FRAME_MATERIALS[value]}
            </button>
          ))}
        </div>
      </div>

      {material !== 'unframed' && (
        <div className="panel-option">
          <p className="panel-option-name">Finish</p>
          <div className="panel-option-values">
            {FRAME_FINISHES.map((value) => (
              <button
                type="button"
                key={value}
                className={`opt ${finish === value ? 'opt-on' : ''}`}
                aria-pressed={finish === value}
                onClick={() => {
                  setFinish(value)
                  selectFrame(frameStyleFor(material, value))
                }}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      )}

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
            <dd>{standardPrintSizes(artwork).join(' · ')}</dd>
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
        <button
          className="btn btn-primary"
          onClick={() => openInquiry(artwork.id)}
        >
          Inquire
        </button>
      </div>
    </>
  )

  return (
    <aside className="artwork-panel">
      <button className="panel-close" onClick={closeArtwork} aria-label="Close">
        ✕ Close
      </button>

      <p className="eyebrow">Selected work</p>
      <h2 className="panel-title">{artwork.title}</h2>
      <p className="panel-subtitle">{artwork.subtitle}</p>

      {/* keyed on the work: <details> is uncontrolled, so without the key a shop
          left open would still be open over the NEXT work you tap */}
      {isMobile ? (
        <details className="panel-shop" key={artwork.id}>
          <summary className="panel-shop-toggle">Shop this print</summary>
          {shop}
        </details>
      ) : (
        shop
      )}
    </aside>
  )
}

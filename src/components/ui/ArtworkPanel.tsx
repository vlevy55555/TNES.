import { artworks } from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'

export function ArtworkPanel() {
  const selectedArtworkId = useGalleryStore((s) => s.selectedArtworkId)
  const closeArtwork = useGalleryStore((s) => s.closeArtwork)
  const openInquiry = useGalleryStore((s) => s.openInquiry)
  const inquiryOpen = useGalleryStore((s) => s.inquiryOpen)

  const artwork = artworks.find((a) => a.id === selectedArtworkId)
  // the letter overlays the same view — hide the panel behind it, but keep the
  // artwork selected so the 3D camera framing never moves
  if (!artwork || inquiryOpen) return null

  return (
    <aside className="artwork-panel">
      <button className="panel-close" onClick={closeArtwork} aria-label="Close">
        ✕ Close
      </button>

      <p className="eyebrow">Selected work</p>
      <h2 className="panel-title">{artwork.title}</h2>
      <p className="panel-subtitle">{artwork.subtitle}</p>

      <p className="panel-description">{artwork.description}</p>

      <dl className="panel-specs">
        <div>
          <dt>Edition</dt>
          <dd>{artwork.edition}</dd>
        </div>
        <div>
          <dt>Dimensions</dt>
          <dd>{artwork.dimensions}</dd>
        </div>
        <div>
          <dt>Price</dt>
          <dd className="panel-price">{artwork.price}</dd>
        </div>
      </dl>

      <div className="panel-actions">
        <button className="btn btn-primary" onClick={() => openInquiry(artwork.id)}>
          Inquire
        </button>
      </div>
    </aside>
  )
}

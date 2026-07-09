import { useEffect, useRef, useState } from 'react'
import { artworks } from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'

export function ArtworkPanel() {
  const selectedArtworkId = useGalleryStore((s) => s.selectedArtworkId)
  const closeArtwork = useGalleryStore((s) => s.closeArtwork)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  // never carry a toast from one artwork's panel to the next
  useEffect(() => {
    setToast(null)
    window.clearTimeout(toastTimer.current)
  }, [selectedArtworkId])

  const artwork = artworks.find((a) => a.id === selectedArtworkId)
  if (!artwork) return null

  const showToast = (message: string) => {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2200)
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
        <button
          className="btn btn-primary"
          onClick={() => showToast('Added to mock cart')}
        >
          Add to cart
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => showToast('Inquiry sent — we will be in touch')}
        >
          Inquire
        </button>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </aside>
  )
}

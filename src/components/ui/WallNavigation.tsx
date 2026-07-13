import { artworks, walls } from '../../data/artworks'
import { mobileStops, stopIndexOf, useGalleryStore } from '../../store/useGalleryStore'

export function WallNavigation() {
  const currentWall = useGalleryStore((s) => s.currentWall)
  const selectedArtworkId = useGalleryStore((s) => s.selectedArtworkId)
  const focusArtworkId = useGalleryStore((s) => s.focusArtworkId)
  const isMobile = useGalleryStore((s) => s.isMobile)
  const goToPreviousWall = useGalleryStore((s) => s.goToPreviousWall)
  const goToNextWall = useGalleryStore((s) => s.goToNextWall)
  const selectArtwork = useGalleryStore((s) => s.selectArtwork)

  const hidden = selectedArtworkId !== null

  // desktop steps whole walls; mobile steps the one-frame-at-a-time reel
  const pos = isMobile ? stopIndexOf(currentWall, focusArtworkId) : currentWall
  const total = isMobile ? mobileStops.length : walls.length
  const focusArtwork = artworks.find((a) => a.id === focusArtworkId)
  const label = isMobile && focusArtwork ? focusArtwork.title : walls[currentWall].name

  return (
    <div className={`wall-nav ${hidden ? 'wall-nav-hidden' : ''}`}>
      {/* keyboard/screen-reader path to the canvas-only artworks */}
      <nav className="sr-only" aria-label="Artworks on this wall">
        {artworks
          .filter((a) => a.wallIndex === currentWall)
          .map((a) => (
            <button key={a.id} onClick={() => selectArtwork(a.id)}>
              View “{a.title}” — {a.subtitle}
            </button>
          ))}
      </nav>
      <button
        className="wall-nav-arrow wall-nav-prev"
        onClick={goToPreviousWall}
        disabled={pos === 0}
        aria-label={isMobile ? 'Previous' : 'Previous wall'}
      >
        ←
      </button>
      <button
        className="wall-nav-arrow wall-nav-next"
        onClick={goToNextWall}
        disabled={pos === total - 1}
        aria-label={isMobile ? 'Next' : 'Next wall'}
      >
        →
      </button>
      <div className="wall-nav-indicator">
        {label} · {pos + 1} / {total}
      </div>
    </div>
  )
}

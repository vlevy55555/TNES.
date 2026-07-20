import { artworks, walls } from '../../data/artworks'
import { mobileStops, stopIndexOf, useGalleryStore } from '../../store/useGalleryStore'

export function WallNavigation() {
  const currentWall = useGalleryStore((s) => s.currentWall)
  const selectedArtworkId = useGalleryStore((s) => s.selectedArtworkId)
  const focusArtworkId = useGalleryStore((s) => s.focusArtworkId)
  const isMobile = useGalleryStore((s) => s.isMobile)
  const inArchive = useGalleryStore((s) => s.inArchive)
  const goToPreviousWall = useGalleryStore((s) => s.goToPreviousWall)
  const goToNextWall = useGalleryStore((s) => s.goToNextWall)
  const selectArtwork = useGalleryStore((s) => s.selectArtwork)

  const hidden = selectedArtworkId !== null

  // desktop steps whole walls; mobile steps the one-frame-at-a-time reel
  const pos = isMobile ? stopIndexOf(currentWall, focusArtworkId) : currentWall
  const total = isMobile ? mobileStops.length : walls.length
  const focusArtwork = artworks.find((a) => a.id === focusArtworkId)
  const label = isMobile && focusArtwork ? focusArtwork.title : walls[currentWall].name
  // the archive sits before the first wall: ← reaches it, → comes back out
  const atLastStop = pos === total - 1

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
        disabled={inArchive}
        aria-label={inArchive ? 'Previous' : pos === 0 ? 'To the archive' : 'Previous wall'}
      >
        ←
      </button>
      <button
        className="wall-nav-arrow wall-nav-next"
        onClick={goToNextWall}
        disabled={!inArchive && atLastStop}
        aria-label={inArchive ? 'Leave the archive' : isMobile ? 'Next' : 'Next wall'}
      >
        →
      </button>
      <div className="wall-nav-indicator">
        {inArchive ? 'Archive' : `${label} · ${pos + 1} / ${total}`}
      </div>
    </div>
  )
}

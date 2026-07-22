import { artworks, walls } from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'

export function WallNavigation() {
  const currentWall = useGalleryStore((s) => s.currentWall)
  const selectedArtworkId = useGalleryStore((s) => s.selectedArtworkId)
  const inArchive = useGalleryStore((s) => s.inArchive)
  const goToPreviousWall = useGalleryStore((s) => s.goToPreviousWall)
  const goToNextWall = useGalleryStore((s) => s.goToNextWall)
  const selectArtwork = useGalleryStore((s) => s.selectArtwork)

  const hidden = selectedArtworkId !== null

  const label = walls[currentWall].name
  // the archive sits before the first wall: ← reaches it, → comes back out
  const atLastWall = currentWall === walls.length - 1

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
        aria-label={inArchive ? 'Previous' : currentWall === 0 ? 'To the archive' : 'Previous wall'}
      >
        ←
      </button>
      <button
        className="wall-nav-arrow wall-nav-next"
        onClick={goToNextWall}
        disabled={!inArchive && atLastWall}
        aria-label={inArchive ? 'Leave the archive' : 'Next wall'}
      >
        →
      </button>
      <div className="wall-nav-indicator">
        {inArchive ? 'Archive' : `${label} · ${currentWall + 1} / ${walls.length}`}
      </div>
    </div>
  )
}

import { artworks, walls } from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'

export function WallNavigation() {
  const currentWall = useGalleryStore((s) => s.currentWall)
  const selectedArtworkId = useGalleryStore((s) => s.selectedArtworkId)
  const goToPreviousWall = useGalleryStore((s) => s.goToPreviousWall)
  const goToNextWall = useGalleryStore((s) => s.goToNextWall)
  const selectArtwork = useGalleryStore((s) => s.selectArtwork)

  const hidden = selectedArtworkId !== null

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
        disabled={currentWall === 0}
        aria-label="Previous wall"
      >
        ←
      </button>
      <button
        className="wall-nav-arrow wall-nav-next"
        onClick={goToNextWall}
        disabled={currentWall === walls.length - 1}
        aria-label="Next wall"
      >
        →
      </button>
      <div className="wall-nav-indicator">
        {walls[currentWall].name} · {currentWall + 1} / {walls.length}
      </div>
    </div>
  )
}

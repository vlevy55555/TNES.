import { ARCHIVE_WALL, artworks, SIGNATURE_WALL, walls } from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'

export function WallNavigation() {
  const currentWall = useGalleryStore((s) => s.currentWall)
  const goToWall = useGalleryStore((s) => s.goToWall)
  const selectedArtworkId = useGalleryStore((s) => s.selectedArtworkId)
  const goToPreviousWall = useGalleryStore((s) => s.goToPreviousWall)
  const goToNextWall = useGalleryStore((s) => s.goToNextWall)
  const selectArtwork = useGalleryStore((s) => s.selectArtwork)
  const manifestoRoomOpen = useGalleryStore((s) => s.manifestoRoomOpen)
  const closeManifestoRoom = useGalleryStore((s) => s.closeManifestoRoom)
  const openManifestoRoom = useGalleryStore((s) => s.openManifestoRoom)

  const hidden = selectedArtworkId !== null

  const label = manifestoRoomOpen ? 'Manifesto' : walls[currentWall].name
  const atLastWall = currentWall === walls.length - 1

  return (
    <div className={`wall-nav ${hidden ? 'wall-nav-hidden' : ''}`}>
      {/* keyboard/screen-reader path to the canvas-only artworks and CTAs */}
      <nav className="sr-only" aria-label="Artworks on this wall">
        {currentWall === SIGNATURE_WALL && (
          <>
            <button onClick={() => goToWall(ARCHIVE_WALL)}>Shop prints</button>
            <button onClick={openManifestoRoom}>Enter studio</button>
          </>
        )}
        {(currentWall === ARCHIVE_WALL ? artworks : [])
          .map((a) => (
            <button key={a.id} onClick={() => selectArtwork(a.id)}>
              View “{a.title}” — {a.subtitle}
            </button>
          ))}
      </nav>
      <button
        className="wall-nav-arrow wall-nav-prev"
        onClick={currentWall === 0 ? openManifestoRoom : goToPreviousWall}
        disabled={manifestoRoomOpen}
        aria-label="Previous wall"
      >
        ←
      </button>
      <button
        className="wall-nav-arrow wall-nav-next"
        onClick={manifestoRoomOpen ? closeManifestoRoom : goToNextWall}
        disabled={!manifestoRoomOpen && atLastWall}
        aria-label="Next wall"
      >
        →
      </button>
      <div className="wall-nav-indicator">
        {manifestoRoomOpen ? 'MANIFESTO · ADJACENT ROOM' : `${label} · ${currentWall + 1} / ${walls.length}`}
      </div>
    </div>
  )
}

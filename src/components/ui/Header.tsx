import { walls } from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'

export function Header() {
  const currentWall = useGalleryStore((s) => s.currentWall)
  const goToWall = useGalleryStore((s) => s.goToWall)

  return (
    <header className="header">
      <span className="logo">TNES</span>
      <nav className="nav">
        {walls.map((wall) => (
          <button
            key={wall.index}
            className={`nav-link ${
              currentWall === wall.index ? 'nav-link-active' : ''
            }`}
            onClick={() => goToWall(wall.index)}
          >
            {wall.name}
          </button>
        ))}
      </nav>
      <span className="header-right">↗</span>
    </header>
  )
}

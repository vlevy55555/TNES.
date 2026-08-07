import { ARCHIVE_WALL, walls } from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'
import { useCartCount } from '../../store/useCartStore'

export function Header() {
  const currentWall = useGalleryStore((s) => s.currentWall)
  const goToWall = useGalleryStore((s) => s.goToWall)
  const printsPage = useGalleryStore((s) => s.printsPage)
  const manifestoRoomOpen = useGalleryStore((s) => s.manifestoRoomOpen)
  const count = useCartCount()
  const mobileGuide = manifestoRoomOpen
    ? 'Manifesto'
    : currentWall === ARCHIVE_WALL
      ? `Prints ${printsPage + 1}/2`
      : walls[currentWall].name

  return (
    <header className="header">
      {/* the wordmark leaves the room for the landing page, the site's root */}
      <a className="logo" href="/">TNES.</a>
      <nav className="nav">
        {walls.map((wall) => (
          <button
            key={wall.index}
            className={`nav-link ${currentWall === wall.index ? 'nav-link-active' : ''}`}
            onClick={() => goToWall(wall.index)}
          >
            {wall.name}
          </button>
        ))}
      </nav>
      <span className="mobile-wall-guide" aria-live="polite">{mobileGuide}</span>
      {/* the cart is its own screen — leaving the room is the point */}
      <a
        className="header-cart"
        href="/cart"
        aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
      >
        Cart{count > 0 && <span className="cart-badge">{count}</span>}
      </a>
    </header>
  )
}

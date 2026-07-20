import { walls } from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'
import { useCartCount, useCartStore } from '../../store/useCartStore'

export function Header() {
  const currentWall = useGalleryStore((s) => s.currentWall)
  const goToWall = useGalleryStore((s) => s.goToWall)
  const inArchive = useGalleryStore((s) => s.inArchive)
  const enterArchive = useGalleryStore((s) => s.enterArchive)
  const openCart = useCartStore((s) => s.setOpen)
  const count = useCartCount()

  return (
    <header className="header">
      <span className="logo">TNES</span>
      <nav className="nav">
        {/* the archive hangs to the LEFT of the opening wall, so it leads the
            sections here the same way the back arrow reaches it */}
        <button
          className={`nav-link ${inArchive ? 'nav-link-active' : ''}`}
          onClick={enterArchive}
        >
          Archive
        </button>
        {walls.map((wall) => (
          <button
            key={wall.index}
            className={`nav-link ${
              currentWall === wall.index && !inArchive ? 'nav-link-active' : ''
            }`}
            onClick={() => goToWall(wall.index)}
          >
            {wall.name}
          </button>
        ))}
      </nav>
      <button
        className="header-cart"
        onClick={() => openCart(true)}
        aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
      >
        Cart{count > 0 && <span className="cart-badge">{count}</span>}
      </button>
    </header>
  )
}

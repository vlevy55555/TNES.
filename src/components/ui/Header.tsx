import { walls } from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'
import { useCartCount, useCartStore } from '../../store/useCartStore'

export function Header() {
  const currentWall = useGalleryStore((s) => s.currentWall)
  const goToWall = useGalleryStore((s) => s.goToWall)
  const openCart = useCartStore((s) => s.setOpen)
  const count = useCartCount()

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

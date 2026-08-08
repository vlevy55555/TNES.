import { INQUIRY_EMAIL, ABOUT } from '../data/artworks'
import { useCartCount } from '../store/useCartStore'

// ponytail: placeholder hrefs for what does not exist yet — only the landing,
// the shop, the cart, the store and moments are real today.
const NAV = [
  { label: 'shop', href: '/shop' },
  { label: 'studio', href: '/#studio' },
  { label: 'catalogs', href: '/shop#catalogs' },
  { label: 'moments', href: '/moments' },
  { label: 'about', href: '/about' },
]

// Shown only where Shopify can't answer — an unreachable store still owes the
// visitor a number rather than a blank.
export const PRICE = '$236'

/** Every catalog reference opens the complete catalog presentation. */
export const catalogHref = (title?: string) => {
  if (!title || title === 'private') return '/shop#catalogs'
  return `/shop?catalog=${encodeURIComponent(title.replaceAll(' ', '-'))}`
}

/**
 * The wordmark always returns to the landing page, which is the site root.
 * `cart` carries its count in the nav's own mono caps — no badge, nothing
 * floating: it is a link to a screen like any other on this site.
 */
export function ShopHeader({ current = 'shop' }: { current?: string }) {
  const count = useCartCount()

  return (
    <header className="shop__header">
      <a className="shop__logo" href="/">TNES.</a>
      <nav className="shop__nav" aria-label="Navegação principal">
        {NAV.map((item) => (
          <a key={item.label} href={item.href} aria-current={item.label === current ? 'page' : undefined}>
            {item.label}
          </a>
        ))}
        <a href="/cart" aria-current={current === 'cart' ? 'page' : undefined}>
          cart{count > 0 && ` (${count})`}
        </a>
      </nav>
    </header>
  )
}

export function ShopFooter() {
  return (
    <footer className="shop__footer">
      <span className="shop__mark">[O]</span>
      <div className="shop__footer-body">
        <p className="shop__footer-tagline">
          photographs found in the in-between,
          <br />
          made to live with.
        </p>
        <div className="shop__footer-links">
          <div>
            <a href="/shop">shop</a>
            <a href="/#studio">studio</a>
            <a href="/shop#catalogs">catalogs</a>
            <a href="/moments">moments</a>
            <a href="/about">about</a>
          </div>
          <div>
            <a href={ABOUT.contact.instagramUrl} target="_blank" rel="noopener noreferrer">instagram</a>
            <a href={`mailto:${INQUIRY_EMAIL}`}>contact</a>
            <a href={`mailto:${INQUIRY_EMAIL}?subject=Inquiry`}>inquiries</a>
            <a href={catalogHref('private')}>private catalogs</a>
          </div>
        </div>
      </div>
      <div className="shop__footer-base">
        <span>new york · são paulo</span>
        <span>© victor safdie levy</span>
      </div>
    </footer>
  )
}

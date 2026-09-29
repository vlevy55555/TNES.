import { ABOUT } from '../data/artworks'
import { useCartCount } from '../store/useCartStore'
import { useContactStore } from '../store/useContactStore'
import { SiteNav } from './SiteNav'
import ContactOverlay from './ContactOverlay'
import { analyticsAvailable } from '../analytics/clarity'

// ponytail: placeholder hrefs for what does not exist yet — only the landing,
// the shop, the cart, the store and moments are real today.
const NAV = [
  { label: 'works', href: '/works' },
  { label: 'catalogs', href: '/works#catalogs' },
  { label: 'moments', href: '/moments' },
  { label: 'about', href: '/about' },
]

// Never present a stale amount while Shopify is loading or unavailable.
export const PRICE = '—'

/** Every catalog reference opens the complete catalog presentation. */
export const catalogHref = (title?: string) => {
  if (!title || title === 'private') return '/works#catalogs'
  return `/works/catalogs/${encodeURIComponent(title.replaceAll(' ', '-'))}`
}

/**
 * The wordmark always returns to the landing page, which is the site root.
 * `cart` carries its count in the nav's own mono caps — no badge, nothing
 * floating: it is a link to a screen like any other on this site.
 */
export function ShopHeader({ current = 'shop', showSpecialPrices = false }: { current?: string; showSpecialPrices?: boolean }) {
  const count = useCartCount()
  const items = [
    ...NAV,
    { label: count > 0 ? `cart (${count})` : 'cart', href: '/cart' },
    ...(showSpecialPrices ? [{ label: 'special prices', href: '/special-prices' }] : []),
  ]

  return (
    <header className="shop__header">
      <a className="shop__logo" href="/">TNES.</a>
      <SiteNav
        items={items}
        current={current === 'cart' ? items.find((item) => item.href === '/cart')?.label : current === 'shop' ? 'works' : current}
        className="shop__nav"
      />
    </header>
  )
}

export function ShopFooter() {
  const openContact = useContactStore((s) => s.openContact)

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
            <a href="/works">works</a>
            <a href="/works#catalogs">catalogs</a>
            <a href="/wall">your wall</a>
            <a href="/moments">moments</a>
            <a href="/about">about</a>
          </div>
          <div>
            <a href={ABOUT.contact.instagramUrl} target="_blank" rel="noopener noreferrer">instagram</a>
            {/* `contact` and `inquiries` used to be the same mailto twice, one
                of them with a subject line. One entry now, and it opens a real
                form instead of guessing at the visitor's mail app. */}
            <button type="button" onClick={() => openContact()}>contact</button>
            <a href={catalogHref('private')}>private catalogs</a>
            <a href="/privacy">privacy</a>
            {analyticsAvailable && (
              <button type="button" onClick={() => window.dispatchEvent(new Event('tnes:privacy-choices'))}>analytics choices</button>
            )}
          </div>
        </div>
      </div>
      <div className="shop__footer-base">
        <span>new york · são paulo</span>
        <span>© victor safdie levy</span>
      </div>

      {/* the footer is on every screen, so the panel it raises is too */}
      <ContactOverlay />
    </footer>
  )
}

import { INQUIRY_EMAIL, ABOUT } from '../data/artworks'

// ponytail: placeholder hrefs for what does not exist yet — only the landing,
// the shop and the store are real today. `moments` stays out per CLAUDE.md.
const NAV = [
  { label: 'shop', href: '/shop' },
  { label: 'studio', href: '/#studio' },
  { label: 'catalogs', href: '/shop#catalogs' },
  { label: 'about', href: '/' },
  { label: 'cart', href: '/cart' },
]

// ponytail: one placeholder price across the shop, as asked. Live per-variant
// pricing already exists in ArtworkPanel via useProduct — point this at it once
// the store's option names line up with the frame/size labels shown here.
export const PRICE = '$100'

export const catalogHref = (title: string) =>
  `mailto:${INQUIRY_EMAIL}?subject=${encodeURIComponent(`Catalog · ${title}`)}`

/** The wordmark always returns to the landing page, which is the site root. */
export function ShopHeader({ current = 'shop' }: { current?: string }) {
  return (
    <header className="shop__header">
      <a className="shop__logo" href="/">TNES.</a>
      <nav className="shop__nav" aria-label="Navegação principal">
        {NAV.map((item) => (
          <a key={item.label} href={item.href} aria-current={item.label === current ? 'page' : undefined}>
            {item.label}
          </a>
        ))}
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
            <a href="/">about</a>
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

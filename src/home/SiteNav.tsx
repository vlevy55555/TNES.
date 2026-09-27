import { useEffect, useState } from 'react'
import { RevealText } from './reveal'

export type NavItem = { label: string; href: string }

/**
 * The site's one navigation. Every screen renders this — the landing, the shop,
 * a work, the cart, about, moments — so the sections, their order and their
 * behaviour cannot drift apart.
 *
 * Desktop: a row of links, as before.
 * Mobile:  a three-line button in the header; the same `<nav>` becomes a panel
 *          that slides in from the right. One list, two layouts — nothing is
 *          rendered twice, so there is no second copy to forget to update.
 *
 * `className` carries the page's own nav class (`hero__nav` / `shop__nav`),
 * which is where that page's ink lives. Everything structural keys off
 * `site-nav`.
 */
export function SiteNav({
  items,
  current,
  className = '',
  /** the landing enters every word through the §5.1 mask; the paper pages do not */
  reveal = false,
}: {
  items: NavItem[]
  current?: string
  className?: string
  reveal?: boolean
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    // the panel covers the page — let nothing scroll underneath it
    const previous = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.documentElement.style.overflow = previous
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  // a link that only moves the hash leaves the panel standing over the page
  const close = () => setOpen(false)

  return (
    <>
      <button
        type="button"
        className={`site-nav__toggle ${open ? '-is-open' : ''}`}
        aria-expanded={open}
        aria-controls="site-nav"
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>

      <div
        className={`site-nav__scrim ${open ? '-is-open' : ''}`}
        aria-hidden="true"
        onClick={close}
      />

      <nav
        id="site-nav"
        className={`site-nav ${className} ${open ? '-is-open' : ''}`}
        aria-label="Navegação principal"
      >
        {items.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={item.href === '/special-prices' ? 'site-nav__special' : undefined}
            aria-current={item.label === current ? 'page' : undefined}
            onClick={close}
          >
            {reveal ? <RevealText>{item.label}</RevealText> : item.label}
          </a>
        ))}
      </nav>
    </>
  )
}

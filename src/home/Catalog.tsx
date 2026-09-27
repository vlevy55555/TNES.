import { useState, type FormEvent } from 'react'
import { artworks, INQUIRY_EMAIL } from '../data/artworks'
import { RevealText } from './reveal'
import { ShopFooter, ShopHeader } from './ShopChrome'
import { useContactStore } from '../store/useContactStore'
import EarlyAccess from './EarlyAccess'
import './home.css'
import './shop.css'
import './catalog.css'

type CatalogSlug = 'the-hamptons' | 'selected-works'

const CATALOG_PASSWORDS: Record<CatalogSlug, string> = {
  'the-hamptons': 'hampTNES.',
  'selected-works': 'victor',
}

const CATALOG_INQUIRY_TYPES = [
  'acquisition',
  'commission',
  'interior / hospitality',
  'collaboration',
  'East Hampton works on view',
  'general inquiry',
] as const

function CatalogInquiry({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [type, setType] = useState(CATALOG_INQUIRY_TYPES[0])
  const [interest, setInterest] = useState('none / general')
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState('')

  const sendInquiry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setFormError('add your name and a valid email to continue.')
      return
    }

    const body = [
      `Name: ${name.trim()}`,
      `Email: ${email.trim()}`,
      ...(phone.trim() ? [`Phone: ${phone.trim()}`] : []),
      `Inquiry type: ${type}`,
      `Work of interest: ${interest}`,
      '',
      message.trim() || '(no message)',
    ].join('\n')

    window.location.href = `mailto:${INQUIRY_EMAIL}?subject=${encodeURIComponent(`TNES. inquiry — ${type}`)}&body=${encodeURIComponent(body)}`
  }

  return (
    <div className="catalog-inquiry" role="dialog" aria-modal="true" aria-labelledby="catalog-inquiry-title">
      <div className="catalog-inquiry__panel">
        <header className="catalog-inquiry__header">
          <div>
            <p>[O]</p>
            <h2 id="catalog-inquiry-title">write to the studio.</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="close inquiry">×</button>
        </header>

        <form className="catalog-inquiry__form" onSubmit={sendInquiry} noValidate data-clarity-mask="True">
          <label><span>name.</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="your name." /></label>
          <label><span>email.</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@domain.com" /></label>
          <label><span>phone. <em>(optional)</em></span><input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+1 555 555 5555" /></label>
          <label>
            <span>inquiry type.</span>
            <select value={type} onChange={(event) => setType(event.target.value as typeof type)}>
              {CATALOG_INQUIRY_TYPES.map((option) => <option value={option} key={option}>{option}.</option>)}
            </select>
          </label>
          <label>
            <span>work of interest. <em>(optional)</em></span>
            <select value={interest} onChange={(event) => setInterest(event.target.value)}>
              <option value="none / general">none / general.</option>
              {artworks.map((work) => <option value={work.title} key={work.id}>{work.title.toLowerCase()}.</option>)}
            </select>
          </label>
          <label className="catalog-inquiry__message"><span>message.</span><textarea rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="tell us what you're considering." /></label>
          <div className="catalog-inquiry__submit">
            <button type="submit">send inquiry <span aria-hidden="true">→</span></button>
            <p aria-live="polite">{formError}</p>
          </div>
        </form>
      </div>
    </div>
  )
}

const catalogCopy = {
  'the-hamptons': {
    title: 'the hamptons',
    description: 'the body of work shown for the east coast summer — coastline, light, and the hours around it. available as custom prints framed to the room.',
    meta: 'summer 2026  ·  east hampton, napeague, montauk  ·  36 works',
    ids: ['runner', 'the-pool', 'ditch-plains-far', 'praia-da-baleia', 'wied-il-ghasri', 'ischia-mezzatorre'],
  },
  'selected-works': {
    title: 'selected works',
    description: 'a wider selection from the archive across brazil, malta, peru, italy, and switzerland — shown for custom orders, interiors, and collectors working at scale.',
    meta: '60+ works  ·  archive selection  ·  studio catalog',
    ids: ['wied-il-ghasri', 'moreira-crowded-beach', 'florence-dogman', 'lauterbrunnen', 'ditch-plains-far', 'appenzell-alpine-lake'],
  },
} as const

const hamptonsLocations = [
  'main beach', 'georgica beach', 'main beach', 'atlantic ave beach',
  'indian wells beach', 'ditch plains', 'ditch plains', 'ditch plains',
  'main beach', 'main beach', 'main beach', 'shadmoor park',
  'shadmoor park', 'shadmoor park', 'ditch plains', 'main beach',
  'atlantic ave beach', 'hook pond', 'napeague', 'napeague',
  'napeague', 'montauk', 'east hampton', 'montauk',
  'montauk', 'napeague', 'montauk', 'montauk',
  'napeague', 'napeague', 'east hampton', 'napeague',
  'napeague', 'napeague', 'napeague', 'main beach',
] as const

const hamptonsWorks = hamptonsLocations.map((location, index) => {
  const number = String(index + 1).padStart(2, '0')
  return {
    number,
    location,
    image: `/images/catalogs/the-hamptons/${number}-${location.replaceAll(' ', '-')}.webp`,
    preview: `/images/catalogs/the-hamptons/${number}-${location.replaceAll(' ', '-')}-1200.webp`,
  }
})

// One website spread per photographic page in the final catalog PDF.
const hamptonsSpreadSizes = [4, 3, 3, 4, 3, 4, 3, 4, 2, 2, 2, 2] as const
const hamptonsSpreads = hamptonsSpreadSizes.map((size, spreadIndex) => {
  const start = hamptonsSpreadSizes.slice(0, spreadIndex).reduce<number>((total, value) => total + value, 0)
  return hamptonsWorks.slice(start, start + size)
})

const chapterCopy = [
  ['coastline', 'edges of land and water. undulating shorelines and open horizon.'],
  ['light', 'light in motion. reflective water and moments that fade.'],
  ['stillness', 'quiet scenes held long enough to breathe, observe, and be.'],
  ['distance', 'places remembered by atmosphere, scale, and the space between.'],
] as const

export function isCatalogSlug(value: string | null): value is CatalogSlug {
  return value === 'the-hamptons'
}

export default function Catalog({ slug }: { slug: CatalogSlug }) {
  const openContact = useContactStore((state) => state.openContact)
  const [unlocked, setUnlocked] = useState(slug === 'the-hamptons')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [inquiryOpen, setInquiryOpen] = useState(false)
  const [error, setError] = useState('')
  const catalog = catalogCopy[slug]
  const selected = catalog.ids
    .map((id) => artworks.find((work) => work.id === id))
    .filter((work): work is (typeof artworks)[number] => Boolean(work))
  const chapterOffset = slug === 'selected-works' ? 2 : 0
  const chapters = Array.from({ length: Math.ceil(selected.length / 3) }, (_, index) => ({
    label: chapterCopy[(index + chapterOffset) % chapterCopy.length],
    works: selected.slice(index * 3, index * 3 + 3),
  }))

  const unlockCatalog = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (password !== CATALOG_PASSWORDS[slug]) {
      setError('incorrect password. please try again.')
      return
    }
    setUnlocked(true)
  }

  if (!unlocked) {
    return (
      <main className="shop catalog-gate">
        <ShopHeader current="catalogs" />
        <section className="catalog-gate__content">
          <p className="catalog-gate__mark">[O]</p>
          <h1>this catalog is private.</h1>
          <p className="catalog-gate__intro">enter the password from the studio to view the photographs.</p>
          <form className="catalog-gate__form" onSubmit={unlockCatalog}>
            <label htmlFor="catalog-password">password</label>
            <div className="catalog-gate__password-field">
              <input
                id="catalog-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setError('')
                }}
                autoComplete="current-password"
                autoFocus
              />
              <button
                className="catalog-gate__password-toggle"
                type="button"
                aria-label={showPassword ? 'hide password' : 'show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                  <circle cx="12" cy="12" r="2.75" />
                  {showPassword && <path d="m4 4 16 16" />}
                </svg>
              </button>
            </div>
            <div className="catalog-gate__actions">
              <button type="submit">enter catalog <span aria-hidden="true">→</span></button>
              <p className="catalog-gate__contact">
                no password? <button type="button" onClick={() => setInquiryOpen(true)}>write to the studio</button>
              </p>
            </div>
            <p className="catalog-gate__error" aria-live="polite">{error}</p>
          </form>
        </section>
        {inquiryOpen && <CatalogInquiry onClose={() => setInquiryOpen(false)} />}
      </main>
    )
  }

  return (
    <main className="shop catalog-page">
      <ShopHeader current="catalogs" />

      <section className="catalog-page__intro">
        <p className="catalog-page__crumb">
          <a href="/works#catalogs">catalogs</a><span>/</span>{catalog.title}
        </p>

        <div className="catalog-page__overview">
          <div className="catalog-page__lead">
            <h1><RevealText block>{catalog.title}.</RevealText></h1>
            <p>{catalog.description}</p>
            <p className="catalog-page__meta">{catalog.meta}</p>
            {slug === 'the-hamptons' && (
              <button
                className="catalog-page__lead-inquire"
                type="button"
                onClick={() => openContact('the hamptons catalog inquiry')}
              >
                inquire <span aria-hidden="true">→</span>
              </button>
            )}
          </div>

          <div className="catalog-page__facts">
            {slug === 'the-hamptons' ? (
              <div className="catalog-page__studio-note">
                <p className="catalog-page__studio-label">the studio</p>
                <h2>nothing happens twice.</h2>
                <p>
                  no one goes back for a moment. stand in<br />
                  the same place a year later and it hands<br />
                  you something else.
                </p>
                <p>
                  what is here is one person's record of one<br />
                  summer in the hamptons. not a group show.<br />
                  not a marketplace.
                </p>
                <p>
                  owning a piece is keeping the minute<br />
                  someone stopped, and deciding it was<br />
                  worth keeping.
                </p>
                <p>thirty-six images here. one becomes the print.</p>
              </div>
            ) : (
              <dl>
                <div><dt>purpose</dt><dd>a curated body of work for custom prints and collector editions.</dd></div>
                <div><dt>prints</dt><dd>available in multiple sizes with archival materials and framing options.</dd></div>
                <div><dt>interiors</dt><dd>selected works shown in residential and hospitality spaces.</dd></div>
                <div><dt>collectors</dt><dd>for collectors, curators, and design professionals.</dd></div>
                <div><dt>orders</dt><dd>all orders placed upon inquiry.</dd></div>
              </dl>
            )}
            {slug !== 'the-hamptons' && (
              <div className="catalog-page__actions">
                <button type="button" onClick={() => openContact(`${catalog.title} print inquiry`)}>
                  inquire about prints <span aria-hidden="true">→</span>
                </button>
                <a href="/works#catalogs">all catalogs <span aria-hidden="true">→</span></a>
              </div>
            )}
          </div>
        </div>
      </section>

      {slug === 'the-hamptons' ? (
        <section className="catalog-page__hamptons" aria-label="the hamptons works 01 through 36">
          {hamptonsSpreads.map((works, spreadIndex) => (
            <div
              className={`catalog-page__spread catalog-page__spread--${works.length} ${works.length === 3 && spreadIndex === 1 ? 'catalog-page__spread--wide-last' : ''}`}
              key={works[0].number}
            >
              {works.map((work, workIndex) => (
                <figure
                  className={`catalog-page__hamptons-work ${works.length === 3 && workIndex === (spreadIndex === 1 ? 2 : 0) ? 'catalog-page__hamptons-work--wide' : ''} ${['07', '29', '32', '35'].includes(work.number) ? 'catalog-page__hamptons-work--compact' : ''}`}
                  key={work.number}
                >
                  <button
                    className="catalog-page__hamptons-trigger"
                    type="button"
                    onClick={() => openContact(`the hamptons — photograph ${work.number} — ${work.location}`)}
                    aria-label={`inquire about photograph ${work.number}, ${work.location}`}
                  >
                    <img
                      src={work.preview}
                      srcSet={`${work.preview} 1200w, ${work.image} 2400w`}
                      sizes="(max-width: 800px) calc(100vw - 32px), 50vw"
                      alt={`${work.number}, ${work.location}, the hamptons, 2026`}
                      loading={spreadIndex === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                    <span className="catalog-page__hamptons-caption"><span>{work.number}</span>{work.location}</span>
                  </button>
                </figure>
              ))}
            </div>
          ))}
        </section>
      ) : (
        <section className="catalog-page__timeline" aria-label={`${catalog.title} works`}>
          {chapters.map(({ label: [title, description], works }, index) => (
            <article className="catalog-page__chapter" key={`${title}-${index}`}>
              <header>
                <p><span>{String(index + chapterOffset + 1).padStart(2, '0')}</span>{title}</p>
                <p>{description}</p>
              </header>
              <div className={`catalog-page__mosaic catalog-page__mosaic--${works.length}`}>
                {works.map((work, workIndex) => (
                  <a className={`catalog-page__work catalog-page__work--${workIndex + 1} catalog-page__work--${work.id}`} href={work.shopifyHandle ? `/works/${work.id}` : '/works'} key={work.id}>
                    <figure><img src={work.image} alt={`${work.title}, ${work.subtitle}`} loading="lazy" /></figure>
                    <p><span>{work.title.toLowerCase()}.</span><span>{work.subtitle.toLowerCase()}</span></p>
                  </a>
                ))}
              </div>
            </article>
          ))}
        </section>
      )}

      <EarlyAccess />
      <ShopFooter />
    </main>
  )
}

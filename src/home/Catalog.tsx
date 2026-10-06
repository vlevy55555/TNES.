import { useState, type FormEvent } from 'react'
import { artworks } from '../data/artworks'
import { cms, paragraphsOf, sized, type CmsCatalog } from '../data/cms'
import { inquiryMailto, sendInquiry } from '../lib/contact'
import { trackAnalyticsEvent } from '../analytics/clarity'
import { RevealText } from './reveal'
import { ShopFooter, ShopHeader } from './ShopChrome'
import { useContactStore } from '../store/useContactStore'
import EarlyAccess from './EarlyAccess'
import './home.css'
import './shop.css'
import './catalog.css'

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
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const submitInquiry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (sending || sent) return
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setFormError('add your name and a valid email to continue.')
      return
    }

    const details: [string, string][] = [
      ...(phone.trim() ? [['Phone', phone.trim()] as [string, string]] : []),
      ['Inquiry type', type],
      ['Work of interest', interest],
    ]
    const inquiry = {
      name: name.trim(),
      email: email.trim(),
      subject: `inquiry — ${type}`,
      message: message.trim() || '(no message)',
      details,
      source: 'catalog',
    }
    setSending(true)
    setFormError('')
    try {
      await sendInquiry(inquiry)
      trackAnalyticsEvent('inquiry_sent')
      setSent(true)
      setFormError('sent. the studio will write back soon.')
    } catch {
      // a written inquiry is never lost: the mail app gets it instead
      window.location.href = inquiryMailto(inquiry)
      setFormError('opening your mail app with the inquiry written out.')
    } finally {
      setSending(false)
    }
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

        <form className="catalog-inquiry__form ph-no-capture" onSubmit={submitInquiry} noValidate data-clarity-mask="True">
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
            <button type="submit" disabled={sending || sent}>
              {sent ? 'inquiry sent' : sending ? 'sending…' : <>send inquiry <span aria-hidden="true">→</span></>}
            </button>
            <p aria-live="polite">{formError}</p>
          </div>
        </form>
      </div>
    </div>
  )
}

// Blocks of photographs, in order. Unset in the Studio, the catalog takes the
// rhythm The Hamptons was laid out with; photographs left over sit in pairs.
const DEFAULT_SPREADS = [4, 3, 3, 4, 3, 4, 3, 4]

function spreadsOf<T>(photos: T[], sizes: number[]) {
  const spreads: T[][] = []
  let used = 0
  for (const size of sizes.length ? sizes : DEFAULT_SPREADS) {
    if (used >= photos.length) break
    spreads.push(photos.slice(used, used + size))
    used += size
  }
  while (used < photos.length) {
    spreads.push(photos.slice(used, used + 2))
    used += 2
  }
  return spreads
}

// The Studio serves every size from one upload; the files the site shipped
// with before the Studio kept a 1200 px copy beside each original.
const previewOf = (src: string) => src.startsWith('https://') ? sized(src, 1200) : src.replace(/\.webp$/, '-1200.webp')

export function isCatalogSlug(value: string | null): value is string {
  return cms.catalogs.some((catalog) => catalog.slug === value)
}

export default function Catalog({ slug }: { slug: string }) {
  const catalog = cms.catalogs.find((entry) => entry.slug === slug) as CmsCatalog
  const openContact = useContactStore((state) => state.openContact)
  const [unlocked, setUnlocked] = useState(!catalog.password)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [inquiryOpen, setInquiryOpen] = useState(false)
  const [error, setError] = useState('')
  const photos = catalog.photos.map((photo, index) => ({ ...photo, number: String(index + 1).padStart(2, '0') }))
  const spreads = spreadsOf(photos, catalog.spreads)

  const unlockCatalog = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (password !== catalog.password) {
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
            {catalog.meta && <p className="catalog-page__meta">{catalog.meta}</p>}
            <button
              className="catalog-page__lead-inquire"
              type="button"
              onClick={() => openContact(catalog.inquireSubject || `${catalog.title} catalog inquiry`)}
            >
              inquire <span aria-hidden="true">→</span>
            </button>
          </div>

          {catalog.studioNote.text && (
            <div className="catalog-page__facts">
              <div className="catalog-page__studio-note">
                {catalog.studioNote.label && <p className="catalog-page__studio-label">{catalog.studioNote.label}</p>}
                {catalog.studioNote.title && <h2>{catalog.studioNote.title}</h2>}
                {/* a blank line in the Studio starts a paragraph; a single
                    line break stays a break, the way the text was set */}
                {paragraphsOf(catalog.studioNote.text).map((paragraph) => (
                  <p key={paragraph}>
                    {paragraph.split('\n').map((line, index) => (
                      <span key={index}>{index > 0 && <br />}{line}</span>
                    ))}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section
        className="catalog-page__hamptons"
        aria-label={`${catalog.title} works 01 through ${String(photos.length).padStart(2, '0')}`}
      >
        {spreads.map((works, spreadIndex) => (
          <div
            className={`catalog-page__spread catalog-page__spread--${works.length} ${works.length === 3 && spreadIndex === 1 ? 'catalog-page__spread--wide-last' : ''}`}
            key={works[0].number}
          >
            {works.map((work, workIndex) => (
              <figure
                className={`catalog-page__hamptons-work ${works.length === 3 && workIndex === (spreadIndex === 1 ? 2 : 0) ? 'catalog-page__hamptons-work--wide' : ''} ${work.compact ? 'catalog-page__hamptons-work--compact' : ''}`}
                key={work.number}
              >
                <button
                  className="catalog-page__hamptons-trigger"
                  type="button"
                  onClick={() => openContact(`${catalog.title} — photograph ${work.number} — ${work.location}`)}
                  aria-label={`inquire about photograph ${work.number}, ${work.location}`}
                >
                  <img
                    src={previewOf(work.image)}
                    srcSet={`${previewOf(work.image)} 1200w, ${sized(work.image, 2400)} 2400w`}
                    sizes="(max-width: 800px) calc(100vw - 32px), 50vw"
                    width={work.width}
                    height={work.height}
                    alt={`${work.number}, ${work.location}, ${catalog.title}`}
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

      <EarlyAccess />
      <ShopFooter />
    </main>
  )
}

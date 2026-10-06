import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { gsap } from 'gsap'
import { INQUIRY_EMAIL, INQUIRY_TYPES } from '../data/artworks'
import { inquiryMailto, sendInquiry } from '../lib/contact'
import { useContactStore } from '../store/useContactStore'
import { trackAnalyticsEvent } from '../analytics/clarity'

/**
 * Where a message goes: /api/contact (api/contact.js), which mails it to the
 * studio through Resend with the visitor as reply-to. If that fails for any
 * reason, the finished message is handed to the visitor's mail app instead of
 * being lost.
 */
type Draft = { name: string; email: string; subject: string; message: string }

const EMPTY: Draft = { name: '', email: '', subject: '', message: '' }

export default function ContactOverlay() {
  const open = useContactStore((s) => s.open)
  const presetSubject = useContactStore((s) => s.subject)
  const presetBody = useContactStore((s) => s.body)
  const close = useContactStore((s) => s.closeContact)

  const panel = useRef<HTMLElement>(null)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [trap, setTrap] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const set = (field: keyof Draft) => (event: { target: { value: string } }) => {
    setDraft((current) => ({ ...current, [field]: event.target.value }))
    setMessage('')
  }

  // a fresh sheet each time it opens, carrying whatever raised it
  useEffect(() => {
    if (!open) return
    setDraft({ ...EMPTY, subject: presetSubject, message: presetBody })
    setSent(false)
    setMessage('')
  }, [open, presetSubject, presetBody])

  // The panel opens the way a plate opens on this site: §5.2, the same curtain
  // /about uses on its photographs — the frame wipes up from its own bottom
  // edge while the picture settles out of a 1.12 push. The sheet's lines follow
  // it, staggered, on `expo.out`. Nothing here is new vocabulary.
  useLayoutEffect(() => {
    const root = panel.current
    if (!root || !open) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const context = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: 'expo.out' } })
        .from('.contact__plate', { clipPath: 'inset(0 0 100% 0)', duration: 1.15 }, 0.1)
        .from('.contact__plate img', { scale: 1.12, yPercent: 6, duration: 1.4 }, 0.1)
        .from(
          '.contact__sheet > *, .contact__form > *',
          { yPercent: 40, opacity: 0, duration: 0.8, stagger: 0.05 },
          0.24,
        )
    }, root)

    return () => context.revert()
  }, [open, sent])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    const previous = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.documentElement.style.overflow = previous
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, close])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (sending) return
    // a field no human sees and every naive bot fills
    if (trap) return
    if (!draft.name.trim()) return setMessage('a name, please')
    if (!/^\S+@\S+\.\S+$/.test(draft.email)) return setMessage('that email does not look right')
    if (draft.message.trim().length < 10) return setMessage('a little more than that, please')

    setSending(true)
    setMessage('')
    const inquiry = { ...draft, source: 'contact panel' }
    try {
      await sendInquiry(inquiry)
      trackAnalyticsEvent('inquiry_sent')
      setSent(true)
    } catch {
      // never pretend it was delivered, and never drop a written message
      window.location.assign(inquiryMailto(inquiry))
      setMessage('opening your mail app with the message written out')
    } finally {
      setSending(false)
    }
  }

  // Portalled to the body on purpose. The footer that raises this panel sets
  // `position: relative; z-index: 2` on some pages, which makes it a stacking
  // context — and a panel nested inside one cannot rise above anything outside
  // it, however large its own z-index. It would open *behind* the header.
  return createPortal(
    <>
      <div
        className={`contact__scrim ${open ? '-is-open' : ''}`}
        aria-hidden="true"
        onClick={close}
      />

      <aside
        className={`contact ${open ? '-is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Contato"
        aria-hidden={!open}
        ref={panel}
      >
        <button type="button" className="contact__close" onClick={close} aria-label="Fechar">
          <span aria-hidden="true">×</span>
        </button>

        {/* the hand that will answer — his own, stamping a print at the desk */}
        <figure className="contact__plate">
          <img src="/about/stamping.webp" alt="" loading="lazy" decoding="async" />
        </figure>

        <div className="contact__sheet">
        {sent ? (
          <div className="contact__done">
            <p className="contact__eyebrow">received</p>
            <h2 className="contact__title">thank you.</h2>
            <p className="contact__copy">
              victor reads everything himself. expect a reply from{' '}
              <span className="contact__address">{INQUIRY_EMAIL}</span>.
            </p>
            <button type="button" className="contact__again" onClick={close}>
              close
            </button>
          </div>
        ) : (
          <>
            <p className="contact__eyebrow">contact</p>
            <h2 className="contact__title">leave a message.</h2>
            <p className="contact__copy">
              acquisitions, commissions, interiors, press — it reaches victor directly.
            </p>

            <form className="contact__form ph-no-capture" onSubmit={submit} noValidate data-clarity-mask="True">
              <label className="contact__field">
                <span>name</span>
                <input value={draft.name} onChange={set('name')} autoComplete="name" />
              </label>

              <label className="contact__field">
                <span>email</span>
                <input
                  type="email"
                  value={draft.email}
                  onChange={set('email')}
                  autoComplete="email"
                />
              </label>

              <label className="contact__field">
                <span>subject</span>
                <input
                  value={draft.subject}
                  onChange={set('subject')}
                  list="contact-subjects"
                  placeholder="what this is about"
                />
              </label>
              <datalist id="contact-subjects">
                {INQUIRY_TYPES.map((type) => (
                  <option value={type} key={type} />
                ))}
              </datalist>

              <label className="contact__field contact__field--message">
                <span>message</span>
                <textarea rows={5} value={draft.message} onChange={set('message')} />
              </label>

              {/* the honeypot: off-screen, unlabelled, never focusable */}
              <input
                className="contact__trap"
                value={trap}
                onChange={(event) => setTrap(event.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              <button className="contact__send" type="submit" disabled={sending}>
                {sending ? 'sending…' : 'send'} <span aria-hidden="true">→</span>
              </button>

              <p className="contact__message" aria-live="polite">
                {message}
              </p>
            </form>
          </>
        )}
        </div>
      </aside>
    </>,
    document.body,
  )
}

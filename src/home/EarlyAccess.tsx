import { useEffect, useState, type FormEvent } from 'react'

const NOTIFY_URL = import.meta.env.VITE_NOTIFY_URL as string | undefined
const ARCHIVE_OPENING = new Date('2026-09-21T00:00:00-03:00')

const remainingUntilOpening = () => {
  const seconds = Math.max(0, Math.floor((ARCHIVE_OPENING.getTime() - Date.now()) / 1000))
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  }
}

async function subscribe(email: string) {
  const list = JSON.parse(localStorage.getItem('tnes-subscribers') ?? '[]')
  if (!list.includes(email)) list.push(email)
  localStorage.setItem('tnes-subscribers', JSON.stringify(list))

  if (!NOTIFY_URL) return
  const response = await fetch(NOTIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ email, at: new Date().toISOString(), source: 'studio' }),
  })
  if (!response.ok) throw new Error(`notify: ${response.status}`)
}

/** The copy is the only thing that changes between the pages that carry this —
 *  the countdown, the list and the validation are the same everywhere. */
export default function EarlyAccess({
  showCountdown = false,
  className = '',
  eyebrow = 'early access',
  title = 'be the first to know.',
  copy = 'early access to new work, limited objects, and studio collaborations.',
}: {
  showCountdown?: boolean
  className?: string
  eyebrow?: string
  title?: string
  copy?: string
}) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [remaining, setRemaining] = useState(remainingUntilOpening)

  useEffect(() => {
    if (!showCountdown) return
    const timer = window.setInterval(() => setRemaining(remainingUntilOpening()), 1000)
    return () => window.clearInterval(timer)
  }, [showCountdown])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (sending) return
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setMessage('please enter a valid email')
      return
    }

    setSending(true)
    setMessage('')
    try {
      await subscribe(email)
      setEmail('')
      setMessage('you’re on the list.')
    } catch {
      setMessage('couldn’t save that — please try again')
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className={`studio__signup ${showCountdown ? 'studio__signup--with-countdown' : ''} ${className}`}
    >
      <div className="studio__signup-layout">
        <div className="studio__signup-content">
          <p className="studio__signup-eyebrow">{eyebrow}</p>
          <h3 className="studio__signup-title">{title}</h3>
          <p className="studio__signup-copy">{copy}</p>
          <form className="studio__signup-form" onSubmit={submit} noValidate>
            <input
              className="studio__signup-input"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setMessage('')
              }}
              placeholder="email address"
              aria-label="Email address"
              aria-invalid={message.startsWith('please')}
            />
            <button
              className="studio__signup-submit"
              type="submit"
              disabled={sending}
              aria-label="Join early access"
            >
              {sending ? '…' : <span aria-hidden="true">→</span>}
            </button>
          </form>
          <p className="studio__signup-message" aria-live="polite">{message}</p>
        </div>

        {showCountdown && (
          <aside className="archive-countdown" aria-label="Countdown to the archive opening">
            <p className="archive-countdown__date">september 21, 2026</p>
            <h3 className="archive-countdown__title">the archive opens.</h3>
            <div className="archive-countdown__units">
              {([
                ['days', remaining.days],
                ['hrs', remaining.hours],
                ['min', remaining.minutes],
                ['sec', remaining.seconds],
              ] as const).map(([label, value]) => (
                <div className="archive-countdown__unit" key={label}>
                  <span>{String(value).padStart(2, '0')}</span>
                  <small>{label}</small>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

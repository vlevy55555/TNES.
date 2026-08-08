import { useState, type FormEvent } from 'react'

const NOTIFY_URL = import.meta.env.VITE_NOTIFY_URL as string | undefined

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

export default function EarlyAccess() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

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
    <div className="studio__signup">
      <p className="studio__signup-eyebrow">early access</p>
      <h3 className="studio__signup-title">be the first to know.</h3>
      <p className="studio__signup-copy">
        early access to new work, limited objects, and studio collaborations.
      </p>
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
  )
}

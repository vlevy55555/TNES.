import { useEffect, useState, type FormEvent } from 'react'
import { artworks, INQUIRY_EMAIL, INQUIRY_TYPES } from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'

export function InquiryPanel() {
  const open = useGalleryStore((s) => s.inquiryOpen)
  const workId = useGalleryStore((s) => s.inquiryWorkId)
  const close = useGalleryStore((s) => s.closeInquiry)
  const work = artworks.find((item) => item.id === workId)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [type, setType] = useState<string>(INQUIRY_TYPES[0])
  const [interest, setInterest] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setName('')
    setEmail('')
    setPhone('')
    setType(INQUIRY_TYPES[0])
    setInterest(work ? `${work.title}. ${work.subtitle}` : '')
    setMessage('')
    setError('')
  }, [open, work])

  if (!open) return null

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Add your name and a valid email to send.')
      return
    }
    const body = [
      `Name: ${name.trim()}`,
      `Email: ${email.trim()}`,
      ...(phone.trim() ? [`Phone: ${phone.trim()}`] : []),
      `Inquiry type: ${type}`,
      ...(interest.trim() ? [`Work of interest: ${interest.trim()}`] : []),
      '',
      message.trim() || '(no message)',
    ].join('\n')
    const subject = `TNES. inquiry — ${type}${work ? ` — ${work.title}` : ''}`
    window.location.href = `mailto:${INQUIRY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <aside className="artwork-panel inquiry-panel" aria-label="Private inquiry">
      <button className="panel-close" type="button" onClick={close} aria-label="Close">
        × Close
      </button>
      <p className="eyebrow">Private inquiry</p>
      <h2 className="panel-title">{work?.title ?? 'Write to the studio.'}</h2>
      {work && <p className="panel-subtitle">{work.subtitle}</p>}

      <form className="inquiry-panel__form" onSubmit={submit} noValidate>
        <label><span>Name</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></label>
        <label><span>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@domain.com" /></label>
        <div className="inquiry-panel__row">
          <label><span>Phone · optional</span><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 555 5555" /></label>
          <label><span>Inquiry</span><select value={type} onChange={(e) => setType(e.target.value)}>{INQUIRY_TYPES.map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>
        <label><span>Work of interest · optional</span><input value={interest} onChange={(e) => setInterest(e.target.value)} placeholder="Which piece?" /></label>
        <label><span>Message</span><textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us what you're considering." /></label>
        {error && <p className="inquiry-panel__error">{error}</p>}
        <button className="btn btn-primary inquiry-panel__send" type="submit">Send inquiry</button>
      </form>
    </aside>
  )
}

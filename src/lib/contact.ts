import { INQUIRY_EMAIL } from '../data/artworks'

export type Inquiry = {
  name: string
  email: string
  subject?: string
  message: string
  /** Extra labelled lines, e.g. ['Phone', '+1 …'], shown above the message. */
  details?: [string, string][]
  source?: string
  /** Honeypot value: empty for people. */
  website?: string
}

// The Resend key that sends these lives on the server, in api/contact.js.
export async function sendInquiry(inquiry: Inquiry) {
  const response = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(inquiry),
  })
  if (!response.ok) throw new Error(`contact: ${response.status}`)
}

/** The same inquiry, written out for the visitor's mail app — used only when
 *  sending fails, so a finished message is never lost. */
export function inquiryMailto({ name, email, subject, message, details = [] }: Inquiry) {
  const lines = [`Name: ${name}`, `Email: ${email}`, ...details.map(([label, value]) => `${label}: ${value}`), '', message]
  return `mailto:${INQUIRY_EMAIL}?subject=${encodeURIComponent(`TNES. ${subject || 'inquiry'}`)}&body=${encodeURIComponent(lines.join('\n'))}`
}

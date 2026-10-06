// POST /api/contact — delivers an inquiry to the studio's inbox through Resend.
//
// The Resend key can send mail as tnes.studio, so it stays on the server as
// RESEND_API_KEY. The message goes to CONTACT_TO (vlevy@tnes.studio by default)
// with the visitor as reply-to, so answering it is just pressing reply.
//
// Body: { name, email, subject?, message, details?: [[label, value], ...], source?, website? }
// `website` is the honeypot: no person fills it, so a filled one is a bot.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TO = process.env.CONTACT_TO?.trim() || 'vlevy@tnes.studio'
const FROM = process.env.RESEND_FROM?.trim() || 'TNES. website <site@tnes.studio>'

const json = (status, body) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } })
const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '')
const escapeHtml = (value) => value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

export async function POST(request) {
  const key = process.env.RESEND_API_KEY?.trim()
  if (!key) return json(503, { error: 'contact is not configured' })

  let body
  try {
    body = await request.json()
  } catch {
    return json(400, { error: 'invalid body' })
  }
  // Answer a bot as if it worked, so it has nothing to retry against.
  if (text(body?.website, 200)) return json(200, { ok: true })

  const name = text(body?.name, 120)
  const email = text(body?.email, 254)
  const subject = text(body?.subject, 160) || 'Inquiry'
  const message = text(body?.message, 5000)
  const source = text(body?.source, 120) || 'TNES. website'
  const details = Array.isArray(body?.details)
    ? body.details.slice(0, 10)
        .map((pair) => (Array.isArray(pair) ? [text(pair[0], 60), text(pair[1], 300)] : null))
        .filter((pair) => pair && pair[0] && pair[1])
    : []
  if (!name || !EMAIL.test(email) || !message) return json(400, { error: 'name, email and message are required' })

  const rows = [['Name', name], ['Email', email], ...details, ['Sent from', source]]
  const plain = `${rows.map(([label, value]) => `${label}: ${value}`).join('\n')}\n\n${message}\n`
  const html = `<table style="font:14px/1.5 Helvetica,Arial,sans-serif;color:#0b0b0b;border-collapse:collapse">${
    rows.map(([label, value]) => `<tr><td style="padding:2px 16px 2px 0;color:#5d5d5d">${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`).join('')
  }</table><p style="font:15px/1.6 Helvetica,Arial,sans-serif;color:#0b0b0b;white-space:pre-wrap;margin-top:20px">${escapeHtml(message)}</p>`

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to: [TO],
      reply_to: `${name.replace(/[<>"]/g, '')} <${email}>`,
      subject: `TNES. ${subject} — ${name}`,
      text: plain,
      html,
    }),
  })

  if (!response.ok) {
    console.error('Resend send failed', response.status, await response.text())
    return json(502, { error: 'delivery failed' })
  }
  return json(200, { ok: true })
}

// POST /api/subscribe — adds an email to the MailerLite newsletter group.
//
// The MailerLite token opens the whole account (campaigns, every subscriber),
// so unlike Klaviyo's public key it cannot ship in the site's JavaScript. It
// lives in the Vercel environment as MAILERLITE_API_TOKEN and only this
// function sees it. The group id is not a secret; the env var only overrides it.
//
// Body: { "email": "...", "source": "TNES. early access" }

const API = 'https://connect.mailerlite.com/api'
const DEFAULT_GROUP_ID = '200588303412496136' // "TNES. newsletter"
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const json = (status, body) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } })

export async function POST(request) {
  const token = process.env.MAILERLITE_API_TOKEN?.trim()
  const groupId = process.env.MAILERLITE_GROUP_ID?.trim() || DEFAULT_GROUP_ID
  if (!token) return json(503, { error: 'newsletter is not configured' })

  let body
  try {
    body = await request.json()
  } catch {
    return json(400, { error: 'invalid body' })
  }
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (email.length > 254 || !EMAIL.test(email)) return json(400, { error: 'invalid email' })
  const source = typeof body?.source === 'string' ? body.source.slice(0, 120) : 'TNES. website'

  // Upsert: an address already on the list is updated, not duplicated. No
  // `status` is sent, so someone who unsubscribed is not silently re-added,
  // and the account's double opt-in setting decides whether a new address
  // starts active or waits for confirmation.
  const response = await fetch(`${API}/subscribers`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      email,
      groups: [groupId],
      fields: { signup_source: source },
      ip_address: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || undefined,
    }),
  })

  if (!response.ok) {
    console.error('MailerLite subscribe failed', response.status, await response.text())
    return json(502, { error: 'subscription failed' })
  }
  return json(200, { ok: true })
}

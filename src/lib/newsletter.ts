// The site never talks to MailerLite directly: the token that can add a
// subscriber can also read and mail the whole list, so it stays on the server
// in api/subscribe.js.
export async function subscribeToNewsletter(email: string, source = 'TNES. website') {
  const response = await fetch('/api/subscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ email, source }),
  })
  if (!response.ok) throw new Error(`Newsletter subscription failed: ${response.status}`)
}

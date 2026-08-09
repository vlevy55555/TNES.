const PUBLIC_KEY = import.meta.env.VITE_KLAVIYO_PUBLIC_KEY as string | undefined
const LIST_ID = import.meta.env.VITE_KLAVIYO_LIST_ID as string | undefined
const REVISION = (import.meta.env.VITE_KLAVIYO_REVISION as string | undefined) ?? '2026-07-15'

export async function subscribeToKlaviyo(email: string, source = 'TNES. website') {
  if (!PUBLIC_KEY || !LIST_ID) throw new Error('Klaviyo is not configured')

  const response = await fetch(
    `https://a.klaviyo.com/client/subscriptions?company_id=${encodeURIComponent(PUBLIC_KEY)}`,
    {
      method: 'POST',
      headers: {
        accept: 'application/vnd.api+json',
        'content-type': 'application/vnd.api+json',
        revision: REVISION,
      },
      body: JSON.stringify({
        data: {
          type: 'subscription',
          attributes: {
            custom_source: source,
            profile: {
              data: {
                type: 'profile',
                attributes: {
                  email,
                  subscriptions: { email: { marketing: { consent: 'SUBSCRIBED' } } },
                },
              },
            },
          },
          relationships: { list: { data: { type: 'list', id: LIST_ID } } },
        },
      }),
    },
  )

  if (!response.ok) throw new Error(`Klaviyo subscription failed: ${response.status}`)
}

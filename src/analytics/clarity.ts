const CONSENT_KEY = 'tnes.analytics-consent.v1'
const projectId = import.meta.env.VITE_CLARITY_PROJECT_ID?.trim()

type Consent = 'accepted' | 'declined' | null
type ClarityCall = ((...args: unknown[]) => void) & { q?: unknown[][] }

declare global {
  interface Window {
    clarity?: ClarityCall
  }
}

export const analyticsAvailable = Boolean(projectId) &&
  (window.location.hostname === 'tnes.studio' || window.location.hostname === 'www.tnes.studio')

export function getAnalyticsConsent(): Consent {
  try {
    const saved = window.localStorage.getItem(CONSENT_KEY)
    return saved === 'accepted' || saved === 'declined' ? saved : null
  } catch {
    return null
  }
}

export function setAnalyticsConsent(consent: Exclude<Consent, null>) {
  try {
    window.localStorage.setItem(CONSENT_KEY, consent)
  } catch {
    // A blocked storage API never prevents the visitor's choice in this tab.
  }

  if (consent === 'accepted') {
    startAnalytics()
  } else if (window.clarity) {
    window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' })
    window.clarity('consent', false)
    // A loaded recording script cannot be unloaded safely. Reload with the
    // saved refusal so no new tracking code is installed.
    window.location.reload()
  }
}

export function startAnalytics() {
  if (!projectId || getAnalyticsConsent() !== 'accepted') return
  if (document.getElementById('tnes-clarity')) return

  const clarity: ClarityCall = window.clarity ?? Object.assign(
    (...args: unknown[]) => { clarity.q!.push(args) },
    { q: [] as unknown[][] },
  )
  window.clarity = clarity
  clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' })

  const script = document.createElement('script')
  script.id = 'tnes-clarity'
  script.async = true
  script.src = `https://www.clarity.ms/tag/${encodeURIComponent(projectId)}`
  document.head.appendChild(script)
}

export function trackAnalyticsEvent(name: string) {
  if (getAnalyticsConsent() === 'accepted') window.clarity?.('event', name)
}

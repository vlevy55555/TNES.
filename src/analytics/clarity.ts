import { capturePosthog, posthogConfigured, startPosthog, stopPosthog } from './posthog'

// v2: the choice now covers PostHog as well as Clarity, so a v1 answer given
// for Clarity alone is not carried over.
const CONSENT_KEY = 'tnes.analytics-consent.v2'
const projectId = import.meta.env.VITE_CLARITY_PROJECT_ID?.trim()

type Consent = 'accepted' | 'declined' | null
type ClarityCall = ((...args: unknown[]) => void) & { q?: unknown[][] }

declare global {
  interface Window {
    clarity?: ClarityCall
  }
}

/** The tools the visitor is asked about, as the consent text names them. */
export const analyticsTools = [projectId && 'Microsoft Clarity', posthogConfigured && 'PostHog']
  .filter(Boolean).join(' and ')

export const analyticsAvailable = Boolean(analyticsTools) &&
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
    return
  }
  const posthogWasRunning = stopPosthog()
  if (window.clarity) {
    window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' })
    window.clarity('consent', false)
  }
  // A loaded recording script cannot be unloaded safely. Reload with the
  // saved refusal so no new tracking code is installed.
  if (window.clarity || posthogWasRunning) window.location.reload()
}

export function startAnalytics() {
  if (getAnalyticsConsent() !== 'accepted') return
  startPosthog()
  if (!projectId || document.getElementById('tnes-clarity')) return

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
  if (getAnalyticsConsent() !== 'accepted') return
  window.clarity?.('event', name)
  capturePosthog(name)
}

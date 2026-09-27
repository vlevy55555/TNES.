import { useEffect, useState } from 'react'
import { analyticsAvailable, getAnalyticsConsent, setAnalyticsConsent, startAnalytics } from './clarity'
import './analytics.css'

export default function AnalyticsConsent() {
  const [visible, setVisible] = useState(() => analyticsAvailable && getAnalyticsConsent() === null)

  useEffect(() => {
    if (!analyticsAvailable) return
    startAnalytics()
    const reopen = () => setVisible(true)
    window.addEventListener('tnes:privacy-choices', reopen)
    return () => window.removeEventListener('tnes:privacy-choices', reopen)
  }, [])

  if (!visible) return null

  const choose = (choice: 'accepted' | 'declined') => {
    setAnalyticsConsent(choice)
    setVisible(false)
  }

  return (
    <aside className="analytics-consent" aria-label="Analytics choice">
      <p>May we use interaction analytics? With your permission, TNES. uses Microsoft Clarity to see clicks, scrolling and session replays. Inquiry form content is masked.</p>
      <div className="analytics-consent__actions">
        <button type="button" onClick={() => choose('declined')}>decline</button>
        <button type="button" onClick={() => choose('accepted')}>allow analytics</button>
        <a href="/privacy">privacy details</a>
      </div>
    </aside>
  )
}

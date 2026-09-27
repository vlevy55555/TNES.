import { analyticsAvailable } from '../analytics/clarity'
import { ShopFooter, ShopHeader } from './ShopChrome'
import './home.css'
import './shop.css'
import './privacy.css'

export default function Privacy() {
  return (
    <main className="shop privacy-page">
      <ShopHeader current="privacy" />
      <section className="shop__intro privacy-page__body">
        <h1 className="shop__title">privacy.</h1>
        <p>TNES. uses this website to show photographic work and receive inquiries. You can browse without allowing behavior analytics.</p>
        <h2>interaction analytics</h2>
        <p>When you allow it, Microsoft Clarity helps us understand visits, clicks, scrolling and how long visitors engage with pages through session recordings and heatmaps. We do not load Clarity before your choice. Advertising storage is not enabled by this site. You can change your choice below.</p>
        <p>Clarity masks form fields. We also explicitly mask inquiry and signup forms. Read the <a href="https://privacy.microsoft.com/privacystatement" target="_blank" rel="noopener noreferrer">Microsoft privacy statement</a> for its handling of collected data.</p>
        <h2>your choices and inquiries</h2>
        <p>Favorites and your analytics choice are stored in this browser. If you send an inquiry, your message is delivered to the studio’s contact service or opened in your email app. If you join early access, your email is sent to Klaviyo for studio updates; see the <a href="https://www.klaviyo.com/legal/privacy/privacy-notice" target="_blank" rel="noopener noreferrer">Klaviyo privacy notice</a>. For questions about your information, write to <a href="mailto:vlevy@tnes.studio">vlevy@tnes.studio</a>.</p>
        {analyticsAvailable && (
          <button type="button" onClick={() => window.dispatchEvent(new Event('tnes:privacy-choices'))}>
            change analytics choice
          </button>
        )}
      </section>
      <ShopFooter />
    </main>
  )
}

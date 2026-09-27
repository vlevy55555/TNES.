import { ShopFooter, ShopHeader } from './ShopChrome'
import './home.css'
import './shop.css'

export default function SpecialPrices() {
  return (
    <main className="shop special-prices">
      <ShopHeader current="special prices" />

      <section className="shop__intro">
        <h1 className="shop__title">special prices.</h1>
      </section>

      <section className="cart__empty special-prices__empty">
        <p className="cart__empty-line">no works listed here yet.</p>
        <p className="shop__meta">selected works and their offer prices will appear here.</p>
        <p className="shop__meta"><a href="/works">explore works <span aria-hidden="true">→</span></a></p>
      </section>

      <ShopFooter />
    </main>
  )
}

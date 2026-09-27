import { artworks } from '../data/artworks'
import { useFavoritesStore } from '../store/useFavoritesStore'
import { ShopFooter, ShopHeader } from './ShopChrome'
import './home.css'
import './shop.css'

export default function Favorites() {
  const ids = useFavoritesStore((state) => state.ids)
  const remove = useFavoritesStore((state) => state.remove)
  const saved = ids.flatMap((id) => {
    const artwork = artworks.find((work) => work.id === id)
    return artwork ? [artwork] : []
  })

  return (
    <main className="shop cart favorites">
      <ShopHeader current="favorites" />

      <section className="shop__intro">
        <h1 className="shop__title">favorites.</h1>
        <p className="shop__count" aria-live="polite">
          {saved.length ? `${saved.length} ${saved.length === 1 ? 'work' : 'works'}` : 'empty'}
        </p>
      </section>

      {saved.length === 0 ? (
        <section className="cart__empty">
          <p className="cart__empty-line">nothing saved yet.</p>
          <p className="shop__meta"><a href="/works">explore works <span aria-hidden="true">→</span></a></p>
        </section>
      ) : (
        <div className="cart__lines favorites__lines">
          {saved.map((work) => (
            <article className="cart__line favorites__line" key={work.id}>
              <a className="cart__figure" href={`/works/${work.id}`}>
                <img src={work.image} alt={work.title} loading="lazy" />
              </a>
              <div className="cart__line-body">
                <h2 className="cart__line-title"><a href={`/works/${work.id}`}>{work.title.toLowerCase()}.</a></h2>
                <p className="shop__meta">{work.subtitle.toLowerCase()}</p>
                <button className="cart__remove" type="button" onClick={() => remove(work.id)}>
                  remove from favorites
                </button>
              </div>
              <a className="favorites__view" href={`/works/${work.id}`}>view work <span aria-hidden="true">→</span></a>
            </article>
          ))}
        </div>
      )}

      <ShopFooter />
    </main>
  )
}

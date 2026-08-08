import { artworks, INQUIRY_EMAIL } from '../data/artworks'
import { RevealText } from './reveal'
import { ShopFooter, ShopHeader } from './ShopChrome'
import EarlyAccess from './EarlyAccess'
import './home.css'
import './shop.css'
import './catalog.css'

type CatalogSlug = 'the-hamptons' | 'selected-works'

const catalogCopy = {
  'the-hamptons': {
    title: 'the hamptons',
    description: 'the body of work shown for the east coast summer — coastline, light, and the hours around it. available as custom prints framed to the room.',
    meta: 'summer 2024  ·  east coast, usa  ·  studio catalog',
    ids: ['runner', 'the-pool', 'ditch-plains-far', 'praia-da-baleia', 'wied-il-ghasri', 'ischia-mezzatorre'],
  },
  'selected-works': {
    title: 'selected works',
    description: 'a wider selection from the archive across brazil, malta, peru, italy, and switzerland — shown for custom orders, interiors, and collectors working at scale.',
    meta: '60+ works  ·  archive selection  ·  studio catalog',
    ids: ['wied-il-ghasri', 'moreira-crowded-beach', 'florence-dogman', 'lauterbrunnen', 'ditch-plains-far', 'appenzell-alpine-lake'],
  },
} as const

const chapterCopy = [
  ['coastline', 'edges of land and water. undulating shorelines and open horizon.'],
  ['light', 'light in motion. reflective water and moments that fade.'],
  ['stillness', 'quiet scenes held long enough to breathe, observe, and be.'],
  ['distance', 'places remembered by atmosphere, scale, and the space between.'],
] as const

export function isCatalogSlug(value: string | null): value is CatalogSlug {
  return value === 'the-hamptons' || value === 'selected-works'
}

export default function Catalog({ slug }: { slug: CatalogSlug }) {
  const catalog = catalogCopy[slug]
  const selected = catalog.ids
    .map((id) => artworks.find((work) => work.id === id))
    .filter((work): work is (typeof artworks)[number] => Boolean(work))
  const chapterOffset = slug === 'selected-works' ? 2 : 0
  const chapters = Array.from({ length: Math.ceil(selected.length / 3) }, (_, index) => ({
    label: chapterCopy[(index + chapterOffset) % chapterCopy.length],
    works: selected.slice(index * 3, index * 3 + 3),
  }))

  return (
    <main className="shop catalog-page">
      <ShopHeader current="catalogs" />

      <section className="catalog-page__intro">
        <p className="catalog-page__crumb">
          <a href="/shop#catalogs">catalogs</a><span>/</span>{catalog.title}
        </p>

        <div className="catalog-page__overview">
          <div className="catalog-page__lead">
            <h1><RevealText block>{catalog.title}.</RevealText></h1>
            <p>{catalog.description}</p>
            <p className="catalog-page__meta">{catalog.meta}</p>
          </div>

          <div className="catalog-page__facts">
            <dl>
              <div><dt>purpose</dt><dd>a curated body of work for custom prints and collector editions.</dd></div>
              <div><dt>prints</dt><dd>available in multiple sizes with archival materials and framing options.</dd></div>
              <div><dt>interiors</dt><dd>selected works shown in residential and hospitality spaces.</dd></div>
              <div><dt>collectors</dt><dd>for collectors, curators, and design professionals.</dd></div>
              <div><dt>orders</dt><dd>all orders placed upon inquiry.</dd></div>
            </dl>
            <div className="catalog-page__actions">
              <a href={`mailto:${INQUIRY_EMAIL}?subject=${encodeURIComponent(`${catalog.title} print inquiry`)}`}>
                inquire about prints <span aria-hidden="true">→</span>
              </a>
              <a href="/shop#catalogs">all catalogs <span aria-hidden="true">→</span></a>
            </div>
          </div>
        </div>
      </section>

      <section className="catalog-page__timeline" aria-label={`${catalog.title} works`}>
        {chapters.map(({ label: [title, description], works }, index) => (
          <article className="catalog-page__chapter" key={`${title}-${index}`}>
            <header>
              <p><span>{String(index + chapterOffset + 1).padStart(2, '0')}</span>{title}</p>
              <p>{description}</p>
            </header>
            <div className={`catalog-page__mosaic catalog-page__mosaic--${works.length}`}>
              {works.map((work, workIndex) => (
                <a className={`catalog-page__work catalog-page__work--${workIndex + 1} catalog-page__work--${work.id}`} href={`/shop/${work.id}`} key={work.id}>
                  <figure><img src={work.image} alt={`${work.title}, ${work.subtitle}`} loading="lazy" /></figure>
                  <p><span>{work.title.toLowerCase()}.</span><span>{work.subtitle.toLowerCase()}</span></p>
                </a>
              ))}
            </div>
          </article>
        ))}
      </section>

      <EarlyAccess />
      <ShopFooter />
    </main>
  )
}

// Pulls what is PUBLISHED in the Sanity Studio and writes src/data/cms.json,
// the one file the site reads its content from. Runs first in `npm run build`.
//
// It never makes the site worse than the last good build: if Sanity can't be
// reached, or the dataset holds no works yet, the committed cms.json stays as
// it is and the build carries on with it.
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { SANITY } from './config.mjs'

const root = path.resolve(import.meta.dirname, '../..')
const file = path.join(root, 'src/data/cms.json')
const previous = JSON.parse(await readFile(file, 'utf8'))

const image = '{ crop, "asset": asset->{ url, "dimensions": metadata.dimensions } }'
const photo = `{ alt, ${image.slice(2)}`
const QUERY = `{
  "settings": *[_id == "siteSettings"][0],
  "home": *[_id == "homePage"][0]{ ..., "heroIds": heroWorks[]->slug.current, "statementArtworkId": statementArtwork->slug.current },
  "works": *[_id == "worksPage"][0],
  "about": *[_id == "aboutPage"][0]{ ..., "heroImage": heroImage${photo}, "splitImage": splitImage${photo} },
  "momentsPage": *[_id == "momentsPage"][0]{ ..., "introImages": introImages[]${photo} },
  "artworks": *[_type == "artwork" && defined(slug.current) && defined(image.asset)] | order(orderRank) {
    "id": slug.current, title, location, year, description, "image": image${image}, region, scenes, shopifyHandle, edition
  },
  "moments": *[_type == "moment"] | order(orderRank) {
    place, status, title, date, abstract, links, "photos": photos[]${photo}
  },
  "catalogs": *[_type == "catalog" && defined(slug.current)] | order(orderRank) {
    "slug": slug.current, title, showOnWorks, description, meta, inquireSubject, studioNote, password, spreads, seo,
    cardCaption, cardDetails, cardNote, "cardImage": cardImage${photo},
    "photos": photos[]{ location, compact, "image": image${image} }
  }
}`

/** A Sanity image as the URL and size the site uses, with the Studio's crop applied. */
function toPhoto(value) {
  const asset = value?.asset
  if (!asset?.url) return null
  let { width, height } = asset.dimensions
  let url = asset.url
  const crop = value.crop
  if (crop && (crop.top || crop.bottom || crop.left || crop.right)) {
    const x = Math.round(crop.left * width)
    const y = Math.round(crop.top * height)
    width = Math.round(width * (1 - crop.left - crop.right))
    height = Math.round(height * (1 - crop.top - crop.bottom))
    url += `?rect=${x},${y},${width},${height}`
  }
  return { src: url, alt: value.alt ?? '', width, height }
}

const text = (value) => (typeof value === 'string' ? value : '')
const seo = (value) => ({ title: text(value?.title), description: text(value?.description) })

async function query() {
  const url = new URL(`https://${SANITY.projectId}.api.sanity.io/v${SANITY.apiVersion}/data/query/${SANITY.dataset}`)
  url.searchParams.set('query', QUERY)
  url.searchParams.set('perspective', 'published')
  const token = process.env.SANITY_READ_TOKEN?.trim()
  const response = await fetch(url, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new Error(`Sanity answered ${response.status}: ${await response.text()}`)
  return (await response.json()).result
}

function normalize(data) {
  const warnings = []
  const artworks = data.artworks.flatMap((work) => {
    const picture = toPhoto(work.image)
    const missing = ['title', 'location', 'year', 'description'].filter((key) => !work[key])
    if (!picture || missing.length) {
      warnings.push(`obra "${work.title ?? work.id}" ficou de fora — falta: ${[...missing, ...(picture ? [] : ['image'])].join(', ')}`)
      return []
    }
    return [{
      id: work.id,
      title: work.title,
      location: work.location,
      year: work.year,
      description: work.description,
      image: picture.src,
      imageWidth: picture.width,
      imageHeight: picture.height,
      region: work.region ?? 'elsewhere',
      scenes: work.scenes ?? [],
      shopifyHandle: text(work.shopifyHandle),
      edition: text(work.edition) || 'Archival pigment print · edition by inquiry',
    }]
  })
  const ids = new Set(artworks.map((work) => work.id))

  // A page document that was never published keeps the last good copy; once it
  // exists, the Studio is the source and an emptied field is empty on the site.
  const page = (doc, key, build) => (doc ? build(doc, previous[key]) : previous[key])

  const settings = page(data.settings, 'settings', (doc) => ({
    inquiryEmail: text(doc.inquiryEmail),
    phone: text(doc.phone),
    instagramHandle: text(doc.instagramHandle),
    instagramUrl: text(doc.instagramUrl),
    brandStatement: text(doc.brandStatement),
    footerTagline: text(doc.footerTagline),
    footerPlaces: text(doc.footerPlaces),
    copyright: text(doc.copyright),
    earlyAccess: { eyebrow: text(doc.earlyAccess?.eyebrow), title: text(doc.earlyAccess?.title), copy: text(doc.earlyAccess?.copy) },
  }))

  const home = page(data.home, 'home', (doc, last) => {
    const heroIds = (doc.heroIds ?? []).filter((id) => ids.has(id))
    if (!heroIds.length) warnings.push('Home sem obras publicadas no topo — usando a primeira obra da lista')
    return {
      heroIds: heroIds.length ? heroIds : [artworks[0].id],
      statementTitle: text(doc.statementTitle) || last.statementTitle,
      statementCopy: text(doc.statementCopy),
      statementArtworkId: ids.has(doc.statementArtworkId) ? doc.statementArtworkId : (heroIds[0] ?? artworks[0].id),
      selectedWorksTitle: text(doc.selectedWorksTitle),
      seo: seo(doc.seo),
    }
  })

  const works = page(data.works, 'works', (doc) => ({
    eyebrow: text(doc.eyebrow),
    title: text(doc.title) || 'Works',
    description: text(doc.description),
    catalogsTitle: text(doc.catalogsTitle),
    catalogsSubtitle: text(doc.catalogsSubtitle),
    seo: seo(doc.seo),
  }))

  const about = page(data.about, 'about', (doc, last) => ({
    name: text(doc.name) || last.name,
    role: text(doc.role),
    statement: text(doc.statement),
    // the opening is built around these two pictures, so a removed one keeps the last
    heroImage: toPhoto(doc.heroImage) ?? last.heroImage,
    splitImage: toPhoto(doc.splitImage) ?? last.splitImage,
    splitTitle: text(doc.splitTitle),
    splitText: text(doc.splitText),
    ctaLabel: text(doc.ctaLabel),
    ctaUrl: text(doc.ctaUrl) || last.ctaUrl,
    closingNote: text(doc.closingNote),
    seo: seo(doc.seo),
  }))

  const momentsPage = page(data.momentsPage, 'momentsPage', (doc) => ({
    pretitle: text(doc.pretitle),
    title: text(doc.title),
    intro: text(doc.intro),
    introImages: (doc.introImages ?? []).map(toPhoto).filter(Boolean),
    release: { eyebrow: text(doc.release?.eyebrow), title: text(doc.release?.title), copy: text(doc.release?.copy) },
    seo: seo(doc.seo),
  }))

  const moments = data.moments.length
    ? data.moments.map((entry) => ({
        place: text(entry.place),
        status: ['current', 'next'].includes(entry.status) ? entry.status : 'past',
        title: text(entry.title),
        date: text(entry.date),
        abstract: text(entry.abstract),
        links: (entry.links ?? []).filter((link) => link.label).map((link) => ({
          label: link.label,
          ...(link.href ? { href: link.href } : { contactSubject: text(link.contactSubject) }),
        })),
        photos: (entry.photos ?? []).map(toPhoto).filter(Boolean),
      }))
    : previous.moments

  const catalogs = data.catalogs.length
    ? data.catalogs.map((catalog) => ({
        slug: catalog.slug,
        title: text(catalog.title),
        showOnWorks: catalog.showOnWorks !== false,
        description: text(catalog.description),
        meta: text(catalog.meta),
        inquireSubject: text(catalog.inquireSubject),
        studioNote: { label: text(catalog.studioNote?.label), title: text(catalog.studioNote?.title), text: text(catalog.studioNote?.text) },
        photos: (catalog.photos ?? []).flatMap((entry) => {
          const picture = toPhoto(entry.image)
          return picture ? [{ location: text(entry.location), image: picture.src, width: picture.width, height: picture.height, compact: Boolean(entry.compact) }] : []
        }),
        cardImage: toPhoto(catalog.cardImage),
        cardCaption: text(catalog.cardCaption),
        cardDetails: text(catalog.cardDetails),
        cardNote: text(catalog.cardNote),
        spreads: (catalog.spreads ?? []).filter((n) => Number.isInteger(n) && n > 0),
        password: text(catalog.password),
        seo: seo(catalog.seo),
      })).filter((catalog) => catalog.photos.length)
    : previous.catalogs

  return { content: { source: 'sanity', settings, artworks, home, works, about, momentsPage, moments, catalogs }, warnings }
}

try {
  const data = await query()
  if (!data.artworks.length) {
    console.log('cms: nenhuma obra publicada no Sanity ainda — mantendo src/data/cms.json como está.')
  } else {
    const { content, warnings } = normalize(data)
    for (const warning of warnings) console.warn(`cms: aviso — ${warning}`)
    const next = JSON.stringify(content, null, 2) + '\n'
    if (next !== JSON.stringify(previous, null, 2) + '\n') await writeFile(file, next)
    console.log(`cms: ${content.artworks.length} obras, ${content.catalogs.length} catálogos, ${content.moments.length} moments.`)
  }
} catch (error) {
  // The deploy must not fail because Sanity blinked; it ships the last good copy.
  console.warn(`cms: não consegui ler o Sanity (${error.message}) — usando o último src/data/cms.json.`)
  if (process.env.CMS_STRICT === '1') process.exit(1)
}

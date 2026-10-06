// One-time move of the site's content into Sanity: every text in
// src/data/cms.json becomes a Studio document, and every picture it points at
// in /public is uploaded to Sanity's media library.
//
//   SANITY_WRITE_TOKEN=… npm run cms:import             creates what is missing
//   SANITY_WRITE_TOKEN=… npm run cms:import -- --replace  overwrites everything
//
// Without --replace it never touches a document that already exists, so
// running it again after the team has started editing loses nothing. The
// token is an Editor token from sanity.io/manage ▸ API ▸ Tokens; it can also
// sit in .env (never commit it).
import { createReadStream } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@sanity/client'
import { LexoRank } from 'lexorank'
import { loadEnv } from 'vite'
import { SANITY } from './config.mjs'

const root = path.resolve(import.meta.dirname, '../..')
const env = { ...loadEnv('development', root, 'SANITY_'), ...process.env }
const token = env.SANITY_WRITE_TOKEN?.trim()
if (!token) {
  console.error('Falta SANITY_WRITE_TOKEN (um token "Editor" de sanity.io/manage ▸ API ▸ Tokens).')
  process.exit(1)
}
const replace = process.argv.includes('--replace')
const client = createClient({ ...SANITY, token, useCdn: false })
const cms = JSON.parse(await readFile(path.join(root, 'src/data/cms.json'), 'utf8'))

// ---- pictures ---------------------------------------------------------------
const uploaded = new Map()
async function asset(src) {
  if (src.startsWith('https://cdn.sanity.io/')) throw new Error(`${src} is already in Sanity — this content was imported before`)
  if (!uploaded.has(src)) {
    const file = path.join(root, 'public', src.replace(/^\//, ''))
    uploaded.set(src, client.assets.upload('image', createReadStream(file), { filename: path.basename(file) }).then((doc) => {
      process.stdout.write('.')
      return doc._id
    }))
  }
  return uploaded.get(src)
}
const image = async (src, extra = {}) => ({ _type: 'image', asset: { _type: 'reference', _ref: await asset(src) }, ...extra })
const photo = async (value) => (value ? image(value.src, value.alt ? { alt: value.alt } : {}) : undefined)
const keyed = (items) => items.map((item, index) => ({ _key: `k${index}`, ...item }))
const ref = (id) => ({ _type: 'reference', _ref: `artwork-${id}` })

// ---- order: the same LexoRank strings the Studio's drag-and-drop writes -----
const ranks = (count) => {
  const out = []
  let rank = LexoRank.min()
  for (let i = 0; i < count; i++) {
    rank = rank.genNext().genNext()
    out.push(rank.toString())
  }
  return out
}

// ---- documents --------------------------------------------------------------
const docs = []
const artworkRanks = ranks(cms.artworks.length)
for (const [index, work] of cms.artworks.entries()) {
  docs.push({
    _id: `artwork-${work.id}`,
    _type: 'artwork',
    orderRank: artworkRanks[index],
    title: work.title,
    slug: { _type: 'slug', current: work.id },
    image: await image(work.image),
    location: work.location,
    year: work.year,
    description: work.description,
    region: work.region,
    scenes: work.scenes,
    shopifyHandle: work.shopifyHandle || undefined,
    edition: work.edition,
  })
}

const catalogRanks = ranks(cms.catalogs.length)
for (const [index, catalog] of cms.catalogs.entries()) {
  docs.push({
    _id: `catalog-${catalog.slug}`,
    _type: 'catalog',
    orderRank: catalogRanks[index],
    title: catalog.title,
    slug: { _type: 'slug', current: catalog.slug },
    showOnWorks: catalog.showOnWorks,
    description: catalog.description,
    meta: catalog.meta,
    inquireSubject: catalog.inquireSubject,
    studioNote: catalog.studioNote,
    photos: keyed(await Promise.all(catalog.photos.map(async (entry) => ({
      _type: 'catalogPhoto',
      image: await image(entry.image),
      location: entry.location,
      compact: entry.compact,
    })))),
    cardImage: catalog.cardImage ? { ...(await photo(catalog.cardImage)), _type: 'photo' } : undefined,
    cardCaption: catalog.cardCaption,
    cardDetails: catalog.cardDetails,
    cardNote: catalog.cardNote || undefined,
    spreads: catalog.spreads,
    password: catalog.password || undefined,
    seo: { _type: 'seo', ...catalog.seo },
  })
}

const momentRanks = ranks(cms.moments.length)
for (const [index, entry] of cms.moments.entries()) {
  docs.push({
    _id: `moment-${index + 1}`,
    _type: 'moment',
    orderRank: momentRanks[index],
    place: entry.place,
    title: entry.title,
    date: entry.date,
    status: entry.status,
    abstract: entry.abstract,
    photos: keyed(await Promise.all(entry.photos.map(async (shot) => ({ ...(await photo(shot)), _type: 'photo' })))),
    links: keyed(entry.links.map((link) => ({ _type: 'momentLink', ...link }))),
  })
}

const { settings, home, works, about, momentsPage } = cms
docs.push(
  { _id: 'siteSettings', _type: 'siteSettings', ...settings },
  {
    _id: 'homePage',
    _type: 'homePage',
    heroWorks: keyed(home.heroIds.map(ref)),
    statementTitle: home.statementTitle,
    statementCopy: home.statementCopy,
    statementArtwork: ref(home.statementArtworkId),
    selectedWorksTitle: home.selectedWorksTitle,
    seo: { _type: 'seo', ...home.seo },
  },
  { _id: 'worksPage', _type: 'worksPage', ...works, seo: { _type: 'seo', ...works.seo } },
  {
    _id: 'aboutPage',
    _type: 'aboutPage',
    ...about,
    heroImage: { ...(await photo(about.heroImage)), _type: 'photo' },
    splitImage: { ...(await photo(about.splitImage)), _type: 'photo' },
    seo: { _type: 'seo', ...about.seo },
  },
  {
    _id: 'momentsPage',
    _type: 'momentsPage',
    ...momentsPage,
    introImages: keyed(await Promise.all(momentsPage.introImages.map(async (shot) => ({ ...(await photo(shot)), _type: 'photo' })))),
    seo: { _type: 'seo', ...momentsPage.seo },
  },
)
process.stdout.write('\n')

// drop undefined keys — Sanity stores absent and undefined the same, the API rejects the latter
const clean = (value) => JSON.parse(JSON.stringify(value))

const transaction = client.transaction()
for (const doc of docs) {
  if (replace) transaction.createOrReplace(clean(doc))
  else transaction.createIfNotExists(clean(doc))
}
await transaction.commit({ visibility: 'sync' })
console.log(`${replace ? 'Gravados' : 'Criados (os que faltavam)'}: ${docs.length} documentos, ${uploaded.size} fotos enviadas.`)
console.log('Agora rode `npm run cms:pull` (ou um build) para o site passar a ler do Sanity.')

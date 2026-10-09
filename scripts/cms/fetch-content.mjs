// Pulls what is PUBLISHED in the Sanity Studio and writes src/data/cms.json,
// the one file the site reads its content from. Runs first in `npm run build`.
//
// A failed read must stop a deploy, or unpublished content could stay visible.
// Local offline builds can explicitly opt in to the committed snapshot.
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { loadEnv } from 'vite'
import { SANITY } from './config.mjs'
import { normalize } from './normalize.mjs'

const root = path.resolve(import.meta.dirname, '../..')
const file = path.join(root, 'src/data/cms.json')
const previous = JSON.parse(await readFile(file, 'utf8'))
const env = { ...loadEnv('development', root, 'SANITY_'), ...process.env }

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

async function query() {
  const url = new URL(`https://${SANITY.projectId}.api.sanity.io/v${SANITY.apiVersion}/data/query/${SANITY.dataset}`)
  url.searchParams.set('query', QUERY)
  url.searchParams.set('perspective', 'published')
  const token = env.SANITY_READ_TOKEN?.trim()
  const response = await fetch(url, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new Error(`Sanity answered ${response.status}: ${await response.text()}`)
  return (await response.json()).result
}

try {
  const data = await query()
  const { content, warnings } = normalize(data)
  for (const warning of warnings) console.warn(`cms: aviso — ${warning}`)
  const next = JSON.stringify(content, null, 2) + '\n'
  if (next !== JSON.stringify(previous, null, 2) + '\n') await writeFile(file, next)
  console.log(`cms: ${content.artworks.length} obras, ${content.catalogs.length} catálogos, ${content.moments.length} moments.`)
} catch (error) {
  console.error(`cms: falha ao sincronizar o Sanity: ${error.message}`)
  if (process.env.CMS_ALLOW_STALE === '1' && process.env.CMS_STRICT !== '1' && !process.env.VERCEL && !process.env.CI) {
    console.warn('cms: usando src/data/cms.json por opção local CMS_ALLOW_STALE=1.')
  } else {
    process.exitCode = 1
  }
}

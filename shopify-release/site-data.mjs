// Rewrites the site's artwork data from products.json, so the gallery and the
// Shopify catalogue can't drift apart. Patches the 12 existing entries in place
// (their ids are load-bearing: SLOTS, deep links, catalog chapters) and appends
// the 18 new works.
import { readFileSync, writeFileSync } from 'node:fs'

const ROOT = '/home/eduardo/TNES'
const products = JSON.parse(readFileSync(`${ROOT}/shopify-release/products.json`, 'utf8'))

// The existing ids do not all describe their work — 'playa-roja' is Dune Lines
// and 'wied-il-ghasri' is Under the Limestone. Renaming them would break deep
// links and the hand-authored salon hang, so they stay as they are.
const EXISTING = {
  'st-peters-pool-v1': 'the-pool',
  'rio-runner': 'runner',
  'gozo-cave-girl': 'wied-il-ghasri',
  'murren-foggy-cows': 'lauterbrunnen',
  'praia-da-baleia': 'praia-da-baleia',
  'paracas-flat-dunes': 'playa-roja',
  'calpe-muralla-roja': 'calpe-muralla-roja',
  'grey-day-moraira': 'moreira-crowded-beach',
  'florence-dog-man': 'florence-dogman',
  'ischia-mezzatorre': 'ischia-mezzatorre',
  'ditch-plains-far': 'ditch-plains-far',
  'appenzell-alpine-lake': 'appenzell-alpine-lake',
}
const idFor = (p) => EXISTING[p.handle] ?? p.handle
const subtitleFor = (p) => `${p.location}, ${p.country} · ${p.year}`
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")

// ---------------------------------------------------------------- artworks.ts

let ts = readFileSync(`${ROOT}/src/data/artworks.ts`, 'utf8')
const start = ts.indexOf('export const artworks: Artwork[] = [')
const end = ts.indexOf('\n]', start) + 2
let body = ts.slice(start, end)

for (const p of products.filter((x) => EXISTING[x.handle])) {
  const id = idFor(p)
  const at = body.indexOf(`id: '${id}',`)
  if (at < 0) throw new Error(`entry not found: ${id}`)
  const stop = body.indexOf('\n  },', at)
  let entry = body.slice(at, stop)
  entry = entry
    .replace(/title: '[^']*'/, `title: '${esc(p.title)}'`)
    .replace(/subtitle: '[^']*'/, `subtitle: '${esc(subtitleFor(p))}'`)
    .replace(/description:\n?\s*'[^']*'/, `description:\n      '${esc(p.description)}'`)
    .replace(/shopifyHandle: '[^']*'/, `shopifyHandle: '${p.handle}'`)
  body = body.slice(0, at) + entry + body.slice(stop)
}

const POSITIONS = ['[-2.5, 0.3, 0]', '[0, -0.2, 0]', '[2.45, 0.3, 0]']
const added = products
  .filter((p) => !EXISTING[p.handle])
  .map((p, i) => `  {
    id: '${idFor(p)}',
    title: '${esc(p.title)}',
    subtitle: '${esc(subtitleFor(p))}',
    description:
      '${esc(p.description)}',
    price: PRICE,
    image: '/artworks/v1/${p.image.replace(/\.jpe?g$/i, '.webp')}',
    wallIndex: ARCHIVE_WALL,
    position: ${POSITIONS[i % 3]},
    size: ${p.orientation === 'Landscape' ? 'LANDSCAPE' : 'PORTRAIT'},
    edition: EDITION,
    dimensions: DIMENSIONS,
    frameStyle: 'white',
    shopifyHandle: '${p.handle}',
  },`).join('\n')

body = body.replace(/\n\]$/, `\n${added}\n]`)
writeFileSync(`${ROOT}/src/data/artworks.ts`, ts.slice(0, start) + body + ts.slice(end))

// ------------------------------------------------------------------- Shop.tsx

// The handoff's controlled SUBJECT vocabulary, lowercased for the filter row.
const SCENE = {
  Beach: 'beach', Water: 'water', Desert: 'desert', Alpine: 'alpine',
  Architecture: 'architecture', Street: 'street', People: 'people',
  Animals: 'animals', 'Signs + Objects': 'objects', Landscape: 'landscape',
}
const key = (id) => (/^[a-z][a-z0-9]*$/.test(id) ? id : `'${id}'`)

let shop = readFileSync(`${ROOT}/src/home/Shop.tsx`, 'utf8')
shop = shop.replace(
  /const SCENES: Record<string, string\[\]> = \{[\s\S]*?\n\}/,
  'const SCENES: Record<string, string[]> = {\n' +
  products.map((p) =>
    `  ${key(idFor(p))}: [${p.subject.map((s) => `'${SCENE[s]}'`).join(', ')}],`).join('\n') +
  '\n}',
)
// Desert, Animals and Signs + Objects are visible subjects in the handoff, so
// the filter row has to carry them or those works are only reachable via "all".
shop = shop.replace(
  /const SCENE_FILTERS = \[[^\]]*\]/,
  "const SCENE_FILTERS = ['all', 'beach', 'water', 'desert', 'alpine', 'landscape', " +
  "'street', 'architecture', 'people', 'animals', 'objects']",
)
shop = shop.replace(/(  'New York': 'north america',\n)/, "$1  'United States': 'north america',\n")
writeFileSync(`${ROOT}/src/home/Shop.tsx`, shop)

console.log(`artworks: ${products.length} (${added.split('\n  {').length - 1} novos)`)

import assert from 'node:assert/strict'
import { access, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const read = (file) => readFile(path.join(root, file), 'utf8')
const seo = JSON.parse(await read('src/data/seo-pages.json'))
const cms = JSON.parse(await read('src/data/cms.json'))
const vercel = JSON.parse(await read('vercel.json'))
const sitemap = await read('dist/sitemap.xml')
const robots = await read('dist/robots.txt')

assert(robots.includes(`Sitemap: ${seo.origin}/sitemap.xml`), 'robots.txt must point at the canonical sitemap')
assert(!sitemap.includes('/shop'), 'Sitemap must not contain old shop URLs')
assert(!sitemap.includes('/cart'), 'Cart must not be indexed')
assert(vercel.redirects.some(({ source, destination }) => source === '/shop' && destination === '/works'))
const home = await read('dist/index.html')
assert(home.includes('"@type":"Organization"') && home.includes('"@type":"WebSite"'), 'Home must describe the organization and website')
assert((await read('dist/about/index.html')).includes('"@type":"Person"'), '/about must describe Victor as a Person')
assert(vercel.redirects.some(({ source, destination }) => source === '/shop/:path*' && destination === '/works/:path*'))
assert(vercel.rewrites.some(({ source, destination }) => source === '/works/catalogs/:slug' && destination === '/works/catalogs/:slug/index.html'), 'Vercel catalog rewrite missing')

/** Every page's HTML carries its own title, canonical, robots and share image. */
async function checkPage(route, index) {
  const file = route === '/' ? 'dist/index.html' : `dist${route}/index.html`
  const html = await read(file)
  const canonical = new URL(route, seo.origin).href
  assert(/<title>[^<]+<\/title>/.test(html), `${route}: title missing`)
  assert(html.includes(`rel="canonical" href="${canonical}"`), `${route}: canonical missing`)
  assert(html.includes(`name="robots" content="${index ? 'index, follow' : 'noindex, follow'}"`), `${route}: robots metadata missing`)
  const image = html.match(/property="og:image" content="([^"]+)"/)?.[1]?.replaceAll('&amp;', '&')
  assert(image?.startsWith(seo.origin) || image?.startsWith('https://cdn.sanity.io/'), `${route}: og:image missing`)
  if (image.startsWith(seo.origin)) await access(path.join(root, 'dist', new URL(image).pathname))
  assert(/property="og:image:width" content="\d+"/.test(html) && /property="og:image:height" content="\d+"/.test(html), `${route}: og:image size missing`)
  assert(html.includes('name="twitter:card" content="summary_large_image"'), `${route}: twitter card missing`)
  assert.equal(sitemap.includes(`<loc>${canonical}</loc>`), index, `${route}: sitemap ${index ? 'is missing it' : 'must not list it'}`)
  return html
}

for (const [route, page] of Object.entries(seo.pages)) {
  await checkPage(route, page.index)
  if (route !== '/') {
    assert(vercel.rewrites.some(({ source, destination }) => source === route && destination === `${route}/index.html`), `${route}: Vercel HTML rewrite missing`)
  }
}

for (const catalog of cms.catalogs) {
  const html = await checkPage(`/works/catalogs/${catalog.slug}`, !catalog.password)
  assert(html.includes('"@type":"CollectionPage"'), `${catalog.slug}: collection schema missing`)
}

const productFiles = await readdir(path.join(root, 'dist/works'), { withFileTypes: true })
const products = productFiles.filter((entry) => entry.isDirectory() && entry.name !== 'catalogs')
assert.equal(products.length, cms.artworks.length, `Expected one indexable HTML file for each of the ${cms.artworks.length} works`)
for (const product of products) {
  const html = await checkPage(`/works/${product.name}`, true)
  assert(html.includes('"@type":"VisualArtwork"'), `/works/${product.name}: artwork schema missing`)
}

console.log(`Verified ${products.length} works, ${cms.catalogs.length} catalogs, ${Object.keys(seo.pages).length} other routes, redirects, sitemap and robots.`)

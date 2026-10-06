import assert from 'node:assert/strict'
import { access, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const read = (file) => readFile(path.join(root, file), 'utf8')
const seo = JSON.parse(await read('src/data/seo-pages.json'))
const vercel = JSON.parse(await read('vercel.json'))
const sitemap = await read('dist/sitemap.xml')
const robots = await read('dist/robots.txt')

assert(robots.includes(`Sitemap: ${seo.origin}/sitemap.xml`), 'robots.txt must point at the canonical sitemap')
assert(!sitemap.includes('/shop'), 'Sitemap must not contain old shop URLs')
assert(!sitemap.includes('/cart'), 'Cart must not be indexed')
assert(vercel.redirects.some(({ source, destination }) => source === '/shop' && destination === '/works'))
assert(vercel.redirects.some(({ source, destination }) => source === '/shop/:path*' && destination === '/works/:path*'))

for (const [route, page] of Object.entries(seo.pages)) {
  const file = route === '/' ? 'dist/index.html' : `dist${route}/index.html`
  const html = await read(file)
  const canonical = new URL(route, seo.origin).href
  assert(html.includes(`<title>${page.title}</title>`), `${route}: title missing`)
  assert(html.includes(`rel="canonical" href="${canonical}"`), `${route}: canonical missing`)
  assert(html.includes(`name="robots" content="${page.index ? 'index, follow' : 'noindex, follow'}"`), `${route}: robots metadata missing`)
  const image = html.match(/property="og:image" content="([^"]+)"/)?.[1]
  assert(image?.startsWith(seo.origin), `${route}: og:image missing`)
  await access(path.join(root, 'dist', new URL(image).pathname))
  if (route !== '/') {
    assert(vercel.rewrites.some(({ source, destination }) => source === route && destination === `${route}/index.html`), `${route}: Vercel HTML rewrite missing`)
  }
}

const productFiles = await readdir(path.join(root, 'dist/works'), { withFileTypes: true })
const products = productFiles.filter((entry) => entry.isDirectory() && entry.name !== 'catalogs')
assert.equal(products.length, 30, 'Expected one indexable HTML file for each of the 30 works')
for (const product of products) {
  const route = `/works/${product.name}`
  const html = await read(`dist${route}/index.html`)
  assert(html.includes(`rel="canonical" href="${seo.origin}${route}"`), `${route}: canonical missing`)
  assert(html.includes('"@type":"VisualArtwork"'), `${route}: artwork schema missing`)
  assert(sitemap.includes(`<loc>${seo.origin}${route}</loc>`), `${route}: missing from sitemap`)
}

console.log(`Verified ${products.length} works, ${Object.keys(seo.pages).length} other routes, redirects, sitemap and robots.`)

import { readFile, mkdir, writeFile, access } from 'node:fs/promises'
import path from 'node:path'
import { transformWithOxc } from 'vite'

const root = path.resolve(import.meta.dirname, '..')
const dist = path.join(root, 'dist')
const seo = JSON.parse(await readFile(path.join(root, 'src/data/seo-pages.json'), 'utf8'))
const source = await readFile(path.join(root, 'src/data/artworks.ts'), 'utf8')
const compiled = await transformWithOxc(source, 'artworks.ts')
const { artworks } = await import(`data:text/javascript;base64,${Buffer.from(compiled.code).toString('base64')}`)
const baseHtml = await readFile(path.join(dist, 'index.html'), 'utf8')
const origin = new URL(seo.origin).origin

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character])
const escapeXml = escapeHtml

const routes = new Map(Object.entries(seo.pages))
for (const work of artworks) {
  if (routes.has(`/works/${work.id}`)) throw new Error(`Duplicate SEO route for ${work.id}`)
  await access(path.join(root, 'public', work.image.replace(/^\//, '')))
  routes.set(`/works/${work.id}`, {
    title: `${work.title} — Fine Art Photograph | TNES.`,
    description: `${work.description} ${work.subtitle}. Archival pigment print available by inquiry.`,
    index: true,
    work,
  })
}

function structuredData(route, page) {
  if (page.work) return {
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    name: page.work.title,
    description: page.work.description,
    image: new URL(page.work.image, origin).href,
    url: new URL(route, origin).href,
    artform: 'Photography',
    artMedium: 'Archival pigment print',
    creator: { '@type': 'Person', name: 'Victor Safdie Levy' },
  }
  if (route === '/') return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'TNES.',
    url: origin,
    founder: { '@type': 'Person', name: 'Victor Safdie Levy' },
    sameAs: ['https://instagram.com/vlevy_'],
  }
  if (route === '/works/catalogs/the-hamptons') return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'The Hamptons — TNES.',
    description: page.description,
    url: new URL(route, origin).href,
  }
  return null
}

function htmlFor(route, page) {
  const canonical = new URL(route, origin).href
  const jsonLd = structuredData(route, page)
  const extra = [
    `<meta name="robots" content="${page.index ? 'index, follow' : 'noindex, follow'}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta property="og:title" content="${escapeHtml(page.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(page.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:type" content="${page.work ? 'article' : 'website'}" />`,
    '<meta name="twitter:card" content="summary" />',
    ...(jsonLd ? [`<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`] : []),
  ].join('\n    ')
  return baseHtml
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(page.title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${escapeHtml(page.description)}" />`)
    .replace('</head>', `    ${extra}\n  </head>`)
}

for (const [route, page] of routes) {
  const directory = route === '/' ? dist : path.join(dist, route.slice(1))
  await mkdir(directory, { recursive: true })
  await writeFile(path.join(directory, 'index.html'), htmlFor(route, page))
}

const urls = [...routes.entries()]
  .filter(([, page]) => page.index)
  .map(([route]) => `  <url><loc>${escapeXml(new URL(route, origin).href)}</loc></url>`)
await writeFile(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`)
console.log(`Generated ${urls.length} canonical sitemap URLs and ${routes.size} route-specific HTML documents.`)

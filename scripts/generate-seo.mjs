import { readFile, mkdir, writeFile, access } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { transformWithOxc } from 'vite'

const root = path.resolve(import.meta.dirname, '..')
const dist = path.join(root, 'dist')
const seo = JSON.parse(await readFile(path.join(root, 'src/data/seo-pages.json'), 'utf8'))
const source = await readFile(path.join(root, 'src/data/artworks.ts'), 'utf8')
const compiled = await transformWithOxc(source, 'artworks.ts')
const { artworks, HERO_ID } = await import(`data:text/javascript;base64,${Buffer.from(compiled.code).toString('base64')}`)
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

// One 1200 px JPEG per work for link previews. The originals are WebP of up to
// 700 kB, and WhatsApp drops the picture from a preview when the image is heavy.
await mkdir(path.join(dist, 'og'), { recursive: true })
const ogSizes = new Map(await Promise.all(artworks.map(async (work) => {
  const { width, height } = await sharp(path.join(root, 'public', work.image.replace(/^\//, '')))
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 75, mozjpeg: true })
    .toFile(path.join(dist, 'og', `${work.id}.jpg`))
  return [work.id, { width, height }]
})))
// Pages that are not a work share the signature work's picture.
const heroWork = artworks.find((work) => work.id === HERO_ID)
const socialWork = (page) => page.work ?? heroWork
const socialImage = (page) => new URL(`/og/${socialWork(page).id}.jpg`, origin).href

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
    creator: { '@type': 'Person', '@id': `${origin}/about#person`, name: 'Victor Safdie Levy' },
  }
  if (route === '/') return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${origin}/#organization`,
        name: 'TNES.',
        url: `${origin}/`,
        email: 'vlevy@tnes.studio',
        founder: { '@id': `${origin}/about#person` },
        sameAs: ['https://instagram.com/vlevy_'],
      },
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        name: 'TNES.',
        url: `${origin}/`,
        inLanguage: 'en',
        publisher: { '@id': `${origin}/#organization` },
      },
    ],
  }
  if (route === '/about') return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: new URL(route, origin).href,
    mainEntity: {
      '@type': 'Person',
      '@id': `${origin}/about#person`,
      name: 'Victor Safdie Levy',
      jobTitle: 'Photographer',
      url: new URL(route, origin).href,
      worksFor: { '@id': `${origin}/#organization` },
      sameAs: ['https://instagram.com/vlevy_'],
    },
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
    '<meta property="og:site_name" content="TNES." />',
    `<meta property="og:image" content="${escapeHtml(socialImage(page))}" />`,
    '<meta property="og:image:type" content="image/jpeg" />',
    `<meta property="og:image:width" content="${ogSizes.get(socialWork(page).id).width}" />`,
    `<meta property="og:image:height" content="${ogSizes.get(socialWork(page).id).height}" />`,
    `<meta property="og:image:alt" content="${escapeHtml(`${socialWork(page).title} — photograph by Victor Safdie Levy`)}" />`,
    '<meta property="og:locale" content="en_US" />',
    '<meta name="twitter:card" content="summary_large_image" />',
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

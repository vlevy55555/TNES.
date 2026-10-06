import { readFile, mkdir, writeFile, access } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(import.meta.dirname, '..')
const dist = path.join(root, 'dist')
const seo = JSON.parse(await readFile(path.join(root, 'src/data/seo-pages.json'), 'utf8'))
// What the Studio published, as scripts/cms/fetch-content.mjs left it
const cms = JSON.parse(await readFile(path.join(root, 'src/data/cms.json'), 'utf8'))
const baseHtml = await readFile(path.join(dist, 'index.html'), 'utf8')
const origin = new URL(seo.origin).origin

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character])
const escapeXml = escapeHtml
const isRemote = (src) => src.startsWith('https://')
/** Sanity's CDN serves any size of an upload; `params` picks this one. */
const remoteSized = (src, params) => {
  const url = new URL(src)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value))
  return url.href
}

const artworks = cms.artworks.map((work) => ({ ...work, subtitle: `${work.location} · ${work.year}` }))
const HERO_ID = cms.home.heroIds[0]

// A page's title and description: the Studio's SEO fields where filled, the
// defaults in seo-pages.json where not. `index` always comes from the file.
const routes = new Map(Object.entries(seo.pages))
const override = (route, fields) => {
  const page = routes.get(route)
  if (page) routes.set(route, { ...page, ...(fields?.title && { title: fields.title }), ...(fields?.description && { description: fields.description }) })
}
override('/', cms.home.seo)
override('/works', cms.works.seo)
override('/about', cms.about.seo)
override('/moments', cms.momentsPage.seo)

for (const catalog of cms.catalogs) {
  const route = `/works/catalogs/${catalog.slug}`
  if (routes.has(route)) throw new Error(`Duplicate SEO route for catalog ${catalog.slug}`)
  routes.set(route, {
    title: catalog.seo?.title || `${catalog.title.replace(/(^|\s)\S/g, (c) => c.toUpperCase())} Catalog — TNES.`,
    description: catalog.seo?.description || catalog.description,
    // a catalog behind a password is not something to send searchers to
    index: !catalog.password,
    catalog,
  })
}

for (const work of artworks) {
  if (routes.has(`/works/${work.id}`)) throw new Error(`Duplicate SEO route for ${work.id}`)
  if (!isRemote(work.image)) await access(path.join(root, 'public', work.image.replace(/^\//, '')))
  routes.set(`/works/${work.id}`, {
    title: `${work.title} — Fine Art Photograph | TNES.`,
    description: `${work.description} ${work.subtitle}. Archival pigment print available by inquiry.`,
    index: true,
    work,
  })
}

// One 1200 px JPEG per work for link previews: WhatsApp drops the picture from
// a preview when the image is heavy. A Studio upload is resized by Sanity's
// CDN on request; a file in /public is resized here, once, at build.
await mkdir(path.join(dist, 'og'), { recursive: true })
const ogImages = new Map(await Promise.all(artworks.map(async (work) => {
  if (isRemote(work.image)) {
    const scale = Math.min(1, 1200 / Math.max(work.imageWidth, work.imageHeight))
    return [work.id, {
      url: remoteSized(work.image, { w: 1200, h: 1200, fit: 'max', fm: 'jpg', q: 75 }),
      width: Math.round(work.imageWidth * scale),
      height: Math.round(work.imageHeight * scale),
    }]
  }
  const { width, height } = await sharp(path.join(root, 'public', work.image.replace(/^\//, '')))
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 75, mozjpeg: true })
    .toFile(path.join(dist, 'og', `${work.id}.jpg`))
  return [work.id, { url: new URL(`/og/${work.id}.jpg`, origin).href, width, height }]
})))
// Pages that are not a work share the signature work's picture.
const heroWork = artworks.find((work) => work.id === HERO_ID) ?? artworks[0]
const socialWork = (page) => page.work ?? heroWork
const socialImage = (page) => ogImages.get(socialWork(page).id)

function structuredData(route, page) {
  if (page.work) return {
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    name: page.work.title,
    description: page.work.description,
    image: isRemote(page.work.image) ? remoteSized(page.work.image, { w: 2400, fit: 'max', fm: 'jpg', q: 85 }) : new URL(page.work.image, origin).href,
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
        email: cms.settings.inquiryEmail,
        founder: { '@id': `${origin}/about#person` },
        sameAs: [cms.settings.instagramUrl],
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
      sameAs: [cms.settings.instagramUrl],
    },
  }
  if (page.catalog) return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: page.title,
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
    `<meta property="og:image" content="${escapeHtml(socialImage(page).url)}" />`,
    '<meta property="og:image:type" content="image/jpeg" />',
    `<meta property="og:image:width" content="${socialImage(page).width}" />`,
    `<meta property="og:image:height" content="${socialImage(page).height}" />`,
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

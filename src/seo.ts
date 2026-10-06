import { artworks } from './data/artworks'
import { cms, type Seo } from './data/cms'
import seo from './data/seo-pages.json'

type PageMeta = { title: string; description: string; index: boolean }

// The same merge scripts/generate-seo.mjs makes for the prerendered HTML: the
// Studio's SEO fields where filled, seo-pages.json where not.
const withSeo = (page: PageMeta, fields?: Seo): PageMeta => ({
  ...page,
  ...(fields?.title && { title: fields.title }),
  ...(fields?.description && { description: fields.description }),
})
const base = seo.pages as Record<string, PageMeta>
const pages: Record<string, PageMeta> = {
  ...base,
  '/': withSeo(base['/'], cms.home.seo),
  '/works': withSeo(base['/works'], cms.works.seo),
  '/about': withSeo(base['/about'], cms.about.seo),
  '/moments': withSeo(base['/moments'], cms.momentsPage.seo),
  ...Object.fromEntries(cms.catalogs.map((catalog) => [`/works/catalogs/${catalog.slug}`, {
    title: catalog.seo?.title || `${catalog.title.replace(/(^|\s)\S/g, (c) => c.toUpperCase())} Catalog — TNES.`,
    description: catalog.seo?.description || catalog.description,
    index: !catalog.password,
  }])),
}

function setMeta(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  let meta = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute(attribute, name)
    document.head.appendChild(meta)
  }
  meta.content = content
}

export function setPageMetadata(path: string) {
  const work = path.startsWith('/works/')
    ? artworks.find((artwork) => path === `/works/${artwork.id}`)
    : undefined
  const page: PageMeta = work
    ? {
        title: `${work.title} — Fine Art Photograph | TNES.`,
        description: `${work.description} ${work.subtitle}. Archival pigment print available by inquiry.`,
        index: true,
      }
    : pages[path] ?? { ...pages['/'], index: false }
  const canonicalPath = pages[path] || work ? path : '/'
  const canonical = new URL(canonicalPath, seo.origin).href

  document.title = page.title
  setMeta('description', page.description)
  setMeta('robots', page.index ? 'index, follow' : 'noindex, follow')
  setMeta('og:title', page.title, 'property')
  setMeta('og:description', page.description, 'property')
  setMeta('og:url', canonical, 'property')
  setMeta('og:type', work ? 'article' : 'website', 'property')
  setMeta('twitter:card', 'summary_large_image')

  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  link.href = canonical
}

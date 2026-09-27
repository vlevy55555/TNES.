import { artworks } from './data/artworks'
import seo from './data/seo-pages.json'

type PageMeta = { title: string; description: string; index: boolean }
const pages = seo.pages as Record<string, PageMeta>

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
  setMeta('twitter:card', 'summary')

  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  link.href = canonical
}

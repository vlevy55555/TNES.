// The site's editable content, as the Sanity Studio (studio/) publishes it.
//
// cms.json is written by scripts/cms/fetch-content.mjs at the start of every
// build, and committed so a build without network — or before the dataset is
// filled — still has the last good copy. Nothing in the site fetches content
// at runtime: a publish in the Studio triggers a rebuild through the Vercel
// deploy hook, and the new text ships in the prerendered HTML.
import content from './cms.json'

export type Seo = { title?: string; description?: string }
export type Photo = { src: string; alt?: string; width: number; height: number }

export type CmsArtwork = {
  id: string
  title: string
  location: string
  year: number
  description: string
  image: string
  imageWidth: number
  imageHeight: number
  region: string
  scenes: string[]
  shopifyHandle: string
  edition: string
}

export type CmsMoment = {
  place: string
  status: 'past' | 'current' | 'next'
  title: string
  date: string
  abstract: string
  links: { label: string; href?: string; contactSubject?: string }[]
  photos: Photo[]
}

export type CmsCatalog = {
  slug: string
  title: string
  showOnWorks: boolean
  description: string
  meta: string
  inquireSubject: string
  studioNote: { label: string; title: string; text: string }
  photos: { location: string; image: string; width: number; height: number; compact: boolean }[]
  cardImage: Photo | null
  cardCaption: string
  cardDetails: string
  cardNote: string
  spreads: number[]
  password: string
  seo: Seo
}

export type Cms = {
  source: string
  settings: {
    inquiryEmail: string
    phone: string
    instagramHandle: string
    instagramUrl: string
    brandStatement: string
    footerTagline: string
    footerPlaces: string
    copyright: string
    earlyAccess: { eyebrow: string; title: string; copy: string }
  }
  artworks: CmsArtwork[]
  home: {
    heroIds: string[]
    statementTitle: string
    statementCopy: string
    statementArtworkId: string
    selectedWorksTitle: string
    seo: Seo
  }
  works: { eyebrow: string; title: string; description: string; catalogsTitle: string; catalogsSubtitle: string; seo: Seo }
  about: {
    name: string
    role: string
    statement: string
    heroImage: Photo
    splitImage: Photo
    splitTitle: string
    splitText: string
    ctaLabel: string
    ctaUrl: string
    closingNote: string
    seo: Seo
  }
  momentsPage: {
    pretitle: string
    title: string
    intro: string
    introImages: Photo[]
    release: { eyebrow: string; title: string; copy: string }
    seo: Seo
  }
  moments: CmsMoment[]
  catalogs: CmsCatalog[]
}

export const cms = content as unknown as Cms

/** A multi-line field as the lines the editor broke it into. */
export const linesOf = (text: string) => text.split('\n').map((line) => line.trim()).filter(Boolean)

/** A field with blank lines between paragraphs, as those paragraphs. */
export const paragraphsOf = (text: string) => text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)

/**
 * The same picture at `width` px. Sanity's CDN resizes on request and picks
 * WebP/AVIF for the browser; a local /public path has one size and passes
 * through unchanged.
 */
export function sized(src: string, width: number) {
  if (!src.startsWith('https://cdn.sanity.io/')) return src
  const url = new URL(src)
  url.searchParams.set('w', String(width))
  url.searchParams.set('fit', 'max')
  url.searchParams.set('auto', 'format')
  if (!url.searchParams.has('q')) url.searchParams.set('q', '82')
  return url.href
}

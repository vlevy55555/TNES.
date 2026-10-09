/** A Sanity image as the URL and size the site uses, with the Studio's crop applied. */
function toPhoto(value) {
  const asset = value?.asset
  if (!asset?.url) return null
  let { width, height } = asset.dimensions
  let url = asset.url
  const crop = value.crop
  if (crop && (crop.top || crop.bottom || crop.left || crop.right)) {
    const x = Math.round(crop.left * width)
    const y = Math.round(crop.top * height)
    width = Math.round(width * (1 - crop.left - crop.right))
    height = Math.round(height * (1 - crop.top - crop.bottom))
    url += `?rect=${x},${y},${width},${height}`
  }
  return { src: url, alt: value.alt ?? '', width, height }
}

const text = (value) => (typeof value === 'string' ? value : '')
const seo = (value) => ({ title: text(value?.title), description: text(value?.description) })

export function normalize(data) {
  if (!data || typeof data !== 'object') throw new Error('resposta do Sanity sem conteúdo')
  const required = ['settings', 'home', 'works', 'about', 'momentsPage']
  const missing = required.filter((key) => !data[key])
  if (missing.length) throw new Error(`documentos obrigatórios não publicados: ${missing.join(', ')}`)
  for (const key of ['artworks', 'moments', 'catalogs']) {
    if (!Array.isArray(data[key])) throw new Error(`coleção ${key} ausente na resposta do Sanity`)
  }
  if (!data.artworks.length) throw new Error('nenhuma obra publicada; a Home e a galeria precisam de ao menos uma obra')
  const warnings = []
  const artworks = data.artworks.flatMap((work) => {
    const picture = toPhoto(work.image)
    const missing = ['title', 'location', 'year', 'description'].filter((key) => !work[key])
    if (!picture || missing.length) {
      warnings.push(`obra "${work.title ?? work.id}" ficou de fora — falta: ${[...missing, ...(picture ? [] : ['image'])].join(', ')}`)
      return []
    }
    return [{
      id: work.id,
      title: work.title,
      location: work.location,
      year: work.year,
      description: work.description,
      image: picture.src,
      imageWidth: picture.width,
      imageHeight: picture.height,
      region: work.region ?? 'elsewhere',
      scenes: work.scenes ?? [],
      shopifyHandle: text(work.shopifyHandle),
      edition: text(work.edition) || 'Archival pigment print · edition by inquiry',
    }]
  })
  if (!artworks.length) throw new Error('nenhuma obra válida após validar os campos obrigatórios')
  const ids = new Set(artworks.map((work) => work.id))

  const page = (doc, build) => build(doc)

  const settings = page(data.settings, (doc) => ({
    inquiryEmail: text(doc.inquiryEmail),
    phone: text(doc.phone),
    instagramHandle: text(doc.instagramHandle),
    instagramUrl: text(doc.instagramUrl),
    brandStatement: text(doc.brandStatement),
    footerTagline: text(doc.footerTagline),
    footerPlaces: text(doc.footerPlaces),
    copyright: text(doc.copyright),
    earlyAccess: { eyebrow: text(doc.earlyAccess?.eyebrow), title: text(doc.earlyAccess?.title), copy: text(doc.earlyAccess?.copy) },
  }))

  const home = page(data.home, (doc) => {
    const heroIds = (doc.heroIds ?? []).filter((id) => ids.has(id))
    if (!heroIds.length) warnings.push('Home sem obras publicadas no topo — usando a primeira obra da lista')
    return {
      heroIds: heroIds.length ? heroIds : [artworks[0].id],
      statementTitle: text(doc.statementTitle),
      statementCopy: text(doc.statementCopy),
      statementArtworkId: ids.has(doc.statementArtworkId) ? doc.statementArtworkId : (heroIds[0] ?? artworks[0].id),
      selectedWorksTitle: text(doc.selectedWorksTitle),
      seo: seo(doc.seo),
    }
  })

  const works = page(data.works, (doc) => ({
    eyebrow: text(doc.eyebrow),
    title: text(doc.title) || 'Works',
    description: text(doc.description),
    catalogsTitle: text(doc.catalogsTitle),
    catalogsSubtitle: text(doc.catalogsSubtitle),
    seo: seo(doc.seo),
  }))

  if (!toPhoto(data.about.heroImage) || !toPhoto(data.about.splitImage)) {
    throw new Error('About precisa de duas fotos publicadas')
  }
  const about = page(data.about, (doc) => ({
    name: text(doc.name),
    role: text(doc.role),
    statement: text(doc.statement),
    heroImage: toPhoto(doc.heroImage),
    splitImage: toPhoto(doc.splitImage),
    splitTitle: text(doc.splitTitle),
    splitText: text(doc.splitText),
    ctaLabel: text(doc.ctaLabel),
    ctaUrl: text(doc.ctaUrl),
    closingNote: text(doc.closingNote),
    seo: seo(doc.seo),
  }))

  const momentsPage = page(data.momentsPage, (doc) => ({
    pretitle: text(doc.pretitle),
    title: text(doc.title),
    intro: text(doc.intro),
    introImages: (doc.introImages ?? []).map(toPhoto).filter(Boolean),
    release: { eyebrow: text(doc.release?.eyebrow), title: text(doc.release?.title), copy: text(doc.release?.copy) },
    seo: seo(doc.seo),
  }))

  const moments = data.moments.map((entry) => ({
    place: text(entry.place),
    status: ['current', 'next'].includes(entry.status) ? entry.status : 'past',
    title: text(entry.title),
    date: text(entry.date),
    abstract: text(entry.abstract),
    links: (entry.links ?? []).filter((link) => link.label).map((link) => ({
      label: link.label,
      ...(link.href ? { href: link.href } : { contactSubject: text(link.contactSubject) }),
    })),
    photos: (entry.photos ?? []).map(toPhoto).filter(Boolean),
  }))

  const catalogs = data.catalogs.map((catalog) => ({
    slug: catalog.slug,
    title: text(catalog.title),
    showOnWorks: catalog.showOnWorks !== false,
    description: text(catalog.description),
    meta: text(catalog.meta),
    inquireSubject: text(catalog.inquireSubject),
    studioNote: { label: text(catalog.studioNote?.label), title: text(catalog.studioNote?.title), text: text(catalog.studioNote?.text) },
    photos: (catalog.photos ?? []).flatMap((entry) => {
      const picture = toPhoto(entry.image)
      return picture ? [{ location: text(entry.location), image: picture.src, width: picture.width, height: picture.height, compact: Boolean(entry.compact) }] : []
    }),
    cardImage: toPhoto(catalog.cardImage),
    cardCaption: text(catalog.cardCaption),
    cardDetails: text(catalog.cardDetails),
    cardNote: text(catalog.cardNote),
    spreads: (catalog.spreads ?? []).filter((n) => Number.isInteger(n) && n > 0),
    password: text(catalog.password),
    seo: seo(catalog.seo),
  })).filter((catalog) => catalog.photos.length)

  return { content: { source: 'sanity', settings, artworks, home, works, about, momentsPage, moments, catalogs }, warnings }
}

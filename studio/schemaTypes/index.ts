import { artwork } from './artwork'
import { catalog } from './catalog'
import { moment } from './moment'
import { aboutPage, homePage, momentsPage, siteSettings, worksPage } from './pages'
import { photo, seo } from './shared'

export const schemaTypes = [artwork, catalog, moment, homePage, worksPage, aboutPage, momentsPage, siteSettings, seo, photo]

/** One document each, at a fixed id — the site reads them by these ids. */
export const SINGLETONS = ['siteSettings', 'homePage', 'worksPage', 'aboutPage', 'momentsPage'] as const

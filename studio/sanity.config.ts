import { ptBRLocale } from '@sanity/locale-pt-br'
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schemaTypes, SINGLETONS } from './schemaTypes'
import { structure } from './structure'

const singletons = new Set<string>(SINGLETONS)
// a singleton can be edited and published, never duplicated or deleted
const singletonActions = new Set(['publish', 'discardChanges', 'restore'])

export default defineConfig({
  name: 'default',
  title: 'TNES.',
  projectId: 'bchwhnoq',
  dataset: 'production',

  plugins: [structureTool({ structure }), ptBRLocale()],

  schema: {
    types: schemaTypes,
    templates: (templates) => templates.filter(({ schemaType }) => !singletons.has(schemaType)),
  },

  document: {
    actions: (actions, { schemaType }) =>
      singletons.has(schemaType) ? actions.filter(({ action }) => action && singletonActions.has(action)) : actions,
    // "Open preview" in the document menu goes to the live page
    productionUrl: async (previous, { document }) => {
      const slug = (document.slug as { current?: string } | undefined)?.current
      if (document._type === 'artwork' && slug) return `https://www.tnes.studio/works/${slug}`
      if (document._type === 'catalog' && slug) return `https://www.tnes.studio/works/catalogs/${slug}`
      const pages: Record<string, string> = { homePage: '/', worksPage: '/works', aboutPage: '/about', momentsPage: '/moments', moment: '/moments' }
      return pages[document._type] ? `https://www.tnes.studio${pages[document._type]}` : previous
    },
  },
})

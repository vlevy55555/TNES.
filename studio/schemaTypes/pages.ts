import { CogIcon } from '@sanity/icons/Cog'
import { DocumentIcon } from '@sanity/icons/Document'
import { HomeIcon } from '@sanity/icons/Home'
import { UserIcon } from '@sanity/icons/User'
import { defineArrayMember, defineField, defineType } from 'sanity'
import { LINES_HINT } from './shared'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Configurações gerais',
  type: 'document',
  icon: CogIcon,
  groups: [
    { name: 'contact', title: 'Contato', default: true },
    { name: 'footer', title: 'Rodapé' },
    { name: 'signup', title: 'Lista de e-mails' },
  ],
  fields: [
    defineField({
      name: 'inquiryEmail',
      title: 'E-mail do estúdio',
      type: 'string',
      group: 'contact',
      description: 'Mostrado no formulário de contato. (Para onde os formulários enviam é configurado no servidor, em CONTACT_TO.)',
      validation: (rule) => rule.required().email(),
    }),
    defineField({ name: 'phone', title: 'Telefone', type: 'string', group: 'contact' }),
    defineField({ name: 'instagramHandle', title: 'Instagram (@)', type: 'string', group: 'contact', description: 'Ex.: "@vlevy_".' }),
    defineField({
      name: 'instagramUrl',
      title: 'Instagram (link)',
      type: 'url',
      group: 'contact',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'brandStatement',
      title: 'Frase da marca',
      type: 'string',
      group: 'footer',
      description: 'A frase que define a TNES. ("nothing happens twice"). Usada na galeria 3D e como texto acessível da home.',
    }),
    defineField({ name: 'footerTagline', title: 'Frase do rodapé', type: 'text', rows: 2, group: 'footer', description: LINES_HINT }),
    defineField({ name: 'footerPlaces', title: 'Cidades no rodapé', type: 'string', group: 'footer', description: 'Ex.: "new york · são paulo".' }),
    defineField({ name: 'copyright', title: 'Copyright', type: 'string', group: 'footer', description: 'Ex.: "© victor safdie levy".' }),
    defineField({
      name: 'earlyAccess',
      title: 'Bloco de inscrição (padrão)',
      type: 'object',
      group: 'signup',
      description: 'O bloco "be the first to know." que aparece no fim da home e dos catálogos. Quem se inscreve entra na lista do MailerLite.',
      fields: [
        defineField({ name: 'eyebrow', title: 'Rótulo', type: 'string' }),
        defineField({ name: 'title', title: 'Título', type: 'string' }),
        defineField({ name: 'copy', title: 'Texto', type: 'text', rows: 2 }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Configurações gerais' }) },
})

export const homePage = defineType({
  name: 'homePage',
  title: 'Home',
  type: 'document',
  icon: HomeIcon,
  fields: [
    defineField({
      name: 'heroWorks',
      title: 'Obras do topo (slideshow)',
      type: 'array',
      description:
        'As obras que passam em tela cheia no topo da home, nesta ordem. A PRIMEIRA é a obra-assinatura: aparece como [O] na lista, ' +
        'é a obra da parede de entrada da galeria 3D e a imagem padrão quando alguém compartilha o site.',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'artwork' }] })],
      validation: (rule) => rule.required().min(1).max(8).unique(),
    }),
    defineField({ name: 'statementTitle', title: 'Frase grande', type: 'text', rows: 3, description: LINES_HINT }),
    defineField({ name: 'statementCopy', title: 'Texto da frase', type: 'text', rows: 6, description: LINES_HINT }),
    defineField({
      name: 'statementArtwork',
      title: 'Obra ao lado da frase',
      type: 'reference',
      to: [{ type: 'artwork' }],
    }),
    defineField({
      name: 'selectedWorksTitle',
      title: 'Título do carrossel de obras',
      type: 'string',
      description: 'O carrossel mostra todas as obras publicadas, intercalando verticais e horizontais.',
    }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo' }),
  ],
  preview: { prepare: () => ({ title: 'Home' }) },
})

export const worksPage = defineType({
  name: 'worksPage',
  title: 'Works (lista de obras)',
  type: 'document',
  icon: DocumentIcon,
  fields: [
    defineField({ name: 'eyebrow', title: 'Rótulo', type: 'string', description: 'Ex.: "tnes. opening selection".' }),
    defineField({ name: 'title', title: 'Título', type: 'string' }),
    defineField({ name: 'description', title: 'Descrição', type: 'text', rows: 3 }),
    defineField({ name: 'catalogsTitle', title: 'Título da seção de catálogos', type: 'string' }),
    defineField({ name: 'catalogsSubtitle', title: 'Texto da seção de catálogos', type: 'text', rows: 2 }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo' }),
  ],
  preview: { prepare: () => ({ title: 'Works' }) },
})

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About',
  type: 'document',
  icon: UserIcon,
  groups: [
    { name: 'opening', title: 'Abertura', default: true },
    { name: 'second', title: 'Segunda parte' },
    { name: 'closing', title: 'Final' },
  ],
  fields: [
    defineField({ name: 'name', title: 'Nome', type: 'text', rows: 3, group: 'opening', description: 'Uma palavra por linha, como aparece no topo.' }),
    defineField({ name: 'role', title: 'Cargo', type: 'string', group: 'opening', description: 'Em maiúsculas. Ex.: "ARTIST AND FOUNDER OF TNES."' }),
    defineField({ name: 'statement', title: 'Texto de abertura', type: 'text', rows: 6, group: 'opening', description: 'Em primeira pessoa. O site quebra as linhas sozinho.' }),
    defineField({ name: 'heroImage', title: 'Foto de abertura', type: 'photo', group: 'opening', description: 'Sobe e cobre a tela; depois encolhe e recebe a assinatura.', validation: (rule) => rule.required() }),
    defineField({ name: 'splitImage', title: 'Foto da segunda parte', type: 'photo', group: 'second', validation: (rule) => rule.required() }),
    defineField({ name: 'splitTitle', title: 'Título da segunda parte', type: 'text', rows: 3, group: 'second', description: LINES_HINT }),
    defineField({
      name: 'splitText',
      title: 'Texto da segunda parte',
      type: 'text',
      rows: 8,
      group: 'second',
      description: 'Deixe uma linha em branco entre parágrafos. O site quebra as linhas sozinho.',
    }),
    defineField({ name: 'ctaLabel', title: 'Texto do link final', type: 'string', group: 'closing', description: 'Ex.: "enter the mind in VSL". Usado também na galeria 3D.' }),
    defineField({ name: 'ctaUrl', title: 'Endereço do link final', type: 'url', group: 'closing' }),
    defineField({ name: 'closingNote', title: 'Linha abaixo do link', type: 'string', group: 'closing' }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo', group: 'closing' }),
  ],
  preview: { prepare: () => ({ title: 'About' }) },
})

export const momentsPage = defineType({
  name: 'momentsPage',
  title: 'Moments (abertura e lançamento)',
  type: 'document',
  icon: DocumentIcon,
  fields: [
    defineField({ name: 'pretitle', title: 'Rótulo', type: 'string', description: 'Ex.: "[moments]".' }),
    defineField({ name: 'title', title: 'Título', type: 'string' }),
    defineField({ name: 'intro', title: 'Texto de abertura', type: 'text', rows: 4 }),
    defineField({
      name: 'introImages',
      title: 'Fotos da abertura',
      type: 'array',
      description: 'Duas fotos que sobem nas laterais do título.',
      of: [defineArrayMember({ type: 'photo' })],
      options: { layout: 'grid' },
      validation: (rule) => rule.max(2),
    }),
    defineField({
      name: 'release',
      title: 'Bloco do lançamento (fim da página)',
      type: 'object',
      description: 'O bloco de inscrição no fim de /moments. O link "#release" de um moment leva até aqui.',
      fields: [
        defineField({ name: 'eyebrow', title: 'Rótulo', type: 'string' }),
        defineField({ name: 'title', title: 'Título', type: 'string' }),
        defineField({ name: 'copy', title: 'Texto', type: 'text', rows: 2 }),
      ],
    }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo' }),
  ],
  preview: { prepare: () => ({ title: 'Moments' }) },
})

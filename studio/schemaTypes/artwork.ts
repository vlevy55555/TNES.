import { ImageIcon } from '@sanity/icons/Image'
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list'
import { defineField, defineType } from 'sanity'
import { REGIONS, SCENES } from './shared'

export const DEFAULT_EDITION = 'Archival pigment print · edition by inquiry'

export const artwork = defineType({
  name: 'artwork',
  title: 'Obra',
  type: 'document',
  icon: ImageIcon,
  orderings: [orderRankOrdering],
  groups: [
    { name: 'work', title: 'Obra', default: true },
    { name: 'shop', title: 'Venda e filtros' },
  ],
  fields: [
    orderRankField({ type: 'artwork' }),
    defineField({
      name: 'title',
      title: 'Título',
      type: 'string',
      group: 'work',
      description: 'Nome da obra em inglês, como aparece no site. Ex.: "Everyone In".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Endereço no site',
      type: 'slug',
      group: 'work',
      description:
        'Vira tnes.studio/works/<endereço>. Clique em "Generate" para criar a partir do título. ' +
        'Depois de publicada, NÃO mude: links compartilhados, favoritos e carrinhos dos visitantes usam este endereço.',
      options: { source: 'title', maxLength: 80 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Foto',
      type: 'image',
      group: 'work',
      description:
        'A foto inteira, sem moldura. JPG/WebP com 2500 px ou mais no lado maior. ' +
        'O formato (horizontal, vertical) e o tamanho do quadro no site saem desta imagem. Se cortar, corte só bordas.',
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'location',
      title: 'Local',
      type: 'string',
      group: 'work',
      description: 'Lugar e país, do mais específico ao mais geral. Ex.: "Ipanema, Rio de Janeiro, Brazil". O país vai por último.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'year',
      title: 'Ano',
      type: 'number',
      group: 'work',
      validation: (rule) => rule.required().integer().min(1990).max(2100),
    }),
    defineField({
      name: 'description',
      title: 'Descrição',
      type: 'text',
      rows: 3,
      group: 'work',
      description: 'Uma frase em inglês descrevendo o que está na foto. Aparece na página da obra e no Google.',
      validation: (rule) => rule.required().max(240),
    }),
    defineField({
      name: 'region',
      title: 'Região (filtro "place")',
      type: 'string',
      group: 'shop',
      options: { list: REGIONS, layout: 'radio' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'scenes',
      title: 'Cenas (filtro "scene")',
      type: 'array',
      group: 'shop',
      description: 'O que aparece na foto. Marque todas que valem.',
      of: [{ type: 'string' }],
      options: { list: SCENES, layout: 'grid' },
    }),
    defineField({
      name: 'shopifyHandle',
      title: 'Produto na Shopify (handle)',
      type: 'string',
      group: 'shop',
      description:
        'O "handle" do produto na Shopify — o final do endereço do produto lá (Shopify ▸ Products ▸ produto ▸ "Search engine listing"). ' +
        'É daqui que vêm tamanhos, molduras e preços. Em branco, a obra aparece só para orçamento (inquiry).',
      validation: (rule) =>
        rule.regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, { name: 'handle' }).error('Só letras minúsculas, números e hífens.'),
    }),
    defineField({
      name: 'edition',
      title: 'Edição',
      type: 'string',
      group: 'shop',
      initialValue: DEFAULT_EDITION,
      description: 'Linha técnica mostrada no painel da obra na galeria 3D.',
    }),
  ],
  preview: {
    select: { title: 'title', location: 'location', year: 'year', media: 'image', handle: 'shopifyHandle' },
    prepare: ({ title, location, year, media, handle }) => ({
      title,
      subtitle: `${location ?? '—'} · ${year ?? '—'}${handle ? '' : ' · só orçamento'}`,
      media,
    }),
  },
})

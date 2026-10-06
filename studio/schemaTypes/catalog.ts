import { BookIcon } from '@sanity/icons/Book'
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list'
import { defineArrayMember, defineField, defineType } from 'sanity'

export const catalog = defineType({
  name: 'catalog',
  title: 'Catálogo',
  type: 'document',
  icon: BookIcon,
  orderings: [orderRankOrdering],
  groups: [
    { name: 'page', title: 'Página', default: true },
    { name: 'photos', title: 'Fotos' },
    { name: 'card', title: 'Card em /works' },
    { name: 'advanced', title: 'Avançado' },
  ],
  fields: [
    orderRankField({ type: 'catalog' }),
    defineField({
      name: 'title',
      title: 'Título',
      type: 'string',
      group: 'page',
      description: 'Em minúsculas, como no site. Ex.: "the hamptons".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Endereço no site',
      type: 'slug',
      group: 'page',
      description: 'Vira tnes.studio/works/catalogs/<endereço>. Não mude depois de publicado.',
      options: { source: 'title', maxLength: 60 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'showOnWorks',
      title: 'Mostrar em /works',
      type: 'boolean',
      group: 'page',
      initialValue: true,
      description: 'Desligado, o catálogo some da lista em /works mas o endereço direto continua funcionando.',
    }),
    defineField({
      name: 'description',
      title: 'Descrição',
      type: 'text',
      rows: 3,
      group: 'page',
      description: 'Parágrafo de abertura do catálogo, em inglês e minúsculas.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'meta',
      title: 'Linha de dados',
      type: 'string',
      group: 'page',
      description: 'Ex.: "summer 2026  ·  east hampton, napeague, montauk  ·  36 works".',
    }),
    defineField({
      name: 'inquireSubject',
      title: 'Assunto do botão "inquire"',
      type: 'string',
      group: 'page',
      description: 'O assunto que já vem escrito quando alguém clica em "inquire". Ex.: "the hamptons catalog inquiry".',
    }),
    defineField({
      name: 'studioNote',
      title: 'Nota do estúdio',
      type: 'object',
      group: 'page',
      description: 'O bloco de texto ao lado da descrição.',
      fields: [
        defineField({ name: 'label', title: 'Rótulo', type: 'string', initialValue: 'the studio' }),
        defineField({ name: 'title', title: 'Título', type: 'string', initialValue: 'nothing happens twice.' }),
        defineField({
          name: 'text',
          title: 'Texto',
          type: 'text',
          rows: 12,
          description: 'Deixe uma linha em branco entre parágrafos. Dentro de um parágrafo, cada linha vira uma linha no site.',
        }),
      ],
    }),
    defineField({
      name: 'photos',
      title: 'Fotos do catálogo',
      type: 'array',
      group: 'photos',
      description:
        'Arraste para reordenar. O número de cada foto (01, 02…) segue esta ordem. ' +
        'Clicar numa foto no site abre o formulário de contato com o número e o local já escritos.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'catalogPhoto',
          title: 'Foto',
          fields: [
            defineField({ name: 'image', title: 'Foto', type: 'image', validation: (rule) => rule.required() }),
            defineField({
              name: 'location',
              title: 'Local',
              type: 'string',
              description: 'Em minúsculas. Ex.: "main beach".',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'compact',
              title: 'Menor na página',
              type: 'boolean',
              initialValue: false,
              description: 'Liga para fotos verticais que ficariam altas demais ao lado das outras.',
            }),
          ],
          preview: {
            select: { title: 'location', media: 'image' },
          },
        }),
      ],
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: 'cardImage',
      title: 'Foto do card',
      type: 'photo',
      group: 'card',
      description: 'A foto que representa o catálogo na lista de /works.',
    }),
    defineField({ name: 'cardCaption', title: 'Legenda da foto do card', type: 'string', group: 'card', description: 'Ex.: "24 — montauk".' }),
    defineField({ name: 'cardDetails', title: 'Detalhes do card', type: 'string', group: 'card', description: 'Ex.: "36 works  ·  seasonal selection".' }),
    defineField({ name: 'cardNote', title: 'Observação do card', type: 'text', rows: 2, group: 'card' }),
    defineField({
      name: 'spreads',
      title: 'Fotos por bloco',
      type: 'array',
      group: 'advanced',
      of: [{ type: 'number' }],
      description:
        'Como as fotos se agrupam na página, na ordem: ex. 4, 3, 3, 4… (2 a 4 por bloco). ' +
        'Em branco, o site agrupa sozinho. Se a soma for menor que o número de fotos, o resto vai em pares.',
      validation: (rule) => rule.custom((value?: number[]) =>
        !value || value.every((n) => Number.isInteger(n) && n >= 1 && n <= 4) ? true : 'Use números de 1 a 4.'),
    }),
    defineField({
      name: 'password',
      title: 'Senha (catálogo privado)',
      type: 'string',
      group: 'advanced',
      description:
        'Preenchida, o catálogo pede esta senha antes de mostrar as fotos. É uma trava leve, não segurança de verdade: ' +
        'quem entende de sites consegue ver as fotos sem a senha.',
    }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo', group: 'advanced' }),
  ],
  preview: {
    select: { title: 'title', photos: 'photos', media: 'cardImage', shown: 'showOnWorks' },
    prepare: ({ title, photos, media, shown }) => ({
      title,
      subtitle: `${photos?.length ?? 0} fotos${shown === false ? ' · escondido de /works' : ''}`,
      media,
    }),
  },
})

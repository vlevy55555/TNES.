import { CalendarIcon } from '@sanity/icons/Calendar'
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list'
import { defineArrayMember, defineField, defineType } from 'sanity'
import { LINES_HINT } from './shared'

export const moment = defineType({
  name: 'moment',
  title: 'Moment',
  type: 'document',
  icon: CalendarIcon,
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({ type: 'moment' }),
    defineField({
      name: 'place',
      title: 'Lugar',
      type: 'string',
      description: 'Em minúsculas. Ex.: "east hampton, new york".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Título',
      type: 'text',
      rows: 3,
      description: `${LINES_HINT} Ex.: "nyc soft" / "launch."`,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Data',
      type: 'string',
      description: 'Como deve aparecer, no formato americano. Ex.: "03/27/26" ou "06/27–06/28/26". Para o próximo evento sem data, "next".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'status',
      title: 'Situação',
      type: 'string',
      initialValue: 'past',
      options: {
        list: [
          { title: 'Já aconteceu', value: 'past' },
          { title: 'Acontecendo agora (current)', value: 'current' },
          { title: 'Próximo (next) — sem fotos, mostra a contagem para o lançamento', value: 'next' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'abstract',
      title: 'Texto',
      type: 'text',
      rows: 5,
      description: 'Em inglês e minúsculas, na voz do Victor.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'photos',
      title: 'Fotos',
      type: 'array',
      description:
        'Quatro fotos, nesta ordem: capa (tela cheia), lado esquerdo, centro, lado direito. ' +
        'Sem fotos, o site usa obras do arquivo no lugar.',
      of: [defineArrayMember({ type: 'photo' })],
      options: { layout: 'grid' },
      validation: (rule) => rule.max(4).custom((value?: unknown[]) =>
        !value || value.length === 0 || value.length === 4 ? true : 'Use 4 fotos, ou nenhuma.'),
    }),
    defineField({
      name: 'links',
      title: 'Links',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'momentLink',
          fields: [
            defineField({ name: 'label', title: 'Texto do link', type: 'string', validation: (rule) => rule.required() }),
            defineField({
              name: 'href',
              title: 'Endereço',
              type: 'string',
              description: 'Ex.: "/works" ou "https://…". Deixe em branco para abrir o formulário de contato.',
            }),
            defineField({
              name: 'contactSubject',
              title: 'Assunto do contato',
              type: 'string',
              description: 'Só se o endereço estiver em branco: o assunto que já vem escrito no formulário.',
            }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'title', place: 'place', date: 'date', media: 'photos.0' },
    prepare: ({ title, place, date, media }) => ({
      title: title?.replace(/\n/g, ' '),
      subtitle: `${place} · ${date}`,
      media,
    }),
  },
})

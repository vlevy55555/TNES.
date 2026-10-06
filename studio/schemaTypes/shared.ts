import { defineField, defineType } from 'sanity'

// Listas fixas que o site usa nos filtros de /works. Mudar aqui exige mudar
// SCENE_FILTERS e PLACES em src/home/Shop.tsx também.
export const SCENES = [
  { title: 'praia (beach)', value: 'beach' },
  { title: 'água (water)', value: 'water' },
  { title: 'deserto (desert)', value: 'desert' },
  { title: 'montanha (alpine)', value: 'alpine' },
  { title: 'paisagem (landscape)', value: 'landscape' },
  { title: 'rua (street)', value: 'street' },
  { title: 'arquitetura (architecture)', value: 'architecture' },
  { title: 'pessoas (people)', value: 'people' },
  { title: 'animais (animals)', value: 'animals' },
  { title: 'objetos (objects)', value: 'objects' },
]

export const REGIONS = [
  { title: 'América do Sul (south america)', value: 'south america' },
  { title: 'Europa (europe)', value: 'europe' },
  { title: 'América do Norte (north america)', value: 'north america' },
  { title: 'Outro lugar (elsewhere)', value: 'elsewhere' },
]

export const LINES_HINT =
  'Cada linha aqui vira uma linha no site — a quebra é sua, não automática. Texto em inglês e minúsculas, no tom do site.'

export const seo = defineType({
  name: 'seo',
  title: 'SEO (Google e compartilhamento)',
  type: 'object',
  description:
    'O que aparece no Google e na prévia do link no WhatsApp/Instagram. Em branco, o site usa o texto padrão da página.',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: 'title',
      title: 'Título',
      type: 'string',
      description: 'Até ~60 caracteres. Termine com "— TNES." para manter o padrão.',
      validation: (rule) => rule.max(70).warning('O Google corta títulos longos.'),
    }),
    defineField({
      name: 'description',
      title: 'Descrição',
      type: 'text',
      rows: 3,
      description: 'Uma ou duas frases, até ~160 caracteres.',
      validation: (rule) => rule.max(170).warning('O Google corta descrições longas.'),
    }),
  ],
})

/** Foto com texto alternativo — usado em tudo que não é uma obra. */
export const photo = defineType({
  name: 'photo',
  title: 'Foto',
  type: 'image',
  options: { hotspot: true },
  description: 'JPG ou WebP com pelo menos 2000 px no lado maior. O site gera os tamanhos menores sozinho.',
  fields: [
    defineField({
      name: 'alt',
      title: 'Descrição da foto (alt)',
      type: 'string',
      description: 'Em inglês: o que se vê na foto. É lido por leitores de tela e pelo Google.',
    }),
  ],
})

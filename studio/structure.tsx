import { BookIcon } from '@sanity/icons/Book'
import { CalendarIcon } from '@sanity/icons/Calendar'
import { HelpCircleIcon } from '@sanity/icons/HelpCircle'
import { ImageIcon } from '@sanity/icons/Image'
import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list'
import { Box, Card, Heading, Stack, Text } from '@sanity/ui'
import type { StructureResolver } from 'sanity/structure'

const SITE = 'https://www.tnes.studio'

function Guide() {
  const steps: [string, string][] = [
    ['Editar', 'Abra um item no menu, mude o que quiser. Tudo fica salvo como rascunho automaticamente — nada vai para o site ainda.'],
    ['Publicar', 'Clique em "Publish" (canto inferior direito). Com o webhook Sanity → Vercel ativo, um novo deploy atualiza o site em alguns minutos.'],
    ['Desfazer', 'Antes de publicar: menu "⋯" ▸ "Discard changes". Depois: aba "History" (relógio) para voltar a uma versão anterior.'],
    ['Ordem', 'Em Obras, Catálogos e Moments, arraste os itens na lista para mudar a ordem em que aparecem no site.'],
    ['Esconder', 'Para tirar algo do site sem apagar: menu "⋯" ▸ "Unpublish".'],
    ['Nova obra à venda', 'Crie o produto na Shopify primeiro, copie o "handle" e cole no campo "Produto na Shopify" da obra.'],
  ]
  return (
    <Box padding={4}>
      <Stack gap={5} style={{ maxWidth: 620 }}>
        <Heading size={2}>Como usar o painel da TNES.</Heading>
        {steps.map(([title, text]) => (
          <Card key={title} padding={4} radius={2} border>
            <Stack gap={3}>
              <Text weight="semibold">{title}</Text>
              <Text muted>{text}</Text>
            </Stack>
          </Card>
        ))}
        <Text muted size={1}>
          O guia completo está em docs/CMS.md no repositório. Site: {SITE}
        </Text>
      </Stack>
    </Box>
  )
}

const singleton = (S: Parameters<StructureResolver>[0], type: string, title: string) =>
  S.listItem().title(title).id(type).child(S.document().schemaType(type).documentId(type).title(title))

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Conteúdo')
    .items([
      S.listItem().title('Como usar').icon(HelpCircleIcon).child(S.component(Guide).title('Como usar')),
      S.divider(),
      orderableDocumentListDeskItem({ type: 'artwork', title: 'Obras', icon: ImageIcon, S, context }),
      orderableDocumentListDeskItem({ type: 'catalog', title: 'Catálogos', icon: BookIcon, S, context }),
      orderableDocumentListDeskItem({ type: 'moment', title: 'Moments', icon: CalendarIcon, S, context }),
      S.divider(),
      singleton(S, 'homePage', 'Home'),
      singleton(S, 'worksPage', 'Works'),
      singleton(S, 'aboutPage', 'About'),
      singleton(S, 'momentsPage', 'Moments (abertura)'),
      S.divider(),
      singleton(S, 'siteSettings', 'Configurações gerais'),
    ])

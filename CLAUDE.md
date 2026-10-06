# TNES — versão atual

## Galeria 3D (`/gallery`)

Ordem das paredes, da esquerda para a direita: **Signature → Prints → Countdown → About**.

`Prints` chamava-se `Archive` até 2026-07-31. O nome mudou só na tela; as
constantes internas (`ARCHIVE_WALL`, o componente `Archive`) seguem como estão.

As paredes `Moments` devem permanecer salvas em `src/data/artworks.ts` como
`MOMENTS`, para referência de uma versão futura, mas não devem ser renderizadas,
navegadas ou incluídas na galeria 3D desta versão. Isso não se aplica à página
`/moments` do site, que existe e vem do CMS.

## Conteúdo (Sanity)

Textos, fotos, obras, catálogos e moments vêm do Sanity Studio (`studio/`), via
`src/data/cms.json` — gerado por `scripts/cms/fetch-content.mjs` no início do
build e commitado como última cópia boa. Não escreva conteúdo editável direto
nos componentes: adicione o campo no schema, no fetch e em `src/data/cms.ts`.
Guia completo: `docs/CMS.md`.

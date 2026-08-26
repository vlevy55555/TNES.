# Sumário de /moments — design

**Data:** 2026-08-08
**Estado:** aprovado, pronto para plano de implementação

## Problemas

`/moments` tem ~14.000px de altura: uma intro, quatro capítulos de ~2.900px cada,
o bloco de release e o rodapé. Quem chega na página não tem como saber quantos
momentos existem nem o que são sem rolar tudo. A pessoa quer **ver os quatro de
relance** antes de mergulhar em qualquer um.

Não é um HUD de orientação (não precisa ficar visível durante a rolagem) e não é
um atalho para quem já sabe o que procura. É uma **entrada**: um sumário que se
lê de uma vez, no topo, e do qual se salta para o capítulo desejado.

## Solução

Uma faixa de contact sheet entre a intro e o capítulo 01.

```
/moments
┌─────────────────────────────────┐
│           moments.              │  intro (existe)
│   the work exists first as…     │
├─────────────────────────────────┤
│ FOUR MOMENTS                    │  ◀ novo
│ ───────────────────────────     │
│  ┌──┐  ┌──┐  ┌──┐  ┌ ─ ┐        │
│  │██│  │██│  │██│  │   │        │
│  └──┘  └──┘  └──┘  └ ─ ┘        │
│  01     02    03     04         │
│  ny     sp    eh     ny         │
│  título título título título    │
│  data   data  data   NEXT       │
├─────────────────────────────────┤
│   capa 01 (sticky, 100lvh)      │  capítulos (existem)
│   nyc soft launch.              │
└─────────────────────────────────┘
```

Quatro placas em fila, cada uma um link para o capítulo correspondente. Ocupa
cerca de meia tela, de modo que o capítulo 01 já aponta por baixo — a página
continua sendo uma rolagem contínua, não um portão.

## Conteúdo de cada placa

| elemento | fonte | tratamento |
| --- | --- | --- |
| foto | `photo(moment.seed)` — a mesma capa do capítulo | `aspect-ratio: 3/4`, dentro de máscara |
| índice + local | `moment.index`, `moment.place` | mono, caixa alta, `--paper-muted` |
| título | `moment.titleLines.join(' ')` | sans, `-0.06em`, `--paper-ink` |
| data | `moment.date` | mono, `--paper-muted` |

Nenhuma fonte de dados nova. Tudo deriva de `MOMENT_ENTRIES`, que já carrega
`index`, `place`, `titleLines`, `date`, `status` e `seed`.

**Largura no desktop:** quatro por linha dentro do shell, pela mesma fórmula que
a galeria usa para cinco — `width: calc((100% - var(--gap-tile) * 3) / 4)`, com
o `--gap-tile` que já existe (`clamp(32px, 2.222vw, 38px)`). Em 1440px isso dá
placas de ~322px de largura por ~429px de altura; com o rótulo e as legendas a
faixa fica em torno de 560px, pouco acima de meia tela.

## Estados

Duas marcações, **ambas visuais** — nenhuma palavra solta. A página teve
`current`, `next` e `shown` removidos justamente por serem rótulos órfãos, e
este sumário não os reintroduz.

- **Momento em curso** (`status === 'current'`): contorno de 1px em
  `--paper-ink` com `outline-offset`, e o índice/local em tinta cheia em vez de
  muted.
- **Momento futuro** (`status === 'next'`): a moldura fica vazia — borda
  tracejada em `--paper-line`, sem foto. A data já diz `NEXT`, porque esse é o
  valor real do campo, não um chip inventado.

O campo `status` volta a ter função depois de sair da tela: agora ele decide a
moldura, não o texto.

## Navegação

Âncora nativa, sem JavaScript.

- Cada `.moments__chapter` recebe `id={`moment-${moment.index}`}`.
- Cada placa é um `<a href={`#moment-${moment.index}`}>`.
- `.moments { scroll-behavior: smooth }` e `scroll-margin-top: 0` nos capítulos
  (a capa é `position: sticky; top: 0`, então o alvo é o topo do capítulo).

Benefício colateral: o URL fica compartilhável — `/moments#moment-03` abre
direto no momento em curso.

**Risco conhecido e como resolver.** Um salto suave do sumário até o capítulo 04
percorre ~9.000px e atravessa três capítulos de `ScrollTrigger` com `scrub` em
cerca de um segundo. Isso pode ler como um voo bonito ou como confusão. A
implementação deve **medir** o comportamento em navegador antes de fechar. Se
ficar caótico, a correção é trocar por salto instantâneo — remover
`scroll-behavior: smooth` — e deixar um comentário `ponytail:` nomeando o teto e
o caminho de volta.

## Animação

Reuso, não invenção:

- **Entrada das placas:** a mesma máscara das plates da galeria —
  `gsap.from(imgs, { yPercent: 102, duration: 1, stagger: 0.08, ease: 'expo.out' })`
  com `scrollTrigger: { start: 'top 85%', once: true }`.
- **Rótulo `four moments`:** o `data-lines` que a página já usa (SplitText por
  linha, `mask: 'lines'`, `expo.out`).

Nada de scrub aqui: é revelação, e revelação tem duração própria — a regra que a
página inteira segue.

## Mobile (≤ 64em)

A fila vira o mesmo track horizontal construído para as plates da galeria:
`58vw` por placa, `gap: clamp(18px, 2.8vw, 48px)`, `overflow-x: auto`, scrollbar
escondida, sangrando o gutter com `margin-inline: calc(var(--gutter) * -1)`.

São as mesmas regras — a implementação deve agrupar os seletores em vez de
duplicar as declarações.

## Arquivos tocados

| arquivo | mudança |
| --- | --- |
| `src/home/Moments.tsx` | novo componente `Index`, renderizado entre `<Intro />` e os capítulos; `id` em `.moments__chapter` |
| `src/home/moments.css` | bloco `.moments__index*`; agrupar os seletores do track horizontal com os da galeria |

Nenhum arquivo novo. O componente `Index` mora em `Moments.tsx` junto de `Intro`
e `Chapter`, que é onde os outros blocos da página já vivem.

## Critério de aceite

1. Os quatro momentos aparecem em fila no topo, abaixo da intro, ocupando cerca
   de meia tela em 1440×900.
2. Clicar em qualquer placa leva ao capítulo correspondente; `/moments#moment-03`
   aberto direto também leva.
3. O momento em curso está marcado por contorno e o futuro por moldura vazia —
   e nenhuma palavra `current`, `next` ou `shown` aparece como rótulo isolado.
4. No mobile a fila rola horizontalmente com a mesma geometria da galeria.
5. Sem overflow horizontal em 1440 e 390.
6. `tsc` limpo, build ok, testes passando.

## Fora de escopo

- Barra de progresso de capítulos ou menu fixo durante a rolagem. Isso resolveria
  o problema de orientação, que **não** é o problema desta tela.
- Rotas por momento (`/moments/<slug>`). A página continua sendo uma só.
- Filtro ou ordenação. São quatro itens.

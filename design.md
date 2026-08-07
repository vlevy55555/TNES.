# design.md — sistema visual das telas web (DOM)

Complementa `DESIGN.md`, que descreve a **sala 3D**. Este arquivo descreve as
**páginas planas** (`/home`, `/home-black`, `/shop`): a linguagem editorial
A24-like que envolve a galeria. Fonte da análise: `src/home/Home.tsx`,
`src/home/home.css`.

---

## 1. Princípio

Fotografia primeiro, tipografia enorme, interface quase ausente. Nenhum card,
nenhuma sombra, nenhum canto arredondado, nenhum gradiente decorativo. A página
é uma folha: papel branco (`--paper: #fff`) ou papel preto (`#090909`), e a foto
é o único objeto colorido. O contraste vem de **escala**, não de cor.

Regras duras:
- Zero `border-radius`. Zero `box-shadow` (exceto o vinheta interna do hero).
- Um acento por tela, no máximo. O resto é neutro.
- Texto em minúsculas para títulos; **CAIXA ALTA travada** para metadados.
- Nada "salta": toda transição é `expo.out` ou `cubic-bezier(0.22, 1, 0.36, 1)`.

---

## 2. Tokens

```css
--paper:      #fff      /* fundo claro   → /home            */
--paper:      #090909   /* fundo escuro  → /home-black, /shop */
--paper-ink:  #0b0b0b   /  #f4f1eb       /* texto primário  */
--paper-muted:#5d5d5d   /  #aaa59c       /* metadados       */
--paper-line: rgba(11,11,11,.2) / rgba(244,241,235,.25)
--media-fallback: #e8e8e8 / #242424      /* caixa da foto antes de carregar */
--pad-x: clamp(20px, 3.3vw, 52px)        /* margem lateral única do site   */
--pad-y: clamp(20px, 3.4vw, 54px)
```

`--pad-x` é a única margem lateral. Header, títulos, grid e footer alinham
todos nela — é o que dá o eixo vertical da página.

---

## 3. Tipografia

| Papel | Família | Uso |
|---|---|---|
| UI / títulos | `'Helvetica Neue', Helvetica, Arial` | tudo na página plana |
| Marca `[O]` | `var(--mark)` = Helvetica real (`/fonts/Helvetica-Regular.otf`) | só o `[O]` |
| Meta / specimen | mono do sistema (`ui-monospace, Menlo…`) | filtros, local · ano |

`font-synthesis: none` e `text-rendering: optimizeLegibility` no root da página:
nunca falsear peso ou itálico.

### Escala real (medida do CSS)

| Elemento | Tamanho | Peso | Line-height | Tracking |
|---|---|---|---|---|
| Manifesto (`nothing happens twice`) | `clamp(52px, 10.5vw, 142px)` | 500 | 0.9 | `-0.055em` |
| Título de seção (`selected works.`, `the studio.`) | `clamp(56px, 8.1vw, 138px)` | 500 | 0.82 | `-0.065em` |
| Título de obra no hero | `clamp(48px, 5.4vw, 92px)` | 500 | 0.9 | `-0.045em` |
| `[O]` no hero | `clamp(52px, 6vw, 100px)` | 400 | 1 | `-0.01em` |
| Wordmark `TNES` | `clamp(22px, 1.9vw, 30px)` | 500 | 1 | `+0.14em` |
| Nav | `clamp(11px, .85vw, 13px)` | 400 | 1 | `+0.08em`, CAPS |
| Legenda de obra | `11px` | 500 | 1.4 | `+0.07em`, CAPS |
| Micro-meta (caption da foto) | `10px` | 500 | — | `+0.06em`, CAPS |

**A regra da escala:** só existem dois tamanhos de texto na página — *enorme*
(≥48px) e *minúsculo* (10–13px). Nada no meio. É esse vazio no meio da escala
que faz o layout parecer editorial e não um site comum.

**A regra do tracking:** quanto maior o texto, mais negativo o tracking
(-0.045 a -0.065em). Quanto menor, mais positivo (+0.06 a +0.14em). Sempre.

Títulos quebram em linhas manuais (`nothing` / `happens` / `twice`,
`selected` / `works.`), não por `max-width`. Cada linha é um bloco animável.
Títulos de seção terminam em **ponto final** minúsculo: `shop.`, `catalogs.`,
`the studio.`

---

## 4. Fotos

- Formato nativo, sempre. Aspectos reais em `/artworks/v1/`: 6 paisagens 3:2,
  5 retratos 2:3, 1 em 4:5. Nada é recortado em quadrado.
- `object-fit: cover` dentro de um quadro que já tem o aspecto certo — o
  `cover` é rede de segurança, não crop.
- Fundo `--media-fallback` no quadro: a foto entra sobre um bloco sólido, nunca
  sobre o papel.
- **Aresta longa constante** (carrossel): toda impressão compartilha
  `--long-edge: clamp(260px, 30vw, 500px)`; a paisagem fica larga e baixa, o
  retrato estreito e alto. É uma prateleira de um único tamanho de papel — as
  alturas ficam propositalmente irregulares.
- Fotos abaixo da dobra: `loading="lazy"`. O primeiro poster do hero:
  `fetchPriority="high"`.

---

## 5. Movimento (GSAP 3.15 + ScrollTrigger)

Uma única gramática, repetida em toda a página.

### 5.1 A entrada de texto — a assinatura

Todo texto entra por baixo de uma máscara, girando levemente em X:

```js
from: { yPercent: 112–130, rotationX: -28, scaleY: 1.08, opacity: 0,
        transformOrigin: '50% 100%' }
to:   { yPercent: 0, rotationX: 0, scaleY: 1, opacity: 1,
        duration: 1.05, ease: 'expo.out', stagger: 0.07–0.12 }
```

A máscara (`.text-reveal`) tem `overflow: clip`, `perspective: 420px` e uma
folga vertical de `0.16em` (com `margin-block: -0.16em` para não alterar o
ritmo) — sem ela o `expo.out` corta os ascendentes da Helvetica.

Cada seção tem **um** timeline, disparado por `IntersectionObserver`
(`rootMargin: '0px 0px -12% 0px'`), não um trigger por palavra. Isso evita
dezenas de triggers concorrentes numa lista longa.

### 5.2 A entrada de imagem — a cortina

```js
figura: clipPath 'inset(0 0 100% 0)' → 'inset(0 0 0% 0)', 1.15s expo.out
img:    scale 1.12 / yPercent 7      → scale 1 / yPercent 0, 1.35s expo.out
```

A moldura abre de baixo para cima enquanto a foto se assenta. Os dois começam
juntos, a foto termina depois — é o que dá a sensação de peso.

### 5.3 Timings canônicos

| Uso | Duração | Ease |
|---|---|---|
| Reveal de texto | 1.05s | `expo.out` |
| Cortina de imagem | 1.15s / 1.35s | `expo.out` |
| Reveal de bloco (CSS) | 900ms | `cubic-bezier(.22,1,.36,1)` |
| Crossfade do hero | 600ms (+1300ms no scale) | `cubic-bezier(.22,1,.36,1)` |
| Expansão de obra no hover | 560ms | `cubic-bezier(.22,1,.36,1)` |
| Hover de cor / borda | 180–320ms | `ease` |
| Deslocamento de seta no hover | 220ms | `ease` |

Stagger: `0.07` para texto corrido, `0.12` para linhas de título, `0.08` para
grades de imagem.

### 5.4 Hover

- Item do hero: `translateX(6px)`, 400ms. O item **ativo** fica cinza (50%),
  não branco — o que já está na tela recua.
- Obra no carrossel: cresce 14% em largura e altura (só em `hover:hover`),
  560ms, e pausa o autoplay.
- Seta: `translateX(4px)`.
- Botão: inverte tinta/papel, 180ms.

### 5.5 Reduced motion

`@media (prefers-reduced-motion: reduce)` zera as transições
(`transition-duration: 1ms`), força `.reveal` visível, e **todo timeline GSAP
retorna cedo** — os estados iniciais só são aplicados por JS, então sem
animação tudo nasce visível. Nunca depender de CSS para esconder.

---

## 6. Padrão e tamanho de scroll

**Scroll nativo.** Sem Lenis, sem smooth-scroll, sem `scroll-snap`, sem
pinning. `html/body/#root` recebem `height: auto; overflow-y: auto` via
`:has(.home)` — a folha de estilo global da galeria 3D (`fixed`,
`overflow: hidden`) fica intacta.

Altura de cada seção (`/home`, desktop):

| Seção | Altura |
|---|---|
| Hero | `108svh` (mobile `100svh`) |
| Statement | `clamp(680px, 84svh, 920px)` |
| Selected works | altura da trilha + `clamp(72px,9vw,140px)` topo / `clamp(92px,12vw,180px)` base |
| The studio | `min(82vh, 760px)` + padding |

Total ≈ **4 alturas de viewport**. Uma página inteira cabe em ~4 gestos de
scroll — nunca 10. O eixo horizontal do carrossel é `overflow-x: auto` puro
(sem snap, para não brigar com o drift sub-pixel do autoplay a 0.55px/frame),
com `scrollbar-width: none` e `overscroll-behavior-x: contain`.

Trabalho pesado é adiado por viewport: a cena 3D do `Studio` só monta quando a
seção entra em tela (`useInView`), nunca no load.

---

## 7. Layout

- Uma coluna lógica alinhada em `--pad-x`. Texto sempre à esquerda.
- Larguras de leitura curtas: `8.8ch` para o manifesto, `32ch` para o subtítulo,
  `34ch` para legendas. Linha longa não existe.
- Separadores são `1px solid var(--paper-line)`, nunca um bloco cinza.
- Hero: header no topo, lista de obras em baixo à esquerda, preço + `shop →` em
  baixo à direita. Os quatro cantos, nada no centro — o centro é a foto.
- Grades de foto: no máximo **3 colunas** (4 em telas ≥1600px), com aspecto
  nativo por item. O ritmo vertical é **por coluna**, não da página: cada obra
  se empilha direto sob a de cima dentro da própria coluna, então uma foto mais
  baixa nunca prende as outras colunas à sua base. Nenhuma linha se forma
  atravessando a grade — as bases ficam irregulares de propósito.
  Isso é `columns` (multicol) com `break-inside: avoid` nos itens, não
  `display: grid`: a grade de linhas alinharia o topo de cada faixa.

---

## 8. `/shop` — aplicação do sistema

**Papel branco**, os mesmos tokens de `.home`.

1. **Header** fixo no topo: `TNES.` à esquerda, nav minúscula CAPS à direita.
2. **`shop.`** — título de página, `clamp(44px, 5.4vw, 92px)`, peso 400,
   tracking `-0.04em`, ponto final.
3. **Abas** `available works / catalogs`: 11px, minúsculas, âncoras; a ativa
   ganha uma régua de 1px 6px abaixo — `border-bottom`, não `text-decoration`,
   porque o `overflow: clip` da máscara de reveal cortaria um sublinhado.
4. **Filtros** `place` / `scene`: pílulas mono de 10px, borda `--paper-line`,
   sem raio. A ativa inverte (tinta cheia) e **não** aceita `:hover` — o ponteiro
   fica sobre ela logo após o clique. O rótulo do grupo é mono 10px muted.
5. **Contagem** `12 works` em mono muted — o índice da sala, não um badge.
6. **Grade** de 3 colunas (4 acima de 1600px, 2 abaixo de 900px, 1 abaixo de
   560px) com empilhamento por coluna (§7): aspecto nativo por foto, verticais
   e horizontais misturadas, alturas que nunca se alinham. É a prateleira do §4
   em forma de grade.
7. **Legenda** por obra: título minúsculo com ponto final à esquerda, preço à
   direita, e `local · ano` em mono muted na linha abaixo.
8. **`catalogs.`** — duas peças largas, mesma cortina de imagem, `view catalog →`.
9. **Footer**: `[O]` em Helvetica real, tagline, colunas de links, e a linha
   de base `new york · são paulo` / `© victor safdie levy`.

Movimento: título e filtros usam o reveal do §5.1 imediatamente no load; cada
item da grade usa a cortina do §5.2 disparada por `ScrollTrigger.batch`
(`start: 'top 90%'`, `once`), com stagger 0.08 dentro do lote e a legenda
entrando 0.12s depois da foto.

---

## 9. `/shop/<id>` — uma obra

Mesmos tokens (`<main class="shop product">` carrega as duas classes), mesmo
header e footer. Quatro blocos:

1. **Palco** — grade de duas colunas, `align-items: end`. À direita a obra não é
   um `<img>`: é o **quadro real**, o mesmo objeto de três camadas do §4 de
   `DESIGN.md` (moldura extrudada + passe-partout + foto), num canvas r3f
   transparente sobre o papel.
   - **Girável.** `PresentationControls` do drei: arrasta e ele roda, solta e
     ele fica onde parou — sem snap-back. Lateral livre
     (`azimuth: [-Infinity, Infinity]`), inclinação curta (`polar: ±0.18`) —
     uma impressão se vira, não se cambalhota. `damping: 0.1` é o que faz o
     movimento parecer leve; `speed: 2.2`, a largura do canvas ≈ 2.2π de giro.
   - **Sombra embaixo.** `ContactShadows` de verdade, logo abaixo da aresta
     inferior da moldura. O plano de sombra pintado que a parede usa é
     desligado (`backdrop={false}` em `FrameLayers`) — girado, ele apareceria
     de perfil.
   - **Sem máscara.** A figura não tem `overflow` nem `clip-path`: qualquer
     recorte cortaria o quadro no instante em que ele girasse. A entrada é um
     fade + subida, não a cortina do §5.2.
   - `Bounds fit observe` enquadra a obra no canvas seja qual for o aspecto da
     foto ou o formato da coluna — sem conta de fit por orientação.
   - Luz própria: ambiente quente + duas direcionais + dois pontos especulares,
     que é o que faz o dourado ler como metal sem mapa de ambiente (todo preset
     de `Environment` do drei baixa um HDRI de CDN).
   - As três molduras do campo `frame` trocam o objeto ao vivo.
   - **A primeira vista é exatamente uma tela.** `.product__first` é
     `min-height: 100svh` em coluna flex e o palco leva toda a sobra
     (`flex: 1 0 auto`): numa viewport alta o nome, o preço e a linha de compra
     descem, e a linha de compra encosta na borda de baixo. O quadro não desce
     junto — é `align-self: start`, a única coisa presa ao topo do palco.
   - O palco base é `clamp(300px, 50svh, 620px)`; a altura do canvas é 1.2×
     disso com `margin-block: -10%` devolvendo o crescimento, então o quadro
     lê ~20% maior sem empurrar nada, invadindo só o branco em volta dele.
2. **Nome e preço**, à esquerda, encostados na base da foto:
   título `clamp(46px, 6.4vw, 118px)` peso 500, tracking `-0.05em`, minúsculo e
   com ponto final; preço `clamp(26px, 2.4vw, 40px)`; `local · ano` em mono
   muted logo abaixo. O preço é `$100` para todas as obras — placeholder.
3. **Linha de compra** — quatro campos, cada um abrindo numa régua de 1px com
   rótulo mono 10px muted: `description`, `frame`, `size`, e o botão.
   As opções são **tipografia, não caixas**: todos os valores numa linha, o
   escolhido em tinta cheia e o resto recuado. As três molduras são as mesmas
   do `ArtworkFrame` (`gold` / `white` / `black`); os tamanhos vêm do campo
   `dimensions` da própria obra.
4. **`add to cart`** — caixa de borda 1px que inverte no hover.

Movimento: nome, preço e rótulos entram pelo reveal do §5.1 no load; a foto usa
a cortina do §5.2 direto no mount — está acima da dobra, não espera scroll.

Abaixo de 900px o palco vira uma coluna e a foto sobe (`order: -1`): a
impressão lidera no telefone, como faz na grade.

---

## 10. `/cart` — a seleção

Mesmo papel, mesmo header e footer (`<main class="shop cart">`). Uma tela, não
uma gaveta: nada flutua sobre a página, nada escurece o fundo.

1. **`cart.`** — mesmo título de página do §8, com a contagem em mono muted
   abaixo (`3 works`, ou `empty`).
2. **Linhas**, cada uma sobre uma régua de 1px: foto à esquerda em aresta longa
   fixa (`clamp(160px, 18vw, 300px)`) — retrato alto, paisagem largo, alturas
   propositalmente irregulares —, título minúsculo com ponto final linkando de
   volta para `/shop/<id>`, tamanho em mono muted, `remove` em mono 10px.
3. **Quantidade** é a régua tipográfica do §9.3: `– 2 +` numa linha, sem caixa,
   sem stepper. Preço da linha à direita, sempre relido da Storefront API.
4. **Fecho** alinhado à direita, largura máxima de 520px: `subtotal` em rótulo
   mono 13px sobre régua de 1px de tinta cheia, valor em `clamp(34px, 3.2vw, 56px)`,
   nota mono, e `checkout →` na mesma caixa de borda 1px do `add to cart`.
   Desabilitado ele perde a tinta em vez de ganhar cinza.
5. **Vazia**: `nothing selected yet.` no corpo grande e `browse the shop →`.

Movimento: título, subtotal e rótulos usam o reveal do §5.1 no load; as fotos
das linhas usam a cortina do §5.2 direto no mount — estão acima da dobra.

Uma linha cuja variante sumiu da Shopify não é descartada em silêncio: ela
aparece marcada (`no longer available` / `sold out`) e fica fora do subtotal e
do checkout.

---

## 11. Endereços

| Rota | Tela |
|---|---|
| `/` | landing (`Home`) — a porta de entrada do site |
| `/home` | o endereço antigo da landing, mantido para links existentes |
| `/home-black` | a variante escura, no endereço que sempre teve |
| `/shop` | o índice das impressões |
| `/shop/<id>` | uma obra, pelo `id` do artwork |
| `/cart` | a seleção (`Cart`) — uma tela da loja, não um painel |
| `/gallery` | a exposição 3D (`App`) |

O wordmark `TNES.` — no header da loja, do produto **e** da sala 3D — sempre
volta para `/`. Resolvido por uma checagem de path em `main.tsx`, sem router;
o `render.yaml` já reescreve tudo para `index.html`, então valem em produção.

# CMS da TNES. — guia completo

O site **tnes.studio** é editado pelo **Sanity Studio**: um painel no navegador onde você muda textos, troca fotos, cria obras, catálogos e moments, sem mexer em código.

- **Painel:** https://tnes.sanity.studio (entre com a conta Sanity convidada para o projeto "TNES")
- **Projeto Sanity:** `bchwhnoq` · dataset `production` · https://www.sanity.io/manage/project/bchwhnoq

---

## 1. Como funciona, em uma figura

```
Você edita no Studio ──► clica "Publish" ──► Sanity avisa a Vercel (webhook)
                                                     │
                                                     ▼
              site atualizado em 1–3 min ◄── Vercel reconstrói o site
```

- **Rascunho x publicado.** Tudo o que você digita fica salvo sozinho como *rascunho* — o site não muda. Só quando você clica em **Publish** a mudança vai para o site.
- **Tempo.** Depois de publicar, o site é reconstruído e a mudança aparece em **1 a 3 minutos**. Se não aparecer, recarregue a página com Ctrl+Shift+R (Cmd+Shift+R no Mac).
- **Nada se perde.** Cada documento tem histórico: dá para voltar a qualquer versão anterior.
- **Preços, tamanhos, molduras e estoque continuam na Shopify.** O Sanity guarda a *obra* (foto, título, texto); a Shopify guarda o *produto* (o que se compra). Uma obra se liga ao produto pelo campo "Produto na Shopify".

---

## 2. O menu do Studio

| Item | O que controla no site |
|---|---|
| **Como usar** | Resumo destas instruções, dentro do painel |
| **Obras** | Cada fotografia: página `/works/<obra>`, lista em `/works`, carrossel da home, galeria 3D |
| **Catálogos** | Páginas `/works/catalogs/<catálogo>` e os cards de catálogo em `/works` |
| **Moments** | Os capítulos da página `/moments` |
| **Home** | Slideshow do topo, a frase "nothing happens twice", título do carrossel |
| **Works** | Textos do topo de `/works` e da seção de catálogos |
| **About** | Toda a página `/about`: nome, textos, as duas fotos, link para o VSL |
| **Moments (abertura)** | Título, texto e fotos do topo de `/moments` e o bloco de inscrição do fim |
| **Configurações gerais** | E-mail, telefone, Instagram, rodapé e o bloco "be the first to know." |

Cada campo tem uma explicação curta embaixo do nome. Os textos do site são em **inglês e minúsculas** — mantenha o tom.

---

## 3. Tarefas do dia a dia

### 3.1 Mudar um texto
1. Abra o item no menu (ex.: **About**).
2. Edite o campo.
3. Clique em **Publish** (botão verde, canto inferior direito).

**Quebras de linha:** em campos marcados "cada linha aqui vira uma linha no site" (ex.: a frase da home, os títulos dos moments), a quebra que você digita (Enter) é exatamente a quebra no site. Em campos de parágrafo, deixe **uma linha em branco** entre parágrafos.

### 3.2 Adicionar uma obra nova (à venda)
1. **Na Shopify primeiro:** crie o produto com tamanhos, molduras e preços (ou use os scripts de `shopify-release/`). Anote o **handle** — o final do endereço do produto, ex.: `rio-runner`. Fica em Shopify ▸ Products ▸ produto ▸ *Search engine listing*.
2. **No Studio:** **Obras** ▸ botão **+** (ou "Create").
3. Preencha:
   - **Título** — ex.: `Rio Runner`
   - **Endereço no site** — clique em *Generate*. Vira `tnes.studio/works/rio-runner`.
   - **Foto** — arraste o arquivo. Use a foto inteira, JPG ou WebP com **2500 px ou mais** no lado maior. Não precisa reduzir: o site gera os tamanhos menores.
   - **Local** — do mais específico ao país: `Ipanema, Rio de Janeiro, Brazil`
   - **Ano**, **Descrição** (uma frase em inglês)
   - Aba **Venda e filtros:** **Região**, **Cenas** (para os filtros de `/works`) e **Produto na Shopify** = o handle do passo 1.
4. **Publish.**
5. Na lista **Obras**, arraste a obra para a posição em que ela deve aparecer em `/works`.

> Sem o handle da Shopify, a obra aparece normalmente, mas só com o botão de orçamento (inquiry) — sem preço nem carrinho.

### 3.3 Trocar a foto de uma obra
Abra a obra ▸ passe o mouse sobre a foto ▸ **Replace** (ou o ícone de lápis para recortar) ▸ **Publish**. O formato (horizontal/vertical) e o tamanho do quadro no site seguem a nova foto automaticamente.

### 3.4 Tirar uma obra do site
- **Temporariamente:** abra a obra ▸ menu **⋯** (ao lado de Publish) ▸ **Unpublish**. Ela some do site, mas continua no Studio para voltar depois.
- **Para sempre:** ⋯ ▸ **Delete**. Se ela estiver no slideshow da Home, tire de lá antes.
- Se a obra estava à venda, arquive o produto na Shopify também.

### 3.5 Mudar a ordem
Em **Obras**, **Catálogos** e **Moments**, arraste os itens na lista. A nova ordem é salva e publicada na hora — não precisa clicar em Publish — e aparece no site em 1 a 3 minutos.

### 3.6 Mudar o slideshow da Home
**Home** ▸ **Obras do topo**: adicione, remova ou arraste. **A primeira é a obra-assinatura** — aparece como `[O]`, é a obra da parede de entrada da galeria 3D e a imagem padrão quando alguém compartilha o site no WhatsApp.

### 3.7 Criar um catálogo novo
1. **Catálogos** ▸ **+**.
2. Aba **Página:** título (minúsculas), *Generate* no endereço, descrição, linha de dados, nota do estúdio.
3. Aba **Fotos:** adicione as fotos — pode arrastar várias de uma vez — e escreva o **local** de cada uma. A ordem define a numeração (01, 02…). Marque **Menor na página** em verticais que fiquem altas demais.
4. Aba **Card em /works:** foto, legenda e detalhes do card.
5. Aba **Avançado** (opcional):
   - **Fotos por bloco:** como as fotos se agrupam (ex.: 4, 3, 3, 4…). Em branco, o site decide.
   - **Senha:** deixa o catálogo privado. É uma trava leve, não segurança de verdade.
   - **SEO:** título e descrição para o Google.
6. **Publish.** O endereço é `tnes.studio/works/catalogs/<endereço>`.

No site, clicar numa foto do catálogo abre o formulário de contato com o número e o local já escritos.

### 3.8 Adicionar um Moment (evento)
1. **Moments** ▸ **+**.
2. Lugar, título (uma linha por linha), data (`MM/DD/AA`), situação (*já aconteceu*, *acontecendo agora* ou *próximo*), texto.
3. **Fotos:** quatro, nesta ordem — capa (tela cheia), lado esquerdo, centro, lado direito. Sem fotos (comum no "próximo"), o site usa obras do arquivo no lugar.
4. **Links:** com endereço (ex.: `/works`) vira um link normal. Com o endereço em branco e um assunto, abre o formulário de contato com esse assunto.
5. **Publish** e arraste para a posição certa na lista.

### 3.9 SEO (Google e prévia de links)
Home, Works, About, Moments (abertura) e cada Catálogo têm um bloco **SEO** fechado no fim. Em branco, o site usa um texto padrão bom. Preencha só se quiser controlar exatamente o que aparece no Google: título até ~60 caracteres, descrição até ~160.

As obras não têm campo de SEO: o título e a descrição do Google saem do título, da descrição e do local da obra. A imagem de prévia no WhatsApp é a própria foto.

### 3.10 Desfazer um erro
- **Antes de publicar:** ⋯ ▸ **Discard changes**.
- **Depois de publicar:** ícone de relógio (*History*) no topo do documento ▸ escolha a versão ▸ **Restore** ▸ **Publish**.

---

## 4. Fotos — boas práticas

- **Formato:** JPG ou WebP. **Tamanho:** 2500–4000 px no lado maior. O original pode ser pesado; o site sempre entrega uma versão otimizada (WebP/AVIF, no tamanho da tela).
- **Recorte:** o botão de recorte (lápis) muda o enquadramento em todo o site. Para obras, corte só bordas: o que vai no quadro é a foto inteira.
- **Descrição da foto (alt):** nas fotos de About, Moments e cards, descreva em inglês o que se vê. Ajuda o Google e quem usa leitor de tela.
- **Nomes de arquivo** não importam para o site.

---

## 5. O que NÃO fica no Studio (e por quê)

| Conteúdo | Onde fica | Por quê |
|---|---|---|
| Preço, tamanhos, molduras, estoque, checkout | **Shopify** | É onde a venda acontece; evita dois preços diferentes |
| Texto da página Privacy | Código (`src/home/Privacy.tsx`) | É texto legal ligado ao funcionamento técnico (analytics, formulários) |
| Botões e rótulos da interface ("add to cart", "view work"…) | Código | Fazem parte do design, não do conteúdo |
| Para onde vão os formulários de contato e inscrição | Variáveis na Vercel (`CONTACT_TO`, MailerLite) | Configuração de servidor |
| Galeria 3D (`/gallery`): posição das obras nas paredes | Código | Layout calibrado à mão; as obras e textos dela já vêm do Studio |
| Protótipo de AR (`/prototype-3d`) | Código | Modelo 3D gerado por script |

---

## 6. Problemas comuns

| Sintoma | O que fazer |
|---|---|
| Publiquei e o site não mudou | Espere 3 min e recarregue com Ctrl+Shift+R. Se ainda não mudou, veja em Vercel ▸ Deployments se o último build deu erro. |
| Uma obra sumiu do site | Ela pode estar sem foto, título, local, ano ou descrição — obras incompletas ficam de fora para não quebrar a página. O log do build avisa qual. |
| A obra não mostra preço | Confira o "Produto na Shopify": tem que ser igual ao handle da Shopify, e o produto precisa estar publicado no canal "Online Store/Headless" lá. |
| "Publish" está cinza | Algum campo obrigatório está vazio ou inválido; os campos em vermelho dizem qual. |
| Não consigo entrar no Studio | Peça para um administrador te convidar em sanity.io/manage ▸ projeto TNES ▸ Members. |

---

## 7. Para desenvolvedores

### Arquitetura
- `studio/` — o Sanity Studio (pacote próprio). Schemas em `studio/schemaTypes/`, menu em `studio/structure.tsx`.
- `scripts/cms/fetch-content.mjs` — roda **no começo de todo `npm run build`**. Lê o que está *publicado* no dataset (API pública, sem token) e escreve `src/data/cms.json`.
- `src/data/cms.json` — o conteúdo que o site usa. **Fica commitado**: se o Sanity estiver fora do ar ou vazio, o build usa a última cópia boa em vez de falhar. Se `CMS_STRICT=1`, o build falha nesse caso.
- `src/data/cms.ts` — tipos e helpers (`linesOf`, `paragraphsOf`, `sized`). `src/data/artworks.ts` monta `artworks`, `HERO_ID`, `ABOUT`… a partir dele, com os mesmos nomes de antes.
- O site **não busca conteúdo em tempo real**: tudo vai no HTML pré-renderizado (bom para SEO e velocidade). Cada Publish dispara um novo deploy.
- Imagens vêm do CDN do Sanity (`cdn.sanity.io`). `sized(src, w)` pede o tamanho certo e o formato moderno. As URLs têm CORS aberto, então funcionam como textura na galeria 3D.
- `scripts/generate-seo.mjs` gera uma página HTML por obra e por catálogo, com og:image do CDN do Sanity. `vercel.json` serve `/works/catalogs/:slug`.

### Comandos
```bash
npm run studio          # Studio local em http://localhost:3333
npm run studio:deploy   # publica o Studio em https://tnes.sanity.studio (pede login no navegador)
npm run cms:pull        # atualiza src/data/cms.json com o que está publicado
npm run cms:import      # migração inicial: conteúdo + fotos de /public para o Sanity
npm run build           # cms:pull + typecheck + build + SEO
```

### Configuração inicial (uma vez só)
1. **Migrar o conteúdo:** crie um token *Editor* em sanity.io/manage ▸ API ▸ Tokens, coloque `SANITY_WRITE_TOKEN=…` no `.env` (não commitar) e rode `npm run cms:import`. Depois `npm run cms:pull` e commite o `src/data/cms.json`, que passa a apontar para o CDN do Sanity. O import nunca sobrescreve documentos que já existem (use `-- --replace` para forçar).
2. **Publicar o Studio:** `npm run studio:deploy` (faz login no navegador na primeira vez).
3. **Deploy automático ao publicar:**
   - Vercel ▸ Project ▸ Settings ▸ Git ▸ **Deploy Hooks** ▸ crie um hook "sanity" para a branch `main` e copie a URL.
   - sanity.io/manage ▸ projeto ▸ API ▸ **Webhooks** ▸ *Create webhook*: URL = a do hook; Dataset `production`; Trigger on *Create, Update, Delete*; Filter `!(_id in path("drafts.**"))`; HTTP method `POST`; sem projection.
4. **Acesso:** convide o Victor e quem mais for editar em sanity.io/manage ▸ Members (papel *Editor*).
5. **CORS:** `http://localhost:3333` já vem liberado; o Studio hospedado em `tnes.sanity.studio` não precisa de nada.

### Variáveis de ambiente na Vercel
| Variável | Para quê | Obrigatória |
|---|---|---|
| `MAILERLITE_API_TOKEN` | Inscrições na newsletter (`api/subscribe.js`) | Sim |
| `RESEND_API_KEY` | Formulários de contato e de catálogo (`api/contact.js`) | Sim |
| `CONTACT_TO` | Para onde vão as mensagens (padrão `vlevy@tnes.studio`) | Não |
| `MAILERLITE_GROUP_ID` | Grupo da lista (padrão "TNES. newsletter") | Não |
| `RESEND_FROM` | Remetente (padrão `TNES. website <site@tnes.studio>`) | Não |
| `SANITY_READ_TOKEN` | Só se o dataset virar privado | Não |

Clarity e PostHog já estão em `.env.production` (são chaves públicas). `SANITY_WRITE_TOKEN` é só para a migração, no `.env` local — nunca na Vercel.

### Mudar o modelo de conteúdo
Adicionar um campo exige três passos: o schema em `studio/schemaTypes/`, a query e a normalização em `scripts/cms/fetch-content.mjs`, e o tipo `Cms` em `src/data/cms.ts`, antes de usar o campo no componente. Depois `npm run studio:deploy`.

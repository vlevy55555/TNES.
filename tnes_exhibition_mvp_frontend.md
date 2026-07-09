# MVP Frontend TNES Exhibition Ecommerce

## Objetivo do MVP

Criar um protótipo frontend de ecommerce visual no formato de uma exposição 3D, onde o usuário navega entre paredes com quadros emoldurados, vê as obras de frente, clica em uma obra, dá zoom nela e acessa informações de produto.

Neste MVP, a compra não precisa estar conectada ao Shopify ainda. O foco é validar:

1. A sensação visual de galeria/exposição.
2. A navegação lateral entre paredes.
3. O clique em quadros.
4. O zoom suave na obra.
5. A exibição de informações do produto.
6. A leveza e fluidez da experiência.
7. A estética parecida com a referência TNES, porém com profundidade 3D.

---

# Referências visuais e interativas

## Referência principal

A principal referência visual é a imagem fornecida no chat: uma interface TNES com fundo claro, quadros emoldurados, estética editorial, composição minimalista e navegação discreta.

A versão do MVP deve transformar essa linguagem visual em uma experiência 3D controlada, com paredes, quadros, molduras, iluminação e zoom.

## Sites de referência fornecidos

1. K95 Works  
   https://k95.it/en/works

2. Cartier Watches and Wonders  
   Principalmente a seção “The Sound of Craft”  
   https://www.cartier.com/en-fr/watchesandwonders#/

3. Kelly Dev  
   Referência para ideia de 3D e movimento espacial  
   https://kellydev.io/

4. Throttlehaus  
   Referência de transições, experiência visual e direção interativa  
   https://throttlehaus.ca/

5. Galeryst  
   Referência de galeria digital e arte  
   https://galeryst.com/

6. Kunstmatrix  
   Referência de exposição virtual  
   https://kunstmatrix.com/

7. Google Arts & Culture  
   Referência de navegação cultural, acervo e experiência museológica  
   https://artsandculture.google.com/

---

# 1. Stack do MVP Frontend

## Stack recomendada

| Área | Tecnologia | Uso |
|---|---|---|
| Frontend | React + Vite + TypeScript | Base rápida, leve e simples para prototipar |
| 3D | Three.js | Motor WebGL para renderizar a galeria |
| React + 3D | React Three Fiber | Usar Three.js de forma declarativa dentro do React |
| Helpers 3D | Drei | Facilita câmera, imagens, loaders, textos e helpers |
| Animações | GSAP | Transições suaves de câmera, zoom e navegação |
| Estado global | Zustand | Controlar parede atual, obra selecionada e estado do zoom |
| Estilo | CSS Modules ou Tailwind | UI, overlay, header, footer e painel de produto |
| Dados mockados | JSON local ou arquivo TypeScript | Simular produtos, imagens, preços e descrições |
| Deploy | Vercel | Publicar o MVP rapidamente |

## Stack final do MVP

```txt
Vite
React
TypeScript
Three.js
@react-three/fiber
@react-three/drei
GSAP
Zustand
CSS Modules ou Tailwind
```

## Por que usar Three.js nesse MVP

O site precisa ter sensação de profundidade, parede, moldura, sombra e câmera. Three.js é útil porque permite criar:

1. Paredes 3D.
2. Quadros com profundidade.
3. Molduras com volume.
4. Luzes suaves.
5. Movimento de câmera.
6. Zoom real na obra.
7. Transições laterais entre paredes.

Mas o MVP não deve ser uma galeria 3D livre. A câmera deve ser controlada.

A experiência ideal é:

```txt
Usuário vê sempre uma parede de frente.
Usuário pode ir para a direita ou esquerda.
Usuário clica em um quadro.
A câmera aproxima do quadro.
Um painel com informações aparece.
Usuário fecha o painel.
A câmera volta para a parede.
```

Isso cria a sensação de exposição 3D sem deixar a navegação confusa.

---

# 2. Conceito visual do MVP

## Referência principal

A estética deve seguir a imagem de referência da TNES:

1. Fundo bege claro.
2. Tipografia elegante e discreta.
3. Quadros emoldurados.
4. Composição editorial.
5. Espaço vazio bem utilizado.
6. Navegação minimalista.
7. Sensação de galeria premium.
8. Poucos elementos visuais na interface.
9. Foco total nas fotografias.

## Evolução da referência para 3D

A imagem de referência é quase uma parede 2D. O MVP deve transformar isso em uma exposição com profundidade.

Elementos 3D necessários:

1. Parede com textura sutil.
2. Quadros com moldura em relevo.
3. Fotos posicionadas dentro das molduras.
4. Pequenas placas ao lado dos quadros.
5. Sombras suaves atrás das molduras.
6. Luz superior simulando iluminação de galeria.
7. Movimento lateral da câmera entre paredes.
8. Zoom ao clicar em uma obra.

---

# 3. Experiência do usuário

## Fluxo principal

```txt
1. Usuário entra no site.
2. Vê a primeira parede da exposição.
3. Pode navegar para a próxima parede com seta, scroll horizontal ou botão.
4. Cada parede contém múltiplos quadros.
5. Ao clicar em um quadro, a câmera aproxima suavemente.
6. Aparece um painel com informações da obra.
7. O usuário pode ver título, descrição, tamanho, preço e CTA.
8. Ao fechar, a câmera volta para a visão frontal da parede.
```

## Controles do MVP

O MVP pode ter 4 formas de interação:

1. Botão “Previous” e “Next”.
2. Teclas de seta do teclado.
3. Drag horizontal.
4. Clique nos quadros.

No começo, priorizar:

```txt
Botões laterais
Teclas esquerda/direita
Clique no quadro
```

Depois adicionar drag horizontal se necessário.

---

# 4. Estrutura da galeria 3D

## Ideia principal

A galeria será composta por várias paredes posicionadas lado a lado no eixo X.

Exemplo:

```txt
Parede 0: x = 0
Parede 1: x = 8
Parede 2: x = 16
Parede 3: x = 24
```

A câmera fica sempre de frente para a parede atual.

```txt
Parede atual = 0
Câmera: x = 0, y = 0, z = 6
Olhar para: x = 0, y = 0, z = 0

Parede atual = 1
Câmera: x = 8, y = 0, z = 6
Olhar para: x = 8, y = 0, z = 0
```

Quando o usuário muda de parede, a câmera se move lateralmente com GSAP.

## Por que limitar a câmera

Não permitir câmera livre deixa o site mais:

1. Elegante.
2. Leve.
3. Fácil de controlar.
4. Parecido com uma direção de arte.
5. Menos confuso para o usuário.
6. Melhor para mobile.
7. Mais fácil de transformar em ecommerce depois.

O usuário não deve “andar” pela galeria como em um jogo. Ele deve navegar por cenas cuidadosamente compostas.

---

# 5. Organização das paredes

## Cada parede deve ter

1. Fundo 3D bege.
2. 2 a 5 quadros.
3. Quadros em tamanhos diferentes.
4. Pequenas placas informativas.
5. Iluminação suave.
6. Composição visual equilibrada.
7. Identificador da sala ou coleção.

## Exemplo de distribuição

```txt
Parede 1: Exhibition
- Urban Texture
- Match Day
- Coastal Run

Parede 2: Archive
- City Silence
- The Runner
- Golden Hour

Parede 3: Limited Prints
- Still Morning
- Deep Blue
- Road Fragment
```

---

# 6. Modelo de dados mockado

No MVP, os produtos podem ficar em um arquivo local.

Exemplo:

```ts
export const artworks = [
  {
    id: "urban-texture",
    title: "Urban Texture",
    subtitle: "Leicestershire, 2016",
    description: "A study of architectural texture, shadow and urban repetition.",
    price: "£350",
    image: "/artworks/urban-texture.jpg",
    wallIndex: 0,
    position: [-2.4, 0.6, 0.05],
    size: [1.35, 1.8],
    frameColor: "gold",
    orientation: "portrait",
    edition: "Limited edition of 30",
    dimensions: "40 × 60 cm"
  },
  {
    id: "match-day",
    title: "Match Day",
    subtitle: "London Stadium, 2016",
    description: "A photographic fragment of movement, scale and collective energy.",
    price: "£420",
    image: "/artworks/match-day.jpg",
    wallIndex: 0,
    position: [0.8, -0.4, 0.05],
    size: [1.6, 1.1],
    frameColor: "gold",
    orientation: "landscape",
    edition: "Limited edition of 25",
    dimensions: "50 × 35 cm"
  },
  {
    id: "coastal-run",
    title: "Coastal Run",
    subtitle: "Rio de Janeiro, 2016",
    description: "A quiet coastal scene balancing distance, atmosphere and motion.",
    price: "£500",
    image: "/artworks/coastal-run.jpg",
    wallIndex: 0,
    position: [3.0, 0.9, 0.05],
    size: [1.45, 1.0],
    frameColor: "gold",
    orientation: "landscape",
    edition: "Limited edition of 20",
    dimensions: "50 × 35 cm"
  }
];
```

---

# 7. Estrutura de arquivos

```txt
src/
  assets/
    textures/
      wall-texture.jpg
      paper-texture.jpg
    artworks/
      urban-texture.jpg
      match-day.jpg
      coastal-run.jpg

  data/
    artworks.ts
    walls.ts

  components/
    gallery/
      GalleryCanvas.tsx
      GalleryScene.tsx
      Wall.tsx
      ArtworkFrame.tsx
      ArtworkLabel.tsx
      GalleryLights.tsx
      CameraController.tsx

    ui/
      Header.tsx
      Footer.tsx
      WallNavigation.tsx
      ArtworkPanel.tsx
      LoadingScreen.tsx

  store/
    useGalleryStore.ts

  styles/
    globals.css

  App.tsx
  main.tsx
```

---

# 8. Componentes principais

## GalleryCanvas

Responsável por criar o Canvas 3D.

Deve conter:

1. Canvas do React Three Fiber.
2. Cena da galeria.
3. Câmera.
4. Luzes.
5. Suspense/loading.
6. Configurações de performance.

Exemplo conceitual:

```tsx
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { GalleryScene } from "./GalleryScene";
import { LoadingScreen } from "../ui/LoadingScreen";

export function GalleryCanvas() {
  return (
    <div className="gallery-canvas">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 35 }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <GalleryScene />
        </Suspense>
      </Canvas>

      <LoadingScreen />
    </div>
  );
}
```

## GalleryScene

Responsável por renderizar:

1. Todas as paredes.
2. Todos os quadros.
3. Luzes.
4. Controle de câmera.

```tsx
import { walls } from "../../data/walls";
import { Wall } from "./Wall";
import { GalleryLights } from "./GalleryLights";
import { CameraController } from "./CameraController";

export function GalleryScene() {
  return (
    <>
      <GalleryLights />
      <CameraController />

      {walls.map((wall) => (
        <Wall key={wall.id} wall={wall} />
      ))}
    </>
  );
}
```

## Wall

Cada parede é um plano 3D com quadros.

```tsx
import { artworks } from "../../data/artworks";
import { ArtworkFrame } from "./ArtworkFrame";

export function Wall({ wall }) {
  const wallArtworks = artworks.filter(
    (artwork) => artwork.wallIndex === wall.index
  );

  return (
    <group position={[wall.index * 8, 0, 0]}>
      <mesh receiveShadow>
        <boxGeometry args={[6.8, 4, 0.1]} />
        <meshStandardMaterial color="#e8dfd2" />
      </mesh>

      {wallArtworks.map((artwork) => (
        <ArtworkFrame key={artwork.id} artwork={artwork} />
      ))}
    </group>
  );
}
```

## ArtworkFrame

Responsável por desenhar cada quadro.

Cada quadro deve ter:

1. Moldura externa.
2. Passe-partout branco.
3. Fotografia.
4. Pequena profundidade.
5. Sombra.
6. Evento de clique.

Estrutura visual:

```txt
Group do quadro
  Moldura dourada
  Fundo branco interno
  Imagem da obra
  Placa pequena
```

Exemplo conceitual:

```tsx
import { useTexture } from "@react-three/drei";
import { useGalleryStore } from "../../store/useGalleryStore";

export function ArtworkFrame({ artwork }) {
  const texture = useTexture(artwork.image);
  const selectArtwork = useGalleryStore((state) => state.selectArtwork);

  return (
    <group
      position={artwork.position}
      onClick={() => selectArtwork(artwork.id)}
    >
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[artwork.size[0] + 0.25, artwork.size[1] + 0.25, 0.12]} />
        <meshStandardMaterial color="#b69b5e" />
      </mesh>

      <mesh position={[0, 0, 0.07]}>
        <boxGeometry args={[artwork.size[0] + 0.08, artwork.size[1] + 0.08, 0.04]} />
        <meshStandardMaterial color="#f2eee6" />
      </mesh>

      <mesh position={[0, 0, 0.11]}>
        <planeGeometry args={artwork.size} />
        <meshBasicMaterial map={texture} />
      </mesh>
    </group>
  );
}
```

---

# 9. Controle de câmera

## Estados necessários

```ts
type GalleryState = {
  currentWall: number;
  selectedArtworkId: string | null;
  isZoomed: boolean;

  goToNextWall: () => void;
  goToPreviousWall: () => void;
  selectArtwork: (id: string) => void;
  closeArtwork: () => void;
};
```

## Zustand store

```ts
import { create } from "zustand";

export const useGalleryStore = create((set, get) => ({
  currentWall: 0,
  selectedArtworkId: null,
  isZoomed: false,

  goToNextWall: () => {
    const current = get().currentWall;

    set({
      currentWall: Math.min(current + 1, 2),
      selectedArtworkId: null,
      isZoomed: false
    });
  },

  goToPreviousWall: () => {
    const current = get().currentWall;

    set({
      currentWall: Math.max(current - 1, 0),
      selectedArtworkId: null,
      isZoomed: false
    });
  },

  selectArtwork: (id) => {
    set({
      selectedArtworkId: id,
      isZoomed: true
    });
  },

  closeArtwork: () => {
    set({
      selectedArtworkId: null,
      isZoomed: false
    });
  }
}));
```

## CameraController

A câmera deve ter dois modos:

1. Modo parede.
2. Modo zoom na obra.

### Modo parede

```txt
Câmera fica de frente para a parede atual.
```

### Modo zoom

```txt
Câmera aproxima do quadro clicado.
Painel HTML aparece por cima.
```

Exemplo conceitual:

```tsx
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import gsap from "gsap";
import { useGalleryStore } from "../../store/useGalleryStore";
import { artworks } from "../../data/artworks";

export function CameraController() {
  const { camera } = useThree();

  const currentWall = useGalleryStore((state) => state.currentWall);
  const selectedArtworkId = useGalleryStore((state) => state.selectedArtworkId);

  useEffect(() => {
    const wallX = currentWall * 8;

    if (!selectedArtworkId) {
      gsap.to(camera.position, {
        x: wallX,
        y: 0,
        z: 6,
        duration: 1.1,
        ease: "power3.inOut",
        onUpdate: () => {
          camera.lookAt(wallX, 0, 0);
        }
      });

      return;
    }

    const artwork = artworks.find((item) => item.id === selectedArtworkId);

    if (!artwork) return;

    const targetX = artwork.wallIndex * 8 + artwork.position[0];
    const targetY = artwork.position[1];

    gsap.to(camera.position, {
      x: targetX,
      y: targetY,
      z: 2.4,
      duration: 1,
      ease: "power3.inOut",
      onUpdate: () => {
        camera.lookAt(targetX, targetY, 0);
      }
    });
  }, [currentWall, selectedArtworkId, camera]);

  return null;
}
```

---

# 10. UI em HTML por cima do Canvas

A interface não deve ser feita toda dentro do Three.js.

Use Three.js para:

1. Paredes.
2. Quadros.
3. Molduras.
4. Luzes.
5. Movimento da câmera.

Use HTML/CSS para:

1. Header.
2. Menu.
3. Footer.
4. Botões.
5. Painel de produto.
6. Preço.
7. CTA.
8. Textos longos.

Isso deixa o site mais leve, acessível e fácil de manter.

## Header

Deve seguir a estética da referência.

```txt
TNES                 EXHIBITION    ARCHIVE    ABOUT
                                                ícone
```

Características:

1. Posição fixa no topo.
2. Transparente.
3. Tipografia pequena.
4. Espaçamento amplo.
5. Poucos elementos.

## Footer

```txt
© 2026 TNES - LONDON                         INSTAGRAM     CONTACT
```

Características:

1. Posição fixa no rodapé.
2. Tipografia pequena.
3. Pouco contraste.
4. Sensação editorial.

## Navegação lateral

Botões discretos:

```txt
← Previous wall
Next wall →
```

Ou apenas setas minimalistas nas laterais da tela.

---

# 11. Painel de produto

Ao clicar em uma obra, abrir um painel lateral ou inferior.

## Melhor opção para o MVP

Usar painel lateral direito.

Motivo:

1. Não cobre totalmente a obra.
2. Mantém sensação de galeria.
3. Funciona bem para ecommerce.
4. É fácil adaptar para mobile.

## Conteúdo do painel

```txt
Título da obra
Local e ano
Descrição curta
Edição
Dimensões
Preço
Botão: Add to cart
Botão: Inquire
```

Como o Shopify ainda não estará conectado, o botão pode ser mockado:

```txt
Add to cart
```

Ao clicar:

```txt
Show toast: Added to mock cart
```

## Exemplo de painel

```tsx
import { useGalleryStore } from "../../store/useGalleryStore";
import { artworks } from "../../data/artworks";

export function ArtworkPanel() {
  const selectedArtworkId = useGalleryStore((state) => state.selectedArtworkId);
  const closeArtwork = useGalleryStore((state) => state.closeArtwork);

  const artwork = artworks.find((item) => item.id === selectedArtworkId);

  if (!artwork) return null;

  return (
    <aside className="artwork-panel">
      <button onClick={closeArtwork}>Close</button>

      <p className="eyebrow">Selected work</p>
      <h2>{artwork.title}</h2>
      <p>{artwork.subtitle}</p>

      <p>{artwork.description}</p>

      <div>
        <span>Edition</span>
        <strong>{artwork.edition}</strong>
      </div>

      <div>
        <span>Dimensions</span>
        <strong>{artwork.dimensions}</strong>
      </div>

      <div>
        <span>Price</span>
        <strong>{artwork.price}</strong>
      </div>

      <button>Add to cart</button>
      <button>Inquire</button>
    </aside>
  );
}
```

---

# 12. Transições suaves

As transições mais importantes são:

1. Troca de parede.
2. Zoom no quadro.
3. Fechamento do zoom.
4. Entrada do painel de produto.
5. Hover nos quadros.
6. Loading inicial.

## Transição entre paredes

A câmera deve deslizar lateralmente.

```txt
Duração: 1.0s a 1.3s
Ease: power3.inOut
Movimento: horizontal
Rotação: quase nenhuma
```

Não girar demais a câmera. A câmera deve continuar vendo a parede de frente.

## Transição de zoom

Ao clicar no quadro:

```txt
Câmera aproxima do quadro
Fundo escurece levemente
Painel entra pela direita
Quadro ganha foco visual
```

Duração recomendada:

```txt
Câmera: 0.9s a 1.1s
Painel: 0.4s a 0.6s
Overlay: 0.3s
```

## Hover nos quadros

No hover:

```txt
Quadro sobe levemente ou aumenta 2%
Cursor vira pointer
Moldura recebe brilho sutil
```

Evitar efeitos exagerados.

---

# 13. Visual 3D detalhado

## Parede

A parede deve parecer física, mas sem ser pesada.

Características:

1. Cor bege/off-white.
2. Textura sutil de papel, gesso ou parede.
3. Pouco contraste.
4. Dimensões largas.
5. Leve espessura.
6. Sombra mínima no chão, se houver chão.

No MVP, pode ser uma caixa fina:

```tsx
<boxGeometry args={[6.8, 4, 0.1]} />
```

## Molduras

As molduras são fundamentais para vender a estética.

Características:

1. Cor dourada envelhecida ou madeira clara.
2. Profundidade pequena.
3. Passe-partout branco.
4. Sombra suave na parede.
5. Espessura proporcional ao tamanho da obra.

Camadas da moldura:

```txt
1. Moldura externa dourada
2. Base branca interna
3. Foto
```

## Luz

Usar luz simples:

```txt
AmbientLight fraca
DirectionalLight suave
SpotLight opcional sobre a parede
```

No MVP:

```tsx
<ambientLight intensity={1.5} />
<directionalLight position={[0, 3, 4]} intensity={1.2} />
```

Se quiser mais realismo:

```txt
Uma luz acima de cada parede
```

Mas cuidado para não complicar.

---

# 14. Responsividade

## Desktop

Experiência principal:

```txt
Canvas em tela cheia
Header fixo
Footer fixo
Setas laterais
Painel lateral no clique
```

## Mobile

No mobile, a galeria deve continuar controlada.

Sugestão:

1. Manter uma parede por vez.
2. Usar swipe horizontal para trocar de parede.
3. Ao clicar no quadro, abrir bottom sheet.
4. Evitar painel lateral.
5. Reduzir quantidade de quadros por parede.
6. Reduzir qualidade das texturas.
7. Usar DPR menor.

Painel mobile:

```txt
Bottom sheet com imagem, título, preço e CTA.
```

---

# 15. Performance

## Regras principais

1. Usar apenas um Canvas.
2. Não usar câmera livre.
3. Não carregar imagens gigantes no Canvas.
4. Usar thumbnails no 3D.
5. Carregar imagem maior só no painel.
6. Evitar modelos 3D pesados.
7. Preferir geometria simples.
8. Limitar DPR.
9. Evitar sombras pesadas.
10. Evitar pós-processamento no MVP.

## Imagens

Preparar duas versões de cada imagem:

```txt
thumbnail: 600px ou 800px
large: 1600px ou 2000px
```

No Canvas:

```txt
usar thumbnail
```

No painel:

```txt
usar large
```

## DPR

No Canvas:

```tsx
<Canvas dpr={[1, 1.5]}>
```

Isso evita renderização pesada em telas retina.

## Sombras

Sombras deixam bonito, mas podem pesar.

No MVP, usar sombras falsas sempre que possível:

1. Pequeno plano transparente atrás do quadro.
2. Material escuro com opacidade baixa.
3. Sem shadow map real.

Exemplo visual:

```txt
Quadro
Sombra fake atrás
Parede
```

Isso parece real e é mais leve.

## Evitar no MVP

Não usar inicialmente:

1. Física.
2. Raymarching.
3. Pós-processamento pesado.
4. Bloom.
5. Reflexos reais.
6. HDRI grande.
7. Modelos de sala complexos.
8. Textos 3D longos.
9. Câmera livre.
10. Animações constantes sem necessidade.

---

# 16. Arquitetura ideal do MVP

## Separação de responsabilidades

```txt
Three.js / R3F
Responsável pela experiência espacial

React UI
Responsável pela interface e informações

Zustand
Responsável pelo estado global

Mock data
Responsável pelos dados das obras

CSS
Responsável pela estética editorial
```

## O que o 3D deve fazer

1. Renderizar paredes.
2. Renderizar molduras.
3. Renderizar imagens.
4. Detectar clique nos quadros.
5. Animar câmera.
6. Criar sensação de exposição.

## O que o 3D não deve fazer

1. Renderizar textos longos.
2. Controlar ecommerce.
3. Controlar carrinho.
4. Fazer checkout.
5. Criar layout de painel.
6. Gerenciar rotas.
7. Fazer lógica de negócio.

---

# 17. Roadmap do MVP

## Fase 1: Cena base

Objetivo: criar uma parede visualmente bonita.

Entregáveis:

1. Canvas full screen.
2. Parede bege.
3. Luz suave.
4. 3 quadros com imagens.
5. Molduras simples.
6. Header e footer fixos.

Validação:

```txt
A primeira tela já parece uma exposição TNES?
A composição parece premium?
A parede parece física?
Os quadros parecem clicáveis?
```

## Fase 2: Múltiplas paredes

Objetivo: testar navegação lateral.

Entregáveis:

1. 3 paredes lado a lado.
2. Botão Next.
3. Botão Previous.
4. Teclado com setas.
5. Transição suave da câmera.

Validação:

```txt
A troca de parede é fluida?
O usuário entende que pode navegar?
A câmera permanece controlada?
A experiência parece uma exposição?
```

## Fase 3: Clique e zoom

Objetivo: testar foco na obra.

Entregáveis:

1. Clique no quadro.
2. Zoom suave da câmera.
3. Estado de obra selecionada.
4. Botão para fechar.
5. Retorno para a parede.

Validação:

```txt
O zoom valoriza a obra?
O usuário entende qual obra selecionou?
A transição é elegante?
O fechamento é claro?
```

## Fase 4: Painel de produto

Objetivo: testar camada de ecommerce visual.

Entregáveis:

1. Painel lateral.
2. Título da obra.
3. Descrição.
4. Dimensões.
5. Edição.
6. Preço.
7. Botão mockado de compra.
8. Botão de contato.

Validação:

```txt
O painel parece integrado à galeria?
O produto fica desejável?
O CTA é claro?
A obra continua sendo protagonista?
```

## Fase 5: Ajustes de performance

Objetivo: garantir fluidez.

Entregáveis:

1. Imagens comprimidas.
2. DPR limitado.
3. Lazy loading.
4. Sem pós-processamento pesado.
5. Teste em notebook comum.
6. Teste em mobile.

Validação:

```txt
A experiência roda lisa?
O carregamento inicial é aceitável?
O site não trava no mobile?
As transições continuam suaves?
```

---

# 18. Critérios de sucesso do MVP

O MVP estará validado se:

1. A primeira impressão for premium.
2. A navegação entre paredes for intuitiva.
3. O clique nos quadros for claro.
4. O zoom for suave.
5. O painel de produto for legível.
6. A performance for boa.
7. O código continuar simples.
8. A estrutura permitir conectar Shopify depois.
9. A experiência parecer uma exposição, não apenas uma loja.
10. O usuário entender que as obras podem ser compradas.

---

# 19. Ordem de implementação recomendada

## Passo 1

Criar projeto:

```bash
npm create vite@latest tnes-gallery-mvp
cd tnes-gallery-mvp
npm install
```

## Passo 2

Instalar dependências:

```bash
npm install three @react-three/fiber @react-three/drei gsap zustand
```

## Passo 3

Criar tela full screen com Canvas.

## Passo 4

Criar primeira parede 3D.

## Passo 5

Adicionar 3 quadros mockados.

## Passo 6

Adicionar molduras e passe-partout.

## Passo 7

Adicionar header e footer em HTML/CSS.

## Passo 8

Criar mais duas paredes.

## Passo 9

Adicionar Zustand para controlar parede atual.

## Passo 10

Animar câmera com GSAP.

## Passo 11

Adicionar clique nos quadros.

## Passo 12

Adicionar zoom na obra.

## Passo 13

Adicionar painel de produto.

## Passo 14

Otimizar imagens e performance.

## Passo 15

Testar desktop e mobile.

---

# 20. Decisões importantes para não complicar

## Fazer

1. Usar paredes lado a lado.
2. Usar câmera controlada.
3. Usar imagens planas dentro de molduras.
4. Usar UI em HTML.
5. Usar dados mockados.
6. Usar transições simples.
7. Usar composição visual forte.
8. Usar apenas um Canvas.
9. Usar GSAP para câmera.
10. Usar Zustand para estado.

## Não fazer no MVP

1. Não criar galeria com movimento livre.
2. Não criar sala completa em 3D.
3. Não usar modelos 3D pesados.
4. Não usar Shopify ainda.
5. Não fazer carrinho real.
6. Não colocar texto longo dentro do Canvas.
7. Não usar física.
8. Não criar múltiplos Canvas.
9. Não exagerar nos efeitos.
10. Não depender de scroll complexo.

---

# 21. Fórmula técnica do MVP

```txt
MVP = parede 3D + quadros clicáveis + câmera suave + painel HTML
```

A experiência deve parecer sofisticada, mas a implementação deve ser simples.

A complexidade deve estar na direção de arte, não na arquitetura.

---

# 22. Melhor definição do MVP

O MVP não é um ecommerce completo.

O MVP é uma prova visual e interativa de que a experiência de comprar arte dentro de uma exposição digital funciona.

A versão inicial deve responder:

```txt
Essa navegação por paredes funciona?
Os quadros parecem produtos premium?
O zoom gera desejo?
O painel de produto combina com a experiência?
A experiência é leve o suficiente?
```

Se a resposta for sim, depois basta conectar Shopify, produtos reais, variantes e checkout.

---

# 23. Resultado esperado

Ao final do MVP, o usuário deve conseguir:

1. Entrar na exposição.
2. Ver uma parede de frente.
3. Navegar para outras paredes.
4. Clicar em uma obra.
5. Ver zoom suave na obra.
6. Ler informações do produto.
7. Ver preço e CTA.
8. Fechar o painel.
9. Continuar navegando.

O site deve parecer uma mistura de:

```txt
Galeria de arte
Editorial de fotografia
Ecommerce premium
Experiência 3D controlada
```

---

# 24. Resumo final

A melhor abordagem para esse MVP é usar React com Vite, Three.js via React Three Fiber, Drei, GSAP e Zustand.

A galeria deve ser feita com paredes posicionadas horizontalmente, câmera sempre frontal, quadros clicáveis e zoom controlado.

O ecommerce real deve ser ignorado no MVP. Em vez disso, usar dados mockados com título, descrição, preço e CTA falso.

A chave para ficar leve é não criar uma galeria livre em 3D. O ideal é criar uma experiência dirigida, onde o usuário navega parede por parede com transições suaves.

A chave para ficar bonito é investir em composição, molduras, textura de parede, iluminação suave, tipografia editorial e movimento de câmera elegante.

export const WALL_SPACING = 10
// The Manifesto is a physical side room off the Signature wall, deliberately
// absent from `walls` so it never becomes a top-level navigation destination.
export const MANIFESTO_ROOM_X = -WALL_SPACING
export const CAMERA_Z = 7.9
// The marble slab starts at the floor and deliberately continues well above the
// resting camera frame.  This keeps the room reading as a continuous wall, not
// a wall capped by a visible ceiling.
export const WALL_WIDTH = 9.4
export const WALL_BOTTOM_Y = -2.2
export const WALL_HEIGHT = 6.27
export const WALL_CENTER_Y = WALL_BOTTOM_Y + WALL_HEIGHT / 2
export const WALL_TOP_Y = WALL_BOTTOM_Y + WALL_HEIGHT
// Framing stays based on the original exhibition field so the works do not
// shrink merely because the marble surface is taller.
export const WALL_VIEW_HEIGHT = 4.93

export type Wall = {
  index: number
  name: string
  roman: string
  /** yaw in radians — walls sit slightly angled to each other, not coplanar */
  angle: number
}

export type Artwork = {
  id: string
  title: string
  subtitle: string
  description: string
  price: string
  image: string
  wallIndex: number
  position: [number, number, number]
  size: [number, number]
  edition: string
  dimensions: string
  frameStyle: FrameStyle
  /**
   * Shopify product handle. Set = the work is purchasable: the panel shows live
   * options and price and offers checkout. Unset = inquiry-only, the original
   * behaviour. A missing or unmatched handle keeps the work inquiry-only.
   */
  shopifyHandle?: string
}

export type FrameStyle = 'unframed' | 'white' | 'black' | 'glass' | 'aluminium'

/** The selector's two steps: what the piece is made of, then its colour. */
export type FrameMaterial = 'unframed' | 'regular' | 'aluminium' | 'glass'
export type FrameFinish = 'black' | 'white' | 'custom'

export const FRAME_MATERIALS: Record<FrameMaterial, string> = {
  unframed: 'unframed',
  regular: 'regular',
  aluminium: 'brushed aluminum',
  glass: 'plexiglass',
}
export const FRAME_FINISHES: FrameFinish[] = ['black', 'white', 'custom']

export const frameMaterialOf = (style: FrameStyle): FrameMaterial =>
  style === 'white' || style === 'black' ? 'regular' : style

// ponytail: only the regular moulding changes colour in 3D; custom previews as white
export const frameStyleFor = (material: FrameMaterial, finish: FrameFinish): FrameStyle =>
  material === 'regular' ? (finish === 'black' ? 'black' : 'white') : material

/** The inquiry line for a selection, e.g. "regular · black". */
export const frameLabelFor = (material: FrameMaterial, finish: FrameFinish) =>
  material === 'unframed' ? FRAME_MATERIALS.unframed : `${FRAME_MATERIALS[material]} · ${finish}`

/** Shopify's Frame value ('White', 'Glass Block', …) as the style the 3D builds. */
export const frameStyleOf = (value: string | undefined): FrameStyle => {
  const key = value?.toLowerCase() ?? ''
  if (key.includes('glass')) return 'glass'
  if (key.includes('alumin')) return 'aluminium'
  return key === 'white' || key === 'black' ? key : 'unframed'
}

/** The storefront's canonical size labels, shared by live and fallback views. */
export const standardPrintSizes = (artwork: Pick<Artwork, 'size'>) =>
  artwork.size[1] > artwork.size[0]
    ? ['30x20', '36x24', '42x28']
    : ['20x30', '24x36', '28x42']

export const walls: Wall[] = [
  { index: 0, name: 'Home', roman: 'I', angle: 0 },
  { index: 1, name: 'Prints', roman: 'II', angle: 0 },
  { index: 2, name: 'Countdown', roman: 'III', angle: -0.085 },
  // the personal closer: the artist's portrait + a doorway into VSL, his mind
  { index: 3, name: 'About', roman: 'IV', angle: 0.085 },
]

// Preserved for a future release. These sections must not be added to `walls`
// or rendered by the current gallery.
export const MOMENTS = [
  { name: 'Moments 1', roman: 'II', angle: -0.085 },
  { name: 'Moments 2', roman: 'III', angle: 0.085 },
] as const

export const SIGNATURE_WALL = 0
export const ARCHIVE_WALL = 1
export const COMING_SOON_WALL = 2
export const ABOUT_WALL = 3
// doorway cut into the About wall (x relative to that wall's center) — shared
// with Room so the long backdrop panel can leave a gap behind the opening
export const ABOUT_DOOR_X = 2.95
export const ABOUT_DOOR_W = 1.9
export const ABOUT_DOOR_H = 3.5
export const OPENING_DATE = new Date('2026-09-09T18:00:00-03:00')

// the opening (Signature) wall's one-line brand statement, cut into the concrete
export const BRAND_STATEMENT = 'nothing happens twice'

// the single work hung on the opening wall
export const HERO_ID = 'the-pool'

// the About wall: Victor's portrait, a wall-text, and a link out to VSL — the
// immersive site that is the artist's mind behind this exhibition.
export const VSL_URL = 'https://vsl.photography/'

// inquiries are composed client-side and handed to the visitor's mail app
export const INQUIRY_EMAIL = 'vlevy@tnes.studio'
export const INQUIRY_TYPES = [
  'acquisition',
  'commission',
  'interiors',
  'collaboration',
  'private inquiry',
] as const
export const ABOUT = {
  // Victor's B&W headshot — VSL's contact portrait, pre-cropped to 2:3 vertical
  // and desaturated to match how vsl.studio renders it. Larger than an artwork.
  portrait: '/victor-headshot-bw.webp',
  // hung nearly floor-to-eye, the way the reference frames him
  portraitSize: [1.8, 2.7] as [number, number],
  name: 'Victor Safdie Levy',
  role: 'ARTIST AND FOUNDER OF TNES.',
  // one first-person block, in his voice — the reference layout has no room for
  // a pull-quote AND a separate bio, and this is the wording it carries
  statement: `I started taking photographs as a way of keeping track of time — where I was, who was there, and what was happening before it became something else. I was always more interested in people and places as I found them: unposed, unplanned, already in motion. Over time, that personal archive became TNES., a studio built around one idea: nothing happens twice.`,
  // the one label for the doorway out to VSL — the 3D wall and /about both read
  // it from here, so the two surfaces cannot say different things
  cta: 'enter the mind in VSL',
  contact: {
    email: 'vlevy@tnes.studio',
    phone: '+1 917 445 4067',
    instagram: '@vlevy_',
    instagramUrl: 'https://instagram.com/vlevy_',
  },
}

// ---- V1 products: the twelve works currently shown in the TNES. archive ----
// Data sourced from tnes.studio/artifacts (title, location, year) and the
// tnes-3 store (medium + made-to-order print sizes). The archive publishes no
// public price or edition count — both are "available by inquiry" — so those
// fields carry the real state, not the previously-assumed £/edition numbers.
// Descriptions written from the actual photographs. Frame `size` = each
// photo's true aspect (3:2 landscape / 2:3 portrait) so nothing distorts.
const EDITION = 'Archival pigment print · edition by inquiry'
const DIMENSIONS = '60 × 84 · 42 × 60 · 30 × 42 cm'
const PRICE = 'Price on request'
const LANDSCAPE: [number, number] = [1.42, 0.95]
const PORTRAIT: [number, number] = [0.95, 1.42]
const FOUR_BY_FIVE: [number, number] = [1, 1.25]

export const artworks: Artwork[] = [
  {
    id: 'the-pool',
    title: 'Everyone In',
    subtitle: 'St. Peter\'s Pool, Malta · 2025',
    description:
      'Swimmers jump, dive and gather around the limestone basin at St. Peter\'s Pool.',
    price: PRICE,
    image: '/artworks/v1/stpeterspool_hero_2025_v1.webp',
    wallIndex: ARCHIVE_WALL,
    position: [-2.5, 0.3, 0],
    // the source file is 2560x1707 — a 3:2 landscape, not a portrait
    size: LANDSCAPE,
    edition: EDITION,
    dimensions: DIMENSIONS,
    frameStyle: 'white',
    shopifyHandle: 'st-peters-pool-v1',
  },
  {
    id: 'runner',
    title: 'Rio Runner',
    subtitle: 'Ipanema, Rio de Janeiro, Brazil · 2025',
    description:
      'A runner crosses Ipanema with Dois Irmãos and the city fading into sea mist.',
    price: PRICE,
    image: '/artworks/v1/ipanema_riorunner_2025_v1.webp',
    wallIndex: ARCHIVE_WALL,
    position: [0.1, -0.5, 0],
    size: LANDSCAPE,
    // Shopify sells this one as an open edition, so it contradicts the archive's
    // "edition by inquiry" — the store is the truth for anything purchasable.
    edition: 'Archival pigment print · open edition, framed ready to hang',
    dimensions: DIMENSIONS,
    frameStyle: 'white',
    shopifyHandle: 'rio-runner',
  },
  {
    id: 'wied-il-ghasri',
    title: 'Under the Limestone',
    subtitle: 'Gozo, Malta · 2025',
    description:
      'A woman rests beneath a huge limestone overhang on the coast of Gozo.',
    price: PRICE,
    image: '/artworks/v1/gozo_cavegirl_2025_v1.webp',
    wallIndex: ARCHIVE_WALL,
    position: [2.45, 0.45, 0],
    size: LANDSCAPE,
    edition: EDITION,
    dimensions: DIMENSIONS,
    frameStyle: 'white',
    shopifyHandle: 'gozo-cave-girl',
  },
  {
    id: 'lauterbrunnen',
    title: 'Foggy Cows',
    subtitle: 'Mürren, Switzerland · 2025',
    description:
      'Two cows stand in dense fog on a mountain trail above Mürren.',
    price: PRICE,
    image: '/artworks/v1/murren_foggycows_2025_v1.webp',
    wallIndex: ARCHIVE_WALL,
    position: [-2.4, 0.2, 0],
    size: PORTRAIT,
    edition: EDITION,
    dimensions: DIMENSIONS,
    frameStyle: 'white',
    shopifyHandle: 'murren-foggy-cows',
  },
  {
    id: 'praia-da-baleia',
    title: 'The Biker',
    subtitle: 'Praia da Baleia, São Sebastião, Brazil · 2026',
    description:
      'A cyclist carries a mint-green surfboard across Praia da Baleia.',
    price: PRICE,
    image: '/artworks/v1/baleia_biker_2025_v1.webp',
    wallIndex: ARCHIVE_WALL,
    position: [0, -0.2, 0],
    size: LANDSCAPE,
    edition: EDITION,
    dimensions: DIMENSIONS,
    frameStyle: 'white',
    shopifyHandle: 'praia-da-baleia',
  },
  {
    id: 'playa-roja',
    title: 'Dune Lines',
    subtitle: 'Paracas, Peru · 2025',
    description:
      'Wind draws repeating lines across the dunes of Paracas.',
    price: PRICE,
    image: '/artworks/v1/paracas_flatdunes_2025_v1.webp',
    wallIndex: ARCHIVE_WALL,
    position: [2.45, 0.3, 0],
    size: LANDSCAPE,
    edition: EDITION,
    dimensions: DIMENSIONS,
    frameStyle: 'white',
    shopifyHandle: 'paracas-flat-dunes',
  },
  {
    id: 'calpe-muralla-roja',
    title: 'Between Walls',
    subtitle: 'La Muralla Roja, Calpe, Spain · 2025',
    description:
      'Blue, coral and violet walls stack against the sky at La Muralla Roja.',
    price: PRICE,
    image: '/artworks/v1/calpe_murallaroja_2025_v1.webp',
    wallIndex: ARCHIVE_WALL,
    position: [-2.4, 0.2, 0],
    size: PORTRAIT,
    edition: EDITION,
    dimensions: DIMENSIONS,
    frameStyle: 'white',
    shopifyHandle: 'calpe-muralla-roja',
  },
  {
    id: 'moreira-crowded-beach',
    title: 'Grey Day',
    subtitle: 'Moraira, Spain · 2025',
    description:
      'Beachgoers dot a grey afternoon in Moraira with small bursts of color.',
    price: PRICE,
    image: '/artworks/v1/moreira_crowdedbeach_2025_v1.webp',
    wallIndex: ARCHIVE_WALL,
    position: [0, -0.2, 0],
    size: FOUR_BY_FIVE,
    edition: EDITION,
    dimensions: DIMENSIONS,
    frameStyle: 'white',
    shopifyHandle: 'grey-day-moraira',
  },
  {
    id: 'florence-dogman',
    title: 'Man and Dog',
    subtitle: 'Florence, Italy · 2025',
    description:
      'A man sits on a stone ledge in Florence beside his sleeping dog.',
    price: PRICE,
    image: '/artworks/v1/florence_dogman_2025_v1.webp',
    wallIndex: ARCHIVE_WALL,
    position: [2.45, 0.3, 0],
    size: PORTRAIT,
    edition: EDITION,
    dimensions: DIMENSIONS,
    frameStyle: 'white',
    shopifyHandle: 'florence-dog-man',
  },
  {
    id: 'ischia-mezzatorre',
    title: 'The Swimmer',
    subtitle: 'Mezzatorre, Ischia, Italy · 2025',
    description:
      'A swimmer moves through the pool below striped umbrellas and the Mediterranean.',
    price: PRICE,
    image: '/artworks/v1/ischia_mezzatorre_2025_v1.webp',
    wallIndex: ARCHIVE_WALL,
    position: [-2.5, 0.3, 0],
    size: PORTRAIT,
    edition: EDITION,
    dimensions: DIMENSIONS,
    frameStyle: 'white',
    shopifyHandle: 'ischia-mezzatorre',
  },
  {
    id: 'ditch-plains-far',
    title: 'Before Summer',
    subtitle: 'Ditch Plains, Montauk, New York, United States · 2026',
    description:
      'A weathered dune fence runs toward an almost-empty Ditch Plains beach.',
    price: PRICE,
    image: '/artworks/v1/ditchplains_far_2026_v1.webp',
    wallIndex: ARCHIVE_WALL,
    position: [0, -0.2, 0],
    size: PORTRAIT,
    edition: EDITION,
    dimensions: DIMENSIONS,
    frameStyle: 'white',
    shopifyHandle: 'ditch-plains-far',
  },
  {
    id: 'appenzell-alpine-lake',
    title: 'The Lake Below',
    subtitle: 'Appenzell, Switzerland · 2025',
    description:
      'A turquoise alpine lake appears between the forest and rock far below Appenzell.',
    price: PRICE,
    image: '/artworks/v1/appenzell_alpinelake_2025_v1.webp',
    wallIndex: ARCHIVE_WALL,
    position: [2.45, 0.3, 0],
    size: LANDSCAPE,
    edition: EDITION,
    dimensions: DIMENSIONS,
    frameStyle: 'white',
    shopifyHandle: 'appenzell-alpine-lake',
  },
  {
    id: 'christ-in-fog-rio-de-janeiro',
    title: 'Christ in Fog',
    subtitle: 'Rio de Janeiro, Brazil · 2025',
    description:
      'Christ the Redeemer nearly disappears into dense fog above Rio.',
    price: PRICE,
    image: '/artworks/v1/rio_christfog_2025_v1.webp',
    wallIndex: ARCHIVE_WALL,
    position: [-2.5, 0.3, 0],
    size: PORTRAIT,
    edition: EDITION,
    dimensions: DIMENSIONS,
    frameStyle: 'white',
    shopifyHandle: 'christ-in-fog-rio-de-janeiro',
  },
  {
    id: 'pink-lagoon-paracas',
    title: 'Pink Lagoon',
    subtitle: 'Paracas, Peru · 2025',
    description:
      'Pink salt water stretches across the pale desert in Paracas.',
    price: PRICE,
    image: '/artworks/v1/paracas_pinklagoon_2025_v1.webp',
    wallIndex: ARCHIVE_WALL,
    position: [0, -0.2, 0],
    size: LANDSCAPE,
    edition: EDITION,
    dimensions: DIMENSIONS,
    frameStyle: 'white',
    shopifyHandle: 'pink-lagoon-paracas',
  },
  {
    id: 'moraira-from-above',
    title: 'Moraira from Above',
    subtitle: 'Moraira, Spain · 2025',
    description:
      'A curved beach and hillside houses wrap around the water in Moraira.',
    price: PRICE,
    image: '/artworks/v1/moraira_aerialbeach_2025_v1.webp',
    wallIndex: ARCHIVE_WALL,
    position: [2.45, 0.3, 0],
    size: LANDSCAPE,
    edition: EDITION,
    dimensions: DIMENSIONS,
    frameStyle: 'white',
    shopifyHandle: 'moraira-from-above',
  },
  {
    id: 'fishing-bay-paracas',
    title: 'Fishing Bay',
    subtitle: 'Paracas, Peru · 2025',
    description:
      'Fishing boats scatter across turquoise water beside the desert coast of Paracas.',
    price: PRICE,
    image: '/artworks/v1/paracas_fishingboats_2025_v1.webp',
    wallIndex: ARCHIVE_WALL,
    position: [-2.5, 0.3, 0],
    size: LANDSCAPE,
    edition: EDITION,
    dimensions: DIMENSIONS,
    frameStyle: 'white',
    shopifyHandle: 'fishing-bay-paracas',
  },
  {
    id: 'ipanema-at-dusk',
    title: 'Ipanema at Dusk',
    subtitle: 'Ipanema, Rio de Janeiro, Brazil · 2025',
    description:
      'Ipanema fills with people, mist and late sun as the mountains fade behind the beach.',
    price: PRICE,
    image: '/artworks/v1/ipanema_dusk_2025_v1.webp',
    wallIndex: ARCHIVE_WALL,
    position: [0, -0.2, 0],
    size: LANDSCAPE,
    edition: EDITION,
    dimensions: DIMENSIONS,
    frameStyle: 'white',
    shopifyHandle: 'ipanema-at-dusk',
  },
  {
    id: 'after-the-fog-murren',
    title: 'After the Fog',
    subtitle: 'Mürren, Switzerland · 2025',
    description:
      'A narrow road runs through green pasture toward the mountains after the weather clears.',
    price: PRICE,
    image: '/artworks/v1/murren_alpineroad_2025_v1.webp',
    wallIndex: ARCHIVE_WALL,
    position: [2.45, 0.3, 0],
    size: LANDSCAPE,
    edition: EDITION,
    dimensions: DIMENSIONS,
    frameStyle: 'white',
    shopifyHandle: 'after-the-fog-murren',
  },
  {
    id: 'perigo-praia-da-baleia',
    title: 'Perigo',
    subtitle: 'Praia da Baleia, São Sebastião, Brazil · 2025',
    description:
      'A red PERIGO sign stands alone against a purple-grey beach at dusk.',
    price: PRICE,
    image: '/artworks/v1/baleia_perigosign_2025_v1.webp',
    wallIndex: ARCHIVE_WALL,
    position: [-2.5, 0.3, 0],
    size: LANDSCAPE,
    edition: EDITION,
    dimensions: DIMENSIONS,
    frameStyle: 'white',
    shopifyHandle: 'perigo-praia-da-baleia',
  },
  {
    id: 'appenzell-valley',
    title: 'Appenzell Valley',
    subtitle: 'Appenzell, Switzerland · 2025',
    description:
      'Green hills, roads and scattered houses unfold below the cable car in Appenzell.',
    price: PRICE,
    image: '/artworks/v1/appenzell_valley_2025_v1.webp',
    wallIndex: ARCHIVE_WALL,
    position: [0, -0.2, 0],
    size: LANDSCAPE,
    edition: EDITION,
    dimensions: DIMENSIONS,
    frameStyle: 'white',
    shopifyHandle: 'appenzell-valley',
  },
  {
    id: 'first-bells-mount-rigi',
    title: 'First Bells',
    subtitle: 'Mount Rigi, Switzerland · 2025',
    description:
      'A black-and-white cow grazes on Mount Rigi as the rest of the herd disappears into mist.',
    price: PRICE,
    image: '/artworks/v1/rigi_cow_2025_v1.webp',
    wallIndex: ARCHIVE_WALL,
    position: [2.45, 0.3, 0],
    size: PORTRAIT,
    edition: EDITION,
    dimensions: DIMENSIONS,
    frameStyle: 'white',
    shopifyHandle: 'first-bells-mount-rigi',
  },
  {
    id: 'red-rooms-calpe',
    title: 'Red Rooms',
    subtitle: 'La Muralla Roja, Calpe, Spain · 2025',
    description:
      'Red walls, plants and open corridors frame the sea at La Muralla Roja.',
    price: PRICE,
    image: '/artworks/v1/calpe_redrooms_2025_v1.webp',
    wallIndex: ARCHIVE_WALL,
    position: [-2.5, 0.3, 0],
    size: PORTRAIT,
    edition: EDITION,
    dimensions: DIMENSIONS,
    frameStyle: 'white',
    shopifyHandle: 'red-rooms-calpe',
  },
  {
    id: 'blue-edge-gozo',
    title: 'Blue Edge',
    subtitle: 'Gozo, Malta · 2025',
    description:
      'A concrete platform points toward an uninterrupted blue horizon on Gozo.',
    price: PRICE,
    image: '/artworks/v1/gozo_blueedge_2025_v1.webp',
    wallIndex: ARCHIVE_WALL,
    position: [0, -0.2, 0],
    size: PORTRAIT,
    edition: EDITION,
    dimensions: DIMENSIONS,
    frameStyle: 'white',
    shopifyHandle: 'blue-edge-gozo',
  },
  {
    id: 'narrow-opening-wied-il-ghasri',
    title: 'Narrow Opening',
    subtitle: 'Wied il-Għasri, Gozo, Malta · 2025',
    description:
      'The limestone inlet at Wied il-Għasri opens into the Mediterranean.',
    price: PRICE,
    image: '/artworks/v1/wiedilghasri_inlet_2025_v1.webp',
    wallIndex: ARCHIVE_WALL,
    position: [2.45, 0.3, 0],
    size: LANDSCAPE,
    edition: EDITION,
    dimensions: DIMENSIONS,
    frameStyle: 'white',
    shopifyHandle: 'narrow-opening-wied-il-ghasri',
  },
  {
    id: 'carousel-florence',
    title: 'Carousel',
    subtitle: 'Florence, Italy · 2025',
    description:
      'A carousel turns into bands of light at night in Florence.',
    price: PRICE,
    image: '/artworks/v1/lorence_carousel_2025_v1.webp',
    wallIndex: ARCHIVE_WALL,
    position: [-2.5, 0.3, 0],
    size: LANDSCAPE,
    edition: EDITION,
    dimensions: DIMENSIONS,
    frameStyle: 'white',
    shopifyHandle: 'carousel-florence',
  },
  {
    id: 'low-tide-praia-da-baleia',
    title: 'Low Tide',
    subtitle: 'Praia da Baleia, São Sebastião, Brazil · 2025',
    description:
      'Wet sand reflects a dark headland at low tide.',
    price: PRICE,
    image: '/artworks/v1/baleia_lowtide_2025_v1.webp',
    wallIndex: ARCHIVE_WALL,
    position: [0, -0.2, 0],
    size: LANDSCAPE,
    edition: EDITION,
    dimensions: DIMENSIONS,
    frameStyle: 'white',
    shopifyHandle: 'low-tide-praia-da-baleia',
  },
  {
    id: 'ipanema-promenade',
    title: 'Ipanema Promenade',
    subtitle: 'Ipanema, Rio de Janeiro, Brazil · 2025',
    description:
      'A vendor works beneath the palms with Ipanema beach and Dois Irmãos behind him.',
    price: PRICE,
    image: '/artworks/v1/ipanema_promenade_2025_v1.webp',
    wallIndex: ARCHIVE_WALL,
    position: [2.45, 0.3, 0],
    size: PORTRAIT,
    edition: EDITION,
    dimensions: DIMENSIONS,
    frameStyle: 'white',
    shopifyHandle: 'ipanema-promenade',
  },
  {
    id: 'on-dry-land-gozo',
    title: 'On Dry Land',
    subtitle: 'Gozo, Malta · 2025',
    description:
      'An orange life ring hangs alone against pale limestone in Gozo.',
    price: PRICE,
    image: '/artworks/v1/gozo_lifering_2025_v1.webp',
    wallIndex: ARCHIVE_WALL,
    position: [-2.5, 0.3, 0],
    size: PORTRAIT,
    edition: EDITION,
    dimensions: DIMENSIONS,
    frameStyle: 'white',
    shopifyHandle: 'on-dry-land-gozo',
  },
  {
    id: 'red-car-gozo',
    title: 'Red Car',
    subtitle: 'Gozo, Malta · 2025',
    description:
      'A red car and a few scuba divers sit above a rough limestone inlet in Gozo.',
    price: PRICE,
    image: '/artworks/v1/gozo_redcar_2025_v1.webp',
    wallIndex: ARCHIVE_WALL,
    position: [0, -0.2, 0],
    size: LANDSCAPE,
    edition: EDITION,
    dimensions: DIMENSIONS,
    frameStyle: 'white',
    shopifyHandle: 'red-car-gozo',
  },
  {
    id: 'playa-roja-paracas',
    title: 'Playa Roja',
    subtitle: 'Playa Roja, Paracas, Peru · 2025',
    description:
      'Red sand sits between rust-colored cliffs and green-blue water at Playa Roja.',
    price: PRICE,
    image: '/artworks/v1/paracas_playaroja_2025_v1.webp',
    wallIndex: ARCHIVE_WALL,
    position: [2.45, 0.3, 0],
    size: PORTRAIT,
    edition: EDITION,
    dimensions: DIMENSIONS,
    frameStyle: 'white',
    shopifyHandle: 'playa-roja-paracas',
  },
]

export const FRAME_BORDER = 0.26
export const MAT_BORDER = 0.2

// ---- 02. Sistema Tipográfico (troika loads font files) ----
// primary sans (titles, UI) · editorial serif (Georgia≈Gelasio, body) ·
// Playfair reserved for brand/authorship + H3 subheaders
export const FONT_SANS = '/fonts/Manrope-Regular.ttf'
export const FONT_SANS_MEDIUM = '/fonts/Manrope-Medium.ttf'
export const FONT_SERIF = '/fonts/Gelasio-Regular.ttf'
export const FONT_SERIF_ITALIC = '/fonts/Gelasio-Italic.ttf'
export const FONT_BRAND = '/fonts/PlayfairDisplay-Regular.ttf'
export const FONT_BRAND_ITALIC = '/fonts/PlayfairDisplay-Italic.ttf'
/**
 * Playfair with its `lnum` (lining figures) feature baked into the default
 * glyphs. The shipped Playfair defaults to OLDSTYLE figures — 3/4/5/7/9 hang
 * below the baseline, 6/8 rise above, 0/1/2 sit at x-height — which makes a
 * countdown bounce. troika (0.52.4) exposes no OpenType feature switch, so the
 * substitution is baked into the file instead: the `lnum` lookup's mapping
 * rewritten straight into the cmap. Verified: digit height spread 202 → 5 units.
 * Use for any run of figures that has to sit on one line; prose keeps FONT_BRAND.
 */
export const FONT_BRAND_LINING = '/fonts/PlayfairDisplay-Lining.ttf'
/**
 * The ten digits of that same font as three.js typeface JSON — glyph OUTLINES,
 * not an SDF atlas, so they can be extruded and subtracted as real geometry
 * (the Countdown carves them into the wall). Baked from FONT_BRAND_LINING with
 * skia-pathops resolving overlaps first: the shipped 4/6/8/9 are single
 * self-intersecting contours that rely on non-zero winding, which a rasteriser
 * handles and a triangulator does not — without that pass their counters vanish.
 */
export const FONT_DIGITS_TYPEFACE = '/fonts/playfair-lining-digits.typeface.json'
// the [O] mark is always Helvetica, never the brand serif or the UI sans
export const FONT_HELVETICA = '/fonts/Helvetica-Regular.otf'

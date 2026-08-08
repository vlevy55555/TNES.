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

export type FrameStyle = 'gold' | 'white' | 'black'

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
export const OPENING_DATE = new Date('2026-08-15T18:00:00')

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
  statement: `I photograph the in-between. The pause. The threshold. The space where something shifts from one state to another. TNES. is the world that holds that moment.`,
  cta: 'Enter VSL',
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
    title: 'St Peter’s Pool',
    subtitle: 'Malta · 2025',
    description:
      'A limestone cove opening to the Mediterranean, held in the clear stillness of a summer afternoon.',
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
      'A lone runner mid-stride along the wet Ipanema shoreline, Dois Irmãos and the city dissolving into backlit sea haze.',
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
    title: 'Gozo Cave Girl',
    subtitle: 'Gozo, Malta · 2025',
    description:
      'A figure at the water’s edge, held between the dark of a sea cave and the open Mediterranean.',
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
    title: 'Mürren Foggy Cows',
    subtitle: 'Mürren, Switzerland · 2025',
    description:
      'Two cattle on a wet gravel track high in the Bernese Oberland, the alpine slope and the herd dissolving into fog.',
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
    title: 'Praia da Baleia',
    subtitle: 'São Paulo, Brazil · 2025',
    description:
      'A surfer cycling the empty morning beach, longboard under one arm, a forested island rising offshore.',
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
    title: 'Paracas Flat Dunes',
    subtitle: 'Paracas, Peru · 2025',
    description:
      'Flat desert dunes meeting the Pacific at Paracas, Peru.',
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
    title: 'Calpe Muralla Roja',
    subtitle: 'Calpe, Spain · 2025',
    description: 'The saturated geometry of La Muralla Roja in Calpe.',
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
    title: 'Moreira Crowded Beach',
    subtitle: 'Moreira, Portugal · 2025',
    description: 'A dense summer beach scene on the Portuguese coast.',
    price: PRICE,
    image: '/artworks/v1/moreira_crowdedbeach_2025_v1.webp',
    wallIndex: ARCHIVE_WALL,
    position: [0, -0.2, 0],
    size: FOUR_BY_FIVE,
    edition: EDITION,
    dimensions: DIMENSIONS,
    frameStyle: 'white',
    shopifyHandle: 'moreira-crowded-beach',
  },
  {
    id: 'florence-dogman',
    title: 'Florence Dog Man',
    subtitle: 'Florence, Italy · 2025',
    description: 'A quiet street portrait from Florence.',
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
    title: 'Ischia Mezzatorre',
    subtitle: 'Ischia, Italy · 2025',
    description: 'A view across Mezzatorre on the island of Ischia.',
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
    title: 'Ditch Plains Far',
    subtitle: 'Ditch Plains, New York · 2026',
    description: 'A distant view at Ditch Plains.',
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
    title: 'Appenzell Alpine Lake',
    subtitle: 'Appenzell, Switzerland · 2025',
    description: 'An alpine lake in Appenzell.',
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

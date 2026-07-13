export const WALL_SPACING = 10
export const CAMERA_Z = 7.9

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
}

export const walls: Wall[] = [
  { index: 0, name: 'Signature', roman: 'I', angle: 0 },
  { index: 1, name: 'Exhibition', roman: 'II', angle: -0.085 },
  { index: 2, name: 'Archive', roman: 'III', angle: 0.085 },
  { index: 3, name: 'Coming Soon', roman: 'IV', angle: -0.085 },
  // the personal closer: the artist's portrait + a doorway into VSL, his mind
  { index: 4, name: 'About', roman: 'V', angle: 0.085 },
]

export const SIGNATURE_WALL = 0
export const COMING_SOON_WALL = 3
export const ABOUT_WALL = 4
export const OPENING_DATE = new Date('2026-08-15T18:00:00')

// the About wall: Victor's portrait, a wall-text, and a link out to VSL — the
// immersive site that is the artist's mind behind this exhibition.
export const VSL_URL = 'https://vsl-vux0.onrender.com/'

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
  portraitSize: [1.2, 1.8] as [number, number],
  name: 'Victor Safdie Levy',
  role: 'PHOTOGRAPHER · FOUNDER OF TNES',
  body: `Every wall in this room is one pair of eyes. Victor makes photographs from the in-between — travel, memory, and the quiet geometry of a place. Here the work stands framed and still; to understand how it is seen, step inside his mind.`,
  cta: 'Understand the artist’s mind',
  ctaSub: 'Enter VSL — the immersive world behind the work',
  contact: {
    email: 'vlevy@tnes.studio',
    phone: '+1 917 445 4067',
    instagram: '@vlevy_',
    instagramUrl: 'https://instagram.com/vlevy_',
  },
}

// decorative hero on the signature wall: a single dimmed painting the VSL
// signature is written over. Not a sellable artwork — never in `artworks`.
export const HERO = {
  image: '/artworks/rio-runner.jpg',
  // z 0.07 seats the frame in front of the wall face (same as ArtworkFrame) —
  // at z 0 its front is coplanar with the wall and z-fights into dashes
  position: [0, 0.2, 0.07] as [number, number, number],
  size: [1.3, 0.87] as [number, number],
}
// camera distance when the intro opens "fully zoomed into" the hero frame,
// before it dollies back to the resting wall view
export const HERO_ZOOM_Z = 1.65

// ---- Artifacts of Time: the six works from the TNES. archive ----
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

export const artworks: Artwork[] = [
  {
    id: 'the-pool',
    title: 'The Pool',
    subtitle: 'Ischia, Italy · 2025',
    description:
      'Blue-and-white striped umbrellas over a clifftop pool, a lone swimmer below, the Tyrrhenian opening beyond the rocks.',
    price: PRICE,
    image: '/artworks/ischia-pool.jpg',
    wallIndex: 1,
    position: [-2.5, 0.3, 0],
    size: PORTRAIT,
    edition: EDITION,
    dimensions: DIMENSIONS,
  },
  {
    id: 'runner',
    title: 'Runner',
    subtitle: 'Ipanema, Rio de Janeiro, Brazil · 2025',
    description:
      'A lone runner mid-stride along the wet Ipanema shoreline, Dois Irmãos and the city dissolving into backlit sea haze.',
    price: PRICE,
    image: '/artworks/rio-runner.jpg',
    wallIndex: 1,
    position: [0.1, -0.5, 0],
    size: LANDSCAPE,
    edition: EDITION,
    dimensions: DIMENSIONS,
  },
  {
    id: 'wied-il-ghasri',
    title: 'Wied il-Għasri',
    subtitle: 'Gozo, Malta · 2025',
    description:
      'A single swimmer in the emerald channel cut between sheer limestone cliffs — the sea reaching inland through stone.',
    price: PRICE,
    image: '/artworks/wied-il-ghasri.jpg',
    wallIndex: 1,
    position: [2.45, 0.45, 0],
    size: LANDSCAPE,
    edition: EDITION,
    dimensions: DIMENSIONS,
  },
  {
    id: 'lauterbrunnen',
    title: 'Lauterbrunnen',
    subtitle: 'Lauterbrunnen, Switzerland · 2025',
    description:
      'Two cattle on a wet gravel track high in the Bernese Oberland, the alpine slope and the herd dissolving into fog.',
    price: PRICE,
    image: '/artworks/lauterbrunnen.jpg',
    wallIndex: 2,
    position: [-2.4, 0.2, 0],
    size: PORTRAIT,
    edition: EDITION,
    dimensions: DIMENSIONS,
  },
  {
    id: 'praia-da-baleia',
    title: 'Praia da Baleia',
    subtitle: 'São Paulo, Brazil · 2025',
    description:
      'A surfer cycling the empty morning beach, longboard under one arm, a forested island rising offshore.',
    price: PRICE,
    image: '/artworks/praia-da-baleia.jpg',
    wallIndex: 2,
    position: [0, -0.2, 0],
    size: LANDSCAPE,
    edition: EDITION,
    dimensions: DIMENSIONS,
  },
  {
    id: 'playa-roja',
    title: 'Playa Roja',
    subtitle: 'Paracas, Peru · 2025',
    description:
      'Red volcanic sand meeting turquoise water beneath the desert cliffs of the Paracas reserve.',
    price: PRICE,
    image: '/artworks/playa-roja.jpg',
    wallIndex: 2,
    position: [2.45, 0.3, 0],
    size: LANDSCAPE,
    edition: EDITION,
    dimensions: DIMENSIONS,
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

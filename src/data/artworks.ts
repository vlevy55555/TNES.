import { cms } from './cms'

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

// Everything below that a person would want to change — the works, the
// contact details, the About text — comes from the Studio (src/data/cms.ts).
// The names stay the ones the 3D gallery and the shop have always imported.

// the opening (Signature) wall's one-line brand statement, cut into the concrete
export const BRAND_STATEMENT = cms.settings.brandStatement

// the signature work: first in the home hero, hung alone on the opening wall,
// and the picture a shared link to a page without its own work shows
export const HERO_ID = cms.home.heroIds[0]

// the About wall: Victor's portrait, a wall-text, and a link out to VSL — the
// immersive site that is the artist's mind behind this exhibition.
export const VSL_URL = cms.about.ctaUrl

export const INQUIRY_EMAIL = cms.settings.inquiryEmail
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
  // Only the 3D About wall hangs it, so it stays a file rather than CMS content.
  portrait: '/victor-headshot-bw.webp',
  // hung nearly floor-to-eye, the way the reference frames him
  portraitSize: [1.8, 2.7] as [number, number],
  name: 'Victor Safdie Levy',
  role: cms.about.role,
  // one first-person block, in his voice
  statement: cms.about.statement,
  // the one label for the doorway out to VSL — the 3D wall and /about both read
  // it from here, so the two surfaces cannot say different things
  cta: cms.about.ctaLabel,
  contact: {
    email: cms.settings.inquiryEmail,
    phone: cms.settings.phone,
    instagram: cms.settings.instagramHandle,
    instagramUrl: cms.settings.instagramUrl,
  },
}

// Not edited per work: the archive publishes no public price, and the print
// sizes are the store's standard three.
const DIMENSIONS = '60 × 84 · 42 × 60 · 30 × 42 cm'
const PRICE = 'Price on request'

// Frame `size` follows each photograph's true aspect so nothing distorts. The
// three shapes the archive has shot keep the exact proportions the 3D room was
// tuned with; anything else scales from the same long edge.
const LANDSCAPE: [number, number] = [1.42, 0.95]
const PORTRAIT: [number, number] = [0.95, 1.42]
const FOUR_BY_FIVE: [number, number] = [1, 1.25]
const frameSizeFor = (width: number, height: number): [number, number] => {
  const aspect = width / height
  const near = (target: number) => Math.abs(aspect - target) < 0.03
  if (near(3 / 2)) return LANDSCAPE
  if (near(2 / 3)) return PORTRAIT
  if (near(4 / 5)) return FOUR_BY_FIVE
  return aspect >= 1 ? [1.42, 1.42 / aspect] : [1.42 * aspect, 1.42]
}

// Where a work hangs when the 3D room places it by itself: left, centre, right
// of the Prints wall, in turn. The Archive's own slots override this.
const HANG: [number, number, number][] = [[-2.5, 0.3, 0], [0, -0.2, 0], [2.45, 0.3, 0]]

/** Every published work, in the order the Studio lists them. */
export const artworks: Artwork[] = cms.artworks.map((work, index) => ({
  id: work.id,
  title: work.title,
  subtitle: `${work.location} · ${work.year}`,
  description: work.description,
  price: PRICE,
  image: work.image,
  wallIndex: ARCHIVE_WALL,
  position: HANG[index % HANG.length],
  size: frameSizeFor(work.imageWidth, work.imageHeight),
  edition: work.edition,
  dimensions: DIMENSIONS,
  frameStyle: 'white',
  shopifyHandle: work.shopifyHandle || undefined,
}))

export const FRAME_BORDER = 0.26

// ---- 02. Sistema Tipográfico (troika loads font files) ----
// primary sans (titles, UI) · editorial serif (Georgia≈Gelasio, body) ·
// Playfair reserved for brand/authorship + H3 subheaders
export const FONT_SANS = '/fonts/Manrope-Regular.ttf'
export const FONT_SANS_MEDIUM = '/fonts/Manrope-Medium.ttf'
export const FONT_SERIF = '/fonts/Gelasio-Regular.ttf'
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

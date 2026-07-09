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
  { index: 0, name: 'Exhibition', roman: 'I', angle: -0.085 },
  { index: 1, name: 'Archive', roman: 'II', angle: 0.085 },
]

export const artworks: Artwork[] = [
  {
    id: 'blue-parasols',
    title: 'Blue Parasols',
    subtitle: 'Taormina, 2026',
    description:
      'Striped parasols over a volcanic cove — leisure arranged in perfect geometry.',
    price: '£350',
    image: '/artworks/blue-parasols.jpg',
    wallIndex: 0,
    position: [-2.5, 0.3, 0],
    size: [1.0, 1.5],
    edition: 'Limited edition of 30',
    dimensions: '40 × 60 cm',
  },
  {
    id: 'high-season',
    title: 'High Season',
    subtitle: "St Peter's Pool, Malta, 2026",
    description:
      'A limestone amphitheatre of swimmers — collective energy at the edge of the sea.',
    price: '£420',
    image: '/artworks/high-season.jpg',
    wallIndex: 0,
    position: [0.1, -0.5, 0],
    size: [1.35, 0.9],
    edition: 'Limited edition of 25',
    dimensions: '50 × 35 cm',
  },
  {
    id: 'coastal-run',
    title: 'Coastal Run',
    subtitle: 'Rio de Janeiro, 2025',
    description:
      'A quiet coastal scene balancing distance, atmosphere and motion.',
    price: '£500',
    image: '/artworks/coastal-run.jpg',
    wallIndex: 0,
    position: [2.45, 0.45, 0],
    size: [1.3, 0.87],
    edition: 'Limited edition of 20',
    dimensions: '50 × 35 cm',
  },
  {
    id: 'urban-texture',
    title: 'Urban Texture',
    subtitle: 'Calpe, 2026',
    description:
      'A study of architectural texture, shadow and urban repetition.',
    price: '£380',
    image: '/artworks/urban-texture.jpg',
    wallIndex: 1,
    position: [-2.4, 0.2, 0],
    size: [1.0, 1.5],
    edition: 'Limited edition of 30',
    dimensions: '40 × 60 cm',
  },
  {
    id: 'still-morning',
    title: 'Still Morning',
    subtitle: 'Bernese Alps, 2025',
    description:
      'Two silhouettes in the fog — a mountain path dissolving into white.',
    price: '£340',
    image: '/artworks/still-morning.jpg',
    wallIndex: 1,
    position: [0, -0.2, 0],
    size: [0.9, 1.35],
    edition: 'Limited edition of 40',
    dimensions: '35 × 52 cm',
  },
  {
    id: 'city-silence',
    title: 'City Silence',
    subtitle: 'Florence, 2026',
    description:
      'An afternoon pause on old stone — a man, his dog and the heat.',
    price: '£460',
    image: '/artworks/city-silence.jpg',
    wallIndex: 1,
    position: [2.45, 0.3, 0],
    size: [1.1, 1.65],
    edition: 'Limited edition of 20',
    dimensions: '45 × 67 cm',
  },
]

export const FRAME_BORDER = 0.26
export const MAT_BORDER = 0.2

export const SERIF = '/fonts/PlayfairDisplay-Regular.ttf'
export const SERIF_ITALIC = '/fonts/PlayfairDisplay-Italic.ttf'

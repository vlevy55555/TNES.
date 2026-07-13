import { create } from 'zustand'
import { artworks, walls } from '../data/artworks'

// mobile browses one frame at a time. Flatten the walls into a linear "reel" of
// stops: every artwork is its own stop, and an art-less wall (Signature, Coming
// Soon, About) is a single whole-wall stop. The nav arrows walk this reel.
export type Stop = { wall: number; artwork: string | null }
export const mobileStops: Stop[] = walls.flatMap((w): Stop[] => {
  const arts = artworks
    .filter((a) => a.wallIndex === w.index)
    .sort((a, b) => a.position[0] - b.position[0])
  return arts.length
    ? arts.map((a) => ({ wall: w.index, artwork: a.id }))
    : [{ wall: w.index, artwork: null }]
})

const firstArtworkOf = (wall: number) =>
  mobileStops.find((s) => s.wall === wall)?.artwork ?? null

export const stopIndexOf = (wall: number, focus: string | null) => {
  const i = mobileStops.findIndex((s) =>
    focus ? s.artwork === focus : s.wall === wall && s.artwork === null,
  )
  return i === -1 ? Math.max(0, mobileStops.findIndex((s) => s.wall === wall)) : i
}

const mqIsMobile = () =>
  window.matchMedia('(max-width: 700px), (orientation: portrait)').matches

const params = new URLSearchParams(window.location.search)
const deepLinked = artworks.find((a) => a.id === params.get('artwork'))
const initialArtwork = deepLinked?.id ?? null
// a deep-linked artwork dictates the wall, so closing the panel stays on it
const initialWall =
  deepLinked?.wallIndex ??
  Math.min(
    Math.max(Math.trunc(Number(params.get('wall')) || 0), 0),
    walls.length - 1,
  )
type GalleryState = {
  currentWall: number
  selectedArtworkId: string | null
  goToWall: (index: number) => void
  goToNextWall: () => void
  goToPreviousWall: () => void
  selectArtwork: (id: string) => void
  closeArtwork: () => void
}

export const useGalleryStore = create<GalleryState>((set, get) => ({
  currentWall: initialWall,
  selectedArtworkId: initialArtwork,

  goToWall: (index) =>
    set({
      currentWall: Math.min(Math.max(index, 0), walls.length - 1),
      selectedArtworkId: null,
    }),

  goToNextWall: () =>
    set({
      currentWall: Math.min(get().currentWall + 1, walls.length - 1),
      selectedArtworkId: null,
    }),

  goToPreviousWall: () =>
    set({
      currentWall: Math.max(get().currentWall - 1, 0),
      selectedArtworkId: null,
    }),

  selectArtwork: (id) => set({ selectedArtworkId: id }),

  closeArtwork: () => set({ selectedArtworkId: null }),
}))

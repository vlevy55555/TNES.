import { create } from 'zustand'
import { artworks, walls } from '../data/artworks'

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

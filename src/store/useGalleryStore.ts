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
  // the frame being browsed on mobile (camera focus); null on an art-less wall
  focusArtworkId: string | null
  isMobile: boolean
  manifestoOpen: boolean
  // inquiry form: which artwork it was opened from (null = general inquiry)
  inquiryOpen: boolean
  inquiryWorkId: string | null
  openInquiry: (workId?: string | null) => void
  closeInquiry: () => void
  setIsMobile: (v: boolean) => void
  goToWall: (index: number) => void
  goToNextWall: () => void
  goToPreviousWall: () => void
  selectArtwork: (id: string) => void
  closeArtwork: () => void
  openManifesto: () => void
  closeManifesto: () => void
}

export const useGalleryStore = create<GalleryState>((set, get) => {
  // step the mobile reel by ±1 stop, clamped
  const stepStop = (dir: 1 | -1) => {
    const { currentWall, focusArtworkId } = get()
    const idx = stopIndexOf(currentWall, focusArtworkId)
    const next = Math.min(Math.max(idx + dir, 0), mobileStops.length - 1)
    const stop = mobileStops[next]
    set({
      currentWall: stop.wall,
      focusArtworkId: stop.artwork,
      selectedArtworkId: null,
    })
  }

  return {
    currentWall: initialWall,
    selectedArtworkId: initialArtwork,
    focusArtworkId: deepLinked?.id ?? firstArtworkOf(initialWall),
    isMobile: mqIsMobile(),
    manifestoOpen: false,
    inquiryOpen: false,
    inquiryWorkId: null,

    // the letter just overlays the current view — leave the gallery framing untouched
    openInquiry: (workId = null) => set({ inquiryOpen: true, inquiryWorkId: workId }),
    closeInquiry: () => set({ inquiryOpen: false }),

    setIsMobile: (v) =>
      set((s) => ({
        isMobile: v,
        // entering mobile with nothing focused on an art wall: focus its first
        focusArtworkId: v && !s.focusArtworkId ? firstArtworkOf(s.currentWall) : s.focusArtworkId,
      })),

    goToWall: (index) => {
      const wall = Math.min(Math.max(index, 0), walls.length - 1)
      set({ currentWall: wall, focusArtworkId: firstArtworkOf(wall), selectedArtworkId: null })
    },

    goToNextWall: () => {
      if (get().isMobile) return stepStop(1)
      const wall = Math.min(get().currentWall + 1, walls.length - 1)
      set({ currentWall: wall, focusArtworkId: firstArtworkOf(wall), selectedArtworkId: null })
    },

    goToPreviousWall: () => {
      if (get().isMobile) return stepStop(-1)
      const wall = Math.max(get().currentWall - 1, 0)
      set({ currentWall: wall, focusArtworkId: firstArtworkOf(wall), selectedArtworkId: null })
    },

    selectArtwork: (id) => set({ selectedArtworkId: id, focusArtworkId: id }),

    closeArtwork: () => set({ selectedArtworkId: null }),

    openManifesto: () => set({ manifestoOpen: true }),

    closeManifesto: () => set({ manifestoOpen: false }),
  }
})

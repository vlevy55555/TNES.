import { create } from 'zustand'
import { artworks, SIGNATURE_WALL, walls } from '../data/artworks'

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

/**
 * Where to point the camera when a frame is zoomed, in WORLD space. The archive
 * hangs the same work more than once at different slots and scales, so the
 * artwork's own on-wall position can't say which copy was clicked — the frame
 * reports its actual transform instead. null = frame the work on its wall.
 */
export type ZoomAt = { x: number; y: number; z: number; scale: number }

type GalleryState = {
  currentWall: number
  selectedArtworkId: string | null
  // the frame being browsed on mobile (camera focus); null on an art-less wall
  focusArtworkId: string | null
  // the archive is a place, not a wall: it hangs off the opening wall's scroll
  // scrub, to its left. This mirrors that scrub so the header and arrows can
  // both drive it and reflect it.
  inArchive: boolean
  zoomAt: ZoomAt | null
  enterArchive: () => void
  exitArchive: () => void
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
  selectArtwork: (id: string, zoomAt?: ZoomAt | null) => void
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
      inArchive: false,
      zoomAt: null,
    })
  }

  return {
    currentWall: initialWall,
    selectedArtworkId: initialArtwork,
    focusArtworkId: deepLinked?.id ?? firstArtworkOf(initialWall),
    inArchive: false,
    zoomAt: null,
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

    // the archive lives off the opening wall's scrub, so entering it means being
    // on that wall with the scrub run to the end
    enterArchive: () =>
      set({
        inArchive: true,
        currentWall: SIGNATURE_WALL,
        selectedArtworkId: null,
        zoomAt: null,
      }),

    exitArchive: () => set({ inArchive: false, selectedArtworkId: null, zoomAt: null }),

    goToWall: (index) => {
      const wall = Math.min(Math.max(index, 0), walls.length - 1)
      set({
        currentWall: wall,
        focusArtworkId: firstArtworkOf(wall),
        selectedArtworkId: null,
        inArchive: false,
        zoomAt: null,
      })
    },

    goToNextWall: () => {
      // stepping forward out of the archive lands back on the opening wall
      if (get().inArchive) return get().exitArchive()
      if (get().isMobile) return stepStop(1)
      const wall = Math.min(get().currentWall + 1, walls.length - 1)
      set({ currentWall: wall, focusArtworkId: firstArtworkOf(wall), selectedArtworkId: null })
    },

    goToPreviousWall: () => {
      const { inArchive, isMobile, currentWall, focusArtworkId } = get()
      if (inArchive) return // the archive is the leftmost place in the room
      // the archive hangs to the LEFT of the opening wall, so stepping back from
      // the very first stop walks into it instead of dead-ending
      const atStart = isMobile
        ? stopIndexOf(currentWall, focusArtworkId) === 0
        : currentWall === 0
      if (atStart) return get().enterArchive()
      if (isMobile) return stepStop(-1)
      const wall = Math.max(currentWall - 1, 0)
      set({ currentWall: wall, focusArtworkId: firstArtworkOf(wall), selectedArtworkId: null })
    },

    selectArtwork: (id, zoomAt = null) =>
      set({ selectedArtworkId: id, focusArtworkId: id, zoomAt }),

    closeArtwork: () => set({ selectedArtworkId: null, zoomAt: null }),

    openManifesto: () => set({ manifestoOpen: true }),

    closeManifesto: () => set({ manifestoOpen: false }),
  }
})

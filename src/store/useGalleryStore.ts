import { create } from 'zustand'
import { artworks, SIGNATURE_WALL, walls } from '../data/artworks'

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

export const useGalleryStore = create<GalleryState>((set, get) => ({
  currentWall: initialWall,
  selectedArtworkId: initialArtwork,
  inArchive: false,
  zoomAt: null,
  isMobile: mqIsMobile(),
  manifestoOpen: false,
  inquiryOpen: false,
  inquiryWorkId: null,

  // the letter just overlays the current view — leave the gallery framing untouched
  openInquiry: (workId = null) => set({ inquiryOpen: true, inquiryWorkId: workId }),
  closeInquiry: () => set({ inquiryOpen: false }),

  setIsMobile: (v) => set({ isMobile: v }),

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
    set({ currentWall: wall, selectedArtworkId: null, inArchive: false, zoomAt: null })
  },

  goToNextWall: () => {
    // stepping forward out of the archive lands back on the opening wall
    if (get().inArchive) return get().exitArchive()
    const wall = Math.min(get().currentWall + 1, walls.length - 1)
    set({ currentWall: wall, selectedArtworkId: null })
  },

  goToPreviousWall: () => {
    const { inArchive, currentWall } = get()
    if (inArchive) return // the archive is the leftmost place in the room
    // the archive hangs to the LEFT of the opening wall, so stepping back from
    // the first wall walks into it instead of dead-ending
    if (currentWall === 0) return get().enterArchive()
    set({ currentWall: currentWall - 1, selectedArtworkId: null })
  },

  selectArtwork: (id, zoomAt = null) => set({ selectedArtworkId: id, zoomAt }),

  closeArtwork: () => set({ selectedArtworkId: null, zoomAt: null }),

  openManifesto: () => set({ manifestoOpen: true }),

  closeManifesto: () => set({ manifestoOpen: false }),
}))

import { create } from 'zustand'
import { ARCHIVE_WALL, artworks, walls, type FrameStyle } from '../data/artworks'

const mqIsMobile = () =>
  window.matchMedia('(max-width: 700px), (orientation: portrait)').matches

const params = new URLSearchParams(window.location.search)
const deepLinked = artworks.find((a) => a.id === params.get('artwork'))
const initialArtwork = deepLinked?.id ?? null
const initialFrameStyle: PreviewFrameStyle = deepLinked?.frameStyle === 'white' ? 'white' : 'black'
// a deep-linked artwork dictates the wall, so closing the panel stays on it
const initialWall =
  (deepLinked ? ARCHIVE_WALL : undefined) ??
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
export type PreviewFrameStyle = Extract<FrameStyle, 'black' | 'white'>

type GalleryState = {
  currentWall: number
  selectedArtworkId: string | null
  selectedFrameStyle: PreviewFrameStyle
  /**
   * How large the inspected print hangs, relative to its middle size. The panel
   * drives it from the chosen Shopify size so picking a smaller print visibly
   * shrinks the work on the wall and a larger one grows it. 1 = the middle size.
   */
  previewScale: number
  setPreviewScale: (v: number) => void
  zoomAt: ZoomAt | null
  manifestoRoomOpen: boolean
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
  setSelectedFrameStyle: (style: PreviewFrameStyle) => void
  closeArtwork: () => void
  openManifestoRoom: () => void
  closeManifestoRoom: () => void
  openManifesto: () => void
  closeManifesto: () => void
  // leaving for VSL: the signature writes itself, then the site navigates
  vslExitActive: boolean
  startVslExit: () => void
}

export const useGalleryStore = create<GalleryState>((set, get) => ({
  currentWall: initialWall,
  selectedArtworkId: initialArtwork,
  selectedFrameStyle: initialFrameStyle,
  previewScale: 1,
  setPreviewScale: (v) => set({ previewScale: v }),
  zoomAt: null,
  manifestoRoomOpen: false,
  isMobile: mqIsMobile(),
  manifestoOpen: false,
  inquiryOpen: false,
  inquiryWorkId: null,

  // the letter just overlays the current view — leave the gallery framing untouched
  openInquiry: (workId = null) => set({ inquiryOpen: true, inquiryWorkId: workId }),
  closeInquiry: () => set({ inquiryOpen: false }),

  setIsMobile: (v) => set({ isMobile: v }),

  goToWall: (index) => {
    const wall = Math.min(Math.max(index, 0), walls.length - 1)
    set({ currentWall: wall, selectedArtworkId: null, zoomAt: null, manifestoRoomOpen: false })
  },

  goToNextWall: () => {
    const wall = Math.min(get().currentWall + 1, walls.length - 1)
    set({ currentWall: wall, selectedArtworkId: null, manifestoRoomOpen: false })
  },

  goToPreviousWall: () => {
    const wall = Math.max(get().currentWall - 1, 0)
    set({ currentWall: wall, selectedArtworkId: null, manifestoRoomOpen: false })
  },

  selectArtwork: (id, zoomAt = null) => {
    const artwork = artworks.find((item) => item.id === id)
    set({
      selectedArtworkId: id,
      selectedFrameStyle: artwork?.frameStyle === 'white' ? 'white' : 'black',
      previewScale: 1,
      zoomAt,
    })
  },
  setSelectedFrameStyle: (style) => set({ selectedFrameStyle: style }),

  closeArtwork: () => set({ selectedArtworkId: null, zoomAt: null, previewScale: 1 }),

  openManifestoRoom: () =>
    set({ currentWall: ARCHIVE_WALL - 1, selectedArtworkId: null, zoomAt: null, manifestoRoomOpen: true }),
  closeManifestoRoom: () =>
    set({ currentWall: 0, selectedArtworkId: null, zoomAt: null, manifestoRoomOpen: false }),

  openManifesto: () => set({ manifestoOpen: true }),

  closeManifesto: () => set({ manifestoOpen: false }),

  vslExitActive: false,
  startVslExit: () => set({ vslExitActive: true }),
}))

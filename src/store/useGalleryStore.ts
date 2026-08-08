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
export type PrintsIntroPhase = 'hidden' | 'entering' | 'active' | 'exiting'

type PendingIntroArtwork = { id: string; zoomAt: ZoomAt | null }

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
  /**
   * Which half of the Prints hang is showing. A phone can't hold twelve works
   * at a legible size, so on mobile that wall becomes two screens of six and
   * the wall arrows step through them before moving on. Ignored on desktop,
   * which hangs all twelve at once.
   */
  printsPage: 0 | 1
  printsIntroPhase: PrintsIntroPhase
  /** Resets on a full page load, but prevents a repeat when returning to Prints. */
  printsIntroSeen: boolean
  pendingIntroArtwork: PendingIntroArtwork | null
  setPrintsIntroActive: () => void
  selectArtworkFromPrintsIntro: (id: string, zoomAt?: ZoomAt | null) => void
  dismissPrintsIntro: () => void
  finishPrintsIntro: () => void
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
  printsPage: 0,
  printsIntroPhase: 'hidden',
  printsIntroSeen: true,
  pendingIntroArtwork: null,
  manifestoOpen: false,
  inquiryOpen: false,
  inquiryWorkId: null,

  // the letter just overlays the current view — leave the gallery framing untouched
  openInquiry: (workId = null) => set({ inquiryOpen: true, inquiryWorkId: workId }),
  closeInquiry: () => set({ inquiryOpen: false }),

  setIsMobile: (v) => set({ isMobile: v }),

  goToWall: (index) => {
    const wall = Math.min(Math.max(index, 0), walls.length - 1)
    set({
      currentWall: wall,
      selectedArtworkId: null,
      zoomAt: null,
      manifestoRoomOpen: false,
      printsPage: 0,
      printsIntroPhase: 'hidden',
      printsIntroSeen: true,
      pendingIntroArtwork: null,
    })
  },

  goToNextWall: () => {
    const { currentWall, isMobile, printsPage } = get()
    // mobile hangs Prints as two screens of six — walk them before leaving
    if (isMobile && currentWall === ARCHIVE_WALL && printsPage === 0) {
      return set({ printsPage: 1, selectedArtworkId: null, zoomAt: null })
    }
    const wall = Math.min(currentWall + 1, walls.length - 1)
    const showPrintsIntro = wall === ARCHIVE_WALL && !get().printsIntroSeen
    set({
      currentWall: wall,
      selectedArtworkId: null,
      zoomAt: null,
      manifestoRoomOpen: false,
      printsPage: 0,
      printsIntroPhase: showPrintsIntro ? 'entering' : 'hidden',
      printsIntroSeen: get().printsIntroSeen || showPrintsIntro,
      pendingIntroArtwork: null,
    })
  },

  goToPreviousWall: () => {
    const { currentWall, isMobile, printsPage } = get()
    if (isMobile && currentWall === ARCHIVE_WALL && printsPage === 1) {
      return set({ printsPage: 0, selectedArtworkId: null, zoomAt: null })
    }
    const wall = Math.max(currentWall - 1, 0)
    const showPrintsIntro = wall === ARCHIVE_WALL && !get().printsIntroSeen
    set({
      currentWall: wall,
      selectedArtworkId: null,
      zoomAt: null,
      manifestoRoomOpen: false,
      // stepping back INTO Prints lands on its last screen, the one nearest
      // the wall you came from
      printsPage: isMobile && wall === ARCHIVE_WALL ? 1 : 0,
      printsIntroPhase: showPrintsIntro ? 'entering' : 'hidden',
      printsIntroSeen: get().printsIntroSeen || showPrintsIntro,
      pendingIntroArtwork: null,
    })
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
  setPrintsIntroActive: () => {
    if (get().printsIntroPhase === 'entering') set({ printsIntroPhase: 'active' })
  },
  selectArtworkFromPrintsIntro: (id, zoomAt = null) => {
    const phase = get().printsIntroPhase
    if (phase === 'hidden' || phase === 'exiting') return
    set({ printsIntroPhase: 'exiting', pendingIntroArtwork: { id, zoomAt } })
  },
  dismissPrintsIntro: () => {
    const phase = get().printsIntroPhase
    if (phase === 'hidden' || phase === 'exiting') return
    set({ printsIntroPhase: 'exiting', pendingIntroArtwork: null })
  },
  finishPrintsIntro: () => {
    const pending = get().pendingIntroArtwork
    const artwork = pending ? artworks.find((item) => item.id === pending.id) : undefined
    set({
      printsIntroPhase: 'hidden',
      pendingIntroArtwork: null,
      ...(pending
        ? {
            selectedArtworkId: pending.id,
            selectedFrameStyle: artwork?.frameStyle === 'white' ? 'white' : 'black',
            previewScale: 1,
            zoomAt: pending.zoomAt,
          }
        : {}),
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

import { useEffect } from 'react'
import { GalleryCanvas } from './components/gallery/GalleryCanvas'
import { VslExitOverlay } from './components/gallery/VslExitOverlay'
import { Header } from './components/ui/Header'
import { Footer } from './components/ui/Footer'
import { WallNavigation } from './components/ui/WallNavigation'
import { ArtworkPanel } from './components/ui/ArtworkPanel'
import { useGalleryStore } from './store/useGalleryStore'

export default function App() {
  const selectedArtworkId = useGalleryStore((s) => s.selectedArtworkId)
  const inquiryOpen = useGalleryStore((s) => s.inquiryOpen)

  // keep the store's mobile flag in sync with the layout (same query as the CSS)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 700px), (orientation: portrait)')
    const apply = () => useGalleryStore.getState().setIsMobile(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  // Returning from VSL can restore this page from the browser's back-forward
  // cache with the Zustand state intact. Always remove the signature veil when
  // the gallery becomes the active history entry again.
  useEffect(() => {
    const resetExit = () => useGalleryStore.getState().resetVslExit()
    resetExit()
    window.addEventListener('pageshow', resetExit)
    return () => window.removeEventListener('pageshow', resetExit)
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const {
        selectedArtworkId,
        manifestoOpen,
        manifestoRoomOpen,
        inquiryOpen,
        goToNextWall,
        goToPreviousWall,
        closeArtwork,
        closeManifesto,
        closeManifestoRoom,
        openManifestoRoom,
        closeInquiry,
      } = useGalleryStore.getState()
      if (e.key === 'Escape') {
        closeInquiry()
        closeManifesto()
        if (manifestoRoomOpen) closeManifestoRoom()
        closeArtwork()
      }
      if (inquiryOpen || manifestoOpen || selectedArtworkId) return
      if (manifestoRoomOpen) {
        if (e.key === 'ArrowRight') closeManifestoRoom()
        return
      }
      if (e.key === 'ArrowRight') goToNextWall()
      if (e.key === 'ArrowLeft') {
        if (useGalleryStore.getState().currentWall === 0) openManifestoRoom()
        else goToPreviousWall()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <GalleryCanvas />
      <div className="light-overlay" />
      <div className={`dim ${selectedArtworkId && !inquiryOpen ? 'dim-on' : ''}`} />
      <Header />
      <WallNavigation />
      <ArtworkPanel />
      <Footer />
      <VslExitOverlay />
    </>
  )
}

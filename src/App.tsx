import { useEffect } from 'react'
import { GalleryCanvas } from './components/gallery/GalleryCanvas'
import { SignatureOverlay } from './components/gallery/SignatureOverlay'
import { Manifesto } from './components/gallery/Manifesto'
import { Header } from './components/ui/Header'
import { Footer } from './components/ui/Footer'
import { WallNavigation } from './components/ui/WallNavigation'
import { ArtworkPanel } from './components/ui/ArtworkPanel'
import { CartDrawer } from './components/ui/CartDrawer'
import { useGalleryStore } from './store/useGalleryStore'
import { useCartStore } from './store/useCartStore'

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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const {
        selectedArtworkId,
        manifestoOpen,
        inquiryOpen,
        goToNextWall,
        goToPreviousWall,
        closeArtwork,
        closeManifesto,
        closeInquiry,
      } = useGalleryStore.getState()
      const cartOpen = useCartStore.getState().open
      if (e.key === 'Escape') {
        if (cartOpen) return useCartStore.getState().setOpen(false)
        closeInquiry()
        closeManifesto()
        closeArtwork()
      }
      if (cartOpen || inquiryOpen || manifestoOpen || selectedArtworkId) return
      if (e.key === 'ArrowRight') goToNextWall()
      if (e.key === 'ArrowLeft') goToPreviousWall()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <GalleryCanvas />
      <div className="light-overlay" />
      <SignatureOverlay />
      <Manifesto />
      <div className={`dim ${selectedArtworkId && !inquiryOpen ? 'dim-on' : ''}`} />
      <Header />
      <WallNavigation />
      <ArtworkPanel />
      <CartDrawer />
      <Footer />
    </>
  )
}

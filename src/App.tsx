import { useEffect } from 'react'
import { GalleryCanvas } from './components/gallery/GalleryCanvas'
import { Header } from './components/ui/Header'
import { Footer } from './components/ui/Footer'
import { WallNavigation } from './components/ui/WallNavigation'
import { ArtworkPanel } from './components/ui/ArtworkPanel'
import { useGalleryStore } from './store/useGalleryStore'

export default function App() {
  const selectedArtworkId = useGalleryStore((s) => s.selectedArtworkId)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const { selectedArtworkId, goToNextWall, goToPreviousWall, closeArtwork } =
        useGalleryStore.getState()
      if (e.key === 'Escape') closeArtwork()
      if (selectedArtworkId) return
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
      <div className={`dim ${selectedArtworkId ? 'dim-on' : ''}`} />
      <Header />
      <WallNavigation />
      <ArtworkPanel />
      <Footer />
    </>
  )
}

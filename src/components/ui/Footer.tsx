import { ABOUT, ARCHIVE_WALL } from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'

export function Footer() {
  const goToWall = useGalleryStore((s) => s.goToWall)
  const openInquiry = useGalleryStore((s) => s.openInquiry)
  const startVslExit = useGalleryStore((s) => s.startVslExit)

  return (
    <footer className="footer">
      <p className="footer-tagline">photographs found in the in-between, made to live with.</p>
      <div className="footer-links">
        <button onClick={() => goToWall(ARCHIVE_WALL)}>prints</button>
        <button onClick={startVslExit}>about</button>
        <a href={ABOUT.contact.instagramUrl} target="_blank" rel="noopener noreferrer">
          instagram
        </a>
        <button onClick={() => openInquiry()}>inquiries</button>
      </div>
    </footer>
  )
}

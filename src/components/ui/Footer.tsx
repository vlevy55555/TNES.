import { ABOUT, ABOUT_WALL, ARCHIVE_WALL } from '../../data/artworks'
import { useGalleryStore } from '../../store/useGalleryStore'

export function Footer() {
  const goToWall = useGalleryStore((s) => s.goToWall)
  const openInquiry = useGalleryStore((s) => s.openInquiry)

  return (
    <footer className="footer">
      <p className="footer-tagline">photographs found in the in-between, made to live with.</p>
      <div className="footer-links">
        <button onClick={() => goToWall(ARCHIVE_WALL)}>archive</button>
        <button onClick={() => goToWall(ABOUT_WALL)}>about</button>
        <a href={ABOUT.contact.instagramUrl} target="_blank" rel="noopener noreferrer">
          instagram
        </a>
        <button onClick={() => openInquiry()}>inquiries</button>
      </div>
    </footer>
  )
}

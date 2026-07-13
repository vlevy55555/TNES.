import { useGalleryStore } from '../../store/useGalleryStore'

// the manifesto, revealed when the rolled scroll is unrolled (ManifestoScroll)
export function Manifesto() {
  const open = useGalleryStore((s) => s.manifestoOpen)
  const closeManifesto = useGalleryStore((s) => s.closeManifesto)
  if (!open) return null

  return (
    <div className="manifesto-overlay" onClick={closeManifesto}>
      <div className="manifesto-scroll" onClick={(e) => e.stopPropagation()}>
        <button className="manifesto-close" onClick={closeManifesto}>
          Close
        </button>
        <div className="scroll-roller" />
        {/* grid 0fr→1fr unrolls the sheet top-to-bottom without distorting text */}
        <div className="scroll-reveal">
          <div className="scroll-body">
            <div className="scroll-sheet">
              <h2 className="manifesto-title">
                TN<span className="manifesto-mark">[O]</span>ES.
              </h2>
              <p className="manifesto-pron">pronounced tones.</p>

              <p>
                i've spent most of my life in the in between. between cultures,
                countries, languages, and ways of seeing.
              </p>
              <p>
                the name comes from brazil. my cousins call me Tones, short for
                Vitones, a nickname for Victor.
              </p>
              <p>
                TNES. is tones with the o extracted. the [O] becomes the mark.
              </p>
              <p>
                on family trips and long walks through unfamiliar places, i
                started collecting moments before i knew what they were becoming.
              </p>
              <p>people, light, gestures, distance, atmosphere.</p>
              <p>
                each photograph is an artifact of time. a way of seeing real
                life as something worth collecting.
              </p>

              <p className="manifesto-sign">— Vitones (vee · toh · nes)</p>
              <p className="manifesto-author">by Victor Safdie Levy</p>
            </div>
            <div className="scroll-roller" />
          </div>
        </div>
      </div>
    </div>
  )
}

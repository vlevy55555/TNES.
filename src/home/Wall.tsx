import { useCallback } from 'react'
import { decodeWall, encodeWall, settle, type Piece } from '../lib/wall'
import ContactOverlay from './ContactOverlay'
import WallBuilder, { isPortrait } from './WallBuilder'

const STORAGE = 'tnes-wall'

/** A shared link (?w=) wins; otherwise the wall this browser left last time. */
function initialWall(): Piece[] {
  const shared = new URLSearchParams(window.location.search).get('w')
  let saved: string | null = null
  try {
    saved = localStorage.getItem(STORAGE)
  } catch {
    // private mode or blocked storage: start empty
  }
  // a hand-edited or older link may overlap: let the works make room for each other
  return settle(decodeWall(shared ?? saved ?? '', isPortrait))
}

/** `/wall` — the gallery wall builder as a page, its state kept in the address. */
export default function Wall() {
  const keep = useCallback((pieces: Piece[]) => {
    const value = encodeWall(pieces)
    window.history.replaceState(null, '', value ? `/wall?w=${encodeURIComponent(value)}` : '/wall')
    try {
      localStorage.setItem(STORAGE, value)
    } catch {
      // the address still holds the wall
    }
  }, [])

  return (
    <main>
      <WallBuilder initial={initialWall()} onChange={keep} />
      <ContactOverlay />
    </main>
  )
}

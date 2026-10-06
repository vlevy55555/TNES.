import { useCallback } from 'react'
import { decodeWall, encodeWall, type Piece, type Room } from '../lib/wall'
import ContactOverlay from './ContactOverlay'
import WallBuilder, { isPortrait, wallPath } from './WallBuilder'

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
  return decodeWall(shared ?? saved ?? '', isPortrait)
}

/** `/wall` — the gallery wall builder as a page, its state kept in the address. */
export default function Wall() {
  const keep = useCallback((pieces: Piece[], room: Room) => {
    window.history.replaceState(null, '', wallPath(pieces, room))
    try {
      localStorage.setItem(STORAGE, encodeWall(pieces))
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

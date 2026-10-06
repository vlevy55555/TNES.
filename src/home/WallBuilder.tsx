import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { artworks, FRAME_FINISHES, FRAME_MATERIALS, frameLabelFor, type FrameMaterial } from '../data/artworks'
import {
  clamp,
  dims,
  encodeWall,
  EYE,
  gapsOf,
  IN,
  ROOM,
  roomOf,
  ROOMS,
  settle,
  sizeLabel,
  SIZES,
  snapToGrid,
  type Piece,
  type Room,
} from '../lib/wall'
import { useContactStore } from '../store/useContactStore'
import './wall.css'

const SNAP = 3 // cm: how close the centre must come to the wall's middle or eye level to lock on

const work = (id: string) => artworks.find((a) => a.id === id)
export const isPortrait = (id: string) => {
  const artwork = work(id)
  return artwork ? artwork.size[1] > artwork.size[0] : undefined
}
const cm = (v: number) => `${Math.round(v)} cm`
const inch = (v: number) => `${Math.round(v / IN)}″`
const copyAll = (pieces: Piece[]) => pieces.map((p) => ({ ...p }))

/** A copy of the wall held inside `room`, overlapping works pushed apart. */
const fit = (pieces: Piece[], room: Room) => {
  const next = copyAll(pieces)
  next.forEach((p) => clamp(p, room))
  return settle(next, undefined, room)
}

const ROOM_STORAGE = 'tnes-room'

/** A wall link names its room (none: the first); otherwise the room this browser chose last. */
function initialRoom() {
  const query = new URLSearchParams(window.location.search)
  if (query.has('w') || query.has('r')) return roomOf(query.get('r'))
  try {
    return roomOf(localStorage.getItem(ROOM_STORAGE))
  } catch {
    return ROOMS[0]
  }
}

/** `/wall` with the works in `w` and the room in `r`, each left out while it is the default. */
export const wallPath = (pieces: Piece[], room: Room) => {
  const query = [pieces.length && `w=${encodeURIComponent(encodeWall(pieces))}`, room !== ROOMS[0] && `r=${room.id}`].filter(Boolean).join('&')
  return query ? `/wall?${query}` : '/wall'
}
export const wallLink = (pieces: Piece[], room: Room) => window.location.origin + wallPath(pieces, room)

type Drag = {
  key: string
  origin: Piece[]
  start: { mx: number; my: number; x: number; y: number }
  perCm: number
  last: { x: number; y: number }
  latest: Piece[]
  frame: number
}

/**
 * The gallery wall: works hung at true scale in a room of choice, dragged
 * into place, pushing their neighbours aside and settling on a 5 cm grid when
 * released. `/wall` renders it as a page; a work's "see on wall" renders it
 * over the product with that work already hung.
 */
export default function WallBuilder({
  initial,
  onChange,
  onClose,
  selectFirst = false,
}: {
  initial: Piece[]
  onChange?: (pieces: Piece[], room: Room) => void
  /** set for the overlay: shows a close button and closes on Escape */
  onClose?: () => void
  selectFirst?: boolean
}) {
  const [room, setRoom] = useState(initialRoom)
  // a hand-edited or older link may overlap or leave this room: let the works make room
  const [pieces, setPieces] = useState(() => fit(initial, room))
  const [leaving, setLeaving] = useState<Piece[]>([])
  const [selected, setSelected] = useState<string | null>(selectFirst ? initial[0]?.key ?? null : null)
  const [measure, setMeasure] = useState(true)
  const [drawer, setDrawer] = useState(false)
  const [choosingRoom, setChoosingRoom] = useState(false) // what the drawer lists: rooms or works
  const [dragKey, setDragKey] = useState<string | null>(null)
  const [guides, setGuides] = useState({ v: false, h: false })
  const [copied, setCopied] = useState(false)
  const stage = useRef<HTMLDivElement>(null)
  const drag = useRef<Drag | null>(null)
  const openContact = useContactStore((s) => s.openContact)

  const live = useRef({ pieces, room, selected, onChange, onClose })
  live.current = { pieces, room, selected, onChange, onClose }

  useEffect(() => {
    live.current.onChange?.(pieces, room)
  }, [pieces, room])

  // the wall is the whole screen: nothing scrolls underneath it
  useEffect(() => {
    const previous = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = previous
    }
  }, [])

  const sel = pieces.find((p) => p.key === selected)

  /** Applies `change` to a copy of the wall, then lets the changed work push. */
  const update = (key: string, change: (p: Piece) => void) => {
    const next = copyAll(live.current.pieces)
    const p = next.find((q) => q.key === key)
    if (!p) return
    change(p)
    clamp(p, live.current.room)
    settle(next, p, live.current.room)
    setPieces(next)
  }

  const openDrawer = (rooms: boolean) => {
    setChoosingRoom(rooms)
    setDrawer(true)
  }

  const moveTo = (next: Room) => {
    setRoom(next)
    setPieces(fit(pieces, next))
    setDrawer(false)
    try {
      localStorage.setItem(ROOM_STORAGE, next.id)
    } catch {
      // the room still changes for this visit
    }
  }

  const add = (id: string) => {
    const portrait = isPortrait(id)
    if (portrait === undefined) return
    const next = copyAll(pieces)
    const last = next.at(-1)
    // beside the last work, or centred at eye level on an empty wall; settle() makes room
    const p: Piece = { key: crypto.randomUUID(), id, x: last ? last.x + 40 : 0, y: EYE, size: 0, material: 'regular', finish: 'black', portrait }
    next.push(p)
    clamp(p, room)
    settle(next, p, room)
    setPieces(next)
    setSelected(p.key)
    setDrawer(false)
  }

  const remove = (key: string) => {
    const gone = live.current.pieces.find((p) => p.key === key)
    if (!gone) return
    setPieces((current) => current.filter((p) => p.key !== key))
    setLeaving((current) => [...current, gone])
    window.setTimeout(() => setLeaving((current) => current.filter((p) => p !== gone)), 340)
    setSelected((current) => (current === key ? null : current))
  }

  const clearAll = () => {
    setLeaving((current) => [...current, ...pieces])
    window.setTimeout(() => setLeaving([]), 340)
    setPieces([])
    setSelected(null)
  }

  const inquire = () => {
    const lines = pieces.map((p) => {
      const d = dims(p)
      return `${work(p.id)?.title} — ${sizeLabel(p.size, p.portrait)} in · ${frameLabelFor(p.material, p.finish)} · ${cm(d.w)} × ${cm(d.h)} framed`
    })
    openContact(`gallery wall · ${pieces.length} ${pieces.length === 1 ? 'work' : 'works'}`, `${lines.join('\n')}\n\nmy wall: ${wallLink(pieces, room)}`)
  }

  const share = async () => {
    try {
      await navigator.clipboard.writeText(wallLink(pieces, room))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      window.prompt('copy your wall link', wallLink(pieces, room))
    }
  }

  // arrows nudge 1 cm (10 with shift), delete removes, escape deselects then closes
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (target.closest('input, textarea, select') || useContactStore.getState().open) return
      const { selected: key, onClose: close } = live.current
      if (event.key === 'Escape') {
        if (key) setSelected(null)
        else close?.()
        return
      }
      if (!key) return
      const step = event.shiftKey ? 10 : 1
      const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }
      if (moves[event.key]) {
        event.preventDefault()
        update(key, (p) => {
          p.x += moves[event.key][0]
          p.y += moves[event.key][1]
        })
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        remove(key)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  /*
   * Neighbours are pushed from where they stood when the drag began, so they
   * glide back once the dragged work moves on instead of being shoved for good.
   */
  const startDrag = (event: ReactPointerEvent<HTMLDivElement>, key: string) => {
    if (event.button !== 0 || !stage.current) return
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    const p = pieces.find((q) => q.key === key)!
    setSelected(key)
    setDragKey(key)
    drag.current = {
      key,
      origin: pieces,
      start: { mx: event.clientX, my: event.clientY, x: p.x, y: p.y },
      perCm: (stage.current.getBoundingClientRect().width * room.pxPerCm) / ROOM.width,
      last: { x: event.clientX, y: event.clientY },
      latest: pieces,
      frame: 0,
    }
  }

  const frame = () => {
    const d = drag.current
    if (!d) return
    d.frame = 0
    const next = copyAll(d.origin)
    const p = next.find((q) => q.key === d.key)!
    p.x = d.start.x + (d.last.x - d.start.mx) / d.perCm
    p.y = d.start.y - (d.last.y - d.start.my) / d.perCm
    // lock the centre to the wall's middle and to eye level, and show the guide
    const v = Math.abs(p.x) < SNAP
    const h = Math.abs(p.y - EYE) < SNAP
    if (v) p.x = 0
    if (h) p.y = EYE
    clamp(p, room)
    settle(next, p, room)
    d.latest = next
    setGuides({ v, h })
    setPieces(next)
  }

  const moveDrag = (event: ReactPointerEvent) => {
    const d = drag.current
    if (!d) return
    d.last = { x: event.clientX, y: event.clientY }
    d.frame ||= requestAnimationFrame(frame)
  }

  const endDrag = () => {
    const d = drag.current
    if (!d) return
    cancelAnimationFrame(d.frame)
    drag.current = null
    // on release the work glides onto the grid (the CSS transition does the easing)
    const next = copyAll(d.latest)
    const p = next.find((q) => q.key === d.key)!
    snapToGrid(p, room)
    settle(next, p, room)
    setPieces(next)
    setDragKey(null)
    setGuides({ v: false, h: false })
  }

  const renderPiece = (p: Piece, gone = false) => {
    const d = dims(p)
    const artwork = work(p.id)
    const isSel = !gone && p.key === selected
    const bottom = p.y - d.h / 2
    const labels = measure && !gone && (isSel || !sel)
    return (
      <div
        key={p.key}
        className={`wall__piece -${p.material} -${p.finish}${isSel ? ' -selected' : ''}${dragKey === p.key ? ' -dragging' : ''}${gone ? ' -leaving' : ''}`}
        style={{ '--x': p.x, '--y': p.y, '--w': d.w, '--h': d.h, '--b': d.b } as CSSProperties}
        onPointerDown={gone ? undefined : (event) => startDrag(event, p.key)}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className="wall__print">
          <img src={artwork?.image} alt={artwork?.title} draggable={false} />
        </div>
        {labels && (
          <>
            <span className="wall__dim -w">{cm(d.w)} · {inch(d.w)}</span>
            <span className="wall__dim -h">{cm(d.h)} · {inch(d.h)}</span>
            {isSel && (
              <span className="wall__dim -drop" style={{ height: `calc(${bottom} * var(--cm))` }}>
                <span>{cm(bottom)} from floor</span>
              </span>
            )}
          </>
        )}
      </div>
    )
  }

  // the card keeps showing the last work while it slides away
  const lastSel = useRef<Piece | undefined>(undefined)
  if (sel) lastSel.current = sel
  const shown = sel ?? lastSel.current
  const shownWork = shown && work(shown.id)

  return (
    <div className="wall" role="dialog" aria-label="Gallery wall">
      <div
        className="wall__stage"
        ref={stage}
        style={{
          backgroundImage: `url(/wall/${room.id}.webp)`,
          '--cm': `calc(100cqw * ${room.pxPerCm} / ${ROOM.width})`,
          '--floor': `${(room.floorY / ROOM.height) * 100}%`,
        } as CSSProperties}
        onPointerDown={() => setSelected(null)}
      >
        <div className={`wall__guide -v${guides.v ? ' -on' : ''}`} />
        <div className={`wall__guide -h${guides.h ? ' -on' : ''}`} />
        {pieces.map((p) => renderPiece(p))}
        {leaving.map((p) => renderPiece(p, true))}
        {measure && sel && !dragKey &&
          gapsOf(sel, pieces).map((g) => (
            <div
              key={`${g.from}-${g.width}`}
              className="wall__dim -gap"
              style={{ left: `calc(50% + ${g.from} * var(--cm))`, top: `calc(var(--floor) - ${sel.y} * var(--cm))`, width: `calc(${g.width} * var(--cm))` }}
            >
              <span>{cm(g.width)}</span>
            </div>
          ))}
      </div>

      <div className="wall__bar">
        <a className="wall__brand" href="/">
          TNES.<small>your wall</small>
        </a>
        <div className="wall__actions">
          <div className="wall__tools">
            <button type="button" className="wall__tool" aria-pressed={measure} onClick={() => setMeasure((m) => !m)}>
              <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="6.5" width="15" height="7" rx="1" /><path d="M6 6.5v3M9 6.5v2M12 6.5v3M15 6.5v2" /></svg>
              measure
            </button>
            <button type="button" className="wall__tool" onClick={() => openDrawer(false)}>
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12" /></svg>
              add work
            </button>
            <button type="button" className="wall__tool" onClick={() => openDrawer(true)}>
              <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="4" width="14" height="12" /><path d="M3 12.5h14" /></svg>
              room
            </button>
            <button type="button" className="wall__tool" onClick={share} disabled={!pieces.length}>
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M8.5 11.5l3-3M7 9l-1.5 1.5a2.5 2.5 0 0 0 3.5 3.5L10.5 12.5M13 11l1.5-1.5a2.5 2.5 0 0 0-3.5-3.5L9.5 7.5" /></svg>
              {copied ? 'copied' : 'share'}
            </button>
            {!onClose && (
              <button type="button" className="wall__tool" onClick={clearAll} disabled={!pieces.length}>clear</button>
            )}
          </div>
          <button type="button" className="wall__primary" onClick={inquire} disabled={!pieces.length}>
            inquire{pieces.length > 1 ? ` · ${pieces.length} works` : ''}
            <span aria-hidden="true">→</span>
          </button>
          {onClose && (
            <button type="button" className="wall__close" onClick={onClose} aria-label="Close">
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" /></svg>
            </button>
          )}
        </div>
      </div>

      <div className={`wall__empty${pieces.length ? ' -hidden' : ''}`}>
        <p>your wall is empty</p>
        <button type="button" className="wall__primary" onClick={() => openDrawer(false)}>add a work <span aria-hidden="true">→</span></button>
      </div>

      <aside className={`wall__drawer${drawer ? ' -open' : ''}`} aria-label={choosingRoom ? 'Rooms' : 'Collection'} aria-hidden={!drawer}>
        <header>
          <h2>{choosingRoom ? 'room' : 'collection'}</h2>
          <button type="button" className="wall__close -flat" onClick={() => setDrawer(false)} aria-label="Close">
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" /></svg>
          </button>
        </header>
        <div className="wall__grid">
          {choosingRoom
            ? ROOMS.map((r) => (
              <button type="button" className="wall__work" key={r.id} aria-pressed={r === room} onClick={() => moveTo(r)} tabIndex={drawer ? 0 : -1}>
                <img src={`/wall/${r.id}.webp`} alt="" width={ROOM.width} height={ROOM.height} loading="lazy" />
                <span>{r.id.replace(/-/g, ' ')}</span>
              </button>
            ))
            : artworks.map((a) => (
              <button type="button" className="wall__work" key={a.id} onClick={() => add(a.id)} tabIndex={drawer ? 0 : -1}>
                <img src={a.image} alt="" loading="lazy" />
                <span>{a.title}</span>
              </button>
            ))}
        </div>
      </aside>

      <section className={`wall__card${sel ? ' -on' : ''}`} aria-live="polite">
        {shown && shownWork && (
          <>
            <img src={shownWork.image} alt="" />
            <div>
              <h3>{shownWork.title}</h3>
              <div className="wall__row">
                <b>size</b>
                {SIZES.map((_, i) => (
                  <button type="button" key={i} className={`wall__opt${shown.size === i ? ' -on' : ''}`} onClick={() => update(shown.key, (p) => { p.size = i })}>
                    {sizeLabel(i, shown.portrait)}
                  </button>
                ))}
              </div>
              <div className="wall__row">
                <b>material</b>
                {(Object.keys(FRAME_MATERIALS) as FrameMaterial[]).map((m) => (
                  <button type="button" key={m} className={`wall__opt${shown.material === m ? ' -on' : ''}`} onClick={() => update(shown.key, (p) => { p.material = m })}>
                    {FRAME_MATERIALS[m]}
                  </button>
                ))}
              </div>
              {shown.material !== 'unframed' && (
                <div className="wall__row">
                  <b>finish</b>
                  {FRAME_FINISHES.map((f) => (
                    <button type="button" key={f} className={`wall__opt -swatch${shown.finish === f ? ' -on' : ''}`} onClick={() => update(shown.key, (p) => { p.finish = f })}>
                      <i className={`-${f}`} aria-hidden="true" />
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" className="wall__remove" onClick={() => remove(shown.key)}>
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.5 6h11M8 6V4.5h4V6M6 6l.7 9.5h6.6L14 6" /></svg>
              remove
            </button>
          </>
        )}
      </section>
    </div>
  )
}

# TNES. — 3D Gallery Design System

The visual language of the TNES. exhibition: a single first-person room rendered
with `@react-three/fiber`, where photographs hang as framed prints on angled
walls under warm gallery light. This document is the reference for that style so
new screens (e.g. the scroll-down archive) stay of the same world.

---

## 1. Concept

A **storefront that behaves like a small private gallery**. You are a visitor
standing in the room; you look around (orbit), step toward a piece (dolly), and
move between walls. Nothing is a flat web page — everything is a place. The
brand is quiet and editorial; the craft is in materials, light and restraint,
not effects.

One-line brand statement, shown on the opening wall:

> **An artifact of time made from the in betweens.**

---

## 2. Palette

Warm, sun-bleached, gallery-neutral. Never cool, never pure white.

| Token | Hex | Use |
|-------|-----|-----|
| Canvas / scene bg | `#ddd2c0` | the room's air, behind everything |
| Wall face | `#e8dfd2` | the plaster the prints hang on |
| Back / gap wall | `#e3d9c9` | closes the space behind angled walls |
| Ceiling | `#faf8f2` | unlit, deliberately brightest |
| Ink | `#2f2a24` | titles, primary text |
| Muted | `#8a7f6d` · `#a99d8a` | captions, wall labels, tracked meta |
| **Gold (frame)** | `#b69b5e` → `#8f7c4e` | every frame moulding; the one accent |
| Mat / passe-partout | `#f6f1e7` · `#e7dfd0` | the card border inside each frame |
| Signature ink | `#221c13` | the hand-drawn V Levy mark |
| Floor (wood) | `#583517`–`#835832` | procedural plank browns |

Gold is the **only** accent. Everything else is a warm neutral. Do not
introduce a second hue — if a new element needs emphasis, use gold, weight, or
scale, never a new colour.

---

## 3. Typography

Three families, each with one job (loaded as `.ttf` via troika text in 3D and
`@font-face` in the DOM):

- **Playfair Display** (`--brand`) — the brand, authorship, artwork titles.
  The "gallery identification" voice. Used sparingly, always at rest weight 400.
- **Gelasio** (`--serif`, a Georgia twin) — editorial body: the manifesto,
  descriptions. Italic for pull-quotes and the brand statement.
- **Manrope** (`--sans`) — all UI, wall labels, captions, countdowns. Set in
  ALL CAPS with generous tracking (`0.2–0.34em`) for labels; that tracking is a
  signature of the system.

Type scale is small and confident. Labels are 10–12px tracked caps; titles are
Playfair at 20–54px. Never mix a fourth family.

---

## 4. The frame (moulding) — the core motif

Every image in the room is the **same three-layer object**, built in
`ArtworkFrame.tsx` / `HeroFrame.tsx`:

1. **Gold moulding** — a `boxGeometry`, `meshStandardMaterial` `color #b69b5e`,
   `metalness 0.35`, `roughness 0.45`. Border ≈ `0.26` world units.
2. **Mat / passe-partout** — a slightly smaller box in `#f6f1e7`, inset `0.2`,
   sitting `0.055` proud of the frame face.
3. **Photograph** — a `planeGeometry` with the image as a `meshBasicMaterial`
   map, `toneMapped={false}` so the print keeps its true colour under the warm
   lights. Seated `0.072` proud.
4. **Fake soft shadow** — a radial-gradient canvas plane behind the frame,
   offset `[0.05,-0.08]`, no shadow maps. This is how the whole room gets
   depth cheaply.
5. **Label plaque** — under the frame: Playfair title, then a Manrope tracked
   caps caption (`location · year`).

Frames sit `z ≈ 0.07` proud of the wall so they never z-fight. Aspect is the
photo's true ratio (3:2 landscape `1.42×0.95`, 2:3 portrait `0.95×1.42`) so
nothing distorts. Hover scales the group to `1.02` over `0.35s` `power2.out`.

**The `[O]` mark.** TNES. is *tones* with the O extracted; the `[O]` is the
brand mark. It appears as a quiet ring: as the custom cursor over the room, and
as a small low-opacity mark inset in the corner of each photograph — a
maker's stamp, never loud.

---

## 5. Room & layout

- **Walls** live along the X axis at `WALL_SPACING = 10`, each yawed a few
  degrees (`±0.085 rad`) so they read as facets of a room, never coplanar. Wall
  box is `9.4 × 4.93 × 0.1`, face `#e8dfd2`, bottom on the floor at `y = -2.2`,
  top just past the resting frustum so the ceiling only peeks when the camera
  pulls back.
- **Per-frame ceiling lamps** — one `spotLight` per artwork, `#fff1d6`,
  `intensity 26`, `angle 0.6`, `penumbra 0.55`, aimed down at the piece. This
  is what scallops light down each wall; it is not a generic wash.
- **Floor** — a procedural wood-plank `CanvasTexture` (no image asset),
  planks running toward the viewer.
- **Ceiling** — flat `#faf8f2`, unlit, so it stays bright after tone-mapping.
- **Global light** — `ambientLight 0.85 #fff6e8` + two soft directionals. Warm,
  bright, even; the lamps add the drama.

Wall roster (index → name → roman): `0 Signature I`, `1 Exhibition II`,
`2 Archive III`, `3 Coming Soon IV`, `4 About V`.

---

## 6. Camera & motion

A single `PerspectiveCamera`, `fov 35` (widened to keep 35° *horizontal* on
portrait screens). One controller (`CameraController.tsx`) composes:

- **base + look** points driven by GSAP for scene changes (wall-to-wall travel
  physically dollies out, slides, dollies back in — you ride through the room).
- **orbit / pitch / dolly** damped on top each frame from drag + wheel, clamped
  to a small "peek" (`±0.22` yaw, `±0.15` pitch) so you never lose the wall.
- **zoom to a piece** — clicking a frame flies base+look to fit that print to
  the strip of screen not covered by the detail panel.

Motion is always eased (`power2/3.inOut`), 0.6–2.0s, and slower on mobile.
Nothing snaps. Reduced-motion is honoured in the DOM overlays.

---

## 7. Screens

- **Signature (opening).** An **exhibition wall**: a central print **signed by
  V Levy** (the hand-drawn mark rendered on the print itself), flanked by two
  works. Carries the brand statement and the larger TNES. wordmark. This is the
  poster of the show.
- **Exhibition / Archive.** Standard walls of three framed prints each; click to
  zoom + open the detail panel.
- **Coming Soon.** A framed live countdown to the launch, road-sign props and
  hazard tape, an inline email capture — a "work in progress" set piece.
- **About.** V Levy's framed B&W portrait, a pull-quote, and the gold CTA into
  VSL (the immersive world behind the work).
- **Archive grid (scroll-down).** See §8.

Detail panel (on zoom): a right-side card, Playfair title, tracked caps
`location · year`, Gelasio description, a spec list (edition / dimensions /
price), all on `rgba(246,241,231,0.96)` with a blur.

---

## 8. Archive grid — the scroll-down view (new)

Scrolling **down** from the opening wall travels the camera to an **archive**:
**all works shown at once, side by side, still fully 3D** — same gold frames,
mat, lamps and wood floor, just laid out as a grid instead of one-wall-at-a-time.

Rules for staying in-world:
- Reuse the exact `ArtworkFrame` object (gold + mat + photo + shadow + `[O]`
  mark + plaque). Do **not** switch to flat DOM cards.
- Its own ceiling lamps, one per piece, same spec as the walls.
- Its own wall face `#e8dfd2` behind the grid so it reads as a real room, and a
  continuation of the wood floor.
- The transition is scroll-scrubbed and eased, matching the camera language of
  §6 — you *travel* to the archive, you don't cut.
- Clicking any piece flies to the **standard zoomed view** of that work (the
  same detail framing used everywhere). Purchase is out of scope for now.

The grid is the same show seen as a contact sheet: the room's index.

---

## 9. Principles (what keeps it TNES.)

1. **It's a place, not a page.** Depth, light, and travel over transitions.
2. **Gold is the only accent.** Everything else is a warm neutral.
3. **The frame is sacred.** Every image is the same three-layer object.
4. **Type is tracked and quiet.** Playfair for name, Gelasio for voice, Manrope
   for labels in tracked caps.
5. **Light is per-piece.** Lamps scallop each print; the base stays even.
6. **The `[O]` is the whisper mark** — cursor and corner stamp, never a logo slap.
7. **Nothing snaps.** Every move is eased; mobile is slower and lighter.

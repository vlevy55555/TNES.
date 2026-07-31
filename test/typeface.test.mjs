import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { Font } from 'three/examples/jsm/loaders/FontLoader.js'
import { ExtrudeGeometry, Shape, Path, Vector2 } from 'three'

// The Countdown carves its numerals out of the wall as real geometry, which
// means the digit OUTLINES have to be well-formed: one outer contour per digit
// plus its counters as separate, opposite-wound holes. The shipped Playfair
// does not satisfy that — 4/6/8/9 are single self-intersecting contours that
// only resolve under non-zero winding fill, and eight.lf is a composite of the
// oldstyle eight. The typeface JSON is baked with skia-pathops to fix it.
//
// Nothing at runtime fails loudly if that pass is ever lost: the numbers simply
// render as filled blobs with no holes. Hence this check.

const font = new Font(
  JSON.parse(readFileSync('public/fonts/playfair-lining-digits.typeface.json', 'utf8')),
)

/** counters each digit must keep once its outline is carved */
const COUNTERS = { 0: 1, 1: 0, 2: 0, 3: 0, 4: 1, 5: 0, 6: 1, 7: 0, 8: 2, 9: 1 }

test('every digit is one outer contour with the right counters', () => {
  for (const [digit, counters] of Object.entries(COUNTERS)) {
    const shapes = font.generateShapes(digit, 1)
    assert.equal(shapes.length, 1, `"${digit}" should be a single contour`)
    assert.equal(shapes[0].holes.length, counters, `"${digit}" lost or gained a counter`)
  }
})

test('digits are lining figures — one baseline, one height', () => {
  const tops = []
  const bottoms = []
  for (const digit of Object.keys(COUNTERS)) {
    const ys = font.generateShapes(digit, 1).flatMap((s) => s.getPoints().map((p) => p.y))
    tops.push(Math.max(...ys))
    bottoms.push(Math.min(...ys))
  }
  // oldstyle figures spread ~0.2 em on both; lining ones only carry overshoot
  assert.ok(Math.max(...tops) - Math.min(...tops) < 0.02, 'digit heights disagree')
  assert.ok(Math.max(...bottoms) - Math.min(...bottoms) < 0.02, 'digits sit off the baseline')
})

test('a carved plate really is punched through', () => {
  // the same construction CarvedFloor does: a rect with the glyph as a hole
  const plate = new Shape()
  plate.moveTo(-1, -1)
  plate.lineTo(1, -1)
  plate.lineTo(1, 1)
  plate.lineTo(-1, 1)
  plate.closePath()

  const solid = new ExtrudeGeometry(plate, { depth: 0.06, bevelEnabled: false })

  const [glyph] = font.generateShapes('8', 1)
  const { shape: contour } = glyph.extractPoints(6)
  plate.holes.push(new Path(contour.map((p) => new Vector2(p.x, p.y))))
  const carved = new ExtrudeGeometry(plate, { depth: 0.06, bevelEnabled: false })

  // a hole adds side-wall geometry and removes cap area, so the vertex count
  // must grow — if the hole were dropped the two would be identical
  assert.ok(
    carved.attributes.position.count > solid.attributes.position.count,
    'the glyph hole was not cut into the plate',
  )
})

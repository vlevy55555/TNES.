import { test } from 'node:test'
import assert from 'node:assert/strict'
import { clamp, decodeWall, dims, encodeWall, GAP, roomOf, settle, sizeIndexOf, snapToGrid } from '../.test-build/lib/wall.js'

const piece = (key, x, extra = {}) => ({ key, id: 'runner', x, y: 150, size: 0, material: 'regular', finish: 'black', portrait: false, ...extra })

test('a dragged work pushes its neighbour sideways and keeps the gap', () => {
  const a = piece('a', 0)
  const b = piece('b', 10)
  settle([a, b], a)
  assert.equal(a.x, 0) // the fixed one stays put
  assert.equal(b.y, 150) // pushed along the wall, not up it
  assert.ok(Math.abs(b.x - a.x - (dims(a).w + GAP)) < 0.1)
})

test('release lands the centre on the 5 cm grid', () => {
  const p = piece('a', 12.4, { y: 147.6 })
  snapToGrid(p)
  assert.deepEqual([p.x, p.y], [10, 150])
})

test('a work is held inside the photo of its own room', () => {
  const far = (room) => {
    const p = piece('a', 1000)
    clamp(p, room)
    return p.x + dims(p).w / 2
  }
  assert.ok(Math.abs(far(roomOf('concrete-room')) - 1672 / 2 / 1.995) < 0.01)
  assert.ok(Math.abs(far(roomOf('alpine-residence')) - 1672 / 2 / 2.9) < 0.01)
  assert.equal(roomOf('nope'), roomOf('concrete-room'))
})

test('share links round-trip and drop unknown works', () => {
  const wall = [piece('a', -40, { size: 2, material: 'glass', finish: 'custom', portrait: true })]
  const back = decodeWall(`${encodeWall(wall)}~nope.0.0.000`, (id) => (id === 'runner' ? true : undefined))
  assert.equal(back.length, 1)
  assert.deepEqual(
    [back[0].id, back[0].x, back[0].size, back[0].material, back[0].finish],
    ['runner', -40, 2, 'glass', 'custom'],
  )
})

test('shop size values map to the size index', () => {
  assert.equal(sizeIndexOf('30x20'), 0)
  assert.equal(sizeIndexOf('24 x 36"'), 1)
  assert.equal(sizeIndexOf('42x28'), 2)
  assert.equal(sizeIndexOf(undefined), 0)
})

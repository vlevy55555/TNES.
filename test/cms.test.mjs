import assert from 'node:assert/strict'
import { test } from 'node:test'
import { normalize } from '../scripts/cms/normalize.mjs'

const picture = () => ({
  asset: {
    url: 'https://cdn.sanity.io/images/bchwhnoq/production/example.jpg',
    dimensions: { width: 2400, height: 1600 },
  },
})

function publishedContent() {
  return {
    settings: {},
    home: { heroIds: ['first-work'], statementArtworkId: 'first-work' },
    works: {},
    about: { heroImage: picture(), splitImage: picture() },
    momentsPage: {},
    artworks: [{
      id: 'first-work', title: 'First Work', location: 'Rio de Janeiro, Brazil',
      year: 2025, description: 'A photograph.', image: picture(),
    }],
    moments: [{ place: 'Rio', title: 'Opening', date: '10/09/26', abstract: 'An event.' }],
    catalogs: [{ slug: 'first-catalog', title: 'First Catalog', photos: [{ image: picture(), location: 'Rio' }] }],
  }
}

test('the final moment and catalog disappear after unpublishing', () => {
  const data = publishedContent()
  data.moments = []
  data.catalogs = []
  const { content } = normalize(data)
  assert.deepEqual(content.moments, [])
  assert.deepEqual(content.catalogs, [])
  assert.equal(content.artworks.length, 1)
})

test('the build cannot reuse old works when the dataset has none', () => {
  const data = publishedContent()
  data.artworks = []
  assert.throws(() => normalize(data), /nenhuma obra publicada/)
})

test('the build cannot reuse a missing page or its old images', () => {
  const data = publishedContent()
  data.about = null
  assert.throws(() => normalize(data), /about/)
  data.about = { heroImage: picture() }
  assert.throws(() => normalize(data), /duas fotos/)
})

test('invalid works cannot leave a build with no usable work', () => {
  const data = publishedContent()
  data.artworks[0].title = ''
  assert.throws(() => normalize(data), /nenhuma obra válida/)
})

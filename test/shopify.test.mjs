import { test } from 'node:test'
import assert from 'node:assert/strict'
// plain .mjs against tsc output: node's built-in runner and the tsc already in
// devDependencies cover this, so the repo needs no test framework and no
// @types/node. `npm test` compiles src/lib/shopify.ts here first.
import {
  checkoutUrl,
  defaultSelection,
  findVariant,
  money,
  normalizeProduct,
  variantNumericId,
} from '../.test-build/lib/shopify.js'

// Verbatim shape of a real Storefront API response for the one mapped work
// ("01.07 — corrida dourada"), trimmed to three variants. Two options with the
// price varying on BOTH is the case the cart has to get right.
const RAW = {
  handle: 'bleed-copy-copy-copy-copy-copy-copy',
  title: '01.07 — corrida dourada',
  options: [
    { name: 'Size', values: ['12x18', '16x24'] },
    { name: 'Frame', values: ['Black', 'Gun Metal (Frame of the Month)'] },
  ],
  variants: {
    nodes: [
      {
        id: 'gid://shopify/ProductVariant/44538906378319',
        title: '12x18 / Black',
        availableForSale: false,
        price: { amount: '185.0', currencyCode: 'USD' },
        selectedOptions: [
          { name: 'Size', value: '12x18' },
          { name: 'Frame', value: 'Black' },
        ],
      },
      {
        id: 'gid://shopify/ProductVariant/44538906443855',
        title: '12x18 / Gun Metal (Frame of the Month)',
        availableForSale: true,
        price: { amount: '210.0', currencyCode: 'USD' },
        selectedOptions: [
          { name: 'Size', value: '12x18' },
          { name: 'Frame', value: 'Gun Metal (Frame of the Month)' },
        ],
      },
      {
        id: 'gid://shopify/ProductVariant/44538906476623',
        title: '16x24 / Black',
        availableForSale: true,
        price: { amount: '275.0', currencyCode: 'USD' },
        selectedOptions: [
          { name: 'Size', value: '16x24' },
          { name: 'Frame', value: 'Black' },
        ],
      },
    ],
  },
}

const product = normalizeProduct(RAW)

test('normalizeProduct flattens GIDs, numbers and option pairs', () => {
  assert.equal(product.variants.length, 3)
  assert.deepEqual(product.variants[0], {
    id: '44538906378319',
    title: '12x18 / Black',
    available: false,
    price: 185,
    currency: 'USD',
    options: { Size: '12x18', Frame: 'Black' },
  })
})

test('variantNumericId strips the GID prefix and passes plain ids through', () => {
  assert.equal(variantNumericId('gid://shopify/ProductVariant/123'), '123')
  assert.equal(variantNumericId('123'), '123')
})

test('findVariant matches on every option, not just the first', () => {
  // the bug this guards: matching Size alone returns the $185 variant for a
  // Gun Metal selection that actually costs $210
  const v = findVariant(product, { Size: '12x18', Frame: 'Gun Metal (Frame of the Month)' })
  assert.equal(v?.price, 210)
  assert.equal(v?.id, '44538906443855')
})

test('findVariant returns null for a combination the store does not sell', () => {
  assert.equal(
    findVariant(product, { Size: '16x24', Frame: 'Gun Metal (Frame of the Month)' }),
    null,
  )
  // a partial selection must not match — it would silently pick an arbitrary variant
  assert.equal(findVariant(product, { Size: '12x18' }), null)
})

test('defaultSelection opens on the middle size, not the smallest', () => {
  // the real shape: three sizes, one frame, everything in stock
  const threeSizes = normalizeProduct({
    handle: 'st-peters-pool-v1',
    title: 'St Peter’s Pool',
    options: [{ name: 'Size', values: ['12x18', '20x30', '24x36'] }],
    variants: {
      nodes: ['12x18', '20x30', '24x36'].map((size, i) => ({
        id: `gid://shopify/ProductVariant/${i}`,
        title: size,
        availableForSale: true,
        price: { amount: '100.0', currencyCode: 'USD' },
        selectedOptions: [{ name: 'Size', value: size }],
      })),
    },
  })
  assert.deepEqual(defaultSelection(threeSizes), { Size: '20x30' })
})

test('defaultSelection falls back past a sold-out middle', () => {
  const soldMiddle = normalizeProduct({
    handle: 'x',
    title: 'x',
    options: [{ name: 'Size', values: ['S', 'M', 'L'] }],
    variants: {
      nodes: ['S', 'M', 'L'].map((size, i) => ({
        id: `gid://shopify/ProductVariant/${i}`,
        title: size,
        availableForSale: size !== 'M',
        price: { amount: '100.0', currencyCode: 'USD' },
        selectedOptions: [{ name: 'Size', value: size }],
      })),
    },
  })
  assert.deepEqual(defaultSelection(soldMiddle), { Size: 'S' })
})

test('defaultSelection opens on the first in-stock variant, skipping sold-out', () => {
  assert.deepEqual(defaultSelection(product), {
    Size: '12x18',
    Frame: 'Gun Metal (Frame of the Month)',
  })
})

test('defaultSelection falls back to the first variant when all are sold out', () => {
  const soldOut = { ...product, variants: product.variants.map((v) => ({ ...v, available: false })) }
  assert.deepEqual(defaultSelection(soldOut), { Size: '12x18', Frame: 'Black' })
})

test('checkoutUrl builds a multi-line cart permalink', () => {
  assert.equal(
    checkoutUrl([
      { variantId: '44538906443855', qty: 1 },
      { variantId: '44538906476623', qty: 3 },
    ]),
    'https://tnes-3.myshopify.com/cart/44538906443855:1,44538906476623:3',
  )
})

test('checkoutUrl clamps quantities Shopify would silently drop', () => {
  // a dropped pair ships fewer prints than the buyer thought they bought
  assert.match(checkoutUrl([{ variantId: '1', qty: 0 }]), /\/cart\/1:1$/)
  assert.match(checkoutUrl([{ variantId: '1', qty: 2.7 }]), /\/cart\/1:2$/)
  assert.match(checkoutUrl([{ variantId: '1', qty: -5 }]), /\/cart\/1:1$/)
})

test('checkoutUrl refuses to build an empty cart', () => {
  assert.throws(() => checkoutUrl([]), /no valid lines/)
  assert.throws(() => checkoutUrl([{ variantId: '', qty: 1 }]), /no valid lines/)
  assert.throws(() => checkoutUrl([{ variantId: '1', qty: NaN }]), /no valid lines/)
})

test('money formats the store currency', () => {
  assert.equal(money(210, 'USD'), '$210.00')
  assert.equal(money(1250.5, 'USD'), '$1,250.50')
})

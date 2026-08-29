// Shopify Storefront API — catalogue reads + the hand-off to Shopify's hosted
// checkout. No token: the Storefront API answers unauthenticated requests for
// products, collections and cart, which is everything the gallery needs. Keep
// this module React-free so its pure helpers stay directly testable.
//
// ponytail: checkout is a cart permalink, not the Cart API. Permalinks take
// `variantId:qty` pairs, so a locally-held cart needs zero round-trips and no
// cartId lifecycle (create/expire/sync/orphan). Shopify revalidates price and
// stock at checkout, which is the only place it legally matters. Move to
// cartCreate only if you need order attributes, notes, or a prefilled buyer.

export const SHOP_DOMAIN = 'tnes-3.myshopify.com'

// Storefront API versions age out ~12 months after release — bump deliberately
// and re-run src/lib/shopify.test.ts against the live store when you do.
const API_VERSION = '2026-07'
const ENDPOINT = `https://${SHOP_DOMAIN}/api/${API_VERSION}/graphql.json`

export type Variant = {
  /** numeric variant id — what cart permalinks take */
  id: string
  title: string
  available: boolean
  price: number
  currency: string
  /** { Size: '12x18', Frame: 'Black' } */
  options: Record<string, string>
}

export type ShopProduct = {
  handle: string
  title: string
  /** option order as merchandised in Shopify — drives selector order */
  options: { name: string; values: string[] }[]
  variants: Variant[]
}

const PRODUCT_QUERY = `query Product($handle: String!) {
  product(handle: $handle) {
    handle
    title
    options { name values }
    variants(first: 100) {
      nodes {
        id
        title
        availableForSale
        price { amount currencyCode }
        selectedOptions { name value }
      }
    }
  }
}`

/** `gid://shopify/ProductVariant/44538906378319` -> `44538906378319` */
export const variantNumericId = (gid: string) => gid.split('/').pop() ?? gid

/**
 * The variant matching a full option selection, or null when the combination
 * doesn't exist (Shopify allows sparse option grids — not every Size × Frame
 * pair is necessarily a real variant).
 */
export const findVariant = (
  product: ShopProduct,
  selection: Record<string, string>,
): Variant | null =>
  product.variants.find((v) =>
    product.options.every((o) => v.options[o.name] === selection[o.name]),
  ) ?? null

/**
 * The middle value of an option's merchandised list. Odd counts land dead
 * centre; even counts take the lower of the two, which keeps the default off
 * the most expensive size.
 */
export const middleValue = (values: string[]) => values[Math.floor((values.length - 1) / 2)]

const optionKey = (value: string) => value.toLowerCase().replace(/×/g, 'x').replace(/[^a-z0-9]/g, '')

/**
 * A size label is a width×height pair, so the same physical print is '20x30' on
 * a portrait and '30x20' on a landscape. Sorting the pair makes the two read as
 * one tier; anything that isn't a pair passes through untouched.
 */
const sizeTier = (value: string) => {
  const pair = /^(\d+)x(\d+)/.exec(optionKey(value))
  return pair ? [Number(pair[1]), Number(pair[2])].sort((a, b) => a - b).join('x') : optionKey(value)
}

/** The merchandising baseline used everywhere a print first appears. */
const preferredValue = (name: string, values: string[]) => {
  if (/frame/i.test(name)) return values.find((v) => optionKey(v) === 'unframed') ?? middleValue(values)
  // Matching on the tier rather than the literal keeps landscapes and portraits
  // opening on the same print, instead of half the catalogue defaulting a step up.
  if (/size/i.test(name)) return values.find((v) => sizeTier(v) === '20x30') ?? middleValue(values)
  return middleValue(values)
}

/**
 * The selection to open on: the MIDDLE of every option — so a three-size print
 * opens on its middle size rather than its smallest, which read as the cheap
 * option instead of the intended one. Falls back to the first in-stock variant
 * (else the first) when that middle combination isn't sold.
 */
export const defaultSelection = (product: ShopProduct): Record<string, string> => {
  const preferred = Object.fromEntries(
    product.options.map((o) => [o.name, preferredValue(o.name, o.values)]),
  )
  const preferredVariant = findVariant(product, preferred)
  if (preferredVariant?.available) return preferred
  const v = product.variants.find((x) => x.available) ?? product.variants[0]
  return v ? { ...v.options } : {}
}

export type CheckoutLine = { variantId: string; qty: number }

/**
 * Shopify's hosted checkout, preloaded with these lines. Quantities are clamped
 * to >=1 integers because Shopify silently drops a malformed pair, which would
 * quietly ship a smaller order than the buyer chose.
 */
export const checkoutUrl = (lines: CheckoutLine[]) => {
  const pairs = lines
    .filter((l) => l.variantId && Number.isFinite(l.qty))
    .map((l) => `${l.variantId}:${Math.max(1, Math.floor(l.qty))}`)
  if (!pairs.length) throw new Error('checkoutUrl: no valid lines')
  return `https://${SHOP_DOMAIN}/cart/${pairs.join(',')}`
}

export const money = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)

type RawVariant = {
  id: string
  title: string
  availableForSale: boolean
  price: { amount: string; currencyCode: string }
  selectedOptions: { name: string; value: string }[]
}

/**
 * Shopify's Storefront index for `options.values` lags a rename — after the
 * size-label correction it still lists the smallest print last, while the
 * variants come back in the right order. A size label is a width×height pair,
 * so order them here instead of trusting the index. Every other option keeps
 * the merchandised order, which carries a meaning that sorting would destroy.
 */
const orderedValues = (name: string, values: string[]) => {
  if (!/size/i.test(name)) return values
  const area = (value: string) => {
    const pair = /^(\d+)x(\d+)/.exec(optionKey(value))
    return pair ? Number(pair[1]) * Number(pair[2]) : Number.MAX_SAFE_INTEGER
  }
  return [...values].sort((a, b) => area(a) - area(b))
}

/** Shapes the GraphQL payload into ShopProduct. Exported for the test. */
export const normalizeProduct = (raw: {
  handle: string
  title: string
  options: { name: string; values: string[] }[]
  variants: { nodes: RawVariant[] }
}): ShopProduct => ({
  handle: raw.handle,
  title: raw.title,
  options: raw.options.map((o) => ({ ...o, values: orderedValues(o.name, o.values) })),
  variants: raw.variants.nodes.map((v) => ({
    id: variantNumericId(v.id),
    title: v.title,
    available: v.availableForSale,
    price: Number(v.price.amount),
    currency: v.price.currencyCode,
    options: Object.fromEntries(v.selectedOptions.map((o) => [o.name, o.value])),
  })),
})

/**
 * Fetches one product. Returns null on any failure — network, GraphQL error, or
 * unknown handle — so every caller degrades to the inquiry-only UI instead of
 * rendering a broken or, worse, a wrong price.
 */
export async function fetchProduct(handle: string): Promise<ShopProduct | null> {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: PRODUCT_QUERY, variables: { handle } }),
    })
    if (!res.ok) return null
    const json = await res.json()
    if (json.errors?.length || !json.data?.product) return null
    return normalizeProduct(json.data.product)
  } catch {
    return null
  }
}

// Dedupes concurrent and repeat requests for the same handle. A failed lookup is
// evicted so a transient network blip doesn't poison the handle for the session.
const cache = new Map<string, Promise<ShopProduct | null>>()

export function getProduct(handle: string): Promise<ShopProduct | null> {
  let pending = cache.get(handle)
  if (!pending) {
    pending = fetchProduct(handle).then((p) => {
      if (!p) cache.delete(handle)
      return p
    })
    cache.set(handle, pending)
  }
  return pending
}

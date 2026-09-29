// Pushes the 30 v1 works to Shopify: metafield definitions, products, variants,
// images + alt text, metafields, related-works links and the Moreira redirect.
//
// Auth is either SHOPIFY_ADMIN_TOKEN (a custom app's Admin API token, no OAuth
// involved) or, failing that, whatever `shopify store auth` has stored. Nothing
// is written to this repo either way — see README.md.
//
// ponytail: idempotent by handle, no local state file. Re-running fixes a
// partial run instead of duplicating; the store is the source of truth.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const STORE = 'tnes-3.myshopify.com'
const DIR = '/home/eduardo/TNES/shopify-release'
const TMP = mkdtempSync(join(tmpdir(), 'tnes-shopify-'))
const DRY = process.argv.includes('--dry-run')
const ENV = {
  ...process.env,
  SHOPIFY_CLI_AGENT_INFO: 'n:claude-code|v:2.0.0|p:anthropic|m:claude-opus-5',
}

// The label is the print's width x height, so it mirrors with the orientation.
// The 12 pre-existing products had these two sets swapped — every work was sold
// in the shape of its opposite — and swap-size-labels.mjs corrected all 30.
const SIZES = {
  Landscape: ['30x20', '36x24', '42x28'],
  Portrait: ['20x30', '24x36', '28x42'],
}
const PRICES = { 0: '1600.00', 1: '2100.00', 2: '2600.00' }
const FRAMES = ['Unframed', 'White', 'Black', 'Glass Block', 'Aluminium Support']

const VENDOR = 'TNES.'
const PRODUCT_TYPE = 'Fine Art Photography Print'
const CREDIT = 'Original photography by Victor Safdie Levy.'

// A custom app's Admin API token skips OAuth entirely. mkdtemp gives us a 0700
// directory, and the token travels in a curl config file rather than on the
// command line, where `ps` would show it to every user on the machine.
// Dev Dashboard apps have no static shpat_ token by design — you mint a 24h one
// from the app's client credentials. So prefer that exchange and treat a
// hand-supplied SHOPIFY_ADMIN_TOKEN as the override, not the other way round.
function mintToken() {
  const { SHOPIFY_CLIENT_ID: id, SHOPIFY_CLIENT_SECRET: secret } = process.env
  if (!id || !secret) return null
  const body = join(TMP, 'oauth.txt')
  writeFileSync(body, `grant_type=client_credentials&client_id=${id}&client_secret=${secret}`,
    { mode: 0o600 })
  const out = execFileSync('curl', [
    '-sS', '--fail-with-body', '-X', 'POST',
    `https://${STORE}/admin/oauth/access_token`,
    '-H', 'Content-Type: application/x-www-form-urlencoded',
    '--data-binary', `@${body}`,
  ], { encoding: 'utf8' })
  return JSON.parse(out).access_token ?? null
}

const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN ?? mintToken()
const API_VERSION = '2026-07'
if (TOKEN) {
  writeFileSync(
    join(TMP, 'curlrc'),
    `header = "X-Shopify-Access-Token: ${TOKEN}"\n` +
    `header = "Content-Type: application/json"\n`,
    { mode: 0o600 },
  )
}

function viaToken(query, variables) {
  const bf = join(TMP, 'body.json')
  writeFileSync(bf, JSON.stringify({ query, variables }))
  const out = execFileSync('curl', [
    '-sS', '--fail-with-body', '--config', join(TMP, 'curlrc'),
    '-X', 'POST', `https://${STORE}/admin/api/${API_VERSION}/graphql.json`,
    '--data-binary', `@${bf}`,
  ], { encoding: 'utf8' })
  return JSON.parse(out)
}

function viaCli(query, variables, mutation) {
  const qf = join(TMP, 'q.graphql')
  const vf = join(TMP, 'v.json')
  const of = join(TMP, 'o.json')
  writeFileSync(qf, query)
  writeFileSync(vf, JSON.stringify(variables))
  const args = ['store', 'execute', '--store', STORE, '--query-file', qf,
    '--variable-file', vf, '--json', '--output-file', of]
  if (mutation) args.push('--allow-mutations')
  execFileSync('shopify', args, { env: ENV, stdio: ['ignore', 'ignore', 'inherit'] })
  return JSON.parse(readFileSync(of, 'utf8'))
}

let calls = 0
function gql(query, variables = {}, mutation = false) {
  calls++
  const res = TOKEN ? viaToken(query, variables) : viaCli(query, variables, mutation)
  if (res.errors?.length) throw new Error(JSON.stringify(res.errors))
  // Every Shopify mutation reports its own failures in a userErrors payload
  // rather than as a GraphQL error, so an unchecked call looks like a success.
  for (const v of Object.values(res.data ?? {})) {
    const errs = v?.userErrors ?? v?.mediaUserErrors
    if (errs?.length) throw new Error(JSON.stringify(errs))
  }
  return res.data
}

// ---------------------------------------------------------------- definitions

const DEFINITIONS = [
  ['country', 'Country', 'single_line_text_field'],
  ['continent', 'Continent', 'single_line_text_field'],
  ['location', 'Location', 'single_line_text_field'],
  ['year', 'Year', 'number_integer'],
  ['subject', 'Subject', 'list.single_line_text_field'],
  ['orientation', 'Orientation', 'single_line_text_field'],
  ['display_order', 'Display order', 'number_integer'],
  ['travel_note', 'Travel note', 'multi_line_text_field'],
  ['related_works', 'Related works', 'list.product_reference'],
  ['color', 'Color', 'list.single_line_text_field'],
]

function ensureDefinitions() {
  const q = `mutation Def($d: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $d) { userErrors { code field message } } }`
  for (const [key, name, type] of DEFINITIONS) {
    try {
      gql(q, { d: { namespace: 'custom', key, name, type, ownerType: 'PRODUCT' } }, true)
      console.log(`  definition custom.${key} created`)
    } catch (e) {
      // TAKEN means a previous run (or the merchant) already defined it.
      if (!String(e.message).includes('TAKEN')) throw e
      console.log(`  definition custom.${key} exists`)
    }
  }
}

// -------------------------------------------------------------------- helpers

const seoDescription = (p) =>
  `${p.description} Original photograph by Victor Safdie Levy, available through TNES.`

const descriptionHtml = (p) =>
  `<p>${p.description}</p>\n<p>${p.location}, ${p.country} · ${p.year}</p>\n<p>${CREDIT}</p>`

const variantsFor = (p) =>
  SIZES[p.orientation].flatMap((size, i) =>
    FRAMES.map((frame) => ({
      optionValues: [
        { optionName: 'Size', name: size },
        { optionName: 'Frame', name: frame },
      ],
      price: PRICES[i],
      // Prints are made to order, so stock must never gate the buy button.
      // CONTINUE is also what the 12 pre-existing products use — the API
      // defaults to DENY, which silently made the first 18 the odd ones out.
      inventoryPolicy: 'CONTINUE',
      inventoryItem: { tracked: false },
    })),
  )

function findProduct(handle) {
  const d = gql(
    `query P($h: String!) { productByHandle(handle: $h) {
      id handle media(first: 5) { nodes { id alt } } } }`,
    { h: handle },
  )
  return d.productByHandle
}

function taxonomyCategory() {
  try {
    const d = gql(`{ taxonomy { categories(first: 5, search: "Visual Artwork") {
      nodes { id fullName } } } }`)
    const node = d.taxonomy?.categories?.nodes?.[0]
    if (node) console.log(`  category: ${node.fullName}`)
    return node?.id ?? null
  } catch {
    return null
  }
}

// ------------------------------------------------------------------- products

function createProduct(p, categoryId) {
  const input = {
    handle: p.handle,
    title: p.title,
    descriptionHtml: descriptionHtml(p),
    vendor: VENDOR,
    productType: PRODUCT_TYPE,
    status: 'ACTIVE',
    tags: p.tags,
    seo: { title: `${p.title} | TNES.`, description: seoDescription(p) },
    productOptions: [
      { name: 'Size', values: SIZES[p.orientation].map((v) => ({ name: v })) },
      { name: 'Frame', values: FRAMES.map((v) => ({ name: v })) },
    ],
    ...(categoryId ? { category: categoryId } : {}),
  }
  const d = gql(
    `mutation Create($input: ProductCreateInput!) {
      productCreate(product: $input) {
        product { id handle variants(first: 1) { nodes { id } } }
        userErrors { field message } } }`,
    { input },
    true,
  )
  const product = d.productCreate.product
  // productCreate seeds one default variant from the option grid; the bulk
  // create below adds the remaining 8, so that first one has to go.
  gql(
    `mutation V($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkCreate(productId: $productId, variants: $variants, strategy: REMOVE_STANDALONE_VARIANT) {
        productVariants { id title } userErrors { field message } } }`,
    { productId: product.id, variants: variantsFor(p) },
    true,
  )
  return product
}

function updateProduct(p, existing) {
  gql(
    `mutation Update($input: ProductUpdateInput!) {
      productUpdate(product: $input) { product { id } userErrors { field message } } }`,
    {
      input: {
        id: existing.id,
        handle: p.handle,
        title: p.title,
        descriptionHtml: descriptionHtml(p),
        vendor: VENDOR,
        productType: PRODUCT_TYPE,
        tags: p.tags,
        seo: { title: `${p.title} | TNES.`, description: seoDescription(p) },
      },
    },
    true,
  )
  return existing
}

// ---------------------------------------------------------------------- media

function uploadImage(productId, p, existingMedia) {
  const file = join(DIR, 'images', `${p.handle}.jpg`)
  if (!existsSync(file)) throw new Error(`missing prepared image: ${file}`)

  // The 12 live works already carry their master image; only the alt text is
  // missing, so re-uploading would just duplicate media and lose the ordering.
  if (existingMedia?.length) {
    gql(
      `mutation Alt($productId: ID!, $media: [UpdateMediaInput!]!) {
        productUpdateMedia(productId: $productId, media: $media) {
          mediaUserErrors { field message } } }`,
      { productId, media: [{ id: existingMedia[0].id, alt: p.alt }] },
      true,
    )
    return 'alt updated'
  }

  const staged = gql(
    `mutation Staged($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets { url resourceUrl parameters { name value } }
        userErrors { field message } } }`,
    {
      input: [{
        filename: `${p.handle}.jpg`,
        mimeType: 'image/jpeg',
        resource: 'IMAGE',
        httpMethod: 'POST',
      }],
    },
    true,
  ).stagedUploadsCreate.stagedTargets[0]

  const curl = staged.parameters.flatMap((x) => ['-F', `${x.name}=${x.value}`])
  execFileSync('curl', ['-sS', '-f', ...curl, '-F', `file=@${file}`, staged.url])

  gql(
    `mutation Media($productId: ID!, $media: [CreateMediaInput!]!) {
      productCreateMedia(productId: $productId, media: $media) {
        media { alt } mediaUserErrors { field message } } }`,
    {
      productId,
      media: [{
        originalSource: staged.resourceUrl,
        mediaContentType: 'IMAGE',
        alt: p.alt,
      }],
    },
    true,
  )
  return 'uploaded'
}

// ----------------------------------------------------------------- metafields

function setMetafields(productId, p) {
  const mf = [
    ['country', 'single_line_text_field', p.country],
    ['continent', 'single_line_text_field', p.continent],
    ['location', 'single_line_text_field', p.location],
    ['year', 'number_integer', String(p.year)],
    ['subject', 'list.single_line_text_field', JSON.stringify(p.subject)],
    ['orientation', 'single_line_text_field', p.orientation],
    ['display_order', 'number_integer', String(p.order)],
    ['color', 'list.single_line_text_field', JSON.stringify(p.colors)],
  ]
  // A blank Travel Note must stay unset, not empty: the theme hides the whole
  // module on absence, and an empty string would render a heading with no body.
  if (p.travel_note) mf.push(['travel_note', 'multi_line_text_field', p.travel_note])

  gql(
    `mutation Set($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) { userErrors { field message } } }`,
    {
      metafields: mf.map(([key, type, value]) => ({
        ownerId: productId, namespace: 'custom', key, type, value,
      })),
    },
    true,
  )
}

function setRelated(productId, ids) {
  gql(
    `mutation Set($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) { userErrors { field message } } }`,
    {
      metafields: [{
        ownerId: productId,
        namespace: 'custom',
        key: 'related_works',
        type: 'list.product_reference',
        value: JSON.stringify(ids),
      }],
    },
    true,
  )
}

// ------------------------------------------------------------------- redirect

function ensureRedirect(from, to) {
  const path = `/products/${from}`
  const existing = gql(
    `query R($q: String!) { urlRedirects(first: 1, query: $q) { nodes { id } } }`,
    { q: `path:${path}` },
  ).urlRedirects.nodes[0]
  if (existing) return 'exists'
  gql(
    `mutation R($input: UrlRedirectInput!) {
      urlRedirectCreate(urlRedirect: $input) { userErrors { field message } } }`,
    { input: { path, target: `/products/${to}` } },
    true,
  )
  return 'created'
}

// ----------------------------------------------------------------------- main

const products = JSON.parse(readFileSync(join(DIR, 'products.json'), 'utf8'))

if (DRY) {
  for (const p of products) {
    console.log(`${String(p.order).padStart(2, '0')}  ${p.handle.padEnd(30)} ` +
      `${p.orientation.padEnd(9)} ${SIZES[p.orientation].join('/')}  ` +
      `${p.subject.join(', ')}`)
  }
  console.log(`\n${products.length} works, ${products.length * FRAMES.length * 3} variants. No calls made.`)
  process.exit(0)
}

// Fail on auth before creating anything, so a bad token can't leave the store
// half-populated.
console.log(`auth: ${TOKEN ? 'SHOPIFY_ADMIN_TOKEN' : 'shopify store auth'}`)
try {
  console.log(`  connected to ${gql('{ shop { name } }').shop.name} (${STORE})`)
} catch (e) {
  const hint = TOKEN
    ? 'token rejected — check it is the Admin API token (shpat_...), that the app\n' +
      '  is installed on the store, and that it has the write_products scope'
    : 'no stored session — set SHOPIFY_ADMIN_TOKEN, or run `shopify store auth`'
  console.error(`\ncannot reach the Admin API.\n  ${hint}\n\n${e.message}`)
  process.exit(1)
}

console.log('\nmetafield definitions')
ensureDefinitions()

console.log('\ntaxonomy')
const categoryId = taxonomyCategory()

console.log('\nproducts')
const ids = new Map()
for (const p of products) {
  const existing = findProduct(p.handle)
    // Grey Day is the one handle that has to move: the live one misspells
    // Moraira. Find it under the old handle so the update lands in place.
    ?? (p.oldHandle ? findProduct(p.oldHandle) : null)

  const product = existing ? updateProduct(p, existing) : createProduct(p, categoryId)
  const media = uploadImage(product.id, p, existing?.media?.nodes)
  setMetafields(product.id, p)
  ids.set(p.title, product.id)
  console.log(`  ${String(p.order).padStart(2, '0')} ${p.title.padEnd(22)} ` +
    `${existing ? 'updated' : 'created'}, image ${media}`)
}

console.log('\nrelated works')
for (const p of products) {
  if (!p.related.length) continue
  setRelated(ids.get(p.title), p.related.map((t) => ids.get(t)))
  console.log(`  ${p.title.padEnd(22)} -> ${p.related.join(', ')}`)
}

console.log('\nredirects')
for (const p of products) {
  if (p.oldHandle) console.log(`  ${p.oldHandle} -> ${p.handle}: ${ensureRedirect(p.oldHandle, p.handle)}`)
}

console.log(`\ndone. ${calls} GraphQL calls.`)

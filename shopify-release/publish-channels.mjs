// productCreate deixa o produto ACTIVE mas sem canal de venda nenhum, e a
// Storefront API so enxerga o que esta publicado — por isso as 18 obras novas
// apareciam no site sem preco, caindo no inquiry-only.
//
// Publica cada obra exatamente nos canais que os 12 produtos originais usam,
// em vez de numa lista fixa, para nao inventar um canal que a loja nao quer.
// Idempotente: publicar o que ja esta publicado nao faz nada.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const STORE = 'tnes-3.myshopify.com'
const REFERENCE = 'rio-runner' // um dos 12 originais, ja publicado corretamente
const TMP = mkdtempSync(join(tmpdir(), 'tnes-pub-'))
const { SHOPIFY_CLIENT_ID: id, SHOPIFY_CLIENT_SECRET: secret } = process.env
if (!id || !secret) throw new Error('source ~/.tnes-shopify-env primeiro')

writeFileSync(join(TMP, 'oauth.txt'),
  `grant_type=client_credentials&client_id=${id}&client_secret=${secret}`, { mode: 0o600 })
const TOKEN = JSON.parse(execFileSync('curl', ['-sS', '--fail-with-body', '-X', 'POST',
  `https://${STORE}/admin/oauth/access_token`, '-H', 'Content-Type: application/x-www-form-urlencoded',
  '--data-binary', `@${join(TMP, 'oauth.txt')}`], { encoding: 'utf8' })).access_token
writeFileSync(join(TMP, 'curlrc'),
  `header = "X-Shopify-Access-Token: ${TOKEN}"\nheader = "Content-Type: application/json"\n`, { mode: 0o600 })

function gql(query, variables = {}) {
  writeFileSync(join(TMP, 'body.json'), JSON.stringify({ query, variables }))
  const res = JSON.parse(execFileSync('curl', ['-sS', '--fail-with-body', '--config', join(TMP, 'curlrc'),
    '-X', 'POST', `https://${STORE}/admin/api/2026-07/graphql.json`,
    '--data-binary', `@${join(TMP, 'body.json')}`], { encoding: 'utf8' }))
  if (res.errors?.length) throw new Error(JSON.stringify(res.errors))
  for (const v of Object.values(res.data ?? {})) if (v?.userErrors?.length) throw new Error(JSON.stringify(v.userErrors))
  return res.data
}

const PUBS = `resourcePublicationsV2(first: 20) { nodes { publication { id name } isPublished } }`
const reference = gql(`query { productByHandle(handle: "${REFERENCE}") { ${PUBS} } }`)
  .productByHandle.resourcePublicationsV2.nodes.filter((n) => n.isPublished).map((n) => n.publication)
console.log(`canais de ${REFERENCE}: ${reference.map((p) => p.name).join(', ')}\n`)

const products = JSON.parse(readFileSync('/home/eduardo/TNES/shopify-release/products.json', 'utf8'))
let published = 0
for (const p of products) {
  const prod = gql(`query P($h: String!) { productByHandle(handle: $h) { id ${PUBS} } }`, { h: p.handle }).productByHandle
  const on = new Set(prod.resourcePublicationsV2.nodes.filter((n) => n.isPublished).map((n) => n.publication.id))
  const missing = reference.filter((pub) => !on.has(pub.id))
  if (!missing.length) { console.log(`  ${p.handle.padEnd(30)} ja publicado`); continue }
  gql(`mutation Pub($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) { userErrors { field message } } }`,
    { id: prod.id, input: missing.map((pub) => ({ publicationId: pub.id })) })
  published++
  console.log(`  ${p.handle.padEnd(30)} -> ${missing.map((m) => m.name).join(', ')}`)
}
console.log(`\n${published} obras publicadas.`)

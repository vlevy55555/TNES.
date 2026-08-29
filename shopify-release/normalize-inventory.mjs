// Os 18 produtos novos nasceram com inventoryPolicy DENY (o default da API);
// os 12 que ja estavam na loja usam CONTINUE. Alinha todos ao padrao da loja.
// Idempotente: reaplica sem efeito colateral.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const STORE = 'tnes-3.myshopify.com'
const TMP = mkdtempSync(join(tmpdir(), 'tnes-inv-'))
const { SHOPIFY_CLIENT_ID: id, SHOPIFY_CLIENT_SECRET: secret } = process.env
if (!id || !secret) throw new Error('source ~/.tnes-shopify-env primeiro')

writeFileSync(join(TMP, 'oauth.txt'),
  `grant_type=client_credentials&client_id=${id}&client_secret=${secret}`, { mode: 0o600 })
const TOKEN = JSON.parse(execFileSync('curl', ['-sS', '--fail-with-body', '-X', 'POST',
  `https://${STORE}/admin/oauth/access_token`,
  '-H', 'Content-Type: application/x-www-form-urlencoded',
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

const products = JSON.parse(readFileSync('/home/eduardo/TNES/shopify-release/products.json', 'utf8'))
let fixed = 0
for (const p of products) {
  const prod = gql(`query P($h: String!) { productByHandle(handle: $h) {
    id variants(first: 20) { nodes { id inventoryPolicy } } } }`, { h: p.handle }).productByHandle
  const off = prod.variants.nodes.filter((v) => v.inventoryPolicy !== 'CONTINUE')
  if (!off.length) { console.log(`  ${p.handle.padEnd(30)} ja CONTINUE`); continue }
  gql(`mutation V($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      userErrors { field message } } }`,
    { productId: prod.id, variants: off.map((v) => ({ id: v.id, inventoryPolicy: 'CONTINUE' })) })
  fixed += off.length
  console.log(`  ${p.handle.padEnd(30)} ${off.length} variantes -> CONTINUE`)
}
console.log(`\n${fixed} variantes normalizadas.`)

// Adiciona um novo valor ao option Frame nos 30 produtos: uma variante por
// tamanho, com o preco da variante White do mesmo tamanho (lido da loja, nao
// hardcoded, para seguir qualquer reajuste feito no admin).
//   node shopify-release/add-frame-value.mjs "Glass Block" [--dry-run]
// Idempotente: tamanhos que ja tem o valor sao pulados.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const STORE = 'tnes-3.myshopify.com'
const GLASS = process.argv.slice(2).find((a) => !a.startsWith('--'))
if (!GLASS) throw new Error('uso: add-frame-value.mjs "<Frame value>" [--dry-run]')
const DRY = process.argv.includes('--dry-run')
const TMP = mkdtempSync(join(tmpdir(), 'tnes-glass-'))
const { SHOPIFY_CLIENT_ID: id, SHOPIFY_CLIENT_SECRET: secret } = process.env
if (!id || !secret) throw new Error('source ~/.tnes-shopify-env primeiro')

writeFileSync(join(TMP, 'oauth.txt'),
  `grant_type=client_credentials&client_id=${id}&client_secret=${secret}`, { mode: 0o600 })
const TOKEN = JSON.parse(execFileSync('curl', ['-sS', '--fail-with-body', '-X', 'POST',
  `https://${STORE}/admin/oauth/access_token`, '-H', 'Content-Type: application/x-www-form-urlencoded',
  '--data-binary', `@${join(TMP, 'oauth.txt')}`], { encoding: 'utf8' })).access_token
writeFileSync(join(TMP, 'curlrc'),
  `header = "X-Shopify-Access-Token: ${TOKEN}"\nheader = "Content-Type: application/json"\n`, { mode: 0o600 })

function gql(query, variables = {}, tries = 3) {
  writeFileSync(join(TMP, 'body.json'), JSON.stringify({ query, variables }))
  for (let i = 1; ; i++) {
    try {
      const res = JSON.parse(execFileSync('curl', ['-sS', '--fail-with-body', '--config', join(TMP, 'curlrc'),
        '-X', 'POST', `https://${STORE}/admin/api/2026-07/graphql.json`,
        '--data-binary', `@${join(TMP, 'body.json')}`], { encoding: 'utf8' }))
      if (res.errors?.length) throw new Error(JSON.stringify(res.errors))
      for (const v of Object.values(res.data ?? {})) if (v?.userErrors?.length) throw new Error(JSON.stringify(v.userErrors))
      return res.data
    } catch (e) {
      if (i >= tries) throw e
      execFileSync('sleep', [String(i * 2)])
    }
  }
}

const products = JSON.parse(readFileSync('/home/eduardo/TNES/shopify-release/products.json', 'utf8'))
let created = 0
for (const p of products) {
  const prod = gql(`query P($h: String!) { productByHandle(handle: $h) {
    id variants(first: 50) { nodes { price selectedOptions { name value } } } } }`, { h: p.handle }).productByHandle
  const opt = (v, name) => v.selectedOptions.find((o) => o.name === name)?.value
  const whites = prod.variants.nodes.filter((v) => opt(v, 'Frame') === 'White')
  const have = new Set(prod.variants.nodes.filter((v) => opt(v, 'Frame') === GLASS).map((v) => opt(v, 'Size')))
  const missing = whites.filter((v) => !have.has(opt(v, 'Size')))
  if (!missing.length) { console.log(`  ${p.handle.padEnd(30)} ja tem ${GLASS}`); continue }
  const variants = missing.map((v) => ({
    optionValues: [{ optionName: 'Size', name: opt(v, 'Size') }, { optionName: 'Frame', name: GLASS }],
    price: v.price,
    // mesmo padrao das outras 9: feito sob encomenda, estoque nunca bloqueia
    inventoryPolicy: 'CONTINUE',
    inventoryItem: { tracked: false },
  }))
  console.log(`  ${p.handle.padEnd(30)} + ${variants.map((v) => `${v.optionValues[0].name}=$${v.price}`).join(' ')}`)
  if (DRY) continue
  gql(`mutation V($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkCreate(productId: $productId, variants: $variants) { userErrors { field message } } }`,
    { productId: prod.id, variants })
  created += variants.length
}
console.log(DRY ? '\ndry-run, nada escrito.' : `\n${created} variantes ${GLASS} criadas.`)

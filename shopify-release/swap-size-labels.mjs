// Os rotulos de tamanho descreviam a orientacao oposta a da obra: paisagens
// vendidas como 20x30 (forma de retrato) e retratos como 30x20. A correcao e
// inverter os dois numeros de cada rotulo, o que vale para os 30 igualmente.
//
// So renomeia valores de opcao: as variantes, seus ids e seus precos ficam onde
// estao, entao os degraus 1600/2100/2600 seguem colados ao mesmo degrau fisico.
// Idempotente — reaplicar volta ao estado errado, entao ele checa antes de agir.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const STORE = 'tnes-3.myshopify.com'
const TMP = mkdtempSync(join(tmpdir(), 'tnes-size-'))
const DRY = process.argv.includes('--dry-run')
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

/** '20x30' -> '30x20'. Anything that is not a WxH pair is left untouched. */
const flip = (name) => {
  const m = /^(\d+)x(\d+)$/.exec(name)
  return m ? `${m[2]}x${m[1]}` : name
}

const products = JSON.parse(readFileSync('/home/eduardo/TNES/shopify-release/products.json', 'utf8'))
let changed = 0
for (const p of products) {
  const prod = gql(`query P($h: String!) { productByHandle(handle: $h) {
    id options { id name optionValues { id name } } } }`, { h: p.handle }).productByHandle
  const size = prod.options.find((o) => o.name === 'Size')
  if (!size) { console.log(`  ${p.handle}: sem opcao Size`); continue }

  const wanted = p.orientation === 'Landscape'
    ? ['30x20', '36x24', '42x28']
    : ['20x30', '24x36', '28x42']
  const current = size.optionValues.map((v) => v.name)
  if (current.join() === wanted.join()) { console.log(`  ${p.handle.padEnd(30)} ja correto`); continue }

  const updates = size.optionValues
    .map((v) => ({ id: v.id, name: flip(v.name) }))
    .filter((v, i) => v.name !== size.optionValues[i].name)
  console.log(`  ${p.handle.padEnd(30)} ${current.join('/')} -> ${updates.map((u) => u.name).join('/')}`)
  if (DRY) continue
  gql(`mutation O($productId: ID!, $option: OptionUpdateInput!, $optionValuesToUpdate: [OptionValueUpdateInput!]) {
    productOptionUpdate(productId: $productId, option: $option, optionValuesToUpdate: $optionValuesToUpdate) {
      userErrors { field message } } }`,
    { productId: prod.id, option: { id: size.id }, optionValuesToUpdate: updates })
  changed++
}
console.log(`\n${changed} produtos atualizados${DRY ? ' (dry-run: nenhum)' : ''}.`)

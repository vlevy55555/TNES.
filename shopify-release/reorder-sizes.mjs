// productOptionUpdate empurra o valor renomeado para o fim da lista, entao o
// swap de rotulos deixou as 18 obras novas com o menor tamanho por ultimo:
// ['24x36','28x42','20x30']. Isso quebra a ordem no seletor e faz middleValue
// apontar para o tamanho mais caro. Restaura menor -> maior.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const STORE = 'tnes-3.myshopify.com'
const TMP = mkdtempSync(join(tmpdir(), 'tnes-order-'))
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
      // A loja devolveu 503 no meio de um run anterior; um retry curto evita
      // ter que reexecutar tudo por causa de um soluco de rede.
      if (i >= tries) throw e
      execFileSync('sleep', [String(i * 2)])
    }
  }
}

const ORDER = { Landscape: ['30x20', '36x24', '42x28'], Portrait: ['20x30', '24x36', '28x42'] }
const products = JSON.parse(readFileSync('/home/eduardo/TNES/shopify-release/products.json', 'utf8'))
let fixed = 0
for (const p of products) {
  const prod = gql(`query P($h: String!) { productByHandle(handle: $h) {
    id options { id name optionValues { id name } } } }`, { h: p.handle }).productByHandle
  const size = prod.options.find((o) => o.name === 'Size')
  const wanted = ORDER[p.orientation]
  if (size.optionValues.map((v) => v.name).join() === wanted.join()) {
    console.log(`  ${p.handle.padEnd(30)} ja em ordem`); continue
  }
  gql(`mutation R($productId: ID!, $options: [OptionReorderInput!]!) {
    productOptionsReorder(productId: $productId, options: $options) { userErrors { field message } } }`,
    {
      productId: prod.id,
      options: [{
        id: size.id,
        values: wanted.map((name) => ({ id: size.optionValues.find((v) => v.name === name).id })),
      }],
    })
  fixed++
  console.log(`  ${p.handle.padEnd(30)} ${size.optionValues.map((v) => v.name).join('/')} -> ${wanted.join('/')}`)
}
console.log(`\n${fixed} produtos reordenados.`)

// Idempotently connect published Sanity edits to a Vercel production deploy hook.
// Keep the deploy hook URL in .env; it grants anyone holding it the ability to deploy.
import path from 'node:path'
import { loadEnv } from 'vite'
import { SANITY } from './config.mjs'

const root = path.resolve(import.meta.dirname, '../..')
const env = { ...loadEnv('development', root, ['SANITY_', 'VERCEL_']), ...process.env }
const token = env.SANITY_WRITE_TOKEN?.trim()
const hookUrl = env.VERCEL_DEPLOY_HOOK_URL?.trim()
const checkOnly = process.argv.includes('--check')
if (!token) throw new Error('Defina SANITY_WRITE_TOKEN no .env local.')
if (!hookUrl && !checkOnly) throw new Error('Defina VERCEL_DEPLOY_HOOK_URL no .env local.')

if (hookUrl) {
  let target
  try { target = new URL(hookUrl) } catch { throw new Error('VERCEL_DEPLOY_HOOK_URL inválida.') }
  if (target.protocol !== 'https:' || target.hostname !== 'api.vercel.com' || !target.pathname.startsWith('/v1/integrations/deploy/')) {
    throw new Error('VERCEL_DEPLOY_HOOK_URL deve ser uma URL de Deploy Hook da Vercel.')
  }
}

const endpoint = `https://${SANITY.projectId}.api.sanity.io/v${SANITY.apiVersion}/hooks/projects/${SANITY.projectId}`
async function request(method, body) {
  const response = await fetch(endpoint, {
    method,
    headers: { authorization: `Bearer ${token}`, ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new Error(`API de webhooks do Sanity respondeu ${response.status}`)
  return response.json()
}

const name = 'TNES - Vercel production'
const filter = '_type in ["artwork", "catalog", "moment", "siteSettings", "homePage", "worksPage", "aboutPage", "momentsPage"]'
const hooks = await request('GET')
if (!Array.isArray(hooks)) throw new Error('Resposta inesperada ao listar webhooks do Sanity')
const existing = hooks.find((hook) => hook.name === name && hook.dataset === SANITY.dataset)
if (checkOnly) {
  console.log(`${hooks.length} webhook(s) no projeto; ${existing ? 'TNES encontrado' : 'TNES não configurado'}.`)
} else if (existing) {
  if (existing.url !== hookUrl || existing.rule?.filter !== filter || existing.isDisabled || existing.isDisabledByUser) {
    throw new Error('Já existe um webhook TNES diferente ou desativado. Revise-o em Sanity → API → Webhooks antes de continuar.')
  }
  console.log(`Webhook ativo e já configurado (${existing.id}).`)
} else {
  const created = await request('POST', {
    type: 'document',
    name,
    dataset: SANITY.dataset,
    url: hookUrl,
    apiVersion: `v${SANITY.apiVersion}`,
    httpMethod: 'POST',
    includeDrafts: false,
    includeAllVersions: false,
    rule: {
      on: ['create', 'update', 'delete'],
      filter,
      projection: '{ "_id": _id }',
    },
  })
  console.log(`Webhook criado (${created.id ?? 'ID indisponível'}).`)
}

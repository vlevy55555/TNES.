import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Vercel runs api/*.js in production; in `npm run dev` this hands the same
// requests to the same function, with the server-only vars from .env.
function apiInDev(): Plugin {
  return {
    name: 'tnes-api-in-dev',
    apply: 'serve',
    configureServer(server) {
      Object.assign(process.env, loadEnv('development', process.cwd(), ['MAILERLITE_', 'RESEND_', 'CONTACT_']))
      server.middlewares.use('/api', async (req, res, next) => {
        const name = req.url?.split('?')[0].replace(/^\//, '')
        if (name !== 'subscribe' && name !== 'contact') return next()
        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk as Buffer)
        const { POST } = await server.ssrLoadModule(`/api/${name}.js`)
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end()
          return
        }
        const response: Response = await POST(new Request(`http://localhost${req.originalUrl}`, {
          method: 'POST',
          headers: req.headers as Record<string, string>,
          body: Buffer.concat(chunks),
        }))
        res.statusCode = response.status
        response.headers.forEach((value, key) => res.setHeader(key, value))
        res.end(await response.text())
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), apiInDev()],
  server: { port: 5173 },
})

import Fastify from 'fastify'
import cors from '@fastify/cors'
import { localhostOnly } from './middleware/localhost-only.js'
import { authMiddleware } from './middleware/auth.js'
import { registerHealthRoutes } from './routes/health.js'
import { registerKeyRoutes } from './routes/keys.js'
import { registerPairRoutes } from './routes/pair.js'

export interface DaemonOptions {
  port?: number
  host?: string
}

const DEFAULT_PORT = 21520
const PORT_RANGE = 10 // Try ports 21520-21529

export async function createServer(options: DaemonOptions = {}) {
  const app = Fastify({
    logger: false,
  })

  // Register CORS for browser extension requests
  await app.register(cors, {
    origin: true, // Allow all origins (browser extension needs this)
    methods: ['GET', 'POST', 'DELETE'],
  })

  // Security middleware
  app.addHook('onRequest', localhostOnly)
  app.addHook('onRequest', authMiddleware)

  // Routes
  registerHealthRoutes(app)
  registerKeyRoutes(app)
  registerPairRoutes(app)

  return app
}

export async function startServer(options: DaemonOptions = {}): Promise<{
  app: ReturnType<typeof Fastify>
  port: number
}> {
  const app = await createServer(options)
  const host = options.host || '127.0.0.1'
  const preferredPort = options.port || DEFAULT_PORT

  // Try preferred port, then fallback range
  for (let port = preferredPort; port < preferredPort + PORT_RANGE; port++) {
    try {
      await app.listen({ port, host })
      await writeDaemonPort(port)
      return { app: app as any, port }
    } catch (err: any) {
      if (err.code === 'EADDRINUSE' && port < preferredPort + PORT_RANGE - 1) {
        continue
      }
      throw err
    }
  }

  throw new Error(`Could not find available port in range ${preferredPort}-${preferredPort + PORT_RANGE - 1}`)
}

async function writeDaemonPort(port: number): Promise<void> {
  const { getWalletDir, ensureWalletDir } = await import('@ai-wallet/vault-core')
  const fs = await import('node:fs')
  const path = await import('node:path')

  ensureWalletDir()
  const portFile = path.join(getWalletDir(), 'daemon.port')
  fs.writeFileSync(portFile, String(port), { mode: 0o600 })
}

export { pairingManager } from './pairing.js'

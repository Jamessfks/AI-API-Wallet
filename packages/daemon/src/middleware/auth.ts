import type { FastifyRequest, FastifyReply } from 'fastify'
import { validateToken } from '@ai-wallet/vault-core'

// Routes that don't require authentication
const PUBLIC_ROUTES = new Set(['/v1/health', '/v1/pair'])

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  // Skip auth for public routes
  if (PUBLIC_ROUTES.has(request.url) || request.url.startsWith('/v1/pair/')) {
    return
  }

  const authHeader = request.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    reply.code(401).send({
      error: 'not_authorized',
      message: 'Missing or invalid authorization header',
      pairingUrl: `http://localhost:${(request.server.addresses()[0] as any)?.port || 21520}/v1/pair`,
    })
    return
  }

  const token = authHeader.slice(7)
  const app = validateToken(token)

  if (!app) {
    reply.code(401).send({
      error: 'invalid_token',
      message: 'Token is invalid or has been revoked',
    })
    return
  }

  // Attach the authorized app to the request for downstream use
  ;(request as any).authorizedApp = app
}

import type { FastifyInstance } from 'fastify'
import {
  addKey,
  getKey,
  removeKey,
  listKeys,
  type Provider,
  type AuthorizedApp,
  PROVIDERS,
} from '@ai-wallet/vault-core'

export function registerKeyRoutes(app: FastifyInstance) {
  // List all stored providers (no plaintext keys)
  app.get('/v1/keys', async () => {
    const keys = listKeys()
    return { keys }
  })

  // Get a decrypted key by provider
  app.get<{ Params: { provider: string } }>('/v1/keys/:provider', async (request, reply) => {
    const { provider } = request.params
    const authorizedApp = (request as any).authorizedApp as AuthorizedApp

    // Validate provider
    if (!PROVIDERS.includes(provider as Provider)) {
      reply.code(400).send({ error: 'invalid_provider', message: `Unknown provider: ${provider}` })
      return
    }

    // Check permissions
    if (!authorizedApp.permissions.includes(provider as Provider)) {
      reply.code(403).send({
        error: 'insufficient_permissions',
        message: `App "${authorizedApp.name}" does not have access to ${provider} keys`,
      })
      return
    }

    const key = getKey(provider as Provider)
    if (!key) {
      reply.code(404).send({ error: 'not_found', message: `No key stored for ${provider}` })
      return
    }

    return { provider, key }
  })

  // Store a new key
  app.post<{ Body: { provider: string; key: string; label?: string } }>(
    '/v1/keys',
    async (request, reply) => {
      const { provider, key, label } = request.body || {}

      if (!provider || !key) {
        reply
          .code(400)
          .send({ error: 'missing_fields', message: 'provider and key are required' })
        return
      }

      if (!PROVIDERS.includes(provider as Provider)) {
        reply
          .code(400)
          .send({ error: 'invalid_provider', message: `Unknown provider: ${provider}` })
        return
      }

      const entry = addKey(provider as Provider, key, label)
      reply.code(201).send({
        id: entry.id,
        provider: entry.provider,
        label: entry.label,
        keyPrefix: entry.keyPrefix,
        createdAt: entry.createdAt,
      })
    },
  )

  // Delete a key
  app.delete<{ Params: { id: string } }>('/v1/keys/:id', async (request, reply) => {
    const { id } = request.params
    const removed = removeKey(id)

    if (!removed) {
      reply.code(404).send({ error: 'not_found', message: `No key with id: ${id}` })
      return
    }

    return { success: true }
  })
}

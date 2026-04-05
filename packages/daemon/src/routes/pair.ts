import type { FastifyInstance } from 'fastify'
import { removeAuthorizedApp, listAuthorizedApps, PROVIDERS, type Provider } from '@ai-wallet/vault-core'
import { pairingManager } from '../pairing.js'

export function registerPairRoutes(app: FastifyInstance) {
  // Initiate a pairing request
  app.post<{ Body: { appName: string; permissions?: string[] } }>(
    '/v1/pair',
    async (request, reply) => {
      const { appName, permissions } = request.body || {}

      if (!appName) {
        reply.code(400).send({ error: 'missing_fields', message: 'appName is required' })
        return
      }

      const validPermissions = (permissions || [...PROVIDERS]).filter((p) =>
        PROVIDERS.includes(p as Provider),
      ) as Provider[]

      const pairingRequest = pairingManager.createRequest(appName, validPermissions)

      reply.code(202).send({
        requestId: pairingRequest.id,
        status: 'pending',
        message: 'Pairing request created. Waiting for user approval in the desktop app.',
        pollUrl: `/v1/pair/${pairingRequest.id}/status`,
      })
    },
  )

  // Poll pairing status
  app.get<{ Params: { requestId: string } }>(
    '/v1/pair/:requestId/status',
    async (request, reply) => {
      const { requestId } = request.params
      const pairingRequest = pairingManager.getRequest(requestId)

      if (!pairingRequest) {
        reply.code(404).send({ error: 'not_found', message: 'Pairing request not found or expired' })
        return
      }

      if (pairingRequest.status === 'approved' && pairingRequest.token) {
        return {
          status: 'approved',
          token: pairingRequest.token,
        }
      }

      if (pairingRequest.status === 'denied') {
        reply.code(403).send({ status: 'denied', message: 'User denied the pairing request' })
        return
      }

      return { status: 'pending' }
    },
  )

  // Approve a pairing request (called from desktop app UI)
  app.post<{ Params: { requestId: string } }>(
    '/v1/pair/:requestId/approve',
    async (request, reply) => {
      const { requestId } = request.params
      const token = pairingManager.approveRequest(requestId)

      if (!token) {
        reply
          .code(404)
          .send({ error: 'not_found', message: 'Pairing request not found or already resolved' })
        return
      }

      return { status: 'approved', token }
    },
  )

  // Deny a pairing request (called from desktop app UI)
  app.post<{ Params: { requestId: string } }>(
    '/v1/pair/:requestId/deny',
    async (request, reply) => {
      const { requestId } = request.params
      const denied = pairingManager.denyRequest(requestId)

      if (!denied) {
        reply
          .code(404)
          .send({ error: 'not_found', message: 'Pairing request not found or already resolved' })
        return
      }

      return { status: 'denied' }
    },
  )

  // List authorized apps
  app.get('/v1/pair/apps', async () => {
    return { apps: listAuthorizedApps() }
  })

  // Revoke an authorized app
  app.delete<{ Params: { appId: string } }>('/v1/pair/:appId', async (request, reply) => {
    const { appId } = request.params
    const removed = removeAuthorizedApp(appId)

    if (!removed) {
      reply.code(404).send({ error: 'not_found', message: `No app with id: ${appId}` })
      return
    }

    return { success: true }
  })
}

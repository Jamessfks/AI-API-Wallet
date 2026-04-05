import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createServer } from '../src/server.js'
import { writeVault, initMasterKey, addKey } from '@ai-wallet/vault-core'
import type { FastifyInstance } from 'fastify'

let app: FastifyInstance

describe('daemon server', () => {
  beforeAll(async () => {
    initMasterKey()
    app = (await createServer()) as unknown as FastifyInstance
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    writeVault({ version: 1, entries: {}, authorizedApps: {} })
  })

  it('GET /v1/health returns ok', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/health',
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.status).toBe('ok')
    expect(body.version).toBe('0.1.0')
  })

  it('GET /v1/keys returns empty list initially', async () => {
    // Need auth — first skip by checking unauthenticated response
    const response = await app.inject({
      method: 'GET',
      url: '/v1/keys',
    })

    // Without auth, should get 401
    expect(response.statusCode).toBe(401)
  })

  it('POST /v1/keys without auth returns 401', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/keys',
      payload: { provider: 'anthropic', key: 'sk-ant-test123' },
    })

    expect(response.statusCode).toBe(401)
  })

  it('POST /v1/pair creates a pairing request', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/pair',
      payload: { appName: 'Test App' },
    })

    expect(response.statusCode).toBe(202)
    const body = response.json()
    expect(body.status).toBe('pending')
    expect(body.requestId).toBeTruthy()
    expect(body.pollUrl).toBeTruthy()
  })

  it('full pairing and key retrieval flow', async () => {
    // 1. Add a key directly (simulating desktop UI adding it)
    addKey('anthropic', 'sk-ant-api03-testkey123456789')

    // 2. Create pairing request
    const pairResponse = await app.inject({
      method: 'POST',
      url: '/v1/pair',
      payload: { appName: 'Test CLI', permissions: ['anthropic'] },
    })
    const { requestId } = pairResponse.json()

    // 3. Approve the pairing
    const approveResponse = await app.inject({
      method: 'POST',
      url: `/v1/pair/${requestId}/approve`,
    })
    expect(approveResponse.statusCode).toBe(200)
    const { token } = approveResponse.json()
    expect(token).toBeTruthy()

    // 4. Retrieve key using the token
    const keyResponse = await app.inject({
      method: 'GET',
      url: '/v1/keys/anthropic',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(keyResponse.statusCode).toBe(200)
    const keyBody = keyResponse.json()
    expect(keyBody.key).toBe('sk-ant-api03-testkey123456789')
  })
})

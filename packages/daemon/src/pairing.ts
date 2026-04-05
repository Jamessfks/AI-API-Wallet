import { addAuthorizedApp, type Provider } from '@ai-wallet/vault-core'
import { EventEmitter } from 'node:events'

export interface PairingRequest {
  id: string
  appName: string
  permissions: Provider[]
  createdAt: Date
  status: 'pending' | 'approved' | 'denied'
  token?: string
}

class PairingManager extends EventEmitter {
  private requests = new Map<string, PairingRequest>()
  private requestCounter = 0

  createRequest(appName: string, permissions: Provider[]): PairingRequest {
    const id = `pair_${++this.requestCounter}_${Date.now()}`
    const request: PairingRequest = {
      id,
      appName,
      permissions,
      createdAt: new Date(),
      status: 'pending',
    }

    this.requests.set(id, request)
    this.emit('pairing-request', request)

    // Auto-expire after 5 minutes
    setTimeout(() => {
      if (this.requests.get(id)?.status === 'pending') {
        this.requests.delete(id)
      }
    }, 5 * 60 * 1000)

    return request
  }

  approveRequest(id: string): string | null {
    const request = this.requests.get(id)
    if (!request || request.status !== 'pending') return null

    const { app, token } = addAuthorizedApp(request.appName, request.permissions)
    request.status = 'approved'
    request.token = token
    this.emit('pairing-approved', { request, app })

    return token
  }

  denyRequest(id: string): boolean {
    const request = this.requests.get(id)
    if (!request || request.status !== 'pending') return false

    request.status = 'denied'
    this.requests.delete(id)
    this.emit('pairing-denied', request)

    return true
  }

  getRequest(id: string): PairingRequest | undefined {
    return this.requests.get(id)
  }

  getPendingRequests(): PairingRequest[] {
    return Array.from(this.requests.values()).filter((r) => r.status === 'pending')
  }
}

export const pairingManager = new PairingManager()

import { ipcMain } from 'electron'
import {
  addKey,
  getKey,
  removeKey,
  listKeys,
  listAuthorizedApps,
  removeAuthorizedApp,
  type Provider,
} from '@ai-wallet/vault-core'
import { getDaemonPort, pairingManager } from './daemon-bridge.js'

export function registerIpcHandlers() {
  // Key management
  ipcMain.handle('vault:listKeys', () => listKeys())

  ipcMain.handle('vault:addKey', (_event, provider: Provider, apiKey: string, label?: string) =>
    addKey(provider, apiKey, label),
  )

  ipcMain.handle('vault:getKey', (_event, provider: Provider) => getKey(provider))

  ipcMain.handle('vault:removeKey', (_event, id: string) => removeKey(id))

  // Authorized apps
  ipcMain.handle('vault:listApps', () => listAuthorizedApps())

  ipcMain.handle('vault:removeApp', (_event, id: string) => removeAuthorizedApp(id))

  // Pairing
  ipcMain.handle('pairing:getPending', () => pairingManager.getPendingRequests())

  ipcMain.handle('pairing:approve', (_event, requestId: string) =>
    pairingManager.approveRequest(requestId),
  )

  ipcMain.handle('pairing:deny', (_event, requestId: string) =>
    pairingManager.denyRequest(requestId),
  )

  // Daemon info
  ipcMain.handle('daemon:getPort', () => getDaemonPort())
}

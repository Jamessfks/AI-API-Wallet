import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('walletAPI', {
  // Key management
  listKeys: () => ipcRenderer.invoke('vault:listKeys'),
  addKey: (provider: string, apiKey: string, label?: string) =>
    ipcRenderer.invoke('vault:addKey', provider, apiKey, label),
  getKey: (provider: string) => ipcRenderer.invoke('vault:getKey', provider),
  removeKey: (id: string) => ipcRenderer.invoke('vault:removeKey', id),

  // Authorized apps
  listApps: () => ipcRenderer.invoke('vault:listApps'),
  removeApp: (id: string) => ipcRenderer.invoke('vault:removeApp', id),

  // Pairing
  getPendingPairings: () => ipcRenderer.invoke('pairing:getPending'),
  approvePairing: (requestId: string) => ipcRenderer.invoke('pairing:approve', requestId),
  denyPairing: (requestId: string) => ipcRenderer.invoke('pairing:deny', requestId),

  // Daemon
  getDaemonPort: () => ipcRenderer.invoke('daemon:getPort'),

  // Platform
  getPlatform: () => ipcRenderer.invoke('platform:info'),
})

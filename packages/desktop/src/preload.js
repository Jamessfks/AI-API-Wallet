import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('walletAPI', {
    // Key management
    listKeys: () => ipcRenderer.invoke('vault:listKeys'),
    addKey: (provider, apiKey, label) => ipcRenderer.invoke('vault:addKey', provider, apiKey, label),
    getKey: (provider) => ipcRenderer.invoke('vault:getKey', provider),
    removeKey: (id) => ipcRenderer.invoke('vault:removeKey', id),
    // Authorized apps
    listApps: () => ipcRenderer.invoke('vault:listApps'),
    removeApp: (id) => ipcRenderer.invoke('vault:removeApp', id),
    // Pairing
    getPendingPairings: () => ipcRenderer.invoke('pairing:getPending'),
    approvePairing: (requestId) => ipcRenderer.invoke('pairing:approve', requestId),
    denyPairing: (requestId) => ipcRenderer.invoke('pairing:deny', requestId),
    // Daemon
    getDaemonPort: () => ipcRenderer.invoke('daemon:getPort'),
});
//# sourceMappingURL=preload.js.map
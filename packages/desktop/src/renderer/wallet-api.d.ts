interface WalletAPI {
  listKeys: () => Promise<
    Array<{
      id: string
      provider: string
      label: string
      keyPrefix: string
      createdAt: string
      lastUsedAt: string | null
    }>
  >
  addKey: (
    provider: string,
    apiKey: string,
    label?: string,
  ) => Promise<{
    id: string
    provider: string
    label: string
    keyPrefix: string
    createdAt: string
    lastUsedAt: string | null
  }>
  getKey: (provider: string) => Promise<string | null>
  removeKey: (id: string) => Promise<boolean>
  listApps: () => Promise<
    Array<{
      id: string
      name: string
      approvedAt: string
      permissions: string[]
      tokenHash: string
    }>
  >
  removeApp: (id: string) => Promise<boolean>
  getPendingPairings: () => Promise<
    Array<{
      id: string
      appName: string
      permissions: string[]
      createdAt: Date
      status: string
    }>
  >
  approvePairing: (requestId: string) => Promise<string | null>
  denyPairing: (requestId: string) => Promise<boolean>
  getDaemonPort: () => Promise<number | null>
  getPlatform: () => Promise<string>
}

declare global {
  interface Window {
    walletAPI: WalletAPI
  }
}

export {}

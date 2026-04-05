import { startServer, pairingManager } from '@ai-wallet/daemon'

let serverInstance: { close: () => Promise<void> } | null = null
let daemonPort: number | null = null

export async function startDaemon(): Promise<number> {
  const { app, port } = await startServer()
  serverInstance = app as unknown as { close: () => Promise<void> }
  daemonPort = port

  console.log(`AI Wallet daemon started on port ${port}`)

  // Listen for pairing requests to show UI dialogs
  pairingManager.on('pairing-request', (request: any) => {
    console.log(`Pairing request from: ${request.appName}`)
    // The renderer will poll for pending requests via IPC
  })

  return port
}

export async function stopDaemon(): Promise<void> {
  if (serverInstance) {
    await serverInstance.close()
    serverInstance = null
    daemonPort = null
  }
}

export function getDaemonPort(): number | null {
  return daemonPort
}

export { pairingManager }

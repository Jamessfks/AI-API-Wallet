const DEFAULT_PORT = 21520

async function getDaemonUrl(): Promise<string> {
  // Try stored port first, then default
  const stored = await chrome.storage.local.get('daemonPort')
  const port = stored.daemonPort || DEFAULT_PORT
  return `http://127.0.0.1:${port}`
}

async function getToken(): Promise<string | null> {
  const stored = await chrome.storage.local.get('authToken')
  return stored.authToken || null
}

export async function checkDaemonHealth(): Promise<boolean> {
  try {
    const url = await getDaemonUrl()
    const response = await fetch(`${url}/v1/health`, { signal: AbortSignal.timeout(2000) })
    return response.ok
  } catch {
    return false
  }
}

export async function saveKeyToDaemon(
  provider: string,
  key: string,
  label?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = await getDaemonUrl()
    const token = await getToken()

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${url}/v1/keys`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ provider, key, label }),
    })

    if (response.ok) {
      return { success: true }
    }

    const data = (await response.json()) as { error: string; message: string }

    if (data.error === 'not_authorized') {
      // Need to pair first
      return { success: false, error: 'not_paired' }
    }

    return { success: false, error: data.message || 'Unknown error' }
  } catch (err: any) {
    return { success: false, error: 'Cannot connect to AI Wallet. Is the desktop app running?' }
  }
}

export async function getStoredKeyCount(): Promise<number> {
  try {
    const url = await getDaemonUrl()
    const token = await getToken()

    if (!token) return 0

    const response = await fetch(`${url}/v1/keys`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (response.ok) {
      const data = (await response.json()) as { keys: any[] }
      return data.keys.length
    }
    return 0
  } catch {
    return 0
  }
}

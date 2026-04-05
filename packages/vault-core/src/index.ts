import { v4 as uuidv4 } from 'uuid'
import { encrypt, decrypt, hashToken, generateToken } from './encryption.js'
import { getMasterKey } from './master-key.js'
import { readVault, writeVault } from './storage.js'
import type { Provider, VaultEntry, AuthorizedApp, VaultData } from './types.js'

export { setSafeStorageProvider, initMasterKey, clearCachedMasterKey } from './master-key.js'
export { hashToken, generateToken } from './encryption.js'
export { readVault, writeVault, getWalletDir, getVaultPath, ensureWalletDir } from './storage.js'
export type {
  Provider,
  VaultEntry,
  VaultData,
  AuthorizedApp,
  EncryptedPayload,
} from './types.js'
export type { SafeStorageProvider } from './master-key.js'
export { PROVIDERS, ENV_VAR_MAP } from './types.js'

function makeKeyPrefix(key: string): string {
  if (key.length <= 12) return key.slice(0, 4) + '...' + key.slice(-2)
  return key.slice(0, 8) + '...' + key.slice(-4)
}

export function addKey(provider: Provider, apiKey: string, label?: string): VaultEntry {
  const vault = readVault()
  const masterKey = getMasterKey()

  const entry: VaultEntry = {
    id: uuidv4(),
    provider,
    label: label || `${provider} key`,
    keyPrefix: makeKeyPrefix(apiKey),
    encrypted: encrypt(apiKey, masterKey),
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
  }

  vault.entries[entry.id] = entry
  writeVault(vault)
  return entry
}

export function getKey(provider: Provider): string | null {
  const vault = readVault()
  const masterKey = getMasterKey()

  const entry = Object.values(vault.entries).find((e) => e.provider === provider)
  if (!entry) return null

  // Update lastUsedAt
  entry.lastUsedAt = new Date().toISOString()
  writeVault(vault)

  return decrypt(entry.encrypted, masterKey)
}

export function getKeyById(id: string): string | null {
  const vault = readVault()
  const masterKey = getMasterKey()

  const entry = vault.entries[id]
  if (!entry) return null

  entry.lastUsedAt = new Date().toISOString()
  writeVault(vault)

  return decrypt(entry.encrypted, masterKey)
}

export function removeKey(id: string): boolean {
  const vault = readVault()

  if (!vault.entries[id]) return false
  delete vault.entries[id]
  writeVault(vault)
  return true
}

export function listKeys(): Omit<VaultEntry, 'encrypted'>[] {
  const vault = readVault()
  return Object.values(vault.entries).map(({ encrypted: _, ...rest }) => rest)
}

export function getAllKeys(): Record<Provider, string> {
  const vault = readVault()
  const masterKey = getMasterKey()
  const result: Partial<Record<Provider, string>> = {}

  for (const entry of Object.values(vault.entries)) {
    if (!result[entry.provider]) {
      result[entry.provider] = decrypt(entry.encrypted, masterKey)
    }
  }

  return result as Record<Provider, string>
}

// --- Authorized Apps ---

export function addAuthorizedApp(
  name: string,
  permissions: Provider[],
): { app: AuthorizedApp; token: string } {
  const vault = readVault()
  const token = generateToken()

  const app: AuthorizedApp = {
    id: uuidv4(),
    name,
    approvedAt: new Date().toISOString(),
    permissions,
    tokenHash: hashToken(token),
  }

  vault.authorizedApps[app.id] = app
  writeVault(vault)

  return { app, token }
}

export function validateToken(token: string): AuthorizedApp | null {
  const vault = readVault()
  const hash = hashToken(token)

  return Object.values(vault.authorizedApps).find((app) => app.tokenHash === hash) || null
}

export function removeAuthorizedApp(id: string): boolean {
  const vault = readVault()

  if (!vault.authorizedApps[id]) return false
  delete vault.authorizedApps[id]
  writeVault(vault)
  return true
}

export function listAuthorizedApps(): AuthorizedApp[] {
  const vault = readVault()
  return Object.values(vault.authorizedApps)
}

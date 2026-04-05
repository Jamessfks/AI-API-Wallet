import fs from 'node:fs'
import path from 'node:path'
import { generateMasterKey } from './encryption.js'
import { getWalletDir, ensureWalletDir } from './storage.js'

const MASTER_KEY_FILE = 'master.enc'

// In Electron, safeStorage encrypts via macOS Keychain.
// Outside Electron (CLI, daemon standalone), we need the Electron app running.
// This interface allows the desktop app to inject the real safeStorage implementation.
export interface SafeStorageProvider {
  encryptString(plaintext: string): Buffer
  decryptString(encrypted: Buffer): string
  isEncryptionAvailable(): boolean
}

let safeStorageProvider: SafeStorageProvider | null = null
let cachedMasterKey: Buffer | null = null

export function setSafeStorageProvider(provider: SafeStorageProvider): void {
  safeStorageProvider = provider
}

function getMasterKeyPath(): string {
  return path.join(getWalletDir(), MASTER_KEY_FILE)
}

export function initMasterKey(): Buffer {
  if (cachedMasterKey) return cachedMasterKey

  ensureWalletDir()
  const keyPath = getMasterKeyPath()

  if (fs.existsSync(keyPath)) {
    // Read existing encrypted master key
    const encryptedBlob = fs.readFileSync(keyPath)

    if (safeStorageProvider && safeStorageProvider.isEncryptionAvailable()) {
      const hex = safeStorageProvider.decryptString(encryptedBlob)
      cachedMasterKey = Buffer.from(hex, 'hex')
    } else {
      // Fallback: read raw (development only — not secure for production)
      cachedMasterKey = Buffer.from(encryptedBlob.toString('utf8'), 'hex')
    }
  } else {
    // Generate new master key
    cachedMasterKey = generateMasterKey()
    const hex = cachedMasterKey.toString('hex')

    if (safeStorageProvider && safeStorageProvider.isEncryptionAvailable()) {
      const encrypted = safeStorageProvider.encryptString(hex)
      fs.writeFileSync(keyPath, encrypted, { mode: 0o600 })
    } else {
      // Fallback: store raw hex (development only)
      fs.writeFileSync(keyPath, hex, { mode: 0o600 })
    }
  }

  return cachedMasterKey
}

export function getMasterKey(): Buffer {
  if (cachedMasterKey) return cachedMasterKey
  return initMasterKey()
}

export function clearCachedMasterKey(): void {
  if (cachedMasterKey) {
    cachedMasterKey.fill(0)
    cachedMasterKey = null
  }
}

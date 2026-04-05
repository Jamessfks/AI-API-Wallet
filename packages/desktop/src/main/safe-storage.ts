import { safeStorage } from 'electron'
import { setSafeStorageProvider, initMasterKey } from '@ai-wallet/vault-core'

export function initSafeStorage() {
  if (safeStorage.isEncryptionAvailable()) {
    setSafeStorageProvider({
      encryptString: (plaintext: string) => safeStorage.encryptString(plaintext),
      decryptString: (encrypted: Buffer) => safeStorage.decryptString(encrypted),
      isEncryptionAvailable: () => safeStorage.isEncryptionAvailable(),
    })
  }

  // Initialize master key (will use safeStorage if available, dev fallback otherwise)
  initMasterKey()
}

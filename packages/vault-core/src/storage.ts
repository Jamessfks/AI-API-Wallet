import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import type { VaultData } from './types.js'

const WALLET_DIR = path.join(os.homedir(), '.ai-wallet')
const VAULT_FILE = path.join(WALLET_DIR, 'vault.json')

function emptyVault(): VaultData {
  return {
    version: 1,
    entries: {},
    authorizedApps: {},
  }
}

export function getWalletDir(): string {
  return WALLET_DIR
}

export function getVaultPath(): string {
  return VAULT_FILE
}

export function ensureWalletDir(): void {
  if (!fs.existsSync(WALLET_DIR)) {
    fs.mkdirSync(WALLET_DIR, { mode: 0o700, recursive: true })
  }
}

export function readVault(): VaultData {
  ensureWalletDir()

  if (!fs.existsSync(VAULT_FILE)) {
    return emptyVault()
  }

  const raw = fs.readFileSync(VAULT_FILE, 'utf8')
  return JSON.parse(raw) as VaultData
}

export function writeVault(data: VaultData): void {
  ensureWalletDir()

  // Atomic write: write to temp file then rename
  const tmpFile = VAULT_FILE + '.tmp'
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), { mode: 0o600 })
  fs.renameSync(tmpFile, VAULT_FILE)
}

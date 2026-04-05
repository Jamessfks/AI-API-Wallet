import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'node:fs'
import {
  addKey,
  getKey,
  removeKey,
  listKeys,
  addAuthorizedApp,
  validateToken,
  removeAuthorizedApp,
  listAuthorizedApps,
  initMasterKey,
} from '../src/index.js'
import { writeVault, getVaultPath } from '../src/storage.js'

describe('vault operations', () => {
  beforeEach(() => {
    // Reset vault to empty state before each test
    writeVault({ version: 1, entries: {}, authorizedApps: {} })
    // Initialize master key (will use dev fallback since no safeStorage)
    initMasterKey()
  })

  it('adds and retrieves a key', () => {
    const entry = addKey('anthropic', 'sk-ant-api03-test123456789abcdef')
    expect(entry.provider).toBe('anthropic')
    expect(entry.keyPrefix).toBe('sk-ant-a...cdef')

    const key = getKey('anthropic')
    expect(key).toBe('sk-ant-api03-test123456789abcdef')
  })

  it('returns null for missing provider', () => {
    expect(getKey('openai')).toBeNull()
  })

  it('removes a key', () => {
    const entry = addKey('openai', 'sk-test-openai-key-12345678')
    expect(removeKey(entry.id)).toBe(true)
    expect(getKey('openai')).toBeNull()
  })

  it('returns false when removing non-existent key', () => {
    expect(removeKey('non-existent-id')).toBe(false)
  })

  it('lists keys without encrypted data', () => {
    addKey('anthropic', 'sk-ant-test1')
    addKey('openai', 'sk-openai-test2')

    const keys = listKeys()
    expect(keys).toHaveLength(2)

    for (const key of keys) {
      expect(key).not.toHaveProperty('encrypted')
      expect(key).toHaveProperty('provider')
      expect(key).toHaveProperty('keyPrefix')
    }
  })

  it('manages authorized apps', () => {
    const { app, token } = addAuthorizedApp('Test App', ['anthropic', 'openai'])
    expect(app.name).toBe('Test App')
    expect(app.permissions).toEqual(['anthropic', 'openai'])

    const validated = validateToken(token)
    expect(validated).not.toBeNull()
    expect(validated!.name).toBe('Test App')

    expect(validateToken('wrong-token')).toBeNull()

    const apps = listAuthorizedApps()
    expect(apps).toHaveLength(1)

    expect(removeAuthorizedApp(app.id)).toBe(true)
    expect(listAuthorizedApps()).toHaveLength(0)
  })

  it('vault file contains no plaintext keys', () => {
    const apiKey = 'sk-ant-api03-supersecretkey123'
    addKey('anthropic', apiKey)

    const vaultPath = getVaultPath()
    if (fs.existsSync(vaultPath)) {
      const raw = fs.readFileSync(vaultPath, 'utf8')
      expect(raw).not.toContain('supersecretkey123')
    }
  })
})

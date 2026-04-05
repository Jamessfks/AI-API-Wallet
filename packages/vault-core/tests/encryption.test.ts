import { describe, it, expect } from 'vitest'
import crypto from 'node:crypto'
import { encrypt, decrypt, generateMasterKey, hashToken, generateToken } from '../src/encryption.js'

describe('encryption', () => {
  const masterKey = generateMasterKey()

  it('encrypts and decrypts a string round-trip', () => {
    const plaintext = 'sk-ant-api03-abc123def456'
    const payload = encrypt(plaintext, masterKey)
    const result = decrypt(payload, masterKey)
    expect(result).toBe(plaintext)
  })

  it('produces different ciphertexts for the same plaintext (random IV)', () => {
    const plaintext = 'sk-ant-api03-abc123def456'
    const p1 = encrypt(plaintext, masterKey)
    const p2 = encrypt(plaintext, masterKey)
    expect(p1.ciphertext).not.toBe(p2.ciphertext)
    expect(p1.iv).not.toBe(p2.iv)
  })

  it('fails to decrypt with wrong master key', () => {
    const plaintext = 'sk-ant-api03-abc123def456'
    const payload = encrypt(plaintext, masterKey)
    const wrongKey = generateMasterKey()
    expect(() => decrypt(payload, wrongKey)).toThrow()
  })

  it('fails to decrypt with tampered ciphertext', () => {
    const plaintext = 'sk-ant-api03-abc123def456'
    const payload = encrypt(plaintext, masterKey)
    const tampered = { ...payload, ciphertext: 'AAAA' + payload.ciphertext.slice(4) }
    expect(() => decrypt(tampered, masterKey)).toThrow()
  })

  it('generates a 32-byte master key', () => {
    const key = generateMasterKey()
    expect(key.length).toBe(32)
  })

  it('generates unique tokens', () => {
    const t1 = generateToken()
    const t2 = generateToken()
    expect(t1).not.toBe(t2)
    expect(t1.length).toBe(96) // 48 bytes = 96 hex chars
  })

  it('hashes tokens deterministically', () => {
    const token = generateToken()
    const h1 = hashToken(token)
    const h2 = hashToken(token)
    expect(h1).toBe(h2)
    expect(h1.length).toBe(64) // SHA-256 = 64 hex chars
  })
})

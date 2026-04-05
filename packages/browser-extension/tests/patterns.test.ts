import { describe, it, expect } from 'vitest'
import { detectKey, extractKey, KEY_PATTERNS } from '../src/lib/patterns.js'

describe('KEY_PATTERNS', () => {
  describe('Anthropic keys', () => {
    const anthropicKeys = [
      'sk-ant-api03-abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyz12345678',
      'sk-ant-sid01-aBcDeFgHiJkLmNoPqRsTuVwXyZ',
      'sk-ant-api03-short-but-valid-key-here',
    ]

    for (const key of anthropicKeys) {
      it(`detects: ${key.slice(0, 20)}...`, () => {
        const pattern = detectKey(key)
        expect(pattern).not.toBeNull()
        expect(pattern!.provider).toBe('anthropic')

        const extracted = extractKey(key, pattern!)
        expect(extracted).toBe(key)
      })

      it(`detects key in surrounding text: ${key.slice(0, 15)}...`, () => {
        const text = `Your API key is: ${key} — keep it secret`
        const pattern = detectKey(text)
        expect(pattern).not.toBeNull()
        expect(pattern!.provider).toBe('anthropic')

        const extracted = extractKey(text, pattern!)
        expect(extracted).toBe(key)
      })
    }
  })

  describe('OpenAI keys', () => {
    const openaiKeys = [
      'sk-proj-abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOP',
      'sk-svcacct-abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOP',
      'sk-org123-abcdefghijklmnopqrstuvwxyz',
    ]

    for (const key of openaiKeys) {
      it(`detects: ${key.slice(0, 20)}...`, () => {
        const pattern = detectKey(key)
        expect(pattern).not.toBeNull()
        expect(pattern!.provider).toBe('openai')
      })
    }

    it('does NOT match Anthropic keys as OpenAI', () => {
      const key = 'sk-ant-api03-abcdefghijklmnopqrstuvwxyz'
      const pattern = detectKey(key)
      expect(pattern).not.toBeNull()
      expect(pattern!.provider).toBe('anthropic')
    })
  })

  describe('Google keys', () => {
    it('detects AIza keys', () => {
      const key = 'AIzaSyA1234567890abcdefghijklmnopqrstuvw'
      const pattern = detectKey(key)
      expect(pattern).not.toBeNull()
      expect(pattern!.provider).toBe('google')

      const extracted = extractKey(key, pattern!)
      expect(extracted).toBe(key)
    })
  })

  describe('non-keys', () => {
    const nonKeys = [
      'hello world',
      'sk-short',
      'sk-ant-short',
      'not-a-key-at-all-even-though-its-long-enough',
      'Bearer some-jwt-token-here',
    ]

    for (const text of nonKeys) {
      it(`does NOT detect: "${text.slice(0, 30)}"`, () => {
        expect(detectKey(text)).toBeNull()
      })
    }
  })

  describe('word boundary', () => {
    it('stops at non-word-boundary characters', () => {
      // Key followed by a space — should extract cleanly
      const key = 'sk-ant-api03-abcdefghijklmnopqrstuvwxyz'
      const text = `${key} is your key`
      const pattern = detectKey(text)!
      const extracted = extractKey(text, pattern)
      expect(extracted).toBe(key)
    })
  })
})

export const PROVIDERS = [
  'anthropic',
  'openai',
  'google',
  'cohere',
  'mistral',
  'groq',
  'perplexity',
  'deepseek',
] as const

export type Provider = (typeof PROVIDERS)[number]

export interface EncryptedPayload {
  ciphertext: string // base64
  iv: string // base64
  authTag: string // base64
}

export interface VaultEntry {
  id: string
  provider: Provider
  label: string
  keyPrefix: string // first 8 + last 4 chars for identification
  encrypted: EncryptedPayload
  createdAt: string // ISO 8601
  lastUsedAt: string | null
}

export interface AuthorizedApp {
  id: string
  name: string
  approvedAt: string // ISO 8601
  permissions: Provider[]
  tokenHash: string // SHA-256 of the bearer token
}

export interface VaultData {
  version: 1
  entries: Record<string, VaultEntry>
  authorizedApps: Record<string, AuthorizedApp>
}

export const ENV_VAR_MAP: Record<Provider, string> = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  google: 'GOOGLE_API_KEY',
  cohere: 'COHERE_API_KEY',
  mistral: 'MISTRAL_API_KEY',
  groq: 'GROQ_API_KEY',
  perplexity: 'PERPLEXITY_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
}

export interface KeyPattern {
  provider: string
  displayName: string
  regex: RegExp
  envVar: string
}

export const KEY_PATTERNS: KeyPattern[] = [
  {
    provider: 'anthropic',
    displayName: 'Anthropic',
    // sk-ant-api03-..., sk-ant-sid01-..., etc. Typically ~108 chars total.
    regex: /sk-ant-[a-zA-Z0-9_-]{20,120}\b/,
    envVar: 'ANTHROPIC_API_KEY',
  },
  {
    provider: 'openai',
    displayName: 'OpenAI',
    // sk-proj-..., sk-svcacct-..., sk-<org>-... (but not sk-ant-)
    regex: /sk-(?!ant-)[a-zA-Z0-9_-]{20,200}\b/,
    envVar: 'OPENAI_API_KEY',
  },
  {
    provider: 'google',
    displayName: 'Google',
    // AIza keys are exactly 39 chars total
    regex: /AIza[a-zA-Z0-9_-]{30,50}\b/,
    envVar: 'GOOGLE_API_KEY',
  },
]

export function detectKey(text: string): KeyPattern | null {
  for (const pattern of KEY_PATTERNS) {
    if (pattern.regex.test(text)) {
      return pattern
    }
  }
  return null
}

export function extractKey(text: string, pattern: KeyPattern): string | null {
  const match = text.match(pattern.regex)
  return match ? match[0] : null
}

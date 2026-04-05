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
    regex: /sk-ant-[a-zA-Z0-9_-]{20,}/,
    envVar: 'ANTHROPIC_API_KEY',
  },
  {
    provider: 'openai',
    displayName: 'OpenAI',
    // OpenAI keys start with sk- but not sk-ant-
    regex: /sk-(?!ant-)[a-zA-Z0-9_-]{20,}/,
    envVar: 'OPENAI_API_KEY',
  },
  {
    provider: 'google',
    displayName: 'Google',
    regex: /AIza[a-zA-Z0-9_-]{30,}/,
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

#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const WALLET_DIR = path.join(os.homedir(), '.ai-wallet')
const PORT_FILE = path.join(WALLET_DIR, 'daemon.port')

const ENV_VAR_MAP: Record<string, string> = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  google: 'GOOGLE_API_KEY',
  cohere: 'COHERE_API_KEY',
  mistral: 'MISTRAL_API_KEY',
  groq: 'GROQ_API_KEY',
  perplexity: 'PERPLEXITY_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
}

function getDaemonPort(): number | null {
  try {
    const port = fs.readFileSync(PORT_FILE, 'utf8').trim()
    return parseInt(port, 10)
  } catch {
    return null
  }
}

function getToken(): string | null {
  try {
    const tokenFile = path.join(WALLET_DIR, 'cli-token')
    return fs.readFileSync(tokenFile, 'utf8').trim()
  } catch {
    return null
  }
}

async function fetchKeys(port: number, token: string): Promise<Record<string, string>> {
  const keys: Record<string, string> = {}

  for (const [provider, envVar] of Object.entries(ENV_VAR_MAP)) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/v1/keys/${provider}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = (await response.json()) as { key: string }
        keys[envVar] = data.key
      }
    } catch {
      // Provider key not stored or daemon error — skip silently
    }
  }

  return keys
}

async function main() {
  const command = process.argv[2]

  if (command === 'env') {
    const port = getDaemonPort()
    if (!port) {
      // Daemon not running — exit silently (shell hook should not break terminal)
      process.exit(0)
    }

    const token = getToken()
    if (!token) {
      // Not paired — exit silently
      process.exit(0)
    }

    try {
      const keys = await fetchKeys(port, token)
      for (const [envVar, value] of Object.entries(keys)) {
        // Output shell export statements
        // Escape single quotes in values for safe shell interpolation
        const escaped = value.replace(/'/g, "'\\''")
        console.log(`export ${envVar}='${escaped}'`)
      }
    } catch {
      // Network error — exit silently
      process.exit(0)
    }
  } else if (command === 'status') {
    const port = getDaemonPort()
    if (port) {
      try {
        const response = await fetch(`http://127.0.0.1:${port}/v1/health`)
        if (response.ok) {
          const data = await response.json()
          console.log(`AI Wallet daemon: running (port ${port})`)
          console.log(`Version: ${(data as any).version}`)
        } else {
          console.log('AI Wallet daemon: not responding')
        }
      } catch {
        console.log('AI Wallet daemon: not reachable')
      }
    } else {
      console.log('AI Wallet daemon: not running')
    }
  } else if (command === 'help' || !command) {
    console.log(`ai-wallet-cli — AI API Wallet command line helper

Usage:
  ai-wallet-cli env      Output shell export statements for stored API keys
  ai-wallet-cli status   Check daemon status
  ai-wallet-cli help     Show this help message

Shell integration:
  Add to ~/.zshrc:
    eval "$(ai-wallet-cli env)"
`)
  } else {
    console.error(`Unknown command: ${command}`)
    console.error('Run "ai-wallet-cli help" for usage information')
    process.exit(1)
  }
}

main()

#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const WALLET_DIR = path.join(os.homedir(), '.ai-wallet')
const PORT_FILE = path.join(WALLET_DIR, 'daemon.port')

type ShellType = 'posix' | 'powershell' | 'cmd'

function getShellType(): ShellType {
  // Allow explicit override via --shell flag
  const shellFlag = process.argv.find((arg) => arg.startsWith('--shell='))
  if (shellFlag) {
    const value = shellFlag.split('=')[1]
    if (value === 'posix' || value === 'powershell' || value === 'cmd') return value
  }

  // Auto-detect based on environment
  if (process.env.PSModulePath && !process.env.SHELL) return 'powershell'
  if (process.platform === 'win32' && !process.env.SHELL) return 'cmd'
  return 'posix'
}

function formatExport(envVar: string, value: string, shell: ShellType): string {
  switch (shell) {
    case 'powershell': {
      const escaped = value.replace(/'/g, "''")
      return `$env:${envVar} = '${escaped}'`
    }
    case 'cmd':
      return `set ${envVar}=${value}`
    case 'posix':
    default: {
      const escaped = value.replace(/'/g, "'\\''")
      return `export ${envVar}='${escaped}'`
    }
  }
}

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

async function fetchKeys(port: number, token: string, debug = false): Promise<Record<string, string>> {
  const keys: Record<string, string> = {}

  for (const [provider, envVar] of Object.entries(ENV_VAR_MAP)) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/v1/keys/${provider}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = (await response.json()) as { key: string }
        keys[envVar] = data.key
      } else if (debug) {
        const body = await response.text()
        console.error(`[debug] ${provider}: HTTP ${response.status} — ${body}`)
      }
    } catch (err: any) {
      if (debug) console.error(`[debug] ${provider}: fetch error — ${err.message}`)
    }
  }

  return keys
}

async function main() {
  const command = process.argv[2]

  const debug = process.argv.includes('--debug')

  if (command === 'env') {
    const port = getDaemonPort()
    if (!port) {
      if (debug) console.error('[debug] No daemon port file found — is the app running?')
      process.exit(0)
    }
    if (debug) console.error(`[debug] Daemon port: ${port}`)

    const token = getToken()
    if (!token) {
      if (debug) console.error('[debug] No cli-token file — run the pairing step first')
      process.exit(0)
    }
    if (debug) console.error(`[debug] Token loaded (${token.length} chars)`)

    try {
      const shell = getShellType()
      if (debug) console.error(`[debug] Shell type: ${shell}`)
      const keys = await fetchKeys(port, token, debug)
      if (debug) console.error(`[debug] Keys fetched: ${Object.keys(keys).length} keys`)
      for (const [envVar, value] of Object.entries(keys)) {
        console.log(formatExport(envVar, value, shell))
      }
    } catch (err: any) {
      if (debug) console.error(`[debug] Network error: ${err.message}`)
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
    const shellHelp =
      process.platform === 'win32'
        ? `Shell integration:
  PowerShell — add to $PROFILE:
    Invoke-Expression (ai-wallet-cli env | Out-String)

  Or use --shell=posix|powershell|cmd to override auto-detection`
        : `Shell integration:
  Add to ~/.zshrc or ~/.bashrc:
    eval "$(ai-wallet-cli env)"

  On Windows, use --shell=posix|powershell|cmd to override auto-detection`

    console.log(`ai-wallet-cli — AI API Wallet command line helper

Usage:
  ai-wallet-cli env      Output shell export statements for stored API keys
  ai-wallet-cli status   Check daemon status
  ai-wallet-cli help     Show this help message

${shellHelp}
`)
  } else {
    console.error(`Unknown command: ${command}`)
    console.error('Run "ai-wallet-cli help" for usage information')
    process.exit(1)
  }
}

main()

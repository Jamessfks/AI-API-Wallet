# AI API Wallet

A digital wallet for AI API keys. Zero copy-paste — browser extension captures keys from provider dashboards, environment variable injection delivers them to every CLI/SDK tool.

## Architecture

Monorepo with 5 packages:

| Package | Purpose |
|---------|---------|
| `packages/vault-core` | Encryption (AES-256-GCM), storage, key CRUD — pure Node.js library |
| `packages/daemon` | Fastify localhost server (port 21520) — REST API for key access |
| `packages/desktop` | Electron app — bundles daemon, provides UI, manages OS secure storage (Keychain/DPAPI) |
| `packages/browser-extension` | Chrome MV3 extension — auto-captures keys from Anthropic/OpenAI/Google |
| `packages/cli` | Minimal CLI (`ai-wallet-cli env`) — used by shell hook for env var injection |

## Commands

```bash
# Install all dependencies
pnpm install

# Build all packages
pnpm build

# Build a specific package
pnpm --filter @ai-wallet/vault-core build
pnpm --filter @ai-wallet/daemon build
pnpm --filter @ai-wallet/desktop build

# Run tests
pnpm test

# Run tests for a specific package
pnpm --filter @ai-wallet/vault-core test

# Dev mode (desktop app with hot reload)
pnpm dev

# Lint
pnpm lint

# Type check
pnpm typecheck
```

## Code Conventions

- **Language:** TypeScript strict mode everywhere
- **Modules:** ES modules (`"type": "module"` in package.json)
- **Tests:** Vitest — test files live in `tests/` directories alongside `src/`
- **Formatting:** Prettier (2-space indent, single quotes, no semicolons)
- **Linting:** ESLint with TypeScript rules
- **Imports:** Use workspace protocol (`@ai-wallet/vault-core`) for cross-package imports
- **Node.js:** Use built-in `crypto` module for encryption — no external crypto libs
- **Naming:** camelCase for variables/functions, PascalCase for types/components, kebab-case for files

## Security Invariants

These MUST be maintained at all times:

1. **Master key never on disk in plaintext** — stored only via Electron `safeStorage` (macOS Keychain / Windows DPAPI)
2. **Daemon binds to 127.0.0.1 only** — never `0.0.0.0`
3. **DNS rebinding protection** — daemon checks Host header, rejects non-localhost origins
4. **Bearer tokens hashed before storage** — only SHA-256 hashes in `vault.json`, never plaintext tokens
5. **Per-key random IVs** — every encryption operation uses `crypto.randomBytes(16)` for IV
6. **Vault file contains only ciphertext** — the `keyPrefix` field (first 8 + last 4 chars) is the only hint of the original key

## Key File Locations

| File | Purpose |
|------|---------|
| `~/.ai-wallet/vault.json` | Encrypted key vault (ciphertext only) |
| `~/.ai-wallet/master.enc` | Master key encrypted blob (decrypted via safeStorage) |
| `~/.ai-wallet/daemon.port` | Current daemon port (for client discovery) |
| `~/.zshrc` or `~/.bashrc` | Shell hook for env var injection on macOS/Linux |
| PowerShell `$PROFILE` | Shell hook for env var injection on Windows |

## Common Workflows

### Adding a new AI provider
1. Add provider to `Provider` enum in `packages/vault-core/src/types.ts`
2. Add key pattern regex to `packages/browser-extension/src/lib/patterns.ts`
3. Add content script in `packages/browser-extension/src/content/<provider>.ts`
4. Add URL pattern to `manifest.json` content_scripts matches
5. Add env var mapping in `packages/cli/src/index.ts`

### Modifying daemon routes
1. Add/edit route handler in `packages/daemon/src/routes/`
2. Register route in `packages/daemon/src/server.ts`
3. Update IPC handlers in `packages/desktop/src/main/ipc-handlers.ts` if UI needs access

### Building the browser extension
```bash
pnpm --filter @ai-wallet/browser-extension build
# Output in packages/browser-extension/dist/
# Load in Chrome via chrome://extensions → "Load unpacked"
```

## Subagent Guidelines

When working on this project with Claude Code subagents:

- **Explore agents:** Use to find existing patterns before writing new code. Check vault-core types before adding new ones.
- **Plan agents:** Use for multi-package changes that touch daemon routes + desktop IPC + renderer UI.
- **Test changes:** After modifying vault-core or daemon, always run `pnpm --filter @ai-wallet/vault-core test` and `pnpm --filter @ai-wallet/daemon test`.
- **Package boundaries:** vault-core is a pure library (no Electron deps). Daemon imports vault-core. Desktop imports both. Browser extension is standalone (talks to daemon via HTTP). CLI is standalone (talks to daemon via HTTP).

## Claude Code Configuration

This project includes Claude Code tooling in `.claude/`:

### Slash Commands
| Command | Purpose |
|---------|---------|
| `/add-provider <name>` | Walk through the full multi-package workflow to add a new AI provider |
| `/security-check` | Audit all 6 security invariants against the current codebase |
| `/build-package <name>` | Build a package with its dependencies in the correct order |
| `/test-package <name>` | Run tests for a package with dependency builds |
| `/cross-package-change <desc>` | Plan and execute changes spanning multiple packages |

### Custom Agents
| Agent | Model | Purpose |
|-------|-------|---------|
| `security-auditor` | Opus | Deep-dive audit of encryption, auth, network security, and secret handling |
| `package-coordinator` | Sonnet | Coordinate cross-package changes with interface consistency checks |
| `extension-validator` | Sonnet | Validate Chrome MV3 compliance, content script safety, pattern accuracy |

### Hooks
- **Security reminder**: Automatically shown when editing files in `packages/daemon/src/` or `packages/vault-core/src/` — reminds you to verify the 6 security invariants

### Deny Rules
- Claude Code cannot read `~/.ai-wallet/` (encrypted vault files)
- Claude Code cannot introduce `0.0.0.0` bindings

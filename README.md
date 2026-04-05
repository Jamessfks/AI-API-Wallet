# AI API Wallet

**Apple Pay, but for API keys.**

Stop copy-pasting API keys. Stop losing them in `.env` files. Stop storing them in plaintext.

AI API Wallet captures your API keys from provider dashboards, encrypts them with AES-256-GCM in your OS secure storage (macOS Keychain / Windows DPAPI), and delivers them to every tool you use — automatically.

```
You sign up for Claude API
  → Browser extension captures the key (zero copy-paste)
  → Wallet encrypts it in OS secure storage
  → Open terminal → ANTHROPIC_API_KEY is already set
  → OpenClaw, VS Code, Python, any SDK — just works
```

<p align="center">
  <img src="docs/screenshot-keys.png" alt="API Keys view — encrypted keys with masked previews" width="360">
  &nbsp;&nbsp;&nbsp;
  <img src="docs/screenshot-apps.png" alt="Connected Apps — manage which apps can access your keys" width="360">
</p>
<p align="center">
  <em>Left: Your API keys, encrypted and masked. Right: Connected apps with one-click revoke.</em>
</p>

---

## How It Works

### Keys In: Browser Extension Auto-Capture

Visit `console.anthropic.com`, generate a key. A toast appears:

> **"Save to AI Wallet?"** → Click Save. Done.

The Chrome extension watches Anthropic, OpenAI, and Google AI Studio dashboards. When a key appears in the DOM, it captures it and sends it to the wallet. You never touch the key string.

### Keys Out: Environment Variable Injection

Every new terminal session automatically has your keys:

```bash
# Added to ~/.zshrc (macOS/Linux) or PowerShell $PROFILE (Windows):
eval "$(ai-wallet-cli env)"

# Every terminal now has:
# export ANTHROPIC_API_KEY="sk-ant-..."
# export OPENAI_API_KEY="sk-..."
# export GOOGLE_API_KEY="AIza..."
```

Any SDK that reads env vars — Anthropic, OpenAI, LangChain, LlamaIndex — works with zero configuration.

### App Authorization

Apps request access through a pairing flow:

```
App → requests key → Wallet shows dialog:
  "OpenClaw wants your Anthropic key. Allow?"
  → [Deny] [Allow]
```

One-time approval. Bearer token stored. App never asks again.

---

## Architecture

```
┌─────────────────────────────────────┐
│         AI API Wallet App           │
│         (Electron + React)          │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  Encrypted Key Vault        │    │
│  │  Anthropic  sk-ant-a...ZwAA │    │
│  │  OpenAI     sk-...a8f3      │    │
│  │  Google     AIza...b2c1     │    │
│  └─────────────────────────────┘    │
│                                     │
│  Daemon API (localhost:21520)       │
│  Browser Extension (Chrome MV3)     │
│  CLI Shell Hook (ai-wallet-cli)     │
└─────────────────────────────────────┘
```

**5 packages in a TypeScript monorepo:**

| Package | What it does |
|---------|-------------|
| `vault-core` | AES-256-GCM encryption, OS secure storage (Keychain/DPAPI), key CRUD |
| `daemon` | Fastify server on localhost — REST API for key access |
| `desktop` | Electron app — UI, system tray, pairing dialogs |
| `browser-extension` | Chrome MV3 — auto-captures keys from provider dashboards |
| `cli` | Shell hook — `ai-wallet-cli env` exports keys to terminal |

---

## Security

| Invariant | How |
|-----------|-----|
| Keys encrypted at rest | AES-256-GCM with per-key random IVs |
| Master key in hardware | OS secure storage via Electron `safeStorage` (macOS Keychain / Windows DPAPI) |
| Network isolation | Daemon binds `127.0.0.1` only, never `0.0.0.0` |
| DNS rebinding protection | Host header validation on every request |
| Tokens hashed | SHA-256 before storage — plaintext never persisted |
| Vault is ciphertext-only | Only masked prefix (`sk-ant-a...ZwAA`) stored in clear |

---

## Setup Guide (5 minutes)

There are 6 steps. Steps 1–2 get the app running. Steps 3–5 connect your terminal. Step 6 is optional (browser extension for auto-capture).

### Step 1: Build the project

```bash
git clone https://github.com/Jamessfks/AI-API-Wallet.git
cd AI-API-Wallet
pnpm install
pnpm build
```

### Step 2: Launch the desktop app

```bash
pnpm dev
```

This starts the Electron app, which initializes OS secure storage encryption (macOS Keychain or Windows DPAPI) and starts the daemon on `localhost:21520`. Add your API keys through the UI.

Verify the daemon is running:

```bash
curl -s http://127.0.0.1:21520/v1/health
# → {"status":"ok","version":"0.1.0"}
```

### Step 3: Install the CLI globally

The CLI is how your terminal gets keys from the wallet. You need it on your PATH:

**macOS / Linux:**

```bash
# Option A: npm link (from project root)
cd packages/cli && npm link && cd ../..

# Option B: direct symlink (if npm link fails)
ln -sf "$(pwd)/packages/cli/dist/index.js" /opt/homebrew/bin/ai-wallet-cli
chmod +x packages/cli/dist/index.js
```

**Windows (PowerShell):**

```powershell
cd packages\cli; npm link; cd ..\..
```

Verify:

```bash
ai-wallet-cli status
# → AI Wallet daemon: running (port 21520)
```

### Step 4: Pair the CLI with the daemon

The CLI needs permission to read your keys. This is a one-time pairing step — similar to pairing a Bluetooth device.

**Quick version (one command):**

```bash
REQUEST_ID=$(curl -s -X POST http://127.0.0.1:21520/v1/pair \
  -H "Content-Type: application/json" \
  -d '{"appName":"CLI","permissions":["anthropic","openai","google","cohere","mistral","groq","perplexity","deepseek"]}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['requestId'])")

TOKEN=$(curl -s -X POST "http://127.0.0.1:21520/v1/pair/${REQUEST_ID}/approve" | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

echo -n "$TOKEN" > ~/.ai-wallet/cli-token
chmod 600 ~/.ai-wallet/cli-token
echo "CLI paired successfully"
```

**Manual version (if you want to understand each step):**

```bash
# 1. Create a pairing request
curl -s -X POST http://127.0.0.1:21520/v1/pair \
  -H "Content-Type: application/json" \
  -d '{"appName":"CLI","permissions":["anthropic","openai","google","cohere","mistral","groq","perplexity","deepseek"]}'
# → {"requestId":"pair_1_...","status":"pending",...}

# 2. Approve it (replace <requestId> with the value from step 1)
curl -s -X POST http://127.0.0.1:21520/v1/pair/<requestId>/approve
# → {"status":"approved","token":"abc123..."}

# 3. Save the token (replace <token> with the value from step 2)
echo -n "<token>" > ~/.ai-wallet/cli-token
chmod 600 ~/.ai-wallet/cli-token
```

Verify the pairing works:

```bash
ai-wallet-cli env
# → export ANTHROPIC_API_KEY='sk-ant-...'
# → export OPENAI_API_KEY='sk-...'
# (one line per stored key)
```

### Step 5: Install the shell hook

This is the line that makes everything automatic. It runs on every new terminal, fetching your decrypted keys and exporting them as environment variables.

**macOS / Linux:**

```bash
echo '
# AI API Wallet — auto-inject API keys from encrypted vault
eval "$(ai-wallet-cli env)"' >> ~/.zshrc
```

**Windows (PowerShell):**

```powershell
# Add to your PowerShell profile (run: notepad $PROFILE)
Invoke-Expression (ai-wallet-cli env | Out-String)
```

**Open a new terminal** and verify:

```bash
# macOS / Linux
echo $ANTHROPIC_API_KEY

# Windows PowerShell
echo $env:ANTHROPIC_API_KEY
```

That's it. Every tool that reads environment variables now has your keys:

```bash
# Python
python3 -c "import os; print(os.environ.get('ANTHROPIC_API_KEY', 'not set'))"

# Node.js
node -e "console.log(process.env.ANTHROPIC_API_KEY)"

# Claude Code, OpenClaw, LangChain, curl — all just work
```

> **Note:** The desktop app must be running for keys to be injected. If the app isn't running, the shell hook exits silently — your terminal still works, you just won't have the env vars until you open the app.

### Step 6: Install the browser extension (optional)

The Chrome extension auto-detects API keys when you visit provider dashboards and offers to save them with one click — no copy-paste needed.

```bash
pnpm --filter @ai-wallet/browser-extension build
```

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked** → select `packages/browser-extension/dist/`
4. Visit `console.anthropic.com` or `platform.openai.com` — the extension detects keys automatically

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | pnpm workspaces + Turborepo |
| Language | TypeScript (strict) |
| Desktop | Electron 35 + React 19 + Tailwind CSS 4 |
| Server | Fastify on localhost |
| Encryption | AES-256-GCM via Node.js `crypto` |
| Key Storage | OS secure storage — Electron `safeStorage` (macOS Keychain / Windows DPAPI) |
| Extension | Chrome Manifest V3 |
| Tests | Vitest (19 tests) |

---

## Supported Providers

| Provider | Key Pattern | Env Variable |
|----------|------------|-------------|
| Anthropic (Claude) | `sk-ant-*` | `ANTHROPIC_API_KEY` |
| OpenAI (ChatGPT) | `sk-*` | `OPENAI_API_KEY` |
| Google (Gemini) | `AIza*` | `GOOGLE_API_KEY` |
| Cohere | — | `COHERE_API_KEY` |
| Mistral | — | `MISTRAL_API_KEY` |
| Groq | `gsk_*` | `GROQ_API_KEY` |
| Perplexity | `pplx-*` | `PERPLEXITY_API_KEY` |
| DeepSeek | `sk-*` | `DEEPSEEK_API_KEY` |

---

## API

The daemon exposes a REST API on `localhost:21520`:

```bash
# Health check
curl http://localhost:21520/v1/health

# Pair an app (triggers approval dialog)
curl -X POST http://localhost:21520/v1/pair \
  -H "Content-Type: application/json" \
  -d '{"appName": "My App"}'

# Retrieve a key (after pairing)
curl -H "Authorization: Bearer <token>" \
  http://localhost:21520/v1/keys/anthropic
```

---

## FAQ

**Q: Do I need the desktop app running all the time?**
Yes. The daemon that decrypts and serves your keys runs inside the Electron app. If you quit it, `ai-wallet-cli env` exits silently (won't break your terminal), but keys won't be injected until you reopen the app. Tip: enable "Launch at Login" from the system tray menu.

**Q: I added a new key. How do I get it in my terminal?**
Open a new terminal tab. The shell hook runs fresh on every session, so it picks up new keys immediately.

**Q: Does this work in VS Code's integrated terminal?**
Yes. VS Code's terminal sources your `.zshrc` (macOS/Linux) or PowerShell `$PROFILE` (Windows), so the hook runs automatically.

**Q: Why not just use `.env` files?**
`.env` files are plaintext on disk, per-project (you need one in every repo), and easy to accidentally commit to git. AI API Wallet encrypts keys with AES-256-GCM, stores the master key in OS secure storage (macOS Keychain / Windows DPAPI), and injects keys into every project globally.

**Q: Can other apps on my machine steal my keys?**
Only paired apps (approved via the desktop UI) can access keys. Each app gets a unique bearer token with explicit per-provider permissions. You can revoke access from the Connected Apps screen at any time.

**Q: What happens if I lose my machine?**
Your keys are encrypted at rest with AES-256-GCM. The master key is in OS secure storage (macOS Keychain / Windows DPAPI), which is itself protected by your OS login credentials. An attacker would need your login password to decrypt anything.

---

## Roadmap

- [ ] MCP server for Claude Code native integration
- [ ] Node.js + Python SDKs (`wallet.getKey("anthropic")`)
- [ ] Config file auto-writing (VS Code, OpenClaw, Cursor)
- [ ] Mobile app + Bluetooth LE proximity key transfer
- [ ] Provider OAuth redirects (zero copy-paste from day one)

---

## License

MIT

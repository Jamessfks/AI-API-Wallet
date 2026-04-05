---
description: "Add a new AI provider to the wallet (touches vault-core, browser-extension, cli)"
argument-hint: "<provider-name> (e.g., together, fireworks, mistral)"
---

Add a new AI provider "$ARGUMENTS" to the AI API Wallet. This is a multi-package change — follow these steps in order:

## Step 1: Research the provider's API key format

Before writing code, determine:
- What prefix does "$ARGUMENTS" use for API keys? (e.g., `sk-ant-` for Anthropic, `sk-` for OpenAI)
- What is the typical key length?
- What characters are used? (alphanumeric, hyphens, underscores)
- What is the standard environment variable name? (convention: `<PROVIDER_UPPERCASE>_API_KEY`)

If you cannot determine the key format, ask the user before proceeding.

## Step 2: vault-core types

Edit `packages/vault-core/src/types.ts`:
- Add "$ARGUMENTS" to the `Provider` type / `PROVIDERS` array (keep alphabetically sorted)
- Add the env var mapping to `ENV_VAR_MAP`

## Step 3: browser-extension patterns

Edit `packages/browser-extension/src/lib/patterns.ts`:
- Add a `KeyPattern` entry with an accurate regex for this provider's API key format
- Include the provider name, regex pattern, and a human-readable description

## Step 4: browser-extension content script (if applicable)

If "$ARGUMENTS" has a web dashboard where users can view/copy API keys:
- Create `packages/browser-extension/src/content/$ARGUMENTS.ts` — a content script that detects API keys on the provider's dashboard page
- Add the URL pattern to `packages/browser-extension/manifest.json` under `content_scripts.matches`

If the provider has no web dashboard or key management page, skip this step.

## Step 5: CLI env var mapping

Edit `packages/cli/src/index.ts`:
- Add the provider and environment variable to the `ENV_VAR_MAP` (must match vault-core's mapping)

## Step 6: Build and verify

```bash
pnpm --filter @ai-wallet/vault-core build
pnpm --filter @ai-wallet/vault-core test
pnpm --filter @ai-wallet/browser-extension build
pnpm typecheck
```

## Checklist before done
- [ ] Provider name is alphabetically sorted in PROVIDERS array
- [ ] Env var follows `<PROVIDER_UPPERCASE>_API_KEY` convention
- [ ] Key pattern regex is specific enough (won't false-positive on other providers)
- [ ] Content script only reads DOM, never injects scripts
- [ ] CLI env var matches vault-core env var exactly
- [ ] All builds pass, all tests pass

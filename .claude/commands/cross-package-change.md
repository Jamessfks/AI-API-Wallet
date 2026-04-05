---
description: "Plan and execute a change that spans multiple packages"
argument-hint: "<description of the change>"
---

Plan and execute a cross-package change: **$ARGUMENTS**

## Package dependency graph

```
vault-core (pure library — types, encryption, storage)
    ↓
daemon (Fastify server — REST API, imports vault-core)
    ↓
desktop (Electron app — bundles daemon, imports vault-core + daemon)

browser-extension (standalone — talks to daemon via HTTP)
cli (standalone — talks to daemon via HTTP)
```

## Cross-package interfaces to check

| Source | Consumer | Interface |
|--------|----------|-----------|
| vault-core `types.ts` | daemon routes, desktop IPC, cli | `Provider`, `PROVIDERS`, `ENV_VAR_MAP`, key CRUD function signatures |
| daemon routes | browser-extension, cli | REST endpoints: `/v1/keys`, `/v1/pair`, `/v1/health` |
| desktop IPC handlers | desktop renderer | IPC channels: `vault:listKeys`, `vault:addKey`, `vault:getKey`, `vault:removeKey` |
| browser-extension patterns | vault-core providers | `KEY_PATTERNS` must match `PROVIDERS` list |

## Workflow

1. **Analyze** — Determine which packages are affected by this change
2. **Plan** — List the specific file edits in each package, ordered bottom-up through the dependency graph
3. **Present plan** — Show the plan and ask for confirmation before implementing (especially if the change touches security-sensitive code)
4. **Implement** — Make changes in dependency order: vault-core → daemon → desktop → (browser-extension, cli)
5. **Build** — Build each modified package in dependency order:
   ```bash
   pnpm --filter @ai-wallet/vault-core build
   pnpm --filter @ai-wallet/daemon build
   ```
6. **Test** — Test each affected package:
   ```bash
   pnpm --filter @ai-wallet/vault-core test
   pnpm --filter @ai-wallet/daemon test
   ```
7. **Typecheck** — Verify the full monorepo:
   ```bash
   pnpm typecheck
   ```

## Rules

- If a vault-core type changes, ALL consumers must be updated in the same change
- If a daemon route changes, update the browser-extension and cli clients
- If a desktop IPC handler changes, update the renderer code
- Never break the build of a downstream package — build and verify at each level

---
description: "Build a specific package with its dependencies"
argument-hint: "<package> (vault-core | daemon | desktop | browser-extension | cli)"
---

Build the `$ARGUMENTS` package with dependency awareness.

## Dependency graph

```
vault-core  (no deps — build first)
    ↓
daemon      (depends on vault-core)
    ↓
desktop     (depends on vault-core + daemon)

browser-extension  (standalone)
cli                (standalone)
```

## Steps

1. If `$ARGUMENTS` is `daemon` or `desktop`, build `vault-core` first:
   ```bash
   pnpm --filter @ai-wallet/vault-core build
   ```

2. If `$ARGUMENTS` is `desktop`, also build `daemon`:
   ```bash
   pnpm --filter @ai-wallet/daemon build
   ```

3. Build the target package:
   ```bash
   pnpm --filter @ai-wallet/$ARGUMENTS build
   ```

4. Type-check the package:
   ```bash
   pnpm --filter @ai-wallet/$ARGUMENTS typecheck
   ```

If any step fails, read the error output carefully. Common issues:
- Missing dependency build → build the dependency first
- Type errors → check if a vault-core type changed without updating consumers
- Missing module → run `pnpm install` first

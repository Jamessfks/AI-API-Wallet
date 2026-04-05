---
description: "Run tests for a specific package with dependency builds"
argument-hint: "<package> (vault-core | daemon | desktop | browser-extension | cli)"
---

Test the `$ARGUMENTS` package.

## Steps

1. **Build dependencies** (tests may import from built packages):
   - If `$ARGUMENTS` is `daemon` or `desktop`: build vault-core first
   - If `$ARGUMENTS` is `desktop`: also build daemon
   ```bash
   pnpm --filter @ai-wallet/vault-core build
   ```

2. **Run tests:**
   ```bash
   pnpm --filter @ai-wallet/$ARGUMENTS test
   ```

3. **Analyze results:**
   - If tests pass: report the summary (number of tests, suites, time)
   - If tests fail: read the failure output, identify the root cause, and suggest a fix
   - If no test files exist: report this and suggest what tests should be written based on the package's source code

## Test file convention

Tests live in `packages/$ARGUMENTS/tests/` alongside `src/`. Test files use the `.test.ts` extension and import from `../src/`. The test runner is Vitest.

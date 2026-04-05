---
description: "Audit all 6 security invariants from CLAUDE.md against the current codebase"
---

Perform a security audit of the AI API Wallet codebase against the 6 security invariants defined in CLAUDE.md. For each invariant, examine the actual source code and report PASS, WARN, or FAIL.

## Invariant 1: Master key never on disk in plaintext

**Check:** Read `packages/vault-core/src/master-key.ts` and `packages/desktop/src/main/safe-storage.ts`. Search the entire codebase for `writeFileSync` or `writeFile` calls that could leak the raw master key. Verify master key is only persisted via Electron `safeStorage` (macOS Keychain).

```bash
grep -rn "writeFile\|fs\.write" packages/ --include="*.ts" | grep -iv "test"
```

## Invariant 2: Daemon binds to 127.0.0.1 only

**Check:** Read `packages/daemon/src/server.ts`. Verify the `host` option defaults to `'127.0.0.1'` and no code path can set it to `'0.0.0.0'` or omit it (which defaults to all interfaces in some frameworks).

```bash
grep -rn "0\.0\.0\.0\|host.*:" packages/daemon/src/ --include="*.ts"
```

## Invariant 3: DNS rebinding protection

**Check:** Look for middleware in `packages/daemon/src/` that validates the `Host` header. Verify it rejects requests where the Host is not `localhost` or `127.0.0.1`. Check that CORS is configured to only allow localhost origins.

```bash
grep -rn "host\|Host\|origin\|Origin\|rebind" packages/daemon/src/ --include="*.ts"
```

## Invariant 4: Bearer tokens hashed before storage

**Check:** Find where auth tokens are stored. Verify `hashToken()` (SHA-256) is called before any token is written to the vault or config. Search for raw token storage.

```bash
grep -rn "tokenHash\|hashToken\|createHash" packages/ --include="*.ts"
```

## Invariant 5: Per-key random IVs

**Check:** Read `packages/vault-core/src/encryption.ts`. Verify every `encrypt()` call generates a fresh IV via `crypto.randomBytes(12)` or `crypto.randomBytes(16)`. Search for any hardcoded or reused IV values.

```bash
grep -rn "randomBytes\|iv\b\|IV\b" packages/vault-core/src/ --include="*.ts"
```

## Invariant 6: Vault file contains only ciphertext

**Check:** Read `packages/vault-core/src/storage.ts` and the vault data types. Verify:
- The `keyPrefix` field stores only first 8 + last 4 characters of the original key
- No plaintext API keys are written to `vault.json`
- The encryption wraps the full key before storage

```bash
grep -rn "keyPrefix\|plaintext\|apiKey" packages/vault-core/src/ --include="*.ts"
```

## Output Format

For each invariant, report:
```
[PASS|WARN|FAIL] Invariant N: <name>
  Evidence: <file:line — what you found>
  Notes: <any concerns or recommendations>
```

If any invariant is WARN or FAIL, provide specific remediation steps.

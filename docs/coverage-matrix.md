# Coverage Matrix

> Hand-maintained for Plans 1-2. Auto-generation from hook manifests lands in Plan 8.

| Threat | Hooks | Profiles |
|---|---|---|
| T-001 Secret Leak | secret-guard, secret-leak-detector, keychain-guard, mcp-secret-guard | baseline, strict, regulated |
| T-002 Destructive FS | destructive-fs-guard, dotfile-guard | baseline (dotfile=warn), strict, regulated |
| T-003 Credential Exfil | sensitive-paths-guard | baseline, strict, regulated |
| T-004 Branch Sabotage (partial) | git-destructive-guard | baseline (warn), strict (block), regulated (block) |
| T-005 to T-018 | (not yet covered) | (Plans 3-5) |

## Coverage by Profile

**baseline** (per-user dev hardening; some warns to keep flow):
- All blocking hooks: secret-guard, secret-leak-detector, keychain-guard, mcp-secret-guard, destructive-fs-guard, sensitive-paths-guard
- Warn hooks: git-destructive-guard, dotfile-guard

**strict** (team / shared infra; everything blocking):
- Same hooks as baseline; git-destructive-guard and dotfile-guard upgrade to block

**regulated** (healthcare, legal, public-sector):
- Same as strict in Plan 2; further differentiation lands in Plan 5 with mdm-bypass and agent-gating overlays

## How to read this matrix

Each threat ID corresponds to a row in `docs/threat-model.md`. Each hook listed has a manifest declaring `threat: T-NNN-...` matching the row. The profiles column shows which profiles include the hook (per the hook's manifest `profiles` array) and at what effective severity (resolved per-profile).

When `docs/auto-coverage-matrix.md` ships in Plan 8, this hand-maintained file will be replaced by a CI-generated artifact backed by the same data.

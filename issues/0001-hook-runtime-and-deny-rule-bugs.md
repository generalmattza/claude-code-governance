# Issue 0001: Hook Runtime and Deny-Rule Bugs

**Branch:** `development`
**Date:** 2026-04-30
**Author:** Matthew Davidson
**Status:** Fixed — all 313 tests passing

**Platform:**
- OS: Ubuntu 24.04.4 LTS (Noble Numbat)
- Kernel: Linux 6.8.0-107-generic x86\_64
- Node.js: v20.17.0
- pnpm: 9.12.0
- Claude Code: 2.1.123

---

## Summary

Three bugs were discovered through live testing that collectively caused the governance system to be partially inoperative:

1. Hook invocations were never written to the audit log.
2. All deny-list rules were silently dropped by Claude Code on session load.
3. WebFetch deny patterns were rejected with a warning due to incorrect syntax.

---

## Bug 1 — Audit log never written (`run-hook.ts`)

### Symptom

`~/.claude/ccsec-audit.jsonl` was not created, even after many hook invocations.

### Root cause

`runHookCommand` executed each hook and acted on the decision (block/allow), but never called `AuditLogger.write()`. The audit infrastructure (`AuditLogger`, `audit-tamper-detector`, `audit-session-summary`) assumed entries were present; without them, tamper detection and session summaries were inert.

### Fix

`packages/cli/src/commands/run-hook.ts`: after resolving the hook decision, write an audit record containing hook name, tool name, decision, reason, and wall-clock duration. A `.catch(() => undefined)` guard ensures an audit write failure does not abort the hook pipeline.

---

## Bug 2 — Deny rules silently dropped by Claude Code (`apply.ts`)

### Symptom

On session start, Claude Code logged:

```
/home/.../.claude/settings.json
 └ permissions
   └ deny: Non-string value in deny array was removed
```

All deny entries were being removed before the session began, meaning none of the deny-list threat mitigations (T-001 through T-018) were enforced.

### Root cause

The internal settings representation stores deny entries as objects:

```json
{ "pattern": "Bash(printenv *)", "threat": "T-001-secret-leak" }
```

Claude Code's permission system requires plain strings:

```json
"Bash(printenv *)"
```

`applyCommand` passed `stripThreatField: false` and wrote the raw objects. Even `stripThreatField: true` only removed the `threat` key, still producing `{ "pattern": "..." }` objects — which Claude Code still rejected.

### Fix

`packages/cli/src/commands/apply.ts`: after `compileProfile`, map `permissions.deny` to plain pattern strings before serialising to `settings.json`. The `threat` metadata remains in source overlays for internal tracking but is not emitted to the live settings file.

`packages/cli/tests/apply.test.ts`: updated two assertions from `deny[0].pattern` to `deny[0]` to match the new string format.

---

## Bug 3 — WebFetch deny patterns rejected (`network-egress.json`)

### Symptom

On session start, Claude Code logged:

```
/home/.../.claude/settings.json
 └ permissions
   └ deny: Invalid permission rule "WebFetch(*transfer.sh*)" was skipped:
     WebFetch permissions must use "domain:" prefix.
```

All four WebFetch deny entries were being skipped.

### Root cause

WebFetch deny rules were authored using a glob pattern syntax (`WebFetch(*transfer.sh*)`) that Claude Code does not accept. The required format uses an explicit `domain:` prefix.

### Fix

`packages/settings/overlays/network-egress.json`: corrected all four WebFetch deny patterns:

| Before | After |
|---|---|
| `WebFetch(*pastebin.com*)` | `WebFetch(domain:pastebin.com)` |
| `WebFetch(*paste.ee*)` | `WebFetch(domain:paste.ee)` |
| `WebFetch(*requestbin.com*)` | `WebFetch(domain:requestbin.com)` |
| `WebFetch(*transfer.sh*)` | `WebFetch(domain:transfer.sh)` |

`packages/settings/compiled/baseline.json`, `strict.json`, `regulated.json` and `packages/settings/__snapshots__/snapshot.test.ts.snap` regenerated to reflect the corrected patterns.

---

## Scope of changes

| File | Change |
|---|---|
| `packages/cli/src/commands/run-hook.ts` | Add `AuditLogger.write()` call after each hook decision |
| `packages/cli/src/commands/apply.ts` | Flatten deny entries to strings; add `resolveHooks()` for Claude Code hook format |
| `packages/cli/src/index.ts` | Register `run-hook` subcommand; clarify `--claude-dir` and `--os` option descriptions |
| `packages/cli/tests/apply.test.ts` | Update deny assertions to expect strings |
| `packages/settings/overlays/network-egress.json` | Fix WebFetch deny patterns to use `domain:` prefix |
| `packages/settings/compiled/*.json` | Regenerated |
| `packages/settings/__snapshots__/snapshot.test.ts.snap` | Updated to match new compiled output |

---

## Verification

- `pnpm test` — 313/313 tests passing
- Live hook block confirmed: `echo "ghp_aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789"` intercepted by `secret-guard` with exit 2
- Audit log confirmed written: entries visible in `~/.claude/ccsec-audit.jsonl` after invocation
- No session-start warnings observed after re-applying settings via `ccsec apply --profile baseline --force`

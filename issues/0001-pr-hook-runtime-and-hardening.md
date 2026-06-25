# PR: Hook runtime fixes, secret-pattern expansion, and portable per-OS settings

**Source branch:** `development`
**Author:** Matthew Davidson
**Status:** Ready — 327/327 tests passing
**Supersedes / folds in:** [Issue 0001](./0001-hook-runtime-and-deny-rule-bugs.md)

**Platform (development/verification):**
- OS: Ubuntu 24.04.4 LTS (Noble Numbat)
- Kernel: Linux 6.8.0-107-generic x86_64
- Node.js: v20.17.0
- pnpm: 9.12.0
- Claude Code: 2.1.123

---

## Summary

This PR brings the governance system from "partially inoperative" to fully enforcing,
and then hardens and broadens it. It bundles four related workstreams:

1. **Hook runtime & deny-rule fixes** — the governance layer was silently not enforcing
   anything end-to-end. Four bugs fixed so hooks fire, the audit log is written, and
   deny rules survive Claude Code's session load. *(originally Issue 0001)*
2. **Secret-pattern expansion + benchmarks** — grew `SECRET_PATTERNS` from 7 to 28
   detectors and added a throughput benchmark so the cost of new patterns is measurable.
3. **Portable per-OS compiled artifacts** — the checked-in `compiled/` policy snapshots
   are now deterministic across contributors and emitted per OS, with a build script and
   a stronger verification test.
4. **Regulated & strict OS-specific configurations** — shipped compiled `regulated` and
   `strict` profiles for macOS, Windows, and Linux.

---

## Part 1 — Hook runtime & deny-rule fixes

Four bugs discovered through live testing collectively meant a successful `ccsec apply`
produced a `settings.json` that Claude Code could not act on.

### Bug 1 — Hooks not registered in Claude Code format (`apply.ts`)

`compileProfile` emitted hook references as bare name objects
(`{ "name": "secret-guard" }`), but Claude Code requires the fully-expanded
`matcher` + `hooks: [{ type: "command", command: ... }]` form. `applyCommand` wrote the
raw compiler output straight through, so no hook ever fired.

**Fix:** added `resolveHooks()` in `packages/cli/src/commands/apply.ts`, called after
`compileProfile`. It reads each hook's compiled manifest (`hooks/dist`) for its
`matchers`/`profiles`, drops hooks not applicable to the active profile, groups by
matcher, and emits the expanded Claude Code format with an absolute path to `ccsec.js`.
Added `ccsecBin` and `hooksDistPath` overrides to `ApplyCommandArgs` for testability.

### Bug 2 — Audit log never written (`run-hook.ts`)

`runHookCommand` acted on each hook decision but never called `AuditLogger.write()`, so
`~/.claude/ccsec-audit.jsonl` was never created and tamper-detection / session-summary
tooling sat inert.

**Fix:** after resolving the decision, write an audit record (hook name, tool name,
decision, reason, wall-clock duration). A `.catch(() => undefined)` guard ensures an
audit-write failure never aborts the hook pipeline.

### Bug 3 — Deny rules silently dropped by Claude Code (`apply.ts`)

Deny entries are stored internally as objects
(`{ "pattern": "Bash(printenv *)", "threat": "T-001-secret-leak" }`); Claude Code's
permission system requires plain strings and removed every object on session load
("Non-string value in deny array was removed"), disabling threats T-001–T-018.

**Fix:** after `compileProfile`, map `permissions.deny` to plain pattern strings before
serialising. `threat` metadata stays in the source overlays for internal tracking but is
not emitted to the live file. Updated two assertions in `apply.test.ts` (`deny[0].pattern`
→ `deny[0]`).

### Bug 4 — WebFetch deny patterns rejected (`network-egress.json`)

WebFetch rules used glob syntax (`WebFetch(*transfer.sh*)`); Claude Code requires a
`domain:` prefix and skipped all four.

**Fix:** corrected to `WebFetch(domain:pastebin.com)`, `...paste.ee`, `...requestbin.com`,
`...transfer.sh` in `packages/settings/overlays/network-egress.json` and regenerated the
compiled artifacts.

---

## Part 2 — Secret-pattern expansion + benchmarks

`packages/core/src/secret-patterns.ts` — grew `SECRET_PATTERNS` from 7 to 28 detectors,
adding coverage for additional GitHub token types (`ghs/gho/ghu/ghr`), GitLab, Anthropic,
OpenAI, npm, Hugging Face, DigitalOcean, SendGrid, Mailgun, Atlassian, AWS session tokens,
JWTs, GCP service-account JSON, credentialed DB connection strings, Vault, Terraform Cloud,
Azure storage keys, and Slack webhook URLs. Added a header comment marking the list as an
opinionated, prunable starting set (each removal also requires deleting its test).

`packages/core/benchmarks/secret-patterns.bench.ts` — new throughput benchmark for
`detectSecrets`, run via `pnpm bench` (added to `packages/core/package.json`; excluded from
`pnpm test`). Covers 1 KB / 64 KB / 512 KB benign corpora plus a peppered 64 KB corpus, so
the per-call overhead and hit-path cost of adding new patterns is measurable.

`packages/core/tests/secret-patterns.test.ts` — 27 added tests covering the new patterns.

---

## Part 3 — Portable per-OS compiled artifacts

The checked-in `compiled/` files are the tamper-evidence surface PR reviewers diff to see
the effective deny policy. Previously they were a single `<profile>.json` baked against one
contributor's machine (non-deterministic `$HOME`) and validated by vitest snapshot files.

- `scripts/build-settings.mjs` — new build script emitting one file per (profile, OS) pair
  as `<profile>.<os>.json`, with `HOME`/`USERPROFILE` pinned to a stable `USER` placeholder
  (`/Users/USER`, `/home/USER`, `C:\Users\USER`) for cross-machine determinism. Artifacts
  are review-only; `ccsec apply` still re-runs the compiler against the live home directory.
- `package.json` — `build:settings` now runs the script instead of a single hard-coded
  macOS/baseline compile.
- `packages/settings/snapshot.test.ts` — replaced the `__snapshots__` vitest snapshots with
  a direct test (9 cases) that the checked-in `compiled/*.json` equal a fresh
  `compileProfile` run. Deleted the old `__snapshots__/snapshot.test.ts.snap`.
- `packages/settings/package.json` — added `@bitsummit/ccsec-cli` / `@bitsummit/ccsec-core`
  as dev dependencies (the test compiles against the CLI).
- `packages/settings/README.md` — documented the per-OS artifact model and the placeholder
  semantics.
- `.gitignore` — ignore `history/`.

---

## Part 4 — Regulated & strict OS-specific configurations

`packages/settings/compiled/` — added compiled `baseline`, `regulated`, and `strict`
profiles for each of macOS, Windows, and Linux (9 files), defining deny rules against
secret leaks, credential exfiltration, and destructive filesystem actions, plus the
PreToolUse / PostToolUse / UserPromptSubmit / session hooks. `pnpm-lock.yaml` updated for
the new workspace dev dependencies.

---

## Scope of changes

| File | Change |
|---|---|
| `packages/cli/src/commands/run-hook.ts` | Write `AuditLogger.write()` after each hook decision |
| `packages/cli/src/commands/apply.ts` | Flatten deny entries to strings; add `resolveHooks()` for Claude Code hook format |
| `packages/cli/src/index.ts` | Register `run-hook` subcommand; clarify `--claude-dir`/`--os` descriptions |
| `packages/cli/tests/apply.test.ts` | Update deny assertions to expect strings |
| `packages/settings/overlays/network-egress.json` | Fix WebFetch deny patterns to `domain:` prefix |
| `packages/core/src/secret-patterns.ts` | 7 → 28 detectors + usage/customization comment |
| `packages/core/benchmarks/secret-patterns.bench.ts` | New throughput benchmark |
| `packages/core/tests/secret-patterns.test.ts` | +27 tests for new patterns |
| `packages/core/package.json` | Add `bench` script |
| `scripts/build-settings.mjs` | New per-OS, deterministic compiled-artifact builder |
| `package.json` | `build:settings` runs the new script |
| `packages/settings/snapshot.test.ts` | Replace vitest snapshots with artifact-equality test |
| `packages/settings/__snapshots__/snapshot.test.ts.snap` | Removed |
| `packages/settings/package.json` | Add CLI/core dev dependencies |
| `packages/settings/README.md` | Document per-OS artifacts + placeholder semantics |
| `packages/settings/compiled/*.json` | Regenerated as `<profile>.<os>.json` (9 files) |
| `.gitignore` | Ignore `history/` |
| `pnpm-lock.yaml` | Lock new dev dependencies |

---

## Verification

- `pnpm test` — **327/327 passing** (54 files).
- Live hook block confirmed: a `ghp_…` token echoed in a Bash command is intercepted by
  `secret-guard` (exit 2); secret-bearing tool *output* is intercepted by
  `secret-leak-detector` (PostToolUse).
- Audit log confirmed written: entries appear in `~/.claude/ccsec-audit.jsonl` after
  invocation.
- No session-start warnings after re-applying via
  `ccsec apply --profile baseline --force`.
- `compiled/*.json` regenerated via `pnpm build:settings`; `snapshot.test.ts` confirms the
  checked-in artifacts match the compiler.

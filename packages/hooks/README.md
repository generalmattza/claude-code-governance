# @bitsummit/ccsec-hooks

The 26 hooks shipped with `claude-code-security` (BITSUMMIT Hardening). Each hook is a small Node module declaring a manifest plus a `run(ctx)` function. The manifest is the source of truth for `docs/coverage-matrix.md` and the per-hook pages under `docs/hooks/`.

## Install

Consumed internally by `@bitsummit/ccsec-cli` and `@bitsummit/ccsec-plugin` via pnpm workspaces. End users should install the umbrella package: `npm i -g @bitsummit/claude-code-security`.

To depend on it from another workspace package:

```
"dependencies": {
  "@bitsummit/ccsec-hooks": "workspace:*"
}
```

## Hook categories

The 26 hooks span 10 categories. Full details in `docs/coverage-matrix.md`.

| Category | Hooks |
| --- | --- |
| Secrets | `secret-guard`, `secret-leak-detector`, `keychain-guard`, `mcp-secret-guard` |
| Destructive ops | `destructive-fs-guard`, `dotfile-guard` |
| Sensitive paths | `sensitive-paths-guard` |
| Bash structural | `bash-structural-guard`, `bash-egress-guard`, `pipe-to-shell-guard` |
| Branch / git guards | `branch-protection-guard`, `git-destructive-guard`, `git-history-rewrite-guard`, `commit-amend-pushed-guard`, `submodule-injection-guard` |
| Network egress | `webfetch-egress-guard` |
| Audit | `audit-session-summary`, `audit-tamper-detector` |
| Behavioral | `behavioral-rule-enforcer`, `claude-md-validator`, `untrusted-content-tagger` |
| MDM bypass | `disable-all-hooks-detector`, `local-settings-precedence-checker` |
| Agent gating | `agent-allowlist-enforcer`, `subagent-spawn-guard`, `task-tool-input-guard` |

## Adding a hook

See [`CONTRIBUTING.md`](../../CONTRIBUTING.md#adding-a-new-hook) at the repo root for the full procedure.

## Per-hook documentation

Each hook has an auto-generated page at `docs/hooks/<name>.md`. Regenerate with:

```
pnpm gen:hook-docs
```

## Tests

```
pnpm --filter @bitsummit/ccsec-hooks test
```

Each hook has a companion `<name>.test.ts` covering positive (bypass detected), negative (benign call allowed), and at least one boundary case. Test coverage is checked in CI.

## License

MIT. See the repository root [LICENSE](../../LICENSE).

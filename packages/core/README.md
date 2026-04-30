# @bitsummit/ccsec-core

Core runtime for `claude-code-security` (BITSUMMIT Hardening): hook contract types, manifest validator, path-token resolver, structural-bash parser, secret-pattern library, hash-chained JSONL audit logger, and the hook runner.

## Install

This package is consumed internally by other `@bitsummit/ccsec-*` packages via pnpm workspaces. Most users do not install it directly. To depend on it from another workspace package:

```
"dependencies": {
  "@bitsummit/ccsec-core": "workspace:*"
}
```

End users should install the umbrella package: `npm i -g @bitsummit/claude-code-security`.

## What it exports

- **Hook contract.** `Hook`, `HookManifest`, `HookContext`, `HookResult` types. Validated with `zod`.
- **Hook runner.** `runHook(manifest, ctx)` invokes a hook with timeout, profile gating, and audit-log emission.
- **Path-token resolver.** Replaces tokens like `{HOME}`, `{TMP}`, `{CLAUDE_CONFIG}` with OS-specific paths. ADR-0006 documents the per-OS template approach.
- **Structural-bash parser.** Tokenizes a Bash command into structural pieces (commands, pipes, redirects, heredocs) for hooks that need to reason about command shape rather than the literal string. See `docs/known-bypasses.md` for the documented gaps.
- **Secret patterns.** Curated regexes for known credential formats (AWS access keys, GitHub tokens, OpenAI keys, Anthropic keys, generic high-entropy strings).
- **Audit logger.** Hash-chained JSONL writer. Each entry includes the previous entry's sha256 so post-hoc tampering is detectable. Used by `audit-tamper-detector` and `verify-managed.sh`.

## Usage example

```typescript
import { runHook, type HookContext } from '@bitsummit/ccsec-core';
import secretGuard from '@bitsummit/ccsec-hooks/secret-guard';

const ctx: HookContext = {
  event: 'PreToolUse',
  tool: 'Bash',
  input: { command: 'echo $GITHUB_TOKEN' },
  profile: 'baseline',
  cwd: process.cwd(),
};

const result = await runHook(secretGuard.manifest, ctx);
// result.action: 'allow' | 'warn' | 'block' | 'log-only'
```

## Tests

```
pnpm --filter @bitsummit/ccsec-core test
```

## License

MIT. See the repository root [LICENSE](../../LICENSE).

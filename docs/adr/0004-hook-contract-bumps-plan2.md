# ADR-0004: Hook Contract Bumps for Plan 2

## Status
Accepted (2026-04-29).

## Context
Plan 2 introduces 7 hooks across categories 1-3. Three patterns surfaced that the Plan 1 contract did not support cleanly:

1. **Per-profile severity.** `git-destructive-guard` and `dotfile-guard` should warn on baseline but block on strict and regulated. Forking the hook code per profile would duplicate logic; the cleanest expression is a per-profile severity in the manifest.
2. **Matcher wildcards.** `mcp-secret-guard` needs to apply to all MCP-prefixed tools. Enumerating every MCP tool name in `matchers` is impractical and brittle.
3. **PostToolUse response field.** `secret-leak-detector` runs on PostToolUse and needs access to the tool's stdout/stderr/output. Plan 1's `HookContext` only exposes `input`.

## Decision

1. `HookManifest.severity` becomes `HookSeverity | Record<HookProfile, HookSeverity>`. The runner resolves the active profile's severity and uses it to modulate the hook's `block` decision: `block` plus profile-severity `warn` becomes outcome `warn`; `block` plus profile-severity `log` becomes `allow` (with audit record).
2. `HookManifest.matchers` array gains support for two glob-like patterns: `*` matches any tool, `<prefix>*` matches any tool starting with that prefix. A `matchesAny()` helper in `packages/core/src/matchers.ts` encapsulates the logic.
3. `HookContext` gains an optional `response` field of shape `{ stdout?: string; stderr?: string; output?: unknown; [k: string]: unknown }`. PreToolUse hooks ignore it; PostToolUse hooks read from it. The `RunInput` to the runner accepts a parallel `response` field for the caller to populate.

## Consequences
- All Plan 2 hooks compile and validate against the new contract.
- Plan 1 hooks (`secret-guard`) remain valid: scalar severity, no wildcards, ignores `response`. No breaking change.
- The `severity` resolver is a pure function in `runner.ts`; tests exercise it via the new contract-bump cases.
- Future plans can introduce additional severity tiers (e.g., per-team-policy) by extending `ProfileSeverity` rather than reworking the runner.

## Alternatives Considered
- **Always-record severity.** Rejected: forces every hook to specify three profiles even when severity is uniform. Plan 1's scalar form stays as the simple default.
- **Full glob library.** Rejected: introduces a dependency and surface area we do not need. The two-pattern wildcard is sufficient for the foreseeable hook taxonomy.
- **Separate `PostToolUseContext` type.** Rejected: forces consumers to switch on event type to pick the right context. The optional `response` field is simpler; PreToolUse hooks treat it as undefined.
- **Hook-side severity adjustment.** Rejected: would require every hook to read the active profile and decide what to return. The runner is the right place to enforce policy uniformly.

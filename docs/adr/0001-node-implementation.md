# ADR-0001: Node.js as Hook Implementation Language

## Status
Accepted (2026-04-29).

## Context
Hooks must run on macOS, Windows, and Linux. Bash hooks (default in many existing public repos) do not run natively on Windows without WSL or PowerShell rewrites. Maintaining three implementations of the same hook is unsustainable.

## Decision
All hooks are Node.js modules. Cross-platform branching lives in `packages/core/`, never in individual hooks.

## Consequences
- Single hook codebase; per-OS variation handled centrally by `path-tokens.ts` and the runner ctx.
- Node is already a Claude Code dependency, so no new install requirement.
- Bash-fluent maintainers face a learning curve; mitigated by a clear hook contract and TDD.

## Alternatives Considered
- Bash + PowerShell: rejected, dual maintenance and drift risk.
- Python: rejected, introduces a new runtime dependency.
- Rust: rejected, build complexity disproportionate.

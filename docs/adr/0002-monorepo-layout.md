# ADR-0002: pnpm Monorepo Layout

## Status
Accepted (2026-04-29).

## Context
Repo ships a CLI, hooks library, settings library, and shared core. Three distribution channels (plugin, npm, raw repo) consume them.

## Decision
pnpm workspaces monorepo. Each package publishes independently but shares `tsconfig.base.json` and `vitest.config.ts`. Source-of-truth is the monorepo; npm packages and plugin tarball are CI build outputs.

## Consequences
- One place to fix a security bug.
- Workspace `workspace:*` references make local linking immediate.
- Publishing requires careful `package.json` `files` whitelisting.

## Alternatives Considered
- Multi-repo: rejected, PR coordination overhead and drift.
- npm workspaces: rejected, pnpm has stricter peer-dep enforcement.
- Bazel/Nx: rejected, overkill for current size.

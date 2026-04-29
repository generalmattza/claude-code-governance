# Spec - Plan 9 - Release Engineering

> Date: 2026-04-29. Phase 1, Plan 9 of 10. Predecessor: `v0.8.0-rc.0`.

## Problem

`v0.8.0-rc.0` shipped feature-complete docs and the auto-gen pipeline. To reach `v1.0.0`, the project still needs the release-engineering substrate: software bill of materials, security advisory pipeline, signed-binary build templates, provenance, and a release runbook. Operators picking a hardening reference for fleet deployment ask for these artifacts before they trust the project.

## In Scope

1. SBOM generation in CI via `@cyclonedx/cyclonedx-npm`, attached to each GitHub release.
2. GHSA pipeline scaffolding: `SECURITY.md` disclosure timeline, hall of thanks placeholder, PGP key placeholder, advisory template, GitHub Security Advisories pointer.
3. `docs/release-engineering.md`: release runbook covering pre-release gates, tagging, provenance + signing requirements, post-release verification, advisory pipeline, and backport policy.
4. Node Single-Executable Application (SEA) build templates: `scripts/build-sea.sh` plus a matrix `sea-build` job in `release.yml` for macOS arm64 / macOS x64 / Linux x64 / Windows x64.
5. Provenance + signed manifest: SHA256SUMS generation across binaries; `npm publish --provenance` already wired in Plan 6.
6. GHSA template: `.github/security-advisory-template.md` and `.github/SECURITY.yml` placeholder.
7. CHANGELOG entry + tag `v0.9.0-rc.1`.

## Out of Scope (Operator-Provisioned)

Plan 9 ships infrastructure that runs once secrets are added by the maintainer:

- PGP key generation + key publishing (fingerprint placeholder in `SECURITY.md`).
- EV code-signing certificate for Windows Authenticode (`signtool`).
- Apple Developer ID certificate for macOS `codesign`.
- `NPM_TOKEN`, AC token, and any other CI secret rotation.

These are documented in `docs/release-engineering.md` as a "secrets the maintainer must provision" checklist; the workflows are written so absent secrets degrade gracefully (skip publish, skip signing) rather than fail the release.

## Acceptance

- `release.yml` runs SBOM gen and uploads `sbom.cyclonedx.json` as a release asset.
- `release.yml` runs the SEA build matrix and uploads per-platform binaries.
- `release.yml` emits `SHA256SUMS` and uploads it.
- `SECURITY.md` lists ack SLA (72h), HIGH SLA (14d), MEDIUM SLA (30d), default 90-day disclosure window, and a GHSA URL.
- `docs/release-engineering.md` exists and is the canonical runbook.
- `.github/security-advisory-template.md` and `.github/SECURITY.yml` exist.
- CHANGELOG has a `[0.9.0-rc.1] - 2026-04-29` entry.
- Tag `v0.9.0-rc.1` is pushed and the GitHub release is created (prerelease flag).
- All Plan 1-8 tests still pass (313).

## Non-Goals

- Actual signature production (requires user-provisioned keys).
- OpenSSF Scorecard integration (deferred to Plan 10 or post-`v1.0`).
- Reproducible builds verification (out of scope for `v1.0.0`).

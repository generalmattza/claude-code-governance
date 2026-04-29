# Security Policy

## Reporting a Vulnerability

Email `security@bitsummit.com` (PGP key fingerprint pending; generation tracked for Plan 9). Please do not file public GitHub issues for vulnerabilities.

We aim to acknowledge reports within 72 hours, triage within 14 days for HIGH severity, and 30 days for MEDIUM. Default disclosure window is 90 days.

## Scope

In scope: anything in `packages/`, `installers/`, or default profiles.
Out of scope: third-party hooks, downstream Claude Code itself, OS-level security.

## Security Carve-Out in SemVer

Fixes that *tighten* policy (close a bypass) ship in PATCH versions and are flagged in `CHANGELOG.md` under `### Security`.

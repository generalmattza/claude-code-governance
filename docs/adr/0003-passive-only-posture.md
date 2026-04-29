# ADR-0003: Passive-Only Enforcement Posture (v1.x)

## Status
Accepted (2026-04-29). Revisitable in v2.

## Context
Three options for enforcement posture were considered: (A) passive defaults only, (B) active monitoring daemon, (C) active monitoring + auto-remediation. The user (BITSUMMIT) chose A.

## Decision
v1.x ships *no daemons*, *no auto-remediation*, and *no SIEM coupling code*. Everything is hooks + settings + behavioral rules. Tamper detection is admin-scheduled (`ccsec verify` via cron / Intune compliance script), not always-on.

## Consequences
- Repo positions as a *reference*, not a *product* with operational dependencies.
- Onboarding overhead is minimal; security teams can audit every line.
- Detection of issue-#26637 (`disableAllHooks` bypass) is best-effort: a hook on PreToolUse warns when a local override is detected; it does not block.
- Active tier is on the public backlog; clients who ask explicitly will get a v2 conversation.

## Alternatives Considered
- Active daemon: rejected for v1, invasive without paid support agreements.
- Auto-remediation: rejected for v1, kills active dev sessions on tamper, will burn trust.

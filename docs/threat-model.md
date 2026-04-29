# Threat Model

> Status: Initial. Plan 1 covers T-001 only. T-002 to T-018 populate as their hooks ship in Plans 2-5.

## Trust Boundaries

1. User prompt to Claude Code process
2. Claude Code to tool invocations (Bash, Edit, Write, WebFetch, MCP)
3. Tool to host filesystem / network / credentials
4. Subagent and parent agent
5. Local settings and managed settings

## Threat Register (Plan 1 Coverage)

### T-001: Secret Leak via Tool Output

- **Vector:** Bash, Read tools
- **STRIDE:** Information Disclosure
- **Agentic Top 10:** A4 Sensitive Information Disclosure
- **Default mitigation:** `secret-guard` hook (PreToolUse, severity=block) detects secret literals (AWS, GitHub, Stripe, PEM, Slack, Google) and env-dump patterns (`printenv`, `env`, echo of secret-bearing variables).
- **Coverage:** baseline, strict, regulated profiles.
- **Known limitations:** custom secret formats not yet covered (extensible via `SECRET_PATTERNS` array). Secrets in stderr are caught only by Plan 4's `secret-leak-detector` (PostToolUse).

## Explicit Non-Goals

- Not a sandbox.
- Not a runtime jail.
- Not a network firewall.
- Not a remote management system.

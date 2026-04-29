# Threat Model

> Status: Plans 1-2 covered. T-001 expanded; T-002, T-003, T-004 newly documented. T-005 to T-018 populate as their hooks ship in Plans 3-5.

## Trust Boundaries

1. User prompt to Claude Code process
2. Claude Code to tool invocations (Bash, Edit, Write, WebFetch, MCP)
3. Tool to host filesystem / network / credentials
4. Subagent and parent agent
5. Local settings and managed settings

## Threat Register

### T-001: Secret Leak via Tool Output

- **Vector:** Bash, Read, MCP tools (input or output)
- **STRIDE:** Information Disclosure
- **Agentic Top 10:** A4 Sensitive Information Disclosure
- **Default mitigations:**
  - `secret-guard` (PreToolUse, block) detects secret literals in Bash command and env-dump patterns including bare `env` / `printenv`.
  - `secret-leak-detector` (PostToolUse, block) scans tool stdout/stderr/output for secret patterns. Truncates very large output to 256KB before scanning.
  - `keychain-guard` (PreToolUse, block) blocks macOS keychain CLI invocations that include value-printing flags. Existence checks pass through.
  - `mcp-secret-guard` (PreToolUse, block) scans MCP tool input payloads for secret literals.
- **Coverage:** baseline, strict, regulated profiles.
- **Known limitations:** custom secret formats not yet covered (extensible via `SECRET_PATTERNS`); base64-encoded or chunked secrets not detected (Plan 3 structural-bash work).

### T-002: Destructive Filesystem Op

- **Vector:** Bash, Edit, Write
- **STRIDE:** Tampering
- **Agentic Top 10:** A6 Excessive Agency
- **Default mitigations:**
  - `destructive-fs-guard` (PreToolUse, block) matches `rm -rf` of root or HOME, `mkfs`, `dd` writing to a device, `shred -u`.
  - `dotfile-guard` (PreToolUse, severity warn on baseline / block on strict and regulated) flags Edit/Write to shell rc files, gitconfig, ssh config. Defends against persistence (PATH injection, alias hijack).
  - Plan 1 deny patterns from `overlays/destructive.json` provide an additional layer for the same patterns.
- **Coverage:** baseline (warn for dotfile), strict, regulated.
- **Known limitations:** does not detect symlink attacks or filesystem-level race conditions. Heredoc bodies not parsed (Plan 3).

### T-003: Credential File Exfil

- **Vector:** Read, Bash
- **STRIDE:** Information Disclosure
- **Agentic Top 10:** A4 Sensitive Information Disclosure
- **Default mitigations:**
  - `sensitive-paths-guard` (PreToolUse, block) hook-side check on Read and Bash for paths matching `/.ssh/`, `/.aws/`, `/.gnupg/`, `/.kube/`, `/.docker/`, `/.netrc`, GitHub CLI hosts file, `/etc/sudoers`, `/etc/shadow`.
  - Deny patterns in `overlays/secrets.json` and `overlays/sensitive-paths.json` enforce the same boundaries at the permission layer.
- **Coverage:** baseline, strict, regulated.
- **Known limitations:** symlink-following not detected. New credential dirs (e.g., future cloud providers) require updating `SENSITIVE_PATH_FRAGMENTS`.

### T-004: Force-Push / Branch Sabotage (partial)

- **Vector:** Bash (git CLI)
- **STRIDE:** Tampering
- **Agentic Top 10:** A6 Excessive Agency
- **Default mitigations:**
  - `git-destructive-guard` (PreToolUse, severity warn on baseline / block on strict and regulated) catches `git reset --hard`, `git clean -fd`, `git push --force`, `git push -f`, `git branch -D` on protected branches, `git rebase -i`.
  - Deny patterns in `overlays/destructive.json` enforce the forced-push boundary at the permission layer.
- **Coverage:** baseline (warn), strict (block), regulated (block).
- **Known limitations:** detection relies on argument string matching; obfuscated invocations (aliases, function wrappers, env-set flags) may bypass. Comprehensive branch-guard suite is Plan 3.

## Explicit Non-Goals

- Not a sandbox.
- Not a runtime jail.
- Not a network firewall.
- Not a remote management system.

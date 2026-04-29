# ADR-0006: Jamf Configuration Profile + Per-OS Path Templates for MDM Deployment

## Status
Accepted (2026-04-29).

## Context

Plan 7 added MDM deployment for macOS fleets (Jamf Pro). Two architectural decisions had to be made:

1. **Deployment vehicle:** Configuration Profile (`.mobileconfig`) vs. PKG installer vs. Jamf script policy.
2. **Path resolution:** auto-detect the OS at install time vs. ship per-OS path templates and require the operator to pick one.

## Decision

1. Ship a **Configuration Profile template** as the primary vehicle for macOS, with `installers/macos/install-managed.sh` as a sudo-only companion that does the actual filesystem write. Reference the script from a Jamf script policy (Option B in `docs/deployment/mdm-jamf.md`) or embed the payload base64-encoded in the profile (Option A).
2. Ship **per-OS path templates** under `packages/settings/templates/`. The CLI takes a `--os` flag (`macos`, `linux`, `windows`) and a `--target` flag (`user` vs. `managed`). No auto-detection at compile time.

## Rationale

### Configuration Profile over PKG

- **Configuration Profile is the native Jamf model for managed settings.** Jamf admins already understand profile scoping, smart groups, and removal protection. A PKG would be a parallel artifact that competes with the profile model.
- **Profile signing is supported.** Configuration Profiles can be signed with a Developer ID Certificate; PKGs can too, but the signing model is different and ties this project's release process to Apple developer identity, which we want to avoid for v1.x.
- **Removal protection.** A Configuration Profile installed via Jamf can be marked non-removable by the user. A PKG that lays down a file does not have an equivalent mechanism without a daemon (which ADR-0003 forbids).
- **Inspectable.** A `.mobileconfig` is XML; a PKG is a flat archive. Security teams reviewing the artifact prefer XML.

### Companion script for the actual write

Configuration Profiles are good at delivering preferences, but the project's data model is a JSON file at `/Library/Application Support/ClaudeCode/managed-settings.json`. Profiles do not natively write arbitrary files there; they write to the preferences domain (`defaults read`).

We chose a companion script (`install-managed.sh`) that:
- runs sudo,
- compiles the chosen profile via `ccsec compile --target managed --os macos`,
- writes the file root-owned (`root:wheel`, mode `0644`),
- chflags uchg (immutable) so user-level processes cannot rewrite it,
- emits a sha256 manifest for tamper detection by `verify-managed.sh`.

The Jamf admin workflow runs the script via Jamf's script policy framework. Option A (embed base64 payload in the profile) is also documented for fleets that prefer one artifact.

### Per-OS path templates over auto-detection

- **Auto-detection at compile time is fragile.** The compile host (CI / build server) is often not the same OS as the install host. Detecting the build host's OS would produce wrong paths for cross-OS builds.
- **Shipping all three OS templates is cheap.** Three text files, ~50 lines each. The CLI picks one based on `--os`.
- **Operators benefit from explicit `--os`.** The CLI logs which template was selected; if an operator picks the wrong one, the log makes the mistake visible. Auto-detection would silently produce the wrong artifact.
- **Future OSes.** Adding a fourth OS (FreeBSD, illumos, etc.) is a template + a path token entry; no detection logic to update.

## Consequences

- `installers/macos/install-managed.sh` and `verify-managed.sh` exist; equivalents for Windows (`install-managed.ps1`, `verify-managed.ps1`) and Linux (`install-managed.sh` for systemd-style fleets) are templates pending v1.1 / v1.2 (see `installers/windows/README.md` and `installers/linux/README.md`).
- `packages/settings/templates/` holds per-OS path mappings; the CLI's path-token resolver (`packages/core/src/path-tokens.ts`) reads them.
- A Jamf admin who wants to deploy to a heterogeneous fleet (macOS + Linux laptops) compiles per OS and ships per OS. There is no "one artifact for all OSes" path.
- Tamper detection is per-OS: macOS uses `chflags uchg` + sha256 manifest; Linux will use `chattr +i` + sha256 manifest; Windows will use ACLs + Authenticode + sha256 manifest. The manifest format is shared across OSes (single line, sha256 hash + path).

## Alternatives Considered

- **PKG installer (macOS).** Rejected: parallel to Configuration Profile model, no removal protection without a daemon, signing model ties to Apple developer identity.
- **A single cross-OS installer (Node.js or Go binary).** Rejected: requires shipping a binary per OS anyway, and obscures the trivially-auditable shell script. Bash + PowerShell scripts at ~150 lines each are reviewable by security teams in 10 minutes.
- **Auto-detect OS via `uname -s` at compile time.** Rejected: cross-OS builds are common in CI; explicit `--os` is more transparent.
- **Single `.mobileconfig` that embeds the entire ccsec runtime.** Rejected: the runtime is npm-distributed (Plan 6); the MDM artifact only needs to deliver `managed-settings.json`. Bundling the runtime into the profile inflates it from kilobytes to hundreds of kilobytes and complicates updates.

## Revisit triggers

- Apple deprecates `chflags uchg` or changes the precedence of managed vs. user settings in the Claude Code harness.
- An MDM vendor (Intune, Workspace ONE, Kandji) ships a first-class JSON-file-as-managed-payload primitive that obviates the companion-script step.
- A fleet operator reports that the per-OS template approach produces wrong artifacts in their pipeline; revisit auto-detection.

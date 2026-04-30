# macOS Installer

Working installer for `claude-code-security` on macOS. Two install paths: per-user via `install.sh`, and fleet-managed via `install-managed.sh` plus the Jamf Configuration Profile.

This is the working reference for all OS installers; the Linux (`installers/linux/`) and Windows (`installers/windows/`) deliverables mirror this surface and ship as full implementations in v1.2.

## Per-user install

For an individual developer hardening their own Claude Code installation:

```
git clone https://github.com/Bitsummit-Corp/claude-code-governance.git
cd claude-code-governance
./installers/macos/install.sh --profile baseline
```

Flags:

- `--profile <name>` - one of `baseline`, `strict`, `regulated`. Default: `baseline`.
- `--claude-dir <path>` - override the Claude Code config directory. Default: `${HOME}/.claude`.
- `--dry-run` - print the resolved settings file without writing.

The script:

1. Verifies Node `>= 20.10` is on `PATH`.
2. Builds `ccsec` from source if `packages/cli/dist/index.js` is missing.
3. Compiles the selected profile to user-target paths.
4. Writes `~/.claude/settings.json` (or the path passed via `--claude-dir`).
5. Verifies the install with `ccsec doctor`.

For day-to-day use after a successful `install.sh` run, just use Claude Code normally; the hooks fire on every tool call.

## Fleet-managed install (sudo)

For an IT admin deploying `claude-code-security` across a fleet via Jamf:

```
sudo ./installers/macos/install-managed.sh --profile regulated
```

Defaults to the `regulated` profile; override with `--profile strict` or `--profile baseline` if the fleet has different needs.

The script:

1. Compiles the profile with `--target managed --os macos` so path tokens resolve to system paths.
2. Writes `managed-settings.json` to `/Library/Application Support/ClaudeCode/`.
3. Sets root ownership and mode `0644`.
4. Sets the `uchg` (user-immutable) flag via `chflags` so non-root users cannot tamper with the file.
5. Emits a sha256 manifest at `/Library/Application Support/ClaudeCode/.ccsec-manifest`.

The companion verifier `verify-managed.sh` runs hourly (via `launchd` or as a Jamf policy) and reports tamper via exit code 2. Pipe the output to your fleet's central log or Jamf inventory.

```
sudo ./installers/macos/verify-managed.sh
# exit 0: OK
# exit 1: file or manifest missing
# exit 2: hash mismatch (tamper detected)
```

## Jamf Configuration Profile

The Configuration Profile template at `installers/macos/jamf/com.bitsummit.claude-code-security.mobileconfig.xml` is the canonical Jamf artifact. It scopes:

- The `~/.claude/managed-settings.json` location for managed deployments.
- `chflags schg` (system-immutable) on the managed file.
- A scheduled `launchd` job that runs `verify-managed.sh` hourly.

Full Jamf deployment workflow with screenshots, smart group setup, and rollback procedure is in [`docs/deployment/mdm-jamf.md`](../../docs/deployment/mdm-jamf.md). Read that before deploying to production.

See also `installers/macos/jamf/README.md` for a quick reference on the profile's structure.

## Tamper detection

Two layers protect the managed install:

1. **Filesystem flags.** `chflags uchg` (user-immutable) blocks non-root edits; `chflags schg` (system-immutable, set by the Jamf profile) blocks even root edits without an explicit unflag.
2. **sha256 manifest.** `verify-managed.sh` compares the live file's hash against the manifest written at install time. Any drift trips exit code 2.

ADR-0003 (passive-only posture) explains why `verify-managed.sh` reports tamper rather than auto-remediating. The intent is that a tamper alert is investigated, not silently undone.

## Tests

```
pnpm --filter @bitsummit/ccsec-cli test     # unit tests for the compile step
bats installers/macos/tests/                # bats tests for install.sh
```

The bats suite exercises only the unprivileged `install.sh`. `install-managed.sh` and `verify-managed.sh` are sudo-only and are not covered by the unprivileged test suite; they are validated manually and via the Jamf staging fleet.

## Uninstall

Per-user:

```
rm ~/.claude/settings.json
```

Managed:

```
sudo chflags noschg /Library/Application\ Support/ClaudeCode/managed-settings.json
sudo chflags nouchg /Library/Application\ Support/ClaudeCode/managed-settings.json
sudo rm /Library/Application\ Support/ClaudeCode/managed-settings.json
sudo rm /Library/Application\ Support/ClaudeCode/.ccsec-manifest
```

For Jamf fleets, retire the Configuration Profile in Jamf rather than running the `rm` directly; Jamf will remove the file as part of the profile retirement.

## Roadmap

- v1.1: notarized SEA binary so adopters do not need to build from source.
- v1.x: per-user `launchd` agent (currently the verifier runs at the system level only).

Issues and design feedback welcome at [github.com/Bitsummit-Corp/claude-code-governance/issues](https://github.com/Bitsummit-Corp/claude-code-governance/issues).

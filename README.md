# claude-code-security

> **Status:** Beta. Hook surface is feature-complete (26 hooks, 313 tests). Distribution channels live in this release.

Open-source hardening reference for Anthropic's Claude Code. Ships hooks, layered settings templates, behavioral CLAUDE.md rules, and OS-specific installers so individual developers can harden their own installs and IT admins can deploy a vetted policy via MDM.

## Status

This repo is on a 10-plan path to `v1.0.0`. We are currently shipping **Plan 6 of 10** (plugin + npm distribution). See `docs/superpowers/plans/` for the full sequence.

## Install

### Channel 1: Claude Code Plugin (recommended for individual devs)

```
/plugin install bitsummit/hardening
/ccsec apply baseline
```

### Channel 2: npm (for CI use, non-plugin contexts)

```
npm i -g @bitsummit/claude-code-security
ccsec apply --profile baseline
```

### Channel 3: Raw repo (for MDM admins)

```
git clone https://github.com/Bitsummit-Corp/claude-code-security.git
cd claude-code-security
./installers/macos/install.sh --profile baseline
```

## Profile Chooser

| Profile | When to use |
|---|---|
| baseline | Solo dev. Mostly warns. Doesn't break flow. |
| strict | Team / shared infra. Tighter egress. Blocks dotfile + git-destructive ops. |
| regulated | Regulated environment (healthcare, legal, public sector). Tightest egress + MDM bypass detector + agent allowlist. |

## License

MIT. See [LICENSE](./LICENSE).

## Security

Report vulnerabilities to `security@bitsummit.com`. See [SECURITY.md](./SECURITY.md).

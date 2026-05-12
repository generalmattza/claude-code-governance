# @bitsummit/ccsec-settings

Layered settings (base, overlays, profiles, compiled artifacts) for `claude-code-security` (BITSUMMIT Hardening). The data model behind the three shipped profiles.

## Install

Consumed internally by `@bitsummit/ccsec-cli` via pnpm workspaces. End users do not interact with this package directly; they use `ccsec apply --profile <name>` from the umbrella package.

To depend on this package from another workspace package:

```
"dependencies": {
  "@bitsummit/ccsec-settings": "workspace:*"
}
```

## Layout

```
base.json            # required keys every profile inherits
overlays/            # composable feature overlays
  agent-gating.json
  audit.json
  bash-structural.json
  behavioral.json
  branch-guards.json
  destructive.json
  mdm-bypass.json
  network-egress.json
  secrets.json
  sensitive-paths.json
profiles/            # the three shipped profiles
  baseline.json      # solo dev; mostly warns
  strict.json        # team / shared infra; tighter egress
  regulated.json     # regulated environment; full overlays + agent allowlist
compiled/            # one file per (profile, OS): <profile>.<os>.json (9 files)
```

## How profiles compose

A profile is `base.json` + a list of overlays + per-profile overrides. The compiler walks the profile, layers the overlays in order, applies overrides, resolves path tokens for the target OS, and emits a single `settings.json`. ADR-0006 covers the per-OS path strategy.

The compiler is in `@bitsummit/ccsec-cli`; this package ships the data only.

## Adding a setting

1. Decide whether the setting belongs in `base.json` (every profile gets it) or an overlay (some profiles opt in).
2. Add the key. Document it in `docs/settings-reference.md`.
3. Update the relevant profile(s) under `profiles/` to reference the overlay if applicable.
4. Run `pnpm build:settings` from the repo root to regenerate `compiled/`.
5. Run `pnpm test` from this package; verify the diff in `compiled/` reflects the policy change you intended.

## Compiled artifacts

`compiled/<profile>.<os>.json` is checked into the repo so PR reviewers can diff the **effective deny policy** (every overlay merged, every path token resolved) directly, rather than mentally re-running the compiler over a source diff. One file per supported OS (macOS, Linux, Windows) because path separators and the resolved form of `${HOME}` / `${TMP}` differ.

Home-directory references resolve to a stable placeholder — `/Users/USER`, `/home/USER`, or `C:\Users\USER` — so artifacts are deterministic across contributors' machines. `USER` is a literal placeholder, not a real username; `ccsec apply` re-runs the compiler against the live `$HOME` / `%USERPROFILE%` at install time, so end-user `settings.json` has the actual home directory baked in.

The test in `snapshot.test.ts` verifies that the checked-in files match a fresh invocation of the compiler. If you edit an overlay without running `pnpm build:settings`, the test fails. If someone changes compiler semantics, the test fails and the diff makes the behavioral change visible in PR review.

## Tests

```
pnpm --filter @bitsummit/ccsec-settings test
```

## License

MIT. See the repository root [LICENSE](../../LICENSE).

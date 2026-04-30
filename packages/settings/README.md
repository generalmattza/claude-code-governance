# @bitsummit/ccsec-settings

Layered settings (base, overlays, profiles, compiled snapshots) for `claude-code-security` (BITSUMMIT Hardening). The data model behind the three shipped profiles.

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
compiled/            # snapshot of each profile after compilation; CI-checked
__snapshots__/       # vitest snapshot tests for the compiler output
```

## How profiles compose

A profile is `base.json` + a list of overlays + per-profile overrides. The compiler walks the profile, layers the overlays in order, applies overrides, resolves path tokens for the target OS, and emits a single `settings.json`. ADR-0006 covers the per-OS path strategy.

The compiler is in `@bitsummit/ccsec-cli`; this package ships the data only.

## Adding a setting

1. Decide whether the setting belongs in `base.json` (every profile gets it) or an overlay (some profiles opt in).
2. Add the key. Document it in `docs/settings-reference.md`.
3. Update the relevant profile(s) under `profiles/` to reference the overlay if applicable.
4. Run `pnpm test` from this package; snapshot tests will fail. Inspect the diff. If correct, update with `pnpm test -u`.
5. Run `pnpm build:settings` from the repo root to regenerate `compiled/`.

## Compiled snapshots

`compiled/<profile>.json` is checked into the repo so adopters can read what a profile resolves to without running the compiler. CI verifies these snapshots match the compiler output.

## Tests

```
pnpm --filter @bitsummit/ccsec-settings test
```

## License

MIT. See the repository root [LICENSE](../../LICENSE).
